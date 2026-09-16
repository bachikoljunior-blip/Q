import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {Game,BRIDGES,groundAt} from '../src/core.js';
import {forecastProjectileContact} from '../src/combat-presentation.js';
const baseline=JSON.parse(readFileSync(new URL('../docs/evidence/projectile-extent-v33/baseline-contacts.json',import.meta.url)));
const rows=[];
for(const saved of baseline.cases){
 const g=new Game();g.enemies.forEach(e=>e.dead=true);g.obstacles=[];const bridge=BRIDGES.find(b=>b.z===saved.bridgeZ),p=g.player;Object.assign(p,{x:bridge.x+saved.ox,z:bridge.z+saved.oz,y:groundAt(bridge.x+saved.ox,bridge.z+saved.oz)});
 const label=t=>t===p?'player':t,forecast=forecastProjectileContact(g,saved.arrow,1.8),rates=[];
 for(const old of saved.rates){const a={...saved.arrow};let elapsed=0,actual=null;
  while(a.life>1/old.hz){const c=g.projectileContact(a,1/old.hz);if(c.target){actual={target:label(c.target),time:elapsed+c.fraction/old.hz};break;}Object.assign(a,c.to);a.life-=1/old.hz;elapsed+=1/old.hz;}
  assert.equal(actual?.target,old.baseline.target);if(old.hz===60){assert.equal(label(forecast?.target),actual?.target);assert(Math.abs(forecast.timeToImpact-actual.time)<1e-10);}
  rates.push({hz:old.hz,baseline:old.baseline.time,actual:actual.time,delta:actual.time-old.baseline.time,target:actual.target});
 }rows.push({bridgeZ:saved.bridgeZ,ox:saved.ox,oz:saved.oz,direction:saved.direction,rates});
}
const report={scope:'Same 120 saved bridge/edge/ground-grazing fixtures at 30/60/120 Hz; live projectileContact and optimized 60 Hz forecast. CPU rules, not rendered collision surfaces.',cases:rows.length,summary:[30,60,120].map(hz=>{const r=rows.flatMap(row=>row.rates.filter(v=>v.hz===hz));return{hz,player:r.filter(v=>v.target==='player').length,wall:r.filter(v=>v.target==='wall').length,deltaMin:Math.min(...r.map(v=>v.delta)),deltaMax:Math.max(...r.map(v=>v.delta))};}),rows};
if(process.argv[2])writeFileSync(process.argv[2],JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report.summary));
