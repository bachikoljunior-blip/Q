import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
const root=resolve(new URL('../',import.meta.url).pathname);
const fixture=resolve(root,'docs/evidence/dialogue-appearance-v32/face-before-cloak-source.js');
const source=await readFile(fixture,'utf8');
// Retained source is ab251b1: accepted NPC face + v31 bow BEFORE cloak UV edits.
// It is an independent pre-change geometry input, not the current implementation.
const stdin=`import {createDetailedActor} from './src/actor-models.js';
import {actorContract,cloakMetric,frameSequence} from './tests/fixtures/cloak-uv-contract.mjs';
const a=createDetailedActor('npc'),samples=[];a.g.updateMatrixWorld(true);
for(let sample=0;sample<=frameSequence.length;sample++){
 if(sample){const f=frameSequence[sample-1];a.g.position.set(f.state.x||0,0,f.state.z||0);a.animate(f.state,f.dt);a.g.updateMatrixWorld(true);}
 samples.push({contract:actorContract(a),metric:cloakMetric(a.cape)});
}
const actor=createDetailedActor('npc');let triangles=0,meshes=0;actor.g.traverseVisible(n=>{if(n.isMesh){meshes++;triangles+=(n.geometry.index?.count??n.geometry.attributes.position.count)/3;}});
export default {samples,allFamily:{contract:actorContract(actor),triangles,meshes}};`;
await mkdir(resolve(root,'artifacts'),{recursive:true});
const output=resolve(root,'artifacts/cloak-npc-before-v32.mjs');
await build({stdin:{contents:stdin,resolveDir:root,sourcefile:'cloak-npc-before-input.mjs'},outfile:output,bundle:true,platform:'node',format:'esm',packages:'external',plugins:[{name:'retained-pre-cloak-geometry',setup(b){b.onLoad({filter:/[/\\]detailed-geometry\.js$/},()=>({contents:source,loader:'js',resolveDir:resolve(root,'src/assets/characters')}));}}]});
const {default:data}=await import(pathToFileURL(output));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const result={boundary:'NPC-only pre-cloak geometry baseline after independently validated face integration. The original v31 cloak baseline remains intact for every other actor and all original stretch/density values.',source:{localBeforeCloakCommit:'ab251b1',retainedGeometry:'docs/evidence/dialogue-appearance-v32/face-before-cloak-source.js',geometrySha256:hash(source),faceDataSha256:hash(await readFile(resolve(root,'src/assets/characters/identity-head-data.js'))),actorSha256:hash(await readFile(resolve(root,'src/actor-models.js')))},...data};
await writeFile(resolve(root,'tests/fixtures/cloak-npc-before-uv-v32.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({triangles:data.allFamily.triangles,meshes:data.allFamily.meshes,samples:data.samples.length,source:result.source}));
