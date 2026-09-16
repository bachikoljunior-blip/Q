#!/usr/bin/env python3
"""Compile licensed hm08 morph offsets onto the unchanged registered Q head LOD.
No mesh simplification, UV edit, new bone, skin image or demographic inference.
"""
from pathlib import Path
import ast,json,re,hashlib,time
import numpy as np
start=time.perf_counter();ROOT=Path(__file__).resolve().parents[2];ASSETS=ROOT/'src/assets/characters'
reference=ROOT/'scripts/characters/generate-anatomical-head.py'
base_provenance=json.loads((ASSETS/'anatomical-head-provenance.json').read_text())
assert hashlib.sha256(reference.read_bytes()).hexdigest()==base_provenance['generatorSha256']
assert hashlib.sha256((ASSETS/'anatomical-head-data.js').read_bytes()).hexdigest()==base_provenance['outputSha256']
# Reuse the exact existing registration/collar and full-source topology stage;
# stop before quadrics/LOD/output. This source remains independently hashed.
ns={'__file__':str(reference)};exec(compile(reference.read_text().split('# Plane quadrics')[0],str(reference),'exec'),ns)
head=(ASSETS/'anatomical-head-data.js').read_text()
def array(name):return np.array(json.loads(re.search(r'export const '+name+r' = (.*);',head).group(1)))
A=array('HEAD_ATTRIBUTES');I=array('HEAD_INDICES').reshape(-1,3);S=array('HEAD_SOURCE_IDS').astype(int)
pos=ns['positions'];ids=ns['ids'];source=np.array(ns['verts']);tri=np.array(list(ns['faces'].values()))
protected={v for f,t in ns['faces'].items()if ns['fregion'][f]!=0 for v in t}
protected|={v for v in ids if pos[v,1]<=-.105 or pos[v,1]>=.085 or abs(pos[v,0])>=.115 or pos[v,2]<=.015}
protected_points=pos[sorted(protected)];weight=np.zeros(len(pos))
for v in ids:
 d=float(np.sqrt(((protected_points-pos[v])**2).sum(axis=1).min()));x,y,z=pos[v]
 weight[v]=1
 for q in [d/.012,(.115-abs(x))/.025,(z-.015)/.04,(.085-y)/.04,(y+.105)/.03]:
  q=max(0,min(1,q));weight[v]*=q*q*(3-2*q)
def normals(p,t):
 n=np.zeros_like(p);cross=np.cross(p[t[:,1]]-p[t[:,0]],p[t[:,2]]-p[t[:,0]])
 for c in range(3):np.add.at(n,t[:,c],cross)
 lengths=np.linalg.norm(n,axis=1);return n/np.maximum(lengths[:,None],1e-15)
base_n=normals(pos,tri);lod_pos=pos.copy();lod_ids=S.copy();lod_ids[S<0]=len(pos)-1
for i,v in enumerate(lod_ids):lod_pos[v]=A[i,:3]
lod_tri=lod_ids[I];lod_n=normals(lod_pos,lod_tri)
inputs=[('head-oval','head','a17cd3a600588a344babe520fbd4d4edcb096db3328051fe692dfb997a1a678d'),('nose-scale-horiz-incr','nose','cc319e3ddb0523fa2b563dcfc840cf2f915a890abe5612009a0becebecd3c5ae'),('chin-width-incr','chin','deef506bfe1883d9d4c38667332c9970785226566efbae4724fd3d60c02efcf4')]
# Authored combinations describe shapes only, not ages, genders or real people.
roles={'npc':[.55,.35,0],'sena':[.25,0,.25],'smith':[0,.6,.55],'healer':[.75,0,0]}
bases=[];sources=[];basis_d=[]
for name,folder,expected in inputs:
 path=ASSETS/'sources'/f'{name}.target';raw=path.read_bytes();assert hashlib.sha256(raw).hexdigest()==expected
 delta=np.zeros_like(pos);rows=0
 for line in raw.decode().splitlines():
  if not line or line.startswith('#'):continue
  t=line.split();v=int(t[0]);rows+=1
  if v not in ids or weight[v]==0:continue
  shifted=source[v]+np.array(list(map(float,t[1:])))
  mapped=np.array([ns['curve'](shifted[a],*ns['anchors'][a])for a in range(3)])
  original=np.array([ns['curve'](source[v,a],*ns['anchors'][a])for a in range(3)])
  delta[v]=(mapped-original)*weight[v]
 dn=normals(pos+delta,tri)-base_n;ldn=normals(lod_pos+delta,lod_tri)-lod_n
 compiled=[]
 for i,v in enumerate(lod_ids):
  n=dn[v]if np.dot(A[i,3:6],base_n[v])>.999999 else ldn[v]
  values=[*np.rint(delta[v]*1e6).astype(int),*np.rint(n*1e5).astype(int)]
  if any(values):compiled.append([i,*map(int,values)])
 bases.append(compiled);basis_d.append(delta)
 sources.append({'file':f'sources/{name}.target','url':f'https://raw.githubusercontent.com/makehumancommunity/makehuman/a8bc2d54ff0ac92e78ff71431b1023eda42bf482/makehuman/data/targets/{folder}/{name}.target','bytes':len(raw),'sha256':expected,'gitBlobSha1':hashlib.sha1(f'blob {len(raw)}\0'.encode()+raw).hexdigest(),'license':'CC0-1.0','sourceRows':rows,'compiledRows':len(compiled),'maxPositionDeltaM':float(np.linalg.norm(delta,axis=1).max())})
