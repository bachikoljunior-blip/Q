import test from 'node:test';
import assert from 'node:assert/strict';
import { Raycaster, Vector3 } from 'three';
import { createDetailedActor } from '../src/actor-models.js';
import { WEAPONS } from '../src/content.js';
import { Game } from '../src/core.js';

// Production skeleton and Game-clock checks; no renderer, pixels or device timing.
const point=(node,x=0,y=0,z=0)=>node.localToWorld(new Vector3(x,y,z));
const pose=a=>{a.g.updateMatrixWorld(true);return a.rest.map(({node})=>({position:node.getWorldPosition(new Vector3()),rotation:node.quaternion.clone()}));};
const enemies=[['soldier',.85,1.1],['boss',1.1,.85],['boss',1.35,.85,true],['wolf',.62,.9],['ranger',1.15,1.15]];

test('saved attack clocks cross windup/strike/recovery continuously for all enemy forms',()=>{
  for(const [type,windupMax,recovery,radial=false] of enemies){
    const actor=createDetailedActor(type),base={type,windupMax,radial,x:0,y:0,z:0,dead:false};
    for(const [from,to] of [[{state:'windup',timer:1e-7},{state:'strike',timer:.22}],[{state:'strike',timer:1e-7},{state:'recover',timer:recovery}]]){
      actor.animate({...base,...from},0);const before=pose(actor);
      actor.animate({...base,...to},0);const after=pose(actor);
      after.forEach((p,i)=>{assert(p.position.distanceTo(before[i].position)<1e-4,`${type} ${from.state} position seam: ${actor.rest[i].node.name}`);assert(p.rotation.angleTo(before[i].rotation)<1e-4,`${type} ${from.state} rotation seam`);});
    }
  }
});

test('real enemy game ticks preserve strike events and bound the formerly skipped shoulder and body movement',()=>{
  for(const [type,windupMax,recovery,radial=false] of enemies){
    const game=new Game();game.lit=['haven','grove','flood','ruins'];Object.assign(game.player,{x:0,z:50});
    const state={type,windupMax,radial,x:0,y:0,z:0,dead:false,homeX:0,homeZ:0,state:'windup',timer:windupMax,cooldown:0,hp:100,maxHp:100,aim:{x:0,y:1,z:50}};
    const actor=createDetailedActor(type);actor.animate(state,1/60);let previous=pose(actor),previousState=state.state,seams=0;
    for(let frame=0;frame<180;frame++){
      game.tickEnemy(state,1/60);const before=JSON.stringify(state);actor.animate(Object.freeze({...state}),1/60);assert.equal(JSON.stringify(state),before);
      const current=pose(actor);
      if(previousState==='windup'&&state.state==='strike'){
        assert.equal(state.timer,.22);assert.equal(state.hit,false,'animation must not consume Game impact');
        const limb=actor.arms[1]||actor.neck,index=actor.rest.findIndex(r=>r.node===limb);
        assert(current[index].rotation.angleTo(previous[index].rotation)<.4,`${type} skips a windup frame`);
        const pelvis=actor.rest.findIndex(r=>r.node===actor.pelvis);
        assert(current[pelvis].position.distanceTo(previous[pelvis].position)<.10*actor.g.scale.y,`${type} body pops at strike`);seams++;
      }
      if(previousState==='strike'&&state.state==='recover'){assert.equal(state.timer,recovery);seams++;}
      previous=current;previousState=state.state;if(state.state==='chase')break;
    }
    assert.equal(seams,2);
  }
});

