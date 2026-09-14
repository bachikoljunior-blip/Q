// CPU-only audit of actual SceneView graphs using installed Three.js. No browser,
// GPU, screen/texture decoding, touch, audio or device/FPS claims are possible here.
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import * as T from 'three';
import { createScenePair, nodesOf, exerciseView, matrixWork, appearanceDigest } from '../tests/static-scene-fixture.mjs';

const BASE = '0a657936f41580ff26f1f787d5c8f63535102d9d';
const args = process.argv.slice(2);
const option = (name, fallback) => { const at = args.indexOf(name); return at === -1 ? fallback : args[at + 1]; };
const baselineRef = option('--base', BASE), frames = Number(option('--frames', 1500)), samples = Number(option('--samples', 9));
assert(Number.isInteger(frames) && frames >= 100 && frames <= 5000, 'frames must be 100..5000');
assert(Number.isInteger(samples) && samples >= 3 && samples <= 15, 'samples must be 3..15');
const started = new Date().toISOString(), [baseline, candidate] = await createScenePair({ baselineRef });
const constructionDigest = appearanceDigest(baseline);
assert.equal(appearanceDigest(candidate), constructionDigest, 'exact-base and candidate construction appearance differs');
const initialLeft = nodesOf(baseline.scene), initialRight = nodesOf(candidate.scene);
const baked = initialRight.flatMap((n, index) => n.matrixAutoUpdate ? [] : [{ node: n, peer: initialLeft[index] }]);
assert(baked.length > 200);
const verificationStart = performance.now();
for (let frame = 0; frame < 120; frame++) {
  exerciseView(baseline, frame); exerciseView(candidate, frame);
  const left = nodesOf(baseline.scene), right = nodesOf(candidate.scene);
  assert.equal(left.length, right.length);
  left.forEach((node, index) => {
    assert(node.matrixWorld.equals(right[index].matrixWorld), `world matrix differs at frame ${frame}, node ${index}`);
    assert.equal(node.visible, right[index].visible);
  });
  assert(baseline.camera.matrixWorld.equals(candidate.camera.matrixWorld));
  assert(baseline.sun.shadow.matrix.equals(candidate.sun.shadow.matrix));
  assert.deepEqual(baseline.game.serialize(), candidate.game.serialize());
  if (frame % 20 === 0) {
    const cameraFrustum = new T.Frustum().setFromProjectionMatrix(new T.Matrix4().multiplyMatrices(candidate.camera.projectionMatrix, candidate.camera.matrixWorldInverse));
    const shadowFrustum = candidate.sun.shadow.getFrustum();
    for (const { node, peer } of baked) {
      assert(new T.Box3().setFromObject(node).equals(new T.Box3().setFromObject(peer)));
      if (node.isMesh) { assert.equal(cameraFrustum.intersectsObject(node), cameraFrustum.intersectsObject(peer)); assert.equal(shadowFrustum.intersectsObject(node), shadowFrustum.intersectsObject(peer)); }
    }
  }
}
assert.equal(appearanceDigest(baseline), appearanceDigest(candidate), 'post-animation geometry/material/instance state differs');
const verificationMs = performance.now() - verificationStart;

// Count work separately; prototype counters are restored before timed samples.
const countFrames = 60;
const work = [baseline, candidate].map(view => matrixWork(() => { for (let i = 0; i < countFrames; i++) view.scene.updateMatrixWorld(); }));
assert.equal(work[0].compose - work[1].compose, baked.length * countFrames);
assert.equal(work[0].multiplyMatrices, work[1].multiplyMatrices);
const countPerFrame = work.map(counts => Object.fromEntries(Object.entries(counts).map(([key, count]) => [key, count / countFrames])));

// Bounded, alternating-order, warmed native top-down scene-matrix traversals.
// This excludes Game.tick, view.update, animation, culling and all WebGL work.
for (let i = 0; i < 1000; i++) { baseline.scene.updateMatrixWorld(); candidate.scene.updateMatrixWorld(); }
const timings = [[], []];
for (let sample = 0; sample < samples; sample++) for (const side of sample % 2 ? [1, 0] : [0, 1]) {
  const scene = [baseline, candidate][side].scene, begin = performance.now();
  for (let frame = 0; frame < frames; frame++) scene.updateMatrixWorld();
  timings[side].push((performance.now() - begin) / frames);
}
const summary = values => { const sorted = [...values].sort((a, b) => a - b); return { medianMs: sorted[Math.floor(sorted.length / 2)], minMs: sorted[0], maxMs: sorted.at(-1), samplesMs: values }; };
const [baselineTiming, candidateTiming] = timings.map(summary);
console.log(JSON.stringify({ started, ended: new Date().toISOString(), baselineRef, threeRevision: T.REVISION, node: process.version,
  method: 'baked immutable local transforms; native world auto-update and traversal retained',
  graph: { initialNodes: initialLeft.length, sampledNodes: nodesOf(candidate.scene).length, bakedNodes: baked.length, constructionDigest },
  correctness: { frames: 120, verificationMs, exactWorldMatrices: true, appearanceAndInstanceData: true, boundsAndFrustumInputs: true, shadowsAndCameraMatrices: true, gameplayStateEqual: true },
  workPerSceneTraversal: { baseline: countPerFrame[0], candidate: countPerFrame[1], avoidedCompose: baked.length, avoidedMultiplyMatrices: 0 },
  cpuOnly: { warmupTraversalsPerVariant: 1000, framesPerSample: frames, samples, alternatingOrder: true,
    baseline: baselineTiming, candidate: candidateTiming, medianDifferenceMs: baselineTiming.medianMs - candidateTiming.medianMs,
    medianTraversalReductionPercent: (1 - candidateTiming.medianMs / baselineTiming.medianMs) * 100 },
  limitations: ['Node scene-matrix CPU traversal only, not total frame cost or device FPS', 'No WebGL, image decode, shader execution, rendering, audio, touch or physical device QA', 'Manual local transforms require updateMatrix after future edits and top-down world update after ancestor edits', 'No evidence of AAA quality or deadline completion'] }, null, 2));
