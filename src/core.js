// Deterministic world and combat simulation. No DOM or rendering dependencies.
export const WORLD_SEED = 87123;
export const SAVE_VERSION = 1;
export const TAU = Math.PI * 2;
export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
export const angleDelta = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
export function random(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export const PLACES = [
  { id:'haven', name:'風待ちの集落', en:'WINDFALL HAVEN', x:0, z:86, type:'camp' },
  { id:'grove', name:'琥珀の森', en:'AMBER GROVE', x:-104, z:2, type:'beacon' },
  { id:'flood', name:'沈黙の水殿', en:'THE DROWNED SANCTUM', x:106, z:-83, type:'beacon' },
  { id:'ruins', name:'星読みの廃塔', en:'ASTRAL WATCH', x:-48, z:-167, type:'beacon' },
  { id:'crown', name:'灰冠の門', en:'THE CINDER CROWN', x:4, z:-247, type:'boss' },
];
export function heightAt(x, z) {
  let h = Math.sin(x * .023) * 5 + Math.cos(z * .021) * 4 + Math.sin((x + z) * .045) * 2 + Math.sin(x * .081) * Math.cos(z * .066) * .8;
  h += Math.max(0, Math.abs(x) - 190) * .26;
  h += Math.max(0, -z - 190) * .14;
  for (const p of PLACES) { const d = Math.hypot(x-p.x,z-p.z); if(d<24) { const level = p.type==='boss'?12:p.id==='ruins'?8:p.id==='flood'?1:3; h = h * Math.min(1,d/24) + level*(1-Math.min(1,d/24)); } }
  return h;
}
export const riverX = z => 166 + Math.sin(z*.017)*23;
export const inWater = (x,z) => Math.abs(x-riverX(z))<9 && z>-205 && z<220;
export function makeWorld() {
  const rng=random(WORLD_SEED), enemies=[], pickups=[], obstacles=[];
  const spawn=(x,z,type='knight')=>{ const boss=type==='boss',wolf=type==='wolf'; enemies.push({id:`enemy-${enemies.length}`,x,z,homeX:x,homeZ:z,y:heightAt(x,z),angle:rng()*TAU,type,hp:boss?640:wolf?64:105,maxHp:boss?640:wolf?64:105,state:'idle',timer:rng()*2,cooldown:1,attackCount:0,hit:false,stagger:0,dead:false}); };
  spawn(2,47,'wolf');spawn(-10,26,'knight');spawn(34,16,'wolf');spawn(-48,36,'wolf');
  for(const p of PLACES.filter(p=>p.type==='beacon')) { spawn(p.x+8,p.z+5);spawn(p.x-6,p.z-9,'wolf'); }
  for(let i=0;i<16;i++) { const x=(rng()-.5)*345,z=20-rng()*230; if(PLACES.some(p=>distance({x,z},p)<30)||inWater(x,z))continue;spawn(x,z,i%3?'wolf':'knight'); }
  spawn(4,-247,'boss');
  const fixed=[[-20,75,'herb'],[18,61,'herb'],[-44,62,'chest'],[-131,13,'chest'],[90,-111,'chest'],[-70,-188,'chest'],[64,24,'relic']];
  for(const [x,z,type] of fixed) pickups.push({id:`loot-${pickups.length}`,x,z,type,taken:false});
  for(let i=0;i<56;i++) { const x=(rng()-.5)*370,z=125-rng()*350;if(!inWater(x,z))pickups.push({id:`loot-${pickups.length}`,x,z,type:i%9===0?'chest':'herb',taken:false}); }
  // Buildings and major rocks share colliders with the renderer.
  for(const b of [{x:15,z:91,r:4},{x:-16,z:82,r:4},{x:20,z:71,r:4},{x:-17,z:105,r:4}])obstacles.push({...b,type:'house'});
  for(let i=0;i<85;i++){const x=(rng()-.5)*450,z=145-rng()*440,r=1+rng()*2.5;if(PLACES.some(p=>distance({x,z},p)<26)||Math.abs(x)<10||inWater(x,z))continue;obstacles.push({x,z,r,type:'rock'});}
  return {enemies,pickups,obstacles};
}
export class Game {
  constructor(save=null) {
    Object.assign(this,makeWorld());
    this.player={x:0,z:101,y:heightAt(0,101),angle:Math.PI,hp:120,maxHp:120,stamina:100,energy:100,level:1,xp:0,ash:0,herbs:0,potions:3,weapon:0,vigor:0,agility:0,attack:0,combo:0,comboWindow:0,dodge:0,parry:0,invulnerable:0,skillCooldown:0,staminaDelay:0,vertical:0,grounded:true,dead:false};
    this.time=0;this.day=.16;this.events=[];this.lit=['haven'];this.discovered=['haven'];this.talked=false;this.bossDefeated=false;this.ending=null;this.checkpoint='haven';this.relic=false;this.assist=false;this.locked=null;
    if(save) this.restore(save);
  }
  emit(type,data={}) { this.events.push({type,...data}); }
  notify(text){this.emit('notice',{text});}
  damageAmount(){return 26+this.player.weapon*8+(this.player.level-1)*2;}
  xpNeeded(){return 60+this.player.level*35;}
  reward(ash,xp){const p=this.player;p.ash+=ash;p.xp+=xp;while(p.xp>=this.xpNeeded()){p.xp-=this.xpNeeded();p.level++;p.maxHp+=12;p.hp=p.maxHp;this.notify(`巡礼者 Lv.${p.level} — 生命力が増した`);this.emit('level');}}
  move(dx,dz) {
    const p=this.player,oldX=p.x,oldZ=p.z;p.x=clamp(p.x+dx,-280,280);p.z=clamp(p.z+dz,-282,220);
    for(const o of this.obstacles){const d=distance(p,o),r=o.r+.48;if(d<r){const nx=d>.001?(p.x-o.x)/d:1,nz=d>.001?(p.z-o.z)/d:0;p.x=o.x+nx*r;p.z=o.z+nz*r;}}
    if(heightAt(p.x,p.z)-heightAt(oldX,oldZ)>1.2&&p.grounded){p.x=oldX;p.z=oldZ;}
  }
  attack() {
    const p=this.player;if(p.dead||p.dodge>0||p.attack>0||p.stamina<16)return false;
    p.combo=p.comboWindow>0?(p.combo+1)%3:0;p.comboWindow=1;p.attack=.46;p.stamina-=16;p.staminaDelay=.65;p.parry=0;this.attackHit=false;
    const target=this.enemies.filter(e=>!e.dead&&distance(p,e)<5).sort((a,b)=>distance(p,a)-distance(p,b))[0];
    if(target)p.angle=Math.atan2(target.x-p.x,target.z-p.z);
    this.emit('swing',{combo:p.combo});return true;
  }
  dodge(dx=0,dz=0) {const p=this.player;if(p.dead||p.dodge>0||p.stamina<25)return false;p.dodge=.42;p.invulnerable=.32;p.stamina-=25;p.staminaDelay=.8;p.attack=0;p.parry=0;const m=Math.hypot(dx,dz);this.dodgeDir=m>.1?{x:dx/m,z:dz/m}:{x:Math.sin(p.angle),z:Math.cos(p.angle)};this.emit('dodge');return true;}
  parry() {const p=this.player;if(p.dead||p.dodge>0||p.attack>0||p.parry>0||p.stamina<18)return false;p.parry=.48;p.stamina-=18;p.staminaDelay=.5;this.emit('parry');return true;}
  jump(){const p=this.player;if(p.dead||!p.grounded||p.stamina<8)return false;p.vertical=7.5;p.grounded=false;p.stamina-=8;return true;}
  skill(){const p=this.player;if(p.dead||p.energy<40||p.skillCooldown>0)return false;p.energy-=40;p.skillCooldown=4;p.attack=0;this.emit('skill',{x:p.x,z:p.z});for(const e of this.enemies)if(!e.dead&&distance(e,p)<9)this.hurtEnemy(e,this.damageAmount()*1.7,1.1);return true;}
  heal(){const p=this.player;if(p.dead||p.potions<=0||p.hp===p.maxHp)return false;p.potions--;p.hp=Math.min(p.maxHp,p.hp+65+p.vigor*10);this.emit('heal');this.notify('露の霊薬 — 生命力を回復');return true;}
  hurtEnemy(e,amount,stagger=.35) {if(e.dead)return;e.hp=Math.max(0,e.hp-amount);if(e.type==='boss'&&stagger<1.5){e.poise=(e.poise??180)-amount*.55;if(e.poise<=0){stagger=1.3;e.poise=180;}else stagger=0;}if(stagger>0){e.stagger=stagger;e.state='stagger';e.timer=stagger;}this.emit('hit',{id:e.id,x:e.x,z:e.z,amount:Math.round(amount)});if(e.hp<=0){e.dead=true;e.state='dead';this.reward(e.type==='boss'?220:e.type==='knight'?28:15,e.type==='boss'?220:28);this.emit('kill',{id:e.id,x:e.x,z:e.z});if(this.locked===e.id)this.locked=null;if(e.type==='boss'){this.bossDefeated=true;this.notify('灰冠の番人を倒した — 王冠の火を調べる');this.emit('save');}}}
  hurtPlayer(amount,enemy) {
    const p=this.player;if(p.dead||p.invulnerable>0)return 'evade';
    if(p.parry>.19&&enemy&&Math.abs(angleDelta(Math.atan2(enemy.x-p.x,enemy.z-p.z),p.angle))<1.7){this.hurtEnemy(enemy,this.damageAmount()*.7,1.6);p.energy=Math.min(100,p.energy+22);p.stamina=Math.min(100,p.stamina+20);this.emit('perfect');this.notify('受け流し成功');return 'parry';}
    amount*=this.assist?.55:1;p.hp=Math.max(0,p.hp-amount);p.invulnerable=.55;p.attack=0;this.emit('hurt',{amount});if(p.hp<=0){p.dead=true;p.ash=Math.floor(p.ash*.8);this.emit('death');}return 'hit';
  }
  tick(dt,input={}) {
    if(this.player.dead)return;dt=clamp(dt,0,.05);const p=this.player;this.time+=dt;this.day=(this.day+dt/720)%1;
    for(const key of ['attack','comboWindow','dodge','parry','invulnerable','skillCooldown','staminaDelay'])p[key]=Math.max(0,p[key]-dt);
    if(p.attack>0&&!this.attackHit&&p.attack<.27){this.attackHit=true;for(const e of this.enemies) {if(e.dead||distance(e,p)>(e.type==='boss'?4.9:3.5))continue;const angle=Math.atan2(e.x-p.x,e.z-p.z);if(Math.abs(angleDelta(angle,p.angle))<1.45)this.hurtEnemy(e,this.damageAmount()*(1+p.combo*.23));}}
    let dx=input.x||0,dz=input.z||0;const len=Math.hypot(dx,dz);if(len>1){dx/=len;dz/=len;}
    let speed=6.6+p.agility*.35;if(inWater(p.x,p.z))speed*=.52;
    if(input.sprint&&len>.1&&p.stamina>1){speed*=1.55;p.stamina=Math.max(0,p.stamina-17*dt);p.staminaDelay=.3;}
    if(p.dodge>0){this.move(this.dodgeDir.x*16*dt,this.dodgeDir.z*16*dt);}else{if(p.attack>0||p.parry>0)speed*=.28;this.move(dx*speed*dt,dz*speed*dt);if(len>.1)p.angle+=angleDelta(Math.atan2(dx,dz),p.angle)*Math.min(1,dt*16);}
    const floor=heightAt(p.x,p.z);if(!p.grounded){p.vertical-=21*dt;p.y+=p.vertical*dt;if(p.y<=floor){p.y=floor;p.grounded=true;p.vertical=0;}}else p.y=floor;
    p.moving=len>.1||p.dodge>0;
    if(p.staminaDelay<=0)p.stamina=Math.min(100,p.stamina+(29+p.agility*2)*dt);
    p.energy=Math.min(100,p.energy+3.5*dt);
    for(const place of PLACES)if(distance(p,place)<30&&!this.discovered.includes(place.id)){this.discovered.push(place.id);this.emit('discover',{place});this.reward(15,25);this.emit('save');}
    const lock=this.enemies.find(e=>e.id===this.locked&&!e.dead);if(lock&&distance(p,lock)<26){p.angle=Math.atan2(lock.x-p.x,lock.z-p.z);}else this.locked=null;
    for(const e of this.enemies)this.tickEnemy(e,dt);
  }
  tickEnemy(e,dt) {
    if(e.dead)return;const p=this.player,d=distance(e,p),boss=e.type==='boss',wolf=e.type==='wolf';e.timer-=dt;e.cooldown-=dt;
    if(boss&&this.lit.length<4){e.state='sealed';return;}
    if(e.state==='sealed')e.state='idle';
    if(e.state==='stagger'){if(e.timer<=0){e.state='recover';e.timer=.45;}return;}
    if(e.state==='windup'){
      if(e.timer<=0){e.state='strike';e.timer=.22;e.hit=false;this.emit('enemySwing',{id:e.id});}return;
    }
    if(e.state==='strike'){
      if(!e.hit){e.hit=true;const range=boss?(e.radial?9:6.5):wolf?2.5:3.3;const facing=Math.abs(angleDelta(Math.atan2(p.x-e.x,p.z-e.z),e.angle));if(d<range&&(e.radial||facing<1.5)&&(!e.radial||p.grounded))this.hurtPlayer(boss?34:wolf?14:22,e);}
      if(e.timer<=0&&e.state==='strike'){e.state='recover';e.timer=boss?.85:wolf?.9:1.1;}return;
    }
    if(e.state==='recover'){if(e.timer<=0){e.state='chase';e.cooldown=.35;}return;}
    const aggro=boss?28:wolf?16:18;
    if(d<aggro&&distance(e,{x:e.homeX,z:e.homeZ})<38){e.state='chase';e.angle+=angleDelta(Math.atan2(p.x-e.x,p.z-e.z),e.angle)*Math.min(1,dt*8);const reach=boss?4.7:wolf?1.9:2.8;
      if(d>reach){let speed=boss?2.8:wolf?4.6:3.1;if(boss&&e.hp<e.maxHp*.5)speed*=1.25;e.x+=Math.sin(e.angle)*speed*dt;e.z+=Math.cos(e.angle)*speed*dt;}
      else if(e.cooldown<=0){e.state='windup';e.timer=boss?(e.hp<e.maxHp*.5?.72:1.1):wolf?.62:.85;e.attackCount++;e.radial=boss&&e.attackCount%3===0;if(e.radial){e.timer=1.35;this.emit('warning',{text:'衝撃波 — 跳んでかわす'});}e.windupMax=e.timer;}
    }else{const home={x:e.homeX,z:e.homeZ};if(distance(e,home)>2){e.state='return';e.angle=Math.atan2(home.x-e.x,home.z-e.z);e.x+=Math.sin(e.angle)*2.6*dt;e.z+=Math.cos(e.angle)*2.6*dt;}else {e.state='idle';e.angle+=Math.sin(this.time*.4+e.homeX)*dt*.12;}}
    e.y=heightAt(e.x,e.z);
  }
  nearestInteract(){
    const p=this.player,candidates=[];
    const npc={id:'keeper',x:7,z:80,type:'npc',name:'灯守ミラと話す'};if(distance(p,npc)<4.7)candidates.push(npc);
    for(const s of PLACES){if(distance(p,s)<5.5)candidates.push({...s,name:s.type==='boss'?(this.bossDefeated?'王冠の火に触れる':'封印を調べる'):this.lit.includes(s.id)?`${s.name}で休む`:'灯火をともす'});}
    for(const l of this.pickups)if(!l.taken&&distance(p,l)<3.2)candidates.push({...l,name:l.type==='herb'?'露草を摘む':l.type==='relic'?'巡礼の遺物を拾う':'宝箱を開ける'});
    return candidates.sort((a,b)=>distance(p,a)-distance(p,b))[0]||null;
  }
  interact(target=this.nearestInteract()) {
    if(!target||this.player.dead)return;const p=this.player;
    if(target.type==='npc'){this.talked=true;this.emit('dialogue');return;}
    if(['herb','chest','relic'].includes(target.type)){const item=this.pickups.find(l=>l.id===target.id);if(!item||item.taken)return;item.taken=true;if(item.type==='herb'){p.herbs++;this.notify(`露草 ×1（所持 ${p.herbs}）`);}else if(item.type==='relic'){this.relic=true;this.reward(45,60);this.notify('巡礼の遺物 — ミラへ届けよう');}else{this.reward(45,35);p.herbs+=2;this.notify('灰の欠片 +45 · 露草 +2');}this.emit('loot',{x:item.x,z:item.z});this.emit('save');return;}
    if(target.type==='boss'){if(this.bossDefeated&&!this.ending)this.emit('endingChoice');else this.notify(this.ending?'谷には新しい風が吹いている':this.lit.length<4?`三つの灯火をともすと封印が解ける（${this.lit.length-1}/3）`:'灰冠の番人があなたを待っている');return;}
    if(!this.lit.includes(target.id)){const guardians=this.enemies.filter(e=>!e.dead&&distance(e,target)<15);if(guardians.length){this.notify('火に近づく影を退けよう');return;}this.lit.push(target.id);this.reward(70,70);this.notify(`${target.name}に火が戻った（${this.lit.length-1}/3）`);this.emit('beacon',{id:target.id});}
    this.checkpoint=target.id;p.hp=p.maxHp;p.stamina=100;p.energy=100;p.potions=3;this.notify('灯火で休息 — 生命力と霊薬が回復');this.emit('rest');this.emit('save');
  }
  craft(){const p=this.player;if(p.herbs<2){this.notify('露草が2個必要');return false;}if(p.potions>=6){this.notify('霊薬は6本まで持てる');return false;}p.herbs-=2;p.potions++;this.notify('露の霊薬を調合した');this.emit('save');return true;}
  upgrade(kind){const p=this.player;if(!['weapon','vigor','agility'].includes(kind))return false;const cost=60+p[kind]*45;if(p[kind]>=5||p.ash<cost)return false;p.ash-=cost;p[kind]++;if(kind==='vigor'){p.maxHp+=20;p.hp=p.maxHp;}this.emit('save');return true;}
  fastTravel(id){if(!this.lit.includes(id))return false;if(this.enemies.some(e=>!e.dead&&e.state!=='sealed'&&distance(e,this.player)<18)){this.notify('敵が近くにいるため移動できない');return false;}const place=PLACES.find(p=>p.id===id);this.player.x=place.x;this.player.z=place.z+5;this.player.y=heightAt(this.player.x,this.player.z);this.checkpoint=id;this.emit('travel',{place});this.emit('save');return true;}
  respawn(){const p=this.player,s=PLACES.find(s=>s.id===this.checkpoint)||PLACES[0];p.x=s.x;p.z=s.z+7;p.y=heightAt(p.x,p.z);p.hp=p.maxHp;p.stamina=100;p.energy=100;p.potions=3;p.dead=false;p.attack=0;p.dodge=0;p.invulnerable=2;p.vertical=0;p.grounded=true;this.locked=null;for(const e of this.enemies){if(!e.dead){e.x=e.homeX;e.z=e.homeZ;e.hp=e.maxHp;e.poise=180;e.state='idle';e.timer=0;e.cooldown=1;}}this.emit('save');}
  chooseEnding(choice){if(!this.bossDefeated||this.ending||!['restore','release'].includes(choice))return false;this.ending=choice;this.reward(200,120);this.emit('ending',{choice});this.emit('save');return true;}
  quest(){if(this.ending)return{title:'風のつづきを歩く',text:'残された宝箱と遺物を探す',target:null};if(this.bossDefeated)return{title:'火の行く先',text:'王冠の火に触れ、谷の未来を選ぶ',target:PLACES[4]};if(this.lit.length===4)return{title:'灰冠の番人',text:'北の門へ。番人を倒して火を取り戻す',target:PLACES[4]};if(!this.talked)return{title:'消えた火をたどって',text:'集落の灯守ミラと話す',target:{x:7,z:80}};return{title:'三つの残り火',text:`谷の灯火をともす ${this.lit.length-1} / 3`,target:PLACES.filter(s=>s.type==='beacon'&&!this.lit.includes(s.id)).sort((a,b)=>distance(this.player,a)-distance(this.player,b))[0]};}
  serialize(){const p=this.player;return{version:SAVE_VERSION,dead:p.dead,player:Object.fromEntries(['x','z','angle','hp','level','xp','ash','herbs','potions','weapon','vigor','agility'].map(k=>[k,p[k]])),day:this.day,lit:[...this.lit],discovered:[...this.discovered],talked:this.talked,bossDefeated:this.bossDefeated,ending:this.ending,checkpoint:this.checkpoint,relic:this.relic,taken:this.pickups.filter(l=>l.taken).map(l=>l.id),defeated:this.enemies.filter(e=>e.dead).map(e=>e.id)};}
  restore(s){
    if(!s||s.version!==SAVE_VERSION||!s.player||typeof s.player!=='object')return false;
    const p=this.player,v=s.player;for(const k of ['weapon','vigor','agility'])p[k]=clamp(Math.floor(Number(v[k])||0),0,5);
    p.level=clamp(Math.floor(Number(v.level)||1),1,99);p.maxHp=120+(p.level-1)*12+p.vigor*20;
    for(const k of ['ash','xp','herbs'])p[k]=clamp(Number(v[k])||0,0,100000);p.potions=clamp(Math.floor(Number(v.potions)||0),0,6);
    p.x=clamp(Number.isFinite(v.x)?v.x:0,-280,280);p.z=clamp(Number.isFinite(v.z)?v.z:101,-282,220);p.y=heightAt(p.x,p.z);p.hp=clamp(Number(v.hp)||p.maxHp,1,p.maxHp);p.angle=Number.isFinite(v.angle)?v.angle:Math.PI;
    const ids=PLACES.filter(s=>s.type!=='boss').map(s=>s.id);this.lit=[...new Set(['haven',...(Array.isArray(s.lit)?s.lit:[]).filter(id=>ids.includes(id))])];
    this.discovered=[...new Set(['haven',...(Array.isArray(s.discovered)?s.discovered:[]).filter(id=>PLACES.some(p=>p.id===id))])];this.checkpoint=this.lit.includes(s.checkpoint)?s.checkpoint:'haven';
    this.talked=!!s.talked;this.bossDefeated=!!s.bossDefeated;this.ending=this.bossDefeated&&['restore','release'].includes(s.ending)?s.ending:null;this.relic=!!s.relic;this.day=Number.isFinite(s.day)?clamp(s.day,0,1):.16;
    for(const l of this.pickups)l.taken=Array.isArray(s.taken)&&s.taken.includes(l.id);for(const e of this.enemies){e.dead=(Array.isArray(s.defeated)&&s.defeated.includes(e.id))||(e.type==='boss'&&this.bossDefeated);if(e.dead)e.hp=0;}if(s.dead===true)this.respawn();return true;
  }
}
