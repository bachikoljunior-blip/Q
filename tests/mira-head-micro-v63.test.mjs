import test from'node:test';
import assert from'node:assert/strict';
import{IDS,buildAssembly,partMesh,toOBJ}from'../review/head-micro-v63/surfaces.mjs';
import{inspect,assertAssembly}from'../review/head-micro-v63/inspect.mjs';
test('seven lower-face placements share six real indexed C1 seams and a continuous UV chart',()=>{
 const m=buildAssembly(),r=inspect(m);assertAssembly(r);assert.equal(r.seams.length,6);assert.equal(r.vertices,513);assert.equal(r.triangles,896);
 assert.equal(r.boundaryEdges,128);assert.deepEqual(m.parts.map(p=>p.id),IDS);
 for(const w of m.weights)assert.deepEqual(w,{head:1});
 for(const part of IDS){const local=partMesh(m,part);for(let i=0;i<local.positions.length;i++)assert.deepEqual(local.positions[i],m.positions[local.globalVertices[i]]);assert.equal(local.indices.length,128);}
 const obj=toOBJ(m);assert.equal(obj.split('\n').filter(l=>l.startsWith('f ')).length,896);
});
test('shared-edge position, winding and UV failures are rejected',()=>{
 const a=buildAssembly();a.positions[a.seams[0].vertices[4]][2]+=.001;assert.throws(()=>assertAssembly(inspect(a)),/seam/);
 const b=buildAssembly();b.indices[0].reverse();assert.throws(()=>assertAssembly(inspect(b)),/surface|topology/);
 const c=buildAssembly();c.uv=c.uv.map(([u,v])=>[u,-v]);assert.throws(()=>assertAssembly(inspect(c)),/UV/);
});
test('mirroring changes anatomical side without flipping normal orientation',()=>{
 const m=buildAssembly(),stride=9,rows=57;
 for(let row=0;row<rows;row++)for(let i=0;i<stride;i++){
  const a=m.positions[row*stride+i],b=m.positions[(rows-1-row)*stride+i];assert.ok(Math.abs(a[0]+b[0])<1e-12);assert.ok(Math.abs(a[1]-b[1])<1e-12);assert.ok(Math.abs(a[2]-b[2])<1e-12);
 }
});
