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
  innerWidth: 568,
  innerHeight: 320,
  addEventListener: window.addEventListener.bind(window),
  removeEventListener: window.removeEventListener.bind(window),
  dispatchEvent: window.dispatchEvent.bind(window),
  __Q_HEADLESS__: true
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

const appRect = { x: 0, y: 0, left: 0, top: 0, right: 568, bottom: 320, width: 568, height: 320, toJSON() { return this; } };
const padRect = { x: 18, y: 202, left: 18, top: 202, right: 114, bottom: 298, width: 96, height: 96, toJSON() { return this; } };
const app = window.document.querySelector('#app');
const canvas = window.document.querySelector('#canvas');
const pad = window.document.querySelector('#move-pad');
app.getBoundingClientRect = () => appRect;
canvas.getBoundingClientRect = () => appRect;
pad.getBoundingClientRect = () => padRect;
for (const element of [canvas, pad]) {
  element.setPointerCapture = () => {};
  element.releasePointerCapture = () => {};
}

const gradient = { addColorStop() {} };
const context = new Proxy({
  canvas,
  createLinearGradient: () => gradient,
  createRadialGradient: () => gradient,
  measureText: text => ({ width: String(text).length * 7 })
}, {
  get(target, property) { return property in target ? target[property] : () => {}; },
  set(target, property, value) { target[property] = value; return true; }
});
window.HTMLCanvasElement.prototype.getContext = () => context;

const uncaught = [];
window.addEventListener('error', event => uncaught.push(event.message || String(event.error)));
window.addEventListener('unhandledrejection', event => uncaught.push(String(event.reason)));

await import(new URL(`../src/main.js?dom-test=${Date.now()}`, import.meta.url));
await new Promise(resolve => setImmediate(resolve));

assert.ok(window.document.querySelector('#menu').classList.contains('active'), 'menu opens');
assert.equal(window.document.title, 'Q: WILDBOUND');
assert.match(readFileSync(new URL('../styles.css', import.meta.url), 'utf8'), /#canvas\{[^}]*touch-action:none/);
assert.match(readFileSync(new URL('../styles.css', import.meta.url), 'utf8'), /\.primary,\.secondary\{[^}]*min-height:52px/);

window.document.querySelector('#new-game').click();
await new Promise(resolve => setImmediate(resolve));
assert.ok(window.document.querySelector('#tutorial').classList.contains('active'), 'fresh journey opens onboarding');
window.document.querySelector('#tutorial-skip').click();
frames(4);
let snapshot = globalThis.__Q_TEST__.snapshot();
assert.equal(snapshot.status, 'running');
assert.equal(window.document.querySelector('#hud').classList.contains('hidden'), false);
assert.ok(snapshot.enemyCount >= 9, 'the valley contains deterministic local enemies');

const startZ = snapshot.z;
pad.dispatchEvent(new window.PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerId: 4, clientX: 66, clientY: 238 }));
pad.dispatchEvent(new window.PointerEvent('pointermove', { bubbles: true, cancelable: true, pointerId: 4, clientX: 66, clientY: 204 }));
frames(55);
pad.dispatchEvent(new window.PointerEvent('pointerup', { bubbles: true, cancelable: true, pointerId: 4, clientX: 66, clientY: 204 }));
snapshot = globalThis.__Q_TEST__.snapshot();
assert.ok(Math.abs(snapshot.z - startZ) > 2, 'touch joystick moves the third-person player');

const stamina = snapshot.stamina;
window.document.querySelector('#dodge').dispatchEvent(new window.PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerId: 8 }));
frames(2);
assert.ok(globalThis.__Q_TEST__.snapshot().stamina < stamina, 'dodge consumes stamina');
window.document.querySelector('#attack').dispatchEvent(new window.PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerId: 9 }));
frames(3);

globalThis.__Q_TEST__.teleport(-185, 56);
const healthBeforeTelegraph = globalThis.__Q_TEST__.snapshot().health;
globalThis.__Q_TEST__.tick(.08);
assert.equal(globalThis.__Q_TEST__.enemy('mossfang_1').state, 'windup', 'nearby enemy enters an explicit attack windup');
globalThis.__Q_TEST__.tick(.25);
assert.equal(globalThis.__Q_TEST__.snapshot().health, healthBeforeTelegraph, 'enemy windup cannot deal immediate contact damage');
globalThis.__Q_TEST__.tick(.4);
assert.ok(globalThis.__Q_TEST__.snapshot().health < healthBeforeTelegraph, 'telegraphed active attack can deal damage after the warning');

