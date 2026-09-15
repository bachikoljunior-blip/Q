import { buildActorGeometry, ACTOR_FAMILIES } from './assets/characters/detailed-geometry.js';
import { detailedMotion } from './character-motion.js';

export { ACTOR_FAMILIES };
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
const mix=(a,b,t)=>a+(b-a)*t;
const TAU=Math.PI*2;

/** A visual-only actor. g is the world transform owned by SceneView.
 * groundHeight(x,z), when supplied, is a read-only visual contact sampler.
 * Geometry is shared across instances; bones, capes, phase and equipment are not.
 */
export function createDetailedActor(type='player',options={}){
  const g=buildActorGeometry(type,options),family=g.userData.family,get=name=>g.getObjectByName(name);
  const actor={g,type:family,body:get('body'),pelvis:get('pelvis'),chest:get('chest'),neck:get('neck'),head:get('head'),
    arms:[get('arm-0'),get('arm-1')].filter(Boolean),legs:Array.from({length:family==='wolf'?4:2},(_,i)=>get(`leg-${i}`)),
    knees:Array.from({length:family==='wolf'?4:2},(_,i)=>get(`knee-${i}`)),feet:Array.from({length:family==='wolf'?4:2},(_,i)=>get(`foot-${i}`)),
    elbows:[get('elbow-0'),get('elbow-1')].filter(Boolean),hands:[get('hand-0'),get('hand-1')].filter(Boolean),
    sword:get('sword'),greatsword:get('greatsword'),spear:get('spear'),flask:get('flask'),cape:get('cape'),
    phase:0,time:0,speed:0,lastPosition:null,lastHp:null,lastDead:null,deathAge:Infinity,hitAge:Infinity,
    groundHeight:options.groundHeight,contacts:[],motion:{state:'idle',phase:0},rest:[]};
  g.traverse(n=>{if(n.isBone)actor.rest.push({node:n,position:n.position.clone(),rotation:n.rotation.clone(),scale:n.scale.clone()});});
  actor.animate=(state={},dt=0)=>animateDetailedActor(actor,state,dt);
  actor.animate({},0);return actor;
}

