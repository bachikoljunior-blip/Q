import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import * as T from '../Q-skin-v29/node_modules/three/build/three.module.js';
import {buildActorGeometry,ACTOR_FAMILIES} from '../Q-skin-v29/src/assets/characters/detailed-geometry.js';
import {installSkinTexture,SKIN_TEXTURE_ROLES,SKIN_NECK_REFERENCE} from '../Q-skin-v29/src/skin-materials.js';
import {createSkinTextureCache} from '../Q-skin-v29/src/skin-texture-loader.js';
import {HEAD_ATTRIBUTES} from '../Q-skin-v29/src/assets/characters/anatomical-head-data.js';
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const snapshot=n=>{const ms=[];n.traverse(x=>{if(x.isMesh)for(const m of Array.isArray(x.material)?x.material:[x.material])ms.push({mesh:x,mat:m,name:m.name,color:m.color.clone(),map:m.map});});return ms;};
const models=new Map(ACTOR_FAMILIES.map(role=>[role,buildActorGeometry(role)]));
const before=new Map([...models].map(([r,m])=>[r,snapshot(m)]));
const beforeUV=before.get('smith').find(x=>x.name==='Q anatomical face').mesh.geometry.attributes.uv;
assert.equal(beforeUV.count,HEAD_ATTRIBUTES.length);
let maxUVError=0;
for(let i=0;i<beforeUV.count;i++)for(let k=0;k<2;k++)maxUVError=Math.max(maxUVError,Math.abs(beforeUV.array[i*2+k]-HEAD_ATTRIBUTES[i][6+k]));
assert(maxUVError<6e-8);assert.deepEqual(SKIN_TEXTURE_ROLES,['smith']);
let calls=0;const tex=new T.Texture({width:2048,height:2048});const cache=createSkinTextureCache('fixture',{loadAsync:async()=>{calls++;return tex;}});
const p1=cache.load(),p2=cache.load();assert.equal(p1,p2);await p1;assert.equal(calls,1);
assert.equal(tex.colorSpace,T.SRGBColorSpace);assert.equal(tex.flipY,true);assert.equal(tex.minFilter,T.LinearMipmapLinearFilter);assert.equal(tex.magFilter,T.LinearFilter);assert.equal(tex.wrapS,T.ClampToEdgeWrapping);assert.equal(tex.wrapT,T.ClampToEdgeWrapping);assert.equal(tex.generateMipmaps,true);assert.equal(tex.anisotropy,2);assert.deepEqual(tex.repeat.toArray(),[1,1]);assert.deepEqual(tex.offset.toArray(),[0,0]);assert.equal(tex.rotation,0);assert.equal(tex.channel,0);
installSkinTexture(tex);const touched=[];let untouched=0;const smithColor=new T.Color(0x98765d);
for(const [r,old] of before)for(const o of old){
 const eligible=r==='smith'&&o.name==='Q anatomical face';
 if(eligible){assert.equal(o.mat.map,tex);for(const [j,c] of ['r','g','b'].entries())assert(Math.abs(o.mat.color[c]*SKIN_NECK_REFERENCE[j]-o.color[c])<1e-14);touched.push({role:r,material:o.name,base:o.color.toArray(),tint:o.mat.color.toArray()});}
 else {assert.equal(o.mat.map,o.map);assert(o.mat.color.equals(o.color));untouched++;}
}
assert.equal(touched.length,1);
const smith2=buildActorGeometry('smith'),sf1=before.get('smith').find(x=>x.name==='Q anatomical face'),sf2=snapshot(smith2).find(x=>x.name==='Q anatomical face');assert.equal(sf1.mat,sf2.mat);assert.equal(sf1.mesh.geometry,sf2.mesh.geometry);assert.equal(sf2.mat.map,tex);assert.notEqual(sf1.mesh.skeleton,sf2.mesh.skeleton);
const unaffectedVariants=[];for(const [r,opt] of [['keeper',{}],['knight',{}],['archer',{}],...['ember','tide','gale','moss'].map(theme=>['soldier',{theme}])]){const m=buildActorGeometry(r,opt);for(const x of snapshot(m))assert.notEqual(x.mat.map,tex);unaffectedVariants.push([r,opt]);}
const transformed=new T.Vector2(.8,.2);tex.transformUv(transformed);assert.deepEqual(transformed.toArray(),[.8,.8]);
installSkinTexture(null);for(const [r,old]of before)for(const o of old){assert.equal(o.mat.map,o.map);assert(o.mat.color.equals(o.color));}
let disposeCount=0;tex.addEventListener('dispose',()=>disposeCount++);cache.dispose();assert.equal(disposeCount,1);
// Failed decode must clear pending, so application boot can retry.
let attempt=0;const retryTex=new T.Texture({width:2048,height:2048}),retry=createSkinTextureCache('retry',{loadAsync:async()=>{if(++attempt===1)throw Error('expected network failure');return retryTex;}});await assert.rejects(retry.load(),/expected network/);assert.equal(await retry.load(),retryTex);assert.equal(attempt,2);retry.dispose();
// Late completion after explicit release must be rejected and disposed, never installed.
let resolveOld;const old=new T.Texture({width:2048,height:2048});let oldDisposed=0;old.addEventListener('dispose',()=>oldDisposed++);const late=createSkinTextureCache('late',{loadAsync:()=>new Promise(resolve=>resolveOld=resolve)});const pending=late.load();const rejected=assert.rejects(pending,/Skin load released/);await Promise.resolve();late.dispose();resolveOld(old);await rejected;assert.equal(oldDisposed,1);
const small=new T.Texture({width:1024,height:1024});let smallDisposed=0;small.addEventListener('dispose',()=>smallDisposed++);const bad=createSkinTextureCache('bad',{loadAsync:async()=>small});await assert.rejects(bad.load(),/2048/);assert.equal(smallDisposed,1);
const paths=['src/skin-texture-loader.js','src/skin-materials.js','src/skin-assets.js','src/assets/characters/detailed-geometry.js','src/assets/characters/anatomical-head-data.js','src/assets/characters/skin/young-male-q95.webp','src/scene.js'];
const result={status:'PASS independent CPU/source contract; no WebGL or browser',sourceFiles:paths.map(p=>({path:p,sha256:sha(new URL('../Q-skin-v29/'+p,import.meta.url))})),actorRolesChecked:ACTOR_FAMILIES,oneChangedMaterial:touched,unchangedMaterialReferences:untouched,unaffectedAliasesAndThemes:unaffectedVariants,smithClonesShareMaterialTextureAndGeometry:true,smithClonesKeepSeparateSkeletons:true,uvMaxAbsErrorFromV28OriginalUVData:maxUVError,uvCount:beforeUV.count,textureProperties:{colorSpace:tex.colorSpace,flipY:tex.flipY,repeat:tex.repeat.toArray(),offset:tex.offset.toArray(),rotation:tex.rotation,channel:tex.channel,anisotropy:tex.anisotropy},installNullRestoresExistingFlatMaterial:true,cacheSingleConcurrentLoad:true,cacheFailureRetry:true,lateDecodeDisposedAndRejected:true,invalidSizeDisposedAndRejected:true,reference:[...SKIN_NECK_REFERENCE],colorBoundary:'Tint multiplication matches exactly the declared neck-reference average; this script does not prove image-sampled reference accuracy or rendered color continuity.'};
writeFileSync(new URL('./runtime-review.json',import.meta.url),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
