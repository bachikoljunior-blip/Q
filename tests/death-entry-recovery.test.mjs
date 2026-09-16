import test from 'node:test';import assert from 'node:assert/strict';
import {createDetailedActor,createBefore,ACTOR_FAMILIES,Game,groundAt,actualLethal,show,points,differences,gaps} from '../docs/evidence/death-entry-recovery-v52/oracle.mjs';
import {actorContract} from './fixtures/cloak-uv-contract.mjs';

test('v52 actual lethal idle/walk/attack/parry retains the displayed pose and converges',()=>{
 for(const weapon of ['sword','spear','greatsword'])for(const prior of ['idle','walk','attack','parry']){
  const a=createDetailedActor('player',{groundHeight:groundAt}),b=createBefore('player',{groundHeight:groundAt});let entry;
  const c=actualLethal(weapon,prior,60,(p,dt)=>{const old=points(a);show(a,p,dt);show(b,p,dt);if(p.dead&&!entry)entry=[differences(old,points(a)).all,differences(old,points(b)).all];});
  assert(entry[0]<entry[1]*.5,`${weapon}/${prior}: ${entry}`);assert(a.deathEntry.active);assert.equal(a.deathAge,1/60);
  while(a.deathAge<1)c.frame();assert.equal(actorContract(a),actorContract(b));assert(!a.deathEntry.active);
 }
});
test('v52 source pose at zero age is retained while explicit and first-seen death stay canonical',()=>{
 for(const weaponType of ['sword','spear','greatsword']){
  const a=createDetailedActor('player'),state={dead:false,weaponType,parry:.2};for(let i=0;i<20;i++)a.animate(state,1/60);const alive=points(a);state.dead=true;a.animate(state,0);const step=differences(alive,points(a));
  assert.equal(a.deathAge,0);assert(a.deathEntry.active);assert(step.skin<.01&&step.rigid<.01,JSON.stringify(step));
  for(const elapsed of [undefined,0,.08,.2,.24,.8])for(const warm of [false,true]){
   if(warm&&elapsed===undefined)continue;const p=createDetailedActor('player'),q=createBefore('player'),s={dead:false,weaponType};if(warm)for(let i=0;i<10;i++)for(const m of [p,q])m.animate(s,1/60);
   Object.assign(s,{dead:true,...(elapsed===undefined?{}:{deathElapsed:elapsed})});for(const m of [p,q])m.animate(s,1/60);assert.equal(actorContract(p),actorContract(q));
  }
 }
});
test('v52 fixed unique snapshots have explicit lifetime and no cross-instance or old-session reuse',()=>{
 const a=createDetailedActor('player'),b=createDetailedActor('player'),s={dead:false,weaponType:'spear'};
 for(const q of [a,b]){s.dead=false;q.animate(s,.016);s.dead=true;q.animate(s,.016);}const cache=a.deathEntry,poses=cache.poses;
 assert.equal(poses.length,44);assert.equal(new Set(poses.map(p=>p.node)).size,44);assert.notEqual(cache,b.deathEntry);assert.notEqual(poses,b.deathEntry.poses);
 s.weaponType='sword';a.animate(s,.016);assert(!cache.active);assert(a.sword.visible&&!a.spear.visible);
 s.dead=false;a.animate(s,.016);assert(!cache.active);s.dead=true;a.animate(s,.016);assert(cache.active);assert.equal(a.deathEntry,cache);assert.equal(cache.poses,poses);
 a.animate({...s},.016);assert(!cache.active,'different Game object cancels the old pose');s.dead=false;a.animate(s,.016);s.dead=true;a.animate(s,.016);assert(cache.active);
 s.deathElapsed=.08;a.animate(s,0);assert(!cache.active);delete s.deathElapsed;
});
test('v52 elapsed pose interpolation is independent of intermediate frame partition',()=>{
 const actors=[createDetailedActor('player'),createDetailedActor('player')],s={dead:false,weaponType:'greatsword',parry:.2};for(const a of actors)for(let i=0;i<12;i++)a.animate(s,1/60);s.dead=true;
 actors[0].animate(s,.08);for(let i=0;i<4;i++)actors[1].animate(s,.02);assert(differences(points(actors[0]),points(actors[1])).all<1e-10);
});
test('v52 other roles, every alive pose and death-to-alive recovery remain exact',()=>{
 for(const family of ACTOR_FAMILIES){const a=createDetailedActor(family),b=createBefore(family),s={dead:false};
  for(const next of [{dead:false},{dead:false,attack:.14,weaponType:'spear'},{dead:true},{dead:true},{dead:false,attack:0},{dead:false,parry:.2}]){Object.assign(s,next);a.animate(s,1/60);b.animate(s,1/60);if(family!=='player'||!s.dead)assert.equal(actorContract(a),actorContract(b),family);}
 }
});
test('v52 actual Game dead-save restore respawns and clears a reused view snapshot',()=>{
 const actors=[createDetailedActor('player'),createBefore('player')],g=new Game();for(const a of actors)show(a,g.player,1/60);g.player.hp=1;g.hurtPlayer(22,null);assert(g.player.dead);for(const a of actors)show(a,g.player,1/60);assert(actors[0].deathEntry.active);
 const saved=g.serialize(),restored=new Game(saved);assert(saved.dead&&!restored.player.dead);for(const a of actors)show(a,restored.player,1/60);assert(!actors[0].deathEntry.active);assert.equal(actorContract(actors[0]),actorContract(actors[1]));assert.equal(actors[0].displayedPlayer,restored.player);
});
test('v52 visible skin, fixed weapon grips and cape stay above actual terrain through live entry',()=>{
 for(const weapon of ['sword','spear','greatsword'])for(const prior of ['idle','walk','attack','parry'])for(const location of [[0,101,0],[-389,-38,2.4],[4,-247,2.4]]){
  const a=createDetailedActor('player',{groundHeight:groundAt}),offset=a[weapon].position.toArray();
  const c=actualLethal(weapon,prior,60,(p,dt)=>{show(a,p,dt);if(p.dead){for(const [kind,gap]of Object.entries(gaps(points(a))))assert(gap>=0,`${weapon}/${prior}/${location}/${a.deathAge}/${kind}: ${gap}`);assert.equal(a[weapon].parent,a.hands[1]);assert.deepEqual(a[weapon].position.toArray(),offset);}},location);while(a.deathAge<.4)c.frame();
 }
});

