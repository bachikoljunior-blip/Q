import test from 'node:test';
import assert from 'node:assert/strict';
import {createDetailedActor,createBefore,cloakCases,measure,worldPoints,nonCapeContract} from './fixtures/cloak-ground-oracle.mjs';
import {groundAt} from '../src/core.js';

test('saved death cloth keeps finite area, contacts and unchanged family contracts',()=>{
  for(const role of cloakCases){
    const a=createDetailedActor(role),b=createBefore(role),uv=Array.from(a.cape.geometry.attributes.uv.array);let previous;
    for(let frame=0;frame<=72;frame++){
      const time=frame/60,state=Object.freeze({dead:true,deathElapsed:time});a.animate(state,1/60);b.animate(state,1/60);
      const metric=measure(a),points=worldPoints(a),scale=a.g.scale.y;
      // v37 separately verifies the player's new whole-body death support.
      if(role!=='player')assert.equal(nonCapeContract(a),nonCapeContract(b),role+' non-cape state');assert.equal(metric.degenerate,0);assert(metric.finiteNormals);
      assert(metric.minFloorGap>=.01199*scale);assert(metric.edgeMax<1.12,role+' edge');
      assert(metric.areaRatio>(role==='boss'&&time<.2?.89:.95),role+' area');
      if(time>=.2)assert(metric.uvStretchP95<(role==='boss'?2.7:1.4),role+' UV');
      if(previous)for(let i=0;i<points.length;i++)assert(points[i].distanceTo(previous[i])<6*scale/60,role+' finite continuous motion');previous=points;
      assert.deepEqual(Array.from(a.cape.geometry.attributes.uv.array),uv);
    }
  }
});
test('saved phases, first seen settled corpses and independent clones reconstruct the same cape',()=>{
  const ground=(x,z)=>x*.09+z*.025;
  for(const role of cloakCases)for(const time of [0,.1,.3,.6,.9]){
    const a=createDetailedActor(role,{groundHeight:ground}),b=createDetailedActor(role,{groundHeight:ground});
    for(let i=0;i<31;i++)a.animate({},1/60);
    for(const actor of [a,b]){actor.g.position.set(4,ground(4,-3),-3);actor.g.rotation.y=.6;actor.animate({dead:true,deathElapsed:time},0);}
    assert.deepEqual(Array.from(a.cape.geometry.attributes.position.array),Array.from(b.cape.geometry.attributes.position.array),role+' saved phase');
    assert.notEqual(a.cape.userData.contact,b.cape.userData.contact);assert.notEqual(a.cape.userData.contact.points[0],b.cape.userData.contact.points[0]);
    assert(measure(a,ground).minFloorGap>-.001);
  }
  for(const role of cloakCases){const a=createDetailedActor(role),b=createDetailedActor(role);a.animate({dead:true},0);b.animate({dead:true,deathElapsed:1.2},0);assert.deepEqual(Array.from(a.cape.geometry.attributes.position.array),Array.from(b.cape.geometry.attributes.position.array));}
});
test('30, 60 and 120 Hz give identical explicit saved phase geometry',()=>{
  for(const role of cloakCases){let expected;
    for(const hz of [30,60,120]){const a=createDetailedActor(role);for(let frame=0;frame<=hz*.6;frame++)a.animate({dead:true,deathElapsed:frame/hz},1/hz);const values=Array.from(a.cape.geometry.attributes.position.array);if(expected)assert.deepEqual(values,expected,role);expected=values;}
  }
});
test('real spawn slopes preserve the old neckline and never deepen its existing floor penetration',()=>{
  for(const role of ['player','npc','ranger','boss'])for(const [x,z,yaw]of [[0,101,0],[-389,-38,2.4]])for(const time of [0,.25,.5,.8]){
    const a=createDetailedActor(role,{groundHeight:groundAt}),b=createBefore(role,{groundHeight:groundAt});
    for(const actor of [a,b]){actor.g.position.set(x,groundAt(x,z),z);actor.g.rotation.y=yaw;actor.animate({dead:true,deathElapsed:time},0);}
    const after=worldPoints(a),before=worldPoints(b);if(role!=='player')for(let i=0;i<9;i++)assert(after[i].distanceTo(before[i])<1e-7,'original neckline attachment');
    assert(measure(a,groundAt).minFloorGap>=Math.min(0,measure(b,groundAt).minFloorGap)-1e-6,`${role} ${x},${z} ${time}`);
  }
});
