import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';

const root='/workspace/scratch/e72662e3b71f/Q-cloak-uv-v33';
const out='/workspace/scratch/e72662e3b71f/q-v33-cloak-uv-review';
const base='892f7e59f602e20da62bf1c8708e432ce1eac637';
const startedAtUTC=new Date().toISOString();
const sha=b=>createHash('sha256').update(b).digest('hex');
const url=p=>pathToFileURL(p).href;
const data=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const three=url(root+'/node_modules/three/build/three.module.js');
const T=await import(three);
const geometryPath='src/assets/characters/detailed-geometry.js';
const oldSource=execFileSync('git',['show',base+':'+geometryPath],{cwd:root,encoding:'utf8'});
const newSource=readFileSync(root+'/'+geometryPath,'utf8');
const dependencies=['src/actor-models.js','src/character-motion.js','src/bow-contact.js','src/content.js','src/skin-materials.js','src/assets/characters/anatomical-head-data.js'];
const unchangedSourceHashes={};
for(const p of dependencies){const current=readFileSync(root+'/'+p),old=execFileSync('git',['show',base+':'+p],{cwd:root});assert(current.equals(old),'Unexpected source change: '+p);unchangedSourceHashes[p]=sha(current);}

async function load(source){
 let s=source.replaceAll("from 'three'",`from '${three}'`)
 .replaceAll("from 'three/addons/utils/BufferGeometryUtils.js'",`from '${url(root+'/node_modules/three/examples/jsm/utils/BufferGeometryUtils.js')}'`)
 .replaceAll("from 'three/addons/utils/SkeletonUtils.js'",`from '${url(root+'/node_modules/three/examples/jsm/utils/SkeletonUtils.js')}'`)
 .replaceAll("from './anatomical-head-data.js'",`from '${url(root+'/src/assets/characters/anatomical-head-data.js')}'`)
 .replaceAll("from '../../skin-materials.js'",`from '${url(root+'/src/skin-materials.js')}'`);
 s+='\nexport {cloakGeometry};';
 const geometryURL=data(s),geometry=await import(geometryURL);
 let a=readFileSync(root+'/src/actor-models.js','utf8')
 .replaceAll("from './assets/characters/detailed-geometry.js'",`from '${geometryURL}'`)
 .replaceAll("from './bow-contact.js'",`from '${url(root+'/src/bow-contact.js')}'`)
 .replaceAll("from './character-motion.js'",`from '${url(root+'/src/character-motion.js')}'`)
 .replaceAll("from 'three'",`from '${three}'`);
 return {...geometry,...await import(data(a))};
}
const old=await load(oldSource),current=await load(newSource);
function identicalArray(a,b,label){assert.equal(a?.constructor,b?.constructor,label+' array type');assert.equal(a?.length,b?.length,label+' length');if(a)assert(Buffer.from(a.buffer,a.byteOffset,a.byteLength).equals(Buffer.from(b.buffer,b.byteOffset,b.byteLength)),label+' bytes');}
function attributesEqual(a,b,exceptUV=false){assert.deepEqual(Object.keys(a.attributes),Object.keys(b.attributes));for(const key of Object.keys(a.attributes)){if(key==='uv'&&exceptUV)continue;assert.equal(a.attributes[key].itemSize,b.attributes[key].itemSize);assert.equal(a.attributes[key].normalized,b.attributes[key].normalized);identicalArray(a.attributes[key].array,b.attributes[key].array,key);}identicalArray(a.index?.array,b.index?.array,'index');}
function texture(t){if(!t)return null;return {name:t.name,imageWidth:t.image?.width,imageHeight:t.image?.height,dataHash:t.image?.data?sha(t.image.data):null,repeat:t.repeat.toArray(),offset:t.offset.toArray(),center:t.center.toArray(),rotation:t.rotation,wrapS:t.wrapS,wrapT:t.wrapT,minFilter:t.minFilter,magFilter:t.magFilter,mipmaps:t.generateMipmaps,colorSpace:t.colorSpace};}
function material(m){if(Array.isArray(m))return m.map(material);return {type:m.type,name:m.name,color:m.color?.toArray(),roughness:m.roughness,metalness:m.metalness,bumpScale:m.bumpScale,side:m.side,transparent:m.transparent,opacity:m.opacity,depthWrite:m.depthWrite,map:texture(m.map),bumpMap:texture(m.bumpMap),normalMap:texture(m.normalMap),roughnessMap:texture(m.roughnessMap),alphaMap:texture(m.alphaMap)};}
function tree(actor){const rows=[];actor.g.traverse(n=>rows.push(n));return rows;}
function compareActor(a,b,ordinary){const aa=tree(a),bb=tree(b);assert.equal(aa.length,bb.length);for(let i=0;i<aa.length;i++){const x=aa[i],y=bb[i];assert.equal(x.name,y.name);assert.equal(x.type,y.type);assert.equal(x.visible,y.visible);assert.deepEqual(x.position.toArray(),y.position.toArray());assert.deepEqual(x.quaternion.toArray(),y.quaternion.toArray());assert.deepEqual(x.scale.toArray(),y.scale.toArray());if(x.isMesh){attributesEqual(x.geometry,y.geometry,ordinary&&x===a.cape);assert.deepEqual(material(x.material),material(y.material));}}}
function budget(a){let triangles=0,draws=0;const palettes=new Set();a.g.traverseVisible(n=>{if(n.isMesh){draws++;triangles+=(n.geometry.index?.count||n.geometry.attributes.position.count)/3;if(n.skeleton)palettes.add(n.skeleton);}});assert(triangles<8000&&draws<=14);assert.equal(palettes.size,1);return {triangles,draws,palettes:palettes.size};}
function q(rows,value){const sorted=rows.toSorted((a,b)=>a[0]-b[0]),total=sorted.reduce((s,r)=>s+r[1],0);let sum=0;for(const r of sorted){sum+=r[1];if(sum>=total*value)return r[0];}return null;}
function distribution(rows){return {min:Math.min(...rows.map(r=>r[0])),p05:q(rows,.05),median:q(rows,.5),p95:q(rows,.95),max:Math.max(...rows.map(r=>r[0]))};}
function measure(g,matrix=new T.Matrix4()){
 const p=g.attributes.position,uv=g.attributes.uv,idx=g.index.array;
 const points=Array.from({length:p.count},(_,i)=>new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(matrix));
 let area=0,uvArea=0,positive=0,negative=0,zero=0,zeroGeometry=0;const anisotropy=[],density=[];
 for(let k=0;k<idx.length;k+=3){const [i,j,l]=idx.slice(k,k+3),e1=points[j].clone().sub(points[i]),e2=points[l].clone().sub(points[i]),cross=e1.clone().cross(e2).length(),weight=cross/2,du1=uv.getX(j)-uv.getX(i),dv1=uv.getY(j)-uv.getY(i),du2=uv.getX(l)-uv.getX(i),dv2=uv.getY(l)-uv.getY(i),signed=(du1*dv2-dv1*du2)/2;
 area+=weight;uvArea+=Math.abs(signed);if(signed>1e-12)positive++;else if(signed< -1e-12)negative++;else zero++;
 assert(Math.abs(signed)>1e-12,'Degenerate UV');if(weight<=1e-14){zeroGeometry++;continue;}
 const len=e1.length(),along=e1.dot(e2)/len,height=cross/len,a=du1/len,b=(du2-du1*along/len)/height,c=dv1/len,d=(dv2-dv1*along/len)/height,trace=a*a+b*b+c*c+d*d,det=(a*d-b*c)**2,disc=Math.sqrt(Math.max(0,trace*trace-4*det)),high=Math.sqrt((trace+disc)/2),low=Math.sqrt(Math.max(0,(trace-disc)/2));
 anisotropy.push([high/low,weight]);density.push([256*Math.sqrt(Math.abs(signed)/weight),weight]);}
 return {vertices:p.count,triangles:idx.length/3,areaM2:area,absoluteUVArea:uvArea,uvSigns:{positive,negative,zero},zeroGeometryTrianglesExcludedFromJacobian:zeroGeometry,equivalentTexelsPerMetre:256*Math.sqrt(uvArea/area),anisotropy:distribution(anisotropy),density:distribution(density)};
}
const result={startedAtUTC,base,head:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),sourceHashes:{baselineGeometry:sha(oldSource),candidateGeometry:sha(newSource),...unchangedSourceHashes},boundary:'Host Node / Three.js CPU geometry and existing procedural motion only; no browser, WebGL, GPU, game pixels, texture appearance or PS4 performance/quality acceptance.',method:'Independent world-space triangle tangent Jacobian, singular-value ratio, physical triangle area-weighted quantiles. Texture remains 64x64, repeat(4,4), 256 texels/UV. Baseline loaded from exact git object; source snapshots transformed only in memory for module imports. Shared dependencies asserted byte-identical to base.',bind:{},families:[],motion:[],assertions:[]};
for(const long of [false,true]){const a=old.cloakGeometry(long),b=current.cloakGeometry(long);attributesEqual(a,b,!long);const baseline=measure(a),candidate=measure(b);assert.equal(candidate.uvSigns.negative,192);assert.equal(candidate.uvSigns.zero,0);assert(Math.abs(candidate.absoluteUVArea-baseline.absoluteUVArea)<1e-6);if(!long){assert(candidate.anisotropy.p95<1.2);assert(candidate.anisotropy.p95<baseline.anisotropy.p95);}result.bind[long?'bossExcluded':'ordinary']={baseline,candidate};}
const ordinary=['player','npc','sena','scout','traveler','ranger'];
for(const family of current.ACTOR_FAMILIES){const a=old.createDetailedActor(family),b=current.createDetailedActor(family),clone=current.createDetailedActor(family);compareActor(a,b,ordinary.includes(family));assert.notEqual(b.head,clone.head);if(b.cape){assert.notEqual(b.cape.geometry,clone.cape.geometry);identicalArray(b.cape.geometry.attributes.uv.array,clone.cape.geometry.attributes.uv.array,'clone UV');}result.families.push({family,rootScale:b.g.scale.toArray(),budget:budget(b),allNonCapeUVGeometryAndMaterialsEqual:true,independentClone:true});
 if(!ordinary.includes(family)&&family!=='boss')continue;
 const uvBefore=sha(b.cape.geometry.attributes.uv.array),metrics=[];
 let z=0,frames=0;
 for(const [stateName,speed] of [['idle',0],['walk',2.5],['run',8.5],['death',0]]){
  const oldP95=[],newP95=[],ratios=[],degenerate=[];let worstRatioFrame=null;
  for(let f=0;f<60;f++){z+=speed/60;const state=Object.freeze({x:0,y:0,z,moving:speed>0,dead:stateName==='death',...(stateName==='death'?{deathElapsed:f/59}:{}),weaponType:'sword'});
   for(const actor of [a,b]){actor.g.position.set(0,0,z);actor.animate(state,1/60);actor.g.updateMatrixWorld(true);}
   assert.equal(a.motion.state,stateName);assert.deepEqual(a.motion,b.motion);assert.deepEqual(a.contacts,b.contacts);assert.deepEqual(a.plants,b.plants);
   attributesEqual(a.cape.geometry,b.cape.geometry,true);identicalArray(a.cape.userData.base,b.cape.userData.base,'cape saved base');
   assert.deepEqual(a.cape.matrixWorld.elements,b.cape.matrixWorld.elements);
   for(let i=0;i<a.rest.length;i++){const x=a.rest[i].node,y=b.rest[i].node;assert.deepEqual(x.position.toArray(),y.position.toArray());assert.deepEqual(x.quaternion.toArray(),y.quaternion.toArray());assert.deepEqual(x.scale.toArray(),y.scale.toArray());}
   const baseline=measure(a.cape.geometry,a.cape.matrixWorld),candidate=measure(b.cape.geometry,b.cape.matrixWorld);
   assert.equal(candidate.uvSigns.negative,192);assert.equal(candidate.uvSigns.zero,0);assert(Math.abs(candidate.equivalentTexelsPerMetre/baseline.equivalentTexelsPerMetre-1)<1e-6);
   assert.equal(baseline.zeroGeometryTrianglesExcludedFromJacobian,candidate.zeroGeometryTrianglesExcludedFromJacobian);
   const ratio=candidate.anisotropy.p95/baseline.anisotropy.p95;
   oldP95.push(baseline.anisotropy.p95);newP95.push(candidate.anisotropy.p95);ratios.push(ratio);degenerate.push(candidate.zeroGeometryTrianglesExcludedFromJacobian);
   if(!worstRatioFrame||ratio>worstRatioFrame.ratio)worstRatioFrame={frame:f,deathElapsed:state.deathElapsed,ratio,baseline,candidate};
   if(f===30)metrics.push({state:stateName,frame:f,baseline,candidate});frames++;
  }
  metrics.push({state:stateName,frames:60,p95Range:{baseline:[Math.min(...oldP95),Math.max(...oldP95)],candidate:[Math.min(...newP95),Math.max(...newP95)]},candidateBaselineP95RatioRange:[Math.min(...ratios),Math.max(...ratios)],degenerateGeometryTrianglesRange:[Math.min(...degenerate),Math.max(...degenerate)],framesWithWorseP95:ratios.filter(r=>r>1+1e-10).length,worstRatioFrame});
 }
 assert.equal(sha(b.cape.geometry.attributes.uv.array),uvBefore,'Animation must not mutate UV');
 result.motion.push({family,frames,positionsIndicesNormalsBonesAndContactsExactlyEqual:true,uvUnchangedDuringAnimation:true,metrics});
}
assert.equal(sha(readFileSync(root+'/'+geometryPath)),result.sourceHashes.candidateGeometry,'Source changed during review');
result.assertions=['Only ordinary cape UV differs across all 14 runtime families; all other mesh attributes, indices, transforms, visibility and material/texture parameters equal exact base.','Boss long cape including UV remains byte-identical.','Every family stays below 8000 triangles and at most 14 draws with one skin palette.','Every cloned cape has independent geometry and identical UVs.','6 normal-cape families + boss, 240 frames each: cape positions/index/normals, all bone transforms, contacts and plant records exactly equal baseline.','All cape UV signs remain uniformly negative; none zero.','Total absolute UV area and area-equivalent texel density retained within 1e-6.'];
result.finishedAtUTC=new Date().toISOString();result.scriptSHA256=sha(readFileSync(new URL(import.meta.url)));
result.limitations=['Existing death motion flattens and floor-clamps the cape; zero-area geometric triangles are counted and omitted only from the undefined tangent Jacobian, equally in base and candidate. Total UV area includes their UV area.','Ordinary cape P95 is lower in all 60 sampled frames each of idle/walk/run. Some transient death frames have worse anisotropy with the new fixed UV chart despite identical geometry and no UV sign changes; this is not an all-state stretch improvement.','All 14 default families were independently checked here; four themed variants are covered by the author tests, not repeated in this independent audit.'];
writeFileSync(out+'/review.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({startedAtUTC,finishedAtUTC:result.finishedAtUTC,sourceHashes:result.sourceHashes,bind:result.bind,families:result.families,motion:result.motion.map(r=>({family:r.family,frames:r.frames,metrics:r.metrics.filter(x=>x.frames)})),assertions:result.assertions},null,2));
