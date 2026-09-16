import * as T from 'three';
import { houseFoundation } from './architecture-grounding.js';

function geometry(triangles,role) {
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(triangles.flat(2),3));
  const p=g.attributes.position,uv=[];for(let i=0;i<p.count;i++)uv.push(p.getX(i),p.getY(i));
  g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();g.userData.contactRole=role;return g;
}
function perimeter(width,depth,step) {
  const corners=[[-width/2,-depth/2],[width/2,-depth/2],[width/2,depth/2],[-width/2,depth/2]],points=[];
  for(let i=0;i<4;i++){const a=corners[i],b=corners[(i+1)%4],count=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/step);for(let j=0;j<count;j++){const t=j/count;points.push([a[0]*(1-t)+b[0]*t,a[1]*(1-t)+b[1]*t]);}}
  return points;
}
// A continuous stone plinth replaces the old flat half-metre slab. The visible
// upper house stays fixed; uphill soil meets stone below its local coping edge.
export function houseFootingGeometry(floorAt) {
  const bottom=houseFoundation(floorAt),ring=bottom,top=bottom.map(([x,y,z])=>[x,Math.abs(z-2.4)<1e-6&&Math.abs(x)<=.72?.12:Math.max(.5,y+.3),z]);
  const bc=[0,Math.min(...bottom.map(p=>p[1]),floorAt(0,0)-.12),0],tc=[0,Math.max(...top.map(p=>p[1])),0],faces=[];
  for(let i=0;i<ring.length;i++){const j=(i+1)%ring.length;faces.push([bottom[i],top[i],bottom[j]],[bottom[j],top[i],top[j]],[bc,bottom[i],bottom[j]],[tc,top[j],top[i]]);}
  const g=geometry(faces,'house-foundation');g.userData.contactRing=bottom;g.userData.copingRing=top;return g;
}
// The ramp samples the existing gameplay floor, including its terrain maximum.
// Boundary heights use the inside limit of the strict walkable footprint.
export function bridgeRampGeometry(bridge,side,floorAt) {
  const nx=8,nz=4,top=[],bottom=[],faces=[];
  for(let i=0;i<=nx;i++)for(let j=0;j<=nz;j++){
    const dx=13.5+i/nx*8,dz=-2.65+j/nz*5.3,x=bridge.x+side*dx,z=bridge.z+dz;
    const y=floorAt(bridge.x+side*Math.min(dx,21.5-1e-6),bridge.z+Math.max(-2.65+1e-6,Math.min(2.65-1e-6,dz)));
    top.push([x,y,z]);bottom.push([x,y-.16,z]);
  }
  const tri=(a,b,c)=>side<0?[a,c,b]:[a,b,c];
  for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){const a=i*(nz+1)+j,b=a+nz+1;faces.push(tri(top[a],top[a+1],top[b]),tri(top[a+1],top[b+1],top[b]),tri(bottom[a],bottom[b],bottom[a+1]),tri(bottom[a+1],bottom[b],bottom[b+1]));}
  const ring=[];for(let i=0;i<=nx;i++)ring.push(i*(nz+1));for(let j=1;j<=nz;j++)ring.push(nx*(nz+1)+j);for(let i=nx-1;i>=0;i--)ring.push(i*(nz+1)+nz);for(let j=nz-1;j>0;j--)ring.push(j);
  for(let i=0;i<ring.length;i++){const a=ring[i],b=ring[(i+1)%ring.length];faces.push(tri(bottom[a],top[a],bottom[b]),tri(bottom[b],top[a],top[b]));}
  const g=geometry(faces,'bridge-ramp');g.userData.bridge={x:bridge.x,z:bridge.z,side};return g;
}
export function bridgePierGeometry(x,z,top,floorAt) {
  const ring=perimeter(.38,.38,1),bottom=ring.map(([dx,dz])=>[x+dx,floorAt(x+dx,z+dz)-.12,z+dz]),upper=ring.map(([dx,dz])=>[x+dx,top,z+dz]),faces=[];
  faces.push([bottom[0],bottom[1],bottom[2]],[bottom[0],bottom[2],bottom[3]],[upper[0],upper[2],upper[1]],[upper[0],upper[3],upper[2]]);
  for(let i=0;i<4;i++){const j=(i+1)%4;faces.push([bottom[i],upper[i],bottom[j]],[bottom[j],upper[i],upper[j]]);}
  const g=geometry(faces,'bridge-pier');g.userData.contactRing=bottom;g.userData.supportTop=top;return g;
}
