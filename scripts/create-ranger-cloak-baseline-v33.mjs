import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
const root=resolve(new URL('../',import.meta.url).pathname);
const fixture=resolve(root,'docs/evidence/projectile-media-v33/ranger-before-cloak-source.js');
const source=await readFile(fixture,'utf8');
// Composed baseline: v33 accepted arrow geometry with the entire original
// pre-UV cloak function from retained ab251b1 source. This is not a historical
// commit. Only the ranger contract is updated; all old fixtures stay intact.
const stdin=`import {createDetailedActor} from './src/actor-models.js';
import {actorContract,cloakMetric,frameSequence} from './tests/fixtures/cloak-uv-contract.mjs';
const a=createDetailedActor('ranger'),samples=[];a.g.updateMatrixWorld(true);
for(let sample=0;sample<=frameSequence.length;sample++){
 if(sample){const f=frameSequence[sample-1];a.g.position.set(f.state.x||0,0,f.state.z||0);a.animate(f.state,f.dt);a.g.updateMatrixWorld(true);}
 samples.push({contract:actorContract(a),metric:cloakMetric(a.cape)});
}
const actor=createDetailedActor('ranger');let triangles=0,meshes=0;actor.g.traverseVisible(n=>{if(n.isMesh){meshes++;triangles+=(n.geometry.index?.count??n.geometry.attributes.position.count)/3;}});
export default {samples,allFamily:{contract:actorContract(actor),triangles,meshes}};`;
await mkdir(resolve(root,'artifacts'),{recursive:true});
const output=resolve(root,'artifacts/cloak-ranger-before-v33.mjs');
await build({stdin:{contents:stdin,resolveDir:root,sourcefile:'cloak-ranger-before-input.mjs'},outfile:output,bundle:true,platform:'node',format:'esm',packages:'external',plugins:[{name:'retained-pre-cloak-geometry',setup(b){b.onLoad({filter:/[/\\]detailed-geometry\.js$/},()=>({contents:source,loader:'js',resolveDir:resolve(root,'src/assets/characters')}));}}]});
const {default:data}=await import(pathToFileURL(output));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const result={boundary:'Ranger-only composed baseline: independently accepted v33 arrow source with the retained original pre-UV cloak function. Not a historical commit. Original v31 and NPC fixtures and density/stretch thresholds remain intact.',source:{acceptedArrowCommit:'b7af1cdcddce13c732de732c467f6448a9fc3f2d',originalCloakCommit:'ab251b1',composition:'Only cloakGeometry replaced using the entire retained original function',retainedGeometry:'docs/evidence/projectile-media-v33/ranger-before-cloak-source.js',geometrySha256:hash(source),faceDataSha256:hash(await readFile(resolve(root,'src/assets/characters/identity-head-data.js'))),actorSha256:hash(await readFile(resolve(root,'src/actor-models.js')))},...data};
await writeFile(resolve(root,'tests/fixtures/cloak-ranger-before-uv-v33.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({triangles:data.allFamily.triangles,meshes:data.allFamily.meshes,samples:data.samples.length,source:result.source}));
