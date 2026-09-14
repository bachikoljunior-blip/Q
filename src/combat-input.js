const combatActions=new Set(['attack','dodge','parry','jump']);
const fallbackOrder=['dodge','parry','jump','attack'];

export function isCombatAction(name){return combatActions.has(name);}

export function selectCombatIntent(intents,presentation){
  const requested=[...new Set(intents)].filter(isCombatAction);
  const recommended=presentation?.decision?.action;
  if(recommended&&requested.includes(recommended))return recommended;
  return fallbackOrder.find(name=>requested.includes(name))||null;
}

/** Coalesce one rendered frame of touch, keyboard and gamepad combat input. */
export class CombatInputQueue{
  constructor(){this.intents=[];}
  push(name){if(isCombatAction(name)&&!this.intents.includes(name))this.intents.push(name);}
  clear(){this.intents.length=0;}
  flush(game,presentation,direction={}){
    const requested=[...this.intents],selected=selectCombatIntent(requested,presentation);this.clear();
    if(!selected)return {requested,selected:null,accepted:false,buffered:false};
    const recommended=presentation?.decision?.action;
    if(selected===recommended&&game.pendingAction&&game.pendingAction.name!==selected)game.clearActionBuffer();
    const accepted=game.requestAction(selected,direction);
    return {requested,selected,accepted,buffered:!accepted&&game.pendingAction?.name===selected};
  }
}
