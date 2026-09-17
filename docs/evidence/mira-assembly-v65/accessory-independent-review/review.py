#!/usr/bin/env python3
"""Independent finite calculations over fixed serialized contracts; no author imports."""
import collections
import hashlib
import itertools
import json
import math
import subprocess
import time
from datetime import datetime, timezone
from pathlib import Path

START = time.perf_counter()
OUT = Path(__file__).resolve().parent
ROOT = OUT.parents[3]
FIXED = "ab94ce91bbb6be7a727fa910618d68c18984b239"
SRC = "docs/evidence/mira-assembly-v65/accessory-registration/"
def read(p): return json.loads((ROOT / p).read_text())
def sha(p): return hashlib.sha256((ROOT / p).read_bytes()).hexdigest()
def add(a,b): return [a[i]+b[i] for i in range(3)]
def sub(a,b): return [a[i]-b[i] for i in range(3)]
def mul(a,s): return [v*s for v in a]
def dot(a,b): return sum(u*v for u,v in zip(a,b))
def norm(a): return math.sqrt(dot(a,a))
def unit(a): return mul(a,1/norm(a))
def cross(a,b): return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]
def smooth(t): t=max(0,min(1,t)); return t*t*(3-2*t)
def key(p): return tuple(round(v,6) for v in p)
def rotate(p,q):
    return add(p,add(mul(cross(q[:3],p),2*q[3]),mul(cross(q[:3],cross(q[:3],p)),2)))
def hermite(a,b,t):
    m0=mul(a['tangent'],a['tangentMagnitudeMm']); m1=mul(b['tangent'],b['tangentMagnitudeMm'])
    h=[2*t**3-3*t*t+1,t**3-2*t*t+t,-2*t**3+3*t*t,t**3-t*t]
    dh=[6*t*t-6*t,3*t*t-4*t+1,-6*t*t+6*t,3*t*t-2*t]
    values=[a['positionMm'],m0,b['positionMm'],m1]
    return ([sum(h[j]*values[j][k] for j in range(4)) for k in range(3)],
            [sum(dh[j]*values[j][k] for j in range(4)) for k in range(3)])

d=read(SRC+'ACCESSORY_REGISTRATION.json')
cs={c['id']:c for c in d['curves']}; ps={p['id']:p for p in d['instances']}; bones={b['name'] for b in d['bindBones']}
legacy=read('docs/evidence/mira-reference-set-v64/accessory-reference-set/TYPE_REFERENCE_COVERAGE.json')
assert len(ps)==90 and len({p['typeID'] for p in ps.values()})==21 and len(bones)==41
assert {(p['id'],p['typeID'].split(':')[1]) for p in ps.values()}=={(p['id'],p['type']) for p in legacy['instances']}
native=read('docs/evidence/mira-reference-set-v64/hand-staff-registration/RIG_MEASUREMENTS.json')
native_max_error=0
for a,b in zip(d['bindBones'],native['bind']):
    assert a['name']==b['name'] and a['parent']==b['parent']
    for field in ['positionMm','quaternion','scale']:
        native_max_error=max(native_max_error,max(abs(u-v) for u,v in zip(a[field],b[field])))
assert native_max_error<1e-9
matrix_max=0
for p in ps.values():
    for name in ['localToFrameMatrixMm','frameToActorBindMatrixMm']:
        m=p[name];axes=[m[0:3],m[4:7],m[8:11]]
        errors=[abs(dot(axes[i],axes[j])-(1 if i==j else 0)) for i in range(3) for j in range(3)]
        errors.append(abs(dot(axes[0],cross(axes[1],axes[2]))-1))
        matrix_max=max(matrix_max,max(errors));assert max(errors)<1e-7
for join in d['joins']:
    c=cs[join['curveID']];assert len(c['owners'])==2 and join['owners']==c['owners']
    uses=[next(u for u in ps[owner]['boundaryUses'] if u['curveID']==c['id']) for owner in c['owners']]
    assert uses[0]['direction']==-uses[1]['direction']
    assert all(set(u)=={'curveID','direction','canonicalAttributes','normalSign','uvSamples'} for u in uses)
