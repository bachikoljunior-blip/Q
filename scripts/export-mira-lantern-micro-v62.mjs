import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import {Vector3,Matrix3} from 'three';
import {RIB_SPEC,RIB_INSTANCES,makeMiraLanternPartial,disposeMiraLanternPartial} from '../review/lantern-micro-v62/mira-lantern-ribs.js';
import {inspectLantern,seatContact,ellipsoidClearance} from '../review/lantern-micro-v62/inspect-ribs.js';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),out=resolve(root,'docs/evidence/mira-lantern-micro-v62/geometry');
await mkdir(out,{recursive:true});const start=performance.now(),group=makeMiraLanternPartial();group.updateMatrixWorld(true);const generatedMs=performance.now()-start;
const parts=group.children.map(m=>({id:m.name,userData:m.userData,matrixWorld:Array.from(m.matrixWorld.elements),index:Array.from(m.geometry.index.array),attributes:Object.fromEntries(Object.entries(m.geometry.attributes).map(([name,a])=>[name,{itemSize:a.itemSize,array:Array.from(a.array)}]))}));
const obj=meshes=>{
  let result='# Real native mesh, metres. Development-only partial assembly; no image texture.\n',offset=1;
  for(const m of meshes){
    result+='o '+m.name+'\n';const p=m.geometry.attributes.position,n=m.geometry.attributes.normal,uv=m.geometry.attributes.uv,normalMatrix=new Matrix3().getNormalMatrix(m.matrixWorld);
    for(let i=0;i<p.count;i++){const v=new Vector3().fromBufferAttribute(p,i).applyMatrix4(m.matrixWorld);result+='v '+v.toArray().map(n=>n.toPrecision(12)).join(' ')+'\n';}
    for(let i=0;i<p.count;i++)result+='vt '+uv.getX(i)+' '+uv.getY(i)+'\n';
    for(let i=0;i<p.count;i++){const normal=new Vector3().fromBufferAttribute(n,i).applyNormalMatrix(normalMatrix);result+='vn '+normal.toArray().map(n=>n.toPrecision(12)).join(' ')+'\n';}
    for(let i=0;i<m.geometry.index.count;i+=3)result+='f '+[0,1,2].map(k=>{const index=m.geometry.index.getX(i+k)+offset;return index+'/'+index+'/'+index;}).join(' ')+'\n';
    offset+=p.count;
  }
  return result;
};
for(const m of group.children.slice(0,4))await writeFile(resolve(out,m.name+'.obj'),obj([m]));
await writeFile(resolve(out,'S09-S14-partial-assembly.obj'),obj(group.children));
await writeFile(resolve(out,'native-geometry.json'),JSON.stringify({units:'metres',matrixOrder:'Three Matrix4 column-major',generatedUTC:new Date().toISOString(),parts},null,2)+'\n');
const report=inspectLantern(group),g24=makeMiraLanternPartial({capSegments:24});g24.updateMatrixWorld(true);
report.default24SeatReadback=g24.children.slice(0,4).map(r=>seatContact(r,g24.getObjectByName('S13')));
report.reusedCapsGlowEnvelope={segments16:group.children.slice(4).map(ellipsoidClearance),segments24:g24.children.slice(4).map(ellipsoidClearance),boundary:'negative scaled-radius deficit is not measured physical penetration depth; S16 is an authored ellipsoid, not an accepted mesh. Existing cap profile remains unchanged.'};
report.ribSpec=RIB_SPEC;report.instances=RIB_INSTANCES;report.nativeConstructionMs=generatedMs;report.exportAndAnalysisMs=performance.now()-start;
report.source=[];for(const path of ['review/lantern-micro-v62/mira-lantern-ribs.js','review/lantern-micro-v62/inspect-ribs.js','review/micro-v61/mira-micro-parts.js','tests/mira-lantern-micro-v62.test.mjs']){const bytes=await readFile(resolve(root,path));report.source.push({path,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});}
await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');
disposeMiraLanternPartial(group);disposeMiraLanternPartial(g24);
console.log(JSON.stringify({output:out,...report.counts,nativeConstructionMs:report.nativeConstructionMs,exportAndAnalysisMs:report.exportAndAnalysisMs,failures:{solid:report.parts.filter(p=>p.nonfinite||p.openOrNonmanifoldEdges||p.badWindingEdges||p.minVertexNormalFaceDot<=0),seat:report.seatContacts.filter(p=>Math.abs(p.coverage-1)>1e-8),glow:report.glowEnvelope.filter(p=>p.minNormalizedRadius<=1),properCrossings:report.crossings.filter(p=>p.properTrianglePairs)}}));
