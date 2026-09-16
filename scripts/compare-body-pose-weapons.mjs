import {readFileSync,writeFileSync} from 'node:fs';
import {createDetailedActor,createBefore,weaponMetric} from '../tests/fixtures/body-pose-oracle.mjs';
import {groundAt} from '../src/core.js';
const source=JSON.parse(readFileSync(new URL('../artifacts/body-pose-comparison.json',import.meta.url))),locations=[...new Map(source.rows.map(r=>[r.location.id,r.location])).values()],rows=[];
for(const location of locations)for(const yaw of [0,1.1,2.4])for(const weaponType of ['sword','greatsword','spear']){
 const a=createDetailedActor('player',{groundHeight:groundAt}),b=createBefore('player',{groundHeight:groundAt});for(const x of [a,b]){x.g.position.set(location.x,groundAt(location.x,location.z),location.z);x.g.rotation.y=yaw;}
 for(let frame=0;frame<=72;frame++){const time=frame/60,state={dead:true,deathElapsed:time,weaponType};a.animate(state,1/60);b.animate(state,1/60);rows.push({location,yaw,weaponType,time,before:weaponMetric(b,groundAt),after:weaponMetric(a,groundAt)});}
}
const summary={samples:rows.length,newNegative:rows.filter(r=>r.after.min<0).length,worsenedNegative:rows.filter(r=>r.after.min<Math.min(0,r.before.min)-1e-6).length,beforeMin:Math.min(...rows.map(r=>r.before.min)),afterMin:Math.min(...rows.map(r=>r.after.min))};
writeFileSync(new URL('../artifacts/body-pose-weapons.json',import.meta.url),JSON.stringify({at:new Date().toISOString(),boundary:'Actual active visible weapon vertices on the same saved phase, ground and body pose; no renderer',summary,rows},null,2));console.log(JSON.stringify(summary));
