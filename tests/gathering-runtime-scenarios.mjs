import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createMainRuntime } from './main-runtime-fixture.mjs';

const SAVE_KEY = 'q-ash-pilgrim-v1';
const definitions = [
  {
    id: 'hearth', file: 'hearth-middle.json', title: '炉を囲む約束',
    speaker: '薬師 イオ', finalSpeaker: '鍛冶師 レン', choice: 'medicine',
    expectedInputSha256: 'a0c99ac8a633ec29d48b647b12c448851d99e5d0daf593f47cac09444d53c5be',
    historySpeaker: '鍛冶師 レン',
    historyText: '風が戻った炉で、最初に何を作るか迷っていた。刃を打つつもりだったが、イオの鍋も底が抜けていてな。', currentText: '鍋は直してもらった', futureText: 'どちらから始めよう',
    result: '炉のそばに薬棚を作り、旅へ持ち出す露草を分けてもらった。',
    continueInterruption: 'blur', importInterruption: 'hidden',
  },
  {
    id: 'road-watch', file: 'road-watch-middle.json', title: '夜道の目印',
    speaker: '斥候 ユノ', finalSpeaker: '旅人 アサ', choice: 'light',
    expectedInputSha256: '71eb65aad4de50b5ef9c906f7601ba7165b699a5233dddbd1489aad87fcde5de',
    historySpeaker: '旅人 アサ',
    historyText: '昨夜、灯りを見失った親子を連れてきた。ここが見える距離でも、灰が舞うと道の縁が消える。', currentText: '着いたときには', futureText: '残った木材で',
    result: '野営地のそばに高い灯りが立った。アサは夜ごと灰を払いに来る。',
    continueInterruption: 'bfcache', importInterruption: 'blur',
  },
];

for (const definition of definitions) {
  const input = process.env.Q_GATHERING_SAVE_DIR
    ? join(process.env.Q_GATHERING_SAVE_DIR, definition.file)
    : new URL('../release/review-saves/' + definition.file, import.meta.url);
  const bytes = await readFile(input);
  definition.raw = bytes.toString('utf8');
  definition.save = JSON.parse(bytes);
  definition.inputSha256 = createHash('sha256').update(bytes).digest('hex');
  assert.equal(
    definition.inputSha256,
    definition.expectedInputSha256,
    definition.file + ' must remain the reviewed walking-earned save',
  );
}

const hidden = (runtime, id) => runtime.element(id).classList.contains('hidden');
const normalized = value => JSON.parse(JSON.stringify(value));

async function launch(compiled, viewport, save, route, raw = JSON.stringify(save)) {
  const runtime = createMainRuntime(compiled, route === 'continue' ? { save: normalized(save), viewport } : { viewport });
  let pending;
  if (route === 'continue') {
    pending = runtime.click('continue');
  } else {
    pending = runtime.importFile(raw);
  }
  await runtime.flush();
  assert.equal(runtime.sceneCalls, 1, route + ' must request the production SceneView boundary once');
  assert.equal(runtime.state.playing, false, 'the journey must wait for SceneView');
  runtime.scene.resolve();
  await pending;
  await runtime.flush();
  assert.equal(runtime.state.playing, true);
  assert.equal(runtime.state.paused, false);
  assert.equal(hidden(runtime, 'title-screen'), true);
  assert.equal(hidden(runtime, 'hud'), false);
  return runtime;
}

async function interruptGathering(runtime, interruption) {
  if (interruption === 'bfcache') {
    await runtime.window.emit('pagehide', { persisted: true });
    await runtime.window.emit('pageshow', { persisted: true });
  } else {
    await runtime.interrupt(interruption);
  }
}

