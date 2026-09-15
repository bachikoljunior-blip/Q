import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { registerHooks } from 'node:module';
import * as T from 'three';
import { surfaceMaterial, surfaceTexture, installEnvironmentTextures } from '../src/environment-materials.js';
import { atmosphere, skyMaterial } from '../src/environment-atmosphere.js';
import { bakeGroundContact, groundContactTexture } from '../src/environment-contact.js';

const manifest=JSON.parse(readFileSync(new URL('../src/assets/environment/provenance.json',import.meta.url)));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
function shaderFor(material){const shader={uniforms:{},vertexShader:T.ShaderLib.standard.vertexShader,fragmentShader:T.ShaderLib.standard.fragmentShader};material.onBeforeCompile(shader);return shader;}

test('distributed CC0 texture bytes match the immutable source hashes and bounded three-map payload',()=>{
  let total=0;
  for(const entry of manifest.assets){const bytes=readFileSync(new URL('../'+entry.path,import.meta.url));assert.equal(hash(bytes),entry.sha256);assert.equal(bytes.length,entry.bytes);assert.deepEqual(entry.dimensions,[1024,1024]);assert.equal(entry.license,'CC0-1.0');assert(bytes[0]===255&&bytes[1]===216,'original JPEG signature');total+=bytes.length;}
  assert.equal(total,3403723);assert.equal(manifest.assets.length,3);assert.equal(manifest.textureBudget.rgba8WithFullMipBytes,16777212);
});

test('real async environment loader disposes partial failures, retries, then shares albedo and linear normal uploads',async()=>{
  const hooks=registerHooks({resolve(specifier,context,next){if(specifier.endsWith('.jpg'))return{url:'data:text/javascript,export default '+encodeURIComponent(JSON.stringify(specifier)),shortCircuit:true};return next(specifier,context);}});
  let loadEnvironmentTextures;
  try{({loadEnvironmentTextures}=await import('../src/environment-assets.js'));}finally{hooks.deregister();}
  let calls=0,disposed=0;const loader={async loadAsync(url){calls++;if(calls===2)throw new Error('missing packaged stone');const texture=new T.Texture();texture.addEventListener('dispose',()=>disposed++);return texture;}};
  await assert.rejects(loadEnvironmentTextures(loader),/missing packaged stone/);assert.equal(calls,3);assert.equal(disposed,2);
  const textures=await loadEnvironmentTextures(loader);assert.equal(calls,6);assert.equal(textures.earth.colorSpace,T.SRGBColorSpace);assert.equal(textures.stone.colorSpace,T.SRGBColorSpace);assert.equal(textures.stoneNormal.colorSpace,T.NoColorSpace);assert.equal(textures.stoneNormal.wrapS,T.RepeatWrapping);assert.equal(await loadEnvironmentTextures(loader),textures);assert.equal(calls,6);
});

