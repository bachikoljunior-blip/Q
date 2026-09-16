import * as THREE from 'three';
import {MICRO_PARTS,makeMiraMicroGeometry} from '../micro-v61/mira-micro-parts.js';

// Development-only solids, registered in authored millimetres. The selected
// FRONT / TRUE SIDE / THREE-QUARTER images guide shape; their TOP is rejected.
// Dimensions, unseen receiver faces and the loft are authored, not image scans.
export const RIB_SPEC=Object.freeze({
  originY:1556,lowerDatumY:1447,upperSeatY:1662,endpointRadius:16.75,
  wideRadius:70,depthRadius:55,bowExponent:.7,
  faceWidth:7,plateThickness:2,endRadialWidth:3,endTangentialWidth:8,
  endTransitionHeight:12,edgeChamfer:.2,
  sectionTimes:[0,.006,.015,.03,.05,.08,.12,.18,.25,.33,.42,.5,.58,.67,.75,.82,.88,.92,.95,.97,.985,.994,1],
  glowEnvelope:{center:[0,1556,0],radii:[52,109,39]},
  reference:'staff-ribs-micro-v2.png',acceptedViews:['FRONT','TRUE SIDE','THREE-QUARTER'],
  excludedViews:['TOP'],endOwnership:'integral closed end blocks, no extra parts',
  lowerJoint:'datum only: S08/S07 receiver not modeled or accepted'
});
export const RIB_INSTANCES=Object.freeze([
  {id:'S09',type:'wide',side:'-X',yaw:Math.PI},
  {id:'S10',type:'wide',side:'+X',yaw:0},
  {id:'S11',type:'depth',side:'+Z',yaw:0},
  {id:'S12',type:'depth',side:'-Z',yaw:Math.PI}
]);

// Horizontal bevelled sections make one watertight integral part, including
// the small end block seen in the selected images. Radial width compensates
// local bow slope to keep a thin plate away from the short authored end blend.
function section(type,t){
  const s=RIB_SPEC,h=s.upperSeatY-s.lowerDatumY,span=(type==='wide'?s.wideRadius:s.depthRadius)-s.endpointRadius;
  const sin=Math.sin(Math.PI*t),r=s.endpointRadius+span*Math.pow(Math.max(0,sin),s.bowExponent);
  const endDistance=Math.min(t,1-t)*h,u=Math.min(1,endDistance/s.endTransitionHeight),blend=u*u*(3-2*u);
  const slope=t===0||t===1?0:span*s.bowExponent*Math.pow(sin,s.bowExponent-1)*Math.PI*Math.cos(Math.PI*t)/h;
  const baseRadial=(type==='wide'?s.faceWidth:s.plateThickness)/2*Math.hypot(1,slope);
  const radial=s.endRadialWidth/2+(baseRadial-s.endRadialWidth/2)*blend;
  const baseTangential=(type==='wide'?s.plateThickness:s.faceWidth)/2;
  const tangential=s.endTangentialWidth/2+(baseTangential-s.endTangentialWidth/2)*blend;
  return {r,y:s.lowerDatumY+t*h,radial,tangential};
}

export function makeMiraRibGeometry(type){
  if(type!=='wide'&&type!=='depth')throw new RangeError('Unknown Mira rib type '+type);
  const positions=[],uv=[],indices=[],s=RIB_SPEC;
  for(let row=0;row<s.sectionTimes.length;row++){
    const t=s.sectionTimes[row],p=section(type,t),a=p.radial,b=p.tangential,c=s.edgeChamfer;
    const corners=[[-a+c,-b],[a-c,-b],[a,-b+c],[a,b-c],[a-c,b],[-a+c,b],[-a,b-c],[-a,-b+c]];
    for(let k=0;k<8;k++){
      const [radial,tangent]=corners[k],r=p.r+radial;
      positions.push((type==='wide'?r:tangent)/1000,(p.y-s.originY)/1000,(type==='wide'?tangent:r)/1000);
      uv.push(k/8,t);
    }
  }
  const rows=s.sectionTimes.length;
  for(let j=0;j<rows-1;j++)for(let i=0;i<8;i++){
    const a=j*8+i,b=j*8+(i+1)%8,c=(j+1)*8+(i+1)%8,d=(j+1)*8+i;
    indices.push(a,b,d,b,c,d);
  }
  for(let k=1;k<7;k++){
    indices.push(0,k+1,k);
    const top=(rows-1)*8;indices.push(top,top+k,top+k+1);
  }
  let volume6=0;
  for(let k=0;k<indices.length;k+=3){
    const a=indices[k]*3,b=indices[k+1]*3,c=indices[k+2]*3;
    volume6+=positions[a]*(positions[b+1]*positions[c+2]-positions[b+2]*positions[c+1])+positions[a+1]*(positions[b+2]*positions[c]-positions[b]*positions[c+2])+positions[a+2]*(positions[b]*positions[c+1]-positions[b+1]*positions[c]);
  }
  if(volume6<0)for(let k=0;k<indices.length;k+=3)[indices[k+1],indices[k+2]]=[indices[k+2],indices[k+1]];
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);
  g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();
  g.name='Mira integral '+type+' bronze rib';
  g.userData={ribType:type,sourcePartIds:type==='wide'?['S09','S10']:['S11','S12'],referenceOnly:true,integralEnds:true,originMm:[0,s.originY,0]};
  return g;
}

export function makeMiraLanternPartial({capSegments=16}={}){
  const group=new THREE.Group();group.name='Mira four ribs + S13/S14 partial lantern';
  const material=new THREE.MeshStandardMaterial({name:'Mira micro bronze candidate',color:0xa5874d,metalness:.7,roughness:.46});
  const geometries={wide:makeMiraRibGeometry('wide'),depth:makeMiraRibGeometry('depth')};
  for(const spec of RIB_INSTANCES){
    const mesh=new THREE.Mesh(geometries[spec.type],material);mesh.name=spec.id;
    mesh.position.y=RIB_SPEC.originY/1000;mesh.rotation.y=spec.yaw;
    mesh.userData={partId:spec.id,type:spec.type,side:spec.side,integralEnds:true};group.add(mesh);
  }
  for(const id of ['S13','S14']){
    const mesh=new THREE.Mesh(makeMiraMicroGeometry(id,{segments:capSegments}),material);mesh.name=id;
    mesh.position.fromArray(MICRO_PARTS[id].originMm.map(v=>v/1000));mesh.userData={partId:id,reusedProfile:true};group.add(mesh);
  }
  group.userData={partialAssembly:true,completeLantern:false,gameImported:false,capSegments,sourcePartIds:['S09','S10','S11','S12','S13','S14'],missing:['S06','S07','S08','S15','S16','shaft and hand attachment']};
  return group;
}

export function disposeMiraLanternPartial(group){
  const geometries=new Set(),materials=new Set();group.traverse(n=>{if(n.isMesh){geometries.add(n.geometry);materials.add(n.material);}});
  for(const g of geometries)g.dispose();for(const m of materials)m.dispose();group.clear();
}
