import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {relative} from 'node:path';
import {createHash} from 'node:crypto';
import {transform} from 'esbuild';
import {buildStandalone} from '../scripts/package-standalone.mjs';
import {unpackMedia,restorePackedAsset} from '../scripts/packed-media.mjs';
import {runStandalone} from './standalone-runtime-fixture.mjs';

// Build the actual production packager in memory: no stale checked-in release
// and no prerequisite generated Vite manifest or modified output files.
const candidate=await buildStandalone();
const media=await Promise.all(candidate.mediaSources.map(async path=>{
  const bytes=await readFile(path);
  return {source:relative(process.cwd(),path.startsWith('/')?path:process.cwd()+'/'+path),bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),data:bytes};
}));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');

test('actual standalone preserves every emitted media byte and original data URL MIME',async()=>{
  const packed=[...candidate.html.matchAll(/["'](q85:[^"'\\<>`\s]*)["']/g)].map(match=>match[1]);
  const raw=[...candidate.html.matchAll(/data:[^"'\s;]+;base64,([A-Za-z0-9+/=]+)/g)].map(match=>Buffer.from(match[1],'base64'));
  assert.equal(media.length,27);assert.equal(packed.length,26);assert.equal(raw.length,1);
  const embedded=[...raw,...packed.map(text=>Buffer.from(unpackMedia(text).bytes))];
  for(const asset of media)assert.equal(embedded.filter(bytes=>bytes.equals(asset.data)).length,1,asset.source);
  for(const text of packed){
    const decoded=unpackMedia(text),asset=media.find(asset=>asset.sha256===hash(decoded.bytes));assert(asset);
    const original=await transform(asset.data,{loader:'dataurl',sourcefile:asset.source,format:'esm'});
    const dataURL=/["'](data:[^"']+)["']/.exec(original.code)[1];
    assert.equal(restorePackedAsset(text),dataURL,asset.source);
  }
  assert.equal((candidate.html.match(/<script>/gi)||[]).length,1);
  assert.equal((candidate.html.match(/<\/script>/gi)||[]).length,1);
  assert.equal(candidate.stats.htmlBytes,Buffer.byteLength(candidate.html));
  // A syntactically valid byte mutation cannot pass the source identity oracle.
  const corrupt=Buffer.from(embedded[0]);corrupt[0]^=1;
  assert(!media.some(asset=>asset.sha256===hash(corrupt)));
});

test('actual packaged title defers world media until launch and returns after explicit decoder failure',{timeout:15000},async()=>{
  const runtime=await runStandalone(candidate.html,await readFile('index.html','utf8'),media);
  assert.equal(runtime.titleAllocations,19);assert.equal(runtime.allocations.length,26);
  const world=runtime.allocations.filter(asset=>asset.phase==='launch');assert.equal(world.length,7);
  assert(world.every(asset=>asset.candidateSources.length===1));
  assert(runtime.allocations.filter(asset=>asset.phase==='title').every(asset=>asset.candidateSources.every(source=>!world.some(item=>item.candidateSources.includes(source)))));
  assert(runtime.requests.length>0);assert(runtime.requests.every(request=>request.phase==='launch'&&request.dataURL));
  assert.equal(runtime.titleState.playing,false);assert.equal(runtime.finalState.playing,false);
  assert.equal(runtime.finalState.paused,runtime.titleState.paused);
});
