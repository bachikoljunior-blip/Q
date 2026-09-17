import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { registerHooks } from 'node:module';
import { fileURLToPath } from 'node:url';
import * as T from 'three';
import { createDetailedActor } from '../../../../src/actor-models.js';
import { Game, groundAt, heightAt } from '../../../../src/core.js';
import { createStaffAttachment } from '../../../../review/staff-attachment-v65/attachment.mjs';

// Independent technical check: uses no author verify function or saved result.
// The real SceneView constructor/update run in Node; its renderer and browser
// asset loaders are doubles. This neither opens a GL context nor renders pixels.
const started = new Date().toISOString(), timer = performance.now();
const repo = fileURLToPath(new URL('../../../../', import.meta.url));
const candidate = process.argv[2] || '51f105b0f8a7834f498c24ae5c783c669776f4b4';
assert(/^[0-9a-f]{40}$/.test(candidate));
const sourceFiles=['review/staff-attachment-v65/attachment.mjs','src/scene.js','src/actor-models.js','src/assets/characters/detailed-geometry.js','review/staff-v63/assembly.mjs'];
const sourceHashes={};
for(const p of sourceFiles){const actual=await readFile(new URL('../../../../'+p,import.meta.url));const expected=execFileSync('git',['show',`${candidate}:${p}`],{cwd:repo});assert(actual.equals(expected),`Working file is not fixed candidate: ${p}`);sourceHashes[p]=createHash('sha256').update(actual).digest('hex');}
const output = { started, fixedCandidate: candidate,
  sourceBase: 'bc761f25aae76209d26623b509f97e1f3a5a12ca',
  evidence: 'Native CPU scene/bone/skin matrices, with explicit renderer and asset-loader doubles; no GL, pixels, grasp surfaces or device-performance acceptance.',
  cases: [], defects: [], negatives: [], order: {}, totals: {frames:0,partPlacements:0,skinSamples:0,maxGripGapM:0,maxTargetGapM:0,maxGroundGapM:0,maxRigidDistanceErrorM:0,maxJointLengthErrorM:0,maxRepeatMatrixError:0} };
const V = (...x) => new T.Vector3(...x), handGrip=V(0,-.074,-.044), staffGrip=V(0,1.135,0), staffOrigin=V(-.46,0,.22);
const near=(actual,expected,tol=1e-9)=>assert(Math.abs(actual-expected)<=tol,`${actual} != ${expected}`);
const arraysEqual=(a,b)=>assert.deepEqual(a,b);
const finiteMatrix=m=>m.elements.every(Number.isFinite);
const matrixError=(a,b)=>Math.max(...a.elements.map((v,i)=>Math.abs(v-b.elements[i])));
function transform(p,node){return p.clone().applyMatrix4(node.matrixWorld);}
function rotationSnapshot(a){return [a.arms[0],a.elbows[0],a.hands[0]].map(n=>n.quaternion.toArray());}
function poseSnapshot(a){return a.rest.map(({node})=>({p:node.position.toArray(),s:node.scale.toArray(),q:node.quaternion.toArray()}));}
function restSnapshot(a){return a.rest.map(r=>({name:r.node.name,p:r.position.toArray(),s:r.scale.toArray(),q:r.rotation.toArray()}));}
function byteHash(root,filter=()=>true){const h=createHash('sha256');root.traverse(n=>{if(!n.isMesh||!filter(n))return;h.update(n.name);for(const [key,a]of Object.entries(n.geometry.attributes).sort()){h.update(key);h.update(Buffer.from(a.array.buffer,a.array.byteOffset,a.array.byteLength));}if(n.geometry.index){const a=n.geometry.index;h.update(Buffer.from(a.array.buffer,a.array.byteOffset,a.array.byteLength));}});return h.digest('hex');}
function skinState(a){const skins=[];a.g.traverse(n=>{if(n.isSkinnedMesh)skins.push(n);});const h=createHash('sha256');for(const skin of skins){for(const name of ['skinWeight','skinIndex']){const x=skin.geometry.attributes[name];h.update(Buffer.from(x.array.buffer,x.array.byteOffset,x.array.byteLength));}h.update(JSON.stringify([skin.bindMatrix.toArray(),skin.skeleton.bones.map(b=>b.name),skin.skeleton.boneInverses.map(m=>m.toArray())]));}return {skins,hash:h.digest('hex')};}
function samplePoints(part){const p=part.geometry.attributes.position,n=p.count;return [...new Set([0,Math.floor(n*.17),Math.floor(n*.39),Math.floor(n*.68),n-1])].map(i=>V().fromBufferAttribute(p,i).applyMatrix4(part.matrix));}

