import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {pathToFileURL} from 'node:url';
const helperUrl=process.env.Q_SAMPLING_REVIEW_MODULE?pathToFileURL(process.env.Q_SAMPLING_REVIEW_MODULE):new URL('../../../../review/assembly-sampling-v65/shared-curve.mjs',import.meta.url);
const {chooseSharedSamples,ownerSelection}=await import(helperUrl);

// An independent sampled-error oracle. Do not import the author's checker.
const begin=performance.now();
const output=new URL(process.env.Q_SAMPLING_REVIEW_OUTPUT??'./REPORT.json',import.meta.url);
const limits={positionToleranceM:.00025,normalToleranceRad:.025,weightTolerance:.015};
const lerp=(a,b,t)=>a.map((v,k)=>(1-t)*v+t*b[k]);
const unit=v=>{const n=Math.hypot(...v);assert.ok(n>0&&Number.isFinite(n));return v.map(x=>x/n);};
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const dot=(a,b)=>a.reduce((s,x,k)=>s+x*b[k],0);
const own=(o,k)=>Object.hasOwn(o,k)?o[k]:0;
const error=(curve,i,j,k)=>{
 const scale=Math.max(1,Math.abs(curve.parameter[i]),Math.abs(curve.parameter[j]));
 const t=(curve.parameter[k]/scale-curve.parameter[i]/scale)/(curve.parameter[j]/scale-curve.parameter[i]/scale);
 const p=lerp(curve.positions[i],curve.positions[j],t);
 const raw=lerp(curve.normals[i],curve.normals[j],t),len=Math.hypot(...raw);
 const n=len>1e-14?raw.map(x=>x/len):null;
 const keys=new Set([...Object.keys(curve.weights[i]),...Object.keys(curve.weights[j]),...Object.keys(curve.weights[k])]);
 return {positionM:Math.hypot(...p.map((x,d)=>x-curve.positions[k][d])),normalRad:n?Math.atan2(Math.hypot(...cross(n,curve.normals[k])),dot(n,curve.normals[k])):Math.PI,weight:Math.max(0,...[...keys].map(key=>Math.abs((1-t)*own(curve.weights[i],key)+t*own(curve.weights[j],key)-own(curve.weights[k],key))))};
};
function inspect(curve,selection){
 const indices=selection.indices;
 assert.equal(indices[0],0);assert.equal(indices.at(-1),curve.parameter.length-1);
 assert.ok(indices.every((x,i)=>Number.isInteger(x)&&(!i||x>indices[i-1])));
 for(const i of curve.features??[])assert.ok(indices.includes(i));
 const maximum={positionM:0,normalRad:0,weight:0};
 for(let j=1;j<indices.length;j++)for(let k=indices[j-1]+1;k<indices[j];k++){
  const e=error(curve,indices[j-1],indices[j],k);
  for(const name of Object.keys(maximum)){assert.ok(Number.isFinite(e[name]));maximum[name]=Math.max(maximum[name],e[name]);}
 }
 return maximum;
}
const parameter=Array.from({length:257},(_,i)=>i/256);
const make=(id,position,normal=t=>[0,0,1],weights=t=>({head:1}),params=parameter,features=[])=>({id,parameter:params,positions:params.map(position),normals:params.map(t=>unit(normal(t))),weights:params.map(weights),features});
const cases=[
 make('line',t=>[t,0,0]),
 make('three-turn-spiral',t=>[.03*Math.cos(6*Math.PI*t),.03*Math.sin(6*Math.PI*t),.1*t]),
 make('figure-eight',t=>[.04*Math.sin(2*Math.PI*t),.02*Math.sin(4*Math.PI*t),0]),
 make('sharp-feature',t=>[t*.1,Math.abs(t-.5)*.08,0],undefined,undefined,parameter,[128,64,128,192]),
 make('closed-loop',t=>[.03*Math.cos(2*Math.PI*t),.03*Math.sin(2*Math.PI*t),0]),
 make('nonuniform-parameter',t=>[.05*t,.015*Math.sin(5*t),0],undefined,undefined,parameter.map(t=>t**4)),
 make('rotating-normal',t=>[.1*t,0,0],t=>[Math.cos(5*Math.PI*t),Math.sin(5*Math.PI*t),.15]),
 make('nonlinear-three-bone-weights',t=>[.1*t,0,0],undefined,t=>({a:t*t,b:2*t*(1-t),c:(1-t)**2})),
 make('normal-jump',t=>[.1*t,0,0],t=>t<.5?[0,0,1]:[0,1,0]),
];
const ordinary=[];
for(const curve of cases){
 const before=JSON.stringify(curve),selection=chooseSharedSamples(curve,limits),actual=inspect(curve,selection);
 assert.equal(JSON.stringify(curve),before,'source samples mutated');
 for(const [key,bound] of [['positionM',limits.positionToleranceM],['normalRad',limits.normalToleranceRad],['weight',limits.weightTolerance]]){
  assert.ok(Number.isFinite(selection.maximum[key]),'nonfinite reported error');
  assert.ok(actual[key]<=bound+1e-12,`${curve.id}: ${key} exceeds bound`);
  assert.ok(Math.abs(actual[key]-selection.maximum[key])<1e-7,'reported maximum disagrees');
 }
 const original=selection.indices.slice(),forward=ownerSelection(selection),reverse=ownerSelection(selection,{direction:-1});
 assert.deepEqual(reverse,original.slice().reverse());forward[0]=-1;reverse[0]=-1;assert.deepEqual(selection.indices,original);
 ordinary.push({id:curve.id,masterCount:curve.parameter.length,selectedCount:selection.indices.length,independentMaximum:actual});
}
const invalid=[
 ['nonfinite-position',c=>c.positions[1][0]=NaN],['nonfinite-normal',c=>c.normals[1][0]=Infinity],
 ['nonunit-normal',c=>c.normals[1]=[0,0,2]],['empty-weights',c=>c.weights[1]={}],
 ['negative-weight',c=>c.weights[1]={a:2,b:-1}],['nonfinite-weight',c=>c.weights[1]={a:NaN}],
 ['repeated-parameter',c=>c.parameter[1]=c.parameter[0]],['descending-parameter',c=>c.parameter[1]=-1],
 ['fractional-feature',c=>c.features=[.5]],['outside-feature',c=>c.features=[999]],
];
for(const [id,mutate] of invalid){const c=structuredClone(cases[0]);mutate(c);assert.throws(()=>chooseSharedSamples(c,limits),id);}
for(const key of Object.keys(limits))for(const value of [0,-1,NaN,Infinity])assert.throws(()=>chooseSharedSamples(cases[0],{...limits,[key]:value}));
for(const direction of [0,2,null,NaN])assert.throws(()=>ownerSelection({indices:[0,1]},{direction}));

