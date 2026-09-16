import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL,fileURLToPath} from 'node:url';
const repo=fileURLToPath(new URL('../../',import.meta.url)).replace(/\/$/,''), sha='547676fdce8d8e97abed9f065aad0b6e24af2fd6';
const url=p=>pathToFileURL(`${repo}/${p}`).href;
const {Vector3}=await import(url('node_modules/three/build/three.module.js'));
const sourceCache=new Map();
const source=p=>{if(!sourceCache.has(p))sourceCache.set(p,process.argv.includes('--current')?readFileSync(`${repo}/${p}`,'utf8'):execFileSync('git',['show',`${sha}:${p}`],{cwd:repo,encoding:'utf8'}));return sourceCache.get(p);};
const sourceHashes=()=>Object.fromEntries([...sourceCache].map(([p,s])=>[p,createHash('sha256').update(s).digest('hex')]));
const moduleUrl=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const motion=moduleUrl(source('src/character-motion.js').replace("'./content.js'",JSON.stringify(url('src/content.js'))));
const model=moduleUrl(source('src/actor-models.js').replace("'./assets/characters/detailed-geometry.js'",JSON.stringify(url('src/assets/characters/detailed-geometry.js'))).replace("'./character-motion.js'",JSON.stringify(motion)).replace("'three'",JSON.stringify(url('node_modules/three/build/three.module.js'))));
const {createDetailedActor}=await import(model);
const {Game}=await import(url('src/core.js'));
const {WEAPONS}=await import(url('src/content.js'));
function snap(a){a.g.updateMatrixWorld(true);return {pelvis:a.pelvis.getWorldPosition(new Vector3()),neck:a.neck.quaternion.clone(),arm:a.arms[1]?.quaternion.clone(),hand:a.hands[1]?.getWorldPosition(new Vector3()),tip:a.sword?.localToWorld(new Vector3(0,-1.11,0)),localPelvis:a.pelvis.position.toArray(),feet:a.feet.map(f=>f.getWorldPosition(new Vector3())),neckX:a.neck.rotation.x};}
function diff(a,b){return {pelvisM:a.pelvis.distanceTo(b.pelvis),neckRad:a.neck.angleTo(b.neck),armRad:a.arm?.angleTo(b.arm),handM:a.hand?.distanceTo(b.hand),tipM:a.tip?.distanceTo(b.tip),neckX:[a.neckX,b.neckX],pelvis:[a.localPelvis,b.localPelvis],feetM:Math.max(...a.feet.map((f,i)=>f.distanceTo(b.feet[i])))};}
const definitions=[['soldier',.85,1.1],['boss',1.1,.85],['boss-radial',1.35,.85],['wolf',.62,.9],['ranger',1.15,1.15]];
const staticSeams=[],runtimeSeams=[];
for(const [label,windupMax,recoverMax] of definitions){
 const type=label.split('-')[0],radial=label.includes('radial'),a=createDetailedActor(type),base={type,radial,x:0,y:0,z:0,windupMax,dead:false};
 for(const [seam,from,to] of [['windup-strike',{state:'windup',timer:1e-6},{state:'strike',timer:.22}],['strike-recover',{state:'strike',timer:1e-6},{state:'recover',timer:recoverMax}]]){
  a.animate({...base,...from},0);const previous=snap(a);a.animate({...base,...to},0);staticSeams.push({label,seam,...diff(previous,snap(a))});
 }
 const game=new Game();game.lit=['haven','grove','flood','ruins'];Object.assign(game.player,{x:0,z:50});const e={...base,homeX:0,homeZ:0,state:'windup',timer:windupMax,cooldown:0,hp:100,maxHp:100,aim:{x:0,y:1,z:50}};
 const live=createDetailedActor(type);live.animate(e,1/60);let previous=snap(live),previousState=e.state,previousTimer=e.timer,max={tipM:0,armRad:0,neckRad:0,pelvisM:0};
 for(let frame=0;frame<150;frame++){
  game.tickEnemy(e,1/60);live.animate(e,1/60);const current=snap(live),change=diff(previous,current);for(const key of Object.keys(max))max[key]=Math.max(max[key],change[key]||0);
  if(previousState!==e.state)runtimeSeams.push({label,frame,seam:`${previousState}-${e.state}`,timer:[previousTimer,e.timer],...change});
  previous=current;previousState=e.state;previousTimer=e.timer;if(e.state==='chase')break;
 }
 runtimeSeams.push({label,max60HzFrame:max});
}
const weaponSweeps=[];
for(const weaponType of ['sword','greatsword','spear'])for(let combo=0;combo<3;combo++){
 const a=createDetailedActor('player'),stats=WEAPONS[weaponType],rows=[];let maxGap=0,minGap=Infinity;
 for(let i=0;i<=40;i++){
  const elapsed=stats.duration*i/40,attack=Math.max(1e-8,stats.duration-elapsed);a.animate({weaponType,combo,attack,attackDuration:stats.duration},0);a.g.updateMatrixWorld(true);
  const bone=a[weaponType],tip=bone.localToWorld(new Vector3(0,weaponType==='spear'?-1.965:weaponType==='greatsword'?-1.61:-1.11,0));
  const palm=a.hands[0].localToWorld(new Vector3(0,-.06,.013));const start=bone.localToWorld(new Vector3(0,weaponType==='spear'?.75:.08,0)),end=bone.localToWorld(new Vector3(0,weaponType==='spear'?-1.65:-.16,0));const line=end.clone().sub(start),u=Math.max(0,Math.min(1,palm.clone().sub(start).dot(line)/line.lengthSq())),gap=palm.distanceTo(start.addScaledVector(line,u));maxGap=Math.max(maxGap,gap);minGap=Math.min(minGap,gap);
  rows.push({t:elapsed,tip:tip.toArray(),pelvis:a.pelvis.position.toArray()});
 }
 weaponSweeps.push({weaponType,combo,offhandPalmHandleGapM:[minGap,maxGap],horizontalPelvisRangeM:{x:Math.max(...rows.map(r=>r.pelvis[0]))-Math.min(...rows.map(r=>r.pelvis[0])),z:Math.max(...rows.map(r=>r.pelvis[2]))-Math.min(...rows.map(r=>r.pelvis[2]))},tipBounds:rows.reduce((b,r)=>r.tip.map((n,i)=>[Math.min(b[i][0],n),Math.max(b[i][1],n)]),[[Infinity,-Infinity],[Infinity,-Infinity],[Infinity,-Infinity]])});
}
console.log(JSON.stringify({sourceHashes:sourceHashes(),source:process.argv.includes('--current')?'current':sha,boundary:'Host Node production Three.js transforms; no browser, pixels, art parity, or device-performance evidence',staticSeams,runtimeSeams,weaponSweeps},null,2));
