import * as THREE from 'three';
import {makeWrap,STAFF_SPEC} from './staff-parts.mjs';

// A generated flat leather blank is the shape reference. Lengths below are
// authored from the constructed winding's discrete centreline, not image data.
// This is a registration map, not an inextensible cloth/fabrication solver.
export function makeWrapBlank(id,{steps=80}={}){
  const formed=makeWrap(id,{steps}),p=formed.attributes.position,uv=formed.attributes.uv;
  const rows=Array.from({length:steps+1},()=>new Map());
  for(let i=0;i<p.count;i++){
    const j=Math.round(uv.getY(i)*steps),v=[p.getX(i),p.getY(i),p.getZ(i)];
    rows[j].set(v.join(','),v);
  }
  const centres=rows.map(row=>{
    const vs=[...row.values()];return vs.reduce((a,v)=>a.map((n,k)=>n+v[k]/vs.length),[0,0,0]);
  });
  const arc=[0];for(let j=1;j<centres.length;j++)arc.push(arc[j-1]+Math.hypot(...centres[j].map((n,k)=>n-centres[j-1][k])));
  const radii=rows.map(row=>[...row.values()].map(v=>Math.hypot(v[0],v[2])));
  const flat=formed.clone(),fp=flat.attributes.position;
  for(let i=0;i<fp.count;i++){
    const j=Math.round(uv.getY(i)*steps),rs=radii[j],mid=(Math.min(...rs)+Math.max(...rs))/2;
    const layer=Math.hypot(p.getX(i),p.getZ(i))>mid?1:0;
    fp.setXYZ(i,(uv.getX(i)-.5)*STAFF_SPEC.wraps.width/1000,arc[j],layer*STAFF_SPEC.wraps.thickness/1000);
  }
  const idx=flat.index,a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3();let volume6=0;
  for(let k=0;k<idx.count;k+=3){a.fromBufferAttribute(fp,idx.getX(k));b.fromBufferAttribute(fp,idx.getX(k+1));c.fromBufferAttribute(fp,idx.getX(k+2));volume6+=a.dot(b.cross(c));}
  if(volume6<0)for(let k=0;k<idx.count;k+=3){const q=idx.getX(k+1);idx.setX(k+1,idx.getX(k+2));idx.setX(k+2,q);}
  flat.computeVertexNormals();flat.computeBoundingBox();flat.computeBoundingSphere();flat.name=id+' flat leather blank';
  let min=Infinity,max=0;const seen=new Set();
  for(let k=0;k<idx.count;k+=3)for(const [x,y]of [[0,1],[1,2],[2,0]]){
    const ia=idx.getX(k+x),ib=idx.getX(k+y),key=[ia,ib].sort((x,y)=>x-y).join(':');if(seen.has(key))continue;seen.add(key);
    const f=a.fromBufferAttribute(fp,ia).distanceTo(b.fromBufferAttribute(fp,ib));
    const t=a.fromBufferAttribute(p,ia).distanceTo(b.fromBufferAttribute(p,ib));
    if(f>1e-10){min=Math.min(min,t/f);max=Math.max(max,t/f);}
  }
  flat.userData={partId:id,lengthMm:arc.at(-1)*1000,widthMm:STAFF_SPEC.wraps.width,thicknessMm:STAFF_SPEC.wraps.thickness,
    formedEdgeRatio:[min,max],definition:'straight rectangular blank -> authored opposite-handed winding',
    physicalStrainAcceptance:false,gameImported:false};
  formed.dispose();return flat;
}
