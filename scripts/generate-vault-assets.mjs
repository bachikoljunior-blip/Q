import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { deflateSync } from 'node:zlib';

const root = new URL('../src/assets/vaults/', import.meta.url);
const sampleRate = 22050;
const slice = process.argv.includes('--all') ? 'all' : process.argv[process.argv.indexOf('--slice') + 1];
const verify = process.argv.includes('--verify');
if (!verify && !['ember', 'tide', 'gale', 'moss', 'all'].includes(slice)) throw Error('Use --slice ember, --slice tide, --slice gale, --slice moss, --all, or --verify');

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let i = 0; i < 8; i++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(data) {
  let c = 0xffffffff;
  for (const byte of data) c = crcTable[(c ^ byte) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(name, data) {
  const type = Buffer.from(name), length = Buffer.alloc(4), crc = Buffer.alloc(4);
  length.writeUInt32BE(data.length); crc.writeUInt32BE(crc32(Buffer.concat([type, data])));
  return Buffer.concat([length, type, data, crc]);
}
function png(theme) {
  const width = 128, height = 128, raw = Buffer.alloc((width * 4 + 1) * height);
  const palettes = {
    ember: [[31, 31, 37], [103, 47, 31], [205, 102, 46]],
    tide: [[22, 43, 51], [42, 92, 101], [114, 193, 186]],
    gale: [[33, 38, 46], [76, 88, 102], [205, 224, 213]],
    moss: [[27, 38, 31], [58, 83, 60], [171, 201, 116]],
  }, palette = palettes[theme], seeds = { ember: 911, tide: 1831, gale: 2749, moss: 3691 };
  const noise = (x, y) => {
    let n = Math.imul(x + 19, 374761393) ^ Math.imul(y + 47, 668265263) ^ seeds[theme];
    n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  };
  for (let y = 0; y < height; y++) {
    const row = y * (width * 4 + 1); raw[row] = 0;
    for (let x = 0; x < width; x++) {
      const p = row + 1 + x * 4, mortar = x % 32 < 2 || (y + (Math.floor(x / 32) % 2) * 16) % 32 < 2;
      const fissure = Math.abs(Math.sin(x * .17 + Math.sin(y * .11) * 2.2)) < .055;
      const glow = theme === 'ember' ? fissure && noise(x, y) > .22 : theme === 'tide' ? (x + y * 3) % 47 < 2 : theme === 'gale' ? (x * 5 + y * 2) % 61 < 2 : (x * 2 + y * 7) % 53 < 3;
      const base = mortar ? palette[0] : glow ? palette[2] : palette[1], grain = Math.floor((noise(x, y) - .5) * 28);
      raw[p] = Math.max(0, Math.min(255, base[0] + grain)); raw[p + 1] = Math.max(0, Math.min(255, base[1] + grain)); raw[p + 2] = Math.max(0, Math.min(255, base[2] + grain)); raw[p + 3] = 255;
    }
  }
  const pixel = (x, y) => y * (width * 4 + 1) + 1 + x * 4;
  for (let y = 0; y < height; y++) raw.copy(raw, pixel(width - 1, y), pixel(0, y), pixel(0, y) + 4);
  raw.copy(raw, (height - 1) * (width * 4 + 1) + 1, 1, width * 4 + 1);
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}
function wav({ seconds, synth }) {
  const frames = Math.round(seconds * sampleRate), pcm = Buffer.alloc(frames * 2);
  let seed = 0x51f15e ^ frames;
  const random = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return ((seed >>> 0) / 4294967295) * 2 - 1; };
  for (let i = 0; i < frames; i++) {
    const t = i / sampleRate, fade = Math.min(1, i / 160, (frames - i) / 320), value = Math.max(-1, Math.min(1, synth(t, i / frames, random) * fade));
    pcm.writeInt16LE(Math.round(value * 32767), i * 2);
  }
  const header = Buffer.alloc(44); header.write('RIFF'); header.writeUInt32LE(36 + pcm.length, 4); header.write('WAVE', 8); header.write('fmt ', 12); header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(1, 22); header.writeUInt32LE(sampleRate, 24); header.writeUInt32LE(sampleRate * 2, 28); header.writeUInt16LE(2, 32); header.writeUInt16LE(16, 34); header.write('data', 36); header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}
const tone = (hz, decay = 4, overtone = .2) => (t, phase) => (Math.sin(t * hz * Math.PI * 2) + Math.sin(t * hz * 2.01 * Math.PI * 2) * overtone) * Math.exp(-phase * decay) * .48;
const recipes = {
  'shared-step.wav': () => wav({ seconds: .16, synth: (t, p, rand) => rand() * Math.exp(-p * 10) * .24 + Math.sin(t * 86 * Math.PI * 2) * Math.exp(-p * 16) * .16 }),
  'shared-alert.wav': () => wav({ seconds: .48, synth: (t, p) => Math.sin(t * (155 + p * 180) * Math.PI * 2) * Math.sin(Math.PI * p) * .38 }),
  'shared-swing.wav': () => wav({ seconds: .24, synth: (t, p, rand) => rand() * Math.sin(Math.PI * p) * .24 + Math.sin(t * (420 - p * 300) * Math.PI * 2) * .15 }),
  'shared-impact.wav': () => wav({ seconds: .18, synth: (t, p, rand) => rand() * Math.exp(-p * 11) * .42 + Math.sin(t * 72 * Math.PI * 2) * Math.exp(-p * 7) * .32 }),
  'shared-claim.wav': () => wav({ seconds: .9, synth: (t, p) => [220, 330, 440, 660].reduce((v, hz, i) => v + Math.sin(t * hz * Math.PI * 2) * Math.max(0, 1 - Math.abs(p - i * .16) * 4) * .09, 0) }),
  'shared-seal.wav': () => wav({ seconds: .7, synth: (t, p, rand) => Math.sin(t * (92 + p * 620) * Math.PI * 2) * Math.sin(Math.PI * p) * .29 + rand() * Math.exp(-p * 8) * .1 }),
  'ember-ambient.wav': () => wav({ seconds: 4, synth: (t, p, rand) => Math.sin(t * 46 * Math.PI * 2) * .08 + Math.sin(t * 69.2 * Math.PI * 2) * .035 + rand() * .018 + Math.sin(p * Math.PI * 8) * .012 }),
  'tide-ambient.wav': () => wav({ seconds: 4, synth: (t, p, rand) => Math.sin(t * 55 * Math.PI * 2) * .06 + Math.sin(t * 82.4 * Math.PI * 2) * .03 + Math.sin(t * .45 * Math.PI * 2) * rand() * .025 }),
  'gale-ambient.wav': () => wav({ seconds: 4, synth: (t, p, rand) => Math.sin(t * 73.4 * Math.PI * 2) * .045 + Math.sin(t * 109.7 * Math.PI * 2) * .022 + rand() * (.012 + Math.sin(p * Math.PI * 6) * .009) }),
  'moss-ambient.wav': () => wav({ seconds: 4, synth: (t, p, rand) => Math.sin(t * 41.2 * Math.PI * 2) * .052 + Math.sin(t * 61.8 * Math.PI * 2) * .026 + Math.sin(t * .7 * Math.PI * 2) * .018 + rand() * .01 }),
  'ember-stone.png': () => png('ember'),
  'tide-stone.png': () => png('tide'),
  'gale-stone.png': () => png('gale'),
  'moss-stone.png': () => png('moss'),
};
const shared = Object.keys(recipes).filter(name => name.startsWith('shared-'));
const requested = slice === 'all' ? Object.keys(recipes) : [...shared, `${slice}-ambient.wav`, `${slice}-stone.png`];
const sha256 = data => createHash('sha256').update(data).digest('hex');

async function verifyManifest() {
  const manifest = JSON.parse(await readFile(new URL('provenance.json', root), 'utf8'));
  const generator = await readFile(new URL(import.meta.url));
  if (sha256(generator) !== manifest.generatorSha256) throw Error('Generator drift');
  for (const asset of manifest.assets) {
    const expected = recipes[asset.file]?.();
    if (!expected) throw Error(`No deterministic recipe for ${asset.file}`);
    const actual = await readFile(new URL(asset.file, root));
    if (!actual.equals(expected) || sha256(actual) !== asset.sha256 || actual.length !== asset.bytes) throw Error(`Asset drift: ${asset.file}`);
  }
  console.log(JSON.stringify({ passed: true, assets: manifest.assets.length, bytes: manifest.assets.reduce((n, asset) => n + asset.bytes, 0) }));
}

if (verify) await verifyManifest();
else {
  await mkdir(root, { recursive: true });
  let existing = [];
  try { existing = JSON.parse(await readFile(new URL('provenance.json', root), 'utf8')).assets; } catch {}
  const files = [...new Set([...existing.map(asset => asset.file), ...requested])].sort();
  const assets = [];
  for (const file of files) {
    const data = recipes[file](); await writeFile(new URL(file, root), data);
    const kind = file.endsWith('.png') ? 'tileable-raster-texture' : file.includes('ambient') ? 'looping-ambient-audio' : 'one-shot-sfx';
    assets.push({ file, kind, slice: file.startsWith('shared-') ? 'shared' : file.split('-')[0], bytes: data.length, sha256: sha256(data), generator: 'scripts/generate-vault-assets.mjs', license: 'Project-original deterministic procedural asset; no third-party source material' });
  }
  const generatorSha256 = sha256(await readFile(new URL(import.meta.url)));
  const manifest = { schemaVersion: 1, generator: 'scripts/generate-vault-assets.mjs', generatorSha256, origin: 'Repository-native deterministic synthesis from mathematical waveforms and pixel functions', assets };
  await writeFile(new URL('provenance.json', root), JSON.stringify(manifest, null, 2) + '\n');
  await verifyManifest();
}
