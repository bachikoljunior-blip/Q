import {nativeTriangles,inspectSolid,properCrossings,ellipsoidClearance} from '../lantern-micro-v62/inspect-ribs.js';
import {Mesh} from 'three';
import {makeMiraMicroGeometry,MICRO_PARTS} from '../micro-v61/mira-micro-parts.js';

const area2=p=>p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a[0]*b[1]-b[0]*a[1];},0);
const cross=(a,b,p)=>(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]);
function clip(subject,clipper){
  if(area2(clipper)<0)clipper=[...clipper].reverse();let p=subject;
  for(let i=0;i<clipper.length&&p.length;i++){
    const a=clipper[i],b=clipper[(i+1)%clipper.length],next=[];
    for(let j=0;j<p.length;j++){const u=p[j],v=p[(j+1)%p.length],du=cross(a,b,u),dv=cross(a,b,v);if(du>=0)next.push(u);if((du>=0)!==(dv>=0)){const t=du/(du-dv);next.push([u[0]+(v[0]-u[0])*t,u[1]+(v[1]-u[1])*t]);}}
    p=next;
  }
  return p;
}
export function horizontalContact(up,down,y,{planeToleranceMm:tol=1e-5}={}){
  const allA=nativeTriangles(up),allB=nativeTriangles(down);
  const a=allA.filter(t=>t.normal.y>.99999&&t.v.every(p=>Math.abs(p.y-y)<tol));
  const b=allB.filter(t=>t.normal.y<-.99999&&t.v.every(p=>Math.abs(p.y-y)<tol));
  let contactArea=0;
  for(const x of a)for(const q of b){const poly=clip(x.v.map(v=>[v.x,v.z]),q.v.map(v=>[v.x,v.z]));if(poly.length>2)contactArea+=Math.abs(area2(poly))/2;}
  const levels=ts=>ts.flatMap(t=>t.v.map(p=>p.y));
  return {up:up.name,down:down.name,yMm:y,planeToleranceMm:tol,upLevelsMm:[...new Set(levels(a))],downLevelsMm:[...new Set(levels(b))],upAreaMm2:a.reduce((s,t)=>s+t.area,0),downAreaMm2:b.reduce((s,t)=>s+t.area,0),contactAreaMm2:contactArea,upFaces:a.length,downFaces:b.length};
}
export function sharedSurface(a,b){
  const key=t=>t.v.map(v=>v.toArray().map(x=>x.toFixed(5)).join(',')).sort().join('/');
  const trianglesA=nativeTriangles(a),map=new Map(trianglesA.map(t=>[key(t),t]));let count=0,area=0,maxNormalDot=-1;
  for(const t of nativeTriangles(b)){const q=map.get(key(t));if(q){count++;area+=t.area;maxNormalDot=Math.max(maxNormalDot,q.normal.dot(t.normal));}}
  return {a:a.name,b:b.name,coincidentTriangles:count,contactAreaMm2:area,maxNormalDot,positionToleranceMm:1e-5};
}
export function inspectHead(group){
  group.updateMatrixWorld(true);const by=id=>group.getObjectByName(id),contacts=[];
  for(const id of ['S09','S10','S11','S12']){contacts.push(horizontalContact(by(id),by('S13'),1662));contacts.push(horizontalContact(by('S08'),by(id),1447));}
  contacts.push(horizontalContact(by('S07'),by('S08'),1441),horizontalContact(by('S13'),by('S14'),1668),horizontalContact(by('S16'),by('S14'),1662));
  const crossings=[];for(let i=0;i<group.children.length;i++)for(let j=i;j<group.children.length;j++)crossings.push(properCrossings(group.children[i],group.children[j]));
  const old=new Mesh(makeMiraMicroGeometry('S14',{segments:16}));old.name='old S14 / original ellipsoid envelope';old.position.fromArray(MICRO_PARTS.S14.originMm.map(v=>v/1000));old.updateMatrixWorld(true);const oldEnvelope=ellipsoidClearance(old);old.geometry.dispose();
  const geometries=new Set(group.children.map(m=>m.geometry));
  return {parts:group.children.map(inspectSolid),horizontalContacts:contacts,glassCradle:sharedSurface(by('S07'),by('S16')),crossings,
    oldEnvelope,counts:{instances:group.children.length,uniqueGeometries:geometries.size,materials:new Set(group.children.map(m=>m.material)).size,triangles:group.children.reduce((s,m)=>s+m.geometry.index.count/3,0),uniqueBufferBytes:[...geometries].reduce((s,g)=>s+g.index.array.byteLength+Object.values(g.attributes).reduce((n,a)=>n+a.array.byteLength,0),0)},assembly:group.userData};
}
