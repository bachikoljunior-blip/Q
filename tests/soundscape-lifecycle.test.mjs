import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { SoundContext, OfflineSoundContext } from './soundscape-web-audio-contract.mjs';
import { startFileAudio } from '../src/file-audio-bank.js';
import { VaultLoopGate } from '../src/vault-audio-cues.js';

// Production Soundscape is bundled unchanged, including its real static asset
// imports. Only the Web Audio / fetch hardware boundary below is a contract mock.
const bundle = await build({ entryPoints: [new URL('../src/audio.js', import.meta.url).pathname], bundle: true, format: 'esm', write: false, outfile: 'sound-test.js', assetNames: '[name]', loader: { '.wav': 'file', '.mp3': 'file', '.png': 'file' } });
const code = bundle.outputFiles.find(file => file.path.endsWith('sound-test.js')).text;
const { Soundscape } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
const flush = async () => { for (let i = 0; i < 70; i++) await Promise.resolve(); };
const oldAudio = globalThis.AudioContext, oldFetch = globalThis.fetch, oldOffline = globalThis.OfflineAudioContext;
function install({ delayed = false, fail = false } = {}) {
  const reads = [], pending = [];
  globalThis.AudioContext = SoundContext; globalThis.OfflineAudioContext = OfflineSoundContext;
  globalThis.fetch = url => {
    reads.push(url);
    const response = { ok: !fail, status: fail ? 503 : 200, arrayBuffer: async () => new TextEncoder().encode(url).buffer };
    if (delayed) return new Promise(resolve => pending.push(() => resolve(response)));
    return Promise.resolve(response);
  };
  return { reads, pending, resolve() { for (const finish of pending.splice(0)) finish(); } };
}
const cleanup = () => { globalThis.AudioContext = oldAudio; globalThis.OfflineAudioContext = oldOffline; globalThis.fetch = oldFetch; SoundContext.rejectResume = false; };
const game = () => ({ player: { x: 0, z: 100, y: 3, grounded: true, moving: true, weaponType: 'sword' }, enemies: [], lit: ['haven'] });

test('gesture unlock, actual graph buses, synchronized score, bounded sources, and complete suspend/resume/dispose', async () => {
  install(); const audio = new Soundscape();
  try {
    audio.play('swing'); assert.equal(audio.ctx, null, 'no autoplay before start');
    assert.equal(await audio.start(), true); await flush();
    assert.equal(audio.status, 'running'); assert.equal(audio.score.size, 3);
    assert.equal(audio.voices.size, 6, 'three stems and three atmospheric loops');
    assert.equal(audio.ctx.sampleRate, 48000, 'mock models device override / resampling');
    for (const [key, rate] of [['harmony', 44100], ['motif', 22050], ['pulse', 44100]]) assert.equal(audio.scoreBuffers.get('score:' + key)?.sampleRate, rate);
    assert.equal(audio.assetBuffers.get('foley')?.sampleRate, 22050);
    assert([...audio.assetBuffers.values()].reduce((n, b) => n + b.length * b.numberOfChannels * 4, 0) < 24 * 1024 * 1024);
    const score = [...audio.score.values()];
    assert.equal(new Set(score.map(node => node.source.started[0][0])).size, 1, 'stem start timestamp aligned');
    assert(score.every(node => node.source.loopEnd === 48));
    assert.equal(audio.buses.music.connections[0], audio.master); assert.equal(audio.master.connections[0], audio.compressor);
    for (let i = 0; i < 200; i++) audio.cue('impact-sword');
    assert(audio.voices.size <= 36); assert([...audio.voices].filter(node => node.loop).length === 6);
    const all = [...audio.voices]; audio.ctx.currentTime = 11; await audio.suspend();
    assert.equal(audio.voices.size, 0); assert(all.every(node => node.source.stopped.length)); assert.equal(audio.ctx.state, 'suspended');
    assert.equal(audio.score.size, 0); assert.equal(audio.active, false);
    assert.equal(await audio.start(), true); await flush(); assert.equal(audio.voices.size, 6);
    assert([...audio.score.values()].every(node => Math.abs(node.source.started[0][1] - 10.965) < .001), 'resume retains musical phase');
    await audio.dispose(); assert.equal(audio.status, 'disposed'); assert.equal(audio.assetBuffers.size, 0); assert.equal(audio.ctx.state, 'closed');
    assert.equal(await audio.start(), false);
  } finally { await audio.dispose(); cleanup(); }
});

test('music preference and mute affect active graph immediately; pause during decode cannot resurrect loops', async () => {
  const fetch = install({ delayed: true }); const audio = new Soundscape();
  try {
    await audio.start(); await flush(); await audio.suspend(); fetch.resolve(); await flush();
    assert.equal(audio.voices.size, 0); assert.equal(audio.score.size, 0);
    await audio.start(); await flush(); fetch.resolve(); await flush(); fetch.resolve(); await flush();
    assert.equal(audio.score.size, 3); audio.setMusic(false);
    assert.equal(audio.score.size, 0); assert.equal(audio.buses.music.gain.target, 0);
    audio.setMusic(true); await flush(); assert.equal(audio.score.size, 3);
    audio.setMuted(true); assert.equal(audio.master.gain.target, 0);
    audio.setVolume(5); audio.setMuted(false); assert.equal(audio.master.gain.target, 1);
    audio.setBusVolume('sfx', -.5); assert.equal(audio.buses.sfx.gain.target, 0);
    audio.ctx.currentTime = 10; audio.setMode('combat'); assert.equal(audio.score.get('pulse').gain.gain.target, .64);
    audio.setMode('title'); assert.equal(audio.score.get('pulse').gain.gain.target, .16);
  } finally { await audio.dispose(); cleanup(); }
});

