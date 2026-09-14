import test from 'node:test';
import assert from 'node:assert/strict';
import {compareCombatView} from '../scripts/compare-combat-view.mjs';

test('camera-relative combat HUD satisfies the fixed screen-direction contract',()=>{
  const comparison=compareCombatView();
  assert.equal(comparison.baselineScreenContractMatches,1);
  assert.equal(comparison.candidateScreenContractMatches,4);
  assert.equal(comparison.changedDirections,3);
  assert.equal(comparison.stateUnchanged,true);
});
