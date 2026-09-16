import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Game,BeforeGame,groundAt,locations,prepare,jumpTo,kill,exceptVertical,sampleRun} from './airborne-death-fixture.mjs';
import {compileMain,createMainRuntime} from './main-runtime-fixture.mjs';

const coreCases=[];
test('real melee deaths retain only vertical motion at 30/60/120 on ground, bridge and slope',()=>{
 for(const place of locations)for(const phase of [null,.2,.5])for(const hz of [30,60,120]){
  const old=sampleRun(BeforeGame,place,phase,hz),next=sampleRun(Game,place,phase,hz);coreCases.push({before:old,after:next});
  assert.equal(next.finalGap,0);assert.equal(next.finalVertical,0);assert.equal(next.finalGrounded,true);
  if(phase!==null){assert(old.finalGap>.1);assert.equal(old.firstMove,null);assert.equal(next.firstMove,1/hz);assert(next.landedAt<=.8);}else assert.equal(next.firstMove,null);
 }
});

test('dead dt clamps preserve zero-step state, and respawn/dead-load retain existing semantics',()=>{
 const a=prepare(new Game());jumpTo(a,.2);kill(a);const snapshot=JSON.stringify(a);a.tick(0,{x:1});a.tick(-1,{x:1});assert.equal(JSON.stringify(a),snapshot);
 const b=prepare(new Game());jumpTo(b,.2);kill(b);a.tick(99,{x:1});b.tick(.05,{x:1});assert.deepEqual(a.player,b.player);
 const deadSave=a.serialize(),restored=new Game(deadSave);assert(!restored.player.dead);assert.equal(restored.player.y,groundAt(restored.player.x,restored.player.z));assert.equal(restored.player.vertical,0);assert(restored.player.grounded);assert.equal(restored.player.ash,80);
 a.respawn();assert(!a.player.dead);assert(a.player.grounded);assert.equal(a.player.vertical,0);assert.equal(a.player.hp,a.player.maxHp);assert.equal(a.player.ash,80);const t=a.time;a.tick(1/60);assert(a.time>t);
});

test('living motion and save output remain identical to frozen core before death',()=>{
 const a=prepare(new Game()),b=prepare(new BeforeGame());assert(a.jump());assert(b.jump());
 for(let i=0;i<90;i++){const input={x:i<40?.3:0,z:i<40?.7:0,sprint:i>50};a.tick(1/60,input);b.tick(1/60,input);assert.deepEqual(a.serialize(),b.serialize());}
});

async function launch(compiled){const r=createMainRuntime(compiled,{allowTimers:true});const start=r.click('start');r.scene.resolve();await start;await r.flush();r.frames(1);return r;}
let compiled;
test('actual main pumps dead fixed ticks at 30/60/120; old main remains frozen as negative control',async()=>{
 compiled=await compileMain();const oldMain=await readFile(new URL('../docs/evidence/airborne-death-v55/before-main.js',import.meta.url),'utf8');const negative=await compileMain({mutate:()=>oldMain});
 for(const source of [compiled,negative])for(const hz of [30,60,120]){
  const r=await launch(source),g=prepare(r.view.game);jumpTo(g,.2);kill(g);r.frames(1,1000/hz);const start=g.player.y,frozen=exceptVertical(g),saved=r.values.get('q-ash-pilgrim-v1');
  r.frames(hz*2,1000/hz);assert.equal(exceptVertical(g),frozen);assert.equal(r.values.get('q-ash-pilgrim-v1'),saved,'dead tick must not run autosave');
  if(source===compiled){assert.equal(g.player.y,groundAt(g.player.x,g.player.z));assert(g.player.y<start);assert(g.player.grounded);}else assert.equal(g.player.y,start);
  assert.equal(r.errors.length,0);
 }
});

test('actual main pause, background and title freeze dead gravity; respawn and dead-save continue stay valid',async()=>{
 compiled??=await compileMain();const r=await launch(compiled),g=prepare(r.view.game);jumpTo(g,.2);kill(g);r.frames(1);
 await r.click('pause-button');let state=JSON.stringify(g);r.frames(90);assert.equal(JSON.stringify(g),state);assert.equal(r.view.lastUpdateDt,0);
 await r.click('settings-close');r.document.focused=false;await r.window.emit('blur');state=JSON.stringify(g);r.frames(30);assert.equal(JSON.stringify(g),state);assert.equal(r.view.lastUpdateDt,0);r.document.focused=true;await r.window.emit('focus');r.frames(2);assert.notEqual(JSON.stringify(g),state);
 await r.window.emit('pagehide',{persisted:true});state=JSON.stringify(g);r.frames(30);assert.equal(JSON.stringify(g),state);assert.equal(r.view.lastUpdateDt,0);await r.window.emit('pageshow',{persisted:true});r.frames(2);assert.notEqual(JSON.stringify(g),state);
 r.document.hidden=true;state=JSON.stringify(g);r.frames(60);assert.equal(JSON.stringify(g),state);r.document.hidden=false;r.frames(2);assert.notEqual(JSON.stringify(g),state);
 await r.click('pause-button');await r.click('to-title');state=JSON.stringify(g);r.frames(90);assert.equal(JSON.stringify(g),state);assert(!r.state.playing);
 await r.click('continue');await r.flush();r.frames(1);assert(g.player.dead);await r.click('respawn');r.frames(1);assert(!g.player.dead);assert(g.player.grounded);assert.equal(g.player.ash,80);assert.equal(r.errors.length,0);
 const again=prepare(new Game());jumpTo(again,.2);kill(again);const r2=await launch(compiled);r2.view.game.restore(again.serialize());r2.frames(1);assert(!r2.view.game.player.dead);assert.equal(r2.view.game.player.vertical,0);
});
