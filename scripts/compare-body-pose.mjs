import {writeFileSync} from 'node:fs';
import {createBefore,createDetailedActor,bodyMetric} from '../tests/fixtures/body-pose-oracle.mjs';
import {measure,bodyIntersections} from '../tests/fixtures/cloak-ground-oracle.mjs';
import {Game,groundAt} from '../src/core.js';
const game=new Game(),locations=[{id:'player-origin',x:game.player.x,z:game.player.z},...game.enemies.filter(e=>['ranger','boss'].includes(e.type)).slice(0,8).map(e=>({id:e.id,x:e.x,z:e.z})),{id:'author-actual',x:45,z:-33}];
const rows=[];for(const location of locations)for(const role of ['player','boss'])for(const yaw of [0,1.1,2.4])for(const time of [.15,.45,.8]){
  const row={location,role,yaw,time};for(const [key,create]of [['before',createBefore],['after',createDetailedActor]]){
    const a=create(role,{groundHeight:groundAt});a.g.position.set(location.x,groundAt(location.x,location.z),location.z);a.g.rotation.y=yaw;a.animate({dead:true,deathElapsed:time},0);
    row[key]={body:bodyMetric(a,groundAt),cape:measure(a,groundAt),support:a.bodySupport?{points:a.bodySupport.samples.length}:null};
  }rows.push(row);
}
const body=[];for(const role of ['player','npc','ranger','boss'])for(const time of [.08,.25,.5,.8,1.1]){
  const row={role,time};for(const [key,create]of [['before',createBefore],['after',createDetailedActor]]){const a=create(role,{groundHeight:()=>0});a.animate({dead:true,deathElapsed:time},0);row[key]={body:bodyMetric(a,()=>0),cape:measure(a),intersections:bodyIntersections(a)};}body.push(row);
}
const report={at:new Date().toISOString(),boundary:'CPU actual skinned vertices and cape triangles; no renderer or device evidence',rows,body};
writeFileSync(new URL('../artifacts/body-pose-comparison.json',import.meta.url),JSON.stringify(report,null,2));
console.log(JSON.stringify({cases:rows.length,beforeMin:Math.min(...rows.map(r=>r.before.body.min)),afterMin:Math.min(...rows.map(r=>r.after.body.min)),capeNegative:rows.filter(r=>r.after.cape.minFloorGap<-.00001).length,worsenedBody:rows.filter(r=>r.after.body.min<Math.min(0,r.before.body.min)-1e-6).length,worstFloating:Math.max(...rows.map(r=>r.after.body.bottomBinP50-r.before.body.bottomBinP50)),body:body.map(r=>({role:r.role,time:r.time,before:r.before.body.min,after:r.after.body.min,bb:r.before.body.bottomBinP50,ab:r.after.body.bottomBinP50,bc:r.before.intersections,ac:r.after.intersections}))},null,2));
