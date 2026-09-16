import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {Game,BeforeGame,groundAt,locations,prepare,jumpTo,kill,exceptVertical,sampleRun} from '../../../tests/airborne-death-fixture.mjs';
import {compileMain,createMainRuntime} from '../../../tests/main-runtime-fixture.mjs';
const out=path.resolve(process.argv[2]||'artifacts/airborne-death-v55');await mkdir(out,{recursive:true});
const started=performance.now(),cases=[];
for(const place of locations)for(const phase of [null,.2,.5])for(const hz of [30,60,120])cases.push({before:sampleRun(BeforeGame,place,phase,hz),after:sampleRun(Game,place,phase,hz)});
const oldMain=await readFile(new URL('./before-main.js',import.meta.url),'utf8');
const current=await compileMain(),before=await compileMain({mutate:()=>oldMain});
const main=[];
for(const [label,compiled]of [['before-main-with-new-core',before],['current',current]])for(const hz of [30,60,120]){
 const r=createMainRuntime(compiled,{allowTimers:true}),launch=r.click('start');r.scene.resolve();await launch;await r.flush();r.frames(1);
 const g=prepare(r.view.game);jumpTo(g,.2);kill(g);const initialY=g.player.y;let firstMove=null,landedAt=null;
 r.frames(1,1000/hz);if(g.player.y!==initialY)firstMove=1/hz;const frozen=exceptVertical(g),stored=r.values.get('q-ash-pilgrim-v1');
 for(let n=2;n<=hz*2;n++){r.frames(1,1000/hz);if(firstMove===null&&g.player.y!==initialY)firstMove=n/hz;if(landedAt===null&&g.player.grounded)landedAt=n/hz;}
 assert.equal(exceptVertical(g),frozen);assert.equal(r.values.get('q-ash-pilgrim-v1'),stored);assert.equal(r.errors.length,0);
 main.push({label,hz,initialY,initialGap:initialY-groundAt(g.player.x,g.player.z),firstMove,landedAt,finalGap:g.player.y-groundAt(g.player.x,g.player.z),ash:g.player.ash,allOtherFieldsFrozen:true,noDeadAutosave:true});
}
const hashes={};for(const file of ['src/core.js','src/main.js','tests/main-runtime-fixture.mjs','tests/airborne-death-fixture.mjs','tests/airborne-death.test.mjs']){const bytes=await readFile(file);hashes[file]={bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')};}
const report={generatedAt:new Date().toISOString(),base:'fa920db9782b7df42e4e16099a05994e5841dbaa',boundary:'Production Game and bundled main. DOM/SceneView/Soundscape are explicit Node doubles; no rendered pixels, device time or visual quality assessment.',sourceHashes:hashes,coreCases:cases,mainCases:main,wallMilliseconds:performance.now()-started};
await writeFile(path.join(out,'measurements.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({cases:cases.length,mainCases:main.length,out,wallMilliseconds:report.wallMilliseconds}));
