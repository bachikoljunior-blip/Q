import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {registerHooks} from 'node:module';
import {fileURLToPath} from 'node:url';
import * as T from 'three';
import {Game,PLACES,heightAt,groundAt} from '../src/core.js';
import {createTerrainSurface} from '../src/terrain-surface.js';
import {cameraFraction,obstacleCylinder} from '../src/spatial.js';
import {forecastProjectileContact} from '../src/combat-presentation.js';

export async function inspectArchitecture(){
  const hooks=registerHooks({resolve(s,c,next){if(/\.(png|jpe?g|webp|hdr|glb|wav|mp3|mp4)$/.test(s))return{url:'data:text/javascript,export default '+encodeURIComponent(JSON.stringify(s)),shortCircuit:true};return next(s,c);}});
  let SceneView;try{({SceneView}=await import('../src/scene.js'));}finally{hooks.deregister();}
  const game=new Game(),view={scene:new T.Scene(),game,beacons:new Map(),sway:{value:0}};
  // Only the production geometry method; no SceneView constructor or renderer.
  SceneView.prototype.createStructures.call(view);view.scene.updateMatrixWorld(true);
  const geometry=createTerrainSurface(),p=geometry.attributes.position,ix=geometry.index.array,bins=new Map(),cell=7.5;
  for(let i=0;i<ix.length;i+=3){const ids=[ix[i],ix[i+1],ix[i+2]],xs=ids.map(j=>p.getX(j)),zs=ids.map(j=>p.getZ(j));for(let x=Math.floor(Math.min(...xs)/cell);x<=Math.floor(Math.max(...xs)/cell);x++)for(let z=Math.floor(Math.min(...zs)/cell);z<=Math.floor(Math.max(...zs)/cell);z++){const key=x+':'+z;if(!bins.has(key))bins.set(key,[]);bins.get(key).push(i);}}
  const terrainY=(x,z)=>{for(const i of bins.get(Math.floor(x/cell)+':'+Math.floor(z/cell))||[]){const a=ix[i],b=ix[i+1],c=ix[i+2],ax=p.getX(a),az=p.getZ(a),bx=p.getX(b),bz=p.getZ(b),cx=p.getX(c),cz=p.getZ(c),d=(bz-cz)*(ax-cx)+(cx-bx)*(az-cz),u=((bz-cz)*(x-cx)+(cx-bx)*(z-cz))/d,v=((cz-az)*(x-cx)+(ax-cx)*(z-cz))/d;if(u>=-1e-7&&v>=-1e-7&&u+v<=1+1e-7)return u*p.getY(a)+v*p.getY(b)+(1-u-v)*p.getY(c);}throw Error('Terrain hole');};
  const supports=game.obstacles.filter(o=>o.architecture),meshes=[];view.scene.traverse(m=>{if(m.geometry?.userData.groundedSupport)meshes.push(m);});
  assert.equal(supports.length,37);assert.equal(meshes.length,37,'real createStructures must consume every shared support');
  const records=[];let triangles=0,maxGap=-Infinity,minGap=Infinity,baselineWorst=-Infinity,topError=0,outwardFailures=0,perimeterMin=Infinity,perimeterMax=-Infinity;
  for(const o of supports){const m=meshes.find(m=>m.geometry.userData.groundedSupport.worldX===o.x&&m.geometry.userData.groundedSupport.worldZ===o.z),attr=m.geometry.attributes.position,place=PLACES.find(p=>p.id===o.architecture.place),points=[];
    triangles+=attr.count/3;
    for(let i=0;i<attr.count;i++){const point=new T.Vector3().fromBufferAttribute(attr,i).applyMatrix4(m.matrixWorld);if(point.y<o.architecture.top-.001)points.push(point);else topError=Math.max(topError,Math.abs(point.y-o.architecture.top));}
    // Geometry-derived bottom triangle edges, including their interior samples.
    let lo=Infinity,hi=-Infinity,edgeLo=Infinity,edgeHi=-Infinity,count=0;
    for(let i=0;i<attr.count;i+=3){const tri=[0,1,2].map(j=>new T.Vector3().fromBufferAttribute(attr,i+j).applyMatrix4(m.matrixWorld));if(tri.some(p=>p.y>o.architecture.top-.001))continue;for(let k=0;k<=4;k++){const p=tri[1].clone().lerp(tri[2],k/4),gap=p.y-terrainY(p.x,p.z);edgeLo=Math.min(edgeLo,gap);edgeHi=Math.max(edgeHi,gap);}for(let j=0;j<3;j++)for(let step=0;step<=4;step++){const p=tri[j].clone().lerp(tri[(j+1)%3],step/4),gap=p.y-terrainY(p.x,p.z);lo=Math.min(lo,gap);hi=Math.max(hi,gap);count++;}}
    const legacyBase=heightAt(place.x,place.z)+(o.type==='tower'?-.5:0);let oldWorst=-Infinity;
    for(const p of points)oldWorst=Math.max(oldWorst,legacyBase-terrainY(p.x,p.z));
    perimeterMin=Math.min(perimeterMin,edgeLo);perimeterMax=Math.max(perimeterMax,edgeHi);baselineWorst=Math.max(baselineWorst,oldWorst);maxGap=Math.max(maxGap,hi);minGap=Math.min(minGap,lo);
    for(const a of[0,Math.PI/2,Math.PI,Math.PI*1.5]){const y=Math.min(o.architecture.top-.1,Math.max(groundAt(o.x,o.z)+1,o.architecture.top-.5)),origin=new T.Vector3(o.x+Math.cos(a)*(o.r+2),y,o.z+Math.sin(a)*(o.r+2)),target=new T.Vector3(o.x,y,o.z);if(!new T.Raycaster(origin,target.sub(origin).normalize(),0,o.r+3).intersectObject(m).length)outwardFailures++;}
    assert.equal(obstacleCylinder(o,heightAt).y,o.y);assert(o.height>0);assert(o.y+o.height>=o.architecture.top);
    records.push({place:o.architecture.place,kind:o.architecture.kind,x:o.x,z:o.z,contactMin:lo,contactMax:hi,perimeterMin:edgeLo,perimeterMax:edgeHi,samples:count,legacyMaxGap:oldWorst,base:o.y,top:o.y+o.height,shaftTop:o.architecture.top});
  }
  assert(maxGap<=.05,'floating support detected');assert(baselineWorst>11,'oracle must detect old tower floating');assert(maxGap+.5>.3,'raising repaired bases .5m must fail this contact oracle');assert(topError<1e-4);assert.equal(outwardFailures,0,'outward native face rays');
  const legacyTriangles=36*48+16;assert(triangles-legacyTriangles<=1000);
  const baseline=JSON.parse(readFileSync(new URL('../docs/evidence/grounded-architecture-v29/baseline-world.json',import.meta.url)));
  assert.deepEqual(game.obstacles.map(({x,z,r,type})=>({x,z,r,type})),baseline.obstacles);
  assert.deepEqual(game.enemies.map(({id,x,z,homeX,homeZ})=>({id,x,z,homeX,homeZ})),baseline.actors);
  assert.deepEqual(game.pickups.map(({id,x,z})=>({id,x,z})),baseline.pickups);assert.deepEqual(JSON.parse(JSON.stringify(game.serialize())),baseline.save);
  // Native camera/live arrow/forecast negative control, at the formerly missing
  // upper tower volume. Same horizontal cylinder; only shared vertical bounds vary.
  const tower=supports.find(o=>o.type==='tower'),y=tower.architecture.top-1,from={x:tower.x-8,y,z:tower.z},to={x:tower.x+8,y,z:tower.z};
  const arrow={...from,vx:16,vy:0,vz:0,life:3,owner:'player',damage:1};game.obstacles=[tower];game.enemies=[];
  const contact=game.projectileContact(arrow,1),forecast=forecastProjectileContact(game,arrow,1),camera=cameraFraction(from,to,game.obstacles,groundAt);
  assert.equal(contact.target,'wall');assert.equal(forecast?.target,'wall');assert(Math.abs(forecast.timeToImpact-contact.fraction)<1e-6);assert(camera<1);
  game.obstacles=[{...tower,y:undefined,height:17}];assert.equal(game.projectileContact(arrow,1).target,null);assert.equal(forecastProjectileContact(game,arrow,1),null);assert.equal(cameraFraction(from,to,game.obstacles,groundAt),1);
  // A deliberately elevated cylinder distinguishes explicit lower bounds from
  // floor fallback in EACH real consumer (an upper-volume hit alone cannot).
  const elevated={x:0,z:0,r:1,y:20,height:3},lowArrow={x:-3,y:6,z:0,vx:6,vy:0,vz:0,life:3,owner:'player',damage:1},lowEnd={x:3,y:6,z:0};
  game.obstacles=[elevated];assert.equal(game.projectileContact(lowArrow,1).target,null);assert.equal(forecastProjectileContact(game,lowArrow,1),null);assert.equal(cameraFraction(lowArrow,lowEnd,game.obstacles,groundAt),1);
  game.obstacles=[{...elevated,y:undefined}];assert.equal(game.projectileContact(lowArrow,1).target,'wall');assert.equal(forecastProjectileContact(game,lowArrow,1)?.target,'wall');assert(cameraFraction(lowArrow,lowEnd,game.obstacles,groundAt)<1);
  // A high hit also detects a forecast-only broad-phase omission: unlike a
  // false-positive low sweep, it cannot be rescued by the live fallback path.
  const highArrow={...lowArrow,y:21},highEnd={...lowEnd,y:21};game.obstacles=[elevated];assert.equal(game.projectileContact(highArrow,1).target,'wall');assert.equal(forecastProjectileContact(game,highArrow,1)?.target,'wall');assert(cameraFraction(highArrow,highEnd,game.obstacles,groundAt)<1);
  game.obstacles=[{...elevated,y:undefined}];assert.equal(game.projectileContact(highArrow,1).target,null);assert.equal(forecastProjectileContact(game,highArrow,1),null);assert.equal(cameraFraction(highArrow,highEnd,game.obstacles,groundAt),1);
  const fallback={x:1,z:2,r:3};assert.deepEqual(obstacleCylinder(fallback,()=>7),{...fallback,y:7,height:4.5});assert.equal(obstacleCylinder({...fallback,y:0},()=>7).y,0);
  const bytes=g=>Object.values(g.attributes).reduce((n,a)=>n+a.array.byteLength,0)+(g.index?.array.byteLength||0),supportGeometryBufferBytes=meshes.reduce((n,m)=>n+bytes(m.geometry),0),legacyTower=new T.CylinderGeometry(4,5,17,8,1,true),legacyTowerBufferBytes=bytes(legacyTower);legacyTower.dispose();
  const files=['src/architecture-grounding.js','src/environment-models.js','src/scene.js','src/core.js','src/spatial.js','src/combat-presentation.js'];
  return{baseline:baseline.baseline,scope:'Actual production structure geometry, indexed terrain, native rays and live/forecast/camera contact; no renderer, pixels, browser, GPU or PS4-quality claim',sourceHashes:Object.fromEntries(files.map(f=>[f,createHash('sha256').update(readFileSync(new URL('../'+f,import.meta.url))).digest('hex')])),supports:37,draws:meshes.length,supportGeometryBufferBytes,legacyTowerBufferBytes,uniqueBufferIncreaseBytes:supportGeometryBufferBytes-legacyTowerBufferBytes,legacySupportTriangles:legacyTriangles,supportTriangles:triangles,addedTriangles:triangles-legacyTriangles,contactMin:minGap,contactMax:maxGap,perimeterMin,perimeterMax,legacyWorstGap:baselineWorst,topError,outwardFailures,worldAndFreshSaveUnchanged:true,verticalConnection:{liveHit:contact.target,forecastHit:forecast.target,time:forecast.timeToImpact,cameraFraction:camera,legacyNegativeControls:3,explicitBottomConsumerNegativeControls:6},records};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){const report=await inspectArchitecture();if(process.argv[2])writeFileSync(process.argv[2],JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:true,supports:report.supports,addedTriangles:report.addedTriangles,contactMax:report.contactMax,legacyWorstGap:report.legacyWorstGap}));}
