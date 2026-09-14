// Deterministic production-bridge replays. Three projection and the actual HUD
// and input arbiter run here; WebGL pixels, browser events and hardware do not.
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import * as T from 'three';
import {Game,heightAt,groundAt} from '../src/core.js';
import {renderCombatHud} from '../src/combat-hud.js';
import {CombatInputQueue} from '../src/combat-input.js';

const viewport={width:390,height:844,cameraYaw:0,pitch:.3,zoom:9,pointerType:'touch'};
const fixturePatches={
  'three-threat':{player:{x:0,z:86,angle:0,hp:120,stamina:100},enemies:[{id:'enemy-1',x:0,z:88.6,timer:.1},{id:'enemy-4',x:2.6,z:86,timer:.11},{id:'enemy-23',x:0,z:81,timer:.12,radial:true}]},
  'front-threat':{player:{x:0,z:86,angle:0,hp:120,stamina:100},enemies:[{id:'enemy-1',x:0,z:88.6,timer:.1}]},
};

function clean(game){game.enemies.forEach(enemy=>enemy.dead=true);game.projectiles=[];game.events=[];game.lit=['haven','grove','flood','ruins'];return game;}
function arm(enemy,{x,z,timer,radial=false}){Object.assign(enemy,{dead:false,x,z,homeX:x,homeZ:z,y:groundAt(x,z),angle:Math.atan2(-x,86-z),state:'windup',timer,windupMax:timer,cooldown:0,radial,hit:false,stagger:0});return enemy;}
function initialState(type,radial=false){
  const game=clean(new Game()),enemy=game.enemies.find(candidate=>candidate.type===type),range=radial?5:type==='wolf'?1.9:2.6;
  Object.assign(game.player,{x:enemy.homeX,z:enemy.homeZ+range,y:heightAt(enemy.homeX,enemy.homeZ+range),angle:Math.PI,hp:120,stamina:100,dead:false});
  Object.assign(enemy,{dead:false,x:enemy.homeX,z:enemy.homeZ,y:heightAt(enemy.homeX,enemy.homeZ),angle:0,state:'windup',timer:radial?1.35:type==='wolf'?.62:.85,windupMax:radial?1.35:type==='wolf'?.62:.85,cooldown:0,radial,hit:false});
  return game.serialize();
}
function multipleState(){
  const game=clean(new Game()),knights=game.enemies.filter(enemy=>enemy.type==='knight'),boss=game.enemies.find(enemy=>enemy.type==='boss');game.obstacles=[];
  Object.assign(game.player,{x:0,z:86,y:groundAt(0,86),angle:0,hp:120,stamina:100,dead:false});arm(knights[0],{x:0,z:88.6,timer:.1});arm(knights[1],{x:2.6,z:86,timer:.11});arm(boss,{x:0,z:81,timer:.12,radial:true});
  return game.serialize();
}
function frontState(){
  const game=clean(new Game()),enemy=game.enemies.find(candidate=>candidate.type==='knight');game.obstacles=[];Object.assign(game.player,{x:0,z:86,y:groundAt(0,86),angle:0,hp:120,stamina:100,dead:false});arm(enemy,{x:0,z:88.6,timer:.1});return game.serialize();
}
function applyFixture(game,id){
  if(!id)return;const fixture=fixturePatches[id];assert(fixture,`Unknown combat fixture ${id}`);game.enemies.forEach(enemy=>enemy.dead=true);game.obstacles=[];game.projectiles=[];game.events=[];game.lit=['haven','grove','flood','ruins'];Object.assign(game.player,{...fixture.player,y:groundAt(fixture.player.x,fixture.player.z),dead:false,invulnerable:0,attack:0,dodge:0,parry:0,healTimer:0,grounded:true});
  for(const definition of fixture.enemies){const enemy=game.enemies.find(candidate=>candidate.id===definition.id);assert(enemy);arm(enemy,definition);}
}

