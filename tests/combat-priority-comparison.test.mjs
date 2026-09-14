import test from 'node:test';
import assert from 'node:assert/strict';
import {compareCombatPriority} from '../scripts/compare-combat-priority.mjs';

test('fixed v0.16/candidate multiple-threat and input-order comparison has no logic regression',()=>{
  const comparison=compareCombatPriority();assert.equal(comparison.improvementCount,6);assert.deepEqual(comparison.regressions,[]);assert.equal(comparison.baseline.followParry.hp,86);assert.equal(comparison.candidate.followDisplayedAction.hp,120);assert.equal(comparison.baseline.hpSpread,22);assert.equal(comparison.candidate.hpSpread,0);
});
