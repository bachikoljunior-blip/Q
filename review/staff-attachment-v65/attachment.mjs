import { Matrix4, Quaternion, Vector3 } from 'three';
import { makeMiraStaff } from '../staff-v63/assembly.mjs';

// Metres. Explicit authored registration, not measurements inferred from images.
export const STAFF_REGISTRATION = Object.freeze({
  originActor: Object.freeze([-.46, 0, .22]),
  gripStaff: Object.freeze([0, 1.135, 0]),
  gripHand: Object.freeze([0, -.074, -.044]),
  handQuaternion: Object.freeze([.6123724356957946, .6123724356957945, -.35355339059327384, -.35355339059327384]),
  poleActor: Object.freeze([.3, -1, -1]),
  rightHandIndex: 0,
});
const down = new Vector3(0, -1, 0), one = new Vector3(1, 1, 1);
const finite = v => v.toArray().every(Number.isFinite);
function chainError(arm, elbow, hand) {
  if ([arm,elbow,hand].some(n=>!finite(n.position)||!finite(n.quaternion)||!finite(n.scale))) return 'nonfinite-arm-transform';
  if ([arm,elbow,hand].some(n=>n.scale.distanceTo(one)>1e-9)) return 'unsupported-arm-scale';
  if (elbow.position.distanceTo(new Vector3(0,-.33,0))>1e-9 || hand.position.distanceTo(new Vector3(0,-.31,0))>1e-9) return 'changed-arm-translations';
  return null;
}
function usable(matrix) {
  return matrix.elements.every(Number.isFinite) && matrix.determinant() > 1e-10;
}
function direction(matrix, value) {
  const e = matrix.elements, { x, y, z } = value;
  return new Vector3(e[0]*x+e[4]*y+e[8]*z, e[1]*x+e[5]*y+e[9]*z, e[2]*x+e[6]*y+e[10]*z);
}
// A proper rotation is the closest supported *type* of hand transform here.
// Prioritise the thumb/radial axis, then orthogonalise the proximal axis. The
// inherited nonuniform chest scale is retained, not mislabelled as removed.
function handFrameInChest(chestInverse, desiredWorld) {
  const e = desiredWorld.elements;
  const x = direction(chestInverse, new Vector3(e[0], e[1], e[2])).normalize();
  const y = direction(chestInverse, new Vector3(e[4], e[5], e[6]));
  y.addScaledVector(x, -y.dot(x)).normalize();
  const z = new Vector3().crossVectors(x, y).normalize();
  if (x.lengthSq() < .9 || y.lengthSq() < .9 || z.lengthSq() < .9) return null;
  return new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(x, y, z)).normalize();
}
function solveArm(shoulder, wrist, poleHint, upper, lower) {
  const axis = wrist.clone().sub(shoulder), reach = axis.length();
  if (!Number.isFinite(reach) || reach >= upper+lower-1e-8 || reach <= Math.abs(upper-lower)+1e-8) return { ok:false, reason:'unreachable', reach };
  axis.divideScalar(reach);
  const pole = poleHint.clone().addScaledVector(axis, -poleHint.dot(axis));
  if (pole.lengthSq() < 1e-12) {
    pole.set(Math.abs(axis.x)<.8?1:0, Math.abs(axis.x)<.8?0:1, 0);
    pole.addScaledVector(axis, -pole.dot(axis));
  }
  pole.normalize();
  const along = (upper*upper-lower*lower+reach*reach)/(2*reach);
  const elbow = shoulder.clone().addScaledVector(axis, along).addScaledVector(pole, Math.sqrt(Math.max(0, upper*upper-along*along)));
  return { ok:true, reach, elbow };
}

/** Research adapter for the authored standing right-hand registration.
 * Call actor.animate(...) first, then update(), then skin/scene rendering.
 * It changes three bone rotations only; translations, scales, bind data and
 * geometry stay untouched. No game import, grasp-surface or motion acceptance.
 * The staff is a root child with an explicit affine compensation matrix: do
 * not decompose that local matrix, which would lose inherited-shear cancellation.
 */
