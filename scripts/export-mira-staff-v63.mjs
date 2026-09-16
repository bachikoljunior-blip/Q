import fs from 'node:fs/promises';
import path from 'node:path';
import {performance} from 'node:perf_hooks';
import {makeStaffLower,STAFF_SPEC,profiles} from '../review/staff-v63/staff-parts.mjs';
import {makeMiraStaff} from '../review/staff-v63/assembly.mjs';
import {makeWrapBlank} from '../review/staff-v63/flat-wrap.mjs';
import {horizontalContact} from '../review/lantern-v63/inspect-head.js';
import {inspectSolid,properCrossings,nativeTriangles} from '../review/lantern-micro-v62/inspect-ribs.js';
const full=process.argv.includes('--full');
const root=path.resolve('docs/evidence/mira-staff-v63'+(full?'/assembly':''));await fs.mkdir(root,{recursive:true});
const started=new Date().toISOString(),tick=performance.now(),group=full?makeMiraStaff():makeStaffLower();group.updateMatrixWorld(true);const buildMs=performance.now()-tick;
const parts=group.children.map(inspectSolid),pairs=[];
for(let i=0;i<group.children.length;i++)for(let j=i;j<group.children.length;j++)pairs.push(properCrossings(group.children[i],group.children[j]));
const meshJSON=group.children.map(mesh=>{
 const g=mesh.geometry;return {id:mesh.name,positions:Array.from(g.attributes.position.array),matrixWorld:mesh.matrixWorld.toArray(),normals:Array.from(g.attributes.normal.array),uv:Array.from(g.attributes.uv.array),indices:Array.from(g.index.array)};
});
const uniqueGeometries=[...new Set(group.children.map(m=>m.geometry))];
const uniqueBufferBytes=uniqueGeometries.reduce((s,g)=>s+g.index.array.byteLength+Object.values(g.attributes).reduce((n,a)=>n+a.array.byteLength,0),0);
const planar=(id,y,direction)=>nativeTriangles(group.getObjectByName(id)).filter(t=>t.normal.y*direction>.999999&&t.v.every(p=>Math.abs(p.y-y)<1e-4)).reduce((a,t)=>a+t.area,0);
const report={startedUTC:started,finishedUTC:new Date().toISOString(),buildMs,wholeExportMs:performance.now()-tick,scope:'native triangle/shape QA only; no WebGL',spec:STAFF_SPEC,profiles:profiles(),parts,pairs,
 terminalInterfaces:{neckTopY:1423,neckTopFaceAreaMm2:planar('S06',1423,1),finialBottomY:1674,finialBottomFaceAreaMm2:planar('S15',1674,-1)},
 counts:{meshes:group.children.length,triangles:parts.reduce((s,p)=>s+p.triangles,0),perMeshBufferBytes:parts.reduce((s,p)=>s+p.bufferBytes,0),uniqueBufferBytes},
 footSeat:horizontalContact(group.getObjectByName('S03'),group.getObjectByName('S01'),4),
 blanks:['S05-A','S05-B'].map(id=>{const g=makeWrapBlank(id);const r={id,...g.userData};g.dispose();return r;}),
 limitations:['Conditional generated reference views; erroneous thumbnails excluded','S05 blank concept accepted but image aspect is not dimensionally exact; assembled shape is authored','Metal/leather concealed retention overlaps are classified separately from exterior defects','Materials are preview swatches; source part shaders have no visual acceptance','No skeleton/hand, runtime, whole actor budget or device acceptance']};
 // OBJ uses the actual transformed triangles, including the inverted S08 ring.
 const nativeLines=['# Native world triangles; metres; geometry QA not game rendering'];let ni=1;
 for(const mesh of group.children){nativeLines.push('g '+mesh.name);for(const t of nativeTriangles(mesh)){for(const v of t.v)nativeLines.push(`v ${v.x/1000} ${v.y/1000} ${v.z/1000}`);nativeLines.push(`f ${ni} ${ni+1} ${ni+2}`);ni+=3;}}
await fs.writeFile(path.join(root,'native-report.json'),JSON.stringify(report,null,2)+'\n');await fs.writeFile(path.join(root,'parts.json'),JSON.stringify(meshJSON)+'\n');await fs.writeFile(path.join(root,full?'staff-complete-parts.obj':'staff-partial.obj'),nativeLines.join('\n')+'\n');
console.log(JSON.stringify({parts:parts.length,counts:report.counts,failedSolids:parts.filter(p=>p.nonfinite||p.openOrNonmanifoldEdges||p.badWindingEdges||p.signedVolumeMm3<=0),crossings:pairs.filter(p=>p.properTrianglePairs),timing:{buildMs,wholeExportMs:report.wholeExportMs}},null,2));
