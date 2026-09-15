import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { inflateSync } from 'node:zlib';
import { VAULT_SLICES } from '../src/vault-slices.js';
import { VaultLoopGate, vaultCueForEvent } from '../src/vault-audio-cues.js';

const root = new URL('../src/assets/vaults/', import.meta.url), hash = data => createHash('sha256').update(data).digest('hex');

test('vault asset manifest exactly covers deterministic production texture and audio bytes', async () => {
  const manifestBytes = await readFile(new URL('provenance.json', root)), manifest = JSON.parse(manifestBytes);
  const generator = await readFile(new URL('../scripts/generate-vault-assets.mjs', import.meta.url));
  const bindings = await readFile(new URL('../src/vault-asset-urls.js', import.meta.url), 'utf8');
  assert.equal(manifest.generatorSha256, hash(generator));
  const cues = ['step', 'alert', 'swing', 'impact', 'claim', 'seal'], expected = new Set([...VAULT_SLICES.flatMap(slice => [`${slice.theme}-stone.png`, `${slice.theme}-ambient.wav`]), ...cues.map(cue => `shared-${cue}.wav`)]);
  assert.deepEqual(new Set(manifest.assets.map(asset => asset.file)), expected);
  const disk = (await readdir(root)).filter(file => file !== 'provenance.json'); assert.deepEqual(new Set(disk), expected);
  for (const asset of manifest.assets) {
    assert.match(asset.license, /Project-original/); assert.equal(asset.generator, manifest.generator);
    const data = await readFile(new URL(asset.file, root)); assert.equal(data.length, asset.bytes); assert.equal(hash(data), asset.sha256);
    if (asset.file.endsWith('.png')) {
      assert.equal(data.subarray(1, 4).toString(), 'PNG'); const width = data.readUInt32BE(16), height = data.readUInt32BE(20); assert.equal(width, 128); assert.equal(height, 128);
      const idat = []; for (let offset = 8; offset < data.length;) { const length = data.readUInt32BE(offset), type = data.subarray(offset + 4, offset + 8).toString(); if (type === 'IDAT') idat.push(data.subarray(offset + 8, offset + 8 + length)); offset += length + 12; }
      const pixels = inflateSync(Buffer.concat(idat)), stride = width * 4 + 1; for (let y = 0; y < height; y++) { assert.equal(pixels[y * stride], 0); assert(pixels.subarray(y * stride + 1, y * stride + 5).equals(pixels.subarray((y + 1) * stride - 4, (y + 1) * stride))); }
      assert(pixels.subarray(1, stride).equals(pixels.subarray((height - 1) * stride + 1, height * stride)));
    }
    else { assert.equal(data.subarray(0, 4).toString(), 'RIFF'); assert.equal(data.subarray(8, 12).toString(), 'WAVE'); assert.equal(data.readUInt32LE(24), 22050); assert(data.readUInt32LE(40) > 4000); }
  }
  for (const file of expected) assert(bindings.includes(`./assets/vaults/${file}`), `production asset binding missing ${file}`);
  for (const slice of VAULT_SLICES) assert.deepEqual(new Set(slice.audio.sfx), new Set(cues));
  const routed = [['vaultEnter', {}, 'seal'], ['vaultAlert', {}, 'alert'], ['vaultStep', {}, 'step'], ['vaultSeal', {}, 'seal'], ['vaultClaim', {}, 'claim'], ['enemySwing', { vaultId: 'v' }, 'swing'], ['hit', { vaultId: 'v' }, 'impact']];
  for (const [event, data, cue] of routed) assert.equal(vaultCueForEvent(event, data), cue); assert.equal(vaultCueForEvent('hit', {}), null);
  const stops = [], node = id => ({ source: { stop: () => stops.push(id) } }), gate = new VaultLoopGate(), first = gate.request('ember');
  gate.request(null); const latest = gate.request('ember'); assert.equal(gate.accept(first, node('stale')), false); assert.equal(gate.accept(latest, node('active')), true);
  gate.request('tide'); assert.deepEqual(stops, ['stale', 'active']);
  const failed = gate.request('gale'); assert.equal(gate.request('gale'), null); assert.equal(gate.accept(failed, null), false); assert(gate.request('gale'), 'failed ambient must be retryable without leaving the vault');
});
