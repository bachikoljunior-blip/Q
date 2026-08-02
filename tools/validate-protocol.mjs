#!/usr/bin/env node
/**
 * validate-protocol.mjs — this repository's state gate.
 *
 * The assertions used to be hand-written here, and the same ones were hand-written again in
 * `Gptgame/scripts/verify-continuity.mjs`, `game2/tools/validate-project-state.mjs` and
 * `survival/tools/check_operating_state.mjs`. They agreed on the job and disagreed on the
 * details. The shared implementations now live in `.kit/lib/state/`; what stays here is this
 * repository's own vocabulary — its floor items, its module shape, its ten statuses.
 *
 * Nothing about the protocol this enforces has changed. The checks below are the same checks
 * expressed against shared primitives, plus one thing this file never had:
 *
 *   node tools/validate-protocol.mjs             # validate
 *   node tools/validate-protocol.mjs --selftest  # prove every check here can fail
 *
 * `--selftest` replaces the old `FLOOR_TEST_BAD=F3` hook, which proved only that a
 * hard-coded string could be appended to the failure list — not that any real check fires.
 * A silently inert gate and a passing gate are indistinguishable from outside: both print
 * nothing and exit 0.
 */

import { execFileSync } from 'node:child_process';
import { globSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  requireFiles, requireNonEmpty, requireByteCeiling, requireContains, requireAbsent,
} from '../.kit/lib/state/files.mjs';
import { reportGateSelfTests } from '../.kit/lib/state/selftest.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const argv = new Set(process.argv.slice(2));

/* ------------------------------------------------------- this repository's vocabulary */

const REQUIRED = [
  'START_HERE.md',
  'AGENTS.md',
  'AI_DEVELOPMENT/PROTOCOL.md',
  'AI_DEVELOPMENT/STATE.yaml',
  'AI_DEVELOPMENT/REQUIREMENTS.yaml',
  'AI_DEVELOPMENT/WORK_GRAPH.yaml',
  'AI_DEVELOPMENT/ARCHIVE/MIGRATION_CHECKPOINT_2026-08-01.md',
];

const CEILINGS = { 'START_HERE.md': 7000 };

const FLOOR_ITEMS = [
  '0. MANDATORY FLOOR',
  'F1 — Continuity read', 'F2 — Continuity write', 'F3 — Execution verification',
  'F4 — Status honesty', 'F5 — Falsification', 'F6 — Real-surface',
  'F7 — Acceptance mapping', 'F8 — Skip accounting', 'F9 — Deterministic enforcement',
  '0.4 Unattended operation', '0.5 Enforcement state',
];

const BOOT_MARKERS = ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'exact_next_action'];

const ENFORCEMENT_FIELDS = [
  'f2_state_update_check:', 'f3_execution_check:', 'f5_review_record_check:',
  'f6_public_revision_check:', 'revert_mechanism:', 'last_observed_failing:',
  'unenforced_items:', 'unattended_allowed:',
];

const LEGACY_ARCHIVES = [
  'AI_DEVELOPMENT/ARCHIVE/PROJECT_OPERATING_PROTOCOL_v1.md',
  'AI_DEVELOPMENT/ARCHIVE/STATE_v1.yaml',
  'AI_DEVELOPMENT/ARCHIVE/PLAN_v1.yaml',
  'AI_DEVELOPMENT/ARCHIVE/ACCEPTANCE_STARTHREAD_v1.yaml',
];

/** PROTOCOL.md §116. `passed` is deliberately not among them — see DECISIONS.md. */
const STATUSES = new Set([
  'complete_verified', 'complete_unverified', 'prepared_not_applied', 'prepared_not_executed',
  'blocked', 'inconclusive', 'failed', 'rejected', 'rolled_back', 'superseded',
]);

/* ------------------------------------------------------------------------- the checks */

/**
 * @param {object} [options]
 * @param {string} [options.root]
 * @param {(name: string) => string} [options.read] Injectable so the self-test can run the
 *   real checks against fabricated documents without writing to disk.
 * @returns {string[]} failures, empty when the state is valid
 */
