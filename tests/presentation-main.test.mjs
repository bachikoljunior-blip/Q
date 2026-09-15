import test from 'node:test';
import assert from 'node:assert/strict';
import { compileMain, createMainRuntime, deferred } from './main-runtime-fixture.mjs';

const compiled=compileMain();
test('a second title sound gesture cancels a pending unlock without a stale label',async()=>{
  const gate=deferred(),r=createMainRuntime(await compiled,{audioStartGate:gate});
  const pending=r.click('title-sound');await r.flush();
  assert.equal(r.element('title-sound').getAttribute('aria-busy'),'true');
  await r.click('title-sound');gate.resolve();await pending;
  assert.equal(r.audioRunning,false);assert.equal(r.element('title-sound').getAttribute('aria-busy'),null);
  assert.equal(r.element('title-sound').getAttribute('aria-pressed'),'false');assert.equal(r.sceneCalls,0);
});
for(const viewport of [{width:390,height:844},{width:844,height:390}]){
  test(`title sound, loading and return use production lifecycle ${viewport.width}x${viewport.height}`,async()=>{
    const r=createMainRuntime(await compiled,{viewport});
    assert.equal(r.sceneCalls,0);assert.equal(r.audioRunning,false);assert.equal(r.titleState.active,true);
    await r.click('title-sound');assert.equal(r.audioRunning,true);assert.equal(r.sceneCalls,0);
    assert.equal(r.element('title-sound').getAttribute('aria-pressed'),'true');
    await r.window.emit('blur');assert.equal(r.audioRunning,false);assert.equal(r.element('title-sound').getAttribute('aria-pressed'),'false');
    await r.click('start');await r.flush();assert.equal(r.titleState.launching,true);assert.equal(r.sceneCalls,1);
    r.scene.resolve();await r.flush();assert.equal(r.titleState.active,false);assert.equal(r.titleState.launching,false);
    r.frames(3);assert(r.soundUpdates.length>0);
    await r.click('pause-button');assert.equal(r.audioRunning,false);r.frames(2);assert.equal(r.view.lastUpdateDt,0);
    await r.click('to-title');assert.equal(r.state.playing,false);assert.equal(r.titleState.active,true);assert.equal(r.titleState.saveAvailable,true);
    assert.equal(r.audioRunning,false);await r.click('title-sound');assert.equal(r.audioRunning,true);assert.equal(r.sceneCalls,1);
    await r.click('title-sound');assert.equal(r.audioRunning,false);
  });
}
