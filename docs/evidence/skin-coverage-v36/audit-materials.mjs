// Read-only native Three/source audit. Texture image decode is an explicit double;
// no renderer/context, network, GPU upload measurement or game-frame output.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL,fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(process.argv[2]??fileURLToPath(new URL('../../..',import.meta.url)));
const out=path.dirname(fileURLToPath(import.meta.url));
const url=p=>pathToFileURL(path.join(root,p)).href;
const T=await import(url('node_modules/three/build/three.module.js'));
const {buildActorGeometry,ACTOR_FAMILIES}=await import(url('src/assets/characters/detailed-geometry.js'));
const {installSkinTexture,SKIN_TEXTURE_ROLES,SKIN_NECK_REFERENCE}=await import(url('src/skin-materials.js'));
const {createSkinTextureCache}=await import(url('src/skin-texture-loader.js'));
const base=await import(url('src/assets/characters/anatomical-head-data.js'));
const npc=await import(url('src/assets/characters/identity-head-data.js'));
const {createDetailedActor}=await import(url('src/actor-models.js'));
const start=performance.now();installSkinTexture(null);
const spec=[...ACTOR_FAMILIES.map(role=>[role,{}]),...['keeper','knight','archer'].map(role=>[role,{}]),...['ember','tide','gale','moss'].map(theme=>['soldier',{theme}])];
const uniqueMaterials=new Set(),faceMaterials=new Set(),geometries=new Set(),roles=[];
const snapshot=model=>{const rows=[];model.traverse(n=>{if(n.isMesh)rows.push({node:n,material:n.material,color:n.material.color.clone(),map:n.material.map,roughness:n.material.roughness,roughnessMap:n.material.roughnessMap,bumpMap:n.material.bumpMap,bumpScale:n.material.bumpScale});});return rows;};
const hashGeometry=g=>{const h=createHash('sha256');for(const [name,a] of Object.entries(g.attributes)){h.update(name);h.update(Buffer.from(a.array.buffer,a.array.byteOffset,a.array.byteLength));}if(g.index)h.update(Buffer.from(g.index.array.buffer,g.index.array.byteOffset,g.index.array.byteLength));return h.digest('hex');};
const models=spec.map(([role,opt])=>{const model=buildActorGeometry(role,opt),rows=snapshot(model),f=rows.find(r=>r.material.name==='Q anatomical face');
 let triangles=0;for(const r of rows){uniqueMaterials.add(r.material);geometries.add(r.node.geometry);triangles+=(r.node.geometry.index?.count??r.node.geometry.attributes.position.count)/3;}
 const info={role,options:opt,meshes:rows.length,triangles,face:!!f};
 if(f){faceMaterials.add(f.material);const data=(role==='npc'||role==='keeper')?npc:base,uv=f.node.geometry.attributes.uv;assert.equal(uv.count,data.HEAD_ATTRIBUTES.length);
 let max=0;for(let i=0;i<uv.count;i++)for(let k=0;k<2;k++)max=Math.max(max,Math.abs(uv.array[i*2+k]-data.HEAD_ATTRIBUTES[i][6+k]));assert(max<6e-8);
 Object.assign(info,{headData:data===npc?'identity-head-data.js':'anatomical-head-data.js',uvCorners:uv.count,maxNativeUVError:max,originalColor:f.material.color.getHexString(),faceGeometrySHA256:hashGeometry(f.node.geometry),roughness:f.material.roughness,bumpScale:f.material.bumpScale,roughnessMapName:f.material.roughnessMap?.name});
 const bones=f.node.skeleton.bones;info.headBone=!!bones.find(b=>b.name==='head');info.neckBone=!!bones.find(b=>b.name==='neck');info.lidBones=bones.filter(b=>b.name.startsWith('eyelid-')).length;assert.equal(info.lidBones,2);
 }roles.push(info);return {role,opt,model,rows,f};});
