import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const root='/workspace/scratch/e72662e3b71f/Q-ps4-v57';
const {createDetailedActor,ACTOR_FAMILIES}=await import(pathToFileURL(root+'/src/actor-models.js'));
const T=await import(pathToFileURL(root+'/node_modules/three/build/three.module.js'));
function meshStats(g){const arrays=new Set();let bytes=0;for(const a of [...Object.values(g.attributes),g.index].filter(Boolean)){if(!arrays.has(a.array.buffer)){arrays.add(a.array.buffer);bytes+=a.array.buffer.byteLength;}}return {vertices:g.attributes.position.count,triangles:(g.index?.count??g.attributes.position.count)/3,bufferBytes:bytes};}
const roleBudgets=[];let npc;
for(const role of ACTOR_FAMILIES){const actor=createDetailedActor(role);if(role==='npc')npc=actor;let triangles=0,meshes=0;const geometry=new Set();actor.g.traverseVisible(n=>{if(n.isMesh){meshes++;triangles+=meshStats(n.geometry).triangles;geometry.add(n.geometry);}});roleBudgets.push({role,triangles,visibleMeshes:meshes,uniqueGeometryBufferBytes:[...geometry].reduce((sum,g)=>sum+meshStats(g).bufferBytes,0)});}
npc.animate({},0);npc.g.updateMatrixWorld(true);npc.g.traverse(n=>{if(n.isSkinnedMesh)n.skeleton.update();});
const inverse=npc.head.matrixWorld.clone().invert(),parts=[];
npc.g.traverseVisible(n=>{if(!n.isMesh)return;const row={name:n.name,material:n.material.name,color:n.material.color.getHexString(),map:!!n.material.map,...meshStats(n.geometry)};if(n.material.name==='Q anatomical face'){
  const points=Array.from({length:n.geometry.attributes.position.count},(_,i)=>n.getVertexPosition(i,new T.Vector3()).applyMatrix4(n.matrixWorld).applyMatrix4(inverse));const bounds=new T.Box3().setFromPoints(points);row.headLocalBounds=[bounds.min.toArray(),bounds.max.toArray()];
}parts.push(row);});
const bonePositions={};for(const name of ['neck','head','eyelid-0','eyelid-1']){const b=npc.g.getObjectByName(name);bonePositions[name]={localPosition:b.position.toArray(),worldPosition:b.getWorldPosition(new T.Vector3()).toArray()};}
const files=['src/actor-models.js','src/character-motion.js','src/assets/characters/detailed-geometry.js','src/assets/characters/identity-head-data.js','src/assets/characters/anatomical-head-data.js','src/skin-materials.js','src/dialogue-camera.js','scripts/characters/generate-anatomical-head.py','scripts/characters/generate-identity-head.py','scripts/characters/generate-face-identities.py','src/assets/characters/sources/makehuman-hm08.obj'];
const sourceHashes={};for(const file of files){const data=await readFile(root+'/'+file);sourceHashes[file]={bytes:data.length,sha256:createHash('sha256').update(data).digest('hex')};}
const result={timestamp:new Date().toISOString(),checkout:root,head:'fc311bac0134b58e04891264c405bfd61eba22e3',runtimeBaseline:'2bee64cff6482cb7770ba69e07673eefc8ad54ef',boundary:'Read-only actual native Three CPU actor construction and rest transforms. No renderer, pixels or device/GPU cost.',roleBudgets,npcParts:parts,bonePositions,sourceHashes};
await writeFile(new URL('./baseline.json',import.meta.url),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({npc:roleBudgets.find(r=>r.role==='npc'),face:parts.find(p=>p.material==='Q anatomical face'),hairAndBrows:parts.find(p=>p.color==='a7a397'),bones:bonePositions},null,2));
