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
  if(actor.state==='stagger')return {clip:'Hit_A',loop:true};
  if(actor.state==='windup')return {clip:sword[2],pose:.05+.4*limit(1-actor.timer/(actor.windupMax||1))};
  if(actor.state==='strike')return {clip:sword[2],pose:.5+.499*limit(1-actor.timer/.22)};
  const moving=actor.moving||['chase','return'].includes(actor.state);
  return {clip:moving?(speed>8?'Running_A':'Walking_A'):'Idle',loop:true,rate:moving?Math.max(.6,Math.min(1.8,speed/(speed>8?9:5))):1};
}
