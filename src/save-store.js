export const SAVE_KEY='q-ash-pilgrim-v1';
export const BACKUP_KEY=`${SAVE_KEY}-backup`;

export function isSaveData(value){
  if(!value||value.version!==1||!value.player||typeof value.player!=='object'||Array.isArray(value.player))return false;
  const p=value.player;
  return ['x','z','hp','level','potions'].every(key=>Number.isFinite(p[key]))
    &&['lit','discovered','taken','defeated'].every(key=>Array.isArray(value[key]));
}
function parse(text){
  if(typeof text!=='string'||text.length>100000)return null;
  try{const value=JSON.parse(text);return isSaveData(value)?value:null;}catch{return null;}
}

// Keep one different, validated prior save. Never replace it with corrupt input.
export class SaveStore{
  constructor(storage){this.storage=storage;}
  read(){
    try{
      const primary=this.storage.getItem(SAVE_KEY),save=parse(primary);
      if(save)return{save,status:'loaded'};
      const backup=this.storage.getItem(BACKUP_KEY),recovered=parse(backup);
      if(recovered)return{save:recovered,status:'recovered'};
      return{save:null,status:primary===null&&backup===null?'missing':'invalid'};
    }catch{return{save:null,status:'unavailable'};}
  }
  write(save){
    if(!isSaveData(save))throw Error('Invalid journey save');
    const next=JSON.stringify(save);if(next.length>100000)throw Error('Journey save exceeds size limit');
    const previous=this.storage.getItem(SAVE_KEY);
    if(previous===next)return false;
    if(parse(previous))this.storage.setItem(BACKUP_KEY,previous);
    // localStorage replaces a key atomically. On quota/security failure the
    // previous primary remains readable and the caller reports the failed save.
    this.storage.setItem(SAVE_KEY,next);return true;
  }
}
