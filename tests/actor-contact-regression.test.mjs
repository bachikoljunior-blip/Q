import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { createDetailedActor, ACTOR_FAMILIES } from '../src/actor-models.js';

// These inspect actual transformed skin/bone data, without a renderer or a
// claim about pixels, mobile frame time, or artistic quality.
test('every actor uses normalized multi-bone joint collars and outward body normals',()=>{
  for(const family of ACTOR_FAMILIES){
    const actor=createDetailedActor(family),pairs=new Set(),palettes=new Set();let blended=0,frontArmor=0;
    actor.g.traverse(n=>{if(!n.isSkinnedMesh)return;palettes.add(n.skeleton);
      const {position,normal,skinWeight:w,skinIndex:indices}=n.geometry.attributes;
      for(let i=0;i<w.count;i++){
        let sum=0;const names=[];
        for(let c=0;c<4;c++){const weight=w.array[i*4+c],index=indices.array[i*4+c];assert(weight>=0&&weight<=1);assert(n.skeleton.bones[index]);sum+=weight;if(weight>1e-5)names.push(n.skeleton.bones[index].name);}
        assert(Math.abs(sum-1)<1e-6);if(names.length>1){blended++;for(const a of names)for(const b of names)pairs.add(`${a}/${b}`);}
        assert([normal.getX(i),normal.getY(i),normal.getZ(i)].every(Number.isFinite));
        if(family==='soldier'&&n.material.color.getHex()===0x626f75&&Math.abs(position.getX(i))<1e-6&&position.getZ(i)>.18&&position.getY(i)>1.12&&position.getY(i)<1.48){assert(normal.getZ(i)>.3);frontArmor++;}
      }
    });
    assert.equal(palettes.size,1,'material batches must share one actor bone palette');
    assert(blended>300,`${family}: meaningful joint coverage`);
    assert(pairs.has('leg-0/knee-0'),`${family}: continuous knee collar`);
    if(family!=='wolf'){assert(pairs.has('arm-0/elbow-0'));assert(pairs.has('spine/chest'));assert(pairs.has('finger-1-1/finger-tip-1-1'));}
    if(family==='soldier')assert(frontArmor>0);
    if(family==='wolf')assert(pairs.has('knee-2/hock-2'));
  }
});

test('target-locked strafe, diagonal and turning motion preserve consecutive world stance anchors',()=>{
  for(const family of ['player','wolf','boss'])for(const mode of ['strafe','diagonal','turn']){
    const actor=createDetailedActor(family),previous=[];let samples=0;
    for(let frame=0;frame<150;frame++){
      const x=mode==='turn'?0:frame*2/60,z=mode==='strafe'?0:frame*2/60;
      actor.g.position.set(x,0,z);actor.g.rotation.y=mode==='turn'?frame*.006:0;
      actor.animate(Object.freeze({x,y:0,z,moving:true,dead:false}),1/60);actor.g.updateMatrixWorld(true);
      actor.feet.forEach((foot,i)=>{const position=foot.getWorldPosition(new Vector3()),contact=actor.contacts[i].contact;
        if(frame>2&&contact&&previous[i]?.contact){assert(position.distanceTo(previous[i].position)<1e-5,`${family} ${mode} stance slip`);samples++;}
        previous[i]={position,contact};
      });
    }
    assert(samples>100);
  }
});

test('parry exit advances smoothly on every frame, reaches idle, and preserves snapshot allocations',()=>{
  const actor=createDetailedActor('player');actor.animate({parry:.00001},1/60);
  const original=actor.arms[1].rotation.x,poses=actor.previousPose.map(p=>p.quaternion);let previous=original,maxJump=0;
  for(let frame=0;frame<14;frame++){
    actor.animate({},1/60);const current=actor.arms[1].rotation.x;maxJump=Math.max(maxJump,Math.abs(current-previous));
    if(frame<8)assert(current>previous+.0001,'the transition must progress, not defer a snap');previous=current;
    actor.previousPose.forEach((p,i)=>assert.equal(p.quaternion,poses[i]));
  }
  assert(maxJump<.25);assert(Math.abs(previous+.055)<1e-6);assert(previous-original>1.2);
});

test('moving actions replant support and evasive movement does not drag old contact points',()=>{
  for(const action of [{attack:.2,attackDuration:.5},{parry:.2},{healTimer:.4}]){
    const actor=createDetailedActor('player');let movingContacts=0;
    for(let frame=0;frame<90;frame++){
      const x=frame*2/60,state=Object.freeze({x,y:0,z:0,...action});actor.g.position.x=x;actor.animate(state,1/60);actor.g.updateMatrixWorld(true);
      assert(actor.pelvis.position.y>.68,'travel must not pull the pelvis towards obsolete feet');
      for(let i=0;i<2;i++)if(actor.contacts[i].contact){const foot=actor.feet[i].getWorldPosition(new Vector3()),plant=actor.plants[i];assert(Math.hypot(foot.x-plant.x,foot.z-plant.z)<1e-5);movingContacts++;}
    }
    assert(movingContacts>75);
  }
  const actor=createDetailedActor('player');
  for(let frame=0;frame<24;frame++){
    const x=frame*16/60;actor.g.position.x=x;actor.animate({x,y:0,z:0,dodge:.42-frame/60},1/60);
    assert(actor.pelvis.position.y>.60);assert(actor.contacts.every(c=>!c.contact));
  }
});

test('revival restores ground support immediately and idle half-turn repositions anatomical sides',()=>{
  const actor=createDetailedActor('player');actor.animate({dead:true},0);actor.animate({dead:false},1/60);actor.g.updateMatrixWorld(true);
  for(const foot of actor.feet)assert(Math.abs(foot.getWorldPosition(new Vector3()).y-.109)<.002);
  actor.g.rotation.y=Math.PI;let lifted=false;
  for(let frame=0;frame<40;frame++){actor.animate({dead:false},1/60);lifted ||= actor.contacts.some(c=>!c.contact);}
  assert(lifted);actor.g.updateMatrixWorld(true);
  actor.feet.forEach((foot,i)=>{const local=actor.g.worldToLocal(foot.getWorldPosition(new Vector3()));assert(Math.abs(local.x-actor.legs[i].position.x)<.002);assert(Math.abs(local.z)<.002);});
});
