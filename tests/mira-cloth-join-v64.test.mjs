import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildAssembly} from '../review/cloth-join-v64/assembly.mjs';
import {metrics,properCrossings,validateSeams} from '../review/cloth-join-v64/inspect.mjs';
import {probePoses} from '../review/cloth-join-v64/pose-probe.mjs';
const m=buildAssembly();
test('existing P01 samples and indices remain exact; adjacent surfaces use actual shared IDs',async()=>{
 const archive=JSON.parse(await readFile(new URL('../docs/evidence/mira-cloth-micro-v62/meshes.json',import.meta.url))).find(p=>p.id==='P01-R');
 for(const k of['positions','uvMetres','skinWeights','indices'])assert.deepEqual(m[k].slice(0,archive[k].length),archive[k]);
 assert.equal(m.positions.length,325);assert.equal(m.indices.length,576);
 for(const s of validateSeams(m)){assert.equal(s.positionGap,0);assert.equal(s.uvGap,0);assert.equal(s.wrongID,0);assert.equal(s.weightMismatch,0);}
 const broken=structuredClone(m);broken.pieces[1].globalVertexIDs[8]=999;assert.equal(validateSeams(broken)[0].wrongID,1);
});
test('connected open manifold has finite nondegenerate consistently wound surfaces and UVs',()=>{
 const r=metrics(m);assert.equal(r.finite,true);assert.equal(r.degenerate,0);assert.equal(r.reversedAgainstVertexNormals,0);
 assert.equal(r.nonManifoldEdges,0);assert.equal(r.inconsistentWinding,0);assert.equal(r.boundaryDegreeNotTwo,0);assert.equal(r.boundaryComponents,1);assert.equal(r.euler,1);
 assert.equal(r.uv.zero,0);assert.equal(r.uv.positive,0);assert.equal(properCrossings(m).properNonAdjacentTrianglePairs,0);
});
test('six native NPC poses retain shared interfaces; floor failure remains explicit',async()=>{
 const poses=probePoses(m),old=JSON.parse(await readFile(new URL('../docs/evidence/mira-cloth-micro-v62/pose-probe.json',import.meta.url)));
 for(let i=0;i<poses.length;i++){const p=poses[i];assert.equal(p.metrics.finite,true);assert.equal(p.metrics.degenerate,0);assert.equal(p.metrics.reversedAgainstVertexNormals,0);assert.equal(p.properCrossings.properNonAdjacentTrianglePairs,0);
  for(const s of p.seamGaps)assert.equal(s.max,0);
  assert.deepEqual(p.positions.slice(0,153),old.poses[i].parts.find(p=>p.id==='P01-R').positions);
 }
 assert.ok(poses[4].partMinY.find(p=>p.id==='P01-R').minY<0,'existing unsupported death pose is not silently clamped');
});
