import * as THREE from 'three';
import {RIB_SPEC} from './mira-lantern-ribs.js';

const area2=p=>p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a[0]*b[1]-b[0]*a[1];},0);
const cross=(a,b,p)=>(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]);
function clipped(subject,clip){
  if(area2(clip)<0)clip=[...clip].reverse();
  let points=subject;
  for(let i=0;i<clip.length&&points.length;i++){
    const a=clip[i],b=clip[(i+1)%clip.length],out=[];
    for(let j=0;j<points.length;j++){
      const p=points[j],q=points[(j+1)%points.length],dp=cross(a,b,p),dq=cross(a,b,q);
      if(dp>=0)out.push(p);
      if((dp>=0)!==(dq>=0)){const t=dp/(dp-dq);out.push([p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t]);}
    }
    points=out;
  }
  return points;
}

export function nativeTriangles(mesh){
  const g=mesh.geometry,p=g.attributes.position,idx=g.index,vertices=Array.from({length:p.count},(_,i)=>new THREE.Vector3().fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld).multiplyScalar(1000));
  return Array.from({length:idx.count/3},(_,i)=>{
    const ids=[idx.getX(i*3),idx.getX(i*3+1),idx.getX(i*3+2)],v=ids.map(j=>vertices[j]);
    const tri=new THREE.Triangle(...v),normal=tri.getNormal(new THREE.Vector3());
    return {ids,v,tri,normal,box:new THREE.Box3().setFromPoints(v),area:tri.getArea()};
  });
}

export function inspectSolid(mesh){
  const g=mesh.geometry,p=g.attributes.position,n=g.attributes.normal,idx=g.index,edges=new Map();let volume6=0,minArea=Infinity,minNormalDot=Infinity,nonfinite=0;
  // Normal/UV creases duplicate attribute vertices. Solid topology uses exact
  // Float32 position identities, not these intentionally separate indices.
  const pointIds=new Map(),welded=Array.from({length:p.count},(_,i)=>{const key=[p.getX(i),p.getY(i),p.getZ(i)].join('/');if(!pointIds.has(key))pointIds.set(key,pointIds.size);return pointIds.get(key);});
  for(const value of [...p.array,...n.array,...g.attributes.uv.array])if(!Number.isFinite(value))nonfinite++;
  for(let k=0;k<idx.count;k+=3){
    const ids=[idx.getX(k),idx.getX(k+1),idx.getX(k+2)],v=ids.map(i=>new THREE.Vector3().fromBufferAttribute(p,i)),tri=new THREE.Triangle(...v),normal=tri.getNormal(new THREE.Vector3());
    minArea=Math.min(minArea,tri.getArea()*1e6);volume6+=v[0].dot(new THREE.Vector3().crossVectors(v[1],v[2]));
    for(const i of ids)minNormalDot=Math.min(minNormalDot,normal.dot(new THREE.Vector3().fromBufferAttribute(n,i)));
    for(let j=0;j<3;j++){const a=welded[ids[j]],b=welded[ids[(j+1)%3]],key=Math.min(a,b)+'/'+Math.max(a,b),old=edges.get(key)||{count:0,direction:0};old.count++;old.direction+=a<b?1:-1;edges.set(key,old);}
  }
  return {id:mesh.name,vertices:p.count,weldedPositions:pointIds.size,triangles:idx.count/3,bufferBytes:Object.values(g.attributes).reduce((s,a)=>s+a.array.byteLength,idx.array.byteLength),nonfinite,minAreaMm2:minArea,signedVolumeMm3:volume6/6*1e9,minVertexNormalFaceDot:minNormalDot,openOrNonmanifoldEdges:[...edges.values()].filter(e=>e.count!==2).length,badWindingEdges:[...edges.values()].filter(e=>e.direction!==0).length};
}

