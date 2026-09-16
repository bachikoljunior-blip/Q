import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {mountTitleCinematic,titleCanvasSize} from 'file:///workspace/scratch/e72662e3b71f/Q-ps4-v29/src/title-cinematic.js';
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


const b=titleBoundary({videoAvailable:true});const states=[];
for(let i=0;i<3;i++){
 b.api.setActive(true);b.timersRun();b.plays.at(-1).resolve();await Promise.resolve();await Promise.resolve();
 assert.equal(b.video.src,'/clip.mp4');b.api.setLaunching(true);assert.equal(b.video.src,'/clip.mp4');
 states.push({phase:'world loading',cycle:i,sourceAttached:!!b.video.src});
 b.api.setActive(false);assert.equal(b.video.src,'');assert.equal(b.frames.size,0);assert.equal(b.timers.size,0);
 states.push({phase:'game started',cycle:i,sourceAttached:!!b.video.src,releaseLoadCalls:b.video.loads});
}
const size=titleCanvasSize(1280,720,1);const report={boundary:'Actual title module, existing explicit DOM/video/RAF test boundary; no browser decoder or memory measurement',states,sourceReleaseRequests:b.video.loads,canvasAt1280x720Dpr1:size,canvasRGBAEquivalentBytes:size.pixelWidth*size.pixelHeight*4,canvasCapPixels:1600000,canvasCapRGBAEquivalentBytes:6400000};
b.api.dispose();writeFileSync(new URL('./title-lifecycle.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
