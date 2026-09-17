import {Matrix3,Vector3} from 'three';
import {materialRenderKey} from './staff-batch.mjs';

export function geometryCounts(group){
  const meshes=group.children,gs=new Set(meshes.map(m=>m.geometry));
  const size=g=>g.index.array.byteLength+Object.values(g.attributes).reduce((s,a)=>s+a.array.byteLength,0);
  return {meshes:meshes.length,materials:new Set(meshes.map(m=>m.material)).size,uniqueGeometries:gs.size,triangles:meshes.reduce((s,m)=>s+m.geometry.index.count/3,0),uniqueBufferBytes:[...gs].reduce((s,g)=>s+size(g),0),perMeshBufferBytes:meshes.reduce((s,m)=>s+size(m.geometry),0)};
}

// Independent reference computes every source indexed corner directly in world
// coordinates. It does not call the batching transform or concatenate helper.
export function inspectBatch(source,batch){
  source.updateWorldMatrix(true,true);batch.group.updateMatrixWorld(true);
  const rows=[],seen=new Set();let totalCorners=0,maxPositionMm=0,maxNormalError=0,otherMismatch=0,indexMismatch=0,materialMismatch=0;
  for(const range of batch.manifest.parts){
    const original=source.getObjectByName(range.id),target=batch.group.getObjectByName(range.bucketId),g=original.geometry,b=target.geometry,nm=new Matrix3().getNormalMatrix(original.matrixWorld),bm=new Matrix3().getNormalMatrix(target.matrixWorld);
    if(seen.has(range.id))throw new Error('duplicate manifest ID');seen.add(range.id);
    let positionMm=0,normalError=0,other=0,index=0;
    for(let j=0;j<g.index.count;j++){
      const si=g.index.getX(j),ti=b.index.getX(range.firstIndex+j);if(ti!==si+range.firstVertex)index++;
      const p=new Vector3().fromBufferAttribute(g.attributes.position,si).applyMatrix4(original.matrixWorld),q=new Vector3().fromBufferAttribute(b.attributes.position,ti).applyMatrix4(target.matrixWorld);
      positionMm=Math.max(positionMm,p.distanceTo(q)*1000);
      const n=new Vector3().fromBufferAttribute(g.attributes.normal,si).applyNormalMatrix(nm),v=new Vector3().fromBufferAttribute(b.attributes.normal,ti).applyNormalMatrix(bm);
      normalError=Math.max(normalError,n.distanceTo(v));
      for(const [name,a] of Object.entries(g.attributes)){
        if(name==='position'||name==='normal')continue;
        const z=b.attributes[name];if(!z||z.itemSize!==a.itemSize||z.normalized!==a.normalized||z.array.constructor!==a.array.constructor){other++;continue;}
        for(let k=0;k<a.itemSize;k++)if(a.array[si*a.itemSize+k]!==z.array[ti*z.itemSize+k])other++;
      }
    }
    const materialEqual=materialRenderKey(original.material)===materialRenderKey(target.material);if(!materialEqual)materialMismatch++;
    totalCorners+=g.index.count;maxPositionMm=Math.max(maxPositionMm,positionMm);maxNormalError=Math.max(maxNormalError,normalError);otherMismatch+=other;indexMismatch+=index;
    rows.push({id:range.id,bucketId:range.bucketId,corners:g.index.count,maxPositionMm:positionMm,maxNormalError:normalError,otherAttributeMismatch:other,indexMismatch:index,materialEqual,sourceMatrixPreserved:JSON.stringify(range.sourceWorldMatrix)===JSON.stringify(original.matrixWorld.toArray())});
  }
  return {source:geometryCounts(source),batch:geometryCounts(batch.group),parts:rows,partCount:seen.size,totalCorners,maxPositionMm,maxNormalError,otherAttributeMismatch:otherMismatch,indexMismatch,materialMismatch,
    limitations:'Native CPU attribute/corner equivalence only; Float32 world baking adds measured rounding. Coarser per-bucket culling and static per-part state remain explicit tradeoffs; no WebGL measurements.'};
}
