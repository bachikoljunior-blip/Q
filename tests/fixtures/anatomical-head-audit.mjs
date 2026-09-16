// Read-only actual Three.js skin/ray/camera audit. Never creates a renderer.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const [repo,output]=process.argv.slice(2);const {createDetailedActor,ACTOR_FAMILIES}=await import(pathToFileURL(repo+'/src/actor-models.js'));const T=await import(pathToFileURL(repo+'/node_modules/three/build/three.module.js'));
const result={conditions:{boundary:'Actual CPU skin, ray and perspective calculations only; no pixels/WebGL/GPU/device or PS4 acceptance',rootPosition:[0,0,0],rootYaw:0,viewportsCSS:[[390,844],[844,390]],cameraFovDegrees:54,cameraYaw:.06,cameraPitch:.3},sourceHashes:Object.fromEntries(['src/actor-models.js','src/character-motion.js','src/assets/characters/detailed-geometry.js'].map(p=>[p,createHash('sha256').update(readFileSync(repo+'/'+p)).digest('hex')])),roles:[]};
for(const family of ACTOR_FAMILIES.filter(f=>f!=='wolf')){
 const a=createDetailedActor(family);let triangles=0,draws=0,bones=0;a.g.traverseVisible(n=>{if(n.isMesh){draws++;triangles+=(n.geometry.index?.count??n.geometry.attributes.position.count)/3;}if(n.isBone)bones++;});
 const r={family,triangles,visibleMeshBatches:draws,bones,eyes:[]};
 for(const closure of[0,.25,.5,.75,1]){
  a.time=4.7-family.length*.19+.13-.095*(1-closure);a.animate({},0);a.g.updateMatrixWorld(true);a.g.traverse(n=>{if(n.isSkinnedMesh){n.skeleton.update();n.computeBoundingSphere();}});
  const sample={closure,eye:0,skin:0,cloth:0,metal:0,centres:[]};
  for(const side of[-1,1])for(const x of[-.01,0,.01])for(const y of[-.005,0,.005]){
   const origin=a.head.localToWorld(new T.Vector3(side*.046+x,.05+y,.5)),direction=new T.Vector3(0,0,-1).transformDirection(a.head.matrixWorld);const h=new T.Raycaster(origin,direction,0,a.g.scale.y).intersectObject(a.g,true).find(h=>h.object.isSkinnedMesh);const n=h?.object.material.name;
   if(n==='Q eye')sample.eye++;else if(n==='Q cloth')sample.cloth++;else if(n==='Q metal')sample.metal++;else sample.skin++;
   if(x===0&&y===0)sample.centres.push({side,material:n,color:h?.object.material.color.getHexString()});
  }r.eyes.push(sample);
 }
 a.time=0;a.animate({},0);a.g.updateMatrixWorld(true);const points=[];
 a.g.traverse(n=>{if(!n.isSkinnedMesh||!['Q skin','Q anatomical face'].includes(n.material.name))return;n.skeleton.update();const idx=n.geometry.attributes.skinIndex,w=n.geometry.attributes.skinWeight;for(let i=0;i<idx.count;i++)if(w.getComponent(i,0)>.99&&n.skeleton.bones[idx.getComponent(i,0)].name==='head')points.push(n.getVertexPosition(i,new T.Vector3()).applyMatrix4(n.matrixWorld));});
 r.headSkinProjectionCSS=[];
 for(const [width,height]of result.conditions.viewportsCSS){const d=9*(height>width?1.12:1),camera=new T.PerspectiveCamera(54,width/height,.1,1100);camera.position.set(Math.sin(.06)*Math.cos(.3)*d,1.7+Math.sin(.3)*d,Math.cos(.06)*Math.cos(.3)*d);camera.lookAt(0,1.6,0);camera.updateMatrixWorld(true);const projected=points.map(p=>p.clone().project(camera)),xs=projected.map(p=>(p.x+1)*width/2),ys=projected.map(p=>(1-p.y)*height/2);r.headSkinProjectionCSS.push({viewport:[width,height],width:Math.max(...xs)-Math.min(...xs),height:Math.max(...ys)-Math.min(...ys),note:'skin head vertices including ears/collar; no occlusion. Same camera; boss retains its existing root scale.'});}
 result.roles.push(r);
}
writeFileSync(output,JSON.stringify(result,null,2)+'\n');console.log('saved '+output);
