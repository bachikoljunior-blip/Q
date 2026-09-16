import * as T from 'three';
import { heightAt, PLACES, riverX, clamp } from './core.js';
import { SALT_REACH } from './world-regions.js';

// The physics height field is the source of truth. A fixed 3.3 m grid missed the
// narrow summit at the watchtower by over a metre. Refine where interpolation
// needs it, retain exact landmark peaks, and stitch shared edges before emitting
// ONE indexed surface. This is static construction, never a per-frame remesh.
export const TERRAIN_SURFACE = Object.freeze({ minX:-510, maxX:330, minZ:-330, maxZ:330,
  cell:7.5, levels:4, tolerance:.045, normalStep:.06 });

function interpolate(x,z,a,b,c) {
  const determinant=(b.z-c.z)*(a.x-c.x)+(c.x-b.x)*(a.z-c.z);
  const u=((b.z-c.z)*(x-c.x)+(c.x-b.x)*(z-c.z))/determinant;
  const v=((c.z-a.z)*(x-c.x)+(a.x-c.x)*(z-c.z))/determinant;
  return u*a.y+v*b.y+(1-u-v)*c.y;
}
function fanHeight(x,z,center,corners) {
  for(let i=0;i<4;i++) {
    const a=corners[i],b=corners[(i+1)%4];
    // The four outward edge planes select their radial wedge.
    const ca=(a.x-center.x)*(z-center.z)-(a.z-center.z)*(x-center.x);
    const cb=(x-center.x)*(b.z-center.z)-(z-center.z)*(b.x-center.x);
    if(ca<=1e-10&&cb<=1e-10)return interpolate(x,z,center,a,b);
  }
  return center.y;
}
const point=(x,z)=>({x,z,y:heightAt(x,z)});
function centerFor(x0,z0,x1,z1) {
  const anchor=PLACES.find(p=>p.x>x0+.0001&&p.x<x1-.0001&&p.z>z0+.0001&&p.z<z1-.0001);
  return point(anchor?.x??(x0+x1)/2,anchor?.z??(z0+z1)/2);
}
function surfaceColor(x,z,y,color) {
  const path=Math.abs(x-7*Math.sin(z*.035))<3.8,grove=Math.hypot(x+104,z)<76;
  color.set(path?0xa89c75:grove?0x7b8258:z< -125?0x647671:0x879274);
  if(y>25)color.set(0x838d87);
  if(Math.abs(x-riverX(z))<14)color.set(0x818e7f);
  if(x<SALT_REACH.edgeX)color.lerp(new T.Color(0xb8ad8e),clamp((-x-260)/45,0,1));
  return color.multiplyScalar(.94+.09*Math.sin(x*.047+z*.029)*Math.cos(z*.063));
}
function normalAt(x,z) {
  const e=TERRAIN_SURFACE.normalStep;
  return new T.Vector3(heightAt(x-e,z)-heightAt(x+e,z),2*e,heightAt(x,z-e)-heightAt(x,z+e)).normalize();
}
const addEdge=(map,key,value)=>{if(!map.has(key))map.set(key,new Set());map.get(key).add(value);};
function between(sorted,min,max,reverse=false) {
  let low=0,high=sorted.length;
  while(low<high){const mid=(low+high)>>1;if(sorted[mid]<min)low=mid+1;else high=mid;}
  const result=[];for(let i=low;i<sorted.length&&sorted[i]<=max;i++)result.push(sorted[i]);
  return reverse?result.reverse():result;
}

