import { moveCircle } from './spatial.js';
import { routineFor } from './village.js';

const finite=(value,fallback,min,max)=>Number.isFinite(value)?Math.max(min,Math.min(max,value)):fallback;
const playerTimers={attack:1,comboWindow:2,dodge:.42,parry:.48,invulnerable:2,skillCooldown:4,staminaDelay:1,healTimer:.9};
const enemyStates=new Set(['idle','chase','windup','strike','recover','stagger','return','sealed']);
const pick=(object,keys)=>Object.fromEntries(keys.map(key=>[key,object[key]]));

export function captureRuntime(game){
  return {
    version:1,time:game.time,
    player:pick(game.player,['y','vertical','grounded','stamina','energy','combo','healDone',...Object.keys(playerTimers)]),
    attackHit:game.attackHit===true,dodgeDir:game.dodgeDir?{...game.dodgeDir}:null,locked:game.locked,
    enemies:game.enemies.filter(e=>!e.dead).map(e=>({...pick(e,['id','x','z','angle','hp','state','timer','cooldown','poise','attackCount','radial','hit','windupMax','stagger']),aim:e.aim?{...e.aim}:null})),
    projectiles:game.projectiles.map(a=>({...a})),
    residents:game.residents.map(n=>pick(n,['id','x','z','angle'])),
  };
}

// Optional v1 extension: older saves without it keep the original safe defaults.
export function restoreRuntime(game,runtime,groundAt){
  if(!runtime||runtime.version!==1||!runtime.player||typeof runtime.player!=='object'||Array.isArray(runtime.player))return false;
  const p=game.player,source=runtime.player;
  game.time=finite(runtime.time,0,0,31536000);
  p.stamina=finite(source.stamina,100,0,100);p.energy=finite(source.energy,100,0,100);
  for(const [key,max] of Object.entries(playerTimers))p[key]=finite(source[key],0,0,max);
  p.attack=Math.min(p.attack,game.weaponStats().duration);p.attackDuration=game.weaponStats().duration;
  p.combo=Math.floor(finite(source.combo,0,0,2));p.healDone=source.healDone===true;
  const floor=groundAt(p.x,p.z);p.y=finite(source.y,floor,floor,floor+60);
  p.grounded=source.grounded!==false&&p.y<=floor+.02;
  p.vertical=p.grounded?0:finite(source.vertical,0,-60,8);if(p.grounded)p.y=floor;
  game.attackHit=runtime.attackHit===true;
  const dir=runtime.dodgeDir,x=finite(dir?.x,Math.sin(p.angle),-1,1),z=finite(dir?.z,Math.cos(p.angle),-1,1),length=Math.hypot(x,z);
  game.dodgeDir=length>.1?{x:x/length,z:z/length}:{x:Math.sin(p.angle),z:Math.cos(p.angle)};game.pendingAction=null;

  const byId=new Map();
  for(const saved of (Array.isArray(runtime.enemies)?runtime.enemies:[]).slice(0,game.enemies.length)){
    if(saved&&typeof saved.id==='string'&&!byId.has(saved.id))byId.set(saved.id,saved);
  }
  for(const enemy of game.enemies){
    const saved=byId.get(enemy.id);if(enemy.dead||!saved)continue;
    enemy.x=finite(saved.x,enemy.homeX,Math.max(-280,enemy.homeX-50),Math.min(280,enemy.homeX+50));
    enemy.z=finite(saved.z,enemy.homeZ,Math.max(-282,enemy.homeZ-50),Math.min(220,enemy.homeZ+50));
    moveCircle(enemy,0,0,game.obstacles,enemy.type==='boss'?1.2:.48);enemy.y=groundAt(enemy.x,enemy.z);
    enemy.angle=finite(saved.angle,enemy.angle,-1e7,1e7);enemy.hp=finite(saved.hp,enemy.maxHp,1,enemy.maxHp);
    enemy.state=enemyStates.has(saved.state)?saved.state:'idle';
    if(enemy.state==='sealed'&&(enemy.type!=='boss'||game.lit.length>=4))enemy.state='idle';
    enemy.timer=finite(saved.timer,0,0,5);enemy.cooldown=finite(saved.cooldown,0,0,5);
    enemy.poise=finite(saved.poise,180,0,180);enemy.attackCount=Math.floor(finite(saved.attackCount,0,0,1e7));
    enemy.radial=enemy.type==='boss'&&saved.radial===true;enemy.hit=saved.hit===true;
    enemy.windupMax=finite(saved.windupMax,1,.01,5);enemy.stagger=finite(saved.stagger,0,0,3);
    if(saved.aim&&['x','y','z'].every(k=>Number.isFinite(saved.aim[k]))&&Math.abs(saved.aim.x)<=340&&Math.abs(saved.aim.z)<=340&&Math.abs(saved.aim.y)<=200)enemy.aim={...pick(saved.aim,['x','y','z'])};
    else if(enemy.type==='ranger'&&['windup','strike'].includes(enemy.state)){enemy.state='recover';enemy.timer=.5;}
    enemy.route=null;enemy.avoid=null;
  }
  game.locked=game.enemies.some(e=>e.id===runtime.locked&&!e.dead)?runtime.locked:null;
  const residents=Array.isArray(runtime.residents)?runtime.residents.slice(0,game.residents.length):[];
  for(const n of game.residents){
    const saved=residents.find(v=>v&&v.id===n.id);if(!saved)continue;
    n.x=finite(saved.x,n.homeX,-12,12);n.z=finite(saved.z,n.homeZ,70,101);
    moveCircle(n,0,0,game.obstacles,.48);n.y=groundAt(n.x,n.z);
    n.angle=finite(saved.angle,0,-1e7,1e7);n.activity=routineFor(n,game.day).activity;n.route=null;n.moving=false;
  }
  game.projectiles=[];game.projectileId=0;
  for(const saved of (Array.isArray(runtime.projectiles)?runtime.projectiles:[]).slice(0,48)){
    if(!saved||!['x','y','z','vx','vy','vz','life','damage'].every(k=>Number.isFinite(saved[k])))continue;
    if(saved.owner!=='player'&&!game.enemies.some(e=>e.id===saved.owner))continue;
    const speed=Math.hypot(saved.vx,saved.vy,saved.vz);
    if(speed<.1||speed>35||Math.abs(saved.x)>340||saved.z< -340||saved.z>280||Math.abs(saved.y)>200||saved.life<=0)continue;
    game.projectiles.push({...pick(saved,['x','y','z','vx','vy','vz','owner']),id:++game.projectileId,life:Math.min(2.3,saved.life),damage:finite(saved.damage,20,0,500)});
  }
  return true;
}
