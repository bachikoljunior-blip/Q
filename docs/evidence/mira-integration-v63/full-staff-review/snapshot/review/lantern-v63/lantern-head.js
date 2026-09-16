import * as T from 'three';
import {mergeVertices,toCreasedNormals} from 'three/addons/utils/BufferGeometryUtils.js';
import {MICRO_PARTS,makeMiraMicroGeometry} from '../micro-v61/mira-micro-parts.js';
import {makeMiraLanternPartial,RIB_SPEC} from '../lantern-micro-v62/mira-lantern-ribs.js';

export const HEAD_SPEC=Object.freeze({
  originY:1556,radialSegments:32,receiverSides:16,
  cupBottomY:1423,cupBottomBand:[6.3,10],cupRingSeatY:1441,
  lowerRingOriginY:1444,ribBottomY:1447,ribTopY:1662,
  glassCenter:[0,1556,0],glassRadii:[52,109,39],glassTopSeatY:1662,
  cradleAngles:[Math.PI-.16,Math.PI-.10,Math.PI-.05,Math.PI],
  finialStemSeatY:1674,finialStemSeatRadius:6.3,finialMouthRadius:6.8,
  sourceViews:{cup:'lower-cup-ring-glass-v1.png / S07',ring:'lower-cup-ring-glass-v1.png / S08',glass:'glass-multiview-v2.png'},
  scope:'lantern head core; S06/S15 and hand/shaft integration belong to separate owner'
});

// The broad outer cup follows the selected reference. The small elliptical
// cradle is unseen author-designed join geometry, shared exactly with S16.
// Each triple is [X radius, Y in mm, Z radius]. Circular rings use the same
// 16-gon receiver perimeter, with midpoint vertices to join the 32-angle glass.
const circular=(r,y)=>({r,y}),ellipse=(rx,y,rz)=>({rx,y,rz});
export function glassSection(phi){
  const [a,b,c]=HEAD_SPEC.glassRadii,s=Math.sin(phi);
  return ellipse(Math.abs(s)<1e-12?0:a*s,HEAD_SPEC.originY+b*Math.cos(phi),Math.abs(s)<1e-12?0:c*s);
}
export function cupSections(){
  const top=glassSection(HEAD_SPEC.cradleAngles[0]);
  return [circular(6.3,1423),circular(10,1423),circular(10.6,1423.6),circular(10.6,1426),
    circular(10.2,1426.5),circular(12,1428),circular(14,1430.5),circular(15.7,1433.5),
    circular(17,1436.5),circular(17.6,1439),circular(18,1440),circular(18,1441),
    circular(14.5,1441),circular(13.5,1439),circular(11,1436),circular(9.5,1436),
    circular(9.5,top.y),...HEAD_SPEC.cradleAngles.map(glassSection),
    circular(0,1434),circular(6.3,1434)];
}
export function revisedUpperSections(){
  // External profile and S13 seat unchanged. Internal lower annulus meets the
  // closed S16 top face; hidden floor receives the S15 stem at Y1674. The mouth
  // clears its sphere R12 / centerY1688 at the outer cap's Y1678 boundary.
  return [circular(6.8,1678),circular(8.5,1678),circular(9,1677.5),circular(9,1674.5),
    circular(8,1674),circular(8,1672.5),circular(10,1671.5),circular(17.5,1669),
    circular(18,1668.5),circular(18,1668),circular(14,1668),circular(13.2,1667.5),
    circular(13.2,1662),circular(8,1662),circular(9,1665),circular(0,1672),
    circular(0,1674),circular(6.3,1674),circular(6.3,1677.25)];
}
function circlePoint(r,i,count){
  const step=i*HEAD_SPEC.receiverSides/count,k=Math.floor(step),f=step-k,a=k*Math.PI*2/HEAD_SPEC.receiverSides,b=(k+1)*Math.PI*2/HEAD_SPEC.receiverSides;
  return [r*((1-f)*Math.cos(a)+f*Math.cos(b)),r*((1-f)*Math.sin(a)+f*Math.sin(b))];
}

