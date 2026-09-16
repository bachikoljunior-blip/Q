import{PATCHES,evaluate,sub,dot,cross,length}from'./surfaces.mjs';
export function inspect(mesh){
 const edgeMap=new Map(),areas=[],agreement=[],uvArea=[];
 for(const t of mesh.indices){
  if(t.length!==3||t.some(i=>!Number.isInteger(i)||i<0||i>=mesh.positions.length))throw new Error('invalid triangle');
  const n=cross(sub(mesh.positions[t[1]],mesh.positions[t[0]]),sub(mesh.positions[t[2]],mesh.positions[t[0]])),a=length(n)/2;areas.push(a);
  agreement.push(...t.map(i=>dot(n,mesh.normals[i])/(2*a)));
  const u=sub(mesh.uv[t[1]],mesh.uv[t[0]]),v=sub(mesh.uv[t[2]],mesh.uv[t[0]]);uvArea.push((u[0]*v[1]-u[1]*v[0])/2);
  for(let j=0;j<3;j++){const a=t[j],b=t[(j+1)%3],key=[Math.min(a,b),Math.max(a,b)].join(':');if(!edgeMap.has(key))edgeMap.set(key,[]);edgeMap.get(key).push([a,b]);}
 }
 const boundary=[...edgeMap.values()].filter(e=>e.length===1).map(e=>e[0]),graph=new Map();
 for(const[a,b]of boundary){if(!graph.has(a))graph.set(a,[]);if(!graph.has(b))graph.set(b,[]);graph.get(a).push(b);graph.get(b).push(a);}
 let loops=0;const seen=new Set();for(const a of graph.keys())if(!seen.has(a)){loops++;const stack=[a];while(stack.length){const v=stack.pop();if(seen.has(v))continue;seen.add(v);stack.push(...graph.get(v));}}
 const seams=mesh.seams.map(s=>{let p=0,n=0,d=0,stored=0;for(let i=0;i<s.vertices.length;i++){
  const u=i/(s.vertices.length-1),a=evaluate(PATCHES[s.station-1],u,1),b=evaluate(PATCHES[s.station],u,0);
  p=Math.max(p,length(sub(a.position,b.position)));n=Math.max(n,length(sub(a.normal,b.normal)));d=Math.max(d,length(sub(a.dV,b.dV)));
  stored=Math.max(stored,length(sub(mesh.positions[s.vertices[i]],a.position)));
 }
 const sharedEdges=s.vertices.slice(1).map((v,i)=>edgeMap.get([Math.min(v,s.vertices[i]),Math.max(v,s.vertices[i])].join(':'))||[]);
 return{id:s.id,samples:s.vertices.length,positionErrorM:p,normalVectorError:n,longitudinalDerivativeErrorM:d,storedPositionErrorM:stored,allEdgesSharedByTwoFaces:sharedEdges.every(e=>e.length===2)};});
 return{vertices:mesh.positions.length,triangles:mesh.indices.length,finite:mesh.positions.flat().every(Number.isFinite)&&mesh.normals.flat().every(Number.isFinite),minTriangleAreaM2:Math.min(...areas),minFaceVertexNormalDot:Math.min(...agreement),minUvSignedArea:Math.min(...uvArea),
  maxNormalUnitError:Math.max(...mesh.normals.map(n=>Math.abs(length(n)-1))),nonManifoldEdges:[...edgeMap.values()].filter(e=>e.length>2).length,
  windingConflicts:[...edgeMap.values()].filter(e=>e.length===2&&e[0][0]===e[1][0]).length,boundaryEdges:boundary.length,boundaryLoops:loops,boundaryAllDegree2:[...graph.values()].every(v=>v.length===2),euler:mesh.positions.length-edgeMap.size+mesh.indices.length,seams};
}
export function assertAssembly(report){
 if(!report.finite||report.minTriangleAreaM2<=1e-12||report.minFaceVertexNormalDot<=0||report.minUvSignedArea<=0||report.maxNormalUnitError>1e-10)throw new Error('surface/normal/UV defect');
 if(report.nonManifoldEdges||report.windingConflicts||report.boundaryLoops!==1||!report.boundaryAllDegree2||report.euler!==1)throw new Error('topology defect');
 if(report.seams.some(s=>s.positionErrorM>1e-12||s.normalVectorError>1e-10||s.longitudinalDerivativeErrorM>1e-12||s.storedPositionErrorM>1e-12||!s.allEdgesSharedByTwoFaces))throw new Error('shared seam defect');
}
