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
  return {sourceId:enemy.id,sourceType:enemy.type,source:labels[enemy.type]||'敵',position:{x:enemy.x,y:enemy.y+(enemy.type==='boss'?2.2:enemy.type==='wolf'?.8:1.2),z:enemy.z},stage:enemy.state,kind,response,direction:radial?'周囲':directionFrom(player,enemy),timeToImpact:round(timeToImpact),distance:round(d)};
}

export function forecastProjectileContact(game,arrow,horizon){
  // Advance an immutable copy with the same 60 Hz lifetime/contact order as
  // tickProjectiles. A single long ray can disagree at bridge and terrain seams.
  const simulated={...arrow};let elapsed=0;
  while(elapsed+1e-9<horizon){
    const step=Math.min(1/60,horizon-elapsed);
    if(simulated.life-step<=0)break;
    const contact=game.projectileContact(simulated,step);
    if(contact.target)return {target:contact.target,timeToImpact:elapsed+contact.fraction*step};
    simulated.x=contact.to.x;simulated.y=contact.to.y;simulated.z=contact.to.z;simulated.life-=step;elapsed+=step;
  }
  return null;
}

function projectileThreat(game,arrow,deferCover=false){
  if(arrow.owner==='player'||arrow.life<=0)return null;
  const player=game.player,horizon=Math.min((Math.ceil(arrow.life*60-1e-9)-1)/60,1.8);if(horizon<=0)return null;
  const to={x:arrow.x+arrow.vx*horizon,y:arrow.y+arrow.vy*horizon,z:arrow.z+arrow.vz*horizon};
  // Cheap body broad phase before replaying the exact live-frame contact order.
  const fraction=segmentCylinder(arrow,to,{...player,y:player.y+.15,height:1.95,r:.48},.12);
  if(fraction===null)return null;
  const forecast=deferCover?null:forecastProjectileContact(game,arrow,horizon);
  if(!deferCover&&forecast?.target!==player)return null;
  const t=forecast?.timeToImpact??fraction*horizon;
  const source=game.enemies.find(enemy=>enemy.id===arrow.owner);
  return {...(deferCover?{trajectory:arrow,horizon}:{}),sourceId:arrow.owner,sourceType:source?.type||'ranger',source:labels[source?.type]||'矢',position:{x:arrow.x,y:arrow.y,z:arrow.z},stage:'flight',kind:'arrow',response:'横移動 / 回避',direction:directionFrom(player,arrow),timeToImpact:round(t),distance:round(distance(player,arrow))};
}

export function cameraFacingAngle(cameraYaw){return angleDelta(cameraYaw+Math.PI,0);}

export function cameraRelativeDirection(player,point,cameraYaw){
  if(Math.hypot(point.x-player.x,point.z-player.z)<1e-6)return '正面';
  const delta=angleDelta(Math.atan2(point.x-player.x,point.z-player.z),cameraFacingAngle(cameraYaw)),absolute=Math.abs(delta);
  if(absolute<Math.PI/4)return '正面';
  if(absolute>Math.PI*3/4)return '背後';
  // Three.js screen x has the opposite sign to the x/z bearing delta.
  return delta>0?'左':'右';
}

export function screenDirectionFromProjection(point,viewportWidth,fallback='背後'){
  if(!point||point.visible===false||!Number.isFinite(point.x)||!Number.isFinite(viewportWidth)||viewportWidth<=0)return fallback;
  const normalized=point.x/viewportWidth;
  if(normalized<.42)return '左';
  if(normalized>.58)return '右';
  return '正面';
}

export function combatPresentation(game){
  if(!game||game.player.dead)return {active:false,primary:null,threats:[]};
  const candidates=[];
  for(const enemy of game.enemies){const threat=enemyThreat(game,enemy);if(threat)candidates.push(threat);}
  for(const arrow of game.projectiles){const threat=projectileThreat(game,arrow,true);if(threat)candidates.push(threat);}
  candidates.sort((a,b)=>a.timeToImpact-b.timeToImpact||a.distance-b.distance||a.sourceId.localeCompare(b.sourceId));
  // Only the two imminent visible threats need expensive cover tests. A blocked
  // candidate is skipped so it never hides the next real incoming attack.
  const threats=[];
  for(const candidate of candidates){
    const {trajectory,horizon,...threat}=candidate;
    if(trajectory){
      const forecast=forecastProjectileContact(game,trajectory,horizon);
      if(forecast?.target!==game.player)continue;
      threat.timeToImpact=round(forecast.timeToImpact);
    }
    threats.push(threat);if(threats.length===2)break;
  }
  const primary=threats[0]||null;
  if(primary){const time=primary.timeToImpact<=.05?'今':`${primary.timeToImpact.toFixed(1)}秒`;primary.text=`${primary.source} · ${primary.direction} ${time} · ${primary.response}`;}
  return {active:!!primary,primary,threats};
}

/** Current trajectories against the current player position; not a forecast of future movement. */
export function renderCombatHint(element,game,{cameraYaw,project,viewportWidth}={}){
  const presentation=combatPresentation(game),screenRelative=typeof project==='function'||Number.isFinite(cameraYaw);
  const displayDirection=threat=>{
    if(threat.direction==='周囲')return '周囲';
    const fallback=Number.isFinite(cameraYaw)?cameraRelativeDirection(game.player,threat.position,cameraYaw):threat.direction;
    if(typeof project!=='function')return fallback;
    let point;try{point=project(threat.position);}catch{return fallback;}
    return screenDirectionFromProjection(point,viewportWidth,fallback);
  };
  const threats=presentation.threats.map(threat=>({...threat,screenDirection:displayDirection(threat)})),primary=threats[0]||null,second=threats[1];
  const directionLabel=direction=>direction==='周囲'?'周囲':screenRelative?direction==='正面'?'画面前方':direction==='背後'?'画面外・背後':`画面${direction}`:direction;
  const glyph=direction=>({正面:'↑',右:'→',背後:'↓',左:'←',周囲:'◎'})[direction]||'◇';
  const line=threat=>{const time=threat.timeToImpact<=.05?'今':`${threat.timeToImpact.toFixed(1)}秒`;return `${glyph(threat.screenDirection)} ${threat.source} · ${directionLabel(threat.screenDirection)} ${time} · ${threat.response}`;};
  element.textContent=primary?line(primary)+(second?`\n続く攻撃：${line(second)}`:''):'';
  element.setAttribute('data-direction',primary?.screenDirection||'');
  element.classList.toggle('urgent',!!primary&&primary.timeToImpact<=.35);
  return {...presentation,primary,threats};
}
