import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {SoundContext, OfflineSoundContext} from './soundscape-web-audio-contract.mjs';
import {loadFileAudio} from '../src/file-audio-bank.js';
const built=await build({entryPoints:[new URL('../src/audio.js',import.meta.url).pathname],bundle:true,format:'esm',write:false,outfile:'native-audio-test.js',assetNames:'[name]',loader:{'.wav':'file','.mp3':'file','.png':'file'}});
const {Soundscape}=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles.find(f=>f.path.endsWith('.js')).text).toString('base64'));
const flush=async()=>{for(let i=0;i<100;i++)await Promise.resolve();};
const original={AudioContext:globalThis.AudioContext,OfflineAudioContext:globalThis.OfflineAudioContext,fetch:globalThis.fetch};
function install(Offline=OfflineSoundContext){
 const reads=[];globalThis.AudioContext=SoundContext;globalThis.OfflineAudioContext=Offline;
 globalThis.fetch=async url=>{reads.push(url);return {ok:true,arrayBuffer:async()=>new TextEncoder().encode(url).buffer};};return reads;
}
function restore(){Object.assign(globalThis,original);SoundContext.sampleRate=48000;}
function host(context=new SoundContext()){return {ctx:context,scoreBuffers:new Map(),assetDecoders:new Map(),assetBuffers:new Map(),assetPending:new Map(),maxDecodedBytes:24*1024*1024};}
const bytes=b=>b.length*b.numberOfChannels*4;

test('native output shares three source-rate score buffers outside FX FIFO and preserves phase and mix',async()=>{
 const reads=install();const a=new Soundscape();try{
 assert(await a.start());await flush();assert.equal(a.ctx.sampleRate,48000);assert.equal(a.scoreBuffers.size,3);
 assert.deepEqual([...a.scoreBuffers.values()].map(b=>b.sampleRate),[44100,22050,44100]);assert.equal([...a.scoreBuffers.values()].reduce((n,b)=>n+bytes(b),0),38102400);
 for(const [key,node]of a.score){assert.equal(node.source.buffer,a.scoreBuffers.get('score:'+key));assert(!a.assetBuffers.has('score:'+key));}
 assert.equal(new Set([...a.score.values()].map(n=>n.source.started[0][0])).size,1);
 a.setMode('exploration');assert.equal(a.score.get('pulse').gain.gain.target,0);assert.equal(a.score.size,3);
 a.ctx.currentTime=11.25;await a.suspend();assert.equal(a.voices.size,0);const n=reads.length;
 await a.start();await flush();assert.equal(reads.length,n);for(const node of a.score.values())assert(Math.abs(node.source.started[0][1]-11.215)<1e-6);
 await a.dispose();assert.equal(a.scoreBuffers.size,0);assert.equal(a.assetDecoders.size,0);assert.equal(a.reverb.buffer,null);
 }finally{await a.dispose();restore();}
});

test('unavailable Offline decoder falls back to device rates without application decimation',async()=>{
 install(null);try{for(const rate of [44100,48000,96000]){SoundContext.sampleRate=rate;const h=host();const b=await loadFileAudio(h,'score:harmony','/pilgrim-harmony.mp3');assert.equal(b.sampleRate,rate);assert.equal(h.scoreBuffers.get('score:harmony'),b);assert.equal(h.assetBuffers.size,0);}}finally{restore();}
});

test('detached failing Offline input preserves original bytes and deduplicates pending decode',async()=>{
 let release,live=0,off=0;class Broken extends OfflineSoundContext{decodeAudioData(data){off++;structuredClone(data,{transfer:[data]});return new Promise((_,reject)=>release=()=>reject(Error('codec')));}}
 const reads=install(Broken);const h=host(),decode=h.ctx.decodeAudioData.bind(h.ctx);h.ctx.decodeAudioData=data=>{live++;assert.equal(new TextDecoder().decode(data),'/pilgrim-harmony.mp3');return decode(data);};
 try{const a=loadFileAudio(h,'score:harmony','/pilgrim-harmony.mp3'),b=loadFileAudio(h,'score:harmony','/pilgrim-harmony.mp3');await flush();assert.equal(off,1);release();assert.equal(await a,await b);assert.equal(live,1);assert.equal(reads.length,1);}finally{restore();}
});

test('constructor rejection and changed contexts cannot refill stale cache',async()=>{
 class Broken{constructor(){throw Error('unsupported rate');}}install(Broken);try{const h=host();assert.equal((await loadFileAudio(h,'score:harmony','/pilgrim-harmony.mp3')).sampleRate,48000);
 let finish;h.ctx.decodeAudioData=()=>new Promise(resolve=>finish=resolve);const pending=loadFileAudio(h,'score:pulse','/pilgrim-pulse.mp3');await flush();const old=h.ctx;h.ctx=new SoundContext();finish(old.createBuffer(2,48000,48000));assert.equal(await pending,null);assert(!h.scoreBuffers.has('score:pulse'));}finally{restore();}
});

test('pause/resume while score decoding shares loads and never starts old generations',async()=>{
 let release;class Slow extends OfflineSoundContext{decodeAudioData(data){if(new TextDecoder().decode(data).includes('harmony'))return new Promise(resolve=>release=async()=>resolve(await super.decodeAudioData(data)));return super.decodeAudioData(data);}}
 const reads=install(Slow),a=new Soundscape();try{await a.start();await flush();await a.suspend();await a.start();await flush();await release();await flush();assert.equal(a.score.size,3);assert.equal(a.voices.size,6);assert.equal(reads.filter(x=>x.includes('harmony')).length,1);}finally{await a.dispose();restore();}
});

test('late failed Offline completion after dispose cannot native-decode or repopulate',async()=>{
 let fail;class Slow extends OfflineSoundContext{decodeAudioData(){return new Promise((_,reject)=>fail=()=>reject(Error('late')));}}install(Slow);const h=host();let native=0;h.ctx.decodeAudioData=()=>{native++;throw Error('stale native call');};try{const p=loadFileAudio(h,'score:harmony','/pilgrim-harmony.mp3');await flush();h.disposed=true;h.assetDecoders.clear();fail();assert.equal(await p,null);assert.equal(native,0);assert.equal(h.scoreBuffers.size,0);assert.equal(h.assetDecoders.size,0);}finally{restore();}
});

test('dispose rejects restart before native suspend resolves and releases active references',async()=>{
 install();const a=new Soundscape();try{await a.start();await flush();const sources=[...a.voices].map(n=>n.source);let done;a.ctx.suspend=()=>new Promise(resolve=>done=resolve);const stopping=a.dispose();assert.equal(a.disposed,true);assert.equal(await a.start(),false);assert.equal(a.voices.size,0);done();await stopping;assert.equal(a.score.size,0);assert(sources.every(s=>s.buffer===null));assert.equal(a.ctx.state,'closed');a.ctx.suspend=async()=>{};}finally{await a.dispose();restore();}
});
