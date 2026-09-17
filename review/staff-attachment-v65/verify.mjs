import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { Group, Matrix4, Quaternion, Vector3 } from 'three';
import { createDetailedActor } from '../../src/actor-models.js';
import { groundAt, heightAt } from '../../src/core.js';
import { createStaffAttachment, STAFF_REGISTRATION } from './attachment.mjs';

const V=(...v)=>new Vector3(...v), UNIT=V(1,1,1);
function hashGeometry(staff) {
  const hash=createHash('sha256');
  for(const part of staff.children) {
    hash.update(part.name);
    for(const a of [...Object.values(part.geometry.attributes),part.geometry.index].filter(Boolean)) hash.update(Buffer.from(a.array.buffer,a.array.byteOffset,a.array.byteLength));
  }
  return hash.digest('hex');
}
function metrics(matrix) {
  const e=matrix.elements,x=V(e[0],e[1],e[2]),y=V(e[4],e[5],e[6]),z=V(e[8],e[9],e[10]);
  return {scaleError:Math.max(Math.abs(x.length()-1),Math.abs(y.length()-1),Math.abs(z.length()-1)),shear:Math.max(Math.abs(x.dot(y)),Math.abs(x.dot(z)),Math.abs(y.dot(z))),determinant:matrix.determinant()};
}
const curve=t=>Math.sin(t*1.75);
export function verifyAttachment() {
  const began=performance.now(),cases=[],summary={frames:0,partPlacements:0,maxGripResidualMm:0,maxLengthErrorMm:0,maxPartRigidError:0,maxRepeatedMatrixError:0,maxNaiveScaleError:0,maxNaiveShear:0};
  for(const name of ['flat','actual-scene','slope','parent-rotation','parent-nonuniform','root-nonuniform']) {
    const terrain=name==='actual-scene'?groundAt:name==='slope'?(x,z)=>.04*x-.025*z:()=>0;
    const actor=createDetailedActor('npc',{groundHeight:terrain}),parent=new Group(); parent.add(actor.g);
    if(name==='actual-scene'){actor.g.position.set(7,heightAt(7,80),80);actor.g.rotation.y=1.4;}
    if(name==='slope'){actor.g.position.set(3,terrain(3,4),4);actor.g.rotation.y=-.8;}
    if(name==='parent-rotation'){parent.rotation.set(.06,.7,-.04);actor.g.rotation.y=.9;}
    if(name==='parent-nonuniform'){parent.scale.set(1.12,.94,1.06);parent.rotation.set(.025,-.6,.02);actor.g.rotation.y=.8;}
    if(name==='root-nonuniform'){actor.g.scale.set(.93,1.04,1.09);actor.g.rotation.set(.02,.4,-.02);}
    const bones=actor.rest.map(r=>({node:r.node,position:r.node.position.toArray(),scale:r.node.scale.toArray(),restPosition:r.position.toArray(),restRotation:r.rotation.toArray(),restScale:r.scale.toArray()}));
    const adapter=createStaffAttachment(actor),staff=adapter.staff;
    assert.equal(staff.children.length,19);assert.equal(actor.rest.length,41);
    const originalGeometry=hashGeometry(staff),parts=staff.children.map(p=>({part:p,local:p.matrix.clone()}));
    let naiveBind;const row={name,frames:0,gripMaxMm:0,worldStaffLengthMetres:1.7,armLocalMetres:[.33,.31]};
    for(const time of [0,Math.PI/3.5,Math.PI/1.75,3*Math.PI/3.5,4*Math.PI/1.75,8.2]) {
      actor.time=time;
      // Do not update the parent manually: the adapter must refresh ancestors.
      actor.animate({moving:false},0);
      const scales=actor.rest.map(r=>r.node.scale.toArray()),translations=actor.rest.map(r=>r.node.position.toArray());
      const leftBefore=[actor.arms[1],actor.elbows[1],actor.hands[1]].map(n=>n.quaternion.toArray());
      const result=adapter.update();assert.equal(result.ok,true,`${name} at ${time}: ${result.reason}`);
      assert(Math.abs(actor.chest.scale.z-(1+curve(time)*.008))<1e-12,'preserve breathing');
      assert.deepEqual(actor.rest.map(r=>r.node.scale.toArray()),scales,'no bone scale compensation');
      assert.deepEqual(actor.rest.map(r=>r.node.position.toArray()),translations,'no bone translation edits');
      assert.deepEqual([actor.arms[1],actor.elbows[1],actor.hands[1]].map(n=>n.quaternion.toArray()),leftBefore);
      const actual=V(...STAFF_REGISTRATION.gripHand).applyMatrix4(actor.hands[0].matrixWorld);
      const grip=V(...STAFF_REGISTRATION.gripStaff).applyMatrix4(staff.matrixWorld);
      const bottom=V(0,0,0).applyMatrix4(staff.matrixWorld),top=V(0,1.7,0).applyMatrix4(staff.matrixWorld);
      const error=actual.distanceTo(grip)*1000,lengthError=Math.abs(bottom.distanceTo(top)-1.7)*1000;
      assert(error<1e-8,'actual hand point meets actual staff axis');
      assert(lengthError<1e-8,'staff remains 1.7 metric metres under nonuniform ancestors');
      assert(Math.abs(bottom.y-terrain(bottom.x,bottom.z))<1e-9,'grounded in world coordinates');
      assert(Math.abs(result.upperLengthMetres-.33)<1e-10&&Math.abs(result.lowerLengthMetres-.31)<1e-10,'original arm translations remain exact in chest frame');
      const rigid=metrics(staff.matrixWorld);assert(rigid.scaleError<1e-10&&rigid.shear<1e-10&&Math.abs(rigid.determinant-1)<1e-10);
      for(const {part,local} of parts) {
        const expected=staff.matrixWorld.clone().multiply(local);
        const difference=Math.max(...expected.elements.map((v,i)=>Math.abs(v-part.matrixWorld.elements[i])));
        assert(difference<1e-10,`${name} ${part.name} world placement`);
        // Compare metric basis to each part's original local matrix, including
        // any authored transform. This covers all 19 parts, not just staff root.
        for(const end of [V(1,0,0),V(0,1,0),V(0,0,1),V(1,1,1)]){
          const d0=end.clone().applyMatrix4(local).distanceTo(V().applyMatrix4(local));
          const d1=end.clone().applyMatrix4(part.matrixWorld).distanceTo(V().applyMatrix4(part.matrixWorld));
          summary.maxPartRigidError=Math.max(summary.maxPartRigidError,Math.abs(d0-d1));assert(Math.abs(d0-d1)<1e-10);
        }
        summary.partPlacements++;
      }
      // Same target under the real hand hierarchy: a constant bind attachment
      // reintroduces breathing/ancestor scale. It is an explicit control case.
      if(!naiveBind)naiveBind=actor.hands[0].matrixWorld.clone().invert().multiply(staff.matrixWorld);
      const naive=metrics(actor.hands[0].matrixWorld.clone().multiply(naiveBind));
      summary.maxNaiveScaleError=Math.max(summary.maxNaiveScaleError,naive.scaleError);
      summary.maxNaiveShear=Math.max(summary.maxNaiveShear,naive.shear);
      const before=staff.matrixWorld.toArray(),second=adapter.update();assert.equal(second.ok,true);
      const repeatError=Math.max(...before.map((v,i)=>Math.abs(v-staff.matrixWorld.elements[i])));assert(repeatError<1e-10,'repeated update cannot accumulate transforms');
      summary.maxRepeatedMatrixError=Math.max(summary.maxRepeatedMatrixError,repeatError);
      row.frames++;row.gripMaxMm=Math.max(row.gripMaxMm,result.gripResidualMetres*1000);
      summary.frames++;summary.maxGripResidualMm=Math.max(summary.maxGripResidualMm,result.gripResidualMetres*1000);summary.maxLengthErrorMm=Math.max(summary.maxLengthErrorMm,lengthError);
    }
    assert.equal(hashGeometry(staff),originalGeometry,'all original geometry bytes unchanged');
    for(let i=0;i<bones.length;i++){
      assert.equal(actor.rest[i].node,bones[i].node);assert.deepEqual(actor.rest[i].position.toArray(),bones[i].restPosition);assert.deepEqual(actor.rest[i].rotation.toArray(),bones[i].restRotation);assert.deepEqual(actor.rest[i].scale.toArray(),bones[i].restScale);
    }
    adapter.dispose();assert.equal(staff.parent,null);assert.equal(adapter.update().reason,'disposed');cases.push(row);
  }
  assert(summary.maxNaiveScaleError>1e-4,'control must expose inherited scale');
  return {evidence:'CPU world matrices and native bones/19 existing mesh parts. No WebGL image, grasp surface, animation-quality or device-performance acceptance.',cases,summary,verificationSeconds:(performance.now()-began)/1000};
}

