import {writeFileSync} from 'node:fs';
import {performance} from 'node:perf_hooks';
import {createBefore,createDetailedActor} from '../tests/fixtures/body-pose-oracle.mjs';
import {groundAt} from '../src/core.js';
const rows=[];
for(const kind of ['before','after','after','before']){
  const a=(kind==='before'?createBefore:createDetailedActor)('player',{groundHeight:groundAt});a.g.position.set(0,groundAt(0,101),101);
  const cold=performance.now();a.animate({dead:true,deathElapsed:.8},0);const firstMs=performance.now()-cold;
  for(let f=0;f<40;f++)a.animate({dead:true,deathElapsed:f/60},1/60);
  const began=performance.now();for(let f=0;f<420;f++)a.animate({dead:true,deathElapsed:(f%73)/60,weaponType:['sword','greatsword','spear'][f%3]},1/60);
  rows.push({kind,poses:420,milliseconds:performance.now()-began,firstDeathMilliseconds:firstMs,supportPoints:a.bodySupport?.samples.length||0});
}
const report={at:new Date().toISOString(),scope:'Host Node whole player animation, no other author jobs running. First death includes body and cloth cache init. External host contention, heap peaks and GPU/device costs unmeasured.',rows};
writeFileSync(new URL('../artifacts/player-support-final-cpu.json',import.meta.url),JSON.stringify(report,null,2));console.log(JSON.stringify(rows));
