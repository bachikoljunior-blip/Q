import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { distance } from '../src/core.js';
import { findPath } from '../src/navigation.js';
import { VAULT_SLICES } from '../src/vault-slices.js';
import { vaultCueForEvent } from '../src/vault-audio-cues.js';
import { createMainRuntime } from './main-runtime-fixture.mjs';

const SAVE_KEY = 'q-ash-pilgrim-v1', sha256 = value => createHash('sha256').update(value).digest('hex');

async function launchNew(compiled, viewport) {
  const runtime = createMainRuntime(compiled, { viewport, allowTimers: true }); assert.equal(runtime.values.has(SAVE_KEY), false, 'new-game runtime must begin with empty storage');
  const pending = runtime.click('start'); runtime.scene.resolve(); await pending; await runtime.flush();
  assert.equal(runtime.state.playing, true); return runtime;
}
async function key(runtime, code, frames) {
  await runtime.document.emit('keydown', { code, repeat: false }); runtime.frames(frames); await runtime.document.emit('keyup', { code });
}
async function drive(runtime, code, done, limit, message) {
  await runtime.document.emit('keydown', { code, repeat: false }); let frames = 0;
  while (!done() && frames++ < limit) runtime.frames(1);
  await runtime.document.emit('keyup', { code }); assert(done(), message); return frames;
}
async function followKeyboardRoute(runtime, target, limit, message) {
  // A wider route margin absorbs the production camera-relative WASD yaw while
  // every step still travels through the real input adapter and collision code.
  const game = runtime.view.game, player = game.player, points = [...findPath(player, target, game.obstacles, 1.2), target], pressed = new Set(); let frames = 0, index = 0, residualX = 0, residualZ = 0;
  assert(points.length > 1, `${message}: no navigation route`);
  const setKeys = async wanted => {
    for (const code of pressed) if (!wanted.has(code)) { await runtime.document.emit('keyup', { code }); pressed.delete(code); }
    for (const code of wanted) if (!pressed.has(code)) { await runtime.document.emit('keydown', { code, repeat: false }); pressed.add(code); }
  };
  while (index < points.length && frames++ < limit) {
    const point = points[index], dx = point.x - player.x, dz = point.z - player.z;
    if (Math.hypot(dx, dz) < .7) { index++; continue; }
    const yaw = runtime.view.yaw || 0, localX = dx * Math.cos(yaw) - dz * Math.sin(yaw), localZ = dx * Math.sin(yaw) + dz * Math.cos(yaw), scale = Math.max(Math.abs(localX), Math.abs(localZ), 1e-6), wanted = new Set();
    residualX += Math.abs(localX) / scale; residualZ += Math.abs(localZ) / scale;
    if (residualX >= 1) { wanted.add(localX > 0 ? 'KeyD' : 'KeyA'); residualX -= 1; }
    if (residualZ >= 1) { wanted.add(localZ > 0 ? 'KeyS' : 'KeyW'); residualZ -= 1; }
    await setKeys(wanted); runtime.frames(1);
  }
  await setKeys(new Set()); assert(distance(player, target) < 1.1, `${message}: ${JSON.stringify({ frames, index, points: points.length, player: { x: player.x, z: player.z }, target })}`); return frames;
}
async function walkFromSpawn(runtime, slice) {
  const player = runtime.view.game.player;
  await followKeyboardRoute(runtime, { x: slice.center.x, z: slice.center.z + 16 }, 2400, `${slice.id}: production keyboard route could not reach the entrance`);
  await drive(runtime, 'KeyW', () => player.z <= slice.center.z + 2.2, 500, `${slice.id}: production input could not enter the vault`);
}
const snapshot = (id, game) => ({ id, gameTime: game.time, position: { x: game.player.x, z: game.player.z }, hp: game.player.hp, stateSha256: sha256(JSON.stringify(game.serialize())) });

