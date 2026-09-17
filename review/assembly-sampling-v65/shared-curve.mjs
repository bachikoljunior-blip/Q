/** Select one canonical curve's samples for ALL incident parts.
 * This returns indices only. It never creates a surface or duplicates an edge.
 * Bounds apply to the supplied master samples; continuous analytic curves need
 * their own interval bound or denser independently checked samples. */
const mix=(a,b,s)=>a.map((v,k)=>v+(b[k]-v)*s);
const length=a=>Math.hypot(...a);
const unit=a=>{const n=length(a);return n>1e-14?a.map(v=>v/n):null;};
const distance=(a,b)=>Math.hypot(...a.map((v,k)=>v-b[k]));
const clamp=v=>Math.max(-1,Math.min(1,v));
function normalError(a,b,s,actual){const n=unit(mix(a,b,s));return n?Math.acos(clamp(n.reduce((r,v,k)=>r+v*actual[k],0))):Math.PI;}
const ownWeight=(w,k)=>Object.hasOwn(w,k)?w[k]:0;
function weightError(a,b,s,w){return Math.max(0,...Array.from(new Set([...Object.keys(a),...Object.keys(b),...Object.keys(w)]),k=>Math.abs(ownWeight(a,k)*(1-s)+ownWeight(b,k)*s-ownWeight(w,k))));}
function validate(curve,limits){
 const {id,parameter,positions,normals,weights,features=[]}=curve,n=positions?.length;
 if(!id||!Number.isInteger(n)||n<2||parameter?.length!==n||normals?.length!==n||weights?.length!==n)throw Error('A named canonical curve with aligned samples is required');
 for(const k of ['positionToleranceM','normalToleranceRad','weightTolerance'])if(!(limits[k]>0&&Number.isFinite(limits[k])))throw Error('Finite positive '+k+' required');
 for(let i=0;i<n;i++){
  if(!Number.isFinite(parameter[i])||(i&&parameter[i]<=parameter[i-1]))throw Error('Strictly increasing finite parameter required');
  if(positions[i]?.length!==3||!positions[i].every(Number.isFinite)||normals[i]?.length!==3||!normals[i].every(Number.isFinite)||Math.abs(length(normals[i])-1)>1e-7)throw Error('Finite positions and unit normals required');
  if(!weights[i]||typeof weights[i]!=='object'||Array.isArray(weights[i])||Object.values(weights[i]).some(w=>!Number.isFinite(w)||w<0)||Math.abs(Object.values(weights[i]).reduce((s,w)=>s+w,0)-1)>1e-7)throw Error('Finite nonnegative weights must sum to one');
 }
 if(!Number.isFinite(parameter[n-1]-parameter[0]))throw Error('Finite parameter span required');
 for(let axis=0;axis<3;axis++){let lo=Infinity,hi=-Infinity;for(const p of positions){lo=Math.min(lo,p[axis]);hi=Math.max(hi,p[axis]);}if(!Number.isFinite(hi-lo))throw Error('Finite coordinate span required');}
 if(features.some(i=>!Number.isInteger(i)||i<0||i>=n))throw Error('Feature indices must refer to master samples');
}
function errors(curve,i,j,k){const s=(curve.parameter[k]-curve.parameter[i])/(curve.parameter[j]-curve.parameter[i]);const result={positionM:distance(mix(curve.positions[i],curve.positions[j],s),curve.positions[k]),normalRad:normalError(curve.normals[i],curve.normals[j],s,curve.normals[k]),weight:weightError(curve.weights[i],curve.weights[j],s,curve.weights[k])};if(!Number.isFinite(s)||!Object.values(result).every(Number.isFinite))throw Error('Nonfinite derived interpolation rejected');return result;}
export function chooseSharedSamples(curve,limits){
 validate(curve,limits);const n=curve.positions.length,selected=new Set([0,n-1,...(curve.features??[])]),stack=[];
 const fixed=[...selected].sort((a,b)=>a-b);for(let i=1;i<fixed.length;i++)stack.push([fixed[i-1],fixed[i]]);
 while(stack.length){const [i,j]=stack.pop();let largest=1,worst=-1;
  for(let k=i+1;k<j;k++){const e=errors(curve,i,j,k),score=Math.max(e.positionM/limits.positionToleranceM,e.normalRad/limits.normalToleranceRad,e.weight/limits.weightTolerance);if(score>largest){largest=score;worst=k;}}
  if(worst>=0){selected.add(worst);stack.push([i,worst],[worst,j]);}
 }
 const indices=[...selected].sort((a,b)=>a-b);const maximum={positionM:0,normalRad:0,weight:0};
 for(let s=1;s<indices.length;s++)for(let k=indices[s-1]+1;k<indices[s];k++){const e=errors(curve,indices[s-1],indices[s],k);for(const key of Object.keys(maximum))maximum[key]=Math.max(maximum[key],e[key]);}
 return {curveId:curve.id,indices,parameter:indices.map(i=>curve.parameter[i]),maximum,limits:{...limits},sampleCount:n,selectedCount:indices.length,scope:'supplied master samples only',binding:'All incident owners must use this same canonical selection, with declared traversal reversal only'};
}
export function ownerSelection(selection,{direction=1}={}){if(direction!==1&&direction!==-1)throw Error('Direction must be +1 or -1');return direction===1?selection.indices.slice():selection.indices.slice().reverse();}
