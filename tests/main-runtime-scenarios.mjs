import assert from 'node:assert/strict';
import { Game } from '../src/core.js';
import { createMainRuntime, deferred } from './main-runtime-fixture.mjs';

const SAVE_KEY = 'q-ash-pilgrim-v1';
const saveFixture = () => { const game = new Game(); game.player.hp = 73; game.player.herbs = 7; return game.serialize(); };
const hidden = (runtime, id) => runtime.element(id).classList.contains('hidden');
async function start(runtime) {
  await runtime.click('start'); runtime.scene.resolve(); await runtime.flush();
  assert.equal(runtime.state.playing, true); assert.equal(runtime.state.paused, false);
  assert.equal(hidden(runtime, 'title-screen'), true);
  assert.equal(hidden(runtime, 'hud'), false);
}
function paused(runtime) {
  assert.equal(runtime.state.playing, true);
  assert.equal(runtime.state.paused, true);
  assert.equal(hidden(runtime, 'panel-backdrop'), false);
  assert.equal(runtime.element('panel-title').textContent, '操作と設定');
  assert.equal(runtime.audioRunning, false);
  const before = JSON.stringify(runtime.view.game.serialize());
  runtime.frames(8);
  assert.equal(JSON.stringify(runtime.view.game.serialize()), before, 'paused frames must not advance the saved game');
}

