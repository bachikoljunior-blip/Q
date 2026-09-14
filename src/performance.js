// Browser animation-frame intervals, not presentation timestamps or GPU timings.
// Keep an exact rolling window and a bounded, 1 ms histogram for the whole run.
export class FrameMetrics {
  constructor(limit=900){if(!Number.isInteger(limit)||limit<1)throw Error('Invalid frame window');this.limit=limit;this.reset();}
  reset(){this.frames=[];this.cursor=0;this.totalFrames=0;this.totalMs=0;this.worstMs=0;this.slowFrames=0;this.histogram=new Uint32Array(1001);this.lastNow=null;}
  sample(now,active){
    if(!active||!Number.isFinite(now)){this.lastNow=null;return;}
    if(this.lastNow!==null)this.record(now-this.lastNow);
    this.lastNow=now;
  }
  record(ms){
    if(!Number.isFinite(ms)||ms<=0)return;
    if(this.frames.length<this.limit)this.frames.push(ms);else{this.frames[this.cursor]=ms;this.cursor=(this.cursor+1)%this.limit;}
    this.totalFrames++;this.totalMs+=ms;this.worstMs=Math.max(this.worstMs,ms);if(ms>50)this.slowFrames++;
    this.histogram[Math.min(1000,Math.ceil(ms)-1)]++;
  }
  snapshot(){
    if(!this.frames.length)return null;
    const sorted=[...this.frames].sort((a,b)=>a-b),sum=this.frames.reduce((a,b)=>a+b,0);
    let count=0,p95UpperMs=0;const rank=Math.ceil(this.totalFrames*.95);
    for(let i=0;i<this.histogram.length;i++){count+=this.histogram[i];if(count>=rank){p95UpperMs=i===1000?this.worstMs:i+1;break;}}
    return {samples:this.frames.length,windowSeconds:sum/1000,averageFps:this.frames.length*1000/sum,p95FrameMs:sorted[Math.ceil(sorted.length*.95)-1],worstFrameMs:sorted.at(-1),framesOver50Ms:this.frames.filter(ms=>ms>50).length,totalPlaySeconds:this.totalMs/1000,totalFrames:this.totalFrames,
      session:{samples:this.totalFrames,seconds:this.totalMs/1000,averageFps:this.totalFrames*1000/this.totalMs,p95FrameMsUpperBound:p95UpperMs,quantileResolutionMs:1,worstFrameMs:this.worstMs,framesOver50Ms:this.slowFrames,overflowFrames:this.histogram[1000]}};
  }
}
