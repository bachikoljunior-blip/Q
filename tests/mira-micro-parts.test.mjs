import test from 'node:test';
import assert from 'node:assert/strict';
import {MICRO_PARTS,makeMiraMicroGeometry,makeMiraMicroPair} from '../review/micro-v61/mira-micro-parts.js';

test('reference ring and cap are closed, finite solids with no degenerate triangles',()=>{
  for(const id of ['S13','S14']){
    const g=makeMiraMicroGeometry(id),p=g.attributes.position,idx=g.index,edges=new Map();
    let volume6=0;
    for(let k=0;k<idx.count;k+=3){
      const ids=[idx.getX(k),idx.getX(k+1),idx.getX(k+2)];
      const [a,b,c]=ids.map(i=>[p.getX(i),p.getY(i),p.getZ(i)]);
      assert([...a,...b,...c].every(Number.isFinite));
      const u=b.map((x,i)=>x-a[i]),v=c.map((x,i)=>x-a[i]);
      const cross=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
      assert(Math.hypot(...cross)>1e-12);
      volume6+=a[0]*(b[1]*c[2]-b[2]*c[1])+a[1]*(b[2]*c[0]-b[0]*c[2])+a[2]*(b[0]*c[1]-b[1]*c[0]);
      for(let n=0;n<3;n++){const x=ids[n],y=ids[(n+1)%3],key=[x,y].sort((a,b)=>a-b).join('/');const e=edges.get(key)||{count:0,direction:0};e.count++;e.direction+=x<y?1:-1;edges.set(key,e);}
    }
    assert(volume6>0);
    assert([...edges.values()].every(e=>e.count===2&&e.direction===0));
    const profile=MICRO_PARTS[id].profileMm;let analytic=0;
    for(let i=0;i<profile.length;i++){const [r,y]=profile[i],[s,z]=profile[(i+1)%profile.length];analytic+=(z-y)*(r*r+r*s+s*s)*Math.PI/3/1e9;}
    const polygonFactor=24*Math.sin(2*Math.PI/24)/(2*Math.PI);
    assert(Math.abs(volume6/6/(Math.abs(analytic)*polygonFactor)-1)<1e-5,'swept material volume follows the whole closed profile, not a filled bore');
    g.dispose();
  }
});

test('ring/cap seat, open finial socket and glass datum agree without adding a finial',()=>{
  const ring=MICRO_PARTS.S13,cap=MICRO_PARTS.S14;
  assert.equal(ring.interfaces.capSeatY,cap.interfaces.ringSeatY);
  assert(Math.abs(cap.interfaces.socketRadius-cap.interfaces.finialStemRadius-.3)<1e-12);
  assert(cap.interfaces.socketTopY>cap.interfaces.finialStemBottomY);
  assert(Math.abs(cap.interfaces.glassContactRadius-52*Math.sqrt(1-((1662-1556)/109)**2))<1e-10);
  assert.equal(Math.min(...cap.profileMm.map(p=>p[0])),6.3,'no cap-owned ball or solid axial plug');
  const pair=makeMiraMicroPair();
  assert.deepEqual(pair.children.map(m=>m.name),['S13','S14']);
  assert.equal(pair.children[0].material,pair.children[1].material);
  assert.equal(pair.userData.completeLantern,false);
  for(const child of pair.children)child.geometry.dispose();
  pair.children[0].material.dispose();
});
