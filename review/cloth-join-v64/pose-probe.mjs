import * as T from 'three';
import {performance} from 'node:perf_hooks';
import {createDetailedActor} from '../../src/actor-models.js';
import {FRAME,length,sub} from '../cloth-micro-v62/surfaces.mjs';
import {metrics,properCrossings} from './inspect.mjs';
export const FIXTURES=[
 {name:'idle 2s',frames:120,make:()=>({moving:false})},
 {name:'walk 2m/s 1s',frames:60,make:f=>({moving:true,x:0,z:f/30,angle:0})},
 {name:'turn right .6rad 1s',frames:60,make:f=>({moving:false,angle:-f*.01})},
 {name:'sealed canonical',frames:1,make:()=>({state:'sealed'})},
 {name:'death .45s explicit',frames:1,make:()=>({dead:true,deathElapsed:.45})},
 {name:'death 1s explicit',frames:1,make:()=>({dead:true,deathElapsed:1})},
];
export function probePoses(m){
 return FIXTURES.map(fixture=>{
  const actor=createDetailedActor('npc',{groundHeight:()=>0});actor.g.updateMatrixWorld(true);
  let chest;actor.g.traverse(n=>{if(n.isBone&&n.name==='chest')chest=n;});
  // Match v62's factory-post-animate({},0) registration, NOT the native bindInverse.
  const inverse=chest.matrixWorld.clone().invert();
  for(let f=0;f<fixture.frames;f++){const state=fixture.make(f);actor.g.position.set(state.x||0,0,state.z||0);actor.g.rotation.y=state.angle||0;actor.animate(state,fixture.frames===1?0:1/60);}
  actor.g.updateMatrixWorld(true);const delta=chest.matrixWorld.clone().multiply(inverse),normalMatrix=new T.Matrix3().getNormalMatrix(delta),offset=new T.Vector3(...FRAME.rootOffset);
  const start=performance.now();
  const positions=m.positions.map(p=>new T.Vector3(...p).add(offset).applyMatrix4(delta).toArray());
  const normals=m.normals.map(n=>new T.Vector3(...n).applyMatrix3(normalMatrix).normalize().toArray());
  const transformMs=performance.now()-start;
  const seamGaps=m.seams.map(s=>{const a=m.pieces[s.a],b=m.pieces[s.b];let max=0;
   for(let k=0;k<s.aLocal.length;k++){const p=a.positions[s.aLocal[k]],q=b.positions[s.bLocal[k]];const pa=new T.Vector3(...p).add(offset).applyMatrix4(delta).toArray(),pb=new T.Vector3(...q).add(offset).applyMatrix4(delta).toArray();max=Math.max(max,length(sub(pa,pb)));}return{id:s.id,max};});
  return {name:fixture.name,frames:fixture.frames,dt:fixture.frames===1?0:1/60,motionState:actor.motion.state,transformMs,seamGaps,
   metrics:metrics(m,positions,normals),properCrossings:properCrossings(m,positions),partMinY:m.pieces.map(p=>({id:p.id,minY:Math.min(...p.globalVertexIDs.map(i=>positions[i][1]))})),positions,normals};
 });
}
