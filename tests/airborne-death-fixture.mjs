import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {registerHooks} from 'node:module';
import {Game,groundAt,BRIDGES} from '../src/core.js';
export {Game,groundAt};
const beforeURL=new URL('../src/core.js?airborne-before-v55',import.meta.url).href;
const hook=registerHooks({load(url,c,next){return url===beforeURL?{format:'module',source:readFileSync(new URL('../docs/evidence/airborne-death-v55/before-core.js',import.meta.url),'utf8'),shortCircuit:true}:next(url,c);}});
export const BeforeGame=(await import(beforeURL)).Game;hook.deregister();
export const locations=[{id:'haven',x:0,z:101},{id:'bridge',x:BRIDGES[1].x,z:BRIDGES[1].z},{id:'slope',x:-389,z:-38}];
export function ordinaryStrike(g){
 const p=g.player,e=g.enemies.find(e=>!e.dead);Object.assign(e,{x:p.x+1,z:p.z,y:groundAt(p.x+1,p.z),angle:-Math.PI/2,state:'strike',timer:.22,hit:false,dead:false});
 assert(g.meleeContact(e),'fixture must use real melee reach/terrain check');g.tickEnemy(e,0);return e;
}
export function prepare(g,place=locations[0]){
 // Isolated encounter placement; other enemies inactive. Player HP/death and
 // vertical velocity come from normal melee strikes, invulnerability ticks and jump.
 const p=g.player,e=g.enemies.find(e=>e.type==='knight'&&!e.vaultId);for(const other of g.enemies)if(other!==e)other.dead=true;g.obstacles=[];
 Object.assign(p,{x:place.x,z:place.z,y:groundAt(place.x,place.z),ash:100});
 for(let i=0;i<5;i++){ordinaryStrike(g);assert.equal(p.hp,120-22*(i+1));e.state='recover';e.timer=10;for(let n=0;n<12;n++)g.tick(.05,{});}
 assert.equal(p.hp,10);assert(!p.dead);g.events=[];return g;
}
export function jumpTo(g,phase){if(phase===null)return;assert(g.jump());for(let n=0;n<Math.round(phase*60);n++)g.tick(1/60,{});assert(!g.player.grounded);}
export function kill(g){ordinaryStrike(g);assert(g.player.dead);assert.equal(g.player.hp,0);assert.equal(g.player.ash,80);assert.equal(g.events.filter(e=>e.type==='death').length,1);}
export function exceptVertical(g){return JSON.stringify(g,function(key,value){return this===g.player&&['y','vertical','grounded'].includes(key)?undefined:value;});}
export function sampleRun(Type,place,phase,hz){const g=prepare(new Type(),place);jumpTo(g,phase);kill(g);const p=g.player,initial={y:p.y,vertical:p.vertical,grounded:p.grounded},frozen=exceptVertical(g),floor=groundAt(p.x,p.z);let firstMove=null,landedAt=p.grounded?0:null;const points=[];
 for(let i=1;i<=hz*2;i++){g.tick(1/hz,{x:1,z:1,sprint:true,attack:true});if(firstMove===null&&p.y!==initial.y)firstMove=i/hz;if(landedAt===null&&p.grounded)landedAt=i/hz;if([1,Math.round(hz*.2),Math.round(hz*.6),hz*2].includes(i))points.push({time:i/hz,y:p.y,vertical:p.vertical,grounded:p.grounded});}
 assert.equal(exceptVertical(g),frozen,'dead fields outside vertical contract');
 return {place:place.id,phase,hz,initial,firstMove,landedAt,finalGap:p.y-floor,finalVertical:p.vertical,finalGrounded:p.grounded,points};}
