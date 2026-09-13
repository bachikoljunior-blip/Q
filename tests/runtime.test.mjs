import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, PLACES, groundAt } from '../src/core.js';
import { cameraFraction, segmentCylinder, segmentTerrain } from '../src/spatial.js';

const step=(game,seconds,input={})=>{for(let i=0;i<Math.round(seconds*60);i++)game.tick(1/60,input);};
const quiet=()=>{const game=new Game();game.enemies.forEach(e=>e.dead=true);return game;};
const place=(actor,x,z)=>Object.assign(actor,{x,z,y:groundAt(x,z)});

test('reloading preserves spent stamina, energy, cooldown and airborne momentum',()=>{
  const g=quiet();g.skill();g.jump();step(g,.1);g.dodge(1,0);step(g,.05);
  const h=new Game(JSON.parse(JSON.stringify(g.serialize())));
  for(const key of ['stamina','energy','skillCooldown','dodge','invulnerable','vertical','y','grounded'])assert.equal(h.player[key],g.player[key],key);
  assert.deepEqual(h.dodgeDir,g.dodgeDir);assert.equal(h.time,g.time);
});

test('reloading preserves a wounded enemy, its committed windup, and an airborne arrow',()=>{
  const g=new Game(),e=g.enemies.find(e=>e.type==='ranger');
  Object.assign(e,{hp:31,state:'windup',timer:.17,cooldown:.25,windupMax:1.15,hit:false,aim:{x:e.x,y:e.y+1,z:e.z+12}});
  g.fireArrow(e);g.projectiles[0].life=1.3;const h=new Game(g.serialize()),other=h.enemies.find(n=>n.id===e.id);
  for(const key of ['x','z','y','hp','state','timer','cooldown','windupMax','hit'])assert.equal(other[key],e[key],key);
  assert.deepEqual(other.aim,e.aim);assert.deepEqual(h.projectiles,g.projectiles);
  assert.equal(h.enemies.filter(e=>e.dead).length,0);
});

test('a saved attack that already connected cannot deal its hit twice',()=>{
  const g=quiet(),e=g.enemies[0];e.dead=false;e.state='recover';e.timer=2;place(g.player,e.x,e.z+2);g.locked=e.id;
  assert(g.attack());step(g,.23);const hp=e.hp;assert(hp<e.maxHp);
  const h=new Game(g.serialize());assert.equal(h.attackHit,true);step(h,.12);
  assert.equal(h.enemies[0].hp,hp);
});

test('drinking takes time, spends once, and completes once across two reloads',()=>{
  const g=quiet();g.player.hp=20;assert(g.heal());assert.equal(g.player.potions,2);assert.equal(g.player.hp,20);
  assert.equal(g.heal(),false);step(g,.3);assert.equal(g.player.hp,20);
  const h=new Game(g.serialize());assert.equal(h.player.potions,2);step(h,.35);assert.equal(h.player.hp,85);
  const j=new Game(h.serialize());step(j,1);assert.equal(j.player.hp,85);assert.equal(j.player.potions,2);
});

test('damage and a defensive roll interrupt drinking without refunding the used potion',()=>{
  for(const interrupt of [g=>g.hurtPlayer(10,g.enemies[0]),g=>g.dodge(1,0)]){
    const g=quiet();g.player.hp=20;g.heal();step(g,.2);interrupt(g);const hp=g.player.hp;
    step(g,1);assert.equal(g.player.hp,hp);assert.equal(g.player.potions,2);assert.equal(g.player.healTimer,0);
  }
});

test('drinking commits the hands, slows movement and prevents sprint drain',()=>{
  const g=quiet();g.player.hp=20;g.player.stamina=70;g.player.staminaDelay=1;g.heal();
  assert.equal(g.attack(),false);assert.equal(g.parry(),false);assert.equal(g.jump(),false);assert.equal(g.skill(),false);
  assert.equal(g.equipWeapon('sword'),false);const x=g.player.x;step(g,.2,{x:1,sprint:true});
  assert(Math.abs(g.player.x-x-6.6*.35*.2)<1e-8);assert.equal(g.player.stamina,70);
});

test('upgrades need a safe fire; crafting and upgrades reject combat, death and busy hands',()=>{
  const g=quiet();g.player.ash=500;g.player.herbs=6;g.player.hp=10;
  assert.equal(g.upgrade('vigor'),false);assert.equal(g.player.hp,10);
  place(g.player,PLACES[0].x,PLACES[0].z);const e=g.enemies[0];e.dead=false;place(e,3,86);
  assert.equal(g.upgrade('vigor'),false);assert.equal(g.craft(),false);assert.equal(g.player.ash,500);assert.equal(g.player.herbs,6);
  e.dead=true;assert(g.upgrade('vigor'));assert.equal(g.player.maxHp,140);assert(g.craft());
  g.parry();assert.equal(g.upgrade('weapon'),false);assert.equal(g.craft(),false);
  g.player.dead=true;assert.equal(g.upgrade('weapon'),false);assert.equal(g.craft(),false);
});

