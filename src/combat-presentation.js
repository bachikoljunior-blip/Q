import {angleDelta,distance} from './core.js';

const labels={boss:'灰冠の番人',ranger:'弓兵',wolf:'灰を喰う獣',knight:'火を失った兵'};
const round=value=>Math.round(value*1000)/1000;

function directionFrom(player,point){
  const delta=angleDelta(Math.atan2(point.x-player.x,point.z-player.z),player.angle);
  const absolute=Math.abs(delta);
  if(absolute<Math.PI/4)return '正面';
  if(absolute>Math.PI*3/4)return '背後';
  return delta>0?'右':'左';
}

function enemyThreat(game,enemy){
  const player=game.player,range=enemy.radial?9:enemy.type==='boss'?6.5:enemy.type==='wolf'?2.5:enemy.type==='ranger'?20:3.3,d=distance(player,enemy);
  if(enemy.dead||enemy.state==='sealed'||!['windup','strike'].includes(enemy.state)||(enemy.state==='strike'&&enemy.hit)||d>range+2)return null;
  const ranged=enemy.type==='ranger',radial=enemy.type==='boss'&&enemy.radial;
  if(!radial&&!ranged&&!game.canStrike(enemy,player))return null;
  const response=radial?'跳躍':ranged?'横移動 / 回避':'回避 / 受け流し';
  const kind=radial?'shockwave':ranged?'bow':'melee';
  const timeToImpact=enemy.state==='windup'?enemy.timer:0;
  return {sourceId:enemy.id,sourceType:enemy.type,source:labels[enemy.type]||'敵',stage:enemy.state,kind,response,direction:radial?'周囲':directionFrom(player,enemy),timeToImpact:round(timeToImpact),distance:round(d)};
}

function projectileThreat(game,arrow){
  if(arrow.owner==='player'||arrow.life<=0)return null;
  const player=game.player,v2=arrow.vx*arrow.vx+arrow.vz*arrow.vz;if(v2<1)return null;
  const rx=player.x-arrow.x,rz=player.z-arrow.z,t=(rx*arrow.vx+rz*arrow.vz)/v2;
  if(t<0||t>Math.min(arrow.life,1.8))return null;
  const miss=Math.hypot(arrow.x+arrow.vx*t-player.x,arrow.z+arrow.vz*t-player.z);
  if(miss>.72)return null;
  const source=game.enemies.find(enemy=>enemy.id===arrow.owner);
  return {sourceId:arrow.owner,sourceType:source?.type||'ranger',source:labels[source?.type]||'矢',stage:'flight',kind:'arrow',response:'横移動 / 回避',direction:directionFrom(player,arrow),timeToImpact:round(t),distance:round(distance(player,arrow))};
}

export function combatPresentation(game){
  if(!game||game.player.dead)return {active:false,primary:null,threats:[]};
  const threats=[];
  for(const enemy of game.enemies){const threat=enemyThreat(game,enemy);if(threat)threats.push(threat);}
  for(const arrow of game.projectiles){const threat=projectileThreat(game,arrow);if(threat)threats.push(threat);}
  threats.sort((a,b)=>a.timeToImpact-b.timeToImpact||a.distance-b.distance||a.sourceId.localeCompare(b.sourceId));
  const primary=threats[0]||null;
  if(primary){const time=primary.timeToImpact<=.05?'今':`${primary.timeToImpact.toFixed(1)}秒`;primary.text=`${primary.source} · ${primary.direction} ${time} · ${primary.response}`;}
  return {active:!!primary,primary,threats};
}
