import { createDetailedActor } from './actor-models.js';
import { makeMiraStaffBatch } from '../review/staff-batch-v64/staff-batch.mjs';
import { createStaffAttachment } from '../review/staff-attachment-v65/attachment.mjs';

/** Adopt the saved rigid staff on the stationary village keeper only.
 * Shape, materials and registration are the preserved candidates. This does
 * not adopt the incomplete head, clothing, hands or whole-character assembly.
 */
export function createMiraKeeper(options={}) {
  const actor=createDetailedActor('npc',{...options,omitKeeperStaff:true});
  const batch=makeMiraStaffBatch();
  let attachment;
  try { attachment=createStaffAttachment(actor,{staff:batch.group}); }
  catch(error) { batch.dispose();throw error; }
  const animate=actor.animate;
  const fingerRest=actor.digits.map(hand=>hand.map(({root})=>actor.rest.find(r=>r.node===root).rotation.x));
  actor.staffHandIndex=0;
  actor.staff=batch.group;
  actor.staff.userData={...actor.staff.userData,sourceOnly:false,gameImported:true,
    handAttachment:'stationary keeper right hand',materialAcceptance:false};
  actor.staff.traverse(n=>{if(n.isMesh)n.userData.sourceOnly=false;});
  batch.manifest.gameImported=true;
  actor.staffManifest=batch.manifest;
  actor.staffStatus={ok:false,reason:'not-yet-placed'};
  actor.staff.visible=false;
  let disposed=false;
  actor.animate=(state={},dt=0)=>{
    const motion=animate(state,dt);
    // The game keeper is stationary and immortal. Do not apply a standing IK
    // pose to unrelated walking/combat/death states if future callers add them.
    if(disposed||motion.state!=='idle') {
      actor.staff.visible=false;
      actor.staffStatus={ok:false,reason:disposed?'disposed':'unsupported-motion'};
    } else {
      actor.staffStatus=attachment.update();
      if(actor.staffStatus.ok) {
        // Release the old left-hand carry pose only on this stationary keeper.
        // These are the existing idle/finger poses, not newly authored geometry.
        actor.arms[1].rotation.x=-.055;actor.elbows[1].rotation.x=-.19;
        actor.digits.forEach((hand,side)=>hand.forEach(({root,tip},finger)=>{
          const curl=side===0?.92:.18;
          root.rotation.x=fingerRest[side][finger]+(finger===4?.6:1)*curl;tip.rotation.x=curl*.86;
        }));
        actor.g.updateWorldMatrix(true,true);
      }
    }
    return motion;
  };
  // Only per-instance equipment and cape are owned here. Shared actor skins,
  // textures and materials belong to the existing geometry cache.
  actor.dispose=()=>{
    if(disposed)return;
    disposed=true;attachment.dispose();batch.dispose();actor.cape?.geometry.dispose();
  };
  return actor;
}