export function createTerrainSurface() {
  const settings=TERRAIN_SURFACE,unit=settings.cell/2**settings.levels;
  const leaves=[],horizontal=new Map(),vertical=new Map();
  const world=(ix,iz)=>[settings.minX+ix*unit,settings.minZ+iz*unit];
  const refine=(ix,iz,size,level)=>{
    const [x0,z0]=world(ix,iz),[x1,z1]=world(ix+size,iz+size);
    const corners=[point(x0,z1),point(x1,z1),point(x1,z0),point(x0,z0)],center=centerFor(x0,z0,x1,z1);
    let error=0;
    // Includes the radial centre and edge quarter points; finer final sampling
    // is performed independently by the same-scene verification script.
    for(let a=0;a<=4;a++)for(let b=0;b<=4;b++) {
      const x=x0+(x1-x0)*a/4,z=z0+(z1-z0)*b/4;
      error=Math.max(error,Math.abs(heightAt(x,z)-fanHeight(x,z,center,corners)));
    }
    if(level<settings.levels&&error>settings.tolerance) {
      const half=size/2;
      for(const dz of[0,half])for(const dx of[0,half])refine(ix+dx,iz+dz,half,level+1);
      return;
    }
    leaves.push({ix,iz,size,center});
    for(const x of[ix,ix+size])for(const z of[iz,iz+size]){addEdge(horizontal,z,x);addEdge(vertical,x,z);}
  };
  const span=2**settings.levels;
  for(let z=0;z<(settings.maxZ-settings.minZ)/settings.cell;z++)
    for(let x=0;x<(settings.maxX-settings.minX)/settings.cell;x++)refine(x*span,z*span,span,0);
  // A landmark can lie ON a leaf edge (the haven is at x=0). Preserve that
  // exact height as a shared edge vertex instead of excluding it from both fans.
  for(const {ix,iz,size}of leaves)for(const p of PLACES) {
    const px=(p.x-settings.minX)/unit,pz=(p.z-settings.minZ)/unit;
    if(px>=ix&&px<=ix+size&&pz>=iz&&pz<=iz+size) {
      if(Math.abs(px-ix)<1e-9)addEdge(vertical,ix,pz);
      if(Math.abs(px-ix-size)<1e-9)addEdge(vertical,ix+size,pz);
      if(Math.abs(pz-iz)<1e-9)addEdge(horizontal,iz,px);
      if(Math.abs(pz-iz-size)<1e-9)addEdge(horizontal,iz+size,px);
    }
  }
  for(const map of[horizontal,vertical])for(const [key,value]of map)map.set(key,[...value].sort((a,b)=>a-b));
  const positions=[],normals=[],colors=[],indices=[],uv=[],vertices=new Map(),color=new T.Color();
  const vertex=(x,z)=>{
    const key=x+':'+z;if(vertices.has(key))return vertices.get(key);
    const index=positions.length/3,y=heightAt(x,z),normal=normalAt(x,z);
    positions.push(x,y,z);normals.push(normal.x,normal.y,normal.z);uv.push(x/20,z/20);
    surfaceColor(x,z,y,color);colors.push(color.r,color.g,color.b);vertices.set(key,index);return index;
  };
  for(const {ix,iz,size,center}of leaves) {
    const perimeter=[];
    // Every edge sees all adjacent leaf corners, so coarse/fine neighbours have
    // identical positions AND topology; there are no skirts or T-junctions.
    for(const x of between(horizontal.get(iz+size),ix,ix+size))perimeter.push(world(x,iz+size));
    for(const z of between(vertical.get(ix+size),iz,iz+size,true).slice(1))perimeter.push(world(ix+size,z));
    for(const x of between(horizontal.get(iz),ix,ix+size,true).slice(1))perimeter.push(world(x,iz));
    for(const z of between(vertical.get(ix),iz,iz+size).slice(1,-1))perimeter.push(world(ix,z));
    const c=vertex(center.x,center.z);
    for(let i=0;i<perimeter.length;i++)indices.push(c,vertex(...perimeter[i]),vertex(...perimeter[(i+1)%perimeter.length]));
  }
  const geometry=new T.BufferGeometry();
  geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  geometry.setAttribute('normal',new T.Float32BufferAttribute(normals,3));
  geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometry.setIndex(indices);
  geometry.computeBoundingBox();geometry.computeBoundingSphere();
  geometry.name='Q stitched contact terrain';
  geometry.userData={surface:'adaptive-height-field',leaves:leaves.length,...settings};
  return geometry;
}
