"""Independent fixed-source boundary and constrained-surface audit. Emits no mesh."""
import json, subprocess, hashlib, time, math
from pathlib import Path
from collections import defaultdict, deque
import numpy as np

START=time.perf_counter()
ROOT=Path(__file__).resolve().parents[4]
SOURCE='ced283cecaa9fbabee52eec7ab940d6d2a2271d5'
PATH='docs/evidence/mira-assembly-v65/cloth-registration/CLOTH_AUTHOR_SOURCE.json'
raw=subprocess.check_output(['git','show',SOURCE+':'+PATH],cwd=ROOT)
D=json.loads(raw); C={c['id']:c for c in D['canonicalCurves']}; P={p['id']:p for p in D['parts']}
fail=[]; coverage=[]; uses=defaultdict(list); vectors=defaultdict(list)
def record(kind,detail): fail.append({'kind':kind,**detail})
for p in P.values():
    es=p['boundary']; ends=[]
    for e in es:
        c=C[e['curve']]; a=np.array(c['samples'][0]['positionM']);b=np.array(c['samples'][-1]['positionM'])
        if e['direction']==-1:a,b=b,a
        elif e['direction']!=1:record('boundary-direction',{'part':p['id'],'edge':e})
        ends.append((a,b)); uses[c['id']].append((p['id'],e['direction']))
    if p.get('multipleBoundaryLoops'):
        for j,(a,b) in enumerate(ends):
            if np.linalg.norm(a-b)>1e-7:record('annulus-open-loop',{'part':p['id'],'edge':j,'gapM':float(np.linalg.norm(a-b))})
        kind='two independent loops'
    elif p['operation'].startswith('41mm'):
        kind='open extrusion axis, not a perimeter'
    else:
        kind='closed centreline' if p['operation'].startswith('closed metal') else 'one oriented perimeter'
        for j,(a,b) in enumerate(ends):
            gap=float(np.linalg.norm(b-ends[(j+1)%len(ends)][0]))
            if gap>1e-7:record('directed-perimeter-gap',{'part':p['id'],'edge':j,'gapM':gap})
    coverage.append({'part':p['id'],'kind':kind,'boundaryEdges':len(es)})
graph=defaultdict(list)
for cid,owners in uses.items():
    if len(owners)>2:record('more-than-two-boundary-owners',{'curve':cid,'owners':owners})
    if len(owners)==2:
        (a,da),(b,db)=owners; relation=-da*db
        graph[a].append((b,relation,cid));graph[b].append((a,relation,cid))
orient={};components=[]
for pid in P:
    if pid in orient:continue
    orient[pid]=1;q=deque([pid]);component=[]
    while q:
        a=q.popleft();component.append(a)
        for b,rel,cid in graph[a]:
            wanted=orient[a]*rel
            if b in orient and orient[b]!=wanted:record('nonorientable-cycle',{'curve':cid,'a':a,'b':b})
            if b not in orient:orient[b]=wanted;q.append(b)
    components.append(component)
weight_errors=[]; plane_errors=[]; max_node_angle=0.; max_node_dot=0.;max_node_rank=0
for c in C.values():
    for i in (0,len(c['samples'])-1):
        a=c['samples'][i];pos=tuple(round(v,7) for v in a['positionM'])
        vectors[(c['frame'],c['normalDomain'],pos)].append((c['id'],i,a))
for key,items in vectors.items():
    base=items[0][2];tn=[]
    for cid,i,a in items:
        w={k:v for k,v in a['weights'].items() if v!=0}; bw={k:v for k,v in base['weights'].items() if v!=0}
        if w!=bw:weight_errors.append({'curve':cid,'sample':i,'weights':w,'other':bw})
        n=np.array(a['normal']);t=np.array(a['derivativeMPerT']);t=t/np.linalg.norm(t);tn.append(t)
        dot=abs(float(n@t)); max_node_dot=max(max_node_dot,dot)
        angle=math.degrees(math.acos(float(np.clip(n@np.array(base['normal']),-1,1))));max_node_angle=max(max_node_angle,angle)
        if dot>1e-8 or angle>1e-4:plane_errors.append({'curve':cid,'sample':i,'dot':dot,'angleDegrees':angle})
    rank=int(np.linalg.matrix_rank(tn,tol=1e-8));max_node_rank=max(max_node_rank,rank)
    if rank>2:plane_errors.append({'node':str(key),'rank':rank})
if weight_errors:record('node-weight-conflict',{'count':len(weight_errors),'examples':weight_errors[:5]})
if plane_errors:record('node-plane-conflict',{'count':len(plane_errors),'examples':plane_errors[:5]})

