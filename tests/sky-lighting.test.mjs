import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import * as T from 'three';
import {HDRLoader} from 'three/addons/loaders/HDRLoader.js';
import {prepareSkyEnvironment,skyDirection,skyDayState,SKY_YAW,SKY_SOURCE_SUN,SKY_WORLD_SUN,SKY_GROUND} from '../src/sky-field.js';
import {createSkySourceLoader} from '../src/sky-texture-loader.js';
import {createSkyLighting} from '../src/sky-lighting.js';
import {atmosphere,skyMaterial,installSkyAtmosphere,releaseSkyAtmosphere,updateAtmosphere} from '../src/environment-atmosphere.js';
import {skyFogColor} from '../src/sky-exposure.js';
import {createScenePair} from './static-scene-fixture.mjs';
import {surfaceMaterial} from '../src/environment-materials.js';
const bytes=readFileSync(new URL('../src/assets/sky/kloofendal_48d_partly_cloudy_puresky_1k.hdr',import.meta.url));
const source=new HDRLoader().parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));
const hash=data=>createHash('sha256').update(data).digest('hex');
const luminance=(data,i)=>.2126*T.DataUtils.fromHalfFloat(data[i])+.7152*T.DataUtils.fromHalfFloat(data[i+1])+.0722*T.DataUtils.fromHalfFloat(data[i+2]);
function rendererFixture(){return {extensions:{has:name=>name==='EXT_color_buffer_float'},target:null,face:0,mip:0,xr:{enabled:true},autoClear:true,calls:[],targets:new Set(),getRenderTarget(){return this.target;},getActiveCubeFace(){return this.face;},getActiveMipmapLevel(){return this.mip;},setRenderTarget(target,face=0,mip=0){this.target=target;this.face=face;this.mip=mip;if(target)this.targets.add(target);},render(mesh){this.calls.push({width:this.target.viewport.z,height:this.target.viewport.w,samples:mesh.material.defines?.GGX_SAMPLES||0,roughness:mesh.material.uniforms.roughness?.value});}};}

test('original HDR hash, linear half data and measured solar direction match the shared level-horizon sampling',()=>{
  assert.equal(bytes.length,1435119);assert.equal(hash(bytes),'fd94c84997b8a3c353b62c2125a9b44e19509956986a126e472684432a02d798');
  assert.equal(source.width,1024);assert.equal(source.height,512);assert(source.data instanceof Uint16Array);
  let max=0,peak=0;for(let i=0;i<source.data.length;i+=4){const value=luminance(source.data,i);if(value>max){max=value;peak=i/4;}}
  assert(max>60000&&max<65000);
  const photographic=new T.Vector3(...skyDirection(peak%1024,Math.floor(peak/1024),1024,512));
  assert(photographic.dot(new T.Vector3(...SKY_SOURCE_SUN))>.99998);
  const world=photographic.clone().applyAxisAngle(new T.Vector3(0,1,0),SKY_YAW),inverse=new T.Matrix3().setFromMatrix4(new T.Matrix4().makeRotationY(SKY_YAW)).transpose();
  assert(world.dot(new T.Vector3(...SKY_WORLD_SUN))>.99998);assert(Math.abs(world.y-photographic.y)<1e-12);
  assert(world.clone().applyMatrix3(inverse).distanceTo(photographic)<1e-12);
  assert(skyMaterial().fragmentShader.includes('qHDRInverse*direction'));
});

test('IBL copy retains directional cloud radiance, removes the direct solar spike and replaces synthetic lower sky',()=>{
  const before=hash(source.data),field=prepareSkyEnvironment(source);assert.equal(hash(source.data),before);
  assert.equal(field.data.byteLength,1048576);let max=0;
  for(let i=0;i<field.data.length;i+=4)max=Math.max(max,luminance(field.data,i));assert(max<20,'the 60,000+ solar spike is absent; bright nearby clouds remain');
  const solarX=Math.floor(609/2),solarY=Math.floor(119/2);assert(luminance(field.data,(solarY*512+solarX)*4)<5,'central solar energy is replaced by surrounding sky');
  for(let y=145;y<256;y+=19)for(let x=0;x<512;x+=53)for(let c=0;c<3;c++)assert.equal(field.data[(y*512+x)*4+c],T.DataUtils.toHalfFloat(SKY_GROUND[c]));
  const x=80,y=70,weights=[0,1].map(dy=>Math.sin((.5-(y*2+dy)/512)*Math.PI)-Math.sin((.5-(y*2+dy+1)/512)*Math.PI));
  for(let c=0;c<3;c++){let sum=0;for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++)sum+=T.DataUtils.fromHalfFloat(source.data[((y*2+dy)*1024+x*2+dx)*4+c])*weights[dy];assert.equal(field.data[(y*512+x)*4+c],T.DataUtils.toHalfFloat(sum/(2*(weights[0]+weights[1]))));}
  assert(field.horizon.every(v=>v>.1&&v<2));
});

