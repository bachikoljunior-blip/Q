// CPU-side source/geometry evidence only. Does not initialize WebGL or measure FPS.
import { createDetailedActor, ACTOR_FAMILIES } from '../src/actor-models.js';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
const rows=[];
for(const [family,theme] of [...ACTOR_FAMILIES.map(f=>[f,null]),...['ember','tide','gale','moss'].map(t=>['soldier',t])]){
  const actor=createDetailedActor(family,{theme}),r={family,theme,triangles:0,draws:0,vertices:0,blendedVertices:0,maxInfluences:0,bones:actor.rest.length,bufferBytes:0};
  const materials=new Set(),textures=new Set(),palettes=new Set();let weightError=0;
  actor.g.traverseVisible(n=>{if(!n.isMesh)return;r.draws++;materials.add(n.material);if(n.isSkinnedMesh)palettes.add(n.skeleton);r.triangles+=(n.geometry.index?.count||n.geometry.attributes.position.count)/3;r.vertices+=n.geometry.attributes.position.count;
    for(const a of Object.values(n.geometry.attributes))r.bufferBytes+=a.array.byteLength;r.bufferBytes+=n.geometry.index?.array.byteLength||0;
    for(const key of ['map','bumpMap','roughnessMap','normalMap'])if(n.material[key])textures.add(n.material[key]);
    const w=n.geometry.attributes.skinWeight;if(w)for(let i=0;i<w.count;i++){let sum=0,count=0;for(let c=0;c<4;c++){const v=w.array[i*4+c];sum+=v;if(v>1e-5)count++;}r.blendedVertices+=count>1?1:0;r.maxInfluences=Math.max(r.maxInfluences,count);weightError=Math.max(weightError,Math.abs(1-sum));}
  });
  r.skeletonPalettes=palettes.size;r.materials=materials.size;r.textureBytes=[...textures].reduce((sum,t)=>sum+(t.image?.data?.byteLength||0),0);r.maxWeightError=weightError;rows.push(r);
}
const source=await readFile(new URL('../src/assets/characters/detailed-geometry.js',import.meta.url));
console.log(JSON.stringify({evidence:'CPU geometry, buffer and rig structure; no WebGL pixels, device performance or artistic parity',recipe:{bytes:source.length,gzipBytes:gzipSync(source).length,sha256:createHash('sha256').update(source).digest('hex')},actors:rows},null,2));
