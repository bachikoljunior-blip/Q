import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,groundAt,distance} from '../src/core.js';
import {WIND_SHRINE,WIND_BELLS,BELL_ORDER,BELL_VERSE,routineFor,residentSpeech} from '../src/village.js';
import {VillageScene} from '../src/village-scene.js';
import * as T from 'three';

// Unit fixtures position actors directly; only simulate-forge.mjs is a walking journey.
const at=(g,t)=>{Object.assign(g.player,{x:t.x,z:t.z+1,y:groundAt(t.x,t.z+1),grounded:true});};
const wait=(g,s)=>{for(let i=0;i<Math.ceil(s*60);i++)g.tick(1/60);};
const bell=id=>WIND_BELLS.find(b=>b.id===id);
function solve(g){for(const id of BELL_ORDER){at(g,bell(id));assert.equal(g.interact(bell(id)),true);wait(g,.7);}}

test('three bells use inscription order, reject wrong notes, preserve partial progress and reward only once',()=>{
  let g=new Game();at(g,g.residents[0]);assert(g.startForgeQuest());assert.equal(g.quest().target,WIND_SHRINE);
  at(g,WIND_SHRINE);assert(g.interact(WIND_SHRINE));assert(g.bells.read);assert(BELL_VERSE.includes('鳥'));
  at(g,bell('bell-rain'));assert(g.interact(bell('bell-rain')));assert.equal(g.bells.step,0);wait(g,.7);
  at(g,bell('bell-bird'));assert(g.interact(bell('bell-bird')));assert.equal(g.bells.step,1);
  g=new Game(g.serialize());assert.equal(g.bells.step,1);assert(g.bells.read);assert.equal(g.trackedQuest,'forge');assert(!g.interact(bell('bell-bird')));
  wait(g,.7);for(const id of BELL_ORDER.slice(1)){at(g,bell(id));assert(g.interact(bell(id)));wait(g,.7);}
  assert(g.bells.solved);assert.equal(g.dodgeCost(),25);assert.equal(g.quest().target,g.residents[0]);
  at(g,g.residents[0]);const before=g.player.ash;assert(g.reportForgeQuest());assert.equal(g.player.ash,before+80);assert.equal(g.dodgeCost(),21);
  g.player.stamina=21;assert(g.dodge());assert.equal(g.player.stamina,0);wait(g,.5);
  const saved=new Game(g.serialize());assert(saved.bells.reported);assert.equal(saved.dodgeCost(),21);assert(!saved.reportForgeQuest());assert.equal(saved.player.ash,before+80);
});

test('shrine can be discovered and solved before meeting Ren; replaying bells cannot grant extra rewards',()=>{
  const g=new Game();at(g,WIND_SHRINE);g.tick(1/60);assert(g.bells.discovered);assert(!g.bells.started);assert(g.trackQuest('forge'));
  solve(g);assert(g.bells.solved);assert(!g.bells.started);at(g,g.residents[0]);assert(g.reportForgeQuest());
  const ash=g.player.ash;solve(g);assert.equal(g.player.ash,ash);assert.equal(g.bells.step,3);assert(!g.trackQuest('forge'));
});

test('bell interactions validate identity, actual distance, walls, idle hands and nearby danger',()=>{
  const g=new Game(),b=bell('bell-bird');assert(!g.interact({...b,x:0,z:101}));
  at(g,b);assert(!g.interact({...b,id:'invented'}));g.player.attack=.2;assert(!g.interact(b));g.player.attack=0;
  g.projectiles.push({owner:'enemy-0',x:g.player.x,z:g.player.z,life:1});assert(!g.interact(b));g.projectiles=[];
  g.obstacles.push({x:b.x,z:b.z+.5,r:.2,height:3});assert(!g.interact(b));g.obstacles.pop();
  assert(g.interact(b));assert(!g.interact(b));assert.equal(g.bells.step,1);
  g.player.dead=true;wait(g,1);assert.equal(g.bells.cooldown,.65);assert(!g.interact(b));
});