export function seatContact(rib,ring){
  const rt=nativeTriangles(rib),st=nativeTriangles(ring),tol=1e-5,y=RIB_SPEC.upperSeatY;
  const a=rt.filter(t=>t.normal.y>.999999&&t.v.every(p=>Math.abs(p.y-y)<tol));
  const b=st.filter(t=>t.normal.y<-.999999&&t.v.every(p=>Math.abs(p.y-y)<tol));
  const faceArea=a.reduce((s,t)=>s+t.area,0);let coveredArea=0;
  for(const t of a)for(const q of b){const polygon=clipped(t.v.map(p=>[p.x,p.z]),q.v.map(p=>[p.x,p.z]));if(polygon.length>2)coveredArea+=Math.abs(area2(polygon))/2;}
  const actualTopY=Math.max(...rt.flatMap(t=>t.v.map(p=>p.y))),actualRingBottomY=Math.min(...st.flatMap(t=>t.v.map(p=>p.y)));
  return {id:rib.name,ribPlanarFaces:a.length,ringSeatFaces:b.length,faceAreaMm2:faceArea,coveredAreaMm2:coveredArea,coverage:faceArea?coveredArea/faceArea:0,signedYGapMm:actualRingBottomY-actualTopY};
}

export function ellipsoidClearance(mesh){
  const e=RIB_SPEC.glowEnvelope,center=new THREE.Vector3(...e.center),scale=new THREE.Vector3(...e.radii),origin=new THREE.Vector3();let minimum=Infinity,face=-1,point;
  const triangles=nativeTriangles(mesh);
  for(let i=0;i<triangles.length;i++){
    const t=new THREE.Triangle(...triangles[i].v.map(p=>p.clone().sub(center).divide(scale))),q=t.closestPointToPoint(origin,new THREE.Vector3()),d=q.length();
    if(d<minimum){minimum=d;face=i;point=q.clone().multiply(scale).add(center).toArray();}
  }
  return {id:mesh.name,minNormalizedRadius:minimum,conservativeClearanceMm:(minimum-1)*Math.min(...e.radii),face,closestScaledMetricPointMm:point,method:'exact closest point to origin of each ellipsoid-scaled triangle; conservative world-distance lower bound, not actual S16 mesh'};
}

function properSegmentTriangle(a,b,t){
  const direction=b.clone().sub(a),length=direction.length(),hit=new THREE.Vector3();
  if(length<1e-8)return false;direction.divideScalar(length);
  if(!new THREE.Ray(a,direction).intersectTriangle(...t.v,false,hit))return false;
  const distance=hit.distanceTo(a);if(distance<1e-7||distance>length-1e-7)return false;
  const bary=t.tri.getBarycoord(hit,new THREE.Vector3());return bary&&Math.min(bary.x,bary.y,bary.z)>1e-7;
}

export function properCrossings(a,b=a){
  const aa=nativeTriangles(a),bb=a===b?aa:nativeTriangles(b);let pairs=0;
  for(let i=0;i<aa.length;i++)for(let j=a===b?i+1:0;j<bb.length;j++){
    const x=aa[i],y=bb[j];if(!x.box.intersectsBox(y.box))continue;
    let hit=false;
    for(let k=0;k<3&&!hit;k++)hit=properSegmentTriangle(x.v[k],x.v[(k+1)%3],y)||properSegmentTriangle(y.v[k],y.v[(k+1)%3],x);
    if(hit)pairs++;
  }
  return {a:a.name,b:b.name,properTrianglePairs:pairs,scope:'interior segment / interior triangle crossings; coplanar contacts measured separately by seat clipping'};
}

export function inspectLantern(group){
  group.updateMatrixWorld(true);const ribs=group.children.filter(m=>m.userData.type),ring=group.getObjectByName('S13'),unique=new Set(group.children.map(m=>m.geometry));
  const crossings=[];for(let i=0;i<group.children.length;i++)for(let j=i;j<group.children.length;j++)crossings.push(properCrossings(group.children[i],group.children[j]));
  return {parts:group.children.map(inspectSolid),seatContacts:ribs.map(r=>seatContact(r,ring)),glowEnvelope:ribs.map(ellipsoidClearance),crossings,counts:{instances:group.children.length,uniqueGeometries:unique.size,materials:new Set(group.children.map(m=>m.material)).size,triangles:group.children.reduce((s,m)=>s+m.geometry.index.count/3,0),uniqueBufferBytes:[...unique].reduce((s,g)=>s+g.index.array.byteLength+Object.values(g.attributes).reduce((a,p)=>a+p.array.byteLength,0),0)},assembly:group.userData};
}