window.document.querySelector('#pause').click();
assert.equal(globalThis.__Q_TEST__.snapshot().status, 'paused');
assert.ok(window.document.querySelector('#paused').classList.contains('active'));
window.document.querySelector('#open-map').click();
assert.ok(window.document.querySelector('#map-screen').classList.contains('active'), 'world map opens without leaving the journey');
window.document.querySelector('[data-back="paused"]').click();
window.document.querySelector('#resume').click();
assert.equal(globalThis.__Q_TEST__.snapshot().status, 'running');

globalThis.__Q_TEST__.teleport(-8, 264);
assert.equal(globalThis.__Q_TEST__.interact(), true, 'nearby NPC interaction fires');
assert.ok(window.document.querySelector('#dialogue').classList.contains('active'));
assert.match(window.document.querySelector('#dialogue-text').textContent, /三つの印/);
window.document.querySelector('#dialogue-close').click();
assert.equal(globalThis.__Q_TEST__.snapshot().quest.step, '0 / 3');
assert.equal(globalThis.__Q_TEST__.enemy('grove_warden').locked, false, 'first quest conversation unlocks guardians in the active session');
assert.equal(globalThis.__Q_TEST__.enemy('grove_warden').visible, true);
assert.equal(globalThis.__Q_TEST__.enemy('grove_warden').presentation, 'creature', 'guardian uses the new articulated creature presentation');
assert.ok(globalThis.__Q_TEST__.enemy('grove_warden').articulatedParts >= 4);

const enemiesBeforeCombat = globalThis.__Q_TEST__.snapshot().enemyCount;
globalThis.__Q_TEST__.teleport(-185, 52);
for (let strike = 0; strike < 3; strike += 1) { globalThis.__Q_TEST__.attack(); globalThis.__Q_TEST__.tick(.52); }
assert.ok(globalThis.__Q_TEST__.snapshot().enemyCount < enemiesBeforeCombat, 'normal sword combat defeats a roaming creature');

globalThis.__Q_TEST__.grant({ coins: 200, crystals: 5 });
globalThis.__Q_TEST__.teleport(12, 279);
assert.equal(globalThis.__Q_TEST__.interact(), true, 'blacksmith first explains the cost of the coming choices');
assert.ok(window.document.querySelector('#dialogue').classList.contains('active'));
assert.match(window.document.querySelector('#dialogue-text').textContent, /結界/);
window.document.querySelector('#dialogue-close').click();
assert.equal(globalThis.__Q_TEST__.interact(), true, 'blacksmith interaction opens camp after the introduction');
assert.ok(window.document.querySelector('#camp').classList.contains('active'));
window.document.querySelector('#upgrade-list .upgrade-card').click();
assert.equal(globalThis.__Q_TEST__.snapshot().upgrades.vigor, 1, 'forge spends resources on persistent character growth');
window.document.querySelector('#camp-close').click();

assert.equal(globalThis.__Q_TEST__.defeat('grove_warden'), true, 'grove guardian can be resolved through deterministic checkpoint injection');
assert.equal(globalThis.__Q_TEST__.snapshot().quest.step, '選択', 'the grove decision becomes the active consequence checkpoint');
assert.equal(globalThis.__Q_TEST__.snapshot().pendingChoice, 'grove_warden');
globalThis.__Q_TEST__.teleport(-410, -245);
assert.equal(globalThis.__Q_TEST__.interact(), true, 'defeated grove altar opens the persistent choice');
const groveChoices = [...window.document.querySelectorAll('.dialogue-choice')];
assert.equal(groveChoices.length, 2, 'the choice presents two distinct tradeoffs');
assert.match(groveChoices[1].textContent, /森へ還す/);
groveChoices[1].click();
assert.equal(globalThis.__Q_TEST__.snapshot().choices.grove, 'wild_bloom', 'choice is committed to game state');
assert.equal(globalThis.__Q_TEST__.snapshot().pendingChoice, null, 'committing the choice clears its durable pending checkpoint');
assert.equal(JSON.parse(window.localStorage.getItem('q-wildbound-save')).progress.choices.grove, 'wild_bloom', 'choice is persisted immediately in the versioned save');
assert.equal(globalThis.__Q_TEST__.choose('haven_ward'), false, 'a committed consequence cannot be overwritten');
assert.equal(globalThis.__Q_TEST__.snapshot().maxStamina, 116, 'wild choice produces a later mechanical stamina consequence');
assert.equal(window.document.querySelector('#dialogue-choices').classList.contains('hidden'), true, 'choice cannot be selected twice in the same dialogue');
window.document.querySelector('#dialogue-close').click();
assert.equal(globalThis.__Q_TEST__.snapshot().quest.step, '人物 1 / 3', 'the world inserts a playable character quest before the next objective');
globalThis.__Q_TEST__.teleport(-77.2, 238.8);
assert.equal(globalThis.__Q_TEST__.interact(), true, 'Mira starts the follow-up at the changed village boundary');
assert.match(window.document.querySelector('#dialogue-text').textContent, /柵|若木/);
assert.equal(globalThis.__Q_TEST__.snapshot().npcFlags.groveReport, true, 'Mira relationship aftermath is persisted');
assert.equal(globalThis.__Q_TEST__.snapshot().characterQuests.mira, 1);
window.document.querySelector('#dialogue-close').click();
globalThis.__Q_TEST__.teleport(-430, -180);
assert.equal(globalThis.__Q_TEST__.interact(), true, 'Mira quest continues at the broken scout marker');
assert.match(window.document.querySelector('#dialogue-text').textContent, /斥候標|風見の里/);
assert.equal(globalThis.__Q_TEST__.snapshot().characterQuests.mira, 2);
window.document.querySelector('#dialogue-close').click();
globalThis.__Q_TEST__.teleport(-77.2, 238.8);
assert.equal(globalThis.__Q_TEST__.interact(), true, 'returning the marker resolves Mira three-stage quest');
assert.equal(globalThis.__Q_TEST__.snapshot().characterQuests.mira, 3);
assert.equal(globalThis.__Q_TEST__.snapshot().relationships.mira, 3, 'honoring Mira aligned choice earns the strongest scout bond');
window.document.querySelector('#dialogue-close').click();
window.document.querySelector('#pause').click();
window.document.querySelector('#open-journal').click();
assert.match(window.document.querySelector('#journal-content').textContent, /ミラ.+信頼 3 \/ 3/s, 'journal records Mira quest resolution and relationship');
window.document.querySelector('[data-back="paused"]').click();
window.document.querySelector('#resume').click();

