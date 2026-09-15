import {angleDelta,distance,groundAt,heightAt} from './core.js';
import {queryObstacles,segmentCylinder} from './spatial.js';
import {vaultByWarden} from './vault-slices.js';

const labels={boss:'灰冠の番人',ranger:'弓兵',wolf:'灰を喰う獣',knight:'火を失った兵'};
const round=value=>Math.round(value*1000)/1000;
const REACTION_CLUSTER=.18;
// A long broad-phase segment can round a mathematical tangent just outside a
// cylinder even though one of the live 60 Hz segments rounds it inside. Inflate
// only the candidate search; the live contact routine still decides the result.
const FORECAST_GUARD=1e-6;
const actionLabels={dodge:'回避',parry:'受け流し',jump:'跳躍'};
const actionLead={dodge:.3,parry:.28,jump:.62};

function directionFrom(player,point){
  const delta=angleDelta(Math.atan2(point.x-player.x,point.z-player.z),player.angle);
  const absolute=Math.abs(delta);
  if(absolute<Math.PI/4)return '正面';
  if(absolute>Math.PI*3/4)return '背後';
  return delta>0?'右':'左';
}

function enemyThreat(game,enemy,contactOrder){
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
  const impactTime=(enemy.state==='windup'?enemy.timer:0)+(flight?.impactTime??flight?.timeToImpact??0);
  const damage=radial||enemy.type==='boss'?34:enemy.type==='wolf'?14:enemy.type==='ranger'?20:22;
  return {hazardId:enemy.id,sourceId:enemy.id,contactOrder:ranged?game.enemies.length+game.projectiles.length+contactOrder:contactOrder,contactPhase:ranged?'projectile':'enemy',sourceType:enemy.type,source:vaultByWarden(enemy.id)?.wardenName||labels[enemy.type]||'敵',position:{x:enemy.x,y:enemy.y+(enemy.type==='boss'?2.2:enemy.type==='wolf'?.8:1.2),z:enemy.z},stage:enemy.state,kind,response,damage,lethal:damage>=player.hp,direction:radial?'周囲':directionFrom(player,enemy),impactTime,timeToImpact:round(impactTime),distance:round(d)};
}

const projectileBody=actor=>({
  ...actor,
  y:actor.y+.15,
  height:(actor.type==='boss'?4.7:actor.type==='wolf'?1.35:2.1)-.15,
  r:actor.type==='boss'?1.25:.48,
});

function staticContactTime(game,arrow,horizon,knownPlayerImpactTime,bodyCache,obstacleCache,metrics){
  let first=Number.isFinite(knownPlayerImpactTime)?knownPlayerImpactTime:Infinity;
  if(Number.isFinite(knownPlayerImpactTime)){if(metrics)metrics.reusedPlayerImpacts++;}
  else{
    const victims=arrow.owner==='player'?game.enemies.filter(enemy=>!enemy.dead):[game.player],fullTo={x:arrow.x+arrow.vx*horizon,y:arrow.y+arrow.vy*horizon,z:arrow.z+arrow.vz*horizon};
    for(const victim of victims){
      let body=bodyCache.get(victim);if(!body){body=projectileBody(victim);bodyCache.set(victim,body);}
      const fraction=segmentCylinder(arrow,fullTo,body,.12+FORECAST_GUARD);if(metrics)metrics.bodySweeps++;
      if(fraction!==null)first=Math.min(first,fraction*horizon);
    }
  }
  const scanTime=Math.min(horizon,first),scanTo={x:arrow.x+arrow.vx*scanTime,y:arrow.y+arrow.vy*scanTime,z:arrow.z+arrow.vz*scanTime};
  const obstacleGuard=.08+FORECAST_GUARD;
  for(const obstacle of queryObstacles(game.obstacles,Math.min(arrow.x,scanTo.x)-obstacleGuard,Math.min(arrow.z,scanTo.z)-obstacleGuard,Math.max(arrow.x,scanTo.x)+obstacleGuard,Math.max(arrow.z,scanTo.z)+obstacleGuard)){
    let body=obstacleCache.get(obstacle);if(!body){body={...obstacle,y:heightAt(obstacle.x,obstacle.z),height:obstacle.height??obstacle.r*1.5};obstacleCache.set(obstacle,body);}
    const fraction=segmentCylinder(arrow,scanTo,body,obstacleGuard);if(metrics)metrics.obstacleSweeps++;
    if(fraction!==null)first=Math.min(first,fraction*scanTime);
  }
  return first;
}

