import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const root = new URL('../', import.meta.url), base = new URL('src/assets/soundscape/', root);
const hash = data => createHash('sha256').update(data).digest('hex');
const manifest = JSON.parse(await readFile(new URL('provenance.json', base), 'utf8'));
const cuesBytes = await readFile(new URL('cues.json', base)), cues = JSON.parse(cuesBytes);
assert.equal(hash(await readFile(new URL(manifest.generator, root))), manifest.generatorSha256, 'audio generator fingerprint');
assert.equal(hash(cuesBytes), manifest.cuesSha256, 'cue bounds fingerprint');
assert.deepEqual(manifest.assets.map(asset => asset.file).sort(), ['pilgrim-foley.wav', 'pilgrim-harmony.mp3', 'pilgrim-motif.mp3', 'pilgrim-pulse.mp3']);
let total = 0;
for (const asset of manifest.assets) {
  const data = await readFile(new URL(asset.file, base)); total += data.length;
  assert.equal(data.length, asset.bytes, `size ${asset.file}`); assert.equal(hash(data), asset.sha256, `SHA-256 ${asset.file}`);
  assert.equal(asset.sampleRate, 22050); assert(asset.pcmPeak > 0 && asset.pcmPeak < .9); assert(asset.pcmRms > .01);
  if (asset.file.endsWith('.wav')) {
    assert.equal(data.toString('ascii', 0, 4), 'RIFF'); assert.equal(data.toString('ascii', 8, 12), 'WAVE');
    assert.equal(data.readUInt16LE(20), 1); assert.equal(data.readUInt16LE(22), 1); assert.equal(data.readUInt32LE(24), 22050); assert.equal(data.readUInt16LE(34), 16);
    assert.equal(data.readUInt32LE(40), data.length - 44);
    assert.equal((data.length - 44) / 2 / 22050, asset.durationSeconds);
    for (const [name, cue] of Object.entries(cues)) {
      assert(Number.isFinite(cue.offset) && Number.isFinite(cue.duration), name); assert(cue.offset >= 0 && cue.duration > .05 && cue.offset + cue.duration <= asset.durationSeconds, name);
    }
  } else {
    assert.equal(asset.durationSeconds, 48); assert(data.toString('ascii', 0, 3) === 'ID3' || (data[0] === 255 && (data[1] & 224) === 224), 'MP3 header');
  }
}
assert.equal(Object.keys(cues).length, 24); assert.equal(total, manifest.totalBytes); assert(total < 1600000, 'mobile encoded audio payload budget');
console.log(JSON.stringify({ passed: true, scope: 'Committed asset hashes, source provenance, WAV header, cue bounds and encoded payload; not decoded media or heard device audio', files: manifest.assets.length, cues: Object.keys(cues).length, bytes: total }));
