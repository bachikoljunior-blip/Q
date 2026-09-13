import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, KEEPER, PLACES, heightAt, distance } from '../src/core.js';
import { cameraFraction, moveCircle, segmentCircle, lineClear } from '../src/spatial.js';
import { findPath } from '../src/navigation.js';
const step=(g,t,input={})=>{for(let i=0;i<Math.round(t*60);i++)g.tick(1/60,input);};
const quiet=()=>{const g=new Game();g.enemies.forEach(e=>e.dead=true);g.obstacles=[];return g;};

test('a tap near recovery end buffers exactly one follow-up; early taps expire',()=>{
  const g=quiet();g.attack();step(g,.32);g.requestAction('attack');assert(g.pendingAction);step(g,.2);
  assert.equal(g.player.combo,1);assert.equal(g.pendingAction,null);assert(g.player.attack>0);step(g,.6);assert.equal(g.player.attack,0);
  const h=quiet();h.attack();h.requestAction('attack');step(h,.7);assert.equal(h.player.combo,0);assert.equal(h.player.attack,0);
});
test('defensive buffering wins over held attack and clears on interruption',()=>{
  const g=quiet();g.dodge();step(g,.3);g.requestAction('parry');g.requestAction('attack');assert.equal(g.pendingAction.name,'parry');step(g,.15);
  assert(g.player.parry>0);assert.equal(g.player.attack,0);g.requestAction('parry');g.clearActionBuffer();assert.equal(g.pendingAction,null);
});
test('locked target controls the first hit even with a closer enemy behind',()=>{
  const g=quiet(),[front,back]=g.enemies;
  Object.assign(front,{dead:false,x:0,z:104,y:heightAt(0,104),hp:100,state:'recover',timer:5});
  Object.assign(back,{dead:false,x:0,z:99,y:heightAt(0,99),hp:100,state:'recover',timer:5});
  g.locked=front.id;g.attack();step(g,.23,{x:1});assert.equal(front.hp,74);assert.equal(back.hp,100);
});
test('melee and residual flame cannot damage through a solid wall',()=>{
  const g=quiet(),e=g.enemies[0];Object.assign(e,{dead:false,x:0,z:104,y:heightAt(0,104),hp:100,state:'recover',timer:5});
  g.obstacles=[{x:0,z:102.5,r:.65,type:'pillar'}];g.player.angle=0;g.attack();step(g,.25);g.skill();assert.equal(e.hp,100);
  Object.assign(e,{state:'strike',timer:.2,hit:false,angle:Math.PI});g.tickEnemy(e,.02);assert.equal(g.player.hp,120);
});
test('sealed boss cannot be killed by attacking before opening the gate',()=>{
  const g=new Game(),boss=g.enemies.find(e=>e.type==='boss');g.hurtEnemy(boss,10000);assert.equal(boss.hp,640);assert.equal(g.bossDefeated,false);
});
test('interactions validate canonical identity, distance and visibility',()=>{
  const g=quiet(),item=g.pickups.find(l=>l.type==='chest');assert.equal(g.interact(item),false);assert.equal(item.taken,false);
  assert.equal(g.interact({id:'fake',type:'camp',x:g.player.x,z:g.player.z}),false);assert.deepEqual(g.lit,['haven']);
  g.player.x=KEEPER.x;g.player.z=KEEPER.z+2;g.obstacles=[{x:KEEPER.x,z:KEEPER.z+1,r:.5}];assert.equal(g.interact(KEEPER),false);assert.equal(g.talked,false);
});
test('resting requires safety and retains potions already crafted',()=>{
  const g=quiet(),p=PLACES[0],e=g.enemies[0];g.player.x=p.x;g.player.z=p.z;g.player.hp=25;g.player.potions=6;
  Object.assign(e,{dead:false,x:p.x+10,z:p.z});g.interact(p);assert.equal(g.player.hp,25);
  e.dead=true;g.interact(p);assert.equal(g.player.hp,120);assert.equal(g.player.potions,6);
});
test('travel and respawn clear airborne, defensive and queued state',()=>{
  const g=quiet();g.lit.push('grove');g.jump();g.dodge(1,0);g.player.parry=.4;g.requestAction('attack');assert(g.fastTravel('grove'));
  assert(g.player.grounded);assert.equal(g.player.vertical,0);assert.equal(g.player.dodge,0);assert.equal(g.player.parry,0);assert.equal(g.pendingAction,null);
  assert.equal(g.player.y,heightAt(g.player.x,g.player.z));g.player.dead=true;assert.equal(g.fastTravel('haven'),false);g.player.parry=.4;g.respawn();assert.equal(g.player.parry,0);
});
test('a threatened destination blocks fast travel from a safe origin',()=>{
  const g=quiet();g.lit.push('grove');const e=g.enemies[0];Object.assign(e,{dead:false,x:PLACES[1].x+9,z:PLACES[1].z});assert.equal(g.fastTravel('grove'),false);
});
test('relic is delivered near Mira, rewards once and remains delivered after reload',()=>{
  const g=quiet(),item=g.pickups.find(l=>l.type==='relic');g.player.x=item.x;g.player.z=item.z;g.interact(item);
  assert(g.relic);assert.equal(g.relicDelivered,false);assert.equal(g.deliverRelic(),false);
  g.player.x=KEEPER.x;g.player.z=KEEPER.z;const ash=g.player.ash;assert(g.deliverRelic());assert.equal(g.player.ash,ash+80);assert.equal(g.deliverRelic(),false);
  const h=new Game(g.serialize());assert(h.relicDelivered);assert.equal(h.deliverRelic(),false);
});
test('enemy circles a building without entering it or striking through it',()=>{
  const g=quiet(),e=g.enemies[1],wall={x:0,z:95,r:2,type:'house'};
  g.obstacles=[wall];Object.assign(e,{dead:false,x:0,z:89,homeX:0,homeZ:89,state:'idle',timer:0,cooldown:0});
  for(let i=0;i<600;i++){g.tick(1/60);assert(distance(e,wall)>=2.479);}
  assert(distance(e,g.player)<4,'enemy should navigate around the obstacle to the player');
});
test('fast movement is swept in substeps and does not tunnel through a small rock',()=>{
  const actor={x:-3,z:0},rock={x:0,z:0,r:.3};moveCircle(actor,8,0,[rock]);assert(actor.x<0);assert(distance(actor,rock)>=.779);
});
test('camera probes shorten at a wall or ridge, and clear space retains full distance',()=>{
  const target={x:0,y:2,z:0},desired={x:0,y:3,z:10},wall={x:0,z:5,r:1,height:6};
  assert(segmentCircle(target,desired,wall)===.4);assert(cameraFraction(target,desired,[wall],()=>0)<.4);
  assert.equal(cameraFraction(target,desired,[],()=>0),1);assert(cameraFraction(target,desired,[],(x,z)=>z>4&&z<6?5:0)<.5);
  assert.equal(cameraFraction({...target,y:10},{...desired,y:10},[wall],()=>0),1);
});

test('a full-valley route leaves the crown enclosure and reaches the opposite world edge',()=>{
  const g=new Game(),start=PLACES[4],goal={x:-230,z:170},path=findPath(start,goal,g.obstacles);
  assert(path.length>0,'bounded search must find this reachable long route');assert.deepEqual(path.at(-1),goal);
  let previous=start;for(const point of path){assert(lineClear(previous,point,g.obstacles,.48));previous=point;}
});