def rbf(sf,yz):
    u=(np.array(yz)-sf['normalizationOriginM'])/sf['normalizationScaleM'];delta=u-np.array(sf['centresNormalized']);r=np.linalg.norm(delta,axis=1);w=np.array(sf['radialWeights']);a=np.array(sf['affineCoefficients'])
    value=float((r**3)@w+a[0]+u@a[1:]);grad=((3*r[:,None]*delta).T@w+a[1:])/sf['normalizationScaleM'];return value,grad
def curve(c,t):
    x=min(31,int(t*32));s=t*32-x;s=max(0,min(1,s)); a=c['samples'][x];b=c['samples'][x+1]
    p=np.array(a['positionM']);q=np.array(b['positionM']);d=np.array(a['derivativeMPerT'])/32;e=np.array(b['derivativeMPerT'])/32
    pos=(2*s**3-3*s*s+1)*p+(s**3-2*s*s+s)*d+(-2*s**3+3*s*s)*q+(s**3-s*s)*e
    der=((6*s*s-6*s)*p+(3*s*s-4*s+1)*d+(-6*s*s+6*s)*q+(3*s*s-2*s)*e)*32
    if c.get('surfaceProjection'):
        sf=P[c['surfaceProjection']['part']]['interiorSupport']; pos[0],gradient=rbf(sf,pos[1:]);der[0]=gradient@der[1:]
    return pos,der
shoulder=[]; minimum_curve_speed=math.inf;minimum_normal_projection=math.inf
for cid,c in C.items():
    for t in np.linspace(0,1,129):
        pos,der=curve(c,float(t));speed=float(np.linalg.norm(der));minimum_curve_speed=min(minimum_curve_speed,speed)
        if not np.isfinite(pos).all() or not np.isfinite(der).all() or speed<1e-10:record('invalid-curve',{'curve':cid,'t':float(t),'speed':speed});continue
        i=min(31,int(t*32));s=t*32-i;n=(1-s)*np.array(c['samples'][i]['normal'])+s*np.array(c['samples'][i+1]['normal']);tangent=der/speed;projection=n-tangent*(n@tangent);plen=float(np.linalg.norm(projection));minimum_normal_projection=min(minimum_normal_projection,plen)
        if plen<1e-8:record('zero-guide-normal-projection',{'curve':cid,'t':float(t),'length':plen})
for pid in ['W02-R','W02-L']:
    p=P[pid];sf=p['interiorSupport'];max_constraint=0.;max_derivative=0.;max_chain=0.;count=0
    ids={e['curve'] for e in p['boundary']}|set(p['attachmentCurves'])
    for cid in sorted(ids):
        c=C[cid]
        for a in c['samples']:
            value,_=rbf(sf,a['positionM'][1:]);max_constraint=max(max_constraint,abs(value-a['positionM'][0]))
        for t in np.linspace(.001,.999,31):
            pos,der=curve(c,float(t));value,g=rbf(sf,pos[1:]);h=1e-6
            numerical=np.array([(rbf(sf,pos[1:]+np.eye(2)[j]*h)[0]-rbf(sf,pos[1:]-np.eye(2)[j]*h)[0])/(2*h) for j in range(2)])
            max_derivative=max(max_derivative,float(np.max(np.abs(g-numerical))));max_chain=max(max_chain,abs(float(np.array([1,-g[0],-g[1]])@der)));count+=1
    shoulder.append({'part':pid,'constraintResidualM':max_constraint,'gradientFiniteDifferenceError':max_derivative,'chainRuleNormalDotDerivative':max_chain,'interiorCurveSamples':count})
    if max_constraint>1e-8 or max_derivative>1e-4 or max_chain>1e-8:record('rbf-contract',shoulder[-1])
result={'sourceCommit':SOURCE,'sourcePath':PATH,'sourceSHA256':hashlib.sha256(raw).hexdigest(),'scope':'directed numerical boundary/ownership, orientability, endpoint plane+weights, exact registered Hermite evaluation and RBF derivative contract; no mesh/surface interiors/posed contacts or screen acceptance','counts':{'types':len(D['types']),'parts':len(P),'curves':len(C),'components':len(components)},'passed':not fail,'failures':fail,'perimeterCoverage':coverage,'partOrientationAssignments':orient,'nodePlane':{'groups':len(vectors),'maxAngleDegrees':max_node_angle,'maxDot':max_node_dot,'maxRank':max_node_rank},'curveProbe':{'samplesPerCurve':129,'minimumSpeedMPerT':minimum_curve_speed,'minimumGuideNormalProjectionLength':minimum_normal_projection},'shoulderConstraints':shoulder,'wallSeconds':time.perf_counter()-START,'limits':['A compatible node normal does not prove a globally regular surface.','The projected RBF curves lie on their registered parent by definition; no tessellation/contact acceptance inferred.','General radial/loft/Coons interior recipes require actual surface-evaluator validation next.']}
(Path(__file__).parent/'RESULT.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({k:v for k,v in result.items() if k not in ['perimeterCoverage','partOrientationAssignments']},indent=2))
