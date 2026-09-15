import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, mkdtemp, cp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { performance } from 'node:perf_hooks';
import { compileMain } from '../tests/main-runtime-fixture.mjs';
import { scenarios, viewports } from '../tests/main-runtime-scenarios.mjs';
import { buildIdentity } from './build-identity.mjs';

const root = new URL('../', import.meta.url).pathname;
const reportPath = join(root, 'artifacts/main-runtime-report.json');
await mkdir(join(root, 'artifacts'), { recursive: true });
const temporary = await mkdtemp(join(root, 'artifacts/main-runtime-controls-'));
const source = await readFile(join(root, 'src/main.js'), 'utf8');
async function bounded(run) {
  let timer;
  try {
    return await Promise.race([run(), new Promise((_, reject) => { timer = setTimeout(() => reject(Error('Application-boundary scenario timed out after 5 seconds')), 5000); })]);
  } finally { clearTimeout(timer); }
}
const mutations = [
  {
    id: 'launch-ignores-interruption', scenario: 'deferred-scene-blur',
    before: "if(interrupted){settingsPanel();suspendSound();}",
    after: "if(false){settingsPanel();suspendSound();}",
  },
  {
    id: 'active-import-ignores-interruption', scenario: 'active-save-import-and-invalid-file',
    before: "saved=save();if(interrupted){settingsPanel();suspendSound();}else closePanel();",
    after: "saved=save();if(false){settingsPanel();suspendSound();}else closePanel();",
  },
  {
    id: 'main-does-not-clear-pointer-owner', scenario: 'launch-input-pause-resume',
    before: 'pointerControls?.clear(reason);', after: 'false&&pointerControls?.clear(reason);',
  },
];
const report = {
  schemaVersion: 1, evidence: 'Node production-entrypoint boundary integration; controlled fault sensitivity',
  passed: false, host: { node: process.version, platform: process.platform, arch: process.arch },
  build: await buildIdentity(root), mainSourceSha256: createHash('sha256').update(source).digest('hex'),
  viewportMeaning: 'Numeric fixture inputs only; no responsive layout or rendered viewport test',
  boundaries: ['Element lookup/event dispatch fixture', 'Deferred SceneView fixture; no WebGL', 'Soundscape call recorder; no audio device', 'In-memory storage with injected write failure', 'Manually stepped requestAnimationFrame'],
  productionModules: ['main', 'Game and game rules', 'SaveStore', 'LifecycleGate', 'CombatInputQueue', 'bindTouchControls', 'FrameMetrics', 'HUD presentation'],
  exclusions: ['browser DOM/CSS/hit testing', 'browser-native events and Promise timing', 'physical touch', 'rendered pixels', 'heard audio', 'device performance', 'human playtest', 'external quality comparison'],
  scenarios: [], negativeControls: [],
};
try {
  const compileStarted = performance.now(), compiled = await compileMain();
  report.compileMs = performance.now() - compileStarted;
  for (const viewport of viewports) for (const scenario of scenarios) {
    const started = performance.now();
    await bounded(() => scenario.run(compiled, viewport));
    report.scenarios.push({ id: scenario.id, viewport, passed: true, hostMs: performance.now() - started });
  }
  // Run the actual pre-existing lifecycle and source-wiring tests against each
  // isolated input. Never edit the checkout's source or substitute live code.
  for (const path of ['src/touch-controls.js', 'src/lifecycle-gate.js', 'tests/touch-controls.test.mjs', 'tests/lifecycle-gate.test.mjs', 'index.html', 'package.json']) {
    const destination = join(temporary, path);
    await mkdir(join(destination, '..'), { recursive: true });
    await cp(join(root, path), destination);
  }
  for (const mutation of mutations) {
    assert(source.includes(mutation.before), 'negative control anchor disappeared: ' + mutation.id);
    const mutated = source.replace(mutation.before, mutation.after);
    assert.notEqual(mutated, source);
    await writeFile(join(temporary, 'src/main.js'), mutated);
    const oldStarted = performance.now();
    const output = execFileSync(process.execPath, ['--test', '--test-reporter=tap', 'tests/touch-controls.test.mjs', 'tests/lifecycle-gate.test.mjs'], { cwd: temporary, encoding: 'utf8', timeout: 10000 });
    const priorGateMs = performance.now() - oldStarted;
    assert.match(output, /# fail 0/);
    const candidate = await compileMain({ mutate: () => mutated });
    const scenario = scenarios.find(item => item.id === mutation.scenario), detections = [];
    for (const viewport of viewports) {
      const started = performance.now();
      let failure;
      try { await bounded(() => scenario.run(candidate, viewport)); } catch (error) { failure = error; }
      assert(failure, 'integration gate missed negative control: ' + mutation.id);
      assert.equal(failure.code, 'ERR_ASSERTION', 'fixture/build error is not a valid defect detection');
      detections.push({ viewport, detected: true, assertion: failure.message, hostMs: performance.now() - started });
    }
    report.negativeControls.push({ id: mutation.id, priorGatePassed: true, priorGateTests: Number(output.match(/# tests (\d+)/)?.[1]), priorGateMs, detections });
  }
  report.passed = true;
  console.log(JSON.stringify({ passed: true, scenarios: report.scenarios.length, negativeControls: report.negativeControls.length, detections: report.negativeControls.flatMap(control => control.detections).length, sourceFingerprint: report.build.sourceFingerprint, report: 'artifacts/main-runtime-report.json' }, null, 2));
} catch (error) {
  report.failure = { message: error.message, code: error.code ?? null };
  throw error;
} finally {
  await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n');
  await rm(temporary, { recursive: true, force: true });
}