export function createStaffAttachment(actor, { staff = makeMiraStaff(), groundHeight = actor.groundHeight } = {}) {
  const root = actor.g, chest = actor.chest, arm = actor.arms[0], elbow = actor.elbows[0], hand = actor.hands[0];
  if (!root || !chest || !arm || !elbow || !hand || arm.parent !== chest || elbow.parent !== arm || hand.parent !== elbow) throw Error('Expected existing right arm-0/elbow-0/hand-0 chain');
  const initialError=chainError(arm,elbow,hand);if(initialError)throw Error(initialError);
  const upper = elbow.position.length(), lower = hand.position.length();
  if (Math.abs(upper-.33)>1e-9 || Math.abs(lower-.31)>1e-9 || elbow.position.clone().normalize().distanceTo(down)>1e-9 || hand.position.clone().normalize().distanceTo(down)>1e-9) throw Error('Authored adapter requires unchanged 330/310 mm arm');
  if (staff.parent) throw Error('Staff must be unattached; ownership transfer is explicit');
  staff.matrixAutoUpdate = false;
  root.add(staff);
  staff.userData = { ...staff.userData, handAttachment:'standing CPU candidate', gameImported:false };
  const origin = new Vector3(...STAFF_REGISTRATION.originActor), gripLocal = new Vector3(...STAFF_REGISTRATION.gripStaff), handLocal = new Vector3(...STAFF_REGISTRATION.gripHand);
  const authoredHand = new Quaternion(...STAFF_REGISTRATION.handQuaternion);
  let disposed = false;
  function fail(reason, detail={}) { staff.visible=false; return { ok:false, reason, ...detail }; }
  function update() {
    if (disposed) return { ok:false, reason:'disposed' };
    // Validate BEFORE world propagation or rotation writes. NaN comparisons do
    // not satisfy > epsilon, so an explicit finite check is indispensable.
    const invalidChain=chainError(arm,elbow,hand);if(invalidChain)return fail(invalidChain);
    root.updateWorldMatrix(true, true);
    if (!usable(root.matrixWorld) || !usable(chest.matrixWorld)) return fail('singular-or-reflected-frame');
    const rootInverse = root.matrixWorld.clone().invert(), chestInverse = chest.matrixWorld.clone().invert();
    // Grounded staff stays world-upright; root/parent yaw determines its heading.
    // Root offsets still follow the full actor matrix. Model length stays metric
    // even under a scaled parent; extreme scale can make the arm unreachable.
    const forward = direction(root.matrixWorld, new Vector3(0,0,1)); forward.y=0;
    if (forward.lengthSq()<1e-12) return fail('undefined-horizontal-heading');
    forward.normalize();
    const up = new Vector3(0,1,0), right = new Vector3().crossVectors(up,forward);
    const rotationWorld = new Matrix4().makeBasis(right,up,forward);
    const baseWorld = origin.clone().applyMatrix4(root.matrixWorld);
    if (groundHeight) {
      const y = groundHeight(baseWorld.x,baseWorld.z);
      if (!Number.isFinite(y)) return fail('invalid-ground-height');
      baseWorld.y=y;
    }
    const targetGrip = gripLocal.clone().applyMatrix4(rotationWorld).add(baseWorld);
    const desiredHand = rotationWorld.clone().multiply(new Matrix4().makeRotationFromQuaternion(authoredHand));
    const handChest = handFrameInChest(chestInverse,desiredHand);
    if (!handChest) return fail('invalid-hand-frame');
    // Crucially use the REAL attainable hand frame, not an unscaled ideal hand
    // matrix, when solving the wrist offset under the breathing chest transform.
    const wrist = targetGrip.clone().applyMatrix4(chestInverse).sub(handLocal.clone().applyQuaternion(handChest));
    const pole = direction(chestInverse,direction(root.matrixWorld,new Vector3(...STAFF_REGISTRATION.poleActor)));
    const solved = solveArm(arm.position,wrist,pole,upper,lower);
    if (!solved.ok) return fail(solved.reason,{ reach:solved.reach });
    const upperQ = new Quaternion().setFromUnitVectors(down,solved.elbow.clone().sub(arm.position).normalize());
    const lowerQ = new Quaternion().setFromUnitVectors(down,wrist.clone().sub(solved.elbow).normalize());
    const elbowQ = upperQ.clone().invert().multiply(lowerQ), handQ = lowerQ.clone().invert().multiply(handChest);
    if (![upperQ,elbowQ,handQ].every(finite)) return fail('nonfinite-solve');
    arm.quaternion.copy(upperQ); elbow.quaternion.copy(elbowQ); hand.quaternion.copy(handQ);
    root.updateWorldMatrix(true,true);
    const actualGrip = handLocal.clone().applyMatrix4(hand.matrixWorld);
    const actualBase = actualGrip.clone().sub(gripLocal.clone().applyMatrix4(rotationWorld));
    const rigidWorld = rotationWorld.clone().setPosition(actualBase);
    staff.matrix.multiplyMatrices(rootInverse,rigidWorld);
    staff.matrixWorldNeedsUpdate=true; staff.visible=true; staff.updateWorldMatrix(false,true);
    const actualElbow = elbow.getWorldPosition(new Vector3()).applyMatrix4(chestInverse);
    const actualWrist = hand.getWorldPosition(new Vector3()).applyMatrix4(chestInverse);
    return { ok:true, gripResidualMetres:actualGrip.distanceTo(targetGrip), groundResidualMetres:actualBase.y-baseWorld.y,
      upperLengthMetres:actualElbow.distanceTo(arm.position), lowerLengthMetres:actualWrist.distanceTo(actualElbow), reachMetres:solved.reach };
  }
  return { staff, update, dispose() { if (!disposed) { staff.removeFromParent(); disposed=true; } } };
}
