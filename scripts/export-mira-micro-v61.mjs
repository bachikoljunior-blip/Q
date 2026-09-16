import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {MICRO_PARTS,makeMiraMicroGeometry} from '../review/micro-v61/mira-micro-parts.js';

const output=new URL('../docs/evidence/mira-micro-v61/geometry/',import.meta.url);
await mkdir(output,{recursive:true});
const report={schema:1,createdUTC:new Date().toISOString(),scope:'Two authored development mesh parts only. Neither complete lantern nor production asset acceptance. No WebGL/GPU/iPhone evidence.',units:'metres',constructionTiming:'Function execution is reported separately and is not shape-specification, coding, repair or review duration.',parts:[]};
let combined='# Authored Mira S13/S14 partial assembly; metres; not a complete lantern\n',offset=0;
for(const id of ['S13','S14']){
  const start=performance.now(),g=makeMiraMicroGeometry(id),constructionMs=performance.now()-start;
  const p=g.attributes.position,n=g.attributes.normal,idx=g.index,origin=MICRO_PARTS[id].originMm.map(v=>v/1000);
  let text='# Authored reference micro-part '+id+'; metres; local origin\no '+id+'\n',world='o '+id+'\n';
  for(let i=0;i<p.count;i++){
    const xyz=[p.getX(i),p.getY(i),p.getZ(i)];text+='v '+xyz.join(' ')+'\n';world+='v '+xyz.map((v,k)=>v+origin[k]).join(' ')+'\n';
  }
  for(let i=0;i<n.count;i++){const line='vn '+[n.getX(i),n.getY(i),n.getZ(i)].join(' ')+'\n';text+=line;world+=line;}
  for(let i=0;i<idx.count;i+=3){const ids=[idx.getX(i)+1,idx.getX(i+1)+1,idx.getX(i+2)+1];text+='f '+ids.map(x=>x+'//'+x).join(' ')+'\n';world+='f '+ids.map(x=>(x+offset)+'//'+(x+offset)).join(' ')+'\n';}
  await writeFile(new URL(id+'.obj',output),text);combined+=world;offset+=p.count;
  report.parts.push({id,triangles:idx.count/3,vertices:p.count,geometryArrayBytes:Object.values(g.attributes).reduce((sum,a)=>sum+a.array.byteLength,0)+idx.array.byteLength,constructionMs,objBytes:Buffer.byteLength(text),objSHA256:createHash('sha256').update(text).digest('hex'),bounds:{min:g.boundingBox.min.toArray(),max:g.boundingBox.max.toArray()},spec:MICRO_PARTS[id]});
  g.dispose();
}
await writeFile(new URL('S13-S14-partial-assembly.obj',output),combined);
report.partialAssembly={objBytes:Buffer.byteLength(combined),objSHA256:createHash('sha256').update(combined).digest('hex'),partIds:['S13','S14'],materialAppearanceVerified:false};
await writeFile(new URL('report.json',output),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({parts:report.parts.map(({id,triangles,vertices,geometryArrayBytes,constructionMs})=>({id,triangles,vertices,geometryArrayBytes,constructionMs})),partialAssembly:report.partialAssembly}));
