import {BufferGeometry,Float32BufferAttribute,ConeGeometry} from 'three';
import {ARROW_LENGTH,ARROW_SHAPE} from './projectile-shape.js';

// The narrow nock clears the string and draw fingers. Length and the authored
// maximum shaft/head widths are shared by loaded and flying surfaces.
export function arrowGeometry(){
  const positions=[],indices=[],corners=[[-1,-1],[1,-1],[1,1],[-1,1]];
  for(const [z,r] of [[0,.002],[.1,ARROW_SHAPE.width/2],[ARROW_SHAPE.shaft,ARROW_SHAPE.width/2]])for(const [x,y] of corners)positions.push(x*r,y*r,z);
  for(let ring=0;ring<2;ring++)for(let i=0;i<4;i++){const a=ring*4+i,b=ring*4+(i+1)%4;indices.push(a,b,a+4,b,b+4,a+4);}
  indices.push(0,2,1,0,3,2,8,9,10,8,10,11);
  const indexed=new BufferGeometry();indexed.setAttribute('position',new Float32BufferAttribute(positions,3));indexed.setIndex(indices);const shaft=indexed.toNonIndexed();indexed.dispose();shaft.setIndex(Array.from({length:shaft.attributes.position.count},(_,i)=>i));shaft.computeVertexNormals();shaft.setAttribute('uv',new Float32BufferAttribute(new Float32Array(shaft.attributes.position.count*2),2));
  const tip=new ConeGeometry(ARROW_SHAPE.radius,ARROW_SHAPE.tip,5);tip.rotateX(Math.PI/2);tip.translate(0,0,ARROW_LENGTH-ARROW_SHAPE.tip/2);return {shaft,tip};
}
