import {renderCombatHint} from './combat-presentation.js';

/** Bind the projected threat decision to the live hint and defensive controls. */
export function renderCombatHud(hint,buttons,game,options){
  const presentation=renderCombatHint(hint,game,options);
  for(const name of ['dodge','parry','jump']){
    const button=buttons[name],recommended=presentation.decision?.action===name;
    button.classList.toggle('recommended',recommended);
    if(recommended)button.setAttribute('aria-describedby','combat-hint');else button.removeAttribute('aria-describedby');
  }
  return presentation;
}
