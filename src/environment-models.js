import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { surfaceMaterial } from './environment-materials.js';
import { forestCrownGeometry, forestTrunkGeometry } from './forest-geometry.js';

const unitBox=new T.BoxGeometry(1,1,1),unitCylinder=new T.CylinderGeometry(1,1,1,10);
const geometries=new Map(), propTemplates=new Map();
export function chamferBox(bevel=.07){
  const key=`box:${bevel}`;if(geometries.has(key))return geometries.get(key);
  const g=new T.BoxGeometry(1,1,1,2,2,2),p=g.attributes.position;
  for(let i=0;i<p.count;i++){const v=new T.Vector3().fromBufferAttribute(p,i),inner=v.clone().clampScalar(-.5+bevel,.5-bevel),offset=v.clone().sub(inner).normalize().multiplyScalar(bevel);v.copy(inner).add(offset);p.setXYZ(i,v.x,v.y,v.z);}g.computeVertexNormals();geometries.set(key,g);return g;
}
export function rockGeometry(seed=1,detail=1){
  const key=`rock:${seed}:${detail}`;if(geometries.has(key))return geometries.get(key);
  const g=new T.IcosahedronGeometry(1,detail),p=g.attributes.position;
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),d=.89+Math.sin(x*8.1+y*4.2+seed)*Math.cos(z*5.3-y*3.7+seed)*.13; p.setXYZ(i,x*d+.09*y,y*d,z*d);}
  g.computeVertexNormals();geometries.set(key,g);return g;
}
export function mountainGeometry(seed=1){
  const radial=11,rings=7,vertices=[],indices=[];
  for(let j=0;j<=rings;j++)for(let i=0;i<=radial;i++){const a=i/radial*Math.PI*2,h=j/rings,r=(1-h)*(.78+Math.sin(i*2.7+seed)*.17)*(1+Math.sin(j*2.8+i*1.7+seed)*.13);vertices.push(Math.cos(a)*r+Math.sin(h*3+seed)*h*.12,h-.5,Math.sin(a)*r+Math.cos(h*4+seed)*h*.17);}
  for(let j=0;j<rings;j++)for(let i=0;i<radial;i++){const a=j*(radial+1)+i,b=a+radial+1;indices.push(a,b,a+1,a+1,b,b+1);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setAttribute('uv',new T.Float32BufferAttribute(vertices.flatMap((_,i)=>i%3===0?[vertices[i],vertices[i+2]]:[]),2));g.setIndex(indices);g.computeVertexNormals();return g;
}
export function part(parent,geometry,material,position=[0,0,0],scale=[1,1,1],rotation=[0,0,0]){
  const m=new T.Mesh(geometry,material);m.position.set(...position);m.scale.set(...scale);m.rotation.set(...rotation);m.receiveShadow=true;parent.add(m);return m;
}
export function beam(parent,material,a,b,r=.05){const from=new T.Vector3(...a),to=new T.Vector3(...b),m=part(parent,unitCylinder,material,from.clone().add(to).multiplyScalar(.5).toArray(),[r,from.distanceTo(to),r]);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),to.sub(from).normalize());return m;}
export function block(parent,material,pos,scale,rotation){return part(parent,chamferBox(),material,pos,scale,rotation);}

