import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,groundAt,distance} from '../src/core.js';
import {ROAD_CACHE,residentActive,residentSpeech,routineFor} from '../src/village.js';

const at=(g,t,dx=1)=>Object.assign(g.player,{x:t.x+dx,z:t.z,y:groundAt(t.x+dx,t.z),grounded:true,dead:false});
const tick=(g,seconds)=>{for(let i=0;i<seconds*60;i++)g.tick(1/60);};

test('delivery choice activates only its own two aftermath residents',()=>{
  const g=new Game();assert.equal(g.residents.length,7);assert.equal(g.npcs().length,4);
  for(const choice of ['haven','road']){
    g.crossingChoice=choice;const active=g.residents.filter(n=>residentActive(g,n));
    assert.deepEqual(active.filter(n=>n.branch).map(n=>n.branch),[choice,choice]);
    assert.equal(g.npcs().length,6);assert(g.npcs().every(n=>!n.branch||n.branch===choice));
  }
});

test('inactive aftermath people cannot be reached through spoofed interactions',()=>{
  const g=new Game(),road=g.residents.find(n=>n.branch==='road');at(g,road);
  assert(!g.nearestInteract()||g.nearestInteract().id!==road.id);assert.equal(g.interact(road),false);
  g.crossingChoice='haven';assert.equal(g.interact(road),false);
  const haven=g.residents.find(n=>n.branch==='haven');at(g,haven);assert.equal(g.interact(haven),true);
  assert(g.events.some(e=>e.type==='dialogue'&&e.npc===haven.id));
});

test('road cache restores the promised four potions only after the road choice',()=>{
  const g=new Game();at(g,ROAD_CACHE);g.player.potions=1;assert.equal(g.interact(ROAD_CACHE),false);assert.equal(g.player.potions,1);
  g.crossingChoice='road';assert.equal(g.nearestInteract().id,ROAD_CACHE.id);assert(g.interact(ROAD_CACHE));assert.equal(g.player.potions,4);
  assert.equal(g.interact(ROAD_CACHE),false);assert.equal(g.player.potions,4);
  g.player.potions=2;g.projectiles.push({owner:'enemy-0',x:g.player.x,y:g.player.y+1,z:g.player.z,vx:0,vy:0,vz:0,life:1,damage:1});
  assert.equal(g.interact(ROAD_CACHE),false);assert.equal(g.player.potions,2);
});

test('aftermath routines move on navigable ground and pause for conversation',()=>{
  for(const choice of ['haven','road']){
    const g=new Game();g.crossingChoice=choice;at(g,{x:choice==='road'?130:0,z:choice==='road'?55:110});g.day=.45;tick(g,18);
    for(const n of g.residents.filter(n=>n.branch===choice)){
      assert(distance(n,routineFor(n,g.day))<.75,`${n.id} reaches routine`);assert.equal(n.y,groundAt(n.x,n.z));
      assert(g.obstacles.every(o=>distance(n,o)>=o.r+.47),`${n.id} avoids solids`);
    }
    const n=g.residents.find(n=>n.branch===choice);at(g,n);const before={x:n.x,z:n.z};g.day=.8;tick(g,2);assert(distance(n,before)<.001);
  }
});

test('aftermath position and branch choice survive reload without activating the other branch',()=>{
  const g=new Game();g.supplies=true;g.crossingChoice='road';at(g,{x:130,z:55});g.day=.45;tick(g,5);
  const saved=g.serialize(),loaded=new Game(saved);assert.equal(loaded.crossingChoice,'road');
  for(const n of g.residents.filter(n=>n.branch==='road')){const other=loaded.residents.find(v=>v.id===n.id);assert(distance(n,other)<.001);assert.equal(other.route,null);}
  assert(loaded.npcs().every(n=>n.branch!=='haven'));
  saved.runtime.residents=[{id:'traveler-asa',x:-9999,z:9999}];const bounded=new Game(saved),asa=bounded.residents.find(n=>n.id==='traveler-asa');
  assert(Math.abs(asa.x-asa.homeX)<=30&&Math.abs(asa.z-asa.homeZ)<=30);
});

test('aftermath dialogue changes by role, ending and time without exposing the unchosen branch',()=>{
  const g=new Game();g.crossingChoice='road';const asa=g.residents.find(n=>n.role==='traveler'),yuno=g.residents.find(n=>n.role==='scout');
  assert(residentSpeech(g,asa).includes('四本'));assert(residentSpeech(g,yuno).includes('橋'));
  g.day=.8;assert(residentSpeech(g,yuno).includes('火'));g.ending='release';assert(residentSpeech(g,asa).includes('北'));
  g.crossingChoice='haven';const nagi=g.residents.find(n=>n.role==='patient'),tou=g.residents.find(n=>n.role==='porter');
  assert(residentSpeech(g,nagi).includes('足'));assert(residentSpeech(g,tou).includes('箱'));
});
