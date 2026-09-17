#!/usr/bin/env python3
from pathlib import Path
import json,math,hashlib,time
import numpy as np
from frames import rbf_value_gradient
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'docs/evidence/mira-assembly-v65/cloth-registration'
start=time.perf_counter();data=json.loads((OUT/'CLOTH_AUTHOR_SOURCE.json').read_text());C={x['id']:x for x in data['canonicalCurves']};P={p['id']:p for p in data['parts']};fails=[];checks={}
def check(name,condition,detail=None):
 checks[name]={'pass':bool(condition),'detail':detail}
 if not condition:fails.append(name)
def path(e):
 a=C[e['curve']]['samples'];return a if e['direction']==1 else a[::-1]
expected={i for t in data['types'] for i in t['instances']};check('exact40types96placements',len(data['types'])==40 and len(P)==96 and expected==set(P))
gaps=[];sampleErrors=[];knots={};weightKnotErrors=[]
for pid,p in P.items():
 if p['operation'].startswith(('closed metal','41mm')) or p.get('multipleBoundaryLoops'):continue
 es=p['boundary']
 for i,e in enumerate(es):
  d=math.dist(path(e)[-1]['positionM'],path(es[(i+1)%len(es)])[0]['positionM'])
  if d>1e-7:gaps.append([pid,i,d])
for c in C.values():
 if len(c['samples'])!=33:sampleErrors.append([c['id'],'count'])
 for j,a in enumerate(c['samples']):
  if not all(math.isfinite(v) for k in ['positionM','normal','tangent','uv'] for v in a[k]):sampleErrors.append([c['id'],j,'nonfinite'])
  for k in ['normal','tangent']:
   if abs(sum(v*v for v in a[k])-1)>1e-6:sampleErrors.append([c['id'],j,k])
  if abs(sum(x*y for x,y in zip(a['normal'],a['tangent'])))>1e-6:sampleErrors.append([c['id'],j,'orthogonality'])
  if abs(sum(a['weights'].values())-1)>1e-8 or any(v<0 for v in a['weights'].values()):sampleErrors.append([c['id'],j,'weight'])
  if not set(a['weights'])<=set(data['boneSubset']):sampleErrors.append([c['id'],j,'bone'])
  if j in [0,32]:
   pos=tuple(a['positionM']);old=knots.setdefault(pos,a['weights'])
   if old!=a['weights']:weightKnotErrors.append([c['id'],j])
check('closed ordered patch perimeters',not gaps,gaps)
check('all canonical samples finite/unit frames/normalized valid boneweights',not sampleErrors,sampleErrors[:30])
check('coincident knot weights shared',not weightKnotErrors,weightKnotErrors)
for g in ['FR','BR','BL','FL']:
 cid=data['aliases']['TR03-'+g];owners={o['part'] for o in C[cid]['owners']}
 target={'FR':'TR01-R','BR':'TR02-R','BL':'TR02-L','FL':'TR01-L'}[g]
 check('gusset-'+g,owners=={'TR03-C',target},sorted(owners))
for side in ['R','L']:
 for half,typ in [('front','TR01'),('rear','TR02')]:
  a=data['aliases']['TR05-'+side+'-upper-'+half];b=data['aliases'][typ+'-'+side+'-boot'];check('boot shared '+side+half,a==b,[a,b])
 for typ in ['S05','S06']:
  p=P[typ+'-'+side];check(typ+side+'190mm',abs(p['interiorSupport']['upperRing'][0]-p['interiorSupport']['lowerRing'][0]-.190)<1e-9)
 for nm in ['NECK-lower-front-'+side,'NECK-lower-rear-'+side]:
  cid=data['aliases'][nm];owners=[o['part'] for o in C[cid]['owners']];check(nm+' shared',len(owners)>=2,owners)
