import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createDetailedActor} from '../../src/actor-models.js';
import {createStaffAttachment} from './attachment.mjs';
const actor=createDetailedActor('npc'),attachment=createStaffAttachment(actor);
function run(withAdapter,n){
  const start=performance.now();
  for(let i=0;i<n;i++){
    actor.time=i/60;actor.animate({moving:false},0);
    if(withAdapter&&!attachment.update().ok)throw Error('solve failed');
  }
  return (performance.now()-start)/n;
}
run(false,500);run(true,500);
const runs=[];
for(let i=0;i<8;i++){
  const first=i%2===0,x=run(first,2000),y=run(!first,2000);
  runs.push({order:first?'adapter-first':'baseline-first',baselineMsPerFrame:first?y:x,withAdapterMsPerFrame:first?x:y});
}
const median=xs=>{const a=[...xs].sort((x,y)=>x-y);return(a[3]+a[4])/2;};
const result={context:'Node CPU on this executor. No rendering/FPS/device or allocation benchmark. Alternating order; same actor/time range/idle input, 500 warmups each.',iterationsPerRun:2000,runs,
  medianBaselineMs:median(runs.map(r=>r.baselineMsPerFrame)),medianWithAdapterMs:median(runs.map(r=>r.withAdapterMsPerFrame)),capturedAt:new Date().toISOString()};
result.attachmentSha256=createHash('sha256').update(await readFile(new URL('./attachment.mjs',import.meta.url))).digest('hex');
result.medianDifferenceMs=result.medianWithAdapterMs-result.medianBaselineMs;
await writeFile(new URL('../../docs/evidence/mira-assembly-v65/staff-attachment/CPU_TIMING.json',import.meta.url),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
