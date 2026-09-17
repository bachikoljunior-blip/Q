// Read-only native rig measurements + author design tables. No new mesh, source patch or game import.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import path from 'node:path';
const out=path.dirname(fileURLToPath(import.meta.url));
const repo=process.argv[2]||'/workspace/scratch/e72662e3b71f/Q-mira-references-v64';
const began=new Date().toISOString();
const T=await import(pathToFileURL(path.join(repo,'node_modules/three/build/three.module.js')));
const {createDetailedActor}=await import(pathToFileURL(path.join(repo,'src/actor-models.js')));
const {groundAt,heightAt}=await import(pathToFileURL(path.join(repo,'src/core.js')));
const {makeMiraStaff}=await import(pathToFileURL(path.join(repo,'review/staff-v63/assembly.mjs')));
const {STAFF_SPEC}=await import(pathToFileURL(path.join(repo,'review/staff-v63/staff-parts.mjs')));
const V=(...a)=>new T.Vector3(...a),mm=v=>v.toArray().map(x=>x*1000),arr=v=>v.toArray();
const hash=f=>createHash('sha256').update(readFileSync(path.join(repo,f))).digest('hex');
const sourceFiles=['src/actor-models.js','src/assets/characters/detailed-geometry.js','src/scene.js','src/core.js','src/character-motion.js','review/staff-v63/staff-parts.mjs','review/staff-v63/assembly.mjs','review/lantern-v63/lantern-head.js'];
const before=Object.fromEntries(sourceFiles.map(f=>[f,hash(f)]));
const write=(name,data)=>writeFileSync(path.join(out,name),JSON.stringify(data,null,2)+'\n');
const names=['body','pelvis','spine','chest','arm-0','elbow-0','hand-0','arm-1','elbow-1','hand-1','staff'];
function capture(a){a.g.updateMatrixWorld(true);const inverse=a.g.matrixWorld.clone().invert();return Object.fromEntries(names.map(name=>{const n=a.g.getObjectByName(name);return[name,{parent:n.parent.name,localPositionMm:mm(n.position),localQuaternion:arr(n.quaternion),actorPositionMm:mm(n.getWorldPosition(V()).applyMatrix4(inverse)),worldPositionMetres:arr(n.getWorldPosition(V())),actorMatrix:new T.Matrix4().multiplyMatrices(inverse,n.matrixWorld).toArray()}];}));}
const native=[];let bind=[];
for(const mode of ['flat-actor','actual-scene'])for(const time of[0,1.5,3]){
 const a=createDetailedActor('npc',mode==='actual-scene'?{groundHeight:groundAt}:{});
 if(!bind.length)bind=a.rest.map(r=>({name:r.node.name,parent:r.node.parent.name,positionMm:mm(r.position),quaternion:arr(new T.Quaternion().setFromEuler(r.rotation)),scale:arr(r.scale)}));
 if(mode==='actual-scene'){a.g.position.set(7,heightAt(7,80),80);a.g.rotation.y=1.4;}
 a.time=time;a.animate({moving:false},0);const bones=capture(a);
 const staff=a.g.getObjectByName('staff'),axis=V(0,1,0).transformDirection(staff.matrixWorld);
 native.push({mode,time,rootMatrix:a.g.matrixWorld.toArray(),rootScale:a.g.scale.toArray(),boneCount:a.rest.length,bones,
  upperLengthsMm:a.arms.map((n,i)=>n.getWorldPosition(V()).distanceTo(a.elbows[i].getWorldPosition(V()))*1000),
  lowerLengthsMm:a.elbows.map((n,i)=>n.getWorldPosition(V()).distanceTo(a.hands[i].getWorldPosition(V()))*1000),
  staffParent:staff.parent.name,oldStaffAxisWorld:arr(axis),oldStaffTiltDegrees:axis.angleTo(V(0,1,0))*180/Math.PI,
  digits:a.digits.map((hand,side)=>hand.map((d,index)=>({side,index,rootLocalMm:mm(d.root.position),rootEuler:arr(d.root.rotation),tipLocalMm:mm(d.tip.position),tipEuler:arr(d.tip.rotation)})))});
}
const flat=native.find(n=>n.mode==='flat-actor'&&n.time===0);
const upper=.33,lower=.31,theta=Math.PI/6;
const radial=V(0,1,0),distal=V(-Math.sin(theta),0,Math.cos(theta)),proximal=distal.clone().negate(),dorsal=new T.Vector3().crossVectors(radial,proximal);
const handRotation=new T.Matrix4().makeBasis(radial,proximal,dorsal),handQ=new T.Quaternion().setFromRotationMatrix(handRotation);
const staffOffset=V(-.46,0,.22),gripLocal=V(0,1.135,0),gripHand=V(0,-.074,-.044);
function solve(s,w,poleHint){
 const delta=w.clone().sub(s),distance=delta.length(),direction=delta.clone().normalize();
 if(distance>=upper+lower||distance<=Math.abs(upper-lower))throw Error('Unreachable author wrist');
 const pole=poleHint.clone().addScaledVector(direction,-poleHint.dot(direction)).normalize();
 const along=(upper*upper-lower*lower+distance*distance)/(2*distance),h=Math.sqrt(upper*upper-along*along);
 const e=s.clone().addScaledVector(direction,along).addScaledVector(pole,h),forearm=w.clone().sub(e).normalize();
 return {shoulder:s,elbow:e,wrist:w,distance,pole,forearm,
  upperResidualMm:1000*Math.abs(s.distanceTo(e)-upper),lowerResidualMm:1000*Math.abs(e.distanceTo(w)-lower),
  elbowFlexDegrees:Math.acos((distance*distance-upper*upper-lower*lower)/(2*upper*lower))*180/Math.PI,
  wristLongAxisDegrees:forearm.angleTo(distal)*180/Math.PI};
}
const designs=[];
for(const n of native){
 const root=new T.Matrix4().fromArray(n.rootMatrix),inv=root.clone().invert();
 const origin=staffOffset.clone(),worldXZ=origin.clone().applyMatrix4(root);
 if(n.mode==='actual-scene')origin.y=groundAt(worldXZ.x,worldXZ.z)-new T.Vector3().setFromMatrixPosition(root).y;
 const grip=origin.clone().add(gripLocal),w=grip.clone().sub(gripHand.clone().applyMatrix4(handRotation));
 const shoulder=new T.Vector3(...n.bones['arm-0'].actorPositionMm.map(x=>x/1000));
 // Local bone lengths are fixed. The existing breathing chest scale is nonuniform,
 // so an actor/world-space constant-length solve would not retain the real rig contract.
 const chest=new T.Matrix4().fromArray(n.bones.chest.actorMatrix),chestInverse=chest.clone().invert();
 const solution=solve(shoulder.clone().applyMatrix4(chestInverse),w.clone().applyMatrix4(chestInverse),V(.3,-1,-1).transformDirection(chestInverse));
 const elbowActor=solution.elbow.clone().applyMatrix4(chest);
 const hand=new T.Matrix4().compose(w,handQ,V(1,1,1)),staff=new T.Matrix4().makeTranslation(...arr(origin));
 const staffInHand=hand.clone().invert().multiply(staff);
 const nGrip=gripLocal.clone().applyMatrix4(staffInHand);
 designs.push({mode:n.mode,time:n.time,staffActorMatrix:staff.toArray(),handActorMatrix:hand.toArray(),staffInRightHandMatrix:staffInHand.toArray(),
  gripInHandMm:mm(nGrip),gripRegistrationResidualMm:nGrip.distanceTo(gripHand)*1000,
  staffOriginActorMm:mm(origin),gripActorMm:mm(grip),shoulderActorMm:mm(shoulder),elbowActorMm:mm(elbowActor),wristActorMm:mm(w),
  elbowChestMm:mm(solution.elbow),wristChestMm:mm(solution.wrist),
  solvedFrame:'chest local; retains 330/310mm local translations despite pre-existing breathing Z scale',
  upperResidualMm:solution.upperResidualMm,lowerResidualMm:solution.lowerResidualMm,reachMm:solution.distance*1000,
  reachLimitMm:[20,640],elbowFlexDegrees:solution.elbowFlexDegrees,wristLongAxisDegrees:w.clone().sub(elbowActor).angleTo(distal)*180/Math.PI,
  actorUpperLengthMm:shoulder.distanceTo(elbowActor)*1000,actorLowerLengthMm:elbowActor.distanceTo(w)*1000,
  elbowPole:arr(solution.pole),staffWorldBaseMetres:arr(origin.clone().applyMatrix4(root)),staffWorldTopMetres:arr(origin.clone().add(V(0,1.7,0)).applyMatrix4(root)),
  rightWristWorldMetres:arr(w.clone().applyMatrix4(root)),
  worldFrameRoundTripResidualMm:w.clone().applyMatrix4(root).applyMatrix4(inv).distanceTo(w)*1000});
}

