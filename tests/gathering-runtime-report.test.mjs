import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, rm, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';

const root = new URL('../', import.meta.url).pathname;
const sourceSaves = join(root, 'release/review-saves');
const temporaryRoot = join(root, 'artifacts');

async function rejectsInput(name, mutate, expected) {
  await mkdir(temporaryRoot, { recursive: true });
  const temporary = await mkdtemp(join(temporaryRoot, 'q-gathering-report-'));
  const saves = join(temporary, 'review-saves');
  const reportPath = join(temporary, 'report.json');
  try {
    await cp(sourceSaves, saves, { recursive: true });
    await mutate(saves);
    const result = spawnSync(process.execPath, ['scripts/verify-gathering-runtime.mjs'], {
      cwd: root,
      encoding: 'utf8',
      env: { ...process.env, Q_GATHERING_SAVE_DIR: saves, Q_GATHERING_REPORT_PATH: reportPath },
      timeout: 10000,
    });
    assert.notEqual(result.status, 0, name + ' must fail the integration gate');
    assert.equal(result.error, undefined, name + ' must finish within the process timeout');
    const report = JSON.parse(await readFile(reportPath, 'utf8'));
    assert.equal(report.passed, false);
    assert.match(report.failure.message, expected);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}

test('missing walking-earned save still writes a failed diagnostic report', async () => {
  await rejectsInput('missing save', saves => unlink(join(saves, 'hearth-middle.json')), /hearth-middle\.json/);
});

test('corrupt walking-earned save still writes a failed diagnostic report', async () => {
  await rejectsInput('corrupt save', saves => writeFile(join(saves, 'hearth-middle.json'), '{broken'), /JSON/);
});

test('walking-earned save hash mismatch still writes a failed diagnostic report', async () => {
  await rejectsInput('hash mismatch', async saves => {
    const path = join(saves, 'hearth-middle.json');
    await writeFile(path, (await readFile(path, 'utf8')) + ' ');
  }, /must remain the reviewed walking-earned save/);
});
