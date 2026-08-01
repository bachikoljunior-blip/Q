#!/usr/bin/env node
/**
 * floor-gates.mjs — F2 and F5, wired to git.
 *
 * The rules used to be implemented here. They are not any more: the same gate existed in
 * `Gptgame` as well, written independently, and the two could not both pass as written —
 * this repository demanded `review_outcome: passed` while `Gptgame` demanded
 * `complete_verified`. The shared implementation lives in `.kit/lib/state/floorGate.mjs` and
 * takes the accepted value as configuration; this file is now the wiring and this
 * repository's own constants.
 *
 * The accepted outcome here is now `complete_verified`. `passed` was never in the ten-value
 * status vocabulary this repository's own protocol defines (`AI_DEVELOPMENT/PROTOCOL.md`
 * §116) — the word does not appear anywhere in that document — so the gate was requiring a
 * value the protocol it enforces does not contain. See `AI_DEVELOPMENT/DECISIONS.md`.
 *
 *   node tools/floor-gates.mjs --base <ref>
 *   node tools/floor-gates.mjs --deliberate-failure F2|F2_ASSET|F5
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

import { evaluateFloorGate } from '../.kit/lib/state/floorGate.mjs';

const args = process.argv.slice(2);
const valueAfter = (flag) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : null;
};

const STATE_PATH = 'AI_DEVELOPMENT/STATE.yaml';

/**
 * This repository's own product surface, passed explicitly rather than inheriting the kit's
 * default — which does not list `assets/`. Taking the default would have silently stopped
 * protecting every generated asset in this project, and the gate would still have looked
 * like it was working.
 */
const PRODUCT_PATTERN = /^(?:index\.html|styles\.css|icon\.svg|manifest\.webmanifest|sw\.js|release\.json|assets-manifest\.json|package(?:-lock)?\.json|assets\/|src\/|tests\/|tools\/|vendor\/|\.github\/workflows\/)/;

const OPTIONS = {
  statePath: STATE_PATH,
  productPattern: PRODUCT_PATTERN,
  acceptedOutcomes: ['complete_verified'],
};

export const evaluate = (input) => evaluateFloorGate(input, OPTIONS);

/**
 * Scenarios that must produce a failure. Kept here rather than taken from the kit's
 * `floorGateScenarios` because F2_ASSET is specific to this repository's product pattern,
 * and it is the only case that proves `assets/` is still protected.
 */
const SCENARIOS = {
  F2: {
    changedFiles: ['src/game.js'],
    stateText: 'independence_level_used: C\nreview_outcome: complete_verified\n',
    stateDiffText: '+reviewed_at: now\n',
  },
  F2_ASSET: {
    changedFiles: ['assets/textures/ground.webp'],
    stateText: 'independence_level_used: C\nreview_outcome: complete_verified\n',
    stateDiffText: '+reviewed_at: now\n',
  },
  F5: {
    changedFiles: ['src/game.js', STATE_PATH],
    stateText: 'independence_level_used: null\nreview_outcome: null\n',
    stateDiffText: '',
  },
};

const deliberate = valueAfter('--deliberate-failure');
if (deliberate) {
  const scenario = SCENARIOS[deliberate.toUpperCase()];
  if (!scenario) {
    console.error(`Unknown deliberate failure: ${deliberate}`);
    process.exit(2);
  }
  const failures = evaluate(scenario);
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
  stateText = readFileSync(STATE_PATH, 'utf8');
  stateDiffText = execFileSync('git', ['diff', base, '--', STATE_PATH], { encoding: 'utf8' });
} catch (error) {
  console.error(`FAIL F2 canonical state unavailable: ${error.message}`);
  process.exit(1);
}

const failures = evaluate({ changedFiles, stateText, stateDiffText });
if (failures.length) {
  for (const failure of failures) console.error(`FAIL ${failure}`);
  process.exit(1);
}
console.log(`Floor gates passed for ${changedFiles.length} changed files from ${base}.`);