test('each player weapon travels forward at its existing impact clock and stays above the flat floor throughout the attack',()=>{
  for(const weaponType of Object.keys(WEAPONS))for(let combo=0;combo<3;combo++){
    const stats=WEAPONS[weaponType],actor=createDetailedActor('player'),length=weaponType==='spear'?1.965:weaponType==='greatsword'?1.61:1.11;
    let minY=Infinity,minZ=Infinity,maxZ=-Infinity;
    for(let frame=0;frame<=100;frame++){
      const attack=Math.max(1e-8,stats.duration*(1-frame/100));actor.animate({weaponType,combo,attack,attackDuration:stats.duration},0);actor.g.updateMatrixWorld(true);
      minY=Math.min(minY,point(actor[weaponType],0,-length).y);minZ=Math.min(minZ,actor.pelvis.position.z);maxZ=Math.max(maxZ,actor.pelvis.position.z);
      if(weaponType!=='sword'){
        const actual=point(actor.hands[0],0,-.06,.013),desired=point(actor[weaponType],0,weaponType==='spear'?-.24:.05,.013);
        assert(actual.distanceTo(desired)<1e-5,`${weaponType} support palm loses its grip`);
        for(let hand=0;hand<2;hand++){
          assert(Math.abs(point(actor.arms[hand]).distanceTo(point(actor.elbows[hand]))-.33)<1e-6);
          assert(Math.abs(point(actor.elbows[hand]).distanceTo(point(actor.hands[hand]))-.31)<1e-6);
        }
        if(weaponType==='spear')assert(actor.chest.worldToLocal(point(actor.hands[1])).z>.225,'rear spear hand penetrates the torso armor');
      }
    }
    assert(minY>.05,`${weaponType} blade penetrates the floor`);assert(maxZ-minZ>.08,'attack must load and transfer support');
    actor.animate({weaponType,combo,attack:stats.duration-stats.hitTime,attackDuration:stats.duration},0);actor.g.updateMatrixWorld(true);
    assert(Math.abs(actor.motion.phase-.5)<1e-8,'saved gameplay impact phase changed');
    const direction=point(actor[weaponType],0,-length).sub(point(actor[weaponType])).normalize();
    assert(direction.z>(weaponType==='spear'?.99:.75),`${weaponType} misses the forward impact direction`);
  }
});

test('two-hand equipment follows the passive parry exit on every frame while retaining both grips',()=>{
  for(const weaponType of ['greatsword','spear']){
    const actor=createDetailedActor('player'),length=weaponType==='spear'?1.965:1.61;
    actor.animate({weaponType,parry:.001},1/60);actor.g.updateMatrixWorld(true);let previous=point(actor[weaponType],0,-length),maxStep=0,total=0;
    for(let frame=0;frame<14;frame++){
      actor.animate({weaponType},1/60);actor.g.updateMatrixWorld(true);const current=point(actor[weaponType],0,-length),step=current.distanceTo(previous);
      maxStep=Math.max(maxStep,step);total+=step;previous=current;
      assert(point(actor.hands[0],0,-.06,.013).distanceTo(point(actor[weaponType],0,weaponType==='spear'?-.24:.05,.013))<1e-5);
    }
    assert(maxStep<.4,`${weaponType} bypasses the pose transition`);assert(total>.5,'the transition must finish the equipment return');
  }
});

test('fresh or previously equipped drink exits never seed a two-hand transition from a zero target',()=>{
  for(const weaponType of ['greatsword','spear'])for(const previouslyEquipped of [false,true]){
    const actor=createDetailedActor('player'),length=weaponType==='spear'?1.965:1.61;
    if(previouslyEquipped)for(let frame=0;frame<12;frame++)actor.animate({weaponType},1/60);
    actor.animate({weaponType,healTimer:.001},1/60);actor.g.updateMatrixWorld(true);let previous=null,wrists=actor.hands.map(hand=>point(hand));
    for(let frame=0;frame<14;frame++){
      actor.animate({weaponType},1/60);actor.g.updateMatrixWorld(true);const current=point(actor[weaponType],0,-length);
      if(previous)assert(current.distanceTo(previous)<.4,`${weaponType} fresh=${!previouslyEquipped} drink exit frame ${frame}`);previous=current;
      actor.hands.forEach((hand,i)=>{const wrist=point(hand);assert(wrist.distanceTo(wrists[i])<.15,`${weaponType} visible wrist jumps at drink exit`);wrists[i]=wrist;});
      assert(point(actor.hands[0],0,-.06,.013).distanceTo(point(actor[weaponType],0,weaponType==='spear'?-.24:.05,.013))<1e-5);
    }
  }
});