let loads=0,clones=0,disposes=0;const originalClone=T.Texture.prototype.clone;T.Texture.prototype.clone=function(){clones++;return originalClone.call(this);};
const texture=new T.Texture({width:2048,height:2048});texture.addEventListener('dispose',()=>disposes++);
const cache=createSkinTextureCache('explicit-image-decode-double',{loadAsync:async()=>{loads++;return texture;}});
const p=cache.load();assert.equal(p,cache.load());await p;installSkinTexture(texture);const version=texture.version;let changed=0,unchanged=0;const changedRoles=[];
for(const m of models)for(const r of m.rows){const allowed=m.role==='smith'&&r===m.f;
 if(allowed){changed++;changedRoles.push(m.role);assert.equal(r.material.map,texture);for(let c=0;c<3;c++)assert(Math.abs(r.material.color.toArray()[c]*SKIN_NECK_REFERENCE[c]-r.color.toArray()[c])<1e-14);}
 else {unchanged++;assert.equal(r.material.map,r.map);assert(r.material.color.equals(r.color));}
 assert.equal(r.material.roughness,r.roughness);assert.equal(r.material.roughnessMap,r.roughnessMap);assert.equal(r.material.bumpMap,r.bumpMap);assert.equal(r.material.bumpScale,r.bumpScale);
}
assert.deepEqual(SKIN_TEXTURE_ROLES,['smith']);assert.equal(changed,1);
const smith=models.find(m=>m.role==='smith');for(let i=0;i<12;i++){const clone=buildActorGeometry('smith'),f=snapshot(clone).find(r=>r.material.name==='Q anatomical face');assert.equal(f.material,smith.f.material);assert.equal(f.node.geometry,smith.f.node.geometry);assert.notEqual(f.node.skeleton,smith.f.node.skeleton);assert.equal(f.material.map,texture);assert.equal(await cache.load(),texture);}
assert.equal(loads,1);assert.equal(clones,0);assert.equal(texture.version,version);
installSkinTexture(null);for(const m of models)for(const r of m.rows){assert.equal(r.material.map,r.map);assert(r.material.color.equals(r.color));}
cache.dispose();assert.equal(disposes,1);T.Texture.prototype.clone=originalClone;
const activeVariants=[];for(const [role,opt]of spec){const actor=createDetailedActor(role,opt);for(const weaponType of role==='player'?['sword','spear','greatsword']:['sword']){actor.animate({weaponType},0);let meshes=0,triangles=0;actor.g.traverseVisible(n=>{if(n.isMesh){meshes++;triangles+=(n.geometry.index?.count??n.geometry.attributes.position.count)/3;}});assert(triangles<8000&&meshes<=14);activeVariants.push({role,options:opt,weaponType,meshes,triangles});}}
const result={activeVariants,rawGeometryCountBoundary:'roles counts traverse all template meshes, including hidden weapons; activeVariants are production actor initialization visibility counts.',boundary:'Native Three materials, geometry, bone references and cache; decode double. No image perception, WebGL shader compilation or actual upload count.',roles,counts:{variants:spec.length,uniqueMaterials:uniqueMaterials.size,uniqueFaceMaterials:faceMaterials.size,uniqueGeometry:geometries.size,changedMaterialReferences:changed,unchangedMaterialReferences:unchanged,changedRoles,extraSmithClones:12,loadAsyncCalls:loads,textureCloneCalls:clones,textureVersionBeforeAfterClones:[version,texture.version],disposals:disposes},protected:'Only smith face map/color change after installing existing texture; all eyes/iris/lid/neck/body/cloth/hair and their roughness/bump references remain unchanged; detach restores exact flat color.',sourceHashes:Object.fromEntries(['src/assets/characters/detailed-geometry.js','src/skin-materials.js','src/skin-texture-loader.js','src/skin-assets.js','src/assets/characters/anatomical-head-data.js','src/assets/characters/identity-head-data.js'].map(p=>[p,createHash('sha256').update(readFileSync(path.join(root,p))).digest('hex')])),durationSeconds:(performance.now()-start)/1000};
writeFileSync(path.join(out,'materials.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result.counts,null,2));
