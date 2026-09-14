// Deterministic laboratory replays. These compare combat rules and warnings, not rendering, touch controls or fun.
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {Game,heightAt} from '../src/core.js';
import {combatPresentation} from '../src/combat-presentation.js';

function initialState(type,radial=false){
  const game=new Game();game.enemies.forEach(enemy=>enemy.dead=true);
  const enemy=game.enemies.find(candidate=>candidate.type===type);enemy.dead=false;
  if(type==='boss')game.lit=['haven','grove','flood','ruins'];
  const range=radial?5:type==='wolf'?1.9:2.6;
  Object.assign(game.player,{x:enemy.homeX,z:enemy.homeZ+range,y:heightAt(enemy.homeX,enemy.homeZ+range),angle:Math.PI,hp:120,dead:false});
  Object.assign(enemy,{x:enemy.homeX,z:enemy.homeZ,y:heightAt(enemy.homeX,enemy.homeZ),angle:0,state:'windup',timer:radial?1.35:type==='wolf'?.62:.85,windupMax:radial?1.35:type==='wolf'?.62:.85,cooldown:0,radial,hit:false});
  game.projectiles=[];game.events=[];
  return game.serialize();
}

function run(initial,actions,frames=100){
  const game=new Game(initial),samples=[],events=[];let lastKey='';
  for(let frame=0;frame<frames;frame++){
    const scheduled=actions.filter(action=>action.frame===frame);
    for(const action of scheduled){const accepted=action.name==='dodge'?game.dodge(...action.args):game[action.name]();events.push({frame,type:'input',name:action.name,accepted});}
    const warning=combatPresentation(game),key=warning.primary?`${warning.primary.sourceId}:${warning.primary.stage}:${warning.primary.kind}`:'none';
    if(key!==lastKey||frame%6===0)samples.push({frame,seconds:Math.round(frame/60*1000)/1000,primary:warning.primary});
    lastKey=key;game.tick(1/60);
    for(const event of game.events.splice(0))if(['enemySwing','hurt','perfect','death'].includes(event.type))events.push({frame,type:event.type,amount:event.amount??null,id:event.id??null});
  }
  const active=game.enemies.filter(enemy=>!enemy.dead).map(enemy=>({id:enemy.id,type:enemy.type,state:enemy.state,hp:Math.round(enemy.hp)}));
  return {actions,frames,samples,events,outcome:{playerHp:Math.round(game.player.hp),playerDead:game.player.dead,activeEnemies:active}};
}

export function buildCombatReview(){
  const definitions=[
    {id:'knight-no-response',initial:initialState('knight'),actions:[]},
    {id:'knight-dodge',initial:initialState('knight'),actions:[{frame:42,name:'dodge',args:[1,0]}]},
    {id:'knight-parry',initial:initialState('knight'),actions:[{frame:42,name:'parry',args:[]}]},
    {id:'boss-grounded',initial:initialState('boss',true),actions:[],frames:110},
    {id:'boss-jump',initial:initialState('boss',true),actions:[{frame:60,name:'jump',args:[]}],frames:110},
  ];
  const scenarios=definitions.map(({id,initial,actions,frames})=>({id,initial,run:run(initial,actions,frames)}));
  assert(scenarios[0].run.outcome.playerHp<120);assert.equal(scenarios[1].run.outcome.playerHp,120);assert.equal(scenarios[2].run.outcome.playerHp,120);assert(scenarios[2].run.events.some(event=>event.type==='perfect'));
  assert(scenarios[3].run.outcome.playerHp<120);assert.equal(scenarios[4].run.outcome.playerHp,120);
  for(const scenario of scenarios){assert.deepEqual(run(scenario.initial,scenario.run.actions,scenario.run.frames),scenario.run);assert(scenario.run.samples.some(sample=>sample.primary));}
  return {formatVersion:1,gameVersion:'0.15.0',fixedStepHz:60,note:'Deterministic rule and warning replay; no rendered screen, touch, audio, device-performance or player-quality observation.',scenarios};
}

if(process.argv[1]&&import.meta.url===new URL(process.argv[1],'file:').href){
  const review=buildCombatReview(),root=new URL('../release/combat-replays/',import.meta.url);mkdirSync(root,{recursive:true});writeFileSync(new URL('combat-readability.json',root),JSON.stringify(review,null,2)+'\n');
  console.log(JSON.stringify({passed:true,scenarios:review.scenarios.map(s=>({id:s.id,hp:s.run.outcome.playerHp,events:s.run.events.length,samples:s.run.samples.length})),note:review.note},null,2));
}
