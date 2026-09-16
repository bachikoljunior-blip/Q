// Native CPU source readback only. The existing fixture substitutes renderer,
// DOM assets and texture decoding; it produces no WebGL or image evidence.
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
const root='/workspace/scratch/e72662e3b71f/Q-ps4-v57';
const base='2bee64cff6482cb7770ba69e07673eefc8ad54ef';
const sha=b=>createHash('sha256').update(b).digest('hex');
const files=['AGENTS.md','docs/PROJECT_STATE.md','docs/SITE_DELIVERY_V24.md','src/actor-models.js','src/assets/characters/detailed-geometry.js','src/assets/characters/cloth-material.js','src/skin-materials.js','src/dialogue-camera.js','src/scene.js','src/main.js','src/game-interface.css','tests/static-scene-fixture.mjs','tests/dialogue-camera.test.mjs','tests/detailed-actors.test.mjs'];
const hashes=Object.fromEntries(await Promise.all(files.map(async f=>[f,sha(await readFile(root+'/'+f))])));
assert.equal(execFileSync('git',['diff','--name-only',base,'HEAD','--','src','tests'],{cwd:root,encoding:'utf8'}),'');
const T=await import(pathToFileURL(root+'/node_modules/three/build/three.module.js'));
const {createScenePair}=await import(pathToFileURL(root+'/tests/static-scene-fixture.mjs'));
const {Game,groundAt}=await import(pathToFileURL(root+'/src/core.js'));
const {tickVillage}=await import(pathToFileURL(root+'/src/village.js'));
const [,view]=await createScenePair();
const g=new Game(),npc=g.npcs().find(n=>n.id==='keeper');
Object.assign(g.player,{x:npc.x,z:npc.z+3,y:groundAt(npc.x,npc.z+3),moving:false});
tickVillage(g,0,groundAt);assert(g.interact({...npc,type:'npc'}));
view.game=g;view.yaw=.05;view.pitch=.3;view.zoom=9;
const inventory=[],textures=new Map(),rows=[];
function mipBytes(w,h){let n=0;for(;;){n+=w*h*4;if(w===1&&h===1)return n;w=Math.max(1,Math.floor(w/2));h=Math.max(1,Math.floor(h/2));}}
for(const [width,height] of [[1280,720],[844,390],[390,844]]){
  Object.assign(globalThis,{innerWidth:width,innerHeight:height});view.resize();view.focusGathering(null,'keeper');view.update(0,true);assert(view.dialogueCamera.shot);
  view.camera.updateMatrixWorld();view.npc.g.updateMatrixWorld(true);
  const meshes=[];view.npc.g.traverse(n=>{if(!n.isMesh)return;for(let p=n;p;p=p.parent)if(!p.visible)return;if(n.isSkinnedMesh)n.skeleton.update();meshes.push(n);});
  const bounds={};
  for(const n of meshes){
    const geo=n.geometry,m=n.material;const points=[];
    for(let i=0;i<geo.attributes.position.count;i++){
      const p=n.getVertexPosition(i,new T.Vector3()).applyMatrix4(n.matrixWorld).project(view.camera);
      points.push([(p.x*.5+.5)*width,(.5-p.y*.5)*height]);
    }
    if(m.name==='Q anatomical face'||m.name==='Q upper cloth'){
      const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);bounds[m.name]={x0:Math.min(...xs),x1:Math.max(...xs),y0:Math.min(...ys),y1:Math.max(...ys),width:Math.max(...xs)-Math.min(...xs),height:Math.max(...ys)-Math.min(...ys)};
    }
    if(!rows.length){
      const attributes=Object.fromEntries(Object.entries(geo.attributes).map(([k,a])=>[k,{count:a.count,bytes:a.array.byteLength,sha256:sha(new Uint8Array(a.array.buffer,a.array.byteOffset,a.array.byteLength))}]));
      const slots={};for(const k of ['map','normalMap','bumpMap','roughnessMap']){const t=m[k];if(!t){slots[k]=null;continue;}if(!textures.has(t)){const [w,h]=[t.image.width,t.image.height];textures.set(t,{name:t.name,width:w,height:h,colorSpace:t.colorSpace,type:t.type,format:t.format,generateMipmaps:t.generateMipmaps,cpuDataBytes:t.image.data?.byteLength??null,rgba8FullMipPayloadBytes:mipBytes(w,h)});}slots[k]=t.name;}
      inventory.push({name:n.name,material:m.name,color:m.color?.getHexString(),triangles:(geo.index?.count??geo.attributes.position.count)/3,vertices:geo.attributes.position.count,geometryBytes:Object.values(attributes).reduce((sum,a)=>sum+a.bytes,0)+(geo.index?.array.byteLength??0),attributes,indexHash:geo.index?sha(new Uint8Array(geo.index.array.buffer,geo.index.array.byteOffset,geo.index.array.byteLength)):null,slots,roughness:m.roughness,metalness:m.metalness,bumpScale:m.bumpScale});
    }
  }
  const eyes=[];for(const x of [-.046,.046]){
    const target=new T.Vector3(x,.05,.109).applyMatrix4(view.npc.head.matrixWorld),p=target.clone().project(view.camera);
    const ray=new T.Raycaster(view.camera.position,target.clone().sub(view.camera.position).normalize());
    const hit=ray.intersectObjects(meshes,false)[0];eyes.push({pixel:[(p.x*.5+.5)*width,(.5-p.y*.5)*height],firstMaterial:hit?.object.material.name??null});
    assert.equal(hit?.object.material.name,'Q eye');
  }
  rows.push({viewport:[width,height],shot:{distance:view.dialogueCamera.shot.distance,angle:view.dialogueCamera.shot.angle},camera:view.camera.position.toArray(),fovDegrees:view.camera.fov,projectionMatrix:view.camera.projectionMatrix.toArray(),headMeshProjectedBounds:bounds,eyes,sourceSafeFrame:{left:.08*width,right:.92*width,top:.035*height,bottom:.515*height},rootPosition:view.npc.g.position.toArray(),rootQuaternion:view.npc.g.quaternion.toArray()});
}
const old=JSON.parse(await readFile('/workspace/scratch/e72662e3b71f/q-visible-actor-method-v56/visibility.json','utf8'));
const historicalCoverage={path:'q-visible-actor-method-v56/visibility.json',sha256:sha(await readFile('/workspace/scratch/e72662e3b71f/q-visible-actor-method-v56/visibility.json')),sourceHashes:old.hashes,boundary:'Historical native 4px first-triangle grid, not rerun here and not raster/shading/DOM. Retained physical geometry versus v57 is established by the v57 cloth review; this is an attributed previous measurement.',rows:old.rows.map(r=>({viewport:r.viewport,estimatedVisibleAreaPixels:r.estimatedVisibleAreaPixels}))};
const summary={meshDrawUnits:inventory.length,triangles:inventory.reduce((n,m)=>n+m.triangles,0),geometryBytes:inventory.reduce((n,m)=>n+m.geometryBytes,0),uniqueSampledTextures:textures.size,rgba8MipPayloadBytes:[...textures.values()].reduce((n,t)=>n+t.rgba8FullMipPayloadBytes,0)};
assert.equal(summary.meshDrawUnits,13);assert.equal(summary.triangles,6718);assert.equal(summary.geometryBytes,319180);
assert(inventory.find(m=>m.material==='Q anatomical face').slots.map===null);
for(const f of files)assert.equal(sha(await readFile(root+'/'+f)),hashes[f]);
await writeFile(new URL('baseline.json',import.meta.url),JSON.stringify({at:new Date().toISOString(),sourceBase:base,localHead:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),hashes,boundary:'Real Game.interact + SceneView + DialogueCamera + native Three CPU vertex/ray/projection; fixture renderer/asset stubs. No DOM layout, rendering, texture upload/decoding, FPS, sound, device or visual-quality evaluation.',condition:{npc:'keeper / Mira / npc',playerOffset:[0,3],time:0,quality:'high',orbit:[.05,.3,9],samePoseLocation:true},summary,inventory,textures:[...textures.values()],rows,historicalCoverage},null,2));
console.log(JSON.stringify({summary,rows:rows.map(r=>({viewport:r.viewport,bounds:r.headMeshProjectedBounds,eyes:r.eyes,shot:r.shot}))},null,2));
