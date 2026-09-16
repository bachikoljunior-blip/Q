import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {registerHooks} from 'node:module';
import {createHash} from 'node:crypto';
import {Vector3} from 'three';
import {createDetailedActor,ACTOR_FAMILIES} from '../../../src/actor-models.js';
import {Game,groundAt} from '../../../src/core.js';
export {createDetailedActor,ACTOR_FAMILIES,Game,groundAt};
export const hash=b=>createHash('sha256').update(b).digest('hex');
const source=readFileSync(new URL('source-before.js',import.meta.url),'utf8');
assert.equal(hash(source),'04b1a72d8d1f5305dbc0e47dbe10e15c824fd0a29955d5fc08bcb40b8d544a96');
const url=new URL('../../../src/actor-models.js?death-before-v52',import.meta.url).href;
const hook=registerHooks({load(u,c,n){return u===url?{format:'module',source,shortCircuit:true}:n(u,c);}});
export const createBefore=(await import(url)).createDetailedActor;hook.deregister();
const scene=readFileSync(new URL('../../../src/scene.js',import.meta.url),'utf8');
export const prefix=scene.slice(scene.indexOf('this.player.g.position.set(p.x,p.y,p.z);'),scene.indexOf('this.animateModel(this.npc,{moving:false},dt);'));
export const callee=scene.match(/animateModel\(m,e,dt\)\{([^\n]+)\}/)[1];
assert.equal(callee,'m.animate(e,dt);animateVaultWarden(m,e,this.t);');
assert(prefix.includes('this.animateModel(this.player,p,dt)'));
const vault=readFileSync(new URL('../../../src/vault-scene.js',import.meta.url),'utf8');assert(vault.includes('const adornment = model.vaultAdornment; if (!adornment) return null;'));
const renderPrefix=new Function('p','dt','gatheringStage',prefix),animate=new Function('m','e','dt','animateVaultWarden',callee);
export function show(actor,player,dt){renderPrefix.call({player:actor,gatheringFocus:null,t:0,animateModel(m,e,t){animate(m,e,t,()=>{});}},player,dt,()=>{throw Error('Unexpected gathering');});}
export function meshes(a){a.g.updateMatrixWorld(true);const out=[];let ordinal=0;a.g.traverse(n=>{const id=ordinal++;if(!n.isMesh)return;for(let p=n;p;p=p.parent)if(!p.visible)return;if(n.isSkinnedMesh)n.skeleton.update();const vertices=Array.from({length:n.geometry.attributes.position.count},(_,i)=>(n.isSkinnedMesh?n.getVertexPosition(i,new Vector3()):new Vector3().fromBufferAttribute(n.geometry.attributes.position,i)).applyMatrix4(n.matrixWorld));out.push({id,node:n,kind:n===a.cape?'cape':n.isSkinnedMesh?'skin':'rigid',vertices});});return out;}
export function points(a){return meshes(a).flatMap(m=>m.vertices.map((p,i)=>({key:m.id+':'+i,p,kind:m.kind})));}
export function differences(a,b){const old=new Map(a.map(p=>[p.key,p])),out={all:0,skin:0,rigid:0,cape:0,matched:0,added:0,removed:0};for(const p of b){const q=old.get(p.key);if(!q){out.added++;continue;}assert.equal(p.kind,q.kind);const d=p.p.distanceTo(q.p);out.all=Math.max(out.all,d);out[p.kind]=Math.max(out[p.kind],d);out.matched++;old.delete(p.key);}out.removed=old.size;return out;}
export function gaps(ps,ground=groundAt){const out={skin:Infinity,rigid:Infinity,cape:Infinity};for(const {p,kind}of ps)out[kind]=Math.min(out[kind],p.y-ground(p.x,p.z));return out;}
export function surface(a,ground=groundAt){const out={skin:Infinity,rigid:Infinity,cape:Infinity};let samples=0;const point=new Vector3();for(const m of meshes(a)){const g=m.node.geometry,ids=g.index?.array||m.vertices.map((_,i)=>i);for(let f=0;f<ids.length;f+=3){const [a,b,c]=[0,1,2].map(k=>m.vertices[ids[f+k]]);for(const [u,v]of [[0,0],[1,0],[0,1],[.5,0],[.5,.5],[0,.5],[1/3,1/3]]){point.copy(a).multiplyScalar(1-u-v).addScaledVector(b,u).addScaledVector(c,v);out[m.kind]=Math.min(out[m.kind],point.y-ground(point.x,point.z));samples++;}}}return {minimum:out,samples};}
export function actualLethal(weapon,prior,hz,render,location=null){
 const g=new Game();for(const e of g.enemies)e.dead=true;g.weapons=['sword','spear','greatsword'];g.events=[];g.equipWeapon(weapon);
 if(location){g.player.x=location[0];g.player.z=location[1];g.player.y=groundAt(location[0],location[1]);g.player.angle=location[2];}
 const dt=1/hz,input=prior==='walk'?{x:.2,z:.6}:{};let accumulator=0,lastTicks=0;
 function frame(){accumulator+=dt;lastTicks=0;while(accumulator>=1/60){g.tick(1/60,input);accumulator-=1/60;lastTicks++;}const before=JSON.stringify(g.player);render(g.player,dt);assert.equal(JSON.stringify(g.player),before,'animation must not mutate the Game player');}
 for(let i=0;i<hz;i++)frame();if(prior==='attack')assert(g.attack());if(prior==='parry')assert(g.parry());if(prior==='heal'){g.player.hp=1;assert(g.heal());}for(let i=0;i<Math.ceil((prior==='heal'?.30:.12)*hz);i++)frame();
 const p=g.player,e=g.enemies.find(e=>e.type==='knight'&&!e.vaultId);Object.assign(e,{dead:false,hp:10000,maxHp:10000,state:'strike',timer:.15,hit:false,x:p.x-Math.sin(p.angle)*1.4,z:p.z-Math.cos(p.angle)*1.4});e.y=groundAt(e.x,e.z);e.angle=Math.atan2(p.x-e.x,p.z-e.z);p.hp=1;p.invulnerable=0;assert(g.meleeContact(e));
 const eventStart=g.events.length;let aliveState;for(let tries=0;tries<3&&!p.dead;tries++){aliveState={...p};frame();}assert(p.dead&&p.hp===0);const events=g.events.slice(eventStart).map(e=>e.type);assert(events.includes('death'));
 return {g,frame,dt,aliveState,deathTicks:lastTicks,firstState:{...p},events};
}