test('native Three PMREM control flow uses exactly two face128 atlases and 19 render calls; resources release once',()=>{
  const renderer=rendererFixture(),resource=createSkyLighting(renderer,source);assert.equal(renderer.calls.length,19);assert.equal(renderer.targets.size,2);
  assert.equal(renderer.calls.filter(c=>c.samples===256&&c.roughness>0).reduce((n,c)=>n+c.width*c.height*c.samples,0),10616832);
  for(const target of renderer.targets){assert.equal(target.width,384);assert.equal(target.height,512);assert.equal(target.depthBuffer,false);assert.equal(target.texture.type,T.HalfFloatType);}
  assert.equal(renderer.target,null);assert.equal(renderer.xr.enabled,true);assert.equal(renderer.autoClear,true);
  assert.equal(resource.visible.flipY,true);assert.equal(resource.visible.colorSpace,T.LinearSRGBColorSpace);assert.equal(resource.visible.generateMipmaps,false);
  assert.equal(resource.environment.mapping,T.CubeUVReflectionMapping);assert.equal(resource.budget.visibleBytes+resource.budget.environmentBytes,5767168);
  let visibleDisposed=0,outputDisposed=0;resource.visible.addEventListener('dispose',()=>visibleDisposed++);
  [...renderer.targets].find(t=>t.texture===resource.environment).addEventListener('dispose',()=>outputDisposed++);
  resource.dispose();resource.dispose();assert.equal(visibleDisposed,1);assert.equal(outputDisposed,1);
  // Native CPU control flow only: renderer double never compiles, uploads or draws.
});

test('loader failure and invalid decode retry; concurrent successful loads share CPU data, not uploaded textures',async()=>{
  let calls=0,disposed=0;const load=createSkySourceLoader('fixture',()=>({setDataType(type){assert.equal(type,T.HalfFloatType);return this;},async loadAsync(){calls++;if(calls===1)throw Error('network failure');const texture=new T.DataTexture(source.data,calls===2?2:1024,512);texture.addEventListener('dispose',()=>disposed++);return texture;}}));
  await assert.rejects(load(),/network failure/);await assert.rejects(load(),/unexpected dimensions/);
  const [a,b]=await Promise.all([load(),load()]);assert.equal(a,b);assert.equal(a.data,source.data);assert.equal(calls,3);assert.equal(disposed,2);assert(!a.isTexture);
});

test('generator exception restores public renderer state and disposes owned temporary input',()=>{
  const renderer=rendererFixture(),original=new T.WebGLRenderTarget(4,4);renderer.setRenderTarget(original,2,1);let generatorDisposed=0,inputDisposed=0;
  assert.throws(()=>createSkyLighting(renderer,source,()=>({fromEquirectangular(input){input.addEventListener('dispose',()=>inputDisposed++);renderer.xr.enabled=false;renderer.autoClear=false;renderer.setRenderTarget(null);throw Error('conversion failure');},dispose(){generatorDisposed++;}})),/conversion failure/);
  assert.equal(renderer.target,original);assert.equal(renderer.face,2);assert.equal(renderer.mip,1);assert.equal(renderer.xr.enabled,true);assert.equal(renderer.autoClear,true);assert.equal(inputDisposed,1);assert.equal(generatorDisposed,1);original.dispose();
});

test('same saved day controls photo, IBL, direct sun and foliage; active water/metal retain only native PBR reflection',()=>{
  const renderer=rendererFixture(),resource=createSkyLighting(renderer,source),view={skyLighting:resource,renderer:{toneMappingExposure:.94},scene:new T.Scene(),ambient:new T.HemisphereLight(),sun:new T.DirectionalLight(),sky:new T.Object3D(),game:{player:{x:12,y:3,z:8}}};view.scene.fog=new T.FogExp2();
  installSkyAtmosphere(resource);
  for(const day of [-.21,.04,.29,.54]){const state=skyDayState(day);updateAtmosphere(view,day,9);assert.equal(atmosphere.hdrFade.value,state.fade);assert.equal(atmosphere.day.value,state.energy);assert.equal(view.scene.environmentIntensity,.85*state.energy);assert.equal(view.sun.intensity,2.65*state.energy);assert(view.sun.position.clone().sub(view.sun.target.position).normalize().distanceTo(new T.Vector3(...SKY_WORLD_SUN))<1e-12);}
  updateAtmosphere(view,-.21,9);assert.equal(view.sun.intensity,0);assert.equal(view.scene.environmentIntensity,0);assert.equal(atmosphere.hdrFade.value,0);
  for(const kind of ['water','metal']){const material=surfaceMaterial(kind,0x777777,{unique:true}),shader={uniforms:{},vertexShader:T.ShaderLib.standard.vertexShader,fragmentShader:T.ShaderLib.standard.fragmentShader};material.onBeforeCompile(shader);assert.equal(shader.uniforms.qHDRActive,atmosphere.hdrActive);assert(shader.fragmentShader.includes('if(qHDRActive<.5)'));assert(shader.fragmentShader.includes('#include <lights_fragment_begin>'));assert(shader.fragmentShader.includes('#include <envmap_physical_pars_fragment>'));material.dispose();}
  releaseSkyAtmosphere(resource);resource.dispose();assert.equal(atmosphere.hdr.value,null);assert.equal(atmosphere.hdrActive.value,0);
});


