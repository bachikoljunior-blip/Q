import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { bindTouchControls, PointerEvidence } from '../src/touch-controls.js';

class Classes {
  constructor() { this.values = new Set(); }
  add(value) { this.values.add(value); }
  remove(value) { this.values.delete(value); }
  contains(value) { return this.values.has(value); }
}

class Target extends EventTarget {
  constructor(box = { left: 0, top: 0, width: 100, height: 100 }) {
    super();
    this.box = box;
    this.captures = new Set();
    this.classList = new Classes();
    this.style = { transform: '' };
  }
  getBoundingClientRect() { return this.box; }
  setPointerCapture(id) { this.captures.add(id); }
  hasPointerCapture(id) { return this.captures.has(id); }
  releasePointerCapture(id) { this.captures.delete(id); }
}

class PointerLikeEvent extends Event {
  constructor(type, { pointerId, pointerType = 'touch', clientX = 0, clientY = 0, button = 0 } = {}) {
    super(type, { bubbles: true, cancelable: true });
    Object.assign(this, { pointerId, pointerType, clientX, clientY, button });
  }
}

const pointer = (target, type, values) => {
  const event = new PointerLikeEvent(type, values);
  target.dispatchEvent(event);
  if (['pointerup', 'pointercancel'].includes(type)) target.captures.delete(values.pointerId);
  return event;
};

function fixture({ width = 390, height = 844 } = {}) {
  let now = 100, enabled = true;
  const actions = [], actionButtons = Object.fromEntries(['attack', 'dodge', 'parry'].map(name => [name, new Target()]));
  const joystick = new Target({ left: 10, top: height - 120, width: 100, height: 100 }), stickElement = new Target(), world = new Target(), cameraZone = new Target(), endTarget = new Target();
  const view = { yaw: 0, pitch: .3 };
  const controls = bindTouchControls({
    actionButtons,
    joystick,
    stickElement,
    cameraSurfaces: [world, cameraZone],
    isEnabled: () => enabled,
    dispatchAction: name => actions.push(name),
    getView: () => view,
    getSensitivity: () => 1,
    evidenceOptions: { now: () => now, viewport: () => ({ width, height, devicePixelRatio: 2 }) },
    endTarget,
  });
  return { actions, actionButtons, joystick, stickElement, world, cameraZone, endTarget, view, controls, setNow: value => { now = value; }, disable: () => { enabled = false; } };
}

test('portrait three-pointer trace keeps movement, camera and dodge independent', () => {
  const f = fixture();
  pointer(f.joystick, 'pointerdown', { pointerId: 11, clientX: 97, clientY: 774 });
  pointer(f.cameraZone, 'pointerdown', { pointerId: 12, clientX: 200, clientY: 300 });
  pointer(f.cameraZone, 'pointermove', { pointerId: 12, clientX: 220, clientY: 310 });
  const dodge = pointer(f.actionButtons.dodge, 'pointerdown', { pointerId: 13, clientX: 350, clientY: 740 });
  assert.equal(dodge.defaultPrevented, true);
  assert.deepEqual(f.actions, ['dodge']);
  assert.equal(f.controls.stick.x, 1);
  assert.equal(f.controls.stick.y, 0);
  assert.equal(f.view.yaw, -.12);
  assert(Math.abs(f.view.pitch - .34) < 1e-12);
  const active = f.controls.evidenceSnapshot();
  assert.equal(active.maxConcurrentTouchPointers, 3);
  assert.equal(active.simultaneousChannels['action+camera+movement'], 1);
  assert.equal(active.actions.dodge, 1);
  pointer(f.actionButtons.dodge, 'pointerup', { pointerId: 13 });
  pointer(f.cameraZone, 'pointerup', { pointerId: 12, clientX: 220, clientY: 310 });
  pointer(f.joystick, 'pointerup', { pointerId: 11, clientX: 97, clientY: 774 });
  assert.deepEqual(f.controls.stateSnapshot(), { stick: { x: 0, y: 0 }, stickId: null, cameraId: null, actionPointers: 0, attackHeld: false });
  assert.equal(f.controls.evidenceSnapshot().activePointers, 0);
});