test('sourced normal path is distinct from vault overrides and plaster; installing maps updates existing material consumers',()=>{
  const oldStone=surfaceMaterial('stone',0x8e9384),explicit=new T.Texture(),vault=surfaceMaterial('stone',0x633b32,{map:explicit}),plaster=surfaceMaterial('stone',0xb9ad93,{finish:'plaster'});
  const maps={earth:new T.Texture(),stone:new T.Texture(),stoneNormal:new T.Texture()};installEnvironmentTextures(maps);
  assert.equal(oldStone.map,maps.stone);assert.equal(vault.map,explicit);assert.equal(plaster.map,surfaceTexture('stone'));
  const stoneShader=shaderFor(oldStone),vaultShader=shaderFor(vault),plasterShader=shaderFor(plaster);
  assert.equal(stoneShader.uniforms.qStoneNormal.value,maps.stoneNormal);assert.equal(vaultShader.uniforms.qStoneNormal,undefined);assert.equal(plasterShader.uniforms.qStoneNormal,undefined);
  assert.notEqual(oldStone.customProgramCacheKey(),vault.customProgramCacheKey());assert.notEqual(oldStone.customProgramCacheKey(),plaster.customProgramCacheKey());
  assert.equal((stoneShader.fragmentShader.match(/texture2D\(qStoneNormal,/g)||[]).length,3);
  assert(stoneShader.fragmentShader.indexOf('vec3 qP=')<stoneShader.fragmentShader.indexOf('texture2D(qStoneNormal,'));
  assert(stoneShader.vertexShader.includes('dot(instanceMatrix[0].xyz,instanceMatrix[0].xyz)'),'inverse scale is required for instanced normals');
  const ground=shaderFor(surfaceMaterial('earth',0xffffff,{groundContact:true}));assert.equal(ground.uniforms.qGroundContact.value,groundContactTexture);assert.equal(ground.uniforms.qSkyHorizon,atmosphere.horizon);
});

test('ground-contact bake is deterministic, read-only, bounded and excludes the movable gate',()=>{
  const obstacles=[{type:'tree',x:0,z:0,r:.3},{type:'house',x:8,z:10,r:2},{type:'salt-gate',x:70,z:70,r:7}];const before=JSON.stringify(obstacles);
  bakeGroundContact(obstacles);const first=groundContactTexture.image.data.slice();assert.equal(first.length,512*512);assert.equal(JSON.stringify(obstacles),before);assert(first.some(v=>v<245));assert(first.every(v=>v>=176));
  bakeGroundContact([]);assert(groundContactTexture.image.data.every(v=>v===255));bakeGroundContact(obstacles);assert.deepEqual(groundContactTexture.image.data,first);
  bakeGroundContact([obstacles[2]]);assert(groundContactTexture.image.data.every(v=>v===255));
});

test('sky, water and metal share lighting direction while material shaders retain Three light and fog stages',()=>{
  const sky=skyMaterial();assert.equal(sky.uniforms.qSunDirection,atmosphere.sun);assert(sky.fragmentShader.includes('#include <tonemapping_fragment>'));assert(sky.fragmentShader.includes('#include <colorspace_fragment>'));
  for(const kind of ['water','metal','leaf']){const shader=shaderFor(surfaceMaterial(kind,0x777777,{unique:true,flow:kind==='water'?{value:2}:null}));assert.equal(shader.uniforms.qSunDirection,atmosphere.sun);assert(shader.fragmentShader.includes('#include <lights_fragment_begin>'));assert(shader.fragmentShader.includes('#include <fog_fragment>'));if(kind==='water'){assert(shader.fragmentShader.includes('qFresnel=.02+.98*pow'));assert(shader.fragmentShader.includes('inverseTransformDirection(normal,viewMatrix)'));}}
  // Source integration and Node/Three object tests; no GLSL compilation or pixels.
});

// Evaluate only the production qBump arithmetic, without pretending to compile
// GLSL. The independent expected U/V directions come from finite differences of
// the actual ALBEDO UV projection, not a duplicate of the normal swizzle table.
function normalBasisFailures(fragment){
  const axes=['x','y','z'],projections={};
  for(const match of fragment.matchAll(/texture2D\(map,qP\.([xyz]{2})\)\*qBlend\.([xyz])/g))projections[match[2]]=match[1];
  const sampledUVs={};for(const match of fragment.matchAll(/qN([xyz])=texture2D\(qStoneNormal,qP\.([xyz]{2})\)/g))sampledUVs[match[1]]=match[2];
  assert.deepEqual(sampledUVs,projections,'normal samples must use the corresponding albedo coordinates');
  const expression=fragment.match(/vec3 qBump=([^;]+);/)?.[1];assert(expression,'production perturbation expression');
  const terms=[...expression.matchAll(/vec3\(([^)]+)\)\*qBlend\.([xyz])/g)];assert.equal(terms.length,3);
  const failures=[];
  for(const axis of axes)for(const sign of [-1,1])for(const [label,sample]of [['neutral',[0,0,1]],['U',[.6,0,.8]],['V',[0,.6,.8]]]){
    const normal=axes.map(a=>a===axis?sign:0),origin=[2,3,5],uv=point=>[...projections[axis]].map(a=>point[axes.indexOf(a)]),start=uv(origin);
    const derivatives=axes.map((a,i)=>{const p=origin.slice();p[i]+=.001;return uv(p).map((v,j)=>(v-start[j])/.001);});
    const expected=derivatives.map(([du,dv])=>du*sample[0]+dv*sample[1]);
    const value=component=>component.split('*').reduce((product,raw)=>{
      const token=raw.trim(),number=Number(token);if(Number.isFinite(number))return product*number;
      const match=token.match(/^(-?)(?:qN[xyz]\.([xyz])|qSign\.([xyz]))$/);assert(match,`unsupported scalar expression ${token}`);
      return product*(match[1]?-1:1)*(match[2]?sample[axes.indexOf(match[2])]:normal[axes.indexOf(match[3])]);
    },1);
    const actual=[0,0,0];for(const [,components,weight]of terms)if(weight===axis)components.split(',').forEach((component,i)=>actual[i]+=value(component));
    if(actual.some((v,i)=>Math.abs(v-expected[i])>1e-9))failures.push(`${sign>0?'+':'-'}${axis}/${label}`);
    // A neutral sampled normal must leave the original signed normal intact.
    if(label==='neutral')assert.deepEqual(normal.map((v,i)=>v+actual[i]*.56),normal);
  }
  return failures;
}

test('normal neutral/U/V tilts follow albedo UV derivatives on all six signed projection axes',()=>{
  installEnvironmentTextures({stone:new T.Texture(),stoneNormal:new T.Texture()});
  const fragment=shaderFor(surfaceMaterial('stone',0x999999,{unique:true})).fragmentShader;
  assert.deepEqual(normalBasisFailures(fragment),[],'18 neutral/U/V cases must match the photographed albedo coordinates');
  const originalDefect=fragment.replace(/vec3 qBump=[^;]+;/,'vec3 qBump=vec3(0,qNx.x,qNx.y*qSign.x)*qBlend.x+vec3(qNy.x,0,-qNy.y*qSign.y)*qBlend.y+vec3(qNz.x,qNz.y*qSign.z,0)*qBlend.z;');
  assert.deepEqual(normalBasisFailures(originalDefect),['-x/V','+y/V','-z/V'],'the regression must reject the independently reported previous basis');
});
