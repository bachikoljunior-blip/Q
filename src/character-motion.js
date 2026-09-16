import { WEAPONS } from './content.js';

const limit=n=>Math.max(0,Math.min(1,n));
const smooth=n=>{n=limit(n);return n*n*(3-2*n);};
const sword=['1H_Melee_Attack_Slice_Horizontal','1H_Melee_Attack_Slice_Diagonal','1H_Melee_Attack_Chop'];
const heavy=['2H_Melee_Attack_Slice','2H_Melee_Attack_Chop','2H_Melee_Attack_Spin'];

// One presentation clock crosses all three saved enemy states. The hit clock
// remains owned by Game; an interrupted recovery simply samples its saved time.
function combatEnvelope(actor){
  const player=actor.attack>0,weapon=actor.weaponType||'sword',stats=WEAPONS[weapon]||WEAPONS.sword;
  const duration=actor.attackDuration||stats.duration;
  const recovery=actor.type==='boss'?.85:actor.type==='wolf'?.9:actor.type==='ranger'?1.15:1.1;
  const windup=player?Math.min(stats.hitTime,duration*.9):Math.max(.01,actor.windupMax||1);
  const time=player?duration-actor.attack-windup:actor.state==='windup'?-actor.timer:actor.state==='strike'?.22-actor.timer:.22+recovery-actor.timer;
  const end=player?duration-windup:.22+recovery;
  const releaseDuration=actor.type==='wolf'?.14:actor.type==='boss'?.24:player?(weapon==='greatsword'?.20:weapon==='spear'?.12:.16):.20;
  const releaseStart=-Math.min(windup*.72,releaseDuration*.85),releaseEnd=releaseDuration+releaseStart;
  const wind=smooth((time+windup)/Math.max(.01,windup+releaseStart));
  const release=smooth((time-releaseStart)/releaseDuration),settle=smooth((time-releaseEnd-.035)/Math.max(.01,end-releaseEnd-.035));
  return {time,wind,release,releaseStart,releaseEnd,settle,weight:1-settle,
    // Bow release begins on strike, while the bow arm stays extended through it.
    draw:smooth((time+windup-Math.min(.3,windup*.4))/Math.max(.01,windup-Math.min(.3,windup*.4)))*(1-smooth(time/.07)),bowHold:smooth((time+windup)/Math.min(.3,windup*.4))*(1-smooth((time-.22)/recovery))};
}

// Presentation follows the saved action clock. It never advances combat or root movement.
export function characterMotion(actor,speed=0){
  if(actor.dead)return {clip:'Death_A',pose:.999};
  if(actor.dodge>0)return {clip:'Dodge_Forward',pose:limit(1-actor.dodge/.42)};
  if(actor.healTimer>0)return {clip:'Use_Item',pose:limit(1-actor.healTimer/.9)};
  if(actor.attack>0){
    const stats=WEAPONS[actor.weaponType]||WEAPONS.sword,duration=actor.attackDuration||stats.duration;
    const elapsed=limit(1-actor.attack/duration)*duration,hit=Math.min(stats.hitTime,duration*.9);
    const pose=elapsed<=hit?.5*elapsed/hit:.5+.499*(elapsed-hit)/(duration-hit);
    return {clip:actor.weaponType==='spear'?'2H_Melee_Attack_Stab':(actor.weaponType==='greatsword'?heavy:sword)[actor.combo%3||0],pose};
  }
  if(actor.parry>0)return {clip:'Block',pose:.45};
  if(actor.grounded===false)return {clip:'Jump_Idle',loop:true};
  if(actor.state==='stagger')return {clip:'Hit_A',pose:limit(1-actor.timer/Math.max(.01,actor.stagger||.35))*.999};
  if(actor.state==='windup')return {clip:sword[2],pose:.05+.4*limit(1-actor.timer/(actor.windupMax||1))};
  if(actor.state==='strike')return {clip:sword[2],pose:.5+.499*limit(1-actor.timer/.22)};
  if(actor.state==='recover')return {clip:sword[2],pose:.85+.149*limit(1-actor.timer/(actor.type==='boss'?.85:actor.type==='wolf'?.9:actor.type==='ranger'?1.15:1.1))};
  const moving=actor.moving||['chase','return'].includes(actor.state);
  return {clip:moving?(speed>8?'Running_A':'Walking_A'):'Idle',loop:true,rate:moving?Math.max(.6,Math.min(1.8,speed/(speed>8?9:5))):1};
}

// Semantic motion shared by the authored two-bone actors. Action phases are
// sampled from the gameplay state, including on a fresh saved-game view.
export function detailedMotion(actor,speed=0){
  if(actor.dead)return {state:'death',phase:1};
  if(actor.dodge>0)return {state:'dodge',phase:limit(1-actor.dodge/.42)};
  if(actor.healTimer>0)return {state:'drink',phase:limit(1-actor.healTimer/.9)};
  if(actor.attack>0)return {state:'attack',phase:characterMotion(actor,speed).pose,weapon:actor.weaponType||'sword',combo:actor.combo%3||0,combat:combatEnvelope(actor)};
  if(actor.parry>0)return {state:'parry',phase:limit(1-actor.parry/.48)};
  if(actor.grounded===false)return {state:'airborne',phase:limit((actor.vertical||0)/8+.5)};
  if(actor.state==='stagger')return {state:'hit',phase:limit(1-actor.timer/Math.max(.01,actor.stagger||.35))};
  if(actor.state==='windup')return {state:'windup',phase:limit(1-actor.timer/(actor.windupMax||1)),combat:combatEnvelope(actor)};
  if(actor.state==='strike')return {state:'strike',phase:limit(1-actor.timer/.22),combat:combatEnvelope(actor)};
  if(actor.state==='recover')return {state:'recover',phase:limit(1-actor.timer/(actor.type==='boss'?.85:actor.type==='wolf'?.9:actor.type==='ranger'?1.15:1.1)),combat:combatEnvelope(actor)};
  if(actor.state==='sealed')return {state:'sealed',phase:0};
  return {state:actor.moving||['chase','return'].includes(actor.state)?speed>7?'run':'walk':'idle',phase:0};
}
