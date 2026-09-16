import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const ROOT=pathToFileURL(resolve(process.argv[2]||'/workspace/scratch/e72662e3b71f/Q-dialogue-framing-v32')+'/');
const OUTPUT=pathToFileURL(resolve(process.argv[3]||'/workspace/scratch/e72662e3b71f/q-v32-dialogue-review')+'/');
const {compileMain,createMainRuntime}=await import(new URL('tests/main-runtime-fixture.mjs',ROOT));
const {groundAt}=await import(new URL('src/core.js',ROOT));
const root=ROOT.pathname.replace(/\/$/,''),out=OUTPUT.pathname.replace(/\/$/,'');
const hash=()=>createHash('sha256').update(readFileSync(root+'/src/main.js')).digest('hex'),sourceHash=hash(),compiled=await compileMain();
const records={};
async function launch(save){const rt=createMainRuntime(compiled,{save,allowTimers:true});const pending=rt.click(save?'continue':'start');rt.scene.resolve();await pending;await rt.flush();rt.frames(1);return rt;}
function prime(rt){const g=rt.view.game;Object.assign(g.player,{x:7,z:83,y:groundAt(7,83),moving:false,attack:0,parry:0,dodge:0,healTimer:0,grounded:true});return g;}
function capture(rt){return {hudVisibility:rt.element('hud').style.visibility??'',focus:rt.view.dialogueFocus,gathering:rt.view.gatheringFocus,panelHidden:rt.element('panel-backdrop').classList.contains('hidden'),dialogueClass:rt.element('panel-backdrop').classList.contains('dialogue'),deathHidden:rt.element('death-screen').classList.contains('hidden'),dt:rt.view.lastUpdateDt,active:rt.document.activeElement?.id,sceneCalls:rt.sceneCalls,errors:[...rt.errors]};}
async function talk(rt){const g=prime(rt);assert(g.interact(g.npcs().find(n=>n.id==='keeper')));rt.frames(1);assert.equal(rt.view.dialogueFocus,'keeper');assert.equal(rt.element('hud').style.visibility,'hidden');return g;}
{
 const save=JSON.parse(readFileSync(root+'/release/review-saves/hearth-middle.json'));const rt=await launch(save),g=rt.view.game;
 assert(g.interact(g.npcs().find(n=>n.id==='healer-io')));rt.frames(1);await rt.click('gathering-open');assert.equal(rt.element('hud').style.visibility,'hidden');records.gatheringOpen=capture(rt);const body=rt.element('panel-body');
 body.scrollTop=180;await rt.click('gathering-next');records.nextLine={scrollTop:body.scrollTop,firstClass:body.children[0].className};assert.equal(body.scrollTop,0);assert.equal(body.children[0].className,'dialogue-speaker');
 body.scrollTop=180;await rt.click('gathering-medicine');records.choice={scrollTop:body.scrollTop,phase:g.gatherings.hearth.phase};assert.equal(body.scrollTop,0);
}
{
 const rt=await launch(),g=await talk(rt);records.dialogueOpen=capture(rt);const orbit=[rt.view.yaw,rt.view.pitch,rt.view.zoom];
 for(const reason of ['blur','hidden','pagehide']){await rt.interrupt(reason);rt.frames(1);assert.equal(rt.view.dialogueFocus,'keeper');assert.equal(rt.view.lastUpdateDt,0);}
 await rt.element('world').emit('wheel',{deltaY:200});assert.deepEqual([rt.view.yaw,rt.view.pitch,rt.view.zoom],orbit);
 await rt.document.emit('keydown',{code:'Escape'});rt.frames(1);records.close=capture(rt);assert.equal(rt.view.dialogueFocus,null);assert.equal(rt.document.activeElement.id,'world');
 await rt.document.emit('keydown',{code:'Escape'});records.settings=capture(rt);assert(!rt.element('panel-backdrop').classList.contains('dialogue'));await rt.click('settings-close');rt.frames(1);records.settingsReturn=capture(rt);
 await talk(rt);await rt.document.emit('keydown',{code:'Escape'});await rt.document.emit('keydown',{code:'Escape'});await rt.click('to-title');records.title=capture(rt);await rt.click('start');await rt.click('confirm-new');await rt.flush();rt.frames(1);records.restart=capture(rt);assert.equal(rt.view.dialogueFocus,null);assert.equal(rt.sceneCalls,1);
 await talk(rt);await rt.document.emit('keydown',{code:'Escape'});await rt.document.emit('keydown',{code:'KeyI'});const stored=JSON.parse(rt.values.get('q-ash-pilgrim-v1'));await rt.importFile(stored,{title:false});await rt.flush();rt.frames(1);records.import=capture(rt);assert.equal(rt.view.dialogueFocus,null);assert.equal(rt.sceneCalls,1);assert.equal(rt.errors.length,0);
}
{
 const rt=await launch(),g=prime(rt);g.player.hp=1;g.player.invulnerable=0;
 const enemy=g.enemies.find(e=>e.type==='knight'&&!e.vaultId);assert(enemy);Object.assign(enemy,{x:8,z:83,y:groundAt(8,83),angle:-Math.PI/2,state:'strike',timer:.15,hit:false,dead:false});
 assert(g.meleeContact(enemy));assert(g.interact(g.npcs().find(n=>n.id==='keeper')));rt.frames(1);assert(g.player.dead,'actual Game tick must make interaction and death meet within the same event batch');
 records.death=capture(rt);await rt.click('respawn');rt.frames(1);records.respawn=capture(rt);
 records.residualAfterDeath=!records.death.panelHidden||records.death.focus!==null;records.residualAfterRespawn=!records.respawn.panelHidden||records.respawn.focus!==null||records.respawn.dt===0;assert(!records.residualAfterDeath);assert(!records.residualAfterRespawn);
}
for(const k of ['close','settings','settingsReturn','title','restart','import','death','respawn'])assert.equal(records[k].hudVisibility,'','HUD must restore on '+k);assert.equal(hash(),sourceHash);
writeFileSync(out+'/lifecycle.json',JSON.stringify({sourceHash,boundary:'Actual compiled main/Game/event handlers; explicit existing DOM/property, SceneView, audio, timer/RAF boundaries. ScrollTop assertion verifies assignment, not real browser scroll layout; native Scene camera separately tested.',records},null,2)+'\n');console.log(JSON.stringify(records,null,2));
