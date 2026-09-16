// Identical-condition whole-scene structural oracle. No WebGL pixels, uploads, GPU draws or timing.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {registerHooks} from 'node:module';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const repo=path.resolve(process.argv[2]),out=path.resolve(process.argv[3]),url=p=>pathToFileURL(path.join(repo,p)).href;
const T=await import(url('node_modules/three/build/three.module.js'));
const {Game,groundAt}=await import(url('src/core.js'));
const hash=b=>createHash('sha256').update(b).digest('hex');
const tracked=['src/scene.js','src/actor-models.js','src/assets/characters/detailed-geometry.js','src/environment-atmosphere.js','src/environment-materials.js','src/forest-materials.js','src/weapon-trails.js'];
for(const name of ['head-assets','head-geometry','head-materials','human-head','sky-field','sky-lighting','sky-exposure'])if(fs.existsSync(path.join(repo,'src/'+name+'.js')))tracked.push('src/'+name+'.js');
for(const name of ['src/assets/characters/anatomical-head-data.js','src/assets/characters/anatomical-head-provenance.json','src/assets/sky/kloofendal_48d_partly_cloudy_puresky_1k.hdr'])if(fs.existsSync(path.join(repo,name)))tracked.push(name);
const hashes=Object.fromEntries(tracked.map(p=>[p,hash(fs.readFileSync(path.join(repo,p)))]));
const initialGame=new Game(),samePoints=[[0,80],[-105,0],[-300,-130],[170,-200]],qualityOrder=['low','medium','high'];
globalThis.__qSceneBudget={pmremCalls:0};
class RendererBoundary{
 constructor(){this.shadowMap={};this.extensions={has:n=>n==='EXT_color_buffer_float'};this.xr={enabled:false};this.autoClear=true;this.target=null;this.face=0;this.mip=0;}
 setPixelRatio(v){this.pixelRatio=v;}setSize(w,h){this.size=[w,h];}dispose(){}
 getRenderTarget(){return this.target;}getActiveCubeFace(){return this.face;}getActiveMipmapLevel(){return this.mip;}
 setRenderTarget(target,face=0,mip=0){this.target=target;this.face=face;this.mip=mip;}
 render(scene,camera){if(!scene.isScene){globalThis.__qSceneBudget.pmremCalls++;return;}scene.updateMatrixWorld();camera.updateMatrixWorld();scene.traverseVisible(n=>{if(n.isLOD&&n.autoUpdate)n.update(camera);});}
}
globalThis.__qSceneBudgetRenderer=RendererBoundary;
const data=s=>'data:text/javascript,'+encodeURIComponent(s),sceneURL=url('src/scene.js');
const renderer=data('export * from '+JSON.stringify(url('node_modules/three/build/three.module.js'))+';export class WebGLRenderer extends globalThis.__qSceneBudgetRenderer {}');
const assetStub=data('export function loadVaultTextures(){return Promise.resolve({})}export function loadForestTextures(){return Promise.resolve({})}export function loadEnvironmentTextures(){return Promise.resolve({})}');
let skySource=null;
if(fs.existsSync(path.join(repo,'src/sky-assets.js'))){
 const {HDRLoader}=await import(url('node_modules/three/examples/jsm/loaders/HDRLoader.js')),bytes=fs.readFileSync(path.join(repo,'src/assets/sky/kloofendal_48d_partly_cloudy_puresky_1k.hdr'));
 skySource=new HDRLoader().setDataType(T.HalfFloatType).parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));
}
globalThis.__qSceneBudgetSky=skySource;
const skyStub=data('export function loadSkySource(){return Promise.resolve(globalThis.__qSceneBudgetSky)}');
const hooks=registerHooks({resolve(specifier,context,next){if(context.parentURL===sceneURL){if(specifier==='three')return{url:renderer,shortCircuit:true};if(specifier==='./sky-assets.js')return{url:skyStub,shortCircuit:true};if(['./vault-textures.js','./forest-assets.js','./environment-assets.js'].includes(specifier))return{url:assetStub,shortCircuit:true};}return next(specifier,context);}});
let createSceneView;try{({createSceneView}=await import(sceneURL));}finally{hooks.deregister();}
Object.assign(globalThis,{innerWidth:1280,innerHeight:720,devicePixelRatio:1,addEventListener(){}});
const view=await createSceneView({},initialGame,{quality:'high'}),owners=new Map();
const actors=[['player',view.player],['npc',view.npc],['sena',view.sena],...[...view.residentModels].map(([id,a])=>['resident:'+id,a]),...[...view.enemyModels].map(([id,a])=>['enemy:'+id,a])];
for(const[id,a]of actors)a.g.traverse(n=>owners.set(n,{id,actor:a}));
const allNodes=[];view.scene.traverse(n=>allNodes.push(n));
const observedGeometries=new Set(),disposalEvents=[];
for(const n of allNodes)if(n.geometry&&!observedGeometries.has(n.geometry)){observedGeometries.add(n.geometry);n.geometry.addEventListener('dispose',()=>disposalEvents.push({geometry:n.geometry.uuid,node:n.name||n.type}));}
function buffersFor(geometries){
 const attrs=new Set(),arrays=new Set();let gpuSourceBytes=0,cpuArrayBytes=0;
 const add=a=>{if(!a)return;const key=a.isInterleavedBufferAttribute?a.data:a;if(!attrs.has(key)){attrs.add(key);gpuSourceBytes+=key.array.byteLength;}if(!arrays.has(key.array)){arrays.add(key.array);cpuArrayBytes+=key.array.byteLength;}};
 for(const g of geometries){Object.values(g.attributes).forEach(add);add(g.index);for(const list of Object.values(g.morphAttributes||{}))list.forEach(add);}
 return {uniqueGeometryCount:geometries.size,uniqueBufferAttributes:attrs.size,geometryBufferSourceBytes:gpuSourceBytes,uniqueTypedArrayBytes:cpuArrayBytes};
}
function trianglesAndGroups(n){
 const g=n.geometry,total=g.index?.count??g.attributes.position?.count??0,start=Math.max(0,g.drawRange.start),end=Math.min(total,start+g.drawRange.count),instances=n.isInstancedMesh?n.count:g.isInstancedBufferGeometry?g.instanceCount:1;
 if(end<=start||instances<=0)return{triangles:0,groups:0,expandedInstances:0,doubleSidedTransparentPasses:0};
 let triangles=0,groups=0,extra=0;
 const part=(a,b,m)=>{if(!m||m.visible===false)return;const count=Math.max(0,Math.min(end,b)-Math.max(start,a));if(!count)return;const t=Math.floor(count/3)*instances;triangles+=t;groups++;if(m.transparent&&m.side===T.DoubleSide&&!m.forceSinglePass)extra+=t;};
 if(Array.isArray(n.material))for(const group of g.groups)part(group.start,group.start+group.count,n.material[group.materialIndex]);else part(0,total,n.material);
 return {triangles,groups,expandedInstances:instances,doubleSidedTransparentPasses:extra};
}
function graphStats(root,frustum=null){
 const nodes=[];root.traverse(n=>nodes.push(n));const visible=new Set();root.traverseVisible(n=>visible.add(n));
 const geos=new Set(),materials=new Set(),textures=new Set(),instanceAttrs=new Set();
 const sum={nodes:nodes.length,meshObjects:0,visibleMeshObjects:0,frustumCandidateMeshes:0,visibleTriangles:0,frustumCandidateTriangles:0,instanceExpandedTriangles:0,visibleMaterialGroups:0,transparentExtraTriangles:0,castShadowEligibleTriangles:0};
 let instanceBytes=0,points=0;
 for(const n of nodes){
  if(n.geometry)geos.add(n.geometry);
  for(const material of [n.material,n.customDepthMaterial,n.customDistanceMaterial].flat().filter(Boolean)){materials.add(material);for(const key of ['map','normalMap','bumpMap','roughnessMap','metalnessMap','alphaMap','aoMap','emissiveMap'])if(material[key])textures.add(material[key]);}
  for(const a of[n.instanceMatrix,n.instanceColor])if(a&&!instanceAttrs.has(a)){instanceAttrs.add(a);instanceBytes+=a.array.byteLength;}
  if(n.isPoints&&visible.has(n))points+=Math.min(n.geometry.attributes.position.count,n.geometry.drawRange.count);
  if(!n.isMesh)continue;sum.meshObjects++;if(!visible.has(n))continue;
  const d=trianglesAndGroups(n);if(!d.triangles)continue;
  sum.visibleMeshObjects++;sum.visibleTriangles+=d.triangles;sum.visibleMaterialGroups+=d.groups;sum.transparentExtraTriangles+=d.doubleSidedTransparentPasses;if(n.isInstancedMesh)sum.instanceExpandedTriangles+=d.triangles;
  if(n.castShadow)sum.castShadowEligibleTriangles+=d.triangles;
  if(!frustum||!n.frustumCulled||frustum.intersectsObject(n)){sum.frustumCandidateMeshes++;sum.frustumCandidateTriangles+=d.triangles;}
 }
 return {...sum,...buffersFor(geos),uniqueMaterialsIncludingCustomShadows:materials.size,materialTextureObjects:textures.size,instanceBufferSourceBytes:instanceBytes,activePoints:points};
}
function actorInventory(){
 return actors.map(([id,a])=>{
  const geos=new Set(),names=[];a.g.traverse(n=>{if(n.geometry)geos.add(n.geometry);if(n.isMesh)names.push({name:n.name,geometry:n.geometry.name||n.geometry.type,visible:n.visible,triangles:(n.geometry.index?.count??n.geometry.attributes.position.count)/3,isSkinnedMesh:!!n.isSkinnedMesh,materialType:n.material?.type,materialName:n.material?.name,explicitEnvMap:!!n.material?.envMap,castShadow:n.castShadow,receiveShadow:n.receiveShadow});});
  return{id,family:a.type,rootVisible:a.g.visible,geometry:buffersFor(geos),rootUserData:a.g.userData,meshNames:names};
 });
}
const allocation=graphStats(view.scene),families={};
for(const[,a]of actors)families[a.type]=(families[a.type]||0)+1;
const samples=[];
for(const quality of qualityOrder)for(const[x,z]of samePoints){
 view.game=new Game();Object.assign(view.game.player,{x,z,y:groundAt(x,z),angle:0,moving:false});view.game.day=.29;view.t=0;view.yaw=.05;view.pitch=.3;view.zoom=9;view.snapCamera();view.setQuality(quality);
 const saved=JSON.stringify(view.game.serialize());view.update(1/60,true);view.update(1/60,true);assert.equal(JSON.stringify(view.game.serialize()),saved);
 view.scene.updateMatrixWorld();view.camera.updateMatrixWorld();
 const frustum=new T.Frustum().setFromProjectionMatrix(new T.Matrix4().multiplyMatrices(view.camera.projectionMatrix,view.camera.matrixWorldInverse)),whole=graphStats(view.scene,frustum);
 const actorMeshes=[];for(const[id,a]of actors){const r=graphStats(a.g,frustum);actorMeshes.push({id,family:a.type,rootVisible:a.g.visible,visibleTriangles:a.g.visible?r.visibleTriangles:0,frustumCandidateTriangles:a.g.visible?r.frustumCandidateTriangles:0,visibleMeshObjects:a.g.visible?r.visibleMeshObjects:0,geometryBufferSourceBytes:r.geometryBufferSourceBytes});}
 samples.push({quality,x,z,day:view.game.day,camera:view.camera.position.toArray(),cameraQuaternion:view.camera.quaternion.toArray(),whole,actors:actorMeshes,sky:{hasEnvironment:!!view.scene.environment,environmentIntensity:view.scene.environmentIntensity,rotation:view.scene.environmentRotation.toArray(),shadowEnabled:view.renderer.shadowMap.enabled},forest:view.treeDetail.map(s=>({total:s.total,far:s.source.count,near:s.detail.count}))});
}
const geometryUses=new Map();
for(const n of allNodes)if(n.isMesh){const r=geometryUses.get(n.geometry)||{uses:0,actorUses:0,names:new Set(),families:new Set()};r.uses++;if(owners.has(n)){r.actorUses++;r.families.add(owners.get(n).actor.type);}r.names.add(n.name||n.geometry.name||n.geometry.type);geometryUses.set(n.geometry,r);}
const sharing=[...geometryUses].filter(([,r])=>r.actorUses).map(([g,r])=>({names:[...r.names],families:[...r.families],uses:r.uses,actorUses:r.actorUses,triangles:(g.index?.count??g.attributes.position.count)/3,bytes:buffersFor(new Set([g])).geometryBufferSourceBytes})).sort((a,b)=>b.uses-a.uses);
let transfer=null;const manifestPath=path.join(repo,'dist/.vite/manifest.json');
if(fs.existsSync(manifestPath)){
 const manifest=JSON.parse(fs.readFileSync(manifestPath)),entries=Object.values(manifest),uniqueFiles=[...new Set(entries.flatMap(e=>[e.file,...e.assets||[],...e.css||[]]))],files=uniqueFiles.map(file=>{const b=fs.readFileSync(path.join(repo,'dist',file));return{file,bytes:b.length,sha256:hash(b)};});
 const initial=entries.find(e=>e.isEntry),runtimeSources=entries.filter(e=>e.src?.startsWith('src/assets/')).map(e=>({source:e.src,file:e.file,...files.find(f=>f.file===e.file)}));
 transfer={manifestSha256:hash(fs.readFileSync(manifestPath)),initialJsBytes:files.find(f=>f.file===initial.file)?.bytes,jsChunks:files.filter(f=>f.file.endsWith('.js')),runtimeAssetEntries:runtimeSources,manifestReferencedFileBytes:files.reduce((n,f)=>n+f.bytes,0),scope:'Existing build artifact snapshot, not network transfer timing or proof of current source fingerprint.'};
}
const changed=tracked.filter(p=>hash(fs.readFileSync(path.join(repo,p)))!==hashes[p]);assert.equal(changed.length,0);
const report={checkedAt:new Date().toISOString(),repo,head:execFileSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'}).trim(),sourceHashes:hashes,scope:'Actual SceneView/native Three geometry, material and renderer-prefix matrix/LOD state, 1280x720. Texture entrypoints other than real HDR CPU source and WebGLRenderer are explicit doubles. Geometry triangles/material groups/frustum candidates are CPU structural counts, not observed GPU draws, pixels, allocation or frame time.',conditions:{points:samePoints,qualityOrder,framesPerCondition:2,dt:1/60,day:.29,yaw:.05,pitch:.3,zoom:9},allocation,actorCount:actors.length,actorFamilies:families,actorInventory:actorInventory(),actorGeometrySharing:sharing,samples,disposalEventsDuringQualityLocationChanges:disposalEvents,pmremNativeRenderMethodCalls:globalThis.__qSceneBudget.pmremCalls,skyPayload:view.skyLighting?.budget??null,transfer,changedDuringRun:changed};
fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({out,head:report.head,allocation,actorCount:actors.length,actorFamilies:families,samples:samples.map(s=>({quality:s.quality,x:s.x,z:s.z,triangles:s.whole.visibleTriangles,frustumTriangles:s.whole.frustumCandidateTriangles,meshes:s.whole.visibleMeshObjects})),disposalEvents:disposalEvents.length,pmremCalls:report.pmremNativeRenderMethodCalls},null,2));

