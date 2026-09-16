import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createDetailedActor,ACTOR_FAMILIES} from '../src/actor-models.js';
import {actorContract,cloakMetric,cloakCases,frameSequence} from './fixtures/cloak-uv-contract.mjs';
import {createOriginalNpc,createUpperNpcBeforeCloakUV} from './fixtures/cloak-npc-upper-v57.mjs';
const baseline=JSON.parse(readFileSync(new URL('./fixtures/cloak-uv-v31-baseline.json',import.meta.url)));
// The face unit intentionally changes only NPC geometry before this UV unit.
// Keep the original baseline intact; use its retained pre-UV source for NPC.
const npcBaseline=JSON.parse(readFileSync(new URL('./fixtures/cloak-npc-before-uv-v32.json',import.meta.url)));
// The arrow unit changes ranger geometry; preserve the old UV input explicitly.
const rangerBaseline=JSON.parse(readFileSync(new URL('./fixtures/cloak-ranger-before-uv-v33.json',import.meta.url)));

test('ordinary cape UV reduces measured stretching at unchanged area density through saved motion',()=>{
  for(const role of cloakCases){
    const original=role==='npc'?createOriginalNpc():null,paired=role==='npc'?createUpperNpcBeforeCloakUV():null;
    const a=createDetailedActor(role),uv=Array.from(a.cape.geometry.attributes.uv.array);a.g.updateMatrixWorld(true);
    for(let sample=0;sample<=frameSequence.length;sample++){
      if(sample){const f=frameSequence[sample-1];for(const actor of [a,original,paired].filter(Boolean)){actor.g.position.set(f.state.x||0,0,f.state.z||0);actor.animate(f.state,f.dt);actor.g.updateMatrixWorld(true);}}
      if(sample%15!==0)continue;
      const metric=cloakMetric(a.cape),old=role==='npc'?npcBaseline.samples[sample]:role==='ranger'?rangerBaseline.samples[sample]:baseline.roles[role].samples[sample];
      // v34 changes only death cape positions/normals; paired source checks
      // retain all other attributes, including the v33 ranger arrow baseline.
      if(a.motion.state!=='death'){
        // Anchor the unmodified retained source to its historical hash first.
        // Only the approved upper-cloth input is then common to both UV sides.
        if(original)assert.equal(actorContract(original),old.contract,`${role} ${sample}: retained original contract`);
        assert.equal(actorContract(a),paired?actorContract(paired):old.contract,`${role} ${sample}: non-UV rendering/motion contract`);
        assert(Math.abs(metric.density/old.metric.density-1)<2e-7,`${role}: overall density`);
      }
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
    const prior=role==='npc'?npcBaseline.allFamily:role==='ranger'?rangerBaseline.allFamily:baseline.allFamilies[key];
    const paired=role==='npc'?createUpperNpcBeforeCloakUV():null;
    if(paired)assert.equal(actorContract(createOriginalNpc()),prior.contract,'NPC retained original family contract');
    assert.equal(actorContract(a),paired?actorContract(paired):prior.contract,key);
    let triangles=0,meshes=0;a.g.traverseVisible(n=>{if(n.isMesh){meshes++;triangles+=(n.geometry.index?.count??n.geometry.attributes.position.count)/3;}});
    assert.equal(triangles,prior.triangles);assert.equal(meshes,prior.meshes+(paired?1:0),'only the approved upper-cloth material split adds one mesh');assert(triangles<8000);assert(meshes<=14);
  }
});

// Negative controls protect the two-anchor contract, rather than accepting a
// refreshed expected hash or exempting NPC geometry/materials from comparison.
test('paired NPC baseline still detects omitted upper cloth, non-target edits and cape UV scale',()=>{
  const paired=createUpperNpcBeforeCloakUV(),expected=actorContract(paired),original=createOriginalNpc();
  assert.notEqual(actorContract(original),expected,'omitting the material/UV split must fail');
  const a=createDetailedActor('npc');assert.equal(actorContract(a),expected);
  let hair;a.g.traverse(n=>{if(n.isMesh&&n.material.color.getHex()===0xa7a397)hair=n;});assert(hair);
  const material=hair.material;hair.material=material.clone();hair.material.color.r+=.01;
  assert.notEqual(actorContract(a),expected,'non-target hair remains in the contract');hair.material=material;
  const geometry=hair.geometry;hair.geometry=geometry.clone();hair.geometry.attributes.position.setX(0,hair.geometry.attributes.position.getX(0)+.001);
  assert.notEqual(actorContract(a),expected,'non-target geometry remains in the contract');hair.geometry=geometry;
  a.g.updateMatrixWorld(true);const uv=a.cape.geometry.attributes.uv,old=Float32Array.from(uv.array),metric=cloakMetric(a.cape);
  for(let i=0;i<uv.count;i++)uv.setX(i,uv.getX(i)*2);
  assert(Math.abs(cloakMetric(a.cape).density/metric.density-1)>.1,'cape density check catches doubled U');
  uv.array.set(old);
});
