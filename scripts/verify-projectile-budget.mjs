import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {registerHooks} from 'node:module';
import {fileURLToPath} from 'node:url';
import {Game} from '../src/core.js';
const sha=s=>createHash('sha256').update(s).digest('hex');
async function variant(name,sources){
 const urls=Object.fromEntries(Object.keys(sources).map(p=>[new URL('../'+p,import.meta.url).href+'?budget-'+name,p]));
 const hook=registerHooks({resolve(s,c,next){if(urls[c.parentURL]&&s.startsWith('.')){const url=new URL(s,c.parentURL).href.split('?')[0]+'?budget-'+name;if(urls[url])return{url,shortCircuit:true};}return next(s,c);},load(u,c,next){if(urls[u]){let source=sources[urls[u]];if(urls[u]==='src/core.js')source=source.replace('export function groundAt(x,z){','export function groundAt(x,z){globalThis.__qProjectileTerrainReads++;');return{format:'module',source,shortCircuit:true};}return next(u,c);}});
 try{return{...await import(Object.keys(urls).find(u=>u.includes('/core.js?'))),...await import(Object.keys(urls).find(u=>u.includes('/combat-presentation.js?')))};}finally{hook.deregister();}
}
function run(api){
 const game=new api.Game();game.enemies.forEach(e=>e.dead=true);game.obstacles=[];Object.assign(game.player,{x:0,z:86,y:api.groundAt(0,86)});const p=game.player,requests=Array.from({length:48},(_,i)=>({arrow:{id:i,owner:'attacker',x:p.x+(i%3-1)*.15,y:p.y+1,z:p.z+5+i*.03,vx:0,vy:0,vz:-20,life:2,damage:20},horizon:1.8})),metrics={};
 const snapshot=JSON.stringify(game.serialize());globalThis.__qProjectileTerrainReads=0;const hits=api.forecastProjectileContacts(game,requests,{metrics}),actualTerrainReads=globalThis.__qProjectileTerrainReads;assert.equal(JSON.stringify(game.serialize()),snapshot);
 const sequential=[],sequentialMetrics={exactFrames:0,terrainSamples:0};globalThis.__qProjectileTerrainReads=0;
 for(const {arrow,horizon}of requests){const a={...arrow};let elapsed=0,hit=null;while(elapsed+1e-9<horizon){const dt=Math.min(1/60,horizon-elapsed);if(a.life-dt<=0)break;sequentialMetrics.exactFrames++;const c=game.projectileContact(a,dt,sequentialMetrics);if(c.target){hit={target:c.target,timeToImpact:elapsed+c.fraction*dt};break;}Object.assign(a,c.to);a.life-=dt;elapsed+=dt;}sequential.push(hit);}
 const sequentialTerrainReads=globalThis.__qProjectileTerrainReads;assert.deepEqual(hits,sequential);
 return {metrics,actualTerrainReads,sequentialTerrainReads,sequentialMetrics,contacts:hits.map(h=>h?{target:h.target===p?'player':h.target,time:h.timeToImpact}:null)};
}
export async function inspectProjectileBudget(){
 const fixture=JSON.parse(readFileSync(new URL('../docs/evidence/projectile-extent-v33/baseline-sources.json',import.meta.url)));for(const [p,s]of Object.entries(fixture.sources))assert.equal(sha(s),fixture.hashes[p]);
 const current=Object.fromEntries(Object.keys(fixture.sources).map(p=>[p,readFileSync(new URL('../'+p,import.meta.url),'utf8')]));const mutant={...current,'src/core.js':current['src/core.js'].replace(/reuse=old&&[^;]+;/,'reuse=false;')};assert.notEqual(mutant['src/core.js'],current['src/core.js']);
 try{const baseline=run(await variant('baseline',fixture.sources)),candidate=run(await variant('candidate',current)),fullSpan=run(await variant('full-span',mutant));assert.equal(baseline.actualTerrainReads,1618);assert.equal(baseline.metrics.terrainSamples,1474);assert.equal(candidate.actualTerrainReads,candidate.metrics.terrainSamples);assert.equal(candidate.actualTerrainReads,candidate.sequentialTerrainReads);assert(candidate.actualTerrainReads<=baseline.actualTerrainReads);assert.equal(candidate.metrics.exactFrames,48);assert.equal(candidate.metrics.bodySweeps,48);assert.equal(candidate.metrics.fallbackFrames,0);assert(fullSpan.actualTerrainReads>baseline.actualTerrainReads);return {base:fixture.base,sourceHashes:Object.fromEntries(Object.entries(current).map(([p,s])=>[p,sha(s)])),instrumentation:'The exact same source-injected counter at groundAt entry counts all calls, including inside exact live contact. No runtime file is modified. The mutant disables only reuse of already checked terrain spans.',baseline,candidate,fullSpan};}finally{delete globalThis.__qProjectileTerrainReads;}
}
if(process.argv[1]===fileURLToPath(import.meta.url)){const r=await inspectProjectileBudget();if(process.argv[2])writeFileSync(process.argv[2],JSON.stringify(r,null,2)+'\n');console.log(JSON.stringify({baseline:r.baseline.actualTerrainReads,candidate:r.candidate.actualTerrainReads,fullSpanRejected:r.fullSpan.actualTerrainReads,exactFrames:r.candidate.metrics.exactFrames}));}
