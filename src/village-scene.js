import * as T from 'three';
import { groundAt } from './core.js';
import { WIND_BELLS, WIND_SHRINE, BELL_ORDER } from './village.js';

// Code-native original props; symbols work without colour discrimination or audio.
export class VillageScene {
  constructor(scene,player){
    this.scene=scene;this.bells=new Map();
    const box=new T.BoxGeometry(1,1,1),stone=new T.MeshStandardMaterial({color:0x657473,roughness:1});
    const wood=new T.MeshStandardMaterial({color:0x766450,roughness:.9});
    const add=(parent,geometry,material,x,y,z,sx=1,sy=1,sz=1)=>{const m=new T.Mesh(geometry,material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;};
    for(const b of WIND_BELLS){
      const g=new T.Group(),y=groundAt(b.x,b.z);g.position.set(b.x,y,b.z);scene.add(g);
      for(const side of [-1,1])add(g,new T.CylinderGeometry(.18,.18,3.6,8),stone,side*.95,1.8+groundAt(b.x+side*.95,b.z)-y,0);
      add(g,box,wood,0,3.42,0,2.3,.24,.3);
      const swing=new T.Group();swing.position.y=3.28;g.add(swing);
      const metal=new T.MeshStandardMaterial({color:b.color,metalness:.7,roughness:.38,emissive:b.color,emissiveIntensity:.08});
      add(swing,new T.CylinderGeometry(.32,.6,.82,12,1,true),metal,0,-.85,0);
      add(swing,new T.CylinderGeometry(.045,.045,.9,6),wood,0,-.27,0);
      add(swing,new T.SphereGeometry(.09,8,6),metal,0,-1.22,0);
      const mark=new T.Group();mark.position.set(0,2.05,.38);g.add(mark);
      if(b.id==='bell-rain'){
        add(mark,new T.SphereGeometry(.2,8,6),metal,0,-.03,0,1,1.2,.35);
        add(mark,new T.ConeGeometry(.16,.32,8),metal,0,.2,0,1,1,.4);
      }else if(b.id==='bell-star'){
        const shape=new T.Shape();for(let i=0;i<10;i++){const a=i*Math.PI/5+Math.PI/2,r=i%2?.12:.3,x=Math.cos(a)*r,y=Math.sin(a)*r;i?shape.lineTo(x,y):shape.moveTo(x,y);}shape.closePath();
        add(mark,new T.ShapeGeometry(shape),new T.MeshBasicMaterial({color:b.color,side:T.DoubleSide}),0,0,0);
      }else{
        for(const side of [-1,1]){const wing=add(mark,box,metal,side*.17,.04,0,.42,.09,.08);wing.rotation.z=side*.5;}
        add(mark,new T.SphereGeometry(.085,8,6),metal,0,-.05,0);
      }
      const ring=add(g,new T.TorusGeometry(.85,.025,4,32),metal,0,.09,0);ring.rotation.x=-Math.PI/2;
      this.bells.set(b.id,{swing,metal,pulse:0});
    }
    const inscription=new T.Group();inscription.position.set(WIND_SHRINE.x,groundAt(WIND_SHRINE.x,WIND_SHRINE.z),WIND_SHRINE.z);scene.add(inscription);
    // Leave the centre approachable; the engraved tablet sits behind the interaction point.
    add(inscription,box,stone,0,.8,-1.2,1.6,1.6,.28);
    const ink=new T.MeshStandardMaterial({color:0xc6bd9b});
    for(let i=0;i<5;i++)add(inscription,box,ink,0,1.32-i*.22,-1.045,1.05-(i%2)*.25,.022,.018);
    const furnace=new T.Group();furnace.position.set(9,groundAt(9,100),100);scene.add(furnace);
    add(furnace,new T.CylinderGeometry(.65,.75,1.5,8),stone,0,.75,0);
    this.flame=add(furnace,new T.IcosahedronGeometry(.35,1),new T.MeshStandardMaterial({color:0xffc17d,emissive:0xff8a32,emissiveIntensity:2}),0,1.7,0,.7,1.7,.7);
    this.forgeLight=new T.PointLight(0xffb96e,2,6);this.forgeLight.position.set(9,groundAt(9,100)+2,100);scene.add(this.forgeLight);
    const anvil=new T.Group();anvil.position.set(10,groundAt(10,92),92);scene.add(anvil);
    add(anvil,box,wood,0,.3,0,.9,.6,.9);add(anvil,box,stone,0,.78,0,.65,.4,.5);add(anvil,box,stone,0,1.04,0,1.2,.16,.62);
    this.charm=new T.Group();this.charm.position.set(-.33,.85,.1);player.body.add(this.charm);
    add(this.charm,new T.CylinderGeometry(.06,.1,.14,8),new T.MeshStandardMaterial({color:0xe2c378,metalness:.7,roughness:.3}),0,-.12,0);
  }
  ring(id){const b=this.bells.get(id);if(b)b.pulse=1.8;}
  update(game,dt,time){
    for(const [id,b] of this.bells){b.pulse=Math.max(0,b.pulse-dt);b.swing.rotation.z=Math.sin(b.pulse*16)*b.pulse*.12;b.metal.emissiveIntensity=game.bells.solved?.6:BELL_ORDER.indexOf(id)<game.bells.step?.32:.06;}
    this.flame.visible=this.forgeLight.visible=game.bells.solved;
    this.flame.scale.y=1.7+Math.sin(time*7)*.2;
    this.charm.visible=game.bells.reported;this.charm.rotation.z=Math.sin(time*8)*(game.player.moving?.3:.02);
  }
}