weights=[r['boneWeights'] for c in cs.values() for r in c['samples']]+[r['boneWeights'] for p in ps.values() for r in p['interiorControls']]
assert all(set(w)<=bones and min(w.values())>=0 and abs(sum(w.values())-1)<1e-8 for w in weights)

# The directed boundary chain must have one arriving and one leaving edge at each simple-cycle vertex.
direction_failures=[]; undirected_failures=[]; boundary_components=[]
for p in ps.values():
    incidence=collections.defaultdict(lambda: {'incoming':[], 'outgoing':[]})
    adjacency=collections.defaultdict(set); closed=[]
    for use in p['boundaryUses']:
        c=cs[use['curveID']]
        assert p['id'] in c['owners'] and c['frame']==p['frame']
        if c['kind'] not in ['weld','open']: continue
        if c['closed']:
            closed.append(c['id']); continue
        a,b=key(c['samples'][0]['positionMm']),key(c['samples'][-1]['positionMm'])
        if use['direction']==-1:a,b=b,a
        incidence[a]['outgoing'].append(c['id']);incidence[b]['incoming'].append(c['id'])
        adjacency[a].add(b);adjacency[b].add(a)
    failures=[{'positionMm':list(k),**v} for k,v in incidence.items() if len(v['incoming'])!=1 or len(v['outgoing'])!=1]
    if failures: direction_failures.append({'instanceID':p['id'],'vertices':failures})
    uf=[list(k) for k,v in incidence.items() if len(v['incoming'])+len(v['outgoing'])!=2]
    if uf:undirected_failures.append({'instanceID':p['id'],'vertices':uf})
    seen=set(); components=0
    for k in adjacency:
        if k in seen:continue
        components+=1;stack=[k]
        while stack:
            v=stack.pop()
            if v not in seen:seen.add(v);stack.extend(adjacency[v]-seen)
    boundary_components.append({'instanceID':p['id'],'openEdgeCycleComponentsIgnoringDirection':components,'closedCurveComponents':closed,'surfaceFamily':p['surfaceRegistration']['family']})
assert not undirected_failures

# Actual Hermite derivatives, including both ends of every segment, are derived from position polynomials.
max_endpoint_dot=0;max_endpoint_derivative_error=0;max_sample_normal_error=0
interior_worst={'normalTangentAbsDot':-1}; interior_count=0; above_one_degree=0
for c in cs.values():
    for i,(a,b) in enumerate(zip(c['samples'],c['samples'][1:])):
        for t,r in [(0,a),(1,b)]:
            p,dp=hermite(a,b,t)
            max_endpoint_dot=max(max_endpoint_dot,abs(dot(unit(dp),r['normal'])))
            max_endpoint_derivative_error=max(max_endpoint_derivative_error,norm(sub(dp,mul(r['tangent'],r['tangentMagnitudeMm']))))
        for r in [a,b]: max_sample_normal_error=max(max_sample_normal_error,abs(norm(r['normal'])-1))
        for j in range(1,16):
            t=j/16;p,dp=hermite(a,b,t);normal=unit(add(mul(a['normal'],1-t),mul(b['normal'],t)))
            error=abs(dot(unit(dp),normal));interior_count+=1
            if error>math.sin(math.pi/180):above_one_degree+=1
            if error>interior_worst['normalTangentAbsDot']:
                interior_worst={'curveID':c['id'],'segment':i,'segmentLocalT':t,'positionMm':p,'actualHermiteDerivativeMm':dp,'interpolatedNormal':normal,'normalTangentAbsDot':error,'angleFromPerpendicularDegrees':math.degrees(math.asin(min(1,error))),'a':a,'b':b}
