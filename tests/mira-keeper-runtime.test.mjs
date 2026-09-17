import test from 'node:test';
import assert from 'node:assert/strict';
import {Vector3} from 'three';
import {createMiraKeeper} from '../src/mira-keeper.js';
import {createDetailedActor} from '../src/actor-models.js';
import {Game,groundAt,heightAt} from '../src/core.js';
import {STAFF_REGISTRATION} from '../review/staff-attachment-v65/attachment.mjs';

const counts=group=>{
  let triangles=0,meshes=0;
  group.traverse(n=>{if(n.isMesh){meshes++;triangles+=n.geometry.index.count/3;}});
  return {triangles,meshes};
};
function placed(){const actor=createMiraKeeper({groundHeight:groundAt});actor.g.position.set(7,heightAt(7,80),80);actor.g.rotation.y=1.4;return actor;}

test('shipped Mira replaces the baked staff, retains the skeleton and accounts for the complete prop cost',()=>{
  const old=createDetailedActor('npc'),bare=createDetailedActor('npc',{omitKeeperStaff:true}),a=placed();
  assert.deepEqual(a.rest.map(r=>r.node.name),old.rest.map(r=>r.node.name));assert.equal(a.rest.length,41);
  assert.equal(counts(old.g).triangles-counts(bare.g).triangles,292);
  assert.equal(counts(old.g).meshes-counts(bare.g).meshes,2);
  assert.equal(a.g.getObjectByName('staff').children.length,0,'old staff has no remaining render geometry');
  assert(counts(bare.g).triangles<8000);assert(counts(bare.g).meshes<=14);
  assert.deepEqual(counts(a.staff),{triangles:7512,meshes:4});
  assert.deepEqual(counts(a.g),{triangles:13938,meshes:15});
  assert.equal(a.staffManifest.parts.length,19);
  assert.equal(a.staff.children.filter(n=>n.material.transmission>0).length,1);
  // Cache variants may be constructed in either order without changing the old actor.
  assert.equal(counts(createDetailedActor('npc').g).triangles,counts(old.g).triangles);
  a.dispose();
});

test('actual keeper placement maintains right-hand grip and ground support through breathing, pause and save reload',()=>{
  const a=placed(),game=new Game(),saved=JSON.stringify(game.serialize());
  for(let i=0;i<360;i++){
    const state=Object.freeze({moving:false});a.animate(state,i%37===0?0:1/60);
    assert(a.staffStatus.ok,a.staffStatus.reason);assert(a.staff.visible);
    const grip=new Vector3(...STAFF_REGISTRATION.gripStaff).applyMatrix4(a.staff.matrixWorld);
    const hand=new Vector3(...STAFF_REGISTRATION.gripHand).applyMatrix4(a.hands[0].matrixWorld);
    assert(grip.distanceTo(hand)<1e-8);
    const base=new Vector3().applyMatrix4(a.staff.matrixWorld),top=new Vector3(0,1.7,0).applyMatrix4(a.staff.matrixWorld);
    assert(Math.abs(base.y-groundAt(base.x,base.z))<1e-8);assert(Math.abs(base.distanceTo(top)-1.7)<1e-8);
    assert(a.digits[0][0].root.rotation.x>a.digits[1][0].root.rotation.x,'right fingers use holding pose');
    assert.equal(a.arms[1].rotation.x,-.055);assert.equal(a.elbows[1].rotation.x,-.19);
  }
  assert.equal(JSON.stringify(game.serialize()),saved);
  const restored=placed();restored.animate(Object.freeze({moving:false}),0);assert(restored.staffStatus.ok);
  assert.equal(new Game(JSON.parse(saved)).talked,game.talked);
  a.dispose();restored.dispose();
});

test('unsupported states and invalid ground hide the prop, recover on idle, and dispose only owned resources once',()=>{
  let valid=true;const a=createMiraKeeper({groundHeight:()=>valid?0:NaN});
  for(const state of [{moving:true},{dead:true,deathElapsed:1},{grounded:false},{healTimer:.4}]){
    a.animate(state,0);assert.equal(a.staff.visible,false);assert.equal(a.staffStatus.reason,'unsupported-motion');
    a.animate({moving:false,dead:false},0);assert(a.staffStatus.ok);assert(a.staff.visible);
  }
  valid=false;a.animate({},0);assert.equal(a.staffStatus.reason,'invalid-ground-height');assert(!a.staff.visible);
  valid=true;a.animate({},0);assert(a.staffStatus.ok);
  const owned=[...a.staff.children.flatMap(n=>[n.geometry,n.material]),a.cape.geometry],disposed=new Map(owned.map(x=>[x,0]));
  owned.forEach(x=>x.addEventListener('dispose',()=>disposed.set(x,disposed.get(x)+1)));
  let sharedDisposes=0;a.g.traverse(n=>{if(n.isSkinnedMesh)n.geometry.addEventListener('dispose',()=>sharedDisposes++);});
  a.dispose();a.dispose();assert.equal(a.staff.parent,null);assert.equal(a.staff.children.length,0);
  assert([...disposed.values()].every(n=>n===1));assert.equal(sharedDisposes,0);
  a.animate({},0);assert.equal(a.staffStatus.reason,'disposed');assert(!a.staff.visible);
});
