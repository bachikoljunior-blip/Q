import {sub,cross,dot,length} from '../cloth-micro-v62/surfaces.mjs';
export const quantile=(a,q)=>[...a].sort((x,y)=>x-y)[Math.floor((a.length-1)*q)];
export function measure(mesh,positions,reference,height){
 const gaps=[],ratios=[],areas=[],quadAgreement=[];
 const weights=[[1,0,0],[0,1,0],[0,0,1],[.5,.5,0],[0,.5,.5],[.5,0,.5],[1/3,1/3,1/3],[.6,.2,.2],[.2,.6,.2],[.2,.2,.6]];
 for(let f=0;f<mesh.indices.length;f++){
   const ids=mesh.indices[f],p=ids.map(i=>positions[i]),r=ids.map(i=>reference[i]);
   const n=cross(sub(p[1],p[0]),sub(p[2],p[0])),rn=cross(sub(r[1],r[0]),sub(r[2],r[0]));areas.push(length(n)/length(rn));
   const adjacent=mesh.indices[f%2?f-1:f+1].map(i=>positions[i]);
   const an=cross(sub(adjacent[1],adjacent[0]),sub(adjacent[2],adjacent[0]));quadAgreement.push(dot(n,an)/(length(n)*length(an)));
   for(let k=0;k<3;k++)ratios.push(length(sub(p[k],p[(k+1)%3]))/length(sub(r[k],r[(k+1)%3])));
   for(const w of weights){const a=[0,1,2].map(k=>p.reduce((s,p,i)=>s+w[i]*p[k],0));gaps.push(a[1]-height(a[0],a[2]));}
 }
 return {finite:positions.flat().every(Number.isFinite),sampleCount:gaps.length,minTriangleSampleGapM:Math.min(...gaps),
   edgeLengthRatio:{min:Math.min(...ratios),p95:quantile(ratios,.95),max:Math.max(...ratios)},
   triangleAreaRatio:{min:Math.min(...areas),max:Math.max(...areas)},zeroArea:areas.filter(a=>a<1e-8).length,
   minWithinQuadNormalDot:Math.min(...quadAgreement),withinQuadReversed:quadAgreement.filter(a=>a<=0).length,
   maxDisplacementM:Math.max(...positions.map((p,i)=>length(sub(p,reference[i]))))};
}
export function vertexNormals(mesh,positions){
 const result=positions.map(()=>[0,0,0]);
 for(const [a,b,c]of mesh.indices){const n=cross(sub(positions[b],positions[a]),sub(positions[c],positions[a]));for(const i of[a,b,c])for(let k=0;k<3;k++)result[i][k]+=n[k];}
 return result.map(n=>n.map(x=>x/length(n)));
}
