import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createDetailedActor,ACTOR_FAMILIES} from '../src/actor-models.js';
import {actorContract,cloakMetric,cloakCases,frameSequence} from './fixtures/cloak-uv-contract.mjs';
const baseline=JSON.parse(readFileSync(new URL('./fixtures/cloak-uv-v31-baseline.json',import.meta.url)));
// The face unit intentionally changes only NPC geometry before this UV unit.
// Keep the original baseline intact; use its retained pre-UV source for NPC.
const npcBaseline=JSON.parse(readFileSync(new URL('./fixtures/cloak-npc-before-uv-v32.json',import.meta.url)));

test('ordinary cape UV reduces measured stretching at unchanged area density through saved motion',()=>{
  for(const role of cloakCases){
    const a=createDetailedActor(role),uv=Array.from(a.cape.geometry.attributes.uv.array);a.g.updateMatrixWorld(true);
    for(let sample=0;sample<=frameSequence.length;sample++){
      if(sample){const f=frameSequence[sample-1];a.g.position.set(f.state.x||0,0,f.state.z||0);a.animate(f.state,f.dt);a.g.updateMatrixWorld(true);}
      if(sample%15!==0)continue;
      const metric=cloakMetric(a.cape),old=role==='npc'?npcBaseline.samples[sample]:baseline.roles[role].samples[sample];
      assert.equal(actorContract(a),old.contract,`${role} ${sample}: non-UV rendering/motion contract`);
      assert(Math.abs(metric.density/old.metric.density-1)<2e-7,`${role}: overall density`);
      assert.equal(metric.zero,0);assert.equal(metric.negative,192);assert.equal(metric.positive,0);
      assert.deepEqual(Array.from(a.cape.geometry.attributes.uv.array),uv,'UV stays attached through cloth motion');
      if(role!=='boss'&&sample===0){assert(metric.stretchP95<1.25);assert(metric.stretchP95<old.metric.stretchP95*.65);assert(metric.stretchMax<old.metric.stretchMax);}
    }
    const clone=createDetailedActor(role);assert.notEqual(a.cape.geometry,clone.cape.geometry);assert.deepEqual(Array.from(clone.cape.geometry.attributes.uv.array),uv);
  }
});
test('every actually used family and warden theme retains the complete geometry/material/skin contract and budget',()=>{
  for(const [role,options]of [...ACTOR_FAMILIES.map(role=>[role,{}]),...['ember','tide','gale','moss'].map(theme=>['soldier',{theme}])]){
    const a=createDetailedActor(role,options),key=role+(options.theme?'/'+options.theme:'');
    const prior=role==='npc'?npcBaseline.allFamily:baseline.allFamilies[key];
    assert.equal(actorContract(a),prior.contract,key);
    let triangles=0,meshes=0;a.g.traverseVisible(n=>{if(n.isMesh){meshes++;triangles+=(n.geometry.index?.count??n.geometry.attributes.position.count)/3;}});
    assert.equal(triangles,prior.triangles);assert.equal(meshes,prior.meshes);assert(triangles<8000);assert(meshes<=14);
  }
});
