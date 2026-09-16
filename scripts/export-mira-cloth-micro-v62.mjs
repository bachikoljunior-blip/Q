import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {performance} from 'node:perf_hooks';
import * as T from 'three';
import {buildActorGeometry} from '../src/assets/characters/detailed-geometry.js';
import {PARTS,FRAME,buildPart,toOBJ,evaluate,sub,dot,cross,length} from '../review/cloth-micro-v62/surfaces.mjs';

const out=fileURLToPath(new URL('../docs/evidence/mira-cloth-micro-v62/',import.meta.url));
await mkdir(out,{recursive:true});
const sha=b=>createHash('sha256').update(b).digest('hex');
const sourcePaths=[
 'docs/evidence/mira-micro-v61/references/cloth/mira-cloth-three-micro-parts-v2.png',
 'docs/evidence/mira-micro-v61/review/cloth-three-v1/REVIEW.md',
 'docs/evidence/mira-micro-v61/review/cloth-three-v1/review.json',
 'docs/evidence/mira-micro-v61/planning/cloth/types.json',
 'src/assets/characters/detailed-geometry.js',
 'review/cloth-micro-v62/surfaces.mjs',
 'scripts/export-mira-cloth-micro-v62.mjs',
];
const sources=[];for(const path of sourcePaths){const b=await readFile(new URL('../'+path,import.meta.url));sources.push({path,bytes:b.length,sha256:sha(b)});}
const actor=buildActorGeometry('npc');actor.updateMatrixWorld(true);
const bones={};actor.traverse(n=>{if(n.isBone)bones[n.name]=n.matrixWorld.clone();});
const quantile=(xs,q)=>[...xs].sort((a,b)=>a-b)[Math.floor((xs.length-1)*q)];
const metrics=[];const built=[];
for(const spec of PARTS){
 const started=performance.now(),mesh=buildPart(spec),buildMs=performance.now()-started;
 built.push(mesh);
 const edgeCounts=new Map(),areas=[],agreements=[],errors=[],uvAreas=[],anisotropy=[];
 for(const t of mesh.indices){
   const p=t.map(i=>mesh.positions[i]),a=sub(p[1],p[0]),b=sub(p[2],p[0]),n=cross(a,b),nl=length(n);areas.push(nl/2);
   for(const i of t)agreements.push(dot(n,mesh.normals[i])/nl);
   for(let j=0;j<3;j++){const pair=[t[j],t[(j+1)%3]].sort((x,y)=>x-y).join(':');edgeCounts.set(pair,(edgeCounts.get(pair)||0)+1);}
   for(const w of [[1/3,1/3,1/3],[.5,.5,0],[0,.5,.5],[.5,0,.5]]){
     const param=[0,1].map(k=>t.reduce((s,i,j)=>s+w[j]*mesh.parameters[i][k],0));
     const plane=[0,1,2].map(k=>p.reduce((s,a,j)=>s+w[j]*a[k],0));
     errors.push(length(sub(evaluate(spec,...param).position,plane)));
   }
   const uv=t.map(i=>mesh.uvMetres[i]),du=sub(uv[1],uv[0]),dv=sub(uv[2],uv[0]),det=du[0]*dv[1]-du[1]*dv[0];uvAreas.push(det/2);
   const U=a.map((x,k)=>(x*dv[1]-b[k]*du[1])/det),V=b.map((x,k)=>(x*du[0]-a[k]*dv[0])/det);
   const E=dot(U,U),F=dot(U,V),G=dot(V,V),disc=Math.sqrt((E-G)**2+4*F*F);
   anisotropy.push(Math.sqrt((E+G+disc)/(E+G-disc)));
 }
 const bindResidual=[];let missingBones=0;
 for(let i=0;i<mesh.positions.length;i++){
   const world=new T.Vector3(...mesh.positions[i]).add(new T.Vector3(...FRAME.rootOffset)),outP=new T.Vector3();
   for(const [bone,w]of Object.entries(mesh.skinWeights[i])){
     if(!bones[bone]){missingBones++;continue;}
     outP.addScaledVector(world.clone().applyMatrix4(bones[bone].clone().invert()).applyMatrix4(bones[bone]),w);
   }bindResidual.push(outP.distanceTo(world));
 }
 metrics.push({id:mesh.id,vertices:mesh.positions.length,triangles:mesh.indices.length,buildMs,
   boundsChest:Object.fromEntries(['min','max'].map((name)=>[name,[0,1,2].map(k=>Math[name](...mesh.positions.map(p=>p[k])))])),
   surfaceAreaM2:areas.reduce((s,x)=>s+x,0),triangleAreaMinM2:Math.min(...areas),minTriangleVertexNormalDot:Math.min(...agreements),
   boundaryEdges:[...edgeCounts.values()].filter(x=>x===1).length,nonManifoldEdges:[...edgeCounts.values()].filter(x=>x>2).length,
   euler:mesh.positions.length-edgeCounts.size+mesh.indices.length,
   sampledAnalyticalSurfaceDistanceM:{p95:quantile(errors,.95),max:Math.max(...errors),sampleCount:errors.length,scope:'four same-param triangle samples; not global Hausdorff error'},
   uvMetreChart:{signedAreaMin:Math.min(...uvAreas),signedAreaMax:Math.max(...uvAreas),anisotropyP95:quantile(anisotropy,.95),anisotropyMax:Math.max(...anisotropy),textureApplied:false},
   actualNativeBoneBind:{missingBones,maxResidualM:Math.max(...bindResidual)},
   enclosedVolumeM3:null,volumeReason:'one open zero-thickness surface; enclosed volume is undefined, not a watertight garment',
   neighbourWeld:'unimplemented; only each part internal grid and its four corners share indices',
 });
 await writeFile(out+mesh.id+'.obj',toOBJ(mesh,{rootFrame:true}));
}
const report={at:new Date().toISOString(),baseCommit:'3fcd0aa8b6e4825e8ac468800845c344152759b3',source:sources,frame:FRAME,
 scope:'three isolated open surface prototypes, CPU geometry only; no image reconstruction accuracy or garment/animation/render approval',
 totalVertices:metrics.reduce((s,x)=>s+x.vertices,0),totalTriangles:metrics.reduce((s,x)=>s+x.triangles,0),parts:metrics,
 bones:Object.fromEntries(Object.entries(bones).filter(([name])=>['pelvis','spine','chest','arm-0','elbow-0','hand-0'].includes(name)).map(([name,m])=>[name,new T.Vector3().setFromMatrixPosition(m).toArray()])),
 gpu:{runtimeImports:0,newRuntimeDraws:0,benchmark:'not performed; prototypes not loaded by game'},
};
await writeFile(out+'meshes.json',JSON.stringify(built,null,2)+'\n');
await writeFile(out+'metrics.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({at:report.at,totalVertices:report.totalVertices,totalTriangles:report.totalTriangles,parts:metrics},null,2));
