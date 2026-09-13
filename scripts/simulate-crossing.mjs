// Real simulation actions and walking, with a policy that can read enemy state.
// This verifies progression, not rendering, touch controls, difficulty or fun.
import assert from 'node:assert/strict';
import {Game,BRIDGES,distance} from '../src/core.js';
import {SENA,SUPPLY_ID} from '../src/content.js';
import {createPilot} from './pilot.mjs';

const results=[];
for(const choice of ['haven','road']){
  const g=new Game(),pilot=createPilot(g),bridge=BRIDGES[1];
  assert(pilot.travel(SENA,150),'must reach Sena from a fresh game');g.interact(SENA);assert(g.startCrossingQuest());assert(g.equipWeapon('spear'));
  for(const point of [{x:bridge.x-22,z:bridge.z},{x:bridge.x+22,z:bridge.z}])assert(pilot.travel(point,90),'must walk across the bridge');
  const crate=g.pickups.find(l=>l.id===SUPPLY_ID),end=pilot.time+150;
  while(!g.supplies&&pilot.time<end&&!g.player.dead){pilot.tickToward(crate);if(distance(g.player,crate)<3)g.interact(crate);}
  assert(g.supplies,'camp must be defeated and supplies collected');
  for(const point of [{x:bridge.x+22,z:bridge.z},{x:bridge.x-22,z:bridge.z},SENA])assert(pilot.travel(point,90),'must bring supplies back on foot');
  assert(g.resolveCrossing(choice));const loaded=new Game(g.serialize());assert.equal(loaded.crossingChoice,choice);assert.equal(loaded.player.weaponType,'spear');
  results.push({choice,seconds:Math.round(pilot.time),level:g.player.level,hp:Math.round(g.player.hp),potions:g.player.potions,campDefeated:g.enemies.filter(e=>e.encounter==='crossing'&&e.dead).length});
}
console.log(JSON.stringify({passed:true,results},null,2));