// Two-bone sagittal IK. The ankle target is local to the hip; signed direction
// keeps knees facing forward. Foot pitch cancels both joint angles on contact.
export function solveLegTarget(upper,lower,y,z){
  const distance=clamp(Math.hypot(y,z),Math.abs(upper-lower)+.0001,upper+lower-.0001);
  const direction=Math.atan2(-z,-y),alpha=Math.acos(clamp((upper*upper+distance*distance-lower*lower)/(2*upper*distance),-1,1));
  const knee=Math.acos(clamp((distance*distance-upper*upper-lower*lower)/(2*upper*lower),-1,1));
  return {hip:direction-alpha,knee,ankle:-direction+alpha-knee};
}
export function strideContact(phase,stride,lift,stance=.62){
  const p=((phase%1)+1)%1;
  if(p<stance)return {z:stride*(.5-p/stance),lift:0,contact:true};
  const u=(p-stance)/(1-stance);return {z:stride*(-.5+smooth(u)),lift:Math.sin(Math.PI*u)*lift,contact:false};
}
function reset(actor){for(const rest of actor.rest){rest.node.position.copy(rest.position);rest.node.rotation.copy(rest.rotation);rest.node.scale.copy(rest.scale);}}
function contacts(actor,state,motion){
  const wolf=actor.type==='wolf',moving=['walk','run'].includes(motion.state),run=motion.state==='run';
  const stride=moving?clamp(actor.speed/actor.g.scale.y*(wolf?.12:.11),.28,wolf?.75:.92):0,lift=run?.16:moving?.10:0;
  const scale=actor.g.scale.y,worldY=Number.isFinite(state.y)?state.y:actor.g.position.y,angle=actor.g.rotation.y;
  actor.contacts.length=0;
  const targets=[];
  for(let i=0;i<actor.legs.length;i++){
    const leg=actor.legs[i],phase=actor.phase+(wolf?(i===0||i===3?0:.5):i*.5),foot=strideContact(phase,stride,lift,wolf?.57:.62);
    // Reposition the swing foot on the locally sampled slope while stance feet
    // retain zero lift. No collision body or game position is changed.
    const side=leg.position.x,localZ=leg.position.z+foot.z,wx=actor.g.position.x+Math.cos(angle)*side*scale+Math.sin(angle)*localZ*scale,wz=actor.g.position.z-Math.sin(angle)*side*scale+Math.cos(angle)*localZ*scale;
    const sampled=actor.groundHeight?.(wx,wz),terrain=Number.isFinite(sampled)?clamp((sampled-worldY)/scale,-.18,.18):0;
    const ankleHeight=(wolf?.126:.109)+terrain+foot.lift;
    const targetZ=foot.z-(actor.body.position.z||0);
    targets.push({foot,terrain,ankleHeight,targetZ});
    // Lower the pelvis for long strides / downhill contacts before solving any
    // limb, so a mathematically unreachable ankle does not float over the floor.
    const reach=(wolf?.72:.88)-.002;
    actor.pelvis.position.y=Math.min(actor.pelvis.position.y,ankleHeight+Math.sqrt(Math.max(.01,reach*reach-targetZ*targetZ))-leg.position.y-actor.body.position.y);
  }
  for(let i=0;i<actor.legs.length;i++){
    const leg=actor.legs[i],{foot,terrain,ankleHeight,targetZ}=targets[i];
    const targetY=ankleHeight-actor.pelvis.position.y-leg.position.y-actor.body.position.y;
    const pose=solveLegTarget(wolf?.36:.445,wolf?.36:.435,targetY,targetZ);
    leg.rotation.x=pose.hip;actor.knees[i].rotation.x=pose.knee;actor.feet[i].rotation.x=pose.ankle;
    actor.contacts.push({contact:foot.contact||!moving,terrain,lift:foot.lift,targetY,targetZ});
  }
}
function poseArms(actor,rx=0,lx=0,rz=-.07,lz=.07,re=.18,le=.18){
  actor.arms[1].rotation.set(rx,0,rz);actor.arms[0].rotation.set(lx,0,lz);
  actor.elbows[1].rotation.x=-re;actor.elbows[0].rotation.x=-le;
}
function humanoidPose(actor,state,motion){
  const t=actor.time,p=motion.phase,move=['walk','run'].includes(motion.state),idle=motion.state==='idle',run=motion.state==='run',swing=Math.sin(actor.phase*TAU),breath=idle||move?Math.sin(t*1.75):0;
  actor.pelvis.position.y=.962+(move?Math.cos(actor.phase*TAU*2)*.018:breath*.002);
  actor.chest.rotation.x=move?(run?.13:.055):.01;
  actor.chest.rotation.y=move?swing*.055:idle?Math.sin(t*.43)*.022:0;
  actor.neck.rotation.x=-actor.chest.rotation.x*.5;
  actor.head.rotation.y=idle?Math.sin(t*.31)*.04:0;
  actor.chest.scale.z=1+breath*.008;
  poseArms(actor,move?-swing*(run?.65:.36):-.055,move?swing*(run?.65:.36):.01,-.075,.075,run?.7:.19,run?.7:.19);
  if(['porter','courier'].includes(actor.type)){actor.chest.rotation.x+=.07;actor.elbows.forEach(elbow=>elbow.rotation.x=-.55);}
  if(actor.type==='patient'){actor.chest.rotation.x+=.07;actor.arms[0].rotation.z=.33;actor.elbows[0].rotation.x=-1.3;}
  if(['npc','sena','scout'].includes(actor.type)){actor.arms[1].rotation.x=-.15;actor.elbows[1].rotation.x=-.35;}
  if(actor.sword)actor.sword.rotation.x=-1.05;
  if(actor.greatsword)actor.greatsword.rotation.x=-1.3;
  if(actor.spear)actor.spear.rotation.z=Math.PI;
  if(actor.type==='ranger'){actor.arms[0].rotation.z=.26;actor.elbows[0].rotation.x=-.32;}
  if(motion.state==='idle'){
    if(actor.type==='smith'&&['炉の手入れ','鍛錬'].includes(state.activity)){
      const work=(t*.55)%1,stroke=smooth(clamp((work-.48)/.18));actor.arms[1].rotation.x=mix(-1.7,-.45,stroke);actor.elbows[1].rotation.x=mix(-.95,-.2,stroke);actor.chest.rotation.x=.1+stroke*.055;
    }else if(actor.type==='healer'){actor.elbows[0].rotation.x=-.76;actor.hands[0].rotation.z=.2;}
  }
  if(motion.state==='attack'||['windup','strike','recover'].includes(motion.state)){
    const phase=motion.state==='windup'?p*.42:motion.state==='strike'?.5+p*.27:motion.state==='recover'?.77+p*.23:p;
    const wind=smooth(phase/.38),release=smooth((phase-.38)/.2),settle=smooth((phase-.68)/.32),weight=1-settle;
    const weapon=motion.weapon||'sword',combo=motion.combo||0;
    if(actor.type==='ranger'){
      const draw=motion.state==='windup'?smooth(p):motion.state==='strike'?1-smooth(p/.35):0;
      const hold=motion.state==='recover'?1-smooth(p):1;
      poseArms(actor,-1.25*hold,-1.5*hold,-.62*hold,.2,1.7*draw+.15,.08);
      actor.chest.rotation.y=-.34*hold;actor.neck.rotation.y=.34*hold;
      for(const [name,sign]of [['string-upper',1],['string-lower',-1]]){
        const string=actor.g.getObjectByName(name);string.rotation.z=sign*Math.atan2(.22*draw,.59);string.scale.y=Math.hypot(.59,.22*draw)/.59;
      }
    }else if(weapon==='spear'){
      poseArms(actor,mix(-.5,-1.3,release)*weight,mix(-.2,-1.25,release)*weight,-.18,.18,mix(1.1,.06,release)*weight,.65*weight);
      actor.chest.rotation.y=(.35-.62*release)*weight;if(actor.spear)actor.spear.rotation.set(-Math.PI/2,0,0);
    }else if(state.radial&&actor.type==='boss'){
      poseArms(actor,-2.65*wind*(1-release),-2.5*wind*(1-release),-.25,.25,.25,.3);
      actor.chest.rotation.x=(-.15*wind+.48*release)*weight;actor.pelvis.position.y-=.18*release*weight;
      actor.sword.rotation.x=-.1;
    }else{
      const chop=combo===2||motion.state!=='attack',heavy=weapon==='greatsword';
      poseArms(actor,(-.2-2.35*wind+2.9*release)*weight,heavy?(-.6-1.35*wind+1.8*release)*weight:-.2,
        (chop?-.16:(-.2-1.15*wind+1.9*release))*weight,heavy?.32:.18,(.25+1.05*wind-1.05*release)*weight,heavy?.8:.3);
      actor.chest.rotation.y=(.48*wind-.91*release)*weight;actor.chest.rotation.x=(chop?-.12*wind+.32*release:0)*weight;
      if(actor.sword)actor.sword.rotation.x=mix(-1.05,-.12,wind)*weight-1.05*settle;
      if(actor.greatsword)actor.greatsword.rotation.x=-.16;
    }
  }
  if(motion.state==='parry'){const hold=Math.sin(Math.PI*clamp(p/.18));poseArms(actor,-1.37,-.7,-.63,.32,1.2,.9);actor.chest.rotation.y=-.24;actor.chest.rotation.x=.045+hold*.02;}
  if(motion.state==='drink'){
    const lift=smooth(p/.22)*(1-smooth((p-.73)/.27));poseArms(actor,-1.22*lift,0,-.22*lift,.06,1.66*lift,.17);actor.head.rotation.x=-.13*lift;actor.hands[1].rotation.x=-.4*lift;
  }
  if(motion.state==='dodge'){
    const crouch=Math.sin(p*Math.PI);actor.pelvis.position.y-=.32*crouch;actor.chest.rotation.x=.55*crouch;poseArms(actor,-.45,-.6,-.3,.24,1.1,1.1);
  }
  if(motion.state==='airborne'){actor.pelvis.position.y-=.06;poseArms(actor,-.9,-.7,-.4,.4,.7,.7);}
  if(motion.state==='hit'||actor.hitAge<.3){
    const recoil=motion.state==='hit'?Math.sin((.15+p*.85)*Math.PI):Math.sin(clamp(actor.hitAge/.3)*Math.PI);
    actor.chest.rotation.x=-.19*recoil;actor.chest.rotation.z=.065*recoil;actor.neck.rotation.x=.13*recoil;actor.pelvis.position.y-=.045*recoil;
  }
  if(motion.state==='sealed'){poseArms(actor,-.23,-.1,-.1,.1,.48,.32);actor.head.rotation.x=.18;actor.chest.rotation.x=.04;}
  contacts(actor,state,motion);
  if(motion.state==='airborne')for(let i=0;i<2;i++){actor.legs[i].rotation.x=-.3-i*.18;actor.knees[i].rotation.x=.55+i*.3;actor.feet[i].rotation.x=-.15;}
  if(motion.state==='death'){
    const fall=smooth(actor.deathAge/.8),floorHeight=['ranger','porter','courier','traveler','npc','sena'].includes(actor.type)?.34:.2;
    actor.pelvis.position.y=mix(.95,floorHeight,fall);actor.pelvis.rotation.x=-Math.PI*.47*fall;actor.chest.rotation.z=.1*fall;
    poseArms(actor,.2*fall,.4*fall,-.55*fall,.7*fall,.35,.6);
    for(let i=0;i<2;i++){actor.legs[i].rotation.x=-.3;actor.knees[i].rotation.x=.4;actor.feet[i].rotation.x=-.1;}
    if(actor.sword)actor.sword.rotation.x=mix(-1.05,0,fall);
    actor.head.rotation.y=-.2*fall;
  }
}
function wolfPose(actor,state,motion){
  const p=motion.phase,move=['walk','run'].includes(motion.state),breath=Math.sin(actor.time*2.5);
  actor.pelvis.position.y=.816+(move?Math.cos(actor.phase*TAU*2)*.023:breath*.006);
  actor.chest.scale.x=1+breath*.009;actor.neck.rotation.x=move?-.1:Math.sin(actor.time*.55)*.045;
  actor.head.rotation.y=move?0:Math.sin(actor.time*.36)*.08;
  for(let i=0;i<3;i++){const tail=actor.g.getObjectByName(`tail-${i}`);tail.rotation.x=(i===0?.9:.16)+Math.sin(actor.time*2.3-i*.8)*.075;tail.rotation.z=Math.sin(actor.time*1.3-i*.55)*.065;}
  if(motion.state==='windup'){actor.pelvis.position.y-=.13*smooth(p);actor.neck.rotation.x=.25*smooth(p);actor.g.getObjectByName('jaw').rotation.x=.15*smooth(p);}
  if(motion.state==='strike'){actor.chest.rotation.x=-.16*(1-p);actor.neck.rotation.x=-.48*(1-p);actor.g.getObjectByName('jaw').rotation.x=.48*Math.sin(p*Math.PI);}
  if(motion.state==='recover'){actor.neck.rotation.x=mix(-.12,0,smooth(p));actor.head.rotation.x=.05*(1-p);}
  if(motion.state==='hit'){const recoil=Math.sin((.15+p*.85)*Math.PI);actor.chest.rotation.z=.13*recoil;actor.neck.rotation.y=-.22*recoil;actor.pelvis.position.y-=.06*recoil;}
  contacts(actor,state,motion);
  if(motion.state==='death'){
    const fall=smooth(actor.deathAge/.65);actor.pelvis.rotation.z=Math.PI*.47*fall;actor.pelvis.position.y=mix(.816,.325,fall);actor.neck.rotation.x=.25*fall;
    for(let i=0;i<4;i++){actor.legs[i].rotation.x=-.26;actor.knees[i].rotation.x=.6;actor.feet[i].rotation.x=0;}
  }
}
function animateCape(actor,motion){
  if(!actor.cape)return;
  const pos=actor.cape.geometry.attributes.position,base=actor.cape.userData.base;
  const moving=['walk','run'].includes(motion.state),wind=motion.state==='run'?.12:moving?.07:.022;
  for(let i=0;i<pos.count;i++){
    const x=base[i*3],y=base[i*3+1],hem=clamp((.48-y)/1.3);
    const wave=Math.sin(actor.time*3.4+x*5-y*4)*wind*hem;
    const fall=motion.state==='death'?smooth(actor.deathAge/.8):0;
    pos.setZ(i,mix(base[i*3+2]-hem*actor.speed*.01+wave,-.115,fall));pos.setX(i,x+Math.sin(actor.time*2.1-y*2)*.016*hem);
    pos.setY(i,Math.max(y,-actor.pelvis.position.y+.06));
  }
  pos.needsUpdate=true;
}
export function animateDetailedActor(actor,state={},dt=0){
  const delta=Number.isFinite(dt)?clamp(dt,0,.1):0;actor.time+=delta;
  const valid=Number.isFinite(state.x)&&Number.isFinite(state.z),last=actor.lastPosition;
  const travelled=last&&valid?Math.hypot(state.x-last.x,state.z-last.z):0;
  const teleported=travelled>Math.max(2,delta*25);
  actor.speed=last&&delta>0&&!teleported?Math.min(18,travelled/delta):0;
  if(valid)actor.lastPosition={x:state.x,z:state.z};
  if(last&&!teleported&&travelled>0){const stride=clamp(actor.speed/actor.g.scale.y*(actor.type==='wolf'?.12:.11),.28,actor.type==='wolf'?.75:.92);actor.phase=(actor.phase+travelled/actor.g.scale.y/(stride/(actor.type==='wolf'?.57:.62)))%1;}
  if(Number.isFinite(state.hp)){if(actor.lastHp!==null&&state.hp<actor.lastHp)actor.hitAge=0;actor.lastHp=state.hp;}
  actor.hitAge+=delta;
  // A death seen live falls once; an actor first seen already dead starts settled.
  if(state.dead){if(Number.isFinite(state.deathElapsed))actor.deathAge=Math.max(0,state.deathElapsed);else{if(actor.lastDead===false)actor.deathAge=0;actor.deathAge+=delta;}}else actor.deathAge=Infinity;
  if(Object.hasOwn(state,'dead'))actor.lastDead=!!state.dead;
  reset(actor);const motion=detailedMotion({...state,type:state.type||actor.type},actor.speed);actor.motion=motion;
  if(actor.type==='wolf')wolfPose(actor,state,motion);else humanoidPose(actor,state,motion);
  for(const [weapon,node]of [['sword',actor.sword],['greatsword',actor.greatsword],['spear',actor.spear]])if(node)node.visible=motion.state!=='drink'&&weapon===(state.weaponType||'sword');
  if(actor.flask)actor.flask.visible=motion.state==='drink';
  animateCape(actor,motion);return motion;
}
