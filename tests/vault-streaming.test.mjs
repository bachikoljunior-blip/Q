import test from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import {readFileSync} from 'node:fs';
import * as T from 'three';
import {Game,groundAt} from '../src/core.js';
import {VAULT_SLICES} from '../src/vault-slices.js';
import {VaultScene} from '../src/vault-scene.js';
import {surfaceMaterial} from '../src/environment-materials.js';

// Real cache/control-flow and native geometry/materials. Images, timers and
// renderer boundary are explicit doubles, never network/GPU/visual evidence.
const hooks=registerHooks({load(url,context,next){if(/\.(png|wav)$/.test(url))return{format:'module',source:'export default '+JSON.stringify(url),shortCircuit:true};return next(url,context);}});
const {createVaultTextureCache,vaultTextureThemes}=await import('../src/vault-textures.js');hooks.deregister();
const flush=async()=>{for(let i=0;i<15;i++)await Promise.resolve();};
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return{promise,resolve,reject};};
function boundary(){
  let now=0,nextId=0;const calls=[],timers=new Map();
  const loader={loadAsync(url){const d=deferred();calls.push({...d,url,theme:url.match(/([^/]+)-stone/)[1]});return d.promise;}};
  const cache=createVaultTextureCache({loader,now:()=>now,setTimer:(fn,delay)=>{timers.set(++nextId,{fn,at:now+delay});return nextId;},clearTimer:id=>timers.delete(id)});
  return{cache,calls,timers,advance(ms){now+=ms;for(const[id,t]of [...timers])if(t.at<=now){timers.delete(id);t.fn();}},resolve(call){const texture=new T.Texture({width:128,height:128});call.resolve(texture);return texture;}};
}
test('actual new-game and saved region selection, outside and invalid coordinates',()=>{
  const game=new Game();assert.deepEqual([game.player.x,game.player.z],[0,101]);
  assert.deepEqual(vaultTextureThemes(game.player),['ember','tide']);assert.equal(vaultTextureThemes(game.player,120).length,4);
  for(const slice of VAULT_SLICES){const source=new Game();Object.assign(source.player,slice.center,{y:groundAt(slice.center.x,slice.center.z)});const restored=new Game(source.serialize());assert(vaultTextureThemes(restored.player).includes(slice.theme));}
  assert.deepEqual(vaultTextureThemes({x:0,z:-250}),[]);assert.deepEqual(vaultTextureThemes({x:NaN,z:0}),[]);
});
test('per-theme single request, partial failure isolation, bounded retry, retained maps and disposal',async()=>{
  const b=boundary(),p=new Game().player,a=b.cache.load(p),duplicate=b.cache.load(p);await flush();assert.equal(b.calls.length,2);
  const first=b.resolve(b.calls[0]);b.calls[1].reject(Error('offline'));const maps=await a;assert.equal((await duplicate).ember,first);assert.deepEqual(Object.keys(maps),['ember']);assert.equal(b.timers.size,0);
  for(let i=0;i<300;i++)await b.cache.load(p);assert.equal(b.calls.length,2);b.advance(4000);
  const retry=b.cache.load(p);await flush();assert.equal(b.calls.length,3);const second=b.resolve(b.calls[2]);assert.equal((await retry).tide,second);
  const far=b.cache.load(p,120);await flush();assert.equal(b.calls.length,5);for(const c of b.calls.slice(3))b.resolve(c);assert.equal(Object.keys(await far).length,4);
  await b.cache.load({x:0,z:-250});await b.cache.load(p);assert.equal(b.calls.length,5,'retreat/re-entry use four retained maps');
  let disposed=0;for(const t of Object.values(await b.cache.load(p)))t.addEventListener('dispose',()=>disposed++);b.cache.dispose();assert.equal(disposed,4);assert.deepEqual(await b.cache.load(p),{});
});
test('deadline releases startup and a hung image retains one request slot; late textures are released',async()=>{
  const b=boundary(),p=new Game().player,pending=b.cache.load(p);await flush();const first=b.resolve(b.calls[0]);await flush();b.advance(8000);assert.equal((await pending).ember,first);
  b.advance(60000);for(let i=0;i<100;i++)await b.cache.load(p);assert.equal(b.calls.length,2,'uncancellable hung image must not stack requests');
  let released=0;const late=new T.Texture({width:128,height:128});late.addEventListener('dispose',()=>released++);b.calls[1].resolve(late);await flush();assert.equal(released,1);
  const retry=b.cache.load(p);await flush();assert.equal(b.calls.length,3);b.cache.dispose();assert.deepEqual(await retry,{});assert.equal(b.timers.size,0);const later=b.resolve(b.calls[2]);later.addEventListener('dispose',()=>released++);await flush();assert.equal(released,2);
});
test('real async factory starts without unselected media; old all-four factory is blocked/rejected',async()=>{
  const source=readFileSync(new URL('../src/scene.js',import.meta.url),'utf8');
  const factory=loader=>new Function('loadVaultTextures','loadEnvironmentTextures','loadForestTextures','loadSkySource','loadSkinTexture','installEnvironmentTextures','installForestTextures','installSkinTexture','SceneView','return async function createSceneView'+source.split('export async function createSceneView')[1].split('\nexport class SceneView')[0])(loader,...Array.from({length:4},()=>async()=>({})),...Array.from({length:3},()=>()=>{}),class{constructor(){this.ready=true;}});
  const b=boundary();let settled=false;const promise=factory(b.cache.load)({},new Game(),{}).then(v=>{settled=true;return v;});await flush();assert.equal(b.calls.length,2);b.calls.forEach(b.resolve);assert((await promise).ready);assert(settled);
  const legacy=readFileSync(new URL('./fixtures/vault-textures-before-v35.js',import.meta.url),'utf8').replace(/^import.*\n/gm,'').replace('export function','function');
  const oldCalls=[],oldLoader=new Function('T','VAULT_TEXTURE_URLS',legacy+';return loadVaultTextures;')({TextureLoader:class{loadAsync(url){const d=deferred();oldCalls.push({...d,url});return d.promise;}},SRGBColorSpace:1,RepeatWrapping:2},Object.fromEntries(VAULT_SLICES.map(s=>[s.theme,s.theme])));
  let oldSettled=false;const old=factory(oldLoader)({},new Game(),{}).then(()=>{oldSettled=true;});await flush();assert.equal(oldCalls.length,4);oldCalls.slice(0,2).forEach(c=>c.resolve(new T.Texture()));await flush();assert(!oldSettled);oldCalls[2].reject(Error('unused gale failed'));await assert.rejects(old,/unused gale failed/);oldCalls[3].resolve(new T.Texture());b.cache.dispose();
});
test('native map installation owns regional materials and preserves geometry/game state across lifecycle',async()=>{
  const scene=new T.Scene(),game=new Game(),before=game.serialize(),requests=[];
  const load=()=>{const d=deferred();requests.push(d);return d.promise;};const vault=new VaultScene(scene,game,groundAt,{},load);
  const world=surfaceMaterial('stone',0x633b32),worldMap=world.map,regional=vault.textureMaterials.get('ember'),initial=regional.map;
  assert.notEqual(world,regional);const geometry=[];scene.traverse(o=>{if(o.geometry)geometry.push(o.geometry);});
  vault.update(game,0,true);assert.equal(requests.length,1);const map=new T.Texture({width:128,height:128});requests[0].resolve({ember:map});await flush();assert.equal(regional.map,initial,'no callback mutation');vault.update(game,.1,false);assert.equal(regional.map,initial);vault.update(game,.2,true);assert.equal(regional.map,map);assert.equal(world.map,worldMap);assert.equal(regional.userData.authoredSurface,false);
  const prior=regional.version;vault.update(game,.3,true);assert.equal(regional.version,prior);assert.equal(requests.length,2);
  const other=new Game(),old=new T.Texture();vault.update(other,.4,true);requests[1].resolve({ember:old});await flush();vault.update(other,.5,true);assert.equal(regional.map,map,'old-game callback ignored');
  vault.update(other,.6,false);requests[2].resolve({ember:old});await flush();vault.update(other,.7,true);assert.equal(regional.map,map,'title callback ignored');
  vault.disposeTextureStreaming();requests.at(-1).resolve({ember:old});await flush();vault.update(other,2,true);assert.equal(regional.map,map,'disposed streaming ignores late results');
  const after=[];scene.traverse(o=>{if(o.geometry)after.push(o.geometry);});assert.deepEqual(after,geometry);assert.deepEqual(game.serialize(),before);
});
