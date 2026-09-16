import * as T from 'three';
import { bakeStaticTransforms } from './static-transforms.js';
import { gatheringStage } from './gathering-presentation.js';
import { GatheringScene } from './gathering-scene.js';
import { ExpeditionScene } from './expedition-scene.js';
import { SALT_REACH } from './world-regions.js';
import { VillageScene } from './village-scene.js';
import { createDetailedActor } from './actor-models.js';
import { surfaceMaterial, clothMaterial, installEnvironmentTextures } from './environment-materials.js';
import { block, beam, part, batchProp, groundedSupportGeometry, chamferBox, rockGeometry, mountainGeometry, treeTrunkGeometry, distantTreeGeometry, coniferGeometry, broadleafGeometry, grassGeometry, createHouse, createCrate, createHerb, createTent, createCart, createBoat, createBrazier, createLantern } from './environment-models.js';
import { loadEnvironmentTextures } from './environment-assets.js';
import { bakeGroundContact } from './environment-contact.js';
import { skyMaterial, updateAtmosphere, installSkyAtmosphere, releaseSkyAtmosphere } from './environment-atmosphere.js';
import { loadSkySource } from './sky-assets.js';
import { createSkyLighting } from './sky-lighting.js';
import { createTerrainSurface } from './terrain-surface.js';
import { createWaterSurface } from './water-surface.js';
import { bridgeRampGeometry, bridgePierGeometry } from './settlement-contact.js';
import { forestMaterial, configureForestMesh, installForestTextures } from './forest-materials.js';
import { loadForestTextures } from './forest-assets.js';
import { loadSkinTexture } from './skin-assets.js';
import { installSkinTexture } from './skin-materials.js';
import { WeaponTrails } from './weapon-trails.js';
import { loadVaultTextures } from './vault-textures.js';
import { VaultScene, animateVaultWarden, decorateVaultWarden } from './vault-scene.js';
import { inVaultFootprint, vaultByWarden } from './vault-slices.js';
import { cameraFraction } from './spatial.js';
import { SENA, EAST_CAMP } from './content.js';
import { PLACES, BRIDGES, groundAt, heightAt, random, WORLD_SEED, clamp, distance, riverX, inWater } from './core.js';

const C = { stone:0x697b78, dark:0x293a40, gold:0xcdb57a, wood:0x514840, leaf:0x566c53 };
const box = chamferBox(), sphere = new T.IcosahedronGeometry(1,1), cone = new T.ConeGeometry(1,1,7), cylinder = new T.CylinderGeometry(1,1,1,8);
const mats = new Map();
function material(color,extra={}) {const key=String(color)+JSON.stringify(extra);if(!mats.has(key))mats.set(key,new T.MeshStandardMaterial({color,roughness:.88,...extra}));return mats.get(key);}
function mesh(geometry,mat,parent,pos=[0,0,0],scale=[1,1,1],shadow=false){const m=new T.Mesh(geometry,mat);m.position.set(...pos);m.scale.set(...scale);m.castShadow=shadow;m.receiveShadow=true;parent.add(m);return m;}
function addBox(parent,color,x,y,z,sx,sy,sz,shadow=false){const family=color===C.wood?'wood':color===C.gold?'metal':'stone';return mesh(box,surfaceMaterial(family,color),parent,[x,y,z],[sx,sy,sz],shadow);}

export async function createSceneView(canvas,game,settings){
  const [vaultTextures,environmentTextures,forestTextures,skySource,skinTexture]=await Promise.all([loadVaultTextures(),loadEnvironmentTextures(),loadForestTextures(),loadSkySource(),loadSkinTexture()]);
  installEnvironmentTextures(environmentTextures);
  installForestTextures(forestTextures);
  installSkinTexture(skinTexture);
  return new SceneView(canvas,game,settings,null,vaultTextures,skySource);
}

