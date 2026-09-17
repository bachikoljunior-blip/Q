import {Group,Mesh,Material} from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {makeMiraStaff} from '../staff-v63/assembly.mjs';
import {disposeMiraLanternPartial} from '../lantern-micro-v62/mira-lantern-ribs.js';

const flagsOf=m=>({visible:m.visible,castShadow:m.castShadow,receiveShadow:m.receiveShadow,frustumCulled:m.frustumCulled,renderOrder:m.renderOrder,layerMask:m.layers.mask});
export const STAFF_BUCKET_PARTS=Object.freeze({wood:['S01'],leather:['S04','S05-A','S05-B'],bronze:['S02','S03','S06','S15','S17','S18','S09','S10','S11','S12','S13','S07','S14','S08'],glass:['S16']});
const bucketOf=id=>Object.keys(STAFF_BUCKET_PARTS).find(k=>STAFF_BUCKET_PARTS[k].includes(id));
export function materialRenderKey(material){
  if(material.onBeforeCompile!==Material.prototype.onBeforeCompile||material.customProgramCacheKey!==Material.prototype.customProgramCacheKey)throw new Error('Custom material hooks need their own batching contract');
  // This finite source has no texture ownership to transfer. Reject additions
  // rather than silently cloning a map while promising independent disposal.
  if(Object.values(material).some(v=>v?.isTexture))throw new Error('Textured material ownership is outside the current staff contract');
  if(material.clippingPlanes!==null||material.clipIntersection||material.clipShadows)throw new Error('Clipped material is outside the fixed staff contract');
  const json=material.toJSON();delete json.uuid;delete json.name;delete json.userData;delete json.metadata;
  const precise=Object.fromEntries(Object.entries(material).filter(([,v])=>v?.isColor||v?.isVector2||v?.isVector3||v?.isVector4||v?.isEuler).map(([k,v])=>[k,v.toArray()]));
  return JSON.stringify({json,defines:material.defines,precise});
}
const attributesOf=g=>Object.fromEntries(Object.entries(g.attributes).sort(([a],[b])=>a.localeCompare(b)).map(([name,a])=>[name,{itemSize:a.itemSize,normalized:a.normalized,type:a.array.constructor.name}]));
const bytesOf=g=>g.index.array.byteLength+Object.values(g.attributes).reduce((s,a)=>s+a.array.byteLength,0);

/** Static draw representation. Source meshes/materials remain borrowed and
 * untouched; source world transforms are baked into new Float32 attributes.
 * No per-part animation/visibility editing is supplied by this finite export. */
export function batchStaff(source){
  source.updateWorldMatrix(true,true);
  const definitions=new Map(),partIds=new Set();
  for(const mesh of source.children){
    const g=mesh.geometry;
    if(!mesh.isMesh||mesh.isSkinnedMesh||Array.isArray(mesh.material)||!g?.index||g.groups.length||Object.keys(g.morphAttributes).length||g.drawRange.start!==0||g.drawRange.count!==Infinity)throw new Error('Expected complete rigid indexed single-material staff parts');
    if(mesh.matrixWorld.determinant()<=0)throw new Error('Mirrored/singular transforms require a separate winding contract');
    if(partIds.has(mesh.name))throw new Error('Staff instance IDs must be unique');partIds.add(mesh.name);
    const id=bucketOf(mesh.name);if(!id)throw new Error('Unknown authored staff part ID');
    const renderKey=materialRenderKey(mesh.material),flags=flagsOf(mesh),attributes=attributesOf(g),key=JSON.stringify({renderKey,flags,attributes});
    if(!definitions.has(id))definitions.set(id,{id,key,material:mesh.material,renderKey,flags,attributes,parts:[]});
    if(definitions.get(id).key!==key)throw new Error(id+' render states or attribute layouts differ');
    definitions.get(id).parts.push(mesh);
  }
  if(partIds.size!==19)throw new Error('Expected all 19 staff instances');
  const group=new Group();group.name='Mira staff static material batches v64';group.visible=source.visible;group.renderOrder=source.renderOrder;group.layers.mask=source.layers.mask;
  const manifest={version:1,coordinateFrame:'source matrixWorld baked into attributes / metres',sourceWorldMatrix:source.matrixWorld.toArray(),staticOnly:true,gameImported:false,buckets:[],parts:[]};
  const ownedGeometries=[],ownedMaterials=[];let disposed=false;
  const dispose=()=>{if(disposed)return;disposed=true;for(const g of ownedGeometries)g.dispose();for(const m of ownedMaterials)m.dispose();group.clear();};
  try{
    for(const d of definitions.values()){
      const id=d.id,temporary=[],ranges=[];let firstIndex=0,firstVertex=0;
      let geometry;
      try{
        for(const mesh of d.parts){
          const copy=mesh.geometry.clone();temporary.push(copy);copy.applyMatrix4(mesh.matrixWorld);
          const range={id:mesh.name,partId:mesh.userData.partId??mesh.name,bucketId:id,firstIndex,indexCount:copy.index.count,firstVertex,vertexCount:copy.attributes.position.count,sourceWorldMatrix:mesh.matrixWorld.toArray(),sourceMaterialUUID:mesh.material.uuid,sourceMaterialName:mesh.material.name,sourceGeometryName:mesh.geometry.name,sourceUserData:structuredClone(mesh.userData)};
          ranges.push(range);firstIndex+=range.indexCount;firstVertex+=range.vertexCount;
        }
        geometry=mergeGeometries(temporary,false);
        if(!geometry)throw new Error('Staff attribute layouts could not be merged');
      }finally{for(const g of temporary)g.dispose();}
      ownedGeometries.push(geometry);geometry.name=id;geometry.computeBoundingBox();geometry.computeBoundingSphere();
      const material=d.material.clone();ownedMaterials.push(material);
      const mesh=new Mesh(geometry,material);mesh.name=id;Object.assign(mesh,d.flags);mesh.layers.mask=d.flags.layerMask;delete mesh.layerMask;
      mesh.userData={partRanges:ranges,sourceOnly:true};group.add(mesh);
      manifest.parts.push(...ranges);manifest.buckets.push({id,renderKey:d.renderKey,flags:d.flags,attributes:d.attributes,partIds:ranges.map(p=>p.id),triangles:geometry.index.count/3,bufferBytes:bytesOf(geometry),materialNames:[...new Set(d.parts.map(m=>m.material.name))],transmission:material.transmission??0,transparent:material.transparent});
    }
  }catch(error){dispose();throw error;}
  group.userData={sourceOnly:true,gameImported:false,staticOnly:true,manifest};group.updateMatrixWorld(true);
  return {group,manifest,dispose};
}

/** Convenience owner: discard temporary author meshes after independent batch
 * resources exist. The original precise constructors and exports are retained. */
export function makeMiraStaffBatch(){
  const source=makeMiraStaff();try{return batchStaff(source);}finally{disposeMiraLanternPartial(source);}
}
