#!/usr/bin/env python3
"""Read-only independent oracle: no author verifier imports, no mesh construction."""
from pathlib import Path
import collections,hashlib,itertools,json,math,time,numpy as np
ROOT=Path(__file__).resolve().parents[4]
SRC=ROOT/'docs/evidence/mira-assembly-v65/head-registration'
OUT=Path(__file__).parent
D=json.loads((SRC/'registration.json').read_text());C=D['curves'];P=D['instances'];N=D['nodes'];NC=D['skinNodeContracts']
A=lambda x:np.array(x,dtype=float)
def unit(x):
 n=np.linalg.norm(x)
 if n<1e-14:raise ValueError('degenerate vector')
 return x/n
def basis(t):return A([(1-t)**3,3*t*(1-t)**2,3*t*t*(1-t),t**3])
def dbasis(t):return A([-3*(1-t)**2,3*(1-t)*(1-3*t),3*t*(2-3*t),3*t*t])
def profile(rows,t):
 for a,b in zip(rows,rows[1:]):
  if t<=b[0]+1e-14:return a[1]+(b[1]-a[1])*(t-a[0])/(b[0]-a[0]),(b[1]-a[1])/(b[0]-a[0])
 raise ValueError(t)
def cv(cid,t):
 c=C[cid];d=c['definition'];kind=c['kind']
 if kind=='cubic-bezier':return basis(t)@A(c['controlPointsM']),dbasis(t)@A(c['controlPointsM'])
 if kind=='piecewise-cubic':
  breaks=d['breaks'];j=next((j for j in range(len(breaks)-1) if t<=breaks[j+1]),len(breaks)-2);span=breaks[j+1]-breaks[j];u=(t-breaks[j])/span;cp=A(d['segments'][j]);return basis(u)@cp,dbasis(u)@cp/span
 if kind=='sphere-projected-bezier-xy':
  ct=A(d['centerM']);xy=basis(t)@A(d['xyControls']);dv=dbasis(t)@A(d['xyControls']);z=math.sqrt(d['radiusM']**2-np.dot(xy-ct[:2],xy-ct[:2]));return np.r_[xy,ct[2]+z+d['radialFrontOffsetM']],np.r_[dv,-np.dot(xy-ct[:2],dv)/z]
 if kind=='ellipse-arc':
  a,b=d['thetaRange'];ang=a+(b-a)*t;return A([d['rx']*math.sin(ang),d['y'],d['rz']*math.cos(ang)]),A([d['rx']*math.cos(ang),0,-d['rz']*math.sin(ang)])*(b-a)
 if kind=='circle':
  ang=2*math.pi*t;u=A(d['axisU']);v=A(d['axisV']);r=d['radiusM'];return A(d['centerM'])+r*(u*math.cos(ang)+v*math.sin(ang)),r*2*math.pi*(-u*math.sin(ang)+v*math.cos(ang))
 if kind in ('hair-side','hair-root'):
  sec=P[d['instance']]['section'];v=t if kind=='hair-side' else 0;u=d.get('u',t);sp,der=cv(d['spineCurveId'],v);wp,wd=profile(sec['widthProfile'],v);dp,dd=profile(sec['depthProfile'],v);aw=A(sec['axisWidth']);ad=A(sec['axisDepth']);w=sec['widthM'];dep=sec['depthM'];pos=sp+(u-.5)*w*wp*aw+4*u*(1-u)*dep*dp*ad
  vel=der+(u-.5)*w*wd*aw+4*u*(1-u)*dep*dd*ad if kind=='hair-side' else w*wp*aw+4*(1-2*u)*dep*dp*ad
  return pos,vel
 raise ValueError(kind)
NET=json.loads((SRC/'native-v63-preserved.json').read_text())['controlNets']
def native_eval(pid,u,v):
 net=A(NET[pid]);return np.einsum('i,j,jik->k',basis(u),basis(v),net),np.einsum('i,j,jik->k',dbasis(u),basis(v),net),np.einsum('i,j,jik->k',basis(u),dbasis(v),net)