export async function runVaultRuntimeScenario(compiled, slice, viewport) {
  const runtime = await launchNew(compiled, viewport), game = runtime.view.game, warden = game.enemies.find(enemy => enemy.id === slice.warden.id), initialRaw = runtime.values.get(SAVE_KEY), milestones = [snapshot('new-game', game)];
  const start = { x: game.player.x, z: game.player.z }; assert(initialRaw, 'normal start must create a SaveStore primary');
  await walkFromSpawn(runtime, slice);
  await drive(runtime, 'KeyS', () => distance(game.player, warden) <= 3.25, 300, `${slice.id}: production input could not close on the moving warden`);
  assert(distance(start, game.player) > 45, `${slice.id}: production input did not traverse the world`); assert.equal(game.vaults[slice.id].entered, true); assert(distance(game.player, warden) <= 3.25, `${slice.id}: production movement did not reach combat`); milestones.push(snapshot('entered-vault', game));
  for (let frames = 0; frames < 180 && !runtime.soundCalls.some(call => call.type === 'enemySwing' && call.vaultId === slice.id); frames++) runtime.frames(1);
  assert(runtime.soundCalls.some(call => call.type === 'enemySwing' && call.vaultId === slice.id), `${slice.id}: warden never committed a production swing`); milestones.push(snapshot('warden-swing', game));
  await runtime.document.emit('keydown', { code: 'KeyJ', repeat: false });
  for (let i = 0; i < 300 && !warden.dead; i++) runtime.frames(1);
  await runtime.document.emit('keyup', { code: 'KeyJ' }); assert.equal(warden.dead, true, `${slice.id}: production combat did not defeat the warden`); assert(runtime.soundCalls.filter(call => call.type === 'hit' && call.vaultId === slice.id).length >= 4, `${slice.id}: combat did not require a multi-hit exchange`); milestones.push(snapshot('warden-defeated', game));
  await runtime.document.emit('keydown', { code: 'KeyW', repeat: false });
  for (let i = 0; i < 240 && distance(game.player, slice.focus) >= 2.8; i++) runtime.frames(1);
  await runtime.document.emit('keyup', { code: 'KeyW' }); assert(distance(game.player, slice.focus) < 3.2, `${slice.id}: production movement did not reach the memory`);
  await key(runtime, 'KeyE', 1); assert.equal(game.vaults[slice.id].claimed, true); assert.equal(runtime.element('panel-title').textContent, slice.name); assert.equal(runtime.element('panel-body').querySelector('.dialogue-text').textContent, slice.result); milestones.push(snapshot('result-visible', game));
  const claimedRaw = runtime.values.get(SAVE_KEY); assert(claimedRaw); assert.notEqual(sha256(claimedRaw), sha256(initialRaw)); const claimed = JSON.parse(claimedRaw); assert.equal(claimed.vaults[slice.id].claimed, true); assert(claimed.defeated.includes(slice.warden.id)); milestones.push({ id: 'saved', saveSha256: sha256(claimedRaw), saveBytes: Buffer.byteLength(claimedRaw) });
  const types = new Set(runtime.soundCalls.map(call => call.type)); for (const type of ['vaultEnter', 'vaultAlert', 'enemySwing', 'hit', 'vaultSeal', 'vaultClaim']) assert(types.has(type), `${slice.id}: missing production audio event ${type}`);
  // Footstep cadence now belongs to the real Soundscape, whose own tests cover
  // surface selection and distance thresholds. This boundary verifies that the
  // actual entry supplies moving, grounded positions inside this vault.
  assert(runtime.soundUpdates.some(call=>call.moving&&call.grounded&&!call.paused&&Math.hypot(call.x-slice.center.x,call.z-slice.center.z)<8), `${slice.id}: no locomotion input reached Soundscape`);
  assert(runtime.soundCalls.some(call => call.type === 'ambient' && call.theme === slice.theme), `${slice.id}: missing active ambient theme`);
  const cues = new Set(runtime.soundCalls.map(call => vaultCueForEvent(call.type, call)).filter(Boolean)); assert.deepEqual(cues, new Set(['alert', 'swing', 'impact', 'claim', 'seal']));
  await runtime.click('vault-result-close'); await runtime.click('pause-button'); await runtime.click('to-title'); assert.equal(runtime.state.playing, false); assert.equal(runtime.audioRunning, false); assert.equal(runtime.soundCalls.at(-1).type, 'ambient'); assert.equal(runtime.soundCalls.at(-1).theme, null);
  const fresh = createMainRuntime(compiled, { saveRaw: claimedRaw, viewport }); assert.equal(fresh.values.get(SAVE_KEY), claimedRaw, 'fresh VM must receive unchanged SaveStore bytes');
  const pending = fresh.click('continue'); fresh.scene.resolve(); await pending; await fresh.flush(); const restored = fresh.view.game;
  assert.equal(restored.vaults[slice.id].claimed, true); assert.equal(restored.enemies.find(enemy => enemy.id === slice.warden.id).dead, true); assert.equal(restored.nearestInteract()?.id === slice.focus.id, false); milestones.push(snapshot('fresh-runtime-restored', restored));
  return { slice: slice.id, viewport, initialSaveSha256: sha256(initialRaw), claimedSaveSha256: sha256(claimedRaw), movedMetres: Math.hypot(game.player.x - start.x, game.player.z - start.z), audioEvents: [...types].sort(), resolvedFileCues: [...cues].sort(), ambientTheme: slice.theme, milestones, result: slice.result };
}

export const vaultViewports = [{ width: 390, height: 844 }, { width: 844, height: 390 }];
