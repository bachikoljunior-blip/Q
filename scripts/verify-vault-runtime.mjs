import { mkdir, writeFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import { buildIdentity } from './build-identity.mjs';
import { compileMain } from '../tests/main-runtime-fixture.mjs';
import { runVaultRuntimeScenario, vaultViewports } from '../tests/vault-runtime-scenarios.mjs';
import { VAULT_SLICES } from '../src/vault-slices.js';

const report = { schemaVersion: 1, passed: false, recordedAt: new Date().toISOString(), sourceFingerprint: null, scenarios: [], boundaries: ['Production main/Game/SaveStore and input listeners in a Node VM', 'SceneView call boundary; no WebGL pixels', 'Soundscape call boundary; no decoding, device output, or heard audio', 'Numerical viewport; no browser CSS or physical touch', 'Transient DOM cleanup timers are accepted but not time-advanced'] };
try {
  report.sourceFingerprint = (await buildIdentity()).sourceFingerprint; const compiled = await compileMain();
  for (const slice of VAULT_SLICES) for (const viewport of vaultViewports) { const start = performance.now(); const result = await runVaultRuntimeScenario(compiled, slice, viewport); report.scenarios.push({ ...result, hostMs: performance.now() - start }); }
  report.passed = true;
} catch (error) { report.error = { name: error.name, message: error.message, stack: error.stack }; process.exitCode = 1; }
finally { await mkdir('artifacts', { recursive: true }); await writeFile('artifacts/vault-runtime-report.json', JSON.stringify(report, null, 2) + '\n'); }
console.log(JSON.stringify({ passed: report.passed, slices: VAULT_SLICES.length, scenarios: report.scenarios.length, reloads: report.scenarios.length, sourceFingerprint: report.sourceFingerprint, report: 'artifacts/vault-runtime-report.json' }, null, 2));
