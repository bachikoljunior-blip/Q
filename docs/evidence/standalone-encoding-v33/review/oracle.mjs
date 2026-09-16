import assert from 'node:assert/strict';
import {readFile,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {getHeapStatistics} from 'node:v8';
import {performance} from 'node:perf_hooks';
import {createMainRuntime} from '../Q-standalone-encoding-v33/tests/main-runtime-fixture.mjs';
import {packMedia,unpackMedia,restorePackedAsset,PACKED_ALPHABET} from '../Q-standalone-encoding-v33/scripts/packed-media.mjs';
const root=new URL('../Q-standalone-encoding-v33/',import.meta.url),out=new URL('./',import.meta.url);
const hash=b=>createHash('sha256').update(b).digest('hex'),load=p=>readFile(new URL(p,root));
const read=p=>load(p).then(b=>b.toString());
const sourcePaths=['scripts/packed-media.mjs','scripts/packed-media-plugin.mjs','scripts/package.mjs','scripts/verify-artifacts.mjs','scripts/build-identity.mjs','tests/main-runtime-fixture.mjs','tests/standalone-runtime-fixture.mjs'];
const hashes=async()=>Object.fromEntries(await Promise.all(sourcePaths.map(async p=>[p,hash(await load(p))])));
const beforeHashes=await hashes();
const candidate=await read('release/Q-ash-pilgrim.html');
const baseline=execFileSync('git',['show','892f7e59f602e20da62bf1c8708e432ce1eac637:release/Q-ash-pilgrim.html'],{cwd:root,maxBuffer:32*1024*1024}).toString();
assert.equal(hash(await readFile(new URL('../Q-ps4-v31/release/Q-ash-pilgrim.html',import.meta.url))),hash(baseline));
const manifest=JSON.parse(await read('dist/.vite/manifest.json')),stage=JSON.parse(await read('artifacts/latest-site.json'));
const fingerprintPaths=['index.html','package.json','package-lock.json','vite.config.js','scripts/package.mjs','scripts/build-identity.mjs','scripts/packed-media.mjs','scripts/packed-media-plugin.mjs'];
async function walk(path){for(const entry of await readdir(new URL(path+'/',root),{withFileTypes:true})){const p=path+'/'+entry.name;if(entry.isDirectory())await walk(p);else if(entry.isFile())fingerprintPaths.push(p);}}
await walk('src');await walk('public');const fpHasher=createHash('sha256');for(const p of fingerprintPaths.sort()){const b=await load(p);fpHasher.update(p+'\0'+b.length+'\0');fpHasher.update(b);}const sourceFingerprint='sha256:'+fpHasher.digest('hex');
assert(candidate.includes(sourceFingerprint),'regenerate candidate after source change');
const entry=await read('dist/'+manifest['index.html'].file);assert(entry.includes(sourceFingerprint));assert.equal(await read(stage.root+'/dist/'+manifest['index.html'].file),entry);
const chunks=Object.values(manifest).filter(e=>e.file.endsWith('.js')).map(e=>e.file);assert.equal(chunks.length,3);assert(Buffer.byteLength(entry)<165000);assert(Buffer.byteLength(candidate)<16*1024*1024);
assert.equal(execFileSync('git',['diff','--name-only','892f7e59f602e20da62bf1c8708e432ce1eac637','--','src'],{cwd:root}).toString(),'','runtime source unexpectedly changed');
const inventory=[];
for(const [source,entry] of Object.entries(manifest).filter(([s])=>/\.(hdr|glb|png|webp|jpg|mp4|mp3|wav)$/.test(s))){
 const original=await load(source),emitted=await load('dist/'+entry.file),staged=await load(stage.root+'/dist/'+entry.file);
 assert(original.equals(emitted));assert(original.equals(staged));inventory.push({source,bytes:original.length,sha256:hash(original),buffer:original});
}
assert.equal(inventory.length,27);
const alphabet='!#$%&()*+,-./0123456789:;=?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]^_abcdefghijklmnopqrstuvwxyz{';
assert.equal(alphabet,PACKED_ALPHABET);assert.equal(new Set(alphabet).size,85);assert(!/[<>"'`\\\s]/.test(alphabet));
function independentDecode(text){
 const h=/^q85:([^:]+):(\d+):/.exec(text);assert(h);const size=Number(h[2]),payload=text.slice(h[0].length),result=Buffer.alloc(size);
 assert.equal(payload.length,Math.ceil(size/4)*5);
 for(let i=0,j=0;i<payload.length;i+=5,j+=4){let n=0n;for(const c of payload.slice(i,i+5)){const digit=alphabet.indexOf(c);assert(digit>=0);n=n*85n+BigInt(digit);}assert(n<=0xffffffffn);const b=Buffer.alloc(4);b.writeUInt32BE(Number(n));b.copy(result,j,0,Math.min(4,size-j));if(size-j<4)assert(b.subarray(size-j).every(x=>x===0));}
 return {mime:h[1],bytes:result};
}
const packed=[...candidate.matchAll(/["'](q85:[^"'\\<>`\s]*)["']/g)].map(m=>m[1]);
const candidateEmbedded=[...candidate.matchAll(/data:([^"'\s;]+);base64,([A-Za-z0-9+/=]+)/g)].map(m=>({mime:m[1],bytes:Buffer.from(m[2],'base64')}));
const baselineEmbedded=[...baseline.matchAll(/data:([^"'\s;]+);base64,([A-Za-z0-9+/=]+)/g)].map(m=>({mime:m[1],bytes:Buffer.from(m[2],'base64')}));
assert.equal(packed.length,26);assert.equal(candidateEmbedded.length,1);assert.equal(baselineEmbedded.length,27);
for(const p of packed){const decoded=independentDecode(p);const runtime=restorePackedAsset(p);assert.equal(runtime,`data:${decoded.mime};base64,${decoded.bytes.toString('base64')}`);candidateEmbedded.push(decoded);}
for(const a of inventory){const old=baselineEmbedded.filter(e=>hash(e.bytes)===a.sha256),now=candidateEmbedded.filter(e=>hash(e.bytes)===a.sha256);assert.equal(old.length,1,a.source);assert.equal(now.length,1,a.source);assert.equal(now[0].mime,old[0].mime);a.mime=now[0].mime;}
assert.equal((candidate.match(/<script>/gi)||[]).length,1);assert.equal((candidate.match(/<\/script\s*>/gi)||[]).length,1);
assert(!/<script[^>]+src=|<link[^>]+(?:stylesheet|manifest)/i.test(candidate));
assert.equal(candidate.match(/<style>([\s\S]*?)<\/style>/)[1],baseline.match(/<style>([\s\S]*?)<\/style>/)[1]);
assert(candidate.includes('three.js')&&candidate.includes('MIT'));
const script=candidate.match(/<script>([\s\S]*?)<\/script>/i)[1];assert.equal((script.match(/new Int16Array\(128\)\.fill\(-1\)/g)||[]).length,1);assert.equal(script.split('Invalid packed media header').length-1,1);assert(!/<\/script/i.test(script));assert(!script.includes('/workspace/scratch/'));
const bad=[];
for(const s of ['q85:text/plain:1:!!!!','q85:text/plain:1:!!!!!!','q85:text/plain:4:!!!!~','q85:text/plain:4:!!!!é','q85:text/plain:4:{{{{{','q85:text/plain:1:!!!!#','q85:text/plain:2:!!!!#','q85:text/plain:3:!!!!#','q85:text/plain:01:!!!!!','q85:text/plain:9007199254740993:','q85:text/plain:4294967296:','q85:text/plain</script>:0:']){assert.throws(()=>unpackMedia(s));assert.throws(()=>restorePackedAsset(s));bad.push(s);}
for(const n of [0,1,2,3,4,5,65535,65536,65537]){const b=Buffer.alloc(n);for(let i=0;i<n;i++)b[i]=(i*113+253)&255;assert(independentDecode(packMedia(b,'application/octet-stream')).bytes.equals(b));assert.equal(restorePackedAsset(packMedia(b,'application/octet-stream')),`data:application/octet-stream;base64,${b.toString('base64')}`);}
const markup=await read('index.html');
async function lifecycle(html,label){
 const code=html.match(/<script>([\s\S]*?)<\/script>/i)[1];let phase='title',ctx,timers=[],requests=[],allocations=[],consoleErrors=[],videoEvents=[];
 const heapStart=getHeapStatistics().used_heap_size,start=performance.now();
 const runtime=createMainRuntime({code,html:markup},{allowTimers:true,setupContext({context,document,window}){
  ctx=context;window.navigator={...context.navigator};document.defaultView=window;document.readyState='complete';window.devicePixelRatio=1;
  let timerId=0;window.setTimeout=(f)=>{timers.push({id:++timerId,f});return timerId;};window.clearTimeout=id=>{timers=timers.filter(t=>t.id!==id);};window.cancelAnimationFrame=()=>{};
  window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
  const video=document.getElementById('title-video');video.paused=true;
  let videoURL='';Object.defineProperty(video,'src',{get:()=>videoURL,set:url=>{videoURL=url;video.setAttribute('src',url);requests.push({phase,kind:'video',sha256:hash(Buffer.from(url.split(',')[1],'base64')),dataURL:url.startsWith('data:')});}});
  video.play=()=>{video.paused=false;videoEvents.push({phase,type:'play'});return Promise.resolve();};video.pause=()=>{video.paused=true;videoEvents.push({phase,type:'pause'});};video.load=()=>{};
  Object.getPrototypeOf(video).getContext=()=>null;
  document.createElementNS=(_ns,tag)=>{assert.equal(tag,'img');const el=document.createElement(tag);Object.defineProperty(el,'src',{set:url=>{assert(url.startsWith('data:'));requests.push({phase,kind:'image',sha256:hash(Buffer.from(url.split(',')[1],'base64')),dataURL:true});queueMicrotask(()=>el.emit('error',{message:'Independent explicit unavailable image decoder'}));}});return el;};
  context.Uint8Array=new Proxy(Uint8Array,{construct(target,args){const b=Reflect.construct(target,args);if(args.length===1&&typeof args[0]==='number'&&inventory.some(a=>a.bytes===args[0]))allocations.push({phase,bytes:args[0],view:b});return b;}});
  context.Request=Request;context.fetch=async req=>{const url=typeof req==='string'?req:req.url;assert(url.startsWith('data:'));requests.push({phase,kind:'fetch',sha256:hash(Buffer.from(url.split(',')[1],'base64')),dataURL:true});throw Error('Independent explicit unavailable HDR decode');};
  context.console={error:e=>consoleErrors.push(String(e?.message||e)),warn(){},log(){}};
 }});
 const snapshot=()=>({state:runtime.state,startDisabled:runtime.element('start').disabled,titleHidden:runtime.element('title-screen').classList.contains('hidden'),panelHidden:runtime.element('panel-backdrop').classList.contains('hidden'),busy:runtime.element('title-screen').getAttribute('aria-busy'),videoPaused:runtime.element('title-video').paused,allocationCount:allocations.length,heapUsed:getHeapStatistics().used_heap_size});
 await runtime.flush();const titleMs=performance.now()-start;const title=snapshot();
 for(const t of timers.splice(0))t.f();await runtime.flush();assert.equal(runtime.element('title-video').paused,false);
 phase='hidden';runtime.document.hidden=true;await runtime.document.emit('visibilitychange');await runtime.flush();assert.equal(runtime.element('title-video').paused,true);runtime.document.hidden=false;await runtime.document.emit('visibilitychange');for(const t of timers.splice(0))t.f();await runtime.flush();assert.equal(runtime.element('title-video').paused,false);
 const states={title};const launchStart=performance.now();
 for(const p of ['launch','retry']){phase=p;await runtime.click('start');for(let i=0;i<10;i++)await runtime.flush();states[p]=snapshot();assert.equal(runtime.state.playing,false);assert.equal(runtime.element('start').disabled,false);assert.equal(runtime.element('title-screen').classList.contains('hidden'),false);}
 const launchAndRetryMs=performance.now()-launchStart;
 phase='settings';await runtime.click('title-settings');states.settings=snapshot();assert.equal(states.settings.panelHidden,false);await runtime.click('close-panel');assert.equal(runtime.element('panel-backdrop').classList.contains('hidden'),true);
 const observations=allocations.map(({view,...a})=>({...a,sha256:hash(view)}));
 for(const a of observations)assert(inventory.some(i=>i.sha256===a.sha256),'actual decoder output differs');
 for(const r of requests)assert(inventory.some(i=>i.sha256===r.sha256),'actual consumer URL differs');
 return {label,scriptSHA256:hash(code),states,titleMs,launchAndRetryMs,heapStart,heapEnd:getHeapStatistics().used_heap_size,allocations:observations,requests,videoEvents,consoleErrors};
}
const runs=[];for(let i=0;i<2;i++){runs.push(await lifecycle(baseline,'baseline-'+i));runs.push(await lifecycle(candidate,'candidate-'+i));}
for(let i=0;i<runs.length;i+=2){const a=runs[i],b=runs[i+1];for(const k of ['title','launch','retry','settings']){const strip=({allocationCount,heapUsed,...s})=>s;assert.deepEqual(JSON.parse(JSON.stringify(strip(a.states[k]))),JSON.parse(JSON.stringify(strip(b.states[k]))));}assert.deepEqual(a.requests,b.requests);assert.equal(b.allocations.filter(a=>a.phase==='title').length,19);assert.equal(b.allocations.filter(a=>a.phase==='launch').length,7);assert.equal(b.allocations.filter(a=>a.phase==='retry').length,0);assert.equal(new Set(b.allocations.map(a=>a.sha256)).size,26);}
const afterHashes=await hashes();assert.deepEqual(afterHashes,beforeHashes,'audited source moved');
const report={at:new Date().toISOString(),base:'892f7e59f602e20da62bf1c8708e432ce1eac637',sourceHashes:afterHashes,sourceFingerprint,entryBytes:Buffer.byteLength(entry),chunks,html:{baselineBytes:Buffer.byteLength(baseline),candidateBytes:Buffer.byteLength(candidate),baselineSHA256:hash(baseline),candidateSHA256:hash(candidate),savedBytes:Buffer.byteLength(baseline)-Buffer.byteLength(candidate)},stage,inventory:inventory.map(({buffer,...a})=>a),badVectors:bad,runs,boundary:'Actual emitted scripts unmodified in explicit Node DOM/device fixture. V8 post-phase heap and host timings only; no browser/render/image/audio/HDR codec/GPU/device peak. Boot failures expected at unavailable decoder. No successful gameplay/restart asserted.'};
await writeFile(new URL('report.json',out),JSON.stringify(report,null,2));console.log(JSON.stringify({html:report.html,runs:runs.map(({label,titleMs,launchAndRetryMs,allocations})=>({label,titleMs,launchAndRetryMs,allocations:allocations.length})),result:'PASS'}));
