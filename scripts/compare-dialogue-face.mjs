import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {createHash} from 'node:crypto';
import * as T from 'three';
import {createDetailedActor} from '../src/actor-models.js';
import {heightAt} from '../src/core.js';
import {DIALOGUE_FRAME} from '../src/dialogue-camera.js';
import {HEAD_ATTRIBUTES as after,HEAD_SOURCE_IDS as ids} from '../src/assets/characters/identity-head-data.js';
import {HEAD_ATTRIBUTES as before,HEAD_SOURCE_IDS as oldIds} from '../src/assets/characters/anatomical-head-data.js';
const root=new URL('../',import.meta.url);
const report=JSON.parse(readFileSync(resolve(process.argv[2]||'artifacts/dialogue-framing-report.json')));
const actor=createDetailedActor('npc');actor.g.position.set(7,heightAt(7,80),80);actor.g.rotation.y=1.4;actor.animate({},0);actor.g.updateMatrixWorld(true);
const matrix=actor.head.matrixWorld,old=new Map(oldIds.map((id,i)=>[id,before[i]]));
const newPoints=after.map(a=>new T.Vector3(...a.slice(0,3)).applyMatrix4(matrix));
const bounds=new T.Box3().setFromPoints(newPoints),center=bounds.getCenter(new T.Vector3()),rows=[];
for(const route of report.results.filter(r=>r.id==='keeper'))for(const view of route.views){
 const [width,height]=view.viewport,measured=view.current;
 assert(new T.Vector3(...measured.worldHeadBounds[0]).distanceTo(bounds.min)<2e-6,'the retained native actor pose must match the actual route');
 assert(new T.Vector3(...measured.worldHeadBounds[1]).distanceTo(bounds.max)<2e-6);
 const camera=new T.PerspectiveCamera(54,width/height,.1,1100);camera.position.fromArray(measured.camera);camera.lookAt(center);camera.updateMatrixWorld();camera.projectionMatrix.elements[9]=-(1-2*DIALOGUE_FRAME.centerY);
 const screen=attributes=>{const p=new T.Vector3(...attributes.slice(0,3)).applyMatrix4(matrix).project(camera);return new T.Vector2((p.x*.5+.5)*width,(.5-p.y*.5)*height);};
 const projected=after.map(screen),headHeight=Math.max(...projected.map(p=>p.y))-Math.min(...projected.map(p=>p.y));
 assert(Math.abs(headHeight-measured.height)<.001,'same actual camera framing');
 const distances=[],seen=new Set();for(let i=0;i<after.length;i++){const id=ids[i];if(id<0||!old.has(id)||seen.has(id))continue;seen.add(id);distances.push(screen(old.get(id)).distanceTo(screen(after[i])));}
 const sorted=distances.slice().sort((a,b)=>a-b);
 rows.push({route:route.name,viewportCSS:view.viewport,commonSourceVertices:distances.length,actualHeadHeightCSSpx:headHeight,sameCameraSourceDisplacementCSSpx:{max:sorted.at(-1),p95:sorted[Math.floor(sorted.length*.95)],median:sorted[Math.floor(sorted.length*.5)],rms:Math.sqrt(distances.reduce((s,d)=>s+d*d,0)/distances.length)}});
}
assert.equal(rows.length,9);
const hashes=Object.fromEntries(['src/assets/characters/anatomical-head-data.js','src/assets/characters/identity-head-data.js','src/scene.js','src/dialogue-camera.js'].map(p=>[p,createHash('sha256').update(readFileSync(new URL(p,root))).digest('hex')]));
const result={recordedAt:new Date().toISOString(),boundary:'Same actual keeper pose/location and selected conversation camera, comparing only shared original source-vertex IDs. Novel LOD vertices are excluded. CPU projection, not pixels, rendered identity, a blinded comparison or PS4 acceptance.',hashes,rows};
const out=resolve(process.argv[3]||'artifacts/dialogue-face-comparison.json');mkdirSync(dirname(out),{recursive:true});writeFileSync(out,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(rows));