junction_max={'positionMm':0,'normalDifference':0,'weightDifference':0,'actualEndpointTangentPlaneDot':0}
for j in d['junctions']:
    for member in j['members']:
        r=cs[member['curveID']]['samples'][member['sample']]
        junction_max['positionMm']=max(junction_max['positionMm'],norm(sub(r['positionMm'],j['positionMm'])))
        junction_max['normalDifference']=max(junction_max['normalDifference'],norm(sub(r['normal'],j['normal'])))
        junction_max['weightDifference']=max(junction_max['weightDifference'],max(abs(r['boneWeights'].get(k,0)-j['boneWeights'].get(k,0)) for k in set(r['boneWeights'])|set(j['boneWeights'])))
        junction_max['actualEndpointTangentPlaneDot']=max(junction_max['actualEndpointTangentPlaneDot'],abs(dot(unit(mul(r['tangent'],r['tangentMagnitudeMm'])),j['normal'])))
assert max(junction_max.values())<1e-7
wa,wb=interior_worst['a'],interior_worst['b'];wt=interior_worst['segmentLocalT'];epsilon=1e-6
finite_difference=mul(sub(hermite(wa,wb,wt+epsilon)[0],hermite(wa,wb,wt-epsilon)[0]),1/(2*epsilon))
derivative_finite_difference_error=norm(sub(finite_difference,interior_worst['actualHermiteDerivativeMm']))
assert derivative_finite_difference_error<1e-7

# The registered nail floor is compared to the uncut elliptical tip loft at identical root-frame x,s.
nail_comparisons=[]
for seat in d['nailSeats']:
    tip=ps[seat['owners'][0]]['surfaceRegistration'];q=tip['rootQuaternion'];inverse=[-q[0],-q[1],-q[2],q[3]];rows=[]
    for r in cs[seat['contourCurveID']]['samples']:
        p=rotate(sub(r['positionMm'],tip['rootPositionHandMm']),inverse)
        t=(-p[1]-tip['startArclengthMm'])/(tip['endArclengthMm']-tip['startArclengthMm'])
        for a,b in zip(tip['radiusStations'],tip['radiusStations'][1:]):
            if a[0]-1e-8<=t<=b[0]+1e-8:
                f=smooth((t-a[0])/(b[0]-a[0]));rx=a[1]+f*(b[1]-a[1]);rz=a[2]+f*(b[2]-a[2]);break
        assert abs(p[0])<=rx, (seat['id'],'nail beyond tip width')
        skin=rz*math.sqrt(1-(p[0]/rx)**2)
        rows.append({'sample':r['sample'],'rootLocalPointMm':p,'tipRadiiMm':[rx,rz],'uncutTipOuterZmm':skin,'floorMinusTipOuterZmm':p[2]-skin,'plateTopMinusTipOuterZmm':p[2]+seat['plateThicknessMm']-skin})
    worst=max(rows,key=lambda r:r['floorMinusTipOuterZmm'])
    nail_comparisons.append({'seatID':seat['id'],'declaredDepthMm':seat['depthMm'],'declaredPlateProudMm':seat['plateProudMm'],'samplesAboveUncutTip':sum(r['floorMinusTipOuterZmm']>1e-6 for r in rows),'worst':worst})

# Continuous circle containment in the declared heel polygon: centre inside and exact edge distance > radius.
def inside(p,poly):
    hit=False
    for a,b in zip(poly,poly[1:]+poly[:1]):
        if (a[1]>p[1])!=(b[1]>p[1]) and p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0]:hit=not hit
    return hit
def edge_distance(p,a,b):
    v=[b[i]-a[i] for i in range(2)];t=max(0,min(1,sum((p[i]-a[i])*v[i] for i in range(2))/sum(x*x for x in v)))
    return math.sqrt(sum((p[i]-a[i]-t*v[i])**2 for i in range(2)))
