// One bounded read-only native check: current source meshes plus the author's
// already recorded death .45 s fixture only. No new poses, render, or repo output.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const root=process.argv[2]??'/workspace/scratch/e72662e3b71f/Q-mira-cloth-micro-v62';
const u=p=>pathToFileURL(root+'/'+p),sha=p=>createHash('sha256').update(readFileSync(u(p))).digest('hex');
assert.equal(sha('review/cloth-micro-v62/surfaces.mjs'),'adc1b85b596eee63a799bb7a3d4d3c8c8c799dc88a469b535b26b05a0ca23193');
const {PARTS,FRAME,buildPart}=await import(u('review/cloth-micro-v62/surfaces.mjs'));
const {createDetailedActor}=await import(u('src/actor-models.js'));
const T=await import(u('node_modules/three/build/three.module.js'));
const saved=JSON.parse(readFileSync(u('docs/evidence/mira-cloth-micro-v62/meshes.json')));
const priorPose=JSON.parse(readFileSync(u('docs/evidence/mira-cloth-micro-v62/pose-probe.json'))).poses.find(p=>p.name==='death .45s explicit');
const actor=createDetailedActor('npc',{groundHeight:()=>0});actor.g.updateMatrixWorld(true);
const bones=new Map(),inverse=new Map();actor.g.traverse(n=>{if(n.isBone){bones.set(n.name,n);inverse.set(n.name,n.matrixWorld.clone().invert());}});
actor.animate({dead:true,deathElapsed:.45},0);actor.g.updateMatrixWorld(true);
const delta=new Map([...bones].map(([name,n])=>[name,n.matrixWorld.clone().multiply(inverse.get(name))]));
// Only IEEE signed zero is normalized; all other values, keys and tolerances remain exact.
const signedZero=x=>typeof x==='number'?(Object.is(x,-0)?0:x):Array.isArray(x)?x.map(signedZero):x&&typeof x==='object'?Object.fromEntries(Object.entries(x).map(([k,v])=>[k,signedZero(v)])):x;
const rows=[];
for(const part of PARTS){
 const m=buildPart(part),record=saved.find(x=>x.id===m.id);assert.deepEqual(signedZero(m),record,'fresh source must equal frozen mesh, with signed zero normalized');
 const edges=new Map(),p=m.positions.map(x=>new T.Vector3(...x));let minArea=Infinity,minNormalDot=1,normalUnitError=0,weightError=0;
 for(const n of m.normals)normalUnitError=Math.max(normalUnitError,Math.abs(Math.hypot(...n)-1));
 for(const w of m.skinWeights){weightError=Math.max(weightError,Math.abs(Object.values(w).reduce((a,b)=>a+b,0)-1));for(const [name,value]of Object.entries(w)){assert(bones.has(name));assert(value>=0&&value<=1);}}
 for(const ids of m.indices){const normal=p[ids[1]].clone().sub(p[ids[0]]).cross(p[ids[2]].clone().sub(p[ids[0]]));minArea=Math.min(minArea,normal.length()/2);normal.normalize();for(const i of ids)minNormalDot=Math.min(minNormalDot,normal.dot(new T.Vector3(...m.normals[i])));for(let i=0;i<3;i++){const a=ids[i],b=ids[(i+1)%3],key=[a,b].sort((a,b)=>a-b).join('/');const e=edges.get(key)??[];e.push([a,b]);edges.set(key,e);}}
 const boundary=[...edges.values()].filter(e=>e.length===1).map(e=>e[0]),degree=new Map();for(const[a,b]of boundary){degree.set(a,[...(degree.get(a)??[]),b]);degree.set(b,[...(degree.get(b)??[]),a]);}const seen=new Set(),queue=[boundary[0][0]];while(queue.length){const i=queue.pop();if(seen.has(i))continue;seen.add(i);queue.push(...degree.get(i));}
 const nonManifold=[...edges.values()].filter(e=>e.length>2).length,sameDirection=[...edges.values()].filter(e=>e.length===2&&e[0][0]===e[1][0]).length;
 const obj=readFileSync(u(`docs/evidence/mira-cloth-micro-v62/${m.id}.obj`),'utf8').split('\n').filter(l=>l.startsWith('v ')).map(l=>l.slice(2).split(/\s+/).map(Number));assert.equal(obj.length,p.length);let objMaxError=0;for(let i=0;i<p.length;i++)objMaxError=Math.max(objMaxError,new T.Vector3(...obj[i]).distanceTo(p[i].clone().add(new T.Vector3(...FRAME.rootOffset))));
 const posed=[],normals=[];for(let i=0;i<p.length;i++){const rest=p[i].clone().add(new T.Vector3(...FRAME.rootOffset)),out=new T.Vector3(),n=new T.Vector3();for(const [name,w]of Object.entries(m.skinWeights[i])){out.addScaledVector(rest.clone().applyMatrix4(delta.get(name)),w);n.addScaledVector(new T.Vector3(...m.normals[i]).applyMatrix3(new T.Matrix3().getNormalMatrix(delta.get(name))),w);}posed.push(out);normals.push(n.normalize());}
 let posedMinArea=Infinity,posedMinNormalDot=1,poseReadbackError=0;const prior=priorPose.parts.find(x=>x.id===m.id);for(let i=0;i<posed.length;i++)poseReadbackError=Math.max(poseReadbackError,posed[i].distanceTo(new T.Vector3(...prior.positions[i])));
 for(const ids of m.indices){const n=posed[ids[1]].clone().sub(posed[ids[0]]).cross(posed[ids[2]].clone().sub(posed[ids[0]]));posedMinArea=Math.min(posedMinArea,n.length()/2);n.normalize();for(const i of ids)posedMinNormalDot=Math.min(posedMinNormalDot,n.dot(normals[i]));}
 assert(minArea>0&&minNormalDot>0&&nonManifold===0&&sameDirection===0);assert.equal(seen.size,degree.size);assert([...degree.values()].every(x=>x.length===2));assert(normalUnitError<1e-12&&weightError<1e-12&&objMaxError<1e-9);
 rows.push({id:m.id,vertices:p.length,triangles:m.indices.length,boundaryEdges:boundary.length,boundaryLoops:1,nonManifold,sameDirectionEdges:sameDirection,minAreaM2:minArea,minFaceVertexNormalDot:minNormalDot,normalUnitError,weightSumError:weightError,freshMeshEqualsFrozenExceptSignedZero:true,objReadbackMaxErrorM:objMaxError,neighboursWelded:false,thicknessM:m.thicknessMetres,death045:{minWorldY:Math.min(...posed.map(p=>p.y)),minAreaM2:posedMinArea,minFaceVertexNormalDot:posedMinNormalDot,maxPositionDifferenceFromRecordedPoseM:poseReadbackError,finite:posed.every(p=>p.toArray().every(Number.isFinite))}});
}
const result={at:new Date().toISOString(),oracleCorrection:'Only -0 -> 0 prior to exact structural comparison; first stopped result preserved separately.',boundary:'One completed native source pass and one already-authored actual actor death .45 s pose. No rendering, new pose set, body or seam collision guarantee.',sourceSha256:sha('review/cloth-micro-v62/surfaces.mjs'),actorSha256:sha('src/actor-models.js'),rows,remainingRuntimeBlocker:'P01 chest-only weighting penetrates floor; free cloth/support and all adjacent seam contracts are unimplemented.'};
writeFileSync(new URL('native-check.json',import.meta.url),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
