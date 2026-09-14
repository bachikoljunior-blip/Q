import { gatheringGoal, gatheringSpeech } from './gatherings.js';
import { SALT_COURIER } from './world-regions.js';

// Original village routines and an optional, text-readable exploration puzzle.
export const RESIDENTS=[
  {id:'smith-ren',name:'鍛冶師レンと話す',label:'鍛冶師 レン',role:'smith',x:9,z:98},
  {id:'healer-io',name:'薬師イオと話す',label:'薬師 イオ',role:'healer',x:-8,z:89},
  {id:'patient-nagi',name:'凪と話す',label:'療養人 凪',role:'patient',branch:'haven',x:-3,z:77},
  {id:'porter-tou',name:'荷運びトウと話す',label:'荷運び トウ',role:'porter',branch:'haven',x:8,z:76},
  {id:'traveler-asa',name:'旅人アサと話す',label:'旅人 アサ',role:'traveler',branch:'road',x:148,z:38},
  {id:'scout-yuno',name:'斥候ユノと話す',label:'斥候 ユノ',role:'scout',branch:'road',x:142,z:41},
  SALT_COURIER,
];
export const ROAD_CACHE={id:'road-cache',name:'旅人の薬箱を使う',label:'旅人の薬箱',type:'cache',x:151,z:39};
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
export function residentActive(game,n){return n.role==='courier'?game.expedition.opened:!n.branch||game.crossingChoice===n.branch;}
export function routineFor(n,day){
  if(n.role==='courier')return SALT_COURIER.routines.find(r=>day<r.until)||SALT_COURIER.routines.at(-1);
  if(n.role==='smith'){
    if(day<.25)return{x:9,z:98,activity:'炉の手入れ'};
    if(day<.52)return{x:10,z:94,activity:'鍛錬'};
    if(day<.76)return{x:4,z:89,activity:'火を囲む'};
    return{x:10,z:97,activity:'道具を磨く'};
  }
  if(n.role==='healer'){
    if(day<.25)return{x:-8,z:89,activity:'薬草を選ぶ'};
    if(day<.52)return{x:-8,z:73,activity:'薬草を摘む'};
    if(day<.76)return{x:-5,z:86,activity:'薬を煎じる'};
    return{x:-10,z:89,activity:'夜の見回り'};
  }
  if(n.role==='patient')return day<.52?{x:-4,z:78,activity:'朝の歩行'}:day<.76?{x:0,z:87,activity:'灯火を眺める'}:{x:-7,z:82,activity:'薬師を手伝う'};
  if(n.role==='porter')return day<.3?{x:9,z:78,activity:'薬箱を運ぶ'}:day<.68?{x:-3,z:82,activity:'集落へ薬を配る'}:{x:5,z:89,activity:'明日の荷を結ぶ'};
  if(n.role==='traveler')return day<.3?{x:149,z:38,activity:'湯を沸かす'}:day<.7?{x:143,z:43,activity:'薬箱を見守る'}:{x:150,z:35,activity:'野営の火を守る'};
  return day<.3?{x:144,z:42,activity:'橋を見張る'}:day<.7?{x:137,z:31,activity:'橋の道を巡回'}:{x:146,z:40,activity:'旅人へ道を伝える'};
}
export function tickVillage(game,dt,groundAt){
  game.bells.cooldown=Math.max(0,game.bells.cooldown-dt);
  if(!game.bells.discovered&&distance(game.player,WIND_SHRINE)<26){
    game.bells.discovered=true;game.emit('discover',{place:{...WIND_SHRINE,name:WIND_SHRINE.label}});game.emit('save');
  }
  for(const n of game.residents){
    if(!residentActive(game,n)){n.moving=false;continue;}
    const gathering=gatheringGoal(game,n),afraid=game.threatened(n,13),goal=afraid?{x:0,z:86,activity:'火のそばへ避難'}:gathering||routineFor(n,game.day);
    const d=distance(n,goal),nearPlayer=distance(game.player,n)<3.7;
    n.activity=goal.activity;n.moving=false;
    if(d>.45&&(!nearPlayer||afraid||gathering)){
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
  const shared=gatheringSpeech(game,n);if(shared)return shared;
  const night=game.day>=.76;
  if(n.role==='courier'){
    if(game.ending==='release')return '北の空から、灰ではなく朝の色が降りてきた。開いた道を次の谷までつなぐよ。名のない荷でも、待つ人はいるから。';
    if(game.ending==='restore')return '王冠の火が戻ったなら、夜道の荷も動かせる。門を閉ざすためじゃない。帰れる場所を増やすために運ぶんだ。';
    if(game.expedition.reported)return night?'昼のうちに塩と水を二往復できた。今夜は伝言板に、次に通る人のための道順を足しておく。':'あの取っ手を戻してくれた人だね。見ての通り、石門を抜けて荷を運べる。迂回で一日かかった道が、今は谷までひと続きだ。';
    return '取っ手を戻したのは、あんたか。先に荷を通して轍を確かめる。谷側の伝言板に帰還の印を刻めば、他の運び手もこの道を使える。';
  }
  if(n.role==='smith'){
    if(game.bells.reported)return night?'昼に打った道具を磨く、この時間が好きなんだ。あんたが戻した風を、次の旅人の刃へ渡しておくよ。':'炉に風が通る。鉄が、前より素直に伸びるんだ。あの鈴は歩く人のためのものだ。谷の先まで連れていってくれ。';
    if(game.bells.solved)return '今、炉の灰がふっと舞った。祠の鐘を鳴らしてきたんだな。あの三つの響きが、谷の風をつなぎ直してくれた。';
    if(game.bells.started)return '西の三響の祠だ。鐘には鳥、雨、星のしるしがある。順番は、そばの碑文に残っているはずだよ。';
    return night?'眠れなくてな。道具を磨いていた。この炉も、昔は夜通し息をしていたんだ。西の祠の鐘が止まってから、風が入らなくなった。':'刃は打てる。でも、炉に入る風が足りない。西の三響の祠には、谷の風を呼ぶ鐘がある。順番は忘れられたが、碑文だけは残っているはずだ。';
  }
  if(n.role==='healer'){
    if(game.crossingChoice==='haven')return night?'届けてくれた薬草のおかげで、今夜は静かだよ。眠れる人が増えた。次の荷が来たら、道の旅人にも分けよう。':'セナから薬草が届いたよ。霊薬に混ぜられる分もある。誰に届けるか考えてくれたこと、ちゃんと受け取ったからね。';
    if(game.crossingChoice==='road')return '橋の野営地に薬箱ができたんだってね。道で倒れる人が減れば、それも谷を守ることになる。村の分は、私が少しずつ摘んでくる。';
  }
  if(n.role==='patient')return game.ending?'火が戻る朝を、自分の足で見られた。薬だけじゃない。帰ってくる人がいると信じられたから、立てたんだ。':night?'前は夜が来るたび、次の朝はないと思っていた。今は明日、薬師の籠を運ぶ約束がある。':'あなたが運んだ薬のおかげで、また歩ける。次は私が、熱のある人の水を運ぶ番だ。';
  if(n.role==='porter')return night?'空になった箱を結び直している。次の荷は、橋の野営地にも分けられるようにしたい。':'薬を家々へ運んでいる。誰に届いたかまで見届けて、初めて荷運びは終わるんだ。';
  if(n.role==='traveler')return game.ending?'北の空が明るくなった。薬箱を残したまま、次の谷へ道をつなぎに行くよ。':'この薬箱は誰の名前も書かない。必要な人が四本まで持っていける。遠慮は、元気になってから返せばいい。';
  if(n.role==='scout')return night?'火を絶やさない。夜の橋で、この灯りだけを目印に歩く人がいる。':'東岸の兵は戻っていない。橋の両側を見てきた。今なら旅人は安全に渡れる。';
  if(game.ending)return '火が戻っても、傷が消えるわけじゃない。だから明日も薬草を摘むよ。あなたも、帰ってきたら顔を見せて。';
  return night?'夜は、眠れない人を見て回るんだ。傷を抱えたまま遠くへ行かないでね。':'露草は二つ合わせると、持ち運べる霊薬になる。飲み終わるまでは隙ができるから、敵から離れて使うんだよ。';
}

export function useRoadCache(game){
  const p=game.player;
  if(game.crossingChoice!=='road'||!game.actionIdle()||game.threatened()||distance(p,ROAD_CACHE)>=3.2||!game.canReach(p,ROAD_CACHE))return false;
  if(p.potions>=4){game.notify('旅人の薬箱 — 霊薬は足りている');return false;}
  p.potions=4;game.notify('旅人の薬箱 — 霊薬を4本まで補充');game.emit('rest');game.emit('save');return true;
}
