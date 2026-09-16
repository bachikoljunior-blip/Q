// Actual production classes and encoded bytes; explicit native API doubles.
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import assert from 'node:assert/strict';
import {SoundContext,OfflineSoundContext} from '../tests/soundscape-web-audio-contract.mjs';
const root=new URL('../',import.meta.url).pathname;
const out=pathToFileURL(resolve(process.argv[2]||root+'artifacts/native-audio-recovery-v52')+'/');await fs.mkdir(out,{recursive:true});
const frozen=root+'docs/evidence/native-audio-recovery-v52/source-before/';
const hashes=JSON.parse(await fs.readFile(frozen+'HASHES.json','utf8'));
const sha=b=>createHash('sha256').update(b).digest('hex');
for(const [path,h]of Object.entries(hashes.files))assert.equal(sha(await fs.readFile(frozen+path)),h.sha256,'frozen source '+path);
const old=JSON.parse(await fs.readFile(frozen+'src/assets/soundscape/provenance.json','utf8'));
const oldVault=JSON.parse(await fs.readFile(frozen+'src/assets/vaults/provenance.json','utf8'));
const signals=JSON.parse(await fs.readFile(new URL('signals.json',out),'utf8'));
const flush=async()=>{for(let i=0;i<100;i++)await Promise.resolve();},bytes=b=>b?b.length*b.numberOfChannels*4:0;
async function moduleFor(before,mutate){
 const b=await build({entryPoints:[root+'src/audio.js'],bundle:true,format:'esm',write:false,outfile:'ownership.js',assetNames:'[name]',loader:{'.wav':'file','.mp3':'file','.png':'file'},plugins:[{name:'frozen-before',setup(builder){builder.onLoad({filter:/\/(audio|file-audio-bank)\.js$/},async({path})=>{
 let code=await fs.readFile(before?frozen+'src/'+path.split('/').at(-1):path,'utf8');if(mutate&&path.endsWith('/file-audio-bank.js'))code=mutate(code);return{contents:code,loader:'js',resolveDir:root+'src'};
 });}}]});
 return(await import('data:text/javascript;base64,'+Buffer.from(b.outputFiles.find(f=>f.path.endsWith('ownership.js')).text).toString('base64'))).Soundscape;
}
async function run({before=false,rate=48000,offline=true,mutate}={}){
 const Soundscape=await moduleFor(before,mutate),d=structuredClone(signals.fileDescriptors),payloads=new Map();
 if(before)for(const a of old.assets)d[a.file]={rate:a.sampleRate,channels:a.channels,seconds:a.durationSeconds};
 for(const [name,desc]of Object.entries(d)){
 const path='src/assets/'+(name.startsWith('pilgrim-')?'soundscape':'vaults')+'/'+name,data=await fs.readFile(before&&hashes.files[path]?frozen+path:root+path);
 desc.hash=sha(data);payloads.set(name,data);if(before)assert.equal(desc.hash,[...old.assets,...oldVault.assets].find(a=>a.file===name)?.sha256,'unchanged old bytes '+name);
 }
 const decodes=[],fetches=[];
 async function decode(data,c,where){const entry=Object.entries(d).find(([,v])=>v.hash===sha(new Uint8Array(data)));assert(entry,'actual encoded input');const[name,v]=entry;decodes.push({name,where,rate:c.sampleRate,inputBytes:data.byteLength,float32Bytes:Math.round(v.seconds*c.sampleRate)*v.channels*4});return c.createBuffer(v.channels,Math.round(v.seconds*c.sampleRate),c.sampleRate);}
 class Live extends SoundContext{constructor(options){super();this.requested=options??null;this.sampleRate=options?.sampleRate??rate;}decodeAudioData(data){return decode(data,this,'live');}}
 class Offline extends OfflineSoundContext{decodeAudioData(data){return decode(data,this,'offline');}}
 globalThis.AudioContext=Live;globalThis.OfflineAudioContext=offline?Offline:undefined;
 globalThis.fetch=async url=>{const name=url.split('/').at(-1),p=payloads.get(name);assert(p);fetches.push(name);return{ok:true,arrayBuffer:async()=>p.buffer.slice(p.byteOffset,p.byteOffset+p.byteLength)};};
 const a=new Soundscape();await a.start();await flush();
 function snapshot(label){
 const scores=new Set(a.scoreBuffers?.values()||[]),cache=new Set(a.assetBuffers.values()),active=new Set([...a.voices].map(v=>v.source?.buffer).filter(Boolean)),generated=new Set([a.noiseBuffer,a.reverb?.buffer,a.fallbackBuffer].filter(Boolean)),sum=s=>[...s].reduce((n,b)=>n+bytes(b),0);
 return{label,scoreKeys:[...a.scoreBuffers?.keys()||[]],cacheKeys:[...a.assetBuffers.keys()],pendingKeys:[...a.assetPending.keys()],voices:a.voices.size,scoreRates:[...a.score.values()].map(v=>v.source.buffer.sampleRate),scoreBankBytes:sum(scores),fxOrLegacyCacheBytes:sum(cache),activeUniqueBytes:sum(active),generatedBytes:sum(generated),uniqueAccountedBytes:sum(new Set([...scores,...cache,...active,...generated])),scoreAlsoInFx:[...scores].some(b=>cache.has(b)),sameScoreObjects:[...a.score].every(([key,v])=>!a.scoreBuffers||v.source.buffer===a.scoreBuffers.get('score:'+key))};
 }
 try{
 const shots=[snapshot('gesture')];if(!before){assert.equal(a.scoreBuffers.size,3,'fixed three slots');assert(!shots[0].scoreAlsoInFx);assert(shots[0].sameScoreObjects);if(offline)assert.deepEqual(shots[0].scoreRates,[44100,22050,44100],'source rates');}
 for(const name of payloads.keys())if(!name.startsWith('pilgrim-'))await a.loadAsset('audit:'+name,'./'+name);
 shots.push(snapshot('all 14 files'));const count=fetches.length;a.ctx.currentTime=11.25;await a.suspend();shots.push(snapshot('suspend'));await a.start();await flush();assert.equal(fetches.length,count);shots.push(snapshot('resume'));
 await a.dispose();shots.push(snapshot('dispose'));assert.equal(a.voices.size,0);return{before,rate,offline,requestedContext:a.ctx.requested,fetches,decodes,snapshots:shots};
 }finally{await a.dispose();}
}
const saved={AudioContext:globalThis.AudioContext,OfflineAudioContext:globalThis.OfflineAudioContext,fetch:globalThis.fetch};
try{
 const cases=[await run({before:true}),await run(),await run({rate:96000}),await run({offline:false}),await run({rate:96000,offline:false})],negativeControls=[];
 for(const[name,mutate]of [['force 22050 score',s=>s.replace('pinned ? SCORE_SAMPLE_RATES[key] : 22050','22050')],['mix score into FX FIFO',s=>s.replace('const pinned = !!host.scoreBuffers && Object.hasOwn(SCORE_SAMPLE_RATES, key);','const pinned = false;')]]){
 let reason;try{await run({mutate});}catch(e){reason=e.message;}assert(reason,'negative survived '+name);negativeControls.push({name,rejected:true,reason});}
 const report={passed:true,base:hashes.base,boundary:'Production Soundscape/functions and actual source bytes; Web Audio/fetch are explicit doubles. Logical unique Float32 payload, not device heap/native decoder CPU, native-node acquired copies or listening.',cases,negativeControls};
 await fs.writeFile(new URL('ownership.json',out),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:true,cases:cases.length,negativeControls}));
}finally{Object.assign(globalThis,saved);}
