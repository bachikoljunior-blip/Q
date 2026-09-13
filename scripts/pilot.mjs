// A test policy with knowledge of enemy state, not a human playtest.
import {distance} from '../src/core.js';
import {findPath} from '../src/navigation.js';
import {lineClear} from '../src/spatial.js';
export function createPilot(g){
const navigation={path:[],goal:null},clock={value:0};
function tickToward(goal,combat=true){
  const p=g.player;
  const foes=g.enemies.filter(e=>!e.dead&&e.state!=='sealed'&&distance(e,p)<17).sort((a,b)=>distance(a,p)-distance(b,p));
  let aim=goal,away=false;
  if(combat&&foes.length){const e=foes[0],d=distance(p,e);g.locked=e.id;aim=e;
    if(p.hp<p.maxHp*.48)g.heal();
    const incoming=g.projectiles.find(a=>a.owner!=='player'&&distance(a,p)<3.5);if(incoming){g.locked=incoming.owner;g.parry();}
    if(p.energy>=40&&d<7&&(foes.length>1||e.type==='boss'))g.skill();
    const threat=foes.find(e=>e.state==='windup'&&e.timer<.23&&distance(e,p)<(e.radial?9:e.type==='boss'?7:4));
    if(threat){if(threat.radial)g.jump();else if(!g.parry()&&threat.timer<.08)g.dodge(p.x-threat.x,p.z-threat.z);}
    if(d<g.weaponStats().reach-.3&&p.stamina>Math.max(30,g.weaponStats().cost)&&!threat)g.attack();
    if(p.stamina<28){away=true;}
    else if(d<g.weaponStats().reach-1)aim={x:p.x,z:p.z};
  }else g.locked=null;
  let x=aim.x-p.x,z=aim.z-p.z,d=Math.hypot(x,z);if(d>.1){x/=d;z/=d;}else{x=z=0;}
  if(away){x=-x;z=-z;}
  if(!away&&distance(p,aim)>1&&!lineClear(p,aim,g.obstacles,.56)){
    if(!navigation.path.length||!navigation.goal||distance(aim,navigation.goal)>3){navigation.path=findPath(p,aim,g.obstacles);navigation.goal={x:aim.x,z:aim.z};}
    while(navigation.path.length&&distance(p,navigation.path[0])<.5)navigation.path.shift();
    const node=navigation.path[0];if(node){const length=distance(p,node);x=(node.x-p.x)/length;z=(node.z-p.z)/length;}
  }else navigation.path=[];
  g.tick(1/60,{x,z});clock.value+=1/60;
  g.events.length=0;
}
function travel(goal,seconds){const end=clock.value+seconds;while(distance(g.player,goal)>3&&clock.value<end&&!g.player.dead)tickToward(goal);return distance(g.player,goal)<=3&&!g.player.dead;}
return {tickToward,travel,get time(){return clock.value;}};
}
