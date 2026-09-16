import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {HEAD_ATTRIBUTES as A,HEAD_INDICES as I,HEAD_SOURCE_IDS as V,HEAD_SOURCE_UV_IDS as U,HEAD_SOURCE_TRIANGLE_IDS as F,HEAD_UV_REGIONS as R} from '../src/assets/characters/anatomical-head-data.js';
const vertices=[],uv=[],triangles=[],cornerPairs=new Set();let group='';
for(const line of readFileSync(new URL('../src/assets/characters/sources/makehuman-hm08.obj',import.meta.url),'utf8').split('\n')){
 const p=line.trim().split(/\s+/);if(p[0]==='v')vertices.push(p.slice(1,4).map(Number));if(p[0]==='vt')uv.push(p.slice(1,3).map(Number));if(p[0]==='g')group=p[1];
 if(p[0]==='f'&&group==='body'){const corners=p.slice(1).map(p=>p.split('/').slice(0,2).map(x=>Number(x)-1));if(corners.every(([v])=>vertices[v][1]>=6))for(const q of[[0,1,2],[0,2,3]]){const tri=q.map(i=>corners[i]);triangles.push(tri);tri.forEach(([v,u])=>cornerPairs.add(`${v}/${u}`));}}
}
const area=p=>((p[1][0]-p[0][0])*(p[2][1]-p[0][1])-(p[1][1]-p[0][1])*(p[2][0]-p[0][0]))/2;
test('every retained surface corner uses its exact original OBJ vertex/UV pair, including same-island seams',()=>{
 assert.equal(U.length,A.length);assert.equal(V.length,A.length);assert.equal(F.length,I.length/3);assert.equal(R.length,F.length);
 for(let i=0;i<A.length;i++)if(U[i]>=0){assert(cornerPairs.has(`${V[i]}/${U[i]}`),`invented source corner ${i}`);assert(Math.abs(A[i][6]-uv[U[i]][0])<6e-8);assert(Math.abs(A[i][7]-uv[U[i]][1])<6e-8);}
 const sourceSeams=new Map();for(const pair of cornerPairs){const [v,u]=pair.split('/').map(Number);if(!sourceSeams.has(v))sourceSeams.set(v,new Set());sourceSeams.get(v).add(u);}
 const retained=new Set(V.map((v,i)=>`${v}/${U[i]}`));let seamVertices=0;for(const[v,values]of sourceSeams)if(values.size>1){seamVertices++;for(const u of values)assert(retained.has(`${v}/${u}`),`lost seam corner ${v}/${u}`);}assert.equal(seamVertices,187);
 // Source855 is a seam within the outer-head island AND the neck island.
 const entries=A.map((_,i)=>i).filter(i=>V[i]===855&&U[i]>=0);assert.equal(new Set(entries.map(i=>U[i])).size,4);assert(entries.some(i=>A[i][7]<.2));assert(entries.some(i=>A[i][7]>.8&&A[i][7]<.9));
});
test('LOD preserves each source face orientation without swapping UV corners and the authored cap is nondegenerate',()=>{
 let sourceNegative=0,candidateNegative=0,cap=0;
 for(const tri of triangles)if(area(tri.map(([,u])=>uv[u]))<0)sourceNegative++;
 for(let f=0;f<F.length;f++){
  const index=I.slice(f*3,f*3+3),a=area(index.map(i=>A[i].slice(6,8)));assert(Math.abs(a)>1e-12,`zero-area UV triangle ${f}`);
  if(F[f]===-1){cap++;assert.equal(R[f],5);assert(index.every(i=>U[i]===-1));continue;}
  assert(F[f]>=0&&F[f]<triangles.length);const original=area(triangles[F[f]].map(([,u])=>uv[u]));assert(a*original>0,`introduced UV reversal at retained original face ${F[f]}`);if(a<0)candidateNegative++;
 }
 assert.equal(sourceNegative,0,'this exact source selection contains no mirrored UV triangles');assert.equal(candidateNegative,0);assert.equal(cap,46);
});