async function openGathering(runtime, definition) {
  runtime.frames(7);
  assert.equal(hidden(runtime, 'interact'), false, 'earned save must load beside a real participant');
  await runtime.click('interact');
  runtime.frames();
  await runtime.flush();
  assert(runtime.element('gathering-open'), 'resident dialogue must expose the gathering route');
  const beforeOpen = JSON.stringify(runtime.view.game.serialize());
  const storedBeforeOpen = runtime.values.get(SAVE_KEY);
  await runtime.click('gathering-open');
  assert.equal(JSON.stringify(runtime.view.game.serialize()), beforeOpen, 'opening the read-only consultation must not mutate the game');
  assert.equal(runtime.values.get(SAVE_KEY), storedBeforeOpen, 'opening the consultation must not write a save');
  assert.equal(runtime.element('panel-title').textContent, definition.title);
  assert.equal(runtime.state.paused, true);
  assert.equal(runtime.view.gatheringFocus, definition.id, 'gathering focus call must reach SceneView boundary');
  assert.equal(runtime.view.focusCalls.at(-1), definition.id);
  const before = JSON.stringify(runtime.view.game.serialize());
  runtime.frames();
  assert.equal(JSON.stringify(runtime.view.game.serialize()), before, 'camera staging while paused must not advance the save');
  const sceneUpdate = runtime.view.sceneUpdates.at(-1);
  assert.equal(sceneUpdate.focus, definition.id);
  assert.equal(runtime.element('panel-body').querySelector('.dialogue-speaker').textContent, definition.speaker);
  assert.equal(runtime.element('panel-body').querySelector('.gathering-progress').textContent, '2 / 3');
  const history = runtime.element('panel-body').querySelector('.gathering-history').textContent;
  const historyLines = runtime.element('panel-body').querySelector('.gathering-history').querySelectorAll('div');
  assert.equal(historyLines.length, 1, 'middle consultation must expose exactly one completed history line');
  assert.equal(historyLines[0].querySelector('strong').textContent, definition.historySpeaker);
  assert.equal(historyLines[0].querySelector('p').textContent, definition.historyText);
  assert.match(history, new RegExp(definition.historyText));
  assert.doesNotMatch(history, new RegExp(definition.currentText));
  assert.doesNotMatch(history, new RegExp(definition.futureText));
}

async function reloadCompleted(compiled, viewport, save, definition) {
  const runtime = await launch(compiled, viewport, save, 'continue');
  assert.deepEqual(normalized(runtime.view.game.gatherings[definition.id]), { phase: 'done', beat: 2, choice: definition.choice });
  runtime.frames(7);
  await runtime.click('interact');
  runtime.frames();
  await runtime.flush();
  await runtime.click('gathering-open');
  assert.match(runtime.element('panel-body').textContent, new RegExp(definition.result));
  assert.equal(runtime.view.gatheringFocus, definition.id);
  runtime.frames();
  assert.equal(runtime.view.sceneUpdates.at(-1).focus, definition.id);
  assert.equal(runtime.element('panel-body').querySelector('.dialogue-speaker'), null);
  await runtime.click('gathering-leave');
  assert.equal(runtime.view.gatheringFocus, null);
  return normalized(runtime.view.game.serialize());
}

