import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,heightAt} from '../src/core.js';
import {combatPresentation} from '../src/combat-presentation.js';

function fixture(type='knight'){
  const game=new Game();game.enemies.forEach(enemy=>enemy.dead=true);game.obstacles=[];
  Object.assign(game.player,{x:0,z:0,y:heightAt(0,0),angle:0});
  const enemy=game.enemies.find(candidate=>candidate.type===type);Object.assign(enemy,{dead:false,x:0,z:2.6,y:heightAt(0,2.6),homeX:0,homeZ:2.6,angle:Math.PI,state:'windup',timer:.85,windupMax:.85,radial:false,hit:false});
  return {game,enemy};
}

test('melee warning reports source, player-relative direction, lead time and response without mutation',()=>{
  const {game,enemy}=fixture(),before=JSON.stringify(game.serialize()),view=combatPresentation(game);
  assert.equal(view.primary.sourceId,enemy.id);assert.equal(view.primary.direction,'正面');assert.equal(view.primary.timeToImpact,.85);assert.equal(view.primary.response,'回避 / 受け流し');assert.match(view.primary.text,/0\.8秒/);assert.equal(JSON.stringify(game.serialize()),before);
});

test('warning direction follows the player rather than assuming a fixed camera heading',()=>{
  const {game,enemy}=fixture();enemy.x=2.6;enemy.z=0;enemy.angle=-Math.PI/2;assert.equal(combatPresentation(game).primary.direction,'右');game.player.angle=Math.PI/2;assert.equal(combatPresentation(game).primary.direction,'正面');
});

test('boss radial attacks name jump as the distinct response',()=>{
  const {game,enemy}=fixture('boss');enemy.radial=true;enemy.timer=1.35;game.lit=['haven','grove','flood','ruins'];const threat=combatPresentation(game).primary;assert.equal(threat.kind,'shockwave');assert.equal(threat.direction,'周囲');assert.equal(threat.response,'跳躍');
});

test('only arrows whose current flight intersects the player become warnings',()=>{
  const {game}=fixture();game.enemies.forEach(enemy=>enemy.dead=true);game.projectiles=[{owner:'enemy-1',x:0,y:game.player.y+1,z:5,vx:0,vy:0,vz:-20,life:2,damage:20}];let view=combatPresentation(game);assert.equal(view.primary.kind,'arrow');assert.equal(view.primary.timeToImpact,.22);
  game.projectiles[0].vx=20;game.projectiles[0].vz=0;view=combatPresentation(game);assert.equal(view.active,false);
});

test('safe, dead and out-of-reach states do not leave a false warning',()=>{
  const {game,enemy}=fixture();enemy.state='recover';assert.equal(combatPresentation(game).active,false);enemy.state='strike';enemy.hit=true;assert.equal(combatPresentation(game).active,false);enemy.state='windup';enemy.hit=false;enemy.x=20;assert.equal(combatPresentation(game).active,false);game.player.dead=true;assert.equal(combatPresentation(game).active,false);
});

