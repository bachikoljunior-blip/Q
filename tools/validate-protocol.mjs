import { globSync, readFileSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const failures = [];
const required = [
  'START_HERE.md',
  'AGENTS.md',
  'AI_DEVELOPMENT/PROTOCOL.md',
  'AI_DEVELOPMENT/STATE.yaml',
  'AI_DEVELOPMENT/REQUIREMENTS.yaml',
  'AI_DEVELOPMENT/WORK_GRAPH.yaml',
  'AI_DEVELOPMENT/ARCHIVE/MIGRATION_CHECKPOINT_2026-08-01.md'
];
for (const file of required) {
  try { if (!statSync(file).isFile()) failures.push(`${file} is not a file`); }
  catch { failures.push(`missing ${file}`); }
}

const read = file => {
  try { return readFileSync(file, 'utf8'); }
  catch { return ''; }
};
const start = read('START_HERE.md');
const protocol = read('AI_DEVELOPMENT/PROTOCOL.md');
const state = read('AI_DEVELOPMENT/STATE.yaml');
const loader = read('AGENTS.md');

if (start.length > 7000) failures.push('START_HERE.md is not concise');
for (const item of ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'exact_next_action']) {
  if (!start.includes(item) && !state.includes(item)) failures.push(`boot/state missing ${item}`);
}
if (!loader.includes('START_HERE.md') || !loader.includes('floor check line')) failures.push('AGENTS.md loader is incomplete');
for (const item of ['0. MANDATORY FLOOR', 'F1 — Continuity read', 'F2 — Continuity write', 'F3 — Execution verification', 'F4 — Status honesty', 'F5 — Falsification', 'F6 — Real-surface', 'F7 — Acceptance mapping', 'F8 — Skip accounting', 'F9 — Deterministic enforcement', '0.4 Unattended operation', '0.5 Enforcement state']) {
  if (!protocol.includes(item)) failures.push(`protocol floor missing ${item}`);
}
if (protocol.includes('M.1 Minimal infrastructure bootstrap')) failures.push('module library duplicated inside PROTOCOL.md');

const modules = globSync('AI_DEVELOPMENT/MODULES/*.md').sort();
if (modules.length !== 9) failures.push(`expected 9 module files, found ${modules.length}`);
for (const file of modules) if (!/^# M\.[1-9] /m.test(read(file))) failures.push(`invalid module heading ${file}`);

for (const field of ['f2_state_update_check:', 'f3_execution_check:', 'f5_review_record_check:', 'f6_public_revision_check:', 'revert_mechanism:', 'last_observed_failing:', 'unenforced_items:', 'unattended_allowed:']) {
  if (!state.includes(field)) failures.push(`state enforcement missing ${field}`);
}
if (!state.includes('unattended_allowed: false')) failures.push('unattended work must remain disabled during migration');
if (!/exact_next_action:\s*"[^"]+"/.test(state)) failures.push('state exact_next_action is empty');

const allowed = new Set(['complete_verified', 'complete_unverified', 'prepared_not_applied', 'prepared_not_executed', 'blocked', 'inconclusive', 'failed', 'rejected', 'rolled_back', 'superseded']);
for (const match of state.matchAll(/^\s*(?:[a-z_]+_)?status:\s*['"]?([a-z_]+)['"]?\s*$/gm)) {
  if (!allowed.has(match[1])) failures.push(`invalid F4 status ${match[1]}`);
}

for (const file of ['AI_DEVELOPMENT/ARCHIVE/PROJECT_OPERATING_PROTOCOL_v1.md', 'AI_DEVELOPMENT/ARCHIVE/STATE_v1.yaml', 'AI_DEVELOPMENT/ARCHIVE/PLAN_v1.yaml', 'AI_DEVELOPMENT/ARCHIVE/ACCEPTANCE_STARTHREAD_v1.yaml']) {
  if (!read(file)) failures.push(`empty legacy archive ${file}`);
}

const pages = read('.github/workflows/pages.yml');
if (pages && !pages.includes('paths:')) failures.push('Pages workflow lacks product-only path trigger');

try {
  const main = execFileSync('git', ['rev-parse', 'origin/main'], { encoding: 'utf8' }).trim();
  const head = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  const acceptable = [main];
  if (head === main) {
    try {
      acceptable.push(execFileSync('git', ['rev-parse', 'HEAD^'], { encoding: 'utf8' }).trim());
    } catch {
      // A root commit has no parent; the current revision remains the only candidate.
    }
  }
  if (!acceptable.some(revision => state.includes(revision))) {
    failures.push(`state does not preserve verified main context (${acceptable.join(' or ')})`);
  }
} catch (error) {
  failures.push(`cannot resolve origin/main: ${error.message}`);
}

if (process.env.FLOOR_TEST_BAD === 'F3') failures.push('DELIBERATE F3 FAILURE OBSERVED');

if (failures.length) {
  for (const failure of failures) console.error(`FAIL ${failure}`);
  process.exit(1);
}
console.log(`Protocol validation passed: ${required.length} canonical files, ${modules.length} on-demand modules, full floor markers, enforcement block, F4 statuses, archives, loader, and fresh-run resume pointer.`);
