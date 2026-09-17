import assert from 'node:assert/strict';
import fs from 'node:fs';
import {performance} from 'node:perf_hooks';
import {chooseSharedSamples,ownerSelection} from './shared-curve.mjs';
const start=performance.now();
const limits={positionToleranceM:.00025,normalToleranceRad:.025,weightTolerance:.015};
const master=(name,n,position,normal,weight)=>({id:name,parameter:Array.from({length:n},(_,i)=>i/(n-1)),positions:Array.from({length:n},(_,i)=>position(i/(n-1))),normals:Array.from({length:n},(_,i)=>normal(i/(n-1))),weights:Array.from({length:n},(_,i)=>weight(i/(n-1)))});
const line=master('line',65,t=>[t*.1,0,0],()=>[0,0,1],()=>({hand:1}));assert.deepEqual(chooseSharedSamples(line,limits).indices,[0,64]);
const circle=master('half-circle',129,t=>[.052*Math.cos(Math.PI*t),.052*Math.sin(Math.PI*t),0],t=>[Math.cos(Math.PI*t),Math.sin(Math.PI*t),0],()=>({head:1}));const arc=chooseSharedSamples(circle,limits);assert(arc.selectedCount>2&&arc.selectedCount<129);assert(arc.maximum.positionM<=limits.positionToleranceM);assert(arc.maximum.normalRad<=limits.normalToleranceRad);
// Independent continuous circular sagitta bound: unlike the generic sampler,
// this analytic oracle covers BETWEEN all master samples for this one fixture.
const arcSagitta=Math.max(...arc.parameter.slice(1).map((t,i)=>.052*(1-Math.cos(Math.PI*(t-arc.parameter[i])/2))));assert(arcSagitta<=limits.positionToleranceM);
const weights=master('weight-transition',65,t=>[t*.1,0,0],()=>[0,0,1],t=>({a:1-t*t,b:t*t}));const weighted=chooseSharedSamples(weights,limits);assert(weighted.selectedCount>2);assert(weighted.maximum.weight<=limits.weightTolerance);
const normals=master('normal-fold',65,t=>[t*.1,0,0],t=>[Math.sin(t*t),0,Math.cos(t*t)],()=>({chest:1}));const normal=chooseSharedSamples(normals,limits);assert(normal.selectedCount>2);assert(normal.maximum.normalRad<=limits.normalToleranceRad);
const features={...line,features:[11,23,47]};assert.deepEqual(chooseSharedSamples(features,limits).indices,[0,11,23,47,64]);
const snapshot=JSON.stringify(circle),left=ownerSelection(arc),right=ownerSelection(arc,{direction:-1});assert.deepEqual(left,right.slice().reverse());left[0]=-99;assert.equal(arc.indices[0],0);assert.equal(JSON.stringify(circle),snapshot);
const badParameter=structuredClone(line);badParameter.parameter[8]=badParameter.parameter[7];assert.throws(()=>chooseSharedSamples(badParameter,limits),/Strictly increasing/);
const badNormal=structuredClone(line);badNormal.normals[2]=[0,0,0];assert.throws(()=>chooseSharedSamples(badNormal,limits),/unit normals/);
const badWeight=structuredClone(line);badWeight.weights[2]={hand:.9};assert.throws(()=>chooseSharedSamples(badWeight,limits),/sum to one/);
assert.throws(()=>ownerSelection(arc,{direction:0}),/Direction/);
const prototypeBone=master('own-weight-names',3,t=>[t,0,0],()=>[0,0,1],t=>t===.5?{constructor:1}:{head:1});assert.deepEqual(chooseSharedSamples(prototypeBone,limits).indices,[0,1,2]);
const overflow=master('span-overflow',3,t=>[t,0,0],()=>[0,0,1],()=>({head:1}));overflow.parameter=[-1e308,9e307,1e308];assert.throws(()=>chooseSharedSamples(overflow,limits),/Finite parameter span/);
const coordinateOverflow=structuredClone(line);coordinateOverflow.positions[0]=[-1e308,0,0];coordinateOverflow.positions[64]=[1e308,0,0];assert.throws(()=>chooseSharedSamples(coordinateOverflow,limits),/Finite coordinate span/);
const result={at:new Date().toISOString(),scope:'numeric shared-index selection; no geometry created',cases:['straight reduction','curvature','continuous circle oracle','weight transition','normal bend','feature retention','reversed-owner identity and immutable inputs','bad parameter/normal/weight/direction rejection','own-key weight names and parameter/coordinate overflow rejection'],line:chooseSharedSamples(line,limits),arc,independentContinuousCircleSagittaM:arcSagitta,weighted,normal,wallMs:performance.now()-start,newGeometry:0,wholeCharacterAcceptance:false};
fs.writeFileSync('docs/evidence/mira-assembly-v65/shared-sampling/CHECK.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({cases:result.cases.length,arcSamples:arc.selectedCount,weightSamples:weighted.selectedCount,normalSamples:normal.selectedCount,continuousArcErrorMm:arcSagitta*1000,wallMs:result.wallMs}));
