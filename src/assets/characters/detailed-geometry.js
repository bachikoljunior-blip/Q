import {arrowGeometry} from '../../projectile-geometry.js';
import {upperCloth} from './cloth-material.js';
// Q costumes/surfaces and a registered CC0 MakeHuman anatomical head.
// The CC0 KayKit models alongside this file remain a separate, unmodified asset family.
import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';
import { HEAD_ATTRIBUTES, HEAD_INDICES } from './anatomical-head-data.js';
import { HEAD_ATTRIBUTES as NPC_HEAD_ATTRIBUTES, HEAD_INDICES as NPC_HEAD_INDICES } from './identity-head-data.js';
import { registerFaceSkin } from '../../skin-materials.js';

export const ACTOR_FAMILIES = Object.freeze(['player','npc','sena','smith','healer','patient','porter','scout','traveler','courier','soldier','ranger','wolf','boss']);
const themes = { ember:[0x58403a,0xc38450], tide:[0x405e63,0x9dc7bc], gale:[0x68727a,0xc2c6b6], moss:[0x48594b,0xadb982] };
const profiles = {
  player: { cloth:0x2c555b, leather:0x453c32, metal:0x7c8586, skin:0xb3947b, hair:0x322d28, armored:true, cloak:true, hood:true },
  npc: { cloth:0x696454, leather:0x494334, metal:0x938469, skin:0xab8770, hair:0xa7a397, cloak:true, keeper:true },
  sena: { cloth:0x495a61, leather:0x503f35, metal:0xaaa082, skin:0xb18e79, hair:0x352b27, cloak:true, keeper:true },
  smith: { cloth:0x716b59, leather:0x573829, metal:0x6c7171, skin:0x98765d, hair:0x362d25, broad:true },
  healer: { cloth:0x7e8b78, leather:0x635841, metal:0x99917b, skin:0xbc9a81, hair:0x594438 },
  patient: { cloth:0x949487, leather:0x6a6552, metal:0x9b9983, skin:0xb19985, hair:0x524238, slight:true },
  porter: { cloth:0x776b51, leather:0x5e4934, metal:0x79776d, skin:0x8f6c55, hair:0x2e2722, broad:true, pack:true },
  traveler: { cloth:0x626856, leather:0x6c513c, metal:0x8c866c, skin:0xb7997e, hair:0x746250, cloak:true, pack:true },
  courier: { cloth:0x5d6970, leather:0x796044, metal:0x938b71, skin:0xa27d63, hair:0x362a25, pack:true },
  scout: { cloth:0x4e6655, leather:0x554735, metal:0x858b7f, skin:0xb29071, hair:0x49382c, cloak:true, hood:true },
  soldier: { cloth:0x454e52, leather:0x3c3730, metal:0x626f75, skin:0xa68e79, hair:0x35302b, armored:true, helmet:true },
  ranger: { cloth:0x67654b, leather:0x5a4935, metal:0x7d7c68, skin:0xac8b70, hair:0x3c3228, hood:true, cloak:true },
  boss: { cloth:0x303e45, leather:0x36332c, metal:0x414e56, skin:0x8b8270, hair:0x777c70, armored:true, helmet:true, cloak:true, broad:true },
};
const textures = new Map(), materials = new Map();
const shapes = {
  decorSphere:new T.SphereGeometry(1,8,4), sphere:new T.SphereGeometry(1,12,8), smallSphere:new T.SphereGeometry(1,8,6), mediumSphere:new T.SphereGeometry(1,10,6),
  box:new T.BoxGeometry(1,1,1), cylinder:new T.CylinderGeometry(1,1,1,10),
  cone:new T.ConeGeometry(1,1,7), ring:new T.TorusGeometry(1,.085,5,16),
};
function microtexture(kind){
  if(textures.has(kind))return textures.get(kind);
  const n=64, data=new Uint8Array(n*n*4);
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){
    const h=((x*73856093)^(y*19349663))>>>0,noise=(h%127)/127;
    const weave=kind==='cloth'?Math.sin(x*Math.PI/2)*Math.cos(y*Math.PI/2):kind==='metal'?Math.sin(x*.7+y*.09):Math.sin(x*.6)*Math.cos(y*.8);
    // R stores height, G stores roughness. Skin/oiled leather must not share
    // the fabric's near-white roughness response or millimetre-scale weave.
    const i=(y*n+x)*4,rough=kind==='eye'?.19:kind==='metal'?.49:kind==='skin'?.61:kind==='leather'?.77:.94;
    data[i]=Math.round(128+(noise-.5)*42+weave*(kind==='cloth'?25:12));
    data[i+1]=Math.round(255*Math.min(1,rough+(noise-.5)*.12));data[i+2]=128;data[i+3]=255;
  }
  const texture=new T.DataTexture(data,n,n,T.RGBAFormat);texture.name=`Q ${kind} microstructure`;
  texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.magFilter=T.LinearFilter;texture.minFilter=T.LinearMipmapLinearFilter;
  texture.generateMipmaps=true;texture.repeat.set(4,4);texture.needsUpdate=true;textures.set(kind,texture);return texture;
}
function surface(kind,color){
  const key=`${kind}/${color}`;if(materials.has(key))return materials.get(key);
  const mat=new T.MeshStandardMaterial({name:`Q ${kind}`,color,roughness:1,
    metalness:kind==='metal'?.86:0,bumpMap:microtexture(kind),bumpScale:kind==='eye'?0:kind==='cloth'?.0014:kind==='leather'?.0008:kind==='skin'?.00018:.00035,
    roughnessMap:microtexture(kind)});
  if(kind==='cloth')mat.side=T.DoubleSide;materials.set(key,mat);return mat;
}
function group(parent,name,x=0,y=0,z=0){const g=new T.Bone();g.name=name;g.position.set(x,y,z);parent.add(g);return g;}
function mesh(parent,geometry,material,position=[0,0,0],scale=[1,1,1],rotation){
  const m=new T.Mesh(geometry,material);m.position.set(...position);m.scale.set(...scale);if(rotation)m.rotation.set(...rotation);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
}
function ellipsoid(parent,mat,p,s){return mesh(parent,Math.max(...s)<.032?shapes.smallSphere:Math.max(...s)<.11?shapes.mediumSphere:shapes.sphere,mat,p,s);}
function beam(parent,mat,a,b,r=.025,r2=r){
  const va=new T.Vector3(...a),vb=new T.Vector3(...b),delta=vb.clone().sub(va);
  const m=mesh(parent,new T.CylinderGeometry(r2,r,delta.length(),8),mat,va.clone().add(vb).multiplyScalar(.5).toArray());m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return m;
}
function smoothWrappedNormals(geometry,segments){
  const normal=geometry.attributes.normal;
  for(let first=0;first<normal.count;first+=segments+1){
    const last=first+segments;if(last>=normal.count)break;
    let x=normal.getX(first)+normal.getX(last),y=normal.getY(first)+normal.getY(last),z=normal.getZ(first)+normal.getZ(last);
    const length=Math.hypot(x,y,z)||1;x/=length;y/=length;z/=length;
    normal.setXYZ(first,x,y,z);normal.setXYZ(last,x,y,z);
  }
  return geometry;
}
function shell(rings,segments=16){
  const position=[],uv=[],indices=[];
  rings.forEach(([y,rx,rz,offset=0],j)=>{for(let i=0;i<=segments;i++){const a=i/segments*Math.PI*2;position.push(Math.sin(a)*rx,y,Math.cos(a)*rz+offset);uv.push(i/segments,j/(rings.length-1));}});
  for(let j=0;j<rings.length-1;j++)for(let i=0;i<segments;i++){const a=j*(segments+1)+i,b=a+segments+1;indices.push(a,a+1,b,b,a+1,b+1);}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(position,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();return smoothWrappedNormals(geo,segments);
}
// Continuous shaped surfaces carry deformation rules until material batching.
// Ring density follows shape changes and joints, not a blanket subdivision pass.
function tailored(parent,mat,rings,deform,segments=12,fold=0){
  const geometry=shell(rings,segments),position=geometry.attributes.position;
  if(fold)for(let i=0;i<position.count;i++){
    const x=position.getX(i),y=position.getY(i),z=position.getZ(i),a=Math.atan2(x,z);
    const amount=fold*Math.sin(a*5+y*31)*Math.sin(a*3-y*19);
    position.setXYZ(i,x*(1+amount),y,z*(1+amount));
  }
  geometry.computeVertexNormals();smoothWrappedNormals(geometry,segments);const result=mesh(parent,geometry,mat);result.userData.deform=deform;return result;
}
const anatomicalHeads=new Map();
function faceSurface(role){
  const key=role==='npc'?'npc':'base';
  if(anatomicalHeads.has(key))return anatomicalHeads.get(key);
  const geometry=new T.BufferGeometry(),positions=[],normals=[],uv=[];
  for(const v of (key==='npc'?NPC_HEAD_ATTRIBUTES:HEAD_ATTRIBUTES)){positions.push(...v.slice(0,3));normals.push(...v.slice(3,6));uv.push(...v.slice(6,8));}
  geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  geometry.setAttribute('normal',new T.Float32BufferAttribute(normals,3));
  geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometry.setIndex(key==='npc'?NPC_HEAD_INDICES:HEAD_INDICES);
  geometry.userData.source='MakeHuman hm08 CC0 registered anatomical head';
  anatomicalHeads.set(key,geometry);return geometry;
}
function faceMaterial(skin,role){
  const key=`face/${role}/${skin.color.getHex()}`;
  if(!materials.has(key)){const mat=skin.clone();mat.name='Q anatomical face';registerFaceSkin(mat,skin,role);materials.set(key,mat);}
  return materials.get(key);
}
function helmetGeometry(){
  const geometry=new T.SphereGeometry(1,16,10,0,Math.PI*2,0,Math.PI*.54),v=geometry.attributes.position;
  // Keep the crown/back coverage and side plates, but the front brim belongs
  // above the eyes. The old full cap obscured both eyes even without a new head.
  for(let i=0;i<v.count;i++){const y=v.getY(i),u=T.MathUtils.clamp((v.getZ(i)-.05)/.3,0,1);if(y<.15)v.setY(i,y+(.15-y)*u*u*(3-2*u));}
  geometry.computeVertexNormals();return smoothWrappedNormals(geometry,16);
}
function bootGeometry(sole=false){
  // Ankle, instep, arch, toe box and heel. No rectangular floating sole.
  const geometry=new T.SphereGeometry(1,12,8),v=geometry.attributes.position;
  for(let i=0;i<v.count;i++){
    const x=v.getX(i),y=v.getY(i),z=v.getZ(i),toe=(z+1)*.5;
    v.setXYZ(i,x*(.068+.011*Math.sin(toe*Math.PI)),sole?-.098+y*.010:Math.max(-.087,-.039+y*.063-(toe>.55?(toe-.55)*.037:0)),.050+z*.143);
  }
  geometry.computeVertexNormals();return smoothWrappedNormals(geometry,12);
}
function handGeometry(hand,m,side,index,skin){
  const mat=skin?m.skin:m.leather;
  tailored(hand,mat,[[-.105,.029,.021,.012],[-.083,.045,.025,.012],[-.047,.045,.027,.008],[-.015,.032,.024,0],[.009,.028,.024,0]],null,10);
  for(let finger=0;finger<5;finger++){
    const thumb=finger===4,length=thumb?.061:[.077,.087,.082,.065][finger];
    const root=group(hand,`finger-${index}-${finger}`,thumb?-side*.043:(finger-1.5)*.022,-(thumb?.035:.087),.013);
    if(thumb){root.rotation.z=-side*.65;root.rotation.x=-.26;}
    const tip=group(root,`finger-tip-${index}-${finger}`,0,-length*.5,0),radius=thumb?.014:.0105;
    tailored(root,mat,[[-length,.002,.002,0],[-length*.9,radius*.73,radius*.77,0],[-length*.55,radius*.9,radius*.95,0],[-length*.43,radius,radius,0],[-length*.12,radius,radius,0],[.003,radius*.9,radius*.9,0]],
      {axis:'y',joints:[root.name,tip.name],centres:[-length*.5],widths:[length*.3]},6);
  }
}
function cloakGeometry(long=false){
  const positions=[],uv=[],indices=[],w=8,h=12,length=long?1.48:1.15;
  for(let j=0;j<=h;j++)for(let i=0;i<=w;i++){
    const u=i/w,v=j/h,x=(u-.5)*(.53+v*.4), y=.48-v*length;
    positions.push(x,y,-.205-v*.19+Math.cos(u*Math.PI*8)*(.008+v*.026));uv.push(u,v);
  }
  if(!long){
    // Follow the open cloth's row arcs and mean meridians, so the wider hem
    // does not stretch the weave. Preserve the old total UV area/density.
    const rows=[],travel=[0];let area=0;
    const distance=(a,b)=>Math.hypot(...[0,1,2].map(k=>positions[a*3+k]-positions[b*3+k]));
    for(let j=0;j<=h;j++){
      const row=[0],start=j*(w+1);let step=0;
      for(let i=1;i<=w;i++)row.push(row[i-1]+distance(start+i,start+i-1));
      if(j){
        for(let i=0;i<=w;i++)step+=distance(start+i,start+i-w-1)/(w+1);
        travel.push(travel[j-1]+step);area+=(rows[j-1][w]+row[w])*.5*step;
      }
      rows.push(row);
    }
    const scale=1/Math.sqrt(area);
    for(let j=0;j<=h;j++)for(let i=0;i<=w;i++){
      const index=(j*(w+1)+i)*2;uv[index]=.5+(rows[j][i]-rows[j][w]*.5)*scale;uv[index+1]=travel[j]*scale;
    }
  }
  for(let j=0;j<h;j++)for(let i=0;i<w;i++){const a=j*(w+1)+i,b=a+w+1;indices.push(a,b,a+1,b,b+1,a+1);}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();return geo;
}
function blade(hand,m,type='sword'){
  const g=group(hand,type),length=type==='greatsword'?1.45:type==='spear'?2.6:.95;
  g.userData.independentVisibility=true;
  if(type==='spear'){
    beam(g,m.wood,[0,.75,0],[0,-1.65,0],.023);
    mesh(g,shapes.cone,m.metal,[0,-1.79,0],[.065,.35,.035],[0,0,Math.PI]);
    beam(g,m.trim,[0,-1.5,0],[0,-1.62,0],.038);return g;
  }
  beam(g,m.leather,[0,.08,0],[0,-.16,0],.033);
  beam(g,m.trim,[-.14,-.16,0],[.14,-.16,0],.025);
  ellipsoid(g,m.trim,[0,.1,0],[.047,.055,.044]);
  const half=type==='greatsword'?.068:.044;
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute([
    -half,-.2,0, 0,-.2,.025, half,-.2,0, 0,-.2,-.025,
    -half*.65,-length,0,0,-length,.018,half*.65,-length,0,0,-length,-.018, 0,-length-.16,0,
  ],3));geo.setIndex([0,4,5,0,5,1,1,5,6,1,6,2,2,6,7,2,7,3,3,7,4,3,4,0,4,8,5,5,8,6,6,8,7,7,8,4]);
  geo.setAttribute('uv',new T.Float32BufferAttribute([0,0,.5,0,1,0,.5,0,0,1,.5,1,1,1,.5,1,.5,1],2));geo.computeVertexNormals();mesh(g,geo,m.metal);
  return g;
}
function pack(chest,m,role){
  const p=group(chest,'pack',0,.19,-.27);
  ellipsoid(p,m.leather,[0,0,-.09],[.245,.3,.14]);
  mesh(p,shapes.box,m.cloth,[0,.12,-.2],[.36,.2,.045]);
  for(const s of [-1,1]){
    beam(p,m.trim,[s*.14,-.22,-.18],[s*.14,.27,-.18],.016);
    beam(chest,m.leather,[s*.22,.48,.12],[s*.19,-.08,.15],.029);
  }
  const bedroll=mesh(p,shapes.cylinder,m.cloth,[0,.35,-.09],[.11,.58,.11],[0,0,Math.PI/2]);
  bedroll.name='rolled blanket';
  if(role==='courier')mesh(p,shapes.box,m.paper,[.18,-.09,-.2],[.14,.17,.05],[0,0,-.18]);
  if(role==='porter')for(const x of [-.12,.12])beam(p,m.wood,[x,-.36,.02],[x,.45,.02],.025);
}
function makeHuman(type,options){
  const profile=profiles[type]||profiles.npc,p={...profile};if(options.theme&&themes[options.theme]){p.metal=themes[options.theme][0];p.cloth=themes[options.theme][0];}
  const m={};for(const k of ['cloth','leather','metal','skin'])m[k]=surface(k,p[k]);
  Object.assign(m,{hair:surface('cloth',p.hair),trim:surface('metal',options.theme?themes[options.theme][1]:0xb59b69),wood:surface('leather',0x514333),dark:surface('leather',0x27282a),paper:surface('cloth',0xc6baa0),eye:surface('eye',0x372f25),eyeWhite:surface('eye',0xb8b2a5)});
  const g=new T.Group();g.name=`Q detailed ${type}`;const body=group(g,'body'),pelvis=group(body,'pelvis',0,.985,0),spine=group(pelvis,'spine',0,.18,0),chest=group(spine,'chest',0,-.18,0);
  const width=p.broad?1.13:p.slight?.94:1;
  const torso=tailored(chest,m.cloth,[[-.15,.224,.146],[-.04,.222,.145],[.10,.191,.129],[.20,.216,.146],[.33,.255,.163],[.43,.263,.155],[.49,.26,.137],[.54,.175,.104],[.57,.081,.073]],
    {axis:'y',joints:['pelvis','spine','chest'],centres:[.09,.31],widths:[.18,.20],ascending:true},18,.025);torso.scale.x=width;
  mesh(pelvis,shell([[-.24,.235,.17],[-.13,.239,.166],[.01,.222,.155]]),m.cloth);
  mesh(chest,shell([[-.015,.23,.17],[.053,.23,.17]]),m.leather);
  mesh(chest,shapes.box,m.trim,[.01,.019,.18],[.073,.065,.022]);
  // Tailored seams and garment closures are geometry, kept within each joint's material batch.
  for(const s of [-1,1])beam(chest,m.leather,[s*.12,.1,.14],[s*.2,.49,.13],.012);
  for(const y of [.18,.27,.36])ellipsoid(chest,m.trim,[0,y,.161],[.009,.01,.009]);
  if(p.armored){
    mesh(chest,shell([[.09,.207,.149],[.2,.233,.181],[.36,.27,.193],[.48,.274,.168],[.51,.19,.13]]),m.metal,[0,0,.014],[width,1,1]);
    beam(chest,m.trim,[0,.13,.199],[0,.45,.213],.014);
    for(const s of [-1,1])for(let j=0;j<3;j++)mesh(pelvis,shapes.box,m.metal,[s*.125,-.07-j*.072,.16+j*.013],[.19,.079,.038],[0,0,s*.05]);
  }
  const neck=group(chest,'neck',0,.6,0);ellipsoid(neck,m.skin,[0,.018,0],[.08,.12,.078]);
  const head=group(neck,'head',0,.16,0);
  mesh(head,faceSurface(type),faceMaterial(m.skin,type));
  for(const s of [-1,1]){
    ellipsoid(head,m.eyeWhite,[s*.046,.050,.100],[.022,.008,.010]);
    ellipsoid(head,m.eye,[s*.046,.050,.109],[.008,.008,.003]);
    const lid=group(head,`eyelid-${s===-1?0:1}`,s*.046,.058,.100);
    mesh(lid,new T.SphereGeometry(1,10,4,0,Math.PI*2,0,Math.PI*.5),m.skin,[0,-.001,0],[.024,.018,.017]);
    beam(head,m.hair,[s*.025,.078,.109],[s*.079,.073,.096],.007);
  }
  const hair=mesh(head,new T.SphereGeometry(1,12,8,0,Math.PI*2,0,Math.PI*.58),m.hair,[0,.06,-.018],[.125,.147,.123]);hair.rotation.x=-.2;
  if(type==='smith')ellipsoid(head,m.hair,[0,-.088,.067],[.089,.043,.06]);
  if(type==='sena')ellipsoid(head,m.hair,[0,-.035,-.105],[.058,.12,.048]);
  if(p.hood){
    mesh(head,new T.SphereGeometry(1,16,10,Math.PI*.81,Math.PI*1.38,0,Math.PI*.92),m.cloth,[0,.04,-.027],[.147,.193,.153]);
    for(const s of [-1,1])beam(chest,m.cloth,[s*.1,.66,.08],[s*.24,.47,.07],.047);
  }
  if(p.helmet){
    mesh(head,helmetGeometry(),m.metal,[0,.056,-.006],[.138,.174,.137]);
    for(const s of [-1,1])mesh(head,shapes.box,m.metal,[s*.094,-.011,.105],[.058,.125,.038],[0,s*.18,s*.12]);
    beam(head,m.trim,[0,.19,.07],[0,.005,.148],.012);
  }
  const arms=[],legs=[],sleeves=[];
  for(const [i,s]of [-1,1].entries()){
    const shoulder=group(chest,`arm-${i}`,s*.313*width,.46,0),elbow=group(shoulder,`elbow-${i}`,0,-.33,0),hand=group(elbow,`hand-${i}`,0,-.31,0);
    // One sleeve runs through shoulder, elbow and wrist; weights blend only
    // across anatomical joint collars, while rigid armor stays on its bone.
    sleeves.push(tailored(shoulder,m.cloth,[[-.643,.039,.038],[-.60,.047,.043],[-.52,.061,.059],[-.43,.067,.066],[-.37,.060,.059],[-.33,.061,.063],[-.29,.068,.069],[-.20,.085,.083],[-.11,.091,.089],[-.04,.109,.108],[.035,.080,.083],[.065,.018,.025]],
      {axis:'y',joints:['chest',shoulder.name,elbow.name,hand.name],centres:[.010,-.33,-.62],widths:[.14,.16,.09]},12,.035));
    if(p.armored){
      mesh(shoulder,new T.SphereGeometry(1,12,6,0,Math.PI*2,0,Math.PI*.62),m.metal,[s*.017,-.035,0],[.122,.113,.122]);
      tailored(elbow,m.metal,[[-.268,.051,.054],[-.23,.060,.062],[-.10,.071,.074],[-.065,.069,.073]],null,12);
    }
    mesh(elbow,shapes.cylinder,m.leather,[0,-.274,0],[.055,.035,.054]);
    handGeometry(hand,m,s,i,type==='patient'||!p.armored);
    arms.push(shoulder);
    const hip=group(pelvis,`leg-${i}`,s*.133,0,0),knee=group(hip,`knee-${i}`,0,-.445,0),foot=group(knee,`foot-${i}`,0,-.435,0);
    tailored(hip,m.cloth,[[-.66,.064,.069],[-.56,.078,.080],[-.49,.070,.073],[-.445,.070,.079,.004],[-.40,.078,.079],[-.31,.098,.093],[-.18,.116,.112,-.008],[-.06,.12,.120,-.014],[.04,.101,.108]],
      {axis:'y',joints:['pelvis',hip.name,knee.name],centres:[-.035,-.445],widths:[.16,.18]},12,.033);
    tailored(knee,m.leather,[[-.453,.052,.061,.018],[-.405,.053,.061,.004],[-.34,.056,.061],[-.24,.078,.077],[-.14,.079,.080],[-.095,.074,.075]],
      {axis:'y',joints:[knee.name,foot.name],centres:[-.407],widths:[.105]},12,.018);
    if(p.armored){
      ellipsoid(knee,m.metal,[0,-.006,.061],[.074,.073,.044]);
      mesh(knee,new T.CylinderGeometry(.078,.059,.21,10,1,true,Math.PI*1.55,Math.PI*.9),m.metal,[0,-.19,.01]);
    }
    mesh(foot,bootGeometry(),m.leather);mesh(foot,bootGeometry(true),m.dark);
    for(let row=0;row<3;row++)beam(foot,m.dark,[-.026,-.001-row*.013,.015+row*.027],[.026,-.001-row*.013,.021+row*.027],.003);
    beam(knee,m.trim,[-.062,-.13,.058],[.062,-.13,.058],.007);legs.push(hip);
  }
  if(type==='npc')upperCloth([torso,...sleeves],m.cloth);
  const right=g.getObjectByName('hand-1'),left=g.getObjectByName('hand-0');
  if(['player','soldier','boss'].includes(type)){
    blade(right,m);if(type==='player'){blade(right,m,'greatsword');blade(right,m,'spear');}
  }
  if(p.cloak){const cape=mesh(chest,cloakGeometry(type==='boss'),m.cloth);cape.name='cape';cape.userData.dynamicSurface=true;}
  if(p.keeper){
    // Keep the authored bone order even when the scene supplies rigid equipment.
    const staff=group(right,'staff');
    if(!options.omitKeeperStaff){
      beam(staff,m.wood,[0,.7,0],[0,-.79,0],.026);
      mesh(staff,shapes.ring,m.trim,[0,.77,0],[.093,.13,.093]);ellipsoid(staff,m.paper,[0,.77,0],[.05,.069,.047]);
    }
    mesh(chest,shell([[-.76,.31,.21],[-.35,.27,.18],[-.16,.24,.17]]),m.cloth);
    beam(chest,m.trim,[-.18,.45,.135],[.18,.45,.135],.012);
  }
  if(p.pack)pack(chest,m,type);
  if(type==='smith'){
    mesh(chest,shell([[-.42,.2,.17],[-.03,.2,.182],[.38,.17,.171]],12),m.leather,[0,0,.02]);
    const tool=group(right,'hammer');beam(tool,m.wood,[0,.12,0],[0,-.29,0],.024);mesh(tool,shapes.box,m.metal,[0,-.31,0],[.235,.108,.103]);
    mesh(chest,shapes.box,m.leather,[.12,-.15,.202],[.13,.17,.025]);
  }
  if(type==='healer'){
    const basket=group(chest,'herb satchel',-.27,-.12,0);ellipsoid(basket,m.leather,[0,0,0],[.14,.19,.12]);
    for(let i=0;i<4;i++){const x=(i-1.5)*.043;beam(basket,m.wood,[x,.08,0],[x,.34+i*.013,0],.006);mesh(basket,shapes.sphere,m.cloth,[x,.27+i*.013,0],[.029,.093,.016],[0,0,(i-1.5)*.25]);}
    beam(chest,m.paper,[-.24,.48,.11],[.26,-.06,.14],.035);
  }
  if(type==='patient'){
    for(let i=0;i<5;i++)mesh(g.getObjectByName('elbow-0'),shapes.cylinder,m.paper,[0,-.045-i*.043,0],[.078,.033,.078]);
    beam(chest,m.paper,[-.2,.45,.14],[.19,.1,.21],.027);
  }
  if(type==='scout'){
    const staff=group(right,'staff');beam(staff,m.wood,[0,.2,0],[0,-.88,0],.021);
    ellipsoid(chest,m.leather,[.27,-.03,.03],[.09,.14,.1]);
  }
  if(type==='ranger'){
    const bow=group(left,'bow',0,.035,.013);bow.rotation.z=-Math.PI/2;
    const curve=new T.CatmullRomCurve3([new T.Vector3(0,-.59,0),new T.Vector3(.16,-.34,0),new T.Vector3(.095,0,0),new T.Vector3(.16,.34,0),new T.Vector3(0,.59,0)]);
    mesh(bow,new T.TubeGeometry(curve,20,.019,5,false),m.wood);
    const upper=group(bow,'string-upper',0,.59,0),lower=group(bow,'string-lower',0,-.59,0);
    beam(upper,m.paper,[0,0,0],[0,-.59,0],.003);beam(lower,m.paper,[0,0,0],[0,.59,0],.003);
    // One rigid nocked arrow is weighted into the existing wood/metal batches.
    // Its bone is collapsed outside the loaded phase; no independent draw call.
    const loaded=group(bow,'loaded-arrow'),arrow=arrowGeometry();mesh(loaded,arrow.shaft.rotateY(Math.PI/2),m.wood);mesh(loaded,arrow.tip.rotateY(Math.PI/2),m.trim);
    const quiver=group(chest,'quiver',.2,.26,-.24);quiver.rotation.z=-.18;mesh(quiver,shapes.cylinder,m.leather,[0,0,0],[.082,.48,.077]);
    for(let i=0;i<4;i++){const x=(i-1.5)*.029;beam(quiver,m.wood,[x,-.1,0],[x,.4,0],.005);mesh(quiver,shapes.box,m.paper,[x,.33,0],[.024,.083,.004]);}
  }
  if(type==='player'){
    const flask=group(right,'flask');flask.userData.independentVisibility=true;ellipsoid(flask,m.paper,[0,-.04,.025],[.062,.086,.06]);beam(flask,m.trim,[0,.03,.025],[0,.07,.025],.026);
    ellipsoid(chest,m.leather,[-.24,-.06,.035],[.08,.13,.07]);
  }
  if(type==='boss'||options.theme){
    const crown=group(head,'crown');
    for(const s of [-1,1]){
      const curve=new T.CatmullRomCurve3([new T.Vector3(s*.10,.13,0),new T.Vector3(s*.21,.28,-.025),new T.Vector3(s*.22,.46,-.09),new T.Vector3(s*.13,.59,-.12)]);
      mesh(crown,new T.TubeGeometry(curve,10,.024,6,false),m.trim);
      beam(crown,m.trim,[s*.21,.29,-.035],[s*.34,.4,-.08],.014,.005);
    }
    if(options.theme==='tide')for(const s of [-1,1])mesh(chest,shapes.cone,m.trim,[s*.32,.56,0],[.045,.31,.06],[0,0,-s*.65]);
    if(options.theme==='gale')for(let i=0;i<3;i++)mesh(chest,shapes.box,m.paper,[.2+i*.046,.49,-.18],[.034,.55,.016],[0,0,-.18-i*.12]);
    if(options.theme==='moss')for(let i=0;i<5;i++)mesh(chest,shapes.decorSphere,m.cloth,[Math.sin(i*2)*.28,.3+Math.cos(i)*.16,.13],[.067,.042,.028*Math.sin(Math.PI*.4)]);
    if(options.theme==='ember')for(let i=0;i<3;i++)beam(chest,m.trim,[-.12+i*.09,.18,.202],[-.17+i*.09,.38,.208],.011);
  }
  if(type==='boss')g.scale.setScalar(2.3);else if(type==='patient')g.scale.setScalar(.97);
  g.userData.modelKind='articulated-human';g.userData.family=type;g.userData.theme=options.theme||null;
  return g;
}
function makeWolf(){
  const g=new T.Group();g.name='Q detailed wolf';const body=group(g,'body'),pelvis=group(body,'pelvis',0,.86,0),chest=group(pelvis,'chest');
  const fur=surface('cloth',0x626861),dark=surface('cloth',0x454e4b),light=surface('cloth',0x929488),leather=surface('leather',0x272e2d),eye=surface('skin',0xb08d4d),tooth=surface('skin',0xc5bca2);
  const trunk=tailored(chest,fur,[[-.68,.025,.025],[-.58,.17,.17],[-.4,.239,.26,-.015],[-.16,.20,.265,-.015],[.06,.196,.28],[.30,.234,.302],[.45,.16,.22],[.53,.035,.045]],
    {axis:'y',joints:['pelvis','chest'],centres:[-.18],widths:[.50],ascending:true},16,.022);trunk.rotation.x=Math.PI/2;
  ellipsoid(chest,dark,[0,.178,-.075],[.16,.098,.48]);ellipsoid(chest,light,[0,-.095,.34],[.18,.20,.23]);
  const neck=group(chest,'neck',0,.11,.41);ellipsoid(neck,fur,[0,.078,.098],[.22,.29,.27]);
  for(let i=0;i<8;i++){const a=i/8*Math.PI*2;mesh(neck,shapes.cone,i%2?dark:fur,[Math.sin(a)*.17,Math.cos(a)*.2,.0],[.082,.21,.075],[.6,0,-a]);}
  const head=group(neck,'head',0,.18,.2);ellipsoid(head,fur,[0,0,.05],[.175,.174,.24]);
  ellipsoid(head,light,[0,-.047,.264],[.103,.081,.186]);ellipsoid(head,leather,[0,-.024,.409],[.07,.052,.055]);
  const jaw=group(head,'jaw',0,-.095,.126);ellipsoid(jaw,dark,[0,-.017,.117],[.089,.036,.145]);
  for(const s of [-1,1]){
    ellipsoid(head,dark,[s*.131,.027,.176],[.033,.027,.039]);ellipsoid(head,eye,[s*.143,.034,.189],[.015,.013,.019]);
    const ear=group(head,`ear-${s}`,s*.12,.128,-.025);mesh(ear,shapes.cone,fur,[0,.081,0],[.081,.227,.06],[0,0,-s*.17]);mesh(ear,shapes.cone,leather,[0,.077,.037],[.046,.145,.019],[0,0,-s*.17]);
    mesh(jaw,shapes.cone,tooth,[s*.061,.03,.189],[.009,.046,.008]);
  }
  for(let i=0;i<4;i++){
    const s=i%2===0?-1:1,front=i<2,hip=group(pelvis,`leg-${i}`,s*.18,-.018,front?.34:-.39),knee=group(hip,`knee-${i}`,0,-.36,0),hock=front?null:group(knee,`hock-${i}`,0,-.21,0),foot=group(hock||knee,`foot-${i}`,0,front?-.36:-.15,0);
    tailored(hip,fur,[[-.74,.029,.032],[-.68,.036,.043],[-.56,.040,.047],[-.42,.043,.055],[-.36,.054,.066],[-.28,.062,.074],[-.16,front?.075:.101,.105,front?0:-.035],[-.035,front?.075:.105,.100],[.035,.032,.043]],
      {axis:'y',joints:front?['pelvis',hip.name,knee.name,foot.name]:['pelvis',hip.name,knee.name,hock.name,foot.name],centres:front?[-.015,-.36,-.70]:[-.015,-.36,-.57,-.70],widths:front?[.16,.15,.09]:[.16,.15,.14,.09]},10,.025);
    ellipsoid(foot,light,[0,-.058,.044],[.067,.069,.105]);
    for(const x of [-.033,0,.033])ellipsoid(foot,leather,[x,-.071,.111],[.013,.019,.027]);
  }
  const tail=group(pelvis,'tail-0',0,.02,-.55);tail.rotation.x=.9;
  const tail1=group(tail,'tail-1',0,-.23,0);group(tail1,'tail-2',0,-.23,0);
  tailored(tail,fur,[[-.73,.004,.004],[-.64,.029,.028],[-.53,.048,.046],[-.46,.057,.056],[-.35,.068,.062],[-.23,.076,.073],[-.12,.080,.077],[.02,.070,.070]],
    {axis:'y',joints:['tail-0','tail-1','tail-2'],centres:[-.23,-.46],widths:[.22,.22]},10,.06);
  g.userData.modelKind='articulated-quadruped';g.userData.family='wolf';return g;
}
// Merge only direct, non-animated mesh children; articulated transforms survive.
// One draw per joint/material instead of one per button, seam, finger, or fur tuft.
function batchJointMeshes(root){
  for(const child of [...root.children])if(child.isGroup||child.isBone)batchJointMeshes(child);
  const batches=new Map();
  for(const child of [...root.children])if(child.isMesh&&!child.userData.dynamicSurface&&!child.userData.deform){
    child.updateMatrix();const geo=child.geometry.clone().applyMatrix4(child.matrix);const key=child.material;
    if(!batches.has(key))batches.set(key,[]);batches.get(key).push(geo);root.remove(child);
  }
  for(const [mat,geometries]of batches){const merged=mergeGeometries(geometries,false);if(!merged)throw Error(`Actor geometry merge failed: ${root.name}`);mesh(root,merged,mat);for(const geo of geometries)geo.dispose();}
}
// Bind the authored joint surfaces into shared material skin batches. The geometry
// includes blended shoulder/elbow/wrist, pelvis/knee/ankle and spine weights. Weapons
// with independent visibility and the deforming cape retain their own meshes.
function bindArticulatedSkin(root){
  root.updateMatrixWorld(true);const inverseRoot=root.matrixWorld.clone().invert(),bones=[];
  root.traverse(n=>{if(n.isBone)bones.push(n);});
  const batches=new Map(),remove=[];
  root.traverse(n=>{
    if(!n.isMesh||n.userData.dynamicSurface)return;
    for(let p=n.parent;p&&p!==root;p=p.parent)if(p.userData.independentVisibility)return;
    const boneIndex=bones.indexOf(n.parent);if(boneIndex<0)return;
    const geometry=n.geometry.clone().applyMatrix4(inverseRoot.clone().multiply(n.matrixWorld));
    const count=geometry.attributes.position.count,indices=new Uint16Array(count*4),weights=new Float32Array(count*4);
    const rule=n.userData.deform;
    for(let i=0;i<count;i++){
      let influences=[[boneIndex,1]];
      if(rule){
        const coordinate=n.geometry.attributes.position.getComponent(i,rule.axis==='x'?0:rule.axis==='z'?2:1);
        const values=rule.joints.map(()=>0);values[0]=1;
        for(let j=0;j<rule.centres.length;j++){
          const direction=rule.ascending?1:-1;
          const u=Math.max(0,Math.min(1,.5+direction*(coordinate-rule.centres[j])/rule.widths[j]));
          const blend=u*u*(3-2*u),remaining=values[j];values[j]=remaining*(1-blend);values[j+1]=remaining*blend;
        }
        influences=values.map((w,j)=>[bones.findIndex(b=>b.name===rule.joints[j]),w]).filter(([,w])=>w>0);
        if(influences.some(([index])=>index<0))throw Error('Unknown authored deform joint');
      }
      for(let j=0;j<influences.length;j++){indices[i*4+j]=influences[j][0];weights[i*4+j]=influences[j][1];}
    }
    geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute(indices,4));geometry.setAttribute('skinWeight',new T.Float32BufferAttribute(weights,4));
    if(!batches.has(n.material))batches.set(n.material,[]);batches.get(n.material).push(geometry);remove.push(n);
  });
  const skeleton=new T.Skeleton(bones);
  for(const n of remove)n.removeFromParent();
  for(const [material,parts]of batches){
    const geometry=mergeGeometries(parts,false);if(!geometry)throw Error('Q actor skin merge failed');
    const skin=new T.SkinnedMesh(geometry,material);skin.name=`${material.name} skin`;skin.castShadow=true;skin.receiveShadow=true;
    // Finite model bounds are evaluated by the scene's existing distance culling;
    // rest-pose skin bounds must not cull an extended sword or a fallen figure.
    skin.frustumCulled=false;root.add(skin);skin.bind(skeleton,root.matrixWorld);for(const part of parts)part.dispose();
  }
}
const templates=new Map();
export function buildActorGeometry(type='player',options={}){
  type=type==='knight'?'soldier':type==='keeper'?'npc':type==='archer'?'ranger':type;
  if(!ACTOR_FAMILIES.includes(type))throw Error(`Unknown Q actor family: ${type}`);
  if(options.theme&&!themes[options.theme])throw Error(`Unknown Q actor theme: ${options.theme}`);
  if(options.omitKeeperStaff&&type!=='npc')throw Error('Only the keeper has replaceable staff equipment');
  const key=`${type}/${options.theme||''}/${options.omitKeeperStaff?'without-staff':''}`;
  if(!templates.has(key)){const template=type==='wolf'?makeWolf():makeHuman(type,options);batchJointMeshes(template);bindArticulatedSkin(template);templates.set(key,template);}
  const model=cloneSkeleton(templates.get(key));
  // SkeletonUtils clones each material skin's Skeleton separately. All these
  // batches have the same bone order and bind transform; keep one palette per
  // actor so adding fingers does not multiply matrix updates by material count.
  let palette;model.traverse(node=>{if(node.isSkinnedMesh){if(!palette)palette=node.skeleton;else node.skeleton=palette;}});
  const cape=model.getObjectByName('cape');if(cape){cape.geometry=cape.geometry.clone();cape.userData.base=Float32Array.from(cape.geometry.attributes.position.array);}
  return model;
}
