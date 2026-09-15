import * as T from 'three';
import { GATHERINGS } from './gathering-content.js';
import { actorGatheringCue } from './gathering-presentation.js';
import { gatheringAvailable } from './gatherings.js';
import { surfaceMaterial } from './environment-materials.js';
import { createCrate, createHerb, createLantern, beam } from './environment-models.js';

export class GatheringScene{
  constructor(scene,groundAt){
    this.props=new Map();this.markers=new Map();
    this.cueMaterial=new T.MeshBasicMaterial({color:0xd9bd79});this.speakerMaterial=new T.MeshBasicMaterial({color:0xedfff1});
    const diamond=new T.OctahedronGeometry(.14),ring=new T.RingGeometry(.55,.62,20);
    for(const d of GATHERINGS)for(const a of d.actors){
      const group=new T.Group(),mark=new T.Mesh(diamond,this.cueMaterial),base=new T.Mesh(ring,this.cueMaterial);
      mark.position.y=2.65;base.rotation.x=-Math.PI/2;base.position.y=.09;group.add(mark,base);scene.add(group);group.visible=false;this.markers.set(a.id,{group,mark,base});
    }
    const wood=surfaceMaterial('wood',0x766450);
    for(const d of GATHERINGS)for(const choice of d.choices){
      const g=new T.Group();g.position.set(d.x,groundAt(d.x,d.z+3),d.z+3);scene.add(g);this.props.set(d.id+'/'+choice.id,g);
      g.add(createCrate({width:1.3,height:.6,depth:.6}));
      if(choice.prop==='herbs')for(const x of [-.4,0,.4]){const herb=createHerb({pot:true});herb.scale.setScalar(.8);herb.position.set(x,.63,0);g.add(herb);}
      else {beam(g,wood,[0,.6,0],[0,2.3,0],.05);beam(g,wood,[0,2.28,0],[.45,2.28,0],.035);const lamp=createLantern();lamp.position.set(.4,1.62,0);g.add(lamp);}
    }
  }
  update(game){
    for(const [id,m]of this.markers){const n=game.residents.find(n=>n.id===id),cue=actorGatheringCue(game,id);m.group.visible=!!n&&!!cue;if(!m.group.visible)continue;m.group.position.set(n.x,n.y,n.z);const material=cue.speaker?this.speakerMaterial:this.cueMaterial;m.mark.material=m.base.material=material;m.base.visible=cue.speaker;m.mark.scale.setScalar(cue.speaker?1.5:1);}
    for(const d of GATHERINGS)for(const c of d.choices)this.props.get(d.id+'/'+c.id).visible=gatheringAvailable(game,d)&&game.gatherings[d.id].phase==='done'&&game.gatherings[d.id].choice===c.id;}
}
