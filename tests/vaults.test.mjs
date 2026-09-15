import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { Game, distance, groundAt } from '../src/core.js';
import { findPath } from '../src/navigation.js';
import { lineClear, queryObstacles } from '../src/spatial.js';
import { combatPresentation } from '../src/combat-presentation.js';
import { VAULT_SLICES, availableVaultTargets, inVaultFootprint, vaultAnimationState } from '../src/vault-slices.js';
import { VaultScene, animateVaultWarden, decorateVaultWarden } from '../src/vault-scene.js';

const expectedSlices = [
  { id: 'ember-vault', center: { x: 55, z: 116 }, theme: 'ember', name: '熾火の納骨堂' },
  { id: 'tide-vault', center: { x: -55, z: 116 }, theme: 'tide', name: '潮錆の水祠' },
  { id: 'gale-vault', center: { x: 85, z: 145 }, theme: 'gale', name: '風蝕の鐘庭' },
  { id: 'moss-vault', center: { x: -85, z: 145 }, theme: 'moss', name: '苔影の石廊' },
];

test('each vault is a reachable closed-space contract with eight props and a unique four-state warden', () => {
  assert.deepEqual(VAULT_SLICES.map(({ id, center, theme, name }) => ({ id, center, theme, name })), expectedSlices);
  const ids = new Set(), labels = new Set();
  for (const slice of VAULT_SLICES) {
    assert.equal(slice.props.length, 8); assert.equal(slice.walls.length, 19); assert.equal(new Set(slice.props.map(prop => prop.id)).size, 8);
    assert.deepEqual(slice.animationStates, ['guard', 'prowl', 'charge', 'release']); assert(!labels.has(slice.wardenName)); labels.add(slice.wardenName);
    const game = new Game(), warden = game.enemies.find(enemy => enemy.id === slice.warden.id); assert(warden); assert.equal(warden.maxHp, 96); assert.equal(warden.vaultId, slice.id); assert(warden.maxHp > game.damageAmount() * 3);
    Object.assign(game.player, { x: slice.center.x, z: slice.center.z - slice.radius - .1, y: groundAt(slice.center.x, slice.center.z - slice.radius - .1), energy: 100 }); game.tick(1 / 60, {}); assert.equal(warden.state, 'sealed', `${slice.id}: an unopened warden can aggro through its wall`);
    const sealedHp = warden.hp; game.locked = warden.id; assert.equal(game.skill(), true); assert.equal(warden.hp, sealedHp, `${slice.id}: sealed warden accepted skill damage`); game.tick(1 / 60, {}); assert.equal(game.locked, null);
    Object.assign(game.player, { x: slice.center.x, z: slice.center.z, y: groundAt(slice.center.x, slice.center.z) }); game.tick(1 / 60, {}); assert.notEqual(warden.state, 'sealed');
    const vaultSolids = game.obstacles.filter(obstacle => obstacle.vaultId === slice.id); assert.equal(vaultSolids.length, 27);
    const path = findPath({ x: slice.center.x, z: slice.center.z + 16 }, slice.center, game.obstacles, .48); assert(path.length > 0); assert(distance(path.at(-1), slice.center) < 2.5);
    const wallSolids = vaultSolids.filter(obstacle => obstacle.type === 'vault-wall'), clearAngles = [];
    for (let index = 0; index < 120; index++) { const angle = index / 120 * Math.PI * 2, outside = { x: slice.center.x + Math.sin(angle) * 15, z: slice.center.z + Math.cos(angle) * 15 }; if (lineClear(slice.center, outside, wallSolids, .48)) clearAngles.push(Math.atan2(Math.sin(angle), Math.cos(angle))); }
    assert(clearAngles.length > 0); assert(clearAngles.every(angle => Math.abs(angle) < .16), `${slice.id}: an undeclared boundary passage is open`);
    assert(!ids.has(warden.id)); ids.add(warden.id);
  }
  const world = new Game(); assert.equal(world.trees.some(inVaultFootprint), false); assert.equal(world.pickups.some(inVaultFootprint), false);
  const states = ['idle', 'chase', 'windup', 'strike'].map(state => vaultAnimationState({ state })); assert.deepEqual(states, ['guard', 'prowl', 'charge', 'release']);
});

