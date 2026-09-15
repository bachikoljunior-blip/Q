import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { Vector3, Box3 } from 'three';
import { createDetailedActor, ACTOR_FAMILIES } from '../src/actor-models.js';
import { detailedMotion } from '../src/character-motion.js';
import { Game } from '../src/core.js';
import { WEAPONS } from '../src/content.js';

function visibleBounds(actor){
  actor.g.updateMatrixWorld(true);const bounds=new Box3();
  actor.g.traverseVisible(node=>{if(node.isMesh){node.skeleton?.update();for(let i=0;i<node.geometry.attributes.position.count;i++)bounds.expandByPoint(node.getVertexPosition(i,new Vector3()).applyMatrix4(node.matrixWorld));}});
  return bounds;
}
function bonePose(actor){return actor.rest.map(({node})=>({name:node.name,position:node.position.toArray(),rotation:node.rotation.toArray(),scale:node.scale.toArray()}));}

test('all shipped actor roles and four warden variants have independently bound authored skins within declared geometry budgets',()=>{
  const game=new Game();for(const role of game.residents.map(n=>n.role))assert(ACTOR_FAMILIES.includes(role));
  for(const type of ACTOR_FAMILIES){
    const a=createDetailedActor(type),b=createDetailedActor(type);let triangles=0,draws=0,skin;
    a.g.traverseVisible(node=>{if(node.isMesh){draws++;triangles+=(node.geometry.index?.count||node.geometry.attributes.position.count)/3;if(node.isSkinnedMesh)skin=node;}});
    assert(skin,`${type} needs real skinning`);assert(triangles<8000,`${type} triangle budget`);assert(draws<=14,`${type} material batches`);
    let other;b.g.traverse(n=>{if(n.isSkinnedMesh&&n.material===skin.material)other=n;});assert(other.geometry===skin.geometry,`${type} must share immutable geometry`);assert(other.skeleton!==skin.skeleton);
    assert(skin.skeleton.bones.includes(a.head));assert(!skin.skeleton.bones.includes(b.head));
    assert.notEqual(a.head,b.head);assert.notEqual(a.cape?.geometry,b.cape?.geometry||null);
    assert(visibleBounds(a).min.y>-.025,`${type} standing floor penetration`);
    if(!['boss','wolf'].includes(type))assert(a.head.getWorldPosition(new Vector3()).y/a.g.scale.y>1.65,`${type} adult head proportion`);
  }
  const signatures=new Set();for(const theme of ['ember','tide','gale','moss']){
    const a=createDetailedActor('soldier',{theme});assert.equal(a.g.userData.theme,theme);assert(a.g.getObjectByName('crown'));
    const values=[];a.g.traverse(n=>{if(n.isMesh)values.push(n.material.color.getHex());});signatures.add(JSON.stringify(values));
  }assert.equal(signatures.size,4);
});

test('flat and sloping support keep stance ankles at the sampled floor through walk/run with no world transform or game mutation',()=>{
  for(const type of ['player','wolf','soldier','boss'])for(const speed of [2.5,6,10]){
    const ground=(x,z)=>x*.09+z*.025,a=createDetailedActor(type,{groundHeight:ground}),scale=a.g.scale.y,ankle=type==='wolf'?.126:.109;
    let samples=0;
    for(let frame=0;frame<180;frame++){
      const z=frame*speed/60,state=Object.freeze({x:0,y:ground(0,z),z,angle:0,moving:true,dead:false});
      a.g.position.set(state.x,state.y,state.z);const world=a.g.position.toArray();a.animate(state,1/60);a.g.updateMatrixWorld(true);assert.deepEqual(a.g.position.toArray(),world);
      for(let i=0;i<a.feet.length;i++)if(a.contacts[i].contact){const p=a.feet[i].getWorldPosition(new Vector3());assert(Math.abs(p.y-(ground(p.x,p.z)+ankle*scale))<.002,`${type} speed ${speed}, ankle ${i}`);samples++;}
    }
    assert(samples>100);
  }
});