async function realScene(){
  const url=new URL('../../../../src/scene.js',import.meta.url).href;
  const data=s=>'data:text/javascript,'+encodeURIComponent(s);
  const renderer=data(`export * from ${JSON.stringify(import.meta.resolve('three'))};export class WebGLRenderer{constructor(){this.shadowMap={};}setPixelRatio(){}setSize(){}render(scene,camera){if(scene.matrixWorldAutoUpdate)scene.updateMatrixWorld();if(camera.parent===null&&camera.matrixWorldAutoUpdate)camera.updateMatrixWorld();}dispose(){}}`);
  const stubs={'./vault-textures.js':['loadVaultTextures','{}'],'./environment-assets.js':['loadEnvironmentTextures','{}'],'./forest-assets.js':['loadForestTextures','{}'],'./sky-assets.js':['loadSkySource','null'],'./skin-assets.js':['loadSkinTexture','null']};
  const hooks=registerHooks({resolve(spec,ctx,next){if(ctx.parentURL===url){if(spec==='three')return{url:renderer,shortCircuit:true};if(stubs[spec]){const [fn,value]=stubs[spec];return{url:data(`export function ${fn}(){return Promise.resolve(${value});}`),shortCircuit:true};}}return next(spec,ctx);}});
  let SceneView;try{({SceneView}=await import(url));}finally{hooks.deregister();}
  Object.assign(globalThis,{innerWidth:1280,innerHeight:720,devicePixelRatio:1,addEventListener(){}});
  return new SceneView({},new Game(),{quality:'low'});
}

