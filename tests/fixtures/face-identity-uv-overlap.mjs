// Float64 UV triangle clipping on original atlas coordinates; not a texture/render test.
import {writeFileSync} from 'node:fs';
import {HEAD_ATTRIBUTES as A,HEAD_INDICES as I,HEAD_SOURCE_TRIANGLE_IDS as F} from '../../src/assets/characters/identity-head-data.js';
const cross=(a,b,p)=>(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]);
const area=p=>Math.abs(p.reduce((sum,a,i)=>{const b=p[(i+1)%p.length];return sum+a[0]*b[1]-a[1]*b[0];},0))*.5;
const polygons=F.flatMap((f,i)=>f<0?[]:[I.slice(i*3,i*3+3).map(v=>A[v].slice(6,8))]);
const bounds=polygons.map(p=>[Math.min(...p.map(v=>v[0])),Math.min(...p.map(v=>v[1])),Math.max(...p.map(v=>v[0])),Math.max(...p.map(v=>v[1]))]);
let candidates=0,overlaps=0,maxArea=0;
for(let i=0;i<polygons.length;i++)for(let j=i+1;j<polygons.length;j++){
 const a=bounds[i],b=bounds[j];if(a[2]<=b[0]||b[2]<=a[0]||a[3]<=b[1]||b[3]<=a[1])continue;candidates++;
 let subject=polygons[i];for(let edge=0;edge<3&&subject.length;edge++){
  const p=polygons[j][edge],q=polygons[j][(edge+1)%3],next=[];let previous=subject.at(-1),pd=cross(p,q,previous);
  for(const current of subject){const cd=cross(p,q,current);if((cd>=0)!==(pd>=0)){const t=pd/(pd-cd);next.push([previous[0]+t*(current[0]-previous[0]),previous[1]+t*(current[1]-previous[1])]);}if(cd>=0)next.push(current);previous=current;pd=cd;}subject=next;
 }
 const overlap=subject.length>=3?area(subject):0;maxArea=Math.max(maxArea,overlap);if(overlap>1e-12)overlaps++;
}
if(overlaps)throw Error('New UV triangle overlap: '+overlaps);
writeFileSync(new URL('../../docs/evidence/face-identity-v31-uv-overlap.json',import.meta.url),JSON.stringify({surfaceTriangles:polygons.length,bboxCandidatePairs:candidates,positiveOverlapPairs:overlaps,maximumClippedArea:maxArea,tolerance:1e-12,exclusion:'Authored hidden cap intentionally samples a collar patch; no GPU/raster/texture comparison.'},null,2)+'\n');
