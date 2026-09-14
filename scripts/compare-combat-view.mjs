// Fixed-state comparison of the former actor-relative HUD and the candidate
// Three.js-projected HUD. This computes clip coordinates but does not render pixels.
import assert from 'node:assert/strict';
import * as T from 'three';
import {Game,heightAt} from '../src/core.js';
import {combatPresentation,renderCombatHint} from '../src/combat-presentation.js';

function fixture(){
  const game=new Game();game.enemies.forEach(enemy=>enemy.dead=true);game.obstacles=[];
  Object.assign(game.player,{x:0,z:0,y:heightAt(0,0),angle:0});
  const enemy=game.enemies.find(candidate=>candidate.type==='knight');
  Object.assign(enemy,{dead:false,x:2.6,z:0,y:heightAt(2.6,0),homeX:2.6,homeZ:0,angle:-Math.PI/2,state:'windup',timer:.85,windupMax:.85,radial:false,hit:false});
  return game;
}

export function compareCombatView(){
  const game=fixture(),before=JSON.stringify(game.serialize()),viewportWidth=1600,viewportHeight=900,pitch=.3,zoom=9;
  const definitions=[
    {id:'camera-from-south',cameraYaw:0,expected:'右'},
    {id:'camera-from-east',cameraYaw:Math.PI/2,expected:'正面'},
    {id:'camera-from-north',cameraYaw:Math.PI,expected:'左'},
    {id:'camera-from-west',cameraYaw:-Math.PI/2,expected:'正面'},
  ];
  const scenarios=definitions.map(({id,cameraYaw,expected})=>{
    const camera=new T.PerspectiveCamera(54,viewportWidth/viewportHeight,.1,1100),player=game.player,d=zoom;
    const target=new T.Vector3(player.x,player.y+1.6,player.z);
    camera.position.set(player.x+Math.sin(cameraYaw)*Math.cos(pitch)*d,player.y+1.7+Math.sin(pitch)*d,player.z+Math.cos(cameraYaw)*Math.cos(pitch)*d);camera.lookAt(target);camera.updateMatrixWorld();
    const project=position=>{const point=new T.Vector3(position.x,position.y,position.z).project(camera);return{x:(point.x*.5+.5)*viewportWidth,y:(-point.y*.5+.5)*viewportHeight,visible:point.z<1&&point.z>-1};};
    const element={textContent:'',setAttribute(){},classList:{toggle(){}}},candidate=renderCombatHint(element,game,{cameraYaw,project,viewportWidth,viewportHeight}).primary.screenDirection,point=project(combatPresentation(game).primary.position);
    return {id,cameraYaw,expected,projectedX:Math.round(point.x*1000)/1000,baseline:combatPresentation(game).primary.direction,candidate};
  });
  assert.deepEqual(scenarios.map(s=>s.baseline),['右','右','右','右']);
  assert.deepEqual(scenarios.map(s=>s.candidate),scenarios.map(s=>s.expected));
  const attributes={},classes=new Map(),element={textContent:'',setAttribute:(key,value)=>attributes[key]=value,classList:{toggle:(key,value)=>classes.set(key,value)}};
  renderCombatHint(element,game,{cameraYaw:-Math.PI/2,project:()=>({x:viewportWidth/2,y:viewportHeight/2,visible:true}),viewportWidth,viewportHeight});
  assert.match(element.textContent,/^待機 .+ → 回避\n↑ .+画面前方/);assert.equal(attributes['data-direction'],'正面');assert.equal(classes.get('urgent'),false);
  assert.equal(JSON.stringify(game.serialize()),before);
  return {baselineRef:'9c5dd6a61dba5cb0b040e11aa52edb73028fb630',sameGameState:true,projectionContract:'Three.js PerspectiveCamera(54deg, 1600x900), scene camera position/lookAt formula, pitch=.3, zoom=9',scenarioCount:scenarios.length,baselineScreenContractMatches:scenarios.filter(s=>s.baseline===s.expected).length,candidateScreenContractMatches:scenarios.filter(s=>s.candidate===s.expected).length,changedDirections:scenarios.filter(s=>s.baseline!==s.candidate).length,scenarios,hudText:element.textContent,stateUnchanged:true,note:'Pure threat model, Three.js clip projection and minimal DOM sink only; no WebGL pixels, touch, audio, physical-device performance or player-quality observation.'};
}

if(process.argv[1]&&import.meta.url===new URL(process.argv[1],'file:').href)console.log(JSON.stringify(compareCombatView(),null,2));