// Measure the existing 19-part native staff; no geometry edits or new primitive construction.
const staff=makeMiraStaff();staff.updateMatrixWorld(true);
const parts=staff.children.map(m=>{m.geometry.computeBoundingBox();return{id:m.name,triangles:m.geometry.index.count/3,min:arr(m.geometry.boundingBox.min),max:arr(m.geometry.boundingBox.max)};});
const gripMeshes=staff.children.filter(m=>['S04','S05-A','S05-B'].includes(m.name)),scratch=[V(),V(),V()],p=V();
function surfaceRadius(y,angle){const ray=new T.Ray(V(0,y,0),V(Math.sin(angle),0,Math.cos(angle)));let r=-Infinity,part=null;
 for(const mesh of gripMeshes){const g=mesh.geometry,a=g.attributes.position,ix=g.index;for(let k=0;k<ix.count;k+=3){for(let j=0;j<3;j++)scratch[j].fromBufferAttribute(a,ix.getX(k+j)).applyMatrix4(mesh.matrixWorld);if(ray.intersectTriangle(...scratch,false,p)){const d=p.distanceTo(ray.origin);if(d>r){r=d;part=mesh.name;}}}}
 if(!Number.isFinite(r))throw Error('Grip radial surface missing');return {radiusMm:r*1000,part};}
