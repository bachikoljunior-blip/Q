import {createHash} from 'node:crypto';
import {Vector3} from 'three';

export const cloakCases=['player','npc','sena','scout','traveler','ranger','boss'];
export const frameSequence=Array.from({length:90},(_,frame)=>({
  dt:1/60,state:frame<15?{}:frame<45?{x:0,z:(frame-15)/10,moving:true}:frame<60?{attack:.19,attackDuration:.6,weaponType:'sword',combo:1}:frame<75?{dodge:.18}:{dead:true,deathElapsed:(frame-75)/60},
}));
export function actorContract(actor){
  const h=createHash('sha256'),add=value=>h.update(JSON.stringify(value));
  actor.g.traverse(n=>{
    add([n.name,n.type,n.position.toArray(),n.quaternion.toArray(),n.scale.toArray(),n.visible]);
    if(!n.isMesh)return;
    for(const [name,a]of Object.entries(n.geometry.attributes))if(name!=='uv'||n!==actor.cape||actor.type==='boss'){
      add([name,a.itemSize,a.normalized]);h.update(Buffer.from(a.array.buffer,a.array.byteOffset,a.array.byteLength));
    }
    if(n.geometry.index)h.update(Buffer.from(n.geometry.index.array.buffer));
    const m=n.material;add([m.name,m.color.toArray(),m.roughness,m.metalness,m.bumpScale,m.side]);
    for(const slot of ['map','normalMap','bumpMap','roughnessMap'])add([slot,m[slot]?.name,m[slot]?.repeat.toArray()]);
    if(n.isSkinnedMesh)add([n.skeleton.bones.map(b=>b.name),n.bindMatrix.toArray(),n.skeleton.boneInverses.map(m=>m.toArray())]);
  });
  return h.digest('hex');
}
const quantile=(rows,q)=>{const sorted=rows.slice().sort((a,b)=>a.value-b.value),target=sorted.reduce((s,r)=>s+r.weight,0)*q;let sum=0;for(const r of sorted){sum+=r.weight;if(sum>=target)return r.value;}return sorted.at(-1).value;};
export function cloakMetric(cape){
  const g=cape.geometry,p=g.attributes.position,u=g.attributes.uv,index=g.index.array,stretches=[],densities=[];
  let area=0,uvArea=0,negative=0,positive=0,zero=0;const point=i=>new Vector3().fromBufferAttribute(p,i).applyMatrix4(cape.matrixWorld);
  for(let f=0;f<index.length;f+=3){
    const [a,b,c]=index.slice(f,f+3),e1=point(b).sub(point(a)),e2=point(c).sub(point(a)),x=e1.length(),projection=e1.dot(e2)/x,y=new Vector3().crossVectors(e1,e2).length()/x;
    const du1=u.getX(b)-u.getX(a),dv1=u.getY(b)-u.getY(a),du2=u.getX(c)-u.getX(a),dv2=u.getY(c)-u.getY(a),signed=(du1*dv2-dv1*du2)/2,weight=x*y/2;
    if(Math.abs(signed)<1e-12)zero++;else if(signed<0)negative++;else positive++;
    const a11=du1/x,a21=dv1/x,a12=(du2-du1*projection/x)/y,a22=(dv2-dv1*projection/x)/y;
    const trace=a11*a11+a12*a12+a21*a21+a22*a22,det=(a11*a22-a12*a21)**2,d=Math.sqrt(Math.max(0,trace*trace-4*det));
    stretches.push({value:Math.sqrt((trace+d)/(trace-d)),weight});densities.push({value:256*Math.sqrt(Math.abs(signed)/weight),weight});area+=weight;uvArea+=Math.abs(signed);
  }
  return {triangles:index.length/3,vertices:p.count,physicalAreaM2:area,uvArea,density:256*Math.sqrt(uvArea/area),densityP05:quantile(densities,.05),densityP95:quantile(densities,.95),stretchP50:quantile(stretches,.5),stretchP95:quantile(stretches,.95),stretchMax:Math.max(...stretches.map(r=>r.value)),negative,positive,zero};
}
