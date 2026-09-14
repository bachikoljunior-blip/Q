// Original authored scenes. The runtime owns movement, safety, choices and saving for every definition.
export const GATHERINGS=[{
  id:'hearth',title:'炉を囲む約束',require:{bellsReported:true},x:2,z:90,
  invitation:'戻った炉の火を、二人でどう使うか相談する',
  actors:[{id:'smith-ren',x:4,z:89},{id:'healer-io',x:0,z:89}],
  lines:[
    {actor:'smith-ren',speaker:'鍛冶師 レン',text:'風が戻った炉で、最初に何を作るか迷っていた。刃を打つつもりだったが、イオの鍋も底が抜けていてな。'},
    {actor:'healer-io',speaker:'薬師 イオ',text:'鍋は直してもらった。今度は、村の外で傷つく人にもこの火を分けたい。持ち歩ける薬か、帰り道の道具か。'},
    {actor:'smith-ren',speaker:'鍛冶師 レン',text:'どちらから始めよう。道を歩いてきたあんたの話を聞かせてくれ。'},
  ],
  choices:[
    {id:'medicine',label:'共同の薬棚を作る',detail:'イオの露草を4個受け取る',reward:{herbs:4,ash:0},prop:'herbs',result:'炉のそばに薬棚を作り、旅へ持ち出す露草を分けてもらった。',responses:{'smith-ren':'鍋と薬棚を直した。今度の火は、傷を塞ぐために使う。','healer-io':'棚に名前は書かないよ。戻ったら、使った分の話を聞かせて。次に必要な薬が分かるから。'}},
    {id:'tools',label:'旅人の道具を修理する',detail:'修理を手伝った礼として灰80を受け取る',reward:{herbs:0,ash:80},prop:'lantern',result:'炉のそばに修理台を作った。レンは旅人の道具を引き受ける。',responses:{'smith-ren':'刃だけじゃない。靴の留め具、灯りの柄。帰るまで壊れちゃ困る道具を直す。','healer-io':'壊れた道具で無理をして、怪我をする人も多いんだ。これも、傷を減らす仕事だね。'}},
  ],
},{
  id:'road-watch',title:'夜道の目印',require:{crossingChoice:'road'},x:145,z:38,
  invitation:'街道の二人と、夜の旅人を迎える準備をする',
  actors:[{id:'traveler-asa',x:143,z:39},{id:'scout-yuno',x:147,z:39}],
  lines:[
    {actor:'traveler-asa',speaker:'旅人 アサ',text:'昨夜、灯りを見失った親子を連れてきた。ここが見える距離でも、灰が舞うと道の縁が消える。'},
    {actor:'scout-yuno',speaker:'斥候 ユノ',text:'着いたときには子どもの足が冷えきっていたよ。渡してくれた薬草で温めたけれど、辿り着けない人もいるんだろうね。'},
    {actor:'traveler-asa',speaker:'旅人 アサ',text:'残った木材で高い灯りを立てるか、途中に休める場所を作るか。実際に歩いた君なら、どちらを先にする？'},
  ],
  choices:[
    {id:'light',label:'高い目印の灯りを立てる',detail:'設営を手伝った礼として灰80を受け取る',reward:{herbs:0,ash:80},prop:'lantern',result:'野営地のそばに高い灯りが立った。アサは夜ごと灰を払いに来る。',responses:{'traveler-asa':'灯りの下を、落ち合う場所にした。帰ってこない足音があれば、そこから探せる。','scout-yuno':'鍋を下ろす前に、あの灯りを見て待つことにしたよ。もう一人、辿り着くかもしれないから。'}},
    {id:'rest',label:'道端に手当ての棚を作る',detail:'補充用の露草4個を分けてもらう',reward:{herbs:4,ash:0},prop:'herbs',result:'野営地のそばに手当ての棚を作った。ユノが薬草と布を補充する。',responses:{'traveler-asa':'足を止められる場所ができた。急げと言うだけでは、渡れない道もあるんだな。','scout-yuno':'棚に置いた布が減っていたよ。顔は知らないけれど、誰かが続きを歩けたんだと思う。'}},
  ],
}];
