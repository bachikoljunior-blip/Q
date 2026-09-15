import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as T from 'three';
import {Game,groundAt} from '../src/core.js';
import {combatPresentation} from '../src/combat-presentation.js';
import {renderCombatHud} from '../src/combat-hud.js';
import {CombatInputQueue} from '../src/combat-input.js';

const VIEWPORT={width:390,height:844,yaw:0,pitch:.3,zoom:9};

function cleanGame(){
  const game=new Game();game.enemies.forEach(enemy=>enemy.dead=true);game.obstacles=[];game.projectiles=[];game.lit=['haven','grove','flood','ruins'];game.events=[];
  Object.assign(game.player,{x:0,z:86,y:groundAt(0,86),angle:Math.PI,hp:120,stamina:100,invulnerable:0,attack:0,dodge:0,parry:0,healTimer:0,grounded:true,dead:false});
  return game;
}

function arm(enemy,{x,z,timer,type=enemy.type,radial=false,state='windup'}){
  Object.assign(enemy,{dead:false,type,x,z,homeX:x,homeZ:z,y:groundAt(x,z),angle:Math.atan2(-x,86-z),state,timer,windupMax:timer,cooldown:0,radial,hit:false,stagger:0});
  return enemy;
}

function threeThreatGame(){
  const game=cleanGame(),knights=game.enemies.filter(enemy=>enemy.type==='knight'),boss=game.enemies.find(enemy=>enemy.type==='boss');
  game.player.angle=0;const front=arm(knights[0],{x:0,z:88.6,timer:.1}),side=arm(knights[1],{x:2.6,z:86,timer:.11});arm(boss,{x:0,z:81,timer:.12,radial:true});
  return {game,front,side,boss};
}

function portraitProject(game){
  const {width,height,yaw,pitch,zoom}=VIEWPORT,camera=new T.PerspectiveCamera(54,width/height,.1,1100),p=game.player,d=zoom*1.12,target=new T.Vector3(p.x,p.y+1.6,p.z);
  camera.position.set(p.x+Math.sin(yaw)*Math.cos(pitch)*d,p.y+1.7+Math.sin(pitch)*d,p.z+Math.cos(yaw)*Math.cos(pitch)*d);camera.lookAt(target);camera.updateMatrixWorld();
  return position=>{const point=new T.Vector3(position.x,position.y,position.z).project(camera);return{x:(point.x*.5+.5)*width,y:(-point.y*.5+.5)*height,visible:point.z<1&&point.z>-1};};
}

function sink(){
  const attributes={},classes=new Map(),element={textContent:'',setAttribute:(key,value)=>attributes[key]=value,removeAttribute:key=>delete attributes[key],classList:{toggle:(key,value)=>classes.set(key,!!value)}};
  return {element,attributes,classes};
}

function hud(game){
  const target=sink(),controls=Object.fromEntries(['dodge','parry','jump'].map(name=>[name,sink()])),buttons=Object.fromEntries(Object.entries(controls).map(([name,target])=>[name,target.element]));
  const view=renderCombatHud(target.element,buttons,game,{cameraYaw:VIEWPORT.yaw,project:portraitProject(game),viewportWidth:VIEWPORT.width,viewportHeight:VIEWPORT.height});
  return {...target,controls,view};
}

function tick(game,frames){
  const events=[];for(let frame=0;frame<frames;frame++){game.tick(1/60);events.push(...game.events.splice(0).map(event=>({frame,...event})));}return events;
}

function followHud(game,frames=120){
  const queue=new CombatInputQueue(),events=[];let actionFrame=null,flush=null;
  for(let frame=0;frame<frames;frame++){
    const presentation=hud(game).view;
    if(actionFrame===null&&presentation.decision?.action){queue.push(presentation.decision.action);flush=queue.flush(game,presentation,{x:1,z:0});actionFrame=frame;}
    game.tick(1/60);events.push(...game.events.splice(0).map(event=>({frame,...event})));
  }
  return {actionFrame,flush,events,hp:game.player.hp};
}

