import { GATHERINGS } from './gathering-content.js';

const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const initial=()=>({phase:'idle',beat:0,choice:null});
export const createGatherings=()=>Object.fromEntries(GATHERINGS.map(d=>[d.id,initial()]));
export function gatheringAvailable(game,d){return (!d.require.bellsReported||game.bells.reported)&&(!d.require.crossingChoice||game.crossingChoice===d.require.crossingChoice);}
function cast(game,d){return d.actors.map(a=>game.residents.find(n=>n.id===a.id));}
function safe(game,d){return !game.player.dead&&!game.threatened(d,18)&&cast(game,d).every(n=>n&&!game.threatened(n,13));}
function active(game,d){const s=game.gatherings[d.id];return gatheringAvailable(game,d)&&['gathering','talking'].includes(s.phase);}
export function gatheringView(game,id){
  const d=GATHERINGS.find(d=>d.id===id);if(!d||!gatheringAvailable(game,d))return null;
  const s=game.gatherings[id],people=cast(game,d),near=distance(game.player,d)<8;
  const ready=near&&safe(game,d)&&people.every((n,i)=>n&&distance(n,d.actors[i])<.65);
  return {definition:d,state:s,ready,status:s.phase==='done'?d.choices.find(c=>c.id===s.choice).result:!safe(game,d)?'危険が去るまで相談を中断している':!near?'集まる場所へ戻ると相談を再開できる':!ready?'二人が歩いて集まるのを待とう':'二人が揃った。話の続きを聞こう'};
}
export function gatheringForActor(game,id){return GATHERINGS.find(d=>d.actors.some(a=>a.id===id)&&gatheringAvailable(game,d));}
export function gatheringGoal(game,n){
  const d=GATHERINGS.find(d=>active(game,d)&&d.actors.some(a=>a.id===n.id)&&distance(game.player,d)<22&&safe(game,d));
  if(!d)return null;
  return {...d.actors.find(a=>a.id===n.id),activity:'相談の輪に集まる'};
}
export function tickGatherings(game){
  for(const d of GATHERINGS){const s=game.gatherings[d.id];if(active(game,d)&&s.phase==='gathering'&&gatheringView(game,d.id).ready){s.phase='talking';game.notify(`${d.title} — 二人が揃った。近づいて話そう`);game.emit('save');}}
}
export function gatheringAction(game,id,action){
  const view=gatheringView(game,id);if(!view||!game.actionIdle())return false;
  const {definition:d,state:s}=view;
  if(!safe(game,d)||!cast(game,d).some(n=>n&&distance(game.player,n)<4.7&&game.canReach(game.player,n)))return false;
  if(action==='start'){
    if(s.phase!=='idle')return false;
    s.phase='gathering';game.notify(`${d.title} — 近くで二人が集まるのを待とう`);
  }else{
    if(s.phase!=='talking'||!view.ready)return false;
    if(action==='next'){if(s.beat>=d.lines.length-1)return false;s.beat++;}
    else{
      const choice=d.choices.find(c=>c.id===action);
      if(!choice||s.beat!==d.lines.length-1)return false;
      s.choice=choice.id;s.phase='done';game.player.herbs+=choice.reward.herbs;game.reward(choice.reward.ash,0);game.notify(choice.result);
    }
  }
  game.emit('save');return true;
}
export function gatheringSpeech(game,n){
  for(const d of GATHERINGS){const s=game.gatherings[d.id];if(gatheringAvailable(game,d)&&s.phase==='done'){const text=d.choices.find(c=>c.id===s.choice)?.responses[n.id];if(text)return text;}}
  return null;
}
export function restoreGatherings(game,source){
  const states=createGatherings();
  for(const d of GATHERINGS){const s=source?.[d.id];if(!s||!gatheringAvailable(game,d))continue;
    if(!['gathering','talking','done'].includes(s.phase)||!Number.isInteger(s.beat)||s.beat<0||s.beat>=d.lines.length)continue;
    if(s.phase==='done'){if(s.beat!==d.lines.length-1||!d.choices.some(c=>c.id===s.choice))continue;}
    else if(s.choice!==null||(s.phase==='gathering'&&s.beat!==0))continue;
    states[d.id]={phase:s.phase,beat:s.beat,choice:s.phase==='done'?s.choice:null};
  }
  return states;
}
