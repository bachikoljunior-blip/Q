import {angleDelta,distance} from './core.js';
import {segmentCylinder} from './spatial.js';

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
  const player=game.player,d=distance(player,enemy);
  if(enemy.dead||enemy.state==='sealed'||(enemy.type==='boss'&&game.lit.length<4)||!['windup','strike'].includes(enemy.state)||(enemy.state==='strike'&&enemy.hit))return null;
  const ranged=enemy.type==='ranger',radial=enemy.type==='boss'&&enemy.radial;
  // Keep the countdown while airborne: landing before the shockwave is still dangerous.
  if(!ranged&&!game.meleeContact(enemy,radial?{...player,grounded:true}:player))return null;
  const arrow=ranged?game.createEnemyArrow(enemy):null;
  const flight=ranged&&arrow?projectileThreat(game,arrow):null;
  if(ranged&&!flight)return null;
  const response=radial?'跳躍':ranged?'横移動 / 回避':'回避 / 受け流し';
  const kind=radial?'shockwave':ranged?'bow':'melee';
  const timeToImpact=(enemy.state==='windup'?enemy.timer:0)+(flight?.timeToImpact||0);
  return {sourceId:enemy.id,sourceType:enemy.type,source:labels[enemy.type]||'敵',stage:enemy.state,kind,response,direction:radial?'周囲':directionFrom(player,enemy),timeToImpact:round(timeToImpact),distance:round(d)};
}

function projectileThreat(game,arrow){
  if(arrow.owner==='player'||arrow.life<=0)return null;
  const player=game.player,horizon=Math.min((Math.ceil(arrow.life*60-1e-9)-1)/60,1.8);if(horizon<=0)return null;
  const to={x:arrow.x+arrow.vx*horizon,y:arrow.y+arrow.vy*horizon,z:arrow.z+arrow.vz*horizon};
  // Cheap body broad phase before testing terrain and cover along the actual path.
  if(segmentCylinder(arrow,to,{...player,y:player.y+.15,height:1.95,r:.48},.12)===null)return null;
  const contact=game.projectileContact(arrow,horizon);
  if(contact.target!==player)return null;
  const t=contact.fraction*horizon;
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

/** Current trajectories against the current player position; not a forecast of future movement. */
export function renderCombatHint(element,game){
  const presentation=combatPresentation(game),{primary,threats}=presentation,second=threats[1];
  element.textContent=primary?primary.text+(second?`\n続く攻撃：${second.source} · ${second.direction} · ${second.response}`:''):'';
  return presentation;
}