const gripSections=[1.10,1.124,1.135,1.146,1.168,1.20].map(y=>({staffYmm:y*1000,samples:Array.from({length:32},(_,i)=>({angleRadians:i*Math.PI/16,...surfaceRadius(y,i*Math.PI/16)}))}));

// Design samples only: these arrays are not triangulated or attached to any actor.
function ring(y,rx,rz,slope=null){return Array.from({length:33},(_,i)=>{const a=(i%32)*Math.PI/16;return {sample:i,t:i/32,pointHandMm:[rx*Math.sin(a),y,rz*Math.cos(a)],
  tangentHand:arr(V(rx*Math.cos(a),0,-rz*Math.sin(a)).normalize()),
  sharedSkinNormalHand:slope===null?null:arr(V(rz*Math.sin(a),-slope*rz*Math.sin(a)**2,rx*Math.cos(a)).normalize()),
  skinWeights:{hand:1}};});}
const distalWrist=ring(-15,32,24,-1/6),proximalWrist=ring(9,28,24,-1/6),cuffInner=ring(6,31.5,27),cuffOuter=ring(6,35.5,31);
const loops={AH10_DISTAL:distalWrist,AH10_PROXIMAL:proximalWrist,CUFF_WRIST_INNER:cuffInner,CUFF_WRIST_OUTER:cuffOuter};
const leftLoops=Object.fromEntries(Object.entries(loops).map(([id,points])=>[id,points.map(p=>({...p,pointHandMm:p.pointHandMm.map((v,k)=>k===0?-v:v),tangentHand:p.tangentHand.map((v,k)=>k===0?-v:v),sharedSkinNormalHand:p.sharedSkinNormalHand?.map((v,k)=>k===0?-v:v)??null}))]));
const skinAtCuff={yMm:6,rxMm:28.5,rzMm:24};
const arcs={AH02:[28,29,30,31,0,1,2,3,4],AH03:[4,5,6,7,8,9,10,11,12],AH01:[12,13,14,15,16,17,18,19,20],AH04:[20,21,22,23,24,25,26,27,28]};
const seams=[];
for(const [side,index] of[['R',0],['L',1]])for(const [part,samples]of Object.entries(arcs))seams.push({id:`${side}.${part}:AH10`,typeKeys:[`hands:${part}`,'hands:AH10'],loop:'AH10_DISTAL',samples,
 neighbourTraversal:'reverse this list on the adjacent chart to keep oriented boundary cancellation',
 commonBone:`hand-${index}`,commonWeight:1,positionPolicy:'same coordinate values, not independently rounded copies',normalPolicy:'one common tangent/normal at assembly; no duplicated thick edge',status:'author proposal, no surface mesh assembled'});