test('landscape capture, cancellation, wrong ids and lifecycle clearing cannot leave input held', () => {
  const f = fixture({ width: 844, height: 390 });
  pointer(f.actionButtons.attack, 'pointerdown', { pointerId: 21 });
  pointer(f.actionButtons.attack, 'pointerdown', { pointerId: 22 });
  assert.equal(f.controls.attackHeld, true);
  assert.deepEqual(f.actions, ['attack']);
  pointer(f.actionButtons.attack, 'pointerup', { pointerId: 999 });
  assert.equal(f.controls.attackHeld, true);
  pointer(f.actionButtons.attack, 'pointercancel', { pointerId: 21 });
  assert.equal(f.controls.attackHeld, false);
  pointer(f.joystick, 'pointerdown', { pointerId: 31, clientX: 97, clientY: 320 });
  pointer(f.world, 'pointerdown', { pointerId: 32, clientX: 400, clientY: 180 });
  f.controls.clear('hidden');
  assert.equal(f.joystick.captures.size, 0);
  assert.equal(f.world.captures.size, 0);
  assert.equal(f.controls.evidenceSnapshot().clearedActivePointers, 2);
  assert.equal(f.controls.evidenceSnapshot().clearReasons.hidden, 1);
  assert.deepEqual(f.controls.stateSnapshot(), { stick: { x: 0, y: 0 }, stickId: null, cameraId: null, actionPointers: 0, attackHeld: false });
  f.disable();
  pointer(f.actionButtons.dodge, 'pointerdown', { pointerId: 41 });
  assert.deepEqual(f.actions, ['attack']);
  assert.equal(f.controls.evidenceSnapshot().rejected['action:disabled'], 1);
});

test('lost capture, blur and pagehide clearing each remove their pointer ownership', () => {
  const f = fixture();
  pointer(f.joystick, 'pointerdown', { pointerId: 61, clientX: 97, clientY: 774 });
  pointer(f.joystick, 'lostpointercapture', { pointerId: 61, clientX: 97, clientY: 774 });
  assert.equal(f.controls.stateSnapshot().stickId, null);
  pointer(f.world, 'pointerdown', { pointerId: 62, clientX: 200, clientY: 300 });
  f.controls.clear('blur');
  assert.equal(f.controls.stateSnapshot().cameraId, null);
  pointer(f.actionButtons.attack, 'pointerdown', { pointerId: 63 });
  f.controls.clear('pagehide');
  assert.equal(f.controls.attackHeld, false);
  assert.equal(f.controls.evidenceSnapshot().events.lostpointercapture, 1);
  assert.equal(f.controls.evidenceSnapshot().clearReasons.blur, 1);
  assert.equal(f.controls.evidenceSnapshot().clearReasons.pagehide, 1);
  assert.equal(f.controls.evidenceSnapshot().activePointers, 0);
});

test('pointer evidence separates portrait and landscape measurement sessions without raw positions', () => {
  let width = 390, height = 844, now = 0;
  const evidence = new PointerEvidence({ now: () => now, viewport: () => ({ width, height, devicePixelRatio: 3 }) });
  evidence.record('pointerdown', 'movement', { pointerId: 1, pointerType: 'touch', clientX: 10, clientY: 20 });
  evidence.record('pointermove', 'movement', { pointerId: 1, pointerType: 'touch', clientX: 13, clientY: 24 });
  now = 12.345;
  let snapshot = evidence.snapshot();
  assert.equal(snapshot.durationMs, 12.345);
  assert.equal(snapshot.viewports[0].orientation, 'portrait');
  assert.equal(snapshot.gestureDistanceCssPx.movement, 5);
  assert.equal(JSON.stringify(snapshot).includes('clientX'), false);
  width = 844; height = 390; now = 20;
  evidence.reset('viewport-change');
  snapshot = evidence.snapshot();
  assert.equal(snapshot.resetReason, 'viewport-change');
  assert.equal(snapshot.viewports[0].orientation, 'landscape');
  assert.equal(snapshot.activePointers, 0);
});

