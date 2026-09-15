import { WEAPONS } from './content.js';

const limit=n=>Math.max(0,Math.min(1,n));
const sword=['1H_Melee_Attack_Slice_Horizontal','1H_Melee_Attack_Slice_Diagonal','1H_Melee_Attack_Chop'];
const heavy=['2H_Melee_Attack_Slice','2H_Melee_Attack_Chop','2H_Melee_Attack_Spin'];

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
  if(actor.attack>0)return {state:'attack',phase:characterMotion(actor,speed).pose,weapon:actor.weaponType||'sword',combo:actor.combo%3||0};
  if(actor.parry>0)return {state:'parry',phase:limit(1-actor.parry/.48)};
  if(actor.grounded===false)return {state:'airborne',phase:limit((actor.vertical||0)/8+.5)};
  if(actor.state==='stagger')return {state:'hit',phase:limit(1-actor.timer/Math.max(.01,actor.stagger||.35))};
  if(actor.state==='windup')return {state:'windup',phase:limit(1-actor.timer/(actor.windupMax||1))};
  if(actor.state==='strike')return {state:'strike',phase:limit(1-actor.timer/.22)};
  if(actor.state==='recover')return {state:'recover',phase:limit(1-actor.timer/(actor.type==='boss'?.85:actor.type==='wolf'?.9:actor.type==='ranger'?1.15:1.1))};
  if(actor.state==='sealed')return {state:'sealed',phase:0};
  return {state:actor.moving||['chase','return'].includes(actor.state)?speed>7?'run':'walk':'idle',phase:0};
}
