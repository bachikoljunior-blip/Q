// Read-only production-source evaluation; all output is confined to this study.
// Fetch, image loading, video timers and Web Audio are explicit call-recording fixtures.
import {readFileSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root='/workspace/scratch/e72662e3b71f/Q-ps4-v33',out=new URL('.',import.meta.url);
const read=p=>readFileSync(root+'/'+p,'utf8');
const hashes={};for(const p of ['src/audio.js','src/file-audio-bank.js','src/title-cinematic.js','src/scene.js','src/vault-textures.js'])hashes[p]=createHash('sha256').update(read(p)).digest('hex');
const {build}=await import(pathToFileURL(root+'/node_modules/esbuild/lib/main.js'));
const {SoundContext}=await import(pathToFileURL(root+'/tests/soundscape-web-audio-contract.mjs'));
const bundle=await build({entryPoints:[root+'/src/audio.js'],bundle:true,format:'esm',write:false,outfile:new URL('memory-only.js',out).pathname,assetNames:'[name]',loader:{'.wav':'file','.mp3':'file','.png':'file'}});
const code=bundle.outputFiles.find(f=>f.path.endsWith('memory-only.js')).text;
const {Soundscape}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const flush=async()=>{for(let i=0;i<100;i++)await Promise.resolve();};
const requests=[],audioRows=[];globalThis.AudioContext=SoundContext;
globalThis.fetch=async url=>{requests.push(url);return{ok:true,arrayBuffer:async()=>new TextEncoder().encode(url).buffer};};
const audio=new Soundscape();audioRows.push({phase:'construct',requests:[...requests]});assert.equal(requests.length,0);
await audio.start();await flush();audioRows.push({phase:'gesture start',requests:[...requests]});assert.equal(requests.length,4);
audio.setVault('ember');await flush();audioRows.push({phase:'ember entry',requests:[...requests]});assert.equal(requests.length,5);
audio.vaultSfx('step');await flush();audioRows.push({phase:'first vault step',requests:[...requests]});assert.equal(requests.length,6);
await audio.suspend();await audio.start();await flush();audioRows.push({phase:'resume cached score/foley',requests:[...requests]});assert.equal(requests.length,6);await audio.dispose();
const titleSource=read('src/title-cinematic.js'),{mountTitleCinematic}=await import('data:text/javascript;base64,'+Buffer.from(titleSource).toString('base64'));
const fixture=read('tests/title-cinematic.test.mjs');
const boundary=new Function('mountTitleCinematic',fixture.slice(fixture.indexOf('function titleBoundary('),fixture.indexOf("\ntest('bounded title"))+';return titleBoundary;')(mountTitleCinematic);
const b=boundary({loaded:false,videoAvailable:true}),titleRows=[];
const record=phase=>titleRows.push({phase,source:b.video.src,playCalls:b.plays.length,timers:b.timers.size,releaseCalls:b.video.loads});
record('before window load');assert.equal(b.video.src,'');b.win.emit('load');record('after load before timer');assert.equal(b.video.src,'');b.timersRun();record('after 300 ms scheduling fixture');assert.equal(b.video.src,'/clip.mp4');b.api.setLaunching(true);record('launch release request');assert.equal(b.video.src,'');b.api.dispose();
for(const opts of [{saveData:true},{reduced:true}]){const q=boundary({...opts,videoAvailable:true});q.timersRun();assert.equal(q.video.src,'');q.api.dispose();}
const vaultRequests=[],unblock=[];
class TextureLoader{loadAsync(url){vaultRequests.push(url);return new Promise(resolve=>unblock.push(()=>resolve({colorSpace:null,wrapS:null,wrapT:null,repeat:{set(){}}})));}}
const vaultSource=read('src/vault-textures.js').replace(/^import.*\n/gm,'').replace('export function','function');
const loadVaultTextures=new Function('T','VAULT_TEXTURE_URLS',vaultSource+';return loadVaultTextures;')({TextureLoader,SRGBColorSpace:1,RepeatWrapping:2},Object.fromEntries(['ember','tide','gale','moss'].map(n=>[n,n+'.png'])));
let constructed=0;const sceneSource=read('src/scene.js').split('export async function createSceneView')[1].split('\nexport class SceneView')[0];
const createSceneView=new Function('loadVaultTextures','loadEnvironmentTextures','loadForestTextures','loadSkySource','loadSkinTexture','installEnvironmentTextures','installForestTextures','installSkinTexture','SceneView','return async function createSceneView'+sceneSource)(loadVaultTextures,...Array.from({length:4},()=>async()=>({})),...Array.from({length:3},()=>()=>{}),class{constructor(){constructed++;}});
const pending=createSceneView({}, {}, {});await flush();assert.equal(vaultRequests.length,4);assert.equal(constructed,0);
const sceneRows=[{phase:'all non-vault loaders resolved; vault pending',vaultRequests:[...vaultRequests],constructed}];
for(const f of unblock)f();await pending;sceneRows.push({phase:'all four vault images resolved',constructed});assert.equal(constructed,1);
for(const[p,h]of Object.entries(hashes))assert.equal(createHash('sha256').update(read(p)).digest('hex'),h,'source changed while observing '+p);
const report={boundary:'Unmodified production Soundscape bundle; production title controller; exact extracted createSceneView and vault loader functions. Media/file URLs are real, image loader return values, fetch response bodies, Web Audio and DOM/video timers are explicit fixtures. No HTTP bytes, decoding, browser, GPU, actual playback or quality claim.',hashes,audioRows,titleRows,sceneRows};
writeFileSync(new URL('phase-observation.json',out),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({audioRequests:requests,titleRows,sceneRows,sourceStable:true}));
