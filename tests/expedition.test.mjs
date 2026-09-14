import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { Game, groundAt } from '../src/core.js';
import { SALT_JOURNEY as J, SALT_TARGETS, WORLD_BOUNDS, saltObstacles } from '../src/world-regions.js';
import { restoreExpedition } from '../src/expedition.js';
import { ExpeditionScene } from '../src/expedition-scene.js';
import { lineClear, moveCircle } from '../src/spatial.js';
import { findPath } from '../src/navigation.js';

const near=(g,t)=>{Object.assign(g.player,{x:t.x,z:t.z+1,y:groundAt(t.x,t.z+1)});g.clearTransient();};
const clearGuards=g=>{for(const e of g.enemies.filter(e=>e.encounter===J.id))g.hurtEnemy(e,e.hp);};
const claimHandle=g=>{clearGuards(g);near(g,J.handle);assert(g.interact(J.handle));};
const left={x:-300,z:0},right={x:-266,z:0};

test('salt region adds stable actors without replacing valley IDs or random woodland',()=>{
  const g=new Game();assert.equal(g.enemies.length,30);assert.equal(g.pickups.length,63);assert.equal(g.trees.length,814);
  assert.deepEqual(g.enemies.slice(0,27).map(e=>e.id),Array.from({length:27},(_,i)=>`enemy-${i}`));
  assert.deepEqual(g.enemies.slice(27).map(e=>e.id),J.encounters.map(e=>e.id));
  for(const t of [...SALT_TARGETS,...J.routes.flatMap(r=>r.points)]){
    assert(Number.isFinite(groundAt(t.x,t.z)));assert(t.x>=WORLD_BOUNDS.minX);
    assert(!g.obstacles.some(o=>Math.hypot(t.x-o.x,t.z-o.z)<o.r+.48),t.id||JSON.stringify(t));
  }
  for(const route of J.routes)for(let i=1;i<route.points.length;i++)assert(findPath(route.points[i-1],route.points[i],g.obstacles).length,route.id);
});
test('expedition interactions require real identity, proximity, idle hands and safety',()=>{
  const g=new Game();assert(!g.interact({...J.board,x:g.player.x,z:g.player.z}));
  near(g,J.board);assert(!g.interact({...J.board,id:'fake'}));
  for(const key of ['attack','healTimer','dodge','parry']){g.player[key]=.2;assert(!g.interact(J.board),key);g.player[key]=0;}
  g.player.grounded=false;assert(!g.interact(J.board));g.player.grounded=true;
  const wall={x:J.board.x,z:J.board.z+.5,r:.2,height:3};g.obstacles.push(wall);assert(!g.interact(J.board));g.obstacles.pop();
  g.projectiles.push({owner:'salt-archer',x:g.player.x,z:g.player.z,life:1});assert(!g.interact(J.board));g.projectiles=[];
  assert(g.interact(J.board));assert(g.expedition.started);assert.equal(g.trackedQuest,'expedition');
  near(g,J.winch);assert(!g.interact(J.winch));near(g,J.handle);assert(!g.interact(J.handle));
});
test('handle, gate collision and one-time return reward survive every stage reload',()=>{
  let g=new Game();near(g,J.board);g.interact(J.board);g=new Game(g.serialize());
  assert(!lineClear(left,right,g.obstacles));claimHandle(g);g=new Game(g.serialize());
  assert(g.expedition.handle);assert(!lineClear(left,right,g.obstacles));
  near(g,J.winch);assert(g.interact(J.winch));assert(lineClear(left,right,g.obstacles));
  const walker={...left};moveCircle(walker,34,0,g.obstacles);assert(Math.abs(walker.x-right.x)<1e-8);
  g=new Game(g.serialize());assert(lineClear(left,right,g.obstacles));assert(g.expedition.opened);
  near(g,J.board);const ash=g.player.ash,herbs=g.player.herbs;assert(g.interact(J.board));assert(g.expedition.reported);
  assert.equal(g.player.ash,ash+J.reward.ash);assert.equal(g.player.herbs,herbs+J.reward.herbs);
  g=new Game(g.serialize());near(g,J.board);g.interact(J.board);assert.equal(g.player.ash,ash+J.reward.ash);assert(!g.trackQuest('expedition'));
});
test('legacy saves close the gate and malformed stages cannot open it without a handle',()=>{
  assert.deepEqual(restoreExpedition({opened:true,reported:true}),{visited:false,started:false,handle:false,opened:false,reported:false});
  assert(!restoreExpedition({handle:'true',opened:true}).opened);
  const g=new Game(),legacy=g.serialize();delete legacy.expedition;claimHandle(g);near(g,J.winch);g.interact(J.winch);
  assert(lineClear(left,right,g.obstacles));assert(g.restore(legacy));assert(!lineClear(left,right,g.obstacles));
  assert.equal(g.obstacles.filter(o=>o.id===J.gate.id).length,1);
  assert(g.restore(legacy));assert.equal(g.obstacles.filter(o=>o.id===J.gate.id).length,1);
});
test('western coordinates, aimed shots and live arrows remain valid through save restoration',()=>{
  const g=new Game();near(g,J.handle);const e=g.enemies.find(e=>e.id==='salt-archer');
  e.state='windup';e.timer=.7;e.aim={x:g.player.x,y:g.player.y+1,z:g.player.z};
  g.projectiles=[{id:1,owner:e.id,x:e.x,y:e.y+1,z:e.z,vx:-8,vy:0,vz:4,life:1,damage:20}];
  const copy=new Game(g.serialize()),restored=copy.enemies.find(v=>v.id===e.id);
  assert.equal(copy.player.x,g.player.x);assert.equal(restored.x,e.x);assert.deepEqual(restored.aim,e.aim);assert.equal(restored.state,'windup');
  assert.equal(copy.projectiles.length,1);assert.equal(copy.projectiles[0].x,e.x);
  const bad=g.serialize();bad.player.x=-1e9;assert.equal(new Game(bad).player.x,WORLD_BOUNDS.minX);
});
test('discovery records once and scene gate state matches the shared collision data',()=>{
  const g=new Game();near(g,J.winch);g.tick(1/60);assert(g.expedition.visited);assert.equal(g.events.filter(e=>e.type==='discover').length,1);
  g.events=[];g.tick(1/60);assert(!g.events.some(e=>e.type==='discover'));
  const scene=new ExpeditionScene(new T.Scene(),groundAt);scene.update(g);
  assert.equal(scene.solids.size,saltObstacles().length);assert(scene.solids.get(J.gate.id).visible);
  for(const o of saltObstacles()){const node=scene.solids.get(o.id);assert.equal(node.position.x,o.x);assert.equal(node.position.z,o.z);assert.equal(node.geometry.parameters.radiusBottom,o.r);}
  claimHandle(g);near(g,J.winch);g.interact(J.winch);scene.update(g);assert(!scene.solids.get(J.gate.id).visible);assert(!scene.handle.visible);
});