function checkFrame(a,attachment,scene,terrain,baseline,label){
  const before=poseSnapshot(a),result=attachment.update();assert.equal(result.ok,true,`${label}: ${result.reason}`);
  scene.updateMatrixWorld(true);const staff=attachment.staff;
  assert(finiteMatrix(staff.matrixWorld));assert.equal(staff.children.length,19);assert.equal(a.rest.length,41);
  const expected=staffOrigin.clone().applyMatrix4(a.g.matrixWorld);expected.y=terrain(expected.x,expected.z);expected.y+=1.135;
  const actualHand=transform(handGrip,a.hands[0]),actualStaff=transform(staffGrip,staff);
  const base=transform(V(),staff),top=transform(V(0,1.7,0),staff);
  const gripGap=actualHand.distanceTo(actualStaff),targetGap=actualStaff.distanceTo(expected),groundGap=Math.abs(base.y-terrain(base.x,base.z));
  assert(gripGap<1e-9);assert(targetGap<1e-9);assert(groundGap<1e-9);near(base.distanceTo(top),1.7);near(base.x,top.x);near(base.z,top.z);
  const chestInverse=a.chest.matrixWorld.clone().invert();
  const shoulder=a.arms[0].getWorldPosition(V()).applyMatrix4(chestInverse),elbow=a.elbows[0].getWorldPosition(V()).applyMatrix4(chestInverse),wrist=a.hands[0].getWorldPosition(V()).applyMatrix4(chestInverse);
  const lengthError=Math.max(Math.abs(shoulder.distanceTo(elbow)-.33),Math.abs(elbow.distanceTo(wrist)-.31));assert(lengthError<1e-9);
  const after=poseSnapshot(a);for(let i=0;i<after.length;i++){arraysEqual(after[i].p,before[i].p);arraysEqual(after[i].s,before[i].s);if(![a.arms[0],a.elbows[0],a.hands[0]].includes(a.rest[i].node))arraysEqual(after[i].q,before[i].q);}
  arraysEqual(restSnapshot(a),baseline.rest);assert.equal(skinState(a).hash,baseline.skinHash);
  for(const entry of baseline.parts){arraysEqual(entry.part.matrix.toArray(),entry.local);const localInverse=new T.Matrix4().fromArray(entry.local).invert();const world=entry.points.map(p=>p.clone().applyMatrix4(localInverse).applyMatrix4(entry.part.matrixWorld));for(let i=0;i<world.length;i++){assert(world[i].distanceTo(entry.points[i].clone().applyMatrix4(staff.matrixWorld))<1e-9);for(let j=i+1;j<world.length;j++){const e=Math.abs(world[i].distanceTo(world[j])-entry.points[i].distanceTo(entry.points[j]));assert(e<1e-9);output.totals.maxRigidDistanceErrorM=Math.max(output.totals.maxRigidDistanceErrorM,e);}}output.totals.partPlacements++;}
  for(const skin of baseline.skins){skin.skeleton.update();const pos=skin.geometry.attributes.position;for(const i of [0,Math.floor(pos.count/2),pos.count-1]){const p=V();skin.getVertexPosition(i,p);assert(p.toArray().every(Number.isFinite));output.totals.skinSamples++;}}
  const matrix=staff.matrixWorld.clone(),q=rotationSnapshot(a);for(let i=0;i<4;i++)assert.equal(attachment.update().ok,true);scene.updateMatrixWorld(true);
  const repeated=matrixError(staff.matrixWorld,matrix);assert(repeated<1e-10);arraysEqual(rotationSnapshot(a),q);
  const totals=output.totals;totals.frames++;totals.maxGripGapM=Math.max(totals.maxGripGapM,gripGap);totals.maxTargetGapM=Math.max(totals.maxTargetGapM,targetGap);totals.maxGroundGapM=Math.max(totals.maxGroundGapM,groundGap);totals.maxJointLengthErrorM=Math.max(totals.maxJointLengthErrorM,lengthError);totals.maxRepeatMatrixError=Math.max(totals.maxRepeatMatrixError,repeated);
  return {gripGapM:gripGap,targetGapM:targetGap,groundGapM:groundGap,chestScale:a.chest.scale.toArray()};
}
function baselineFor(a,x){const skin=skinState(a);return {rest:restSnapshot(a),skinHash:skin.hash,skins:skin.skins,staffHash:byteHash(x.staff),parts:x.staff.children.map(part=>({part,local:part.matrix.toArray(),points:samplePoints(part)}))};}

const view=await realScene();assert.equal(view.npc.g.parent,view.scene);arraysEqual(view.npc.g.position.toArray(),[7,heightAt(7,80),80]);near(view.npc.g.rotation.y,1.4);
const times=[0,.31,Math.PI/3.5,1.31,Math.PI/1.75,2.21,3*Math.PI/3.5,4.91,8.73];
for(const name of ['real-SceneView','flat','nested-affine-ancestors','root-affine','changed-parent-between-calls','body-scale']){
  const terrain=name==='real-SceneView'?groundAt:name==='flat'?()=>0:(x,z)=>.019*x-.013*z;
  const a=name==='real-SceneView'?view.npc:createDetailedActor('npc',{groundHeight:terrain});
  const scene=name==='real-SceneView'?view.scene:new T.Scene(),parent=new T.Group(),grand=new T.Group();
  if(name!=='real-SceneView'){scene.add(grand);grand.add(parent);parent.add(a.g);a.g.position.set(2,terrain(2,-3),-3);a.g.rotation.y=.37;}
  if(name==='nested-affine-ancestors'){grand.rotation.set(.025,-.41,.018);grand.scale.set(1.06,.97,1.02);parent.rotation.set(-.018,.76,.022);parent.scale.set(.97,1.04,1.07);}
  if(name==='root-affine'){a.g.scale.set(1.07,.97,1.03);a.g.rotation.set(.026,-.83,-.031);}
  const x=createStaffAttachment(a),baseline=baselineFor(a,x),rows=[];
  for(const [index,time]of times.entries()){
    a.time=time;
    if(name==='real-SceneView')view.update(0,false);else a.animate({moving:false},0);
    if(name==='body-scale')a.body.scale.set(1.04,.99,1.03);
    if(name==='changed-parent-between-calls'){parent.position.set(.03*index,0,-.02*index);parent.rotation.set(.01,.07*index,-.012);parent.scale.set(1+.003*index,1-.001*index,1+.002*index);}
    rows.push(checkFrame(a,x,scene,terrain,baseline,`${name}/${time}`));
  }
  assert.equal(byteHash(x.staff),baseline.staffHash);output.cases.push({name,frames:rows});x.dispose();assert.equal(x.staff.parent,null);assert.equal(x.update().reason,'disposed');x.dispose();
}

