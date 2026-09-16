import * as T from 'three';
import { cameraFraction, segmentCylinder } from './spatial.js';
import { groundAt } from './core.js';

// Paused conversation composition only. No game, actor, orbit or save mutation.
// The upper 53% remains outside the dialogue panel, including its safe-area pad.
export const DIALOGUE_FRAME = Object.freeze({ centerY: .235, left: .08, right: .92, top: .035, bottom: .515 });
const angles = [0, -Math.PI/6, Math.PI/6, -Math.PI/3, Math.PI/3];
const models = new WeakMap();
function anatomy(actor) {
  let data = models.get(actor);
  if (!data) {
    const meshes=[];
    actor.g.traverse(n=>{if(n.isMesh)meshes.push(n);});
    data={head:actor.g.getObjectByName('head'),face:meshes.find(n=>n.material.name==='Q anatomical face'),meshes};
    models.set(actor,data);
  }
  return data;
}
function refresh(actor) {
  // updateMatrixWorld invokes SkinnedMesh’s attached bind inverse update;
  // updateWorldMatrix alone does not, and would double-transform face vertices.
  actor.g.updateWorldMatrix(true,false);actor.g.updateMatrixWorld(true);
  const data=anatomy(actor);
  for(const mesh of data.meshes)if(mesh.isSkinnedMesh){mesh.skeleton.update();mesh.boundingSphere=null;mesh.boundingBox=null;}
  return data;
}
function actorFor(view,id) { return id==='keeper'?view.npc:id==='ferryman'?view.sena:view.residentModels.get(id); }
function projectedInside(points,camera) {
  return points.every(point=>{
    const p=point.clone().project(camera),x=p.x*.5+.5,y=.5-p.y*.5;
    return p.z>-1&&p.z<1&&x>=DIALOGUE_FRAME.left&&x<=DIALOGUE_FRAME.right&&y>=DIALOGUE_FRAME.top&&y<=DIALOGUE_FRAME.bottom;
  });
}
export class DialogueCamera {
  constructor(){this.key=null;this.shot=null;this.active=false;this.rebuilds=0;this.attempts=0;}
  reset(){this.key=null;this.shot=null;}
  // Projection shift changes composition without cropping the render viewport,
  // altering focal length or reducing the underlying game's render resolution.
  compose(camera,active){
    if(this.active===active)return;
    this.active=active;camera.updateProjectionMatrix();
    if(active)camera.projectionMatrix.elements[9]=-(1-2*DIALOGUE_FRAME.centerY);
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
  }
  resolve(view,stage,width,height){
    const game=view.game,id=view.dialogueFocus||stage?.speakerId;
    const npc=id&&game.npcs().find(n=>n.id===id),actor=id&&actorFor(view,id);
    if(!npc||!actor?.g.visible||game.player.dead||!game.actionIdle()||game.threatened()||game.threatened(npc,13)||
      (!stage&&(Math.hypot(npc.x-game.player.x,npc.z-game.player.z)>=4.7||!game.canReach(game.player,npc)))){
      this.reset();return null;
    }
    actor.g.updateWorldMatrix(true,true);
    const data=anatomy(actor);if(!data.head||!data.face)return null;
    const nearby=[view.player,...game.npcs().filter(n=>n.id!==id&&Math.hypot(n.x-npc.x,n.z-npc.z)<9).map(n=>actorFor(view,n.id))].filter(Boolean);
    const key=[id,width,height,view.t,game.obstacles.length,...data.head.matrixWorld.elements,...nearby.flatMap(m=>[m.g.position.x,m.g.position.y,m.g.position.z,m.g.rotation.y])].join(',');
    if(this.game===game&&this.obstacles===game.obstacles&&key===this.key)return this.shot;
    this.game=game;this.obstacles=game.obstacles;this.key=key;this.shot=null;this.rebuilds++;this.attempts=0;
    refresh(actor);
    const points=Array.from({length:data.face.geometry.attributes.position.count},(_,i)=>data.face.getVertexPosition(i,new T.Vector3()).applyMatrix4(data.face.matrixWorld));
    const center=new T.Box3().setFromPoints(points).getCenter(new T.Vector3());
    const eyes=[-1,1].map(s=>data.head.localToWorld(new T.Vector3(s*.046,.05,.109)));
    const forward=new T.Vector3(0,0,1).transformDirection(data.head.matrixWorld);forward.y=0;forward.normalize();
    const bodies=nearby.map(m=>({x:m.g.position.x,y:m.g.position.y,z:m.g.position.z,r:.43,height:1.95}));
    const ray=new T.Raycaster(),camera=new T.PerspectiveCamera(54,width/height,.1,1100);
    camera.projectionMatrix.elements[9]=-(1-2*DIALOGUE_FRAME.centerY);
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
    // Finite work on entry/speaker/pose/resize changes; paused frames reuse it.
    for(const distance of [2.6,3.2,3.8])for(const angle of angles){
      this.attempts++;
      const direction=forward.clone().applyAxisAngle(new T.Vector3(0,1,0),angle);
      const position=center.clone().addScaledVector(direction,distance);position.y=center.y+.1;
      // Reject blocked candidates; do not squeeze the camera into a wall/body.
      if(cameraFraction(center,position,game.obstacles,groundAt)<.999||position.y<groundAt(position.x,position.z)+.35)continue;
      if(eyes.some(eye=>bodies.some(body=>segmentCylinder(position,eye,body,.06)!==null)))continue;
      camera.position.copy(position);camera.lookAt(center);camera.updateMatrixWorld();
      // Head and shoulder/chest envelope share the upper composition region.
      const torso=[[-.33,-.65,0],[.33,-.65,0],[-.33,-.28,0],[.33,-.28,0]].map(p=>data.head.localToWorld(new T.Vector3(...p)));
      if(!projectedInside([...points,...torso],camera))continue;
      if(!eyes.every(eye=>{
        const delta=eye.clone().sub(position),length=delta.length();ray.set(position,delta.normalize());ray.far=length+.02;
        const hit=ray.intersectObjects(data.meshes,false)[0];
        return hit?.object.material.name==='Q eye'&&Math.abs(hit.distance-length)<.012;
      }))continue;
      this.shot={id,position,target:center,distance,angle,attempts:this.attempts};return this.shot;
    }
    return null;
  }
}
