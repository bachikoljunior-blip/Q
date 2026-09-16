import assert from'node:assert/strict';
import{readFile,writeFile}from'node:fs/promises';
import{createHash}from'node:crypto';
import{pathToFileURL}from'node:url';
const root=process.argv[2]||'/workspace/scratch/e72662e3b71f/Q-mira-micro-v63';
const out=new URL('./',import.meta.url),start=new Date().toISOString();
const src=root+'/review/staff-v63/staff-parts.mjs',before=await readFile(src),hash=x=>createHash('sha256').update(x).digest('hex');
const T=await import(pathToFileURL(root+'/node_modules/three/build/three.module.js'));
const {makeStaffLower,profiles,STAFF_SPEC,shaftRadius}=await import(pathToFileURL(src));
const g=makeStaffLower();g.updateMatrixWorld(true);
const exported=JSON.parse(await readFile(root+'/docs/evidence/mira-staff-v63/parts.json'));
const data=new Map(),solids=[];
for(const m of g.children){
 const p=m.geometry.attributes.position,n=m.geometry.attributes.normal,idx=m.geometry.index,uv=m.geometry.attributes.uv,e=exported.find(x=>x.id===m.name);
 for(const[k,a]of[['positions',p.array],['normals',n.array],['uv',uv.array],['indices',idx.array]])assert.deepEqual(Array.from(a),e[k]);
 const vs=Array.from({length:p.count},(_,i)=>new T.Vector3().fromBufferAttribute(p,i).multiplyScalar(1000)),vid=new Map(),w=vs.map(v=>{const key=v.toArray().map(x=>Object.is(x,-0)?0:x).join(':');if(!vid.has(key))vid.set(key,vid.size);return vid.get(key);}),edges=new Map(),tris=[];
 let volume6=0,minArea=Infinity,minDot=Infinity;
 for(let f=0;f<idx.count/3;f++){
  const ids=[0,1,2].map(k=>idx.getX(f*3+k)),v=ids.map(i=>vs[i]),tri=new T.Triangle(...v),normal=tri.getNormal(new T.Vector3()),area=tri.getArea(),c=tri.getMidpoint(new T.Vector3());
  volume6+=v[0].dot(new T.Vector3().crossVectors(v[1],v[2]));minArea=Math.min(minArea,area);for(const i of ids)minDot=Math.min(minDot,normal.dot(new T.Vector3().fromBufferAttribute(n,i)));
  for(let k=0;k<3;k++){const a=w[ids[k]],b=w[ids[(k+1)%3]],key=[Math.min(a,b),Math.max(a,b)].join(':');if(!edges.has(key))edges.set(key,[]);edges.get(key).push([a,b]);}
  const radial=(c.x*normal.x+c.z*normal.z)/(Math.hypot(c.x,c.z)||1);
  let tag=m.name.startsWith('S05')?(f>=640?'terminal':(['inside','edge-1','outside','edge-2'][Math.floor(f/2)%4])):Math.abs(normal.y)>.99?(normal.y>0?'up-face':'down-face'):radial>0?'outer-wall':'inner-wall';
  tris.push({f,v,tri,n:normal,area,box:new T.Box3().setFromPoints(v),tag});
 }
 const r={id:m.name,vertices:vs.length,welded:vid.size,triangles:tris.length,finite:vs.every(v=>v.toArray().every(Number.isFinite)),minAreaMm2:minArea,minNormalDot:minDot,signedVolumeMm3:volume6/6,openNonmanifold:[...edges.values()].filter(v=>v.length!==2).length,winding:[...edges.values()].filter(v=>v.length===2&&v[0][0]===v[1][0]).length,boundsMm:{min:[0,1,2].map(k=>Math.min(...vs.map(v=>v.getComponent(k)))),max:[0,1,2].map(k=>Math.max(...vs.map(v=>v.getComponent(k))))}};
 assert.ok(r.finite&&r.minAreaMm2>0&&r.minNormalDot>0&&r.signedVolumeMm3>0&&!r.openNonmanifold&&!r.winding);solids.push(r);data.set(m.name,{m,vs,tris});
}
// Independent segment/triangle intersections in mm, strict interiors. Small
// numerical contacts are retained and classified, not blanket-filtered away.
function hit(a,b,t){
 const d=b.clone().sub(a),L=d.length();if(L<1e-8)return null;
 const p=new T.Ray(a,d.divideScalar(L)).intersectTriangle(...t.v,false,new T.Vector3());if(!p)return null;
 const along=p.distanceTo(a);if(along<1e-7||along>L-1e-7)return null;
 const bc=t.tri.getBarycoord(p,new T.Vector3());return bc&&Math.min(bc.x,bc.y,bc.z)>1e-7?p:null;
}
const pairs=[],allHits=[];
const names=[...data.keys()];
for(let i=0;i<names.length;i++)for(let j=i;j<names.length;j++){
 const a=data.get(names[i]),b=data.get(names[j]),summary={a:names[i],b:names[j],pairs:0,classifications:{},samples:[]};
 for(let x=0;x<a.tris.length;x++)for(let y=i===j?x+1:0;y<b.tris.length;y++){
  const ta=a.tris[x],tb=b.tris[y];if(!ta.box.intersectsBox(tb.box))continue;const pts=[];
  for(let k=0;k<3;k++){const p=hit(ta.v[k],ta.v[(k+1)%3],tb),q=hit(tb.v[k],tb.v[(k+1)%3],ta);if(p)pts.push(p);if(q)pts.push(q);}
  if(!pts.length)continue;summary.pairs++;const key=ta.tag+' / '+tb.tag;summary.classifications[key]=(summary.classifications[key]||0)+1;
  for(const p of pts){const item={a:names[i],b:names[j],faceA:x,faceB:y,tagA:ta.tag,tagB:tb.tag,point:p.toArray(),r:Math.hypot(p.x,p.z)};allHits.push(item);if(summary.samples.length<3)summary.samples.push(item);}
 }
 pairs.push(summary);
}
const polygonRadius=(radius,angle)=>radius*Math.cos(Math.PI/16)/Math.cos(((angle%(2*Math.PI/16)+2*Math.PI/16)%(2*Math.PI/16))-Math.PI/16);
const sampleTri=t=>[...t.v,t.tri.getMidpoint(new T.Vector3()),...t.v.map((v,i)=>v.clone().add(t.v[(i+1)%3]).multiplyScalar(.5))];
const wrapChecks=[];
for(const name of['S05-A','S05-B']){
 const d=data.get(name);let minOuterGrip=Infinity,maxInnerGrip=-Infinity,minInnerGrip=Infinity;const collarMax={S17:-Infinity,S18:-Infinity};
 for(const t of d.tris)for(const p of sampleTri(t)){
  const r=Math.hypot(p.x,p.z),delta=r-polygonRadius(24,Math.atan2(p.z,p.x));
  if(t.tag==='outside')minOuterGrip=Math.min(minOuterGrip,delta);
  if(t.tag==='inside'){minInnerGrip=Math.min(minInnerGrip,delta);maxInnerGrip=Math.max(maxInnerGrip,delta);}
  for(const[id,lo,hi]of[['S17',1025,1035],['S18',1235,1245]])if(p.y>=lo&&p.y<=hi)collarMax[id]=Math.max(collarMax[id],r-polygonRadius(27.5,Math.atan2(p.z,p.x)));
 }
 wrapChecks.push({id:name,sampledOuterFaceMinimumAboveGripMm:minOuterGrip,sampledInnerMinusGripMm:[minInnerGrip,maxInnerGrip],sampledMaxBeyondCollarOuterMm:collarMax,scope:'actual vertices/centres/edge midpoints, not continuous global clearance proof'});
}
const crossingBounds=pairs.filter(x=>x.pairs).map(p=>{const hits=allHits.filter(h=>h.a===p.a&&h.b===p.b);return{a:p.a,b:p.b,pairs:p.pairs,classifications:p.classifications,y:[Math.min(...hits.map(x=>x.point[1])),Math.max(...hits.map(x=>x.point[1]))],r:[Math.min(...hits.map(x=>x.r)),Math.max(...hits.map(x=>x.r))]};});
const sameContact=allHits.filter(h=>h.a==='S01'&&h.b==='S04').map(h=>h.r-polygonRadius(shaftRadius(h.point[1]),Math.atan2(h.point[2],h.point[0])));
const interfaces={S06topMm:solids.find(s=>s.id==='S06').boundsMm.max[1],S15stemBottomMm:solids.find(s=>s.id==='S15').boundsMm.min[1],
 S01S02:{shaftBottomMm:solids.find(s=>s.id==='S01').boundsMm.min[1],ferruleInnerRadiusMm:18.5,radialDesignClearanceMm:[18.5-shaftRadius(55),18.5-shaftRadius(30)],axialOverlapMm:25,actualTouch:false,note:'socket clearance + insertion, no geometric wood-to-ferrule contact'},
 S01S03:{axialGapMm:solids.find(s=>s.id==='S01').boundsMm.min[1]-solids.find(s=>s.id==='S03').boundsMm.max[1],actualTouch:false},
 S01S06:{shaftTopMm:solids.find(s=>s.id==='S01').boundsMm.max[1],seatMm:1418,radialInnerClearanceMm:21.2-21,contact:'wood top annulus shares y1418 with socket underside, radii6.3..21'},
 S04S17S18:{gripEndMm:[1030,1240],retainerSeatsMm:[1030,1240],radialContactBandMm:[23.8,24],contact:'coincident annulus at each end, not full grip annular cross-section'},
 S01S04numericalCrossingRadiusResidualMm:sameContact.length?[Math.min(...sameContact),Math.max(...sameContact)]:[]};
