import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { compileMain } from '../tests/main-runtime-fixture.mjs';
import { buildIdentity } from './build-identity.mjs';

const root = new URL('../', import.meta.url).pathname;
const reportPath = process.env.Q_GATHERING_REPORT_PATH
  ? resolve(process.env.Q_GATHERING_REPORT_PATH)
  : join(root, 'artifacts/gathering-runtime-report.json');
await mkdir(join(root, 'artifacts'), { recursive: true });
let temporary;

async function bounded(run) {
  let timer;
  try {
    return await Promise.race([run(), new Promise((_, reject) => {
      timer = setTimeout(() => reject(Error('Gathering application-boundary scenario timed out after 5 seconds')), 5000);
    })]);
  } finally {
    clearTimeout(timer);
  }
}

const mutations = [
  {
    id: 'scene-focus-call-skipped',
    expected: /gathering focus call must reach SceneView boundary/,
    before: "view?.focusGathering(id);activate('gathering-leave',closePanel);",
    after: "if(false)view?.focusGathering(id);activate('gathering-leave',closePanel);",
  },
  {
    id: 'scene-focus-release-skipped',
    expected: /active gathering close must release SceneView focus/,
    before: "function closePanel(){frameMetrics.sample(0,false);view?.focusGathering(null);paused=false;",
    after: "function closePanel(){frameMetrics.sample(0,false);if(false)view?.focusGathering(null);paused=false;",
  },
  {
    id: 'choice-result-rerender-skipped',
    expected: /selected gathering result must rerender/,
    before: "if(gatheringAction(game,id,c.id)){save();showGathering(id);}",
    after: "if(gatheringAction(game,id,c.id)){save();if(false)showGathering(id);}",
  },
  {
    id: 'completed-history-duplicated',
    expected: /middle consultation must expose exactly one completed history line/,
    before: "presentation.history.map(l=>'<div><strong>'+l.speaker+'</strong><p>'+l.text+'</p></div>').join('')",
    after: "presentation.history.flatMap(l=>[l,l]).map(l=>'<div><strong>'+l.speaker+'</strong><p>'+l.text+'</p></div>').join('')",
  },
];

const report = {
  schemaVersion: 1,
  evidence: 'Tracked walking-earned save through production main consultation UI and SceneView call boundary; controlled fault sensitivity',
  passed: false,
  host: { node: process.version, platform: process.platform, arch: process.arch },
  viewportMeaning: 'Numeric fixture inputs only; no CSS layout, pixels, hit testing or rendered viewport claim',
  boundaries: [
    'Real production main bundle, Game, SaveStore, lifecycle listeners and dynamically generated consultation controls',
    'Tracked review saves earned by the existing walking simulations',
    'SceneView create/focus/update call recorder only; production SceneView focus effects and WebGL renderer are not executed',
    'Soundscape call recorder; no audio device',
    'Element lookup/direct event dispatch fixture; no browser-native bubbling or hit testing',
  ],
  paths: ['SaveStore continue', 'title JSON import'],
  interruptions: ['blur', 'hidden then visible', 'pagehide/pageshow with persisted=true'],
  exclusions: [
    'browser DOM/CSS/hit testing', 'browser-native events and Promise timing', 'physical touch',
    'SceneView construction and rendered camera pixels', 'heard audio', 'device performance',
    'human playtest', 'external quality comparison',
  ],
  scenarios: [],
  negativeControls: [],
};

try {
  temporary = await mkdtemp(join(root, 'artifacts/gathering-runtime-controls-'));
  const source = await readFile(join(root, 'src/main.js'), 'utf8');
  report.build = await buildIdentity(root);
  report.mainSourceSha256 = createHash('sha256').update(source).digest('hex');
  const { gatheringScenarios, gatheringViewports } = await import('../tests/gathering-runtime-scenarios.mjs');
  const compileStarted = performance.now();
  const compiled = await compileMain();
  report.compileMs = performance.now() - compileStarted;
  for (const viewport of gatheringViewports) for (const scenario of gatheringScenarios) {
    const started = performance.now();
    const result = await bounded(() => scenario.run(compiled, viewport));
    report.scenarios.push({ ...result, viewport, passed: true, hostMs: performance.now() - started });
  }

  await cp(join(root, 'src'), join(temporary, 'src'), { recursive: true });
  await mkdir(join(temporary, 'tests'), { recursive: true });
  await cp(join(root, 'tests/gathering-presentation.test.mjs'), join(temporary, 'tests/gathering-presentation.test.mjs'));
  await cp(join(root, 'release/review-saves'), join(temporary, 'release/review-saves'), { recursive: true });
  await cp(join(root, 'package.json'), join(temporary, 'package.json'));

  for (const mutation of mutations) {
    assert.equal(source.split(mutation.before).length - 1, 1, 'negative control anchor must be unique: ' + mutation.id);
    const mutated = source.replace(mutation.before, mutation.after);
    assert.notEqual(mutated, source);
    await writeFile(join(temporary, 'src/main.js'), mutated);
    const priorStarted = performance.now();
    const output = execFileSync(process.execPath, ['--test', '--test-reporter=tap', 'tests/gathering-presentation.test.mjs'], {
      cwd: temporary, encoding: 'utf8', timeout: 10000,
    });
    const priorGateMs = performance.now() - priorStarted;
    assert.match(output, /# fail 0/);

    const candidate = await compileMain({ mutate: () => mutated });
    const detections = [];
    for (const viewport of gatheringViewports) for (const scenario of gatheringScenarios) {
      const started = performance.now();
      let failure;
      try {
        await bounded(() => scenario.run(candidate, viewport));
      } catch (error) {
        failure = error;
      }
      assert(failure, `integration gate missed ${mutation.id}: ${scenario.id} ${viewport.width}x${viewport.height}`);
      assert.equal(failure.code, 'ERR_ASSERTION', 'fixture/build failure is not a valid defect detection');
      assert.match(failure.message, mutation.expected, 'negative control must reach its defect-specific assertion');
      detections.push({ scenario: scenario.id, viewport, detected: true, assertion: failure.message, hostMs: performance.now() - started });
    }
    report.negativeControls.push({
      id: mutation.id,
      priorGatePassed: true,
      priorGateTests: Number(output.match(/# tests (\d+)/)?.[1]),
      priorGateMs,
      detections,
    });
  }
  report.passed = true;
  console.log(JSON.stringify({
    passed: true,
    scenarios: report.scenarios.length,
    launchPaths: report.scenarios.length * 2,
    reloads: report.scenarios.length * 2,
    negativeControls: report.negativeControls.length,
    detections: report.negativeControls.flatMap(control => control.detections).length,
    sourceFingerprint: report.build.sourceFingerprint,
    report: 'artifacts/gathering-runtime-report.json',
  }, null, 2));
} catch (error) {
  report.failure = { message: error.message, code: error.code ?? null };
  throw error;
} finally {
  await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n');
  if (temporary) await rm(temporary, { recursive: true, force: true });
}
