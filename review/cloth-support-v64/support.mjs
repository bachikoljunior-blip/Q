// One alternative: 3 supports per transverse row (51 nodes), 32 iterations.
// The unchanged 153-vertex surface is reconstructed from a quadratic displacement
// field, retaining each original row's residual rather than inventing a new mesh.
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
const basis=u=>[(1-u)*(1-2*u),4*u*(1-u),u*(2*u-1)];
export function createRowTopology(mesh){
  if(mesh.id!=='P01-R'||mesh.divisions[0]!==8||mesh.divisions[1]!==16)throw Error('fixed P01-R grid required');
  const sources=[],edges=[],bend=[],seen=new Set();
  const edge=(a,b)=>{const k=[a,b].sort((x,y)=>x-y).join(':');if(!seen.has(k)){seen.add(k);edges.push([a,b]);}};
  for(let j=0;j<17;j++){
    sources.push(j*9,j*9+4,j*9+8);
    edge(j*3,j*3+1);edge(j*3+1,j*3+2);bend.push([j*3,j*3+2]);
    if(j<16)for(let i=0;i<3;i++){edge(j*3+i,(j+1)*3+i);if(i<2)edge(j*3+i,(j+1)*3+i+1);}
    if(j<15)for(let i=0;i<3;i++)bend.push([j*3+i,(j+2)*3+i]);
  }
  return {sources,edges,bend,basis:Array.from({length:9},(_,i)=>basis(i/8)),pins:[48,49,50],originalPins:[...mesh.boundary.top.vertices]};
}
export function supportRows(topology,posed,{height=()=>0,iterations=32,clearance=.003}={}){
  if(posed.length!==153||!posed.flat().every(Number.isFinite))throw Error('finite P01 positions required');
  if(iterations!==32)throw Error('single fixed 32-iteration candidate');
  let queries=0;const ground=(x,z)=>{queries++;return height(x,z);};
  let min=Infinity;for(const p of posed)min=Math.min(min,p[1]-ground(p[0],p[2]));
  if(min>=clearance)return {positions:posed.map(p=>[...p]),active:false,iterations:0,heightQueries:queries,supportNodes:51,pinnedBelowFloor:[],maxPinResidual:0};
  const rest=topology.sources.map(i=>posed[i]),q=rest.map(p=>[...p]);
  const links=[...topology.edges.map(ids=>({ids,rest:distance(rest[ids[0]],rest[ids[1]]),strength:1})),
    ...topology.bend.map(ids=>({ids,rest:distance(rest[ids[0]],rest[ids[1]]),strength:.3}))];
  function reconstruct(row,i){
    const p=[...posed[row*9+i]],b=topology.basis[i];
    for(let k=0;k<3;k++)for(let a=0;a<3;a++)p[k]+=b[a]*(q[row*3+a][k]-rest[row*3+a][k]);
    return p;
  }
  function contact(){
    // Evaluate every original free vertex, but update only its 3 row supports.
    // This is a constraint on the curve, not an individual vertex Y clamp.
    for(let row=0;row<16;row++)for(let i=0;i<9;i++){
      const p=reconstruct(row,i),gap=p[1]-ground(p[0],p[2]);if(gap>=clearance)continue;
      const e=.001,dx=(ground(p[0]+e,p[2])-ground(p[0]-e,p[2]))/(2*e),dz=(ground(p[0],p[2]+e)-ground(p[0],p[2]-e))/(2*e),len=Math.hypot(dx,1,dz),n=[-dx/len,1/len,-dz/len],b=topology.basis[i];
      const denominator=b.reduce((s,x)=>s+x*x,0),correction=(clearance-gap)*n[1]/denominator;
      for(let a=0;a<3;a++)for(let k=0;k<3;k++)q[row*3+a][k]+=n[k]*correction*b[a];
    }
  }
  for(let step=0;step<iterations;step++){
    for(let l=0;l<links.length;l++){
      const {ids:[a,b],rest:target,strength}=links[step%2?links.length-1-l:l],wa=a>=48?0:1,wb=b>=48?0:1;if(!wa&&!wb)continue;
      const p=q[a],r=q[b],length=distance(p,r);if(length<1e-12)continue;
      const amount=(length-target)/length*strength/(wa+wb);
      for(let k=0;k<3;k++){const d=(r[k]-p[k])*amount;p[k]+=d*wa;r[k]-=d*wb;}
    }
    contact();
  }
  for(let i=0;i<8;i++)contact();
  const positions=posed.map((p,id)=>id>=144?[...p]:reconstruct(Math.floor(id/9),id%9));
  const pinnedBelowFloor=topology.originalPins.filter(i=>posed[i][1]-ground(posed[i][0],posed[i][2])<clearance);
  return {positions,active:true,iterations,heightQueries:queries,supportNodes:51,links:links.length,pinnedBelowFloor,maxPinResidual:0};
}
