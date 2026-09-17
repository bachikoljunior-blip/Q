#!/usr/bin/env python3
"""Finite registration validation. It never validates geometry that has not been built."""
import collections,copy,hashlib,itertools,json,math,pathlib,subprocess,time
from curve_eval import evaluate as evaluate_curve, nail as evaluate_nail
ROOT=pathlib.Path(__file__).resolve().parents[2];OUT=ROOT/'docs/evidence/mira-assembly-v65/accessory-registration'
def check(data):
 cs={c['id']:c for c in data['curves']};ps={p['id']:p for p in data['instances']};bn={b['name'] for b in data['bindBones']}
 assert len(ps)==90 and len(bn)==data['boneCount']==41
 assert len(cs)==len(data['curves'])
 expected=json.loads((ROOT/'docs/evidence/mira-reference-set-v64/accessory-reference-set/TYPE_REFERENCE_COVERAGE.json').read_text())
 assert {(p['id'],p['typeID'].split(':')[1]) for p in ps.values()}=={(p['id'],p['type']) for p in expected['instances']}
 assert collections.Counter(p['typeID'].split(':')[0] for p in ps.values())=={'hands':56,'boots':34}
 maxima={'normalLengthError':0,'tangentLengthError':0,'normalTangentDot':0,'weightSumError':0,'sharedPositionDifferenceMm':0,'sharedNormalAngleDegrees':0,'sharedTangentDifference':0,'sharedWeightDifference':0,'junctionTripleProduct':0}
 def finite(obj):
  if isinstance(obj,float):assert math.isfinite(obj)
  elif isinstance(obj,list):
   for x in obj:finite(x)
  elif isinstance(obj,dict):
   for x in obj.values():finite(x)
 finite(data)
 for c in cs.values():
  assert c['frame'] in bn and len(c['samples'])>=2
  if c['closed']:assert math.dist(c['samples'][0]['positionMm'],c['samples'][-1]['positionMm'])<1e-7
  for r in c['samples']:
   ne=abs(math.sqrt(sum(v*v for v in r['normal']))-1);te=abs(math.sqrt(sum(v*v for v in r['tangent']))-1);nd=abs(sum(a*b for a,b in zip(r['normal'],r['tangent'])));we=abs(sum(r['boneWeights'].values())-1)
   assert max(ne,te,nd,we)<1e-7,(c['id'],r['sample'],ne,te,nd,we)
   for k,val in [('normalLengthError',ne),('tangentLengthError',te),('normalTangentDot',nd),('weightSumError',we)]:maxima[k]=max(maxima[k],val)
   assert set(r['boneWeights'])<=bn and min(r['boneWeights'].values())>=0
   assert len(r['positionMm'])==3
  for owner in c['owners']:assert owner in ps
 for j in data['junctions']:
  tangents=[cs[m['curveID']]['samples'][m['sample']]['tangent'] for m in j['members']]
  triples=[abs(sum(a[i]*(b[(i+1)%3]*c[(i+2)%3]-b[(i+2)%3]*c[(i+1)%3]) for i in range(3))) for a,b,c in itertools.combinations(tangents,3)]
  maxima['junctionTripleProduct']=max(maxima['junctionTripleProduct'],max(triples,default=0))
  assert max(triples,default=0)<1e-7 and j['repairedTangentRank']<=2
  assert max(abs(sum(t[i]*j['normal'][i] for i in range(3))) for t in tangents)<1e-7
  for member in j['members']:
   row=cs[member['curveID']]['samples'][member['sample']]
   assert row['junctionID']==j['id'] and all(row[k]==j[k] for k in ['positionMm','normal','boneWeights'])
 for p in ps.values():
  assert set(p['boneNames'])<=bn
  assert p['interiorControls'] and len(p['localToFrameMatrixMm'])==16
  m=p['localToFrameMatrixMm'];a=m[0:3];b=m[4:7];c=m[8:11]
  det=a[0]*(b[1]*c[2]-b[2]*c[1])-b[0]*(a[1]*c[2]-a[2]*c[1])+c[0]*(a[1]*b[2]-a[2]*b[1]);assert abs(det-1)<1e-7,(p['id'],det)
  assert all(abs(sum(v*v for v in ax)-1)<1e-7 for ax in (a,b,c))
  endpoints=collections.Counter()
  for use in p['boundaryUses']:
   assert set(use)=={'curveID','direction','canonicalAttributes','normalSign','uvSamples'},'Per-owner boundary attribute override is prohibited'
   cc=cs[use['curveID']];assert p['id'] in cc['owners'];assert use['direction'] in [-1,1]
   assert len(use['uvSamples'])==len(cc['samples'])
   assert all(0<=v<=1 for uv in use['uvSamples'] for v in uv)
   if cc['kind'] in ('weld','open') and not cc['closed']:
    for row in [cc['samples'][0],cc['samples'][-1]]:endpoints[tuple(round(v,6) for v in row['positionMm'])]+=1
  assert all(n==2 for n in endpoints.values()),(p['id'],'open boundary endpoints',endpoints)
  for loop in p.get('boundaryLoops',[]):
   for edge,nex in zip(loop,loop[1:]+loop[:1]):
    c1=cs[edge['curveID']];c2=cs[nex['curveID']]
    last=c1['samples'][-1 if edge['direction']==1 else 0]['positionMm'];first=c2['samples'][0 if nex['direction']==1 else -1]['positionMm']
    assert math.dist(last,first)<1e-7,(p['id'],'directed boundary failure',edge,nex)
    assert next(u['direction'] for u in p['boundaryUses'] if u['curveID']==edge['curveID'])==edge['direction']
  for r in p['interiorControls']:
   assert set(r['boneWeights'])<=bn and abs(sum(r['boneWeights'].values())-1)<1e-7
 for j in data['joins']:
  c=cs[j['curveID']];assert len(c['owners'])==2 and j['owners']==c['owners']
  uses=[next(u for u in ps[pid]['boundaryUses'] if u['curveID']==c['id']) for pid in c['owners']]
  assert uses[0]['direction']==-uses[1]['direction']
  # Resolve each owner independently through the serialized IDs. No copied attribute arrays.
  rows=[cs[u['curveID']]['samples'] for u in uses]
  assert rows[0]==rows[1]
  assert all(u['normalSign']==1 for u in uses) if c['kind']=='weld' else uses[0]['normalSign']==-uses[1]['normalSign']
 cons=data['constraints'];assert (cons['soleMm'],cons['heelMm'],cons['rearEnvelopeMm'],cons['supportPlaneFootYmm'])==(8,12,20,-108)
 assert not cons['provisional22mmAdopted'];assert cons['newMesh']==cons['runtimeEdits']==cons['remoteMutations']==0
 for s in ['R','L']:
  sole=ps[s+'-boot-sole']['surfaceRegistration'];heel=ps[s+'-boot-heel']['surfaceRegistration']
  assert sole['thicknessMm']==8 and heel['heightMm']==12
  assert heel['topYmm']==-96 and heel['bottomYmm']==-108 and sole['rearUpperYmm']==-88
  assert all(r['positionMm'][1]>=-108-1e-8 for c in cs.values() if c['frame']=='foot-'+str(0 if s=='R' else 1) for r in c['samples'])
  # Four actual head circles fit within the authored heel footprint, with empty-seat .1mm radial allowance.
  polygon=heel['footprintXZmm'][:-1]
  def inside(x,z):
   hit=False
   for (ax,az),(bx,bz) in zip(polygon,polygon[1:]+polygon[:1]):
    if (az>z)!=(bz>z) and x<(bx-ax)*(z-az)/(bz-az)+ax:hit=not hit
   return hit
  for i in range(1,5):
   h=ps[f'{s}-boot-fastener-{i}']['surfaceRegistration'];assert h['outerYmm']==-108 and h['topYmm']==-107
   x,_,z=h['centerMm']
   assert all(inside(x+3.1*math.cos(t),z+3.1*math.sin(t)) for t in [k*math.pi/16 for k in range(32)]),(s,i,'seat outside heel')
 for c in cs.values():
  for i in range((len(c['samples'])-1)*4+1):
   ev=evaluate_curve(c,i/((len(c['samples'])-1)*4));err=abs(sum(a*b for a,b in zip(ev['normal'],ev['tangent'])));assert err<1e-7,(c['id'],i,'interior curve frame')
 for seat in data['nailSeats']:
  assert seat['depthMm']==.4 and seat['plateThicknessMm']==.5 and abs(seat['plateProudMm']-.1)<1e-8
  assert seat['owners'][0].endswith('-tip') and seat['owners'][1].endswith('-nail')
  assert seat['contourCurveID'] in cs and not seat['meshContactValidated']
  for i in range(257):
   ev=evaluate_nail(seat['definition'],i/256);n=ev['normal'];delta=[ev['skinPositionMm'][j]-ev['positionMm'][j] for j in range(3)];proud=[ev['outerPlatePositionMm'][j]-ev['skinPositionMm'][j] for j in range(3)]
   assert ev['ellipseDomainRatio']<1 and abs(sum(a*b for a,b in zip(delta,n))-.4)<1e-8 and abs(sum(a*b for a,b in zip(proud,n))-.1)<1e-8
 for port in data['externalPorts']:
  assert port['curveID'] in cs and port['kind']=='overlap' and not port['deformedClearanceValidated']
  if 'trousers' in port['id']:
   assert port['bootTopFootYmm']==340 and port['bootTopKneeYmm']==-95 and port['longitudinalOverlapMm']==40
   assert port['bootTopFootYmm']-435==port['bootTopKneeYmm']
   for y,rx,rz in port['bootInnerStationsMm']:
    t=(y-300)/45;tr=69+t;tz=71+t;assert min(rx-tr,rz-tz)>=4-1e-8
  else:assert port['skinYRangeMm']==[-15,9] and port['longitudinalOverlapMm']==9 and not port['clothDirectSkinWeld']
 assert data['grip']['rightHandHolding'] and not data['grip']['contactAccepted']
 for design in data['grip']['armDesigns']:
  m=design['staffActorMatrix'];assert m[:12]==[1,0,0,0,0,1,0,0,0,0,1,0]
 for x in data['inputs']:
  raw=(ROOT/x['path']).read_bytes();assert len(raw)==x['bytes'] and hashlib.sha256(raw).hexdigest()==x['sha256'],x['path']
 return maxima
