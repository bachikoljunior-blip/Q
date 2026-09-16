import test from 'node:test';
import assert from 'node:assert/strict';
import {BRIDGES,Game,groundAt} from '../src/core.js';
import {combatPresentation,forecastProjectileContact,forecastProjectileContacts} from '../src/combat-presentation.js';
import {indexObstacles} from '../src/spatial.js';

function fixture(){
  const g=new Game();g.enemies.forEach(e=>e.dead=true);g.obstacles=[];
  Object.assign(g.player,{x:0,z:86,y:groundAt(0,86),angle:Math.PI});g.events=[];
  return g;
}
function sequentialForecast(game,arrow,horizon,metrics){
  const simulated={...arrow};let elapsed=0;metrics.terrainSamples??=0;
  while(elapsed+1e-9<horizon){
    const step=Math.min(1/60,horizon-elapsed);if(simulated.life-step<=0)break;
    const contact=game.projectileContact(simulated,step,metrics);metrics.exactFrames++;
    if(contact.target)return {target:contact.target,timeToImpact:elapsed+contact.fraction*step};
    simulated.x=contact.to.x;simulated.y=contact.to.y;simulated.z=contact.to.z;simulated.life-=step;elapsed+=step;
  }
  return null;
}
test('held attack cannot cancel an accepted parry before an imminent hit',()=>{
  const g=fixture(),e=g.enemies.find(e=>e.type==='knight');
  Object.assign(e,{dead:false,x:0,z:83.4,y:groundAt(0,83.4),homeX:0,homeZ:83.4,state:'windup',timer:.1,angle:0,hit:false});
  assert.equal(g.requestAction('parry'),true);
  for(let f=0;f<20;f++){g.requestAction('attack');g.tick(1/60);}
  assert.equal(g.player.hp,120);assert(g.events.some(e=>e.type==='perfect'));
});
test('a blocked urgent arrow does not hide later unblocked arrows',()=>{
  const g=fixture();g.obstacles=[{x:-2,z:86,r:.5,height:6}];
  const arrow=(id,x,z,vx,vz)=>({id,owner:'attacker-'+id,x,z,y:g.player.y+1,vx,vy:0,vz,life:2,damage:20});
  g.projectiles=[arrow(1,-4,86,19,0),arrow(2,5,86,-19,0),arrow(3,0,92,0,-19)];
  const result=combatPresentation(g);assert.equal(result.primary.sourceId,'attacker-2');
  assert.deepEqual(result.threats.map(t=>t.sourceId),['attacker-2','attacker-3']);
  for(let i=0;i<20;i++)g.tick(1/60);
  assert(g.player.hp<120);
});
test('a near-expiry arrow still warns when it will hit on its final live step',()=>{
  const g=fixture();g.projectiles=[{id:1,owner:'attacker',x:-.8,z:86,y:g.player.y+1,vx:19,vy:0,vz:0,life:.02,damage:20}];
  assert.equal(combatPresentation(g).active,true);g.tick(1/60);assert.equal(g.player.hp,100);
  const expired=fixture();expired.projectiles=[{id:1,owner:'attacker',x:-.8,z:86,y:expired.player.y+1,vx:19,vy:0,vz:0,life:.01,damage:20}];
  assert.equal(combatPresentation(expired).active,false);expired.tick(1/60);assert.equal(expired.player.hp,120);
});

