import test from 'node:test';
import assert from 'node:assert/strict';
import {makeLanternHead,HEAD_SPEC} from '../review/lantern-v63/lantern-head.js';
import {inspectHead,horizontalContact,sharedSurface} from '../review/lantern-v63/inspect-head.js';
import {properCrossings} from '../review/lantern-micro-v62/inspect-ribs.js';
import {makeMiraLanternPartial,disposeMiraLanternPartial} from '../review/lantern-micro-v62/mira-lantern-ribs.js';
import {externalJoins} from '../review/lantern-v63/compare-head.js';
import {makeStaffLower} from '../docs/evidence/mira-lantern-v63/parent-boundary-snapshot/staff-parts.mjs';

test('nine head-core parts are closed, consistently oriented solids and have no proper crossings',()=>{
  const a=makeLanternHead(),r=inspectHead(a);
  assert.equal(r.parts.length,9);assert.equal(r.counts.triangles,5712);
  for(const p of r.parts){assert.equal(p.nonfinite,0,p.id);assert.equal(p.openOrNonmanifoldEdges,0,p.id);assert.equal(p.badWindingEdges,0,p.id);assert(p.signedVolumeMm3>0,p.id);assert(p.minVertexNormalFaceDot>0,p.id);assert(p.minAreaMm2>.25,p.id);}
  assert(r.crossings.every(p=>p.properTrianglePairs===0));assert.equal(a.userData.gameImported,false);
  assert(r.oldEnvelope.minNormalizedRadius<1,'old cap / original ellipsoid problem remains a visible negative baseline');
  disposeMiraLanternPartial(a);
});

test('upper/lower pads and cup/ring/glass receivers have real face contact',()=>{
  const a=makeLanternHead(),r=inspectHead(a);
  for(const c of r.horizontalContacts.slice(0,8))assert(Math.abs(c.contactAreaMm2-23.92)<1e-4);
  assert(r.horizontalContacts[8].contactAreaMm2>348);assert(r.horizontalContacts[9].contactAreaMm2>348);
  assert(r.horizontalContacts[10].contactAreaMm2>147);
  assert.equal(r.glassCradle.coincidentTriangles,160);assert(r.glassCradle.contactAreaMm2>166);assert(r.glassCradle.maxNormalDot<-.99999);
  a.getObjectByName('S07').position.y-=.001;a.updateMatrixWorld(true);
  assert.equal(sharedSurface(a.getObjectByName('S07'),a.getObjectByName('S16')).coincidentTriangles,0,'one millimetre separated cradle must fail');
  assert.equal(horizontalContact(a.getObjectByName('S07'),a.getObjectByName('S08'),1441).contactAreaMm2,0);
  disposeMiraLanternPartial(a);
});

test('the actual closed glass stays clear of revised cap, while one millimetre uplift is detected',()=>{
  const a=makeLanternHead();a.updateMatrixWorld(true);const glass=a.getObjectByName('S16'),cap=a.getObjectByName('S14');
  assert.equal(properCrossings(glass,cap).properTrianglePairs,0);
  glass.position.y+=.001;a.updateMatrixWorld(true);assert(properCrossings(glass,cap).properTrianglePairs>0);
  const color=glass.geometry.attributes.color;assert([...color.array].every(Number.isFinite));assert(Math.max(...color.array)-Math.min(...color.array)>.1);
  assert(glass.material.isMeshPhysicalMaterial);assert(glass.material.transmission>0);assert(glass.material.emissiveIntensity>0);assert.equal(glass.material.map,null);
  disposeMiraLanternPartial(a);
});

test('original four ribs and upper ring remain byte-identical; disposal owns each shared resource once',()=>{
  const old=makeMiraLanternPartial(),a=makeLanternHead();
  for(const id of ['S09','S10','S11','S12','S13']){
    const x=old.getObjectByName(id),y=a.getObjectByName(id);assert.deepEqual(x.geometry.index.array,y.geometry.index.array);
    for(const name of Object.keys(x.geometry.attributes))assert.deepEqual(x.geometry.attributes[name].array,y.geometry.attributes[name].array,id+'/'+name);
    assert.deepEqual(x.position.toArray(),y.position.toArray());assert.deepEqual(x.quaternion.toArray(),y.quaternion.toArray());
  }
  const gs=new Set(a.children.map(m=>m.geometry)),ms=new Set(a.children.map(m=>m.material));let gd=0,md=0;
  for(const g of gs)g.addEventListener('dispose',()=>gd++);for(const m of ms)m.addEventListener('dispose',()=>md++);
  disposeMiraLanternPartial(a);disposeMiraLanternPartial(a);assert.equal(gd,7);assert.equal(md,2);disposeMiraLanternPartial(old);
});

test('authored S06 and S15 boundary preserves shaft and ball dimensions without claiming their mesh integration',()=>{
  assert.equal(HEAD_SPEC.cupBottomY,1423);assert.deepEqual(HEAD_SPEC.cupBottomBand,[6.3,10]);
  assert.equal(HEAD_SPEC.finialStemSeatY,1674);
  const polygonFactor=Math.cos(Math.PI/16),stemClearance=6.3*polygonFactor-6;
  const ballRadiusAtTop=Math.sqrt(12**2-(1688-1678)**2),mouthClearance=6.8*polygonFactor-ballRadiusAtTop;
  assert(stemClearance>.17);assert(mouthClearance>.03);
  // On the short upper bevel the spherical radius slope exceeds the hole's
  // linear slope, so minimum clearance is at the top, not between samples.
  assert((1688-1678)/ballRadiusAtTop>(6.8-6.3)/.75*polygonFactor);
});

test('paired 16-angle glass/cradle reduces triangles while keeping the actual shared contacts',()=>{
  const a=makeLanternHead({glassSegments:16}),r=inspectHead(a);
  assert.equal(r.counts.triangles,4240);assert.equal(r.counts.uniqueBufferBytes,141688);
  for(const p of r.parts){assert.equal(p.openOrNonmanifoldEdges,0);assert.equal(p.badWindingEdges,0);assert(p.minVertexNormalFaceDot>0);assert(p.minAreaMm2>0);}
  assert(r.crossings.every(p=>p.properTrianglePairs===0));
  for(const c of r.horizontalContacts.slice(0,8))assert(Math.abs(c.contactAreaMm2-23.92)<1e-4);
  for(const c of r.horizontalContacts.slice(8))assert(c.contactAreaMm2>140);
  assert.equal(r.glassCradle.coincidentTriangles,80);assert(r.glassCradle.contactAreaMm2>163);assert(r.glassCradle.maxNormalDot<-.99999);
  disposeMiraLanternPartial(a);
});

test('actual parent S06/S15 snapshot contacts the candidate; displaced finial fails without hiding Float32 gaps',()=>{
  const a=makeLanternHead({glassSegments:16}),staff=makeStaffLower(),r=externalJoins(a,staff);
  for(const c of r.contacts){assert(Math.abs(c.contactAreaMm2-c.downAreaMm2)<1e-6);assert(c.downAreaMm2>110);assert(Math.abs(c.upLevelsMm[0]-c.downLevelsMm[0])<.0001);}
  assert(r.crossings.every(p=>p.properTrianglePairs===0));
  staff.getObjectByName('S15').position.y+=.001;assert.equal(externalJoins(a,staff).contacts[1].contactAreaMm2,0);
  disposeMiraLanternPartial(a);disposeMiraLanternPartial(staff);
});