// These are contract probes, not assertions that the production registry uses
// these bone names or extreme parameter domains. Rejection is an acceptable fix.
const probes=[
 {id:'inherited-bone-key',parameter:[0,.5,1],positions:[[0,0,0],[.5,0,0],[1,0,0]],normals:[[0,0,1],[0,0,1],[0,0,1]],weights:[{head:1},{constructor:1},{head:1}]},
 {id:'finite-parameter-overflow',parameter:[-1e308,9e307,1e308],positions:[[0,0,0],[0,1,0],[1,0,0]],normals:[[0,0,1],[0,0,1],[0,0,1]],weights:[{head:1},{head:1},{head:1}]},
];
const contractProbes=probes.map(curve=>{
 let result;
 try{result=chooseSharedSamples(curve,limits);}
 catch(e){return {id:curve.id,status:'rejected',reason:e.message,input:curve};}
 {
  const actual=inspect(curve,result);
  const passed=Object.values(result.maximum).every(Number.isFinite)&&actual.positionM<=limits.positionToleranceM+1e-12&&actual.normalRad<=limits.normalToleranceRad+1e-12&&actual.weight<=limits.weightTolerance+1e-12;
  return {id:curve.id,status:passed?'handled':'FAIL-open',indices:result.indices,reportedMaximum:result.maximum,independentMaximum:actual,input:curve};
 }
});

