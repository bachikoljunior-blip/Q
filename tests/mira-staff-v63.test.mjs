import test from 'node:test';
import assert from 'node:assert/strict';
import {makeMiraStaff} from '../review/staff-v63/assembly.mjs';
import {makeWrapBlank} from '../review/staff-v63/flat-wrap.mjs';
import {horizontalContact} from '../review/lantern-v63/inspect-head.js';
import {properCrossings} from '../review/lantern-micro-v62/inspect-ribs.js';
import {disposeMiraLanternPartial} from '../review/lantern-micro-v62/mira-lantern-ribs.js';

test('whole staff places each planned component once and seats wood/cup/finial on their actual receivers',()=>{
 const s=makeMiraStaff(),ids=s.children.map(m=>m.name);
 const expected=Array.from({length:18},(_,i)=>'S'+String(i+1).padStart(2,'0')).filter(id=>id!=='S05').concat(['S05-A','S05-B']);
 assert.deepEqual(ids.sort(),expected.sort());assert.equal(new Set(ids).size,19);
 for(const [up,down,y,min]of [['S03','S01',4,990],['S06','S07',1423,184],['S14','S15',1674,110]]){
   const c=horizontalContact(s.getObjectByName(up),s.getObjectByName(down),y,{planeToleranceMm:1e-4});
   assert(c.contactAreaMm2>min);assert(Math.abs(c.contactAreaMm2-c.downAreaMm2)<1e-5);
 }
 assert.equal(properCrossings(s.getObjectByName('S01'),s.getObjectByName('S02')).properTrianglePairs,0);
 const wood=s.getObjectByName('S01');wood.position.y+=.001;s.updateMatrixWorld(true);
 assert.equal(horizontalContact(s.getObjectByName('S03'),wood,4).contactAreaMm2,0,'unsupported foot must be detected');
 assert.equal(s.userData.gameImported,false);disposeMiraLanternPartial(s);
});

test('two blank instances retain physical width and thickness; winding is not certified inextensible',()=>{
 for(const id of ['S05-A','S05-B']){
   const g=makeWrapBlank(id),b=g.boundingBox;
   assert(Math.abs((b.max.x-b.min.x)*1000-8)<1e-5);assert(Math.abs((b.max.z-b.min.z)*1000-1.5)<1e-5);
   assert(g.userData.lengthMm>340&&g.userData.lengthMm<360);
   assert.equal(g.userData.physicalStrainAcceptance,false);
   assert(g.userData.formedEdgeRatio[0]<1&&g.userData.formedEdgeRatio[1]>1);g.dispose();
 }
});
