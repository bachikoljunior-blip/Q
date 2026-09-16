import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PARTS,buildPart,evaluate,toOBJ,sub,cross,dot,length} from '../review/cloth-micro-v62/surfaces.mjs';

test('three independent right-side surface prototypes preserve finite, outward indexed topology',()=>{
 assert.deepEqual(PARTS.map(p=>p.id),['T01-R','S05-R','P01-R']);
 for(const p of PARTS){
   const m=buildPart(p),edges=new Map();
   assert(m.positions.flat().every(Number.isFinite));assert(m.positions.every(v=>v[0]<0));
   for(const n of m.normals)assert(Math.abs(length(n)-1)<1e-12);
   for(const t of m.indices){
     const n=cross(sub(m.positions[t[1]],m.positions[t[0]]),sub(m.positions[t[2]],m.positions[t[0]]));
     assert(length(n)>1e-8);for(const i of t)assert(dot(n,m.normals[i])>0);
     for(let j=0;j<3;j++){const k=[t[j],t[(j+1)%3]].sort((a,b)=>a-b).join(':');edges.set(k,(edges.get(k)||0)+1);}
   }
   assert([...edges.values()].every(n=>n===1||n===2));
   assert.equal([...edges.values()].filter(n=>n===1).length,2*(p.divisions[0]+p.divisions[1]));
   assert.equal(m.positions.length-edges.size+m.indices.length,1);
   const degrees=new Map();for(const [key,n]of edges)if(n===1)for(const i of key.split(':'))degrees.set(i,(degrees.get(i)||0)+1);
   assert([...degrees.values()].every(n=>n===2));
 }
});
test('four explicit cubic boundary curves meet at shared corners; absent adjacent patches are not reported welded',()=>{
 const bez=(cs,t)=>[0,1,2].map(k=>cs[0][k]*(1-t)**3+3*cs[1][k]*t*(1-t)**2+3*cs[2][k]*t*t*(1-t)+cs[3][k]*t**3);
 for(const p of PARTS){const m=buildPart(p),e=m.boundary;
   assert.equal(e.bottom.vertices[0],e.outside.vertices[0]);assert.equal(e.top.vertices.at(-1),e.inside.vertices.at(-1));
   for(const [name,b]of Object.entries(e)){
     assert.equal(b.weldedToNeighbour,false);assert(b.neighbour);assert.equal(b.edgeID,p.id+':'+name);
     b.vertices.forEach((id,i)=>assert(length(sub(m.positions[id],bez(b.controls,i/(b.vertices.length-1))))<1e-11));
   }
 }
});
test('prototype forms retain shallow front bow, a tapered open forearm, and exactly one rear fold',()=>{
 const [t,s,p]=PARTS;
 assert(evaluate(t,.5,.5).position[2]>.16);
 assert(evaluate(s,1,1).position[0]-evaluate(s,0,1).position[0]>evaluate(s,1,0).position[0]-evaluate(s,0,0).position[0]);
 for(const v of [0,.25,.5,.75,1]){
   const values=Array.from({length:21},(_,i)=>evaluate(p,i/20,v).position[2]);
   assert(values.slice(0,10).every((x,i)=>x>values[i+1]));
   assert(values.slice(10,20).every((x,i)=>x<values[i+11]));
   assert(evaluate(s,.5,v).position[2]>evaluate(s,0,v).position[2]+.04);
 }
});
test('weight proposals are bounded and fresh builds own all mutable surface data',()=>{
 const names=new Set(['pelvis','spine','chest','arm-0','elbow-0']);
 for(const p of PARTS){const a=buildPart(p),b=buildPart(p);
   for(const weights of a.skinWeights){assert(Object.keys(weights).length<=4);assert(Object.entries(weights).every(([n,w])=>names.has(n)&&Number.isFinite(w)&&w>=0&&w<=1));assert(Math.abs(Object.values(weights).reduce((s,x)=>s+x,0)-1)<1e-12);}
   a.positions[0][0]=123;a.normals[0][0]=123;a.skinWeights[0].chest=123;a.boundary.bottom.controls[0][0]=123;a.controlNet[0][0][0]=123;
   assert(b.positions[0][0]<0);assert(Math.abs(b.normals[0][0])<=1);assert((b.skinWeights[0].chest||0)<=1);
   assert(b.boundary.bottom.controls[0][0]<0);assert(b.controlNet[0][0][0]<0);assert(p.net[0][0][0]<0);
 }
});
test('OBJ preserves all points, normals and indexed faces without thick rims, caps or material attachment',()=>{
 for(const p of PARTS){const m=buildPart(p),obj=toOBJ(m),rows=obj.trim().split('\n');
   const v=rows.filter(s=>s.startsWith('v ')).map(s=>s.slice(2).split(' ').map(Number));
   assert.equal(v.length,m.positions.length);assert.equal(rows.filter(s=>s.startsWith('f ')).length,m.indices.length);
   assert.equal(rows.filter(s=>s.startsWith('vn ')).length,m.normals.length);assert(!obj.includes('mtllib'));assert(!obj.includes('usemtl'));
   v.forEach((p,i)=>assert(length(sub(p,m.positions[i]))<1e-9));
 }
});
test('exported native skeleton bind and open surface error checks are factual constraints',async()=>{
 const report=JSON.parse(await readFile(new URL('../docs/evidence/mira-cloth-micro-v62/metrics.json',import.meta.url)));
 assert(length(sub(report.bones.chest,[0,.985,0]))<1e-14);assert(report.bones['arm-0'][0]<0);
 for(const p of report.parts){assert.equal(p.actualNativeBoneBind.missingBones,0);assert(p.actualNativeBoneBind.maxResidualM<1e-12);assert.equal(p.enclosedVolumeM3,null);assert(p.sampledAnalyticalSurfaceDistanceM.max<.002);}
 assert.equal(report.gpu.runtimeImports,0);
});
test('existing NPC pose trial preserves finite surfaces, winding and bounded edge lengths; contact is reported separately',async()=>{
 const report=JSON.parse(await readFile(new URL('../docs/evidence/mira-cloth-micro-v62/pose-probe.json',import.meta.url)));
 assert.equal(report.poses.length,6);
 for(const pose of report.poses)for(const part of pose.parts){
   assert(part.finite);assert.equal(part.degenerateTriangles,0);assert.equal(part.reversedAgainstWeightedNormals,0);
   assert(part.edgeStretch.min>.25&&part.edgeStretch.max<4,'detect gross numerical collapse/explosion, not garment quality');
   assert(Number.isFinite(part.minYFlatFloorM));
 }
});
