import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import * as T from 'three';
import {createDetailedActor,ACTOR_FAMILIES} from '../src/actor-models.js';
import {HEAD_ATTRIBUTES as A,HEAD_INDICES as I,HEAD_SOURCE_IDS as S} from '../src/assets/characters/anatomical-head-data.js';
const assetRoot=new URL('../src/assets/characters/',import.meta.url);
const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
function update(a){a.g.updateMatrixWorld(true);a.g.traverse(n=>{if(n.isSkinnedMesh){n.skeleton.update();n.computeBoundingSphere();}});}
function face(a){let result;a.g.traverse(n=>{if(n.material?.name==='Q anatomical face')result=n;});return result;}
function eyeSamples(actor,closure){
 actor.time=4.7-actor.type.length*.19+.13-.095*(1-closure);actor.animate({},0);update(actor);
 let eye=0,cloth=0;for(const side of[-1,1])for(const x of[-.01,0,.01])for(const y of[-.005,0,.005]){
  const origin=actor.head.localToWorld(new T.Vector3(side*.046+x,.05+y,.5)),direction=new T.Vector3(0,0,-1).transformDirection(actor.head.matrixWorld);
  const hit=new T.Raycaster(origin,direction,0,actor.g.scale.y).intersectObject(actor.g,true).find(h=>h.object.isSkinnedMesh);
  if(hit?.object.material.name==='Q eye')eye++;if(hit?.object.material.name==='Q cloth')cloth++;
 }return {eye,cloth};
}
test('head source, all archived inputs, generator and generated runtime bytes match provenance',()=>{
 const p=JSON.parse(readFileSync(new URL('anatomical-head-provenance.json',assetRoot)));
 for(const f of[p.source,...p.archivedUnappliedSources]){const url=new URL(f.file,assetRoot);assert.equal(readFileSync(url).length,f.bytes);assert.equal(hash(url),f.sha256);}
 assert.equal(hash(new URL('../'+p.generator,import.meta.url)),p.generatorSha256);
 assert.equal(hash(new URL(p.asset,assetRoot)),p.outputSha256);assert.equal(readFileSync(new URL(p.asset,assetRoot)).length,p.outputBytes);
 assert.equal(p.texture.observedBytes,null);assert.equal(p.source.license,'CC0-1.0');assert.deepEqual(p.morphsApplied,[]);
 assert(p.lod.sourceVertexDistanceM.max<.0075);assert(p.lod.sourceVertexDistanceM.p95<.0021);
});
test('derived head is closed at every UV split, outward, finite and within its unchanged silhouette envelope',()=>{
 const edges=new Map(),neighbours=new Map();let volume=0;
 for(let j=0;j<I.length;j+=3){const ids=I.slice(j,j+3),points=ids.map(i=>new T.Vector3(...A[i].slice(0,3)));assert(new T.Vector3().crossVectors(points[1].clone().sub(points[0]),points[2].clone().sub(points[0])).length()>1e-10);volume+=points[0].dot(new T.Vector3().crossVectors(points[1],points[2]))/6;
  for(let k=0;k<3;k++){const a=S[ids[k]],b=S[ids[(k+1)%3]],key=[a,b].sort((x,y)=>x-y).join('/');edges.set(key,(edges.get(key)||0)+1);if(!neighbours.has(a))neighbours.set(a,new Set());neighbours.get(a).add(b);}
 }
 assert([...edges.values()].every(n=>n===2),'closed manifold after welding source IDs at UV seams');assert(volume>0,'positive oriented volume');
 const seen=new Set(),todo=[S[0]];while(todo.length){const n=todo.pop();if(seen.has(n))continue;seen.add(n);todo.push(...neighbours.get(n));}assert.equal(seen.size,new Set(S).size);
 for(const v of A){assert(v.every(Number.isFinite));assert(Math.abs(Math.hypot(...v.slice(3,6))-1)<1e-5);assert(v[6]>=0&&v[6]<=1&&v[7]>=0&&v[7]<=1);assert(Math.abs(v[0])<=.142001&&v[1]<=.198001&&v[1]>=-.139&&v[2]>=-.112001&&v[2]<=.14315);}
 assert.equal(I.length/3,1546);
});
test('every human shares one independent skeleton and immutable face geometry without texturing hands or duplicating old head skin',()=>{
 for(const [family,options] of [...ACTOR_FAMILIES.filter(f=>f!=='wolf').map(f=>[f,{}]),...['ember','tide','gale','moss'].map(theme=>['soldier',{theme}])]){
  const a=createDetailedActor(family,options),b=createDetailedActor(family,options),fa=face(a),fb=face(b);assert(fa&&fb);assert.equal(fa.geometry,fb.geometry);assert.notEqual(fa.skeleton,fb.skeleton);assert.equal(fa.geometry.index.count/3,1546);assert.equal(fa.material.map,null);
  const palettes=new Set();let triangles=0,draws=0;
  a.g.traverse(n=>{if(!n.isMesh)return;if(n.isSkinnedMesh){palettes.add(n.skeleton);if(n.material.name==='Q skin'){assert.notEqual(n.material,fa.material);const w=n.geometry.attributes.skinWeight,idx=n.geometry.attributes.skinIndex;for(let i=0;i<w.count;i++)for(let k=0;k<4;k++)if(w.getComponent(i,k)>.99)assert.notEqual(n.skeleton.bones[idx.getComponent(i,k)].name,'head','old analytic face/ears must be removed');}}});
  a.g.traverseVisible(n=>{if(n.isMesh){triangles+=(n.geometry.index?.count??n.geometry.attributes.position.count)/3;draws++;}});assert.equal(palettes.size,1);assert(triangles<8000);assert(draws<=14);const before=b.head.quaternion.clone();a.animate({healTimer:.45},0);assert(b.head.quaternion.equals(before));
 }
});
test('existing two eyelid bones close the registered sockets monotonically and corrected hoods expose the eyes',()=>{
 for(const family of ACTOR_FAMILIES.filter(f=>f!=='wolf')){
  const a=createDetailedActor(family);let previous=18;
  for(let step=0;step<=8;step++){const sample=eyeSamples(a,step/8);assert(sample.eye<=previous,`${family} reopened at ${step}/8`);assert.equal(sample.cloth,0,`${family} hood/hair covers eyes`);previous=sample.eye;if(!step)assert(sample.eye>=8,`${family} eyes hidden when open`);}
  assert.equal(previous,0,`${family} iris penetrates fully closed lid`);
 }
});
test('capped neck rim stays inside the existing animated neck through pitch, drinking, recoil and death',()=>{
 const rim=new Set();for(let i=0;i<I.length;i+=3){const tri=I.slice(i,i+3);if(tri.some(v=>S[v]===-1))for(const v of tri)if(S[v]!==-1)rim.add(v);}assert.equal(rim.size,46);
 for(const family of ACTOR_FAMILIES.filter(f=>f!=='wolf')){const a=createDetailedActor(family),neck=a.g.getObjectByName('neck');
  for(const state of[{}, {state:'sealed'}, {healTimer:.45}, {state:'stagger',timer:.12,stagger:.4}, {dead:true,deathElapsed:1}]){a.animate(state,0);update(a);const inverse=neck.matrixWorld.clone().invert();
   for(const v of rim){const p=new T.Vector3(...A[v].slice(0,3)).applyMatrix4(a.head.matrixWorld).applyMatrix4(inverse);assert((p.x/.08)**2+((p.y-.018)/.12)**2+(p.z/.078)**2<1,`${family} exposed cut neck in ${JSON.stringify(state)}`);}
  }
 }
});