heel_checks=[]
for side in ['R','L']:
    heel=ps[side+'-boot-heel']['surfaceRegistration'];poly=heel['footprintXZmm'][:-1]
    assert heel['topYmm']-heel['bottomYmm']==12 and heel['bottomYmm']==-108
    for i in range(1,5):
        h=ps[f'{side}-boot-fastener-{i}']['surfaceRegistration'];center=[h['centerMm'][0],h['centerMm'][2]]
        clearance=min(edge_distance(center,a,b) for a,b in zip(poly,poly[1:]+poly[:1]))-h['seatRadiusMm']
        assert inside(center,poly) and clearance>0 and h['outerYmm']==-108
        heel_checks.append({'id':f'{side}-boot-fastener-{i}','continuousSeatCircleClearanceFromDeclaredHeelPolygonMm':clearance})
sole_checks=[]
for side in ['R','L']:
    p=ps[side+'-boot-sole']['surfaceRegistration'];assert p['thicknessMm']==8
    ys=[-96-12*smooth((z+20)/90)+3*smooth((z-155)/38) for z in [-93+i*286/2048 for i in range(2049)]]
    assert min(ys)>=-108 and min(ys)==-108
    sole_checks.append({'side':side,'thicknessMm':8,'heelMm':12,'rearTotalMm':-88-(-108),'lowestAnalyticLowerSurfaceMm':min(ys),'rearLowerMm':-96})

# External contours are evaluated as actual saved Hermite curves against the declared partner ellipse.
# The other author's clothing file is not part of this fixed commit and is not silently substituted.
port_checks=[]
for port in d['externalPorts']:
    c=cs[port['curveID']];points=[hermite(a,b,j/16)[0] for a,b in zip(c['samples'],c['samples'][1:]) for j in range(17)]
    if 'wrist' in port['id']:
        rx,rz=port['bracerInnerRadiiMm'];level=max((p[0]/rx)**2+(p[2]/rz)**2 for p in points)
        assert level<1 and max(abs(p[1]) for p in points)<1e-8
        result={'id':port['id'],'savedSkinContourMaxPartnerEllipseLevel':level,'containedInDeclaredPartnerOpening':True,'registeredOverlapMm':9}
    else:
        rx,rz=75,77;level=max(abs((p[0]/rx)**2+(p[2]/rz)**2-1) for p in points)
        assert max(abs(p[1]-340) for p in points)<1e-8
        levels=[]
        for y in [300+j*40/160 for j in range(161)]:
            f=(y-300)/40;bx=73+2*f;bz=75+2*f;tf=(y-300)/45;tx=69+tf;tz=71+tf
            levels.append(max((tx/bx)**2,(tz/bz)**2))
        assert max(levels)<1 and port['bootTopFootYmm']-435==-95
        result={'id':port['id'],'savedApertureHermiteEllipseLevelDeviation':level,'declaredTrouserWithinDeclaredBootMaxEllipseLevel':max(levels),'declaredOverlapMm':40,'footToKneeMm':-435}
    result['actualOtherAuthorClothContourValidated']=False;port_checks.append(result)

inputs=sorted(set([SRC+n for n in ['ACCESSORY_REGISTRATION.json','EXTERNAL_PORTS.json','INPUT_HASHES.json','REPORT.md','VISUAL_READBACK.json']]+['review/accessory-registration-v65/generate.py','review/accessory-registration-v65/verify.py']+[v['path'] for v in d['inputs']]+['docs/evidence/mira-reference-set-v64/accessory-boundary-references/VIEW_SELECTIONS.json','docs/evidence/mira-reference-set-v64/accessory-reference-review/REVIEW.md','docs/evidence/mira-reference-set-v64/accessory-reference-review/appendix-ah08-ah10-v2/APPENDIX_REVIEW.md']))
hashes={p:sha(p) for p in inputs}
for p,h in hashes.items():
    raw=subprocess.run(['git','show',FIXED+':'+p],cwd=ROOT,check=True,capture_output=True).stdout
    assert hashlib.sha256(raw).hexdigest()==h, p
