#!/usr/bin/env python3
"""Independent numeric/topological registration checks; creates no faces/mesh."""
import json, math, pathlib, hashlib, subprocess, collections
R=pathlib.Path(__file__).resolve().parents[2];O=R/'docs/evidence/mira-assembly-v65/head-registration';D=json.loads((O/'registration.json').read_text());P=D['instances'];C=D['curves'];N=D['nodes'];checks={};fail=[]
def ck(name,value):
 checks[name]=value
 if not value:fail.append(name)
def close(a,b,tol=1e-10):return max(abs(x-y) for x,y in zip(a,b))<=tol
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def sub(a,b):return [x-y for x,y in zip(a,b)]
def unit(a):return [x/math.sqrt(dot(a,a)) for x in a]
def cross(a,b):return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]
def ev(c,t):
 d=c['definition'];b=[(1-t)**3,3*t*(1-t)**2,3*t*t*(1-t),t**3]
 if c['kind']=='cubic-bezier':return [sum(b[j]*c['controlPointsM'][j][k] for j in range(4)) for k in range(3)]
 if c['kind']=='sphere-projected-bezier-xy':
  xy=[sum(b[j]*d['xyControls'][j][k] for j in range(4)) for k in range(2)];ct=d['centerM'];return xy+[ct[2]+math.sqrt(d['radiusM']**2-(xy[0]-ct[0])**2-(xy[1]-ct[1])**2)+d['radialFrontOffsetM']]
 if c['kind']=='circle':
  return [d['centerM'][k]+d['radiusM']*(d['axisU'][k]*math.cos(math.tau*t)+d['axisV'][k]*math.sin(math.tau*t)) for k in range(3)]
 if c['kind']=='ellipse-arc':
  a=d['thetaRange'][0]*(1-t)+d['thetaRange'][1]*t;return [d['rx']*math.sin(a),d['y'],d['rz']*math.cos(a)]
 if c['kind'] in ['hair-side','hair-root']:
  p=P[d['instance']];sec=p['section'];v=t if c['kind']=='hair-side' else 0;u=d.get('u',t);sp=ev(C[d['spineCurveId']],v)
  def prof(pp):
   j=next((j for j in range(len(pp)-1) if v<=pp[j+1][0]),len(pp)-2);a,b=pp[j:j+2];q=(v-a[0])/(b[0]-a[0]);return a[1]*(1-q)+b[1]*q
  return [sp[k]+sec['axisWidth'][k]*(u-.5)*sec['widthM']*prof(sec['widthProfile'])+sec['axisDepth'][k]*4*u*(1-u)*sec['depthM']*prof(sec['depthProfile']) for k in range(3)]
 if c['kind']=='piecewise-cubic':
  j=next((j for j in range(len(d['breaks'])-1) if t<=d['breaks'][j+1]),len(d['breaks'])-2);a,b=d['breaks'][j:j+2];u=(t-a)/(b-a);bb=[(1-u)**3,3*u*(1-u)**2,3*u*u*(1-u),u**3];return [sum(bb[z]*d['segments'][j][z][k] for z in range(4)) for k in range(3)]
 if c['kind']=='piecewise-linear':
  i=next((i for i in range(len(d['breaks'])-1) if t<=d['breaks'][i+1]),len(d['breaks'])-2);u=(t-d['breaks'][i])/(d['breaks'][i+1]-d['breaks'][i]);return [d['pointsM'][i][k]*(1-u)+d['pointsM'][i+1][k]*u for k in range(3)]
 raise ValueError(c['kind'])
expected={x['id'] for x in json.loads((R/'docs/evidence/mira-reference-set-v64/head-assembly-registration/instances.json').read_text())['instances']}|{'F21-L','F21-R'}
ck('exact82InstanceIDs',set(P)==expected and len(P)==82);ck('41UniqueLeafTypes',len({p['type'] for p in P.values()})==41)
ck('allSelectedReferenceFilesExist',all((R/p['selectedImage']).is_file() for p in P.values()))
ck('allNumbersFinite',not any(x in (O/'registration.json').read_text() for x in ['NaN','Infinity']))
ck('allCurveEndpointsResolve',all(all(n in N for n in c['endpointIds']) for c in C.values()))
ck('allCurveEndpointsNumericMatch',all(close(ev(c,0),N[c['endpointIds'][0]]) and close(ev(c,1),N[c['endpointIds'][1]]) for c in C.values()))
closed=[];ownerrefs=[]
for pid,p in P.items():
 for li,loop in enumerate(p['boundaryLoops']):
  endpoints=[]
  for ei,e in enumerate(loop):
   c=C[e['curveId']];a,b=c['endpointIds'];endpoints.append((a,b) if e['direction']==1 else (b,a));ownerrefs.append(any(o['instance']==pid and o.get('loop')==li and o.get('edge')==ei and o.get('direction')==e['direction'] for o in c['owners']))
  closed.append(all(endpoints[i][1]==endpoints[(i+1)%len(endpoints)][0] for i in range(len(endpoints))))
