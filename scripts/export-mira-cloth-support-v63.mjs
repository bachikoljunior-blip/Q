import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import * as T from 'three';
import {createDetailedActor} from '../src/actor-models.js';
import {groundAt} from '../src/core.js';
import {FRAME,toOBJ,length,sub} from '../review/cloth-micro-v62/surfaces.mjs';
import {createSupportTopology,supportSurface} from '../review/cloth-support-v63/support.mjs';
import {measure,vertexNormals,quantile} from '../review/cloth-support-v63/measure.mjs';
const out=new URL('../docs/evidence/mira-cloth-support-v63/',import.meta.url);await mkdir(out,{recursive:true});
const mesh=JSON.parse(await readFile(new URL('../docs/evidence/mira-cloth-micro-v62/meshes.json',import.meta.url))).find(m=>m.id==='P01-R');
const topology=createSupportTopology(mesh),start=new Date().toISOString();
function actorAt(height){const actor=createDetailedActor('npc',{groundHeight:height});actor.g.updateMatrixWorld(true);return {actor,inverse:actor.chest.matrixWorld.clone().invert()};}
function positionsFrom(a){a.actor.g.updateMatrixWorld(true);const matrix=a.actor.chest.matrixWorld.clone().multiply(a.inverse);return mesh.positions.map(p=>new T.Vector3(...p).add(new T.Vector3(...FRAME.rootOffset)).applyMatrix4(matrix).toArray());}
function run(positions,height,iterations=64){const t=performance.now();const s=supportSurface(topology,positions,{height,iterations});return {...s,solveMs:performance.now()-t};}
const fixtures=[
 {name:'idle 2s',frames:120,make:()=>({moving:false})},
 {name:'walk 2m/s 1s',frames:60,make:f=>({moving:true,x:0,z:f/30,angle:0})},
 {name:'turn right .6rad 1s',frames:60,make:f=>({moving:false,angle:-f*.01})},
 {name:'sealed canonical',frames:1,make:()=>({state:'sealed'})},
 {name:'death .45s explicit',frames:1,make:()=>({dead:true,deathElapsed:.45})},
 {name:'death 1s explicit',frames:1,make:()=>({dead:true,deathElapsed:1})},
];
const fixed=[];
for(const fixture of fixtures){const a=actorAt(()=>0);
 for(let f=0;f<fixture.frames;f++){const state=fixture.make(f);a.actor.g.position.set(state.x||0,0,state.z||0);a.actor.g.rotation.y=state.angle||0;a.actor.animate(state,fixture.frames===1?0:1/60);}
 const before=positionsFrom(a),s=run(before,()=>0);
 fixed.push({name:fixture.name,motion:a.actor.motion.state,active:s.active,solveMs:s.solveMs,pinResidual:s.maxPinResidual,
   baseline:measure(mesh,before,before,()=>0),candidate:measure(mesh,s.positions,before,()=>0),before,after:s.positions});
}
await writeFile(new URL('fixed.json',out),JSON.stringify(fixed,null,2)+'\n');
for(const f of fixed.filter(x=>x.active)){const m={...mesh,id:f.name.replaceAll(' ','-'),positions:f.after,normals:vertexNormals(mesh,f.after)};await writeFile(new URL(m.id+'.obj',out),toOBJ(m));}
const terrain=[{id:'flat',height:()=>0,origin:[0,0],yaw:0},{id:'cross-slope',height:(x,z)=>.15*x,origin:[2,3],yaw:.7},
 {id:'along-slope',height:(x,z)=>.15*z,origin:[2,3],yaw:0},{id:'diagonal-slope',height:(x,z)=>.12*x-.09*z,origin:[2,3],yaw:2.4},
 {id:'actual-spawn',height:groundAt,origin:[0,101],yaw:1.1}];