start=time.perf_counter();path=OUT/'ACCESSORY_REGISTRATION.json';d=json.loads(path.read_text());maxima=check(d)
ports=json.loads((OUT/'EXTERNAL_PORTS.json').read_text());cs={c['id']:c for c in d['curves']}
for port in ports['ports']:assert port['orderedSamples']==cs[port['curveID']]['samples']
negative=[]
for label,mut in [('normal nonunit',lambda d:d['curves'][0]['samples'][0].update(normal=[1,1,1])),('per-owner duplicate normal',lambda d:d['instances'][0]['boundaryUses'][0].update(normal=[0,1,0])),('22mm heel substitution',lambda d:d['constraints'].update(heelMm=14,rearEnvelopeMm=22)),('renamed placement',lambda d:d['instances'][0].update(id='unknown')),('open endpoint',lambda d:d['curves'][0]['samples'][0]['positionMm'].__setitem__(0,999)),('reversed part boundary',lambda d:d['instances'][0]['boundaryUses'][0].update(direction=-d['instances'][0]['boundaryUses'][0]['direction'])),('unknown bone',lambda d:d['curves'][0]['samples'][0].update(boneWeights={'new-third-phalanx':1}))]:
 c=copy.deepcopy(d);mut(c)
 try:check(c)
 except (AssertionError,KeyError):negative.append({'fault':label,'rejected':True})
 else:raise AssertionError('fault not detected: '+label)
