export const WEAPONS = {
  sword: {name:'巡礼の剣',description:'素早い連撃。間合いと反撃の釣り合いがよい。',damage:1,cost:16,duration:.46,hitTime:.19,reach:3.5,arc:1.45,combo:[1,1.23,1.46]},
  spear: {name:'渡し守の槍',description:'遠くから正面を突く。横に回られたら距離を取り直す。',damage:.88,cost:18,duration:.58,hitTime:.23,reach:5.3,arc:.55,combo:[1,1.15,1.5]},
  greatsword: {name:'灰鉄の大剣',description:'振りは遅く、広く重い。大きな隙に踏み込む。',damage:1.7,cost:29,duration:.86,hitTime:.43,reach:4.3,arc:1.8,combo:[1,1.2,1.55]},
};

export const SENA = {id:'ferryman',x:155,z:31,type:'npc',name:'渡し守セナと話す'};
export const EAST_CAMP = {id:'east-camp',x:211,z:-42,name:'東岸の荷車',en:'THE STRANDED CARAVAN'};
export const SUPPLY_ID = 'loot-eastern-supplies';

export function crossingText(game) {
  if(game.crossingChoice==='haven')return '薬草は集落に届いた。ミラの霊薬は、以前より深く傷を癒す。';
  if(game.crossingChoice==='road')return '薬草は旅人の道へ渡った。灯火では霊薬を4本まで補充できる。';
  if(game.supplies)return '東岸の薬草の荷を、橋のたもとのセナへ届ける。';
  if(game.crossingStarted)return '橋を渡って東岸の荷車へ。荷を奪った兵を退け、薬草を取り戻す。';
  return '東の橋で、渡し守が帰らない荷車を待っている。';
}