function project(game){
  const {width,height,cameraYaw:yaw,pitch,zoom}=viewport,p=game.player,d=zoom*1.12,camera=new T.PerspectiveCamera(54,width/height,.1,1100),target=new T.Vector3(p.x,p.y+1.6,p.z);
  camera.position.set(p.x+Math.sin(yaw)*Math.cos(pitch)*d,p.y+1.7+Math.sin(pitch)*d,p.z+Math.cos(yaw)*Math.cos(pitch)*d);camera.lookAt(target);camera.updateMatrixWorld();
  return position=>{const point=new T.Vector3(position.x,position.y,position.z).project(camera);return{x:(point.x*.5+.5)*width,y:(-point.y*.5+.5)*height,visible:point.z<1&&point.z>-1};};
}
function node(){const attributes={},classes=new Map();return {attributes,classes,element:{textContent:'',setAttribute:(key,value)=>attributes[key]=value,removeAttribute:key=>delete attributes[key],classList:{toggle:(key,value)=>classes.set(key,!!value)}}};}
function bridge(game){
  const hint=node(),controls=Object.fromEntries(['dodge','parry','jump'].map(name=>[name,node()])),presentation=renderCombatHud(hint.element,Object.fromEntries(Object.entries(controls).map(([name,target])=>[name,target.element])),game,{cameraYaw:viewport.cameraYaw,project:project(game),viewportWidth:viewport.width,viewportHeight:viewport.height});
  return {presentation,text:hint.element.textContent,attributes:hint.attributes,highlighted:Object.entries(controls).filter(([,target])=>target.classes.get('recommended')).map(([name])=>name)};
}

function run(initial,{actions=[],followHud=false,frames=100,fixture=null}={}){
  const game=new Game(initial);applyFixture(game,fixture);const queue=new CombatInputQueue(),samples=[],events=[];let lastKey='',followed=false;
  for(let frame=0;frame<frames;frame++){
    const hud=bridge(game),scheduled=actions.filter(action=>action.frame===frame),intents=[];
    for(const action of scheduled){queue.push(action.name);intents.push({name:action.name,channel:action.channel||'touch'});}
    if(followHud&&!followed&&hud.presentation.decision?.action){queue.push(hud.presentation.decision.action);intents.push({name:hud.presentation.decision.action,channel:'hud-follow'});followed=true;}
    const result=queue.flush(game,hud.presentation,scheduled.at(-1)?.direction||{x:1,z:0});
    if(intents.length)events.push({frame,type:'input',intents,selected:result.selected,accepted:result.accepted,buffered:result.buffered});
    const key=JSON.stringify({ids:hud.presentation.allThreats.map(threat=>[threat.hazardId,threat.impactFrame,threat.screenDirection]),decision:hud.presentation.decision,text:hud.text,highlighted:hud.highlighted});
    if(key!==lastKey||frame%6===0)samples.push({frame,seconds:Math.round(frame/60*1000)/1000,text:hud.text,action:hud.attributes['data-action']||null,nextAction:hud.attributes['data-next-action']||null,threatCount:Number(hud.attributes['data-threat-count']||0),hiddenThreatCount:Number(hud.attributes['data-hidden-threat-count']||0),highlighted:hud.highlighted,threats:hud.presentation.allThreats.map(threat=>({hazardId:threat.hazardId,sourceId:threat.sourceId,impactFrame:threat.impactFrame,direction:threat.screenDirection}))});
    lastKey=key;game.tick(1/60);
    for(const event of game.events.splice(0))if(['enemySwing','hurt','perfect','death','dodge','parry'].includes(event.type))events.push({frame,type:event.type,amount:event.amount??null,id:event.id??null,sourceId:event.sourceId??null});
  }
  return {frames,samples,events,outcome:{playerHp:Math.round(game.player.hp),playerDead:game.player.dead,stamina:Math.round(game.player.stamina*1000)/1000,pendingAction:game.pendingAction?.name||null,activeEnemies:game.enemies.filter(enemy=>!enemy.dead).map(enemy=>({id:enemy.id,type:enemy.type,state:enemy.state,hp:Math.round(enemy.hp)}))}};
}

