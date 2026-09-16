// Real SceneView construction/animation and real Three.js objects, without a DOM,
// texture decoding or WebGL. Only the renderer and async browser asset entrypoint
// are substituted. The renderer executes the native top-down matrix-update prefix;
// it does NOT draw, cull, upload buffers, compile shaders, or measure frame time.
import { registerHooks } from 'node:module';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import * as T from 'three';
import { Game, random } from '../src/core.js';
import { loadCharacter } from './character-fixture.mjs';

const sceneURL = new URL('../src/scene.js', import.meta.url).href;
const repo = fileURLToPath(new URL('..', import.meta.url));
const rendererModule = 'data:text/javascript,' + encodeURIComponent(`
  export * from ${JSON.stringify(import.meta.resolve('three'))};
  export class WebGLRenderer {
    constructor() { this.shadowMap = {}; }
    setPixelRatio(value) { this.pixelRatio = value; }
    setSize(width, height) { this.size = [width, height]; }
    render(scene, camera) {
      if (scene.matrixWorldAutoUpdate === true) scene.updateMatrixWorld();
      if (camera.parent === null && camera.matrixWorldAutoUpdate === true) camera.updateMatrixWorld();
    }
  }
`);
const assetStub = 'data:text/javascript,' + encodeURIComponent('export function loadCharacterAssets(){throw new Error("Node fixture must provide parsed assets");}');
const vaultTextureStub = 'data:text/javascript,' + encodeURIComponent('export function loadVaultTextures(){return Promise.resolve({});}');
const environmentTextureStub = 'data:text/javascript,' + encodeURIComponent('export function loadEnvironmentTextures(){return Promise.resolve({});}');
const forestTextureStub = 'data:text/javascript,' + encodeURIComponent('export function loadForestTextures(){return Promise.resolve({});}');
const bakeStub = 'data:text/javascript,' + encodeURIComponent('export function bakeStaticTransforms(){}');
let characters;

export async function createScenePair({ baselineRef } = {}) {
  if (baselineRef && !/^[0-9a-f]{40}$/.test(baselineRef)) throw new Error('baselineRef must be a full commit SHA');
  const baselineURL = sceneURL + '?static-baseline=' + (baselineRef || 'unbaked');
  const baselineSource = baselineRef ? execFileSync('git', ['show', `${baselineRef}:src/scene.js`], { cwd: repo, encoding: 'utf8' }) : null;
  const hooks = registerHooks({
    resolve(specifier, context, nextResolve) {
      if ([sceneURL, baselineURL].includes(context.parentURL)) {
        if (specifier === 'three') return { url: rendererModule, shortCircuit: true };
        if (specifier === './character-assets.js') return { url: assetStub, shortCircuit: true };
        if (specifier === './environment-assets.js') return { url: environmentTextureStub, shortCircuit: true };
        if (specifier === './forest-assets.js') return { url: forestTextureStub, shortCircuit: true };
        if (specifier === './vault-textures.js') return { url: vaultTextureStub, shortCircuit: true };
        if (!baselineRef && context.parentURL === baselineURL && specifier === './static-transforms.js') return { url: bakeStub, shortCircuit: true };
      }
      return nextResolve(specifier, context);
    },
    load(url, context, nextLoad) {
      if (baselineSource && url === baselineURL) return { format: 'module', source: baselineSource, shortCircuit: true };
      return nextLoad(url, context);
    },
  });
  let Baseline, Candidate;
  try {
    [{ SceneView: Baseline }, { SceneView: Candidate }] = await Promise.all([import(baselineURL), import(sceneURL)]);
  } finally { hooks.deregister(); }
  characters ??= Promise.all(['pilgrim', 'knight', 'keeper'].map(async name => [name, await loadCharacter(name)])).then(Object.fromEntries);
  const library = await characters;
  Object.assign(globalThis, { innerWidth: 1280, innerHeight: 720, devicePixelRatio: 1, addEventListener() {} });
  return [Baseline, Candidate].map(View => new View({}, new Game(), { quality: 'high' }, library));
}

export function nodesOf(root) { const nodes = []; root.traverse(node => nodes.push(node)); return nodes; }

