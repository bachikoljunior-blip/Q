// Import the pinned CC0 KayKit release, retaining only gameplay animations.
// Run: node scripts/prepare-characters.mjs /path/to/KayKit-Character-Pack-Adventures
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const source=process.argv[2];
assert(source,'Pass a checkout of the pinned KayKit repository.');
const revision='672074b73ba276876a19e8816ecdc5241817ab47';
assert.equal(execFileSync('git',['-C',source,'rev-parse','HEAD'],{encoding:'utf8'}).trim(),revision);
const clips=new Set(['Idle','Walking_A','Running_A','Jump_Idle','Dodge_Forward','Block','Use_Item','Hit_A','Death_A','Interact','Spellcast_Raise','1H_Melee_Attack_Slice_Horizontal','1H_Melee_Attack_Slice_Diagonal','1H_Melee_Attack_Chop','2H_Melee_Attack_Stab','2H_Melee_Attack_Slice','2H_Melee_Attack_Chop','2H_Melee_Attack_Spin']);
const output='src/assets/characters';
await mkdir(output,{recursive:true});
const records=[];
for(const [input,name,withClips] of [['Rogue_Hooded.glb','pilgrim',true],['Knight.glb','knight',false],['Mage.glb','keeper',false]]){
  const original=await readFile(join(source,'addons/kaykit_character_pack_adventures/Characters/gltf',input));
  const jsonBytes=original.readUInt32LE(12),json=JSON.parse(original.toString('utf8',20,20+jsonBytes));
  const bin=original.subarray(28+jsonBytes),joints=new Set(json.skins.flatMap(s=>s.joints));
  json.animations=withClips?json.animations.filter(a=>clips.has(a.name)):[];
  for(const animation of json.animations){
    // Accessory visibility and control-rig animation are not game actions.
    animation.channels=animation.channels.filter(c=>joints.has(c.target.node));
    const used=[...new Set(animation.channels.map(c=>c.sampler))];
    const old=animation.samplers;animation.samplers=used.map(i=>old[i]);
    for(const c of animation.channels)c.sampler=used.indexOf(c.sampler);
  }
  const used=new Set();
  for(const m of json.meshes)for(const p of m.primitives){Object.values(p.attributes).forEach(i=>used.add(i));if(p.indices!==undefined)used.add(p.indices);for(const t of p.targets||[])Object.values(t).forEach(i=>used.add(i));}
  for(const s of json.skins)used.add(s.inverseBindMatrices);
  for(const a of json.animations)for(const s of a.samplers){used.add(s.input);used.add(s.output);}
  const accessorIndices=[...used].sort((a,b)=>a-b),accessorMap=new Map(accessorIndices.map((id,i)=>[id,i]));
  for(const m of json.meshes)for(const p of m.primitives){for(const k in p.attributes)p.attributes[k]=accessorMap.get(p.attributes[k]);if(p.indices!==undefined)p.indices=accessorMap.get(p.indices);for(const t of p.targets||[])for(const k in t)t[k]=accessorMap.get(t[k]);}
  for(const s of json.skins)s.inverseBindMatrices=accessorMap.get(s.inverseBindMatrices);
  for(const a of json.animations)for(const s of a.samplers){s.input=accessorMap.get(s.input);s.output=accessorMap.get(s.output);}
  json.accessors=accessorIndices.map(i=>json.accessors[i]);
  assert(json.accessors.every(a=>!a.sparse),'Sparse accessor requires explicit support');
  const viewIndices=[...new Set([...json.accessors.map(a=>a.bufferView),...json.images.map(i=>i.bufferView)])].sort((a,b)=>a-b);
  const viewMap=new Map(viewIndices.map((id,i)=>[id,i]));
  let offset=0;const pieces=[];
  json.bufferViews=viewIndices.map(i=>{const v=json.bufferViews[i],data=bin.subarray(v.byteOffset||0,(v.byteOffset||0)+v.byteLength);const result={...v,buffer:0,byteOffset:offset};pieces.push(data);offset+=data.length;const pad=(4-offset%4)%4;pieces.push(Buffer.alloc(pad));offset+=pad;return result;});
  for(const a of json.accessors)a.bufferView=viewMap.get(a.bufferView);
  for(const image of json.images)image.bufferView=viewMap.get(image.bufferView);
  json.buffers=[{byteLength:offset}];
  // Disable root translation: world movement and jump height belong to game physics.
  const root=json.nodes.findIndex(n=>n.name==='root');
  for(const a of json.animations)a.channels=a.channels.filter(c=>!(c.target.node===root&&c.target.path==='translation'));
  const raw=Buffer.from(JSON.stringify(json)),jsonBuffer=Buffer.concat([raw,Buffer.alloc((4-raw.length%4)%4,32)]),binBuffer=Buffer.concat(pieces);
  const head=Buffer.alloc(20);head.write('glTF');head.writeUInt32LE(2,4);head.writeUInt32LE(28+jsonBuffer.length+binBuffer.length,8);head.writeUInt32LE(jsonBuffer.length,12);head.writeUInt32LE(0x4e4f534a,16);
  const binHead=Buffer.alloc(8);binHead.writeUInt32LE(binBuffer.length,0);binHead.writeUInt32LE(0x004e4942,4);
  const result=Buffer.concat([head,jsonBuffer,binHead,binBuffer]);
  await writeFile(join(output,`${name}.glb`),result);
  records.push({file:`${name}.glb`,sourceFile:input,originalSha256:createHash('sha256').update(original).digest('hex'),sha256:createHash('sha256').update(result).digest('hex'),bytes:result.length,animations:json.animations.map(a=>a.name)});
}
await writeFile(join(output,'LICENSE.txt'),await readFile(join(source,'LICENSE.txt')));
await writeFile(join(output,'provenance.json'),JSON.stringify({author:'Kay Lousberg',license:'CC0-1.0',repository:'https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures',revision,modifications:'Selected gameplay clips; removed non-joint animation and root movement; compacted unused accessors and buffers. Textures and character geometry retained.',files:records},null,2)+'\n');
console.log(JSON.stringify(records.map(({file,bytes,animations})=>({file,bytes,clips:animations.length})),null,2));
