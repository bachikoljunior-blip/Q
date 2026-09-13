// Measures displayed frame intervals only while the game is actively played.
// This is a browser observation, not a GPU timer or a synthetic device score.
export class FrameMetrics {
  constructor(limit=900){this.limit=limit;this.frames=[];this.totalFrames=0;this.totalMs=0;}
  record(ms){if(!Number.isFinite(ms)||ms<=0)return;this.frames.push(ms);if(this.frames.length>this.limit)this.frames.shift();this.totalFrames++;this.totalMs+=ms;}
  snapshot(){
    if(!this.frames.length)return null;
    const sorted=[...this.frames].sort((a,b)=>a-b),sum=this.frames.reduce((a,b)=>a+b,0);
    return {samples:this.frames.length,windowSeconds:sum/1000,averageFps:this.frames.length*1000/sum,p95FrameMs:sorted[Math.min(sorted.length-1,Math.ceil(sorted.length*.95)-1)],worstFrameMs:sorted.at(-1),framesOver50Ms:this.frames.filter(ms=>ms>50).length,totalPlaySeconds:this.totalMs/1000,totalFrames:this.totalFrames};
  }
}
