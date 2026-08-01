import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import { WORLD_POINTS, objectiveFor, terrainHeight } from '../src/core.js';
import { World } from '../src/world.js';

test('procedural world builds a continuous local scene with every required destination', () => {
  const scene = new THREE.Scene();
  const world = new World(scene, 2);
  assert.equal(scene.getObjectByName('WILDBOUND_WORLD'), world.root);
  assert.ok(world.terrain.geometry.attributes.position.count >= 16000);
  assert.equal(world.discovery.size, WORLD_POINTS.length);
  for (const point of WORLD_POINTS) {
    const landmark = world.discovery.get(point.id);
    assert.ok(landmark, `${point.id} landmark exists`);
    assert.equal(landmark.group.position.x, point.x);
    assert.equal(landmark.group.position.y, terrainHeight(point.x, point.z));
  }
  assert.ok(world.trunks.count >= 500, 'forest density is substantial');
  assert.ok(world.grass.count >= 1500, 'grassland detail is populated');
  assert.ok(world.interactables.length >= 45, 'world includes NPC, camp, lore, cache, and resources');
  assert.ok(world.interactables.some(item => item.type === 'npc'));
  assert.ok(world.interactables.some(item => item.type === 'camp'));
  assert.ok(world.interactables.some(item => item.type === 'herb'));
  assert.ok(world.interactables.some(item => item.type === 'crystal'));
  world.dispose();
  assert.equal(scene.getObjectByName('WILDBOUND_WORLD'), undefined);
});

test('quality controls and objective marker change the runnable scene', () => {
  const scene = new THREE.Scene();
  const world = new World(scene, 2);
  assert.equal(world.fireflies.visible, true);
  world.setQuality(0);
  assert.equal(world.clouds.visible, false);
  assert.equal(world.grass.visible, false);
  assert.equal(world.flowers.visible, false);
  assert.equal(world.fireflies.visible, false);
  const target = objectiveFor({ story: 0, sigils: [], victory: false });
  world.setObjective(target);
  assert.equal(world.objective.group.visible, true);
  assert.equal(world.objective.group.position.x, target.x);
  world.setObjective(null);
  assert.equal(world.objective.group.visible, false);
  world.setChoices({ grove: 'haven_ward' });
  assert.equal(world.choiceVisuals.havenWard.visible, true);
  assert.equal(world.choiceVisuals.wildBloom.visible, false);
  world.setChoices({ grove: 'wild_bloom' });
  assert.equal(world.choiceVisuals.havenWard.visible, false);
  assert.equal(world.choiceVisuals.wildBloom.visible, true);
  world.setChoices({ marsh: 'water_ward', peak: 'wind_release' });
  assert.equal(world.choiceVisuals.waterWard.visible, true);
  assert.equal(world.choiceVisuals.ringRelease.visible, false);
  assert.equal(world.choiceVisuals.windWard.visible, false);
  assert.equal(world.choiceVisuals.windRelease.visible, true);
  world.setChoices({ marsh: 'ring_release', peak: 'wind_ward' });
  assert.equal(world.choiceVisuals.waterWard.visible, false);
  assert.equal(world.choiceVisuals.ringRelease.visible, true);
  assert.equal(world.choiceVisuals.windWard.visible, true);
  assert.equal(world.choiceVisuals.windRelease.visible, false);
  world.dispose();
});
