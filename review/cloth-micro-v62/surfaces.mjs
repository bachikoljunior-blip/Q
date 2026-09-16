// Isolated authoring prototypes. No imports from, or registration into, the game.
// Metres in the current NPC chest bind frame; root offset is (0, .985, 0).
export const FRAME = Object.freeze({right:'-X',left:'+X',front:'+Z',up:'+Y',rootOffset:Object.freeze([0,.985,0])});
const lerp=(a,b,t)=>a+(b-a)*t;
export const sub=(a,b)=>a.map((x,i)=>x-b[i]);
export const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
export const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export const length=a=>Math.hypot(...a);
const unit=a=>a.map(x=>x/length(a));
const basis=t=>[(1-t)**3,3*t*(1-t)**2,3*t*t*(1-t),t**3];
const derivative=t=>[-3*(1-t)**2,3*(1-t)*(1-3*t),3*t*(2-3*t),3*t*t];
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};

// These dimensions/control points are authored registrations, not PNG measurements.
// Each net is [v bottom -> top][u anatomical outside -> inside], four by four.
const torso=[
  {y:.035,w:.112,z:.143,bow:0},
  {y:.201666666667,w:.103,z:.153,bow:.012},
  {y:.368333333333,w:.145,z:.162,bow:.024},
  {y:.535,w:.133,z:.126,bow:0},
].map(r=>Array.from({length:4},(_,i)=>[lerp(-.006-r.w,-.006,i/3),r.y,r.z+(i===1||i===2?r.bow:0)]));
const sleeve=[
  {y:-.130,rx:.046,rz:.045,z:0},
  {y:-.066666666667,rx:.051,rz:.051,z:.004},
  {y:-.003333333333,rx:.057,rz:.058,z:.004},
  {y:.060,rx:.061,rz:.063,z:0},
].map(r=>[-1,-1,1,1].map((x,i)=>[-.313+x*r.rx,r.y,r.z+(i===1||i===2?4*r.rz/3:0)]));
const cape=[
  {y:-.670,w:.220,z:-.244,fold:.060},
  {y:-.303333333333,w:.203,z:-.235,fold:.060},
  {y:.063333333333,w:.158,z:-.224,fold:.060},
  {y:.430,w:.135,z:-.206,fold:.042},
].map(r=>Array.from({length:4},(_,i)=>[lerp(-.005-r.w,-.005,i/3),r.y,r.z-(i===1||i===2?r.fold:0)]));

export const PARTS=Object.freeze([
  {id:'T01-R',name:'front centre shallow panel',net:torso,divisions:[8,12],orientation:1,
   neighbours:{bottom:'WAIST / belt underlap',top:'T04-R / C01-R',outside:'T03-R / T05-R',inside:'FRONT-OPEN placket'},
   weightPolicy:'pelvis -> spine -> chest; provisional longitudinal transition; not animation approved'},
  {id:'S05-R',name:'front forearm open half-shell',net:sleeve,divisions:[12,8],orientation:1,
   neighbours:{bottom:'CUFF-R underlap',top:'S03-R / S04-R',outside:'S06-R outer edge',inside:'S06-R inner edge'},
   weightPolicy:'elbow-0 dominant; up to .2 arm-0 near top; hand-0 omitted until cuff seam is shared'},
  {id:'P01-R',name:'rear cape single rounded fold',net:cape,divisions:[8,16],orientation:-1,
   neighbours:{bottom:'HEM continuation unresolved',top:'P04-R',outside:'P02-R',inside:'P01-L / REAR-CENTRE'},
   weightPolicy:'chest=1 only as bind registration; free cloth deformation/support is unimplemented'},
]);

