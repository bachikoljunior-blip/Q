import * as T from 'three';
import { SALT_JOURNEY, SALT_TARGETS, saltObstacles } from './world-regions.js';

export class ExpeditionScene {
  constructor(scene,groundAt){
    this.root=new T.Group();scene.add(this.root);
    const stone=new T.MeshStandardMaterial({color:0xaaa18b,roughness:1});
    const wood=new T.MeshStandardMaterial({color:0x5a5546,roughness:.9});
    const brass=new T.MeshStandardMaterial({color:0xc6ac70,metalness:.5,roughness:.4});
    const add=(geometry,material,parent,x,y,z)=>{const mesh=new T.Mesh(geometry,material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;};
    this.solids=new Map();
    for(const o of saltObstacles()){
      const node=add(new T.CylinderGeometry(o.r*.95,o.r,o.height,o.type==='salt-gate'?12:7),stone,this.root,o.x,groundAt(o.x,o.z)+o.height/2,o.z);
      node.userData.colliderId=o.id;this.solids.set(o.id,node);
      if(o.type==='salt-cistern')add(new T.TorusGeometry(o.r*.75,.15,5,20),brass,node,0,o.height*.3,0).rotation.x=Math.PI/2;
    }
    this.targets=new Map();
    for(const t of SALT_TARGETS){const g=new T.Group();g.position.set(t.x,groundAt(t.x,t.z),t.z);this.root.add(g);this.targets.set(t.id,g);
      if(t.kind==='board'){
        add(new T.BoxGeometry(.15,2.5,.15),wood,g,-.7,1.25,0);add(new T.BoxGeometry(.15,2.5,.15),wood,g,.7,1.25,0);
        add(new T.BoxGeometry(1.8,1,.15),wood,g,0,1.65,0);
        for(let i=0;i<4;i++)add(new T.BoxGeometry(1.25-i*.15,.035,.02),brass,g,0,1.95-i*.19,.1);
        this.seal=add(new T.TorusGeometry(.2,.045,5,12),brass,g,0,.7,.1);
      }else if(t.kind==='handle'){
        add(new T.BoxGeometry(1.7,.65,1.15),wood,g,0,.32,0);
        this.handle=add(new T.TorusGeometry(.35,.07,6,16),brass,g,0,1,0);
        add(new T.BoxGeometry(.08,.7,.08),brass,this.handle,0,0,0);
      }else{
        add(new T.BoxGeometry(.7,1.25,.7),wood,g,0,.6,0);
        this.wheel=add(new T.TorusGeometry(.5,.09,6,20),brass,g,0,1.5,.4);
        for(const angle of [0,Math.PI/3,-Math.PI/3])add(new T.BoxGeometry(.07,1,.07),brass,this.wheel,0,0,0).rotation.z=angle;
      }
    }
    for(const route of SALT_JOURNEY.routes)for(const p of route.points.slice(1,-1)){
      add(new T.CylinderGeometry(.12,.18,2.1,5),stone,this.root,p.x,groundAt(p.x,p.z)+1.05,p.z);
      add(new T.BoxGeometry(.7,.35,.08),brass,this.root,p.x,groundAt(p.x,p.z)+1.7,p.z);
    }
  }
  update(game){
    this.solids.get(SALT_JOURNEY.gate.id).visible=!game.expedition.opened;
    this.handle.visible=!game.expedition.handle;
    this.wheel.rotation.z=game.expedition.opened?Math.PI*.65:0;
    this.seal.visible=game.expedition.reported;
  }
}