export function buildCombatReview(){
  const definitions=[
    {id:'knight-no-response',initial:initialState('knight')},
    {id:'knight-dodge',initial:initialState('knight'),actions:[{frame:42,name:'dodge',channel:'touch',direction:{x:1,z:0}}]},
    {id:'knight-parry',initial:initialState('knight'),actions:[{frame:42,name:'parry',channel:'keyboard'}]},
    {id:'boss-grounded',initial:initialState('boss',true),frames:110},
    {id:'boss-jump',initial:initialState('boss',true),actions:[{frame:60,name:'jump',channel:'gamepad'}],frames:110},
    {id:'three-threat-no-response',initial:multipleState(),fixture:'three-threat',frames:40},
    {id:'three-threat-follow-hud',initial:multipleState(),fixture:'three-threat',followHud:true,frames:40},
    {id:'same-frame-attack-parry-touch-first',initial:frontState(),fixture:'front-threat',actions:[{frame:0,name:'attack',channel:'touch'},{frame:0,name:'parry',channel:'keyboard'}],frames:30},
    {id:'same-frame-attack-parry-keyboard-first',initial:frontState(),fixture:'front-threat',actions:[{frame:0,name:'parry',channel:'keyboard'},{frame:0,name:'attack',channel:'touch'}],frames:30},
  ];
  const scenarios=definitions.map(({id,initial,...plan})=>({id,initial,plan,run:run(initial,plan)}));
  assert(scenarios[0].run.outcome.playerHp<120);assert.equal(scenarios[1].run.outcome.playerHp,120);assert.equal(scenarios[2].run.outcome.playerHp,120);assert(scenarios[2].run.events.some(event=>event.type==='perfect'));
  assert(scenarios[3].run.outcome.playerHp<120);assert.equal(scenarios[4].run.outcome.playerHp,120);assert.equal(scenarios[5].run.outcome.playerHp,98);assert.equal(scenarios[6].run.outcome.playerHp,120);assert.equal(scenarios[6].run.events.find(event=>event.type==='input').selected,'dodge');
  for(const scenario of scenarios){assert.deepEqual(run(scenario.initial,scenario.plan),scenario.run);assert(scenario.run.samples.some(sample=>sample.threats.length));}
  const inputPair=scenarios.slice(7);assert.deepEqual(inputPair.map(scenario=>scenario.run.outcome.playerHp),[120,120]);assert.deepEqual(inputPair.map(scenario=>scenario.run.events.find(event=>event.type==='input').selected),['parry','parry']);assert.deepEqual(inputPair[0].run.events.filter(event=>event.type!=='input'),inputPair[1].run.events.filter(event=>event.type!=='input'));
  return {formatVersion:2,gameVersion:'0.17.0',fixedStepHz:60,viewport,fixturePatches,note:'Deterministic Game ticks, explicit laboratory fixture patches, Three clip projection, production HUD bridge and cross-channel input arbitration. No WebGL pixels, browser event dispatch, audio, physical touch device, iOS/Android performance or external player-quality observation.',scenarios};
}

if(process.argv[1]&&import.meta.url===new URL(process.argv[1],'file:').href){
  const review=buildCombatReview(),root=new URL('../release/combat-replays/',import.meta.url);mkdirSync(root,{recursive:true});writeFileSync(new URL('combat-readability.json',root),JSON.stringify(review,null,2)+'\n');
  console.log(JSON.stringify({passed:true,formatVersion:review.formatVersion,scenarios:review.scenarios.map(scenario=>({id:scenario.id,hp:scenario.run.outcome.playerHp,events:scenario.run.events.length,samples:scenario.run.samples.length})),note:review.note},null,2));
}