test('actual portrait HUD reduces three clustered threats to one safe next action',()=>{
  const {game,front,side,boss}=threeThreatGame(),before=JSON.stringify(game.serialize()),{element,attributes,classes,controls,view}=hud(game);
  assert.equal(view.allThreats.length,3);assert.equal(view.decision.action,'dodge');assert.equal(view.decision.threatCount,3);assert.equal(view.decision.hiddenThreatCount,1);
  assert.deepEqual(view.decision.coverHazardIds,[front.id,side.id,boss.id]);assert.equal(view.primary.sourceId,side.id);assert.equal(view.primary.screenDirection,'右外');assert.equal(view.threats[1].sourceId,boss.id);
  assert.match(element.textContent,/^次：回避 · 同時3件 · 詳細外1件 · 画面外あり/);assert.doesNotMatch(element.textContent,/受け流し|跳躍|\//);
  assert.equal(attributes['data-action'],'dodge');assert.equal(attributes['data-threat-count'],'3');assert.equal(attributes['data-hidden-threat-count'],'1');assert.equal(classes.get('multi'),true);assert.equal(classes.get('offscreen'),true);
  assert.equal(controls.dodge.classes.get('recommended'),true);assert.equal(controls.dodge.attributes['aria-describedby'],'combat-hint');assert.equal(controls.parry.classes.get('recommended'),false);assert.equal(controls.jump.classes.get('recommended'),false);
  assert.equal(JSON.stringify(game.serialize()),before);
});

test('priority is stable under candidate enumeration when impact times differ',()=>{
  const first=threeThreatGame(),expected=hud(first.game).view;first.game.enemies.reverse();const reordered=hud(first.game).view;
  assert.deepEqual(reordered.allThreats.map(threat=>threat.hazardId),expected.allThreats.map(threat=>threat.hazardId));assert.equal(reordered.decision.action,expected.decision.action);
});

test('same-tick threat order follows the live enemy contact order instead of lexical IDs',()=>{
  const game=cleanGame(),wolf=game.enemies.find(enemy=>enemy.id==='enemy-2'),knight=game.enemies.find(enemy=>enemy.id==='enemy-10');
  arm(wolf,{x:-1,z:84,timer:0,type:'wolf',state:'strike'});arm(knight,{x:1,z:84,timer:0,type:'knight',state:'strike'});
  const presentation=combatPresentation(game,{limit:Infinity});assert.equal(presentation.primary.sourceId,wolf.id);assert(presentation.primary.contactOrder<presentation.threats.find(threat=>threat.sourceId===knight.id).contactOrder);
  const events=tick(game,1),hurt=events.find(event=>event.type==='hurt');assert.equal(hurt.sourceId,wolf.id);assert.equal(game.player.hp,106);
});

test('contacts guaranteed harmless during current invulnerability do not hide the next damaging enemy',()=>{
  const game=cleanGame(),knight=game.enemies.find(enemy=>enemy.type==='knight');arm(knight,{x:0,z:83.4,timer:.31});game.player.invulnerable=.3;
  game.projectiles=[2.5,3.5].map((z,index)=>({id:101+index,owner:knight.id,x:0,z:86+z,y:game.player.y+1,vx:0,vy:0,vz:-20,life:2,damage:20}));
  const presentation=combatPresentation(game,{limit:Infinity});assert.deepEqual(presentation.threats.map(threat=>threat.hazardId),[knight.id]);
  const events=tick(game,30),hurt=events.find(event=>event.type==='hurt');assert.equal(hurt.sourceId,knight.id);assert.equal(game.player.hp,98);
});

test('HUD wait state changes at the effective parry and jump windows and following it avoids damage',()=>{
  const knightGame=cleanGame(),knight=knightGame.enemies.find(enemy=>enemy.type==='knight');arm(knight,{x:0,z:83.4,timer:.85});assert.equal(hud(knightGame).view.decision.state,'wait');
  const knightRun=followHud(knightGame,80);assert(knightRun.actionFrame>=33&&knightRun.actionFrame<=35);assert.equal(knightRun.flush.selected,'parry');assert.equal(knightRun.hp,120);assert(knightRun.events.some(event=>event.type==='perfect'));
  const bossGame=cleanGame(),boss=bossGame.enemies.find(enemy=>enemy.type==='boss');arm(boss,{x:0,z:81,timer:1.35,radial:true});assert.equal(hud(bossGame).view.decision.state,'wait');
  const bossRun=followHud(bossGame,100);assert(bossRun.actionFrame>=43&&bossRun.actionFrame<=45);assert.equal(bossRun.flush.selected,'jump');assert.equal(bossRun.hp,120);assert(!bossRun.events.some(event=>event.type==='hurt'));
});

function runConflict(order,fixture=threeThreatGame){
  const {game}=fixture(),presentation=hud(game).view,queue=new CombatInputQueue();for(const action of order)queue.push(action);const flush=queue.flush(game,presentation,{x:1,z:0}),events=tick(game,30);
  return {selected:flush.selected,hp:game.player.hp,stamina:game.player.stamina,timers:{attack:game.player.attack,dodge:game.player.dodge,parry:game.player.parry},events:events.filter(event=>['swing','dodge','parry','perfect','hurt'].includes(event.type)).map(({frame,type})=>({frame,type}))};
}

test('same-frame defense conflicts are order-independent and spend only the selected action',()=>{
  for(const pair of [['attack','dodge'],['parry','dodge']]){
    const forward=runConflict(pair),reverse=runConflict([...pair].reverse());assert.deepEqual(reverse,forward);assert.equal(forward.selected,'dodge');assert.equal(forward.hp,120);assert.equal(forward.stamina,75);
  }
  const frontFixture=()=>{const game=cleanGame(),enemy=game.enemies.find(candidate=>candidate.type==='knight');arm(enemy,{x:0,z:83.4,timer:.1});return {game};};
  const forward=runConflict(['attack','parry'],frontFixture),reverse=runConflict(['parry','attack'],frontFixture);assert.deepEqual(reverse,forward);assert.equal(forward.selected,'parry');assert.equal(forward.hp,120);assert(forward.events.some(event=>event.type==='perfect'));assert(!forward.events.some(event=>event.type==='swing'));
});

test('current HUD defense replaces a stale higher-priority pending action',()=>{
  const game=cleanGame(),boss=game.enemies.find(enemy=>enemy.type==='boss');arm(boss,{x:0,z:81,timer:.1,radial:true});game.player.attack=.5;assert.equal(game.requestAction('parry'),false);assert.equal(game.pendingAction.name,'parry');
  const presentation=hud(game).view,queue=new CombatInputQueue();queue.push('jump');const result=queue.flush(game,presentation);
  assert.equal(presentation.decision.action,'jump');assert.equal(result.selected,'jump');assert.equal(result.accepted,true);assert.equal(game.pendingAction,null);assert.equal(game.player.grounded,false);
});

test('HUD does not advertise a blocked defense and exposes an unavoidable state',()=>{
  const {game}=threeThreatGame();game.player.stamina=10;let presentation=hud(game).view;assert.equal(presentation.decision.state,'unavailable');assert.equal(presentation.decision.action,null);assert.match(hud(game).element.textContent,/対応不能/);
  const other=cleanGame(),enemy=other.enemies.find(candidate=>candidate.type==='knight');arm(enemy,{x:0,z:83.4,timer:.1});other.player.attack=.4;presentation=hud(other).view;assert.equal(presentation.decision.nextAction,'dodge');assert.equal(presentation.decision.action,'dodge');
});

test('dodge consumes the current-frame direction and cleared inputs cannot fire later',()=>{
  const game=cleanGame(),queue=new CombatInputQueue(),presentation={decision:{action:'dodge'}};queue.push('dodge');const result=queue.flush(game,presentation,{x:1,z:0});assert.equal(result.selected,'dodge');assert.deepEqual(game.dodgeDir,{x:1,z:0});
  const other=cleanGame();other.player.attack=.5;queue.push('attack');queue.clear();other.clearActionBuffer();assert.equal(queue.flush(other,null).selected,null);tick(other,30);assert.equal(other.pendingAction,null);
  const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8'),conversion=main.indexOf('input.x=x*Math.cos(a)+z*Math.sin(a)'),flush=main.indexOf('combatInputs.flush(game,combatHintView,input)');assert(conversion>=0&&flush>conversion);assert.match(main,/pagehide'.+clearInput\('pagehide'\);save\(\)/);
});

test('invulnerability suppression keeps the exact boundary and distinct arrow hazard IDs',()=>{
  for(const [timer,visible]of [[.299,false],[.3,false],[.3004,true],[.301,true]]){const game=cleanGame(),enemy=game.enemies.find(candidate=>candidate.type==='knight');arm(enemy,{x:0,z:83.4,timer});game.player.invulnerable=.3;assert.equal(combatPresentation(game,{limit:Infinity}).active,visible);}
  const game=cleanGame(),owner=game.enemies.find(candidate=>candidate.type==='knight');game.projectiles=[2.5,2.8].map((z,index)=>({id:7+index,owner:owner.id,x:0,z:86+z,y:game.player.y+1,vx:0,vy:0,vz:-20,life:2,damage:20}));const threats=combatPresentation(game,{limit:Infinity}).threats;assert.deepEqual(threats.map(threat=>threat.hazardId),['arrow-7','arrow-8']);
});
