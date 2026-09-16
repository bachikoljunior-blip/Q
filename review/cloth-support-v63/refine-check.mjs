import {readFile,writeFile} from 'node:fs/promises';
import {performance} from 'node:perf_hooks';
import {groundAt} from '../../src/core.js';
import {createSupportTopology,supportSurface} from './support.mjs';
import {measure,quantile} from './measure.mjs';
import {sub,cross,dot,length} from '../cloth-micro-v62/surfaces.mjs';
const out=new URL('../../docs/evidence/mira-cloth-support-v63/',import.meta.url);
const mesh=JSON.parse(await readFile(new URL('../../docs/evidence/mira-cloth-micro-v62/meshes.json',import.meta.url))).find(m=>m.id==='P01-R');
const selected=JSON.parse(await readFile(new URL('selected.json',out))),sequences=JSON.parse(await readFile(new URL('sequences.json',out)));
const topology=createSupportTopology(mesh);
const terrain={flat:()=>0,'cross-slope':x=>.15*x,'along-slope':(x,z)=>.15*z,'diagonal-slope':(x,z)=>.12*x-.09*z,'actual-spawn':groundAt};
function proper(a,b,tri){
 const d=sub(b,a),e1=sub(tri[1],tri[0]),e2=sub(tri[2],tri[0]),p=cross(d,e2),det=dot(e1,p);
 if(Math.abs(det)<1e-13)return false;const r=sub(a,tri[0]),u=dot(r,p)/det,q=cross(r,e1),v=dot(d,q)/det,t=dot(e2,q)/det,e=1e-8;
 return u>e&&v>e&&u+v<1-e&&t>e&&t<1-e;
}
function crossings(positions){
 const tris=mesh.indices.map(t=>({ids:t,p:t.map(i=>positions[i]),min:[0,1,2].map(k=>Math.min(...t.map(i=>positions[i][k]))),max:[0,1,2].map(k=>Math.max(...t.map(i=>positions[i][k])))})),pairs=[];
 for(let i=0;i<tris.length;i++)for(let j=i+1;j<tris.length;j++){
   const a=tris[i],b=tris[j];if(a.ids.some(id=>b.ids.includes(id)))continue;
   if([0,1,2].some(k=>a.max[k]<b.min[k]||b.max[k]<a.min[k]))continue;
   if([0,1,2].some(k=>proper(a.p[k],a.p[(k+1)%3],b.p)||proper(b.p[k],b.p[(k+1)%3],a.p)))pairs.push([i,j]);
 }return pairs;
}
function foldSag(positions){const [nu,nv]=mesh.divisions,values=[];
 for(let j=0;j<=nv;j++){const a=positions[j*(nu+1)],b=positions[j*(nu+1)+nu],ab=sub(b,a),l=length(ab);let max=0;
   for(let i=1;i<nu;i++)max=Math.max(max,length(cross(sub(positions[j*(nu+1)+i],a),ab))/l);values.push(max);
 }return values;
}
const comparisons=[];
for(const fixture of selected.filter(s=>s.age>0))for(const iterations of [16,32,64]){
 const height=terrain[fixture.terrain],t=performance.now(),s=supportSurface(topology,fixture.before,{height,iterations}),ms=performance.now()-t;
 const metric=measure(mesh,s.positions,fixture.before,height);
 comparisons.push({terrain:fixture.terrain,age:fixture.age,iterations,ms,active:s.active,pinResidual:s.maxPinResidual,
   minGap:metric.minTriangleSampleGapM,maxStretch:metric.edgeLengthRatio.max,minStretch:metric.edgeLengthRatio.min,quadDot:metric.minWithinQuadNormalDot,
   properSelfCrossingPairs:crossings(s.positions),foldSagBeforeM:foldSag(fixture.before),foldSagAfterM:foldSag(s.positions),
   repeatExact:JSON.stringify(s.positions)===JSON.stringify(supportSurface(topology,fixture.before,{height,iterations}).positions)});
}
const summaries=[16,32,64].map(i=>{const r=comparisons.filter(c=>c.iterations===i&&c.active);return {iterations:i,activeCases:r.length,
  minGap:Math.min(...r.map(c=>c.minGap)),maxStretch:Math.max(...r.map(c=>c.maxStretch)),minStretch:Math.min(...r.map(c=>c.minStretch)),
  minQuadDot:Math.min(...r.map(c=>c.quadDot)),properSelfCrossingPairCount:r.reduce((s,c)=>s+c.properSelfCrossingPairs.length,0),
  cpuMs:{median:quantile(r.map(c=>c.ms),.5),p95:quantile(r.map(c=>c.ms),.95)}};});
const contactTransitions=sequences.sequences.map(s=>({terrain:s.terrain,hz:s.hz,frames:s.frames.filter(f=>f.contactChanged)}));
const agreement=[];
for(const land of Object.keys(terrain)){
 const seq=sequences.sequences.filter(s=>s.terrain===land),a=seq.find(s=>s.hz===30),b=seq.find(s=>s.hz===60),c=seq.find(s=>s.hz===120);
 agreement.push({terrain:land,matchingAgeMaxDifference:Math.max(...a.frames.flatMap((f,i)=>[Math.abs(f.afterMin-b.frames[i*2].afterMin),Math.abs(f.afterMin-c.frames[i*4].afterMin),Math.abs(f.maxStretch-b.frames[i*2].maxStretch),Math.abs(f.maxStretch-c.frames[i*4].maxStretch)]))});
}
await writeFile(new URL('refine-check.json',out),JSON.stringify({at:new Date().toISOString(),summaries,comparisons,contactTransitions,rateScalarAgreement:agreement,
  limitations:'Proper crossings exclude shared-vertex pairs and coplanar overlaps; rate agreement here covers sampled scalar minima/stretch, not all-coordinate exactness.'},null,2)+'\n');
console.log(JSON.stringify({summaries,contactTransitions,agreement},null,2));