output=ROOT/'docs/evidence/face-identity-v31-basis.js'
body=('// Generated from CC0 hm08 targets; unchanged topology and original UV.\nexport const FACE_IDENTITY_BASIS = '+json.dumps(bases,separators=(',',':'))+';\nexport const FACE_IDENTITIES = '+json.dumps(roles,separators=(',',':'))+';\n')
distance_function=next(n for n in ast.parse(reference.read_text()).body if isinstance(n,ast.FunctionDef) and n.name=='distance_points_triangles')
measure={'np':np};exec(compile(ast.Module(body=[distance_function],type_ignores=[]),str(reference),'exec'),measure)
role_stats={}
for role,co in roles.items():
 p=A[:,:3].copy();n=A[:,3:6].copy()
 for c,b in zip(co,bases):
  for i,x,y,z,nx,ny,nz in b:p[i]+=np.array([x,y,z])*c/1e6;n[i]+=np.array([nx,ny,nz])*c/1e5
 n/=np.linalg.norm(n,axis=1)[:,None];dist=np.linalg.norm(p-A[:,:3],axis=1);cross=np.cross(p[I[:,1]]-p[I[:,0]],p[I[:,2]]-p[I[:,0]]);oldcross=np.cross(A[I[:,1],:3]-A[I[:,0],:3],A[I[:,2],:3]-A[I[:,0],:3]);cos=(cross*oldcross).sum(axis=1)/(np.linalg.norm(cross,axis=1)*np.linalg.norm(oldcross,axis=1));normaldot=(n[I].mean(axis=1)*cross).sum(axis=1)
 oldnormaldot=(A[I,3:6].mean(axis=1)*oldcross).sum(axis=1)
 assert cos.min()>.75 and not np.any((normaldot<=0)&(oldnormaldot>0)),(role,cos.min(),normaldot.min())
 source_candidate=pos+sum(c*d for c,d in zip(co,basis_d));distances=measure['distance_points_triangles'](source_candidate[ids],p[I[:1500]])
 source_gate=bool(distances.max()<.0075 and np.quantile(distances,.95)<.0021)
 role_stats[role]={'passesSourceDistanceGate':source_gate,'sourceVertexDistanceM':{'max':float(distances.max()),'p95':float(np.quantile(distances,.95)),'samples':len(ids)},'coefficients':co,'changedRenderPositions':int(sum(dist>0)),'maxPositionDeltaM':float(dist.max()),'rmsPositionDeltaM':float(np.sqrt((dist*dist).mean())),'bounds':[p.min(axis=0).tolist(),p.max(axis=0).tolist()],'minimumTriangleNormalDot':float(cos.min()),'backwardMeanVertexNormals':int(sum(normaldot<=0)),'inheritedBackwardMeanVertexNormals':int(sum(oldnormaldot<=0)),'newBackwardMeanVertexNormals':int(sum((normaldot<=0)&(oldnormaldot>0)))}
output.write_text(body)
provenance={'schemaVersion':1,'origin':'Authored role shape combinations of official CC0 MakeHuman hm08 target deltas; not a scan, likeness, age or gender inference.','sourceMesh':{'file':'sources/makehuman-hm08.obj','sha256':hashlib.sha256((ASSETS/'sources/makehuman-hm08.obj').read_bytes()).hexdigest()},'baseHead':{'file':'anatomical-head-data.js','sha256':hashlib.sha256(head.encode()).hexdigest()},'registrationRecipe':{'file':'scripts/characters/generate-anatomical-head.py','sha256':hashlib.sha256(reference.read_bytes()).hexdigest()},'generator':{'file':'scripts/characters/generate-face-identities.py','sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest()},'output':{'file':output.name,'sha256':hashlib.sha256(output.read_bytes()).hexdigest(),'bytes':output.stat().st_size},'sources':sources,'application':{'basisOrder':[x[0]for x in inputs],'positionQuantizationM':1e-6,'normalQuantization':1e-5,'method':'Register each original vertex plus target offset through the unchanged Q axis curves; subtract registered original, fade around protected surfaces; role scalar blend. Normal deltas come from deformed full-source smooth normals, or LOD normals where the base used its fold/cap fallback. Normalize after role blending.','protectedSourceVertices':len(protected),'protection':'All original inner-eye/mouth/collar surfaces, y<=-0.105, y>=0.085, abs(x)>=0.115, z<=0.015 fixed; smoothstep over 0.012m distance to protected vertices, multiplied by continuous boundary fades: lateral 0.025m, depth/top 0.04m, bottom 0.03m. All positions in registered head-local metres. UV seam instances get identical position offsets.','unchanged':'Head indices, 1546 triangles, 1012 render vertices, original UV corners, head/eye/lid/neck bones, clothing, materials and all motion clocks. Player and non-listed roles use the base shape.'},'roles':role_stats,'qualityBoundary':'CPU geometry and projection checks do not establish rendered identity, anatomical likeness, GPU performance or PS4 quality.'}
(ROOT/'docs/evidence/face-identity-v31-basis-provenance.json').write_text(json.dumps(provenance,indent=2)+'\n')
print(json.dumps({'seconds':time.perf_counter()-start,'outputBytes':output.stat().st_size,'sources':sources,'roles':role_stats},indent=2))
