import { readFile } from 'node:fs/promises';
import { createContext, Script } from 'node:vm';
import { build } from 'esbuild';

// A deliberately bounded application-boundary fixture, not a browser or DOM
// implementation. No CSS layout, hit testing, native event ordering, WebGL or
// audio device is simulated. Unknown elements/methods are not auto-created.
class Target {
  listeners = new Map();
  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) || new Set();
    listeners.add(listener); this.listeners.set(type, listeners);
  }
  removeEventListener(type, listener) { this.listeners.get(type)?.delete(listener); }
  emit(type, properties = {}) {
    const event = { type, target: this, preventDefault() {}, ...properties };
    const results = [...(this.listeners.get(type) || [])].map(listener => listener(event));
    if (typeof this['on' + type] === 'function') results.push(this['on' + type](event));
    return Promise.all(results);
  }
}
class Element extends Target {
  constructor(tag, document) {
    super(); this.tagName = tag.toUpperCase(); this.ownerDocument = document;
    this.children = []; this.attributes = new Map(); this.style = { setProperty(name, value) { this[name] = value; } };
    this.captures = new Set(); this.text = ''; this.value = ''; this.files = [];
    this.classList = {
      contains: name => this.className.split(/\s+/).includes(name),
      add: (...names) => { this.className = [...new Set([...this.className.split(/\s+/).filter(Boolean), ...names])].join(' '); },
      remove: (...names) => { this.className = this.className.split(/\s+/).filter(name => !names.includes(name)).join(' '); },
      toggle: (name, force) => { const value = force ?? !this.classList.contains(name); this.classList[value ? 'add' : 'remove'](name); return value; },
    };
  }
  set id(value) { this.setAttribute('id', value); } get id() { return this.getAttribute('id') || ''; }
  set className(value) { this.setAttribute('class', value); } get className() { return this.getAttribute('class') || ''; }
  set disabled(value) { if (value) this.setAttribute('disabled', ''); else this.removeAttribute('disabled'); }
  get disabled() { return this.attributes.has('disabled'); }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  removeAttribute(name) { this.attributes.delete(name); }
  append(child) { child.parentElement = this; this.children.push(child); }
  remove() { if (this.parentElement) this.parentElement.children = this.parentElement.children.filter(child => child !== this); this.parentElement = null; }
  set textContent(value) { this.text = String(value); this.children = []; }
  get textContent() { return this.text + this.children.map(child => child.textContent).join(''); }
  set innerHTML(html) { this.text = ''; this.children = []; parseFragment(html, this); }
  insertAdjacentHTML(position, html) { if (position !== 'beforeend') throw Error('Unsupported fixture insertion: ' + position); parseFragment(html, this); }
  querySelectorAll(selector) {
    const matches = element => selector.split(',').some(part => {
      part = part.trim();
      if (part.startsWith('#')) return element.id === part.slice(1);
      if (part.startsWith('.')) return element.classList.contains(part.slice(1));
      const match = /^([\w-]+)(?:\[value="([^"]*)"\])?$/.exec(part);
      if (!match) throw Error('Unsupported fixture selector: ' + part);
      return element.tagName === match[1].toUpperCase() && (match[2] === undefined || element.getAttribute('value') === match[2]);
    });
    const found = [];
    const visit = element => { for (const child of element.children) { if (matches(child)) found.push(child); visit(child); } };
    visit(this); return found;
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  focus() { this.ownerDocument.activeElement = this; }
  click() { if (this.disabled) return Promise.resolve(); return this.emit('click'); }
  setPointerCapture(id) { this.captures.add(id); }
  hasPointerCapture(id) { return this.captures.has(id); }
  releasePointerCapture(id) { this.captures.delete(id); }
  getBoundingClientRect() { if (!this.box) throw Error('No fixture geometry for ' + this.id); return this.box; }
}
function parseFragment(html, parent) {
  const stack = [parent], voidTags = new Set(['meta', 'link', 'input', 'br', 'hr', 'img']);
  for (const token of html.matchAll(/<!--[\s\S]*?-->|<![^>]*>|<\/?([\w-]+)\b([^>]*)>|([^<]+)/g)) {
    if (token[3]) { stack.at(-1).text += token[3]; continue; }
    if (!token[1]) continue;
    const tag = token[1].toLowerCase();
    if (token[0].startsWith('</')) {
      if (stack.at(-1).tagName !== tag.toUpperCase()) throw Error('Unbalanced fixture markup: ' + tag);
      stack.pop(); continue;
    }
    const element = new Element(tag, parent.ownerDocument);
    for (const attr of token[2].matchAll(/([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) element.setAttribute(attr[1], attr[2] ?? attr[3] ?? attr[4] ?? '');
    stack.at(-1).append(element);
    if (!voidTags.has(tag) && !token[0].endsWith('/>')) stack.push(element);
  }
  if (stack.length !== 1) throw Error('Incomplete fixture markup: ' + stack.at(-1).tagName);
}
export function deferred() { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; }
export async function compileMain({ mutate } = {}) {
  const root = new URL('../', import.meta.url);
  const source = await readFile(new URL('src/main.js', root), 'utf8');
  const contents = mutate ? mutate(source) : source;
  const result = await build({
    stdin: { contents, resolveDir: new URL('src/', root).pathname, sourcefile: 'main.js', loader: 'js' },
    bundle: true, write: false, format: 'iife', platform: 'browser', logLevel: 'silent',
    plugins: [{ name: 'explicit-device-boundaries', setup(builder) {
      builder.onResolve({ filter: /^\.\/(style\.css|scene\.js|audio\.js)$/ }, args => ({ path: args.path, namespace: 'boundary' }));
      builder.onLoad({ filter: /.*/, namespace: 'boundary' }, args => ({ contents:
        args.path.endsWith('scene.js') ? 'export const createSceneView=(...args)=>__devices.createSceneView(...args);' :
        args.path.endsWith('audio.js') ? 'export const Soundscape=__devices.Soundscape;' : '', loader: 'js' }));
    } }],
  });
  return { code: result.outputFiles[0].text, html: await readFile(new URL('index.html', root), 'utf8') };
}
export function createMainRuntime(compiled, { save, saveRaw, storageFailure = false, allowTimers = false, viewport = { width: 390, height: 844 } } = {}) {
  const window = new Target(), document = new Target(), events = [], errors = [], tools = new Map(), soundCalls = [];
  const initialSave = saveRaw ?? (save ? JSON.stringify(save) : null);
  const values = new Map(initialSave === null ? [] : [['q-ash-pilgrim-v1', initialSave]]);
  const storage = {
    getItem: key => values.get(key) ?? null,
    setItem(key, value) { if (storageFailure) throw Error('fixture storage quota'); values.set(key, String(value)); },
  };
  document.hidden = false; document.focused = true; document.hasFocus = () => document.focused;
  document.ownerDocument = document; document.root = new Element('document', document);
  // Script contents are not evaluated by this fixture; the real entry is bundled separately.
  document.root.innerHTML = compiled.html;
  document.getElementById = id => document.root.querySelector('#' + id);
  document.querySelectorAll = selector => document.root.querySelectorAll(selector);
  document.createElement = tag => new Element(tag, document);
  document.modelContext = { registerTool(tool) { tools.set(tool.name, tool); } };
  document.getElementById('joystick').box = { left: 20, top: viewport.height - 150, width: 120, height: 120 };
  window.localStorage = storage;
  let view, sceneCalls = 0, now = 0, frames = [], audioRunning = false, padFailure = false;
  const scene = deferred();
  const devices = {
    Soundscape: class {
      start() { audioRunning = true; events.push('audio:start'); }
      suspend() { audioRunning = false; events.push('audio:suspend'); }
      setVolume() {} tick() {} noise() {}
      setVault(theme) { if (this.vaultTheme !== theme) { this.vaultTheme = theme; soundCalls.push({ type: 'ambient', theme }); } }
      play(type, data = {}) { soundCalls.push({ type, vaultId: data.vaultId ?? null, id: data.id ?? null }); }
    },
    async createSceneView(canvas, game, settings) {
      sceneCalls++; events.push('scene:requested'); await scene.promise;
      view = {
        game, yaw: 0, pitch: .4, zoom: 10, updates: 0, gatheringFocus: null,
        focusCalls: [], sceneUpdates: [],
        camera: { position: { x: 0, y: 0, z: 0, set(x, y, z) { Object.assign(this, { x, y, z }); } } },
        focusGathering(id) {
          this.gatheringFocus = id; this.focusCalls.push(id);
        },
        snapCamera() {},
        setQuality() {}, ringBell() {}, effect() {},
        project() { return { x: viewport.width / 2, y: viewport.height / 2, visible: false, depth: 0 }; },
        update() {
          this.updates++;
          this.sceneUpdates.push({ focus: this.gatheringFocus });
          // Only the public focus/update call boundary is recorded here.
          // Production SceneView focus effects and rendering remain explicit boundaries.
        },
        renderer: { info: { render: { calls: 0, triangles: 0 }, memory: { geometries: 0, textures: 0 } }, domElement: { width: viewport.width, height: viewport.height }, getPixelRatio: () => 1, shadowMap: { enabled: false } },
      };
      return view;
    },
  };
  const context = createContext({
    document, window, navigator: { userAgent: 'Q Node application-boundary fixture', getGamepads() { if (padFailure) throw Error('fixture gamepad security'); return []; } },
    innerWidth: viewport.width, innerHeight: viewport.height, devicePixelRatio: 1,
    addEventListener: window.addEventListener.bind(window),
    requestAnimationFrame: callback => { frames.push(callback); return frames.length; },
    performance: { now: () => now },
    console: { error: error => errors.push(error.message) },
    setTimeout() { if (allowTimers) return 0; throw Error('Unmodelled timeout: this scenario needs an explicit timer fixture'); },
    AbortController, __devices: devices,
  });
  new Script(compiled.code, { filename: 'production-main-with-device-boundaries.js' }).runInContext(context);
  const element = id => { const el = document.getElementById(id); if (!el) throw Error('Missing production element: ' + id); return el; };
  return {
    document, window, scene, events, errors, values, soundCalls, element,
    get view() { return view; }, get sceneCalls() { return sceneCalls; }, get audioRunning() { return audioRunning; },
    get state() { return tools.get('read_pilgrim_journey').execute(); },
    setPadFailure(value) { padFailure = value; },
    click: id => element(id).click(),
    async flush() { for (let i = 0; i < 12; i++) await Promise.resolve(); },
    frames(count = 1) { for (let i = 0; i < count; i++) { now += 1000 / 60; const pending = frames; frames = []; for (const callback of pending) callback(now); } },
    pointer(id, type, pointerId, extra = {}) { return element(id).emit(type, { pointerId, pointerType: 'touch', button: 0, clientX: 80, clientY: viewport.height - 90, ...extra }); },
    async interrupt(reason) {
      if (reason === 'hidden') { document.hidden = true; await document.emit('visibilitychange'); document.hidden = false; await document.emit('visibilitychange'); }
      else { await window.emit(reason); }
    },
    async importFile(data, { delayed, title = true } = {}) {
      const input = element(title ? 'title-save-file' : 'save-file');
      const text = typeof data === 'string' ? data : JSON.stringify(data);
      input.files = [{ size: Buffer.byteLength(text), text: () => delayed ? delayed.promise : Promise.resolve(text) }];
      await input.emit('change');
    },
  };
}