ck('allPartTrimLoopsClosedByNodeID',all(closed));ck('ownersReferToCanonicalSourceBothWays',all(ownerrefs));ck('noCurveControlCopiesOnOwners',all('controlPointsM' not in json.dumps(p) for p in P.values()))
ck('sharedSkinTraversalOpposite',all(c['owners'][0]['direction']==-c['owners'][1]['direction'] for c in C.values() if len(c['owners'])==2 and all(P[o['instance']]['layer']=='skin' for o in c['owners'])))
skin={k for k,p in P.items() if p['layer']=='skin'};es={e['curveId'] for k in skin for loop in P[k]['boundaryLoops'] for e in loop};vs={n for k in es for n in C[k]['endpointIds']};boundary=[k for k in es if len([o for o in C[k]['owners'] if o['instance'] in skin])==1]
graph=collections.defaultdict(list)
for cid in boundary:
 a,b=C[cid]['endpointIds'];graph[a].append(b);graph[b].append(a)
ck('skinBoundaryHasNoBranches',all(len(v)==2 for v in graph.values()));seen=set();components=0
for n in graph:
 if n in seen:continue
 components+=1;stack=[n]
 while stack:
  a=stack.pop()
  if a in seen:continue
  seen.add(a);stack.extend(graph[a])
ck('threeSkinBoundaryLoops',components==3);ck('skinCombinatorialSphereWithThreeOpenings',len(vs)-len(es)+len(skin)==-1)
ck('oneOrTwoTrimOwners',all(1<=len(c['owners'])<=2 for c in C.values()))
ck('everySingleOwnerHasExplicitPortOrLayer',all(len(c['owners'])==2 or c.get('externalPort') or c['contactReceivers'] or P[c['owners'][0]['instance']]['layer'] in ['hair','brow'] for c in C.values()))
frames=[s for c in C.values() for s in c['frameSamples']]
ck('canonicalFrameVectorsUnit',all(abs(dot(s[k],s[k])-1)<1e-7 for s in frames for k in ['tangent','normal','crossTangent']))
ck('canonicalFramesOrthogonal',all(abs(dot(s['normal'],s['tangent']))<1e-7 and abs(dot(s['normal'],s['crossTangent']))<1e-7 for s in frames))
ck('weightsNormalizedNonnegative',all(abs(sum(s['skinWeights'].values())-1)<1e-10 and min(s['skinWeights'].values())>=-1e-12 for s in frames))
ck('sampledPositionsAgreeWithCurves',all(close(s['positionM'],ev(c,s['t'])) for c in C.values() for s in c['frameSamples']))
ck('explicitUVForEveryOwner',all(set(s['uvByOwner'])=={o['instance'] for o in c['owners']} for c in C.values() for s in c['frameSamples']))
roots=D['hairRoots'];ck('24UniqueHairRoots',len(roots)==24 and {x['instance'] for x in roots}=={f'H{i:02d}' for i in range(1,25)})
ck('rootsHaveOneExistingScalpSupport',all(x['support'] in ['S01','S02','S03','S04','S05'] for x in roots))
ck('rootOffsetIsExactNormalClearance',all(close(sub(x['positionM'],x['supportPositionM']),[v*x['clearanceM'] for v in x['normal']]) for x in roots))
ck('hairSpineStartsAtRoot',all(close(ev(C[x['spineCurveId']],0),x['positionM']) for x in roots))
ck('rootFramesRightHanded',all(close(cross(x['binormal'],x['tangent']),x['normal'],1e-7) and abs(dot(x['normal'],x['tangent']))<1e-7 for x in roots))
# Compare retained record bytes and all derived subcurve samples to frozen source.
frozen=R/'docs/evidence/mira-reference-set-v64/head-assembly-registration/existing-boundaries.json';kept=json.loads((O/'native-v63-preserved.json').read_text());raw=frozen.read_bytes();base=subprocess.check_output(['git','show','bc761f25aae76209d26623b509f97e1f3a5a12ca:'+str(frozen.relative_to(R))],cwd=R)
ck('v1NativeBytesUnchanged',raw==base);ck('v63SevenRecordsUnchanged',kept['records']==json.loads(raw));ck('nativeSourceHashCorrect',kept['sourceSha256']==hashlib.sha256(raw).hexdigest());old={x['id']:x for x in kept['records']};native_ok=[]
for c in C.values():
 if 'nativeConstraint' not in c:continue
 d=c['nativeConstraint'];cp=old[d['instance']]['edges'][d['edge']];a,b=d['sourceRange']
 for i in range(17):
  t=i/16;st=b-(b-a)*t if d['reversed'] else a+(b-a)*t;fake={'kind':'cubic-bezier','definition':None,'controlPointsM':cp};native_ok.append(close(ev(c,t),ev(fake,st),1e-12))