// Ignore identity-only UUIDs, while preserving material values, shader source,
// textures' image metadata, geometry/index bytes, instancing, hierarchy and flags.
export function appearanceDigest(view) {
  const hash = createHash('sha256');
  const identityFree = value => {
    if (typeof value === 'string' && /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value)) return '<uuid>';
    if (Array.isArray(value)) return value.map(identityFree);
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).filter(([key]) => !['uuid', 'metadata'].includes(key)).map(([key, item]) => [key, identityFree(item)]));
    return value;
  };
  const array = data => { if (data) hash.update(new Uint8Array(data.buffer, data.byteOffset, data.byteLength)); };
  for (const n of nodesOf(view.scene)) {
    hash.update(JSON.stringify({ type: n.type, children: n.children.length, position: n.position, quaternion: n.quaternion.toArray(), scale: n.scale,
      visible: n.visible, castShadow: n.castShadow, receiveShadow: n.receiveShadow, frustumCulled: n.frustumCulled, renderOrder: n.renderOrder, count: n.count }));
    if (n.geometry) { for (const [name, attr] of Object.entries(n.geometry.attributes)) { hash.update(name + ':' + attr.itemSize + ':' + attr.normalized); array(attr.array); } array(n.geometry.index?.array); }
    array(n.instanceMatrix?.array); array(n.instanceColor?.array);
    if (n.material) for (const material of [n.material].flat()) {
      hash.update(JSON.stringify(identityFree(material.toJSON())));
      hash.update(material.onBeforeCompile.toString());
    }
  }
  return hash.digest('hex');
}

// Rendering-side state fixtures, not earned progression or a playthrough. Both
// sides receive identical inputs; gameplay tick, serialization and saves are not
// changed by this helper or by the production optimization.
export function exerciseView(view, frame) {
  const g = view.game, p = g.player, phase = frame / 60;
  Object.assign(p, { x: Math.sin(phase) * 13, z: 80 + Math.cos(phase) * 12, y: 2 + Math.sin(phase), angle: phase,
    moving: frame % 3 !== 0, weaponType: ['sword', 'spear', 'greatsword'][frame % 3], attack: frame % 4 ? .2 : 0,
    healTimer: frame % 7 === 0 ? .4 : 0, dodge: frame % 11 === 0 ? .2 : 0 });
  g.day = phase / 8; g.ending = frame % 2 ? 'release' : null;
  g.crossingChoice = frame % 2 ? 'road' : 'haven'; g.supplies = true;
  g.lit = frame % 2 ? ['haven', 'grove', 'flood', 'ruins'] : []; g.bossDefeated = frame % 2 === 0;
  Object.assign(g.bells, { solved: frame % 2 === 0, reported: frame % 2 === 0, step: frame % 4 });
  Object.assign(g.expedition, { opened: frame % 2 === 0, handle: frame % 3 === 0, reported: frame % 5 === 0 });
  for (const [i, n] of g.residents.entries()) Object.assign(n, { x: p.x + i, z: p.z + i, y: p.y, moving: frame % 2 === 0, angle: phase + i });
  for (const [i, e] of g.enemies.entries()) Object.assign(e, { x: p.x + (i % 6) * 5, z: p.z - i, y: p.y,
    dead: frame % 17 === i, angle: phase + i, state: ['windup', 'strike', 'stagger', 'chase'][frame % 4],
    timer: .2, windupMax: 1, radial: frame % 2 === 0, aim: { x: p.x, y: p.y + 1, z: p.z } });
  g.projectiles = frame % 3 ? [{ x: p.x + 2, y: p.y + 1, z: p.z + 2, vx: 1, vy: .1, vz: -3, owner: frame % 2 ? 'player' : 'enemy' }] : [];
  g.pickups.forEach((item, i) => { item.taken = (frame + i) % 5 === 0; });
  view.scene.position.set(Math.sin(phase) * 3, Math.cos(phase), phase);
  view.scene.rotation.set(phase * .03, phase * .05, 0); view.scene.scale.set(1 + phase * .01, 1, 1 - phase * .005);
  view.yaw = phase; view.pitch = .25 + Math.sin(phase) * .15;
  if (frame % 20 === 0) { view.setQuality(['low', 'medium', 'high'][frame / 20 % 3]); view.ringBell('bell-rain'); }
  const originalRandom = Math.random; Math.random = random(4400 + frame);
  try {
    if (frame % 15 === 0) { view.effect('skill', p.x, p.z); view.effect('hit', p.x, p.z); }
    view.update(1 / 60, frame % 5 !== 0);
    // Same native inputs used by directional shadow setup; no shadow drawing.
    view.sun.shadow.updateMatrices(view.sun);
  } finally { Math.random = originalRandom; }
}

export function matrixWork(run) {
  const originalCompose = T.Matrix4.prototype.compose, originalMultiply = T.Matrix4.prototype.multiplyMatrices;
  const counts = { compose: 0, multiplyMatrices: 0 };
  T.Matrix4.prototype.compose = function(...args) { counts.compose++; return originalCompose.apply(this, args); };
  T.Matrix4.prototype.multiplyMatrices = function(...args) { counts.multiplyMatrices++; return originalMultiply.apply(this, args); };
  try { run(); } finally { T.Matrix4.prototype.compose = originalCompose; T.Matrix4.prototype.multiplyMatrices = originalMultiply; }
  return counts;
}
