// Original village routines and an optional, text-readable exploration puzzle.
export const RESIDENTS=[
  {id:'smith-ren',name:'鍛冶師レンと話す',label:'鍛冶師 レン',role:'smith',x:9,z:98},
  {id:'healer-io',name:'薬師イオと話す',label:'薬師 イオ',role:'healer',x:-8,z:89},
];
export const WIND_SHRINE={id:'wind-shrine',name:'風読みの碑文を読む',label:'三響の祠',en:'THE THREEFOLD CHIME',type:'inscription',x:-155,z:-120};
export const WIND_BELLS=[
  {id:'bell-rain',name:'雨の鐘を鳴らす',label:'雨',type:'bell',x:-148,z:-119,note:440,color:0x85b6c8},
  {id:'bell-star',name:'星の鐘を鳴らす',label:'星',type:'bell',x:-157,z:-128,note:659.25,color:0xc2a5d4},
  {id:'bell-bird',name:'鳥の鐘を鳴らす',label:'鳥',type:'bell',x:-162,z:-117,note:329.63,color:0xe2c378},
];
export const BELL_ORDER=['bell-bird','bell-rain','bell-star'];
export const BELL_VERSE='鳥が朝を運び、雨が土を潤し、星が夜を迎える。';
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export const createBells=()=>({started:false,discovered:false,read:false,step:0,solved:false,reported:false,cooldown:0});
export function restoreBells(source){
  const b=createBells();if(!source||typeof source!=='object')return b;
  for(const key of ['started','discovered','read','solved'])b[key]=source[key]===true;
  b.reported=b.solved&&source.reported===true;
  b.step=b.solved?3:Number.isFinite(source.step)?Math.max(0,Math.min(2,Math.floor(source.step))):0;
  b.cooldown=Number.isFinite(source.cooldown)?Math.max(0,Math.min(.65,source.cooldown)):0;
  b.discovered=b.discovered||b.read||b.solved||b.step>0;
  return b;
}
export function createResidents(groundAt){return RESIDENTS.map(n=>({...n,type:'npc',homeX:n.x,homeZ:n.z,y:groundAt(n.x,n.z),angle:0,moving:false,activity:'仕事',route:null}));}
export function routineFor(n,day){
  if(n.role==='smith'){
    if(day<.25)return{x:9,z:98,activity:'炉の手入れ'};
    if(day<.52)return{x:10,z:94,activity:'鍛錬'};
    if(day<.76)return{x:4,z:89,activity:'火を囲む'};
    return{x:10,z:97,activity:'道具を磨く'};
  }
  if(day<.25)return{x:-8,z:89,activity:'薬草を選ぶ'};
  if(day<.52)return{x:-8,z:73,activity:'薬草を摘む'};
  if(day<.76)return{x:-5,z:86,activity:'薬を煎じる'};
  return{x:-10,z:89,activity:'夜の見回り'};
}
export function tickVillage(game,dt,groundAt){
  game.bells.cooldown=Math.max(0,game.bells.cooldown-dt);
  if(!game.bells.discovered&&distance(game.player,WIND_SHRINE)<26){
    game.bells.discovered=true;game.emit('discover',{place:{...WIND_SHRINE,name:WIND_SHRINE.label}});game.emit('save');
  }
  for(const n of game.residents){
    const afraid=game.threatened(n,13),goal=afraid?{x:0,z:86,activity:'火のそばへ避難'}:routineFor(n,game.day);
    const d=distance(n,goal),nearPlayer=distance(game.player,n)<3.7;
    n.activity=goal.activity;n.moving=false;
    if(d>.45&&(!nearPlayer||afraid)){
      const x=n.x,z=n.z;game.moveEnemy(n,goal,afraid?3:1.7,dt);
      const dx=n.x-x,dz=n.z-z;n.moving=Math.hypot(dx,dz)>.001;
      if(n.moving)n.angle=Math.atan2(dx,dz);
    }else if(nearPlayer)n.angle=Math.atan2(game.player.x-n.x,game.player.z-n.z);
    n.y=groundAt(n.x,n.z);
  }
}
export function canWorkWith(game,n){return !!n&&game.actionIdle()&&!game.threatened()&&distance(game.player,n)<4.7&&game.canReach(game.player,n);}
export function startForge(game){
  if(game.bells.reported||!canWorkWith(game,game.residents[0]))return false;
  game.bells.started=true;game.trackedQuest='forge';game.emit('save');return true;
}
export function reportForge(game){
  const b=game.bells;if(!b.solved||b.reported||!canWorkWith(game,game.residents[0]))return false;
  b.started=true;b.reported=true;if(game.trackedQuest==='forge')game.trackedQuest='main';
  game.reward(80,60);game.notify('風渡りの鈴を受け取った — 回避の消費が25から21に');game.emit('level');game.emit('save');return true;
}
export function interactShrine(game,target){
  const b=game.bells;
  if(!game.actionIdle()||game.threatened()){game.notify('安全な場所で、動作が終わってから調べよう');return false;}
  b.discovered=true;
  if(target.id===WIND_SHRINE.id){b.read=true;game.emit('inscription');game.emit('save');return true;}
  if(b.cooldown>0)return false;
  b.cooldown=.65;
  if(!b.solved){
    const correct=target.id===BELL_ORDER[b.step];b.step=correct?b.step+1:target.id===BELL_ORDER[0]?1:0;
    if(b.step===3){b.solved=true;game.notify('三つの響きが重なった — 鍛冶師レンへ知らせよう');}
    else game.notify(`${target.label}の鐘 — ${correct?'響きがつながった':'響きがほどけた'}（${b.step}/3）`);
  }else game.notify(`${target.label}の鐘 — 谷に風が通る`);
  game.emit('bell',{id:target.id,note:target.note,x:target.x,z:target.z,solved:b.solved});game.emit('save');return true;
}
export function forgeText(game){
  const b=game.bells;
  if(b.reported)return '谷の炉に風を戻し、風渡りの鈴を受け取った。回避の消費スタミナ −4。';
  if(b.solved)return '鐘の響きを、集落の鍛冶師レンへ伝えよう。';
  if(b.read)return `碑文の言葉を手掛かりに鐘を鳴らす。響き ${b.step}/3。`;
  if(b.started||b.discovered)return '谷の西、三響の祠で風読みの碑文を探す。';
  return '集落の鍛冶師が、風の入らない炉を見つめている。';
}
export function residentSpeech(game,n){
  const night=game.day>=.76;
  if(n.role==='smith'){
    if(game.bells.reported)return night?'昼に打った道具を磨く、この時間が好きなんだ。あんたが戻した風を、次の旅人の刃へ渡しておくよ。':'炉に風が通る。鉄が、前より素直に伸びるんだ。あの鈴は歩く人のためのものだ。谷の先まで連れていってくれ。';
    if(game.bells.solved)return '今、炉の灰がふっと舞った。祠の鐘を鳴らしてきたんだな。あの三つの響きが、谷の風をつなぎ直してくれた。';
    if(game.bells.started)return '西の三響の祠だ。鐘には鳥、雨、星のしるしがある。順番は、そばの碑文に残っているはずだよ。';
    return night?'眠れなくてな。道具を磨いていた。この炉も、昔は夜通し息をしていたんだ。西の祠の鐘が止まってから、風が入らなくなった。':'刃は打てる。でも、炉に入る風が足りない。西の三響の祠には、谷の風を呼ぶ鐘がある。順番は忘れられたが、碑文だけは残っているはずだ。';
  }
  if(game.crossingChoice==='haven')return night?'届けてくれた薬草のおかげで、今夜は静かだよ。眠れる人が増えた。次の荷が来たら、道の旅人にも分けよう。':'セナから薬草が届いたよ。霊薬に混ぜられる分もある。誰に届けるか考えてくれたこと、ちゃんと受け取ったからね。';
  if(game.crossingChoice==='road')return '橋の野営地に薬箱ができたんだってね。道で倒れる人が減れば、それも谷を守ることになる。村の分は、私が少しずつ摘んでくる。';
  if(game.ending)return '火が戻っても、傷が消えるわけじゃない。だから明日も薬草を摘むよ。あなたも、帰ってきたら顔を見せて。';
  return night?'夜は、眠れない人を見て回るんだ。傷を抱えたまま遠くへ行かないでね。':'露草は二つ合わせると、持ち運べる霊薬になる。飲み終わるまでは隙ができるから、敵から離れて使うんだよ。';
}
