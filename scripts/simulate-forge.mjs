// Walk, fight and interact normally. No HP edits, teleportation or god mode.
// The pilot reads enemy state and the test knows the clue: this is NOT a human playtest.
import assert from 'node:assert/strict';
import {Game,distance} from '../src/core.js';
import {WIND_SHRINE,WIND_BELLS,BELL_ORDER} from '../src/village.js';
import {createPilot} from './pilot.mjs';
import {playGathering} from './gathering-pilot.mjs';

let g=new Game(),pilot=createPilot(g),elapsed=0,reloads=0;
const reload=()=>{elapsed+=pilot.time;g=new Game(g.serialize());pilot=createPilot(g);reloads++;};
const idle=()=>{for(let i=0;i<120;i++){g.tick(1/60);g.events.length=0;}elapsed+=2;};
const approach=target=>{const end=pilot.time+30;while((distance(g.player,target)>=3.1||!g.canReach(g.player,target))&&pilot.time<end&&!g.player.dead)pilot.tickToward(target);return distance(g.player,target)<3.1&&g.canReach(g.player,target);};
assert(pilot.travel(g.residents[0],90),'reach Ren');idle();assert(g.startForgeQuest());
assert(pilot.travel(WIND_SHRINE,200),'walk to shrine');assert(approach(WIND_SHRINE));idle();assert(g.interact(WIND_SHRINE),'read inscription');
for(const id of BELL_ORDER){
  const b=WIND_BELLS.find(v=>v.id===id);assert(pilot.travel(b,45),`reach ${id}`);assert(approach(b),`approach ${id}`);idle();assert(g.interact(b),`ring ${id}`);reload();
}
assert(g.bells.solved);assert(pilot.travel(g.residents[0],200),'return to moving Ren');idle();
assert(distance(g.player,g.residents[0])<4.7);assert(g.reportForgeQuest());reload();
assert(g.bells.reported);assert.equal(g.dodgeCost(),21);assert(!g.player.dead);assert(!g.reportForgeQuest());
console.log(JSON.stringify({passed:true,seconds:Math.round(elapsed+pilot.time),reloads,level:g.player.level,hp:Math.round(g.player.hp),bellReward:g.bells.reported,gatherings:playGathering(g.serialize(),'hearth'),renderingTested:false},null,2));
