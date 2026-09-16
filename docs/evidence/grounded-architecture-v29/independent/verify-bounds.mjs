// Runtime source is read-only. Optional mutants affect this process's module loader only.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {registerHooks} from 'node:module';
const repo=path.resolve(process.argv[2]),mode=process.argv[3]||'normal',out=process.argv[4],url=p=>pathToFileURL(path.join(repo,p)).href;
const mutation={core:['src/core.js','obstacleCylinder(o,heightAt)','{...o,y:heightAt(o.x,o.z),height:o.height??o.r*1.5}'],camera:['src/spatial.js','obstacleCylinder(o,floorAt)','{...o,y:floorAt(o.x,o.z),height:o.height??o.r*1.5}'],forecast:['src/combat-presentation.js','obstacleCylinder(obstacle,heightAt)','{...obstacle,y:heightAt(obstacle.x,obstacle.z),height:obstacle.height??obstacle.r*1.5}']}[mode];
let applied=0;
const hooks=registerHooks({load(u,c,next){if(mutation&&u===url(mutation[0])){let source=readFileSync(new URL(u),'utf8');assert.equal(source.split(mutation[1]).length,2);source=source.replace(mutation[1],mutation[2]);applied++;return{format:'module',source,shortCircuit:true};}return next(u,c);}});
let Game,groundAt,cameraFraction,forecastProjectileContacts;
try{({Game,groundAt}=await import(url('src/core.js')));({cameraFraction}=await import(url('src/spatial.js')));({forecastProjectileContacts}=await import(url('src/combat-presentation.js')));}finally{hooks.deregister();}
assert.equal(applied,mutation?1:0);
const cases=[
 ['elevated upper hit',0,0,20,21,true],['elevated lower miss',0,0,20,6,false],
 ['fallback upper miss',0,0,undefined,21,false],['fallback lower hit',0,0,undefined,6,true],
 ['zero base hit',-80,50,0,1,true],['negative terrain fallback miss',-80,50,undefined,1,false]
];
const rows=[];
for(const[name,x,z,y,rayY,expectedHit]of cases){
 const game=new Game();game.obstacles=[{x,z,y,r:1,height:3}];game.enemies=[];
 const arrow={x:x-3,z,y:rayY,vx:6,vy:0,vz:0,life:3,owner:'player',damage:1},to={x:x+3,z,y:rayY},metrics={};
 const live=game.projectileContact(arrow,1),forecast=forecastProjectileContacts(game,[{arrow,horizon:1}],{metrics})[0],camera=cameraFraction(arrow,to,game.obstacles,groundAt);
 const hit={live:live.target==='wall',forecast:forecast?.target==='wall',camera:camera<1};rows.push({name,expectedHit,hit,liveFraction:live.fraction,forecastTime:forecast?.timeToImpact??null,cameraFraction:camera,metrics});
}
const differences=rows.flatMap(r=>Object.entries(r.hit).filter(([key,v])=>v!==r.expectedHit).map(([consumer])=>({name:r.name,consumer})));
if(mode==='normal')assert.deepEqual(differences,[]);else assert(differences.some(d=>d.consumer==={core:'live',camera:'camera',forecast:'forecast'}[mode]),'mutant must be detected in its actual consumer');
const report={mode,sourceMutationPersisted:false,appliedInMemoryMutations:applied,passed:mode==='normal'?differences.length===0:differences.length>0,differences,rows};if(out)writeFileSync(out,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({mode,passed:report.passed,differences}));
