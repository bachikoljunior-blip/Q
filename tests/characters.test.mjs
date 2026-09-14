import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { loadCharacter } from './character-fixture.mjs';
import { createRiggedActor } from '../src/rigged-actor.js';
import { characterMotion } from '../src/character-motion.js';
import { Game } from '../src/core.js';
import { WEAPONS } from '../src/content.js';

const library=Object.fromEntries(await Promise.all(['pilgrim','knight','keeper'].map(async name=>[name,await loadCharacter(name)])));

test('all packaged character assets match recorded provenance and have bound skinning data',async()=>{
  const provenance=JSON.parse(await readFile(new URL('../src/assets/characters/provenance.json',import.meta.url),'utf8'));
  for(const file of provenance.files){
    const data=await readFile(new URL(`../src/assets/characters/${file.file}`,import.meta.url));
    assert.equal(createHash('sha256').update(data).digest('hex'),file.sha256);
  }
  for(const gltf of Object.values(library)){
    const meshes=[];gltf.scene.traverse(n=>{if(n.isSkinnedMesh)meshes.push(n);});
    assert(meshes.length>0);
    for(const mesh of meshes){assert(mesh.skeleton.bones.length>=20);assert.equal(mesh.geometry.attributes.skinIndex.count,mesh.geometry.attributes.position.count);}
  }
});

test('shared clips bind to all three character skeletons and produce finite moving limbs',()=>{
  for(const type of ['player','soldier','npc']){
    const actor=createRiggedActor(library,type),hand=actor.body.getObjectByName('handr');
    actor.animate({attack:.45,attackDuration:.46,weaponType:'sword',combo:0},0);
    actor.g.updateMatrixWorld(true);const first=hand.getWorldPosition(new Vector3());
    actor.animate({attack:.12,attackDuration:.46,weaponType:'sword',combo:0},0);
    actor.g.updateMatrixWorld(true);const second=hand.getWorldPosition(new Vector3());
    assert(first.distanceTo(second)>.1);
    actor.body.traverse(n=>{assert(n.matrixWorld.elements.every(Number.isFinite),`${type}/${n.name}`);});
  }
});

test('actors share immutable geometry while bones and action times remain independent',()=>{
  const a=createRiggedActor(library,'player'),b=createRiggedActor(library,'player');
  assert.notEqual(a.body.getObjectByName('handr'),b.body.getObjectByName('handr'));
  const firstMesh=root=>{let result;root.traverse(n=>{if(n.isSkinnedMesh&&!result)result=n;});return result;};
  assert.equal(firstMesh(a.body).geometry,firstMesh(b.body).geometry);
  a.animate({attack:.2,attackDuration:.46,weaponType:'sword'},0);
  assert.notEqual(a.current,b.current);
  assert.equal(b.current.getClip().name,'Idle');
});

test('attack poses align to the game impact time for all weapons and survive save reload',()=>{
  for(const weaponType of Object.keys(WEAPONS))for(let combo=0;combo<3;combo++){
    const stats=WEAPONS[weaponType],game=new Game();
    game.player.weaponType=weaponType;game.weapons.push(weaponType);
    Object.assign(game.player,{attack:stats.duration-stats.hitTime,attackDuration:stats.duration,combo});
    const before=characterMotion(game.player),after=characterMotion(new Game(game.serialize()).player);
    assert(Math.abs(before.pose-.5)<1e-8);assert.deepEqual(after,before);
    const actor=createRiggedActor(library);actor.animate(game.player,0);
    assert(Math.abs(actor.current.time/actor.current.getClip().duration-.5)<1e-8);
    assert.equal(actor.sword.visible,weaponType==='sword');assert.equal(actor.greatsword.visible,weaponType==='greatsword');assert.equal(actor.spear.visible,weaponType==='spear');
  }
});

test('dodge and drinking resume their saved pose without visual root displacement',()=>{
  const actor=createRiggedActor(library),root=actor.body.getObjectByName('root'),initial=root.position.clone();
  for(const state of [{dodge:.21},{healTimer:.45},{grounded:false},{moving:true,x:1,z:0},{dead:true}]){
    actor.animate(state,1/60);actor.g.updateMatrixWorld(true);
    assert.deepEqual(root.position.toArray(),initial.toArray());
    assert.equal(actor.flask.visible,!!state.healTimer);
  }
  const game=new Game();game.player.dodge=.2;game.player.healTimer=0;
  assert.deepEqual(characterMotion(new Game(game.serialize()).player),characterMotion(game.player));
  assert.deepEqual(actor.g.position.toArray(),[0,0,0]);
});
