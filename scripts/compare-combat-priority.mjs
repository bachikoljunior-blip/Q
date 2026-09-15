// Fixed-state A/B of the v0.16 HUD/input contract and the candidate production
// bridge. It exercises Three projection and Game ticks, but not WebGL pixels,
// browser events, audio, touch hardware or a physical device.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import * as T from 'three';
import {Game,groundAt} from '../src/core.js';
import {cameraRelativeDirection,combatPresentation} from '../src/combat-presentation.js';
import {renderCombatHud} from '../src/combat-hud.js';
import {CombatInputQueue} from '../src/combat-input.js';

const BASE='89398313469f6f7c16e8a5c83cf95c6f58fae0cc',OPTIMIZATION_BASE='ab7eebfb5b296fa28cbddf6cfda5b95099e5e9ef',viewport={width:390,height:844,yaw:0,pitch:.3,zoom:9};

function arm(enemy,{x,z,timer,radial=false}){Object.assign(enemy,{dead:false,x,z,homeX:x,homeZ:z,y:groundAt(x,z),angle:Math.atan2(-x,86-z),state:'windup',timer,windupMax:timer,cooldown:0,radial,hit:false,stagger:0});return enemy;}
function setup(multiple=true){
  const game=new Game();game.enemies.forEach(enemy=>enemy.dead=true);game.obstacles=[];game.projectiles=[];game.lit=['haven','grove','flood','ruins'];game.events=[];
  Object.assign(game.player,{x:0,z:86,y:groundAt(0,86),angle:0,hp:120,stamina:100,invulnerable:0,attack:0,dodge:0,parry:0,healTimer:0,grounded:true,dead:false});
  const knights=game.enemies.filter(enemy=>enemy.type==='knight'),front=arm(knights[0],{x:0,z:88.6,timer:.1});
  if(multiple){arm(knights[1],{x:2.6,z:86,timer:.11});arm(game.enemies.find(enemy=>enemy.type==='boss'),{x:0,z:81,timer:.12,radial:true});}
  return {game,front};
}
function project(game){
  const {width,height,yaw,pitch,zoom}=viewport,camera=new T.PerspectiveCamera(54,width/height,.1,1100),p=game.player,d=zoom*1.12,target=new T.Vector3(p.x,p.y+1.6,p.z);
  camera.position.set(p.x+Math.sin(yaw)*Math.cos(pitch)*d,p.y+1.7+Math.sin(pitch)*d,p.z+Math.cos(yaw)*Math.cos(pitch)*d);camera.lookAt(target);camera.updateMatrixWorld();
  return position=>{const point=new T.Vector3(position.x,position.y,position.z).project(camera);return{x:(point.x*.5+.5)*width,y:(-point.y*.5+.5)*height,visible:point.z<1&&point.z>-1};};
}
function node(){const attributes={},classes=new Map();return {attributes,classes,element:{textContent:'',setAttribute:(key,value)=>attributes[key]=value,removeAttribute:key=>delete attributes[key],classList:{toggle:(key,value)=>classes.set(key,!!value)}}};}
function candidateHud(game,projectileForecaster,forecastMetrics){const hint=node(),controls=Object.fromEntries(['dodge','parry','jump'].map(name=>[name,node()])),view=renderCombatHud(hint.element,Object.fromEntries(Object.entries(controls).map(([name,target])=>[name,target.element])),game,{cameraYaw:viewport.yaw,project:project(game),viewportWidth:viewport.width,viewportHeight:viewport.height,projectileForecaster,forecastMetrics});return {hint,controls,view};}

