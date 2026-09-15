import * as T from 'three';
import { SALT_JOURNEY, SALT_TARGETS, saltObstacles } from './world-regions.js';
import { surfaceMaterial } from './environment-materials.js';
import { chamferBox, rockGeometry, createCrate, block, beam, part, batchProp } from './environment-models.js';

export class ExpeditionScene {
  constructor(scene,groundAt){
    this.root=new T.Group();scene.add(this.root);
    const stone=surfaceMaterial('stone',0xbdb298);
    const wood=surfaceMaterial('wood',0x786b51);
    const brass=surfaceMaterial('metal',0xc6ac70),iron=surfaceMaterial('metal',0x66695e);
    const add=(geometry,material,parent,x,y,z)=>{const mesh=new T.Mesh(geometry,material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;};
    this.solids=new Map();
    for(const o of saltObstacles()){
      const node=add(new T.CylinderGeometry(o.r*.95,o.r,o.height,o.type==='salt-gate'?12:7),stone,this.root,o.x,groundAt(o.x,o.z)+o.height/2,o.z);
      node.userData.colliderId=o.id;this.solids.set(o.id,node);
      if(o.type==='salt-rock'){node.geometry=new T.CylinderGeometry(o.r*.67,o.r,o.height,9,4);const positions=node.geometry.attributes.position;for(let i=0;i<positions.count;i++){const x=positions.getX(i),y=positions.getY(i),z=positions.getZ(i),factor=.88+.1*Math.sin(x*2.3+z*1.7+y*1.2);positions.setXYZ(i,x*factor,y,z*factor);}node.geometry.computeVertexNormals();}
      else {const masonry=new T.Group();node.add(masonry);const rows=Math.ceil(o.height/.7);for(let row=0;row<rows;row++)for(let i=0;i<12;i++){const a=(i+(row%2)*.5)/12*Math.PI*2;block(masonry,stone,[Math.sin(a)*o.r*.9,-o.height/2+.36+row*.65,Math.cos(a)*o.r*.9],[o.r*.48,.59,o.r*.2],[0,a,0]);}batchProp(masonry);}
      if(o.type==='salt-cistern'){add(new T.TorusGeometry(o.r*.86,.19,6,24),brass,node,0,o.height*.49,0).rotation.x=Math.PI/2;add(new T.CircleGeometry(o.r*.76,24),surfaceMaterial('water',0x748d82,{roughness:.28,metalness:.12}),node,0,o.height*.5+.015,0).rotation.x=-Math.PI/2;}
    }
    this.targets=new Map();
    for(const t of SALT_TARGETS){const g=new T.Group();g.position.set(t.x,groundAt(t.x,t.z),t.z);this.root.add(g);this.targets.set(t.id,g);
      if(t.kind==='board'){
        add(new T.BoxGeometry(.15,2.5,.15),wood,g,-.7,1.25,0);add(new T.BoxGeometry(.15,2.5,.15),wood,g,.7,1.25,0);
        add(new T.BoxGeometry(1.8,1,.15),wood,g,0,1.65,0);
        for(let i=0;i<4;i++)add(new T.BoxGeometry(1.25-i*.15,.035,.02),brass,g,0,1.95-i*.19,.1);
        this.seal=add(new T.TorusGeometry(.2,.045,5,12),brass,g,0,.7,.1);
        for(const x of[-.78,.78])block(g,iron,[x,1.65,.1],[.055,1.03,.045]);
      }else if(t.kind==='handle'){
        add(new T.BoxGeometry(1.7,.65,1.15),wood,g,0,.32,0);
        this.handle=add(new T.TorusGeometry(.35,.07,6,16),brass,g,0,1,0);
        add(new T.BoxGeometry(.08,.7,.08),brass,this.handle,0,0,0);
        const crate=createCrate({width:1.7,height:.65,depth:1.15});g.add(crate);
      }else{
        add(new T.BoxGeometry(.7,1.25,.7),wood,g,0,.6,0);
        this.wheel=add(new T.TorusGeometry(.5,.09,6,20),brass,g,0,1.5,.4);
        for(const angle of [0,Math.PI/3,-Math.PI/3])add(new T.BoxGeometry(.07,1,.07),brass,this.wheel,0,0,0).rotation.z=angle;
        const rig=new T.Group();g.add(rig);for(const side of[-1,1]){beam(rig,wood,[side*.65,0,-.35],[side*.35,1.7,0],.095);block(rig,iron,[side*.36,1.05,0],[.08,.4,.4]);}part(rig,new T.CylinderGeometry(.2,.2,.85,16),wood,[0,1.05,0],[1,1,1],[0,0,Math.PI/2]);for(let i=0;i<11;i++)part(rig,new T.TorusGeometry(.22,.022,4,14),surfaceMaterial('cloth',0xafa17c),[-.32+i*.064,1.05,0],[1,1,1],[0,Math.PI/2,0]);beam(rig,iron,[0,1.22,-.16],[0,.35,-1.8],.025);batchProp(rig);
      }
    }
    for(const route of SALT_JOURNEY.routes)for(const p of route.points.slice(1,-1)){
      add(new T.CylinderGeometry(.12,.18,2.1,5),stone,this.root,p.x,groundAt(p.x,p.z)+1.05,p.z);
      add(new T.BoxGeometry(.7,.35,.08),brass,this.root,p.x,groundAt(p.x,p.z)+1.7,p.z);
    }
    this.cargo=new T.Group();this.cargo.position.set(-250,groundAt(-250,13),13);this.root.add(this.cargo);
    for(const [x,z] of [[0,0],[.8,.25],[-.65,.22]]){const crate=createCrate({width:.75,height:.55,depth:.9});crate.position.set(x,0,z);this.cargo.add(crate);}
  }
  update(game){
    this.solids.get(SALT_JOURNEY.gate.id).visible=!game.expedition.opened;
    this.handle.visible=!game.expedition.handle;
    this.wheel.rotation.z=game.expedition.opened?Math.PI*.65:0;
    this.seal.visible=game.expedition.reported;
    this.cargo.visible=game.expedition.reported;
  }
}
