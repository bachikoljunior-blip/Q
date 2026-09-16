import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRowTopology,supportRows} from '../review/cloth-support-v64/support.mjs';
const out=new URL('../docs/evidence/mira-cloth-support-v64/',import.meta.url);
const mesh=JSON.parse(await readFile(new URL('../docs/evidence/mira-cloth-micro-v62/meshes.json',import.meta.url))).find(m=>m.id==='P01-R');
const topology=createRowTopology(mesh),fixed=JSON.parse(await readFile(new URL('fixed.json',out))),report=JSON.parse(await readFile(new URL('sequences.json',out)));
test('the single reduced-support candidate solves 51 nodes and preserves reference arrays, all 153 outputs, pins and non-contact poses',()=>{
 assert.equal(topology.sources.length,51);assert.equal(mesh.indices.length,256);
 for(const f of fixed){const before=JSON.stringify(f.before),r=supportRows(topology,f.before);
   assert.equal(JSON.stringify(f.before),before);assert.equal(r.positions.length,153);assert.deepEqual(r.positions,f.after);
   for(const i of topology.originalPins)assert.deepEqual(r.positions[i],f.before[i]);
   if(!r.active)assert.deepEqual(r.positions,f.before);
 }
});
test('the output is the declared three-support quadratic displacement per row, not an independent Y clip',()=>{
 const f=fixed.find(f=>f.active),r=supportRows(topology,f.before).positions;
 for(let j=0;j<16;j++)for(let i=0;i<9;i++)for(let k=0;k<3;k++){
   const expected=f.before[j*9+i][k]+topology.basis[i].reduce((s,w,a)=>s+w*(r[j*9+a*4][k]-f.before[j*9+a*4][k]),0);
   assert(Math.abs(r[j*9+i][k]-expected)<1e-12);
 }
 assert(r.some((p,i)=>p[0]!==f.before[i][0]||p[2]!==f.before[i][2]));
});
test('same flat-plane yaw/translation gives the same reconstructed physical surface',()=>{
 const f=fixed.find(f=>f.active),a=.79,c=Math.cos(a),s=Math.sin(a),t=[1,.25,-2];
 const transform=p=>[c*p[0]+s*p[2]+t[0],p[1]+t[1],-s*p[0]+c*p[2]+t[2]];
 const r=supportRows(topology,f.before.map(transform),{height:()=>.25});
 for(let i=0;i<153;i++)assert(Math.hypot(...r.positions[i].map((x,k)=>x-transform(f.after[i])[k]))<1e-10);
 assert.throws(()=>supportRows(topology,f.before,{iterations:64}));
});
test('same-source evidence records the real rejection instead of relaxing v63 metrics',async()=>{
 for(const source of report.sources){const b=await readFile(new URL('../'+source.path,import.meta.url));assert.equal(createHash('sha256').update(b).digest('hex'),source.sha256);}
 assert.equal(report.v63ScalarDelta,0);assert.equal(report.sequences.length,15);
 let frames=0;for(const sequence of report.sequences)for(const f of sequence.frames){frames++;assert(f.afterMin>=0);assert.equal(f.maxPinResidual,0);assert.equal(f.pinnedBelowFloor.length,0);assert(f.areaMin>0&&f.quadDot>0);}
 assert.equal(frames,1275);
 const worst=report.sequences.find(s=>s.terrain==='diagonal-slope'&&s.hz===120);
 assert(worst.maxAfterStep>worst.maxV63Step);assert(worst.maxStretch>worst.maxV63Stretch);
 assert(report.sequences.some(s=>s.minStretch<.85),'known substantial local compression must not be hidden');
});
test('limited shape inspection distinguishes folded shape retention from unacceptable metric deformation',async()=>{
 const r=JSON.parse(await readFile(new URL('shape-check.json',out)));
 assert.equal(r.cases.length,20);for(const c of r.cases){assert.equal(c.v63Crossings.length,0);assert.equal(c.candidateCrossings.length,0);assert(Math.abs(c.candidateSag[16]-c.restSag[16])<1e-12);}
 const crossSlope=r.cases.find(c=>c.terrain==='cross-slope'&&c.age===1);
 assert(crossSlope.candidateSag[0]>crossSlope.v63Sag[0]);
});
