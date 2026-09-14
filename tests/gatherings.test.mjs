import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {Game,groundAt,distance} from '../src/core.js';
import {GATHERINGS} from '../src/gathering-content.js';
import {gatheringAction,gatheringView,gatheringGoal,gatheringSpeech} from '../src/gatherings.js';
import {GatheringScene} from '../src/gathering-scene.js';

// Unit fixtures unlock and position actors; walking journeys are separate.
const at=(g,t)=>Object.assign(g.player,{x:t.x,z:t.z,y:groundAt(t.x,t.z),grounded:true});
const wait=(g,s)=>{for(let i=0;i<s*60;i++)g.tick(1/60);};
function unlocked(){const g=new Game();Object.assign(g.bells,{started:true,solved:true,reported:true,step:3});g.crossingChoice='road';g.supplies=true;return g;}
function assemble(g,d){at(g,g.residents.find(n=>n.id===d.actors[0].id));assert(gatheringAction(g,d.id,'start'));at(g,d);wait(g,25);assert(gatheringView(g,d.id).ready,JSON.stringify(g.residents.filter(n=>d.actors.some(a=>a.id===n.id))));assert.equal(g.gatherings[d.id].phase,'talking');}

test('gathering actors walk to authored seats and preserve every explicit dialogue beat through saves',()=>{
  for(const d of GATHERINGS){let g=unlocked();assemble(g,d);for(const a of d.actors)assert(distance(g.residents.find(n=>n.id===a.id),a)<.65);
    assert(!gatheringAction(g,d.id,d.choices[0].id));
    for(let i=1;i<d.lines.length;i++){assert(gatheringAction(g,d.id,'next'));g=new Game(g.serialize());assert.equal(g.gatherings[d.id].beat,i);}
    assert(!gatheringAction(g,d.id,'next'));assert(!gatheringAction(g,d.id,'unknown'));
    const before={herbs:g.player.herbs,ash:g.player.ash},choice=d.choices[0];assert(gatheringAction(g,d.id,choice.id));
    g=new Game(g.serialize());assert.equal(g.player.herbs,before.herbs+choice.reward.herbs);assert.equal(g.player.ash,before.ash+choice.reward.ash);assert(!gatheringAction(g,d.id,choice.id));assert(!gatheringAction(g,d.id,'start'));
    assert.equal(gatheringSpeech(g,g.residents.find(n=>n.id===d.actors[0].id)),choice.responses[d.actors[0].id]);
  }
});

test('departure, nearby danger and busy hands suspend choices without losing the current line',()=>{
  for(const d of GATHERINGS){let g=unlocked();assemble(g,d);assert(gatheringAction(g,d.id,'next'));at(g,{x:d.x+40,z:d.z});wait(g,5);assert(!gatheringAction(g,d.id,'next'));assert.equal(gatheringGoal(g,g.residents.find(n=>n.id===d.actors[0].id)),null);
    g=new Game(g.serialize());at(g,d);wait(g,25);assert.equal(g.gatherings[d.id].beat,1);assert(gatheringView(g,d.id).ready);
    g.projectiles.push({owner:'enemy-0',x:d.x,z:d.z,life:1});assert(!gatheringAction(g,d.id,'next'));assert(!gatheringView(g,d.id).ready);g.projectiles=[];
    g.player.attack=.2;assert(!gatheringAction(g,d.id,'next'));g.player.attack=0;assert(gatheringAction(g,d.id,'next'));
  }
});

test('locked, malformed and legacy gathering saves cannot retain stale completion or grant rewards',()=>{
  const g=unlocked(),s=g.serialize();for(const d of GATHERINGS)s.gatherings[d.id]={phase:'done',beat:999,choice:d.choices[0].id};
  let restored=new Game(s);for(const d of GATHERINGS)assert.equal(restored.gatherings[d.id].phase,'idle');
  for(const d of GATHERINGS)s.gatherings[d.id]={phase:'done',beat:d.lines.length-1,choice:d.choices[1].id};
  restored=new Game(s);assert.equal(restored.player.ash,g.player.ash);assert.equal(restored.player.herbs,g.player.herbs);
  s.bells.reported=false;s.crossingChoice=null;restored=new Game(s);for(const d of GATHERINGS){assert.equal(restored.gatherings[d.id].phase,'idle');assert.equal(gatheringView(restored,d.id),null);assert(!gatheringAction(restored,d.id,'start'));}
  delete s.gatherings;assert(restored.restore(s));for(const d of GATHERINGS)assert.equal(restored.gatherings[d.id].phase,'idle');
});

test('each alternative grants its own reward once and shows only its resulting prop in the scene graph',()=>{
  for(const d of GATHERINGS)for(const c of d.choices){let g=unlocked();assemble(g,d);for(let i=1;i<d.lines.length;i++)assert(gatheringAction(g,d.id,'next'));const ash=g.player.ash,herbs=g.player.herbs;assert(gatheringAction(g,d.id,c.id));g=new Game(g.serialize());assert.equal(g.player.ash,ash+c.reward.ash);assert.equal(g.player.herbs,herbs+c.reward.herbs);
    const view=new GatheringScene(new T.Scene(),groundAt);view.update(g);assert.deepEqual([...view.props].filter(([,v])=>v.visible).map(([k])=>k),[d.id+'/'+c.id]);
    for(const other of d.choices)assert(!gatheringAction(g,d.id,other.id));
  }
});