test('incoming hostile arrows prevent resting benefits before enemies enter melee range',()=>{
  const g=quiet();place(g.player,0,86);g.player.ash=100;g.player.hp=20;
  g.projectiles.push({id:1,x:0,y:g.player.y+1,z:96,vx:0,vy:0,vz:-19,life:1,owner:g.enemies[0].id,damage:20});
  assert.equal(g.upgrade('vigor'),false);assert.equal(g.interact(PLACES[0]),false);assert.equal(g.player.hp,20);
});

test('finite cylinders intercept top caps, vertical segments and side walls, but allow passage above',()=>{
  const wall={x:0,y:0,z:5,r:2,height:6};
  assert(Math.abs(segmentCylinder({x:0,y:10,z:0},{x:0,y:3,z:10},wall)-4/7)<1e-9);
  assert.equal(segmentCylinder({x:0,y:10,z:5},{x:0,y:0,z:5},wall),.4);
  assert.equal(segmentCylinder({x:0,y:2,z:0},{x:0,y:2,z:10},wall),.3);
  assert.equal(segmentCylinder({x:0,y:8,z:0},{x:0,y:8,z:10},wall),null);
  assert(cameraFraction({x:0,y:10,z:0},{x:0,y:3,z:10},[wall],()=>0)<.53);
});

test('a terrain ridge can intercept a projectile even when both endpoints are above ground',()=>{
  const ridge=(x,z)=>Math.max(0,3-Math.abs(z-5)*3);
  const hit=segmentTerrain({x:0,y:1,z:0},{x:0,y:1,z:10},ridge,0);
  assert(hit>.42&&hit<.45);assert.equal(segmentTerrain({x:0,y:4,z:0},{x:0,y:4,z:10},ridge,0),null);
});

test('melee and flame cannot hit from twelve metres above, while a downhill spear reaches',()=>{
  const g=quiet(),e=g.enemies[0];e.dead=false;e.state='recover';e.timer=5;place(e,0,104);e.hp=64;
  g.player.y+=12;g.player.grounded=false;g.attack();step(g,.23);g.skill();assert.equal(e.hp,64);
  Object.assign(e,{state:'strike',timer:.2,hit:false,angle:Math.PI});g.tickEnemy(e,.02);assert.equal(g.player.hp,120);
  const h=quiet();h.weapons.push('spear');h.equipWeapon('spear');const target=h.enemies[0];Object.assign(target,{dead:false,state:'recover',timer:5});place(target,0,105.8);
  h.attack();step(h,.3);assert(target.hp<target.maxHp);
});

test('parry faces the arriving arrow instead of its original shooter position',()=>{
  const g=quiet(),p=g.player,e=g.enemies[0];p.angle=0;place(e,0,98);
  g.projectiles.push({id:1,x:0,y:p.y+1,z:p.z+1,vx:0,vy:0,vz:-19,life:1,owner:e.id,damage:20});
  assert(g.parry());g.tickProjectiles(.05);assert.equal(p.hp,120);assert.equal(g.projectiles[0].owner,'player');
});

test('malformed runtime values cannot create invalid resources, actors or unbounded projectiles',()=>{
  const g=new Game(),save=g.serialize(),e=g.enemies[0];
  Object.assign(save.runtime.player,{energy:Infinity,stamina:-100,dodge:99,skillCooldown:Infinity,y:NaN,vertical:Infinity});
  save.runtime.dodgeDir={x:0,z:0};save.runtime.enemies=[{id:e.id,x:Infinity,z:-1e8,hp:-30,state:'invented',timer:Infinity}];
  const arrow={x:0,y:1,z:0,vx:0,vy:0,vz:19,life:999,damage:20,owner:e.id};
  save.runtime.projectiles=Array.from({length:1000},()=>({...arrow}));const h=new Game(save);
  assert.equal(h.player.stamina,0);assert.equal(h.player.energy,100);assert.equal(h.player.dodge,.42);assert.equal(h.player.skillCooldown,0);
  assert(Number.isFinite(h.player.y));assert.equal(h.player.vertical,0);assert(Math.hypot(h.dodgeDir.x,h.dodgeDir.z)>.99);
  assert.equal(h.enemies[0].hp,1);assert.equal(h.enemies[0].state,'idle');assert(h.enemies[0].z>=e.homeZ-50);
  assert.equal(h.projectiles.length,48);assert(h.projectiles.every(a=>a.life===2.3));
});