export function verifyFailureRecovery() {
  const actor=createDetailedActor('npc');let y=0;
  const adapter=createStaffAttachment(actor,{groundHeight:()=>y});
  assert(adapter.update().ok);const before=[actor.arms[0],actor.elbows[0],actor.hands[0]].map(n=>n.quaternion.toArray());
  y=10;assert.equal(adapter.update().reason,'unreachable');assert.equal(adapter.staff.visible,false);assert.deepEqual([actor.arms[0],actor.elbows[0],actor.hands[0]].map(n=>n.quaternion.toArray()),before,'unreachable solve must not partially mutate arm');
  y=NaN;assert.equal(adapter.update().reason,'invalid-ground-height');
  y=0;assert(adapter.update().ok);assert.equal(adapter.staff.visible,true);
  actor.g.scale.y=0;assert.equal(adapter.update().reason,'singular-or-reflected-frame');
  actor.g.scale.y=-1;assert.equal(adapter.update().reason,'singular-or-reflected-frame');
  actor.g.scale.y=1;assert(adapter.update().ok);
  actor.hands[0].scale.x=1.1;assert.equal(adapter.update().reason,'unsupported-arm-scale');
  actor.hands[0].scale.x=1;assert(adapter.update().ok);
  for(const [node,field,key,value,reason] of [
    [actor.hands[0],'scale','x',NaN,'nonfinite-arm-transform'],
    [actor.elbows[0],'scale','z',NaN,'nonfinite-arm-transform'],
    [actor.hands[0],'position','y',NaN,'nonfinite-arm-transform'],
    [actor.hands[0],'position','y',-.36,'changed-arm-translations'],
    [actor.elbows[0],'position','x',.02,'changed-arm-translations'],
  ]){
    const old=node[field][key],rotations=[actor.arms[0],actor.elbows[0],actor.hands[0]].map(n=>n.quaternion.toArray());
    node[field][key]=value;assert.equal(adapter.update().reason,reason);assert.equal(adapter.staff.visible,false);
    assert.deepEqual([actor.arms[0],actor.elbows[0],actor.hands[0]].map(n=>n.quaternion.toArray()),rotations,'invalid chain must be rejected before rotation writes');
    node[field][key]=old;assert(adapter.update().ok);
  }
  adapter.dispose();
  return {unreachable:'no arm mutation, staff hidden',invalidTerrain:'staff hidden',singularReflection:'rejected',armScale:'rejected without overwriting scale',nonfiniteChain:'rejected before world propagation or rotation writes',changedTranslations:'rejected instead of reusing cached lengths',validAfterFailure:'recovered'};
}

if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){
  const result=verifyAttachment();result.failureRecovery=verifyFailureRecovery();
  const sources=['review/staff-attachment-v65/attachment.mjs','review/staff-v63/assembly.mjs','src/actor-models.js','src/assets/characters/detailed-geometry.js'];
  result.sourceHashes={};for(const file of sources)result.sourceHashes[file]=createHash('sha256').update(await readFile(new URL('../../'+file,import.meta.url))).digest('hex');
  const out=new URL('../../docs/evidence/mira-assembly-v65/staff-attachment/',import.meta.url);await mkdir(out,{recursive:true});
  await writeFile(new URL('VALIDATION.json',out),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
}
