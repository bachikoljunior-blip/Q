import {readFileSync} from 'node:fs';
import {registerHooks} from 'node:module';
import {createHash} from 'node:crypto';
import {Vector3,Ray,Box3} from 'three';
import {createDetailedActor} from '../../src/actor-models.js';
import {cloakMetric,actorContract,cloakCases} from './cloak-uv-contract.mjs';

const source=readFileSync(new URL('../../docs/evidence/cloak-ground-v34/source-before.js',import.meta.url),'utf8');
const oldURL=new URL('../../src/actor-models.js?cloak-before-v34',import.meta.url).href;
const hook=registerHooks({load(url,context,next){return url===oldURL?{format:'module',source,shortCircuit:true}:next(url,context);}});
let createBefore;try{({createDetailedActor:createBefore}=await import(oldURL));}finally{hook.deregister();}
export {createBefore,createDetailedActor,cloakCases};
export const baselineHash=createHash('sha256').update(source).digest('hex');
const quantile=(values,q)=>values.slice().sort((a,b)=>a-b)[Math.min(values.length-1,Math.floor(q*values.length))];
export function worldPoints(actor){actor.g.updateMatrixWorld(true);const cape=actor.cape,p=cape.geometry.attributes.position;return Array.from({length:p.count},(_,i)=>new Vector3().fromBufferAttribute(p,i).applyMatrix4(cape.matrixWorld));}
export function measure(actor,ground=()=>0){
  const points=worldPoints(actor),cape=actor.cape,base=cape.userData.base,indices=cape.geometry.index.array;
  const rest=points.map((_,i)=>new Vector3().fromArray(base,i*3).applyMatrix4(cape.matrixWorld)),ratios=[],seen=new Set();
  let area=0,restArea=0,degenerate=0,normalTurnPast90=0,floorPenetratingTriangles=0,minFloorGap=Infinity;
  for(let i=0;i<indices.length;i+=3){
    const ids=[indices[i],indices[i+1],indices[i+2]],[a,b,c]=ids.map(i=>points[i]),[ra,rb,rc]=ids.map(i=>rest[i]);
    const cross=b.clone().sub(a).cross(c.clone().sub(a)),reference=rb.clone().sub(ra).cross(rc.clone().sub(ra));
    area+=cross.length()/2;restArea+=reference.length()/2;if(cross.length()<1e-10)degenerate++;else if(cross.dot(reference)<0)normalTurnPast90++;
    const samples=[a,b,c,a.clone().add(b).multiplyScalar(.5),b.clone().add(c).multiplyScalar(.5),c.clone().add(a).multiplyScalar(.5),a.clone().add(b).add(c).multiplyScalar(1/3)];
    let low=Infinity;for(const p of samples)low=Math.min(low,p.y-ground(p.x,p.z));minFloorGap=Math.min(minFloorGap,low);if(low< -1e-6)floorPenetratingTriangles++;
    for(let j=0;j<3;j++){const x=ids[j],y=ids[(j+1)%3],key=Math.min(x,y)*points.length+Math.max(x,y);if(!seen.has(key)){seen.add(key);ratios.push(points[x].distanceTo(points[y])/rest[x].distanceTo(rest[y]));}}
  }
  const uv=cloakMetric(cape),normal=cape.geometry.attributes.normal;
  return {area,restArea,areaRatio:area/restArea,degenerate,normalTurnPast90,floorPenetratingTriangles,minFloorGap,edgeMin:Math.min(...ratios),edgeP95:quantile(ratios,.95),edgeMax:Math.max(...ratios),uvStretchP95:Number.isFinite(uv.stretchP95)?uv.stretchP95:null,uvStretchMax:Number.isFinite(uv.stretchMax)?uv.stretchMax:null,finiteNormals:Array.from(normal.array).every(Number.isFinite)};
}
export function nonCapeContract(actor){
  const p=actor.cape.geometry.attributes.position,n=actor.cape.geometry.attributes.normal;
  // Replace only the two authorized mutable attributes for this comparison.
  const oldP=p.array,oldN=n.array;p.array=actor.cape.userData.base;n.array=new Float32Array(oldN.length);
  try{return actorContract(actor);}finally{p.array=oldP;n.array=oldN;}
}
export function bodyIntersections(actor){
  const points=worldPoints(actor),indices=actor.cape.geometry.index.array,body=[],names=new Set(['pelvis','spine','chest','neck','head']);
  actor.g.traverse(node=>{
    if(!node.isSkinnedMesh)return;node.skeleton.update();const geometry=node.geometry,weight=geometry.attributes.skinWeight,skin=geometry.attributes.skinIndex,vertices=[];
    for(let i=0;i<geometry.attributes.position.count;i++)vertices.push(node.getVertexPosition(i,new Vector3()).applyMatrix4(node.matrixWorld));
    const ix=geometry.index.array;for(let i=0;i<ix.length;i+=3){const ids=[ix[i],ix[i+1],ix[i+2]];if(!ids.every(id=>[0,1,2,3].every(k=>weight.getComponent(id,k)<=.1||names.has(node.skeleton.bones[skin.getComponent(id,k)].name))))continue;const tri=ids.map(id=>vertices[id]);body.push({tri,box:new Box3().setFromPoints(tri)});}
  });
  let crossed=0;const hit=new Vector3(),ray=new Ray();
  for(let i=0;i<indices.length;i+=3){const tri=[indices[i],indices[i+1],indices[i+2]].map(id=>points[id]),box=new Box3().setFromPoints(tri);let crosses=false;
    for(const target of body){if(!box.intersectsBox(target.box))continue;for(const [a,b]of [[tri,target.tri],[target.tri,tri]])for(let j=0;j<3;j++){
      const start=a[j],end=a[(j+1)%3],length=start.distanceTo(end);if(length<1e-9)continue;ray.set(start,end.clone().sub(start).multiplyScalar(1/length));
      if(ray.intersectTriangle(...b,false,hit)&&hit.distanceTo(start)>1e-5&&hit.distanceTo(start)<length-1e-5){crosses=true;break;}
    }if(crosses)break;}if(crosses)crossed++;
  }return crossed;
}
