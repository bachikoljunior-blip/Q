import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { buildIdentity } from './build-identity.mjs';
import { verifyWebReceipt } from './web-package.mjs';
await verifyWebReceipt(JSON.parse(await readFile('release/Q-web-manifest.json','utf8')));

const stage=JSON.parse(await readFile('artifacts/latest-site.json','utf8'));
const root=`${stage.root}/dist`,manifest=JSON.parse(await readFile('dist/.vite/manifest.json','utf8'));
const html=await readFile(`${root}/index.html`,'utf8');
const entryMatch=html.match(/<script type="module" crossorigin src="\.\/(assets\/[^"']+\.js)"/);
assert(entryMatch,'production HTML must reference its module entry');
const entryPath=`${root}/${entryMatch[1]}`,entry=await readFile(entryPath,'utf8');
assert.equal(entryMatch[1],manifest['index.html'].file);
const entryBytes=(await stat(entryPath)).size;
assert(!html.includes('rel="modulepreload"'),'deferred 3D chunks must not be preloaded by the title page');
// A tunable transfer-size regression guard, not a service or device limit.
// v52 preserves authored-rate music and explicit active/cache ownership:
// same-environment code-only builds measure 164,988 -> 165,415 bytes (+427).
// The integrator adopted this bounded allowance with the three-chunk lazy
// scene contract intact; see docs/evidence/recovery-v52/entry-budget-comparison.json.
// Audio residency and actual device/startup acceptance remain separate.
const initialJsBudget=166000;
assert(entryBytes<initialJsBudget,`initial application chunk is ${entryBytes} bytes; expected under ${initialJsBudget}`);
assert(/import\("\.\/scene-[^"']+\.js"\)/.test(entry),'3D scene must be loaded by dynamic import');

const assets=await readdir(`${root}/assets`);
const jsAssets=assets.filter(name=>name.endsWith('.js'));
assert.equal(jsAssets.length,3,'production build must contain only the current entry, scene and Three.js chunks');
assert(jsAssets.some(name=>name.startsWith('scene-')),'scene chunk is missing');
assert(jsAssets.some(name=>name.startsWith('three-')),'Three.js vendor chunk is missing');
const totalJs=(await Promise.all(jsAssets.map(async name=>(await stat(`${root}/assets/${name}`)).size))).reduce((a,b)=>a+b,0);

const identity=await buildIdentity();
assert(entry.includes(identity.sourceFingerprint),'production measurement identity differs from app source');
for(const name of jsAssets)assert(!(await readFile(`${root}/assets/${name}`,'utf8')).includes('q85:'),'web runtime must not include the optional standalone decoder');
const mediaSources=Object.keys(manifest).filter(source=>/\.(hdr|glb|png|webp|jpg|mp4|mp3|wav)$/.test(source));
for(const source of mediaSources){
  const original=await readFile(source),output=manifest[source].file;
  assert((await readFile(`dist/${output}`)).equals(original),`emitted media differs from source: ${source}`);
  assert((await readFile(`${root}/${output}`)).equals(original),`staged media differs from source: ${source}`);
}
let runtimeModels=0;
for(const name of ['pilgrim','knight','keeper']){
  const source=`src/assets/characters/${name}.glb`,original=await readFile(source),output=manifest[source]?.file;
  // The former CC0 models remain as licensed source/reference assets. Current
  // actors are authored articulated geometry; unused GLBs must not be shipped.
  if(!output)continue;
  runtimeModels++;
  assert((await readFile(`${root}/${output}`)).equals(original),`deployed model differs from source: ${name}`);
  assert(!entry.includes(output),'character assets must stay out of the title chunk');
}

// Authoring recordings and the original full-body mesh are retained only as source.
for(const path of Object.keys(manifest)){
  assert(!path.startsWith('assets-source/'),'raw recorded instruments must not be emitted');
  assert(!path.startsWith('src/assets/characters/sources/'),'full source body and morphs must not be emitted');
}

const presentationSources=Object.keys(manifest).filter(source=>/^src\/assets\/(title|soundscape)\//.test(source)&&/\.(webp|mp3|wav|mp4)$/.test(source));
assert.equal(presentationSources.length,6,'title poster/video and four soundscape assets must be emitted exactly once');
assert(!manifest['src/assets/title/north-gate-v22.png'],'archived original title PNG must not duplicate the optimized runtime artwork');
let presentationBytes=0;
for(const sourcePath of presentationSources){
  const source=await readFile(sourcePath),output=manifest[sourcePath].file;
  assert((await readFile(`dist/${output}`)).equals(source),`presentation build differs from source: ${sourcePath}`);
  assert((await readFile(`${root}/${output}`)).equals(source),`staged presentation asset differs: ${sourcePath}`);
  presentationBytes+=source.length;
}

const environment=JSON.parse(await readFile('src/assets/environment/provenance.json','utf8'));
const environmentFiles=Object.keys(manifest).filter(source=>source.startsWith('src/assets/environment/')&&source.endsWith('.jpg')).sort();
assert.deepEqual(environmentFiles,environment.assets.map(asset=>asset.path).sort(),'environment source inventory differs from emitted assets');
for(const asset of environment.assets){
  const original=await readFile(asset.path),output=manifest[asset.path]?.file;
  assert.equal(original.length,asset.bytes); assert.equal(createHash('sha256').update(original).digest('hex'),asset.sha256);
  assert.equal(asset.license,'CC0-1.0'); assert(output);
  assert((await readFile(`dist/${output}`)).equals(original)); assert((await readFile(`${root}/${output}`)).equals(original));
  assert(!entry.includes(output),'environment photos must stay behind the scene import');
}

const forest=JSON.parse(await readFile('src/assets/forest/provenance.json','utf8'));
const forestOutputs=Object.keys(manifest).filter(path=>path.startsWith('src/assets/forest/')).sort();
assert.deepEqual(forestOutputs,forest.derivatives.map(asset=>asset.path).sort(),'only the two optimized forest photos belong in the runtime');
for(const asset of [...forest.sources,...forest.derivatives]){
  const bytes=await readFile(asset.path);
  assert.equal(bytes.length,asset.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),asset.sha256);
  if(!asset.runtimeIncluded){assert(!manifest[asset.path],'retained forest source must not duplicate a runtime photo');continue;}
  const output=manifest[asset.path]?.file;assert(output);
  assert((await readFile(`dist/${output}`)).equals(bytes));assert((await readFile(`${root}/${output}`)).equals(bytes));
  assert(!entry.includes(output),'forest photos must remain behind the scene import');
}
assert.equal(createHash('sha256').update(await readFile(forest.generator.path)).digest('hex'),forest.generator.sha256);

const sky=JSON.parse(await readFile('src/assets/sky/provenance.json','utf8'));
const skyOutputs=Object.keys(manifest).filter(path=>path.startsWith('src/assets/sky/')).sort();
assert.deepEqual(skyOutputs,[sky.source.path],'only the original selected HDR belongs in the sky runtime');
assert.equal(sky.source.license,'CC0-1.0');assert.equal(sky.source.runtimeIncluded,true);
const skyBytes=await readFile(sky.source.path),skyOutput=manifest[sky.source.path]?.file;
assert.equal(skyBytes.length,sky.source.bytes);assert.equal(createHash('sha256').update(skyBytes).digest('hex'),sky.source.sha256);assert(skyOutput);
assert((await readFile(`dist/${skyOutput}`)).equals(skyBytes));assert((await readFile(`${root}/${skyOutput}`)).equals(skyBytes));
assert(!entry.includes(skyOutput),'HDR sky must remain behind the scene import');

const skin=JSON.parse(await readFile('src/assets/characters/skin/provenance.json','utf8'));
const skinOutputs=Object.keys(manifest).filter(path=>path.startsWith('src/assets/characters/skin/')).sort();
assert.deepEqual(skinOutputs,[skin.runtime.path],'only the selected WebP skin belongs in runtime');
for(const asset of [skin.source,skin.materialDescriptor,skin.licenseFile,skin.runtime]){
  const bytes=await readFile(asset.path);assert.equal(bytes.length,asset.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),asset.sha256);
  if(!asset.runtimeIncluded){assert(!manifest[asset.path]);continue;}
  const output=manifest[asset.path]?.file;assert(output);assert((await readFile(`dist/${output}`)).equals(bytes));assert((await readFile(`${root}/${output}`)).equals(bytes));
  assert(!entry.includes(output),'skin must remain behind the scene import');
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
  vaultBytes+=source.length;
}

console.log(`Verified staged production build: initial ${entryBytes} bytes, ${jsAssets.length} JS chunks, ${totalJs} JS bytes, ${runtimeModels} imported runtime models, ${provenance.assets.length} vault assets (${vaultBytes} bytes) and ${presentationSources.length} title/score assets (${presentationBytes} bytes); source, build, fixed staged output and web receipt bytes agree.`);
