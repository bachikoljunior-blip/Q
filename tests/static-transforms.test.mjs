import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { bakeStaticTransforms } from '../src/static-transforms.js';
import { createScenePair, nodesOf, exerciseView, matrixWork, appearanceDigest } from './static-scene-fixture.mjs';
import { inVaultFootprint, VAULT_SLICES } from '../src/vault-slices.js';

test('baked local transforms retain native world updates, parent motion and explicit local rebaking', () => {
  const scene = new T.Scene(), group = new T.Group(), child = new T.Mesh(new T.BoxGeometry(), new T.MeshStandardMaterial());
  scene.add(group); group.add(child); group.position.set(3, 2, -1); child.rotation.set(.2, .5, .7); child.scale.set(2, 3, .5);
  const baseline = scene.clone(); bakeStaticTransforms(group);
  for (let i = 0; i < 10; i++) {
    for (const root of [scene, baseline]) { root.position.set(i, 2 * i, -i); root.rotation.y = i * .13; root.scale.set(1 + i * .1, 1, .8); root.updateMatrixWorld(i % 2 === 0); }
    nodesOf(scene).forEach((n, index) => assert(n.matrixWorld.equals(nodesOf(baseline)[index].matrixWorld)));
    assert.deepEqual(new T.Box3().setFromObject(scene), new T.Box3().setFromObject(baseline));
  }
  assert.equal(group.matrixWorldAutoUpdate, true); assert.equal(scene.matrixAutoUpdate, true);
  child.position.x = 4; child.updateMatrix(); baseline.children[0].children[0].position.x = 4;
  scene.updateMatrixWorld(true); baseline.updateMatrixWorld(true);
  assert.deepEqual(child.matrixWorld.elements, baseline.children[0].children[0].matrixWorld.elements);
});