test('material footsteps follow distance, detect water/bridges/vault, and preserve weapon / position variation', async () => {
  install(); const audio = new Soundscape();
  try {
    await audio.start(); await flush(); const g = game(), cues = [];
    const originalCue = audio.cue.bind(audio); audio.cue = (name, options) => { cues.push({ name, options }); return originalCue(name, options); };
    audio.update(g, .05); g.player.x += .3; audio.update(g, .05); assert.equal(cues.length, 0);
    g.player.x += 1; audio.update(g, .25); assert(cues.at(-1).name.startsWith('step-earth-'));
    g.player.x = 55; g.player.z = 116; audio.ctx.currentTime += .5; audio.update(g, .1);
    const before = cues.length; g.player.x += 1.3; audio.ctx.currentTime += .5; audio.update(g, .3);
    assert.equal(cues.length, before + 1); assert(cues.at(-1).name.startsWith('step-stone-'));
    assert.equal(audio.surfaceAt({ x: 166, z: 0 }), 'water');
    assert.equal(audio.surfaceAt({ x: 166 + Math.sin(25 * .017) * 23, z: 25 }), 'wood');
    g.player.weaponType = 'greatsword'; audio.play('swing'); assert.equal(cues.at(-1).name, 'whoosh-greatsword');
    audio.play('hit', { x: g.player.x + 5, z: g.player.z }); assert(cues.at(-1).options.pan > 0);
    g.enemies = [{ id: 'enemy', x: g.player.x, z: g.player.z + 5, state: 'chase', dead: false }];
    audio.update(g, .05); assert.equal(audio.mode, 'combat'); g.enemies = [];
    audio.ctx.currentTime += 2; audio.update(g, .05); assert.equal(audio.mode, 'combat');
    audio.ctx.currentTime += 3; audio.update(g, .05); assert.equal(audio.mode, 'exploration');
    const n = cues.length; g.player.x += 1.5; audio.update(g, .1, { paused: true }); assert.equal(cues.length, n);
  } finally { await audio.dispose(); cleanup(); }
});

test('resume rejection / unavailable Web Audio stay silent, decode failure produces bounded fallback and vault retries', async () => {
  install({ fail: true }); const audio = new Soundscape();
  try {
    SoundContext.rejectResume = true; assert.equal(await audio.start(), false); assert.equal(audio.active, false); assert.equal(audio.voices.size, 0);
    SoundContext.rejectResume = false; assert.equal(await audio.start(), true); await flush();
    assert.equal(audio.score.size, 1); assert(audio.fallbackBuffer); assert.equal(audio.voices.size, 4);
    audio.setVault('ember'); await flush(); assert.equal(audio.vaultGate.pending, false); assert.equal(audio.vaultGate.node, null);
    const revision = audio.vaultGate.revision; audio.setVault('ember'); assert.equal(audio.vaultGate.revision, revision, 'retry throttled');
    audio.ctx.currentTime += 4; audio.setVault('ember'); assert.equal(audio.vaultGate.revision, revision + 1);
    await audio.dispose(); globalThis.AudioContext = undefined; const unavailable = new Soundscape(); assert.equal(await unavailable.start(), false);
  } finally { await audio.dispose(); cleanup(); }
});

test('late file one-shot is cancelled across suspension, loop ABA sources stay independent, decoded cache stays bounded', async () => {
  const fetch = install({ delayed: true }); const audio = new Soundscape();
  try {
    await audio.start(); await flush();
    const one = startFileAudio(audio, 'late-hit', '/shared-impact.wav');
    const gate = new VaultLoopGate(), oldRequest = gate.request('ember');
    const oldLoop = startFileAudio(audio, 'ambient:ember', '/ember-ambient.wav', { loop: true });
    gate.request(null); const currentRequest = gate.request('ember');
    const currentLoop = startFileAudio(audio, 'ambient:ember', '/ember-ambient.wav', { loop: true });
    await flush(); fetch.resolve(); await flush();
    const old = await oldLoop, current = await currentLoop;
    assert.notEqual(old, current); gate.accept(oldRequest, old); gate.accept(currentRequest, current);
    assert(old.source.stopped.length); assert.equal(current.source.stopped.length, 0);
    await one;
    const stale = startFileAudio(audio, 'late-second-hit', '/shared-impact.wav'); await flush(); await audio.suspend(); fetch.resolve(); await flush();
    assert.equal(await stale, null); assert.equal(audio.voices.size, 0);
    audio.maxDecodedBytes = 1024; const oversized = audio.loadAsset('oversized', '/score.mp3'); await flush(); fetch.resolve(); assert.equal(await oversized, null);
  } finally { await audio.dispose(); cleanup(); }
});
