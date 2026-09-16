import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {registerHooks} from 'node:module';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {performance} from 'node:perf_hooks';
const here=path.dirname(fileURLToPath(import.meta.url));
const repo='/workspace/scratch/e72662e3b71f/Q-mira-micro-v61';
const three='/workspace/scratch/e72662e3b71f/Q-ps4-v57/node_modules/three/build/three.module.js';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const git=(...args)=>execFileSync('git',args,{cwd:repo,encoding:'utf8'}).trim();
const source='review/micro-v61/mira-micro-parts.js';
const before=fs.readFileSync(path.join(repo,source));
const expected='84a7787bb459586304256198f73388207d4e4893ec3d6d6eea5bc63f62978f8c';
if(sha(before)!==expected)throw Error('Source changed');
const snapshot=path.join(here,'source-snapshot.mjs');
if(fs.existsSync(snapshot)&&!fs.readFileSync(snapshot).equals(before))throw Error('Refuse to overwrite different snapshot');
fs.writeFileSync(snapshot,before);
const cameraFiles=['src/scene.js','src/dialogue-camera.js'].map(p=>{const b=fs.readFileSync(path.join(repo,p));return {path:p,bytes:b.length,sha256:sha(b)};});
const record={capturedAt:new Date().toISOString(),repo,head:git('rev-parse','HEAD'),tree:git('rev-parse','HEAD^{tree}'),status:git('status','--short'),runtimeDiffFrom2bee:git('diff','--name-only','2bee64cff6482cb7770ba69e07673eefc8ad54ef','HEAD','--','src'),source:{path:source,bytes:before.length,sha256:sha(before)},cameraFiles,threeModule:{path:three,sha256:sha(fs.readFileSync(three))}};
fs.writeFileSync(path.join(here,'SOURCE.json'),JSON.stringify(record,null,2)+'\n');
registerHooks({resolve(specifier,context,next){return specifier==='three'?{url:pathToFileURL(three).href,shortCircuit:true}:next(specifier,context);}});
const THREE=await import('three');
const {makeMiraMicroGeometry,makeMiraMicroPair,MICRO_PARTS}=await import(pathToFileURL(snapshot));
const nativePair=makeMiraMicroPair(),material=nativePair.children[0].material;
const materialRecord={name:material.name,type:material.type,colorLinear:material.color.toArray(),metalness:material.metalness,roughness:material.roughness,sharedByBothOriginalParts:nativePair.children.every(x=>x.material===material)};
for(const m of nativePair.children)m.geometry.dispose();
const profiles=Object.fromEntries(Object.entries(MICRO_PARTS).map(([id,p])=>[id,{profileMm:p.profileMm,originMm:p.originMm,interfaces:p.interfaces}]));
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),sub=(a,b)=>a.map((v,i)=>v-b[i]),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],len=a=>Math.hypot(...a);
const area2=p=>Math.abs(p.reduce((a,v,i)=>a+v[0]*p[(i+1)%p.length][1]-v[1]*p[(i+1)%p.length][0],0))/2;
function polygon(g,profileRow,n){const p=g.getAttribute('position');return Array.from({length:n},(_,i)=>[p.getX(profileRow*n+i)*1000,p.getZ(profileRow*n+i)*1000]);}
function radial(p,theta){const ray=[Math.cos(theta),Math.sin(theta)];let nearest=Infinity;for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length],v=[b[0]-a[0],b[1]-a[1]],det=ray[0]*v[1]-ray[1]*v[0];if(Math.abs(det)<1e-12)continue;const t=(a[0]*v[1]-a[1]*v[0])/det,u=(a[0]*ray[1]-a[1]*ray[0])/det;if(t>=0&&u>=-1e-8&&u<=1+1e-8)nearest=Math.min(nearest,t);}return nearest;}
const geometryStart=performance.now(),cases=[],outerPolys={};
for(const n of [24,16,12,8]){
 const started=performance.now(),parts={},geometries={};let error=null;
 try{for(const id of ['S13','S14'])geometries[id]=makeMiraMicroGeometry(id,{segments:n});}catch(e){error={name:e.name,message:e.message};}
 if(error){cases.push({segments:n,guardAccepted:false,error});continue;}
 for(const [id,g] of Object.entries(geometries)){
  const p=g.getAttribute('position'),idx=g.index.array,positions=Array.from({length:p.count},(_,i)=>[p.getX(i)*1000,p.getY(i)*1000,p.getZ(i)*1000]);
  let volume=0,minArea=Infinity,degenerate=0;const edgeMap=new Map(),bores=[];
  for(let i=0;i<idx.length;i+=3){const ids=[idx[i],idx[i+1],idx[i+2]],v=ids.map(i=>positions[i]),normal=cross(sub(v[1],v[0]),sub(v[2],v[0])),area=len(normal)/2;minArea=Math.min(minArea,area);if(area<1e-8)degenerate++;volume+=dot(v[0],cross(v[1],v[2]))/6;
   for(let j=0;j<3;j++){const a=ids[j],b=ids[(j+1)%3],key=a<b?`${a}:${b}`:`${b}:${a}`;const item=edgeMap.get(key)||{count:0,orientation:0};item.count++;item.orientation+=a<b?1:-1;edgeMap.set(key,item);}
   if(id==='S14'&&v.every(q=>Math.abs(Math.hypot(q[0],q[2])-6.3)<1e-5)&&Math.abs(normal[1])<1e-7){bores.push(Math.abs(dot(normal,v[0]))/Math.hypot(normal[0],normal[2]));}
  }
  const outerRadius=Math.max(...MICRO_PARTS[id].profileMm.map(p=>p[0])),row=MICRO_PARTS[id].profileMm.findIndex(p=>p[0]===outerRadius),poly=polygon(g,row,n);outerPolys[`${id}-${n}`]=poly;
  const apothems=poly.map((a,i)=>{const b=poly[(i+1)%n],v=[b[0]-a[0],b[1]-a[1]];return Math.abs(v[0]*a[1]-v[1]*a[0])/Math.hypot(...v);});
  const attrs=Object.fromEntries(Object.entries(g.attributes).map(([k,v])=>[k,{bytes:v.array.byteLength,sha256:sha(Buffer.from(v.array.buffer,v.array.byteOffset,v.array.byteLength))}]));
  const bytes=Object.values(attrs).reduce((s,x)=>s+x.bytes,0)+g.index.array.byteLength;
  const mesh=new THREE.Mesh(g,material);mesh.position.fromArray(MICRO_PARTS[id].originMm.map(x=>x/1000));mesh.updateMatrixWorld(true);
  parts[id]={vertices:p.count,triangles:idx.length/3,indexType:idx.constructor.name,indexBytes:g.index.array.byteLength,attributeBytes:attrs,totalBufferBytes:bytes,volumeMm3:volume,minTriangleAreaMm2:minArea,degenerateTriangles:degenerate,boundaryOrNonManifoldEdges:[...edgeMap.values()].filter(x=>x.count!==2).length,inconsistentlyDirectedEdges:[...edgeMap.values()].filter(x=>x.orientation!==0).length,outerIdealRadiusMm:outerRadius,nativeMinimumFacetRadiusMm:Math.min(...apothems),maximumCircleToFacetLossMm:outerRadius-Math.min(...apothems),originMm:mesh.position.toArray().map(x=>x*1000),materialSameIdentity:mesh.material===material,worldMatrix:mesh.matrixWorld.toArray()};
  if(id==='S14')parts[id].socket={nativeBoreTriangles:bores.length,minimumFaceDistanceToAxisMm:Math.min(...bores),continuousStemEnvelopeRadiusMm:6,minimumRadialClearanceMm:Math.min(...bores)-6,continuousR6EnvelopeFits:Math.min(...bores)>=6,note:'Continuous R6 cylinder is the specified envelope, not an available S15 mesh. A phase-aligned polygonal stem may behave differently.'};
 }
 const g13=geometries.S13,g14=geometries.S14;
 // Derive mating annular boundaries from native horizontal face vertices.
 function seat(g,origin,y,up){const p=g.getAttribute('position'),ii=g.index.array,set=new Set();let count=0;for(let k=0;k<ii.length;k+=3){const ids=[ii[k],ii[k+1],ii[k+2]],v=ids.map(i=>[p.getX(i)*1000,p.getY(i)*1000+origin,p.getZ(i)*1000]);if(!v.every(x=>Math.abs(x[1]-y)<1e-5))continue;const norm=cross(sub(v[1],v[0]),sub(v[2],v[0]));if(norm[1]*up<=0)continue;count++;for(const i of ids)set.add(i);}const points=[...set].map(i=>[p.getX(i)*1000,p.getZ(i)*1000]);const radii=points.map(q=>Math.hypot(...q)),min=Math.min(...radii),max=Math.max(...radii),loop=r=>points.filter(q=>Math.abs(Math.hypot(...q)-r)<1e-5).sort((a,b)=>Math.atan2(a[1],a[0])-Math.atan2(b[1],b[0]));return {triangles:count,inner:loop(min),outer:loop(max),yNativeMm:p.getY([...set][0])*1000+origin,minimumRadiusMm:min,maximumRadiusMm:max};}
 const a=seat(g13,1665,1668,1),b=seat(g14,1668,1668,-1);
 const angles=p=>p.map(x=>Math.atan2(x[1],x[0]));
 const phaseError=Math.max(...angles(a.inner).map((v,i)=>Math.abs(v-angles(b.outer)[i])));
 if(a.inner.length!==n||b.outer.length!==n||phaseError>1e-6||a.minimumRadiusMm<b.minimumRadiusMm||a.maximumRadiusMm<b.maximumRadiusMm)throw Error('Mating annulus assumption invalid');
 const contact={planeMm:1668,planeMismatchMm:Math.abs(a.yNativeMm-b.yNativeMm),ringUpwardSeatTriangles:a.triangles,capDownwardSeatTriangles:b.triangles,sharedAngularPhaseErrorRad:phaseError,contactAreaMm2:area2(b.outer)-area2(a.inner),innerContactRadiusMm:a.minimumRadiusMm,outerContactRadiusMm:b.maximumRadiusMm,positiveArea:true,seatPlaneToleranceMm:1e-5,method:'Native co-phased polygons; intersection is S14 outer polygon less S13 inner polygon; all n paired rays and ring containment checked. No full staff/glass claim.'};
 cases.push({segments:n,guardAccepted:true,parts,contact,totals:{vertices:Object.values(parts).reduce((s,p)=>s+p.vertices,0),triangles:Object.values(parts).reduce((s,p)=>s+p.triangles,0),bufferBytes:Object.values(parts).reduce((s,p)=>s+p.totalBufferBytes,0),meshes:2,sharedMaterials:1,unbatchedDrawUnits:2,textureBytes:0},singleCreationAndAnalysisMs:performance.now()-started});
 for(const g of Object.values(geometries))g.dispose();
}
const geometryBatchMs=performance.now()-geometryStart;
for(const item of cases){if(!item.guardAccepted)continue;for(const id of ['S13','S14']){let max=0;for(let i=0;i<8192;i++){const angle=i/8192*2*Math.PI;max=Math.max(max,Math.abs(radial(outerPolys[`${id}-${item.segments}`],angle)-radial(outerPolys[`${id}-24`],angle)));}item.parts[id].maximumRadialDifferenceFrom24Over8192AnglesMm=max;}item.savedTriangles=cases[0].totals.triangles-item.totals.triangles;item.savedBufferBytes=cases[0].totals.bufferBytes-item.totals.bufferBytes;item.savedFraction=1-item.totals.bufferBytes/cases[0].totals.bufferBytes;}
const projections=[];
for(const [width,height] of [[1280,720],[844,390],[390,844]])for(const mode of ['normal-unoccluded-settled','dialogue-first-distance']){
 const d=9*(height>width?1.12:1),depth=mode.startsWith('normal')?Math.hypot(Math.cos(.3)*d,.1+Math.sin(.3)*d):Math.hypot(2.6,.1);
 const camera=new THREE.PerspectiveCamera(54,width/height,.1,1100);if(mode.startsWith('dialogue'))camera.projectionMatrix.elements[9]=-.53;camera.updateMatrixWorld(true);
 const projectMm=r=>{const l=new THREE.Vector3(-r/1000,0,-depth).project(camera),right=new THREE.Vector3(r/1000,0,-depth).project(camera);return (right.x-l.x)*width/2;};
 projections.push({viewport:[width,height],mode,depthMetres:depth,perspectiveFovDegrees:54,unit:'CSS-coordinate pixels (mathematical projection only)',S13IdealDiameterPx:projectMm(20),S14IdealDiameterPx:projectMm(18),radiusToPixelFactor:projectMm(1)/2,facetingErrorAtImagePlaneBySegments:cases.filter(c=>c.guardAccepted).map(c=>({segments:c.segments,S13Px:projectMm(c.parts.S13.maximumCircleToFacetLossMm)/2,S14Px:projectMm(c.parts.S14.maximumCircleToFacetLossMm)/2}))});
}
material.dispose();
const finalSource=fs.readFileSync(path.join(repo,source));if(!before.equals(finalSource))throw Error('Source changed during run');
const output={completedAt:new Date().toISOString(),source:record,threeRevision:THREE.REVISION,material:materialRecord,profiles,cases,projections,geometryBatchMs,scope:{kind:'Independent native Three geometry and code-lens numerical projection; no renderer',originalMeshesUnchanged:true,sourceWrite:false,projectionCaveat:'Virtual camera-facing diameters at each look-at depth. These two parts are not installed on the live actor; actual staff location, orientation, occlusion, DPR, shading and camera candidate selection are not measured.',contactCaveat:'Only S13/S14 seat and continuous R6 stem design envelope. S15, S16, whole lantern and actor assembly absent.',timeCaveat:'One ordered 24/16/12/8 creation+analysis batch, not a benchmark or total human/model production time.'},endReadback:{head:git('rev-parse','HEAD'),status:git('status','--short'),sourceSha256:sha(finalSource)}};
fs.writeFileSync(path.join(here,'results.json'),JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify({sourceSha256:sha(finalSource),head:record.head,cases:cases.map(c=>({segments:c.segments,totals:c.totals,clearanceMm:c.parts?.S14.socket.minimumRadialClearanceMm,contactAreaMm2:c.contact?.contactAreaMm2,S13RadialErrorMm:c.parts?.S13.maximumCircleToFacetLossMm})),geometryBatchMs,projections},null,2));