export class SceneView {
  constructor(canvas,game,settings,characters,vaultTextures={},skySource=null){
    this.canvas=canvas;this.game=game;this.settings=settings;this.scene=new T.Scene();this.scene.background=new T.Color(0x9aacac);this.scene.fog=new T.FogExp2(0x9bacac,.0042);
    this.camera=new T.PerspectiveCamera(54,innerWidth/innerHeight,.1,1100);this.renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,settings.quality==='high'?1.7:settings.quality==='low'?1:1.35));this.renderer.setSize(innerWidth,innerHeight);this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=.94;this.renderer.shadowMap.enabled=settings.quality!=='low';this.renderer.shadowMap.type=T.PCFSoftShadowMap;
    this.ambient=new T.HemisphereLight(0xb5cbdc,0x48493c,1.1);this.scene.add(this.ambient);this.sun=new T.DirectionalLight(0xffd8a1,3.2);this.sun.position.set(-80,100,-70);this.sun.castShadow=true;this.sun.shadow.mapSize.set(1024,1024);Object.assign(this.sun.shadow.camera,{left:-35,right:35,top:35,bottom:-35,near:1,far:220});this.sun.shadow.bias=-.0003;this.sun.shadow.normalBias=.045;this.scene.add(this.sun,this.sun.target);
    this.rng=random(WORLD_SEED);this.t=0;this.yaw=.06;this.gatheringFocus=null;this.pitch=.3;this.zoom=9;this.shake=0;this.effects=[];this.enemyModels=new Map();this.beacons=new Map();this.lootModels=new Map();this.sway={value:0};
    bakeGroundContact(game.obstacles);this.createSky();
    for(const method of ['createTerrain','createMountains','createVegetation','createWater'])this.createStaticScenery(method);
    this.createStructures();this.createStaticScenery('createCrossing');this.createParticles();
    this.player=createDetailedActor('player',{groundHeight:groundAt});this.scene.add(this.player.g);this.npc=createDetailedActor('npc',{groundHeight:groundAt});this.npc.g.position.set(7,heightAt(7,80),80);this.npc.g.rotation.y=1.4;this.scene.add(this.npc.g);this.sena=createDetailedActor('sena',{groundHeight:groundAt});this.sena.g.position.set(SENA.x,heightAt(SENA.x,SENA.z),SENA.z);this.sena.g.rotation.y=-1.5;this.scene.add(this.sena.g);
    this.residentModels=new Map();for(const n of game.residents){const model=createDetailedActor(n.role,{groundHeight:groundAt});this.residentModels.set(n.id,model);this.scene.add(model.g);}
    this.village=new VillageScene(this.scene,this.player);this.expeditionScene=new ExpeditionScene(this.scene,groundAt);this.expeditionScene.update(game);this.gatheringScene=new GatheringScene(this.scene,groundAt);this.gatheringScene.update(game);this.vaultScene=new VaultScene(this.scene,game,groundAt,vaultTextures);
    this.telegraphRing=new T.RingGeometry(.7,1,32);this.telegraphArc=new T.RingGeometry(.04,1,32,1,-Math.PI/2-1.5,3);
    for(const e of game.enemies){const m=createDetailedActor(e.type==='knight'?'soldier':e.type,{groundHeight:groundAt,theme:vaultByWarden(e.id)?.theme});decorateVaultWarden(m,e,vaultTextures);m.wasDead=!!e.dead;m.deathElapsed=e.dead?2:0;this.scene.add(m.g);this.enemyModels.set(e.id,m);const ringGeo=this.telegraphArc;m.telegraph=mesh(ringGeo,new T.MeshBasicMaterial({color:0xf39855,transparent:true,opacity:.5,side:T.DoubleSide,depthWrite:false}),this.scene);m.telegraph.rotation.x=-Math.PI/2;m.telegraph.visible=false;if(e.type==='ranger'){const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute([0,0,0,0,0,0],3));m.aimLine=new T.Line(geo,new T.LineBasicMaterial({color:0xf1af75,transparent:true,opacity:.65}));m.aimLine.visible=false;this.scene.add(m.aimLine);}}
    for(const item of game.pickups){const g=new T.Group();g.position.set(item.x,heightAt(item.x,item.z),item.z);if(item.type==='chest'||item.type==='supplies'){g.add(createCrate({chest:item.type==='chest'}));}else{g.add(createHerb({relic:item.type==='relic'}));const glint=mesh(sphere,material(0xcee5bc,{emissive:0xb4dca1,emissiveIntensity:.7}),g,[0,.8,0],[.035,.035,.035]);glint.castShadow=false;}this.scene.add(g);this.lootModels.set(item.id,g);}
    this.arrowShafts=new T.InstancedMesh(new T.BoxGeometry(.045,.045,1.1),material(0xbf9256,{emissive:0x362015}),48);const tips=new T.ConeGeometry(.1,.28,5);tips.rotateX(Math.PI/2);tips.translate(0,0,.65);this.arrowTips=new T.InstancedMesh(tips,material(0xe1bc79),48);this.arrowShafts.count=this.arrowTips.count=0;this.scene.add(this.arrowShafts,this.arrowTips);this.arrowDummy=new T.Object3D();
    this.weaponTrails=new WeaponTrails(this.scene);
    if(skySource){try{this.installSkySource(skySource);}catch(error){this.renderer.dispose();throw error;}}
    this.resize=()=>{this.camera.aspect=innerWidth/innerHeight;this.camera.updateProjectionMatrix();this.renderer.setSize(innerWidth,innerHeight);};addEventListener('resize',this.resize);this.setQuality(settings.quality);
  }
  installSkySource(source,makeGenerator){
    // Prepare completely before changing the live sky; failure retains the prior
    // environment. Boot failure uses the existing visible launch retry.
    const resource=createSkyLighting(this.renderer,source,makeGenerator);
    if(!resource){this.disposeSkyLighting();updateAtmosphere(this,this.game.day,this.t);return null;}
    this.disposeSkyLighting();this.skyLighting=resource;
    this.scene.environment=resource.environment;this.scene.environmentRotation.set(0,resource.yaw,0);
    installSkyAtmosphere(resource);updateAtmosphere(this,this.game.day,this.t);
    return resource;
  }
  disposeSkyLighting(){
    const resource=this.skyLighting;if(!resource)return;
    if(this.scene.environment===resource.environment)this.scene.environment=null;
    this.scene.environmentIntensity=1;this.scene.environmentRotation.set(0,0,0);
    releaseSkyAtmosphere(resource);resource.dispose();this.skyLighting=null;
  }
  // Only these construction methods contain immutable local transforms. Do not
  // include sky/clouds, actors, loot, effects, beacon animations or quest scenes.
  createStaticScenery(method){const first=this.scene.children.length;this[method]();bakeStaticTransforms(...this.scene.children.slice(first));}
  createSky(){
    this.skyMaterial=skyMaterial();this.sky=mesh(new T.SphereGeometry(850,32,16),this.skyMaterial,this.scene);this.sky.frustumCulled=false;
    // Sun is now an angular disc in the same direction as the shadow light.
    // Keep the old random stream for every downstream placement; the fourteen
    // faceted cloud ellipsoids are replaced by the coherent sky cloud field.
    for(let i=0;i<14;i++)for(let draw=0;draw<6;draw++)this.rng();
    this.clouds=[];
    const ring=mesh(new T.TorusGeometry(20,.28,5,70),material(0xba9d6f,{emissive:0x705a34,emissiveIntensity:.15}),this.scene,[4,65,-268]);ring.rotation.y=.05;this.crownHalo=ring;
  }
  createTerrain(){mesh(createTerrainSurface(),surfaceMaterial('earth',0xffffff,{vertexColors:true,roughness:1,worldScale:.48,groundContact:true}),this.scene);}
  createMountains(){const rng=this.rng;for(let i=0;i<30;i++){const angle=i/30*Math.PI*2;const rawX=Math.cos(angle)*(360+rng()*130),x=rawX< -300?rawX-200:rawX,z=Math.sin(angle)*(400+rng()*100);const m=mesh(mountainGeometry(5+rng()*3|0),surfaceMaterial('stone',i%2?0x657d82:0x718989,{worldScale:.1}),this.scene,[x,38,z],[65+rng()*80,100+rng()*130,65+rng()*50]);m.rotation.y=rng()*7;const cap=mesh(mountainGeometry(i+51),surfaceMaterial('stone',0xb5c6c5,{worldScale:.08}),this.scene,[x,m.scale.y*.34+38,z],[m.scale.x*.26,m.scale.y*.29,m.scale.z*.26]);cap.rotation.y=m.rotation.y;}}
  createVegetation(){const rng=this.rng,dummy=new T.Object3D(),treePositions=this.game.trees;
    const trunks=new T.InstancedMesh(treeTrunkGeometry(),surfaceMaterial('bark',0x726957),treePositions.length);const pine=new T.InstancedMesh(coniferGeometry(),forestMaterial('pine',this.sway),treePositions.length*2);const crowns=new T.InstancedMesh(broadleafGeometry(),forestMaterial('crown',this.sway),treePositions.length);let pi=0,ci=0;treePositions.forEach((p,i)=>{const y=heightAt(p.x,p.z);dummy.position.set(p.x,y+p.h*.38,p.z);dummy.scale.set(1,p.h*.76,1);dummy.rotation.set(0,0,0);dummy.updateMatrix();trunks.setMatrixAt(i,dummy.matrix);if(p.gold){dummy.position.y=y+p.h*.75;dummy.scale.set(p.h*.34,p.h*.4,p.h*.34);dummy.rotation.y=rng()*6;dummy.updateMatrix();crowns.setMatrixAt(ci,dummy.matrix);crowns.setColorAt(ci,new T.Color().setHSL(.105+rng()*.04,.25+rng()*.25,.37+rng()*.16));ci++;}else{for(let j=0;j<2;j++){dummy.position.y=y+p.h*(.52+j*.2);dummy.scale.set(p.h*(.37-j*.09),p.h*.73,p.h*(.37-j*.09));dummy.updateMatrix();pine.setMatrixAt(pi++,dummy.matrix);}}});pine.count=pi;crowns.count=ci;configureForestMesh(pine);configureForestMesh(crowns);this.scene.add(trunks,pine,crowns);trunks.castShadow=false;pine.receiveShadow=true;crowns.receiveShadow=true;
    const rockObs=this.game.rockVisuals||this.game.obstacles.filter(o=>o.type==='rock').map(o=>({...o,hidden:false})),visibleRocks=rockObs.filter(o=>!o.hidden);const rocks=new T.InstancedMesh(rockGeometry(19,2),surfaceMaterial('stone',0x7c8276),visibleRocks.length);let ri=0;rockObs.forEach(p=>{const rotation=[rng(),rng()*6,rng()*.5];if(p.hidden)return;dummy.position.set(p.x,heightAt(p.x,p.z)+p.r*.33,p.z);dummy.scale.set(p.r,p.r*.88,p.r);dummy.rotation.set(...rotation);dummy.updateMatrix();rocks.setMatrixAt(ri++,dummy.matrix);});rocks.receiveShadow=true;this.scene.add(rocks);
    const grassGeo=grassGeometry(),grassMat=surfaceMaterial('leaf',0xb1ad79,{side:T.DoubleSide,roughness:1,wind:this.sway});const count=15000;const grass=new T.InstancedMesh(grassGeo,grassMat,count);let gi=0;for(let i=0;i<count;i++){const x=(rng()-.5)*420,z=155-rng()*420;if(inWater(x,z)||PLACES.some(p=>distance({x,z},p)<9)||Math.abs(x)<4)continue;const rotation=rng()*6,size=.6+rng()*1.1,hue=.12+rng()*.045,light=.43+rng()*.15;if(inVaultFootprint({x,z}))continue;dummy.position.set(x,heightAt(x,z),z);dummy.rotation.set(0,rotation,0);dummy.scale.set(size,size,size);dummy.updateMatrix();grass.setMatrixAt(gi,dummy.matrix);grass.setColorAt(gi,new T.Color().setHSL(hue,.2,light));gi++;}grass.count=gi;this.grass=grass;this.grassCapacity=gi;this.scene.add(grass);
    this.grassGeometries={high:grassGeo,medium:grassGeometry(1),low:new T.BufferGeometry()};this.grassGeometries.low.setAttribute('position',new T.Float32BufferAttribute([-.085,0,0,.085,0,0,.03,.65,.06],3));this.grassGeometries.low.setAttribute('uv',new T.Float32BufferAttribute([0,0,1,0,.5,1],2));this.grassGeometries.low.computeVertexNormals();
    this.treeDetail=[trunks,pine,crowns].map((source,index)=>{const detail=new T.InstancedMesh(source.geometry,source.material,source.count);detail.name='near-tree-detail';configureForestMesh(detail);detail.count=0;detail.receiveShadow=true;detail.castShadow=true;this.scene.add(detail);source.geometry=distantTreeGeometry(['trunk','pine','crown'][index]);return{source,detail,total:source.count,matrices:source.instanceMatrix.array.slice(0,source.count*16),colors:source.instanceColor?.array.slice(0,source.count*3)};});
  }
  updateTreeDetail(force=false){
    if(!this.treeDetail)return;const p=this.game.player,quality=this.settings.quality;if(!force&&this.treeDetailPosition&&Math.hypot(p.x-this.treeDetailPosition.x,p.z-this.treeDetailPosition.z)<12)return;
    this.treeDetailPosition={x:p.x,z:p.z};const radius=quality==='high'?80:quality==='medium'?52:0,matrix=new T.Matrix4(),color=new T.Color();
    for(const {source,detail,total,matrices,colors}of this.treeDetail){let near=0,far=0;for(let i=0;i<total;i++){matrix.fromArray(matrices,i*16);const e=matrix.elements,isNear=radius&&Math.hypot(e[12]-p.x,e[14]-p.z)<radius,destination=isNear?detail:source,index=isNear?near++:far++;destination.setMatrixAt(index,matrix);if(colors){color.fromArray(colors,i*3);destination.setColorAt(index,color);}}detail.count=near;source.count=far;for(const target of[source,detail]){target.instanceMatrix.needsUpdate=true;if(target.instanceColor)target.instanceColor.needsUpdate=true;target.computeBoundingSphere();target.computeBoundingBox();}}

  }
  createWater(){const geo=createWaterSurface();this.waterMat=surfaceMaterial('water',0x49695e,{roughness:.27,metalness:0,transparent:true,opacity:.82,depthWrite:false,flow:this.sway,worldScale:.25});mesh(geo,this.waterMat,this.scene);for(const b of BRIDGES){
      const {x,z,top}=b;const bridge=new T.Group();this.scene.add(bridge);const wood=surfaceMaterial('wood',0x88775c);for(let plank=0;plank<44;plank++)block(bridge,wood,[x-13.19+plank*.613,top-.18,z],[.59,.36,5.3]);for(const side of[-1,1]){block(bridge,wood,[x,top-.6,z+side*1.85],[27,.5,.28]);for(let j=-10;j<=10;j+=5)beam(bridge,wood,[x+j,top+.15,z+side*2.8],[x+j+4.5,top+1.4,z+side*2.8],.045);}
      part(bridge,new T.BoxGeometry(27,.12,5.3),wood,[x,top-.068,z]);
      for(const end of[-1,1])part(bridge,new T.BoxGeometry(.045,.12,5.3),wood,[x+end*13.4775,top-.06,z]);
      for(const station of[-10,0,10]){part(bridge,new T.BoxGeometry(.38,.3,4.08),wood,[x+station,top-.6,z]);for(const side of[-1,1])part(bridge,bridgePierGeometry(x+station,z+side*1.85,top-.4,heightAt),wood);}
      bridge.userData.contactBridge={x,z,top};batchProp(bridge);
      for(let i=-12;i<=12;i+=4)for(const side of [-1,1])addBox(this.scene,C.wood,x+i,top+.75,z+side*2.8,.15,1.65,.15);
      for(const side of [-1,1]){addBox(this.scene,C.wood,x,top+1.4,z+side*2.8,27,.12,.12);const geo=bridgeRampGeometry(b,side,groundAt);mesh(geo,surfaceMaterial('wood',0x7b7360,{side:T.DoubleSide}),this.scene);}
    }
  }

  createStructures(){for(const o of this.game.obstacles.filter(o=>o.type==='house')){const base=heightAt(o.x,o.z),g=createHouse({groundHeight:(x,z)=>heightAt(o.x+x,o.z+z)-base});g.position.set(o.x,base,o.z);this.scene.add(g);bakeStaticTransforms(g);}
    for(const p of PLACES){const g=new T.Group();g.position.set(p.x,heightAt(p.x,p.z),p.z);this.scene.add(g);const boss=p.type==='boss';mesh(new T.CylinderGeometry(boss?10:3.4,boss?11:3.8,.5,12),surfaceMaterial('stone',C.stone),g,[0,.2,0]);mesh(new T.CylinderGeometry(1.1,1.35,.75,8),surfaceMaterial('stone',0x536460),g,[0,.68,0]);const flame=mesh(new T.IcosahedronGeometry(1,1),new T.MeshStandardMaterial({color:0xf3d28a,emissive:0xffb340,emissiveIntensity:2,transparent:true,opacity:.95}),g,[0,1.55,0],[.24,.76,.24]);const glow=new T.PointLight(0xf7c17b,6,13,2);glow.position.y=2;g.add(glow);const ring=mesh(new T.TorusGeometry(1.4,.027,4,36),material(C.gold,{emissive:0xc79c4e,emissiveIntensity:.8}),g,[0,1.8,0]);const beam=mesh(new T.CylinderGeometry(.045,.28,28,8,1,true),new T.MeshBasicMaterial({color:0xf8dca0,transparent:true,opacity:.055,side:T.DoubleSide,depthWrite:false}),g,[0,15,0]);ring.material=ring.material.clone();const bowl=createBrazier();bowl.position.y=.7;g.add(bowl);this.beacons.set(p.id,{g,flame,glow,ring,beam});
      if(p.type!=='camp'){
        const supports=this.game.obstacles.filter(o=>o.architecture?.place===p.id),columns=supports.filter(o=>o.architecture.kind==='column'),origin={x:p.x,y:g.position.y,z:p.z};const n=boss?10:6,r=boss?13:7;for(let i=0;i<n;i++){const a=i/n*Math.PI*2,x=Math.cos(a)*r,z=Math.sin(a)*r,h=boss?14:(i%3===0?7:4.4);mesh(groundedSupportGeometry(columns[i],origin),surfaceMaterial('stone',C.stone),g,[0,0,0],[1,1,1],true);addBox(g,0x7e8980,x,h+.3,z,1.8,.6,1.8);if(i%2===0)mesh(new T.ConeGeometry(.6,2,4),material(C.dark),g,[x,h+1.7,z]);}
        const arch=new T.Mesh(new T.TorusGeometry(boss?9:5,boss?.95:.65,5,24,Math.PI),surfaceMaterial('stone',C.stone));arch.position.set(0,boss?13:6,-(boss?9:5));arch.rotation.z=0;g.add(arch);for(const o of supports.filter(o=>o.architecture.kind==='arch-post'))mesh(groundedSupportGeometry(o,origin),surfaceMaterial('stone',C.stone),g,[0,0,0],[1,1,1],true);const masonry=new T.Group();g.add(masonry);for(let i=0;i<19;i++){const a=(i+.5)/19*Math.PI,r=boss?9:5;block(masonry,surfaceMaterial('stone',0x90958a),[Math.cos(a)*r,(boss?13:6)+Math.sin(a)*r,-(boss?9:5)],[boss?1.42:.78,boss?1.85:1.28,1.8],[0,0,a-Math.PI/2]);}batchProp(masonry);
        if(p.id==='ruins'){const tower=mesh(groundedSupportGeometry(supports.find(o=>o.architecture.kind==='tower'),origin),surfaceMaterial('stone',0x667a79),g);mesh(new T.TorusGeometry(4.3,.4,4,8),material(C.gold),g,[-13,16.4,-9]).rotation.x=Math.PI/2;for(let j=0;j<5;j++)addBox(g,C.dark,-13+Math.sin(j*1.26)*4.1,12,-9+Math.cos(j*1.26)*4.1,.5,2.1,.4);}
      }
      // The beacon group stays mutable; bake only its stonework, not its live
      // flame, light, rotating ring or beam. Their exact hierarchy is retained.
      bakeStaticTransforms(...g.children.filter(child=>![flame,glow,ring,beam].includes(child)));
    }
    // Cloth trail markers make the northern route readable from ground level.
    for(const z of [60,10,-45,-107,-196]){const x=-6+Math.sin(z*.035)*7,y=heightAt(x,z);addBox(this.scene,C.wood,x,y+2,z,.12,4,.12);const flag=mesh(new T.PlaneGeometry(1.3,.85,3,2),clothMaterial(0xbeb28b,this.sway),this.scene,[x+.67,y+3.4,z]);flag.rotation.y=.25;}
  }
  createCrossing(){
    const camp=new T.Group();camp.position.set(EAST_CAMP.x,heightAt(EAST_CAMP.x,EAST_CAMP.z),EAST_CAMP.z);this.scene.add(camp);
    const cart=createCart();cart.position.set(3,0,1);cart.rotation.y=-.3;camp.add(cart);
    for(const side of[-1,1]){const tent=createTent(side<0?0x8b8065:0x74614e);tent.position.set(side*8,0,-7);camp.add(tent);}
    this.roadCamp=new T.Group();this.roadCamp.position.set(SENA.x-7,heightAt(SENA.x-7,SENA.z+7),SENA.z+7);this.scene.add(this.roadCamp);this.roadCamp.add(createTent(0xbcac85));const crate=createCrate({width:1,height:.8,depth:1});crate.position.set(3,0,1);this.roadCamp.add(crate);const lamp=createLantern();lamp.position.set(3,.82,1);this.roadCamp.add(lamp);
    this.havenSupplies=new T.Group();this.havenSupplies.position.set(9,heightAt(9,78),78);this.scene.add(this.havenSupplies);for(let i=0;i<3;i++){const box=createCrate({width:.6,height:.5,depth:.6});box.position.x=i*.7;this.havenSupplies.add(box);}const herbs=createHerb({pot:true});herbs.position.set(.7,.52,0);this.havenSupplies.add(herbs);
    const z=104,x=riverX(z)+13.5;const boat=createBoat();boat.position.set(x,heightAt(x,z)-.06,z);boat.rotation.set(0,.16,.09);this.scene.add(boat);
  }
  createParticles(){const rng=this.rng,positions=new Float32Array(300*3);for(let i=0;i<300;i++){positions[i*3]=(rng()-.5)*100;positions[i*3+1]=rng()*16;positions[i*3+2]=(rng()-.5)*100;}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(positions,3));this.motes=new T.Points(geo,new T.PointsMaterial({color:0xf2d49a,size:.045,transparent:true,opacity:.32,depthWrite:false}));this.scene.add(this.motes);}
  effect(type,x,z){const y=heightAt(x,z)+1;if(['skill','beacon','heal','perfect'].includes(type)){const m=mesh(new T.RingGeometry(.5,.7,40),new T.MeshBasicMaterial({color:type==='heal'?0xa1e5bf:0xffd98e,transparent:true,opacity:.8,side:T.DoubleSide,depthWrite:false}),this.scene,[x,y-.4,z]);m.rotation.x=-Math.PI/2;this.effects.push({m,life:1,total:1,type});}if(['hit','kill','perfect'].includes(type)){const count=type==='kill'?18:8,geo=new T.BufferGeometry(),pos=[],vel=[];for(let i=0;i<count;i++){pos.push(x,y,z);vel.push((Math.random()-.5)*5,Math.random()*4,(Math.random()-.5)*5);}geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));const m=new T.Points(geo,new T.PointsMaterial({color:0xffd8a0,size:.1,transparent:true,depthWrite:false}));this.scene.add(m);this.effects.push({m,life:.65,total:.65,vel});}if(type==='hit')this.shake=.08;if(type==='hurt')this.shake=.2;}
  animateModel(m,e,dt){m.animate(e,dt);animateVaultWarden(m,e,this.t);}
  update(dt,playing){this.t+=dt;this.sway.value=this.t;this.updateTreeDetail();const p=this.game.player;this.player.g.position.set(p.x,p.y,p.z);const gathering=this.gatheringFocus?gatheringStage(this.game,this.gatheringFocus):null;this.player.g.rotation.y=gathering?.playerAngle??p.angle;this.animateModel(this.player,p,dt);this.animateModel(this.npc,{moving:false},dt);this.animateModel(this.sena,{moving:false},dt);this.roadCamp.visible=this.game.crossingChoice==='road';this.havenSupplies.visible=this.game.crossingChoice==='haven';
    this.village.update(this.game,dt,this.t);this.expeditionScene.update(this.game);this.gatheringScene.update(this.game);this.vaultScene.update(this.game,this.t);
    const activeResidents=new Set(this.game.npcs().map(n=>n.id));for(const n of this.game.residents){const m=this.residentModels.get(n.id);m.g.visible=activeResidents.has(n.id)&&distance(n,p)<90;if(m.g.visible){m.g.position.set(n.x,n.y,n.z);m.g.rotation.y=gathering?.actorAngles[n.id]??n.angle;this.animateModel(m,n,dt);}}
    updateAtmosphere(this,this.game.day,this.t);
    for(const e of this.game.enemies){const m=this.enemyModels.get(e.id);if(e.dead){m.deathElapsed=m.wasDead?m.deathElapsed+dt:0;}else m.deathElapsed=0;m.wasDead=!!e.dead;m.g.visible=(!e.dead||m.deathElapsed<1.2)&&distance(e,p)<105;if(m.g.visible){m.g.position.set(e.x,e.y,e.z);m.g.rotation.y=e.angle;this.animateModel(m,e.dead?{...e,deathElapsed:m.deathElapsed}:e,dt);}m.telegraph.visible=m.g.visible&&!e.dead&&e.type!=='ranger'&&['windup','strike'].includes(e.state);if(m.telegraph.visible){const r=e.type==='boss'?(e.radial?9:6.5):e.type==='wolf'?2.5:3.3;m.telegraph.geometry=e.radial?this.telegraphRing:this.telegraphArc;m.telegraph.rotation.set(-Math.PI/2,0,e.angle);m.telegraph.position.set(e.x,e.y+.1,e.z);m.telegraph.scale.setScalar(r);m.telegraph.material.opacity=e.state==='strike'?.8:.13+(1-e.timer/e.windupMax)*.5;}if(m.aimLine){m.aimLine.visible=m.g.visible&&!e.dead&&e.state==='windup'&&!!e.aim;if(m.aimLine.visible){const points=m.aimLine.geometry.attributes.position;points.setXYZ(0,e.x,e.y+1.45,e.z);points.setXYZ(1,e.aim.x,e.aim.y,e.aim.z);points.needsUpdate=true;m.aimLine.geometry.computeBoundingSphere();}}}
    const arrows=this.game.projectiles;this.arrowShafts.count=this.arrowTips.count=arrows.length;
    arrows.forEach((a,i)=>{const dummy=this.arrowDummy;dummy.position.set(a.x,a.y,a.z);dummy.lookAt(a.x+a.vx,a.y+a.vy,a.z+a.vz);dummy.updateMatrix();this.arrowShafts.setMatrixAt(i,dummy.matrix);this.arrowTips.setMatrixAt(i,dummy.matrix);this.arrowTips.setColorAt(i,new T.Color(a.owner==='player'?0x8ffff0:0xffbe76));});this.arrowShafts.instanceMatrix.needsUpdate=true;this.arrowTips.instanceMatrix.needsUpdate=true;if(this.arrowTips.instanceColor)this.arrowTips.instanceColor.needsUpdate=true;this.arrowShafts.computeBoundingSphere();this.arrowTips.computeBoundingSphere();
    for(const item of this.game.pickups)this.lootModels.get(item.id).visible=!item.taken&&distance(item,p)<70;
    for(const [id,b]of this.beacons){const lit=this.game.lit.includes(id)||(id==='crown'&&this.game.bossDefeated);b.flame.visible=lit;b.glow.visible=lit;b.flame.rotation.y=this.t;b.flame.scale.y=.6+Math.sin(this.t*5)*.1;b.beam.visible=lit;b.ring.rotation.y=this.t*.35;b.ring.material.emissiveIntensity=lit?1:.1;}
    this.crownHalo.rotation.z=Math.sin(this.t*.06)*.12;
    this.weaponTrails.update(this.player,p,dt,playing&&!this.gatheringFocus);
    this.motes.position.set(p.x,Math.max(0,p.y),p.z);this.motes.rotation.y=this.t*.005;this.motes.position.y+=Math.sin(this.t*.4);this.clouds.forEach((c,i)=>c.position.x+=dt*(.25+i*.01));
    for(let i=this.effects.length-1;i>=0;i--){const e=this.effects[i];e.life-=dt;if(e.life<=0){this.scene.remove(e.m);e.m.geometry.dispose();e.m.material.dispose();this.effects.splice(i,1);continue;}e.m.material.opacity=e.life/e.total;if(e.vel){const a=e.m.geometry.attributes.position;for(let j=0;j<a.count;j++){e.vel[j*3+1]-=dt*8;a.setXYZ(j,a.getX(j)+e.vel[j*3]*dt,a.getY(j)+e.vel[j*3+1]*dt,a.getZ(j)+e.vel[j*3+2]*dt);}a.needsUpdate=true;}else e.m.scale.setScalar(1+(1-e.life/e.total)*(e.type==='skill'?13:6));}
    if(playing){const target=gathering?new T.Vector3(gathering.target.x,groundAt(gathering.target.x,gathering.target.z)+1.45,gathering.target.z):new T.Vector3(p.x,p.y+1.6,p.z);const lock=this.game.enemies.find(e=>e.id===this.game.locked);if(!gathering&&lock&&!lock.dead){const yaw=Math.atan2(p.x-lock.x,p.z-lock.z);this.yaw+=Math.atan2(Math.sin(yaw-this.yaw),Math.cos(yaw-this.yaw))*dt*4;target.lerp(new T.Vector3(lock.x,lock.y+1.5,lock.z),.2);}
      const d=this.zoom*(innerHeight>innerWidth?1.12:1);const desired=gathering?new T.Vector3(gathering.camera.x,groundAt(gathering.camera.x,gathering.camera.z)+3.2,gathering.camera.z):new T.Vector3(p.x+Math.sin(this.yaw)*Math.cos(this.pitch)*d,p.y+1.7+Math.sin(this.pitch)*d,p.z+Math.cos(this.yaw)*Math.cos(this.pitch)*d);const fraction=cameraFraction(target,desired,this.game.obstacles,groundAt);desired.lerpVectors(target,desired,fraction);this.camera.position.lerp(desired,this.cameraSnap?1:1-Math.exp(-dt*9));this.cameraSnap=false;const safe=cameraFraction(target,this.camera.position,this.game.obstacles,groundAt);if(safe<1)this.camera.position.lerpVectors(target,this.camera.position,safe);if(this.shake>0){this.shake=Math.max(0,this.shake-dt);this.camera.position.x+=(Math.random()-.5)*this.shake;this.camera.position.y+=(Math.random()-.5)*this.shake;}this.camera.lookAt(target);
    }else{this.camera.position.set(-15+Math.sin(this.t*.025)*3,22,120);this.camera.lookAt(12,6,-48);}
    this.renderer.render(this.scene,this.camera);
  }
  focusGathering(id){this.gatheringFocus=id;this.snapCamera();}
  ringBell(id){this.village.ring(id);}
  snapCamera(){this.cameraSnap=true;this.shake=0;this.weaponTrails?.reset('camera-boundary');}
  project(x,y,z){const p=new T.Vector3(x,y,z).project(this.camera);return{x:(p.x*.5+.5)*innerWidth,y:(-p.y*.5+.5)*innerHeight,visible:p.z<1&&p.z>-1};}
  setQuality(quality){this.settings.quality=quality;this.renderer.setPixelRatio(Math.min(devicePixelRatio,quality==='high'?1.7:quality==='low'?1:1.35));this.renderer.shadowMap.enabled=quality!=='low';if(this.grass){this.grass.count=Math.min(this.grassCapacity,quality==='low'?4500:quality==='medium'?9000:this.grassCapacity);this.grass.geometry=this.grassGeometries[quality]||this.grassGeometries.medium;this.grass.computeBoundingSphere();}this.updateTreeDetail(true);this.motes?.geometry.setDrawRange(0,quality==='low'?90:quality==='medium'?180:300);this.resize();}
}
