// Read-only HDR source/native-control-flow oracle. No GPU context, upload, GLSL compile, pixels or FPS.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {createRequire,registerHooks} from 'node:module';
const repo=path.resolve(process.argv[2]||'.'),reportPath=path.resolve(process.argv[3]||'sky-audit-report.json');
const require=createRequire(path.join(repo,'package.json'));
const moduleURL=relative=>pathToFileURL(path.join(repo,relative)).href;
const threeURL=pathToFileURL(path.join(path.dirname(require.resolve('three')),'three.module.js')).href;
const T=await import(threeURL);
const {HDRLoader}=await import(require.resolve('three/addons/loaders/HDRLoader.js'));
const {WebGLMaterials}=await import(moduleURL('node_modules/three/src/renderers/webgl/WebGLMaterials.js'));
const fieldModule=await import(moduleURL('src/sky-field.js'));
const {prepareSkyEnvironment,SKY_SOURCE_SUN,SKY_WORLD_SUN,SKY_YAW,skyDayState}=fieldModule;
const {createSkyLighting}=await import(moduleURL('src/sky-lighting.js'));
const {atmosphere,installSkyAtmosphere,releaseSkyAtmosphere,updateAtmosphere}=await import(moduleURL('src/environment-atmosphere.js'));
const {createSkySourceLoader}=await import(moduleURL('src/sky-texture-loader.js'));
const hash=data=>createHash('sha256').update(data).digest('hex');
const files=['src/sky-field.js','src/sky-texture-loader.js','src/sky-lighting.js','src/sky-assets.js','src/sky-exposure.js','src/assets/sky/THREE-LICENSE.txt','src/environment-atmosphere.js','src/environment-materials.js','src/scene.js','vite.config.js','scripts/package.mjs','node_modules/three/src/extras/PMREMGenerator.js','node_modules/three/src/renderers/webgl/WebGLMaterials.js','node_modules/three/src/renderers/shaders/ShaderChunk/tonemapping_pars_fragment.glsl.js'];
const hashes=Object.fromEntries(files.map(f=>[f,hash(fs.readFileSync(path.join(repo,f)))]));
const bytes=fs.readFileSync(path.join(repo,'src/assets/sky/kloofendal_48d_partly_cloudy_puresky_1k.hdr'));
const parseStart=performance.now(),source=new HDRLoader().setDataType(T.HalfFloatType).parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));
const parseMs=performance.now()-parseStart,sourceHash=hash(source.data),prepareStart=performance.now(),field=prepareSkyEnvironment(source),prepareMs=performance.now()-prepareStart;
assert.equal(hash(source.data),sourceHash,'IBL preparation must not change visible source');
assert.equal(source.flipY,true);assert.equal(source.colorSpace,T.LinearSRGBColorSpace);
let peak=0,peakIndex=0,iblPeak=0,solarCorePeak=0,invalid=0;
const luminance=(data,i)=>.2126*T.DataUtils.fromHalfFloat(data[i])+.7152*T.DataUtils.fromHalfFloat(data[i+1])+.0722*T.DataUtils.fromHalfFloat(data[i+2]);
for(let i=0;i<source.data.length;i+=4){const n=luminance(source.data,i);if(n>peak){peak=n;peakIndex=i/4;}}
for(let i=0;i<field.data.length;i+=4){const lum=luminance(field.data,i);iblPeak=Math.max(iblPeak,lum);const x=(i/4)%512,y=Math.floor((i/4)/512),lon=((x+.5)/512-.5)*2*Math.PI,lat=(.5-(y+.5)/256)*Math.PI,dot=Math.cos(lat)*Math.cos(lon)*SKY_SOURCE_SUN[0]+Math.sin(lat)*SKY_SOURCE_SUN[1]+Math.cos(lat)*Math.sin(lon)*SKY_SOURCE_SUN[2];if(dot>Math.cos(1.75*Math.PI/180))solarCorePeak=Math.max(solarCorePeak,lum);for(let c=0;c<3;c++)if(!Number.isFinite(T.DataUtils.fromHalfFloat(field.data[i+c])))invalid++;}
assert.equal(invalid,0);assert(solarCorePeak<6,'direct solar core must be replaced by nearby cloud fill');
const px=peakIndex%1024,py=Math.floor(peakIndex/1024),longitude=((px+.5)/1024-.5)*2*Math.PI,latitude=(.5-(py+.5)/512)*Math.PI;
const measuredSun=new T.Vector3(Math.cos(latitude)*Math.cos(longitude),Math.sin(latitude),Math.cos(latitude)*Math.sin(longitude));
assert(measuredSun.dot(new T.Vector3(...SKY_SOURCE_SUN))>.99998);
class RendererBoundary{
 constructor(){const cap=globalThis.__qSkyAuditCapability||'float';this.extensions=cap==='undefined'?undefined:{has:name=>cap==='float'?name==='EXT_color_buffer_float':cap==='half'?name==='EXT_color_buffer_half_float':false};this.target=null;this.face=0;this.mip=0;this.xr={enabled:true};this.autoClear=true;this.shadowMap={};this.outputColorSpace=T.SRGBColorSpace;this.toneMappingExposure=.94;this.nativeCalls=0;this.seen=new Map();this.failAt=0;this.disposals=0;globalThis.__qSkyAuditConstructed=(globalThis.__qSkyAuditConstructed||0)+1;}
 getRenderTarget(){return this.target;}getActiveCubeFace(){return this.face;}getActiveMipmapLevel(){return this.mip;}
 setRenderTarget(t,f=0,m=0){this.target=t;this.face=f;this.mip=m;if(t&&!this.seen.has(t)){const stat={disposed:0};this.seen.set(t,stat);t.addEventListener('dispose',()=>stat.disposed++);}}
 setPixelRatio(){}setSize(){}dispose(){this.disposals++;}
 render(object,camera){if(object.isScene){object.updateMatrixWorld();camera?.updateMatrixWorld();return;}if(++this.nativeCalls===this.failAt)throw Error('audit native render fault '+this.failAt);}
}
const successRenderer=new RendererBoundary(),resource=createSkyLighting(successRenderer,source);
assert.equal(successRenderer.nativeCalls,19);assert.equal(successRenderer.seen.size,2);assert.equal(resource.visible.image.data,source.data);assert.equal(resource.visible.flipY,true);assert.equal(resource.visible.type,T.HalfFloatType);assert.equal(resource.visible.colorSpace,T.LinearSRGBColorSpace);assert.equal(resource.environment.mapping,T.CubeUVReflectionMapping);
const nativeUniforms=T.UniformsUtils.clone(T.ShaderLib.standard.uniforms),nativeMaterial=new T.MeshStandardMaterial();
WebGLMaterials(successRenderer,{get:()=>({envMap:resource.environment,envMapRotation:new T.Euler(0,SKY_YAW,0)})}).refreshMaterialUniforms(nativeUniforms,nativeMaterial,1,720,null);
const worldSun=new T.Vector3(...SKY_WORLD_SUN),backToSource=worldSun.clone().applyMatrix3(nativeUniforms.envMapRotation.value),rotationError=backToSource.distanceTo(new T.Vector3(...SKY_SOURCE_SUN));
assert(rotationError<1e-12);assert(nativeUniforms.envMapRotation.value.equals(atmosphere.hdrInverse.value));nativeMaterial.dispose();
const faultCases=[];
for(const failAt of[1,3,19]){
 const r=new RendererBoundary(),original=new T.WebGLRenderTarget(4,4);r.setRenderTarget(original,2,1);r.failAt=failAt;
 assert.throws(()=>createSkyLighting(r,source),/audit native render fault/);
 const targets=[...r.seen].filter(([t])=>t!==original).map(([t,s])=>({width:t.width,height:t.height,disposed:s.disposed}));
 faultCases.push({failAt,rendererRestored:r.target===original&&r.face===2&&r.mip===1&&r.xr.enabled===true&&r.autoClear===true,targets,allObservedTemporaryTargetsDisposed:targets.every(t=>t.disposed>=1)});
 for(const[t,s]of r.seen)if(t!==original&&!s.disposed)t.dispose();original.dispose();
}
const capabilitySamples=[];
for(const capability of['float','half','none','undefined']){
 globalThis.__qSkyAuditCapability=capability;const r=new RendererBoundary();const supported=capability==='float'||capability==='half';const result=createSkyLighting(r,supported?source:null);
 assert.equal(!!result,supported);assert.equal(r.nativeCalls,supported?19:0);assert.equal(r.seen.size,supported?2:0);result?.dispose();capabilitySamples.push({capability,supported,nativeCalls:r.nativeCalls,targets:r.seen.size,unsupportedSkipsSourcePreparation:!supported});
}
delete globalThis.__qSkyAuditCapability;
// Exact CPU translation of the installed Three ACESFilmicToneMapping (no rendered pixel claim).
const mul=(m,v)=>[0,1,2].map(i=>m[i*3]*v[0]+m[i*3+1]*v[1]+m[i*3+2]*v[2]);
const aces=(c,exposure)=>{let v=mul([.59719,.35458,.04823,.076,.90834,.01566,.0284,.13383,.83777],c.map(x=>x*exposure/.6));v=v.map(x=>(x*(x+.0245786)-.000090537)/(x*(.983729*x+.432951)+.238081));return mul([1.60475,-.53108,-.07367,-.10208,1.10813,-.00605,-.00327,-.07276,1.07602],v).map(x=>Math.max(0,Math.min(1,x)));};
const srgb=c=>{const out=new T.Color();new T.Color().setRGB(...c).getRGB(out,T.SRGBColorSpace);return out.toArray();};
const view={skyLighting:resource,scene:new T.Scene(),ambient:new T.HemisphereLight(),sun:new T.DirectionalLight(),sky:new T.Object3D(),game:{player:{x:10,y:2,z:80}},renderer:successRenderer};
view.scene.fog=new T.FogExp2();installSkyAtmosphere(resource);
const fogSamples=[];
for(const day of[-.21,.04,.29,.54]){
 updateAtmosphere(view,day,0);const state=skyDayState(day);assert.equal(view.scene.environmentIntensity,.85*state.energy);assert.equal(view.sun.intensity,2.65*state.energy);
 const uniforms={fogColor:{value:new T.Color()},fogDensity:{value:0}};
 WebGLMaterials(successRenderer,{}).refreshFogUniforms(uniforms,view.scene.fog);
 const actual=uniforms.fogColor.value.toArray(),expected=srgb(aces(atmosphere.horizon.value.toArray(),successRenderer.toneMappingExposure));
 fogSamples.push({day,cycle:state.cycle,hemisphereIntensity:view.ambient.intensity,environmentIntensity:view.scene.environmentIntensity,sunIntensity:view.sun.intensity,rawHorizon:atmosphere.horizon.value.toArray(),nativeFogSRGB:actual,expectedLowerSkySRGB:expected,maxSRGBGap:Math.max(...actual.map((x,i)=>Math.abs(x-expected[i])))});
}
releaseSkyAtmosphere(resource);let visibleDisposed=0;resource.visible.addEventListener('dispose',()=>visibleDisposed++);resource.dispose();resource.dispose();assert.equal(visibleDisposed,1);
let calls=0,decoderDisposals=0;
const load=createSkySourceLoader('audit:hdr',()=>({setDataType(){return this;},async loadAsync(){calls++;if(calls===1)throw Error('network');const texture=new T.DataTexture(source.data,calls===2?2:1024,512);texture.addEventListener('dispose',()=>decoderDisposals++);return texture;}}));
await assert.rejects(load(),/network/);await assert.rejects(load(),/unexpected dimensions/);const[a,b]=await Promise.all([load(),load()]);assert.equal(a,b);assert.equal(a.data,source.data);assert.equal(calls,3);assert.equal(decoderDisposals,2);
// Actual async SceneView constructor/install, with explicit asset-loader/renderer boundaries.
globalThis.__qSkyAuditRenderer=RendererBoundary;let resolveSky;
globalThis.__qSkyAuditPromise=new Promise(resolve=>{resolveSky=resolve;});
const sceneURL=moduleURL('src/scene.js'),rendererModule='data:text/javascript,'+encodeURIComponent('export * from '+JSON.stringify(threeURL)+'; export class WebGLRenderer extends globalThis.__qSkyAuditRenderer {}');
const emptyStub='data:text/javascript,'+encodeURIComponent('export function loadVaultTextures(){return Promise.resolve({})} export function loadEnvironmentTextures(){return Promise.resolve({})} export function loadForestTextures(){return Promise.resolve({})}');
const skyStub='data:text/javascript,'+encodeURIComponent('export function loadSkySource(){return globalThis.__qSkyAuditPromise}');
const hooks=registerHooks({resolve(specifier,context,next){if(context.parentURL===sceneURL){if(specifier==='three')return{url:rendererModule,shortCircuit:true};if(specifier==='./sky-assets.js')return{url:skyStub,shortCircuit:true};if(['./vault-textures.js','./environment-assets.js','./forest-assets.js'].includes(specifier))return{url:emptyStub,shortCircuit:true};}return next(specifier,context);}});
let createSceneView;try{({createSceneView}=await import(sceneURL));}finally{hooks.deregister();}
const {Game}=await import(moduleURL('src/core.js'));
Object.assign(globalThis,{innerWidth:1280,innerHeight:720,devicePixelRatio:1,addEventListener(){}});
const constructorsBefore=globalThis.__qSkyAuditConstructed,livePromise=createSceneView({},new Game(),{quality:'high'});
await new Promise(resolve=>setImmediate(resolve));assert.equal(globalThis.__qSkyAuditConstructed,constructorsBefore,'Scene constructor must await sky source');
resolveSky(source);const live=await livePromise;assert.equal(live.skyLighting.visible.image.data,source.data);assert.equal(live.scene.environment,live.skyLighting.environment);assert.equal(atmosphere.hdr.value,live.skyLighting.visible);assert.equal(live.scene.environmentRotation.y,SKY_YAW);
const environment=live.scene.environment,visible=live.skyLighting.visible,callsAfterInstall=live.renderer.nativeCalls;
for(const quality of['low','medium','high']){live.setQuality(quality);live.game.day=.29;live.update(1/60,true);assert.equal(live.scene.environment,environment);assert.equal(atmosphere.hdr.value,visible);assert.equal(live.renderer.nativeCalls,callsAfterInstall);}
live.disposeSkyLighting();assert.equal(live.scene.environment,null);assert.equal(atmosphere.hdr.value,null);assert.equal(atmosphere.hdrActive.value,0);
for(const capability of['half','none','undefined']){
 globalThis.__qSkyAuditCapability=capability;const alternative=await createSceneView({},new Game(),{quality:'high'}),supported=capability==='half';alternative.update(1/60,true);
 assert.equal(!!alternative.skyLighting,supported);assert.equal(!!alternative.scene.environment,supported);assert.equal(alternative.renderer.nativeCalls,supported?19:0);assert.equal(atmosphere.hdrActive.value,supported?1:0);
 assert(Number.isFinite(alternative.sun.intensity));capabilitySamples.find(c=>c.capability===capability).actualSceneBoot=true;alternative.disposeSkyLighting();
}
capabilitySamples.find(c=>c.capability==='float').actualSceneBoot=true;delete globalThis.__qSkyAuditCapability;
const failures=[];
for(const c of faultCases)if(!c.rendererRestored)failures.push('PMREM exception changed renderer state at pass '+c.failAt);
const limitations=faultCases.filter(c=>!c.allObservedTemporaryTargetsDisposed).map(c=>'Native PMREM output has no explicit dispose after exception at pass '+c.failAt+'; public API does not return that target. Actual GPU reclamation is unmeasured; not a permanent leak claim.');
if(fogSamples.some(s=>s.maxSRGBGap>1/255))failures.push('Fog bypasses sky ACES transform: lower-horizon mismatch exceeds 1/255');
const changedDuringRun=files.filter(f=>hash(fs.readFileSync(path.join(repo,f)))!==hashes[f]);
const report={checkedAt:new Date().toISOString(),repo,boundary:'Real HDR parsing, CPU radiance processing, native Three PMREM and material-uniform control flow, actual SceneView async install. Renderer/other asset loaders explicitly doubled: no GPU uploads, GLSL compilation, pixels, browser or FPS.',sourceHashes:hashes,changedDuringRun,source:{bytes:bytes.length,sha256:hash(bytes),width:source.width,height:source.height,decodedBytes:source.data.byteLength,parseMs,sourceUnmodified:hash(source.data)===sourceHash,peakLuminance:peak,peakPixel:[px,py]},field:{width:field.width,height:field.height,bytes:field.data.byteLength,prepareMs,peakLuminance:iblPeak,solarCorePeak,horizon:field.horizon,sunFill:field.sunFill,rotationError},pmrem:{nativeCalls:successRenderer.nativeCalls,budget:resource.budget,faultCases,capabilitySamples},fogSamples,loader:{calls,decoderDisposals,concurrentSharedCPUData:a===b},scene:{awaitedSkyBeforeConstruction:true,installedActualSource:true,qualitySwitches:3,pmremBakesAcrossQualitySwitches:1,releaseClearedEnvironment:true},failures,limitations};
fs.mkdirSync(path.dirname(reportPath),{recursive:true});fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({reportPath,failures,changedDuringRun,field:report.field,scene:report.scene},null,2));if(failures.length||changedDuringRun.length)process.exitCode=1;
