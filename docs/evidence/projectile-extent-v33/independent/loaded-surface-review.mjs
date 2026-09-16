import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {Ray,Vector3,Box3} from '/workspace/scratch/e72662e3b71f/Q-projectile-extent-v33/node_modules/three/build/three.module.js';
import {createDetailedActor} from '/workspace/scratch/e72662e3b71f/Q-projectile-extent-v33/src/actor-models.js';
import {ARROW_LENGTH} from '/workspace/scratch/e72662e3b71f/Q-projectile-extent-v33/src/projectile-shape.js';
const point=(n,x=0,y=0,z=0)=>n.localToWorld(new Vector3(x,y,z));
export function inspectLoadedArrow(turn,quick=false){
 const rows=[];
 for(const yaw of(quick?[0]:[0,.9,2.4]))for(const pitch of(quick?[0]:[-.35,0,.35]))for(const timer of(quick?[0]:[.85,.7,.3,.001,0])){
  const a=createDetailedActor('ranger'),e={type:'ranger',x:11,y:2,z:19,angle:yaw,state:timer?'windup':'strike',timer:timer||.22,hit:false,windupMax:1.15,aim:{x:11+Math.sin(yaw)*12,y:3.45+Math.tan(pitch)*12,z:19+Math.cos(yaw)*12}};
  if(turn!==undefined)a.archery.anchorTurn.setFromAxisAngle(new Vector3(0,1,0),turn);a.g.position.set(e.x,e.y,e.z);a.g.rotation.y=yaw;a.animate(e,0);a.g.updateMatrixWorld(true);
  const nock=point(a.archery.upper,0,-.59),tail=point(a.archery.arrow),tip=point(a.archery.arrow,ARROW_LENGTH),direction=tip.clone().sub(tail).normalize(),arrow=[],blockers=[];let geometryCount=0,meshCount=0;
  a.g.traverseVisible(m=>{if(!m.isMesh)return;geometryCount+=(m.geometry.index?.count??m.geometry.attributes.position.count)/3;meshCount++;if(!m.isSkinnedMesh)return;m.skeleton.update();const vertices=[],names=[];
   for(let i=0;i<m.geometry.attributes.position.count;i++){vertices.push(m.getVertexPosition(i,new Vector3()).applyMatrix4(m.matrixWorld));const set=new Set();for(let j=0;j<4;j++)if(m.geometry.attributes.skinWeight.getComponent(i,j)>.1)set.add(m.skeleton.bones[m.geometry.attributes.skinIndex.getComponent(i,j)].name);names.push(set);}
   const ix=m.geometry.index,n=ix?.count??vertices.length;for(let i=0;i<n;i+=3){const ids=[0,1,2].map(j=>ix?ix.getX(i+j):i+j),bones=new Set(ids.flatMap(id=>[...names[id]])),triangle=ids.map(id=>vertices[id]);const record={triangle,bones:[...bones],box:new Box3().setFromPoints(triangle)};if(bones.has('loaded-arrow'))arrow.push(record);else blockers.push(record);}
  });
  const hits=[],intended=[],ray=new Ray(),hit=new Vector3();
  function testEdges(edges,targets,reverse=false){for(const edge of edges)for(let i=0;i<3;i++){const from=edge.triangle[i],to=edge.triangle[(i+1)%3],len=from.distanceTo(to);if(len<1e-7)continue;ray.set(from,to.clone().sub(from).normalize());const box=new Box3().setFromPoints([from,to]);for(const target of targets){if(!box.intersectsBox(target.box))continue;if(!ray.intersectTriangle(...target.triangle,false,hit)||hit.distanceTo(from)>len+1e-7)continue;const bones=reverse?edge.bones:target.bones,near=hit.distanceTo(nock);if(near<.025&&bones.every(n=>n==='finger-tip-1-1'||n.startsWith('string-'))){intended.push({bones,fromNock:near,axisDistance:hit.clone().sub(nock).dot(direction),point:hit.toArray()});continue;}hits.push({bones,point:hit.toArray(),fromNock:near});}}}
  testEdges(arrow,blockers);testEdges(blockers,arrow,true);
  const row={yaw,pitch,timer,tailGap:tail.distanceTo(nock),length:tip.distanceTo(tail),gripOffset:point(a.archery.bow,.095).sub(nock).cross(direction).length(),triangles:geometryCount,meshes:meshCount,hits,intended};rows.push(row);
 }
 return {boundary:'Actual skinned triangle edges on both sides, not rendered pixels or exhaustive volume proof. Right distal-index/string contacts within 25 mm of nock are recorded as the intended contact neighborhood.',rows};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){const report=inspectLoadedArrow();if(process.argv[2])writeFileSync(process.argv[2],JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({poses:report.rows.length,hits:report.rows.filter(r=>r.hits.length).map(r=>({yaw:r.yaw,pitch:r.pitch,timer:r.timer,hits:r.hits.slice(0,5),count:r.hits.length}))}));assert(report.rows.every(r=>r.tailGap<1e-6&&Math.abs(r.length-ARROW_LENGTH)<1e-6&&r.hits.length===0));}
