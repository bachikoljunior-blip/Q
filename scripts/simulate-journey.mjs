// Automated policy reading enemy state; not a human playtest or device benchmark.
import {Game,PLACES,distance} from '../src/core.js';
import {createPilot} from './pilot.mjs';
const g=new Game(),log=[],pilot=createPilot(g),{tickToward,travel}=pilot;let failed=false;
if(!travel({x:7,z:80},40))throw Error('cannot reach keeper');g.interact();
for(const place of PLACES.filter(p=>p.type==='beacon')){
  const end=pilot.time+200;
  while(!g.lit.includes(place.id)&&pilot.time<end&&!g.player.dead){tickToward(place);if(distance(g.player,place)<4)g.interact(place);}
  log.push({place:place.id,lit:g.lit.includes(place.id),time:Math.round(pilot.time),hp:Math.round(g.player.hp),position:[g.player.x,g.player.z]});
  if(!g.lit.includes(place.id)){failed=true;break;}
  while(g.upgrade('weapon')){}
}
if(!failed){const place=PLACES[4],end=pilot.time+250;while(!g.bossDefeated&&pilot.time<end&&!g.player.dead)tickToward(place);log.push({boss:g.bossDefeated,time:Math.round(pilot.time),hp:Math.round(g.player.hp),level:g.player.level,weapon:g.player.weapon,dead:g.player.dead});if(g.bossDefeated){travel(place,30);g.interact(place);g.chooseEnding('release');}else failed=true;}
console.log(JSON.stringify({passed:!failed,seconds:Math.round(pilot.time),ending:g.ending,log},null,2));if(failed)process.exitCode=1;