test('actual scenery graph stays identical through actor, weather, effects, quality, light and parent updates', async () => {
  const [baseline, candidate] = await createScenePair();
  assert.equal(candidate.vaultScene.groups.size, VAULT_SLICES.length); for (const group of candidate.vaultScene.groups.values()) { assert(group.children.some(node => node.userData.assetRole === 'terrain-floor')); assert.equal(group.children.filter(node => node.userData.assetRole?.startsWith('prop:')).length, 8); }
  const instance = new T.Matrix4(), position = new T.Vector3();
  for (let index = 0; index < candidate.grass.count; index++) { candidate.grass.getMatrixAt(index, instance); position.setFromMatrixPosition(instance); assert.equal(inVaultFootprint(position), false, `grass ${index} intersects a vault`); }
  const a = nodesOf(baseline.scene), b = nodesOf(candidate.scene);
  assert.equal(a.length, b.length);
  assert.equal(appearanceDigest(baseline), appearanceDigest(candidate));
  const baked = b.filter(n => !n.matrixAutoUpdate); assert(baked.length > 200);
  for (const node of b) assert.equal(node.matrixWorldAutoUpdate, true);
  assert.equal(candidate.scene.matrixAutoUpdate, true);
  const excluded = [candidate.camera, candidate.sun, candidate.sun.target, candidate.player.g,
    candidate.npc.g, candidate.sena.g, candidate.crownHalo, candidate.motes, candidate.weaponTrails.mesh,
    candidate.arrowShafts, candidate.arrowTips, candidate.sky, ...candidate.clouds, ...candidate.lootModels.values(),
    ...candidate.residentModels.values(), ...candidate.enemyModels.values(),
    ...[...candidate.village.bells.values()].map(b => b.swing), candidate.village.flame, candidate.village.charm,
    candidate.expeditionScene.root, ...[...candidate.gatheringScene.markers.values()].map(m => m.group)].map(n => n.g || n);
  for (const node of excluded) node.traverse(n => assert.equal(n.matrixAutoUpdate, true));
  for (const beacon of candidate.beacons.values()) for (const key of ['g', 'flame', 'ring', 'glow', 'beam']) assert.equal(beacon[key].matrixAutoUpdate, true);
  for (let i = 0; i < a.length; i++) {
    assert.equal(a[i].type, b[i].type); assert.equal(a[i].children.length, b[i].children.length);
    assert.deepEqual(a[i].position.toArray(), b[i].position.toArray()); assert.deepEqual(a[i].quaternion.toArray(), b[i].quaternion.toArray()); assert.deepEqual(a[i].scale.toArray(), b[i].scale.toArray());
    assert.equal(a[i].castShadow, b[i].castShadow); assert.equal(a[i].receiveShadow, b[i].receiveShadow);
    if (a[i].geometry) {
      for (const name of Object.keys(a[i].geometry.attributes)) assert.deepEqual(a[i].geometry.attributes[name].array, b[i].geometry.attributes[name].array);
      assert.deepEqual(a[i].geometry.index?.array, b[i].geometry.index?.array);
    }
    if (a[i].instanceMatrix) { assert.deepEqual(a[i].instanceMatrix.array, b[i].instanceMatrix.array); assert.deepEqual(a[i].instanceColor?.array, b[i].instanceColor?.array); }
  }
  const before = JSON.stringify(candidate.game.serialize());
  candidate.scene.updateMatrixWorld(); assert.equal(JSON.stringify(candidate.game.serialize()), before);
  const initialSkyTime = candidate.skyMaterial.uniforms.qAtmosphereTime.value, initialHalo = candidate.crownHalo.rotation.z;
  for (let frame = 0; frame < 90; frame++) {
    exerciseView(baseline, frame); exerciseView(candidate, frame);
    const left = nodesOf(baseline.scene), right = nodesOf(candidate.scene);
    assert.equal(left.length, right.length);
    for (let i = 0; i < left.length; i++) {
      assert.deepEqual(left[i].matrixWorld.elements, right[i].matrixWorld.elements, `world matrix frame ${frame}, node ${i}`);
      assert.equal(left[i].visible, right[i].visible);
    }
    assert.deepEqual(baseline.camera.matrixWorld.elements, candidate.camera.matrixWorld.elements);
    assert.deepEqual(baseline.sun.shadow.matrix.elements, candidate.sun.shadow.matrix.elements);
    assert.deepEqual(JSON.stringify(baseline.game.serialize()), JSON.stringify(candidate.game.serialize()));
    if (frame % 15 === 0) for (const node of baked) {
      const index = b.indexOf(node);
      assert.deepEqual(new T.Box3().setFromObject(a[index]), new T.Box3().setFromObject(node));
    }
  }
  assert(candidate.skyMaterial.uniforms.qAtmosphereTime.value > initialSkyTime); assert.notEqual(candidate.crownHalo.rotation.z, initialHalo);
  assert(candidate.sway.value > 0); assert(candidate.effects.length > 0);
  assert.equal(appearanceDigest(baseline), appearanceDigest(candidate));
  const baseCounts = matrixWork(() => baseline.scene.updateMatrixWorld());
  const candidateCounts = matrixWork(() => candidate.scene.updateMatrixWorld());
  assert.equal(baseCounts.compose - candidateCounts.compose, baked.length);
  // Scene's forced native world traversal intentionally remains unchanged.
  assert.equal(baseCounts.multiplyMatrices, candidateCounts.multiplyMatrices);
  for (const slice of VAULT_SLICES) {
    const enemy = candidate.game.enemies.find(item => item.id === slice.warden.id), model = candidate.enemyModels.get(slice.warden.id);
    assert.equal(model.type, 'soldier'); assert(model.vaultAdornment?.nativeDetailed, `${slice.id}: authored warden must use bone-bound theme geometry`);assert.equal(model.g.userData.theme,slice.theme);assert(model.vaultAdornment.crown);
    const poses = new Set();
    for (const state of ['idle', 'chase', 'windup', 'strike']) {
      Object.assign(candidate.game.player, { x: slice.center.x, z: slice.center.z }); Object.assign(enemy, { state, dead: false, x: slice.warden.x, z: slice.warden.z }); candidate.update(1 / 60, true);
      const adornment = model.vaultAdornment;poses.add([adornment.state,model.chest.rotation.x,model.arms[1].rotation.x,model.elbows[1].rotation.x,model.pelvis.position.y].join(':'));
    }
    assert.equal(poses.size, 4, `${slice.id}: SceneView did not drive all four warden poses`);
  }
});