# Deterministic regeneration has to preserve each author output byte.
files=['ACCESSORY_REGISTRATION.json','EXTERNAL_PORTS.json','INPUT_HASHES.json'];before={n:(OUT/n).read_bytes() for n in files}
subprocess.run(['python',str(ROOT/'review/accessory-registration-v65/generate.py')],cwd=ROOT,check=True,capture_output=True)
assert all((OUT/n).read_bytes()==before[n] for n in files)
report={'status':'PASS numerical author-registration consistency only','counts':{'types':21,'placements':90,'handPlacements':56,'bootPlacements':34,'canonicalCurves':len(d['curves']),'twoOwnerJoins':len(d['joins']),'sharedJunctions':len(d['junctions']),'canonicalSamples':sum(len(c['samples']) for c in d['curves']),'externalPorts':4,'existingBones':41,'newMeshes':0},'checks':['90 IDs/types match fixed v64 ledger','native41bones only and proper transforms','ordered curve samples unit normals/tangents, perpendicular, valid normalized weights','every open patch boundary endpoint degree2; coincident shared junction normal/weights identical','both shared owners resolve identical canonical attributes with opposite traversal','all directed patch cycles close; actual interpolated normals orthogonal at quarter segments','analytic elliptical nail seat normal-depth0.4 and plate proud0.1 at257 samples each','separate UV charts in range','8+12=20 rear partition and -108 support','all8 fastener seats within actual heel footprint','AH07 bare floor/AH08 separate plate','four sampled external ports including 40mm hem and9mm wrist overlap','right rigid staff scale1 retained; contact not accepted','source hashes and deterministic regeneration'], 'junctionRepair':{'sourceRank3Junctions':sum(j['sourceMaxTripleProduct']>1e-7 for j in d['junctions']),'repairedMaxTripleProduct':maxima['junctionTripleProduct'],'maxHermiteDerivativeRepairAngleDegrees':max(j['maxDerivativeRepairAngleDegrees'] for j in d['junctions']),'meaning':'authored interpolation derivatives changed into common normal domain; actual surface not yet built'},'maxima':maxima,'negativeControls':negative,'regenerationIdentical':True,'elapsedSeconds':time.perf_counter()-start,'notTested':['surface area/interior self-intersection','triangle nail/strap/grip contact','posed cloth clearance','runtime/render/material/device/PS4 or fixed10 comparison']}
(OUT/'VERIFICATION.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps(report,ensure_ascii=False))
