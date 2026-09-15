// Fixed production pointer-routing comparison. This dispatches events through
// src/touch-controls.js, but it is still a Node EventTarget harness rather than
// a browser, rendered frame, or physical touchscreen observation.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import * as T from 'three';
import { Game, groundAt } from '../src/core.js';
import { renderCombatHud } from '../src/combat-hud.js';
import { CombatInputQueue } from '../src/combat-input.js';
import { bindTouchControls } from '../src/touch-controls.js';
import { buildCombatReview } from './review-combat.mjs';

const BASE = '72bbf152199341adc69f291817c6e58211d4ef27';
const GAME_VERSION = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version;
const VIEWPORTS = [
  { id: 'portrait', width: 390, height: 844, devicePixelRatio: 3 },
  { id: 'landscape', width: 844, height: 390, devicePixelRatio: 3 },
];
const ROUNDS = 20;

class Classes {
  constructor() { this.values = new Set(); }
  add(value) { this.values.add(value); }
  remove(value) { this.values.delete(value); }
}

class PointerTarget extends EventTarget {
  constructor(box = null) {
    super();
    this.box = box;
    this.captures = new Set();
    this.classList = new Classes();
    this.style = { transform: '' };
  }
  getBoundingClientRect() { return this.box; }
  setPointerCapture(pointerId) { this.captures.add(pointerId); }
  hasPointerCapture(pointerId) { return this.captures.has(pointerId); }
  releasePointerCapture(pointerId) { this.captures.delete(pointerId); }
}

class PointerTraceEvent extends Event {
  constructor(type, { pointerId, pointerType = 'touch', clientX = 0, clientY = 0, button = 0 } = {}) {
    super(type, { bubbles: true, cancelable: true });
    Object.assign(this, { pointerId, pointerType, clientX, clientY, button });
  }
}

function dispatchPointer(target, type, values) {
  if (type === 'pointerdown' && target.box) {
    assert(values.clientX >= target.box.left && values.clientX <= target.box.left + target.box.width);
    assert(values.clientY >= target.box.top && values.clientY <= target.box.top + target.box.height);
  }
  target.dispatchEvent(new PointerTraceEvent(type, values));
  if (type === 'pointerup' || type === 'pointercancel') target.captures.delete(values.pointerId);
}

function applyFixture(game, fixture) {
  game.enemies.forEach(enemy => { enemy.dead = true; });
  game.obstacles = [];
  game.projectiles = [];
  game.events = [];
  game.lit = ['haven', 'grove', 'flood', 'ruins'];
  Object.assign(game.player, {
    ...fixture.player,
    y: groundAt(fixture.player.x, fixture.player.z),
    dead: false,
    invulnerable: 0,
    attack: 0,
    dodge: 0,
    parry: 0,
    healTimer: 0,
    grounded: true,
  });
  for (const definition of fixture.enemies) {
    const enemy = game.enemies.find(candidate => candidate.id === definition.id);
    assert(enemy, `Missing fixture enemy ${definition.id}`);
    Object.assign(enemy, {
      dead: false,
      x: definition.x,
      z: definition.z,
      homeX: definition.x,
      homeZ: definition.z,
      y: groundAt(definition.x, definition.z),
      angle: Math.atan2(fixture.player.x - definition.x, fixture.player.z - definition.z),
      state: 'windup',
      timer: definition.timer,
      windupMax: definition.timer,
      cooldown: 0,
      radial: !!definition.radial,
      hit: false,
      stagger: 0,
    });
  }
}

function scenarioFixture(review, scenarioId) {
  const scenario = review.scenarios.find(candidate => candidate.id === scenarioId);
  assert(scenario, `Missing scenario ${scenarioId}`);
  const fixture = review.fixturePatches[scenario.plan.fixture];
  assert(fixture, `Missing patch ${scenario.plan.fixture}`);
  const game = new Game(scenario.initial);
  applyFixture(game, fixture);
  return game;
}

