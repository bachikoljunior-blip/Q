// World-space tail reference; rendering and contact use the same finite arrow.
export const ARROW_LENGTH=1.34;
export const ARROW_SHAPE={shaft:1.1,width:.045,tip:.28,radius:.1};
export function projectilePoint(a,time=0,lead=0){
  time+=lead?lead/(Math.hypot(a.vx,a.vy,a.vz)||1):0;
  return {x:a.x+a.vx*time,y:a.y+a.vy*time,z:a.z+a.vz*time};
}
export function projectileTime(a,time,fraction){
  const speed=Math.hypot(a.vx,a.vy,a.vz)||1;
  return Math.max(0,(fraction*(ARROW_LENGTH+speed*time)-ARROW_LENGTH)/speed);
}
export const projectileBody=actor=>({...actor,y:actor.y+.15,height:(actor.type==='boss'?4.7:actor.type==='wolf'?1.35:2.1)-.15,r:actor.type==='boss'?1.25:.48});
