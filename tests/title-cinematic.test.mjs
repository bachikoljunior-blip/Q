import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { advanceTitleEmbers, createTitleEmbers, mountTitleCinematic, titleCanvasSize } from '../src/title-cinematic.js';

// Explicit device boundary: records drawing calls and manually schedules frames.
// It cannot render CSS, hit-test DOM, or establish browser/device performance.
function titleBoundary({ reduced = false, canvasAvailable = true } = {}) {
  class Events {
    listeners = new Map();
    addEventListener(name, callback) { if (!this.listeners.has(name)) this.listeners.set(name, new Set()); this.listeners.get(name).add(callback); }
    removeEventListener(name, callback) { this.listeners.get(name)?.delete(callback); }
    emit(name, extra = {}) { for (const callback of this.listeners.get(name) || []) callback(extra); }
  }
  const classes = () => {
    const items = new Set();
    return { add: (...names) => names.forEach(name => items.add(name)), remove: (...names) => names.forEach(name => items.delete(name)), contains: name => items.has(name), toggle(name, value) { const next = value ?? !items.has(name); if (next) items.add(name); else items.delete(name); return next; } };
  };
  const win = new Events(), doc = new Events(), motion = new Events(), root = new Events();
  const frames = new Map(), drawings = [], css = new Map(), cues = [];
  let nextId = 0, focused = true;
  win.devicePixelRatio = 3; win.requestAnimationFrame = callback => { frames.set(++nextId, callback); return nextId; };
  win.cancelAnimationFrame = id => frames.delete(id);
  motion.matches = reduced; win.matchMedia = () => motion;
  doc.defaultView = win; doc.hidden = false; doc.hasFocus = () => focused;
  const context = { setTransform() {}, clearRect() { drawings.push('clear'); }, beginPath() {}, arc(...args) { drawings.push(args); }, fill() {} };
  const canvas = { getContext: () => canvasAvailable ? context : null };
  const nodes = Object.fromEntries(['start', 'continue', 'import-title-save', 'title-settings', 'title-loading'].map(id => { const item = new Events(); item.classList = classes(); item.disabled = false; return [id, item]; }));
  nodes.continue.classList.add('hidden'); nodes['title-loading'].classList.add('hidden');
  root.ownerDocument = doc; root.classList = classes(); root.style = { setProperty: (name, value) => css.set(name, value) };
  root.querySelector = selector => selector === '#title-embers' ? canvas : nodes[selector.slice(1)] || null;
  root.getBoundingClientRect = () => ({ left: 0, top: 0, width: 390, height: 844 });
  const api = mountTitleCinematic({ root, onCue: cue => cues.push(cue) });
  return { api, root, win, doc, motion, frames, drawings, nodes, cues, css,
    frame(now) { const callbacks = [...frames.values()]; frames.clear(); for (const callback of callbacks) callback(now); },
    focus(value) { focused = value; win.emit(value ? 'focus' : 'blur'); },
    reduce(value) { motion.matches = value; motion.emit('change', { matches: value }); },
  };
}

test('bounded title backing store covers portrait, landscape and extreme DPR without exceeding 1.6M pixels', () => {
  for (const [width, height, dpr] of [[390,844,3], [844,390,3], [3840,2160,4], [8192,8192,Infinity], [0,-1,0]]) {
    const size = titleCanvasSize(width, height, dpr);
    assert(size.pixelWidth >= 1 && size.pixelHeight >= 1);
    assert(size.pixelWidth * size.pixelHeight <= 1600000);
    assert(size.ratio <= 1.5);
  }
});

test('ember trajectories stay finite and capped through hidden-time jumps, invalid deltas and long reuse', () => {
  const a = createTitleEmbers(200), b = createTitleEmbers(200);
  assert.equal(a.length, 64); assert.deepEqual(a, b);
  advanceTitleEmbers(a, 60, 3); advanceTitleEmbers(b, .05, 3); assert.deepEqual(a, b);
  for (let frame = 0; frame < 20000; frame++) advanceTitleEmbers(a, frame % 2 ? .05 : NaN, frame / 30);
  assert(a.every(p => p.x >= 0 && p.x < 1 && p.y >= 0 && p.y < 1));
  const frozen = structuredClone(a); advanceTitleEmbers(a, -5); assert.deepEqual(a, frozen);
});

