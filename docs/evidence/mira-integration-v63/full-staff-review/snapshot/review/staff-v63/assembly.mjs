import {makeStaffLower} from './staff-parts.mjs';
import {makeLanternHead} from '../lantern-v63/lantern-head.js';

/** Authored metric assembly of all 18 staff part IDs / 19 instances.
 * This is source-only: no hand rig, material or game-view acceptance. */
export function makeMiraStaff(){
  const staff=makeStaffLower(),head=makeLanternHead({glassSegments:16});
  for(const mesh of [...head.children])staff.add(mesh);
  staff.name='Mira staff v63 all component placements';
  staff.userData={sourceOnly:true,gameImported:false,geometricPartsPresent:true,
    materialAcceptance:false,handAttachment:false,units:'metres',
    referenceAcceptance:'conditional views plus explicitly authored exact interfaces'};
  staff.updateMatrixWorld(true);return staff;
}
