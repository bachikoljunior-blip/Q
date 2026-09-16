import {readFile,writeFile,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {buildActorGeometry} from '../Q-ps4-v33/src/assets/characters/detailed-geometry.js';
import {createDetailedActor} from '../Q-ps4-v33/src/actor-models.js';
const root=new URL('../Q-ps4-v33/',import.meta.url),sourceRoot=new URL('../q-v33-actor-material-study/source/',import.meta.url),out=new URL('./',import.meta.url);
const hash=b=>createHash('sha256').update(b).digest('hex');
const metadata=JSON.parse(await readFile(new URL('polyhaven_info_cotton_jersey.json',sourceRoot),'utf8'));
const physical=metadata.dimensions.map(x=>x/1000);
const actor=buildActorGeometry('player'),cape=actor.getObjectByName('cape'),p=cape.geometry.attributes.position,u=cape.geometry.attributes.uv;
const xyz=i=>[p.getX(i),p.getY(i),p.getZ(i)],distance=(a,b)=>Math.hypot(...xyz(a).map((x,k)=>x-xyz(b)[k]));
let area=0;const rows=[],travel=[0];for(let j=0;j<=12;j++){let arc=0,step=0;for(let i=1;i<=8;i++)arc+=distance(j*9+i,j*9+i-1);if(j){for(let i=0;i<=8;i++)step+=distance(j*9+i,(j-1)*9+i)/9;travel.push(travel.at(-1)+step);area+=(rows.at(-1).arcM+arc)/2*step;}rows.push({row:j,arcM:arc,uMin:u.getX(j*9),uMax:u.getX(j*9+8),v:u.getY(j*9)});}
const metersPerUV=Math.sqrt(area),repeat=physical.map(x=>metersPerUV/x);
const families=[];for(const role of ['player','npc','sena','scout','traveler','ranger','boss']){const a=createDetailedActor(role);let sameMaterialMeshes=0;a.g.traverse(n=>{if(n.isMesh&&n.material===a.cape.material)sameMaterialMeshes++;});families.push({role,scale:a.g.scale.toArray(),capeGeometryOwn:a.cape.geometry!==cape.geometry,material:a.cape.material.name,clothColorLinear:a.cape.material.color.toArray(),map:a.cape.material.map?.name||null,bumpScale:a.cape.material.bumpScale,repeat:a.cape.material.bumpMap.repeat.toArray(),sameMaterialMeshes});}
const projection=[];for(const [viewport,H] of [['1280x720',720],['844x390',390],['390x844',844]])for(const d of [9,2.6]){const pxPerM=H/(2*Math.tan(54*Math.PI/360)*d);projection.push({viewport,perpendicularDistanceM:d,pxPerM,clothTileHeightPx:physical[1]*pxPerM,sourceTexelsPerScreenPixel:(1025/physical[1])/pxPerM,estimatedMipmapLod:Math.log2((1025/physical[1])/pxPerM),cottonFrequencyPeakPeriodPx:[physical[0]/318*pxPerM,physical[1]/263*pxPerM],currentProceduralPeriodPx:metersPerUV/64*pxPerM});}
const sourceFiles=['src/assets/characters/detailed-geometry.js','src/actor-models.js','src/scene.js','src/skin-materials.js','src/skin-texture-loader.js'];
const sourceHashes=Object.fromEntries(await Promise.all(sourceFiles.map(async x=>[x,hash(await readFile(new URL(x,root)))])));
const photo=await readFile(new URL('cotton_jersey_diff_1k.jpg',sourceRoot));
const q85Length=5*Math.ceil(photo.length/4)+`q85:image/jpeg:${photo.length}:`.length;
const baselineHTML=await readFile(new URL('release/Q-ash-pilgrim.html',root));
const result={at:new Date().toISOString(),base:'39e47a4fa204ea6576c685bf25569727e410cd01',sourceHashes,physicalTileM:physical,photo:{source:'cotton_jersey_diff_1k.jpg',bytes:photo.length,sha256:hash(photo),md5:createHash('md5').update(photo).digest('hex'),q85RepresentationCharacters:q85Length,rgba8MipsBytes:5596500,MiB:5596500/1048576},cape:{vertices:p.count,triangles:cape.geometry.index.count/3,referenceStripAreaM2:area,metersPerUV,photoRepeat:repeat,rows,families},projection,deliverySnapshot:{standaloneBytes:baselineHTML.length,sha256:hash(baselineHTML),remainingBeforePhoto:16777216-baselineHTML.length,withPhotoPayloadOnly:baselineHTML.length+q85Length,remainingAfterPhotoPayloadOnly:16777216-baselineHTML.length-q85Length,warning:'Parent may be rebuilding; no loader/code allowance or final candidate package in this source-only study'},skinExistingMipBytes:22369620,combinedSkinAndOneClothMipBytes:22369620+5596500};
await writeFile(new URL('measurements.json',out),JSON.stringify(result,null,2));console.log(JSON.stringify({metersPerUV,repeat,photo:result.photo,delivery:result.deliverySnapshot,projection},null,2));