def normal(cid,t):
 c=C[cid]
 if 'nativeConstraint' in c:
  nc=c['nativeConstraint'];a,b=nc['sourceRange'];s=b-(b-a)*t if nc['reversed'] else a+(b-a)*t;ed=nc['edge'];u,v=(int(ed[1]),s) if ed[0]=='u' else (s,int(ed[1]));_,du,dv=native_eval(nc['instance'],u,v);return unit(np.cross(du,dv))
 if 'skinNodeNormalIds' in c:
  a,b=c['skinNodeNormalIds'];n=(1-t)*A(NC[a]['normal'])+t*A(NC[b]['normal']);tt=unit(cv(cid,t)[1]);return unit(n-np.dot(n,tt)*tt)
 raise ValueError('no skin normal')
def bd(pid,s):
 loop=P[pid]['boundaryLoops'][0];q=(s%1)*len(loop);idx=int(q);e=loop[idx];u=q-idx;t=u if e['direction']==1 else 1-u;pos,tan=cv(e['curveId'],t);return pos,tan*e['direction']*len(loop),normal(e['curveId'],t)
def disk(pid,r,s,preserve=False):
 sp=P[pid]['surfaceRecipe'];g=A(sp['centerM']);b,bt,n=bd(pid,s);raw=b-g;d=raw-n*np.dot(n,raw)
 if np.linalg.norm(d)<1e-12:d=np.cross(n,unit(bt))*.03
 if preserve:d=unit(d)*np.linalg.norm(raw)
 tr=A(sp['centerAxisU'])*math.cos(s*2*math.pi)+A(sp['centerAxisV'])*math.sin(s*2*math.pi)
 return (2*r**3-3*r*r+1)*g+(r**3-2*r*r+r)*tr+(-2*r**3+3*r*r)*b+(r**3-r*r)*d

