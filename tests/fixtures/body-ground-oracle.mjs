import {readFileSync} from 'node:fs';
import {registerHooks} from 'node:module';
import {Vector3} from 'three';
// The candidate is deliberately not imported by production. These oracles keep
// the rejected implementation reproducible against the exact same base files.
const oldURL=new URL('../../src/actor-models.js?body-before-v36',import.meta.url).href;
const source=readFileSync(new URL('../../docs/evidence/body-ground-v36/source-before.js',import.meta.url),'utf8');
const hook=registerHooks({load(url,c,next){return url===oldURL?{format:'module',source,shortCircuit:true}:next(url,c);}});
export const createBefore=(await import(oldURL)).createDetailedActor;hook.deregister();
const candidateURL=new URL('../../src/actor-models.js?rejected-body-v36',import.meta.url).href;
const candidateSource=readFileSync(new URL('../../docs/evidence/body-ground-v36/rejected-rigid-support.js',import.meta.url),'utf8');
const candidateHook=registerHooks({load(url,c,next){return url===candidateURL?{format:'module',source:candidateSource,shortCircuit:true}:next(url,c);}});
export const createCandidate=(await import(candidateURL)).createDetailedActor;candidateHook.deregister();
export function bodyPoints(actor){
  actor.g.updateMatrixWorld(true);const points=[];
  actor.g.traverse(n=>{if(!n.isSkinnedMesh)return;n.skeleton.update();const g=n.geometry;
    for(let i=0;i<g.attributes.position.count;i++){
      let k=0;for(let j=1;j<4;j++)if(g.attributes.skinWeight.getComponent(i,j)>g.attributes.skinWeight.getComponent(i,k))k=j;
      const bone=n.skeleton.bones[g.attributes.skinIndex.getComponent(i,k)].name;
      points.push({point:n.getVertexPosition(i,new Vector3()).applyMatrix4(n.matrixWorld),bone,mesh:n.name,index:i});
    }
  });return points;
}
export function bodyMetric(actor,ground){
  const points=bodyPoints(actor),parts={},bins=new Map();let min=Infinity,worst=null,below=0;
  const inverse=actor.g.matrixWorld.clone().invert();
  for(const p of points){const gap=p.point.y-ground(p.point.x,p.point.z);if(gap<min){min=gap;worst={...p,point:p.point.toArray()};}if(gap<-.001)below++;
    const bone=p.bone.replace(/finger.*-(\d)-\d/,'hand-$1');parts[bone]=Math.min(parts[bone]??Infinity,gap);
    const local=p.point.clone().applyMatrix4(inverse),key=Math.floor(local.x/.15)+','+Math.floor(local.z/.15);bins.set(key,Math.min(bins.get(key)??Infinity,gap));
  }
  const gaps=[...bins.values()].sort((a,b)=>a-b);
  return {min,below,vertices:points.length,worst,parts,bottomBinP50:gaps[Math.floor(gaps.length*.5)],bottomBinP95:gaps[Math.floor(gaps.length*.95)],bottomBins:gaps.length,contactBins:gaps.filter(x=>Math.abs(x)<.03*actor.g.scale.y).length};
}
export function surfaceGroundMetric(actor,ground){
  actor.g.updateMatrixWorld(true);let min=Infinity,below=0,samples=0,worst=null;
  actor.g.traverse(n=>{if(!n.isSkinnedMesh)return;n.skeleton.update();const g=n.geometry,vertices=Array.from({length:g.attributes.position.count},(_,i)=>n.getVertexPosition(i,new Vector3()).applyMatrix4(n.matrixWorld));
    for(let i=0;i<g.index.count;i+=3){const [a,b,c]=[0,1,2].map(k=>vertices[g.index.getX(i+k)]);
      for(const [u,v]of [[0,0],[1,0],[0,1],[.5,0],[.5,.5],[0,.5],[1/3,1/3]]){const p=a.clone().multiplyScalar(1-u-v).addScaledVector(b,u).addScaledVector(c,v),gap=p.y-ground(p.x,p.z);samples++;if(gap<-.001)below++;if(gap<min){min=gap;worst={mesh:n.name,triangle:i/3,barycentric:[1-u-v,u,v],point:p.toArray()};}}
    }
  });return {min,below,samples,worst};
}