assert.ok(Math.abs(interfaces.S06topMm-1423)<.0002&&Math.abs(interfaces.S15stemBottomMm-1674)<.0002);
assert.equal(hash(before),hash(await readFile(src)));
const files=[src,root+'/docs/evidence/mira-staff-v63/native-report.json',root+'/docs/evidence/mira-staff-v63/parts.json',root+'/scripts/export-mira-staff-v63.mjs'];
const sources=[];for(const path of files){const b=await readFile(path);sources.push({path,bytes:b.length,sha256:hash(b)});}
const report={start,finish:new Date().toISOString(),sources,solids,interfaces,wrapChecks,crossingBounds,pairs,limits:['native Three CPU only','hand/skeleton not included','S07-S14/S16 excluded, so no final lantern joint certification','coplanar overlaps not returned by strict crossings','sampling is not continuous nonpenetration proof','geometry contact is distinct from physical adhesive/fastener design','no rendered or aesthetic acceptance']};
await writeFile(new URL('native-review.json',out),JSON.stringify(report,null,2)+'\n');
await writeFile(new URL('crossing-points.json',out),JSON.stringify(allHits)+'\n');
await writeFile(new URL('native-snapshot.json',out),JSON.stringify(exported)+'\n');
console.log(JSON.stringify({source:sources[0],solids:solids.length,interfaces,wrapChecks,crossingBounds,finish:report.finish},null,2));
