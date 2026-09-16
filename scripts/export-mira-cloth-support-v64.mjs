import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import * as T from 'three';
import {createDetailedActor} from '../src/actor-models.js';
import {groundAt} from '../src/core.js';
import {FRAME,toOBJ,length,sub} from '../review/cloth-micro-v62/surfaces.mjs';
import {createSupportTopology,supportSurface} from '../review/cloth-support-v63/support.mjs';
import {measure,vertexNormals,quantile} from '../review/cloth-support-v63/measure.mjs';
import {createRowTopology,supportRows} from '../review/cloth-support-v64/support.mjs';
const out=new URL('../docs/evidence/mira-cloth-support-v64/',import.meta.url);await mkdir(out,{recursive:true});
const mesh=JSON.parse(await readFile(new URL('../docs/evidence/mira-cloth-micro-v62/meshes.json',import.meta.url))).find(m=>m.id==='P01-R');
const topology=createRowTopology(mesh),oldTopology=createSupportTopology(mesh),start=new Date().toISOString();let runOrdinal=0;
function run(before,height){
 let old,next,oldMs,nextMs;
 const a=()=>{const t=performance.now();old=supportSurface(oldTopology,before,{height});oldMs=performance.now()-t;};
 const b=()=>{const t=performance.now();next=supportRows(topology,before,{height});nextMs=performance.now()-t;};
 if(runOrdinal++%2){b();a();}else{a();b();}
 return {old,next,oldMs,nextMs};
}
const oldFixed=JSON.parse(await readFile(new URL('../docs/evidence/mira-cloth-support-v63/fixed.json',import.meta.url))),fixed=[];
for(const f of oldFixed){const s=run(f.before,()=>0);fixed.push({name:f.name,before:f.before,v63:s.old.positions,after:s.next.positions,
  baseline:measure(mesh,s.old.positions,f.before,()=>0),candidate:measure(mesh,s.next.positions,f.before,()=>0),active:s.next.active,
  v63Ms:s.oldMs,candidateMs:s.nextMs,pinResidual:s.next.maxPinResidual,
  v63EvidenceDelta:Math.max(...f.after.map((p,i)=>length(sub(p,s.old.positions[i]))))});
}
await writeFile(new URL('fixed.json',out),JSON.stringify(fixed,null,2)+'\n');
for(const f of fixed.filter(f=>f.active))await writeFile(new URL(f.name.replaceAll(' ','-')+'.obj',out),toOBJ({...mesh,id:f.name,positions:f.after,normals:vertexNormals(mesh,f.after)}));
const terrain=[{id:'flat',height:()=>0,origin:[0,0],yaw:0},{id:'cross-slope',height:(x,z)=>.15*x,origin:[2,3],yaw:.7},
 {id:'along-slope',height:(x,z)=>.15*z,origin:[2,3],yaw:0},{id:'diagonal-slope',height:(x,z)=>.12*x-.09*z,origin:[2,3],yaw:2.4},
 {id:'actual-spawn',height:groundAt,origin:[0,101],yaw:1.1}];
