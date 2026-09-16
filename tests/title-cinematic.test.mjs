import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { advanceTitleEmbers, createTitleEmbers, mountTitleCinematic, titleCanvasSize } from '../src/title-cinematic.js';

// Explicit device boundary: records drawing calls and manually schedules frames.
// It cannot render CSS, hit-test DOM, or establish browser/device performance.
function titleBoundary({ reduced = false, canvasAvailable = true, videoAvailable = false, saveData = false, loaded = true, queuedPause = false } = {}) {
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
  const win = new Events(), doc = new Events(), motion = new Events(), root = new Events(), connection = new Events();
  const timers = new Map(), plays = [];
  const frames = new Map(), drawings = [], css = new Map(), cues = [];
  let nextId = 0, focused = true;
  win.devicePixelRatio = 3; win.requestAnimationFrame = callback => { frames.set(++nextId, callback); return nextId; };
  win.cancelAnimationFrame = id => frames.delete(id);
  motion.matches = reduced; win.matchMedia = () => motion;
  connection.saveData = saveData; win.navigator = { connection };
  win.setTimeout = callback => { timers.set(++nextId, callback); return nextId; }; win.clearTimeout = id => timers.delete(id);
  doc.readyState = loaded ? 'complete' : 'loading';
  doc.defaultView = win; doc.hidden = false; doc.hasFocus = () => focused;
  const context = { setTransform() {}, clearRect() { drawings.push('clear'); }, beginPath() {}, arc(...args) { drawings.push(args); }, fill() {} };
  const canvas = { getContext: () => canvasAvailable ? context : null };
  const nodes = Object.fromEntries(['start', 'continue', 'import-title-save', 'title-settings', 'title-loading', 'title-motion'].map(id => { const item = new Events(); item.classList = classes(); item.disabled = false; item.attributes = new Map(); item.setAttribute = (name,value) => item.attributes.set(name,value); return [id, item]; }));
  nodes.continue.classList.add('hidden'); nodes['title-loading'].classList.add('hidden');
  const video = new Events(); video.paused = true; video.src = ''; video.loads = 0; video.pauses = 0;
  video.play = () => { video.paused = false; return new Promise((resolve, reject) => plays.push({ resolve, reject })); };
  video.pause = () => { video.pauses++; if (!video.paused) { video.paused = true; if (queuedPause) queueMicrotask(() => video.emit('pause')); else video.emit('pause'); } };
  video.load = () => { video.loads++; }; video.removeAttribute = name => { if (name === 'src') video.src = ''; };
  root.ownerDocument = doc; root.classList = classes(); root.style = { setProperty: (name, value) => css.set(name, value) };
  root.querySelector = selector => selector === '#title-embers' ? canvas : selector === '#title-video' ? (videoAvailable ? video : null) : nodes[selector.slice(1)] || null;
  root.getBoundingClientRect = () => ({ left: 0, top: 0, width: 390, height: 844 });
  const api = mountTitleCinematic({ root, videoSource: videoAvailable ? '/clip.mp4' : '', onCue: cue => cues.push(cue) });
  return { api, root, win, doc, motion, video, timers, plays, connection, frames, drawings, nodes, cues, css,
    timersRun() { const callbacks = [...timers.values()]; timers.clear(); for (const callback of callbacks) callback(); },
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
  b.api.setActive(false); assert(b.root.classList.contains('is-launching'), 'panel visibility must not cancel a pending launch'); b.api.setLaunching(false); b.nodes.start.emit('click'); assert.deepEqual(b.cues, ['start']);
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
  const movie = await readFile(new URL(`../${provenance.video.file}`, import.meta.url));
  assert.equal(movie.length, provenance.video.bytes);
  assert.equal(createHash('sha256').update(movie).digest('hex'), provenance.video.sha256);
  assert.equal(movie.toString('ascii',4,8), 'ftyp');
  const decoded=JSON.parse(await readFile(new URL('../docs/evidence/title-video/decode.json',import.meta.url),'utf8'));
  assert.equal(decoded.sha256,provenance.video.sha256); assert.equal(decoded.decodedFrames,288);
  assert.equal(decoded.audioStreams,0); assert(decoded.fastStart && decoded.passed);
  const css = await readFile(new URL('../src/style.css', import.meta.url), 'utf8');
  assert(css.includes(`url('./assets/title/${derivative.file}')`));
  assert(!css.includes(`url('./assets/title/${provenance.asset}')`));
});

const flushMedia = async () => { await Promise.resolve(); await Promise.resolve(); };

