// CPU skinning trial on existing, unmodified game bones. Not a cloth solver.
import {readFile,writeFile} from 'node:fs/promises';
import {performance} from 'node:perf_hooks';
import * as T from 'three';
import {createDetailedActor} from '../../src/actor-models.js';
import {FRAME,sub,cross,dot,length} from './surfaces.mjs';
const out=new URL('../../docs/evidence/mira-cloth-micro-v62/',import.meta.url);
const meshes=JSON.parse(await readFile(new URL('meshes.json',out)));
const fixtures=[
 {name:'idle 2s',frames:120,make:()=>({moving:false})},
 {name:'walk 2m/s 1s',frames:60,make:f=>({moving:true,x:0,z:f/30,angle:0})},
 {name:'turn right .6rad 1s',frames:60,make:f=>({moving:false,angle:-f*.01})},
 {name:'sealed canonical',frames:1,make:()=>({state:'sealed'})},
 {name:'death .45s explicit',frames:1,make:()=>({dead:true,deathElapsed:.45})},
 {name:'death 1s explicit',frames:1,make:()=>({dead:true,deathElapsed:1})},
];
const quantile=(xs,q)=>[...xs].sort((a,b)=>a-b)[Math.floor((xs.length-1)*q)];
const results=[];
for(const fixture of fixtures){
 const actor=createDetailedActor('npc',{groundHeight:()=>0});actor.g.updateMatrixWorld(true);
 const nodes={},inverse={};actor.g.traverse(n=>{if(n.isBone){nodes[n.name]=n;inverse[n.name]=n.matrixWorld.clone().invert();}});
 for(let f=0;f<fixture.frames;f++){
   const state=fixture.make(f);actor.g.position.set(state.x||0,0,state.z||0);actor.g.rotation.y=state.angle||0;actor.animate(state,fixture.frames===1?0:1/60);
 }actor.g.updateMatrixWorld(true);
 const delta=Object.fromEntries(Object.entries(nodes).map(([name,n])=>[name,n.matrixWorld.clone().multiply(inverse[name])]));
 const partReports=[],start=performance.now();
 for(const m of meshes){
   const positions=[],normals=[];
   for(let i=0;i<m.positions.length;i++){
     const rest=new T.Vector3(...m.positions[i]).add(new T.Vector3(...FRAME.rootOffset)),p=new T.Vector3(),n=new T.Vector3();
     for(const [name,w]of Object.entries(m.skinWeights[i])){
       p.addScaledVector(rest.clone().applyMatrix4(delta[name]),w);
       n.addScaledVector(new T.Vector3(...m.normals[i]).applyMatrix3(new T.Matrix3().getNormalMatrix(delta[name])),w);
     }positions.push(p.toArray());normals.push(n.normalize().toArray());
   }
   const stretch=[],areaRatios=[],normalDot=[];let degenerate=0;
   for(const tri of m.indices){
     const [a,b,c]=tri,n=cross(sub(positions[b],positions[a]),sub(positions[c],positions[a]));
     const rest=cross(sub(m.positions[b],m.positions[a]),sub(m.positions[c],m.positions[a]));
     if(length(n)<1e-10)degenerate++;
     areaRatios.push(length(n)/length(rest));for(const i of tri)normalDot.push(dot(n,normals[i])/length(n));
     for(let i=0;i<3;i++){const a=tri[i],b=tri[(i+1)%3];stretch.push(length(sub(positions[a],positions[b]))/length(sub(m.positions[a],m.positions[b])));}
   }
   partReports.push({id:m.id,finite:positions.flat().every(Number.isFinite)&&normals.flat().every(Number.isFinite),
     minYFlatFloorM:Math.min(...positions.map(p=>p[1])),degenerateTriangles:degenerate,
     reversedAgainstWeightedNormals:normalDot.filter(x=>x<=0).length,minTriangleVertexNormalDot:Math.min(...normalDot),
     edgeStretch:{min:Math.min(...stretch),p95:quantile(stretch,.95),max:Math.max(...stretch)},
     triangleAreaRatio:{min:Math.min(...areaRatios),max:Math.max(...areaRatios)},
     positions,normals});
 }
 results.push({name:fixture.name,actualMotionState:actor.motion.state,frames:fixture.frames,dt:fixture.frames===1?0:1/60,skinAndMetricsMs:performance.now()-start,parts:partReports});
}
const report={at:new Date().toISOString(),source:'existing createDetailedActor npc; actual native animate method, six fixed fixtures',scope:'finite weight trial; not contact, seam, naturalness or renderer acceptance',poses:results};
await writeFile(new URL('pose-probe.json',out),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(results.map(({name,actualMotionState,skinAndMetricsMs,parts})=>({name,actualMotionState,skinAndMetricsMs,parts:parts.map(({positions,normals,...p})=>p)})),null,2));
