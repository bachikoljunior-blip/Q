import test from 'node:test';
import assert from 'node:assert/strict';
import { startFileAudio } from '../src/file-audio-bank.js';
import { VAULT_SLICES } from '../src/vault-slices.js';
import { VaultLoopGate } from '../src/vault-audio-cues.js';

test('file audio bank fetches, decodes, connects and starts every ambient and six SFX', async () => {
  const oldFetch = globalThis.fetch, fetched = [], decoded = [], sources = [], master = { id: 'master' };
  globalThis.fetch = async url => ({ ok: true, async arrayBuffer() { fetched.push(url); return new Uint8Array([1, 2, 3, url.length]).buffer; } });
  const ctx = {
    async decodeAudioData(data) { decoded.push(data.byteLength); return { decoded: data.byteLength }; },
    createBufferSource() { const source = { connections: [], started: 0, stopped: 0, connect(node) { this.connections.push(node); }, disconnect() {}, start() { this.started++; }, stop() { this.stopped++; } }; sources.push(source); return source; },
    createGain() { return { gain: { value: 0 }, connections: [], connect(node) { this.connections.push(node); }, disconnect() {} }; },
  };
  const host = { ctx, master, assetBuffers: new Map(), assetPending: new Map() }, ambientCount = VAULT_SLICES.length, files = [...VAULT_SLICES.map(slice => `${slice.theme}-ambient.wav`), ...['step', 'alert', 'swing', 'impact', 'claim', 'seal'].map(cue => `shared-${cue}.wav`)];
  try {
    const nodes = await Promise.all(files.map((file, index) => startFileAudio(host, file, `/assets/${file}`, { loop: index < ambientCount, volume: .18 })));
    assert.equal(fetched.length, files.length); assert.equal(decoded.length, files.length); assert.equal(sources.length, files.length); assert(nodes.every(Boolean)); assert(sources.every(source => source.started === 1)); assert.deepEqual(sources.map(source => source.loop), files.map((_, index) => index < ambientCount));
    assert(nodes.every(node => node.source.connections[0] === node.gain)); assert(nodes.every(node => node.gain.connections[0] === master));
    await startFileAudio(host, files[0], `/assets/${files[0]}`, { loop: true }); assert.equal(fetched.length, files.length); assert.equal(sources.length, files.length + 1);
    const pendingHost = { ctx, master, assetBuffers: new Map(), assetPending: new Map(), assetStartPending: new Map() };
    const duplicate = await Promise.all(Array.from({ length: 6 }, () => startFileAudio(pendingHost, 'sfx:alert', '/assets/shared-alert.wav')));
    assert.equal(new Set(duplicate).size, 1); assert.equal(sources.length, files.length + 2, 'same-key calls during decode must start one source');
    const loopHost = { ctx, master, assetBuffers: new Map(), assetPending: new Map(), assetStartPending: new Map() }, gate = new VaultLoopGate();
    const firstRequest = gate.request('ember'), firstLoop = startFileAudio(loopHost, 'ambient:ember', '/assets/ember-ambient.wav', { loop: true });
    gate.request(null); const currentRequest = gate.request('ember'), currentLoop = startFileAudio(loopHost, 'ambient:ember', '/assets/ember-ambient.wav', { loop: true });
    const [firstNode, currentNode] = await Promise.all([firstLoop, currentLoop]); assert.notEqual(firstNode, currentNode);
    assert.equal(gate.accept(firstRequest, firstNode), false); assert.equal(gate.accept(currentRequest, currentNode), true);
    assert.equal(firstNode.source.stopped, 1); assert.equal(currentNode.source.stopped, 0, 'stale exit/re-entry must not stop the current loop');
  } finally { globalThis.fetch = oldFetch; }
});
