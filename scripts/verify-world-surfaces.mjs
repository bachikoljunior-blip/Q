// Read-only source/Three geometry verification. No renderer, browser, pixels or FPS.
// Usage: node verify-world-surfaces.mjs /absolute/repo [report.json]
import { readFileSync,writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
const repo=resolve(process.argv[2]||process.cwd()),load=path=>import(pathToFileURL(resolve(repo,path)).href);
const [T,{createTerrainSurface},{createWaterSurface,WATER_SURFACE},{heightAt,riverX,inWater,PLACES},{stableShadowAnchor,atmosphere}]=await Promise.all([load('node_modules/three/build/three.module.js'),load('src/terrain-surface.js'),load('src/water-surface.js'),load('src/core.js'),load('src/environment-atmosphere.js')]);
const sourceHashes=Object.fromEntries(['terrain-surface','water-surface','environment-materials','environment-atmosphere'].map(name=>[name,createHash('sha256').update(readFileSync(resolve(repo,'src/'+name+'.js'))).digest('hex')]));
function indexSurface(g){
  const attr=g.attributes.position,ind=g.index.array,p=Array.from({length:attr.count},(_,i)=>({x:attr.getX(i),y:attr.getY(i),z:attr.getZ(i)})),bins=new Map(),edges=new Map(),keys=new Set(p.map(a=>a.x+':'+a.z));
  const step=7.5,key=(x,z)=>Math.floor((x+510)/step)+':'+Math.floor((z+330)/step);
  let area=0,invalid=0,degenerate=0,wrongWinding=0,interiorBoundaries=0,nonManifold=0,boundaryEdges=0;
  for(const a of p)if(![a.x,a.y,a.z].every(Number.isFinite))invalid++;
  for(let i=0;i<ind.length;i+=3){const[a,b,c]=[p[ind[i]],p[ind[i+1]],p[ind[i+2]]],ny=(b.z-a.z)*(c.x-a.x)-(b.x-a.x)*(c.z-a.z);area+=ny/2;if(Math.abs(ny)<1e-9)degenerate++;if(ny<0)wrongWinding++;
    for(let k=0;k<3;k++){const a=ind[i+k],b=ind[i+(k+1)%3],key=a<b?a+':'+b:b+':'+a;edges.set(key,(edges.get(key)||0)+1);}
    const x0=Math.floor((Math.min(a.x,b.x,c.x)+510)/step),x1=Math.floor((Math.max(a.x,b.x,c.x)+510)/step),z0=Math.floor((Math.min(a.z,b.z,c.z)+330)/step),z1=Math.floor((Math.max(a.z,b.z,c.z)+330)/step);
    for(let z=z0;z<=z1;z++)for(let x=x0;x<=x1;x++){const k=x+':'+z;if(!bins.has(k))bins.set(k,[]);bins.get(k).push(i);}
  }
  for(const [e,n]of edges){if(n>2)nonManifold++;if(n!==1)continue;boundaryEdges++;const[a,b]=e.split(':').map(i=>p[Number(i)]);if(!((a.x===-510&&b.x===-510)||(a.x===330&&b.x===330)||(a.z===-330&&b.z===-330)||(a.z===330&&b.z===330)))interiorBoundaries++;}
  function y(x,z){for(const i of bins.get(key(x,z))||[]){const a=p[ind[i]],b=p[ind[i+1]],c=p[ind[i+2]],d=(b.z-c.z)*(a.x-c.x)+(c.x-b.x)*(a.z-c.z),u=((b.z-c.z)*(x-c.x)+(c.x-b.x)*(z-c.z))/d,v=((c.z-a.z)*(x-c.x)+(a.x-c.x)*(z-c.z))/d,w=1-u-v;if(u>=-1e-8&&v>=-1e-8&&w>=-1e-8)return u*a.y+v*b.y+w*c.y;}return NaN;}
  function samples(take){for(let i=0;i<ind.length;i+=3){const[a,b,c]=[p[ind[i]],p[ind[i+1]],p[ind[i+2]]];take((a.x+b.x+c.x)/3,(a.z+b.z+c.z)/3);for(const[u,v]of [[a,b],[b,c],[c,a]])take((u.x+v.x)/2,(u.z+v.z)/2);}}
  return {y,samples,keys,p,structure:{vertices:p.length,triangles:ind.length/3,bytes:Object.values(g.attributes).reduce((s,a)=>s+a.array.byteLength,0)+ind.byteLength,area,invalid,degenerate,wrongWinding,duplicateXZ:p.length-keys.size,nonManifold,boundaryEdges,...(g.userData.surface==='adaptive-height-field'?{interiorBoundaries}:{})}};
}
function measure(name,sample){let count=0,holes=0,min=Infinity,max=-Infinity,worstLow=null,worstHigh=null,sum=0;const absolute=[];
  sample((value,position)=>{if(!Number.isFinite(value)){holes++;return;}count++;sum+=value;absolute.push(Math.abs(value));if(value<min){min=value;worstLow=position;}if(value>max){max=value;worstHigh=position;}});absolute.sort((a,b)=>a-b);
  return{name,count,holes,min,max,mean:sum/count,worstLow,worstHigh,p95Absolute:absolute[Math.floor(absolute.length*.95)],maxAbsolute:absolute.at(-1)};
}
const start=performance.now(),terrainGeometry=createTerrainSurface(),constructionMs=performance.now()-start,terrain=indexSurface(terrainGeometry),water=indexSurface(createWaterSurface());
const terrainSamples=[measure('Same baseline 1m grid',take=>{for(let z=-330;z<=330;z++)for(let x=-510;x<=330;x++)take(terrain.y(x,z)-heightAt(x,z),{x,z});}),measure('PLACES squares radius24m, .25m step',take=>{for(const a of PLACES)for(let i=-96;i<=96;i++)for(let j=-96;j<=96;j++){const x=a.x+i*.25,z=a.z+j*.25;take(terrain.y(x,z)-heightAt(x,z),{x,z});}}),measure('Actual indexed triangle centroids and edge midpoints',take=>terrain.samples((x,z)=>take(terrain.y(x,z)-heightAt(x,z),{x,z})))];
let underwater=0,wetCount=0;const waterSamples=measure('Same baseline wet-area points (center from old4.4m strip; .5m along/across)',take=>{
  for(let z=-220;z<=220;z+=.5){const iz=Math.min(99,Math.floor((z+220)/4.4)),za=-220+iz*4.4,zb=za+4.4,t=(z-za)/4.4,cx=riverX(za)+(riverX(zb)-riverX(za))*t;
    for(let dx=-10.5;dx<=10.5;dx+=.5){const x=cx+dx;if(!inWater(x,z))continue;wetCount++;const clearance=water.y(x,z)-terrain.y(x,z);if(clearance-WATER_SURFACE.maxWave<=0)underwater++;take(clearance,{x,z});}
  }
});
const waterTriangleClearance=measure('Water indexed triangle centroids and edge midpoints',take=>water.samples((x,z)=>take(water.y(x,z)-terrain.y(x,z),{x,z})));
// Independent front/back opposition oracle; the determinant expression is read
// from production instead of hardcoding the correction into the test.
const materialSource=readFileSync(resolve(repo,'src/environment-materials.js'),'utf8'),detExpression=materialSource.match(/float qDet=([^;]+);/)?.[1];
assert(detExpression,'production generic bump determinant');
const determinant=new Function('dot','qDx','qRx','faceDirection','return '+detExpression);
function bump(n,face){const dx=new T.Vector3(1,0,0),dy=new T.Vector3(0,1,0),rx=dy.clone().cross(n),ry=n.clone().cross(dx),det=determinant((a,b)=>a.dot(b),dx,rx,face),gradient=rx.multiplyScalar(.5).add(ry.multiplyScalar(.25)).multiplyScalar(Math.sign(det));return n.clone().multiplyScalar(Math.abs(det)+.000001).addScaledVector(gradient,-.07).normalize();}
const front=bump(new T.Vector3(0,0,1),1),back=bump(new T.Vector3(0,0,-1),-1),oppositionErrorRadians=front.angleTo(back.negate());
const direction=atmosphere.sun.value.clone(),up=new T.Vector3(0,1,0),right=new T.Vector3().crossVectors(up,direction).normalize(),lightUp=new T.Vector3().crossVectors(direction,right).normalize(),shadow={camera:{left:-35,right:35,bottom:-35,top:35},mapSize:{x:1024,y:1024}},texel=70/1024;
const target=right.clone().multiplyScalar(texel*10).addScaledVector(lightUp,texel*4).addScaledVector(direction,3),inside=target.clone().addScaledVector(right,texel*.2).addScaledVector(lightUp,-texel*.2),step=target.clone().addScaledVector(right,texel*.6);
function shadowUV(position,point){const light=new T.DirectionalLight(),scene=new T.Scene(),anchor=stableShadowAnchor(position,direction,shadow);light.position.copy(anchor).addScaledVector(direction,135);light.target.position.copy(anchor);scene.add(light,light.target);Object.assign(light.shadow.camera,shadow.camera,{near:1,far:220});light.shadow.camera.updateProjectionMatrix();scene.updateMatrixWorld(true);light.shadow.updateMatrices(light);return point.clone().applyMatrix4(light.shadow.matrix);}
let sameCellMaxPixels=0,stepErrorPixels=0;for(const point of [new T.Vector3(0,0,0),new T.Vector3(16,3,90),new T.Vector3(-100,5,-20)]){const a=shadowUV(target,point),b=shadowUV(inside,point),c=shadowUV(step,point);sameCellMaxPixels=Math.max(sameCellMaxPixels,Math.hypot(a.x-b.x,a.y-b.y)*1024);stepErrorPixels=Math.max(stepErrorPixels,Math.abs(Math.abs(c.x-a.x)*1024-1),Math.abs(c.y-a.y)*1024);}
const report={scope:'Read-only indexed triangle and native Three shadow matrix arithmetic; no renderer, pixels, GPU timing, browser, device, PS4-quality qualification',sourceHashes,terrain:{constructionMs,...terrain.structure,samples:terrainSamples,anchors:PLACES.map(a=>({id:a.id,exactVertex:terrain.keys.has(a.x+':'+a.z),error:terrain.y(a.x,a.z)-heightAt(a.x,a.z)}))},water:{...water.structure,samples:waterSamples,triangleClearance:waterTriangleClearance,wetCount,underwaterAtWorstNegativeWave:underwater,maxWave:WATER_SURFACE.maxWave,minimumGuaranteedSampleClearance:Math.min(waterSamples.min,waterTriangleClearance.min)-WATER_SURFACE.maxWave},doubleSidedBump:{determinant:detExpression,oppositionErrorRadians},shadow:{texelMeters:texel,sameCellMaxPixels,oneCellStepErrorPixels:stepErrorPixels}};
if(process.argv[3])writeFileSync(resolve(process.argv[3]),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
for(const field of ['invalid','degenerate','wrongWinding','duplicateXZ','nonManifold','interiorBoundaries'])assert.equal(report.terrain[field],0,field);
assert.equal(report.terrain.area,554400);assert(report.terrain.triangles<=115000);assert(report.terrain.bytes<=3.3*1024*1024);
for(const s of terrainSamples){assert.equal(s.holes,0);assert(s.maxAbsolute<.1);}
for(const a of report.terrain.anchors){assert(a.exactVertex);assert(Math.abs(a.error)<1e-5);}
assert.equal(waterSamples.holes,0);assert.equal(underwater,0);assert(report.water.minimumGuaranteedSampleClearance>0);
assert.equal(oppositionErrorRadians,0);
assert(sameCellMaxPixels<1e-8);assert(stepErrorPixels<1e-8);

const sceneSource=readFileSync(resolve(repo,'src/scene.js'),'utf8');
assert(!sceneSource.includes('const bank=new T.PlaneGeometry'),'stream bank overlay would intersect the adaptive surface');
assert(materialSource.includes('float qWetBank='),'wet banks must be shaded on the actual ground surface');