test('fog display values match the official Three ACES shader matrix/fit across day and night radiance',()=>{
  const native=T.ShaderChunk.tonemapping_pars_fragment;
  const matrix=name=>{const body=native.match(new RegExp('const mat3 '+name+' = mat3\\(([\\s\\S]*?)\\);'))[1];return [...body.matchAll(/vec3\(([^)]+)\)/g)].map(m=>m[1].split(',').map(v=>Number(v.trim())));};
  const apply=(columns,v)=>[0,1,2].map(r=>columns.reduce((sum,column,c)=>sum+column[r]*v[c],0));
  const fitBody=native.match(/vec3 RRTAndODTFit[\s\S]*?vec3 a = v \* \( v \+ ([\d.]+) \) - ([\d.]+);[\s\S]*?vec3 b = v \* \( ([\d.]+) \* v \+ ([\d.]+) \) \+ ([\d.]+);/);
  assert(fitBody);const [,a,b,c,d,e]=fitBody.map(Number);
  for(const radiance of [[.4473476334,.4796986952,.5822112216],[.044,.07,.11],[1,2,6],[0,0,0]])for(const exposure of [.94,.5,1.3]){
    const raw=apply(matrix('ACESInputMat'),radiance.map(v=>v*exposure/.6));
    const expected=apply(matrix('ACESOutputMat'),raw.map(v=>(v*(v+a)-b)/(v*(c*v+d)+e))).map(v=>Math.min(1,Math.max(0,v)));
    const actual=skyFogColor(new T.Color().setRGB(...radiance),exposure,new T.Color()).toArray();actual.forEach((v,i)=>assert(Math.abs(v-expected[i])<1e-12));
  }
  assert(skyMaterial().fragmentShader.includes('smoothstep(0.0,.06,direction.y)'));
  assert(T.ShaderLib.standard.fragmentShader.indexOf('#include <fog_fragment>')>T.ShaderLib.standard.fragmentShader.indexOf('#include <tonemapping_fragment>'));
});

test('real SceneView retains one sky across quality switches and failed replacement, then explicitly releases it',async()=>{
  const [,view]=await createScenePair();Object.assign(view.renderer,rendererFixture());view.renderer.toneMappingExposure=.94;
  const resource=view.installSkySource(source);assert.equal(view.scene.environment,resource.environment);assert.equal(view.scene.environmentRotation.y,SKY_YAW);
  for(const quality of ['low','medium','high','low']){view.setQuality(quality);assert.equal(view.skyLighting,resource);assert.equal(view.renderer.calls.length,19);}
  assert.throws(()=>view.installSkySource(source,()=>{throw Error('retry conversion failed');}),/retry conversion failed/);
  assert.equal(view.skyLighting,resource);assert.equal(view.scene.environment,resource.environment);assert.equal(atmosphere.hdr.value,resource.visible);
  view.disposeSkyLighting();view.disposeSkyLighting();assert.equal(view.scene.environment,null);assert.equal(atmosphere.hdrActive.value,0);
});


test('explicit float/half-float support bakes once; unsupported or unknown capability keeps the analytic scene',async()=>{
  for(const extension of ['EXT_color_buffer_float','EXT_color_buffer_half_float']){
    const renderer=rendererFixture();renderer.extensions.has=name=>name===extension;
    const resource=createSkyLighting(renderer,source);assert(resource);assert.equal(renderer.calls.length,19);resource.dispose();
  }
  const [,view]=await createScenePair();Object.assign(view.renderer,rendererFixture());view.renderer.toneMappingExposure=.94;
  for(const extensions of [{has:()=>false},undefined,{has:()=>undefined}]){
    view.renderer.extensions=extensions;let generatorCalls=0;
    // Invalid source would throw if CPU preparation were reached.
    assert.equal(createSkyLighting(view.renderer,{},()=>{generatorCalls++;}),null);assert.equal(generatorCalls,0);
    assert.equal(view.installSkySource(source),null);assert.equal(view.renderer.calls.length,0);assert.equal(view.scene.environment,null);
    assert.equal(atmosphere.hdrActive.value,0);assert.equal(atmosphere.hdr.value,null);
    const state=skyDayState(view.game.day),daylight=.16+state.cycle*.84;
    assert.equal(view.sun.intensity,.2+daylight*2.65);assert.equal(view.ambient.intensity,.42+daylight*.75);
  }
});
