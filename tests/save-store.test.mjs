import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/core.js';
import { SaveStore, SAVE_KEY, BACKUP_KEY, isSaveData } from '../src/save-store.js';
const memory=()=>{
  const map=new Map();let writes=0;
  return{map,get writes(){return writes;},getItem:key=>map.get(key)??null,setItem:(key,value)=>{writes++;map.set(key,value);}};
};

test('corrupt primary data recovers the previous complete journey and keeps that backup on the next save',()=>{
  const storage=memory(),store=new SaveStore(storage),g=new Game(),first=g.serialize();store.write(first);
  g.attack();store.write(g.serialize());storage.map.set(SAVE_KEY,'{"version":1,broken');
  const loaded=store.read();assert.equal(loaded.status,'recovered');assert.deepEqual(loaded.save,JSON.parse(JSON.stringify(first)));
  const h=new Game(loaded.save);h.jump();store.write(h.serialize());assert.deepEqual(JSON.parse(storage.getItem(BACKUP_KEY)),JSON.parse(JSON.stringify(first)));
  assert.equal(store.read().status,'loaded');
});

test('a failed primary write leaves a complete previous save available',()=>{
  const storage=memory(),store=new SaveStore(storage),g=new Game();store.write(g.serialize());const first=storage.getItem(SAVE_KEY);
  const normal=storage.setItem;storage.setItem=(key,value)=>{if(key===SAVE_KEY)throw Error('Quota exceeded');normal(key,value);};
  g.attack();assert.throws(()=>store.write(g.serialize()),/Quota/);
  assert.equal(storage.getItem(SAVE_KEY),first);assert.equal(storage.getItem(BACKUP_KEY),first);assert.equal(store.read().status,'loaded');
});

test('unreadable or invalid save slots are reported without replacing or deleting either slot',()=>{
  const storage=memory(),store=new SaveStore(storage);storage.map.set(SAVE_KEY,'[]');storage.map.set(BACKUP_KEY,'null');
  assert.deepEqual(store.read(),{save:null,status:'invalid'});assert.equal(storage.writes,0);assert.equal(storage.getItem(SAVE_KEY),'[]');
  const blocked=new SaveStore({getItem(){throw Error('Denied');}});assert.equal(blocked.read().status,'unavailable');
  assert.equal(new SaveStore(memory()).read().status,'missing');
});

test('duplicate save events do not overwrite the useful previous backup',()=>{
  const storage=memory(),store=new SaveStore(storage),g=new Game();store.write(g.serialize());const first=storage.getItem(SAVE_KEY);
  g.attack();const changed=g.serialize();store.write(changed);const writes=storage.writes;
  store.write(changed);store.write(changed);assert.equal(storage.writes,writes);assert.equal(storage.getItem(BACKUP_KEY),first);
});

test('real legacy saves work without runtime data; unknown and incomplete files are rejected',()=>{
  const save=new Game().serialize();delete save.runtime;assert(isSaveData(save));
  for(const invalid of [null,[],{...save,version:9},{...save,player:[]},{...save,player:{...save.player,hp:null}},{...save,lit:'haven'}])assert.equal(isSaveData(invalid),false);
  const store=new SaveStore(memory());assert.throws(()=>store.write({version:1,player:{}}),/Invalid/);
});
