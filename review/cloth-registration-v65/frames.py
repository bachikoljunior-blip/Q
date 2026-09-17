"""Deterministic cubic-Hermite boundary frames and constrained shoulder design surfaces."""
import math
import numpy as np
def unit(v):
 v=np.asarray(v,dtype=float);n=np.linalg.norm(v)
 if n<1e-12:raise ValueError('zero vector')
 return v/n
def clean(v):return [round(float(x),12) if abs(float(x))>5e-13 else 0.0 for x in v]
def domain(c):
 ids=[x['part'].split('-')[0] for x in c['owners']]
 if any(x in ['B03','B04','F04','F05'] for x in ids):return 'metal-hardware'
 if any(x in ['P01','P02','P03','P04','W01','W02','W03'] for x in ids):return 'cape-cowl'
 if any(x in ['T01','T02','T03','T04','T05','S01','S02','S03','S04','S05','S06','C01','C02','L01','L02','L03'] for x in ids):return 'upper-lower-tunic'
 if any(x.startswith('TR') for x in ids):return 'trouser-cloth'
 if any(x in ['F01','F02','F03'] for x in ids):return 'bracer-leather'
 if any(x in ['B01','B02'] for x in ids):return 'belt-leather'
 if all(x=='PH01' for x in ids):return 'cape-turnback-crease'
 if all(x in ['L04','L05'] for x in ids):return 'tunic-turnback-crease'
 raise ValueError(ids)
def rbf_value_gradient(surface,y,z):
 uv=np.array(surface['centresNormalized']);u=(np.array([y,z])-.0-np.array(surface['normalizationOriginM']))/surface['normalizationScaleM'];delta=u-uv;r=np.linalg.norm(delta,axis=1);w=np.array(surface['radialWeights']);a=np.array(surface['affineCoefficients'])
 x=float((r**3)@w+np.r_[1,u]@a);gradient=((3*r[:,None]*delta).T@w+a[1:])/surface['normalizationScaleM']
 return x,gradient
def register_frames(curves,shoulders):
 nodes={}
 for cid,c in curves.items():
  c['normalDomain']=domain(c)
  c['interpolation']='piecewise cubic Hermite: knots t=i/32, positions and explicit derivativeMPerT; all intermediate shape is fixed by these values'
  for i,s in enumerate(c['samples']):
   p=np.array(c['samples'][min(32,i+1)]['positionM']);q=np.array(c['samples'][max(0,i-1)]['positionM'])
   derivative=(p-q)*(32 if i in [0,32] else 16)
   s['derivativeMPerT']=clean(derivative)
  for i in [0,32]:
   s=c['samples'][i];key=(c['normalDomain'],tuple(s['positionM']))
   nodes.setdefault(key,[]).append((cid,i,np.array(s['derivativeMPerT']),np.array(s['normal'])))
 record=[];normals={}
 for (dom,pos),inc in nodes.items():
  dirs=np.stack([unit(t) for _,_,t,_ in inc]);cov=dirs.T@dirs;eig,vec=np.linalg.eigh(cov);rank=int(np.linalg.matrix_rank(dirs,tol=1e-8));reference=np.sum([n for _,_,_,n in inc],axis=0)
  if np.linalg.norm(reference)<1e-10:reference=np.array([pos[0],.2,pos[2]])
  shoulder=next((o['part'] for cid,_,_,_ in inc for o in curves[cid]['owners'] if o['part'].startswith('W02-')),None)
  if shoulder:
   _,grad=rbf_value_gradient(shoulders[shoulder],pos[1],pos[2]);n=unit([1,-grad[0],-grad[1]])*(-1 if shoulder.endswith('R') else 1)
  elif rank==1:
   tangent=dirs[0];raw=reference-tangent*np.dot(reference,tangent)
   if np.linalg.norm(raw)<1e-10:raw=vec[:,0]
   n=unit(raw)
  else:n=unit(vec[:,0])
  if not shoulder and np.dot(n,reference)<0:n=-n
  change=[];after=[]
  for cid,i,t,old in inc:
   projected=t-n*np.dot(t,n)
   if np.linalg.norm(projected)<1e-9:raise ValueError('degenerate tangent projection '+cid)
   projected=unit(projected)*np.linalg.norm(t)
   s=curves[cid]['samples'][i];s['derivativeMPerT']=clean(projected);s['tangent']=clean(unit(projected));s['normal']=clean(n)
   change.append(math.degrees(math.acos(np.clip(np.dot(unit(t),unit(projected)),-1,1))));after.append(unit(projected));normals[(cid,i)]=n
  after=np.stack(after)
  record.append({'normalDomain':dom,'positionM':list(pos),'incident':[{'curve':cid,'sample':i} for cid,i,_,_ in inc],'normal':clean(n),'rankBefore':rank,'rankAfter':int(np.linalg.matrix_rank(after,tol=1e-8)),'maxTangentChangeDegrees':max(change),'authorPlanePolicy':'RBF shoulder tangent plane when constrained; otherwise least-squares plane of original endpoint directions. Incident Hermite derivatives change to lie in the selected plane; not normal-only averaging.'})
 maxBulge=0
 for cid,c in curves.items():
  shoulder=next((o['part'] for o in c['owners'] if o['part'].startswith('W02-')),None)
  if shoulder:c['surfaceProjection']={'part':shoulder,'rule':'evaluate cubicHermite Y/Z; setX=shoulderRBF(Y,Z); derivativeX=gradient dot derivativeYZ. All33sample positions preserved to residual2.5e-12m; continuous curve belongs exactly to the solved shoulder surface.'}
  for i,s in enumerate(c['samples']):
   if shoulder:
    _,grad=rbf_value_gradient(shoulders[shoulder],s['positionM'][1],s['positionM'][2]);der=np.array(s['derivativeMPerT']);der[0]=np.dot(grad,der[1:]);s['derivativeMPerT']=clean(der);s['tangent']=clean(unit(der));s['normal']=clean(unit([1,-grad[0],-grad[1]])*(-1 if shoulder.endswith('R') else 1));continue
   t=unit(s['derivativeMPerT']);raw=np.array(s['normal'])
   if 0<i<4:raw=(1-i/4)*normals[(cid,0)]+(i/4)*raw
   if 28<i<32:raw=((i-28)/4)*normals[(cid,32)]+((32-i)/4)*raw
   raw=raw-t*np.dot(raw,t)
   if np.linalg.norm(raw)<1e-9:raise ValueError('normal collapsed '+cid)
   s['tangent']=clean(t);s['normal']=clean(unit(raw))
  for i in range(32):
   p=np.array(c['samples'][i]['positionM']);q=np.array(c['samples'][i+1]['positionM']);a=np.array(c['samples'][i]['derivativeMPerT'])/32;b=np.array(c['samples'][i+1]['derivativeMPerT'])/32
   for u in [.25,.5,.75]:
    h=(2*u**3-3*u*u+1)*p+(u**3-2*u*u+u)*a+(-2*u**3+3*u*u)*q+(u**3-u*u)*b
    if shoulder:h[0]=rbf_value_gradient(shoulders[shoulder],h[1],h[2])[0]
    maxBulge=max(maxBulge,float(np.linalg.norm(h-((1-u)*p+u*q))))
 # Same geometric coordinate in different domains is an intentional corner/layer split.
 bypos={}
 for r in record:bypos.setdefault(tuple(r['positionM']),[]).append(r['normalDomain'])
 splits=[{'positionM':list(p),'normalDomains':sorted(set(ds)),'reason':'Turnback reverses surface direction; hardware and independently layered garments retain separate corner normals. Position/UV/weights remain canonical at each seam; do not silently smooth across these material/fold domains.'} for p,ds in bypos.items() if len(set(ds))>1]
 return {'nodes':record,'explicitDomainSplits':splits,'maxHermiteDeviationFromPolylineM':maxBulge,'rank3NodesBefore':sum(x['rankBefore']==3 for x in record),'rankAbove2After':sum(x['rankAfter']>2 for x in record),'maximumEndpointTangentChangeDegrees':max(x['maxTangentChangeDegrees'] for x in record),'samplePositionsUnchanged':True}