// Call order control: animation legitimately overwrites the candidate rotations.
// The adapter must be called AFTER the native pose and before drawing.
{
 const a=createDetailedActor('npc',{groundHeight:()=>0}),x=createStaffAttachment(a),s=new T.Scene();s.add(a.g);x.update();a.time=.71;a.animate({moving:false},0);s.updateMatrixWorld(true);
 const before=transform(handGrip,a.hands[0]).distanceTo(transform(staffGrip,x.staff));assert(before>.001);
 x.update();s.updateMatrixWorld(true);const after=transform(handGrip,a.hands[0]).distanceTo(transform(staffGrip,x.staff));assert(after<1e-9);
 const initial=x.staff.matrixWorld.clone(),initialQ=rotationSnapshot(a);for(let i=0;i<256;i++)assert(x.update().ok);const drift=matrixError(initial,x.staff.matrixWorld);assert(drift<1e-10);arraysEqual(rotationSnapshot(a),initialQ);
 output.order={beforeRequiredUpdateGapM:before,afterRequiredUpdateGapM:after,repeats:256,maxDrift:drift,contract:'animate -> adapter.update -> renderer matrix prefix; reverse order is unsupported'};x.dispose();
}

const negativeCases=[
 ['unreachable-terrain',({state})=>{state.y=20;},'unreachable'],
 ['nonfinite-terrain',({state})=>{state.y=NaN;},'invalid-ground-height'],
 ['zero-root-scale',({a})=>{a.g.scale.y=0;},'singular-or-reflected-frame'],
 ['reflected-parent',({parent})=>{parent.scale.x=-1;},'singular-or-reflected-frame'],
 ['nonfinite-parent',({parent})=>{parent.position.x=NaN;},'singular-or-reflected-frame'],
 ['unsupported-finite-hand-scale',({a})=>{a.hands[0].scale.z=1.02;},'unsupported-arm-scale'],
 ['undefined-heading',({a})=>{a.g.rotation.x=Math.PI/2;},'undefined-horizontal-heading'],
];
for(const [name,mutate,reason]of negativeCases){const state={y:0},a=createDetailedActor('npc',{groundHeight:()=>state.y}),parent=new T.Group();parent.add(a.g);const x=createStaffAttachment(a);assert(x.update().ok);mutate({a,parent,state});const q=rotationSnapshot(a),result=x.update();assert.equal(result.ok,false,name);assert.equal(result.reason,reason,name);assert.equal(x.staff.visible,false);arraysEqual(rotationSnapshot(a),q);state.y=0;parent.position.set(0,0,0);parent.scale.set(1,1,1);a.g.scale.set(1,1,1);a.g.rotation.set(0,0,0);a.animate({moving:false},0);const recovery=x.update();assert(recovery.ok);assert(x.staff.visible);assert(finiteMatrix(x.staff.matrixWorld));output.negatives.push({name,result,recovered:true});x.dispose();}

