// Thirty minutes of simulation, not elapsed device play or a rendering benchmark.
// The policy reads enemy states. Health, positions and resources change only through game actions.
import assert from 'node:assert/strict';
import { Game, PLACES, KEEPER, BRIDGES, distance } from '../src/core.js';
import { SENA, SUPPLY_ID } from '../src/content.js';
import { WIND_SHRINE, WIND_BELLS, BELL_ORDER } from '../src/village.js';
import { createPilot } from './pilot.mjs';

let game=new Game(),pilot=createPilot(game),goalIndex=0,reloads=0,deaths=0,maxArrows=0,maxSaveBytes=0;
const bridge=BRIDGES[1];
const relic=game.pickups.find(p=>p.type==='relic');
const remaining=game.pickups.filter(p=>!['supplies','relic'].includes(p.type)),lootRoute=[];
let previous=PLACES[4];
while(remaining.length){remaining.sort((a,b)=>distance(a,previous)-distance(b,previous));previous=remaining.shift();lootRoute.push({kind:'pickup',id:previous.id});}
const goals=[
  {kind:'sena'},
  {kind:'walk',x:bridge.x-22,z:bridge.z},
  {kind:'walk',x:bridge.x+22,z:bridge.z},
  {kind:'pickup',id:SUPPLY_ID},
  {kind:'walk',x:bridge.x+22,z:bridge.z},
  {kind:'walk',x:bridge.x-22,z:bridge.z},
  {kind:'sena'},
  {kind:'pickup',id:relic.id},
  {kind:'keeper'},
  ...PLACES.filter(p=>p.type==='beacon'||p.type==='boss').map(p=>({kind:'place',id:p.id})),
  ...lootRoute,
  {kind:'keeper'},
  {kind:'forge-start'},
  {kind:'shrine'},
  ...BELL_ORDER.map(id=>({kind:'bell',id})),
  {kind:'forge-report'},
];
const patrol=[{x:-230,z:170},{x:-220,z:-225},{x:230,z:-230},{x:235,z:170},...PLACES];
let patrolIndex=0,goalStarted=0;
function targetFor(goal){
  if(goal.kind.startsWith('forge-'))return game.residents[0];
  if(goal.kind==='shrine')return WIND_SHRINE;
  if(goal.kind==='bell')return WIND_BELLS.find(b=>b.id===goal.id);
  if(goal.kind==='sena')return SENA;
  if(goal.kind==='keeper')return KEEPER;
  if(goal.kind==='place')return PLACES.find(p=>p.id===goal.id);
  if(goal.kind==='pickup')return game.pickups.find(p=>p.id===goal.id);
  return goal;
}
function advance(goal,target){
  if(goal.kind==='forge-start')return game.startForgeQuest();
  if(goal.kind==='forge-report')return game.reportForgeQuest();
  if(goal.kind==='shrine'||goal.kind==='bell')return game.interact(target);
  if(goal.kind==='sena'){game.interact(SENA);if(game.supplies)return game.resolveCrossing('haven');return game.startCrossingQuest();}
  if(goal.kind==='keeper'){game.interact(KEEPER);if(game.relic&&!game.relicDelivered)game.deliverRelic();return true;}
  if(goal.kind==='place'){
    game.interact(target);
    if(target.type==='boss'){if(game.bossDefeated)game.chooseEnding('release');return !!game.ending;}
    if(!game.lit.includes(target.id))return false;
    while(game.upgrade('weapon')){}
    return true;
  }
  if(goal.kind==='pickup'){game.interact(target);return target.taken;}
  return true;
}
function checkState(){
  const p=game.player;
  for(const key of ['x','y','z','hp','maxHp','stamina','energy','vertical'])assert(Number.isFinite(p[key]),key);
  assert(p.hp>=0&&p.hp<=p.maxHp);assert(p.stamina>=0&&p.stamina<=100);assert(p.energy>=0&&p.energy<=100);
  assert(p.potions>=0&&p.potions<=6);assert(p.x>=-280&&p.x<=280&&p.z>=-282&&p.z<=220);
  assert(game.projectiles.length<=48);
  for(const e of game.enemies){assert(Number.isFinite(e.x)&&Number.isFinite(e.y)&&Number.isFinite(e.z));assert(e.hp>=0&&e.hp<=e.maxHp);}
  for(const n of game.residents){assert(['x','y','z','angle'].every(k=>Number.isFinite(n[k])));assert(game.obstacles.every(o=>distance(n,o)>=o.r+.47),'resident stays outside solid scenery');}
  maxArrows=Math.max(maxArrows,game.projectiles.length);
}
function reload(){
  const text=JSON.stringify(game.serialize()),before=JSON.parse(text);maxSaveBytes=Math.max(maxSaveBytes,Buffer.byteLength(text));
  const loaded=new Game(before),after=loaded.serialize();
  assert.deepEqual(after.player,before.player,'persistent inventory and position');
  assert.deepEqual(after.runtime.player,before.runtime.player,'in-progress action and resources');
  assert.equal(after.runtime.attackHit,before.runtime.attackHit,'a hit must not repeat');
  assert.deepEqual(after.bells,before.bells,'puzzle progress and note cooldown');
  assert.deepEqual(after.runtime.residents,before.runtime.residents,'resident positions and facing');
  for(const enemy of before.runtime.enemies){
    const other=after.runtime.enemies.find(e=>e.id===enemy.id);assert(other);
    for(const key of ['hp','state','timer','cooldown','hit'])assert.equal(other[key],enemy[key],`${enemy.id} ${key}`);
    assert(distance(other,enemy)<.001,'enemy position survives reload');
  }
  assert.deepEqual(after.runtime.projectiles.map(({id,...a})=>a),before.runtime.projectiles.map(({id,...a})=>a));
  game=loaded;pilot=createPilot(game);reloads++;
}

for(let frame=0;frame<30*60*60;frame++){
  if(game.player.dead){deaths++;game.respawn();}
  const goal=goals[goalIndex],target=goal?targetFor(goal):patrol[patrolIndex%patrol.length];
  pilot.tickToward(target);
  if(!game.player.dead&&distance(game.player,target)<3){
    if(goal){if(advance(goal,target)){goalIndex++;goalStarted=frame;}}
    else{patrolIndex++;goalStarted=frame;}
  }
  // Reachability is a progression gate; do not silently skip a stranded objective.
  assert(frame-goalStarted<240*60,`stalled at ${JSON.stringify(goal||target)}: ${JSON.stringify({x:game.player.x,z:game.player.z,dead:game.player.dead})}`);
  game.events.length=0;
  if(frame%60===0)checkState();
  if(frame>0&&frame%(13*60)===0&&!game.player.dead)reload();
  if(frame>0&&frame%(5*60*60)===0)console.log(JSON.stringify({simulationMinutes:frame/3600,objectives:goalIndex,totalObjectives:goals.length,reloads,deaths}));
}
assert(game.ending==='release');assert(game.crossingChoice==='haven');assert(game.relicDelivered);assert(game.bells.reported);assert.equal(goalIndex,goals.length);
console.log(JSON.stringify({passed:true,simulationMinutes:30,fixedSteps:108000,reloads,deaths,objectives:goalIndex,patrolStops:patrolIndex,lit:game.lit.length,ending:game.ending,crossing:game.crossingChoice,loot:game.pickups.filter(p=>p.taken).length,maxArrows,maxSaveBytes,note:'No rendering, audio, touch or real-device performance measurement.'},null,2));