test('hidden re-grasp starts without an elbow-pole flip and lowers through consecutive saved drink frames',()=>{
  for(const weaponType of ['greatsword','spear']){
    const actor=createDetailedActor('player');actor.animate({weaponType,healTimer:.9*(1-.73+1e-7)},0);const before=pose(actor);
    actor.animate({weaponType,healTimer:.9*(1-.73-1e-7)},0);const after=pose(actor);
    after.forEach((p,i)=>{if(['sword','greatsword','spear'].includes(actor.rest[i].node.name))return;assert(p.position.distanceTo(before[i].position)<1e-4);assert(p.rotation.angleTo(before[i].rotation)<1e-4);});
    let previous=null;
    for(let frame=0;frame<=54;frame++){
      actor.animate({weaponType,healTimer:Math.max(1e-8,.9-frame/60)},1/60);actor.g.updateMatrixWorld(true);const elbows=actor.elbows.map(elbow=>point(elbow));
      if(previous)elbows.forEach((p,i)=>assert(p.distanceTo(previous[i])<.15,`${weaponType} elbow flips during lowering frame ${frame}`));previous=elbows;
    }
  }
});

test('sampled actual blade centerlines clear skinned head and torso triangles through all nine attacks',()=>{
  for(const weaponType of Object.keys(WEAPONS))for(let combo=0;combo<3;combo++){
    const actor=createDetailedActor('player'),stats=WEAPONS[weaponType],length=weaponType==='spear'?1.965:weaponType==='greatsword'?1.61:1.11;
    for(let frame=0;frame<=40;frame++){
      actor.animate({weaponType,combo,attack:Math.max(1e-8,stats.duration*(1-frame/40)),attackDuration:stats.duration},0);actor.g.updateMatrixWorld(true);
      actor.g.traverse(node=>{if(node.isSkinnedMesh){node.skeleton.update();node.computeBoundingSphere();}});
      const start=point(actor[weaponType],0,-.18),tip=point(actor[weaponType],0,-length),ray=new Raycaster(start,tip.clone().sub(start).normalize(),.001,start.distanceTo(tip));
      const bodyHits=ray.intersectObject(actor.g,true).filter(hit=>{
        const node=hit.object;if(!node.isSkinnedMesh)return false;
        const names=new Set(),indices=node.geometry.attributes.skinIndex,weights=node.geometry.attributes.skinWeight;
        for(const vertex of [hit.face.a,hit.face.b,hit.face.c])for(let c=0;c<4;c++)if(weights.array[vertex*4+c]>.1)names.add(node.skeleton.bones[indices.array[vertex*4+c]].name);
        return [...names].every(name=>['head','neck','pelvis','chest','spine'].includes(name));
      });
      assert.equal(bodyHits.length,0,`${weaponType}/${combo} blade/body centerline intersection at ${frame}/40`);
    }
  }
});

test('weighted attacks preserve world stance on slopes, and saved two-hand grips reconstruct independently of prior pose',()=>{
  for(const weaponType of Object.keys(WEAPONS)){
    const ground=(x,z)=>x*.08+z*.04,actor=createDetailedActor('player',{groundHeight:ground}),stats=WEAPONS[weaponType],previous=[];let contacts=0;
    for(let frame=0;frame<100;frame++){
      const x=frame/60,z=frame/90,state={x,y:ground(x,z),z,weaponType,combo:1,attack:Math.max(.0001,stats.duration*(1-frame/100)),attackDuration:stats.duration};
      actor.g.position.set(x,state.y,z);actor.g.rotation.y=.3;actor.animate(state,1/60);actor.g.updateMatrixWorld(true);
      actor.feet.forEach((foot,i)=>{const p=point(foot),contact=actor.contacts[i].contact;if(contact&&previous[i]?.contact){assert(p.distanceTo(previous[i].position)<1e-5);assert(Math.abs(p.y-ground(p.x,p.z)-.109)<.002);contacts++;}previous[i]={position:p,contact};});
    }
    assert(contacts>50);
    const fresh=createDetailedActor('player'),restored=createDetailedActor('player');for(let i=0;i<37;i++)restored.animate({parry:.2},1/60);
    const saved={weaponType,combo:1,attack:stats.duration-stats.hitTime,attackDuration:stats.duration};fresh.animate(saved,0);restored.animate(saved,0);
    const a=pose(fresh),b=pose(restored);a.forEach((p,i)=>{assert(p.position.distanceTo(b[i].position)<1e-10);assert(p.rotation.angleTo(b[i].rotation)<1e-7);});
  }
});
