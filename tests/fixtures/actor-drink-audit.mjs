import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {Vector3} from 'three';
import {createDetailedActor} from '../../src/actor-models.js';
const sourceHashes=()=>Object.fromEntries(['src/actor-models.js','src/character-motion.js'].map(p=>[p,createHash('sha256').update(readFileSync(new URL('../../'+p,import.meta.url))).digest('hex')]));
const result={sourceHashes:sourceHashes(),boundary:'Host Node production Three.js drink-lowering/exit transforms only; no renderer/performance/PS4 quality evidence',sequences:[],phaseEntry:[],determinism:[]};
function snap(a,w){a.g.updateMatrixWorld(true);return{tip:a[w].localToWorld(new Vector3(0,w==='spear'?-1.965:-1.61,0)),visible:a[w].visible,nodes:[...a.arms,...a.elbows,...a.hands].map(n=>({name:n.name,p:n.getWorldPosition(new Vector3()),q:n.quaternion.clone()}))};}
function diff(a,b){return{tip:a.tip.distanceTo(b.tip),bothVisible:a.visible&&b.visible,nodes:a.nodes.map((n,i)=>({name:n.name,position:n.p.distanceTo(b.nodes[i].p),rotation:n.q.angleTo(b.nodes[i].q)}))};}
for(const weaponType of ['greatsword','spear'])for(const previouslyEquipped of [false,true]){
 const a=createDetailedActor('player');if(previouslyEquipped){a.animate({weaponType},1/60);a.animate({weaponType,parry:.01},1/60);for(let i=0;i<12;i++)a.animate({weaponType},1/60);}
 a.animate({weaponType,healTimer:.9*(1-.65)},1/60);let previous=snap(a,weaponType);const steps=[];
 for(let i=1;i<=32;i++){const healTimer=Math.max(0,.9*(1-.65)-i/60);a.animate({weaponType,healTimer},1/60);const next=snap(a,weaponType);steps.push({i,healTimer,phase:a.motion.phase,state:a.motion.state,...diff(previous,next)});previous=next;}
 result.sequences.push({weaponType,previouslyEquipped,maxVisibleTipStep:Math.max(...steps.filter(s=>s.bothVisible).map(s=>s.tip)),maxWristStep:Math.max(...steps.flatMap(s=>s.nodes.filter(n=>n.name.startsWith('hand')).map(n=>n.position))),steps});
}
for(const weaponType of ['greatsword','spear']){
 const a=createDetailedActor('player');a.animate({weaponType,healTimer:.9*(1-(.73-1e-7))},0);const before=snap(a,weaponType);a.animate({weaponType,healTimer:.9*(1-(.73+1e-7))},0);result.phaseEntry.push({weaponType,...diff(before,snap(a,weaponType))});
 for(const phase of [.74,.85,.95,.999]){const fresh=createDetailedActor('player'),used=createDetailedActor('player');for(let i=0;i<30;i++)used.animate({weaponType,parry:.2},1/60);const state={weaponType,healTimer:.9*(1-phase)};fresh.animate(state,0);used.animate(state,0);const d=diff(snap(fresh,weaponType),snap(used,weaponType));result.determinism.push({weaponType,phase,maxPosition:Math.max(...d.nodes.map(n=>n.position)),maxRotation:Math.max(...d.nodes.map(n=>n.rotation))});}
}
console.log(JSON.stringify(result,null,2));