export function validate({ root = ROOT, read } = {}) {
  const readFile = read || ((name) => {
    try { return readFileSync(join(root, name), 'utf8'); } catch { return ''; }
  });
  const failures = [];

  failures.push(...requireFiles(root, REQUIRED));
  failures.push(...requireNonEmpty(root, REQUIRED));
  failures.push(...requireByteCeiling(root, CEILINGS));

  const start = readFile('START_HERE.md');
  const protocol = readFile('AI_DEVELOPMENT/PROTOCOL.md');
  const state = readFile('AI_DEVELOPMENT/STATE.yaml');
  const loader = readFile('AGENTS.md');

  // A floor marker may be recorded in either the boot document or the state file.
  for (const item of BOOT_MARKERS) {
    if (!start.includes(item) && !state.includes(item)) failures.push(`boot/state missing ${item}`);
  }
  if (!loader.includes('START_HERE.md') || !loader.includes('floor check line')) {
    failures.push('AGENTS.md loader is incomplete');
  }
  for (const item of FLOOR_ITEMS) {
    if (!protocol.includes(item)) failures.push(`protocol floor missing ${item}`);
  }
  if (protocol.includes('M.1 Minimal infrastructure bootstrap')) {
    failures.push('module library duplicated inside PROTOCOL.md');
  }

  const modules = globSync('AI_DEVELOPMENT/MODULES/*.md', { cwd: root }).sort();
  if (modules.length !== 9) failures.push(`expected 9 module files, found ${modules.length}`);
  for (const file of modules) {
    if (!/^# M\.[1-9] /m.test(readFile(file))) failures.push(`invalid module heading ${file}`);
  }

  for (const field of ENFORCEMENT_FIELDS) {
    if (!state.includes(field)) failures.push(`state enforcement missing ${field}`);
  }
  if (!state.includes('unattended_allowed: false')) {
    failures.push('unattended work must remain disabled during migration');
  }
  if (!/exact_next_action:\s*"[^"]+"/.test(state)) failures.push('state exact_next_action is empty');

  for (const match of state.matchAll(/^\s*(?:[a-z_]+_)?status:\s*['"]?([a-z_]+)['"]?\s*$/gm)) {
    if (!STATUSES.has(match[1])) failures.push(`invalid F4 status ${match[1]}`);
  }

  for (const file of LEGACY_ARCHIVES) {
    if (!readFile(file)) failures.push(`empty legacy archive ${file}`);
  }

  const pages = readFile('.github/workflows/pages.yml');
  if (pages && !pages.includes('paths:')) failures.push('Pages workflow lacks product-only path trigger');

  failures.push(...verifiedMainContext(state, root));
  return failures;
}

/**
 * The state must still name a revision this checkout actually descends from.
 *
 * This used to accept `origin/main`, plus `HEAD^` only when `HEAD` happened to *be*
 * `origin/main`. That special case was there because the state legitimately lags main by a
 * commit — it names the revision it was verified against, which is main's parent. But the
 * allowance was keyed on standing exactly on main, so the check failed on every feature
 * branch: the state named a perfectly good ancestor and the gate rejected it. The new
 * `--selftest` control is what surfaced it; the old file had no control to fail.
 *
 * The generalisation is the rule the special case was approximating: *any* revision the
 * state names must be an ancestor of HEAD. That still rejects a fabricated or future SHA —
 * the case that matters — and stops rejecting honest branch work.
 */
function verifiedMainContext(state, root) {
  const git = (...args) => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' }).trim();
  const named = [...new Set(state.match(/\b[0-9a-f]{40}\b/g) || [])];
  if (!named.length) return ['state names no verified revision at all'];
  try {
    git('rev-parse', 'HEAD');
  } catch (error) {
    return [`cannot resolve HEAD: ${error.message}`];
  }
  const isAncestor = (revision) => {
    try {
      execFileSync('git', ['-C', root, 'merge-base', '--is-ancestor', revision, 'HEAD'], { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  };
  if (!named.some(isAncestor)) {
    return [`state does not preserve verified main context: none of its ${named.length} recorded revision(s) is an ancestor of HEAD`];
  }
  return [];
}

/* -------------------------------------------------------------------------- self-test */

/**
 * Every case must make a check fire, except the control, which must not. Both halves matter:
 * a gate that fires on everything is as broken as one that never fires.
 */
export function selfTestCases({ root = ROOT } = {}) {
  const real = (name) => {
    try { return readFileSync(join(root, name), 'utf8'); } catch { return ''; }
  };
  /** Serve one document altered and every other document unchanged. */
  const withEdit = (target, edit) => ({
    root,
    read: (name) => (name === target ? edit(real(name)) : real(name)),
  });
  const drop = (text, marker) => {
    if (!text.includes(marker)) throw new Error(`self-test fixture did not apply: ${marker}`);
    return text.split(marker).join('«removed»');
  };

  return [
    { name: 'control: this repository\'s own state passes', shouldFire: false, evaluate: () => validate({ root }) },
    {
      name: 'a floor item deleted from PROTOCOL.md',
      evaluate: () => validate(withEdit('AI_DEVELOPMENT/PROTOCOL.md', (t) => drop(t, 'F5 — Falsification'))),
    },
    {
      name: 'the enforcement block missing a field',
      evaluate: () => validate(withEdit('AI_DEVELOPMENT/STATE.yaml', (t) => drop(t, 'f6_public_revision_check:'))),
    },
    {
      name: 'a status outside the ten-value vocabulary',
      evaluate: () => validate(withEdit('AI_DEVELOPMENT/STATE.yaml', (t) => `${t}\n  status: in_progress\n`)),
    },
    {
      name: 'unattended work silently re-enabled',
      evaluate: () => validate(withEdit('AI_DEVELOPMENT/STATE.yaml',
        (t) => t.replace('unattended_allowed: false', 'unattended_allowed: true'))),
    },
    {
      name: 'an empty exact_next_action leaves the next run nothing to resume from',
      evaluate: () => validate(withEdit('AI_DEVELOPMENT/STATE.yaml',
        (t) => t.replace(/exact_next_action:\s*"[^"]+"/, 'exact_next_action: ""'))),
    },
    {
      name: 'the loader losing its pointer to START_HERE.md',
      evaluate: () => validate(withEdit('AGENTS.md', (t) => drop(t, 'START_HERE.md'))),
    },
    {
      name: 'the state losing the verified main revision',
      evaluate: () => validate(withEdit('AI_DEVELOPMENT/STATE.yaml',
        (t) => t.replace(/[0-9a-f]{40}/g, '0'.repeat(40)))),
    },
    {
      name: 'the module library copied back into PROTOCOL.md',
      evaluate: () => validate(withEdit('AI_DEVELOPMENT/PROTOCOL.md',
        (t) => `${t}\nM.1 Minimal infrastructure bootstrap\n`)),
    },
    {
      name: 'START_HERE.md grown past its ceiling',
      evaluate: () => requireByteCeiling(root, { 'START_HERE.md': 10 }),
    },
    {
      name: 'a required canonical file missing',
      evaluate: () => requireFiles(root, ['AI_DEVELOPMENT/NO_SUCH_FILE.yaml']),
    },
    {
      name: 'a document that must not contain a marker containing it',
      evaluate: () => requireAbsent(root, 'AI_DEVELOPMENT/PROTOCOL.md', ['0. MANDATORY FLOOR']),
    },
    {
      name: 'a required marker absent from a document',
      evaluate: () => requireContains(root, 'AGENTS.md', ['«a marker no loader contains»']),
    },
  ];
}

/* -------------------------------------------------------------------------------- cli */

if (import.meta.url === `file://${process.argv[1]}`) {
  if (argv.has('--selftest')) {
    const ok = await reportGateSelfTests(selfTestCases(), { label: 'validate-protocol' });
    process.exit(ok ? 0 : 1);
  }

  const failures = validate();
  if (failures.length) {
    for (const failure of failures) console.error(`FAIL ${failure}`);
    process.exit(1);
  }
  const modules = globSync('AI_DEVELOPMENT/MODULES/*.md', { cwd: ROOT });
  console.log(`Protocol validation passed: ${REQUIRED.length} canonical files, ${modules.length} on-demand modules, full floor markers, enforcement block, F4 statuses, archives, loader, and fresh-run resume pointer.`);
}