// Contract violations are reproduced without patching the source; serialise NaN
// as text so the evidence cannot be mistaken for JSON null or a valid zero.
for(const [name,mutate]of [
 ['nan-hand-scale',a=>{a.hands[0].scale.x=NaN;}],
 ['nan-elbow-scale',a=>{a.elbows[0].scale.z=NaN;}],
 ['nan-hand-translation',a=>{a.hands[0].position.y=NaN;}],
 ['changed-lower-length',a=>{a.hands[0].position.y=-.36;}],
 ['changed-upper-direction',a=>{a.elbows[0].position.set(.03,-.33,0);}],
]){const a=createDetailedActor('npc',{groundHeight:()=>0}),x=createStaffAttachment(a);assert(x.update().ok);mutate(a);const q=rotationSnapshot(a);let result;try{result=x.update();}catch(e){result={exception:String(e)};}
 const finding={name,result,visible:x.staff.visible,worldMatrixFinite:finiteMatrix(x.staff.matrixWorld),armRotationChanged:JSON.stringify(q)!==JSON.stringify(rotationSnapshot(a))};
 if(result.ok===true)output.defects.push(finding);else{assert.equal(result.ok,false);assert.equal(x.staff.visible,false);assert.equal(finding.armRotationChanged,false);assert.equal(finding.worldMatrixFinite,true);output.negatives.push({...finding,rejected:true});}
 a.animate({moving:false},0);assert(x.update().ok);assert(finiteMatrix(x.staff.matrixWorld));x.dispose();}

if(candidate!=='51f105b0f8a7834f498c24ae5c783c669776f4b4'){
 output.constructorCases=[];
 for(const [name,mutate,reason]of [
  ['initial-nan-hand-scale',a=>{a.hands[0].scale.x=NaN;},'nonfinite-arm-transform'],
  ['initial-infinite-elbow-position',a=>{a.elbows[0].position.z=Infinity;},'nonfinite-arm-transform'],
  ['initial-nan-arm-quaternion',a=>{a.arms[0].quaternion.x=NaN;},'nonfinite-arm-transform'],
  ['initial-changed-lower-length',a=>{a.hands[0].position.y=-.36;},'changed-arm-translations'],
 ]){const a=createDetailedActor('npc');mutate(a);const children=a.g.children.slice(),before=poseSnapshot(a);assert.throws(()=>createStaffAttachment(a),e=>e.message===reason);arraysEqual(a.g.children,children);arraysEqual(poseSnapshot(a),before);output.constructorCases.push({name,rejected:reason,actorUnchanged:true});}
 const a=createDetailedActor('npc',{groundHeight:()=>0}),x=createStaffAttachment(a);assert(x.update().ok);a.hands[0].quaternion.x=NaN;const before=poseSnapshot(a),result=x.update();assert.equal(result.reason,'nonfinite-arm-transform');assert.equal(result.ok,false);assert.equal(x.staff.visible,false);arraysEqual(poseSnapshot(a),before);assert(finiteMatrix(x.staff.matrixWorld));a.animate({moving:false},0);assert(x.update().ok);x.dispose();output.negatives.push({name:'nonfinite-hand-quaternion',result,recovered:true});
}

const changed=execFileSync('git',['diff','--name-status',output.sourceBase,output.fixedCandidate],{cwd:repo,encoding:'utf8'}).trim().split('\n');
assert(changed.every(line=>/^A\t(?:review\/staff-attachment-v65\/|tests\/staff-attachment-v65\.test\.mjs$|docs\/evidence\/mira-assembly-v65\/staff-attachment\/)/.test(line)));
output.scope={changedFiles:changed,runtimeSourceDelta:0,newGeometrySourceDelta:0,gameSaveDelta:0,boneRestDelta:0,sceneImportsAdapter:false,sourceEditsByReviewer:0,remoteOperations:0};
output.sourceHashes=sourceHashes;output.sourceMatchesFixedCandidate=true;
output.finished=new Date().toISOString();output.runSeconds=(performance.now()-timer)/1000;output.decision=output.defects.length?'repair-required-invalid-chain-handling':'conditional-cpu-adapter-only';
await writeFile(new URL(candidate==='51f105b0f8a7834f498c24ae5c783c669776f4b4'?'RESULT-initial.json':'RESULT-fixed.json',import.meta.url),JSON.stringify(output,(_k,v)=>typeof v==='number'&&!Number.isFinite(v)?String(v):v,2)+'\n');
console.log(JSON.stringify({decision:output.decision,totals:output.totals,negativeCases:output.negatives.length,defects:output.defects,order:output.order,runSeconds:output.runSeconds},(_k,v)=>typeof v==='number'&&!Number.isFinite(v)?String(v):v,2));
