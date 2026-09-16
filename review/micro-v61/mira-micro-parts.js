import * as THREE from 'three';

// Authored metric registration for two inspected image-reference components.
// These are development-only real solids, not accepted game assets.
// Profiles are millimetres, [radius, height] in the part's local coordinates.
// Closed profile sweeps keep the bore open and the material volume watertight.
const glassSeatRadius=52*Math.sqrt(1-((1662-1556)/109)**2);
export const MICRO_PARTS=Object.freeze({
  S13:{
    name:'upper seating ring',
    originMm:[0,1665,0],
    profileMm:[[14,-2.5],[14.5,-3],[19.2,-3],[20,-2.2],[20,2.2],[19.2,3],[14.5,3],[14,2.5],[14,1],[15,1],[15,-1],[14,-1]],
    interfaces:{capSeatY:1668,capSeatRadialBand:[14.5,18],ribEndpointRadius:14},
    image:'docs/evidence/mira-micro-v61/references/staff-caps-micro-v1.png'
  },
  S14:{
    name:'upper receiving cap without finial',
    originMm:[0,1668,0],
    profileMm:[[6.3,10],[8.5,10],[9,9.5],[9,6.5],[8,6],[8,4.5],[10,3.5],[17.5,1],[18,.5],[18,0],[14,0],[13.2,-.5],[13.2,-6],[glassSeatRadius,-6],[9,-3],[6.3,2]],
    interfaces:{ringSeatY:1668,finialStemRadius:6,socketRadius:6.3,socketTopY:1678,finialStemBottomY:1674,glassContactY:1662,glassContactRadius:glassSeatRadius},
    image:'docs/evidence/mira-micro-v61/references/staff-caps-micro-v1.png'
  }
});

export function makeMiraMicroGeometry(id,{segments=24}={}){
  const spec=MICRO_PARTS[id];
  if(!spec)throw new RangeError('Unknown Mira micro-part '+id);
  if(!Number.isInteger(segments)||segments<8||segments>96)throw new RangeError('segments must be an integer from 8 to 96');
  const profile=spec.profileMm,positions=[],uv=[],indices=[];
  for(let j=0;j<profile.length;j++){
    const [r,y]=profile[j];
    for(let i=0;i<segments;i++){
      const a=i*Math.PI*2/segments;
      positions.push(r*Math.cos(a)/1000,y/1000,r*Math.sin(a)/1000);
      uv.push(i/segments,j/profile.length);
    }
  }
  for(let j=0;j<profile.length;j++)for(let i=0;i<segments;i++){
    const a=j*segments+i,b=j*segments+(i+1)%segments,c=((j+1)%profile.length)*segments+(i+1)%segments,d=((j+1)%profile.length)*segments+i;
    indices.push(a,b,d,b,c,d);
  }
  let volume6=0;
  for(let k=0;k<indices.length;k+=3){
    const a=indices[k]*3,b=indices[k+1]*3,c=indices[k+2]*3;
    volume6+=positions[a]*(positions[b+1]*positions[c+2]-positions[b+2]*positions[c+1])+positions[a+1]*(positions[b+2]*positions[c]-positions[b]*positions[c+2])+positions[a+2]*(positions[b]*positions[c+1]-positions[b+1]*positions[c]);
  }
  if(volume6<0)for(let k=0;k<indices.length;k+=3)[indices[k+1],indices[k+2]]=[indices[k+2],indices[k+1]];
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  g.setIndex(indices);g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();
  g.name='Mira micro '+id;
  g.userData={partId:id,referenceOnly:true,profileUnits:'millimetres',originMm:spec.originMm.slice(),radialSegments:segments};
  return g;
}

export function makeMiraMicroPair(){
  const group=new THREE.Group();
  group.name='Mira S13 S14 partial assembly — development candidate';
  const material=new THREE.MeshStandardMaterial({name:'Mira micro bronze candidate',color:0xa5874d,metalness:.7,roughness:.46});
  for(const id of Object.keys(MICRO_PARTS)){
    const mesh=new THREE.Mesh(makeMiraMicroGeometry(id),material);
    mesh.name=id;mesh.position.fromArray(MICRO_PARTS[id].originMm.map(x=>x/1000));
    group.add(mesh);
  }
  group.userData={partialAssembly:true,partIds:['S13','S14'],completeLantern:false,gameImported:false};
  return group;
}