function solidSections(sections,name,{crease=Math.PI/4,count=HEAD_SPEC.radialSegments}={}){
  const positions=[],uv=[],index=[],loops=[];
  for(let j=0;j<sections.length;j++){
    const s=sections[j],axis=s.r===0||s.rx===0,loop=[];
    for(let i=0;i<(axis?1:count);i++){
      const a=i*Math.PI*2/count,[x,z]=axis?[0,0]:s.r!==undefined?circlePoint(s.r,i,count):[s.rx*Math.cos(a),s.rz*Math.sin(a)];
      loop.push(positions.length/3);positions.push(x/1000,(s.y-HEAD_SPEC.originY)/1000,z/1000);uv.push(i/count,j/(sections.length-1));
    }
    loops.push(loop);
  }
  for(let j=0;j<loops.length;j++){
    const a=loops[j],b=loops[(j+1)%loops.length];
    if(a.length===1&&b.length===1)continue;
    for(let i=0;i<count;i++){
      const n=(i+1)%count;
      if(a.length===1)index.push(a[0],b[i],b[n]);
      else if(b.length===1)index.push(a[i],b[0],a[n]);
      else index.push(a[i],b[i],a[n],a[n],b[i],b[n]);
    }
  }
  let v6=0;for(let k=0;k<index.length;k+=3){const [a,b,c]=index.slice(k,k+3).map(i=>new T.Vector3().fromArray(positions,i*3));v6+=a.dot(new T.Vector3().crossVectors(b,c));}
  if(v6<0)for(let k=0;k<index.length;k+=3)[index[k+1],index[k+2]]=[index[k+2],index[k+1]];
  const raw=new T.BufferGeometry();raw.setAttribute('position',new T.Float32BufferAttribute(positions,3));raw.setAttribute('uv',new T.Float32BufferAttribute(uv,2));raw.setIndex(index);
  const normalGeometry=toCreasedNormals(raw,crease),g=mergeVertices(normalGeometry,1e-7);raw.dispose();normalGeometry.dispose();
  g.name=name;g.computeBoundingBox();g.computeBoundingSphere();g.userData={originMm:[0,HEAD_SPEC.originY,0],referenceOnly:true};return g;
}

export function makeLowerCup({glassSegments=32}={}){return solidSections(cupSections(),'S07 lower cup with shared glass cradle',{count:glassSegments});}
export function makeUpperReceiver(){return solidSections(revisedUpperSections(),'S14 v63 internal glass and finial seats',{count:HEAD_SPEC.receiverSides});}
export function makeIvoryGlass({glassSegments=32}={}){
  const top=Math.acos((HEAD_SPEC.glassTopSeatY-HEAD_SPEC.originY)/HEAD_SPEC.glassRadii[1]),phis=[top];
  for(let i=1;i<24;i++){const phi=i*Math.PI/24;if(phi>top&&phi<HEAD_SPEC.cradleAngles[0])phis.push(phi);}
  phis.push(...HEAD_SPEC.cradleAngles);
  const sections=[circular(0,HEAD_SPEC.glassTopSeatY),...phis.map(glassSection)];
  const g=solidSections(sections,'S16 closed ivory glass',{crease:Math.PI/3,count:glassSegments}),p=g.attributes.position,colors=[];
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
    // Authored quiet milky variation, not a photograph / baked fake highlight.
    const cloud=.5+.22*Math.sin(x*79+y*21+Math.sin(z*61))+.16*Math.sin(y*47-z*31+Math.sin(x*53));
    const q=.87+.11*cloud;colors.push(q,q*.91,q*.75);
  }
  g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.userData.closedGlass=true;return g;
}

export function makeLanternHead({glassSegments=32}={}){
  if(![16,32].includes(glassSegments))throw new RangeError('Use the paired 16 or 32 glass/cradle comparison');
  const group=makeMiraLanternPartial({capSegments:16}),metal=group.children[0].material,old=group.getObjectByName('S14');
  group.remove(old);old.geometry.dispose();
  for(const [id,g] of [['S07',makeLowerCup({glassSegments})],['S14',makeUpperReceiver()],['S16',makeIvoryGlass({glassSegments})]]){
    const material=id==='S16'?new T.MeshPhysicalMaterial({name:'Mira warm ivory luminous glass candidate',color:0xffffff,vertexColors:true,metalness:0,roughness:.3,transmission:.22,thickness:.04,ior:1.45,emissive:0xffc477,emissiveIntensity:.45}):metal;
    const mesh=new T.Mesh(g,material);mesh.name=id;mesh.position.y=HEAD_SPEC.originY/1000;mesh.userData={partId:id,version:'v63',internalJoinAuthored:id!=='S16'};group.add(mesh);
  }
  const ring=new T.Mesh(makeMiraMicroGeometry('S13',{segments:16}),metal);ring.name='S08';ring.rotation.x=Math.PI;ring.position.y=HEAD_SPEC.lowerRingOriginY/1000;ring.userData={partId:'S08',sourceProfile:'S13 flipped / current lower-ring visual reference'};group.add(ring);
  group.name='Mira lantern head core v63';group.userData={...group.userData,sourcePartIds:group.children.map(m=>m.name),glassSegments,headCore:true,completeLantern:false,gameImported:false,missing:['S06 staff collar','S15 finial','staff / hand attachment'],glassMaterialIntent:'closed softly luminous milky oval; transmission/roughness are unviewed shader settings, not appearance acceptance'};
  return group;
}

export const OLD_CONTACTS=Object.freeze({upperCap:MICRO_PARTS.S14,ribs:RIB_SPEC});