test('a 48-arrow batch preserves sequential contact results with shared static prediction',()=>{
  const g=fixture(),p=g.player,requests=Array.from({length:48},(_,index)=>({arrow:{id:index+1,owner:'attacker',x:p.x+(index%3-1)*.15,y:p.y+1,z:p.z+5+index*.03,vx:0,vy:0,vz:-20,life:2,damage:20},horizon:1.8}));
  const before=JSON.stringify(g.serialize()),sequentialMetrics={exactFrames:0},expected=requests.map(({arrow,horizon})=>sequentialForecast(g,arrow,horizon,sequentialMetrics)),batchMetrics={},actual=forecastProjectileContacts(g,requests,{metrics:batchMetrics});
  assert.deepEqual(actual,expected);assert.equal(JSON.stringify(g.serialize()),before);assert.equal(sequentialMetrics.exactFrames,569);assert.equal(batchMetrics.exactFrames,48);assert.equal(batchMetrics.fallbackFrames,0);assert.equal(batchMetrics.sharedBodies,1);assert.equal(batchMetrics.terrainSamples,sequentialMetrics.terrainSamples);assert(batchMetrics.terrainSamples<=1618);assert.equal(batchMetrics.bodySweeps,48);
  g.obstacles=[{x:p.x,z:p.z+2.5,r:.4,height:6}];const coveredExpected=requests.map(({arrow,horizon})=>sequentialForecast(g,arrow,horizon,{exactFrames:0})),coveredMetrics={},coveredActual=forecastProjectileContacts(g,requests,{metrics:coveredMetrics});
  assert.deepEqual(coveredActual,coveredExpected);assert(coveredActual.every(contact=>contact?.target==='wall'));assert.equal(coveredMetrics.sharedObstacles,1);assert.equal(coveredMetrics.fallbackFrames,0);
});

test('a tangent obstacle remains a conservative batch candidate',()=>{
  const g=fixture(),p=g.player,arrow={id:81,owner:'hostile',x:0,y:p.y+1,z:87.5,vx:0,vy:0,vz:-1,life:1.9,damage:20};
  g.obstacles=indexObstacles([{x:.48,z:87.08333343333334,r:.4,height:6}]);
  const expected=sequentialForecast(g,arrow,1.8,{exactFrames:0}),metrics={},actual=forecastProjectileContacts(g,[{arrow,horizon:1.8}],{metrics})[0];
  assert.deepEqual(actual,expected);assert.equal(actual?.target,'wall');assert(metrics.exactFrames>0);
  g.projectiles=[{...arrow}];assert.equal(combatPresentation(g,{limit:Infinity}).active,false);
  for(let frame=0;frame<120;frame++)g.tick(1/60);
  assert.equal(g.player.hp,120);assert.equal(g.projectiles.length,0);assert(g.events.some(event=>event.type==='arrowBreak'));
});


test('bridge-edge and ground-grazing warnings match live 60 Hz projectile contacts',()=>{
  const offsetsX=[-22,-21.45,-13.5,13.5,21.45,22],offsetsZ=[-2.7,-2.64,0,2.64,2.7];
  let checked=0;
  for(const bridge of BRIDGES)for(const ox of offsetsX)for(const oz of offsetsZ)for(const direction of [-1,1]){
    const g=fixture(),target={x:bridge.x+ox,z:bridge.z+oz};
    Object.assign(g.player,{x:target.x,z:target.z,y:groundAt(target.x,target.z),hp:120,invulnerable:0});
    const start={x:target.x-direction*12,z:target.z},aimY=g.player.y+1.05,startY=groundAt(start.x,start.z)+1.45;
    const dx=target.x-start.x,dy=aimY-startY,dz=target.z-start.z,length=Math.hypot(dx,dy,dz);
    const arrow={id:checked+1,owner:'terrain-audit',x:start.x,y:startY,z:start.z,vx:dx/length*19,vy:dy/length*19,vz:dz/length*19,life:2,damage:20};
    const immutable=JSON.stringify(arrow),forecast=forecastProjectileContact(g,arrow,1.8);
    assert.equal(JSON.stringify(arrow),immutable,'forecast must not mutate its input');
    g.projectiles=[{...arrow}];const warned=combatPresentation(g).active;
    let hit=false;
    for(let frame=0;frame<120&&g.projectiles.length;frame++){
      g.tick(1/60);if(g.events.some(event=>event.type==='hurt'))hit=true;g.events=[];
    }
    assert.equal(warned,hit,`bridge ${bridge.z}, offset ${ox}/${oz}, direction ${direction}, forecast ${forecast?.target==='wall'?'wall':forecast?.target?'player':'clear'}`);
    checked++;
  }
  assert.equal(checked,120);
});
