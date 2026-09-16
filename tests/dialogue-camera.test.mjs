import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Game,groundAt } from '../src/core.js';
import { createScenePair } from './static-scene-fixture.mjs';
import { compileMain,createMainRuntime } from './main-runtime-fixture.mjs';
const [,view]=await createScenePair();
function prime(){
  view.game=new Game();Object.assign(view.game.player,{x:7,z:83,y:groundAt(7,83)});
  Object.assign(globalThis,{innerWidth:1280,innerHeight:720});view.resize();
  view.yaw=1.77;view.pitch=.4;view.zoom=11;view.focusGathering(null);view.update(0,true);
}
function focus(){view.focusGathering(null,'keeper');view.update(0,true);assert(view.dialogueCamera.shot);}
function matrix(){return [...view.camera.matrixWorld.elements,...view.camera.projectionMatrix.elements];}
test('native paused dialogue preserves save and exact gameplay orbit/projection on return',()=>{
  prime();const before=matrix(),save=JSON.stringify(view.game.serialize());focus();
  assert.equal(JSON.stringify(view.game.serialize()),save);assert.deepEqual([view.yaw,view.pitch,view.zoom],[1.77,.4,11]);
  const builds=view.dialogueCamera.rebuilds;for(let i=0;i<4;i++)view.update(0,true);assert.equal(view.dialogueCamera.rebuilds,builds);
  view.focusGathering(null);view.update(0,true);assert.equal(view.dialogueCamera.active,false);
  matrix().forEach((n,i)=>assert(Math.abs(n-before[i])<1e-10));
});
test('resize/quality rebuild composition once; death, threat and static blockage restore ordinary camera',()=>{
  prime();focus();
  for(const [w,h]of [[390,844],[844,390],[1280,720]]){
    Object.assign(globalThis,{innerWidth:w,innerHeight:h});view.resize();view.update(0,true);assert(view.dialogueCamera.shot);
    const count=view.dialogueCamera.rebuilds;view.update(0,true);assert.equal(view.dialogueCamera.rebuilds,count);
    for(const quality of ['low','medium','high']){view.setQuality(quality);view.update(0,true);assert(view.dialogueCamera.active);}
  }
  view.game.player.dead=true;view.update(0,true);assert.equal(view.dialogueCamera.shot,null);assert.equal(view.camera.projectionMatrix.elements[9],0);
  prime();focus();const enemy=view.game.enemies[0];Object.assign(enemy,{x:7,z:82,y:groundAt(7,82),dead:false});view.update(0,true);assert.equal(view.dialogueCamera.shot,null);
  prime();focus();view.game.obstacles=[...view.game.obstacles,{x:7,z:80,y:groundAt(7,80)-1,height:8,r:8}];view.update(0,true);assert.equal(view.dialogueCamera.shot,null);assert.equal(view.camera.projectionMatrix.elements[9],0);
});
test('disappearing NPC and unready gathering cannot reuse a stale close-up',()=>{
  prime();const n=view.game.residents.find(n=>n.id==='smith-ren');Object.assign(view.game.player,{x:n.x+3,z:n.z,y:groundAt(n.x+3,n.z)});n.angle=Math.PI/2;
  view.focusGathering(null,n.id);view.update(0,true);assert(view.dialogueCamera.shot);
  view.game.residents=view.game.residents.filter(r=>r!==n);view.update(0,true);assert.equal(view.dialogueCamera.shot,null);assert.equal(view.dialogueCamera.active,false);
  view.focusGathering('hearth');view.update(0,true);assert.equal(view.dialogueCamera.shot,null);
});
test('real main ordinary modal retains focus across interruption, ignores wheel and clears on close/settings',async()=>{
  const runtime=createMainRuntime(await compileMain(),{allowTimers:true});const launch=runtime.click('start');runtime.scene.resolve();await launch;await runtime.flush();
  const game=runtime.view.game;Object.assign(game.player,{x:7,z:83,y:groundAt(7,83)});assert(game.interact(game.npcs().find(n=>n.id==='keeper')));runtime.frames(1);
  assert.equal(runtime.view.dialogueFocus,'keeper');assert(runtime.element('panel-backdrop').classList.contains('dialogue'));assert.equal(runtime.element('hud').style.visibility,'hidden');
  const zoom=runtime.view.zoom;await runtime.element('world').emit('wheel',{deltaY:200});assert.equal(runtime.view.zoom,zoom);
  await runtime.interrupt('blur');assert.equal(runtime.view.dialogueFocus,'keeper');runtime.frames(1);assert.equal(runtime.view.lastUpdateDt,0);
  await runtime.click('close-panel');assert.equal(runtime.view.dialogueFocus,null);assert.equal(runtime.element('hud').style.visibility,'');
  await runtime.document.emit('keydown',{code:'Escape'});assert.equal(runtime.view.dialogueFocus,null);assert(!runtime.element('panel-backdrop').classList.contains('dialogue'));assert.equal(runtime.element('hud').style.visibility,'');
  assert.equal(runtime.errors.length,0);
});
test('dialogue layout has an opaque scrollable lower reading region and keyboard-reachable disclosure controls',()=>{
  const css=readFileSync(new URL('../src/game-interface.css',import.meta.url),'utf8'),main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
  assert.match(css,/body > #panel-backdrop\.dialogue\s*\{[^}]*background: transparent; backdrop-filter: none;[^}]*padding-top: 53dvh;/s);
  assert.match(css,/#panel-backdrop\.dialogue #panel\s*\{[^}]*max-height: calc\(47dvh - var\(--ui-panel-bottom\)\);[^}]*background: #111b20;/s);
  assert.match(css,/#panel-backdrop #panel-body\s*\{[^}]*overflow-y: auto/s);
  assert.match(css,/\.gathering-context summary\s*\{ min-height: 46px;/);
  assert.match(main,/input:not\(\[hidden\]\),summary/);
  assert.match(main,/if\(s.phase==='talking'&&ready\)body='<div class="dialogue-speaker">/);
});
test('actual gathering next-line and choice replace content at its reading start',async()=>{
  const save=JSON.parse(readFileSync(new URL('../release/review-saves/hearth-middle.json',import.meta.url)));
  const runtime=createMainRuntime(await compileMain(),{save,allowTimers:true});const launch=runtime.click('continue');runtime.scene.resolve();await launch;await runtime.flush();
  const game=runtime.view.game;assert(game.interact(game.npcs().find(n=>n.id==='healer-io')));runtime.frames(1);await runtime.click('gathering-open');assert.equal(runtime.element('hud').style.visibility,'hidden');
  const body=runtime.element('panel-body');body.scrollTop=180;await runtime.click('gathering-next');assert.equal(body.scrollTop,0);assert.equal(body.children[0].className,'dialogue-speaker');
  body.scrollTop=180;await runtime.click('gathering-medicine');assert.equal(body.scrollTop,0);assert.equal(game.gatherings.hearth.phase,'done');assert.equal(runtime.errors.length,0);
});
test('actual melee death in the dialogue event batch closes the modal and respawn resumes input',async()=>{
  const runtime=createMainRuntime(await compileMain(),{allowTimers:true});const launch=runtime.click('start');runtime.scene.resolve();await launch;await runtime.flush();runtime.frames(1);
  const game=runtime.view.game;Object.assign(game.player,{x:7,z:83,y:groundAt(7,83),hp:1,invulnerable:0,moving:false,attack:0,parry:0,dodge:0,healTimer:0,grounded:true});
  const enemy=game.enemies.find(e=>e.type==='knight'&&!e.vaultId);assert(enemy);Object.assign(enemy,{x:8,z:83,y:groundAt(8,83),angle:-Math.PI/2,state:'strike',timer:.15,hit:false,dead:false});
  assert(game.meleeContact(enemy));assert(game.interact(game.npcs().find(n=>n.id==='keeper')));runtime.frames(1);assert(game.player.dead);
  assert(runtime.element('panel-backdrop').classList.contains('hidden'));assert(!runtime.element('death-screen').classList.contains('hidden'));assert.equal(runtime.view.dialogueFocus,null);assert.equal(runtime.element('hud').style.visibility,'');
  await runtime.click('respawn');runtime.frames(1);assert(!game.player.dead);assert(runtime.element('panel-backdrop').classList.contains('hidden'));assert(runtime.element('death-screen').classList.contains('hidden'));assert.equal(runtime.view.dialogueFocus,null);assert(runtime.view.lastUpdateDt>0);assert.equal(runtime.sceneCalls,1);assert.equal(runtime.errors.length,0);
});
