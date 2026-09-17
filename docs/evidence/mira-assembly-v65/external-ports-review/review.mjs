import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {Matrix3,Matrix4,Vector3} from 'three';
import {createDetailedActor} from '../../../../src/actor-models.js';

const sources=[];
const hash=b=>createHash('sha256').update(b).digest('hex');
function gitJSON(sha,path){const bytes=execFileSync('git',['show',`${sha}:${path}`],{maxBuffer:40*1024*1024});sources.push({path,commit:sha,sha256:hash(bytes),bytes:bytes.length});return JSON.parse(bytes);}
function localJSON(path){const bytes=fs.readFileSync(path);sources.push({path,commit:null,provisional:true,sha256:hash(bytes),bytes:bytes.length});return JSON.parse(bytes);}
const headSHA=process.env.Q_PORTS_HEAD_SHA??'fd5e1335bc224b040aa923374807ddcc9ffe5883',accessorySHA=process.env.Q_PORTS_ACCESSORY_SHA??'ab94ce91bbb6be7a727fa910618d68c18984b239';
const clothSHA=process.env.Q_PORTS_CLOTH_SHA;
const base='docs/evidence/mira-assembly-v65/';
const head=gitJSON(headSHA,base+'head-registration/external-ports.json');
const neck=gitJSON(headSHA,base+'head-registration/external-neck-contract.json');
const accessories=gitJSON(accessorySHA,base+'accessory-registration/EXTERNAL_PORTS.json');
const cloth=clothSHA?gitJSON(clothSHA,base+'cloth-registration/EXTERNAL_PORTS.json'):localJSON('/workspace/scratch/e72662e3b71f/Q-cloth-registration-v65/'+base+'cloth-registration/EXTERNAL_PORTS.json');
const actor=createDetailedActor('npc');
// createDetailedActor animates once. Restore original bind transforms first.
for(const r of actor.rest){r.node.position.copy(r.position);r.node.rotation.copy(r.rotation);r.node.scale.copy(r.scale);}
actor.g.updateMatrixWorld(true);
const bones=new Map(actor.rest.map(r=>[r.node.name,r.node]));
const invChest=actor.chest.matrixWorld.clone().invert();
const findings=[];
const boneFrame=name=>new Matrix4().multiplyMatrices(invChest,bones.get(name).matrixWorld);
const frameName=p=>p.frame==='CHEST_LOCAL_M'?'chest':p.frame==='HEAD_LOCAL_M'?'head':p.frame==='HAND_LOCAL_M'?'hand-'+(p.id.endsWith('-R')?0:1):p.frame==='FOOT_LOCAL_M'?'foot-'+(p.id.endsWith('-R')?0:1):p.frame;
const distance=(a,b)=>Math.hypot(...a.map((x,i)=>x-b[i]));
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const frames={};
for(const name of ['chest','neck','head','hand-0','hand-1','knee-0','knee-1','foot-0','foot-1'])frames[name]=new Vector3().applyMatrix4(boneFrame(name)).toArray();
const portSummaries=[];
function normalizePort(p){
 const bone=frameName(p);if(!bones.has(bone))throw Error('Unknown frame '+bone);
 const matrix=boneFrame(bone),normalMatrix=new Matrix3().getNormalMatrix(matrix),factor=p.unit==='mm'?.001:1;
 let normalLengthError=0,tangentLengthError=0,normalTangentDot=0,weightSumError=0;
 const samples=p.orderedSamples.map((s,index)=>{
  const local=(s.positionM??s.position??s.positionMm).map(v=>v*factor);
  const weights=s.skinWeights??s.weights??s.boneWeights;
  if(![...local,...s.normal,...s.tangent].every(Number.isFinite))throw Error('Nonfinite port '+p.id);
  if(Object.values(weights).some(v=>!Number.isFinite(v)||v<0))throw Error('Invalid weight '+p.id);
  const bad=Object.keys(weights).filter(k=>!bones.has(k));if(bad.length)findings.push({id:'UNKNOWN_WEIGHT_BONE',port:p.id,index,bones:bad});
  const sum=Object.values(weights).reduce((a,b)=>a+b,0);weightSumError=Math.max(weightSumError,Math.abs(sum-1));
  normalLengthError=Math.max(normalLengthError,Math.abs(Math.hypot(...s.normal)-1));
  tangentLengthError=Math.max(tangentLengthError,Math.abs(Math.hypot(...s.tangent)-1));
  normalTangentDot=Math.max(normalTangentDot,Math.abs(dot(s.normal,s.tangent)));
  return {index,local,position:new Vector3(...local).applyMatrix4(matrix).toArray(),normal:new Vector3(...s.normal).applyMatrix3(normalMatrix).normalize().toArray(),tangent:new Vector3(...s.tangent).transformDirection(matrix).toArray(),weights,angleDegrees:s.angleDegrees};
 });
 const declaredOrigin=p.sharedCanonicalSource?.CHESTOriginM;
 const originErrorM=declaredOrigin?distance(declaredOrigin,frames[bone]):null;
 if(originErrorM>1e-9)findings.push({id:'FRAME_ORIGIN_MISMATCH',port:p.id,declaredOrigin,actual:frames[bone],originErrorM});
 if(Math.max(normalLengthError,tangentLengthError,normalTangentDot,weightSumError)>1e-7)findings.push({id:'INVALID_PORT_FRAME',port:p.id,normalLengthError,tangentLengthError,normalTangentDot,weightSumError});
 portSummaries.push({id:p.id,frame:bone,unit:p.unit,count:samples.length,kind:p.kind,normalLengthError,tangentLengthError,normalTangentDot,weightSumError,originErrorM,bones:[...new Set(samples.flatMap(s=>Object.keys(s.weights)))]});
 return {...p,bone,samples};
}
const heads=head.ports.map(normalizePort),clothes=cloth.ports.map(normalizePort),extra=accessories.ports.map(normalizePort);
const byId=new Map([...heads,...clothes,...extra].map(p=>[p.id,p]));
const pointSegment=(p,a,b)=>{const ab=b.map((v,i)=>v-a[i]),ap=p.map((v,i)=>v-a[i]),d=dot(ab,ab),u=d?Math.max(0,Math.min(1,dot(ap,ab)/d)):0,q=a.map((v,i)=>v+ab[i]*u);return {distance:distance(p,q),closest:q,u};};
const xz=p=>[p[0],p[2]];
function closed(points){const a=points.map(xz);if(distance(a[0],a.at(-1))>1e-9)a.push(a[0]);return a;}
function inside(p,polygon){let yes=false;for(let j=1;j<polygon.length;j++){const a=polygon[j-1],b=polygon[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
function contourClearance(inner,outer,{open=false}={}){
 const outer2=open?outer.map(xz):closed(outer),inner2=open?inner.map(xz):closed(inner);let best={distance:Infinity},outside=0;
 for(let i=0;i<inner2.length;i++){
  if(!open&&!inside(inner2[i],outer2))outside++;
  for(let j=1;j<outer2.length;j++){const e=pointSegment(inner2[i],outer2[j-1],outer2[j]);if(e.distance<best.distance)best={...e,direction:'inner-point-to-outer-segment',innerIndex:i,outerSegment:[j-1,j],innerPoint:inner2[i]};}
 }
 for(let i=0;i<outer2.length;i++)for(let j=1;j<inner2.length;j++){const e=pointSegment(outer2[i],inner2[j-1],inner2[j]);if(e.distance<best.distance)best={...e,direction:'outer-point-to-inner-segment',outerIndex:i,innerSegment:[j-1,j],outerPoint:outer2[i]};}
 return {innerSamples:inner2.length,outerSamples:outer2.length,minimumXZDistanceM:best.distance,witness:best,outsideSampleCount:open?null:outside,scope:'Independent sampled polylines in common CHEST bind frame; not a continuous or triangle-contact proof'};
}
const wrists=[];
for(const side of ['R','L']){
 const hand=byId.get(side+'-wrist'),bracer=byId.get('CLOTH-CUFF-BRACER-INNER-'+side),sleeve=byId.get('CLOTH-CUFF-CLOTH-'+side);
 const planeErrorM=Math.max(...hand.samples.flatMap(s=>bracer.samples.map(b=>Math.abs(s.position[1]-b.position[1]))));
 const clearance=contourClearance(hand.samples.map(s=>s.position),bracer.samples.map(s=>s.position));
 const weightMatch=hand.samples.every(s=>s.weights[hand.bone]===1)&&bracer.samples.every(s=>s.weights[hand.bone]===1);
 const yGap=sleeve.samples[0].local[1]-Math.max(...hand.samples.map(s=>s.local[1]));
 if(planeErrorM>1e-8||clearance.outsideSampleCount||!weightMatch)findings.push({id:'WRIST_PORT_MISMATCH',side,planeErrorM,clearance,weightMatch});
 wrists.push({side,planeErrorM,clearance,weightMatch,sleeveToWristOpeningM:yGap,skinToSleeveDirectWeld:false,longitudinalSkinUnderlapM:hand.longitudinalOverlapMm*.001,layer:'skin under bracer; sleeve under bracer, not a shared skin-cloth edge'});
}
const boots=[];
for(const side of ['R','L']){
 const boot=byId.get(side+'-trousers-to-boots'),top=byId.get('CLOTH-BOOT-UNDERLAP-TOP-'+side),bottom=byId.get('CLOTH-BOOT-UNDERLAP-BOTTOM-'+side);
 const y=boot.bootTopFootYmm*.001,lo=bottom.samples[0].local[1],hi=top.samples[0].local[1],s=(y-lo)/(hi-lo);
 const trouserMouth=bottom.samples.map((v,i)=>v.position.map((p,k)=>(1-s)*p+s*top.samples[i].position[k]));
 const clearance=contourClearance(trouserMouth,boot.samples.map(p=>p.position));
 const knee='knee-'+(side==='R'?0:1),foot=boot.bone;
 const footInKnee=new Vector3().applyMatrix4(new Matrix4().multiplyMatrices(bones.get(knee).matrixWorld.clone().invert(),bones.get(foot).matrixWorld)).toArray();
 const declared=boot.footToKneeTranslationMm.map(x=>x*.001),translationErrorM=distance(footInKnee,declared);
 const weightMatch=[...boot.samples,...top.samples,...bottom.samples].every(p=>p.weights[knee]===1);
 if(clearance.outsideSampleCount||translationErrorM>1e-9||!weightMatch)findings.push({id:'BOOT_PORT_MISMATCH',side,clearance,translationErrorM,weightMatch});
 const stations=boot.bootInnerStationsMm.map(([sy,rx,rz])=>{
  const t=(sy*.001-lo)/(hi-lo),pants=bottom.samples.map((p,i)=>p.position.map((v,k)=>(1-t)*v+t*top.samples[i].position[k]));
  const matrix=boneFrame(foot),ring=Array.from({length:513},(_,i)=>new Vector3(Math.sin(i/512*2*Math.PI)*rx*.001,sy*.001,Math.cos(i/512*2*Math.PI)*rz*.001).applyMatrix4(matrix).toArray());
  return {footY:sy*.001,...contourClearance(pants,ring)};
 });
 boots.push({side,footInKnee,translationErrorM,weightMatch,openingClearance:clearance,registeredEnvelopeStations:stations,overlapM:y-lo,exposedTrouserM:hi-y,scope:'Declared bind envelope and sampled port curves; both use knee weights. No posed surface or boot sole contact acceptance.'});
}
const neckRows=[];
const hp=byId.get('PORT-NECK-COLLAR');
for(const [end,y] of [['lower',neck.collar.lowerChestY],['upper',neck.collar.upperChestY]]){
 const cp=byId.get('CLOTH-NECK-'+end+'-inner'),sections=neck.collarZoneNeckSections;
 const f=(y-.76-sections[0].y)/(sections[1].y-sections[0].y);
 const rx=(1-f)*sections[0].rx+f*sections[1].rx,rz=(1-f)*sections[0].rz+f*sections[1].rz;
 // Evaluate the entire authored open collar sector, not merely its axes.
 const skin=Array.from({length:2049},(_,i)=>{const theta=(12+336*i/2048)*Math.PI/180;return [rx*Math.sin(theta),y,rz*Math.cos(theta)];});
 const clearance=contourClearance(skin,cp.samples.map(s=>s.position),{open:true});
 let minRayGap=Infinity,maxRayGap=-Infinity;
 for(const q of cp.samples){const theta=Math.atan2(q.position[0]/(end==='lower'?.1:.086),q.position[2]/(end==='lower'?.086:.083)),skinPoint=[rx*Math.sin(theta),y,rz*Math.cos(theta)];const gap=distance(q.position,skinPoint);minRayGap=Math.min(minRayGap,gap);maxRayGap=Math.max(maxRayGap,gap);}
 neckRows.push({end,y,skinSamples:skin.length,clearance,minSameParameterGapM:minRayGap,maxSameParameterGapM:maxRayGap,frontOpenDegrees:24,skinWeightBones:[...new Set(hp.samples.filter(p=>Math.abs(p.position[1]-y)<1e-8).flatMap(p=>Object.keys(p.weights)))]});
}
const cutPorts=heads.filter(p=>p.kind==='open'),cutSamples=cutPorts.flatMap(p=>p.samples);
const cutHeightErrorM=Math.max(...cutSamples.map(p=>Math.abs(p.position[1]-neck.skinCut.chestY)));
if(cutHeightErrorM>1e-9)findings.push({id:'NECK_CUT_FRAME_MISMATCH',cutHeightErrorM});
const missingReceiver={id:'MISSING_TORSO_SKIN_RECEIVER',ports:cutPorts.map(p=>p.id),counterpart:'body:neck-to-chest skin continuation',declaredPending:neck.pending[0],reason:'The four open skin cut curves name a receiver without a matched port/loop/normal/weights contract. Collar overlap is a separate layer and cannot satisfy this skin continuation.',existingRuntimeNeck:{source:'src/assets/characters/detailed-geometry.js',centreChestY:.618,radiiM:[.08,.12,.078],cutChestY:.55},scope:'Receiver registration required before claiming whole-person boundary coverage. No new geometry authored.'};
const q=(.55-.618)/.12,factor=Math.sqrt(1-q*q),oldRadii=[.08*factor,.078*factor];
missingReceiver.existingRuntimeNeck.analyticRadiiAtCutM=oldRadii;
missingReceiver.existingRuntimeNeck.axisDifferenceToAuthoredCutM=[neck.skinCut.radiiM[0]-oldRadii[0],neck.skinCut.radiiM[1]-oldRadii[1]];
findings.push(missingReceiver);
const report={at:new Date().toISOString(),reviewer:'/root',provisionalCloth:!clothSHA,sources,rig:{sourceCommit:'f2d051da18eb7267d98714ac968971e4731ba27c',boneCount:actor.rest.length,actorModelsSha256:hash(fs.readFileSync('src/actor-models.js')),geometrySha256:hash(fs.readFileSync('src/assets/characters/detailed-geometry.js')),chestBindOrigins:frames,rightIsNegativeX:frames['hand-0'][0]<0&&frames['foot-0'][0]<0,leftIsPositiveX:frames['hand-1'][0]>0&&frames['foot-1'][0]>0},portSummaries,wrists,boots,neck:{rows:neckRows,cutHeightErrorM,underlapM:neck.collar.lowerChestY-neck.skinCut.chestY,layerWeights:'skin neck/head vs cloth chest: intentional separate layers, posed gap not verified'},findings,newMeshes:0,scope:'Read-only independent external bind-port registration review. No triangle geometry, motion collision, rendering, visual or PS4-quality acceptance.'};
const filename=process.env.Q_PORTS_REVIEW_OUTPUT??(clothSHA?'REPORT.json':'REPORT_PROVISIONAL.json');fs.writeFileSync(new URL(filename,import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({file:filename,bones:report.rig.boneCount,ports:portSummaries.length,wrists:wrists.map(w=>({side:w.side,gapMm:w.clearance.minimumXZDistanceM*1000,outside:w.clearance.outsideSampleCount})),boots:boots.map(b=>({side:b.side,gapMm:b.openingClearance.minimumXZDistanceM*1000,outside:b.openingClearance.outsideSampleCount})),neck:neckRows.map(r=>({end:r.end,gapMm:r.clearance.minimumXZDistanceM*1000})),findings:findings.map(f=>f.id)}));
