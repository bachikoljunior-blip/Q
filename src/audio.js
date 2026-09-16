import { VAULT_AMBIENT_URLS, VAULT_SFX_URLS } from './vault-asset-urls.js';
import { VaultLoopGate, vaultCueForEvent } from './vault-audio-cues.js';
import { loadFileAudio, startFileAudio } from './file-audio-bank.js';
import { SCORE_URLS, FOLEY_URL, FOLEY_CUES, SCORE_DURATION } from './soundscape-asset-urls.js';
import { PLACES, BRIDGES, inWater, riverX } from './core.js';
import { vaultAt } from './vault-slices.js';

const clamp = (value, low = 0, high = 1) => Math.min(high, Math.max(low, Number(value) || 0));
const MODES = Object.freeze({
  title: { harmony: .55, motif: .48, pulse: .16 },
  exploration: { harmony: .36, motif: .24, pulse: 0 },
  combat: { harmony: .48, motif: .28, pulse: .64 },
});
const busDefaults = Object.freeze({ music: .75, ambience: .65, sfx: .85, ui: .65 });
const stopNode = node => { if (node?.stop) node.stop(); else try { node?.source.stop(); } catch { /* Already ended. */ } };

// Original composition rendered with CC0 recorded instrument samples;
// the motif and foley remain synthesized, with bounded Web Audio voices.
export class Soundscape {
  constructor() {
    this.ctx = null; this.volume = .45; this._music = true; this.muted = false;
    this.mode = 'title'; this.active = false; this.disposed = false; this.audioRevision = 0;
    this.nodes = []; this.voices = new Set(); this.maxVoices = 36; this.maxDecodedBytes = 24 * 1024 * 1024;
    this.assetBuffers = new Map(); this.assetPending = new Map(); this.assetStartPending = new Map();
    this.scoreBuffers = new Map(); this.assetDecoders = new Map();
    this.busVolumes = { ...busDefaults }; this.buses = {}; this.targets = new WeakMap();
    this.vaultGate = new VaultLoopGate(); this.vaultTheme = null; this.vaultLoop = null; this.vaultRetryAt = 0;
    this.score = new Map(); this.scorePending = false; this.scoreRevision = 0; this.scorePhase = 0; this.scoreEpoch = null; this.scoreRetryAt = 0;
    this.atmosphere = {}; this.lastPosition = null; this.stepDistance = 0; this.stepVariant = 0;
    this.cooldowns = new Map(); this.threatUntil = 0; this.duckUntil = 0; this.game = null; this.cameraYaw = 0;
  }
  get music() { return this._music; }
  set music(enabled) { this.setMusic(enabled); }
  get status() { return this.disposed ? 'disposed' : this.active && this.ctx?.state === 'running' ? 'running' : this.ctx ? 'suspended' : 'locked'; }
  setMusic(enabled) {
    this._music = !!enabled;
    if (this.buses.music) this.target(this.buses.music.gain, this._music ? this.busVolumes.music : 0, .035);
    if (!this._music) this.stopScore(); else if (this.active) this.ensureScore();
  }
  setVolume(value) { this.volume = clamp(value); if (this.master) this.target(this.master.gain, this.muted ? 0 : this.volume, .04); }
  setMuted(enabled) { this.muted = !!enabled; this.setVolume(this.volume); }
  setBusVolume(bus, value) {
    if (!Object.hasOwn(busDefaults, bus)) return;
    this.busVolumes[bus] = clamp(value);
    if (this.buses[bus]) this.target(this.buses[bus].gain, bus === 'music' && !this._music ? 0 : this.busVolumes[bus], .05);
  }
  target(param, value, time = .16) {
    if (!param || !this.ctx) return;
    if (Math.abs((this.targets.get(param) ?? -100) - value) < .003) return;
    this.targets.set(param, value); param.setTargetAtTime(value, this.ctx.currentTime, time);
  }
  buildGraph() {
    const c = this.ctx;
    this.master = c.createGain(); this.master.gain.value = 0;
    this.compressor = c.createDynamicsCompressor();
    this.compressor.threshold.value = -12; this.compressor.knee.value = 12; this.compressor.ratio.value = 4;
    this.compressor.attack.value = .006; this.compressor.release.value = .2;
    this.master.connect(this.compressor); this.compressor.connect(c.destination);
    for (const [bus, volume] of Object.entries(this.busVolumes)) {
      this.buses[bus] = c.createGain(); this.buses[bus].gain.value = bus === 'music' && !this._music ? 0 : volume;
      this.buses[bus].connect(this.master);
    }
    this.reverb = c.createConvolver(); this.reverb.buffer = this.makeNoiseBuffer(1.35, true);
    this.reverbGain = c.createGain(); this.reverbGain.gain.value = .16;
    this.reverb.connect(this.reverbGain); this.reverbGain.connect(this.buses.sfx);
    this.noiseBuffer = this.makeNoiseBuffer(3);
  }
  start() {
    if (this.disposed) return Promise.resolve(false);
    if (!this.ctx) {
      const AC = globalThis.AudioContext || globalThis.window?.AudioContext || globalThis.window?.webkitAudioContext;
      if (!AC) return Promise.resolve(false);
      try {
        this.ctx = new AC();
        this.buildGraph();
      }
      catch { this.ctx?.close?.().catch?.(() => {}); this.ctx = null; return Promise.resolve(false); }
    }
    if (this.active && this.ctx.state === 'running') return Promise.resolve(true);
    if (this.resumePending) return this.resumePending;
    const revision = this.audioRevision;
    let resumed;
    try { resumed = this.ctx.resume(); } catch { return Promise.resolve(false); }
    const promise = Promise.resolve(resumed).then(() => {
      if (this.disposed || revision !== this.audioRevision || this.ctx.state !== 'running') return false;
      this.active = true; this.setVolume(this.volume); this.ensureAtmosphere(); this.ensureScore();
      this.primeVaultAudio(); return true;
    }).catch(() => false).finally(() => { if (this.resumePending === promise) this.resumePending = null; });
    this.resumePending = promise; return promise;
  }
  registerVoice(node) { this.voices.add(node); }
  releaseVoice(node) { this.voices.delete(node); }
  canAllocate(loop = false) {
    if (!this.active || this.disposed || this.ctx?.state !== 'running') return false;
    if (this.voices.size < this.maxVoices) return true;
    // Reserve room for ambience / score by retiring the oldest short voice.
    const oldest = [...this.voices].find(node => !node.loop);
    if (!oldest) return false;
    stopNode(oldest); return this.voices.size < this.maxVoices;
  }
  async loadAsset(key, url) { return loadFileAudio(this, key, url); }
  async fileSound(key, url, options = {}) { return startFileAudio(this, key, url, options); }
  primeVaultAudio() {
    // The cue atlas is small and shared; vault loops are loaded only on entry.
    if (this.active) this.loadAsset('foley', FOLEY_URL);
  }
  setMode(mode) {
    if (!MODES[mode]) return;
    const changed = mode !== this.mode; this.mode = mode;
    if (mode === 'title') {
      this.setVault(null); this.lastPosition = null; this.game = null;
      this.target(this.atmosphere.water?.gain.gain, 0, .6); this.target(this.atmosphere.fire?.gain.gain, 0, .6);
      if (this.buses.music) this.target(this.buses.music.gain, this._music ? this.busVolumes.music : 0, .1);
    }
    if (changed) this.mixScore(mode === 'combat' ? .65 : 1.6);
    if (this.active) this.ensureScore();
  }
  mixScore(fade = .65) {
    for (const [stem, node] of this.score) this.target(node.gain.gain, MODES[this.mode][stem], fade);
  }
  async ensureScore() {
    if (!this.active || !this._music || this.score.size || this.scorePending || this.ctx.currentTime < this.scoreRetryAt) return;
    const revision = this.audioRevision, scoreRevision = ++this.scoreRevision; this.scorePending = true;
    // Decode long stems serially at their authored rate. The fixed score bank
    // shares these buffers with voices; FX cache eviction cannot evict music.
    const entries = [];
    for (const [key, url] of Object.entries(SCORE_URLS)) {
      entries.push([key, await this.loadAsset(`score:${key}`, url)]);
      if (!this.active || !this._music || revision !== this.audioRevision || scoreRevision !== this.scoreRevision) return;
    }
    if (!this.active || !this._music || revision !== this.audioRevision || scoreRevision !== this.scoreRevision) return;
    const when = this.ctx.currentTime + .035;
    this.scoreEpoch = when - this.scorePhase;
    for (const [key, buffer] of entries) {
      if (!buffer) continue;
      const duration = Math.min(SCORE_DURATION, buffer.duration);
      const node = this.bufferVoice(buffer, { loop: true, bus: 'music', volume: 0, when, offset: this.scorePhase % duration, loopEnd: duration, pan: key === 'motif' ? .14 : 0 });
      if (node) this.score.set(key, node);
    }
    if (!this.score.size) {
      // Offline/decode failure remains playable: a restrained original chordal
      // bed replaces the file score, never a late burst of queued effects.
      const fallback = this.fallbackHarmony();
      const node = this.bufferVoice(fallback, { loop: true, bus: 'music', volume: 0, when, offset: this.scorePhase % fallback.duration });
      if (node) this.score.set('harmony', node);
    }
    this.scorePending = false; this.mixScore(this.mode === 'title' ? 1.2 : .8);
  }
  stopScore() {
    this.scoreRevision++; this.scorePending = false;
    if (this.scoreEpoch !== null && this.ctx) this.scorePhase = Math.max(0, this.ctx.currentTime - this.scoreEpoch) % SCORE_DURATION;
    this.scoreEpoch = null;
    for (const node of this.score.values()) stopNode(node); this.score.clear();
  }
  makeNoiseBuffer(seconds, impulse = false) {
    const c = this.ctx, b = c.createBuffer(impulse ? 2 : 1, Math.round(c.sampleRate * seconds), c.sampleRate);
    let seed = impulse ? 531 : 87123;
    for (let channel = 0; channel < b.numberOfChannels; channel++) {
      const values = b.getChannelData(channel);
      for (let i = 0; i < values.length; i++) {
        seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
        const noise = (seed >>> 0) / 2147483648 - 1;
        values[i] = impulse ? noise * Math.exp(-i / values.length * 7) * .55 : noise * .55;
      }
    }
    return b;
  }
  fallbackHarmony() {
    if (this.fallbackBuffer) return this.fallbackBuffer;
    const rate = 12000, b = this.ctx.createBuffer(1, rate * 8, rate), a = b.getChannelData(0);
    for (let i = 0; i < a.length; i++) {
      const t = i / rate, env = Math.sin(Math.PI * t / 8) ** 2;
      a[i] = [146.875, 220, 261.625, 329.625].reduce((sum, f, k) => sum + Math.sin(t * Math.PI * 2 * f + k) * (1 + .25 * Math.sin(t * Math.PI / 2)), 0) * env * .045;
    }
    this.fallbackBuffer = b; return b;
  }
  bufferVoice(buffer, options = {}) {
    const { loop = false, volume = .2, bus = 'sfx', pan = 0, cutoff, duration, offset = 0, rate = 1, wet = 0, attack = .003 } = options;
    if (!this.canAllocate(loop)) return null;
    const c = this.ctx, now = options.when ?? c.currentTime, source = c.createBufferSource(), gain = c.createGain();
    source.buffer = buffer; source.loop = loop; source.playbackRate.value = rate;
    if (options.loopEnd) source.loopEnd = options.loopEnd;
    const nodes = [source, gain]; let last = source;
    if (cutoff) { const filter = c.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = cutoff; filter.Q.value = .45; last.connect(filter); last = filter; nodes.push(filter); }
    last.connect(gain); last = gain;
    let panner;
    if (c.createStereoPanner) { panner = c.createStereoPanner(); panner.pan.value = clamp(pan, -1, 1); last.connect(panner); last = panner; nodes.push(panner); }
    last.connect(this.buses[bus] || this.master);
    if (wet && bus === 'sfx') { const send = c.createGain(); send.gain.value = wet; gain.connect(send); send.connect(this.reverb); nodes.push(send); }
    if (loop) gain.gain.value = volume;
    else {
      const length = (duration ?? buffer.duration - offset) / rate;
      gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(volume, now + Math.min(attack, length / 4));
      gain.gain.setValueAtTime(volume, now + Math.max(attack, length - .025)); gain.gain.linearRampToValueAtTime(0, now + length);
    }
    let ended = false;
    const clean = () => { if (ended) return; ended = true; nodes.forEach(node => node.disconnect()); source.buffer = null; this.releaseVoice(voice); };
    const voice = { source, gain, panner, loop, stop: (fade = 0) => {
      if (ended) return; try { if (fade) gain.gain.setTargetAtTime(0, c.currentTime, fade / 4); source.stop(c.currentTime + fade); } catch { /* Ended. */ }
      if (!fade) clean();
    } };
    source.onended = clean; this.registerVoice(voice);
    try { if (duration === undefined) source.start(now, offset); else source.start(now, offset, duration); }
    catch { clean(); return null; }
    return voice;
  }
  ensureAtmosphere() {
    if (!this.active || this.atmosphere.wind) return;
    for (const [id, cutoff, rate, pan] of [['wind', 570, .72, -.35], ['water', 2650, .94, .5], ['fire', 1450, 1.16, 0]]) {
      const node = this.bufferVoice(this.noiseBuffer, { loop: true, volume: 0, bus: 'ambience', cutoff, rate, pan });
      if (node) this.atmosphere[id] = node;
    }
    this.target(this.atmosphere.wind?.gain.gain, .15, 1.4);
  }
  setVault(theme) {
    if (theme && !VAULT_AMBIENT_URLS[theme]) theme = null;
    if (!this.active) { this.vaultTheme = theme; return; }
    if (theme && this.ctx.currentTime < this.vaultRetryAt && theme === this.vaultTheme) return;
    const request = this.vaultGate.request(theme); this.vaultTheme = this.vaultGate.theme; this.vaultLoop = this.vaultGate.node;
    if (request) this.fileSound(`ambient:${theme}`, VAULT_AMBIENT_URLS[theme], { loop: true, volume: .14, bus: 'ambience' }).then(node => {
      const accepted = this.vaultGate.accept(request, node); this.vaultLoop = this.vaultGate.node;
      if (!accepted && !node && request.revision === this.vaultGate.revision) this.vaultRetryAt = this.ctx.currentTime + 3;
    });
  }
  vaultSfx(name, data = {}) {
    const url = VAULT_SFX_URLS[name];
    if (url && this.active) this.fileSound(`sfx:${name}`, url, { volume: (name === 'impact' ? .3 : name === 'step' ? .10 : .20) * this.spatial(data).gain, pan: this.spatial(data).pan });
  }
  spatial(data = {}) {
    const p = this.game?.player;
    const actor = Number.isFinite(data.x) && Number.isFinite(data.z) ? data : this.game?.enemies?.find(e => e.id === (data.id || data.sourceId));
    if (!p || !actor) return { pan: 0, gain: 1 };
    const dx = actor.x - p.x, dz = actor.z - p.z, distance = Math.hypot(dx, dz);
    return { pan: clamp((dx * Math.cos(this.cameraYaw) - dz * Math.sin(this.cameraYaw)) / Math.max(3, distance), -.9, .9), gain: 1 / (1 + (distance / 8) ** 1.4) };
  }
  cue(name, { volume = .4, pan = 0, rate = 1, wet = .22, bus = 'sfx' } = {}) {
    const cue = FOLEY_CUES[name]; if (!cue || !this.active || this.muted || !this.volume) return null;
    const buffer = this.assetBuffers.get('foley');
    if (buffer) return this.bufferVoice(buffer, { duration: cue.duration, offset: cue.offset, volume, pan, rate, wet, bus });
    // Do not delay an action until fetch finishes. Prime for the next action and
    // provide an immediate filtered transient, preserving timing on slow links.
    this.loadAsset('foley', FOLEY_URL);
    if (name.startsWith('step')) return this.noise(.10, volume * .22, name.includes('water') ? 2400 : 1200, { pan });
    if (name.startsWith('impact')) return this.noise(.18, volume * .6, 2300, { pan });
    if (name.startsWith('whoosh')) return this.noise(.26, volume * .35, 1600, { pan, attack: .07 });
    this.tone(587.33, .5, volume * .22, 'triangle', null, 0, { bus, pan });
  }
  tone(freq, duration = .2, volume = .1, type = 'sine', end = null, delay = 0, options = {}) {
    if (!this.canAllocate() || this.muted || !this.volume) return;
    const c = this.ctx, t = c.currentTime + delay, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(Math.max(1, freq || 440), t);
    if (end) o.frequency.exponentialRampToValueAtTime(Math.max(end, 1), t + duration);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(volume, .0002), t + .012); g.gain.exponentialRampToValueAtTime(.0001, t + duration);
    o.connect(g); let panner;
    if (c.createStereoPanner) { panner = c.createStereoPanner(); panner.pan.value = options.pan || 0; g.connect(panner); panner.connect(this.buses[options.bus || 'sfx']); }
    else g.connect(this.buses[options.bus || 'sfx']);
    let ended = false; const cleanup = () => { if (ended) return; ended = true; o.disconnect(); g.disconnect(); panner?.disconnect(); this.releaseVoice(node); };
    const node = { source: o, gain: g, loop: false, stop() { try { o.stop(); } catch { /* Ended. */ } cleanup(); } };
    o.onended = cleanup; this.registerVoice(node); o.start(t); o.stop(t + duration + .03);
  }
  noise(duration, volume, cutoff, options = {}) {
    if (!this.noiseBuffer || this.muted || !this.volume) return null;
    return this.bufferVoice(this.noiseBuffer, { duration: Math.min(2.5, duration), offset: (this.stepVariant % 5) * .07, volume, cutoff, wet: .12, ...options });
  }
  play(type, data = {}) {
    if (!this.active || this.ctx.state !== 'running' || this.muted || !this.volume) return;
    const t = this.ctx.currentTime, old = this.cooldowns.get(type) ?? -100;
    if (t - old < (type === 'uiFocus' ? .11 : type === 'hit' ? .035 : .065)) return;
    this.cooldowns.set(type, t);
    const spatial = this.spatial(data), gain = spatial.gain, pan = spatial.pan;
    const weapon = data.weapon || this.game?.player?.weaponType || 'sword';
    const weaponName = ['sword', 'spear', 'greatsword'].includes(weapon) ? weapon : 'sword';
    const variation = .96 + (this.stepVariant++ % 5) * .018;
    const vaultCue = vaultCueForEvent(type, data);
    if (vaultCue && !['step', 'swing', 'impact'].includes(vaultCue)) this.vaultSfx(vaultCue, data);
    if (type === 'swing' || type === 'enemySwing') this.cue(`whoosh-${type === 'enemySwing' ? 'greatsword' : weaponName}`, { volume: .40 * gain, pan, rate: variation });
    if (type === 'hit') { this.cue(`impact-${weaponName}`, { volume: .65 * gain, pan, rate: variation, wet: .34 }); this.duckUntil = t + .22; }
    if (type === 'footstep' || type === 'vaultStep') this.cue(`step-${data.material || 'stone'}-${this.stepVariant % 3}`, { volume: .24, pan: data.pan || 0, rate: variation });
    if (type === 'hurt') { this.noise(.22, .22, 680); this.tone(82, .36, .11, 'sine', 35); this.duckUntil = t + .35; }
    if (type === 'parry') this.cue('whoosh-sword', { volume: .21, rate: 1.2 });
    if (type === 'perfect') { this.cue('perfect', { volume: .52, wet: .6 }); this.cue('impact-spear', { volume: .24, rate: 1.4 }); this.duckUntil = t + .4; }
    if (type === 'dodge') this.cue('whoosh-greatsword', { volume: .19, rate: .84 });
    if (type === 'bowDraw') this.tone(145, .65, .035, 'triangle', 235, 0, { pan });
    if (type === 'arrow') this.cue('whoosh-spear', { volume: .32 * gain, rate: 1.25, pan });
    if (type === 'arrowBreak') this.cue('step-wood-2', { volume: .30 * gain, rate: 1.4, pan });
    if (type === 'drink') { this.cue('step-water-1', { volume: .25, rate: .76 }); this.tone(380, .22, .024, 'sine', 220, .16); }
    if (type === 'bell') { this.tone(data.note || 587.33, 2.5, .09, 'sine', null, 0, { pan }); this.tone((data.note || 587.33) * 2.003, 1.5, .04, 'sine', null, .007, { pan }); if (data.solved) this.cue('reward', { volume: .3 }); }
    if (['heal', 'level', 'beacon', 'loot', 'discover', 'travel', 'ending'].includes(type)) this.cue('reward', { volume: type === 'loot' ? .19 : .34, rate: type === 'heal' ? 1.08 : 1, wet: .4 });
    if (type === 'skill') { this.cue('title-rise', { volume: .38, rate: 1.6, wet: .45 }); this.noise(.5, .15, 900, { attack: .08 }); }
    if (type === 'rest') this.cue('ui-back', { volume: .23, rate: .75, wet: .45 });
    if (type === 'death') { this.tone(98, 2.3, .12, 'triangle', 42); this.tone(146.8, 2.4, .065, 'sine', 55, .1); this.duckUntil = t + 3; this.setMode('exploration'); this.target(this.buses.music.gain, this._music ? this.busVolumes.music * .3 : 0, .3); }
    if (['uiFocus', 'uiConfirm', 'uiBack', 'dialogue'].includes(type)) this.cue(type === 'uiFocus' ? 'ui-focus' : type === 'uiBack' ? 'ui-back' : 'ui-confirm', { volume: type === 'uiFocus' ? .2 : .34, bus: 'ui', wet: 0 });
    if (type === 'titleStart') this.cue('title-rise', { volume: .62, bus: 'ui', wet: 0 });
  }
  surfaceAt(player) {
    if (inWater(player.x, player.z)) return 'water';
    if (BRIDGES.some(b => Math.abs(player.z - b.z) < 2.65 && Math.abs(player.x - b.x) < 21.5)) return 'wood';
    if (vaultAt(player) || PLACES.some(p => p.type !== 'camp' && Math.hypot(player.x - p.x, player.z - p.z) < 15)) return 'stone';
    return 'earth';
  }
  update(game, delta = 0, { cameraYaw = 0, paused = false } = {}) {
    if (!game?.player) return;
    this.game = game; this.cameraYaw = cameraYaw;
    const p = game.player, now = this.ctx?.currentTime || 0;
    if (paused || p.dead || !this.active) { this.lastPosition = null; this.stepDistance = 0; return; }
    const threat = game.enemies?.some(e => !e.dead && ['chase', 'windup', 'strike'].includes(e.state) && Math.hypot(e.x - p.x, e.z - p.z) < 18);
    if (threat) this.threatUntil = now + 4;
    this.setMode(now < this.threatUntil ? 'combat' : 'exploration'); this.setVault(vaultAt(p)?.theme || null);
    this.target(this.buses.music.gain, this._music ? this.busVolumes.music * (now < this.duckUntil ? .58 : 1) : 0, .12);
    const vault = vaultAt(p), riverDistance = Math.abs(p.x - riverX(p.z));
    const water = p.z > -205 && p.z < 220 ? clamp(1 - riverDistance / 35) : 0;
    let fire = 0, fireSource = null;
    for (const place of PLACES) if (game.lit?.includes(place.id)) {
      const strength = clamp(1 - Math.hypot(p.x - place.x, p.z - place.z) / 20);
      if (strength > fire) { fire = strength; fireSource = place; }
    }
    const wind = (.11 + .035 * Math.sin(now * .27) + clamp((p.y - 8) / 40) * .06) * (vault ? .42 : 1);
    this.target(this.atmosphere.wind?.gain.gain, wind, .8);
    this.target(this.atmosphere.wind?.panner?.pan, Math.sin(now * .083) * .48, .8);
    this.target(this.atmosphere.water?.gain.gain, water * .21 * (.9 + .1 * Math.sin(now * 1.3)), .55);
    this.target(this.atmosphere.water?.panner?.pan, this.spatial({ x: riverX(p.z), z: p.z }).pan, .5);
    this.target(this.atmosphere.fire?.gain.gain, fire * .12 * (.78 + .22 * Math.sin(now * 11.3) ** 4), .16);
    if (fireSource) this.target(this.atmosphere.fire?.panner?.pan, this.spatial(fireSource).pan, .4);
    if (fire > .2 && now > (this.nextCrackle || 0)) { this.noise(.035, fire * .055, 2400, { pan: this.spatial(fireSource).pan, bus: 'ambience', wet: 0 }); this.nextCrackle = now + .5 + ((this.stepVariant++ % 7) / 7); }
    if (this.lastPosition) {
      const distance = Math.hypot(p.x - this.lastPosition.x, p.z - this.lastPosition.z);
      if (distance < 5 && p.grounded && p.moving && !p.dodge) this.stepDistance += distance; else this.stepDistance = 0;
      const speed = delta > 0 ? distance / delta : 0, stride = speed > 6 ? 1.75 : 1.15;
      if (this.stepDistance >= stride) { this.stepDistance %= stride; this.play('footstep', { material: this.surfaceAt(p), pan: this.stepVariant % 2 ? .13 : -.13 }); }
      if (p.grounded && !this.lastPosition.grounded) this.cue(`step-${this.surfaceAt(p)}-${this.stepVariant++ % 3}`, { volume: .4, rate: .85 });
    }
    this.lastPosition = { x: p.x, z: p.z, grounded: p.grounded };
  }
  // Compatibility for older integrations: score scheduling uses AudioContext's
  // clock, not a resettable game save clock. New callers should use update().
  tick(_time, combat = false) { if (this.active) { this.setMode(combat ? 'combat' : 'exploration'); this.mixScore(); } }
  suspend() {
    if (!this.ctx) return Promise.resolve();
    this.audioRevision++; this.active = false; this.resumePending = null; this.stopScore();
    this.vaultGate.request(null); this.vaultLoop = null; this.vaultTheme = null; this.vaultRetryAt = 0;
    for (const node of [...this.voices]) stopNode(node);
    this.atmosphere = {}; this.nodes = []; this.lastPosition = null; this.stepDistance = 0; this.cooldowns.clear();
    this.master.gain.cancelScheduledValues(this.ctx.currentTime); this.master.gain.setValueAtTime(0, this.ctx.currentTime); this.targets = new WeakMap();
    // Clear the convolver history so a resume never emits a previous hit tail.
    const impulse = this.reverb.buffer; this.reverb.buffer = null; this.reverb.buffer = impulse;
    try { return Promise.resolve(this.ctx.suspend()).catch(() => {}); } catch { return Promise.resolve(); }
  }
  async dispose() {
    this.disposed = true;
    await this.suspend(); this.audioRevision++;
    this.assetBuffers.clear(); this.assetPending.clear(); this.assetStartPending.clear();
    this.scoreBuffers.clear(); this.assetDecoders.clear();
    for (const bus of Object.values(this.buses)) bus.disconnect();
    this.master?.disconnect(); this.compressor?.disconnect(); this.reverb?.disconnect(); this.reverbGain?.disconnect();
    if (this.reverb) this.reverb.buffer = null;
    this.noiseBuffer = null; this.fallbackBuffer = null;
    try { await this.ctx?.close(); } catch { /* Context may already be closed. */ }
  }
}
