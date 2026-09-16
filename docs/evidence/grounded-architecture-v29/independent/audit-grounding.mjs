import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {registerHooks} from 'node:module';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const repo=path.resolve(process.argv[2]),out=path.resolve(process.argv[3]),base=process.argv[4],url=p=>pathToFileURL(path.join(repo,p)).href;
const T=await import(url('node_modules/three/build/three.module.js'));
const files=['src/scene.js','src/core.js','src/environment-models.js','src/architecture-grounding.js','src/spatial.js','src/combat-presentation.js','src/terrain-surface.js'];
const hashes=()=>Object.fromEntries(files.filter(f=>fs.existsSync(path.join(repo,f))).map(f=>[f,createHash('sha256').update(fs.readFileSync(path.join(repo,f))).digest('hex')]));
const before=hashes();
const hooks=registerHooks({resolve(s,c,next){if(/\.(png|jpe?g|hdr|glb|wav|mp3|webp|mp4)$/.test(s))return{url:'data:text/javascript,export default '+encodeURIComponent(JSON.stringify(s)),shortCircuit:true};return next(s,c);},load(u,c,next){if(base&&u.startsWith(url('src/'))&&u.endsWith('.js'))return{format:'module',source:execFileSync('git',['show',base+':'+u.slice(url('').length+1)],{cwd:repo,encoding:'utf8'}),shortCircuit:true};return next(u,c);}});
let Game,PLACES,heightAt,groundAt,SceneView,createTerrainSurface,cameraFraction,obstacleCylinder,forecastProjectileContact;
try{({Game,PLACES,heightAt,groundAt}=await import(url('src/core.js')));({SceneView}=await import(url('src/scene.js')));({createTerrainSurface}=await import(url('src/terrain-surface.js')));({cameraFraction,obstacleCylinder}=await import(url('src/spatial.js')));({forecastProjectileContact}=await import(url('src/combat-presentation.js')));}finally{hooks.deregister();}
const game=new Game(),view={scene:new T.Scene(),game,beacons:new Map(),sway:{value:0}};
SceneView.prototype.createStructures.call(view);view.scene.updateMatrixWorld(true);
const meshes=[];view.scene.traverse(n=>{if(n.isMesh)meshes.push(n)});
const bounds=m=>{m.geometry.computeBoundingBox();const b=m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld);return{min:b.min.toArray(),max:b.max.toArray()};};
const world={obstacles:game.obstacles.map(({x,z,r,type})=>({x,z,r,type})),actors:game.enemies.map(({id,x,z,homeX,homeZ})=>({id,x,z,homeX,homeZ})),pickups:game.pickups.map(({id,x,z})=>({id,x,z})),save:JSON.parse(JSON.stringify(game.serialize()))};
const uniqueGeometry=new Set(meshes.map(m=>m.geometry)),uniqueBuffers=new Set();for(const g of uniqueGeometry){for(const a of Object.values(g.attributes))uniqueBuffers.add(a.isInterleavedBufferAttribute?a.data:a);if(g.index)uniqueBuffers.add(g.index);}const geometryBytes=[...uniqueBuffers].reduce((sum,a)=>sum+a.array.byteLength,0);
const basic={uniqueGeometryCount:uniqueGeometry.size,geometryBytes,base:base||null,world,meshes:meshes.map(m=>({bounds:bounds(m),triangles:(m.geometry.index?.count??m.geometry.attributes.position.count)/3,grounded:m.geometry.userData.groundedSupport??null})),meshCount:meshes.length,triangles:meshes.reduce((s,m)=>s+(m.geometry.index?.count??m.geometry.attributes.position.count)/3,0)};
if(base){fs.writeFileSync(out,JSON.stringify(basic,null,2)+'\n');console.log(JSON.stringify({baseline:base,meshes:basic.meshCount,triangles:basic.triangles}));process.exit(0);}
const baseline=JSON.parse(fs.readFileSync(path.join(path.dirname(out),'baseline.json')));assert.deepEqual(world,baseline.world);
const terrain=createTerrainSurface(),p=terrain.attributes.position,ix=terrain.index.array,bins=new Map(),cell=4;
for(let i=0;i<ix.length;i+=3){const ids=[ix[i],ix[i+1],ix[i+2]],xs=ids.map(j=>p.getX(j)),zs=ids.map(j=>p.getZ(j));for(let x=Math.floor(Math.min(...xs)/cell);x<=Math.floor(Math.max(...xs)/cell);x++)for(let z=Math.floor(Math.min(...zs)/cell);z<=Math.floor(Math.max(...zs)/cell);z++){const k=x+':'+z;if(!bins.has(k))bins.set(k,[]);bins.get(k).push(i);}}
const qa=new T.Vector3(),qb=new T.Vector3(),qc=new T.Vector3(),query=new T.Vector3(),weights=new T.Vector3();
function terrainY(x,z){query.set(x,0,z);for(const i of bins.get(Math.floor(x/cell)+':'+Math.floor(z/cell))||[]){const ia=ix[i],ib=ix[i+1],ic=ix[i+2];qa.set(p.getX(ia),0,p.getZ(ia));qb.set(p.getX(ib),0,p.getZ(ib));qc.set(p.getX(ic),0,p.getZ(ic));T.Triangle.getBarycoord(query,qa,qb,qc,weights);if(weights.x>=-1e-7&&weights.y>=-1e-7&&weights.z>=-1e-7)return weights.x*p.getY(ia)+weights.y*p.getY(ib)+weights.z*p.getY(ic);}throw Error('Terrain hole '+x+','+z);}
const supports=game.obstacles.filter(o=>o.architecture),records=[],allProbes=[],legacyMatched=new Set();
const key=v=>v.toArray().map(x=>Math.round(x*1e5)).join(',');
function edgeRecord(map,a,b){const aa=key(a),bb=key(b),k=aa<bb?aa+'|'+bb:bb+'|'+aa;const e=map.get(k)||{count:0,a:a.clone(),b:b.clone()};e.count++;map.set(k,e);}
let globalMin=Infinity,globalMax=-Infinity,legacyMax=-Infinity,totalPerimeterSamples=0;
for(const o of supports){
 const m=meshes.find(m=>m.geometry.userData.groundedSupport?.worldX===o.x&&m.geometry.userData.groundedSupport?.worldZ===o.z);assert(m);
 const a=m.geometry.attributes.position,n=m.geometry.attributes.normal,top=o.architecture.top,edges=new Map(),bottomEdges=new Map();let badNormals=0,badWinding=0,degenerate=0,maxTopError=0;
 for(let i=0;i<a.count;i+=3){const v=[0,1,2].map(k=>new T.Vector3().fromBufferAttribute(a,i+k).applyMatrix4(m.matrixWorld));const face=new T.Vector3().subVectors(v[1],v[0]).cross(new T.Vector3().subVectors(v[2],v[0])),len=face.length();if(len<1e-10)degenerate++;face.normalize();for(let k=0;k<3;k++){edgeRecord(edges,v[k],v[(k+1)%3]);const stored=new T.Vector3().fromBufferAttribute(n,i+k).transformDirection(m.matrixWorld);if(stored.dot(face)<.999999)badNormals++;}
  const atTop=v.map(p=>Math.abs(p.y-top)<1e-4);for(let k=0;k<3;k++)if(atTop[k])maxTopError=Math.max(maxTopError,Math.abs(v[k].y-top));
  if(atTop.every(Boolean)){if(face.y<=0)badWinding++;}
  else if(atTop.every(x=>!x)){if(face.y>=0)badWinding++;for(let k=0;k<3;k++)edgeRecord(bottomEdges,v[k],v[(k+1)%3]);}
  else {const mid=v.reduce((s,v)=>s.add(v),new T.Vector3()).multiplyScalar(1/3);if(face.dot(new T.Vector3(mid.x-o.x,0,mid.z-o.z))<=0)badWinding++;}
 }
 const boundary=[...edges.values()].filter(e=>e.count!==2),perimeter=[...bottomEdges.values()].filter(e=>e.count===1);
 assert(boundary.every(e=>o.type==='tower'&&e.count===1&&Math.abs(e.a.y-top)<1e-4&&Math.abs(e.b.y-top)<1e-4));assert.equal(boundary.length,o.type==='tower'?72:0);assert.equal(perimeter.length,o.type==='tower'?72:16);assert.equal(badNormals+badWinding+degenerate,0);
 const place=PLACES.find(p=>p.id===o.architecture.place),oldBottom=heightAt(place.x,place.z)+(o.type==='tower'?-.5:0);let lo=Infinity,hi=-Infinity,oldLo=Infinity,oldHi=-Infinity;
 for(const e of perimeter)for(let j=0;j<=32;j++){const v=e.a.clone().lerp(e.b,j/32),ground=terrainY(v.x,v.z),gap=v.y-ground,old=oldBottom-ground;lo=Math.min(lo,gap);hi=Math.max(hi,gap);oldLo=Math.min(oldLo,old);oldHi=Math.max(oldHi,old);totalPerimeterSamples++;}
 globalMin=Math.min(globalMin,lo);globalMax=Math.max(globalMax,hi);legacyMax=Math.max(legacyMax,oldHi);assert(hi<=.05);assert(lo>-.25);
 const oldMesh=baseline.meshes.find(m=>Math.abs((m.bounds.min[0]+m.bounds.max[0])/2-o.x)<1e-4&&Math.abs((m.bounds.min[2]+m.bounds.max[2])/2-o.z)<1e-4&&Math.abs(m.bounds.max[1]-top)<1e-4&&Math.abs(m.bounds.min[1]-oldBottom)<1e-4);assert(oldMesh,'matching actual legacy support '+o.x+','+o.z);legacyMatched.add(oldMesh);
 assert(Math.abs(bounds(m).max[1]-oldMesh.bounds.max[1])<1e-4);
 // Real camera/live-projectile/forecast entrypoints share this production cylinder.
 const y=top-.2,from={x:o.x-o.r-2,y,z:o.z},to={x:o.x+o.r+2,y,z:o.z},arrow={...from,vx:to.x-from.x,vy:0,vz:0,life:3,owner:'player',damage:1};const probe=new Game();probe.obstacles=[o];probe.enemies=[];
 const live=probe.projectileContact(arrow,1),future=forecastProjectileContact(probe,arrow,1),cam=cameraFraction(from,to,[o],groundAt);
 assert.equal(live.target,'wall');assert.equal(future?.target,'wall');assert(Math.abs(live.fraction-future.timeToImpact)<1e-6);assert(cam<1);
 allProbes.push({place:o.architecture.place,kind:o.architecture.kind,live:live.fraction,forecast:future.timeToImpact,camera:cam});
 records.push({place:o.architecture.place,kind:o.architecture.kind,x:o.x,z:o.z,triangles:a.count/3,perimeterEdges:perimeter.length,perimeterSamples:perimeter.length*33,contactMin:lo,contactMax:hi,legacyContactMin:oldLo,legacyContactMax:oldHi,topDifference:bounds(m).max[1]-oldMesh.bounds.max[1],badNormals,badWinding,degenerate,expectedOpenTopEdges:boundary.length});
}
assert.deepEqual(basic.meshes.filter(m=>!m.grounded),baseline.meshes.filter(m=>!legacyMatched.has(m)));
assert.equal(supports.length,37);assert.equal(basic.meshCount,baseline.meshCount);assert.equal(basic.triangles-baseline.triangles,776);
const fallbackChecks=[];for(const y of [undefined,null,NaN,Infinity,-Infinity,0,-3,7]){let calls=0;const c=obstacleCylinder({x:2,z:3,r:2,y},()=>{calls++;return 11});assert.equal(c.y,Number.isFinite(y)?y:11);assert.equal(c.height,3);assert.equal(calls,Number.isFinite(y)?0:1);fallbackChecks.push({input:String(y),result:c.y,floorCalls:calls});}
assert.deepEqual(hashes(),before);
const report={checkedAt:new Date().toISOString(),repo,head:execFileSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'}).trim(),sourceHashes:before,scope:'Real SceneView.createStructures method, native geometry and indexed terrain; no constructor, DOM, renderer, texture decode, browser, GPU, pixels or PS4 judgment. Media imports are explicit inert strings.',baselineCommit:baseline.base,worldAndFreshSaveIdentical:true,allOtherStructureBoundsIdentical:true,originalAndCandidateGeometryBytes:[baseline.geometryBytes,basic.geometryBytes],originalAndCandidateUniqueGeometries:[baseline.uniqueGeometryCount,basic.uniqueGeometryCount],originalAndCandidateMeshes:[baseline.meshCount,basic.meshCount],originalAndCandidateTriangles:[baseline.triangles,basic.triangles],supportCount:supports.length,contactPerimeterSamples:totalPerimeterSamples,contactMin:globalMin,contactMax:globalMax,legacyWorst:legacyMax,allFaceWindingAndNormalsValid:true,allOldSupportTopsRetained:true,closedExceptExistingTowerTop:true,records,verticalEntrypointProbes:allProbes,fallbackChecks,sourceUnchangedDuringRun:true};
fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:true,supportCount:supports.length,contactPerimeterSamples:totalPerimeterSamples,contactMin:globalMin,contactMax:globalMax,legacyWorst:legacyMax,meshDelta:basic.meshCount-baseline.meshCount,triangleDelta:basic.triangles-baseline.triangles,probes:allProbes.length}));
