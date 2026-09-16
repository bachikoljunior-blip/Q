import test from 'node:test';
import assert from 'node:assert/strict';
import {RIB_INSTANCES,makeMiraLanternPartial,disposeMiraLanternPartial} from '../review/lantern-micro-v62/mira-lantern-ribs.js';
import {inspectSolid,inspectLantern,seatContact,ellipsoidClearance} from '../review/lantern-micro-v62/inspect-ribs.js';

test('two integral flat rib types make four tracked placements with closed outward surfaces',()=>{
  const group=makeMiraLanternPartial(),report=inspectLantern(group);
  assert.deepEqual(group.children.map(m=>m.name),['S09','S10','S11','S12','S13','S14']);
  assert.deepEqual(RIB_INSTANCES.map(p=>p.side),['-X','+X','+Z','-Z']);
  assert.equal(group.children[0].geometry,group.children[1].geometry);
  assert.equal(group.children[2].geometry,group.children[3].geometry);
  assert.notEqual(group.children[0].geometry,group.children[2].geometry);
  for(const part of report.parts){
    assert.equal(part.nonfinite,0,part.id);assert.equal(part.openOrNonmanifoldEdges,0,part.id);assert.equal(part.badWindingEdges,0,part.id);
    assert(part.minAreaMm2>0.25,part.id);assert(part.signedVolumeMm3>0,part.id);assert(part.minVertexNormalFaceDot>0,part.id);
  }
  assert(report.crossings.every(p=>p.properTrianglePairs===0));
  assert.equal(report.counts.triangles,2352);assert.equal(report.counts.uniqueGeometries,4);assert.equal(report.counts.materials,1);
  assert.equal(group.userData.completeLantern,false);assert.equal(group.userData.gameImported,false);
  disposeMiraLanternPartial(group);
});

test('rib top faces contact actual 16 and 24 sided ring faces, not a circular radius proxy',()=>{
  for(const capSegments of [16,24]){
    const group=makeMiraLanternPartial({capSegments});group.updateMatrixWorld(true);
    for(const rib of group.children.slice(0,4)){
      const c=seatContact(rib,group.getObjectByName('S13'));
      assert(c.ribPlanarFaces>0);assert.equal(c.ringSeatFaces,capSegments*2);
      assert(Math.abs(c.faceAreaMm2-23.92)<1e-4);assert(Math.abs(c.coverage-1)<1e-8);assert(Math.abs(c.signedYGapMm)<1e-5);
    }
    const rib=group.children[0];rib.position.y+=.003;group.updateMatrixWorld(true);
    assert.equal(seatContact(rib,group.getObjectByName('S13')).coverage,0,'old Y1665 top cannot masquerade as seat contact');
    assert(Math.abs(seatContact(rib,group.getObjectByName('S13')).signedYGapMm)>2.99);
    disposeMiraLanternPartial(group);
  }
});

test('every native rib triangle clears the authored glow envelope; inward placement fails',()=>{
  const group=makeMiraLanternPartial();group.updateMatrixWorld(true);
  for(const rib of group.children.slice(0,4))assert(ellipsoidClearance(rib).minNormalizedRadius>1.01,rib.name);
  group.children[1].position.x-=.005;group.updateMatrixWorld(true);
  assert(ellipsoidClearance(group.children[1]).minNormalizedRadius<1,'inward five millimetres must be detected');
  disposeMiraLanternPartial(group);
});

test('crease normals preserve face orientation and resource disposal is shared exactly once',()=>{
  const group=makeMiraLanternPartial(),rib=group.children[0],normal=rib.geometry.attributes.normal;
  for(let i=0;i<normal.array.length;i++)normal.array[i]*=-1;
  assert(inspectSolid(rib).minVertexNormalFaceDot<0,'reversed normal negative is detected');
  const geometries=new Set(group.children.map(m=>m.geometry)),materials=new Set(group.children.map(m=>m.material));let disposedGeometry=0,disposedMaterial=0;
  for(const g of geometries)g.addEventListener('dispose',()=>disposedGeometry++);
  for(const m of materials)m.addEventListener('dispose',()=>disposedMaterial++);
  disposeMiraLanternPartial(group);disposeMiraLanternPartial(group);
  assert.equal(disposedGeometry,4);assert.equal(disposedMaterial,1);assert.equal(group.children.length,0);
});
