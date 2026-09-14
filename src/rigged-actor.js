import * as T from 'three';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import { characterMotion } from './character-motion.js';

export function createRiggedActor(library,type='player'){
  const template=type==='player'?library.pilgrim:type==='soldier'?library.knight:library.keeper;
  const g=new T.Group(),body=clone(template.scene);g.add(body);
  const right=body.getObjectByName('handslotr'),left=body.getObjectByName('handslotl');
  for(const hand of [right,left])for(const child of hand.children)child.visible=false;
  body.scale.setScalar(type==='player'?.92:type==='soldier'?.88:.85);
  const sword=clone(library.knight.scene.getObjectByName('1H_Sword'));
  const greatsword=clone(library.knight.scene.getObjectByName('2H_Sword'));
  right.add(sword,greatsword);
  const spear=new T.Group();spear.quaternion.copy(sword.quaternion);spear.position.copy(sword.position);right.add(spear);
  const shaft=new T.Mesh(new T.CylinderGeometry(.035,.035,2.5,8),new T.MeshStandardMaterial({color:0x544d3c,roughness:.8}));shaft.rotation.x=Math.PI/2;spear.add(shaft);
  const tip=new T.Mesh(new T.ConeGeometry(.1,.4,6),new T.MeshStandardMaterial({color:0xc5d7ce,metalness:.65,roughness:.3}));tip.rotation.x=Math.PI/2;tip.position.z=1.45;spear.add(tip);
  const flask=new T.Mesh(new T.SphereGeometry(.13,10,8),new T.MeshStandardMaterial({color:0x8fc4a5,metalness:.2,roughness:.35}));right.add(flask);
  const staff=body.getObjectByName('2H_Staff');if(staff)staff.visible=type==='npc';
  body.traverse(n=>{if(n.isMesh){n.castShadow=true;n.receiveShadow=true;}});
  const mixer=new T.AnimationMixer(body),actions=new Map(library.pilgrim.animations.map(clip=>[clip.name,mixer.clipAction(clip)]));
  const actor={g,body,sword,greatsword,spear,flask,type,mixer,actions,current:null,lastPosition:null};
  actor.animate=(state,dt)=>{
    const last=actor.lastPosition,validPosition=Number.isFinite(state.x)&&Number.isFinite(state.z);
    const speed=last&&validPosition&&dt>0?Math.min(20,Math.hypot(state.x-last.x,state.z-last.z)/dt):0;
    if(validPosition)actor.lastPosition={x:state.x,z:state.z};
    const motion=characterMotion(state,speed),action=actions.get(motion.clip);
    if(!action)throw Error(`Missing character clip: ${motion.clip}`);
    if(actor.current!==action){
      const previous=actor.current;action.reset().stopFading().stopWarping().setEffectiveWeight(1).play();
      if(previous){if(motion.loop&&previous.loop===T.LoopRepeat)previous.crossFadeTo(action,.12,false);else previous.stop();}
      actor.current=action;
    }
    if(motion.pose!==undefined){action.setLoop(T.LoopOnce,1);action.clampWhenFinished=true;action.paused=true;action.time=action.getClip().duration*motion.pose;}
    else{action.setLoop(T.LoopRepeat,Infinity);action.paused=false;action.setEffectiveTimeScale(motion.rate||1);}
    mixer.update(dt);
    const armed=type==='player'||type==='soldier',drinking=state.healTimer>0;
    sword.visible=armed&&!drinking&&(!state.weaponType||state.weaponType==='sword');
    greatsword.visible=armed&&!drinking&&state.weaponType==='greatsword';
    spear.visible=armed&&!drinking&&state.weaponType==='spear';flask.visible=armed&&drinking;
  };
  actor.animate({},0);
  return actor;
}
