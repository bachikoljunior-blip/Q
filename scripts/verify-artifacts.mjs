import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';

const html=await readFile('dist/index.html','utf8');
const entryMatch=html.match(/<script type="module" crossorigin src="\.\/(assets\/[^"']+\.js)"/);
assert(entryMatch,'production HTML must reference its module entry');
const entryPath=`dist/${entryMatch[1]}`,entry=await readFile(entryPath,'utf8');
const entryBytes=(await stat(entryPath)).size;
assert(!html.includes('rel="modulepreload"'),'deferred 3D chunks must not be preloaded by the title page');
assert(entryBytes<150000,`initial application chunk is ${entryBytes} bytes; expected under 150000`);
assert(/import\("\.\/scene-[^"']+\.js"\)/.test(entry),'3D scene must be loaded by dynamic import');

const assets=await readdir('dist/assets');
const jsAssets=assets.filter(name=>name.endsWith('.js'));
assert.equal(jsAssets.length,3,'production build must contain only the current entry, scene and Three.js chunks');
assert(jsAssets.some(name=>name.startsWith('scene-')),'scene chunk is missing');
assert(jsAssets.some(name=>name.startsWith('three-')),'Three.js vendor chunk is missing');
const totalJs=(await Promise.all(jsAssets.map(async name=>(await stat(`dist/assets/${name}`)).size))).reduce((a,b)=>a+b,0);

const standalone=await readFile('release/Q-ash-pilgrim.html','utf8');
assert(!/<script[^>]+src=/.test(standalone),'standalone build contains an external script');
assert(!/<link[^>]+(?:stylesheet|manifest)/.test(standalone),'standalone build contains an external stylesheet or manifest');
assert(!/import\(["']\.\/assets\//.test(standalone),'standalone build contains an unresolved production chunk import');
assert(standalone.includes('aria-busy')&&standalone.includes('SceneView'),'standalone build does not contain the lazy scene bootstrap');

console.log(`Verified lazy production build: initial ${Math.round(entryBytes/1024)} KiB, ${jsAssets.length} JS chunks, ${Math.round(totalJs/1024)} KiB total; standalone is self-contained.`);
