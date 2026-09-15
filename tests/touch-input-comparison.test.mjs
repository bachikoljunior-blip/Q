import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { compareTouchInput } from '../scripts/compare-touch-input.mjs';
import { buildCombatReview } from '../scripts/review-combat.mjs';

test('production touch routing matches direct combat input in portrait and landscape', () => {
  const comparison = compareTouchInput({ rounds: 3 });
  const version = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version;
  assert.equal(comparison.gameVersion, version);
  assert.equal(buildCombatReview().gameVersion, version);
  assert.equal(Object.values(comparison.checks).every(Boolean), true);
  assert.deepEqual(comparison.viewports.map(result => result.matchingRuns), [3, 3]);
  assert.deepEqual(comparison.viewports.map(result => result.pointer.hp), [120, 120]);
  assert.deepEqual(comparison.viewports.map(result => result.noResponse.hp), [98, 98]);
});