async function complete(compiled, viewport, definition, route, interruption) {
  const runtime = await launch(compiled, viewport, definition.save, route, definition.raw);
  assert.deepEqual(normalized(runtime.view.game.gatherings[definition.id]), { phase: 'talking', beat: 1, choice: null });
  await openGathering(runtime, definition);
  const beforeMidLeave = JSON.stringify(runtime.view.game.serialize());
  const storedBeforeMidLeave = runtime.values.get(SAVE_KEY);
  const midTime = runtime.view.game.time;
  await runtime.click('gathering-leave');
  assert.equal(JSON.stringify(runtime.view.game.serialize()), beforeMidLeave, 'closing an active conversation must not mutate the game');
  assert.equal(runtime.values.get(SAVE_KEY), storedBeforeMidLeave, 'closing an active conversation must not rewrite the save');
  assert.equal(runtime.view.gatheringFocus, null, 'active gathering close must release SceneView focus');
  assert.equal(runtime.view.focusCalls.at(-1), null);
  assert.equal(runtime.state.paused, false);
  const updatesBeforeResume = runtime.view.sceneUpdates.length;
  runtime.frames(2);
  assert.deepEqual(runtime.view.sceneUpdates[updatesBeforeResume], { focus: null });
  assert(runtime.view.game.time > midTime);
  await openGathering(runtime, definition);
  await interruptGathering(runtime, interruption);
  assert.equal(runtime.state.paused, true);
  assert.equal(runtime.view.gatheringFocus, definition.id, 'lifecycle interruption must preserve the open consultation');
  assert.equal(runtime.element('panel-title').textContent, definition.title);
  assert.equal(runtime.audioRunning, false);

  await runtime.click('gathering-next');
  assert.equal(runtime.view.game.gatherings[definition.id].beat, 2);
  assert.equal(runtime.element('panel-body').querySelector('.dialogue-speaker').textContent, definition.finalSpeaker);
  assert.equal(runtime.element('panel-body').querySelector('.gathering-progress').textContent, '3 / 3');
  assert.equal(runtime.view.gatheringFocus, definition.id);
  runtime.frames();
  assert.deepEqual(runtime.view.sceneUpdates.at(-1), { focus: definition.id });

  await runtime.click('gathering-' + definition.choice);
  assert.deepEqual(normalized(runtime.view.game.gatherings[definition.id]), { phase: 'done', beat: 2, choice: definition.choice });
  assert.match(runtime.element('panel-body').textContent, new RegExp(definition.result), 'selected gathering result must rerender');
  const stored = normalized(JSON.parse(runtime.values.get(SAVE_KEY)));
  assert.deepEqual(stored.gatherings[definition.id], { phase: 'done', beat: 2, choice: definition.choice });
  runtime.frames();
  assert.equal(runtime.view.sceneUpdates.at(-1).focus, definition.id);
  assert.equal(runtime.element('panel-body').querySelector('.dialogue-speaker'), null, 'the chosen result must not retain a staged speaker');
  const pausedTime = runtime.view.game.time;
  runtime.frames(4);
  assert.equal(runtime.view.game.time, pausedTime, 'the result panel remains a pause boundary');

  const beforeLeave = JSON.stringify(runtime.view.game.serialize());
  const storedBeforeLeave = runtime.values.get(SAVE_KEY);
  await runtime.click('gathering-leave');
  assert.equal(JSON.stringify(runtime.view.game.serialize()), beforeLeave, 'leaving the result panel must not mutate the game');
  assert.equal(runtime.values.get(SAVE_KEY), storedBeforeLeave, 'leaving the result panel must not rewrite the save');
  assert.equal(runtime.view.gatheringFocus, null);
  assert.equal(runtime.view.focusCalls.at(-1), null);
  assert.equal(runtime.state.paused, false);
  assert.equal(runtime.audioRunning, true);
  assert.equal(hidden(runtime, 'panel-backdrop'), true);
  runtime.frames(8);
  assert(runtime.view.game.time > pausedTime, 'the game loop must resume after the conversation closes');

  const reloaded = await reloadCompleted(compiled, viewport, stored, definition);
  return {
    route, interruption, sceneLoads: runtime.sceneCalls + 1,
    focusSequence: [...runtime.view.focusCalls],
    savedChoice: stored.gatherings[definition.id].choice,
    savedSha256: createHash('sha256').update(JSON.stringify(stored)).digest('hex'),
    reloadChoice: reloaded.gatherings[definition.id].choice,
  };
}

export const gatheringScenarios = definitions.map(definition => ({
  id: definition.id + '-saved-consultation', input: definition.file, inputSha256: definition.inputSha256,
  async run(compiled, viewport) {
    const fromStorage = await complete(compiled, viewport, definition, 'continue', definition.continueInterruption);
    const fromFile = await complete(compiled, viewport, definition, 'title-import', definition.importInterruption);
    assert.equal(fromStorage.savedSha256, fromFile.savedSha256, 'continue and title import must produce the same completed save');
    assert.equal(fromStorage.reloadChoice, fromFile.reloadChoice);
    return { id: definition.id, input: definition.file, inputSha256: definition.inputSha256, paths: [fromStorage, fromFile] };
  },
}));

export const gatheringViewports = [{ width: 390, height: 844 }, { width: 844, height: 390 }];
