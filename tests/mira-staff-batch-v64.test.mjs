import test from 'node:test';
import assert from 'node:assert/strict';
import {BufferGeometry,Group,Plane,Vector3,Texture} from 'three';
import {makeMiraStaff} from '../review/staff-v63/assembly.mjs';
import {batchStaff,makeMiraStaffBatch,materialRenderKey} from '../review/staff-batch-v64/staff-batch.mjs';
import {inspectBatch} from '../review/staff-batch-v64/inspect-batch.mjs';
import {disposeMiraLanternPartial as disposeSource} from '../review/lantern-micro-v62/mira-lantern-ribs.js';

const check=r=>{
  assert.equal(r.partCount,19);assert.equal(r.totalCorners,7512*3);assert.equal(r.batch.meshes,4);assert.equal(r.batch.triangles,7512);
  assert(r.maxPositionMm<.0005);assert(r.maxNormalError<1e-6);assert.equal(r.otherAttributeMismatch,0);assert.equal(r.indexMismatch,0);assert.equal(r.materialMismatch,0);assert(r.parts.every(p=>p.sourceMatrixPreserved));
};

test('all 7512 world triangles, precise materials, UV/color and 19 ID ranges survive the four authored buckets',()=>{
  const source=makeMiraStaff(),original=source.toJSON(),b=batchStaff(source);check(inspectBatch(source,b));
  assert.deepEqual(source.toJSON(),original,'source geometry/materials/transforms stay unchanged');
  assert.equal(b.group.getObjectByName('glass').material.transmission,.22);assert.deepEqual(b.group.getObjectByName('glass').userData.partRanges.map(p=>p.id),['S16']);
  for(const m of b.group.children){assert.equal(m.geometry.groups.length,0);assert.equal(m.geometry.index.array.constructor,Uint16Array);if(m.name!=='glass'){assert.equal(m.material.transmission??0,0);assert.equal(m.geometry.attributes.color,undefined);}}
  for(const entry of b.manifest.buckets){const ranges=b.manifest.parts.filter(p=>p.bucketId===entry.id);assert.equal(ranges.reduce((s,p)=>s+p.indexCount,0),entry.triangles*3);}
  b.dispose();disposeSource(source);
});

test('same oracle retains root placement, rotated lower ring and nonuniform normal transform',()=>{
  const source=makeMiraStaff(),parent=new Group();parent.position.set(.32,-.14,.7);parent.rotation.set(.24,.67,-.12);parent.add(source);source.position.set(.1,.2,-.1);source.scale.set(.8,1.1,1.3);
  for(const m of source.children){m.castShadow=true;m.receiveShadow=true;m.layers.set(2);}
  const b=batchStaff(source);check(inspectBatch(source,b));for(const m of b.group.children){assert(m.castShadow&&m.receiveShadow);assert.equal(m.layers.mask,4);}
  b.dispose();disposeSource(source);
});

test('source/batch ownership and temporary transform clones dispose exactly once without disposing borrowed parts',()=>{
  const source=makeMiraStaff(),sourceG=new Set(source.children.map(m=>m.geometry)),sourceM=new Set(source.children.map(m=>m.material)),seen=new Map();let sourceMaterialDisposals=0;
  const original=BufferGeometry.prototype.dispose;BufferGeometry.prototype.dispose=function(){seen.set(this,(seen.get(this)||0)+1);return original.call(this);};
  for(const m of sourceM)m.addEventListener('dispose',()=>sourceMaterialDisposals++);
  try{
    const b=batchStaff(source);assert.equal(seen.size,19);assert([...seen.values()].every(n=>n===1));assert([...sourceG].every(g=>!seen.has(g)));assert.equal(sourceMaterialDisposals,0);
    let batchM=0;for(const m of b.group.children)m.material.addEventListener('dispose',()=>batchM++);
    b.dispose();b.dispose();assert.equal(batchM,4);assert.equal(seen.size,23);assert([...seen.values()].every(n=>n===1));assert.equal(sourceMaterialDisposals,0);
    disposeSource(source);disposeSource(source);assert.equal(sourceMaterialDisposals,5);assert.equal(seen.size,40);assert([...seen.values()].every(n=>n===1));
  }finally{BufferGeometry.prototype.dispose=original;disposeSource(source);}
  const independent=makeMiraStaffBatch();assert.equal(independent.group.children.length,4);independent.dispose();independent.dispose();
});

test('index, UV, vertex color and tiny non-quantized material differences remain detectable',()=>{
  const source=makeMiraStaff(),b=batchStaff(source),glass=b.group.getObjectByName('glass').geometry;
  glass.attributes.uv.array[0]+=.1;glass.attributes.color.array[0]+=.1;const i=glass.index.array;i[0]=i[0]===0?1:0;
  const r=inspectBatch(source,b);assert(r.otherAttributeMismatch>0);assert(r.indexMismatch>0);
  const one=source.getObjectByName('S13').material,other=source.getObjectByName('S02').material;assert.equal(materialRenderKey(one),materialRenderKey(other));one.color.r+=1e-8;assert.notEqual(materialRenderKey(one),materialRenderKey(other));assert.throws(()=>batchStaff(source),/render states/);
  b.dispose();disposeSource(source);
});

test('custom hooks, clipping, texture ownership and changing one bronze render state fail explicitly',()=>{
  for(const mutate of [m=>m.onBeforeCompile=()=>{},m=>m.clippingPlanes=[new Plane(new Vector3(1,0,0),0)],m=>m.map=new Texture(),m=>m.side=2,m=>m.defines={...m.defines,UNREVIEWED:1}]){
    const source=makeMiraStaff();mutate(source.getObjectByName('S13').material);assert.throws(()=>batchStaff(source));source.getObjectByName('S13').material.map?.dispose();disposeSource(source);
  }
});
