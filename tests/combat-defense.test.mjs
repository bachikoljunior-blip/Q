import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,groundAt} from '../src/core.js';
import {combatPresentation} from '../src/combat-presentation.js';

function fixture(){
  const g=new Game();g.enemies.forEach(e=>e.dead=true);g.obstacles=[];
  Object.assign(g.player,{x:0,z:86,y:groundAt(0,86),angle:Math.PI});g.events=[];
  return g;
}
test('held attack cannot cancel an accepted parry before an imminent hit',()=>{
  const g=fixture(),e=g.enemies.find(e=>e.type==='knight');
  Object.assign(e,{dead:false,x:0,z:83.4,y:groundAt(0,83.4),homeX:0,homeZ:83.4,state:'windup',timer:.1,angle:0,hit:false});
  assert.equal(g.requestAction('parry'),true);
  for(let f=0;f<20;f++){g.requestAction('attack');g.tick(1/60);}
  assert.equal(g.player.hp,120);assert(g.events.some(e=>e.type==='perfect'));
});
test('a blocked urgent arrow does not hide later unblocked arrows',()=>{
  const g=fixture();g.obstacles=[{x:-2,z:86,r:.5,height:6}];
  const arrow=(id,x,z,vx,vz)=>({id,owner:'attacker-'+id,x,z,y:g.player.y+1,vx,vy:0,vz,life:2,damage:20});
  g.projectiles=[arrow(1,-4,86,19,0),arrow(2,5,86,-19,0),arrow(3,0,92,0,-19)];
  const result=combatPresentation(g);assert.equal(result.primary.sourceId,'attacker-2');
  assert.deepEqual(result.threats.map(t=>t.sourceId),['attacker-2','attacker-3']);
  for(let i=0;i<20;i++)g.tick(1/60);
  assert(g.player.hp<120);
});
test('a near-expiry arrow still warns when it will hit on its final live step',()=>{
  const g=fixture();g.projectiles=[{id:1,owner:'attacker',x:-.8,z:86,y:g.player.y+1,vx:19,vy:0,vz:0,life:.02,damage:20}];
  assert.equal(combatPresentation(g).active,true);g.tick(1/60);assert.equal(g.player.hp,100);
  const expired=fixture();expired.projectiles=[{id:1,owner:'attacker',x:-.8,z:86,y:expired.player.y+1,vx:19,vy:0,vz:0,life:.01,damage:20}];
  assert.equal(combatPresentation(expired).active,false);expired.tick(1/60);assert.equal(expired.player.hp,120);
});
