import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {performance} from 'node:perf_hooks';
import {Matrix4,Vector3} from 'three';
import {createBefore,createCandidate as createDetailedActor,bodyPoints,surfaceGroundMetric} from '../tests/fixtures/body-ground-oracle.mjs';
import {actorContract} from '../tests/fixtures/cloak-uv-contract.mjs';
import {worldPoints} from '../tests/fixtures/cloak-ground-oracle.mjs';
import {groundAt} from '../src/core.js';
const points=a=>bodyPoints(a).map(p=>p.point).concat(a.cape?worldPoints(a):[]),difference=(a,b)=>Math.max(...a.map((p,i)=>p.distanceTo(b[i])));
const report={rates:[],saved:[],nonDeath:[],covariance:[],surfaces:[],cpu:[]};
for(const role of ['player','npc','sena','scout','traveler','ranger','boss']){
 const a=createDetailedActor(role),b=createBefore(role);for(const state of [{},{moving:true,x:0,z:1},{attack:.15,attackDuration:.6},{dead:true,deathElapsed:.8},{dead:false}]){a.animate(state,1/60);b.animate(state,1/60);if(!state.dead)assert.equal(actorContract(a),actorContract(b));}report.nonDeath.push({role,exact:true});
 for(const hz of [30,60,120])for(const [key,create]of [['before',createBefore],['after',createDetailedActor]]){
  const actor=create(role,{groundHeight:groundAt}),saved=create(role,{groundHeight:groundAt});for(const x of [actor,saved])x.g.position.set(0,groundAt(0,101),101);
  for(let i=0;i<100;i++)actor.animate({dead:false},1/60);let last=points(actor);actor.animate(Object.freeze({dead:true,deathElapsed:0}),0);const entry=difference(points(actor),last);last=points(actor);let max=0,savedError=0;
  for(let f=1;f<=hz*1.2;f++){const state=Object.freeze({dead:true,deathElapsed:f/hz});actor.animate(state,1/hz);const now=points(actor);max=Math.max(max,difference(now,last));last=now;if(f%Math.round(hz/10)===0){saved.animate(state,0);savedError=Math.max(savedError,difference(now,points(saved)));}}
  report.rates.push({role,hz,key,entry,max,savedError});assert.equal(savedError,0);
 }
 const fresh=createDetailedActor(role),settled=createDetailedActor(role);fresh.animate({dead:true},0);settled.animate({dead:true,deathElapsed:1.2},0);assert.equal(difference(points(fresh),points(settled)),0);report.saved.push({role,firstSeenExact:true});
 for(const yaw of [-1.9,.73,2.6]){const x=47,z=-35,y=4.7,c=Math.cos(yaw),s=Math.sin(yaw),ground=(x,z)=>.11*x-.07*z,transformed=(wx,wz)=>y+ground(c*(wx-x)-s*(wz-z),s*(wx-x)+c*(wz-z));const a=createDetailedActor(role,{groundHeight:ground}),b=createDetailedActor(role,{groundHeight:transformed});b.g.position.set(x,y,z);b.g.rotation.y=yaw;const matrix=new Matrix4().makeRotationY(yaw).setPosition(x,y,z);let error=0;for(const t of [0,.1,.23,.6,.9]){a.animate({dead:true,deathElapsed:t},0);b.animate({dead:true,deathElapsed:t},0);error=Math.max(error,difference(points(a).map(p=>p.applyMatrix4(matrix)),points(b)));}report.covariance.push({role,yaw,error});assert(error<1e-5);}
}
for(const role of ['player','npc','ranger','boss'])for(const [x,z,yaw]of [[0,101,0],[-389,-38,2.4],[45,-33,.7]])for(const time of [.15,.45,.8]){
 const row={role,x,z,yaw,time};for(const [key,create]of [['before',createBefore],['after',createDetailedActor]]){const a=create(role,{groundHeight:groundAt});a.g.position.set(x,groundAt(x,z),z);a.g.rotation.y=yaw;a.animate({dead:true,deathElapsed:time},0);row[key]=surfaceGroundMetric(a,groundAt);}report.surfaces.push(row);
}
for(const key of ['before','after','after','before']){const create=key==='before'?createBefore:createDetailedActor,actors=['player','npc','ranger','boss'].map(r=>create(r,{groundHeight:groundAt}));for(let i=0;i<40;i++)for(const a of actors)a.animate({dead:true,deathElapsed:i/60},1/60);const began=performance.now();for(let i=0;i<210;i++)for(const a of actors)a.animate({dead:true,deathElapsed:(i%73)/60},1/60);report.cpu.push({key,poses:840,milliseconds:performance.now()-began,clouds:actors.map(a=>a.bodySupport?.samples.length||0)});}
report.at=new Date().toISOString();writeFileSync(new URL('../artifacts/body-contracts.json',import.meta.url),JSON.stringify(report,null,2));console.log(JSON.stringify({rates:report.rates,nonDeath:report.nonDeath.length,saved:report.saved.length,covarianceMax:Math.max(...report.covariance.map(r=>r.error)),surfaceCases:report.surfaces.length,surfaceMin:Math.min(...report.surfaces.map(r=>r.after.min)),cpu:report.cpu},null,2));
