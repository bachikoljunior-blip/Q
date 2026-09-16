import test from 'node:test';
import assert from 'node:assert/strict';
import { Group, NormalBlending, Scene, Vector3 } from 'three';
import { createDetailedActor } from '../src/actor-models.js';
import { WEAPONS } from '../src/content.js';
import { WeaponTrails, WEAPON_TRAIL_LIMITS, WEAPON_TRAIL_SHAPES } from '../src/weapon-trails.js';

function stateAt(weapon,time,extra={}){
  const stats=WEAPONS[weapon];
  return Object.freeze({weaponType:weapon,attackDuration:stats.duration,attack:stats.duration-stats.hitTime-time,combo:0,hp:100,dead:false,...extra});
}
function synthetic(weapon='sword'){
  const scene=new Scene(),actor={g:new Group(),motion:{state:'attack',combat:{releaseStart:-.1,releaseEnd:.1}}};
  scene.add(actor.g);
  for(const name of Object.keys(WEAPONS)){actor[name]=new Group();actor.g.add(actor[name]);}
  const trail=new WeaponTrails(scene);
  const frame=(time,dt=1/60,extra={},active=true)=>trail.update(actor,stateAt(weapon,time,extra),dt,active);
  return {scene,actor,trail,frame};
}
function live(weapon='sword'){
  const f=synthetic(weapon);f.frame(-.06);f.actor[weapon].position.z=.15;f.frame(-.04,.02);assert.equal(f.trail.mesh.visible,true);return f;
}
function near(a,b,epsilon=2e-6){assert.equal(a.length,b.length);for(let i=0;i<a.length;i++)assert(Math.abs(a[i]-b[i])<=epsilon,`component ${i}: ${a[i]} versus ${b[i]}`);}

test('all three trails use the rendered weapon apex in the same frame, including changed ancestor transforms',()=>{
  for(const weapon of Object.keys(WEAPONS)){
    const scene=new Scene(),rigParent=new Group(),actor=createDetailedActor('player'),trail=new WeaponTrails(scene);
    scene.add(rigParent);rigParent.add(actor.g);
    rigParent.position.set(7,1,-3);rigParent.rotation.set(.13,-.9,.06);rigParent.scale.set(1.12,.94,1.05);
    const first=stateAt(weapon,-.03);actor.animate(first,0);trail.update(actor,first,1/240);
    // No renderer or updateMatrixWorld call occurs before this second sample.
    rigParent.rotation.y+=.005;actor.g.position.set(.01,.005,.006);actor.g.rotation.y=.02;
    const second=stateAt(weapon,-.03+1/240);const saved=JSON.stringify(second);actor.animate(second,1/240);
    const pose=[...actor.g.position.toArray(),...actor.g.quaternion.toArray(),...actor.g.scale.toArray()];assert.equal(trail.update(actor,second,1/240),true);
    assert.equal(JSON.stringify(second),saved);assert.deepEqual([...actor.g.position.toArray(),...actor.g.quaternion.toArray(),...actor.g.scale.toArray()],pose);
    const node=actor[weapon],apex=new Vector3(...WEAPON_TRAIL_SHAPES[weapon].points.slice(9));
    let distance=Infinity;node.traverse(child=>{if(child.isMesh){const position=child.geometry.attributes.position;
      for(let i=0;i<position.count;i++)distance=Math.min(distance,new Vector3().fromBufferAttribute(position,i).applyMatrix4(child.matrix).distanceTo(apex));
    }});
    assert(distance<1e-6,`${weapon}: sampled apex must exist on the authored weapon geometry`);
    apex.applyMatrix4(node.matrixWorld);
    const vertex=(trail.rows-1)*6+5,actual=Array.from(trail.positions.slice(vertex*3,vertex*3+3));near(actual,apex.toArray());
    const shape=WEAPON_TRAIL_SHAPES[weapon];
    for(let i=0;i<4;i++)near(Array.from(trail.current.slice(i*3,i*3+3)),new Vector3().fromArray(shape.points,i*3).applyMatrix4(node.matrixWorld).toArray());
    trail.dispose();
  }
});

test('fixed attack-time sampling has equal lifetime, positions, taper and opacity at 30, 60 and 120 updates per second',()=>{
  for(const weapon of Object.keys(WEAPONS)){
    const outputs=[];
    for(const hz of [30,60,120]){
      const {actor,trail,frame}=synthetic(weapon);
      for(let i=0;i<=hz/5;i++){
        const time=-.1+i/hz;actor.g.position.set(time*.5,0,time*.2);actor[weapon].position.x=time*4;
        frame(time,1/hz);
      }
      outputs.push({rows:trail.rows,positions:Array.from(trail.positions.slice(0,trail.rows*18)),colors:Array.from(trail.colors.slice(0,trail.rows*24))});
      trail.dispose();
    }
    for(const result of outputs.slice(1)){assert.equal(result.rows,outputs[0].rows);near(result.positions,outputs[0].positions);near(result.colors,outputs[0].colors);}
  }
});

