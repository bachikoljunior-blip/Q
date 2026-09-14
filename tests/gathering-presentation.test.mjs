import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {Game,groundAt} from '../src/core.js';
import {GATHERINGS} from '../src/gathering-content.js';
import {gatheringPresentation,actorGatheringCue} from '../src/gathering-presentation.js';
import {GatheringScene} from '../src/gathering-scene.js';
import {gatheringAction} from '../src/gatherings.js';

// These are state/object-graph fixtures, not screen or touch observations.
function fixture(d){const g=new Game();Object.assign(g.bells,{reported:true,solved:true,step:3});g.supplies=true;g.crossingChoice='road';Object.assign(g.player,{x:d.x,z:d.z,y:groundAt(d.x,d.z)});for(const a of d.actors){const n=g.residents.find(n=>n.id===a.id);Object.assign(n,{x:a.x,z:a.z,y:groundAt(a.x,a.z)});}return g;}

test('both scene definitions use canonical actor identities for every authored speaker',()=>{
  const g=new Game();for(const d of GATHERINGS)for(const line of d.lines){assert(d.actors.some(a=>a.id===line.actor));assert.equal(g.residents.find(n=>n.id===line.actor)?.label,line.speaker);}
});

test('shared presentation exposes invitations, exactly one current speaker and only already-read history',()=>{
  for(const d of GATHERINGS){let g=fixture(d);assert.equal(gatheringPresentation(g,d.id).history.length,0);assert(actorGatheringCue(g,d.actors[0].id).text.includes('相談あり'));
    assert(gatheringAction(g,d.id,'start'));assert(gatheringPresentation(g,d.id).instruction.includes('画面を閉じ'));g.tick(1/60);
    for(let i=0;i<d.lines.length;i++){
      const before=JSON.stringify(g.serialize()),events=g.events.length,p=gatheringPresentation(g,d.id);assert.equal(p.speakerId,d.lines[i].actor);assert.equal(p.cast.filter(n=>n.current).length,1);assert.equal(p.history.length,i);assert.equal(p.progress,`${i+1} / ${d.lines.length}`);assert.equal(JSON.stringify(g.serialize()),before);assert.equal(g.events.length,events);
      if(i<d.lines.length-1){assert(gatheringAction(g,d.id,'next'));g=new Game(g.serialize());}
    }
    assert(gatheringAction(g,d.id,d.choices[0].id));assert.equal(gatheringPresentation(g,d.id).history.length,d.lines.length);assert.equal(actorGatheringCue(g,d.actors[0].id),null);
  }
});

test('locked, distant, dead and interrupted scenes do not show a false active speaker',()=>{
  for(const d of GATHERINGS){let g=new Game();assert.equal(gatheringPresentation(g,d.id),null);g=fixture(d);g.gatherings[d.id]={phase:'talking',beat:1,choice:null};g.projectiles.push({owner:'enemy-0',x:d.x,z:d.z,life:2});assert.equal(gatheringPresentation(g,d.id).speakerId,null);assert(actorGatheringCue(g,d.actors[0].id).text.includes('中断'));g.projectiles=[];g.player.x+=50;assert.equal(actorGatheringCue(g,d.actors[0].id),null);g.player.x=d.x;g.player.dead=true;assert.equal(actorGatheringCue(g,d.actors[0].id),null);}
});

test('world cues follow moving residents, switch speaker rings and hide after completing or changing saves',()=>{
  for(const d of GATHERINGS){let g=fixture(d),view=new GatheringScene(new T.Scene(),groundAt);g.gatherings[d.id]={phase:'talking',beat:0,choice:null};view.update(g);assert(view.markers.get(d.lines[0].actor).base.visible);assert.equal([...view.markers.values()].filter(m=>m.group.visible&&m.base.visible).length,1);
    assert(gatheringAction(g,d.id,'next'));g=new Game(g.serialize());view.update(g);assert(view.markers.get(d.lines[1].actor).base.visible);const n=g.residents.find(n=>n.id===d.actors[0].id);n.x+=2;view.update(g);assert.equal(view.markers.get(n.id).group.position.x,n.x);assert.equal([...view.markers.values()].filter(m=>m.group.visible&&m.base.visible).length,0);
    view.update(new Game());assert([...view.markers.values()].every(m=>!m.group.visible));
  }
});
