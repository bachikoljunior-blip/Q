import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const root=pathToFileURL(process.argv[2].replace(/\/$/,'')+'/');
const base=new URL('../Q-recovery-v51-20260916/',import.meta.url),actorRoot=new URL('../Q-death-recovery-v52/',import.meta.url);
const hook=registerHooks({resolve(s,c,next){if(s==='three')return next(new URL('node_modules/three/build/three.module.js',base).href,c);if(s.startsWith('three/addons/'))return next(new URL('node_modules/three/examples/jsm/'+s.slice(13),base).href,c);return next(s,c);}});
const {Vector3}=await import(new URL('node_modules/three/build/three.module.js',base));
const {createDetailedActor}=await import(new URL('src/actor-models.js',actorRoot));
const candidate=await import(new URL('src/core.js',root)),before=await import(new URL('src/core.js',base));
const sha=b=>createHash('sha256').update(b).digest('hex');
const actorHash=sha(await readFile(new URL('src/actor-models.js',actorRoot)));
const scene=await readFile(new URL('src/scene.js',root),'utf8');
const marker='this.animateModel(this.player,p,dt);',start=scene.indexOf('update(dt,playing){'),end=scene.indexOf(marker,start)+marker.length;
assert(start>=0&&end>start);
const prefix=scene.slice(start,end)+'}';
// Execute the actual SceneView player update prefix; stop explicitly before
// NPC, atmosphere, camera and renderer work. This is CPU geometry, not a frame.
const update=new Function('return ({'+prefix+'}).update')();
function metric(actor,ground){let all=Infinity,skin=Infinity,cloth=Infinity,weapon=Infinity,worst=null,count=0;const point=new Vector3();actor.g.updateMatrixWorld(true);actor.g.traverseVisible(n=>{if(!n.isMesh)return;if(n.isSkinnedMesh)n.skeleton.update();for(let i=0;i<n.geometry.attributes.position.count;i++){if(n.isSkinnedMesh)n.getVertexPosition(i,point);else point.fromBufferAttribute(n.geometry.attributes.position,i);point.applyMatrix4(n.matrixWorld);const gap=point.y-ground(point.x,point.z);count++;if(gap<all){all=gap;worst={mesh:n.name,vertex:i,xyz:point.toArray()};}if(n.isSkinnedMesh)skin=Math.min(skin,gap);else if(n===actor.cape)cloth=Math.min(cloth,gap);else weapon=Math.min(weapon,gap);}});return {all,skin,cloth,rigid:weapon,worst,vertices:count};}
const report={at:new Date().toISOString(),root:root.pathname,actorRoot:actorRoot.pathname,actorHash,sceneHash:sha(scene),playerUpdatePrefix:prefix,results:[],boundary:'Actual Game and actual SceneView player prefix plus actual recovered death-entry actor and Three CPU skinning. All visible mesh vertices, no interior triangle terrain guarantee; rigid category includes all non-skinned non-cape accessories. No renderer/WebGL/device claim.'};
const places=[{id:'spawn',x:0,z:101},{id:'slope',x:-389,z:-38},{id:'bridge',x:candidate.BRIDGES[0].x,z:candidate.BRIDGES[0].z}];
for(const place of places)for(const weapon of ['sword','greatsword','spear'])for(const phase of ['ascent','descent']){
 const row={place:place.id,weapon,phase,variants:{}};
 for(const [name,api]of [['baseline',before],['candidate',candidate]]){
  const game=new api.Game(),p=game.player;Object.assign(p,{x:place.x,z:place.z,y:api.groundAt(place.x,place.z)+(phase==='ascent'?1.0941666666666667:.7),vertical:phase==='ascent'?3.65:-4,grounded:false,weaponType:weapon});
  const actor=createDetailedActor('player',{groundHeight:api.groundAt}),view={t:0,sway:{value:0},game,player:actor,gatheringFocus:null,updateTreeDetail(){},animateModel(m,s,dt){m.animate(s,dt);}};
  update.call(view,1/60,true);game.hurtPlayer(999);let min={all:Infinity,skin:Infinity,cloth:Infinity,rigid:Infinity},worst=null,frames=[];
  for(let i=0;i<72;i++){game.tick(1/60);update.call(view,1/60,true);const m=metric(actor,api.groundAt);for(const key of Object.keys(min))min[key]=Math.min(min[key],m[key]);if(!worst||m.all<worst.gap)worst={gap:m.all,frame:i+1,...m.worst};if([0,11,23,47,71].includes(i))frames.push({frame:i+1,rootGap:p.y-api.groundAt(p.x,p.z),metric:m});assert.equal(actor.g.position.y,p.y);}
  row.variants[name]={minimum:min,worst,frames};
 }
 report.results.push(row);
}
assert.equal(sha(await readFile(new URL('src/actor-models.js',actorRoot))),actorHash);
hook.deregister();await writeFile(new URL('contact.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({cases:report.results.length,actorHash,summary:report.results.map(r=>({place:r.place,weapon:r.weapon,phase:r.phase,before:r.variants.baseline.minimum,after:r.variants.candidate.minimum}))},null,2));