function terrainContact(from,to,startFloor,metrics){
  const length=Math.hypot(to.x-from.x,to.y-from.y,to.z-from.z),steps=Math.max(1,Math.ceil(length/.2));let endFloor=startFloor,endMatchesNext=false;
  for(let index=0;index<=steps;index++){
    const fraction=index/steps,x=from.x+(to.x-from.x)*fraction,y=from.y+(to.y-from.y)*fraction,z=from.z+(to.z-from.z)*fraction;
    let floor;if(index===0&&Number.isFinite(startFloor))floor=startFloor;else{floor=groundAt(x,z);if(metrics)metrics.terrainSamples++;}
    if(index===steps){endFloor=floor;endMatchesNext=x===to.x&&z===to.z;}
    if(y<floor+.1){
      let low=Math.max(0,(index-1)/steps),high=fraction;
      for(let iteration=0;iteration<5;iteration++){
        const middle=(low+high)/2,middleX=from.x+(to.x-from.x)*middle,middleZ=from.z+(to.z-from.z)*middle;
        if(metrics)metrics.terrainSamples++;if(from.y+(to.y-from.y)*middle<groundAt(middleX,middleZ)+.1)high=middle;else low=middle;
      }
      return {fraction:high,endFloor,endMatchesNext};
    }
  }
  return {fraction:null,endFloor,endMatchesNext};
}

/**
 * Forecast several immutable trajectories together. Static cylinders are swept
 * once per trajectory and their bodies are shared across the batch. Terrain is
 * still sampled in the exact 60 Hz segments used by tickProjectiles; the one
 * segment that can contain a static hit is delegated back to the live contact
 * routine so collision ordering and boundary ties remain identical.
 */
export function forecastProjectileContacts(game,requests,{metrics:reportedMetrics}={}){
  const metrics=reportedMetrics?{trajectories:requests.length,reusedPlayerImpacts:0,bodySweeps:0,obstacleSweeps:0,terrainFrames:0,terrainSamples:0,exactFrames:0,fallbackFrames:0}:null;
  const bodyCache=new Map(),obstacleCache=new Map();
  const results=requests.map(({arrow,horizon,playerImpactTime})=>{
    if(!arrow||arrow.life<=0||!Number.isFinite(horizon)||horizon<=0)return null;
    const simulated={...arrow};let elapsed=0,fallback=false,terrainFloor;
    const staticTime=staticContactTime(game,arrow,horizon,playerImpactTime,bodyCache,obstacleCache,metrics);
    while(elapsed+1e-9<horizon){
      const step=Math.min(1/60,horizon-elapsed);if(simulated.life-step<=0)break;
      const reachesStatic=staticTime<=elapsed+step+1e-12;
      if(reachesStatic||fallback){
        const contact=game.projectileContact(simulated,step);if(metrics){metrics.exactFrames++;if(fallback)metrics.fallbackFrames++;}
        if(contact.target)return {target:contact.target,timeToImpact:elapsed+contact.fraction*step};
        fallback=true;simulated.x=contact.to.x;simulated.y=contact.to.y;simulated.z=contact.to.z;
      }else{
        const from={x:simulated.x,y:simulated.y,z:simulated.z},to={x:simulated.x+simulated.vx*step,y:simulated.y+simulated.vy*step,z:simulated.z+simulated.vz*step};
        const terrain=terrainContact(from,to,terrainFloor,metrics);if(metrics)metrics.terrainFrames++;
        if(terrain.fraction!==null)return {target:'wall',timeToImpact:elapsed+terrain.fraction*step};
        terrainFloor=terrain.endMatchesNext?terrain.endFloor:undefined;
        simulated.x=to.x;simulated.y=to.y;simulated.z=to.z;
      }
      simulated.life-=step;elapsed+=step;
    }
    return null;
  });
  if(reportedMetrics)Object.assign(reportedMetrics,metrics,{sharedBodies:bodyCache.size,sharedObstacles:obstacleCache.size});
  return results;
}

