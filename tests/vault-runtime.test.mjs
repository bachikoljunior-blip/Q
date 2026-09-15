import test from 'node:test';
import { compileMain } from './main-runtime-fixture.mjs';
import { VAULT_SLICES } from '../src/vault-slices.js';
import { runVaultRuntimeScenario, vaultViewports } from './vault-runtime-scenarios.mjs';

const compiled = await compileMain();
for (const slice of VAULT_SLICES) for (const viewport of vaultViewports) test(`production vault boundary: ${slice.id} (${viewport.width}x${viewport.height})`, () => runVaultRuntimeScenario(compiled, slice, viewport));
