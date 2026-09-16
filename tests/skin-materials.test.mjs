import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createSkinTextureCache} from '../src/skin-texture-loader.js';
import {installSkinTexture,SKIN_NECK_REFERENCE} from '../src/skin-materials.js';
import {createDetailedActor,ACTOR_FAMILIES} from '../src/actor-models.js';

const decoded=()=>new T.Texture({width:2048,height:2048});
function face(actor){let result;actor.g.traverse(n=>{if(n.material?.name==='Q anatomical face')result=n;});return result;}
test('one deferred decode is shared, decode failure retries, late release disposes and cannot poison new load',async()=>{
  let calls=0,resolve,first=true;
  const cache=createSkinTextureCache('fixture',{loadAsync:()=>{calls++;if(first){first=false;throw Error('decode');}return new Promise(r=>{resolve=r;});}});
  const failed=cache.load();assert.equal(failed,cache.load());await assert.rejects(failed,/decode/);
  const stale=cache.load();await Promise.resolve();cache.dispose();const old=decoded();let disposed=0;old.addEventListener('dispose',()=>disposed++);resolve(old);await assert.rejects(stale,/released/);assert.equal(disposed,1);
  const ready=cache.load();await Promise.resolve();const tex=decoded();resolve(tex);assert.equal(await ready,tex);assert.equal(await cache.load(),tex);assert.equal(calls,3);
  assert.equal(tex.colorSpace,T.SRGBColorSpace);assert.equal(tex.flipY,true);assert.equal(tex.wrapS,T.ClampToEdgeWrapping);assert.equal(tex.minFilter,T.LinearMipmapLinearFilter);assert.equal(tex.generateMipmaps,true);
  cache.dispose();
});
test('invalid decode is disposed, cache can recover, invalid install retains prior face material',async()=>{
  let call=0,disposals=0;const bad=new T.Texture({width:1,height:1});bad.addEventListener('dispose',()=>disposals++);
  const cache=createSkinTextureCache('fixture',{loadAsync:async()=>++call===1?bad:decoded()});
  await assert.rejects(cache.load(),/2048/);assert.equal(disposals,1);const tex=await cache.load();
  const a=createDetailedActor('smith'),f=face(a);installSkinTexture(tex);assert.throws(()=>installSkinTexture(bad),/Invalid/);assert.equal(f.material.map,tex);
  installSkinTexture(null);cache.dispose();
});
test('only smith face shares sRGB map across clones; eyes, lids, body and every other role remain unchanged',async()=>{
  installSkinTexture(null);const before=new Map();
  for(const role of ACTOR_FAMILIES){const actor=createDetailedActor(role);actor.g.traverse(n=>{if(n.isMesh)before.set(n.material,n.material.color.clone());});}
  const a=createDetailedActor('smith'),b=createDetailedActor('smith'),f=face(a),base=f.material.color.clone(),uv=Array.from(f.geometry.attributes.uv.array),geometry=f.geometry;
  const cache=createSkinTextureCache('fixture',{loadAsync:async()=>decoded()}),tex=await cache.load();installSkinTexture(tex);
  assert.equal(f.material,face(b).material);assert.equal(f.material.map,tex);assert.equal(f.geometry,geometry);assert.deepEqual(Array.from(f.geometry.attributes.uv.array),uv);
  assert.notEqual(f.skeleton,face(b).skeleton);assert.equal(face(createDetailedActor('smith')).material.map,tex);
  assert(f.material.isMeshStandardMaterial);assert.equal(f.material.metalness,0);assert.equal(f.material.envMap,null);
  for(let k=0;k<3;k++)assert(Math.abs(f.material.color.toArray()[k]*SKIN_NECK_REFERENCE[k]-base.toArray()[k])<1e-14);
  for(const role of ACTOR_FAMILIES){const actor=createDetailedActor(role);let triangles=0,draws=0;actor.g.traverseVisible(n=>{if(!n.isMesh)return;triangles+=(n.geometry.index?.count??n.geometry.attributes.position.count)/3;draws++;if(role!=='smith'||n!==face(actor)){assert.equal(n.material.map,null,`${role}/${n.material.name}`);assert(n.material.color.equals(before.get(n.material)));}});assert(triangles<8000);assert(draws<=14);}
  installSkinTexture(null);assert.equal(f.material.map,null);assert(f.material.color.equals(base));cache.dispose();
});
