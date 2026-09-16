import {writeFile,mkdir} from 'node:fs/promises';
import {performance} from 'node:perf_hooks';
import {createDetailedActor,createBefore,cloakCases,measure,worldPoints,nonCapeContract,bodyIntersections,baselineHash} from '../tests/fixtures/cloak-ground-oracle.mjs';
import {groundAt} from '../src/core.js';
const began=performance.now(),rows=[],nonDeath=[],keyframes=[],rates=[];
for(const role of cloakCases){
  for(const state of ['idle','walk','run'])for(const hz of [30,60,120]){
    const a=createDetailedActor(role),b=createBefore(role),speed=state==='run'?10:state==='walk'?3:0;let exact=true;
    for(let f=0;f<=hz*.5;f++){const z=f*speed/hz,s={x:0,z,moving:speed>0,dead:false};for(const actor of [a,b]){actor.g.position.z=z;actor.animate(s,1/hz);actor.g.updateMatrixWorld(true);}if(nonCapeContract(a)!==nonCapeContract(b)||!Buffer.from(a.cape.geometry.attributes.position.array.buffer).equals(Buffer.from(b.cape.geometry.attributes.position.array.buffer))||!Buffer.from(a.cape.geometry.attributes.normal.array.buffer).equals(Buffer.from(b.cape.geometry.attributes.normal.array.buffer)))exact=false;}
    nonDeath.push({role,state,hz,exact});
  }
  for(const hz of [30,60,120]){
    const a=createDetailedActor(role,{groundHeight:()=>0}),b=createBefore(role,{groundHeight:()=>0});let lastA,lastB,maxStepA=0,maxStepB=0,actorExact=true;
    for(let f=0;f<=Math.round(hz*1.2);f++){
      const time=f/hz,state=Object.freeze({dead:true,deathElapsed:time,x:0,y:0,z:0});a.animate(state,1/hz);b.animate(state,1/hz);
      const pa=worldPoints(a),pb=worldPoints(b);if(lastA)for(let i=0;i<pa.length;i++){maxStepA=Math.max(maxStepA,pa[i].distanceTo(lastA[i]));maxStepB=Math.max(maxStepB,pb[i].distanceTo(lastB[i]));}lastA=pa;lastB=pb;
      actorExact&&=nonCapeContract(a)===nonCapeContract(b);rows.push({role,hz,time,before:measure(b),after:measure(a)});
    }
    rates.push({role,hz,maxStepBefore:maxStepB,maxStepAfter:maxStepA,nonCapeExact:actorExact});
  }
  for(const terrain of ['flat','slope','actual'])for(const time of [0,.3,.6,.9]){
    const ground=terrain==='flat'?()=>0:terrain==='slope'?(x,z)=>.12*x-.08*z:groundAt,x=terrain==='actual'?45:3,z=terrain==='actual'?-33:-2,y=ground(x,z);
    const a=createDetailedActor(role,{groundHeight:ground}),b=createBefore(role,{groundHeight:ground});for(const actor of [a,b]){actor.g.position.set(x,y,z);actor.g.rotation.y=.7;actor.animate({dead:true,deathElapsed:time},0);}
    keyframes.push({role,terrain,time,before:measure(b,ground),after:measure(a,ground),bodyCrossingsBefore:bodyIntersections(b),bodyCrossingsAfter:bodyIntersections(a)});
  }
}
const result={baselineHash,node:process.version,wallSeconds:(performance.now()-began)/1000,nonDeath,rates,rows,keyframes,boundary:'CPU world-space actual cape and skinned torso/head triangles. Floor vertices, edge midpoints and centroids are sampled: exact floor lower bound on flat/linear slope, sampled bound on nonlinear real terrain. Body intersections count proper segment/triangle crossings, not coplanar or containment classification. Negative reference normal dot means rotation beyond 90 degrees, not automatically inversion. No WebGL/device/perceptual performance claim.'};
await mkdir('docs/evidence/cloak-ground-v34',{recursive:true});await writeFile('docs/evidence/cloak-ground-v34/comparison.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({wallSeconds:result.wallSeconds,nonDeathExact:nonDeath.every(x=>x.exact),nonCapeExact:rates.every(x=>x.nonCapeExact),rows:rows.length,keyframes:keyframes.length,roles:cloakCases.map(role=>{const r=rows.filter(x=>x.role===role);return{role,minFloorBefore:Math.min(...r.map(x=>x.before.minFloorGap)),minFloorAfter:Math.min(...r.map(x=>x.after.minFloorGap)),maxDegenerateBefore:Math.max(...r.map(x=>x.before.degenerate)),maxDegenerateAfter:Math.max(...r.map(x=>x.after.degenerate)),maxEdgeAfter:Math.max(...r.map(x=>x.after.edgeMax)),minAreaRatioAfter:Math.min(...r.map(x=>x.after.areaRatio)),maxStretchBefore:Math.max(...r.map(x=>x.before.uvStretchP95||0)),maxStretchAfter:Math.max(...r.map(x=>x.after.uvStretchP95||0)),bodyCrossingsBefore:Math.max(...keyframes.filter(x=>x.role===role).map(x=>x.bodyCrossingsBefore)),bodyCrossingsAfter:Math.max(...keyframes.filter(x=>x.role===role).map(x=>x.bodyCrossingsAfter))};})},null,2));
