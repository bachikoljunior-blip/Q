// Automated policy reading enemy state; not a human playtest or device benchmark.
import {Game,PLACES,distance} from '../src/core.js';
import {findPath} from '../src/navigation.js';
import {lineClear} from '../src/spatial.js';
const navigation={path:[],goal:null};
const g=new Game(),log=[];let failed=false,t=0;
function tickToward(goal,combat=true){
  const p=g.player;
  const foes=g.enemies.filter(e=>!e.dead&&e.state!=='sealed'&&distance(e,p)<17).sort((a,b)=>distance(a,p)-distance(b,p));
  let aim=goal,away=false;
  if(combat&&foes.length){const e=foes[0],d=distance(p,e);g.locked=e.id;aim=e;
    if(p.hp<p.maxHp*.48)g.heal();
    if(p.energy>=40&&d<7&&(foes.length>1||e.type==='boss'))g.skill();
    const threat=foes.find(e=>e.state==='windup'&&e.timer<.23&&distance(e,p)<(e.radial?9:e.type==='boss'?7:4));
    if(threat){if(threat.radial)g.jump();else if(!g.parry()&&threat.timer<.08)g.dodge(p.x-threat.x,p.z-threat.z);}
    if(d<3.1&&p.stamina>30&&!threat)g.attack();
    if(p.stamina<28){away=true;}
    else if(d<2.5)aim={x:p.x,z:p.z};
  }else g.locked=null;
  let x=aim.x-p.x,z=aim.z-p.z,d=Math.hypot(x,z);if(d>.1){x/=d;z/=d;}else{x=z=0;}
  if(away){x=-x;z=-z;}
  if(!away&&distance(p,aim)>1&&!lineClear(p,aim,g.obstacles,.56)){
    if(!navigation.path.length||!navigation.goal||distance(aim,navigation.goal)>3){navigation.path=findPath(p,aim,g.obstacles);navigation.goal={x:aim.x,z:aim.z};}
    while(navigation.path.length&&distance(p,navigation.path[0])<.5)navigation.path.shift();
    const node=navigation.path[0];if(node){const length=distance(p,node);x=(node.x-p.x)/length;z=(node.z-p.z)/length;}
  }else navigation.path=[];
  g.tick(1/60,{x,z});t+=1/60;
  g.events.length=0;
}
function travel(goal,seconds){const end=t+seconds;while(distance(g.player,goal)>3&&t<end&&!g.player.dead)tickToward(goal);return distance(g.player,goal)<=3&&!g.player.dead;}
if(!travel({x:7,z:80},40))throw Error('cannot reach keeper');g.interact();
for(const place of PLACES.filter(p=>p.type==='beacon')){
  const end=t+200;
  while(!g.lit.includes(place.id)&&t<end&&!g.player.dead){tickToward(place);if(distance(g.player,place)<4)g.interact(place);}
  log.push({place:place.id,lit:g.lit.includes(place.id),time:Math.round(t),hp:Math.round(g.player.hp),position:[g.player.x,g.player.z]});
  if(!g.lit.includes(place.id)){failed=true;break;}
  while(g.upgrade('weapon')){}
}
if(!failed){const place=PLACES[4],end=t+250;while(!g.bossDefeated&&t<end&&!g.player.dead)tickToward(place);log.push({boss:g.bossDefeated,time:Math.round(t),hp:Math.round(g.player.hp),level:g.player.level,weapon:g.player.weapon,dead:g.player.dead});if(g.bossDefeated){travel(place,30);g.interact(place);g.chooseEnding('release');}else failed=true;}
console.log(JSON.stringify({passed:!failed,seconds:Math.round(t),ending:g.ending,log},null,2));if(failed)process.exitCode=1;
