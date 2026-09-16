import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {runStandalone} from '../../../tests/standalone-runtime-fixture.mjs';

const baselinePath=process.argv[2];if(!baselinePath)throw Error('Pass unchanged baseline HTML path');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const baseline=await readFile(baselinePath,'utf8'),candidate=await readFile('release/Q-ash-pilgrim.html','utf8'),markup=await readFile('index.html','utf8');
const manifest=JSON.parse(await readFile('dist/.vite/manifest.json','utf8'));
const media=await Promise.all(Object.keys(manifest).filter(path=>/\.(hdr|glb|png|webp|jpg|mp4|mp3|wav)$/.test(path)).map(async source=>{const bytes=await readFile(source);return {source,bytes:bytes.length,sha256:hash(bytes)};}));
const runs=[];
for(const name of ['baseline','candidate','candidate','baseline']){
  global.gc?.();
  runs.push({name,...await runStandalone(name==='baseline'?baseline:candidate,markup,media)});
}
const result={recordedAt:new Date().toISOString(),node:process.version,baselinePath,baselineBytes:Buffer.byteLength(baseline),baselineSHA256:hash(baseline),candidateBytes:Buffer.byteLength(candidate),candidateSHA256:hash(candidate),media,runs,method:'Same exact Node DOM fixture and unchanged emitted script. Alternating two runs per version; explicit GC immediately before each trial outside timed phases. Title includes VM parse, DOM fixture construction, IIFE initialization and asset restoration; launch includes module initialization and explicit image/HDR decoder failure. V8 snapshots are process-wide used_heap_size at phase boundaries, not peak heap, device RAM or media/GPU memory; both input HTML strings remain resident. Observer and fixture allocations are included. OS RSS unavailable: process.memoryUsage() reported ENOENT uv_resident_set_memory; no alternate /proc access attempted.'};
await writeFile('docs/evidence/standalone-encoding-v33/runtime.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({baselineBytes:result.baselineBytes,candidateBytes:result.candidateBytes,candidateSHA256:result.candidateSHA256,runs:runs.map(run=>({name:run.name,titleHostMs:run.titleHostMs,launchHostMs:run.launchHostMs,heapStart:run.memoryStart.used_heap_size,heapAfterTitle:run.memoryAfterTitle.used_heap_size,heapEnd:run.memoryEnd.used_heap_size,titleAllocations:run.titleAllocations,launchAllocations:run.allocations.length-run.titleAllocations}))},null,2));
