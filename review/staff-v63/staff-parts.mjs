import * as THREE from 'three';
import {mergeVertices,toCreasedNormals} from 'three/addons/utils/BufferGeometryUtils.js';

// Development-only metric construction; dimensions are authored registrations,
// not recovered PNG measurements. Materials are preview swatches, not final art.
export const STAFF_SPEC={units:'mm',axis:'+Y',front:'+Z',right:'-X',segments:16,
  shaft:{bottom:4,visibleTaperBottom:30,top:1418,r0:18,r1:21},
  grip:{bottom:1030,top:1240,radius:24},
  wraps:{bottom:1032,top:1238,turns:1.8,width:8,thickness:1.5,lift:2.1,secondPhase:Math.PI/2},
  neck:{bottom:1385,top:1423,woodSeat:1418,topContact:[6.3,22]},
  finial:{centerY:1688,radius:12,stemRadius:6,stemBottom:1674},
  sourceStatus:'shape references conditional; exact joins authored; not game imported'};
export const shaftRadius=y=>18+3*(y-30)/1388;

function finish(positions,uv,indices,name){
  let volume6=0;
  for(let k=0;k<indices.length;k+=3){const [ia,ib,ic]=indices.slice(k,k+3).map(i=>i*3);
    volume6+=positions[ia]*(positions[ib+1]*positions[ic+2]-positions[ib+2]*positions[ic+1])+positions[ia+1]*(positions[ib+2]*positions[ic]-positions[ib]*positions[ic+2])+positions[ia+2]*(positions[ib]*positions[ic+1]-positions[ib+1]*positions[ic]);}
  if(volume6<0)for(let k=0;k<indices.length;k+=3)[indices[k+1],indices[k+2]]=[indices[k+2],indices[k+1]];
  const raw=new THREE.BufferGeometry();raw.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));raw.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));raw.setIndex(indices);
  const g=mergeVertices(toCreasedNormals(raw,Math.PI/3),1e-8);raw.dispose();
  g.computeBoundingBox();g.computeBoundingSphere();g.name=name;return g;
}

export function revolve(profile,{segments=16,name='staff solid'}={}){
  if(!Number.isInteger(segments)||segments<12||segments>64)throw new RangeError('12–64 radial segments required');
  const p=[],uv=[],rings=[],idx=[];let distance=0;const distances=[0];
  for(let j=1;j<profile.length;j++){distance+=Math.hypot(profile[j][0]-profile[j-1][0],profile[j][1]-profile[j-1][1]);distances.push(distance);}
  for(let j=0;j<profile.length;j++){
    const [r,y]=profile[j],ring=[];
    for(let i=0;i<=(r===0?0:segments);i++){const a=(i===segments?0:i)/segments*Math.PI*2;ring.push(p.length/3);p.push(r*Math.cos(a)/1000,y/1000,r*Math.sin(a)/1000);uv.push(i/segments,distances[j]/1000);}
    rings.push(ring);
  }
  for(let j=0;j<profile.length;j++){
    const a=rings[j],b=rings[(j+1)%rings.length];if(a.length===1&&b.length===1)continue;
    for(let i=0;i<segments;i++){
      if(a.length===1)idx.push(a[0],b[i+1],b[i]);
      else if(b.length===1)idx.push(a[i],a[i+1],b[0]);
      else idx.push(a[i],a[i+1],b[i],a[i+1],b[i+1],b[i]);
    }
  }
  return finish(p,uv,idx,name);
}