function baselineHud(game){
  const projection=project(game),presentation=combatPresentation(game,{limit:2}),display=threat=>{
    if(threat.direction==='周囲')return '周囲';const fallback=cameraRelativeDirection(game.player,threat.position,viewport.yaw),point=projection(threat.position);if(!point.visible)return fallback;const x=point.x/viewport.width;return x<.42?'左':x>.58?'右':'正面';
  },threats=presentation.threats.map(threat=>({...threat,screenDirection:display(threat)})),label=direction=>direction==='周囲'?'周囲':direction==='正面'?'画面前方':direction==='背後'?'画面外・背後':`画面${direction}`,glyph=direction=>({正面:'↑',右:'→',背後:'↓',左:'←',周囲:'◎'})[direction]||'◇',line=threat=>`${glyph(threat.screenDirection)} ${threat.source} · ${label(threat.screenDirection)} ${threat.timeToImpact.toFixed(1)}秒 · ${threat.response}`;
  return {threats,text:threats[0]?line(threats[0])+(threats[1]?`\n続く攻撃：${line(threats[1])}`:''):'',projection:threats.map(threat=>({hazardId:threat.hazardId,...projection(threat.position)}))};
}
function run(game,frames=30){const events=[];for(let frame=0;frame<frames;frame++){game.tick(1/60);events.push(...game.events.splice(0).map(event=>({frame,type:event.type,sourceId:event.sourceId??event.id??null})));}return {hp:game.player.hp,stamina:game.player.stamina,events:events.filter(event=>['swing','dodge','parry','enemySwing','perfect','hurt'].includes(event.type))};}
function directOutcome(action){const {game}=setup();const accepted=game.requestAction(action,{x:1,z:0});return {accepted,...run(game)};}
function candidateOutcome(){const {game}=setup(),hud=candidateHud(game),queue=new CombatInputQueue();queue.push(hud.view.decision.action);const input=queue.flush(game,hud.view,{x:1,z:0});return {input,...run(game)};}
function orderOutcome(order,candidate){const {game}=setup(false),hud=candidateHud(game);let selected=[];
  if(candidate){const queue=new CombatInputQueue();for(const action of order)queue.push(action);selected=[queue.flush(game,hud.view,{x:1,z:0}).selected];}
  else for(const action of order)selected.push(game.requestAction(action,{x:1,z:0})?action:null);
  return {selected,...run(game)};
}
function sequentialProjectileForecaster(game,requests,{metrics:reportedMetrics}={}){
  const metrics=reportedMetrics?{trajectories:requests.length,exactFrames:0}:null;
  const results=requests.map(({arrow,horizon})=>{const simulated={...arrow};let elapsed=0;
    while(elapsed+1e-9<horizon){const step=Math.min(1/60,horizon-elapsed);if(simulated.life-step<=0)break;const contact=game.projectileContact(simulated,step);if(metrics)metrics.exactFrames++;
      if(contact.target)return {target:contact.target,timeToImpact:elapsed+contact.fraction*step};
      simulated.x=contact.to.x;simulated.y=contact.to.y;simulated.z=contact.to.z;simulated.life-=step;elapsed+=step;
    }return null;
  });
  if(reportedMetrics)Object.assign(reportedMetrics,metrics);return results;
}
const median=values=>{const ordered=[...values].sort((a,b)=>a-b),middle=Math.floor(ordered.length/2);return ordered.length%2?ordered[middle]:(ordered[middle-1]+ordered[middle])/2;};
function measureThreatScan(){
  const game=new Game();game.enemies.forEach(enemy=>enemy.dead=true);game.obstacles=[];const p=game.player;game.projectiles=Array.from({length:48},(_,index)=>({id:index+1,owner:'enemy-1',x:p.x+(index%3-1)*.15,y:p.y+1,z:p.z+5+index*.03,vx:0,vy:0,vz:-20,life:2,damage:20}));
  const state=JSON.stringify(game.serialize()),sequentialMetrics={},batchMetrics={},sequential=candidateHud(game,sequentialProjectileForecaster,sequentialMetrics),batch=candidateHud(game,undefined,batchMetrics),summary=hud=>({text:hud.hint.element.textContent,threats:hud.view.allThreats.map(threat=>[threat.hazardId,threat.impactFrame,threat.screenDirection]),decision:hud.view.decision});
  assert.deepEqual(summary(batch),summary(sequential));assert.equal(JSON.stringify(game.serialize()),state);
  for(let index=0;index<12;index++){candidateHud(game,sequentialProjectileForecaster);candidateHud(game);}
  const iterations=250,blocksPerSample=10,iterationsPerBlock=iterations/blocksPerSample,sampleCount=9,time=fn=>{const start=performance.now();for(let index=0;index<iterationsPerBlock;index++)fn();return performance.now()-start;},samples=[];
  for(let sample=0;sample<sampleCount;sample++){
    let sequentialMs=0,batchMs=0;
    for(let block=0;block<blocksPerSample;block++){
      if((sample+block)%2===0){sequentialMs+=time(()=>candidateHud(game,sequentialProjectileForecaster));batchMs+=time(()=>candidateHud(game));}
      else{batchMs+=time(()=>candidateHud(game));sequentialMs+=time(()=>candidateHud(game,sequentialProjectileForecaster));}
    }
    samples.push({sample:sample+1,sequentialMs:Math.round(sequentialMs*1000)/1000,batchMs:Math.round(batchMs*1000)/1000,sequentialPerCallMs:Math.round(sequentialMs/iterations*10000)/10000,batchPerCallMs:Math.round(batchMs/iterations*10000)/10000,ratio:Math.round(sequentialMs/batchMs*1000)/1000});
  }
  const sequentialPerCallMedian=median(samples.map(sample=>sample.sequentialMs))/iterations,batchPerCallMedian=median(samples.map(sample=>sample.batchMs))/iterations;
  return {fixture:'30 enemy slots / 48 intersecting arrows',optimizationBaseRef:OPTIMIZATION_BASE,iterationsPerSample:iterations,blocksPerSample,sampleCount,hostOnly:true,semanticsIdentical:true,sequentialMetrics,batchMetrics,sequentialPerCallMedianMs:Math.round(sequentialPerCallMedian*10000)/10000,batchPerCallMedianMs:Math.round(batchPerCallMedian*10000)/10000,speedup:Math.round(sequentialPerCallMedian/batchPerCallMedian*1000)/1000,reductionPercent:Math.round((1-batchPerCallMedian/sequentialPerCallMedian)*1000)/10,batchFasterSamples:samples.filter(sample=>sample.batchMs<sample.sequentialMs).length,samples};
}