// One draw per material per authored prop, rather than every board or stone.
// Call only for fully static subgraphs; movable flames/wheels remain siblings.
export function batchProp(group){
  group.updateMatrixWorld(true);const inverse=group.matrixWorld.clone().invert(),sets=new Map();
  group.traverse(n=>{if(!n.isMesh||n.isInstancedMesh||Array.isArray(n.material))return;const list=sets.get(n.material)||[];const geo=n.geometry.clone();geo.applyMatrix4(inverse.clone().multiply(n.matrixWorld));list.push(geo.index?geo.toNonIndexed():geo);sets.set(n.material,list);});
  group.clear();for(const[mat,list]of sets){const geometry=mergeGeometries(list,false);for(const item of list)item.dispose();if(!geometry)throw new Error('Incompatible environment geometry');const m=part(group,geometry,mat);m.castShadow=true;}return group;
}
function palette(){return{stone:surfaceMaterial('stone',0x8e9384),wood:surfaceMaterial('wood',0x76614a),darkWood:surfaceMaterial('wood',0x463c31),iron:surfaceMaterial('metal',0x555957),brass:surfaceMaterial('metal',0xb69c64),cloth:surfaceMaterial('cloth',0x8b8564)};}
export function createCrate({width=1.2,height=.7,depth=.8,chest=false}={}){
  const key=`crate:${width}:${height}:${depth}:${chest}`;if(propTemplates.has(key))return propTemplates.get(key).clone(true);
  const g=new T.Group(),{wood,darkWood,iron,brass}=palette();g.userData.environmentFamily=chest?'chest':'cargo';
  block(g,darkWood,[0,height*.48,0],[width*.98,height*.94,depth*.96]);
  for(let i=0;i<5;i++)for(const side of[-1,1])block(g,wood,[(i-2)*width/5,height*.5,side*depth*.5],[width/5-.018,height-.045,.045]);
  for(const side of[-1,1]){block(g,wood,[side*width*.5,height*.5,0],[.045,height-.045,depth]);block(g,iron,[side*width*.33,height*.5,depth*.525],[.075,height,.028]);block(g,iron,[side*width*.33,height*.5,-depth*.525],[.075,height,.028]);}
  if(chest){const lid=new T.CylinderGeometry(depth*.5,depth*.5,width,10,1,false,0,Math.PI);lid.rotateZ(Math.PI/2);part(g,lid,wood,[0,height,0]);for(const x of[-width*.33,width*.33])part(g,new T.TorusGeometry(depth*.5+.008,.035,4,12,Math.PI),iron,[x,height,0],[1,1,1],[0,Math.PI/2,0]);block(g,brass,[0,height*.8,depth*.56],[.15,.22,.05]);}
  else{for(let i=0;i<4;i++)block(g,wood,[0,height,(i-1.5)*depth/4],[width,.045,depth/4-.015]);for(const side of[-1,1])block(g,iron,[side*width*.33,height+.03,0],[.065,.04,depth]);}
  batchProp(g);propTemplates.set(key,g);return g.clone(true);
}
export function createHerb({pot=false,relic=false}={}){
  const key=`herb:${pot}:${relic}`;if(propTemplates.has(key))return propTemplates.get(key).clone(true);
  const g=new T.Group(),leaf=surfaceMaterial('leaf',relic?0xb4d7bb:0x6e9665,{side:T.DoubleSide}),stem=surfaceMaterial('wood',0x557143);g.userData.environmentFamily='herb';
  if(pot)part(g,new T.CylinderGeometry(.2,.13,.28,12),surfaceMaterial('stone',0x977154),[0,.14,0]);
  for(let s=0;s<3;s++){const x=(s-1)*.13,base=pot?.25:0,top=.56+s*.075;beam(g,stem,[x,base,0],[x+.08,base+top,0],.013);for(let i=0;i<4;i++)for(const side of[-1,1]){const shape=new T.Shape();shape.moveTo(0,0);shape.quadraticCurveTo(.24,.07,.3,.16);shape.quadraticCurveTo(.11,.2,0,0);const geo=new T.ShapeGeometry(shape,3);part(g,geo,leaf,[x+.025,base+.12+i*.11,0],[side*(1-i*.12),1,1],[.5+side*.2,side*.4,side*.15]);}part(g,new T.SphereGeometry(.035,6,4),surfaceMaterial('leaf',0xd0c9a1),[x+.07,base+top,0]);}
  batchProp(g);propTemplates.set(key,g);return g.clone(true);
}
export function createLantern(){
  const g=new T.Group(),{iron,brass}=palette(),glass=new T.MeshStandardMaterial({color:0xffdd9a,emissive:0xeb9a39,emissiveIntensity:1.5,transparent:true,opacity:.76,roughness:.3});g.userData.environmentFamily='lantern';
  part(g,new T.CylinderGeometry(.15,.18,.3,8),glass,[0,.24,0]);for(const y of[.07,.43])part(g,new T.CylinderGeometry(.2,.2,.05,8),iron,[0,y,0]);for(let i=0;i<4;i++){const a=i*Math.PI*.5;beam(g,brass,[Math.sin(a)*.15,.08,Math.cos(a)*.15],[Math.sin(a)*.15,.44,Math.cos(a)*.15],.018);}part(g,new T.ConeGeometry(.23,.17,8),iron,[0,.52,0]);part(g,new T.TorusGeometry(.09,.018,4,12),iron,[0,.67,0]);return batchProp(g);
}
export function createHouse(){
  if(propTemplates.has('house'))return propTemplates.get('house').clone(true);
  const g=new T.Group(),{stone,wood,darkWood}=palette(),plaster=surfaceMaterial('stone',0xb9ad93,{finish:'plaster',worldScale:2.3}),roof=surfaceMaterial('stone',0x4c6467),dark=surfaceMaterial('wood',0x292e2a);g.userData.environmentFamily='house';
  block(g,stone,[0,.25,0],[5.7,.5,4.8]);block(g,plaster,[0,1.95,0],[5.65,3.1,4.75]);
  // Close the previously open gable: the roof now has supporting walls and
  // timber joinery rather than floating slate rows over an empty triangle.
  const gable=new T.BufferGeometry();gable.setAttribute('position',new T.Float32BufferAttribute([-2.825,3.5,2.38,2.825,3.5,2.38,0,5.2,2.38,2.825,3.5,-2.38,-2.825,3.5,-2.38,0,5.2,-2.38],3));gable.setAttribute('uv',new T.Float32BufferAttribute([0,0,1,0,.5,1,0,0,1,0,.5,1],2));gable.computeVertexNormals();part(g,gable,plaster);
  for(const z of[-2.405,2.405]){block(g,darkWood,[0,4.18,z],[.14,1.9,.16]);for(const side of[-1,1])beam(g,wood,[side*2.7,3.51,z],[0,5.16,z],.052);}
  for(const x of[-2.82,0,2.82])for(const z of[-2.4,2.4])block(g,wood,[x,1.85,z],[.18,3.5,.17]);for(const y of[.6,2.9])for(const z of[-2.42,2.42])block(g,darkWood,[0,y,z],[5.8,.15,.17]);
  for(const side of[-1,1])for(const z of[-2.43,2.43])beam(g,wood,[side*2.72,.68,z],[side*.12,2.82,z],.065);
  // Gabled slate roof with overlapping shingle rows and real raised ridge.
  const slope=.65;for(const side of[-1,1])for(let row=0;row<7;row++)for(let col=0;col<9;col++){const x=side*(.23+row*.45),y=5.22-Math.abs(x)*slope,z=(col-4)*.65+(row%2)*.055;block(g,roof,[x,y,z],[.58,.085,.69],[0,0,-side*Math.atan(slope)]);}
  block(g,darkWood,[0,5.28,0],[.22,.18,6.05]);for(const z of[-2.85,2.85])for(const side of[-1,1])beam(g,wood,[0,5.25,z],[side*3.2,3.15,z],.075);
  block(g,dark,[0,1.18,2.39],[1.3,2.1,.08]);for(let i=0;i<6;i++)block(g,wood,[(i-2.5)*.19,1.16,2.455],[.17,1.98,.07]);for(const y of[.55,1.72])block(g,darkWood,[0,y,2.51],[1.19,.1,.05]);
  for(const x of[-1.83,1.83]){block(g,dark,[x,1.98,2.44],[.88,1.05,.07]);block(g,surfaceMaterial('cloth',0xe3ba70,{emissive:0x604116,emissiveIntensity:.28}),[x,1.98,2.48],[.64,.8,.025]);block(g,wood,[x,1.98,2.52],[.065,.91,.06]);block(g,wood,[x,1.98,2.52],[.73,.065,.06]);block(g,stone,[x,1.45,2.55],[1.04,.14,.26]);}
  block(g,stone,[1.75,4.6,-.8],[.84,2.8,.8]);for(let row=0;row<8;row++)block(g,stone,[1.75,3.45+row*.34,-.8],[.89,.29,.85]);block(g,darkWood,[1.75,6.08,-.8],[1.04,.16,1]);batchProp(g);propTemplates.set('house',g);return g.clone(true);
}
export function createTent(color=0x948460){
  const g=new T.Group(),{wood}=palette(),cloth=surfaceMaterial('cloth',color,{side:T.DoubleSide});g.userData.environmentFamily='tent';
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute([-2.1,0,-2.2,0,2.7,-2.2,-2.1,0,2.2,0,2.7,2.2,2.1,0,-2.2,2.1,0,2.2],3));geo.setAttribute('uv',new T.Float32BufferAttribute([0,0,.5,0,0,1,.5,1,1,0,1,1],2));geo.setIndex([0,2,1,2,3,1,1,3,4,3,5,4]);geo.computeVertexNormals();part(g,geo,cloth);
  for(const z of[-2.2,2.2])beam(g,wood,[0,0,z],[0,2.78,z],.06);beam(g,wood,[0,2.78,-2.4],[0,2.78,2.4],.06);
  for(const side of[-1,1])for(const z of[-2.15,2.15]){beam(g,wood,[side*2.05,.18,z],[side*2.6,.05,z*1.1],.014);beam(g,wood,[side*2.6,-.06,z*1.1],[side*2.6,.25,z*1.1],.035);}return batchProp(g);
}
export function createWheel(radius=.6){
  const g=new T.Group(),{wood,iron}=palette();part(g,new T.TorusGeometry(radius,.075,5,18),iron);part(g,new T.TorusGeometry(radius-.055,.07,5,18),wood);for(let i=0;i<8;i++){const a=i*Math.PI/4;beam(g,wood,[0,0,0],[Math.cos(a)*(radius-.06),Math.sin(a)*(radius-.06),0],.026);}part(g,new T.CylinderGeometry(.11,.11,.25,10),iron,[0,0,0],[1,1,1],[Math.PI/2,0,0]);return batchProp(g);
}
export function createCart(){
  const g=new T.Group(),{wood,darkWood,iron}=palette();g.userData.environmentFamily='cart';
  for(let i=0;i<8;i++)block(g,wood,[0,.87,(i-3.5)*.44],[2.4,.16,.42]);for(const x of[-1.15,1.15]){for(let i=0;i<3;i++)block(g,wood,[x,1.06+i*.22,0],[.12,.18,3.7]);for(const z of[-1.1,1.1]){const wheel=createWheel();wheel.position.set(x*1.13,.6,z);wheel.rotation.y=Math.PI/2;g.add(wheel);beam(g,iron,[-1.4,.6,z],[1.4,.6,z],.065);}}
  for(const x of[-.65,.65])block(g,darkWood,[x,.75,2.7],[.12,.14,2.2]);for(const x of[-.65,.65]){const crate=createCrate({width:.8,height:.65,depth:1.1});crate.position.set(x,.96,-.7);g.add(crate);}return batchProp(g);
}
export function createBoat(){
  const g=new T.Group(),{wood,darkWood}=palette();g.userData.environmentFamily='boat';
  // Curved clinker strips make a hollow grounded hull; open interior and thwarts.
  for(const side of[-1,1])for(let row=0;row<4;row++){const vertices=[],indices=[];for(let i=0;i<=12;i++){const z=(i/12-.5)*5.2,width=Math.sin(i/12*Math.PI)*(.44+row*.14);for(const dy of[0,.14])vertices.push(side*width,.12+row*.16+dy+Math.pow(Math.abs(z)/2.6,3)*.55,z);}for(let i=0;i<12;i++){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.setAttribute('uv',new T.Float32BufferAttribute(vertices.flatMap((_,i)=>i%3===0?[vertices[i],vertices[i+2]]:[]),2));geo.setIndex(indices);geo.computeVertexNormals();part(g,geo,surfaceMaterial('wood',row%2?0x735641:0x897059,{side:T.DoubleSide}));}for(const z of[-1.2,0,1.2])block(g,darkWood,[0,.62,z],[1.42,.1,.24]);beam(g,wood,[0,.3,-2.5],[0,.3,2.5],.09);return batchProp(g);
}
export function createBrazier(color=0x5e625b){
  const g=new T.Group(),stone=surfaceMaterial('stone',color),metal=surfaceMaterial('metal',0x555650);g.userData.environmentFamily='brazier';
  part(g,new T.CylinderGeometry(.43,.52,.17,10),stone,[0,.085,0]);part(g,new T.CylinderGeometry(.24,.34,.67,10),stone,[0,.48,0]);part(g,new T.CylinderGeometry(.48,.24,.3,12,1,true),metal,[0,.91,0]);part(g,new T.TorusGeometry(.48,.043,5,16),metal,[0,1.06,0],[1,1,1],[Math.PI/2,0,0]);for(let i=0;i<6;i++){const a=i*Math.PI/3;beam(g,metal,[Math.sin(a)*.33,.82,Math.cos(a)*.33],[Math.sin(a)*.44,1.23,Math.cos(a)*.44],.022);}return batchProp(g);
}
export function createStele(color,accent){
  const g=new T.Group(),stone=surfaceMaterial('stone',color);g.userData.environmentFamily='stele';
  block(g,stone,[0,.12,0],[1,.24,.65]);block(g,stone,[0,1.4,0],[.86,2.6,.43]);block(g,stone,[0,2.73,0],[.95,.13,.53]);for(let i=0;i<6;i++){const a=(i%2?-.1:.1);block(g,accent,[a,2.25-i*.31,.226],[.31,.032,.022],[0,0,i%2?.45:-.45]);}return batchProp(g);
}
export function coniferGeometry(){return forestCrownGeometry('pine');}
export function broadleafGeometry(){return forestCrownGeometry('crown');}
export function treeTrunkGeometry(){return forestTrunkGeometry();}
export function grassGeometry(blades=3){
  const pos=[],uv=[],indices=[];for(let i=0;i<blades;i++){const a=i*Math.PI/3,dx=Math.cos(a)*.065,dz=Math.sin(a)*.065,offset=pos.length/3;pos.push(-dx,0,-dz,dx,0,dz,-dx*.55,.38,-dz*.55,dx*.55,.38,dz*.55,.09*Math.cos(a),.73,.09*Math.sin(a));uv.push(0,0,1,0,0,.55,1,.55,.5,1);indices.push(offset,offset+1,offset+2,offset+1,offset+3,offset+2,offset+2,offset+3,offset+4);}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();return geo;
}

export function distantTreeGeometry(family){return family==='trunk'?forestTrunkGeometry(true):forestCrownGeometry(family==='pine'?'pine':'crown',true);}
