import{mkdir,readFile,writeFile}from'node:fs/promises';
import{createHash}from'node:crypto';
import{fileURLToPath}from'node:url';
import{performance}from'node:perf_hooks';
import*as T from'three';
import{buildAssembly,partMesh,toOBJ,PATCHES,STATIONS,TANGENTS,evaluate,sub,length}from'../review/head-micro-v63/surfaces.mjs';
import{inspect,assertAssembly}from'../review/head-micro-v63/inspect.mjs';
import{HEAD_ATTRIBUTES,HEAD_INDICES}from'../src/assets/characters/identity-head-data.js';
import{buildActorGeometry}from'../src/assets/characters/detailed-geometry.js';
import{createDetailedActor}from'../src/actor-models.js';
const root=fileURLToPath(new URL('../',import.meta.url)),out=process.argv[2]||root+'docs/evidence/mira-head-micro-v63';
await mkdir(out,{recursive:true});
const began=performance.now(),mesh=buildAssembly(),constructMs=performance.now()-began,geometry=inspect(mesh);assertAssembly(geometry);
await writeFile(out+'/assembly.obj',toOBJ(mesh));
for(const{id}of PATCHES)await writeFile(out+'/'+id+'.obj',toOBJ(partMesh(mesh,id),id));
await writeFile(out+'/assembly.json',JSON.stringify(mesh)+'\n');
const oldPoints=HEAD_ATTRIBUTES.map(v=>new T.Vector3(...v.slice(0,3))),triangles=[];
for(let i=0;i<HEAD_INDICES.length;i+=3)triangles.push(new T.Triangle(...HEAD_INDICES.slice(i,i+3).map(j=>oldPoints[j])));
const nearest=mesh.positions.map(p=>{const q=new T.Vector3(...p),target=new T.Vector3();let min=Infinity;for(const tri of triangles){tri.closestPointToPoint(q,target);min=Math.min(min,target.distanceTo(q));}return min;}).sort((a,b)=>a-b);
const rayProbe=[[.046,.050,.109],[-.046,.050,.109],[0,-.045,.134],[0,.005,.142]].map(target=>{
 const start=new T.Vector3(target[0],target[1],.5),direction=new T.Vector3(0,0,-1),ray=new T.Ray(start,direction);let hits=0;
 for(const t of mesh.indices){const p=ray.intersectTriangle(...t.map(i=>new T.Vector3(...mesh.positions[i])),false,new T.Vector3());if(p&&p.z>=target[2])hits++;}
 return{target,hits,scope:'front ray to existing left/right eye centre, mouth centre or nose; no complete facial occlusion guarantee'};
});
if(rayProbe.some(p=>p.hits))throw new Error('assembly intrudes on excluded face landmark ray');
const bind=buildActorGeometry('npc');bind.updateMatrixWorld(true);const head=bind.getObjectByName('head'),neck=bind.getObjectByName('neck');
const headBind=head.matrixWorld.clone(),rig={headLocal:head.position.toArray(),neckLocal:neck.position.toArray(),headWorld:new T.Vector3().setFromMatrixPosition(headBind).toArray(),neckWorld:new T.Vector3().setFromMatrixPosition(neck.matrixWorld).toArray(),headToNeck:head.position.length(),missingBones:0};
const poses=[];
for(const fixture of[{id:'idle',state:{},dt:.1,expected:'idle'},{id:'walking',state:{x:.23,z:0,moving:true},dt:.1,expected:'walk'},{id:'hit',state:{state:'stagger',timer:.175,stagger:.35,hp:20},dt:.05,expected:'hit'},{id:'death-.45',state:{dead:true,deathElapsed:.45},dt:0,expected:'death'}]){
 const actor=createDetailedActor('npc');actor.animate(fixture.state,fixture.dt);actor.g.updateMatrixWorld(true);
 if(actor.motion.state!==fixture.expected)throw new Error('fixture did not exercise intended actual actor state: '+fixture.id);
 const M=actor.head.matrixWorld,positions=mesh.positions.map(p=>new T.Vector3(...p).applyMatrix4(M).toArray()),normalMatrix=new T.Matrix3().getNormalMatrix(M);
 const normals=mesh.normals.map(n=>new T.Vector3(...n).applyMatrix3(normalMatrix).normalize().toArray());
 // Test a separately evaluated duplicate on each side of all six analytical seams
 // after the actual actor transform, not just shared-index self-equality.
 let seamPosition=0,seamNormal=0;
 for(const seam of mesh.seams)for(let i=0;i<=8;i++){
  const a=evaluate(PATCHES[seam.station-1],i/8,1),b=evaluate(PATCHES[seam.station],i/8,0);
  seamPosition=Math.max(seamPosition,new T.Vector3(...a.position).applyMatrix4(M).distanceTo(new T.Vector3(...b.position).applyMatrix4(M)));
  seamNormal=Math.max(seamNormal,new T.Vector3(...a.normal).applyMatrix3(normalMatrix).normalize().distanceTo(new T.Vector3(...b.normal).applyMatrix3(normalMatrix).normalize()));
 }
 poses.push({id:fixture.id,requested:fixture,actualMotion:actor.motion.state,headWorld:M.elements,maxSeamPositionM:seamPosition,maxSeamNormalVectorError:seamNormal,finite:positions.flat().every(Number.isFinite),minWorldY:Math.min(...positions.map(p=>p[1])),minNormalLength:Math.min(...normals.map(n=>length(n))),scope:'head bone weight1 only; unchanged runtime head remains separate; no integration, mouth blendshape or neck weld'});
}
const hollow=[1,5].map(i=>{const a=evaluate(PATCHES[i],.5,0).position,b=evaluate(PATCHES[i],.5,1).position,p=evaluate(PATCHES[i],.5,.5).position;return{id:PATCHES[i].id,midpointDeviationFromEndpointChordM:p.map((v,k)=>v-(a[k]+b[k])/2),meaning:'authored submalar longitudinal profile at width .5; not image-calibrated depth'};});
const paths=['review/head-micro-v63/surfaces.mjs','review/head-micro-v63/inspect.mjs','review/head-micro-v63/plot.py','scripts/export-mira-head-micro-v63.mjs','tests/mira-head-micro-v63.test.mjs','src/assets/characters/identity-head-data.js','src/assets/characters/detailed-geometry.js','src/actor-models.js','docs/evidence/character-reference-v60/references/mira-head-views-v1.png','docs/evidence/character-reference-v60/references/mira-complete-six-views-v1.png','docs/evidence/mira-micro-v61/references/head/mira-face-patches-F01-F05-F09-v2.png','docs/evidence/mira-micro-v61/review/head-three-v1/REVIEW.md','docs/evidence/mira-head-micro-v63/references/mira-F07-F11-v1.png','docs/evidence/mira-head-micro-v63/references/mira-F07-F11-v2.png'];
const sources=[];for(const path of paths){const b=await readFile(root+path);sources.push({path,bytes:b.length,sha256:createHash('sha256').update(b).digest('hex')});}
const partBounds=PATCHES.map(({id})=>{const p=partMesh(mesh,id),min=[0,1,2].map(k=>Math.min(...p.positions.map(v=>v[k]))),max=[0,1,2].map(k=>Math.max(...p.positions.map(v=>v[k])));return{id,vertices:p.positions.length,triangles:p.indices.length,minM:min,maxM:max,spanM:sub(max,min),meaning:'authored sampled bounds, not a generated-image measurement'};});
const report={createdAt:new Date().toISOString(),base:'22d1d041dd6aef60de7764b1eebf6cf78028c857',sources,geometry,partBounds,constructMs,
 oldHeadDistance:{samples:nearest.length,minM:nearest[0],medianM:nearest[Math.floor(nearest.length*.5)],p95M:nearest[Math.floor(nearest.length*.95)],maxM:nearest.at(-1),meaning:'candidate vertices to old indexed MakeHuman-derived triangles, not generated reference fidelity; no requirement to preserve old shape'},
 rig,poses,rayProbe,hollow,interfaces:{stationControls:STATIONS,sharedTangents:TANGENTS,weight:'head:1',neck:'unwelded, no neck source or eye/hair changes',UV:'new continuous chart, not original skin UV'},
 limits:{completeHead:false,expressionApproved:false,exactReferenceReconstruction:false,runtimeAdopted:false,webgl:false,device:false,newRuntimeBytes:0,geometryOnlyBytes:mesh.positions.length*(3+3+2+4+4)*4+mesh.indices.length*3*2,byteMeaning:'estimated typed Float32 attributes incl4skinindices/4weights+Uint16 indices; current author JSON is CPU arrays, GPU allocation not measured'}};
await writeFile(out+'/metrics.json',JSON.stringify(report,null,2)+'\n');
await writeFile(out+'/plot-data.json',JSON.stringify({mesh,oldHead:{positions:oldPoints.map(v=>v.toArray()),indices:triangles.map((_,i)=>HEAD_INDICES.slice(i*3,i*3+3))},rig})+'\n');
console.log(JSON.stringify({geometry,oldHeadDistance:report.oldHeadDistance,rig,poses:poses.map(p=>({id:p.id,actualMotion:p.actualMotion,maxSeamPositionM:p.maxSeamPositionM,maxSeamNormalVectorError:p.maxSeamNormalVectorError})),hollow,constructMs}));
