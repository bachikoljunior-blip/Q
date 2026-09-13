import { lineClear } from './spatial.js';

class MinHeap {
  items = [];
  push(node) {
    const a=this.items;a.push(node);let i=a.length-1;
    while(i>0){const p=(i-1)>>1;if(a[p].f<=node.f)break;a[i]=a[p];i=p;}a[i]=node;
  }
  pop() {
    const a=this.items,first=a[0],tail=a.pop();if(!a.length)return first;
    let i=0;while(i*2+1<a.length){let c=i*2+1;if(c+1<a.length&&a[c+1].f<a[c].f)c++;if(a[c].f>=tail.f)break;a[i]=a[c];i=c;}a[i]=tail;return first;
  }
}

// Bounded A* fallback for crowded ruin entrances. It never moves an actor itself.
export function findPath(start, goal, obstacles, radius=.48) {
  if(lineClear(start,goal,obstacles,radius+.08))return [{x:goal.x,z:goal.z}];
  const cell=1.6,margin=16;
  const left=Math.max(-280,Math.floor((Math.min(start.x,goal.x)-margin)/cell)*cell);
  const top=Math.max(-282,Math.floor((Math.min(start.z,goal.z)-margin)/cell)*cell);
  const right=Math.min(280,Math.max(start.x,goal.x)+margin),bottom=Math.min(220,Math.max(start.z,goal.z)+margin);
  const width=Math.floor((right-left)/cell)+1,height=Math.floor((bottom-top)/cell)+1;
  const nearby=obstacles.filter(o=>o.x+o.r+radius>=left&&o.x-o.r-radius<=right&&o.z+o.r+radius>=top&&o.z-o.r-radius<=bottom);
  const point=id=>({x:left+(id%width)*cell,z:top+Math.floor(id/width)*cell});
  const valid=p=>p.x>=-280&&p.x<=280&&p.z>=-282&&p.z<=220&&!nearby.some(o=>Math.hypot(p.x-o.x,p.z-o.z)<o.r+radius+.08);
  function attach(p){
    const x=Math.round((p.x-left)/cell),z=Math.round((p.z-top)/cell);let best=null,distance=Infinity;
    for(let dz=-2;dz<=2;dz++)for(let dx=-2;dx<=2;dx++){
      const nx=x+dx,nz=z+dz;if(nx<0||nx>=width||nz<0||nz>=height)continue;
      const id=nz*width+nx,q=point(id),d=Math.hypot(p.x-q.x,p.z-q.z);
      if(d<distance&&valid(q)&&lineClear(p,q,nearby,radius+.04)){best=id;distance=d;}
    }return best;
  }
  const source=attach(start),target=attach(goal);if(source===null||target===null)return [];
  const open=new MinHeap(),cost=new Map([[source,0]]),parent=new Map(),closed=new Set();
  const destination=point(target),heuristic=id=>{const p=point(id);return Math.hypot(p.x-destination.x,p.z-destination.z);};
  open.push({id:source,f:heuristic(source)});let visited=0;
  while(open.items.length&&visited++<14000){
    const {id}=open.pop();if(closed.has(id))continue;
    if(id===target){
      const path=[{x:goal.x,z:goal.z}];let cursor=id;
      while(cursor!==undefined){path.unshift(point(cursor));cursor=parent.get(cursor);}
      // Visibility smoothing keeps paths away from unnecessary grid zigzags.
      const result=[];let anchor=start;
      for(let i=0;i<path.length;){let far=i;while(far+1<path.length&&lineClear(anchor,path[far+1],nearby,radius+.08))far++;result.push(path[far]);anchor=path[far];i=far+1;}
      return result;
    }
    closed.add(id);const x=id%width,z=Math.floor(id/width),a=point(id);
    for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){
      if(!dx&&!dz)continue;const nx=x+dx,nz=z+dz;if(nx<0||nx>=width||nz<0||nz>=height)continue;
      const next=nz*width+nx;if(closed.has(next))continue;const b=point(next);
      if(!valid(b)||!lineClear(a,b,nearby,radius+.06))continue;
      const value=cost.get(id)+Math.hypot(dx,dz)*cell;if(value>=(cost.get(next)??Infinity))continue;
      cost.set(next,value);parent.set(next,id);open.push({id:next,f:value+heuristic(next)});
    }
  }
  return [];
}
