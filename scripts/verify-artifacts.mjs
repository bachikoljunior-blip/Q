import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { buildIdentity } from './build-identity.mjs';

const stage=JSON.parse(await readFile('artifacts/latest-site.json','utf8'));
const root=`${stage.root}/dist`,manifest=JSON.parse(await readFile('dist/.vite/manifest.json','utf8'));
const html=await readFile(`${root}/index.html`,'utf8');
const entryMatch=html.match(/<script type="module" crossorigin src="\.\/(assets\/[^"']+\.js)"/);
assert(entryMatch,'production HTML must reference its module entry');
const entryPath=`${root}/${entryMatch[1]}`,entry=await readFile(entryPath,'utf8');
assert.equal(entryMatch[1],manifest['index.html'].file);
const entryBytes=(await stat(entryPath)).size;
assert(!html.includes('rel="modulepreload"'),'deferred 3D chunks must not be preloaded by the title page');
assert(entryBytes<150000,`initial application chunk is ${entryBytes} bytes; expected under 150000`);
assert(/import\("\.\/scene-[^"']+\.js"\)/.test(entry),'3D scene must be loaded by dynamic import');

const assets=await readdir(`${root}/assets`);
const jsAssets=assets.filter(name=>name.endsWith('.js'));
assert.equal(jsAssets.length,3,'production build must contain only the current entry, scene and Three.js chunks');
assert(jsAssets.some(name=>name.startsWith('scene-')),'scene chunk is missing');
assert(jsAssets.some(name=>name.startsWith('three-')),'Three.js vendor chunk is missing');
const totalJs=(await Promise.all(jsAssets.map(async name=>(await stat(`${root}/assets/${name}`)).size))).reduce((a,b)=>a+b,0);

const standalone=await readFile('release/Q-ash-pilgrim.html','utf8');
const identity=await buildIdentity();
assert(entry.includes(identity.sourceFingerprint),'production measurement identity differs from app source');
assert(standalone.includes(identity.sourceFingerprint),'standalone measurement identity differs from app source');
assert(!/<script[^>]+src=/.test(standalone),'standalone build contains an external script');
assert(!/<link[^>]+(?:stylesheet|manifest)/.test(standalone),'standalone build contains an external stylesheet or manifest');
assert(!/import\(["']\.\/assets\//.test(standalone),'standalone build contains an unresolved production chunk import');
assert(standalone.includes('aria-busy')&&standalone.includes('SceneView'),'standalone build does not contain the lazy scene bootstrap');
const embedded=[...standalone.matchAll(/data:[^"'\s;]+;base64,([A-Za-z0-9+/=]+)/g)].map(match=>Buffer.from(match[1],'base64'));
for(const name of ['pilgrim','knight','keeper']){
  const source=`src/assets/characters/${name}.glb`,original=await readFile(source),output=manifest[source]?.file;
  assert(output,`missing emitted model ${name}`);
  assert((await readFile(`${root}/${output}`)).equals(original),`deployed model differs from source: ${name}`);
  assert(embedded.some(data=>data.equals(original)),`standalone does not embed the complete ${name} model`);
  assert(!entry.includes(output),'character assets must stay out of the title chunk');
}

const provenance=JSON.parse(await readFile('src/assets/vaults/provenance.json','utf8'));
assert.equal(provenance.schemaVersion,1,'unsupported vault asset provenance schema');
const generator=await readFile(provenance.generator);
assert.equal(createHash('sha256').update(generator).digest('hex'),provenance.generatorSha256,'vault asset generator differs from provenance');
const provenanceFiles=provenance.assets.map(asset=>asset.file).sort();
const manifestFiles=Object.keys(manifest).filter(key=>key.startsWith('src/assets/vaults/')&&key!=='src/assets/vaults/provenance.json').map(key=>key.split('/').at(-1)).sort();
assert.deepEqual(manifestFiles,provenanceFiles,'emitted vault assets differ from the provenance inventory');
let vaultBytes=0;
for(const asset of provenance.assets){
  const sourcePath=`src/assets/vaults/${asset.file}`,source=await readFile(sourcePath);
  const digest=createHash('sha256').update(source).digest('hex');
  assert.equal(source.length,asset.bytes,`source byte count differs from provenance: ${asset.file}`);
  assert.equal(digest,asset.sha256,`source hash differs from provenance: ${asset.file}`);
  assert.equal(asset.generator,provenance.generator,`asset generator differs from inventory: ${asset.file}`);
  assert.equal(asset.license,'Project-original deterministic procedural asset; no third-party source material',`asset license is not explicit: ${asset.file}`);
  const output=manifest[sourcePath]?.file;
  assert(output,`missing emitted vault asset ${asset.file}`);
  assert((await readFile(`dist/${output}`)).equals(source),`build output differs from source: ${asset.file}`);
  assert((await readFile(`${root}/${output}`)).equals(source),`staged output differs from source: ${asset.file}`);
  assert(embedded.some(data=>data.equals(source)),`standalone does not embed the complete ${asset.file}`);
  vaultBytes+=source.length;
}

console.log(`Verified staged production build: initial ${Math.round(entryBytes/1024)} KiB, ${jsAssets.length} JS chunks, ${Math.round(totalJs/1024)} KiB JS, 3 models and ${provenance.assets.length} vault assets (${vaultBytes} bytes); source, build, staged output and standalone bytes agree.`);