function projection(game, viewport, view) {
  const player = game.player, distance = 9 * 1.12;
  const camera = new T.PerspectiveCamera(54, viewport.width / viewport.height, .1, 1100);
  const target = new T.Vector3(player.x, player.y + 1.6, player.z);
  camera.position.set(
    player.x + Math.sin(view.yaw) * Math.cos(view.pitch) * distance,
    player.y + 1.7 + Math.sin(view.pitch) * distance,
    player.z + Math.cos(view.yaw) * Math.cos(view.pitch) * distance,
  );
  camera.lookAt(target);
  camera.updateMatrixWorld();
  return position => {
    const point = new T.Vector3(position.x, position.y, position.z).project(camera);
    return {
      x: (point.x * .5 + .5) * viewport.width,
      y: (-point.y * .5 + .5) * viewport.height,
      visible: point.z < 1 && point.z > -1,
    };
  };
}

function hudNode() {
  return { textContent: '', setAttribute() {}, removeAttribute() {}, classList: { toggle() {} } };
}

function combatHud(game, viewport, view) {
  return renderCombatHud(hudNode(), { dodge: hudNode(), parry: hudNode(), jump: hudNode() }, game, {
    cameraYaw: view.yaw,
    project: projection(game, viewport, view),
    viewportWidth: viewport.width,
    viewportHeight: viewport.height,
  });
}

function digest(game) {
  return createHash('sha256').update(JSON.stringify(game.serialize())).digest('hex');
}

function tickRemaining(game, frames, firstInput) {
  game.tick(1 / 60, firstInput);
  for (let frame = 1; frame < frames; frame++) game.tick(1 / 60, { x: 0, z: 0, sprint: false });
}

function center(box) {
  return { clientX: box.left + box.width / 2, clientY: box.top + box.height / 2 };
}

// The boxes keep every synthetic pointerdown internally consistent with the
// current mobile CSS geometry. Events still target elements directly: this is
// not a DOM computed-style or hit-test observation.
function traceLayout(viewport) {
  if (viewport.id === 'portrait') return {
    joystick: { left: 21, top: 667, width: 94, height: 94 },
    camera: { left: 125, top: 190, width: 265, height: 364 },
    actions: {
      attack: { left: 285, top: 666, width: 74, height: 74 },
      dodge: { left: 222, top: 725, width: 56, height: 56 },
      parry: { left: 311, top: 609, width: 56, height: 56 },
      jump: { left: 137, top: 695, width: 56, height: 56 },
    },
  };
  return {
    joystick: { left: 40, top: 246, width: 93, height: 93 },
    camera: { left: 422, top: 57, width: 422, height: 136 },
    actions: {
      attack: { left: 751, top: 238, width: 74, height: 74 },
      dodge: { left: 671, top: 302, width: 56, height: 56 },
      parry: { left: 779, top: 207, width: 56, height: 56 },
      jump: { left: 584, top: 273, width: 56, height: 56 },
    },
  };
}

function pointerBinding(viewport, queue, view) {
  let clock = 0, dispatchDepth = 0, synchronousActions = 0;
  const layout = traceLayout(viewport);
  const actionButtons = Object.fromEntries(Object.entries(layout.actions).map(([name, box]) => [name, new PointerTarget(box)]));
  const joystick = new PointerTarget(layout.joystick);
  const stickElement = new PointerTarget(), world = new PointerTarget({ left: 0, top: 0, width: viewport.width, height: viewport.height }), camera = new PointerTarget(layout.camera);
  const controls = bindTouchControls({
    actionButtons,
    joystick,
    stickElement,
    cameraSurfaces: [world, camera],
    isEnabled: () => true,
    dispatchAction: name => { if (dispatchDepth > 0) synchronousActions++; queue.push(name); },
    getView: () => view,
    getSensitivity: () => 1,
    evidenceOptions: {
      now: () => clock,
      viewport: () => viewport,
    },
  });
  return {
    actionButtons, joystick, world, camera, controls, layout,
    advanceClock: value => { clock += value; },
    dispatch(target, type, values) {
      dispatchDepth++;
      try { dispatchPointer(target, type, values); } finally { dispatchDepth--; }
    },
    synchronousActions: () => synchronousActions,
  };
}

function movementInput(stick, yaw) {
  return {
    x: stick.x * Math.cos(yaw) + stick.y * Math.sin(yaw),
    z: stick.y * Math.cos(yaw) - stick.x * Math.sin(yaw),
    sprint: Math.hypot(stick.x, stick.y) > .88,
  };
}

