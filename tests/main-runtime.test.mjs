import test from 'node:test';
import { compileMain } from './main-runtime-fixture.mjs';
import { scenarios, viewports } from './main-runtime-scenarios.mjs';

const compiled = await compileMain();
for (const viewport of viewports) for (const scenario of scenarios) {
  test(`production main boundary: ${scenario.id} (${viewport.width}x${viewport.height})`, { timeout: 5000 }, () => scenario.run(compiled, viewport));
}