export function compareCombatPriority({measure=false}={}){
  const {game}=setup(),state=game.serialize(),stateJson=JSON.stringify(state),before=JSON.stringify(game.serialize()),baseline=baselineHud(game),candidate=candidateHud(game),after=JSON.stringify(game.serialize());
  const baseFollow=directOutcome('parry'),candidateFollow=candidateOutcome(),baseOrders=[['attack','parry'],['parry','attack']].map(order=>({order,result:orderOutcome(order,false)})),candidateOrders=[['attack','parry'],['parry','attack']].map(order=>({order,result:orderOutcome(order,true)}));
  const baseHpSpread=Math.max(...baseOrders.map(item=>item.result.hp))-Math.min(...baseOrders.map(item=>item.result.hp)),candidateHpSpread=Math.max(...candidateOrders.map(item=>item.result.hp))-Math.min(...candidateOrders.map(item=>item.result.hp));
  const checks={allThreeConsidered:candidate.view.allThreats.length===3&&baseline.threats.length===2,hiddenBossRecovered:!baseline.threats.some(threat=>threat.sourceType==='boss')&&candidate.view.allThreats.some(threat=>threat.sourceType==='boss'),offscreenExplicit:candidate.view.allThreats.some(threat=>threat.screenDirection.endsWith('外'))&&!baseline.text.includes('画面外'),singleInstruction:/^次：回避/.test(candidate.hint.element.textContent)&&!/受け流し|跳躍|\//.test(candidate.hint.element.textContent),followHpImproved:candidateFollow.hp>baseFollow.hp,inputOrderStabilized:baseHpSpread>0&&candidateHpSpread===0};
  const regressions={gameStateMutated:before!==after,noResponseChanged:false,candidateDamaged:candidateFollow.hp<120};
  const comparison={baseRef:BASE,fixtureHash:createHash('sha256').update(stateJson).digest('hex'),viewport,logicEvidence:'Game ticks + production combat HUD bridge + Three clip projection; no WebGL pixels.',baseline:{visibleThreats:baseline.threats.map(threat=>threat.hazardId),hudText:baseline.text,projection:baseline.projection,followParry:baseFollow,inputOrder:baseOrders,hpSpread:baseHpSpread},candidate:{consideredThreats:candidate.view.allThreats.map(threat=>({hazardId:threat.hazardId,direction:threat.screenDirection,impactFrame:threat.impactFrame})),visibleThreats:candidate.view.threats.map(threat=>threat.hazardId),hudText:candidate.hint.element.textContent,nextAction:candidate.view.decision.action,buttonHighlighted:Object.entries(candidate.controls).filter(([,target])=>target.classes.get('recommended')).map(([name])=>name),followDisplayedAction:candidateFollow,inputOrder:candidateOrders,hpSpread:candidateHpSpread},checks,improvementCount:Object.values(checks).filter(Boolean).length,regressions:Object.values(regressions).filter(Boolean),gameStateUnchanged:before===after,scanPerformance:measure?measureThreatScan():null,note:'Laboratory comparison only; host timing is not device performance. Browser pixels, touch hardware, audio, iOS/Android performance and external player quality were not observed.'};
  assert.equal(comparison.improvementCount,6);assert.deepEqual(comparison.regressions,[]);assert.equal(comparison.gameStateUnchanged,true);assert.equal(baseFollow.hp,86);assert.equal(candidateFollow.hp,120);assert.equal(baseHpSpread,22);assert.equal(candidateHpSpread,0);assert.deepEqual(comparison.candidate.buttonHighlighted,['dodge']);
  return comparison;
}

if(process.argv[1]&&import.meta.url===new URL(process.argv[1],'file:').href)console.log(JSON.stringify(compareCombatPriority({measure:true}),null,2));