test('vault scene follows playable terrain and gives each warden four distinct structural poses', () => {
  const scene = new T.Scene(), game = new Game(), textures = Object.fromEntries(VAULT_SLICES.map(slice => [slice.theme, new T.Texture()])), vaultScene = new VaultScene(scene, game, groundAt, textures);
  const appearances = new Set();
  for (const slice of VAULT_SLICES) {
    const group = vaultScene.groups.get(slice.id), floor = group.children.find(node => node.userData.assetRole === 'terrain-floor'), position = floor.geometry.attributes.position;
    assert(floor); assert.equal(floor.material.map, textures[slice.theme]); assert(position.count > 300);
    for (let index = 0; index < position.count; index++) assert(Math.abs(group.position.y + position.getY(index) - groundAt(position.getX(index), position.getZ(index)) - .04) < 1e-4);
    const walls = group.children.filter(node => node.userData.assetRole === 'closed-space-wall'), props = group.children.filter(node => node.userData.assetRole?.startsWith('prop:'));
    assert.equal(walls.length, slice.walls.length); assert.deepEqual(new Set(props.map(node => node.userData.propId)), new Set(slice.props.map(prop => prop.id)));
    for (const [index, wall] of walls.entries()) assert(Math.abs(group.position.y + wall.position.y - wall.scale.y / 2 - groundAt(slice.walls[index].x, slice.walls[index].z)) < 1e-8);
    for (const [index, prop] of props.entries()) assert(Math.abs(group.position.y + prop.position.y - groundAt(slice.props[index].x, slice.props[index].z)) < 1e-8);
    const enemy = game.enemies.find(candidate => candidate.id === slice.warden.id), model = { g: new T.Group() }; decorateVaultWarden(model, enemy); appearances.add(model.vaultAdornment.shield.material.color.getHex());
    const poses = new Set(); for (const state of ['idle', 'chase', 'windup', 'strike']) { enemy.state = state; animateVaultWarden(model, enemy, 1.25); const a = model.vaultAdornment; poses.add([a.state, a.shield.rotation.x, a.crown.scale.x, a.eye.scale.z, a.group.position.y].join(':')); }
    assert.equal(poses.size, 4);
  }
  assert.equal(appearances.size, VAULT_SLICES.length);
});

test('warden defeat gates one canonical memory reward and exact progress survives reload', () => {
  for (const slice of VAULT_SLICES) {
    const game = new Game(), progress = game.vaults[slice.id], warden = game.enemies.find(enemy => enemy.id === slice.warden.id);
    Object.assign(game.player, { x: slice.center.x, z: slice.center.z, y: warden.y }); game.tick(1 / 60, {});
    assert.equal(progress.entered, true); assert.deepEqual(availableVaultTargets(game), []); assert.equal(game.interact({ id: 'forged-memory', type: 'vault-memory', vaultId: slice.id, x: game.player.x, z: game.player.z }), false);
    game.events.length = 0; game.hurtEnemy(warden, warden.hp); assert(game.events.some(event => event.type === 'save'), `${slice.id}: defeat was not saved immediately`); const target = availableVaultTargets(game)[0]; assert.equal(target.id, slice.focus.id);
    const before = { ash: game.player.ash, herbs: game.player.herbs }; assert.equal(game.interact(target), true); assert.equal(progress.claimed, true); assert.equal(game.player.ash, before.ash + 65); assert.equal(game.player.herbs, before.herbs + 1); assert.equal(game.interact(target), false);
    const save = game.serialize(), reload = new Game(save), restored = reload.enemies.find(enemy => enemy.id === slice.warden.id); assert.equal(reload.vaults[slice.id].entered, true); assert.equal(reload.vaults[slice.id].claimed, true); assert.equal(restored.dead, true); assert.deepEqual(availableVaultTargets(reload), []);
    const forged = structuredClone(save); forged.defeated = forged.defeated.filter(id => id !== slice.warden.id); assert.equal(new Game(forged).vaults[slice.id].claimed, false);
    const malformed = structuredClone(save); malformed.vaults[slice.id] = { entered: false, claimed: true }; const normalized = new Game(malformed); assert.deepEqual(normalized.vaults[slice.id], { entered: true, claimed: true });
  }
});

test('legacy positions overlapping new vault walls converge to a collision-free restore', () => {
  for (const slice of VAULT_SLICES) {
    const legacy = new Game().serialize(); legacy.player.x = slice.center.x - 9.9; legacy.player.z = slice.center.z - 4.5;
    const restored = new Game(legacy), p = restored.player;
    assert.equal(queryObstacles(restored.obstacles, p.x - .48, p.z - .48, p.x + .48, p.z + .48).some(obstacle => distance(p, obstacle) < obstacle.r + .48 - 1e-4), false, `${slice.id}: restored inside a new solid`);
  }
});

test('warden combat warnings use their authored encounter identity', () => {
  for (const slice of VAULT_SLICES) {
    const game = new Game(), warden = game.enemies.find(enemy => enemy.id === slice.warden.id);
    Object.assign(game.player, { x: slice.center.x, z: slice.center.z, y: groundAt(slice.center.x, slice.center.z) }); Object.assign(warden, { x: slice.center.x, z: slice.center.z - 2, y: groundAt(slice.center.x, slice.center.z - 2), angle: 0, state: 'windup', timer: .4, cooldown: 0 });
    game.vaults[slice.id].entered = true; const threat = combatPresentation(game, { limit: Infinity }).threats.find(candidate => candidate.sourceId === warden.id);
    assert.equal(threat?.source, slice.wardenName);
  }
});
