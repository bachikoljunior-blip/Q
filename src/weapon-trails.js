import { BufferAttribute, BufferGeometry, Color, DoubleSide, DynamicDrawUsage, Mesh, MeshBasicMaterial, Vector3 } from 'three';
import { WEAPONS } from './content.js';

// These are geometry-local points in detailed-geometry.js, not a world-facing
// axis or a gameplay reach. The actor's weapon Bone owns all pose transforms.
// Each pair defines the edges of a swept strip; the second is a narrow glint.
// The spear uses a small cross-section of its actual head for a thrust streak.
export const WEAPON_TRAIL_SHAPES=Object.freeze({
  sword:Object.freeze({points:Object.freeze([0,-.55,0, 0,-1.11,0, .012,-1.055,0, 0,-1.11,0]),life:.105}),
  greatsword:Object.freeze({points:Object.freeze([0,-.76,0, 0,-1.61,0, .018,-1.555,0, 0,-1.61,0]),life:.135}),
  spear:Object.freeze({points:Object.freeze([-.018,-1.86,0, .018,-1.86,0, .009,-1.92,0, 0,-1.965,0]),life:.085}),
});

export const WEAPON_TRAIL_LIMITS=Object.freeze({samples:24,sampleStep:1/120,maxFrameGap:.1,drawCalls:1,triangles:184});
const ROWS=WEAPON_TRAIL_LIMITS.samples,STEP=WEAPON_TRAIL_LIMITS.sampleStep,EPS=1e-7;
const clamp=x=>Math.max(0,Math.min(1,x));
const finitePoints=points=>{for(let i=0;i<points.length;i++)if(!Number.isFinite(points[i]))return false;return true;};

/** A single player-weapon trail under the world Scene (identity transform).
 * Call after actor.animate and root placement.
 * No gameplay clock, damage, random state, media, or event listeners are owned.
 * reset() is safe at pause/title/save-load/teleport boundaries; dt=0 also clears.
 */
export class WeaponTrails {
  constructor(parent){
    this.geometry=new BufferGeometry();
    this.positions=new Float32Array(ROWS*6*3);
    this.colors=new Float32Array(ROWS*6*4);
    this.geometry.setAttribute('position',new BufferAttribute(this.positions,3).setUsage(DynamicDrawUsage));
    // Three's standard material supports vertex alpha with a four-component
    // color attribute. Keep its normal fog, tone mapping, and color-space path.
    this.geometry.setAttribute('color',new BufferAttribute(this.colors,4).setUsage(DynamicDrawUsage));
    const indices=new Uint16Array((ROWS-1)*24);let n=0;
    for(let row=0;row<ROWS-1;row++)for(let strip=0;strip<2;strip++)for(let lane=0;lane<2;lane++){
      const a=row*6+strip*3+lane,b=a+6;
      indices[n++]=a;indices[n++]=b;indices[n++]=a+1;
      indices[n++]=a+1;indices[n++]=b;indices[n++]=b+1;
    }
    this.geometry.setIndex(new BufferAttribute(indices,1));this.geometry.setDrawRange(0,0);
    this.material=new MeshBasicMaterial({color:0xffffff,vertexColors:true,transparent:true,opacity:1,
      side:DoubleSide,depthTest:true,depthWrite:false,forceSinglePass:true});
    this.mesh=new Mesh(this.geometry,this.material);this.mesh.name='weapon-motion-trail';
    // Bounds are a maximum of 24 world-space samples; no world-tree traversal
    // or a stale construction-time sphere may cull the changing strip.
    this.mesh.frustumCulled=false;this.mesh.visible=false;parent?.add(this.mesh);
    this.tint=new Color(0xd1ccbb);
    this.samples=new Float64Array(ROWS*12);this.times=new Float64Array(ROWS);
    this.previous=new Float64Array(12);this.current=new Float64Array(12);this.interpolated=new Float64Array(12);
    this.root=new Vector3();this.previousRoot=new Vector3();this.point=new Vector3();
    this.disposed=false;this.reset('created');
  }

  reset(reason='external'){
    this.head=0;this.count=0;this.rows=0;this.actor=null;this.node=null;this.weapon=null;
    this.previousTime=null;this.nextSample=0;this.lastReset=reason;
    this.mesh.visible=false;this.geometry.setDrawRange(0,0);
  }

  dispose(){
    if(this.disposed)return;
    this.reset('disposed');this.disposed=true;this.mesh.removeFromParent();
    this.geometry.dispose();this.material.dispose();
  }

  _sample(time,points){
    // Reserve one row for the current frame's exact, un-interpolated edge.
    if(this.count>=ROWS-1){this.head=(this.head+1)%ROWS;this.count--;}
    const index=(this.head+this.count)%ROWS;this.times[index]=time;
    this.samples.set(points,index*12);this.count++;
  }

  _between(time,fromTime,toTime){
    const mix=clamp((time-fromTime)/Math.max(EPS,toTime-fromTime));
    for(let i=0;i<12;i++)this.interpolated[i]=this.previous[i]+(this.current[i]-this.previous[i])*mix;
    return this.interpolated;
  }

  _row(row,points,offset,age,life,time){
    // Close the oldest edge to a point, including the first partial swing.
    const fade=row===0?0:clamp(1-age/life),taper=fade*fade*(3-2*fade);
    // A brief luminance crest at the saved hit time helps the strike read;
    // it denotes the swing, not a fabricated hit on an enemy.
    const crest=.72+.28*Math.exp(-Math.pow(time/.052,2));
    for(let strip=0;strip<2;strip++){
      const start=offset+strip*6,end=start+3;
      for(let lane=0;lane<3;lane++){
        const vertex=row*6+strip*3+lane,mix=1-taper+lane*.5*taper;
        for(let axis=0;axis<3;axis++)this.positions[vertex*3+axis]=points[start+axis]+(points[end+axis]-points[start+axis])*mix;
        const color=vertex*4;this.colors[color]=this.tint.r;this.colors[color+1]=this.tint.g;this.colors[color+2]=this.tint.b;
        this.colors[color+3]=lane===1?fade*fade*crest*(strip===0?.23:.48):0;
      }
    }
  }