assert.equal(globalThis.__Q_TEST__.defeat('marsh_warden'), true);
assert.equal(globalThis.__Q_TEST__.snapshot().quest.step, '選択');
globalThis.__Q_TEST__.teleport(-520, 310);
assert.equal(globalThis.__Q_TEST__.interact(), true, 'marsh memory exposes the second delayed consequence');
const marshChoices = [...window.document.querySelectorAll('.dialogue-choice')];
assert.equal(marshChoices.length, 2);
marshChoices[0].click();
assert.equal(globalThis.__Q_TEST__.snapshot().choices.marsh, 'water_ward');
assert.ok(globalThis.__Q_TEST__.snapshot().maxHealth > 100, 'water ward changes later player survivability');
window.document.querySelector('#dialogue-close').click();
globalThis.__Q_TEST__.teleport(80.2, 307.8);
assert.equal(globalThis.__Q_TEST__.interact(), true, 'Orin works at the consequence-specific water channel');
assert.match(window.document.querySelector('#dialogue-text').textContent, /水門|代償/);
assert.equal(globalThis.__Q_TEST__.snapshot().npcFlags.marshReport, true, 'Orin relationship aftermath is persisted');
assert.equal(globalThis.__Q_TEST__.snapshot().characterQuests.orin, 1);
window.document.querySelector('#dialogue-close').click();
globalThis.__Q_TEST__.teleport(-220, 350);
assert.equal(globalThis.__Q_TEST__.interact(), true, 'Orin quest continues at the jammed sluice wheel');
assert.match(window.document.querySelector('#dialogue-text').textContent, /止水輪|泥|鉄/);
assert.equal(globalThis.__Q_TEST__.snapshot().characterQuests.orin, 2);
window.document.querySelector('#dialogue-close').click();
globalThis.__Q_TEST__.teleport(80.2, 307.8);
assert.equal(globalThis.__Q_TEST__.interact(), true, 'returning the inspection resolves Orin three-stage quest');
assert.equal(globalThis.__Q_TEST__.snapshot().characterQuests.orin, 3);
assert.equal(globalThis.__Q_TEST__.snapshot().relationships.orin, 3, 'supporting Orin aligned choice earns the strongest forge bond');
window.document.querySelector('#dialogue-close').click();
window.document.querySelector('#pause').click();
window.document.querySelector('#open-journal').click();
assert.match(window.document.querySelector('#journal-content').textContent, /オリン.+信頼 3 \/ 3/s, 'journal records Orin repair and relationship');
window.document.querySelector('[data-back="paused"]').click();
window.document.querySelector('#resume').click();