function runThreeThreat(review, viewport, mode) {
  const game = scenarioFixture(review, 'three-threat-follow-hud'), queue = new CombatInputQueue(), view = { yaw: 0, pitch: .3 };
  let input, selected, evidence = null, residual = null;
  if (mode === 'direct') {
    view.yaw = -.12;
    view.pitch = .34;
    input = movementInput({ x: 1, y: 0 }, view.yaw);
    queue.push('dodge');
    selected = queue.flush(game, combatHud(game, viewport, view), input);
  } else {
    const binding = pointerBinding(viewport, queue, view);
    const stickStart = center(binding.layout.joystick), cameraStart = center(binding.layout.camera), dodge = center(binding.layout.actions.dodge);
    const maximum = binding.layout.joystick.width * .37;
    binding.dispatch(binding.joystick, 'pointerdown', { pointerId: 11, clientX: stickStart.clientX + maximum, clientY: stickStart.clientY });
    binding.dispatch(binding.camera, 'pointerdown', { pointerId: 12, ...cameraStart });
    binding.dispatch(binding.camera, 'pointermove', { pointerId: 12, clientX: cameraStart.clientX + 20, clientY: cameraStart.clientY + 10 });
    binding.dispatch(binding.actionButtons.dodge, 'pointerdown', { pointerId: 13, ...dodge });
    input = movementInput(binding.controls.stick, view.yaw);
    selected = queue.flush(game, combatHud(game, viewport, view), input);
    binding.advanceClock(16.667);
    binding.dispatch(binding.actionButtons.dodge, 'pointerup', { pointerId: 13, ...dodge });
    binding.dispatch(binding.camera, 'pointerup', { pointerId: 12, clientX: cameraStart.clientX + 20, clientY: cameraStart.clientY + 10 });
    binding.dispatch(binding.joystick, 'pointerup', { pointerId: 11, clientX: stickStart.clientX + maximum, clientY: stickStart.clientY });
    evidence = binding.controls.evidenceSnapshot();
    residual = binding.controls.stateSnapshot();
    evidence.enqueuedSynchronously = binding.synchronousActions() > 0;
  }
  tickRemaining(game, 40, input);
  return {
    digest: digest(game),
    hp: Math.round(game.player.hp),
    stamina: Math.round(game.player.stamina * 1000) / 1000,
    selected: selected.selected,
    accepted: selected.accepted,
    enqueuedSynchronously: evidence?.enqueuedSynchronously ?? true,
    input: { x: Math.round(input.x * 1e6) / 1e6, z: Math.round(input.z * 1e6) / 1e6, sprint: input.sprint },
    camera: { yaw: Math.round(view.yaw * 1e6) / 1e6, pitch: Math.round(view.pitch * 1e6) / 1e6 },
    evidence,
    residual,
  };
}

function runNoResponse(review, viewport) {
  const game = scenarioFixture(review, 'three-threat-no-response');
  tickRemaining(game, 40, { x: 0, z: 0, sprint: false });
  return { hp: Math.round(game.player.hp), digest: digest(game), viewport: viewport.id };
}

function runOrder(review, viewport, order) {
  const game = scenarioFixture(review, 'same-frame-attack-parry-touch-first'), queue = new CombatInputQueue(), view = { yaw: 0, pitch: .3 };
  const binding = pointerBinding(viewport, queue, view);
  order.forEach((name, index) => binding.dispatch(binding.actionButtons[name], 'pointerdown', { pointerId: 50 + index, ...center(binding.layout.actions[name]) }));
  if (binding.controls.attackHeld) queue.push('attack');
  const result = queue.flush(game, combatHud(game, viewport, view), { x: 0, z: 0, sprint: false });
  order.forEach((name, index) => binding.dispatch(binding.actionButtons[name], 'pointerup', { pointerId: 50 + index, ...center(binding.layout.actions[name]) }));
  tickRemaining(game, 30, { x: 0, z: 0, sprint: false });
  return { order, selected: result.selected, hp: Math.round(game.player.hp), digest: digest(game), residual: binding.controls.stateSnapshot() };
}