const sequences=[],selected=[];
for(const land of terrain)for(const hz of [30,60,120]){
 const a=actorAt(land.height),[x,z]=land.origin;a.actor.g.position.set(x,land.height(x,z),z);a.actor.g.rotation.y=land.yaw;
 const frames=[];let previous,previousBase,previousActive;const times=[];
 for(let f=0;f<=Math.round(1.2*hz);f++){
   const age=f/hz;a.actor.animate({dead:true,deathElapsed:age},1/hz);const before=positionsFrom(a),s=run(before,land.height);times.push(s.solveMs);
   const b=measure(mesh,before,before,land.height),c=measure(mesh,s.positions,before,land.height);
   const frame={age,active:s.active,beforeMin:b.minTriangleSampleGapM,afterMin:c.minTriangleSampleGapM,
     maxPinResidual:s.maxPinResidual,pinnedBelowFloor:s.pinnedBelowFloor,maxStretch:c.edgeLengthRatio.max,minStretch:c.edgeLengthRatio.min,
     areaMin:c.triangleAreaRatio.min,areaMax:c.triangleAreaRatio.max,quadDot:c.minWithinQuadNormalDot,
     beforeStep:previousBase?Math.max(...before.map((p,i)=>length(sub(p,previousBase[i])))):0,
     afterStep:previous?Math.max(...s.positions.map((p,i)=>length(sub(p,previous[i])))):0,
     contactChanged:previousActive!==undefined&&previousActive!==s.active,solveMs:s.solveMs};frames.push(frame);
   if(hz===60&&[0,15,27,48,60].includes(f))selected.push({terrain:land.id,age,origin:land.origin,yaw:land.yaw,before,after:s.positions});
   previous=s.positions;previousBase=before;previousActive=s.active;
 }
 sequences.push({terrain:land.id,hz,origin:land.origin,yaw:land.yaw,frames,
   minimumBefore:Math.min(...frames.map(f=>f.beforeMin)),minimumAfter:Math.min(...frames.map(f=>f.afterMin)),
   maxBeforeStep:Math.max(...frames.map(f=>f.beforeStep)),maxAfterStep:Math.max(...frames.map(f=>f.afterStep)),
   maxStretch:Math.max(...frames.map(f=>f.maxStretch)),minStretch:Math.min(...frames.map(f=>f.minStretch)),
   minQuadDot:Math.min(...frames.map(f=>f.quadDot)),cpuMs:{median:quantile(times,.5),p95:quantile(times,.95),max:Math.max(...times)}});
 console.log(JSON.stringify({...sequences.at(-1),frames:undefined}));
}
const old=JSON.parse(await readFile(new URL('../docs/evidence/mira-cloth-micro-v62/pose-probe.json',import.meta.url)));
const oldPoseExactMax=Math.max(...fixed.flatMap((f,j)=>f.before.map((p,i)=>length(sub(p,old.poses[j].parts.find(p=>p.id==='P01-R').positions[i])))));
const sourcePaths=['src/actor-models.js','src/core.js','review/cloth-micro-v62/surfaces.mjs','docs/evidence/mira-cloth-micro-v62/meshes.json','review/cloth-support-v63/support.mjs','review/cloth-support-v63/measure.mjs','scripts/export-mira-cloth-support-v63.mjs'];
const sources=[];for(const path of sourcePaths){const b=await readFile(new URL('../'+path,import.meta.url));sources.push({path,bytes:b.length,sha256:createHash('sha256').update(b).digest('hex')});}
const report={startedAt:start,endedAt:new Date().toISOString(),baseCommit:'22d1d041dd6aef60de7764b1eebf6cf78028c857',sources,
  mesh:{vertices:mesh.positions.length,triangles:mesh.indices.length,topPins:topology.pins,edges:topology.edges.length,bendLinks:topology.bend.length},
  sameSixPoseBaselineMaxDeltaM:oldPoseExactMax,iterations:64,clearanceM:.003,interpretation:'quasistatic support, no inertia or temporal state; not natural cloth or runtime adoption',sequences};
await writeFile(new URL('sequences.json',out),JSON.stringify(report,null,2)+'\n');
await writeFile(new URL('selected.json',out),JSON.stringify(selected,null,2)+'\n');
console.log(JSON.stringify({fixed:fixed.map(({before,after,...f})=>f),baselineExactMax:oldPoseExactMax,at:report.endedAt},null,2));