findings=[{'id':'A01','severity':'blocking numerical registration','issue':'Directed patch boundary is not a closed chain','affectedPlacementCount':len(direction_failures),'counterexample':direction_failures[0],'reason':'Degree two after ignoring direction is insufficient; a face boundary cannot have two outgoing and zero incoming arcs at the same ordinary boundary vertex.','allFailures':direction_failures},
          {'id':'A02','severity':'blocking differential registration','issue':'Linear interpolated normal is not orthogonal to actual Hermite boundary derivative between knots','counterexample':interior_worst,'sampledInteriorCount':interior_count,'sampledAboveOneDegreeCount':above_one_degree,'reason':'For a differentiable surface containing this boundary, its normal must be perpendicular to the actual boundary tangent. Sample-endpoint success does not establish the declared interpolation.'},
          {'id':'A03','severity':'blocking nail seat registration','issue':'Registered recessed floor rises above the uncut elliptical tip surface','counterexample':max(nail_comparisons,key=lambda r:r['worst']['floorMinusTipOuterZmm']),'allSeats':nail_comparisons,'reason':'The floor formula omits the elliptical cross-section lateral height reduction. Its registered contour cannot retain the stated 0.4 mm recess and 0.1 mm proud plate relative to the specified underlying tip without another explicitly authored transition/surface.'}]
report={'fixedSourceCommit':FIXED,'status':'REJECT finite numerical assembly registration: three reproducible defects','authorVerifierUsedForVerdict':False,'authorSourceImportedOrExecuted':False,'counts':{'types':21,'placements':90,'curves':len(cs),'samples':sum(len(c['samples']) for c in cs.values()),'junctions':len(d['junctions']),'nativeBones':len(bones),'validWeightRecords':len(weights)},'findings':findings,
        'passedLimitedChecks':{'IDTypeCorrespondence':True,'boneWeightsUseNative41AndNormalize':True,'bindSkeletonMatchesSavedNative41Within1eMinus9Tolerance':True,'bindSkeletonMaxSerializationError':native_max_error,'properMatrixMaxError':matrix_max,'sharedTwoOwnerCurvesNoAttributeOverrides':True,'undirectedBoundaryDegreeTwo':True,'sharedJunctionAttributes':junction_max,'actualHermiteEndpointNormalDotMax':max_endpoint_dot,'actualHermiteEndpointDerivativeErrorMmMax':max_endpoint_derivative_error,'counterexampleDerivativeFiniteDifferenceErrorMm':derivative_finite_difference_error,'sampleNormalLengthErrorMax':max_sample_normal_error,'soleAndHeel':sole_checks,'heelSeatContainment':heel_checks,'externalPortContourChecksAgainstDeclaredPartners':port_checks},
        'surfaceExistenceScope':'Directed boundaries and normal/tangent compatibility are necessary conditions. No surface was constructed and passing those conditions would not prove existence, nonintersection or all control constraints.',
        'notTested':['actual other-author clothing contour fixed-source integration','gripping pose or triangle contact','moving cloth or terrain support','new mesh/renderer/material/performance/whole-screen quality'],
        'newVisualInspection':['AH07-bare-seat-v1.png','AH08-nail-plate-v2.png'],'otherImageReview':'Previously traced source restrictions are retained; no claim of fresh inspection of all 18 author readback images.',
        'newMesh':0,'runtimeEdits':0,'remoteWrites':0,'elapsedScriptSeconds':round(time.perf_counter()-START,6),'recordedAt':datetime.now(timezone.utc).isoformat(),'pendingToolsAtScriptEnd':0}
OUT.mkdir(parents=True,exist_ok=True)
for name,value in [('RESULTS.json',report),('BOUNDARY_COMPONENTS.json',boundary_components),('SOURCE_HASHES.json',hashes)]:
    (OUT/name).write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'status':report['status'],'directionFailures':len(direction_failures),'maxInteriorNormalErrorDegrees':interior_worst['angleFromPerpendicularDegrees'],'maxNailFloorAboveSkinMm':max(r['worst']['floorMinusTipOuterZmm'] for r in nail_comparisons),'maxActualEndpointNormalDot':max_endpoint_dot,'scriptSeconds':report['elapsedScriptSeconds']},ensure_ascii=False))