test('resident conversation uses the moving resident, not a spoofed or obsolete home position',()=>{
  const g=new Game(),ren=g.residents[0];ren.x=1;ren.z=86;
  at(g,{x:9,z:98});assert(!g.interact({...ren,x:9,z:98}));assert(!g.startForgeQuest());
  at(g,ren);assert(g.interact(ren));assert(!g.metSena);assert(g.startForgeQuest());
  g.player.healTimer=.4;assert(!g.startForgeQuest());
});

test('residents follow day routines on walkable ground, stop near the player, and flee approaching enemies',()=>{
  const g=new Game();at(g,{x:0,z:113});g.day=.3;wait(g,15);
  for(const n of g.residents){assert(distance(n,routineFor(n,g.day))<.6);assert.equal(n.y,groundAt(n.x,n.z));assert(g.obstacles.every(o=>distance(n,o)>=o.r+.47));}
  const io=g.residents[1];at(g,io);const before={x:io.x,z:io.z};g.day=.6;wait(g,2);assert(distance(io,before)<.001);
  const enemy=g.enemies[0];Object.assign(enemy,{x:io.x+8,z:io.z,state:'stagger',timer:5});g.tick(1/60);
  assert.equal(io.activity,'火のそばへ避難');assert(io.moving);
});

test('resident save resumes positions, drops navigation caches, and rejects invalid puzzle state',()=>{
  const g=new Game();at(g,{x:0,z:113});g.day=.3;wait(g,3);const s=g.serialize(),loaded=new Game(s);
  for(let i=0;i<2;i++){assert(distance(g.residents[i],loaded.residents[i])<.0001);assert.equal(loaded.residents[i].route,null);}
  s.bells={reported:true,solved:false,step:Infinity,cooldown:-5};s.runtime.residents=[{id:'healer-io',x:Infinity,z:-9999},{id:'unknown',x:0,z:0}];
  const bad=new Game(s);assert(!bad.bells.reported);assert.equal(bad.bells.step,0);assert.equal(bad.bells.cooldown,0);assert.equal(bad.residents.length,2);
  assert(bad.residents.every(n=>Number.isFinite(n.y)&&n.z>=70));
  delete s.bells;delete s.runtime.residents;const legacy=new Game(s);assert.equal(legacy.dodgeCost(),25);assert.equal(legacy.residents.length,2);assert(!legacy.bells.started);
});

test('healer dialogue reflects delivery choice and blacksmith reflects the restored furnace',()=>{
  const g=new Game(),io=g.residents[1],ren=g.residents[0],morning=residentSpeech(g,io);g.day=.8;assert.notEqual(residentSpeech(g,io),morning);
  g.crossingChoice='haven';assert(residentSpeech(g,io).includes('薬草'));g.crossingChoice='road';assert(residentSpeech(g,io).includes('野営地'));
  const before=residentSpeech(g,ren);g.bells.solved=true;assert.notEqual(residentSpeech(g,ren),before);g.bells.reported=true;assert(residentSpeech(g,ren).includes('風'));
});

test('village render graph reflects bell progress and reward without requiring a WebGL context',()=>{
  const scene=new T.Scene(),player={body:new T.Group()},g=new Game(),view=new VillageScene(scene,player);
  view.update(g,1/60,1);assert(!view.flame.visible);assert(!view.charm.visible);assert.equal(view.bells.size,3);
  view.ring('bell-bird');view.update(g,1/60,2);assert.notEqual(view.bells.get('bell-bird').swing.rotation.z,0);
  g.bells.solved=g.bells.reported=true;view.update(g,1/60,3);assert(view.flame.visible);assert(view.charm.visible);
  for(const child of scene.children)assert(child.position.toArray().every(Number.isFinite));
  // Graph checks are not visual, lighting, touch or audio playtests.
});
