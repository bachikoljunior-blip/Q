import test from 'node:test';
import assert from 'node:assert/strict';
import {combatOutcomes} from '../scripts/compare-combat-outcomes.mjs';

test('warnings and production HUD agree with actual contact in independent counterexamples',()=>{
  const results=combatOutcomes();
  for(const result of results)assert.equal(result.matchesContact,true,JSON.stringify(result));
  assert.deepEqual(results.map(r=>r.hp),[98,120,120,100,120,120,100,120,98]);
  for(const result of results.filter(r=>r.firstHurt!==null&&r.firstHurt!==undefined)){
    assert(Math.abs(result.firstHurt-result.predictedTime)<=2/60,JSON.stringify(result));
  }
  assert.match(results.at(-1).initialHud,/続く攻撃：灰冠の番人/);
});
