// State-aware automated pilot; no teleportation, HP changes or invincibility.
// Both routes and the opened shortcut are walked. This is NOT a rendered playtest.
import assert from 'node:assert/strict';
import { Game, distance } from '../src/core.js';
import { SALT_JOURNEY as J } from '../src/world-regions.js';
import { lineClear } from '../src/spatial.js';
import { createPilot } from './pilot.mjs';

const logs=[];
for(const route of J.routes){
  let g=new Game(),pilot=createPilot(g),elapsed=0,reloads=0,steps=0;
  const now=()=>elapsed+pilot.time;
  const reload=()=>{const saved=g.serialize(),x=g.player.x,z=g.player.z;elapsed+=pilot.time;g=new Game(saved);pilot=createPilot(g);reloads++;assert(Math.abs(g.player.x-x)<1e-7&&Math.abs(g.player.z-z)<1e-7);assert.equal(g.expedition.opened,saved.expedition.opened);};
  const step=target=>{pilot.tickToward(target);steps++;assert(!g.player.dead,`died on ${route.id}`);if(steps%787===0)reload();};
  const travel=(target,budget=130)=>{const end=now()+budget;while((distance(g.player,target)>2.8||!g.canReach(g.player,target))&&now()<end)step(target);assert(distance(g.player,target)<=2.8&&g.canReach(g.player,target),`unreachable ${route.id} ${JSON.stringify(target)} at ${JSON.stringify(g.player)}`);};
  const settle=()=>{for(let i=0;i<75;i++){g.tick(1/60);g.events=[];}elapsed+=1.25;};
  travel(J.board,170);settle();assert(g.interact(J.board));reload();
  for(const point of route.points.slice(1)){travel(point);reload();}
  const end=now()+160;
  while(g.enemies.some(e=>e.encounter===J.id&&!e.dead)&&now()<end){const foe=g.enemies.filter(e=>e.encounter===J.id&&!e.dead).sort((a,b)=>distance(a,g.player)-distance(b,g.player))[0];step(foe);}
  assert(g.enemies.filter(e=>e.encounter===J.id).every(e=>e.dead));travel(J.handle);settle();assert(g.interact(J.handle));reload();
  travel(J.winch);settle();assert(!lineClear({x:-300,z:0},{x:-266,z:0},g.obstacles));assert(g.interact(J.winch));reload();assert(lineClear({x:-300,z:0},{x:-266,z:0},g.obstacles));
  travel({x:-268,z:0});travel(J.board);settle();assert(g.interact(J.board));reload();assert(g.expedition.reported);
  const completionSeconds=now();
  if(route.id==='north'){
    const until=now()+1800,patrol=[J.winch,J.handle,...J.routes[1].points.slice(1,-1).reverse(),J.board];let next=0;
    while(now()<until){const target=patrol[next%patrol.length];step(target);if(distance(g.player,target)<3)next++;}
    assert(next>=20,'patrol stalled');assert(g.expedition.reported);assert(lineClear({x:-300,z:0},{x:-266,z:0},g.obstacles));
  }
  logs.push({route:route.id,completionSeconds:Math.round(completionSeconds),simulatedSeconds:Math.round(now()),reloads,steps,hp:Math.round(g.player.hp),reported:g.expedition.reported});
}
console.log(JSON.stringify({passed:true,renderingTested:false,routes:logs},null,2));
