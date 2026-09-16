import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const repo=resolve(process.argv[2]||'/workspace/scratch/e72662e3b71f/Q-region-stream-v35');
const output=resolve(process.argv[3]||'/workspace/scratch/e72662e3b71f/q-v35-streaming-review/integration.json');
const url=p=>pathToFileURL(resolve(repo,p)).href,load=p=>import(url(p)),data=s=>'data:text/javascript,'+encodeURIComponent(s);
const T=await load('node_modules/three/build/three.module.js');
const assetHooks=registerHooks({load(u,c,next){if(/\.(png|wav)$/.test(u))return{format:'module',source:'export default '+JSON.stringify(u),shortCircuit:true};return next(u,c);}});
const {createVaultTextureCache}=await load('src/vault-textures.js');assetHooks.deregister();
const {compileMain,createMainRuntime}=await load('tests/main-runtime-fixture.mjs');
const flush=async()=>{for(let i=0;i<35;i++)await Promise.resolve();};
let now=0,id=0;const timers=new Map(),requests=[],disposed=[];
const cache=createVaultTextureCache({now:()=>now,setTimer:(fn,delay)=>{timers.set(++id,{fn,at:now+delay});return id;},clearTimer:i=>timers.delete(i),loader:{loadAsync(path){let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});requests.push({path,resolve,reject,theme:path.match(/([^/]+)-stone/)[1]});return promise;}}});
function finish(request){const texture=new T.DataTexture(new Uint8Array(128*128*4),128,128);texture.name=request.theme;texture.addEventListener('dispose',()=>disposed.push(request.theme));request.resolve(texture);return texture;}
function advance(ms){now+=ms;for(const [i,t]of [...timers])if(t.at<=now){timers.delete(i);t.fn();}}
const f=globalThis.__qV35Review={cache,constructors:0,renders:0};
const sceneURL=url('src/scene.js')+'?independent-v35';
const renderer=data(`export * from ${JSON.stringify(url('node_modules/three/build/three.module.js'))};export class WebGLRenderer{constructor(){globalThis.__qV35Review.constructors++;this.shadowMap={};this.info={render:{calls:0,triangles:0},memory:{geometries:0,textures:0}};this.domElement={width:1280,height:720};}setPixelRatio(v){this.ratio=v;}getPixelRatio(){return this.ratio;}setSize(){}render(s,c){globalThis.__qV35Review.renders++;s.updateMatrixWorld();c.updateMatrixWorld();}}`);
const hooks=registerHooks({resolve(s,c,next){if(c.parentURL===sceneURL){if(s==='three')return{url:renderer,shortCircuit:true};if(s==='./vault-textures.js')return{url:data('export const loadVaultTextures=(...args)=>globalThis.__qV35Review.cache.load(...args);'),shortCircuit:true};for(const [file,name]of [['./environment-assets.js','loadEnvironmentTextures'],['./forest-assets.js','loadForestTextures'],['./skin-assets.js','loadSkinTexture'],['./sky-assets.js','loadSkySource']])if(s===file)return{url:data(`export const ${name}=async()=>${name==='loadSkinTexture'||name==='loadSkySource'?'null':'({})'};`),shortCircuit:true};}return next(s,c);}});
const {createSceneView}=await import(sceneURL);hooks.deregister();
Object.assign(globalThis,{innerWidth:1280,innerHeight:720,devicePixelRatio:1,addEventListener(){}});
let view;
const runtime=createMainRuntime(await compileMain(),{allowTimers:true,setupContext({context}){context.__devices.createSceneView=async(...args)=>(view=await createSceneView(...args));}});
const report={boundary:'Actual main bundle + actual async SceneView/native Three + actual vault cache. Other asset loaders, DOM, sound, timers and WebGLRenderer are explicit boundary doubles. No image decoding, GPU shader compilation, screen or device performance.',sourceHashes:Object.fromEntries(['src/main.js','src/scene.js','src/vault-scene.js','src/vault-textures.js'].map(p=>[p,createHash('sha256').update(readFileSync(resolve(repo,p))).digest('hex')])),startup:{},lifecycle:{},material:{},cache:{}};
await runtime.click('start');await flush();assert.equal(requests.length,2);assert.equal(f.constructors,0);report.startup.beforeNearResolved={requests:requests.map(r=>r.theme),constructors:f.constructors};
requests.forEach(finish);await flush();assert.equal(f.constructors,1);assert.equal(runtime.state.playing,true);
const vault=view.vaultScene;const snapshot=()=>[...vault.textureMaterials].map(([theme,m])=>({theme,map:m.map.name,version:m.version}));
report.startup.afterNearResolved=snapshot();runtime.frames(2);await flush();assert.equal(requests.length,4);assert.deepEqual(requests.slice(2).map(r=>r.theme),['gale','moss']);
// Actual to-title handler runs before another frame: main no longer calls view.update.
await runtime.click('pause-button');await runtime.click('to-title');const gen=vault.textureGeneration,prior=snapshot(),renders=f.renders;
requests.slice(2).forEach(finish);await flush();runtime.frames(3);assert.equal(runtime.state.playing,false);assert.equal(f.renders,renders);assert.equal(vault.textureGeneration,gen);assert.deepEqual(snapshot(),prior);assert.equal(Object.keys(vault.readyTextures).length,4);
report.lifecycle.title={renderCallsAdded:0,generationUnchanged:true,readyMapsHeld:4,materialUnchanged:true};
await runtime.click('continue');await flush();runtime.frames(1);await flush();assert.equal(runtime.state.playing,true);assert.equal(requests.length,4);for(const[theme,m]of vault.textureMaterials)assert.equal(m.map.name,theme);report.lifecycle.resume={requests:requests.length,allFourApplied:true};
// Real pause frame sends active=false; new game reuses the same Scene and maps.
await runtime.click('pause-button');runtime.frames(1);assert.equal(vault.textureActive,false);await runtime.click('to-title');await runtime.click('start');await runtime.click('confirm-new');await flush();runtime.frames(1);await flush();assert.equal(f.constructors,1);assert.equal(requests.length,4);assert.equal(vault.textureGame,view.game);report.lifecycle.newGame={constructors:f.constructors,requests:requests.length,allRetained:true};
// The production material hooks must remain regional after a global install.
const {installEnvironmentTextures,surfaceMaterial}=await load('src/environment-materials.js');const photo=new T.Texture({width:1024,height:1024}),normal=new T.Texture({width:1024,height:1024});installEnvironmentTextures({stone:photo,stoneNormal:normal});const world=surfaceMaterial('stone',0x633b32);assert.equal(world.map,photo);
for(const[theme,m]of vault.textureMaterials){assert.notEqual(m,world);assert.equal(m.map.name,theme);const shader={uniforms:{},vertexShader:T.ShaderLib.standard.vertexShader,fragmentShader:T.ShaderLib.standard.fragmentShader};m.onBeforeCompile(shader);assert(!shader.uniforms.qStoneNormal);assert.equal(m.userData.authoredSurface,false);assert.equal(m.userData.textureBytes,128*128*4);}
report.material={regionalMaterials:4,globalPhotoInstallCannotReplaceMaps:true,globalPhotoNormalNotUsed:true};
const beforeDispose=snapshot();vault.disposeTextureStreaming();runtime.frames(2);await flush();assert.deepEqual(snapshot(),beforeDispose);assert.equal(requests.length,4);report.lifecycle.explicitStreamingDispose={laterRequests:0,materialChanges:0,calledByMain:false};
cache.dispose();assert.equal(disposed.length,4);assert.equal(timers.size,0);report.cache={retainedThemes:4,requests:4,disposedMaps:4,pendingTimers:0};assert.deepEqual(runtime.errors,[]);report.mainErrors=[];
writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
