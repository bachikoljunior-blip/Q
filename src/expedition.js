import { SALT_JOURNEY, SALT_TARGETS, regionAt } from './world-regions.js';
import { indexObstacles } from './spatial.js';

export const createExpedition=()=>({visited:false,started:false,handle:false,opened:false,reported:false});
export function restoreExpedition(source){
  const state=createExpedition();if(!source||typeof source!=='object')return state;
  state.visited=source.visited===true;state.handle=source.handle===true;
  state.opened=state.handle&&source.opened===true;
  state.reported=state.opened&&source.reported===true;
  state.started=state.handle||source.started===true;return state;
}
export function applyExpeditionWorld(game){
  game.obstacles=indexObstacles(game.obstacles.filter(o=>o.id!==SALT_JOURNEY.gate.id));
  if(!game.expedition.opened)game.obstacles=indexObstacles([...game.obstacles,{...SALT_JOURNEY.gate}]);
  for(const e of game.enemies){e.route=null;e.routeGoal=null;}
}
export function tickExpedition(game){
  if(!game.expedition.visited&&regionAt(game.player.x,game.player.z)){
    game.expedition.visited=true;game.emit('discover',{place:regionAt(game.player.x,game.player.z)});game.emit('save');
  }
}
export function expeditionQuest(game){
  const s=game.expedition;
  return {title:SALT_JOURNEY.title,text:s.reported?'石門に道が戻った。伝言板に帰還の印を残した。':s.opened?'石門を抜け、谷側の伝言板に帰還の印を刻む':s.handle?'段丘側の巻上げ機に取っ手を戻し、石門を開く':s.started?'北の岩棚か南の塩原を回り、西の見張り場で取っ手を回収する':'琥珀の森の西にある伝言板を読む',target:s.reported?null:s.opened?SALT_JOURNEY.board:s.handle?SALT_JOURNEY.winch:s.started?SALT_JOURNEY.handle:SALT_JOURNEY.board};
}
export function interactExpedition(game,id){
  const target=SALT_TARGETS.find(t=>t.id===id),p=game.player,s=game.expedition;
  if(!target||!game.actionIdle()||Math.hypot(p.x-target.x,p.z-target.z)>=3.2||!game.canReach(p,target))return false;
  if(game.threatened()){game.notify('周囲が安全になってから調べよう');return false;}
  if(target.kind==='board'){
    if(s.opened&&!s.reported){s.reported=true;game.reward(SALT_JOURNEY.reward.ash,SALT_JOURNEY.reward.xp);p.herbs+=SALT_JOURNEY.reward.herbs;game.notify('帰還の印を刻んだ — 灰 +120・露草 +4');if(game.trackedQuest==='expedition')game.trackedQuest='main';}
    else if(!s.reported){s.started=true;game.trackedQuest='expedition';}
    game.emit('expeditionText');
  }else if(target.kind==='handle'){
    if(s.handle)return false;
    if(game.enemies.some(e=>e.encounter===SALT_JOURNEY.id&&!e.dead)){game.notify('見張り場を占拠した者たちを退けよう');return false;}
    s.started=true;s.handle=true;game.trackedQuest='expedition';game.notify('巻上げ機の取っ手を回収した — 石門の段丘側へ');
  }else{
    if(s.opened)return false;
    if(!s.handle){game.notify('取っ手がない。西の見張り場を探そう');return false;}
    s.opened=true;applyExpeditionWorld(game);game.notify('石門が開いた — 谷へ続く近道');game.emit('beacon',{id:SALT_JOURNEY.id});
  }
  game.emit('save');return true;
}