test('active title owns one RAF; stop, pagehide, BFCache and resume cannot leave duplicate loops', () => {
  const b = titleBoundary(); assert.equal(b.frames.size, 1);
  b.api.setActive(true); b.api.setActive(true); assert.equal(b.frames.size, 1);
  b.frame(0); b.frame(34); assert.equal(b.frames.size, 1);
  b.win.emit('pagehide'); assert.equal(b.frames.size, 0);
  b.api.setActive(true); assert.equal(b.frames.size, 0, 'pagehide waits for pageshow');
  b.win.emit('pageshow'); assert.equal(b.frames.size, 1);
  b.doc.hidden = true; b.doc.emit('visibilitychange'); assert.equal(b.frames.size, 0);
  b.doc.hidden = false; b.doc.emit('visibilitychange'); assert.equal(b.frames.size, 1);
  b.focus(false); assert.equal(b.frames.size, 0);
  b.focus(true); assert.equal(b.frames.size, 1);
  b.api.setActive(false); b.win.emit('pageshow'); b.focus(true); assert.equal(b.frames.size, 0);
  b.api.dispose();
});

test('reduced motion has no RAF, adapts live, resets parallax and leaves semantic launch controls available', () => {
  const b = titleBoundary({ reduced: true });
  assert.equal(b.frames.size, 0); assert(b.root.classList.contains('is-still'));
  b.nodes.start.emit('click'); assert.deepEqual(b.cues, ['start']);
  b.reduce(false); assert.equal(b.frames.size, 1);
  b.root.emit('pointermove', { pointerType: 'mouse', buttons: 0, clientX: 390, clientY: 0 });
  b.frame(0); b.frame(34); assert.notEqual(b.css.get('--title-x'), '0px');
  b.reduce(true); assert.equal(b.frames.size, 0); assert.equal(b.css.get('--title-x'), '0px');
  b.api.dispose();
});

test('touch movement is never captured for title parallax; disposal removes all listeners and pending frames', () => {
  const b = titleBoundary();
  b.root.emit('pointermove', { pointerType: 'touch', buttons: 1, clientX: 390, clientY: 0 });
  b.frame(0); b.frame(34); assert.equal(b.css.get('--title-x'), '0.00px');
  b.api.setLaunching(true); assert(!b.nodes['title-loading'].classList.contains('hidden'));
  b.api.dispose(); b.api.dispose(); b.api.setActive(true); b.win.emit('pageshow'); b.nodes.start.emit('click');
  assert.equal(b.frames.size, 0); assert.deepEqual(b.cues, []);
  assert(b.nodes['title-loading'].classList.contains('hidden'));
  for (const target of [b.root,b.win,b.doc,b.motion,...Object.values(b.nodes)]) assert([...target.listeners.values()].every(set => set.size === 0));
});

test('presentation state does not mutate saves, button availability or sound and rejects hidden/disabled cues', () => {
  const b = titleBoundary();
  b.api.setSaveAvailable(true); assert(b.root.classList.contains('has-save'));
  assert(b.nodes.continue.classList.contains('hidden'), 'main owns save-backed visibility');
  b.nodes.continue.emit('click'); b.nodes.start.disabled = true; b.nodes.start.emit('click'); assert.deepEqual(b.cues, []);
  b.nodes.start.disabled = false; b.nodes.start.emit('click'); assert.deepEqual(b.cues, ['start']);
  b.api.setLaunching(true); assert(b.root.classList.contains('is-launching')); assert.equal(b.nodes.start.disabled, false);
  b.api.setActive(false); assert(!b.root.classList.contains('is-launching')); b.nodes.start.emit('click'); assert.deepEqual(b.cues, ['start']);
  b.api.dispose();
});

test('unavailable decorative canvas keeps title controls and state usable without animation requests', () => {
  const b = titleBoundary({ canvasAvailable: false });
  assert.equal(b.frames.size, 0); b.nodes.start.emit('click'); assert.deepEqual(b.cues, ['start']);
  b.api.setLaunching(true); b.api.setSaveAvailable(true); b.win.emit('resize'); b.api.dispose();
});

test('title illustration provenance fixes source, optimized payload and deployed CSS reference', async () => {
  const provenance = JSON.parse(await readFile(new URL('../src/assets/title/provenance.json', import.meta.url), 'utf8'));
  const derivative = provenance.derivative;
  for (const [filename, bytes, hash] of [[provenance.asset,provenance.bytes,provenance.sha256],[derivative.file,derivative.bytes,derivative.sha256]]) {
    const data = await readFile(new URL(`../src/assets/title/${filename}`, import.meta.url));
    assert.equal(data.length, bytes); assert.equal(createHash('sha256').update(data).digest('hex'), hash);
  }
  assert(derivative.bytes < 500000);
  const css = await readFile(new URL('../src/style.css', import.meta.url), 'utf8');
  assert(css.includes(`url('./assets/title/${derivative.file}')`));
  assert(!css.includes(`url('./assets/title/${provenance.asset}')`));
});