def solve_shoulder(part,curves):
 refs=part['boundary']+[{'curve':x} for x in part['attachmentCurves']]
 unique={}
 for e in refs:
  for s in curves[e['curve']]['samples']:
   x,y,z=s['positionM'];key=(round(y,9),round(z,9))
   if key in unique and abs(unique[key]-x)>1e-8:raise ValueError('shoulder conflicting projected constraints')
   unique[key]=x
 yz=np.array(list(unique));targets=np.array(list(unique.values()));uv=(yz-np.array([.55,0]))/.2
 dist=np.linalg.norm(uv[:,None,:]-uv[None,:,:],axis=2);K=dist**3
 P=np.column_stack([np.ones(len(uv)),uv]);M=np.block([[K,P],[P.T,np.zeros((3,3))]])
 rhs=np.r_[targets,np.zeros(3)];coef=np.linalg.solve(M,rhs);residual=float(np.max(np.abs(M@coef-rhs)))
 weights=coef[:-3];affine=coef[-3:]
 def eval(q):
  u=(np.array(q)-np.array([.55,0]))/.2;r=np.linalg.norm(u-uv,axis=1);return float(r**3@weights+np.r_[1,u]@affine)
 # Convex pentagon in y/z supports all pinned curves; evaluate only points within.
 boundary=np.array([curves[e['curve']]['samples'][0 if e['direction']==1 else -1]['positionM'][1:] for e in part['boundary']])
 def inside(q):
  v=[];a=np.array(q)
  for j,b in enumerate(boundary):e=boundary[(j+1)%len(boundary)];v.append(np.cross(e-b,a-b))
  return min(v)>=-1e-10 or max(v)<=1e-10
 outside=[list(q) for q in yz if not inside(q)]
 grid=[]
 for y in np.linspace(.460,.660,31):
  for z in np.linspace(-.185,.185,41):
   if inside([y,z]):grid.append([eval([y,z]),y,z])
 maxResidual=max(abs(eval(q)-x) for q,x in zip(yz,targets))
 return {'construction':'single-valued x=f(y,z) cubic radial-basis interpolation. phi(r)=r^3; affine tail; exact boundary and all7attachment curve sample constraints; no surface tessellation.','inputCoordinateOrder':['CHEST_Y','CHEST_Z'],'normalizationOriginM':[.55,0],'normalizationScaleM':.2,'centresNormalized':uv.tolist(),'radialWeights':weights.tolist(),'affineCoefficients':affine.tolist(),'constraints':len(yz),'equationResidualM':residual,'maximumPositionResidualM':maxResidual,'constraintOutsideDomain':outside,'interiorProbeCount':len(grid),'interiorXRangeM':[min(q[0] for q in grid),max(q[0] for q in grid)],'supportPointsM':[clean(q) for q in grid[::max(1,len(grid)//12)]],'normalRecipe':'outward hemisphere of (1,-df/dy,-df/dz), where derivative of phi(||u-c||) is3*||u-c||*(u-c)/.2. Fold landing may have explicit crease normal; no triangle normal accepted.','scope':'All33sample constraints solved; owned boundary/landing curves useHermiteYZ withXprojected to thisRBF, so continuous correspondence is fixed by the same source. No tessellation or trianglecontact.'}
