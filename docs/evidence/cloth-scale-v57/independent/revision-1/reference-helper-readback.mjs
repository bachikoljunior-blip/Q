import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {registerHooks} from 'node:module';
import {createHash} from 'node:crypto';

// Keep the independent pre-cloak geometry and its original expected contracts.
// Two views of that same fixed source anchor animation/non-target preservation:
// original -> historical JSON, and upper-cloth composition -> current actor.
// No current cloak/body recipe is copied into the reference side.
const record=JSON.parse(readFileSync(new URL('cloak-npc-before-uv-v32.json',import.meta.url)));
const source=readFileSync(new URL('../../'+record.source.retainedGeometry,import.meta.url),'utf8');
assert.equal(createHash('sha256').update(source).digest('hex'),record.source.geometrySha256);
function replaceOnce(text,from,to){assert.equal(text.split(from).length,2,`Pre-cloak composition anchor: ${from}`);return text.replace(from,to);}
let composed="import {upperCloth} from './cloth-material.js';\n"+source;
for(const [from,to]of [
  ['const arms=[],legs=[];','const arms=[],legs=[],sleeves=[];'],
  ['    tailored(shoulder,m.cloth,[','    sleeves.push(tailored(shoulder,m.cloth,['],
  ['widths:[.14,.16,.09]},12,.035);','widths:[.14,.16,.09]},12,.035));'],
  ["  const right=g.getObjectByName('hand-1'),left=g.getObjectByName('hand-0');","  if(type==='npc')upperCloth([torso,...sleeves],m.cloth);\n  const right=g.getObjectByName('hand-1'),left=g.getObjectByName('hand-0');"],
])composed=replaceOnce(composed,from,to);
const actorURL=new URL('../../src/actor-models.js',import.meta.url).href,geometryURL=new URL('../../src/assets/characters/detailed-geometry.js',import.meta.url).href;
const actors=[actorURL+'?cloak-original-v32',actorURL+'?cloak-upper-v57'],geometries=[geometryURL+'?cloak-original-v32',geometryURL+'?cloak-upper-v57'];
const hook=registerHooks({
  resolve(specifier,context,next){const result=next(specifier,context),index=actors.indexOf(context.parentURL);return index>=0&&result.url===geometryURL?{...result,url:geometries[index]}:result;},
  load(url,context,next){const index=geometries.indexOf(url);return index<0?next(url,context):{format:'module',source:index?composed:source,shortCircuit:true};},
});
let original,withUpperCloth;
try{[original,withUpperCloth]=await Promise.all(actors.map(url=>import(url)));}finally{hook.deregister();}
export const createOriginalNpc=()=>original.createDetailedActor('npc');
export const createUpperNpcBeforeCloakUV=()=>withUpperCloth.createDetailedActor('npc');