  _draw(time,shape,emitting){
    while(this.count&&time-this.times[this.head]>=shape.life){this.head=(this.head+1)%ROWS;this.count--;}
    let row=0;
    for(let i=0;i<this.count;i++){
      const index=(this.head+i)%ROWS;
      this._row(row++,this.samples,index*12,time-this.times[index],shape.life,this.times[index]);
    }
    const newest=this.count?this.times[(this.head+this.count-1)%ROWS]:-Infinity;
    if(emitting&&time-newest>EPS&&row<ROWS)this._row(row++,this.current,0,0,shape.life,time);
    this.rows=row;this.mesh.visible=row>1;
    this.geometry.setDrawRange(0,row>1?(row-1)*24:0);
    if(this.mesh.visible){this.geometry.attributes.position.needsUpdate=true;this.geometry.attributes.color.needsUpdate=true;}
  }

  update(actor,state,dt,active=true){
    if(this.disposed)return false;
    const weapon=state?.weaponType||'sword',shape=WEAPON_TRAIL_SHAPES[weapon],node=actor?.[weapon],motion=actor?.motion;
    if(!active||!Number.isFinite(dt)||dt<=0||dt>WEAPON_TRAIL_LIMITS.maxFrameGap||
      !shape||!node||state?.dead||state?.hp<=0||motion?.state!=='attack'||!(state?.attack>0)){
      this.reset(!active||dt===0?'paused':'inactive');return false;
    }
    for(let parent=node;parent;parent=parent.parent)if(!parent.visible){this.reset('hidden');return false;}
    const stats=WEAPONS[weapon],duration=state.attackDuration||stats.duration,hit=Math.min(stats.hitTime,duration*.9);
    const time=duration-state.attack-hit,combat=motion.combat;
    // Older detailed actors use the .38 -> .58 phase interval for release.
    // The revised actor supplies exact release bounds from its combat envelope.
    const start=Number.isFinite(combat?.releaseStart)?combat.releaseStart:-hit*.24;
    const end=Number.isFinite(combat?.releaseEnd)?combat.releaseEnd:(duration-hit)*(.08/.499);
    if(!Number.isFinite(time)||!Number.isFinite(duration)||duration<=0||time< -hit-EPS||time>duration-hit||end<=start){this.reset('invalid-clock');return false;}

    // updateWorldMatrix(true,false) refreshes every parent changed this frame.
    // Renderer traversal has not necessarily happened when this method runs.
    node.updateWorldMatrix(true,false);actor.g.updateWorldMatrix(true,false);
    this.root.setFromMatrixPosition(actor.g.matrixWorld);
    for(let i=0;i<4;i++){
      this.point.fromArray(shape.points,i*3).applyMatrix4(node.matrixWorld);this.point.toArray(this.current,i*3);
    }
    if(!finitePoints(this.current)||!Number.isFinite(this.root.x)||!Number.isFinite(this.root.y)||!Number.isFinite(this.root.z)){this.reset('invalid-transform');return false;}
    const combo=state.combo%3||0,delta=this.previousTime===null?0:time-this.previousTime;
    let broken=this.actor!==actor||this.node!==node||this.weapon!==weapon||this.combo!==combo||this.duration!==duration||this.start!==start||this.end!==end;
    if(!broken){
      // A rewind/new attack, missed update, root teleport, or abrupt attachment
      // change must never draw a bridge across two unrelated poses.
      broken=delta< -EPS||delta>Math.min(.1,dt*2+.035)||this.root.distanceTo(this.previousRoot)>Math.max(1.2,dt*22);
      let edgeMove=0;
      for(let i=0;i<4;i++)edgeMove=Math.max(edgeMove,Math.hypot(this.current[i*3]-this.previous[i*3],this.current[i*3+1]-this.previous[i*3+1],this.current[i*3+2]-this.previous[i*3+2]));
      if(edgeMove>Math.max(.8,delta*70)||delta<=EPS&&edgeMove>.015)broken=true;
    }
    if(broken||this.previousTime===null){
      this.reset('attack-boundary');this.actor=actor;this.node=node;this.weapon=weapon;this.combo=combo;this.duration=duration;this.start=start;this.end=end;
      this.nextSample=start+Math.max(0,Math.floor((time-start)/STEP)+1)*STEP;
      if(time>=start&&time<=end)this._sample(time,this.current);
    }else if(delta>EPS){
      const limit=Math.min(time,end);
      // delta is at most .1 seconds: at most 13 inserts, with no frame-count
      // decay or frame-distance emission that grows at a different refresh rate.
      for(let steps=0;this.nextSample<=limit+EPS&&steps<14;steps++,this.nextSample+=STEP){
        if(this.nextSample>=this.previousTime-EPS&&this.nextSample>=start-EPS)
          this._sample(this.nextSample,this._between(this.nextSample,this.previousTime,time));
      }
      if(this.previousTime<end&&time>end&&this.count){
        const newest=this.times[(this.head+this.count-1)%ROWS];
        if(end-newest>EPS)this._sample(end,this._between(end,this.previousTime,time));
      }
    }
    this.previous.set(this.current);this.previousRoot.copy(this.root);this.previousTime=time;
    this._draw(time,shape,time>=start&&time<=end);return this.mesh.visible;
  }
}
