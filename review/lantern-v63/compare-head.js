import {Vector3} from 'three';
import {makeLanternHead} from './lantern-head.js';
import {inspectHead,horizontalContact} from './inspect-head.js';
import {nativeTriangles,properCrossings} from '../lantern-micro-v62/inspect-ribs.js';
import {disposeMiraLanternPartial} from '../lantern-micro-v62/mira-lantern-ribs.js';

export function sampledDistance(source,target){
  const aa=nativeTriangles(source),bb=nativeTriangles(target),p=new Vector3(),q=new Vector3();let max=0,sum=0,count=0;
  for(const t of aa){
    const points=[...t.v,t.tri.getMidpoint(p).clone()];
    for(const v of points){let min=Infinity;for(const other of bb)min=Math.min(min,other.tri.closestPointToPoint(v,q).distanceTo(v));max=Math.max(max,min);sum+=min;count++;}
  }
  return {samples:count,maxMm:max,meanMm:sum/count,method:'all native triangle vertices and centroids to nearest target triangle; sampled directed distance, not Hausdorff proof'};
}
export function externalJoins(head,staff){
  head.updateMatrixWorld(true);staff.updateMatrixWorld(true);const h=id=>head.getObjectByName(id),s=id=>staff.getObjectByName(id);
  return {sourceTolerance:'Parent stores staff-global Y in Float32; 0.0001 mm plane selection covers its actual quantization. Raw plane levels remain reported; own internal joints retain 0.00001 mm.',
    contacts:[horizontalContact(s('S06'),h('S07'),1423,{planeToleranceMm:1e-4}),horizontalContact(h('S14'),s('S15'),1674,{planeToleranceMm:1e-4})],
    crossings:[['S06','S07'],['S06','S08'],['S06','S16'],['S15','S13'],['S15','S14'],['S15','S16']].map(([a,b])=>properCrossings(s(a),h(b)))};
}
export function compareHead(staff){
  const a=makeLanternHead({glassSegments:32}),b=makeLanternHead({glassSegments:16}),r32=inspectHead(a),r16=inspectHead(b);
  const deviation=['S07','S16'].map(id=>({id,from32to16:sampledDistance(a.getObjectByName(id),b.getObjectByName(id)),from16to32:sampledDistance(b.getObjectByName(id),a.getObjectByName(id))}));
  const external=externalJoins(b,staff),report={segments32:r32,segments16:r16,deviation,external,decision:'16-angle glass and shared cradle are the finite assembly candidate; 32 remains reproducible as comparison. Curve change measured, appearance not verified.',savedTriangles:r32.counts.triangles-r16.counts.triangles,savedUniqueBufferBytes:r32.counts.uniqueBufferBytes-r16.counts.uniqueBufferBytes};
  disposeMiraLanternPartial(a);disposeMiraLanternPartial(b);return report;
}
