import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, BRIDGES, PLACES, groundAt, inWater, distance } from '../src/core.js';
import { WEAPONS, SENA, SUPPLY_ID } from '../src/content.js';
const step=(g,t,input={})=>{for(let i=0;i<Math.round(t*60);i++)g.tick(1/60,input);};
const quiet=()=>{const g=new Game();g.enemies.forEach(e=>e.dead=true);g.obstacles=[];return g;};
const place=(g,point)=>Object.assign(g.player,{x:point.x,z:point.z,y:groundAt(point.x,point.z),vertical:0,grounded:true});
function ranger(g,z=111){const e=g.enemies.find(e=>e.type==='ranger');Object.assign(e,{dead:false,x:0,z,y:groundAt(0,z),homeX:0,homeZ:z,hp:82,state:'idle',cooldown:0,timer:0,angle:Math.PI});return e;}

test('spear hits at extended range but misses a side target outside its narrow arc',()=>{
  const g=quiet();g.weapons.push('spear');assert(g.equipWeapon('spear'));const [front,side]=g.enemies;
  Object.assign(front,{dead:false,x:0,z:105.8,y:groundAt(0,105.8),hp:100,state:'recover',timer:5});Object.assign(side,{dead:false,x:3,z:104,y:groundAt(3,104),hp:100,state:'recover',timer:5});
  g.locked=front.id;g.attack();step(g,.3);assert(front.hp<100);assert.equal(side.hp,100);assert.equal(g.player.stamina,82);
});
test('greatsword commits more time and stamina before dealing its heavier hit',()=>{
  const g=quiet();g.weapons.push('greatsword');g.equipWeapon('greatsword');const e=g.enemies[0];Object.assign(e,{dead:false,x:0,z:103.5,y:groundAt(0,103.5),hp:200,state:'recover',timer:5});
  g.attack();assert.equal(g.player.stamina,71);step(g,.35);assert.equal(e.hp,200);assert.equal(g.equipWeapon('sword'),false);step(g,.2);assert(Math.abs(e.hp-(200-26*1.7))<.001);step(g,.4);assert(g.equipWeapon('sword'));assert.equal(g.equipWeapon('unknown'),false);
});
test('ranger aims before releasing an arrow, which takes time to reach its target',()=>{
  const g=quiet(),e=ranger(g);step(g,.1);assert.equal(e.state,'windup');assert.equal(g.projectiles.length,0);assert.equal(g.player.hp,120);
  step(g,1.12);assert.equal(g.projectiles.length,1);assert.equal(g.player.hp,120);step(g,.55);assert.equal(g.player.hp,100);
});
test('walls intercept arrows before they reach the player',()=>{
  const g=quiet(),e=ranger(g);e.cooldown=10;e.aim={x:0,y:g.player.y+1.05,z:101};g.obstacles=[{x:0,z:106,r:1,height:10}];g.fireArrow(e);step(g,.8);assert.equal(g.player.hp,120);assert.equal(g.projectiles.length,0);
});
test('timed parry physically returns an arrow and only damages its enemy on arrival',()=>{
  const g=quiet(),e=ranger(g,104);e.cooldown=10;e.aim={x:0,y:g.player.y+1.05,z:101};g.player.angle=0;g.fireArrow(e);g.parry();
  // A finite arrow reaches contact earlier; check the actual parry boundary,
  // not the old point projectile's arbitrary .14-second checkpoint.
  for(let i=0;i<30&&!g.projectiles.some(a=>a.owner==='player');i++)step(g,1/60);
  const reflected=g.projectiles.find(a=>a.owner==='player');assert(reflected);assert.equal(g.player.hp,120);assert.equal(e.hp,82);assert.equal(g.projectileContact(reflected,0).target,null);step(g,.3);assert(e.hp<82);assert.equal(g.player.hp,120);
});
test('jump can carry the player above a previously aimed arrow',()=>{
  const g=quiet(),e=ranger(g);e.cooldown=10;e.aim={x:0,y:g.player.y+1.05,z:101};g.fireArrow(e);step(g,.15);g.jump();step(g,.55);assert.equal(g.player.hp,120);
});
test('bridge deck and both ramps support walking above the river',()=>{
  for(const b of BRIDGES){const g=quiet();place(g,{x:b.x-22,z:b.z});let checked=0;
    for(let i=0;i<430;i++){g.tick(1/60,{x:1});if(Math.abs(g.player.x-b.x)<13){assert(g.player.y>=b.top-.001);assert.equal(inWater(g.player.x,g.player.z),false);checked++;}}
    assert(checked>100);assert(g.player.x>b.x+22);assert(g.player.grounded);
  }
});
test('crossing supplies require defeating the camp, and delivery has two persistent outcomes',()=>{
  for(const choice of ['haven','road']){
    const g=quiet();place(g,SENA);assert(g.startCrossingQuest());assert(g.weapons.includes('spear'));assert.equal(g.quest().target.id,'east-camp');
    const crate=g.pickups.find(l=>l.id===SUPPLY_ID),guard=g.enemies.find(e=>e.encounter==='crossing');guard.dead=false;place(g,crate);assert.equal(g.interact(crate),false);assert.equal(g.supplies,false);guard.dead=true;g.interact(crate);assert(g.supplies);assert.equal(g.quest().target.id,SENA.id);
    assert.equal(g.resolveCrossing(choice),false);place(g,SENA);assert(g.resolveCrossing(choice));const ash=g.player.ash;assert.equal(g.resolveCrossing(choice),false);assert.equal(g.player.ash,ash);
    const h=new Game(g.serialize());assert.equal(h.crossingChoice,choice);assert(h.weapons.includes('spear'));assert.equal(h.trackedQuest,'main');
    if(choice==='haven'){g.player.hp=10;g.player.potions=1;g.heal();step(g,.7);assert.equal(g.player.hp,90);}else{g.player.potions=0;place(g,PLACES[0]);g.interact(PLACES[0]);assert.equal(g.player.potions,4);}
  }
});
test('legacy save unlocks weapons earned at beacons and cannot restore unknown equipment',()=>{
  const g=new Game({version:1,player:{x:0,z:101,weaponType:'not-a-weapon'},lit:['haven','grove','ruins']});assert.equal(g.player.weaponType,'sword');assert.deepEqual(g.weapons,Object.keys(WEAPONS));
});

import {FrameMetrics} from '../src/performance.js';
test('frame measurements include slow active frames and report their actual intervals',()=>{
  const m=new FrameMetrics();assert.equal(m.snapshot(),null);for(let i=0;i<60;i++)m.record(1000/60);for(let i=0;i<30;i++)m.record(1000/30);const s=m.snapshot();assert(Math.abs(s.averageFps-45)<.001);assert(Math.abs(s.p95FrameMs-1000/30)<.001);m.record(200);assert.equal(m.snapshot().worstFrameMs,200);assert.equal(m.snapshot().framesOver50Ms,1);
});
test('a new display setting starts a separate frame measurement window',()=>{
  const m=new FrameMetrics();for(let i=0;i<60;i++)m.record(1000/20);m.reset();assert.equal(m.snapshot(),null);
  for(let i=0;i<60;i++)m.record(1000/60);const s=m.snapshot();assert(Math.abs(s.averageFps-60)<.001);assert.equal(s.totalFrames,60);assert(Math.abs(s.totalPlaySeconds-1)<.001);
});
