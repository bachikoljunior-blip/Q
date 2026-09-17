import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {performance} from 'node:perf_hooks';
import {buildAssembly,NEW_PARTS} from '../review/cloth-join-v64/assembly.mjs';
import {metrics,validateSeams,properCrossings} from '../review/cloth-join-v64/inspect.mjs';
import {probePoses} from '../review/cloth-join-v64/pose-probe.mjs';
import {toOBJ} from '../review/cloth-micro-v62/surfaces.mjs';
const out=new URL('../docs/evidence/mira-cloth-join-v64/',import.meta.url);await mkdir(out,{recursive:true});
const start=performance.now(),m=buildAssembly(),buildMs=performance.now()-start,poses=probePoses(m);
const old=JSON.parse(await readFile(new URL('../docs/evidence/mira-cloth-micro-v62/pose-probe.json',import.meta.url)));
const originalPoseDeltas=poses.map((p,i)=>({name:p.name,maxCoordinateDelta:Math.max(...old.poses[i].parts.find(p=>p.id==='P01-R').positions.flatMap((v,j)=>v.map((x,k)=>Math.abs(x-p.positions[j][k]))))}));
const report={at:new Date().toISOString(),base:'22d1d041dd6aef60de7764b1eebf6cf78028c857',buildMs,rest:metrics(m),seams:validateSeams(m),properCrossings:properCrossings(m),originalPoseDeltas,
  poseRegistration:'v62 factory-post-animate({},0) chest anchor; not a native bindInverse',poses};
await writeFile(new URL('assembly.json',out),JSON.stringify(m)+'\n');await writeFile(new URL('metrics.json',out),JSON.stringify(report,null,2)+'\n');
await writeFile(new URL('assembly.obj',out),toOBJ(m,{rootFrame:true}));
for(const p of m.pieces.slice(1))await writeFile(new URL(p.id+'.obj',out),toOBJ(p,{rootFrame:true}));
await writeFile(new URL('join-spec.json',out),JSON.stringify({units:'metres',dimensionSource:'author registration, not measured from generated images',newParts:NEW_PARTS,
 seams:m.seams,registration:m.frame,weights:'chest=1 shared; provisional only',unbuilt:m.unbuilt},null,2)+'\n');
console.log(JSON.stringify({...report,poses:poses.map(({positions,normals,...p})=>p)},null,2));
