import { globSync, readFileSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const required = [
  'index.html', 'styles.css', 'manifest.webmanifest', 'icon.svg', 'sw.js', 'release.json',
  'src/main.js', 'src/game.js', 'src/world.js', 'src/core.js', 'src/storage.js', 'src/audio.js',
  'assets/textures/ground.webp', 'assets/portraits/characters.webp', 'assets/fonts/q-japanese.woff', 'assets/fonts/OFL-NotoSansJP.txt',
  'vendor/three.module.js', 'vendor/three.core.min.js', 'vendor/THREE-LICENSE.txt', 'assets-manifest.json', 'package.json',
  'START_HERE.md', 'AI_DEVELOPMENT/PROTOCOL.md', 'AI_DEVELOPMENT/STATE.yaml',
  'AI_DEVELOPMENT/REQUIREMENTS.yaml', 'AI_DEVELOPMENT/REFERENCE_BENCHMARKS.yaml', 'AI_DEVELOPMENT/WORK_GRAPH.yaml'
];
const failures = [];

for (const file of required) {
  try { if (!statSync(file).isFile()) failures.push(`${file} not file`); }
  catch { failures.push(`missing ${file}`); }
}
if (process.env.FLOOR_TEST_BAD === 'F3') failures.push('DELIBERATE F3 FAILURE OBSERVED');

const html = readFileSync('index.html', 'utf8');
if (/(?:src|href)=["']\/(?!\/)/.test(html)) failures.push('root-relative path in index');
if (!html.includes('user-scalable=no')) failures.push('viewport zoom policy missing');
if (!html.includes('Q: WILDBOUND')) failures.push('product title missing');

let release;
try {
  release = JSON.parse(readFileSync('release.json'));
  if (typeof release.release_id !== 'string' || !/^[a-z0-9][a-z0-9._-]{4,127}$/i.test(release.release_id) || release.release_id.includes('__')) {
    failures.push('release ID must be a concrete stable identifier');
  } else if (!html.includes(`name="build-revision" content="${release.release_id}"`)) {
    failures.push('index build revision does not match release.json');
  }
} catch (error) { failures.push(`release ${error.message}`); }

const benchmarks = readFileSync('AI_DEVELOPMENT/REFERENCE_BENCHMARKS.yaml', 'utf8');
for (const element of ['movement', 'camera', 'combat', 'exploration', 'world_design', 'story', 'characters', 'choice_and_consequence', 'UI', 'touch_controls', 'visuals', 'animation', 'audio', 'AI', 'performance', 'stability']) {
  if (!new RegExp(`^  ${element}:`, 'm').test(benchmarks)) failures.push(`benchmark element missing ${element}`);
}
for (const rule of ['latest explicit user concept', 'Never lower a valid bar', 'Do not reproduce protected']) {
  if (!benchmarks.includes(rule)) failures.push(`benchmark authority rule missing ${rule}`);
}

try {
  const manifest = JSON.parse(readFileSync('manifest.webmanifest'));
  if (manifest.start_url !== './' || manifest.scope !== './') failures.push('manifest paths not relative');
  if (manifest.orientation !== 'landscape') failures.push('manifest must request landscape');
} catch (error) { failures.push(`manifest ${error.message}`); }

try {
  const assets = JSON.parse(readFileSync('assets-manifest.json'));
  if (assets.externalRuntimeAssets?.length) failures.push('external runtime asset declared');
  for (const path of ['vendor/three.module.js', 'vendor/three.core.min.js']) {
    const three = assets.assets?.find(item => item.path === path);
    if (!three || three.license !== 'MIT' || three.licenseFile !== 'vendor/THREE-LICENSE.txt') failures.push(`Three.js license metadata missing for ${path}`);
  }
  for (const path of ['assets/textures/ground.webp', 'assets/portraits/characters.webp']) {
    const generated = assets.assets?.find(item => item.path === path);
    if (!generated || !/Generated for this project/.test(generated.source) || generated.license !== 'Project-owned generated original') failures.push(`generated asset provenance missing for ${path}`);
  }
  const font = assets.assets?.find(item => item.path === 'assets/fonts/q-japanese.woff');
  if (!font || font.license !== 'SIL Open Font License 1.1' || font.licenseFile !== 'assets/fonts/OFL-NotoSansJP.txt') failures.push('Japanese font license metadata missing');
} catch (error) { failures.push(`assets ${error.message}`); }

const license = readFileSync('vendor/THREE-LICENSE.txt', 'utf8');
if (!/MIT License/.test(license) || !/three\.js authors/i.test(license)) failures.push('Three.js MIT license text invalid');
const fontLicense = readFileSync('assets/fonts/OFL-NotoSansJP.txt', 'utf8');
if (!/SIL OPEN FONT LICENSE Version 1\.1/.test(fontLicense)) failures.push('Japanese font OFL text invalid');
if (statSync('assets/fonts/q-japanese.woff').size < 10000) failures.push('Japanese font subset is unexpectedly small');
if (!/@font-face\{font-family:"Q Japanese";src:url\("assets\/fonts\/q-japanese\.woff"\)/.test(readFileSync('styles.css', 'utf8'))) failures.push('Japanese font-face wiring missing');
const packageData = JSON.parse(readFileSync('package.json'));
if (packageData.dependencies?.three !== '0.185.1') failures.push('Three.js version must stay exact');

for (const file of ['index.html', 'styles.css', 'sw.js', ...globSync('src/*.js')]) {
  const text = readFileSync(file, 'utf8');
  const urls = [...text.matchAll(/https?:\/\/[^\s"')]+/g)].map(match => match[0]).filter(url => !url.startsWith('http://www.w3.org/2000/svg'));
  if (urls.length) failures.push(`external URL ${file}`);
}

for (const file of ['sw.js', ...globSync('src/*.js'), ...globSync('tools/*.mjs'), ...globSync('tests/*.mjs')]) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status) failures.push(`syntax ${file}: ${result.stderr.trim()}`);
}

const releaseFiles = ['index.html', 'styles.css', 'manifest.webmanifest', 'icon.svg', 'sw.js', 'release.json', ...globSync('src/*.js'), ...globSync('assets/**/*.{webp,png,jpg,woff,txt}'), 'vendor/three.module.js', 'vendor/three.core.min.js', 'vendor/THREE-LICENSE.txt'];
const total = releaseFiles.reduce((sum, file) => sum + statSync(file).size, 0);
const code = ['styles.css', ...globSync('src/*.js')].reduce((sum, file) => sum + statSync(file).size, 0);
if (total > 1600000) failures.push(`payload ${total}`);
if (code > 280000) failures.push(`code ${code}`);
const serviceWorker = readFileSync('sw.js', 'utf8');
for (const file of ['index.html', 'styles.css', 'icon.svg', 'manifest.webmanifest', 'release.json', 'src/main.js', 'src/game.js', 'src/world.js', 'src/core.js', 'src/storage.js', 'src/audio.js', 'assets/textures/ground.webp', 'assets/portraits/characters.webp', 'assets/fonts/q-japanese.woff', 'assets/fonts/OFL-NotoSansJP.txt', 'vendor/three.module.js', 'vendor/three.core.min.js', 'vendor/THREE-LICENSE.txt']) {
  if (!serviceWorker.includes(`./${file}`)) failures.push(`cache missing ${file}`);
}

if (failures.length) {
  for (const failure of failures) console.error('FAIL', failure);
  process.exit(1);
}
console.log(`Validation passed: ${required.length} required files, ${total} release bytes, ${code} JS+CSS bytes, offline-local runtime, exact Three.js license metadata.`);