ck('allNativeSubcurvesExact',all(native_ok));six=[]
order=['F05-R','F07-R','F09-R','F11','F09-L','F07-L','F05-L']
for a,b in zip(order,order[1:]):six.append([cid for cid,c in C.items() if {o['instance'] for o in c['owners']}=={a,b}])
ck('sixInternalNativeSeamsSingleSource',all(len(v)==1 for v in six))
ck('closedMouthIsContactNotPermanentWeld','never a permanent weld' in C[D['mouthContactCurveId']]['joinPolicy'])
ports=json.loads((O/'external-ports.json').read_text());ck('externalPortsHaveRequiredFields',all(all(k in p for k in ['id','owner','frame','unit','kind','counterpartId','canonicalSource','orderedSamples']) and p['orderedSamples'] for p in ports['ports']))
ck('collarHasPositiveStaticRadialGap',D['externalContract']['staticSameRayGapMM']['min']>=5.999999)
import numpy as np
node_normals_ok=[];ranks=[];maxdot=0;maxangle=0
for nid,nc in D['skinNodeContracts'].items():
 ts=[];norms=[]
 for cid in nc['incidentCurveIds']:
  c=C[cid];end=0 if c['endpointIds'][0]==nid else 1;sm=c['frameSamples'][0 if end==0 else -1];ts.append(sm['tangent']);norms.append(sm['normal']);maxdot=max(maxdot,abs(dot(sm['tangent'],nc['normal'])));maxangle=max(maxangle,math.degrees(math.acos(min(1,max(-1,dot(sm['normal'],nc['normal']))))))
 sv=np.linalg.svd(np.array(ts),compute_uv=False);rank=int(sum(x>1e-7 for x in sv));ranks.append(rank);node_normals_ok.extend(close(n,nc['normal'],1e-7) for n in norms)
ck('smoothSkinNodesShareOneNormal',all(node_normals_ok));ck('allSkinIncidentTangentRanksAtMostTwo',max(ranks)<=2);ck('nodeTangentsLieOnRegisteredPlane',maxdot<1e-7)
# Files in legacy dirs were not edited: generator itself writes new allowed folders only.
report={'checks':checks,'passed':len(checks)-len(fail),'failed':fail,'counts':{'types':41,'instances':len(P),'skinFaces':len(skin),'canonicalCurves':len(C),'skinTrimCurves':len(es),'hairSpines':24,'hairRoots':len(roots),'skinNodes':len(vs),'skinBoundaryLoops':components,'skinEulerCharacteristic':len(vs)-len(es)+len(skin),'nativeSeams':six,'maxNodeNormalAngleDegrees':maxangle,'maxNodeTangentNormalDot':maxdot,'maxNodeTangentRank':max(ranks)},'meaning':'numeric/data/topological consistency only; no triangulation or rendered/posed/visual quality acceptance','remaining':['Independent whole-person registration review','New surface Jacobian, self-intersections and full-width hair support not verified by trim graph','Native-to-new normal/weight compatibility under deformation needs construction checks','Bind-only neck/collar gap; no pose clearance proof','Closed mouth and blind concha/nasal recess only; not all facial performance anatomy']}
(O/'verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps(report,ensure_ascii=False,indent=2));raise SystemExit(bool(fail))
