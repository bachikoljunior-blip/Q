// Authoring-only lower-face assembly. The game does not import this module.
// Authored metric registration, not a calibrated reconstruction of generated pixels.
export const FRAME=Object.freeze({units:'metres',bone:'head',front:'+Z',up:'+Y',anatomicalR:'-X',anatomicalL:'+X'});
export const IDS=Object.freeze(['F05-R','F07-R','F09-R','F11','F09-L','F07-L','F05-L']);
export const add=(a,b)=>a.map((x,k)=>x+b[k]);
export const sub=(a,b)=>a.map((x,k)=>x-b[k]);
export const mul=(a,s)=>a.map(x=>x*s);
export const dot=(a,b)=>a.reduce((s,x,k)=>s+x*b[k],0);
export const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export const length=a=>Math.hypot(...a);
const unit=a=>mul(a,1/length(a));
const mirror=p=>[-p[0],p[1],p[2]];
const basis=t=>[(1-t)**3,3*t*(1-t)**2,3*t*t*(1-t),t**3];
const deriv=t=>[-3*(1-t)**2,3*(1-t)*(1-3*t),3*t*(2-3*t),3*t*t];

// Each station runs inner facial boundary -> outer/underside boundary.
// The upper two stations describe cheek prominence -> submalar hollow;
// the third turns around the mandibular angle, the fourth frames chin side.
// Numeric coordinates are author decisions in the existing head bone frame.
const right=[
 [[-.039,.030,.116],[-.057,.031,.120],[-.085,.035,.110],[-.102,.034,.081]],
 [[-.039,-.008,.116],[-.057,-.008,.112],[-.083,-.006,.093],[-.100,-.003,.058]],
 [[-.036,-.047,.118],[-.056,-.049,.109],[-.086,-.054,.074],[-.094,-.060,.041]],
 [[-.026,-.057,.127],[-.030,-.069,.131],[-.033,-.086,.116],[-.034,-.094,.081]],
];
export const STATIONS=Object.freeze([...right,...[...right].reverse().map(row=>row.map(mirror))].map(row=>Object.freeze(row.map(p=>Object.freeze(p)))));
// One derivative per station, reused by BOTH adjoining patches. This fixes C1
// without averaging normals after independently sculpted surfaces have diverged.
export const TANGENTS=Object.freeze(STATIONS.map((row,j)=>Object.freeze(row.map((p,i)=>Object.freeze(
 j===0?sub(STATIONS[1][i],p):j===7?sub(p,STATIONS[6][i]):mul(sub(STATIONS[j+1][i],STATIONS[j-1][i]),.5)
)))));
export const PATCHES=Object.freeze(IDS.map((id,k)=>Object.freeze({id,stationRange:[k,k+1],
 net:Object.freeze([STATIONS[k],STATIONS[k].map((p,i)=>add(p,mul(TANGENTS[k][i],1/3))),STATIONS[k+1].map((p,i)=>sub(p,mul(TANGENTS[k+1][i],1/3))),STATIONS[k+1]].map(r=>Object.freeze(r.map(p=>Object.freeze([...p]))))),
 referenceRole:id.startsWith('F05')?'malar prominence':id.startsWith('F07')?'submalar hollow':id.startsWith('F09')?'mandibular turn':'central broad chin',
})));
export function evaluate(patch,u,v){
 const a=basis(u),b=basis(v),du=deriv(u),dv=deriv(v),position=[0,0,0],dU=[0,0,0],dV=[0,0,0];
 for(let j=0;j<4;j++)for(let i=0;i<4;i++)for(let k=0;k<3;k++){
  const q=patch.net[j][i][k];position[k]+=a[i]*b[j]*q;dU[k]+=du[i]*b[j]*q;dV[k]+=a[i]*dv[j]*q;
 }
 return {position,dU,dV,normal:unit(cross(dU,dV))};
}
export function buildAssembly({across=8,along=8}={}){
 if(!Number.isInteger(across)||!Number.isInteger(along)||across<2||along<2)throw new Error('integer subdivisions >= 2 required');
 const positions=[],normals=[],uv=[],parameters=[],weights=[],indices=[],faceParts=[],parts=[],seams=[];
 // Shared station rows use the SAME vertex indices, including position,
 // normal, chart coordinate, and head weight. No overlay or filler faces.
 for(let r=0;r<=7*along;r++)for(let i=0;i<=across;i++){
  const part=Math.min(6,Math.floor(r/along)),v=(r-part*along)/along,u=i/across,p=evaluate(PATCHES[part],u,v);
  positions.push(p.position);normals.push(p.normal);uv.push([u,r/(7*along)]);parameters.push([part,u,v]);weights.push({head:1});
 }
 for(let part=0;part<7;part++){
  const start=indices.length;
  for(let j=0;j<along;j++)for(let i=0;i<across;i++){
   const a=(part*along+j)*(across+1)+i,b=a+1,c=a+across+1,d=c+1;
   indices.push([a,b,d],[a,d,c]);faceParts.push(IDS[part],IDS[part]);
  }
  parts.push({id:IDS[part],firstTriangle:start,triangleCount:indices.length-start});
 }
 for(let station=1;station<7;station++)seams.push({id:`${IDS[station-1]}:${IDS[station]}`,station,
  from:IDS[station-1],to:IDS[station],vertices:Array.from({length:across+1},(_,i)=>station*along*(across+1)+i),
  controls:STATIONS[station].map(p=>[...p]),longitudinalDerivative:TANGENTS[station].map(p=>[...p]),welded:true});
 return {frame:FRAME,positions,normals,uv,parameters,weights,indices,faceParts,parts,seams,subdivisions:{across,along},
  boundaryPolicy:'open inner face, outer jaw/neck continuation, and two upper cheek cuts; none are welded to existing full head',
  uvPolicy:'continuous authored ribbon chart; no source skin atlas correspondence or texture assigned',
  thickness:0,closed:false,runtimeImports:0};
}
export function partMesh(mesh,id){
 const part=mesh.parts.find(p=>p.id===id);if(!part)throw new Error('unknown part');
 const used=[...new Set(mesh.indices.slice(part.firstTriangle,part.firstTriangle+part.triangleCount).flat())],map=new Map(used.map((i,j)=>[i,j]));
 return {id,positions:used.map(i=>mesh.positions[i]),normals:used.map(i=>mesh.normals[i]),uv:used.map(i=>mesh.uv[i]),indices:mesh.indices.slice(part.firstTriangle,part.firstTriangle+part.triangleCount).map(t=>t.map(i=>map.get(i))),globalVertices:used};
}
export function toOBJ(mesh,name='MiraLowerFace'){
 const lines=[`# ${name}: open authoring surface, head-local metres, NOT a complete or runtime face`,`o ${name}`];
 for(const p of mesh.positions)lines.push('v '+p.map(x=>x.toFixed(10)).join(' '));
 for(const p of mesh.uv)lines.push('vt '+p.map(x=>x.toFixed(10)).join(' '));
 for(const p of mesh.normals)lines.push('vn '+p.map(x=>x.toFixed(10)).join(' '));
 let group=null;for(let f=0;f<mesh.indices.length;f++){if(mesh.faceParts&&mesh.faceParts[f]!==group){group=mesh.faceParts[f];lines.push('g '+group);}lines.push('f '+mesh.indices[f].map(i=>`${i+1}/${i+1}/${i+1}`).join(' '));}
 return lines.join('\n')+'\n';
}