export const scenarios = [
  {
    id: 'launch-input-pause-resume',
    async run(compiled, viewport) {
      const runtime = createMainRuntime(compiled, { viewport });
      assert.equal(runtime.sceneCalls, 0); assert.equal(runtime.audioRunning, false);
      assert.equal(runtime.state.playing, false);
      await runtime.click('start'); await runtime.flush();
      assert.equal(runtime.sceneCalls, 1);
      assert(runtime.events.indexOf('title:launching:true')<runtime.events.indexOf('scene:requested'));
      assert.equal(runtime.titleState.launching,true);
      for (const id of ['start', 'continue', 'import-title-save']) assert.equal(runtime.element(id).disabled, true);
      await runtime.click('start'); assert.equal(runtime.sceneCalls, 1);
      runtime.scene.resolve(); await runtime.flush();
      assert.equal(runtime.state.playing, true); assert.equal(runtime.state.paused, false);
      const game = runtime.view.game, initialZ = game.player.z;
      await runtime.pointer('joystick', 'pointerdown', 1, { clientY: viewport.height - 125 });
      await runtime.pointer('camera-zone', 'pointerdown', 2);
      await runtime.pointer('camera-zone', 'pointermove', 2, { clientX: 100 });
      const yaw = runtime.view.yaw;
      await runtime.pointer('attack-button', 'pointerdown', 3);
      assert(runtime.element('attack-button').classList.contains('pressed'));
      runtime.frames(12);
      assert.notEqual(game.player.z, initialZ, 'real main loop must consume movement input');
      assert(game.player.stamina < 100, 'real action queue must consume attack');
      await runtime.interrupt('blur'); paused(runtime);
      assert.equal(runtime.element('stick').style.transform, '');
      assert.equal(runtime.element('attack-button').classList.contains('pressed'), false);
      await runtime.pointer('camera-zone', 'pointermove', 2, { clientX: 180 });
      assert.equal(runtime.view.yaw, yaw, 'interruption must release camera ownership');
      await runtime.click('settings-close');
      assert.equal(runtime.state.paused, false); assert.equal(runtime.audioRunning, true);
      const resumedZ = game.player.z, stamina = game.player.stamina;
      runtime.frames(50);
      assert.equal(game.player.z, resumedZ, 'released movement must not resume itself');
      assert(game.player.stamina >= stamina, 'released attack must not remain held');
      await runtime.pointer('joystick', 'pointerdown', 4, { clientY: viewport.height - 125 });
      await runtime.window.emit('pagehide', { persisted: true });
      await runtime.window.emit('pageshow', { persisted: true }); paused(runtime);
      assert.equal(runtime.element('stick').style.transform, '');
      assert.equal(runtime.errors.length, 0);
    },
  },
  ...['blur', 'hidden', 'pagehide'].map(reason => ({
    id: 'deferred-scene-' + reason,
    async run(compiled, viewport) {
      const runtime = createMainRuntime(compiled, { viewport });
      await runtime.click('start'); await runtime.flush();
      await runtime.interrupt(reason);
      runtime.scene.resolve(); await runtime.flush();
      paused(runtime);
      assert(runtime.values.has(SAVE_KEY), 'completed interrupted launch must still save its state');
      for (const id of ['start', 'continue', 'import-title-save']) assert.equal(runtime.element(id).disabled, false);
      await runtime.click('settings-close');
      assert.equal(runtime.state.paused, false); assert.equal(runtime.audioRunning, true);
    },
  })),
  {
    id: 'deferred-title-import',
    async run(compiled, viewport) {
      const runtime = createMainRuntime(compiled, { viewport }), file = deferred(), save = saveFixture();
      await runtime.importFile(save, { delayed: file });
      assert.equal(runtime.titleState.launching,true);assert.equal(runtime.sceneCalls,0);
      for(const id of ['start','continue','import-title-save'])assert(runtime.element(id).disabled);
      await runtime.click('title-settings');await runtime.click('settings-close');
      assert.equal(runtime.titleState.launching,true,'settings does not release import ownership');
      await runtime.interrupt('blur');
      file.resolve(JSON.stringify(save)); await runtime.flush();
      runtime.scene.resolve(); await runtime.flush();
      paused(runtime);
      assert.equal(runtime.view.game.player.hp, 73);
      assert.equal(JSON.parse(runtime.values.get(SAVE_KEY)).player.herbs, 7);
      assert.equal(runtime.errors.length, 0);
    },
  },
  {
    id: 'title-import-invalid-file-restores-controls',
    async run(compiled, viewport) {
      const runtime=createMainRuntime(compiled,{viewport}),file=deferred();
      await runtime.importFile('invalid',{delayed:file});
      assert.equal(runtime.titleState.launching,true);assert.equal(runtime.sceneCalls,0);
      file.resolve('invalid');await runtime.flush();
      assert.equal(runtime.titleState.launching,false);assert.equal(runtime.titleState.active,true);
      assert.equal(runtime.sceneCalls,0);assert.equal(runtime.audioRunning,false);
      assert.equal(runtime.values.has(SAVE_KEY),false);assert.equal(hidden(runtime,'save-status'),false);
      for(const id of ['start','continue','import-title-save'])assert.equal(runtime.element(id).disabled,false);
    },
  },
  {
    id: 'active-save-import-and-invalid-file',
    async run(compiled, viewport) {
      const runtime = createMainRuntime(compiled, { viewport }); await start(runtime);
      await runtime.click('pack-button');
      const file = deferred(), pending = runtime.importFile(saveFixture(), { delayed: file, title: false });
      await runtime.interrupt('hidden'); file.resolve(JSON.stringify(saveFixture())); await pending; await runtime.flush();
      paused(runtime); assert.equal(runtime.view.game.player.hp, 73);
      await runtime.click('settings-close'); await runtime.click('pack-button');
      const before = runtime.values.get(SAVE_KEY), game = runtime.view.game;
      await runtime.importFile({ version: 1 }, { title: false }); await runtime.flush();
      assert.equal(runtime.view.game, game); assert.equal(runtime.values.get(SAVE_KEY), before);
      assert.match(runtime.element('toast').textContent, /有効なセーブ/);
    },
  },
  {
    id: 'scene-load-failure',
    async run(compiled, viewport) {
      const runtime = createMainRuntime(compiled, { viewport });
      await runtime.click('start'); await runtime.flush();
      runtime.scene.reject(Error('fixture scene unavailable')); await runtime.flush();
      assert.equal(runtime.state.playing, false); assert.equal(runtime.audioRunning, false);
      assert.equal(runtime.titleState.launching,false);assert.equal(runtime.titleState.active,true);
      assert.equal(hidden(runtime, 'fatal'), false); assert.equal(hidden(runtime, 'title-screen'), false);
      assert.equal(hidden(runtime, 'hud'), true); assert.equal(runtime.values.has(SAVE_KEY), false);
      assert.deepEqual(runtime.errors, ['fixture scene unavailable']);
      for (const id of ['start', 'continue', 'import-title-save']) assert.equal(runtime.element(id).disabled, false);
    },
  },
  {
    id: 'storage-and-gamepad-failure',
    async run(compiled, viewport) {
      const saved = saveFixture(), runtime = createMainRuntime(compiled, { save: saved, storageFailure: true, viewport });
      const launch = runtime.click('continue'); assert.equal(runtime.titleState.launching,true); runtime.scene.resolve(); await launch; await runtime.flush();
      assert.equal(runtime.view.game.player.hp, 73);
      await runtime.document.emit('keydown', { code: 'KeyW' }); runtime.frames(12);
      const previousSave = runtime.values.get(SAVE_KEY);
      runtime.setPadFailure(true); await runtime.interrupt('hidden'); paused(runtime);
      assert.equal(runtime.values.get(SAVE_KEY), previousSave, 'failed save preserves primary');
      await runtime.click('settings-close');
      const before = runtime.view.game.player.z; runtime.frames(12);
      assert.equal(runtime.view.game.player.z, before, 'gamepad exception must not interrupt key clearing');
      assert.equal(runtime.errors.length, 0);
    },
  },
];

export const viewports = [{ width: 390, height: 844 }, { width: 844, height: 390 }];