const sequences=[],selected=[];
for(const land of terrain)for(const hz of [30,60,120]){
 const actor=createDetailedActor('npc',{groundHeight:land.height});actor.g.updateMatrixWorld(true);const inverse=actor.chest.matrixWorld.clone().invert();
 const [x,z]=land.origin;actor.g.position.set(x,land.height(x,z),z);actor.g.rotation.y=land.yaw;
 let previous,previousOld;const frames=[];
 for(let f=0;f<=Math.round(1.2*hz);f++){
   const age=f/hz;actor.animate({dead:true,deathElapsed:age},1/hz);actor.g.updateMatrixWorld(true);
   const matrix=actor.chest.matrixWorld.clone().multiply(inverse);
   const before=mesh.positions.map(p=>new T.Vector3(...p).add(new T.Vector3(...FRAME.rootOffset)).applyMatrix4(matrix).toArray());
   const s=run(before,land.height),b=measure(mesh,s.old.positions,before,land.height),c=measure(mesh,s.next.positions,before,land.height);
   const frame={age,active:s.next.active,v63Min:b.minTriangleSampleGapM,afterMin:c.minTriangleSampleGapM,
     maxPinResidual:s.next.maxPinResidual,pinnedBelowFloor:s.next.pinnedBelowFloor,
     v63MaxStretch:b.edgeLengthRatio.max,v63MinStretch:b.edgeLengthRatio.min,maxStretch:c.edgeLengthRatio.max,minStretch:c.edgeLengthRatio.min,
     areaMin:c.triangleAreaRatio.min,quadDot:c.minWithinQuadNormalDot,v63QuadDot:b.minWithinQuadNormalDot,
     v63Step:previousOld?Math.max(...s.old.positions.map((p,i)=>length(sub(p,previousOld[i])))):0,
     afterStep:previous?Math.max(...s.next.positions.map((p,i)=>length(sub(p,previous[i])))):0,
     v63SolveMs:s.oldMs,solveMs:s.nextMs};frames.push(frame);
   if(hz===60&&[15,27,48,60].includes(f))selected.push({terrain:land.id,age,before,v63:s.old.positions,after:s.next.positions});
   previous=s.next.positions;previousOld=s.old.positions;
 }
 const active=frames.filter(f=>f.active),cpu=list=>({median:quantile(list,.5),p95:quantile(list,.95),max:Math.max(...list)});
 const summary={terrain:land.id,hz,frames,minimumV63:Math.min(...frames.map(f=>f.v63Min)),minimumAfter:Math.min(...frames.map(f=>f.afterMin)),
   maxV63Step:Math.max(...frames.map(f=>f.v63Step)),maxAfterStep:Math.max(...frames.map(f=>f.afterStep)),
   maxV63Stretch:Math.max(...frames.map(f=>f.v63MaxStretch)),maxStretch:Math.max(...frames.map(f=>f.maxStretch)),minStretch:Math.min(...frames.map(f=>f.minStretch)),
   minQuadDot:Math.min(...frames.map(f=>f.quadDot)),activeFrames:active.length,
   activeV63CPU:cpu(active.map(f=>f.v63SolveMs)),activeCandidateCPU:cpu(active.map(f=>f.solveMs))};
 sequences.push(summary);console.log(JSON.stringify({...summary,frames:undefined}));
}
const oldReport=JSON.parse(await readFile(new URL('../docs/evidence/mira-cloth-support-v63/sequences.json',import.meta.url)));
const v63ScalarDelta=Math.max(...sequences.flatMap((s,j)=>s.frames.flatMap((f,i)=>[Math.abs(f.v63Min-oldReport.sequences[j].frames[i].afterMin),Math.abs(f.v63Step-oldReport.sequences[j].frames[i].afterStep)])));
const paths=['src/actor-models.js','src/core.js','docs/evidence/mira-cloth-micro-v62/meshes.json','review/cloth-support-v63/support.mjs','review/cloth-support-v63/measure.mjs','review/cloth-support-v64/support.mjs','scripts/export-mira-cloth-support-v64.mjs'];
const sources=[];for(const path of paths){const b=await readFile(new URL('../'+path,import.meta.url));sources.push({path,bytes:b.length,sha256:createHash('sha256').update(b).digest('hex')});}
const report={startedAt:start,endedAt:new Date().toISOString(),base:'dac1747bd13d64bb41e650c89c77df54bd0309b8',sources,
  referenceMesh:{vertices:153,triangles:256},support:{nodes:51,edges:topology.edges.length,bendLinks:topology.bend.length,iterations:32,finalCurveContactSweeps:8},
  v63ScalarDelta,measurement:'alternating evaluation order, one host run; no device benchmark',sequences};
await writeFile(new URL('sequences.json',out),JSON.stringify(report,null,2)+'\n');
await writeFile(new URL('selected.json',out),JSON.stringify(selected,null,2)+'\n');
console.log(JSON.stringify({v63ScalarDelta,at:report.endedAt,fixed:fixed.map(({before,v63,after,...f})=>f)},null,2));
