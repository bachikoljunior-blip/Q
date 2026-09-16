// Shared, DOM-free support layout. Upper joints and horizontal colliders retain
// their authored positions; only their missing ground contact and vertical bounds
// change. The small buried overlap covers interpolation of the visible terrain.
export const FOUNDATION_OVERLAP = .12;
function contour(width, depth, tower) {
  if (tower) {
    const points=[];
    for(let i=0;i<8;i++)for(let j=0;j<9;j++) {
      const a=i*Math.PI/4,b=(i+1)*Math.PI/4,t=j/9;
      points.push([5*(Math.sin(a)*(1-t)+Math.sin(b)*t),5*(Math.cos(a)*(1-t)+Math.cos(b)*t)]);
    }
    return points;
  }
  const x=width/2,z=depth/2,b=Math.min(width,depth)*.07;
  const corners=[[-x+b,-z],[x-b,-z],[x,-z+b],[x,z-b],[x-b,z],[-x+b,z],[-x,z-b],[-x,-z+b]],points=[];
  for(let i=0;i<8;i++)for(let j=0,n=i%2?1:3;j<n;j++) {
    const a=corners[i],c=corners[(i+1)%8],t=j/n;
    points.push([a[0]*(1-t)+c[0]*t,a[1]*(1-t)+c[1]*t]);
  }
  return points;
}
export function landmarkSupports(places, floorAt) {
  const result=[];
  for(const place of places.filter(p=>p.type!=='camp')) {
    const boss=place.type==='boss',anchor=floorAt(place.x,place.z);
    const add=(x,z,r,height,kind,width,depth,extraTop=0)=>{
      const tower=kind==='tower',top=anchor+height;
      const perimeter=contour(width,depth,tower).map(([dx,dz])=>({x:dx,z:dz,y:floorAt(x+dx,z+dz)-FOUNDATION_OVERLAP}));
      const y=Math.min(...perimeter.map(p=>p.y),floorAt(x,z)-FOUNDATION_OVERLAP);
      result.push({x,z,r,height:top+extraTop-y,y,type:tower?'tower':'pillar',architecture:{place:place.id,kind,top,perimeter}});
    };
    const count=boss?10:6,radius=boss?13:7;
    for(let i=0;i<count;i++) {const a=i/count*Math.PI*2,h=boss?14:i%3===0?7:4.4;add(place.x+Math.cos(a)*radius,place.z+Math.sin(a)*radius,.96,h,'column',1.35,1.35,i%2===0?2.7:.6);}
    for(const side of[-1,1])add(place.x+side*(boss?9:5),place.z-(boss?9:5),boss?1.25:1,boss?13:6,'arch-post',boss?1.9:1.3,1.7);
    if(place.id==='ruins')add(place.x-13,place.z-9,5,16.5,'tower',10,10,.3);
  }
  return result;
}

// The four existing houses use the same lower contour for mesh and vertical ray bounds.
export function houseFoundation(floorAt) {
  const corners=[[-2.85,-2.4],[2.85,-2.4],[2.85,2.4],[-2.85,2.4]],ring=[];
  for(let i=0;i<4;i++){const a=corners[i],b=corners[(i+1)%4],n=i%2?10:12;for(let j=0;j<n;j++){const t=j/n;ring.push([a[0]*(1-t)+b[0]*t,a[1]*(1-t)+b[1]*t]);}}
  for(const x of[.72,-.72]){const i=ring.findIndex((p,i)=>Math.abs(p[1]-2.4)<1e-6&&p[0]>x&&ring[(i+1)%ring.length][0]<x);ring.splice(i+1,0,[x,2.4]);}
  return ring.map(([x,z])=>[x,floorAt(x,z)-FOUNDATION_OVERLAP,z]);
}
