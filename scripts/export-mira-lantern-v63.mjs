import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import {Vector3,Matrix3} from 'three';
import {makeLanternHead,HEAD_SPEC,cupSections,revisedUpperSections} from '../review/lantern-v63/lantern-head.js';
import {compareHead} from '../review/lantern-v63/compare-head.js';
import {disposeMiraLanternPartial} from '../review/lantern-micro-v62/mira-lantern-ribs.js';
import {makeStaffLower} from '../docs/evidence/mira-lantern-v63/parent-boundary-snapshot/staff-parts.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),out=resolve(root,'docs/evidence/mira-lantern-v63/geometry');
await mkdir(out,{recursive:true});const start=performance.now(),head=makeLanternHead({glassSegments:16}),staff=makeStaffLower();head.updateMatrixWorld(true);staff.updateMatrixWorld(true);const generatedMs=performance.now()-start;
const serialize=m=>({id:m.name,userData:m.userData,matrixWorld:Array.from(m.matrixWorld.elements),index:Array.from(m.geometry.index.array),attributes:Object.fromEntries(Object.entries(m.geometry.attributes).map(([k,a])=>[k,{itemSize:a.itemSize,array:Array.from(a.array)}]))});
const obj=meshes=>{
  let result='# Native 3D geometry in metres. Partial staff head; CPU source, not a render.\n',offset=1;
  for(const m of meshes){
    result+='o '+m.name+'\n';const {position:p,normal:n,uv}=m.geometry.attributes,nm=new Matrix3().getNormalMatrix(m.matrixWorld);
    for(let i=0;i<p.count;i++)result+='v '+new Vector3().fromBufferAttribute(p,i).applyMatrix4(m.matrixWorld).toArray().map(x=>x.toPrecision(12)).join(' ')+'\n';
    for(let i=0;i<p.count;i++)result+='vt '+uv.getX(i)+' '+uv.getY(i)+'\n';
    for(let i=0;i<p.count;i++)result+='vn '+new Vector3().fromBufferAttribute(n,i).applyNormalMatrix(nm).toArray().map(x=>x.toPrecision(12)).join(' ')+'\n';
    for(let i=0;i<m.geometry.index.count;i+=3)result+='f '+[0,1,2].map(k=>{const x=m.geometry.index.getX(i+k)+offset;return x+'/'+x+'/'+x;}).join(' ')+'\n';offset+=p.count;
  }return result;
};
for(const id of ['S07','S08','S14','S16'])await writeFile(resolve(out,id+'.obj'),obj([head.getObjectByName(id)]));
await writeFile(resolve(out,'lantern-head-16.obj'),obj(head.children));
const withInterfaces=[staff.getObjectByName('S06'),...head.children,staff.getObjectByName('S15')];
await writeFile(resolve(out,'head-with-S06-S15-boundaries.obj'),obj(withInterfaces));
await writeFile(resolve(out,'native-geometry.json'),JSON.stringify({units:'metres',matrixOrder:'Three column-major',note:'S06/S15 are exact read-only parent snapshot boundary references, not owned new parts',parts:withInterfaces.map(serialize)},null,2)+'\n');
const r=compareHead(staff);r.spec=HEAD_SPEC;r.profiles={cup:cupSections(),upperReceiver:revisedUpperSections()};r.generatedUTC=new Date().toISOString();r.constructionMs=generatedMs;r.totalExportAndInspectionMs=performance.now()-start;r.parentSnapshotTriangles=staff.children.reduce((s,m)=>s+m.geometry.index.count/3,0);r.combinedArithmeticTriangles=r.parentSnapshotTriangles+r.segments16.counts.triangles;r.source=[];
for(const path of ['review/lantern-v63/lantern-head.js','review/lantern-v63/inspect-head.js','review/lantern-v63/compare-head.js','scripts/export-mira-lantern-v63.mjs','tests/mira-lantern-v63.test.mjs','docs/evidence/mira-lantern-v63/parent-boundary-snapshot/staff-parts.mjs']){const b=await readFile(resolve(root,path));r.source.push({path,bytes:b.length,sha256:createHash('sha256').update(b).digest('hex')});}
await writeFile(resolve(out,'report.json'),JSON.stringify(r,null,2)+'\n');
disposeMiraLanternPartial(head);disposeMiraLanternPartial(staff);
console.log(JSON.stringify({output:out,counts:r.segments16.counts,combinedArithmeticTriangles:r.combinedArithmeticTriangles,constructionMs:r.constructionMs,totalMs:r.totalExportAndInspectionMs}));