test('stance feet counter world displacement and teleportation does not invent a high-speed stride',()=>{
  for(const type of ['player','wolf','boss','patient']){
    const a=createDetailedActor(type),previous=[];let samples=0;
    for(let f=0;f<150;f++){
      const z=f/30;a.g.position.z=z;a.animate({x:0,z,moving:true},1/60);a.g.updateMatrixWorld(true);
      a.feet.forEach((foot,i)=>{const p=foot.getWorldPosition(new Vector3());if(f>2&&a.contacts[i].contact&&previous[i]?.contact){assert(Math.abs(p.z-previous[i].z)<.0001);samples++;}previous[i]={z:p.z,contact:a.contacts[i].contact};});
    }
    assert(samples>50);const phase=a.phase;a.animate({x:200,z:200,moving:true},1/60);assert.equal(a.phase,phase);assert.equal(a.speed,0);
  }
});

test('saved gameplay actions reconstruct the same articulated pose and impact phase without advancing gameplay',()=>{
  for(const weaponType of Object.keys(WEAPONS))for(let combo=0;combo<3;combo++){
    const game=new Game(),stats=WEAPONS[weaponType];game.weapons.push(weaponType);
    Object.assign(game.player,{weaponType,combo,attack:stats.duration-stats.hitTime,attackDuration:stats.duration});
    const restored=new Game(game.serialize()),a=createDetailedActor('player'),b=createDetailedActor('player'),before=JSON.stringify(game.serialize());
    for(let i=0;i<20;i++)a.animate({moving:false},1/60);a.animate(game.player,0);b.animate(restored.player,0);
    assert.equal(a.motion.state,'attack');assert(Math.abs(a.motion.phase-.5)<1e-8);assert.deepEqual(bonePose(a),bonePose(b));assert.equal(JSON.stringify(game.serialize()),before);
    assert.equal(a.sword.visible,weaponType==='sword');assert.equal(a.greatsword.visible,weaponType==='greatsword');assert.equal(a.spear.visible,weaponType==='spear');
  }
  for(const state of [{dodge:.21},{healTimer:.45},{parry:.2},{state:'stagger',timer:.13,stagger:.4},{state:'recover',timer:.5,type:'knight'}]){
    const a=createDetailedActor('player'),b=createDetailedActor('player');for(let i=0;i<11;i++)a.animate({},1/60);a.animate(state,0);b.animate(structuredClone(state),0);assert.deepEqual(bonePose(a),bonePose(b));
  }
});

test('windup, release, recovery, hit, live death and settled reload are distinct finite poses for every enemy family',()=>{
  for(const type of ['soldier','ranger','wolf','boss']){
    const a=createDetailedActor(type),poses=[];
    for(const state of [{state:'sealed'},{state:'windup',timer:.1,windupMax:.85},{state:'strike',timer:.06},{state:'recover',timer:.35},{state:'stagger',timer:.12,stagger:.4},{dead:true,deathElapsed:.3},{dead:true,deathElapsed:1}]){
      a.animate(Object.freeze(state),0);const bounds=visibleBounds(a);assert([...bounds.min.toArray(),...bounds.max.toArray()].every(Number.isFinite));poses.push(JSON.stringify(bonePose(a)));
    }assert.equal(new Set(poses).size,poses.length);assert(visibleBounds(a).min.y>-.025,`${type} settled body support`);
    assert(visibleBounds(a).max.y<(type==='boss'?1.6:.8));
    const b=createDetailedActor(type);b.animate({dead:true},0);assert.deepEqual(bonePose(a),bonePose(b));
  }
  assert.equal(detailedMotion({state:'stagger',timer:.2,stagger:.4}).phase,.5);
});

test('authored geometry recipe matches provenance and preserves separate third-party attribution',async()=>{
  const p=JSON.parse(await readFile(new URL('../src/assets/characters/detailed-provenance.json',import.meta.url)));
  const source=await readFile(new URL(`../src/assets/characters/${p.recipe.file}`,import.meta.url));
  assert.equal(createHash('sha256').update(source).digest('hex'),p.recipe.sha256);assert.equal(source.length,p.recipe.bytes);
  assert.match(p.separateUnmodifiedAssets,/Kay Lousberg CC0/);assert.equal(p.families.length,14);assert.equal(p.wardenThemes.length,4);
});