const finialProfile=()=>{
  const s=STAFF_SPEC.finial,start=-Math.acos(s.stemRadius/s.radius),p=[[0,s.stemBottom],[s.stemRadius,s.stemBottom],[s.stemRadius,s.centerY+s.radius*Math.sin(start)]];
  for(let i=1;i<12;i++){const a=start+(Math.PI/2-start)*i/12;p.push([s.radius*Math.cos(a),s.centerY+s.radius*Math.sin(a)]);}
  p.push([0,s.centerY+s.radius]);return p;
};
export function profiles(){
  // Profile features follow the inspected small-part silhouettes. Hidden sockets
  // close the specified interfaces; they are explicitly authored additions.
  const n=STAFF_SPEC.neck;
  return {
    // Concealed constant-radius extension reaches the actual S03 top face;
    // the visible taper from Y30 upward is unchanged.
    S01:[[0,4],[18,4],[18,30],[21,1418],[0,1418]],
    S02:[[18.5,4],[21.2,4],[22,4.8],[22,8],[20.5,9],[20.5,50],[22,51],[22,54.2],[21.2,55],[18.5,55]],
    S03:[[0,0],[21.2,0],[22,.8],[22,3.2],[21.2,4],[0,4]],
    S04:[[shaftRadius(1030),1030],[24,1030],[24,1240],[shaftRadius(1240),1240]],
    S06:[[21.2,n.bottom],[25.5,n.bottom],[26,n.bottom+.8],[24,n.bottom+7],[23,n.bottom+8],[23,n.top-8],[24,n.top-7],[24,n.top-.8],[23.2,n.top],[6.3,n.top],[6.3,n.woodSeat],[21.2,n.woodSeat]],
    S15:finialProfile(),
    // Ends and wrap channels inside the two collars are concealed registrations.
    S17:[[23.8,1025],[26.7,1025],[27.5,1025.8],[27.5,1034.2],[26.7,1035],[26.5,1035],[26.5,1030],[23.8,1030]],
    S18:[[26.5,1235],[26.7,1235],[27.5,1235.8],[27.5,1244.2],[26.7,1245],[23.8,1245],[23.8,1240],[26.5,1240]],
  };
}

function wrapLift(t){
  const phase=4*Math.PI*1.8*t-STAFF_SPEC.wraps.secondPhase,angle=Math.abs(Math.atan2(Math.sin(phase),Math.cos(phase)));
  if(angle>=1.25)return 0;
  const u=Math.max(0,(angle-.9)/.35),crossing=1-u*u*(3-2*u);
  // Keep the full strip cross-section inside the lower retaining collar before
  // lifting it over the other winding. This is an authored assembly constraint.
  const y=STAFF_SPEC.wraps.bottom+(STAFF_SPEC.wraps.top-STAFF_SPEC.wraps.bottom)*t;
  const q=Math.max(0,Math.min(1,(y-1038.3)/4.2)),exit=q*q*(3-2*q);
  return STAFF_SPEC.wraps.lift*crossing*exit;
}
export function makeWrap(id,{steps=80}={}){
  if(!['S05-A','S05-B'].includes(id))throw new RangeError('Unknown wrap');
  const s=STAFF_SPEC.wraps,sign=id==='S05-A'?1:-1,p=[],uv=[],idx=[],h=s.top-s.bottom,w=2*Math.PI*s.turns;
  const L=Math.hypot(h,24*w),wx=h/L*s.width/2,wy=-sign*24*w/L*s.width/2;
  for(let j=0;j<=steps;j++){
    const t=j/steps,a=sign*w*t+(sign<0?s.secondPhase:0),r=24+(sign<0?wrapLift(t):0);
    for(const [side,layer]of [[-1,0],[1,0],[1,1],[-1,1]]){
      const radius=r+layer*s.thickness,angle=a+side*wx/24;
      p.push(radius*Math.cos(angle)/1000,(s.bottom+h*t+side*wy)/1000,radius*Math.sin(angle)/1000);uv.push((side+1)/2,t);
    }
  }
  for(let j=0;j<steps;j++)for(let k=0;k<4;k++){const a=j*4+k,b=j*4+(k+1)%4,c=(j+1)*4+(k+1)%4,d=(j+1)*4+k;idx.push(a,b,d,b,c,d);}
  idx.push(0,2,1,0,3,2);const e=steps*4;idx.push(e,e+1,e+2,e,e+2,e+3);
  const g=finish(p,uv,idx,id);g.userData={partId:id,authoredOverUnder:true,steps};return g;
}
export function makeStaffLower(){
  const group=new THREE.Group();group.name='Mira staff micro assembly v63 without lantern head';
  const mats={bronze:new THREE.MeshStandardMaterial({color:0xa5874d,metalness:.7,roughness:.46}),wood:new THREE.MeshStandardMaterial({color:0x39291f,roughness:.9}),leather:new THREE.MeshStandardMaterial({color:0x352b24,roughness:.85})};
  for(const [id,profile]of Object.entries(profiles())){
    const g=revolve(profile,{name:id}),mesh=new THREE.Mesh(g,id==='S01'?mats.wood:id==='S04'?mats.leather:mats.bronze);mesh.name=id;mesh.userData={partId:id};group.add(mesh);
  }
  for(const id of ['S05-A','S05-B']){const m=new THREE.Mesh(makeWrap(id),mats.leather);m.name=id;m.userData={partId:id};group.add(m);}
  group.userData={sourceOnly:true,gameImported:false,missing:['S07–S14','S16'],units:'metres',referenceShapeAcceptance:'conditional',materialsFinal:false};return group;
}
