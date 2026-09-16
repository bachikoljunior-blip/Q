import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {getHeapStatistics} from 'node:v8';
import {createMainRuntime} from './main-runtime-fixture.mjs';

// Actual emitted IIFE, explicit unsupported image/audio/GL boundaries. The
// Uint8Array proxy observes real decoder allocations without rewriting code.
export async function runStandalone(html,markup,media){
  const match=/<script>([\s\S]*?)<\/script>/i.exec(html);
  if(!match)throw Error('Missing standalone script');
  const lengths=new Map();for(const asset of media)lengths.set(asset.bytes,[...(lengths.get(asset.bytes)||[]),asset.source]);
  const allocations=[],requests=[];
  let phase='title',runtime;const started=performance.now(),memoryStart=getHeapStatistics();
  runtime=createMainRuntime({code:match[1],html:markup},{allowTimers:true,setupContext({context,document,window}){
    const navigator={...context.navigator};window.navigator=navigator;document.defaultView=window;document.readyState='complete';
    window.devicePixelRatio=1;window.setTimeout=()=>0;window.clearTimeout=()=>{};window.cancelAnimationFrame=()=>{};
    window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
    const video=document.getElementById('title-video');video.paused=true;video.play=()=>{video.paused=false;return Promise.resolve();};video.pause=()=>{video.paused=true;};video.load=()=>{};
    const elementPrototype=Object.getPrototypeOf(video);elementPrototype.getContext=()=>null;
    document.createElementNS=(_namespace,tag)=>{
      if(tag!=='img')throw Error('Unexpected device boundary '+tag);
      const element=document.createElement(tag);
      Object.defineProperty(element,'src',{set(url){requests.push({phase,kind:'image',dataURL:url.startsWith('data:'),sha256:createHash('sha256').update(Buffer.from(url.split(',')[1],'base64')).digest('hex')});queueMicrotask(()=>element.emit('error',{message:'Explicit unavailable image decoder boundary'}));}});
      return element;
    };
    context.Uint8Array=new Proxy(Uint8Array,{construct(target,args){const bytes=Reflect.construct(target,args);if(args.length===1&&typeof args[0]==='number'&&lengths.has(args[0]))allocations.push({phase,bytes:args[0],candidateSources:lengths.get(args[0]),timeMs:performance.now()-started,heapUsed:getHeapStatistics().used_heap_size});return bytes;}});
    context.Request=Request;context.fetch=async request=>{const url=typeof request==='string'?request:request.url;requests.push({phase,kind:'fetch',dataURL:url.startsWith('data:')});throw Error('Explicit unavailable asset decoder boundary');};
    context.console={error(){},warn(){},log(){}};
  }});
  await runtime.flush();const titleEnd=performance.now(),titleAllocations=allocations.length,memoryAfterTitle=getHeapStatistics();
  const titleState=runtime.state;phase='launch';await runtime.click('start');
  for(let i=0;i<8;i++)await runtime.flush();const launchEnd=performance.now();
  return {titleAllocations,allocations,requests,titleState,finalState:runtime.state,titleHostMs:titleEnd-started,launchHostMs:launchEnd-titleEnd,memoryStart,memoryAfterTitle,memoryEnd:getHeapStatistics(),scriptSHA256:createHash('sha256').update(match[1]).digest('hex'),boundary:'Actual packaged script in Node DOM fixture; title decoration context null, image/HDR decoding rejects explicitly, no AudioContext/WebGL. Boot failure returns to title. No actual browser, render, codec, device or peak-heap measurement. Allocation source names are candidates by byte length; equal-length audio assets are not falsely identified by length alone.'};
}
