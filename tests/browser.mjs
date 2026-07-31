import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Window } from 'happy-dom';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8').replace(/<script type="module" src="src\/main\.js"><\/script>/, '');
const window = new Window({ url: 'http://127.0.0.1/Q/?test=1' });
window.document.write(html);
window.document.close();

const globals = {
  window,
  document: window.document,
  navigator: window.navigator,
  location: window.location,
  localStorage: window.localStorage,
  HTMLElement: window.HTMLElement,
  HTMLCanvasElement: window.HTMLCanvasElement,
  Event: window.Event,
  PointerEvent: window.PointerEvent,
  ResizeObserver: class { observe() {} disconnect() {} },
  matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
  devicePixelRatio: 2,
  addEventListener: window.addEventListener.bind(window),
  removeEventListener: window.removeEventListener.bind(window),
  dispatchEvent: window.dispatchEvent.bind(window),
};
for (const [key, value] of Object.entries(globals)) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
window.navigator.vibrate = () => true;

let now = 0;
let rafId = 0;
const queue = [];
globalThis.requestAnimationFrame = callback => { queue.push(callback); return ++rafId; };
globalThis.cancelAnimationFrame = () => {};

function frames(count) {
  for (let i = 0; i < count; i += 1) {
    const callback = queue.shift();
    assert.ok(callback, `animation callback exists for frame ${i}`);
    now += 1000 / 60;
    callback(now);
  }
}

const rect = { x: 0, y: 0, left: 0, top: 0, right: 375, bottom: 667, width: 375, height: 667, toJSON() { return this; } };
const app = window.document.querySelector('#app');
const canvas = window.document.querySelector('#canvas');
app.getBoundingClientRect = () => rect;
canvas.getBoundingClientRect = () => rect;
canvas.setPointerCapture = () => {};
canvas.releasePointerCapture = () => {};

const gradient = { addColorStop() {} };
const context = new Proxy({
  canvas,
  createLinearGradient: () => gradient,
  createRadialGradient: () => gradient,
  measureText: text => ({ width: String(text).length * 7 }),
}, {
  get(target, property) { return property in target ? target[property] : () => {}; },
  set(target, property, value) { target[property] = value; return true; },
});
canvas.getContext = () => context;

const uncaught = [];
window.addEventListener('error', event => uncaught.push(event.message || String(event.error)));
window.addEventListener('unhandledrejection', event => uncaught.push(String(event.reason)));

await import(new URL(`../src/main.js?dom-test=${Date.now()}`, import.meta.url));
await new Promise(resolve => setImmediate(resolve));

assert.ok(window.document.querySelector('#menu').classList.contains('active'), 'menu opens');
assert.equal(window.document.title, 'Q: STARTHREAD');
assert.match(readFileSync(new URL('../styles.css', import.meta.url), 'utf8'), /#canvas\{[^}]*touch-action:none/);
assert.match(readFileSync(new URL('../styles.css', import.meta.url), 'utf8'), /\.primary,.secondary\{[^}]*min-height:56px/);

window.document.querySelector('#start').click();
await new Promise(resolve => setImmediate(resolve));
assert.ok(window.document.querySelector('#tutorial').classList.contains('active'), 'fresh save opens tutorial');
window.document.querySelector('#tutorial-skip').click();
frames(4);
assert.equal(globalThis.__Q_TEST__.snapshot().status, 'running');
assert.equal(window.document.querySelector('#hud').classList.contains('hidden'), false);

const before = globalThis.__Q_TEST__.snapshot();
canvas.dispatchEvent(new window.PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerId: 7, clientX: 285, clientY: 240 }));
frames(38);
canvas.dispatchEvent(new window.PointerEvent('pointermove', { bubbles: true, cancelable: true, pointerId: 7, clientX: 105, clientY: 205 }));
frames(12);
canvas.dispatchEvent(new window.PointerEvent('pointerup', { bubbles: true, cancelable: true, pointerId: 7, clientX: 105, clientY: 205 }));
const after = globalThis.__Q_TEST__.snapshot();
assert.ok(after.energy < before.energy, 'holding the gravity tether consumes energy');
assert.equal(after.tethered, false, 'pointerup releases the gravity tether');

canvas.dispatchEvent(new window.PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerId: 8, clientX: 250, clientY: 220 }));
assert.equal(globalThis.__Q_TEST__.snapshot().tethered, true, 'new primary pointer acquires the tether');
canvas.dispatchEvent(new window.PointerEvent('lostpointercapture', { bubbles: true, pointerId: 8 }));
assert.equal(globalThis.__Q_TEST__.snapshot().tethered, false, 'lost pointer capture safely releases the tether');

canvas.dispatchEvent(new window.PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerId: 9, clientX: 230, clientY: 260 }));
window.dispatchEvent(new window.Event('blur'));
assert.equal(globalThis.__Q_TEST__.snapshot().tethered, false, 'window blur safely releases the tether');

window.document.querySelector('#pause').click();
assert.equal(globalThis.__Q_TEST__.snapshot().status, 'paused');
assert.ok(window.document.querySelector('#paused').classList.contains('active'));
window.document.querySelector('#resume').click();
await new Promise(resolve => setImmediate(resolve));
assert.equal(globalThis.__Q_TEST__.snapshot().status, 'running');

globalThis.__Q_TEST__.pause('orientation');
assert.match(window.document.querySelector('#pause-copy').textContent, /縦向き/);
window.document.querySelector('#resume').click();
await new Promise(resolve => setImmediate(resolve));
assert.equal(globalThis.__Q_TEST__.snapshot().status, 'running', 'orientation pause can recover through a gesture');

globalThis.__Q_TEST__.wave(4);
frames(78);
const boss = globalThis.__Q_TEST__.snapshot();
assert.equal(boss.wave, 4);
assert.ok(boss.enemies >= 4, 'middle boss and shield nodes spawn');

globalThis.__Q_TEST__.finish(false);
assert.ok(window.document.querySelector('#result').classList.contains('active'));
window.document.querySelector('#again').click();
frames(2);
assert.equal(globalThis.__Q_TEST__.snapshot().status, 'running', 'restart does not reload the page');

for (let wave = 1; wave <= 7; wave += 1) {
  globalThis.__Q_TEST__.wave(wave);
  globalThis.__Q_TEST__.clearWave();
  assert.equal(globalThis.__Q_TEST__.snapshot().status, 'upgrading', `wave ${wave} reaches upgrade selection`);
  const card = window.document.querySelector('#cards .card');
  assert.ok(card, `wave ${wave} offers an upgrade`);
  card.click();
  assert.equal(globalThis.__Q_TEST__.snapshot().wave, wave + 1, `upgrade advances beyond wave ${wave}`);
}
globalThis.__Q_TEST__.wave(8);
globalThis.__Q_TEST__.clearWave();
assert.ok(window.document.querySelector('#result').classList.contains('active'), 'eighth rift reaches ending');
assert.equal(window.document.querySelector('#result-title').textContent, 'DAWN RESTORED');
assert.ok(canvas.width * canvas.height <= 2_000_000, 'canvas backing store stays within budget');
assert.deepEqual(uncaught, [], `no DOM integration errors: ${uncaught.join('\n')}`);

console.log('DOM interaction passed: fresh menu, tutorial, tether input, fixed-step play, pause/resume, boss checkpoint, failure/restart, all upgrade transitions, final ending, and canvas budget.');