def run():
 start=time.perf_counter();results={};issues=[]
 actual_ids=set(P);v1=json.loads((ROOT/'docs/evidence/mira-reference-set-v64/head-assembly-registration/instances.json').read_text())['instances'];expected_ids={p['id'] for p in v1}|{'F21-L','F21-R'}
 results['coverage']={'instances':len(P),'types':len({p['type'] for p in P.values()}),'idDifference':sorted(actual_ids^expected_ids)}
 ends=[];directions=[];native=[];rows=[];ranks=[];normalpairs=[];wpairs=[]
 for pid,p in P.items():
  for li,loop in enumerate(p['boundaryLoops']):
   for e,nex in zip(loop,loop[1:]+loop[:1]):
    c=C[e['curveId']];cc=C[nex['curveId']];end=c['endpointIds'][1 if e['direction']==1 else 0];nstart=cc['endpointIds'][0 if nex['direction']==1 else 1]
    if end!=nstart:ends.append([pid,li,e['curveId'],nex['curveId'],end,nstart])
 for cid,c in C.items():
  trim=[o for o in c['owners'] if o.get('role')=='trim'];skin=[o for o in trim if P[o['instance']]['layer']=='skin']
  if len(skin)==2 and sum(o['direction'] for o in skin):directions.append(cid)
  for r in c['frameSamples']:
   p,t=cv(cid,r['t']);rows.append({'curveId':cid,'t':r['t'],'positionErrorM':float(np.linalg.norm(p-A(r['positionM']))),'tangentError':float(np.linalg.norm(unit(t)-A(r['tangent']))),'normalDotActualTangent':float(abs(np.dot(unit(t),A(r['normal']))))})
  if 'nativeConstraint' in c:
   nc=c['nativeConstraint'];a,b=nc['sourceRange'];ed=nc['edge']
   for t in np.linspace(0,1,17):
    st=b-(b-a)*t if nc['reversed'] else a+(b-a)*t;u,v=(int(ed[1]),st) if ed[0]=='u' else (st,int(ed[1]));pt,du,dv=native_eval(nc['instance'],u,v);native.append(float(np.linalg.norm(cv(cid,t)[0]-pt)))
 for nid,contract in NC.items():
  incident=[];normals=[];weights=[]
  for cid in contract['incidentCurveIds']:
   c=C[cid]
   for ei,nodeid in enumerate(c['endpointIds']):
    if nodeid!=nid:continue
    incident.append(unit(cv(cid,float(ei))[1]));r=c['frameSamples'][0 if ei==0 else -1];normals.append(A(r['normal']));weights.append(r['skinWeights'])
  sv=np.linalg.svd(A(incident),compute_uv=False);ranks.append({'nodeId':nid,'singularValues':sv.tolist(),'rank':int(sum(sv>1e-9))})
  normalpairs.extend(float(np.linalg.norm(a-b)) for a,b in itertools.combinations(normals,2));wpairs.extend(max(abs(a.get(k,0)-b.get(k,0)) for k in set(a)|set(b)) for a,b in itertools.combinations(weights,2))
 results['boundaries']={'brokenLoops':ends,'sameDirectionSkinPairs':directions,'maxPositionRowErrorM':max(r['positionErrorM'] for r in rows),'maxTangentRowError':max(r['tangentError'] for r in rows),'maxFrameNormalDotAnalyticTangent':max(r['normalDotActualTangent'] for r in rows),'maxNativeSubcurveErrorM':max(native),'maxIncidentTangentRank':max(r['rank'] for r in ranks),'maxEndpointNormalDifference':max(normalpairs),'maxEndpointWeightDifference':max(wpairs)}
 # Topology via independent edge counts and boundary graph connected components.
 skin={pid for pid,p in P.items() if p['layer']=='skin'};skinEdges={cid for cid,c in C.items() if any(o['instance'] in skin and o.get('role')=='trim' for o in c['owners'])};skinNodes={n for cid in skinEdges for n in C[cid]['endpointIds']};openids=[cid for cid in skinEdges if sum(o['instance'] in skin and o.get('role')=='trim' for o in C[cid]['owners'])==1];adj=collections.defaultdict(set)
 for cid in openids:a,b=C[cid]['endpointIds'];adj[a].add(b);adj[b].add(a)
 comps=[];visited=set()
 for n in adj:
  if n in visited:continue
  stack=[n];comp=[]
  while stack:
   a=stack.pop()
   if a in visited:continue
   visited.add(a);comp.append(a);stack.extend(adj[a]-visited)
  comps.append(sorted(comp))
 results['topology']={'skinFaces':len(skin),'edges':len(skinEdges),'nodes':len(skinNodes),'euler':len(skinNodes)-len(skinEdges)+len(skin),'openBoundaryComponents':comps,'openNodeDegrees':dict(collections.Counter(len(v) for v in adj.values()))}
 # Exact boundary normal orientation of the declared Hermite surface derivative.
 flips=[];surfacecases=[]
 for pid,p in P.items():
  if p.get('surfaceRecipe',{}).get('kind')!='boundary-Hermite-disk':continue
  signs=[];g=A(p['surfaceRecipe']['centerM'])
  for ei,e in enumerate(p['boundaryLoops'][0]):
   for t in [.01,.1,.25,.5,.75,.9,.99]:
    b,bt=cv(e['curveId'],t);bt*=e['direction'];n=normal(e['curveId'],t);dd=b-g;dd-=n*np.dot(dd,n);sg=float(np.dot(np.cross(dd,bt),n));sample={'curveId':e['curveId'],'t':t,'signedBoundaryJacobian':sg,'positionM':b.tolist(),'radialDerivativeM':dd.tolist(),'normal':n.tolist()};signs.append(sample)
  positive=[x for x in signs if x['signedBoundaryJacobian']>1e-10];negative=[x for x in signs if x['signedBoundaryJacobian']<-1e-10]
  if positive and negative:flips.append({'instance':pid,'positive':max(positive,key=lambda x:x['signedBoundaryJacobian']),'negative':min(negative,key=lambda x:x['signedBoundaryJacobian'])})
  surfacecases.append({'instance':pid,'min':min(x['signedBoundaryJacobian'] for x in signs),'max':max(x['signedBoundaryJacobian'] for x in signs)})
 results['declaredDiskBoundaryOrientation']={'flippedInstances':flips,'sampledFaces':len(surfacecases),'allExtrema':surfacecases,'meaning':'At r=1 the exact radial derivative is D; a sign reversal relative to the canonical normal within one patch prevents a consistently oriented regular skin patch under this declared evaluator.'}
 if flips:issues.append({'id':'HREV-01','severity':'blocking numerical surface consistency','summary':'Declared Hermite interiors reverse orientation against their own canonical boundary normal','instances':[x['instance'] for x in flips],'witness':flips[0]})
 # Root support: interpret both the written magnitude-preserving derivative and actual producer algebra.
 rootrows=[]
 for root in D['hairRoots']:
  pid=root['support'];r,s=root['supportChartUV'];stored=A(root['supportPositionM']);ascode=disk(pid,r,s,False);asspec=disk(pid,r,s,True);rootrows.append({'id':root['id'],'support':pid,'r':r,'s':s,'generatorAlgebraResidualM':float(np.linalg.norm(ascode-stored)),'writtenMagnitudePreservingResidualM':float(np.linalg.norm(asspec-stored)),'clearanceM':float(np.linalg.norm(A(root['positionM'])-stored)),'matrixDeterminant':float(np.linalg.det(A(root['rootMatrixRowMajor']).reshape(4,4)[:3,:3]))})
 results['hairRoots']=rootrows
 worst=max(rootrows,key=lambda x:x['writtenMagnitudePreservingResidualM'])
 if worst['writtenMagnitudePreservingResidualM']>1e-6:issues.append({'id':'HREV-02','severity':'blocking reproducibility ambiguity','summary':'surfaceRecipe says projection magnitude is preserved; producer surface_value does not renormalize D, so one registry has two different surfaces','witness':worst})
 # Eye rim distances; pole validity is independently calculated from real curve.
 eyes=[]
 for cid,c in C.items():
  if c['kind']!='sphere-projected-bezier-xy':continue
  d=c['definition'];ct=A(d['centerM']);rad=d['radiusM'];minarg=1e9;gaps=[]
  for t in np.linspace(0,1,201):
   p,_=cv(cid,t);xy=p[:2]-ct[:2];minarg=min(minarg,rad*rad-np.dot(xy,xy));gaps.append(np.linalg.norm(p-ct)-rad)
  eyes.append({'curveId':cid,'minSphereRadicandM2':float(minarg),'radialGapMm':[float(min(gaps)*1000),float(max(gaps)*1000)]})
 results['eyeRims']=eyes
 # Interior neck transition isn't a Hermite disk and upper normal constraints must be met by actual loft.
 neck=[]
 for pid in ['N01','N02']:
  p=P[pid];ids=p['surfaceRecipe']['upperContourCurveIds'];edges=[e for e in p['boundaryLoops'][0] if e['curveId'] in ids]
  for i,e in enumerate(edges):
   t=.5;b,bt=cv(e['curveId'],t);n=normal(e['curveId'],t);u=(i+.5)/len(edges)
   # Both possible front-half angular traversals must be considered; no chosen sign hides incompatibility.
   candidates=[]
   for reverse in [False,True]:
    theta=(-math.pi/2+math.pi*u) if pid=='N01' else (math.pi/2+math.pi*u)
    if reverse:theta=(-math.pi/2+math.pi*(1-u)) if pid=='N01' else (math.pi/2+math.pi*(1-u))
    lower=A([.078*math.sin(theta),-.100,.076*math.cos(theta)]);dv=b-lower;candidates.append(float(abs(np.dot(unit(dv),n))))
   neck.append({'instance':pid,'curveId':e['curveId'],'midpointM':b.tolist(),'minAbsNormalDotLinearLoftDirectionBothTraversals':min(candidates)})
 results['neckUpperLinearLoft']=neck
 if max(x['minAbsNormalDotLinearLoftDirectionBothTraversals'] for x in neck)>1e-3:issues.append({'id':'HREV-03','severity':'blocking normal contract not implemented','summary':'Declared upper-neck linear loft does not satisfy its canonical upper-contour normal; both angular traversals fail','witness':max(neck,key=lambda x:x['minAbsNormalDotLinearLoftDirectionBothTraversals'])})
 results['issues']=issues;results['candidateSHA']='fd5e1335bc224b040aa923374807ddcc9ffe5883';results['independence']='No author verify/check result used; standalone analytic evaluation and incidence/rank/orientation oracles';results['elapsedSeconds']=time.perf_counter()-start
 (OUT/'FINDINGS.json').write_text(json.dumps(results,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'coverage':results['coverage'],'boundaries':results['boundaries'],'topology':results['topology'],'issues':issues,'elapsedSeconds':results['elapsedSeconds']},ensure_ascii=False))
if __name__=='__main__':run()
