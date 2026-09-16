import { Matrix4, Quaternion, Vector3 } from 'three';

const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
const gripX=.095,pull=.36,halfString=.59,arrowRest=.12;

export function createBowContact(actor){
  if(actor.type!=='ranger')return null;
  const bow=actor.g.getObjectByName('bow'),axis=new Vector3(1,0,0),finger=actor.digits[1][1];
  const closedPad=new Vector3(0,-.0435,0).applyAxisAngle(axis,.92*.86).add(finger.tip.position).applyAxisAngle(axis,.92).add(finger.root.position);
  return {bow,arrow:actor.g.getObjectByName('loaded-arrow'),stringAxes:[new Vector3(0,-1,0),new Vector3(0,1,0)],closedPad,restElbows:[new Vector3(),new Vector3()],anchorTurn:new Quaternion().setFromAxisAngle(new Vector3(0,1,0),-.3),upper:actor.g.getObjectByName('string-upper'),lower:actor.g.getObjectByName('string-lower'),
    origin:new Vector3(),forward:new Vector3(),up:new Vector3(),side:new Vector3(),point:new Vector3(),grip:new Vector3(),nock:new Vector3(),offset:new Vector3(),restWrist:new Vector3(),scale:new Vector3(),
    bones:[actor.arms[0],actor.elbows[0],actor.hands[0],actor.arms[1],actor.elbows[1],actor.hands[1]],restBones:Array.from({length:6},()=>new Quaternion()),matrix:new Matrix4(),inverse:new Matrix4(),command:new Quaternion(),carry:new Quaternion(),hand:new Quaternion(),turn:new Quaternion().setFromAxisAngle(new Vector3(0,0,1),Math.PI/2),flip:new Quaternion().setFromAxisAngle(new Vector3(0,1,0),Math.PI)};
}

// The saved aim and release clock drive a single equipment frame. Both fixed
// length arms solve against it; neither the draw hand nor the string chases a
// separately animated approximation. Game still owns every shot and its path.
export function supportBow(actor,state,motion,solveArm){
  const b=actor.archery;if(!b)return;b.arrow.scale.setScalar(0);if(!motion.combat)return;
  const {draw,bowHold:hold,time}=motion.combat;
  for(let i=0;i<6;i++)b.restBones[i].copy(b.bones[i].quaternion);
  actor.g.updateWorldMatrix(true,true);actor.g.getWorldPosition(b.origin);actor.g.getWorldScale(b.scale);
  b.inverse.copy(actor.chest.matrixWorld).invert();for(let i=0;i<2;i++)actor.elbows[i].getWorldPosition(b.restElbows[i]).applyMatrix4(b.inverse).sub(actor.arms[i].position).normalize();
  b.origin.set(state.x??b.origin.x,(state.y??b.origin.y)+1.45,state.z??b.origin.z);
  if(state.aim)b.forward.set(state.aim.x,state.aim.y,state.aim.z).sub(b.origin);
  else b.forward.set(0,0,1).transformDirection(actor.g.matrixWorld);
  if(b.forward.lengthSq()<1e-12)b.forward.set(0,0,1).transformDirection(actor.g.matrixWorld);
  b.forward.normalize();b.up.set(0,1,0).addScaledVector(b.forward,-b.forward.y);
  if(b.up.lengthSq()<1e-8)b.up.set(1,0,0).addScaledVector(b.forward,-b.forward.x);
  b.up.normalize();b.side.crossVectors(b.forward,b.up);b.matrix.makeBasis(b.forward,b.up,b.side);b.command.setFromRotationMatrix(b.matrix);
  b.bow.getWorldQuaternion(b.carry);b.command.slerp(b.carry,1-hold);b.hand.copy(b.command).multiply(b.turn);

  // The brace remains .095 m behind the grip; a full draw reaches the existing
  // Game launch point. The bow arm stays raised while the released string returns.
  b.grip.copy(b.origin).addScaledVector(b.forward,gripX+pull).addScaledVector(b.side,arrowRest);
  b.point.set(0,-.06,.013).applyMatrix4(actor.hands[0].matrixWorld);b.grip.lerp(b.point,1-hold).addScaledVector(b.forward,.14*Math.sin(Math.PI*hold));
  b.offset.set(0,-.06,.013).multiply(b.scale).applyQuaternion(b.hand);
  b.inverse.copy(actor.chest.matrixWorld).invert();actor.grip.target.copy(b.grip).sub(b.offset).applyMatrix4(b.inverse);actor.grip.world.copy(b.hand);b.up.copy(b.side).addScaledVector(b.forward,-.2);b.up.y-=.15;b.up.transformDirection(b.inverse);b.offset.copy(b.restElbows[0]).lerp(b.up,smooth(hold/.3));solveArm(actor,0,b.offset);
  actor.arms[0].updateMatrixWorld(true);

  // Both actual string endpoints meet this nock, with positive length through
  // draw and release. There is no sign reversal past the wooden grip.
  const nockX=-pull*draw,nockZ=-arrowRest*hold;
  for(const [i,string] of [b.upper,b.lower].entries()){
    b.offset.set(nockX,i?halfString:-halfString,nockZ);string.scale.y=b.offset.length()/halfString;string.quaternion.setFromUnitVectors(b.stringAxes[i],b.offset.normalize());
  }
  b.nock.set(nockX,0,nockZ).applyMatrix4(b.bow.matrixWorld);
  b.arrow.position.set(nockX,0,nockZ);if(hold>.98&&time<=0&&(state.state==='windup'||!state.hit))b.arrow.scale.setScalar(1/b.scale.x);

  // Contact uses the actual articulated index fingertip. After release the
  // fingers open and recoil beside the anchor instead of following the string.
  actor.hands[1].getWorldPosition(b.restWrist);actor.hands[1].getWorldQuaternion(b.carry);b.hand.copy(b.command).multiply(b.anchorTurn).multiply(b.turn).multiply(b.flip).slerp(b.carry,1-hold);
  b.offset.set(0,-.0435,0).applyMatrix4(actor.digits[1][1].tip.matrixWorld);
  b.matrix.copy(actor.hands[1].matrixWorld).invert();if(time>0)b.offset.copy(b.closedPad);else b.offset.applyMatrix4(b.matrix);b.offset.multiply(b.scale).applyQuaternion(b.hand);
  b.point.copy(time<=0?b.nock:b.origin);if(time>0)b.point.addScaledVector(b.side,-.045*smooth(time/.13));
  b.point.sub(b.offset).lerp(b.restWrist,1-hold).addScaledVector(b.forward,.24*Math.sin(Math.PI*hold)).addScaledVector(b.side,-.09*Math.sin(Math.PI*hold));actor.grip.target.copy(b.point).applyMatrix4(b.inverse);actor.grip.world.copy(b.hand);b.up.copy(b.side).multiplyScalar(-1).addScaledVector(b.forward,-.2);b.up.y+=.25;b.up.transformDirection(b.inverse);b.offset.copy(b.restElbows[1]).lerp(b.up,smooth(hold/.3));solveArm(actor,1,b.offset);
  if(hold<.02)for(let i=0;i<6;i++)b.bones[i].quaternion.slerp(b.restBones[i],1-smooth(hold/.02));
  actor.arms[0].updateMatrixWorld(true);actor.arms[1].updateMatrixWorld(true);
}