test('pause, death, equipment, root and attack discontinuities suppress stale ribbon connections',()=>{
  const cases=[
    ['zero-delta pause',f=>f.frame(-.04,0)],
    ['inactive view',f=>f.frame(-.03,1/60,{},false)],
    ['dead',f=>f.frame(-.03,1/60,{dead:true})],
    ['zero hp',f=>f.frame(-.03,1/60,{hp:0})],
    ['weapon switch',f=>f.frame(-.03,1/60,{weaponType:'spear'})],
    ['combo boundary',f=>f.frame(-.03,1/60,{combo:1})],
    ['rewound attack',f=>f.frame(-.07)],
    ['duration change',f=>f.frame(-.03,1/60,{attackDuration:.5})],
    ['clock skip',f=>f.frame(.2)],
    ['large delta',f=>f.frame(-.03,.3)],
    ['root teleport',f=>{f.actor.g.position.x=30;f.frame(-.03);}],
    ['weapon attachment jump',f=>{f.actor.sword.position.z=20;f.frame(-.03);}],
    ['frozen clock changed pose',f=>{f.actor.sword.position.z=.4;f.frame(-.04);}],
    ['hidden root',f=>{f.actor.g.visible=false;f.frame(-.03);}],
    ['hidden weapon',f=>{f.actor.sword.visible=false;f.frame(-.03);}],
    ['NaN transform',f=>{f.actor.sword.position.x=NaN;f.frame(-.03);}],
    ['cancelled action',f=>{f.actor.motion.state='dodge';f.frame(-.03);}],
    ['attack ended',f=>f.frame(-.03,1/60,{attack:0})],
    ['explicit lifecycle boundary',f=>f.trail.reset('save-load')],
  ];
  for(const [label,interrupt]of cases){
    const f=live();interrupt(f);assert.equal(f.trail.mesh.visible,false,label);assert.equal(f.trail.geometry.drawRange.count,0,label);assert(f.trail.count<=1,label);f.trail.dispose();
  }
});

test('a restored mid-swing has no invented history, and release history tapers away without sampling recovery',()=>{
  const {actor,trail,frame}=synthetic('greatsword');frame(0);assert.equal(trail.mesh.visible,false);assert.equal(trail.count,1);
  actor.g.position.z=.01;frame(.02,.02);assert(trail.mesh.visible);
  for(let i=2;i<=12;i++){actor.g.position.z=i*.01;frame(i*.02,.02);}
  assert.equal(trail.mesh.visible,false);assert.equal(trail.count,0);
  frame(.25,.01,{attack:0});assert.equal(trail.previousTime,null);trail.dispose();
});

test('the actor release envelope clips emission at its exact bounds rather than a global animation clock',()=>{
  const {actor,trail,frame}=synthetic();actor.motion.combat={releaseStart:-.05,releaseEnd:.04};
  frame(-.09);actor.sword.position.x=.1;frame(-.06,.03);assert.equal(trail.count,0);
  actor.sword.position.x=.2;frame(-.04,.02);assert(trail.mesh.visible);
  for(let i=0;i<trail.count;i++)assert(trail.times[(trail.head+i)%WEAPON_TRAIL_LIMITS.samples]>=-.05-1e-7);
  actor.sword.position.x=.3;frame(0,.04);actor.sword.position.x=.4;frame(.05,.05);
  near([trail.times[(trail.head+trail.count-1)%WEAPON_TRAIL_LIMITS.samples]],[.04],1e-7);
  actor.sword.position.x=.5;frame(.1,.05);actor.sword.position.x=.6;frame(.15,.05);
  assert.equal(trail.mesh.visible,false);assert.equal(trail.count,0);trail.dispose();
});

test('sample storage and render buffers remain bounded through 6000 updates and disposal is idempotent',()=>{
  const {actor,trail,frame}=synthetic('greatsword');
  const buffers=[trail.samples,trail.times,trail.current,trail.previous,trail.interpolated,trail.positions,trail.colors,trail.geometry.index.array];
  const bytes=buffers.reduce((total,array)=>total+array.byteLength,0),geometry=trail.geometry,material=trail.material;
  let maxRows=0,maxTriangles=0;
  for(let i=0;i<6000;i++){
    const cycle=i%90,time=-.1+cycle/120;actor.g.position.z=i*.001;actor.g.rotation.y=i*.0001;
    frame(time,1/120,{combo:Math.floor(i/90)%3});
    maxRows=Math.max(maxRows,trail.rows);maxTriangles=Math.max(maxTriangles,geometry.drawRange.count/3);
    assert(trail.count<WEAPON_TRAIL_LIMITS.samples);assert(trail.rows<=WEAPON_TRAIL_LIMITS.samples);
  }
  assert(maxRows>10);assert(maxTriangles<=WEAPON_TRAIL_LIMITS.triangles);
  const after=[trail.samples,trail.times,trail.current,trail.previous,trail.interpolated,trail.positions,trail.colors,trail.geometry.index.array];
  after.forEach((array,i)=>assert.equal(array,buffers[i]));assert.equal(after.reduce((total,array)=>total+array.byteLength,0),bytes);
  assert.equal(trail.material.blending,NormalBlending);assert.equal(trail.material.forceSinglePass,true);
  assert.equal(trail.material.depthTest,true);assert.equal(trail.material.depthWrite,false);assert.equal(trail.material.toneMapped,true);
  assert.equal(trail.mesh.children.length,0);assert.equal(trail.mesh.castShadow,false);
  let geometryDisposals=0,materialDisposals=0;geometry.addEventListener('dispose',()=>geometryDisposals++);material.addEventListener('dispose',()=>materialDisposals++);
  trail.dispose();trail.dispose();frame(0);assert.equal(geometryDisposals,1);assert.equal(materialDisposals,1);assert.equal(trail.mesh.parent,null);assert.equal(trail.mesh.visible,false);
});