test('v52 hidden healing weapons reappear with a canonical attached orientation above the ground',()=>{
 for(const weapon of ['sword','spear','greatsword'])for(const hz of [30,60,120]){
  const a=createDetailedActor('player',{groundHeight:groundAt}),b=createBefore('player',{groundHeight:groundAt}),offset=a[weapon].position.toArray();let hidden=false;
  const c=actualLethal(weapon,'heal',hz,(p,dt)=>{show(a,p,dt);show(b,p,dt);if(!p.dead){if(p.healTimer>0)hidden ||= !a[weapon].visible;return;}assert(hidden);assert(a[weapon].visible);assert.equal(a.deathEntry.weaponVisible,false);assert.equal(a[weapon].parent,a.hands[1]);assert.deepEqual(a[weapon].position.toArray(),offset);for(const [kind,gap]of Object.entries(gaps(points(a))))assert(gap>=0,`${weapon}/${hz}/${a.deathAge}/${kind}: ${gap}`);});
  while(a.deathAge<1)c.frame();assert.equal(actorContract(a),actorContract(b));
 }
});

test('v52 actual Game equipment changes before a lethal hit never reuse an unseen weapon orientation',()=>{
 for(const weapon of ['sword','spear','greatsword'])for(const displayNew of [false,true]){
  const g=new Game();g.weapons=['sword','spear','greatsword'];const a=createDetailedActor('player',{groundHeight:groundAt}),b=createBefore('player',{groundHeight:groundAt});
  const original=weapon==='sword'?'spear':'sword';assert(g.equipWeapon(original));for(let i=0;i<30;i++)for(const actor of [a,b])show(actor,g.player,1/60);
  assert(g.equipWeapon(weapon));if(displayNew)for(const actor of [a,b])show(actor,g.player,1/60);
  g.player.hp=1;g.hurtPlayer(22,null);assert(g.player.dead);const gameState=JSON.stringify(g.serialize());
  for(let i=0;i<60;i++){for(const actor of [a,b])show(actor,g.player,1/60);assert.equal(a.deathEntry.weaponVisible,displayNew);assert(a[weapon].visible);for(const gap of Object.values(gaps(points(a))))assert(gap>=0);if(a.deathAge>=.24)assert.equal(actorContract(a),actorContract(b));}
  assert.equal(JSON.stringify(g.serialize()),gameState);
 }
});