const digitPlan=JSON.parse(readFileSync(path.join(out,'../accessory-reference-set/TYPE_REFERENCE_COVERAGE.json')));
const digitRegistration=digitPlan.instances.filter(i=>['AH06','AH07','AH08','AH05','AH09'].includes(i.type));
const digitLoops=[];
const smooth=x=>{x=Math.min(1,Math.max(0,x));return x*x*(3-2*x);};
for(const side of['R','L'])for(const digit of['index','middle','ring','little','thumb']){
 const instance=digitRegistration.find(p=>p.id===`${side}-${digit}-proximal`),p=instance.placement,thumb=digit==='thumb';
 const L=p.target_digit_length_mm,pivot=p.old_chain_length_mm*.5,width=L*.3;
 const jointRows=thumb?[['MCP',0,14,14.7],['IP',L*.51,13.3,13.8]]:[['MCP',0,10.5,11.0],['PIP',L*.44,10.5,11.0],['DIP',L*.75,9.45,9.975]];
 for(const [joint,s,rx,rz]of jointRows){const wt=smooth(.5+(s-pivot)/width);
  digitLoops.push({id:`${side}.${joint}.${digit}.loop`,frame:'existing digit-root bind local, millimetres',
   sourceRootBone:instance.bone[0],sourceTipBone:instance.bone[1],rootPositionHandMm:p.old_root_hand_mm,
   nativeBonePivotMm:pivot,authorDigitLengthMm:L,authorArclengthMm:s,
   typeBoundary:joint==='MCP'?['AH01/AH02/AH05/AH09','AH06']:joint==='PIP'?['AH06-proximal','AH06-middle']:['AH06','AH07'],
   requiredSharedWeights:{[instance.bone[0]]:1-wt,[instance.bone[1]]:wt},
   samples:Array.from({length:17},(_,i)=>{const a=(i%16)*Math.PI/8;return{sample:i,positionRootMm:[rx*Math.sin(a),-s,rz*Math.cos(a)]};}),
   status:joint==='MCP'?'Digit-side loop proposal only; matching palm/web port curve and hand/root blend collar unresolved.':'Open-pose shared-loop proposal; no posed grasp or independent PIP/DIP bone is supplied.'});
 }
}
const primary=designs[0],w=V(...primary.wristActorMm.map(v=>v/1000)),e=V(...primary.elbowActorMm.map(v=>v/1000)),forearmProx=e.clone().sub(w).normalize();
const cuffStations=[{distanceFromWristMm:6,frame:'hand orientation',innerRxMm:31.5,innerRzMm:27,outerRxMm:35.5,outerRzMm:31,handWeight:1},
 {distanceFromWristMm:36,frame:'continuous transport toward forearm frame',innerRxMm:35,innerRzMm:30,outerRxMm:39,outerRzMm:34,handWeight:.5},
 {distanceFromWristMm:66,frame:'forearm orientation',innerRxMm:39,innerRzMm:34,outerRxMm:43,outerRzMm:38,handWeight:0},
 {distanceFromWristMm:200,frame:'forearm orientation',innerRxMm:51,innerRzMm:43,outerRxMm:55,outerRzMm:47,handWeight:0}];
