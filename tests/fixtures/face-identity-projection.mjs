// Actual actor/head transforms and perspective math; no rasterization or visible-pixel claim.
import {writeFileSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import * as T from 'three';
import {createDetailedActor} from '../../src/actor-models.js';
import {HEAD_ATTRIBUTES as A,HEAD_SOURCE_IDS as S} from '../../src/assets/characters/identity-head-data.js';
import {HEAD_ATTRIBUTES as B,HEAD_SOURCE_IDS as BS} from '../../src/assets/characters/anatomical-head-data.js';
const a=createDetailedActor('npc');a.animate({},0);a.g.updateMatrixWorld(true);
const old=new Map(BS.map((id,i)=>[id,B[i]])),samples=[];
for(const [width,height]of[[390,844],[844,390]]){
 const d=9*(height>width?1.12:1),c=new T.PerspectiveCamera(54,width/height,.1,1100);c.position.set(Math.sin(.06)*Math.cos(.3)*d,1.7+Math.sin(.3)*d,Math.cos(.06)*Math.cos(.3)*d);c.lookAt(0,1.6,0);c.updateMatrixWorld(true);
 const screen=p=>{const v=new T.Vector3(...p.slice(0,3)).applyMatrix4(a.head.matrixWorld).project(c);return[(v.x+1)*width/2,(1-v.y)*height/2];};
 const distances=[],seen=new Set();for(let i=0;i<A.length;i++){const source=S[i];if(source<0||!old.has(source)||seen.has(source))continue;seen.add(source);const before=screen(old.get(source)),after=screen(A[i]);distances.push(Math.hypot(after[0]-before[0],after[1]-before[1]));}
 samples.push({viewportCSS:[width,height],camera:c.position.toArray(),target:[0,1.6,0],commonSourceVertices:distances.length,maxDisplacementCSSpx:Math.max(...distances),rmsDisplacementCSSpx:Math.sqrt(distances.reduce((sum,d)=>sum+d*d,0)/distances.length)});
}
const hashes=Object.fromEntries(['anatomical-head-data.js','identity-head-data.js'].map(file=>[file,createHash('sha256').update(readFileSync(new URL('../../src/assets/characters/'+file,import.meta.url))).digest('hex')]));
writeFileSync(new URL('../../docs/evidence/face-identity-v31-final-projection.json',import.meta.url),JSON.stringify({boundary:'Same npc root, idle pose and actor-centred ordinary camera; common original source-vertex IDs only. New LOD vertices are excluded from point-pair displacement; no occlusion/raster/pixel identity judgment. NPC is not a gathering cast member and solo dialogue does not change camera distance.',hashes,samples},null,2)+'\n');
