// Behavioral oracle: actual Game ticks and production HUD handlers, with a minimal text sink.
// Laboratory fixtures; no browser, touch, audio, physical-device or player-quality observation.
import * as core from '../src/core.js';
import * as combat from '../src/combat-presentation.js';
import {readFileSync} from 'node:fs';
const compare=(get,mainSource)=>{
 const {Game,groundAt,PLACES,distance,angleDelta,clamp,heightAt}=get("src/core.js");
 const presentation=get("src/combat-presentation.js");
 function setup(kind){
  const game=new Game();game.enemies.forEach(e=>e.dead=true);game.obstacles=[];game.lit=['haven','grove','flood','ruins'];game.discovered=PLACES.map(p=>p.id);
  Object.assign(game.player,{x:0,z:86,y:groundAt(0,86),hp:120,angle:Math.PI});game.events=[];
  const enemy=game.enemies.find(e=>e.type==='knight');
  if(kind.startsWith('melee')||kind==='hud'){
   const d=kind==='melee-out-of-range'?4.5:2.6;
   Object.assign(enemy,{dead:false,x:0,z:86+d,homeX:0,homeZ:86+d,y:groundAt(0,86+d),state:kind==='hud'?'windup':'strike',timer:kind==='hud'?.1:.22,cooldown:0,angle:kind==='melee-away'?0:Math.PI,hit:false});
  }else if(kind.startsWith('arrow')){
   game.projectiles=[{id:1,owner:enemy.id,x:-5,z:86,y:game.player.y+(kind==='arrow-overhead'?7:1),vx:19,vy:0,vz:0,life:2,damage:20}];
   if(kind==='arrow-cover')game.obstacles=[{x:-2,z:86,r:.5,height:6}];
  }else if(kind.startsWith('bow')){
   const ranger=game.enemies.find(e=>e.type==='ranger');
   Object.assign(ranger,{dead:false,x:-10,z:86,homeX:-10,homeZ:86,y:groundAt(-10,86),state:'windup',timer:.3,windupMax:1.15,cooldown:0,angle:Math.PI/2,hit:false,aim:{x:0,z:kind==='bow-miss'?90:86,y:game.player.y+1.05}});
  }
  if(kind==='hud'){
   const boss=game.enemies.find(e=>e.type==='boss');Object.assign(boss,{dead:false,x:0,z:81.4,homeX:0,homeZ:81.4,y:groundAt(0,81.4),state:'chase',timer:0,cooldown:0,angle:0,attackCount:2});
   game.tickEnemy(boss,1/60);
  }
  return {game,enemy};
 }
 const results=[];
 for(const kind of ['melee-hit','melee-away','melee-out-of-range','arrow-hit','arrow-overhead','arrow-cover','bow-hit','bow-miss']){
  const {game}=setup(kind),snapshot=JSON.stringify(game.serialize()),warning=presentation.combatPresentation(game);
  if(snapshot!==JSON.stringify(game.serialize()))throw Error("Prediction mutated game "+kind);
  let firstHurt=null;
  for(let f=0;f<65;f++){game.tick(1/60);if(firstHurt===null&&game.events.some(e=>e.type==='hurt'))firstHurt=(f+1)/60;game.events=[];}
  results.push({id:kind,warning:warning.active,predictedTime:warning.primary?.timeToImpact??null,hp:game.player.hp,firstHurt,matchesContact:warning.active===(firstHurt!==null)});
 }
 const {game,enemy}=setup('hud'),nodes=new Map();
 function node(){return {style:{setProperty(){}},classList:{toggle(){},add(){},remove(){}},setAttribute(){},querySelector(){return node()},append(){},textContent:''};}
 const $=id=>{if(!nodes.has(id))nodes.set(id,node());return nodes.get(id)};
 const scope={game,$,...presentation,warningTimer:0,audio:{play(){}},view:{yaw:0,project:()=>({visible:false,x:0,y:0}),effect(){}},PLACES,distance,angleDelta,clamp,heightAt,actorGatheringCue:()=>null,regionAt:()=>null,WIND_BELLS:[],SALT_JOURNEY:{id:'salt'},setTimeout:()=>0,document:{createElement:node}};
 const start=mainSource.indexOf('function handleEvents()'),end=mainSource.indexOf('function frame(now)',start);if(start<0||end<start)throw Error("Missing production HUD seam");
 const handlers=new Function("scope","with(scope){"+mainSource.slice(start,end)+";return {handleEvents,updateHud};}")(scope);
 handlers.handleEvents();handlers.updateHud();
 const primary=presentation.combatPresentation(game).primary,initialHud=$('combat-hint').textContent;
 for(let f=0;f<20;f++){game.tick(1/60);handlers.handleEvents();scope.warningTimer=Math.max(0,scope.warningTimer-1/60);handlers.updateHud();}
 results.push({id:'hud-priority',initialHud,expectedPrimary:primary.text,matchesContact:initialHud.includes(primary.text),hp:game.player.hp});
 return results;
};
export function combatOutcomes(){return compare(path=>path==='src/core.js'?core:combat,readFileSync(new URL('../src/main.js',import.meta.url),'utf8'));}
if(process.argv[1]&&import.meta.url===new URL(process.argv[1],'file:').href)console.log(JSON.stringify(combatOutcomes(),null,2));