assert.equal(globalThis.__Q_TEST__.defeat('peak_warden'), true);
assert.equal(globalThis.__Q_TEST__.snapshot().quest.step, '選択');
globalThis.__Q_TEST__.teleport(500, -420);
assert.equal(globalThis.__Q_TEST__.interact(), true, 'peak memory exposes the third accumulated consequence');
const peakChoices = [...window.document.querySelectorAll('.dialogue-choice')];
assert.equal(peakChoices.length, 2);
peakChoices[1].click();
assert.equal(globalThis.__Q_TEST__.snapshot().choices.peak, 'wind_release');
window.document.querySelector('#dialogue-close').click();
snapshot = globalThis.__Q_TEST__.snapshot();
assert.equal(snapshot.sigils.length, 3);
assert.equal(snapshot.quest.step, '人物 1 / 3');
assert.equal(globalThis.__Q_TEST__.enemy('crown_warden').locked, true, 'the final command remains protected until Ilya is confronted');
assert.equal(globalThis.__Q_TEST__.defeat('crown_warden'), false, 'test injection cannot bypass the narrative progression lock');
globalThis.__Q_TEST__.teleport(0, -675);
assert.equal(globalThis.__Q_TEST__.interact(), true, 'the sealed Crown gate explains the remaining character scene');
assert.match(window.document.querySelector('#dialogue-text').textContent, /イリヤ|残響|神殿前/);
window.document.querySelector('#dialogue-close').click();
globalThis.__Q_TEST__.teleport(0, -615);
assert.equal(globalThis.__Q_TEST__.interact(), true, 'Ilya reveals the purpose of the divided sigils before the climax');
assert.match(window.document.querySelector('#dialogue-text').textContent, /十二年|決断/);
assert.equal(globalThis.__Q_TEST__.snapshot().npcFlags.ilyaTruth, true);
window.document.querySelector('#dialogue-close').click();
snapshot = globalThis.__Q_TEST__.snapshot();
assert.equal(snapshot.quest.step, '最終章');
assert.equal(globalThis.__Q_TEST__.enemy('crown_warden').locked, false, 'the final temple requires every guardian, consequence, and intervening character scene');
assert.equal(globalThis.__Q_TEST__.enemy('crown_warden').presentation, 'humanoid', 'Ilya command uses the articulated humanoid boss rig');
assert.equal(globalThis.__Q_TEST__.defeat('crown_warden'), true);
assert.ok(window.document.querySelector('#ending').classList.contains('active'), 'final guardian reaches the ending');
assert.equal(globalThis.__Q_TEST__.snapshot().victory, true);
assert.match(window.document.querySelector('#ending-copy').textContent, /若木/, 'the early grove choice changes the final account of the valley');
assert.match(window.document.querySelector('#ending-copy').textContent, /斥候標|相棒/, 'Mira relationship quest pays off in the ending');
assert.match(window.document.querySelector('#ending-copy').textContent, /井戸|湿原/, 'the marsh choice also appears in the ending');
assert.match(window.document.querySelector('#ending-copy').textContent, /止水輪|手入れ/, 'Orin relationship quest pays off in the ending');
assert.match(window.document.querySelector('#ending-title').textContent, /守ることと/, 'mixed accumulated choices reach the covenant ending');
window.document.querySelector('#free-roam').click();
assert.equal(globalThis.__Q_TEST__.snapshot().status, 'running', 'ending returns to free roam without reload');

globalThis.__Q_TEST__.damage(9999);
assert.ok(window.document.querySelector('#dead').classList.contains('active'), 'lethal damage reaches recoverable defeat');
window.document.querySelector('#respawn').click();
assert.equal(globalThis.__Q_TEST__.snapshot().status, 'running');
assert.equal(globalThis.__Q_TEST__.snapshot().health, globalThis.__Q_TEST__.snapshot().maxHealth, 'camp respawn restores health');

const finalMetrics = globalThis.__Q_TEST__.snapshot().metrics;
assert.ok(canvas.width * canvas.height <= 1_850_000, '3D backing store stays within the mobile pixel budget');
assert.ok(finalMetrics.drawCalls <= 170, `visible scene stays below the 170-call structural budget (${finalMetrics.drawCalls})`);
assert.ok(finalMetrics.triangles <= 170000, `visible scene stays below the 170k-triangle structural budget (${finalMetrics.triangles})`);
assert.ok(window.localStorage.getItem('q-wildbound-save'), 'journey is persisted locally');
assert.deepEqual(uncaught, [], `no DOM integration errors: ${uncaught.join('\n')}`);

console.log(`DOM journey passed: title/tutorial, mobile movement, articulated telegraphed combat, pause/map, three playable character aftermaths, persistent choice consequences, protected climax, accumulated ending, free roam, autosave, and pixel budget (${finalMetrics.drawCalls} calls / ${finalMetrics.triangles} triangles, ${finalMetrics.source}).`);