function comparable(run) {
  return {
    digest: run.digest,
    hp: run.hp,
    stamina: run.stamina,
    selected: run.selected,
    accepted: run.accepted,
    input: run.input,
    camera: run.camera,
  };
}

export function compareTouchInput({ rounds = ROUNDS } = {}) {
  const review = buildCombatReview(), viewports = [];
  for (const viewport of VIEWPORTS) {
    const direct = runThreeThreat(review, viewport, 'direct'), pointerRuns = Array.from({ length: rounds }, () => runThreeThreat(review, viewport, 'pointer'));
    const expected = JSON.stringify(comparable(direct));
    const pointer = pointerRuns[0], matchingRuns = pointerRuns.filter(run => JSON.stringify(comparable(run)) === expected).length;
    const noResponse = runNoResponse(review, viewport);
    const orders = [runOrder(review, viewport, ['attack', 'parry']), runOrder(review, viewport, ['parry', 'attack'])];
    const orderHpSpread = Math.max(...orders.map(run => run.hp)) - Math.min(...orders.map(run => run.hp));
    assert.equal(matchingRuns, rounds);
    assert.equal(pointer.selected, 'dodge');
    assert.equal(pointer.hp, 120);
    assert.equal(noResponse.hp, 98);
    assert.equal(pointer.evidence.maxConcurrentTouchPointers, 3);
    assert.equal(pointer.evidence.simultaneousChannels['action+camera+movement'], 1);
    assert.equal(pointer.evidence.activePointers, 0);
    assert.deepEqual(pointer.residual, { stick: { x: 0, y: 0 }, stickId: null, cameraId: null, actionPointers: 0, attackHeld: false });
    assert.deepEqual(orders.map(run => run.selected), ['parry', 'parry']);
    assert.deepEqual(orders.map(run => run.hp), [120, 120]);
    assert.equal(orderHpSpread, 0);
    assert.equal(orders[0].digest, orders[1].digest);
    viewports.push({ viewport, rounds, matchingRuns, direct, pointer, noResponse, orders, orderHpSpread });
  }
  return {
    formatVersion: 1,
    gameVersion: GAME_VERSION,
    baseRef: BASE,
    fixedStepHz: 60,
    frames: { threeThreat: 40, sameFrameOrder: 30 },
    checks: {
      portraitMatches: viewports[0].matchingRuns === rounds,
      landscapeMatches: viewports[1].matchingRuns === rounds,
      displayedDodgeSurvives: viewports.every(result => result.pointer.hp === 120 && result.pointer.selected === 'dodge'),
      negativeControlTakesDamage: viewports.every(result => result.noResponse.hp === 98),
      threeChannelsOverlap: viewports.every(result => result.pointer.evidence.maxConcurrentTouchPointers === 3),
      inputOrderStable: viewports.every(result => result.orderHpSpread === 0),
      noResidualInput: viewports.every(result => result.pointer.evidence.activePointers === 0 && result.pointer.residual.actionPointers === 0),
      synchronousEnqueueObserved: viewports.every(result => result.pointer.enqueuedSynchronously),
    },
    viewports,
    note: 'Direct CombatInputQueue input is compared with events dispatched through the production touch adapter on Node EventTarget. This does not observe a browser PointerEvent implementation, element hit-testing, CSS layout, WebGL pixels, physical touch, audio, device performance, or external player quality.',
  };
}

if (process.argv[1] && import.meta.url === new URL(process.argv[1], 'file:').href) {
  const comparison = compareTouchInput(), root = new URL('../release/combat-replays/', import.meta.url);
  mkdirSync(root, { recursive: true });
  writeFileSync(new URL('touch-input-comparison.json', root), JSON.stringify(comparison, null, 2) + '\n');
  console.log(JSON.stringify({ passed: Object.values(comparison.checks).every(Boolean), rounds: ROUNDS, viewports: comparison.viewports.map(result => ({ id: result.viewport.id, matches: `${result.matchingRuns}/${result.rounds}`, hp: result.pointer.hp, negativeHp: result.noResponse.hp, maxTouchPointers: result.pointer.evidence.maxConcurrentTouchPointers, orderHpSpread: result.orderHpSpread })), note: comparison.note }, null, 2));
}
