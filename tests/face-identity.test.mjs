import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import * as T from 'three';
import {createDetailedActor,ACTOR_FAMILIES} from '../src/actor-models.js';
import {HEAD_ATTRIBUTES as A,HEAD_INDICES as I,HEAD_SOURCE_IDS as S} from '../src/assets/characters/identity-head-data.js';
import {HEAD_ATTRIBUTES as B,HEAD_SOURCE_IDS as BS} from '../src/assets/characters/anatomical-head-data.js';
const root=new URL('../',import.meta.url),assets=new URL('src/assets/characters/',root);
const hash=url=>createHash('sha256').update(readFileSync(url)).digest('hex');
function face(a){let found;a.g.traverse(n=>{if(n.material?.name==='Q anatomical face')found=n;});return found;}
test('Mira head records exact licensed source, source-aware LOD recipe and unchanged error gates',()=>{
 const p=JSON.parse(readFileSync(new URL('identity-head-provenance.json',assets)));
 assert.equal(p.role,'npc');assert.equal(p.generatorSha256,hash(new URL(p.generator,root)));
 for(const part of[p.registrationRecipe,p.morphRecipe])assert.equal(part.sha256,hash(new URL(part.file,root)));
 for(const part of[p.source,...p.morphSources,...p.archivedUnappliedSources]){const path=new URL(part.file,assets);assert.equal(part.sha256,hash(path));assert.equal(part.bytes,readFileSync(path).length);}
 assert.equal(p.outputSha256,hash(new URL(p.asset,assets)));assert.equal(p.outputBytes,readFileSync(new URL(p.asset,assets)).length);
 assert.equal(p.passesSourceDistanceGate,true);assert(p.lod.sourceVertexDistanceM.p95<.0021);assert(p.lod.sourceVertexDistanceM.max<.0075);
 assert.equal(I.length/3,1646);assert.equal(A.length,1062);assert.equal(p.uvIntegrity.newOrientationReversals,0);
 assert.deepEqual(p.morphsApplied.map(m=>m.source),['sources/head-oval.target','sources/nose-scale-horiz-incr.target']);
});
test('source-aware identity stays closed across UV splits and keeps protected shared source points fixed',()=>{
 const edges=new Map(),base=new Map(BS.map((v,i)=>[v,B[i]]));let volume=0,changed=0;
 for(let f=0;f<I.length;f+=3){const ids=I.slice(f,f+3),p=ids.map(i=>new T.Vector3(...A[i].slice(0,3))),cross=new T.Vector3().crossVectors(p[1].clone().sub(p[0]),p[2].clone().sub(p[0]));assert(cross.length()>1e-10);volume+=p[0].dot(new T.Vector3().crossVectors(p[1],p[2]))/6;for(let k=0;k<3;k++){const key=[S[ids[k]],S[ids[(k+1)%3]]].sort((a,b)=>a-b).join('/');edges.set(key,(edges.get(key)||0)+1);}}
 assert([...edges.values()].every(n=>n===2));assert(volume>0);
 for(let i=0;i<A.length;i++){const p=A[i],old=base.get(S[i]);assert(p.every(Number.isFinite));assert(Math.abs(Math.hypot(...p.slice(3,6))-1)<1e-5);if(!old)continue;const distance=Math.hypot(...p.slice(0,3).map((v,j)=>v-old[j]));if(distance>1e-6)changed++;if(old[1]<=-.105||old[1]>=.085||Math.abs(old[0])>=.115||old[2]<=.015)assert(distance<2e-7,'protected source geometry moved');}
 assert(changed>40,'candidate must contain actual authored source displacement');
});
test('only npc adopts the new head; clones share geometry, not pose, and all used families/themes keep budgets',()=>{
 for(const [role,options]of[...ACTOR_FAMILIES.map(role=>[role,{}]),...['ember','tide','gale','moss'].map(theme=>['soldier',{theme}])]){
  const a=createDetailedActor(role,options),b=createDetailedActor(role,options);let triangles=0,draws=0;a.g.traverseVisible(n=>{if(n.isMesh){draws++;triangles+=(n.geometry.index?.count??n.geometry.attributes.position.count)/3;}});assert(triangles<8000);assert(draws<=14);
  if(role==='wolf')continue;const f=face(a),g=face(b);assert.equal(f.geometry,g.geometry);assert.notEqual(f.skeleton,g.skeleton);assert.equal(f.geometry.index.count/3,role==='npc'?1646:1546);const before=b.head.quaternion.clone();a.animate({healTimer:.45},0);assert(b.head.quaternion.equals(before));if(role==='npc')assert.equal(f.material.map,null);
 }
});
