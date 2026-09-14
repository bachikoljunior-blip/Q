import {GATHERINGS} from './gathering-content.js';
import {gatheringView} from './gatherings.js';

// Shared read-only presentation: never advances dialogue, grants rewards or writes a save.
export function gatheringPresentation(game,id){
  const v=gatheringView(game,id);if(!v)return null;
  const {definition:d,state:s}=v;
  const near=Math.hypot(game.player.x-d.x,game.player.z-d.z)<22;
  const visible=near&&!game.player.dead&&s.phase!=='done';
  const speaking=s.phase==='talking'&&v.ready&&!game.player.dead;
  const speakerId=speaking?d.lines[s.beat].actor:null;
  const cue=s.phase==='idle'?'◆ 相談あり':s.phase==='gathering'?'◇ 集合中':s.phase==='talking'?(v.ready?'◆ 話の続き':'◇ 相談を中断中'):'約束を果たした';
  return {id,title:d.title,phase:s.phase,visible,speakerId,cue,
    progress:s.phase==='talking'?`${s.beat+1} / ${d.lines.length}`:s.phase==='done'?'相談を終えた':'これから相談する',
    instruction:s.phase==='gathering'?'画面を閉じ、近くで二人が歩いて集まるのを待とう。':s.phase==='talking'&&!v.ready?v.status:s.phase==='idle'?'「皆で話す」から二人に声をかけよう。':s.phase==='done'?'選んだ約束は旅の記録に残る。':'話の続きを聞くと、最後に約束を選べる。',
    cast:d.actors.map(a=>{const n=game.residents.find(n=>n.id===a.id);return {id:a.id,label:n?.label||a.id,current:a.id===speakerId,arrived:!!n&&Math.hypot(n.x-a.x,n.z-a.z)<.65};}),
    history:d.lines.slice(0,s.phase==='done'?d.lines.length:s.phase==='talking'?s.beat:0),
  };
}

export function actorGatheringCue(game,actorId){
  const d=GATHERINGS.find(d=>d.actors.some(a=>a.id===actorId));
  if(!d)return null;
  const p=gatheringPresentation(game,d.id);if(!p?.visible)return null;
  return {id:p.id,text:p.speakerId===actorId?`◆ 話者 · ${p.progress}`:p.cue,speaker:p.speakerId===actorId};
}