# All four belt quarter seam ports must be jointly owned and no free closure line.
for typ in ['B01','TR04']:
 endOwners={}
 for p in P.values():
  if p['type']==typ:
   for e in p['boundary']:
    pts=path(e)
    if math.dist(pts[0]['positionM'],pts[-1]['positionM'])>.02 and abs(pts[0]['positionM'][1]-pts[-1]['positionM'][1])>.02:
     endOwners[e['curve']]=len({o['part'] for o in C[e['curve']]['owners']})
 check(typ+'closed4segments',len(endOwners)==4 and all(x>=2 for x in endOwners.values()),endOwners)
nodeGroups={}
for c in C.values():
 for i in [0,32]:
  a=c['samples'][i];nodeGroups.setdefault((c['normalDomain'],tuple(a['positionM'])),[]).append(a)
nodeErrors=[];maximumAngle=0;maximumRank=0
for key,ss in nodeGroups.items():
 n=np.array(ss[0]['normal']);tt=np.array([a['tangent'] for a in ss]);rank=int(np.linalg.matrix_rank(tt,tol=1e-8));maximumRank=max(maximumRank,rank)
 for a in ss:
  angle=math.degrees(math.acos(np.clip(np.dot(n,a['normal']),-1,1)));maximumAngle=max(maximumAngle,angle)
  if angle>1e-4 or abs(np.dot(n,a['tangent']))>1e-8:nodeErrors.append([key,angle])
 if rank>2:nodeErrors.append([key,'rank',rank])
check('smoothnode actual normal/tangent plane equality',not nodeErrors,{'nodeCount':len(nodeGroups),'maxNormalDifferenceDegrees':maximumAngle,'maxTangentRank':maximumRank,'errors':nodeErrors[:10]})
r=data['nodeFrameRegistration']
check('normal repair changescurve notnormalonly',r['rank3NodesBefore']>0 and r['rankAbove2After']==0 and r['samplePositionsUnchanged'],{k:r[k] for k in ['rank3NodesBefore','rankAbove2After','maxHermiteDeviationFromPolylineM','maximumEndpointTangentChangeDegrees']})
check('crease/layer domains explicitly classified',bool(r['explicitDomainSplits']),{'count':len(r['explicitDomainSplits'])})
for side in ['R','L']:
 p=P['W02-'+side];sf=p['interiorSupport'];res=0;count=0
 for e in p['boundary']+[{'curve':x} for x in p['attachmentCurves']]:
  c=C[e['curve']]
  for a in c['samples']:
   x,y,z=a['positionM'];val,gradient=rbf_value_gradient(sf,y,z);res=max(res,abs(x-val));count+=1
  check(p['id']+' canonicalprojection '+c['id'],c.get('surfaceProjection',{}).get('part')==p['id'])
 check(p['id']+' exactsample surfaceconstraints',res<1e-8 and not sf['constraintOutsideDomain'],{'samplesRead':count,'maxResidualM':res,'uniqueConstraints':sf['constraints'],'rangeX':sf['interiorXRangeM']})
 check(p['id']+' supportweight count',len(sf['supportWeights'])==len(sf['supportPointsM']))
check('all type image byte identities',all(hashlib.sha256((ROOT/t['reference']).read_bytes()).hexdigest()==t['sha256'] for t in data['types']))
check('all patches fixed interior supports',all(p['interiorSupport']['supportPointsM'] and p['interiorSupport']['maximumUnspecifiedDisplacementM']==0 for p in P.values()))
check('no newmesh runtime or remote',data['scope']['newMeshes']==data['scope']['runtimeChanges']==data['scope']['remoteChanges']==0)
report={'scope':'author boundary algebra only; NOT surface interior validity, trianglecontact, posedclearance or wholeperson acceptance','counts':{'types':len(data['types']),'placements':len(P),'canonicalCurves':len(C),'curveSamples':sum(len(c['samples']) for c in C.values()),'sharedCurveCount':sum(len({o['part'] for o in c['owners']})>1 for c in C.values())},'checks':checks,'passed':not fails,'failed':fails,'seconds':round(time.perf_counter()-start,6)}
(OUT/'VALIDATION.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps(report,ensure_ascii=False))
raise SystemExit(1 if fails else 0)