write('RIG_MEASUREMENTS.json',{basis:'actual imported source / native bones, not rendered pixels',sourceHashes:before,bind,native,staff:{spec:STAFF_SPEC,parts,gripSections}});
write('AUTHOR_REGISTRATION.json',{status:'Numerical registration proposal only; no new 3D, no assembly acceptance',units:'mm unless matrix/metres explicitly named',
 frames:{actor:'X right on front image; anatomical R=-X/L=+X, Y up, Z front; metres',hand:'-Y distal, +X radial/thumb for R, +Z dorsal; L uses anatomical counterpart, not an improper mirrored matrix',staff:'Y upright from ground tip, 0..1700 mm; X/Z cross-section'},
 staffProposal:{originFlatActorMm:mm(staffOffset),gripStaffMm:[0,1135,0],gripRangeMm:[1030,1240],rationale:'Author registration: grip within existing leather centre, staff grounded and outside R torso; image gives standing/upward axis and right-hand ownership, not exact millimetres.',scale:1,partCount:19},
 rightHandProposal:{gripHandMm:mm(gripHand),radial:arr(radial),distal:arr(distal),dorsal:arr(dorsal),quaternion:arr(handQ),determinant:handRotation.determinant(),
  rationale:'30 degrees outward from actor forward permits near-collinear forearm/hand axis with original local 330/310 mm arm segments. Earlier 90-degree sideways placement would require a large wrist bend and is not selected. Palmar offset revised40→44mm because the measured wrap envelope reaches27.574mm, versus legacy palm palmar surface z=-14.5mm at hand y=-74mm;44mm leaves about1.9mm conservative envelope space, not an actual skin-contact acceptance.'},
 designs,loops,seams,skinAtCuff,sideSpecificLoops:{R:loops,L:leftLoops},
 counterpartRule:'Loops are parameterised dorsal→radial. L explicitly changes local X sign so AH03 stays thumb-side. A future L surface must reverse triangle winding/tangent handedness after reflection; these are coordinate tables, not a negative-scale runtime object.',
 cuff:{ownerTypes:['cloth:F01','cloth:F02'],wrapOwner:'cloth:F03',upstreamSleeve:['cloth:S05','cloth:S06'],
  stations:cuffStations,upperCentreFlatActorMm:mm(w.clone().addScaledVector(forearmProx,.2)),
  framePolicy:'At WRIST use the exact hand frame; transport orientation toward forearm over 6..66mm. New surface/weights not implemented.',
  pairedEdges:'F01 and F02 share side curves at each station; front/back is actor-projected front, not blindly hand +Z after wrist rotation.',
  weightPolicy:'Skin AH01–AH04/AH10 retains hand=1. Cuff hand weight 1 at6mm, smoothstep to elbow=1 by66mm; F01/F02 and F03 use identical values on shared edges. UV may split, position/normal/weights may not.',
  clearance:'At y=6mm the old skin ellipse is 28.5x24mm, proposed cuff aperture31.5x27mm: 3mm radial-axis allowance. This is not a posed mesh clearance test.'},
 digitRegistration,digitLoops,
 digitWeights:{sourcePolicy:'Existing two-bone root/tip chain; no independent third phalanx joint added.',
  proposal:'For arclength s and proposed geometry length L, preserve the actual native root→tip bone pivot p=old chain length/2. Use tipWeight=smoothstep(clamp(.5+(s-p)/(.30*L))); rootWeight=1-tipWeight. Geometry segment proportions do not move the bone. Same values at AH06/AH07 shared loops. Distal nail uses the same bed weights; no disconnected rigid transform.',
  MCP:'Blend hand/root across a common attachment collar only after AH01/AH02/AH05/AH09 digit ports are fixed. Width is unchosen, not proven by images.',
  grip:'Desired centreline contact and actual S04/S05 radial sections are supplied; per-digit joint curl/contact angles and skin compression remain unsolved. Old common .92/.7912 curls are not accepted as a solved grasp.'},
 attachmentPolicy:'Staff stays an unscaled rigid actor-root attachment driven from the registered right-hand point; do not inherit the chest breathing nonuniform scale into the19 precise parts. The table hand matrix is an ideal target frame, not a verified realised bone matrix. A future wrist/forearm solve and renderer attachment must reconcile actual inherited shear before acceptance; no scale edits or new solver are supplied here.',
 leftHand:{policy:'Keep actual hand-1 idle transform as relaxed registration. Remove its old held-staff semantic only in a later authorised rig unit; no animation edit here.',
  note:'Right-hand rotation is not copied onto left; its AH10 loops stay local to hand-1 with counterpart radial side and proper winding.'},
 unresolved:['AH07/AH08 nail-seat visual ownership','AH01/AH03/AH09 common digit-port curves','per-digit grip surface contact and collision','cuff/skin/cloth pose clearance and cloth weights','standing terrain staff support lifecycle','actual game render and device cost']});
for(const f of sourceFiles)if(hash(f)!==before[f])throw Error('Source changed during measurement: '+f);
write('RUN.json',{began,ended:new Date().toISOString(),sourceReadbackUnchanged:true,newAuthorShapes:0,
 existingNativeConstructorsUsed:['createDetailedActor(npc)','makeMiraStaff'],sourceWrites:0,renderedFrames:0,pendingCalls:0,
 checks:{originalArmLengthsRetained:designs.every(d=>d.upperResidualMm<1e-8&&d.lowerResidualMm<1e-8),rigidGripPointRegistration:designs.every(d=>d.gripRegistrationResidualMm<1e-8),rightHandBasisDeterminant:handRotation.determinant(),all19StaffParts:parts.length===19},
 disclaimer:'These are coordinate and bone-length checks. They are not skin contact, pose naturalness, complete hand/cuff assembly or rendered quality tests.'});
console.log(JSON.stringify({flat:primary,actualScene:designs.find(d=>d.mode==='actual-scene'&&d.time===0),nativeBoneCount:flat.boneCount,gripRadiusRangeMm:[Math.min(...gripSections.flatMap(s=>s.samples.map(x=>x.radiusMm))),Math.max(...gripSections.flatMap(s=>s.samples.map(x=>x.radiusMm)))],sourceUnchanged:true}));
