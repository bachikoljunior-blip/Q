import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const args = process.argv.slice(2);
const valueAfter = flag => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : null;
};

const productPattern = /^(?:index\.html|styles\.css|icon\.svg|manifest\.webmanifest|sw\.js|release\.json|assets-manifest\.json|package(?:-lock)?\.json|assets\/|src\/|tests\/|tools\/|vendor\/|\.github\/workflows\/)/;

export function evaluateFloorGate({ changedFiles, stateText, stateDiffText = '' }) {
  const failures = [];
  const protectedChanges = changedFiles.filter(file => productPattern.test(file));
  const stateChanged = changedFiles.includes('AI_DEVELOPMENT/STATE.yaml');
  if (protectedChanges.length && !stateChanged) {
    failures.push(`F2: protected files changed without AI_DEVELOPMENT/STATE.yaml (${protectedChanges.join(', ')})`);
  }

  if (protectedChanges.length) {
    const level = stateText.match(/independence_level_used:\s*['"]?([ABCD])['"]?/i)?.[1]?.toUpperCase();
    const outcome = stateText.match(/review_outcome:\s*['"]?([a-z_]+)['"]?/i)?.[1];
    if (!['A', 'B', 'C'].includes(level || '') || outcome !== 'passed') {
      failures.push('F5: protected changes require independence_level_used A/B/C and review_outcome passed');
    }
    if (!/^[+-]\s*(?:independence_level_used|review_outcome|reviewed_at|review_scope):/m.test(stateDiffText)) {
      failures.push('F5: this change set must update its review record in AI_DEVELOPMENT/STATE.yaml');
    }
  }
  return failures;
}

const deliberate = valueAfter('--deliberate-failure');
if (deliberate) {
  const scenarios = {
    F2: { changedFiles: ['src/game.js'], stateText: 'independence_level_used: C\nreview_outcome: passed\n', stateDiffText: '+reviewed_at: now\n' },
    F2_ASSET: { changedFiles: ['assets/textures/ground.webp'], stateText: 'independence_level_used: C\nreview_outcome: passed\n', stateDiffText: '+reviewed_at: now\n' },
    F5: { changedFiles: ['src/game.js', 'AI_DEVELOPMENT/STATE.yaml'], stateText: 'independence_level_used: null\nreview_outcome: null\n', stateDiffText: '' }
  };
  const scenario = scenarios[deliberate.toUpperCase()];
  if (!scenario) {
    console.error(`Unknown deliberate failure: ${deliberate}`);
    process.exit(2);
  }
  const failures = evaluateFloorGate(scenario);
  if (!failures.length) {
    console.error(`DELIBERATE ${deliberate.toUpperCase()} FAILURE DID NOT FIRE`);
    process.exit(2);
  }
  console.error(`DELIBERATE ${deliberate.toUpperCase()} FAILURE OBSERVED`);
  for (const failure of failures) console.error(`FAIL ${failure}`);
  process.exit(1);
}

const base = valueAfter('--base') || 'origin/main';
let changedFiles;
try {
  changedFiles = execFileSync('git', ['diff', '--name-only', base], { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
} catch (error) {
  console.error(`FAIL unable to inspect changes from ${base}: ${error.message}`);
  process.exit(1);
}

let stateText = '';
let stateDiffText = '';
try {
  stateText = readFileSync('AI_DEVELOPMENT/STATE.yaml', 'utf8');
  stateDiffText = execFileSync('git', ['diff', base, '--', 'AI_DEVELOPMENT/STATE.yaml'], { encoding: 'utf8' });
} catch (error) {
  console.error(`FAIL F2 canonical state unavailable: ${error.message}`);
  process.exit(1);
}

const failures = evaluateFloorGate({ changedFiles, stateText, stateDiffText });
if (failures.length) {
  for (const failure of failures) console.error(`FAIL ${failure}`);
  process.exit(1);
}
console.log(`Floor gates passed for ${changedFiles.length} changed files from ${base}.`);
