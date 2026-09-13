import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, KEEPER, groundAt, random, distance } from '../src/core.js';
import { SENA } from '../src/content.js';
import { indexObstacles, queryObstacles, lineClear, cameraFraction, moveCircle, segmentCircle } from '../src/spatial.js';

test('every rendered tree has a matching solid trunk and keeps people and loot reachable',()=>{
  const g=new Game();assert(g.trees.length>500);
  const trunks=g.obstacles.filter(o=>o.type==='tree');assert.equal(trunks.length,g.trees.length);
  for(const tree of g.trees){
    const solid=trunks.find(o=>o.id===tree.id);assert.equal(solid.x,tree.x);assert.equal(solid.z,tree.z);assert.equal(solid.height,tree.h*.76);
    for(const npc of [KEEPER,SENA])assert(distance(tree,npc)>=10);
    for(const item of g.pickups)assert(distance(tree,item)>=1.8);
  }
  const tree=g.trees.find(t=>t.x>15&&t.x<150&&t.z>30);assert(tree);
  const p={x:tree.x-2,z:tree.z};moveCircle(p,4,0,indexObstacles([trunks.find(o=>o.id===tree.id)]));
  assert(p.x<tree.x);assert(distance(p,tree)>=.719);
});

test('spatial cells do not miss obstacles at negative coordinates, borders or inside large radii',()=>{
  const obstacles=indexObstacles([{x:-16,z:0,r:2,height:4},{x:32,z:16,r:20,height:8},{x:0,z:-32,r:.24,height:5}]);
  assert(queryObstacles(obstacles,-18.1,-.1,-17.9,.1).includes(obstacles[0]));
  assert(queryObstacles(obstacles,12,16).includes(obstacles[1]));
  assert(queryObstacles(obstacles,0,-32).includes(obstacles[2]));
  obstacles.push({x:200,z:200,r:1,height:3});assert(queryObstacles(obstacles,200,200).includes(obstacles[3]));
});

test('indexed ray and camera results match a full scan across the valley',()=>{
  const g=new Game(),plain=[...g.obstacles],rng=random(889);
  for(let i=0;i<220;i++){
    const a={x:(rng()-.5)*540,z:210-rng()*490},b={x:a.x+(rng()-.5)*40,z:a.z+(rng()-.5)*40};
    a.y=groundAt(a.x,a.z)+2;b.y=groundAt(b.x,b.z)+7;
    assert.equal(lineClear(a,b,g.obstacles,.55),!plain.some(o=>segmentCircle(a,b,o,.55)!==null));
    assert.equal(cameraFraction(a,b,g.obstacles,groundAt),cameraFraction(a,b,plain,groundAt));
  }
});
