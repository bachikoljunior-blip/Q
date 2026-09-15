import test from 'node:test';
import assert from 'node:assert/strict';
import { LifecycleGate } from '../src/lifecycle-gate.js';

test('launch completion remains active only in the initiating lifecycle', () => {
  const gate = new LifecycleGate(), token = gate.begin();
  assert.equal(gate.shouldPause(token, { hidden: false, focused: true }), false);
  assert.equal(gate.shouldPause(token, { hidden: true, focused: true }), true);
  assert.equal(gate.shouldPause(token, { hidden: false, focused: false }), true);
});

test('blur, hidden or pagehide invalidates an in-flight asynchronous launch', async () => {
  for (const reason of ['blur', 'hidden', 'pagehide']) {
    const gate = new LifecycleGate(), token = gate.begin();
    const viewLoad = Promise.resolve().then(() => ({ ready: true }));
    gate.interrupt(reason);
    await viewLoad;
    assert.equal(gate.shouldPause(token, { hidden: false, focused: true }), true);
  }
});
