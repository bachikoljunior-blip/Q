// Authoring-only patches. The game never imports this module.
// Image proportions guide shape; these metre controls are authored, not image measurements.
import {PARTS,FRAME,buildPart,sub,cross,length} from '../cloth-micro-v62/surfaces.mjs';

const original=PARTS.find(p=>p.id==='P01-R');
const sideLimits=[[-.420,.010],[-.402,-.008],[-.355,-.040],[-.305,-.075]];
const side=original.net.map((r,j)=>{
  const edge=r[0],tangent=sub(r[1],edge),[x,z]=sideLimits[j];
  return [[x,edge[1],z],[(x+edge[0])/2-.035,edge[1],(z+edge[2])/2+.012],
    edge.map((v,k)=>v-tangent[k]),[...edge]];
});
const top=original.net[3],prior=original.net[2],rise=.090;
const shoulder=[structuredClone(top),top.map((p,i)=>p.map((v,k)=>v+(v-prior[i][k])*rise/1.1)),
  top.map((p,i)=>[p[0]*.98,.490,p[2]+.025]),
  top.map((p,i)=>[p[0]*.96,.520,-.150-(i===1||i===2?.028:0)])];
export const NEW_PARTS=Object.freeze([
  {id:'P02-R',name:'right rear-to-side cape panel',net:side,divisions:[8,16],orientation:-1,
   neighbours:{inside:'P01-R:outside',outside:'P03-R unbuilt',top:'P04 side subsection unbuilt',bottom:'HEM unbuilt'}},
  {id:'P04-RB',name:'right rear shoulder connector subsection',net:shoulder,divisions:[8,4],orientation:-1,
   neighbours:{bottom:'P01-R:top',top:'cowl connector unbuilt',inside:'rear centre unbuilt',outside:'P04 side subsection unbuilt'}},
]);
const unit=n=>n.map(x=>x/length(n));
function vertexNormals(positions,indices){
  const normals=positions.map(()=>[0,0,0]);
  for(const [a,b,c]of indices){const n=cross(sub(positions[b],positions[a]),sub(positions[c],positions[a]));for(const i of[a,b,c])for(let k=0;k<3;k++)normals[i][k]+=n[k];}
  return normals.map(unit);
}
export function buildAssembly(){
  const base=buildPart(original),pieces=[base,...NEW_PARTS.map(buildPart)];
  // Each new chart inherits its joining edge's exact UV. Away from it, only a local arc chart is claimed.
  const side=pieces[1],cap=pieces[2];
  for(let j=0;j<=16;j++)for(let i=0;i<=8;i++){
    const q=j*9+i,seam=j*9+8,baseUV=base.uvMetres[j*9];
    side.uvMetres[q]=[baseUV[0]-(side.uvMetres[seam][0]-side.uvMetres[q][0]),baseUV[1]];
  }
  for(let j=0;j<=4;j++)for(let i=0;i<=8;i++){
    const q=j*9+i,uv=base.uvMetres[144+i];cap.uvMetres[q]=[uv[0],uv[1]+cap.uvMetres[q][1]];
  }
  for(const p of pieces)p.skinWeights=p.positions.map(()=>({chest:1}));
  const positions=structuredClone(base.positions),uvMetres=structuredClone(base.uvMetres),skinWeights=structuredClone(base.skinWeights),indices=[],facePart=[],maps=[];
  for(let n=0;n<pieces.length;n++){
    const p=pieces[n],map=[];
    for(let q=0;q<p.positions.length;q++){
      const j=Math.floor(q/9),i=q%9;
      if(n===0)map[q]=q;
      else if(n===1&&i===8)map[q]=j*9;
      else if(n===2&&j===0)map[q]=144+i;
      else{map[q]=positions.length;positions.push([...p.positions[q]]);uvMetres.push([...p.uvMetres[q]]);skinWeights.push({...p.skinWeights[q]});}
    }
    maps.push(map);for(const tri of p.indices){indices.push(tri.map(i=>map[i]));facePart.push(p.id);}
  }
  const normals=vertexNormals(positions,indices);
  const seams=[{id:'P01-R:outside=P02-R:inside',a:0,b:1,aLocal:base.boundary.outside.vertices,bLocal:side.boundary.inside.vertices},
    {id:'P01-R:top=P04-RB:bottom',a:0,b:2,aLocal:base.boundary.top.vertices,bLocal:cap.boundary.bottom.vertices}];
  for(const s of seams)s.globalIDs=s.aLocal.map(i=>maps[s.a][i]);
  for(const [a,edge,b,other]of[[0,'outside',1,'inside'],[0,'top',2,'bottom']])for(const [p,e,q,f]of[[a,edge,b,other],[b,other,a,edge]]){
    Object.assign(pieces[p].boundary[e],{neighbour:`${pieces[q].id}:${f}`,weldedToNeighbour:true,uvContinuityWithNeighbour:'exact shared vertex attribute',normalContinuityWithNeighbour:'shared area-weighted vertex normal'});
  }
  return {id:'P01-P02-P04RB-right-join',frame:FRAME,positions,normals,uvMetres,skinWeights,indices,facePart,maps,seams,
    pieces:pieces.map((p,n)=>({...p,globalVertexIDs:maps[n],normals:maps[n].map(i=>normals[i])})),
    thicknessMetres:0,closed:false,weightPolicy:'chest=1 registration trial; no floor/body cloth support',
    unbuilt:['rear-centre 10mm to mirrored P01-L','P04 side section between P02 top and P04-RB outside','P03/front','cowl/hem/left assembly']};
}
