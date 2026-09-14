import { WORLD_BOUNDS } from './world-regions.js';
// Static broad phase, shared by movement, visibility, arrows and camera probes.
// Arrays without an index remain supported for small or temporary fixtures.
const obstacleIndices=new WeakMap();
export function indexObstacles(obstacles,cellSize=16){
  const cells=new Map(),order=new Map(obstacles.map((o,i)=>[o,i]));
  for(const obstacle of obstacles){
    const minX=Math.floor((obstacle.x-obstacle.r)/cellSize),maxX=Math.floor((obstacle.x+obstacle.r)/cellSize);
    const minZ=Math.floor((obstacle.z-obstacle.r)/cellSize),maxZ=Math.floor((obstacle.z+obstacle.r)/cellSize);
    for(let z=minZ;z<=maxZ;z++)for(let x=minX;x<=maxX;x++){
      const key=`${x},${z}`;let bucket=cells.get(key);if(!bucket){bucket=[];cells.set(key,bucket);}bucket.push(obstacle);
    }
  }
  obstacleIndices.set(obstacles,{cells,cellSize,order,count:obstacles.length});return obstacles;
}
export function queryObstacles(obstacles,minX,minZ,maxX=minX,maxZ=minZ){
  let index=obstacleIndices.get(obstacles);if(!index)return obstacles;
  if(index.count!==obstacles.length){indexObstacles(obstacles,index.cellSize);index=obstacleIndices.get(obstacles);}
  const {cells,cellSize}=index,left=Math.floor(minX/cellSize),right=Math.floor(maxX/cellSize),top=Math.floor(minZ/cellSize),bottom=Math.floor(maxZ/cellSize);
  if(left===right&&top===bottom)return cells.get(`${left},${top}`)||[];
  if((right-left+1)*(bottom-top+1)>4096)return obstacles;
  const found=new Set();for(let z=top;z<=bottom;z++)for(let x=left;x<=right;x++)for(const o of cells.get(`${x},${z}`)||[])found.add(o);
  return [...found].sort((a,b)=>index.order.get(a)-index.order.get(b));
}

// Shared horizontal collision for actors, melee visibility and camera probes.
export function segmentCircle(a, b, circle, padding = 0) {
  const dx = b.x - a.x, dz = b.z - a.z;
  const radius = circle.r + padding;
  const ox = a.x - circle.x, oz = a.z - circle.z;
  if (ox * ox + oz * oz <= radius * radius) return 0;
  const length2 = dx * dx + dz * dz;
  if (length2 < 1e-12) return null;
  const projection = ox * dx + oz * dz;
  const discriminant = projection * projection - length2 * (ox * ox + oz * oz - radius * radius);
  if (discriminant < 0) return null;
  const t = (-projection - Math.sqrt(discriminant)) / length2;
  return t >= 0 && t <= 1 ? t : null;
}

export function lineClear(a, b, obstacles, padding = 0) {
  return !queryObstacles(obstacles,Math.min(a.x,b.x)-padding,Math.min(a.z,b.z)-padding,Math.max(a.x,b.x)+padding,Math.max(a.z,b.z)+padding).some(o => segmentCircle(a, b, o, padding) !== null);
}

// Intersect a segment with the sides AND caps of an upright solid cylinder.
export function segmentCylinder(a, b, cylinder, padding = 0) {
  const dx=b.x-a.x,dz=b.z-a.z,dy=b.y-a.y;
  const ox=a.x-cylinder.x,oz=a.z-cylinder.z,r=cylinder.r+padding;
  const length2=dx*dx+dz*dz,c=ox*ox+oz*oz-r*r;
  let enter=0,exit=1;
  if(length2<1e-12){if(c>0)return null;}
  else{
    const projection=ox*dx+oz*dz,discriminant=projection*projection-length2*c;
    if(discriminant<0)return null;
    const root=Math.sqrt(discriminant);
    enter=Math.max(enter,(-projection-root)/length2);exit=Math.min(exit,(-projection+root)/length2);
  }
  const bottom=cylinder.y-padding,top=cylinder.y+cylinder.height+padding;
  if(Math.abs(dy)<1e-12){if(a.y<bottom||a.y>top)return null;}
  else{const t0=(bottom-a.y)/dy,t1=(top-a.y)/dy;enter=Math.max(enter,Math.min(t0,t1));exit=Math.min(exit,Math.max(t0,t1));}
  return enter<=exit&&enter>=0&&enter<=1?enter:null;
}

