import {sub,cross,dot,length} from '../cloth-micro-v62/surfaces.mjs';
const unit=v=>v.map(x=>x/length(v));
export function metrics(m,positions=m.positions,normals=m.normals){
 const edges=new Map(),uvAreas=[],areas=[],normalDots=[];
 for(const tri of m.indices){
  const[a,b,c]=tri,n=cross(sub(positions[b],positions[a]),sub(positions[c],positions[a]));areas.push(length(n)/2);
  for(const i of tri)normalDots.push(dot(unit(n),normals[i]));
  const q=sub(m.uvMetres[b],m.uvMetres[a]),r=sub(m.uvMetres[c],m.uvMetres[a]);uvAreas.push((q[0]*r[1]-q[1]*r[0])/2);
  for(let i=0;i<3;i++){let a=tri[i],b=tri[(i+1)%3],key=[Math.min(a,b),Math.max(a,b)].join(':');if(!edges.has(key))edges.set(key,[]);edges.get(key).push([a,b]);}
 }
 const lengths=[...edges.values()].map(e=>{const[a,b]=e[0];return length(sub(positions[a],positions[b]))/length(sub(m.positions[a],m.positions[b]));});
 const boundary=[...edges.entries()].filter(([,e])=>e.length===1),adj=new Map();
 for(const[,[[a,b]]]of boundary){for(const[v,w]of[[a,b],[b,a]]){if(!adj.has(v))adj.set(v,[]);adj.get(v).push(w);}}
 let components=0;const seen=new Set();for(const v of adj.keys()){if(seen.has(v))continue;components++;const stack=[v];while(stack.length){const n=stack.pop();if(seen.has(n))continue;seen.add(n);stack.push(...adj.get(n));}}
 return {vertices:positions.length,triangles:m.indices.length,finite:positions.flat().every(Number.isFinite)&&normals.flat().every(Number.isFinite),
  areaM2:areas.reduce((a,b)=>a+b,0),minTriangleAreaM2:Math.min(...areas),degenerate:areas.filter(a=>a<1e-12).length,
  minTriangleVertexNormalDot:Math.min(...normalDots),reversedAgainstVertexNormals:normalDots.filter(x=>x<=0).length,
  uv:{positive:uvAreas.filter(x=>x>0).length,negative:uvAreas.filter(x=>x<0).length,zero:uvAreas.filter(x=>Math.abs(x)<1e-14).length,minAbsArea:Math.min(...uvAreas.map(Math.abs))},
  edges:edges.size,boundaryEdges:boundary.length,boundaryComponents:components,boundaryDegreeNotTwo:[...adj.values()].filter(a=>a.length!==2).length,
  nonManifoldEdges:[...edges.values()].filter(e=>e.length>2).length,inconsistentWinding:[...edges.values()].filter(e=>e.length===2&&e[0][0]===e[1][0]).length,
  euler:positions.length-edges.size+m.indices.length,edgeRatio:{min:Math.min(...lengths),max:Math.max(...lengths)},minY:Math.min(...positions.map(p=>p[1])),
  volume:null,volumeReason:'open surface; enclosed volume is undefined'};
}
function segmentHit(p,q,a,b,c){
 const d=sub(q,p),e1=sub(b,a),e2=sub(c,a),h=cross(d,e2),det=dot(e1,h);if(Math.abs(det)<1e-12)return false;
 const s=sub(p,a),u=dot(s,h)/det;if(u<=1e-8||u>=1-1e-8)return false;
 const f=cross(s,e1),v=dot(d,f)/det;if(v<=1e-8||u+v>=1-1e-8)return false;
 const t=dot(e2,f)/det;return t>1e-8&&t<1-1e-8;
}
export function properCrossings(m,positions=m.positions){
 const bounds=m.indices.map(t=>[0,1,2].map(k=>[Math.min(...t.map(i=>positions[i][k])),Math.max(...t.map(i=>positions[i][k]))]));
 const pairs=[];
 for(let i=0;i<m.indices.length;i++)for(let j=i+1;j<m.indices.length;j++){
  const a=m.indices[i],b=m.indices[j];if(a.some(v=>b.includes(v)))continue;
  if(bounds[i].some(([lo,hi],k)=>hi<bounds[j][k][0]-1e-10||lo>bounds[j][k][1]+1e-10))continue;
  const ta=a.map(v=>positions[v]),tb=b.map(v=>positions[v]);
  if(ta.some((p,k)=>segmentHit(p,ta[(k+1)%3],...tb))||tb.some((p,k)=>segmentHit(p,tb[(k+1)%3],...ta)))pairs.push([i,j]);
 }
 return {properNonAdjacentTrianglePairs:pairs.length,pairs,scope:'strict segment/triangle interiors, shared-vertex pairs and coplanar overlap excluded'};
}
export function validateSeams(m){
 return m.seams.map(s=>{
  let positionGap=0,uvGap=0,wrongID=0,weightMismatch=0;
  for(let k=0;k<s.aLocal.length;k++){
   const a=m.pieces[s.a],b=m.pieces[s.b],i=s.aLocal[k],j=s.bLocal[k];
   positionGap=Math.max(positionGap,length(sub(a.positions[i],b.positions[j])));uvGap=Math.max(uvGap,length(sub(a.uvMetres[i],b.uvMetres[j])));
   wrongID+=a.globalVertexIDs[i]!==b.globalVertexIDs[j];weightMismatch+=JSON.stringify(a.skinWeights[i])!==JSON.stringify(b.skinWeights[j]);
  }
  return {id:s.id,vertices:s.aLocal.length,positionGap,uvGap,wrongID,weightMismatch};
 });
}
