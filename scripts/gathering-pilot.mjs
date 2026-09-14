// Starts from a checkpoint earned by the calling walking journey, never a teleport fixture.
import assert from 'node:assert/strict';
import {Game,distance} from '../src/core.js';
import {GATHERINGS} from '../src/gathering-content.js';
import {gatheringAction,gatheringView} from '../src/gatherings.js';
import {createPilot} from './pilot.mjs';
export function playGathering(checkpoint,id){
  const d=GATHERINGS.find(d=>d.id===id),results=[];
  for(const choice of d.choices){
    let g=new Game(checkpoint),p=createPilot(g),seconds=0,reloads=0;
    const reload=()=>{seconds+=p.time;g=new Game(g.serialize());p=createPilot(g);reloads++;};
    const wait=s=>{for(let i=0;i<s*60;i++){g.tick(1/60);g.events.length=0;}seconds+=s;};
    const approach=t=>{assert(p.travel(t,120));const end=p.time+20;while(distance(g.player,t)>1.5&&p.time<end)p.tickToward(t);wait(2);};
    approach(g.residents.find(n=>n.id===d.actors[0].id));assert(gatheringAction(g,id,'start'));reload();approach(d);wait(25);assert(gatheringView(g,id).ready);
    assert(gatheringAction(g,id,'next'));reload();
    approach({x:d.x,z:d.z+28});assert(!gatheringView(g,id).ready);assert(!gatheringAction(g,id,'next'));reload();approach(d);wait(25);assert.equal(g.gatherings[id].beat,1);assert(gatheringView(g,id).ready);
    assert(gatheringAction(g,id,'next'));reload();const herbs=g.player.herbs,ash=g.player.ash;assert(gatheringAction(g,id,choice.id));reload();
    assert.equal(g.gatherings[id].phase,'done');assert.equal(g.player.herbs,herbs+choice.reward.herbs);assert.equal(g.player.ash,ash+choice.reward.ash);assert(!gatheringAction(g,id,choice.id));assert(!g.player.dead);
    results.push({id,choice:choice.id,seconds:Math.round(seconds+p.time),reloads,hp:Math.round(g.player.hp)});
  }
  return results;
}