export function evaluate(part,u,v){
  const bu=basis(u),bv=basis(v),du=derivative(u),dv=derivative(v);
  const p=[0,0,0],a=[0,0,0],b=[0,0,0];
  for(let j=0;j<4;j++)for(let i=0;i<4;i++)for(let k=0;k<3;k++){
    const x=part.net[j][i][k];p[k]+=x*bu[i]*bv[j];a[k]+=x*du[i]*bv[j];b[k]+=x*bu[i]*dv[j];
  }
  return {position:p,normal:unit(cross(a,b).map(x=>x*part.orientation))};
}
function weights(part,v){
  if(part.id==='P01-R')return {chest:1};
  if(part.id==='S05-R'){const w=.2*smooth((v-.7)/.3);return {'elbow-0':1-w,...(w?{'arm-0':w}:{})};}
  if(v<.45){const w=smooth(v/.45);return {pelvis:1-w,spine:w};}
  const w=smooth((v-.45)/.55);return {spine:1-w,chest:w};
}
function arc(part,u,v,axis){
  // Numerical centreline arc metric. This chart is not a claim of a global isometry.
  let total=0,prev=evaluate(part,axis==='u'?0:u,axis==='v'?0:v).position;
  const end=axis==='u'?u:v;
  for(let n=1;n<=48;n++){const t=end*n/48,p=evaluate(part,axis==='u'?t:u,axis==='v'?t:v).position;total+=length(sub(p,prev));prev=p;}
  return total;
}
export function buildPart(part){
  const [nu,nv]=part.divisions,positions=[],normals=[],uvMetres=[],skinWeights=[],parameters=[],indices=[];
  for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){
    const u=i/nu,v=j/nv,s=evaluate(part,u,v);positions.push(s.position);normals.push(s.normal);parameters.push([u,v]);
    uvMetres.push([arc(part,u,v,'u'),arc(part,.5,v,'v')]);skinWeights.push(weights(part,v));
  }
  for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){
    const a=j*(nu+1)+i,b=a+1,c=a+nu+1,d=c+1;
    indices.push(...(part.orientation>0?[[a,b,d],[a,d,c]]:[[a,d,b],[a,c,d]]));
  }
  const boundary={
    bottom:{controls:part.net[0],vertices:Array.from({length:nu+1},(_,i)=>i)},
    top:{controls:part.net[3],vertices:Array.from({length:nu+1},(_,i)=>nv*(nu+1)+i)},
    outside:{controls:part.net.map(r=>r[0]),vertices:Array.from({length:nv+1},(_,j)=>j*(nu+1))},
    inside:{controls:part.net.map(r=>r[3]),vertices:Array.from({length:nv+1},(_,j)=>j*(nu+1)+nu)},
  };
  for(const [name,e]of Object.entries(boundary))Object.assign(e,{controls:structuredClone(e.controls),edgeID:`${part.id}:${name}`,neighbour:part.neighbours[name],weldedToNeighbour:false,uvContinuityWithNeighbour:'unimplemented',normalContinuityWithNeighbour:'unimplemented'});
  return {id:part.id,name:part.name,frame:FRAME,controlNet:structuredClone(part.net),divisions:[nu,nv],positions,normals,parameters,uvMetres,skinWeights,indices,boundary,weightPolicy:part.weightPolicy,thicknessMetres:0,closed:false};
}
export function toOBJ(mesh,{rootFrame=false}={}){
  const lines=[`# ${mesh.id} open surface prototype; metres; no material; not a finished garment`,`# Anatomical Right=-X; front=+Z; UV values are metres, not a texture atlas.`,`o ${mesh.id}`];
  for(const p of mesh.positions)lines.push('v '+p.map((x,k)=>x+(rootFrame?FRAME.rootOffset[k]:0)).map(x=>x.toFixed(10)).join(' '));
  for(const uv of mesh.uvMetres)lines.push('vt '+uv.map(x=>x.toFixed(10)).join(' '));
  for(const n of mesh.normals)lines.push('vn '+n.map(x=>x.toFixed(10)).join(' '));
  for(const t of mesh.indices)lines.push('f '+t.map(i=>`${i+1}/${i+1}/${i+1}`).join(' '));
  return lines.join('\n')+'\n';
}