// Independently evaluate cubic position with de Casteljau, and its quadratic
// derivative likewise. The author uses the expanded Bernstein polynomial.
const bezier=(controls,t)=>{let p=controls.map(v=>v.slice());while(p.length>1)p=p.slice(0,-1).map((a,i)=>lerp(a,p[i+1],t));return p[0];};
const frame=(seam,t)=>({position:bezier(seam.curveM,t),normal:unit(cross(bezier(seam.curveM.slice(0,-1).map((p,i)=>p.map((v,k)=>3*(seam.curveM[i+1][k]-v))),t),bezier(seam.tangentM,t)))});
const sourcePath='docs/evidence/mira-reference-set-v64/head-assembly-registration/interfaces.json';
const seams=JSON.parse(fs.readFileSync(sourcePath)).interfaces.filter(x=>x.kind==='existing-skin-C1');
const dense=[];
for(const seam of seams){
 const params=Array.from({length:129},(_,i)=>i/128),frames=params.map(t=>frame(seam,t));
 const c={id:seam.id,parameter:params,positions:frames.map(f=>f.position),normals:frames.map(f=>f.normal),weights:params.map(()=>({head:1}))};
 const chosen=chooseSharedSamples(c,limits),selectedFrames=chosen.parameter.map(t=>frame(seam,t));
 let edge=0,maxPositionM=0,maxNormalRad=0;
 for(let i=0;i<=32768;i++){
  const t=i/32768;while(edge<chosen.parameter.length-2&&t>chosen.parameter[edge+1])edge++;
  const blend=(t-chosen.parameter[edge])/(chosen.parameter[edge+1]-chosen.parameter[edge]);
  const p=lerp(selectedFrames[edge].position,selectedFrames[edge+1].position,blend),n=unit(lerp(selectedFrames[edge].normal,selectedFrames[edge+1].normal,blend)),f=frame(seam,t);
  maxPositionM=Math.max(maxPositionM,Math.hypot(...p.map((v,k)=>v-f.position[k])));
  maxNormalRad=Math.max(maxNormalRad,Math.atan2(Math.hypot(...cross(n,f.normal)),dot(n,f.normal)));
 }
 assert.ok(maxPositionM<=limits.positionToleranceM+1e-12);assert.ok(maxNormalRad<=limits.normalToleranceRad+1e-12);
 dense.push({id:seam.id,selectedCount:chosen.indices.length,sampleCount:32769,maxPositionM,maxNormalRad,continuousProof:false});
}
const helper=fs.readFileSync(helperUrl);
const report={at:new Date().toISOString(),reviewer:'/root',base:process.env.Q_SAMPLING_REVIEW_SHA??'26e03460e78f44660e0e6adb54040e909598bc7f',helperSha256:createHash('sha256').update(helper).digest('hex'),limits,ordinary,invalidInputRejections:invalid.length+12+4,contractProbes,dense,wallMs:performance.now()-begin,scope:'CPU numerical review only. No mesh, no rendering, no surface interior or visual quality acceptance. Dense grid is not an interval proof.',decision:contractProbes.some(p=>p.status==='FAIL-open')?'changes required before helper acceptance':'reviewed sampled contract probes pass'};
const json=JSON.stringify(report,(k,v)=>typeof v==='number'&&!Number.isFinite(v)?String(v):v,2)+'\n';
fs.writeFileSync(output,json);
console.log(JSON.stringify({decision:report.decision,ordinary:ordinary.length,invalidInputRejections:report.invalidInputRejections,contractProbes:contractProbes.map(({id,status,indices,independentMaximum})=>({id,status,indices,independentMaximum})),denseCurves:dense.length,wallMs:report.wallMs}));
