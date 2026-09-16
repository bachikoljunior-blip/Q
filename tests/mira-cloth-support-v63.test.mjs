import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createSupportTopology,supportSurface} from '../review/cloth-support-v63/support.mjs';
import {measure} from '../review/cloth-support-v63/measure.mjs';
const out=new URL('../docs/evidence/mira-cloth-support-v63/',import.meta.url);
const mesh=JSON.parse(await readFile(new URL('../docs/evidence/mira-cloth-micro-v62/meshes.json',import.meta.url))).find(m=>m.id==='P01-R');
const topology=createSupportTopology(mesh),fixed=JSON.parse(await readFile(new URL('fixed.json',out))),report=JSON.parse(await readFile(new URL('sequences.json',out)));
test('fresh fixed-pose solver preserves all nine pins and does not mutate original reference or posed coordinates',()=>{
 assert.equal(topology.pins.length,9);
 for(const f of fixed){const source=JSON.stringify(f.before),s=supportSurface(topology,f.before);
   assert.equal(JSON.stringify(f.before),source);assert.deepEqual(s.positions,f.after);
   for(const i of topology.pins)assert.deepEqual(s.positions[i],f.before[i]);
   if(!f.active)assert.deepEqual(s.positions,f.before);
   assert(s.positions.every(p=>p.every(Number.isFinite)));
 }
});
test('the actual old death-floor failures are repaired using distances and free contact, with positive triangle area and consistent quad normals',()=>{
 for(const f of fixed.filter(f=>f.active)){
   assert(f.baseline.minTriangleSampleGapM<0);const s=supportSurface(topology,f.before),m=measure(mesh,s.positions,f.before,()=>0);
   assert(m.minTriangleSampleGapM>=0);assert(m.triangleAreaRatio.min>0);assert.equal(m.withinQuadReversed,0);assert.equal(m.zeroArea,0);
   assert(s.positions.some((p,i)=>p[0]!==f.before[i][0]||p[2]!==f.before[i][2]),'support must redistribute edges, not only clip Y');
 }
});
test('support is deterministic and world yaw/translation covariant on the same plane',()=>{
 const f=fixed.find(f=>f.name==='death .45s explicit'),a=.83,c=Math.cos(a),s=Math.sin(a),t=[2,.37,-3];
 const transform=p=>[c*p[0]+s*p[2]+t[0],p[1]+t[1],-s*p[0]+c*p[2]+t[2]];
 const transformed=f.before.map(transform),result=supportSurface(topology,transformed,{height:()=>.37});
 for(let i=0;i<result.positions.length;i++)assert(Math.hypot(...result.positions[i].map((x,k)=>x-transform(f.after[i])[k]))<1e-10);
 assert.deepEqual(supportSurface(topology,f.before).positions,supportSurface(topology,f.before).positions);
});
test('continuous terrain evidence belongs to exact source and preserves floor, top boundary and orientation without disguising worse steps',async()=>{
 for(const source of report.sources){const b=await readFile(new URL('../'+source.path,import.meta.url));assert.equal(createHash('sha256').update(b).digest('hex'),source.sha256);}
 assert.equal(report.sameSixPoseBaselineMaxDeltaM,0);assert.equal(report.sequences.length,15);
 let worseStep=0,frames=0;
 for(const s of report.sequences)for(const f of s.frames){frames++;assert(f.afterMin>=0);assert.equal(f.maxPinResidual,0);assert.equal(f.pinnedBelowFloor.length,0);assert(f.areaMin>0);assert(f.quadDot>0);assert(Number.isFinite(f.maxStretch));if(f.afterStep>f.beforeStep+1e-9)worseStep++;}
 assert.equal(frames,1275);assert(worseStep>0,'measured temporal cost must remain visible');
});
test('an impossible buried chest edge remains pinned and is explicitly reported, never silently projected',()=>{
 const f=fixed[0].before.map(p=>[p[0],p[1]-2,p[2]]),s=supportSurface(topology,f,{iterations:1});
 assert.equal(s.pinnedBelowFloor.length,9);for(const i of topology.pins)assert.deepEqual(s.positions[i],f[i]);
 assert.throws(()=>supportSurface(topology,f,{iterations:0}));assert.throws(()=>supportSurface(topology,f,{iterations:129}));
});
test('bounded iteration comparison records exact repeats, no proper self-crossings in its limited sample, and localized fold change',async()=>{
 const r=JSON.parse(await readFile(new URL('refine-check.json',out)));
 assert.equal(r.comparisons.length,60);for(const c of r.comparisons){assert(c.repeatExact);assert.equal(c.properSelfCrossingPairs.length,0);assert(c.quadDot>0);}
 const c=r.comparisons.find(c=>c.terrain==='flat'&&c.age===.45&&c.iterations===64);
 assert(c.foldSagAfterM[0]<c.foldSagBeforeM[0]);assert(Math.abs(c.foldSagAfterM[16]-c.foldSagBeforeM[16])<1e-12);
 assert(c.foldSagAfterM[8]>.04,'mid strip retains the original fold, not a wholly flattened surface');
});