test('encoded title waits for poster/load, owns one play request, and disables extra canvas rendering after playback', async () => {
  const b = titleBoundary({ videoAvailable: true, loaded: false });
  assert.equal(b.video.src, ''); assert.equal(b.timers.size, 0);
  b.win.emit('load'); assert.equal(b.timers.size, 1);
  b.api.setActive(true); assert.equal(b.timers.size, 1);
  b.timersRun(); assert.equal(b.video.src, '/clip.mp4'); assert.equal(b.plays.length, 1);
  assert(b.video.muted && b.video.playsInline && b.video.defaultMuted);
  assert(!b.root.classList.contains('has-video'), 'poster stays visible until real play promise succeeds');
  b.api.setActive(true); b.timersRun(); assert.equal(b.plays.length, 1);
  b.plays[0].resolve(); await flushMedia();
  assert(b.root.classList.contains('has-video')); assert.equal(b.frames.size, 0);
  b.nodes['title-motion'].emit('click'); assert(b.video.paused); assert(b.root.classList.contains('is-still'));
  assert.equal(b.nodes['title-motion'].attributes.get('aria-pressed'), 'true');
  b.nodes['title-motion'].emit('click'); b.timersRun(); assert.equal(b.plays.length, 2);
  b.plays[1].resolve(); await flushMedia(); b.api.dispose();
});

test('reduced motion, data saving, title deactivate and disposal prevent media fetch or release decoder source', async () => {
  for (const option of [{ reduced: true }, { saveData: true }]) {
    const b = titleBoundary({ videoAvailable: true, ...option });
    b.timersRun(); assert.equal(b.video.src, ''); assert.equal(b.plays.length, 0); assert.equal(b.frames.size, 0);
    assert(b.nodes['title-motion'].disabled); b.api.dispose();
  }
  const b = titleBoundary({ videoAvailable: true });
  b.api.setActive(false); b.timersRun(); assert.equal(b.plays.length, 0);
  b.api.setActive(true); b.timersRun(); b.plays[0].resolve(); await flushMedia();
  b.doc.hidden = true; b.doc.emit('visibilitychange');
  assert.equal(b.video.src, ''); assert.equal(b.video.loads, 1); assert(b.video.paused); assert(!b.root.classList.contains('has-video'));
  b.doc.hidden = false; b.doc.emit('visibilitychange'); b.timersRun(); assert.equal(b.plays.length, 2);
  b.connection.saveData = true; b.connection.emit('change'); assert.equal(b.video.src, '');
  b.plays[1].reject(Error('aborted by load')); await flushMedia();
  b.connection.saveData = false; b.connection.emit('change'); b.timersRun(); assert.equal(b.plays.length, 3);
  b.api.dispose(); b.plays[2].resolve(); await flushMedia();
  assert.equal(b.video.src, ''); assert.equal(b.timers.size, 0); assert.equal(b.frames.size, 0);
  for (const target of [b.video,b.connection,b.win,b.doc,...Object.values(b.nodes)]) assert([...target.listeners.values()].every(set => set.size === 0));
});

test('rejected autoplay and decode error keep poster/buttons usable and gesture retry handles play-promise ABA ownership', async () => {
  const b = titleBoundary({ videoAvailable: true }); b.timersRun();
  b.plays[0].reject(Error('NotAllowedError')); await flushMedia();
  assert.equal(b.video.src, ''); assert(!b.root.classList.contains('has-video'));
  b.nodes.start.emit('click'); assert.deepEqual(b.cues, ['start']);
  assert.equal(b.nodes['title-motion'].textContent, '動きを再開する');
  b.nodes['title-motion'].emit('click'); assert.equal(b.plays.length, 2, 'retry is inside the actual gesture');
  b.api.setActive(false); b.api.setActive(true); b.timersRun(); assert.equal(b.plays.length, 3);
  b.plays[2].resolve(); await flushMedia(); assert(b.root.classList.contains('has-video'));
  const pauses=b.video.pauses; b.plays[1].resolve(); await flushMedia();
  assert.equal(b.video.pauses, pauses); assert(b.root.classList.contains('has-video'), 'stale success cannot hide or stop a new owner');
  b.video.emit('error'); assert.equal(b.video.src, ''); assert(!b.root.classList.contains('has-video'));
  b.api.dispose();
});

