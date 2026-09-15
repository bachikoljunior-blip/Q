import test from 'node:test';
import { compileMain } from './main-runtime-fixture.mjs';
import { gatheringScenarios, gatheringViewports } from './gathering-runtime-scenarios.mjs';

const compiled = await compileMain();
for (const viewport of gatheringViewports) for (const scenario of gatheringScenarios) {
  test(`production gathering boundary: ${scenario.id} (${viewport.width}x${viewport.height})`, { timeout: 5000 }, () => scenario.run(compiled, viewport));
}