export function forecastProjectileContact(game,arrow,horizon){
  return forecastProjectileContacts(game,[{arrow,horizon}])[0];
}

function projectileThreat(game,arrow,deferCover=false,contactOrder=0){
  if(arrow.owner==='player'||arrow.life<=0)return null;
  const player=game.player,horizon=Math.min((Math.ceil(arrow.life*60-1e-9)-1)/60,1.8);if(horizon<=0)return null;
  const to={x:arrow.x+arrow.vx*horizon,y:arrow.y+arrow.vy*horizon,z:arrow.z+arrow.vz*horizon};
  // Cheap body broad phase before replaying the exact live-frame contact order.
  const fraction=segmentCylinder(arrow,to,{...player,y:player.y+.15,height:1.95,r:.48},.12+FORECAST_GUARD);
  if(fraction===null)return null;
  const forecast=deferCover?null:forecastProjectileContact(game,arrow,horizon);
  if(!deferCover&&forecast?.target!==player)return null;
  const t=forecast?.timeToImpact??fraction*horizon;
  const source=game.enemies.find(enemy=>enemy.id===arrow.owner);
  return {...(deferCover?{trajectory:arrow,horizon,playerImpactTime:fraction*horizon}:{}),hazardId:`arrow-${arrow.id??contactOrder}`,sourceId:arrow.owner,contactOrder,contactPhase:'projectile',sourceType:source?.type||'ranger',source:labels[source?.type]||'矢',position:{x:arrow.x,y:arrow.y,z:arrow.z},stage:'flight',kind:'arrow',response:'横移動 / 回避',damage:arrow.damage,lethal:arrow.damage>=player.hp,direction:directionFrom(player,arrow),impactTime:t,timeToImpact:round(t),distance:round(distance(player,arrow))};
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

export function screenDirectionFromProjection(point,viewportWidth,viewportHeight,fallback='背後'){
  if(typeof viewportHeight==='string'){fallback=viewportHeight;viewportHeight=Infinity;}
  const verticalBound=Number.isFinite(viewportHeight)&&viewportHeight>0;
  if(!point||point.visible===false||!Number.isFinite(point.x)||!Number.isFinite(viewportWidth)||viewportWidth<=0||(verticalBound&&!Number.isFinite(point.y)))return '背後';
  const normalized=point.x/viewportWidth;
  if(normalized<0)return '左外';
  if(normalized>1)return '右外';
  if(verticalBound&&point.y<0)return '上外';
  if(verticalBound&&point.y>viewportHeight)return '下外';
  if(normalized<.42)return '左';
  if(normalized>.58)return '右';
  return '正面';
}

const offscreen=direction=>direction==='背後'||direction.endsWith('外');
const impactAt=threat=>threat.impactTime??threat.timeToImpact;
const impactOrder=(a,b)=>impactAt(a)-impactAt(b)||(a.contactOrder??Infinity)-(b.contactOrder??Infinity)||a.distance-b.distance||(a.hazardId||a.sourceId).localeCompare(b.hazardId||b.sourceId);

export function prioritizeScreenThreats(threats){
  if(!threats.length)return [];
  const earliest=Math.min(...threats.map(impactAt));
  return [...threats].sort((a,b)=>{
    const aCluster=impactAt(a)<=earliest+REACTION_CLUSTER,bCluster=impactAt(b)<=earliest+REACTION_CLUSTER;
    if(aCluster!==bCluster)return aCluster?-1:1;
    if(aCluster){
      if(a.lethal!==b.lethal)return a.lethal?-1:1;
      const aHidden=offscreen(a.screenDirection),bHidden=offscreen(b.screenDirection);
      if(aHidden!==bHidden)return aHidden?-1:1;
      const aDistinct=a.kind==='shockwave',bDistinct=b.kind==='shockwave';
      if(aDistinct!==bDistinct)return aDistinct?-1:1;
    }
    return impactOrder(a,b);
  });
}

export function combatDecision(game,threats){
  if(!threats.length)return null;
  const earliest=Math.min(...threats.map(impactAt));
  const cluster=threats.filter(threat=>impactAt(threat)<=earliest+REACTION_CLUSTER);
  const primary=threats[0];
  const p=game.player,can={
    dodge:!p.dead&&p.dodge<=0&&p.stamina>=game.dodgeCost(),
    parry:!p.dead&&p.dodge<=0&&p.attack<=0&&p.parry<=0&&p.healTimer<=0&&p.stamina>=18,
    jump:!p.dead&&p.grounded&&p.healTimer<=0&&p.stamina>=8,
  };
  let desiredAction;
  if(cluster.length>1)desiredAction='dodge';
  else if(primary.kind==='shockwave')desiredAction='jump';
  else if(primary.kind==='melee'&&primary.direction==='正面'&&!offscreen(primary.screenDirection))desiredAction='parry';
  else desiredAction='dodge';
  if(!can[desiredAction]&&desiredAction!=='dodge'&&can.dodge)desiredAction='dodge';
  const available=can[desiredAction];
  const waitSeconds=Math.max(0,round(earliest-actionLead[desiredAction]));
  const state=!available?'unavailable':waitSeconds>0?'wait':'act';
  return {state,action:state==='act'?desiredAction:null,nextAction:desiredAction,label:actionLabels[desiredAction],waitSeconds,threatCount:cluster.length,hiddenThreatCount:Math.max(0,cluster.length-2),coverHazardIds:[...cluster].sort(impactOrder).map(threat=>threat.hazardId),offscreen:cluster.some(threat=>offscreen(threat.screenDirection))};
}

export function combatPresentation(game,{limit=2,projectileForecaster=forecastProjectileContacts,forecastMetrics}={}){
  if(!game||game.player.dead)return {active:false,primary:null,threats:[]};
  const candidates=[];
  game.enemies.forEach((enemy,index)=>{const threat=enemyThreat(game,enemy,index);if(threat)candidates.push(threat);});
  game.projectiles.forEach((arrow,index)=>{const threat=projectileThreat(game,arrow,true,game.enemies.length+index);if(threat)candidates.push(threat);});
  candidates.sort(impactOrder);
  // Batch every current trajectory against shared static bodies before the HUD
  // bridge classifies all real candidates. No threat is dropped for speed.
  const deferred=candidates.filter(candidate=>candidate.trajectory);
  const forecasts=projectileForecaster(game,deferred.map(candidate=>({arrow:candidate.trajectory,horizon:candidate.horizon,playerImpactTime:candidate.playerImpactTime})),{metrics:forecastMetrics});
  const forecastByCandidate=new Map(deferred.map((candidate,index)=>[candidate,forecasts[index]]));
  const threats=[];
  for(const candidate of candidates){
    const {trajectory,horizon,playerImpactTime,...threat}=candidate;
    if(trajectory){
      const forecast=forecastByCandidate.get(candidate);
      if(forecast?.target!==game.player)continue;
      threat.impactTime=forecast.timeToImpact;threat.timeToImpact=round(forecast.timeToImpact);
    }
    // Live melee contact is consumed, and arrows break, while invulnerability
    // is still active. Such contacts cannot be the player's next damage.
    if(game.player.invulnerable>0&&impactAt(threat)<=game.player.invulnerable+1e-9)continue;
    threat.impactFrame=Math.max(0,Math.ceil(impactAt(threat)*60-1e-9));
    threats.push(threat);if(threats.length===limit)break;
  }
  threats.sort(impactOrder);
  const primary=threats[0]||null;
  if(primary){const time=primary.timeToImpact<=.05?'今':`${primary.timeToImpact.toFixed(1)}秒`;primary.text=`${primary.source} · ${primary.direction} ${time} · ${primary.response}`;}
  return {active:!!primary,primary,threats};
}

/** Current trajectories against the current player position; not a forecast of future movement. */
export function renderCombatHint(element,game,{cameraYaw,project,viewportWidth,viewportHeight,projectileForecaster=forecastProjectileContacts,forecastMetrics}={}){
  const presentation=combatPresentation(game,{limit:Infinity,projectileForecaster,forecastMetrics}),screenRelative=typeof project==='function'||Number.isFinite(cameraYaw);
  const displayDirection=threat=>{
    if(threat.direction==='周囲')return '周囲';
    const fallback=Number.isFinite(cameraYaw)?cameraRelativeDirection(game.player,threat.position,cameraYaw):threat.direction;
    if(typeof project!=='function')return fallback;
    let point;try{point=project(threat.position);}catch{return fallback;}
    return screenDirectionFromProjection(point,viewportWidth,viewportHeight,fallback);
  };
  const allThreats=prioritizeScreenThreats(presentation.threats.map(threat=>({...threat,screenDirection:displayDirection(threat)}))),threats=allThreats.slice(0,2),primary=threats[0]||null,decision=combatDecision(game,allThreats);
  const directionLabel=direction=>direction==='周囲'?'周囲':screenRelative?direction==='正面'?'画面前方':direction==='背後'?'画面外・背後':direction==='左外'?'画面外・左':direction==='右外'?'画面外・右':direction==='上外'?'画面外・上':direction==='下外'?'画面外・下':`画面${direction}`:direction;
  const glyph=direction=>({正面:'↑',右:'→',右外:'⇒',背後:'↓',左:'←',左外:'⇐',上外:'⇑',下外:'⇓',周囲:'◎'})[direction]||'◇';
  const line=threat=>{const time=threat.timeToImpact<=.05?'今':`${threat.timeToImpact.toFixed(1)}秒`;return `${glyph(threat.screenDirection)} ${threat.source} · ${directionLabel(threat.screenDirection)} ${time}`;};
  let instruction='';
  if(decision){
    const count=decision.threatCount>1?` · 同時${decision.threatCount}件`:'';
    const hiddenCount=decision.hiddenThreatCount?` · 詳細外${decision.hiddenThreatCount}件`:'';
    const hidden=decision.offscreen?' · 画面外あり':'';
    instruction=decision.state==='act'?`次：${decision.label}${count}${hiddenCount}${hidden}`:decision.state==='wait'?`待機 ${decision.waitSeconds.toFixed(1)}秒 → ${decision.label}${count}${hiddenCount}${hidden}`:`対応不能 · 距離を取る${count}${hiddenCount}${hidden}`;
  }
  element.textContent=primary?instruction+'\n'+threats.map(line).join('\n'):'';
  element.setAttribute('data-direction',primary?.screenDirection||'');
  element.setAttribute('data-action',decision?.action||'');
  element.setAttribute('data-next-action',decision?.nextAction||'');
  element.setAttribute('data-threat-count',String(decision?.threatCount||0));
  element.setAttribute('data-hidden-threat-count',String(decision?.hiddenThreatCount||0));
  element.classList.toggle('urgent',!!primary&&primary.timeToImpact<=.35);
  element.classList.toggle('multi',!!decision&&decision.threatCount>1);
  element.classList.toggle('offscreen',!!decision?.offscreen);
  return {...presentation,primary,threats,allThreats,decision};
}