test('encoded title is decorative and retains matched portrait/landscape crop without loading through markup', async () => {
  const html=await readFile(new URL('../index.html', import.meta.url),'utf8');
  const tag=html.match(/<video id="title-video"[^>]*>/)?.[0];
  assert(tag); for(const attribute of ['muted','playsinline','loop','preload="none"','aria-hidden="true"','tabindex="-1"'])assert(tag.includes(attribute));
  assert(!/\ssrc=/.test(tag)); assert(html.includes('id="title-motion"'));
  const css=await readFile(new URL('../src/style.css', import.meta.url),'utf8');
  for(const crop of ['object-position:68% 50%','object-position:72% 28%','object-fit:contain;object-position:100% 50%'])assert(css.includes(crop));
});

test('queued deliberate pause cannot block focus resume or a new media owner', async () => {
  const b=titleBoundary({ videoAvailable: true, queuedPause: true }); b.timersRun(); b.plays[0].resolve(); await flushMedia();
  b.focus(false); b.focus(true); await flushMedia(); b.timersRun();
  assert.equal(b.plays.length,2); b.plays[1].resolve(); await flushMedia(); assert(!b.video.paused);
  b.focus(false); b.focus(true); b.timersRun(); b.plays[2].resolve(); await flushMedia();
  assert.equal(b.nodes['title-motion'].textContent,'動きを止める'); assert(!b.video.paused);
  b.api.dispose(); await flushMedia();
});

test('launch releases the movie immediately while poster/loading remain, including settings and lifecycle returns', async () => {
  const b=titleBoundary({videoAvailable:true,queuedPause:true});b.timersRun();b.plays[0].resolve();await flushMedia();
  assert(b.root.classList.contains('has-video'));
  b.api.setLaunching(true);
  assert(b.video.paused);assert.equal(b.video.src,'');assert.equal(b.video.loads,1);
  assert(!b.root.classList.contains('has-video'));assert(b.root.classList.contains('is-launching'));
  assert(!b.nodes['title-loading'].classList.contains('hidden'));assert.equal(b.frames.size,0);assert.equal(b.timers.size,0);
  b.api.setActive(false);b.api.setActive(true);b.win.emit('pageshow');b.focus(false);b.focus(true);b.timersRun();await flushMedia();
  assert.equal(b.video.src,'');assert.equal(b.plays.length,1);assert(b.root.classList.contains('is-launching'));
  b.api.setLaunching(false);b.timersRun();assert.equal(b.plays.length,2,'failed launch can resume eligible title');
  b.plays[1].resolve();await flushMedia();assert(b.root.classList.contains('has-video'));b.api.dispose();
});

test('launch cancels queued source attachment and stale play completions cannot reacquire the decoder', async () => {
  const b=titleBoundary({videoAvailable:true});
  b.api.setLaunching(true);b.timersRun();assert.equal(b.video.src,'');assert.equal(b.plays.length,0);
  b.api.setLaunching(false);b.timersRun();assert.equal(b.plays.length,1);
  b.api.setLaunching(true);b.plays[0].resolve();await flushMedia();
  assert.equal(b.video.src,'');assert(!b.root.classList.contains('has-video'));assert.equal(b.frames.size,0);
  b.api.setActive(false);b.api.setLaunching(false);b.timersRun();assert.equal(b.plays.length,1,'completed launch stays detached');b.api.dispose();
});

test('failed launch preserves manual pause, reduced motion, data saving, autoplay block and hidden-page policy', async () => {
  for(const policy of ['paused','reduced','saveData','blocked','hidden']){
    const b=titleBoundary({videoAvailable:true});b.timersRun();
    if(policy==='blocked')b.plays[0].reject(Error('NotAllowedError'));else b.plays[0].resolve();await flushMedia();
    if(policy==='paused')b.nodes['title-motion'].emit('click');
    b.api.setLaunching(true);
    if(policy==='reduced')b.reduce(true);
    if(policy==='saveData'){b.connection.saveData=true;b.connection.emit('change');}
    if(policy==='hidden'){b.doc.hidden=true;b.doc.emit('visibilitychange');}
    b.api.setLaunching(false);b.timersRun();await flushMedia();
    assert.equal(b.video.src,'',policy);assert.equal(b.plays.length,1,policy+' must not bypass its policy');
    if(policy==='paused'||policy==='blocked')b.nodes['title-motion'].emit('click');
    if(policy==='reduced')b.reduce(false);
    if(policy==='saveData'){b.connection.saveData=false;b.connection.emit('change');}
    if(policy==='hidden'){b.doc.hidden=false;b.doc.emit('visibilitychange');}
    b.timersRun();assert.equal(b.plays.length,2,policy+' resumes only after policy allows it');b.api.dispose();
  }
});