export function segmentTerrain(a,b,floorAt,padding=.1){
  const length=Math.hypot(b.x-a.x,b.y-a.y,b.z-a.z),steps=Math.max(1,Math.ceil(length/.2));
  for(let i=0;i<=steps;i++){
    const t=i/steps,x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t,z=a.z+(b.z-a.z)*t;
    if(y<floorAt(x,z)+padding){
      let low=Math.max(0,(i-1)/steps),high=t;
      for(let j=0;j<5;j++){const mid=(low+high)/2,mx=a.x+(b.x-a.x)*mid,mz=a.z+(b.z-a.z)*mid;
        if(a.y+(b.y-a.y)*mid<floorAt(mx,mz)+padding)high=mid;else low=mid;}
      return high;
    }
  }
  return null;
}

export function moveCircle(actor, dx, dz, obstacles, radius = .48) {
  // Substeps keep a fast roll from tunnelling through a small collider.
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / Math.max(.2, radius * .7)));
  for (let i = 0; i < steps; i++) {
    actor.x += dx / steps; actor.z += dz / steps;
    for (let pass = 0; pass < 3; pass++) {
      let overlap = false;
      for (const o of queryObstacles(obstacles,actor.x-radius,actor.z-radius,actor.x+radius,actor.z+radius)) {
        const x = actor.x - o.x, z = actor.z - o.z, d = Math.hypot(x, z), r = radius + o.r;
        if (d >= r) continue;
        const inverse = d > 1e-6 ? 1 / d : 0;
        actor.x = o.x + (inverse ? x * inverse : 1) * r;
        actor.z = o.z + (inverse ? z * inverse : 0) * r;
        overlap = true;
      }
      if (!overlap) break;
    }
    actor.x = Math.max(WORLD_BOUNDS.minX, Math.min(WORLD_BOUNDS.maxX, actor.x));
    actor.z = Math.max(WORLD_BOUNDS.minZ, Math.min(WORLD_BOUNDS.maxZ, actor.z));
  }
}

export function steerAround(actor, goal, obstacles, radius = .48) {
  const dx = goal.x - actor.x, dz = goal.z - actor.z, d = Math.hypot(dx, dz);
  if (d < .01) return { x: 0, z: 0 };
  const nx = dx / d, nz = dz / d;
  const probe = { x: actor.x + nx * Math.min(d, 5), z: actor.z + nz * Math.min(d, 5) };
  let nearest = null, first = Infinity;
  for (const o of queryObstacles(obstacles,Math.min(actor.x,probe.x)-radius-.4,Math.min(actor.z,probe.z)-radius-.4,Math.max(actor.x,probe.x)+radius+.4,Math.max(actor.z,probe.z)+radius+.4)) {
    const t = segmentCircle(actor, probe, o, radius + .4);
    if (t !== null && t < first) { nearest = o; first = t; }
  }
  if (!nearest) { actor.avoid = null; return { x: nx, z: nz }; }
  const ox = actor.x - nearest.x, oz = actor.z - nearest.z, od = Math.hypot(ox, oz) || 1;
  // Retain a side until clear instead of oscillating on a symmetric approach.
  if (actor.avoid?.obstacle !== nearest) {
    actor.avoid = { obstacle: nearest, side: nx * oz - nz * ox >= 0 ? 1 : -1 };
  }
  const side = actor.avoid.side, push = Math.max(0, (nearest.r + radius + 1.1 - od) * 1.5);
  const x = -oz / od * side + ox / od * push + nx * .25;
  const z = ox / od * side + oz / od * push + nz * .25;
  const length = Math.hypot(x, z) || 1;
  return { x: x / length, z: z / length };
}

export function cameraFraction(target, desired, obstacles, floorAt) {
  let fraction = 1;
  for (const o of queryObstacles(obstacles,Math.min(target.x,desired.x)-.35,Math.min(target.z,desired.z)-.35,Math.max(target.x,desired.x)+.35,Math.max(target.z,desired.z)+.35)) {
    const t = segmentCylinder(target,desired,{...o,y:floorAt(o.x,o.z),height:o.height??o.r*1.5},.35);
    if (t === null) continue;
    fraction = Math.min(fraction, Math.max(.05, t - .045));
  }
  const length = Math.hypot(desired.x - target.x, desired.y - target.y, desired.z - target.z);
  const steps = Math.max(1, Math.ceil(length / .3));
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    if (t >= fraction) break;
    const x = target.x + (desired.x - target.x) * t, z = target.z + (desired.z - target.z) * t;
    if (target.y + (desired.y - target.y) * t < floorAt(x, z) + .35) { fraction = Math.max(.05, (i - 1) / steps); break; }
  }
  return fraction;
}
