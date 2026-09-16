// P01-only isolated quasistatic support prototype; not imported by the game.
// Preserve the original net and chest attachment. Solve from each supplied pose,
// rather than storing integration history or inventing new character animation.
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
export function createSupportTopology(mesh){
  if(mesh.id!=='P01-R')throw Error('P01-R only');
  const [nu,nv]=mesh.divisions,edges=new Map(),bend=[];
  for(const tri of mesh.indices)for(let j=0;j<3;j++){
    const ids=[tri[j],tri[(j+1)%3]].sort((a,b)=>a-b);edges.set(ids.join(':'),ids);
  }
  for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){
    const a=j*(nu+1)+i;
    if(i+2<=nu)bend.push([a,a+2]);
    if(j+2<=nv)bend.push([a,a+2*(nu+1)]);
  }
  return {count:mesh.positions.length,edges:[...edges.values()],bend,pins:[...mesh.boundary.top.vertices],
    boundary:structuredClone(mesh.boundary),referenceDimensions:[nu,nv]};
}
export function supportSurface(topology,posed,{height=()=>0,normal,iterations=64,clearance=.003}={}){
  if(posed.length!==topology.count||!posed.flat().every(Number.isFinite))throw Error('finite posed P01 required');
  if(!Number.isInteger(iterations)||iterations<1||iterations>128)throw Error('bounded iteration count required');
  const points=posed.map(p=>[...p]),pinned=new Set(topology.pins);let calls=0;
  const ground=(x,z)=>{calls++;return height(x,z);};
  const sampleNormal=normal||((x,z)=>{
    const e=.001,dx=(ground(x+e,z)-ground(x-e,z))/(2*e),dz=(ground(x,z+e)-ground(x,z-e))/(2*e),l=Math.hypot(dx,1,dz);
    return [-dx/l,1/l,-dz/l];
  });
  let initialMinimum=Infinity;
  for(const p of points)initialMinimum=Math.min(initialMinimum,p[1]-ground(p[0],p[2]));
  // Preserve original free-standing shape and non-contact poses byte-for-byte.
  if(initialMinimum>=clearance)return {positions:points,active:false,iterations:0,heightQueries:calls,pinnedBelowFloor:[],maxPinResidual:0};
  const links=[...topology.edges.map(ids=>({ids,rest:distance(posed[ids[0]],posed[ids[1]]),stiffness:1})),
    ...topology.bend.map(ids=>({ids,rest:distance(posed[ids[0]],posed[ids[1]]),stiffness:.3}))];
  const pinnedBelowFloor=[];
  for(const i of topology.pins)if(points[i][1]-ground(points[i][0],points[i][2])<clearance)pinnedBelowFloor.push(i);
  function contact(){
    for(let i=0;i<points.length;i++)if(!pinned.has(i)){
      const p=points[i],h=ground(p[0],p[2]);const gap=p[1]-h;
      if(gap<clearance){
        const n=sampleNormal(p[0],p[2]);
        if(!n.every(Number.isFinite)||n[1]<=0)throw Error('upward finite ground normal required');
        // For a graph y=h(x,z), gap*n.y is signed tangent-plane distance.
        const amount=(clearance-gap)*n[1];for(let k=0;k<3;k++)p[k]+=n[k]*amount;
      }
    }
  }
  for(let step=0;step<iterations;step++){
    // Alternate traversal to reduce a one-direction Gauss-Seidel bias.
    for(let q=0;q<links.length;q++){
      const {ids:[a,b],rest,stiffness}=links[step%2?links.length-1-q:q],wa=pinned.has(a)?0:1,wb=pinned.has(b)?0:1;
      if(!wa&&!wb)continue;
      const p=points[a],r=points[b],len=distance(p,r);if(len<1e-12)continue;
      const f=(len-rest)/len*stiffness/(wa+wb);
      for(let k=0;k<3;k++){const d=(r[k]-p[k])*f;p[k]+=d*wa;r[k]-=d*wb;}
    }
    contact();
  }
  // A small final nonlinear contact correction; pins are never projected.
  contact();contact();
  return {positions:points,active:true,iterations,heightQueries:calls,pinnedBelowFloor,maxPinResidual:Math.max(...topology.pins.map(i=>distance(points[i],posed[i])))};
}
