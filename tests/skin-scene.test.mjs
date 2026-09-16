// Actual asynchronous SceneView entrypoint; browser image decode, other asset
// loaders and renderer are explicit doubles. No drawing or GPU verification.
import test from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import * as T from 'three';
import {Game} from '../src/core.js';
import {createSkinTextureCache} from '../src/skin-texture-loader.js';
import {installSkinTexture} from '../src/skin-materials.js';

test('real scene waits for skin, rejects failed decode, installs before actor construction and shares every quality',async()=>{
  const sceneURL=new URL('../src/scene.js',import.meta.url).href;
  let calls=0,resolve,reject;
  const cache=createSkinTextureCache('fixture',{loadAsync:()=>{calls++;return new Promise((a,b)=>{resolve=a;reject=b;});}});
  globalThis.__skinSceneFixture={renderers:0,load:()=>cache.load()};
  const data=source=>'data:text/javascript,'+encodeURIComponent(source);
  const renderer=data(`export * from ${JSON.stringify(import.meta.resolve('three'))};export class WebGLRenderer{constructor(){globalThis.__skinSceneFixture.renderers++;this.shadowMap={};}setPixelRatio(){}setSize(){}}`);
  const hooks=registerHooks({resolve(specifier,context,next){if(context.parentURL===sceneURL){
    if(specifier==='three')return {url:renderer,shortCircuit:true};
    const stubs={'./vault-textures.js':['loadVaultTextures','{}'],'./environment-assets.js':['loadEnvironmentTextures','{}'],'./forest-assets.js':['loadForestTextures','{}'],'./sky-assets.js':['loadSkySource','null']};
    if(stubs[specifier]){const [name,value]=stubs[specifier];return {url:data(`export function ${name}(){return Promise.resolve(${value});}`),shortCircuit:true};}
    if(specifier==='./skin-assets.js')return {url:data('export function loadSkinTexture(){return globalThis.__skinSceneFixture.load();}'),shortCircuit:true};
  }return next(specifier,context);}});
  let createSceneView;try{({createSceneView}=await import(sceneURL));}finally{hooks.deregister();}
  Object.assign(globalThis,{innerWidth:1280,innerHeight:720,devicePixelRatio:1,addEventListener(){}});
  installSkinTexture(null);
  const failed=createSceneView({},new Game(),{quality:'high'});await Promise.resolve();assert.equal(globalThis.__skinSceneFixture.renderers,0);reject(Error('decode failed'));await assert.rejects(failed,/decode failed/);assert.equal(globalThis.__skinSceneFixture.renderers,0);
  const pending=createSceneView({},new Game(),{quality:'high'});await Promise.resolve();assert.equal(globalThis.__skinSceneFixture.renderers,0);
  const texture=new T.Texture({width:2048,height:2048});resolve(texture);const view=await pending;
  let smithFace;for(const actor of view.residentModels.values())if(actor.type==='smith')actor.g.traverse(n=>{if(n.material?.name==='Q anatomical face')smithFace=n;});
  assert(smithFace);assert.equal(smithFace.material.map,texture);assert.equal(globalThis.__skinSceneFixture.renderers,1);
  for(const quality of ['low','medium','high']){view.setQuality(quality);assert.equal(smithFace.material.map,texture);assert.equal(await cache.load(),texture);}
  assert.equal(calls,2);installSkinTexture(null);cache.dispose();delete globalThis.__skinSceneFixture;
});