test('capture failure rolls back immediately and document end remains a fallback', () => {
  const f = fixture();
  f.actionButtons.attack.setPointerCapture = () => { throw Error('capture unavailable'); };
  pointer(f.actionButtons.attack, 'pointerdown', { pointerId: 71 });
  assert.equal(f.controls.attackHeld, false);
  assert.equal(f.actionButtons.attack.classList.contains('pressed'), false);

  f.joystick.setPointerCapture = () => { throw Error('capture unavailable'); };
  pointer(f.joystick, 'pointerdown', { pointerId: 72, clientX: 97, clientY: 774 });
  assert.equal(f.controls.stateSnapshot().stickId, null);

  f.world.setPointerCapture = () => { throw Error('capture unavailable'); };
  pointer(f.world, 'pointerdown', { pointerId: 73, clientX: 200, clientY: 300 });
  assert.equal(f.controls.stateSnapshot().cameraId, null);
  assert.deepEqual(f.controls.evidenceSnapshot().captureFailures, { action: 1, movement: 1, camera: 1 });

  const held = fixture();
  pointer(held.actionButtons.attack, 'pointerdown', { pointerId: 74 });
  assert.equal(held.controls.attackHeld, true);
  pointer(held.endTarget, 'pointerup', { pointerId: 74 });
  assert.equal(held.controls.attackHeld, false);
});

test('right-click parry is aggregated without leaving an active pointer', () => {
  const f = fixture();
  pointer(f.world, 'pointerdown', { pointerId: 81, pointerType: 'mouse', button: 2 });
  const evidence = f.controls.evidenceSnapshot();
  assert.deepEqual(f.actions, ['parry']);
  assert.equal(evidence.actions.parry, 1);
  assert.equal(evidence.pointerTypes.mouse, 1);
  assert.equal(evidence.activePointers, 0);
});

test('main wires the production adapter, lifecycle reset, device report and build identity', () => {
  const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(main, /import \{ bindTouchControls \} from '\.\/touch-controls\.js'/);
  assert.match(main, /function suspendSound\(\)\{[^}]*audio\.suspend\(\)/);
  assert.match(main, /pointerControls=bindTouchControls\(\{actionButtons:/);
  for (const action of ['attack', 'dodge', 'parry', 'jump', 'skill', 'heal', 'lock']) assert.match(main, new RegExp(`'${action}'`));
  assert.match(main, /resetMeasurements\('viewport-change'\);clearInput\('viewport-change'\)/);
  assert.match(main, /activate\('respawn',\(\)=>\{audio\.start\(\);game\.respawn\(\)/);
  assert.match(main, /addEventListener\('pageshow',event=>\{if\(!event\.persisted\)return;clearInput\('pageshow'\)/);
  assert.match(main, /addEventListener\('blur',\(\)=>\{lifecycleGate\.interrupt\(\);clearInput\('blur'\);suspendSound\(\)/);
  assert.match(main, /addEventListener\('pagehide',\(\)=>\{lifecycleGate\.interrupt\(\);clearInput\('pagehide'\);save\(\);suspendSound\(\)/);
  assert.match(main, /function standardPad\(\)\{try\{return Array\.from\(navigator\.getGamepads\?\.\(\)\|\|\[\]\)/);
  assert.match(main, /async function importSaveFile\(file\)\{[^}]+const lifecycleToken=lifecycleGate\.begin\(\)/);
  assert.match(main, /const interrupted=lifecycleGate\.shouldPause\(lifecycleToken,/);
  assert.match(main, /startGame\(false,\$\('import-title-save'\),interrupted\)/);
  assert.match(main, /async function startGame\(fresh,trigger,forcePause=false\)/);
  assert.match(main, /const lifecycleToken=lifecycleGate\.begin\(\);if\(!forcePause\)audio\.start\(\)/);
  assert.match(main, /if\(!await ensureView\(trigger\)\)\{suspendSound\(\);return null;\}/);
  assert.match(main, /const interrupted=forcePause\|\|lifecycleGate\.shouldPause/);
  assert.match(main, /schemaVersion:3[^;]+interaction:pointerControls\?\.evidenceSnapshot\(\)\|\|null/);
  assert.match(html, /id="build-version"[^>]*>DEVELOPMENT BUILD<\/span>/);
  assert.doesNotMatch(html, /DEVELOPMENT BUILD · 0\.\d+/);
  assert.match(main, /\$\('build-version'\)\.textContent=`DEVELOPMENT BUILD · \$\{BUILD_INFO\.version\}`/);
});
