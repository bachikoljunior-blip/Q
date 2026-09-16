import test from 'node:test';
import assert from 'node:assert/strict';
import {createDetailedActor,createBefore,bodyMetric,bodyPoints,weaponMetric} from './fixtures/body-pose-oracle.mjs';
import {actorContract} from './fixtures/cloak-uv-contract.mjs';
import {worldPoints,measure,bodyIntersections} from './fixtures/cloak-ground-oracle.mjs';
import {ACTOR_FAMILIES} from '../src/actor-models.js';
import {groundAt} from '../src/core.js';

test('player settles on chest, pelvis, head and both heels on flat and real ground',()=>{
  for(const ground of [()=>0,groundAt])for(const [x,z]of [[0,101],[-389,-38],[204,-35]])for(const yaw of [0,1.1,2.4]){
    const a=createDetailedActor('player',{groundHeight:ground});a.g.position.set(x,ground(x,z),z);a.g.rotation.y=yaw;a.animate(Object.freeze({dead:true,deathElapsed:.8}),0);const m=bodyMetric(a,ground);
    assert(m.min>=0);for(const name of ['pelvis','chest','head','foot-0','foot-1'])assert(m.parts[name]<.021,`${name}: ${m.parts[name]}`);
    assert(m.bottomBinP50<.065);assert(measure(a,ground).minFloorGap>0);
    assert(a.bodySupport.samples.length<400,'bounded source support cloud');
  }
});
test('falling player retains source surface clearance and canonical saved poses',()=>{
  for(const [x,z,yaw]of [[0,101,0],[-389,-38,2.4],[45,-33,.7]]){
    const a=createDetailedActor('player',{groundHeight:groundAt}),fresh=createDetailedActor('player',{groundHeight:groundAt});for(const q of [a,fresh]){q.g.position.set(x,groundAt(x,z),z);q.g.rotation.y=yaw;}
    for(let frame=0;frame<=72;frame++){
      const state=Object.freeze({dead:true,deathElapsed:frame/60});a.animate(state,1/60);fresh.animate(state,0);const m=bodyMetric(a,groundAt);assert(m.min>-.001,`${x},${z} ${frame}: ${m.min}`);
      assert.deepEqual(bodyPoints(a).map(p=>p.point.toArray()),bodyPoints(fresh).map(p=>p.point.toArray()));
      assert.deepEqual(worldPoints(a).map(p=>p.toArray()),worldPoints(fresh).map(p=>p.toArray()));
    }
    assert.notEqual(a.bodySupport,fresh.bodySupport);assert.notEqual(a.bodySupport.samples,fresh.bodySupport.samples);
  }
});
test('all nonplayer families and themes preserve their complete death poses; nondeath and recovery remain exact',()=>{
  for(const [role,options]of [...ACTOR_FAMILIES.map(r=>[r,{}]),...['ember','tide','gale','moss'].map(theme=>['soldier',{theme}])]){
    const a=createDetailedActor(role,options),b=createBefore(role,options);
    for(const state of [{dead:false},{moving:true,x:0,z:1},{attack:.15,attackDuration:.6},{dead:true,deathElapsed:.2},{dead:true,deathElapsed:.8},{dead:false}]){
      a.animate(state,1/60);b.animate(state,1/60);if(role!=='player'||!state.dead)assert.equal(actorContract(a),actorContract(b),role);
    }
  }
});
test('player neckline remains fixed in the same chest-local coordinates',()=>{
  const a=createDetailedActor('player',{groundHeight:groundAt}),b=createBefore('player',{groundHeight:groundAt});
  for(const time of [0,.15,.45,.8]){
    for(const actor of [a,b]){actor.g.position.set(0,groundAt(0,101),101);actor.g.rotation.y=1.1;actor.animate({dead:true,deathElapsed:time},0);actor.g.updateMatrixWorld(true);}
    const p=worldPoints(a),q=worldPoints(b),ai=a.chest.matrixWorld.clone().invert(),bi=b.chest.matrixWorld.clone().invert();for(let i=0;i<9;i++)assert(p[i].applyMatrix4(ai).distanceTo(q[i].applyMatrix4(bi))<1e-6);
  }
});
test('all equipped death weapons keep their source grips and clear real ground throughout the fall',()=>{
  for(const weaponType of ['sword','greatsword','spear'])for(const [x,z,yaw]of [[0,101,0],[-389,-38,2.4],[45,-33,.7],[4,-247,2.4]]){
    const actor=createDetailedActor('player',{groundHeight:groundAt}),old=createBefore('player');actor.g.position.set(x,groundAt(x,z),z);actor.g.rotation.y=yaw;
    for(let frame=0;frame<=72;frame++){actor.animate({dead:true,deathElapsed:frame/60,weaponType},1/60);const metric=weaponMetric(actor,groundAt);assert(metric.min>-.001,`${weaponType} ${x},${z} ${frame}: ${metric.min}`);assert.equal(actor[weaponType].parent,actor.hands[1]);assert.deepEqual(actor[weaponType].position.toArray(),old[weaponType].position.toArray());}
  }
});
test('cape crossings do not increase against full skin including forearms',()=>{
  for(const time of [.08,.25,.5,.8,1.1]){const a=createDetailedActor('player'),b=createBefore('player');for(const actor of [a,b])actor.animate({dead:true,deathElapsed:time},0);assert(bodyIntersections(a,true)<=bodyIntersections(b,true));}
});
