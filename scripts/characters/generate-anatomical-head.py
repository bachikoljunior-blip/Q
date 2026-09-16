#!/usr/bin/env python3
"""Deterministic CC0 hm08 head subset, anatomical registration and feature-locked LOD.
Offline asset tooling only. No MakeHuman application code or runtime dependency.
"""
from pathlib import Path
import json, hashlib, math, heapq, time, base64
from collections import defaultdict, Counter
import numpy as np
ROOT=Path(__file__).resolve().parents[2]
SOURCE=ROOT/'src/assets/characters/sources/makehuman-hm08.obj'
OUT=ROOT/'src/assets/characters/anatomical-head-data.js'
PROVENANCE=ROOT/'src/assets/characters/anatomical-head-provenance.json'
start=time.perf_counter();raw=SOURCE.read_bytes()
assert hashlib.sha256(raw).hexdigest()=='8e761e6624b8f54536409135d1636da63b32486a90d4897f84e121d144f6fb4c'
verts=[];uvs=[];quads=[];group=''
for line in raw.decode().splitlines():
 s=line.split()
 if not s:continue
 if s[0]=='v':verts.append(list(map(float,s[1:4])))
 elif s[0]=='vt':uvs.append(list(map(float,s[1:3])))
 elif s[0]=='g':group=s[1]
 elif s[0]=='f' and group=='body':
  vs=[int(t.split('/')[0])-1 for t in s[1:]];us=[int(t.split('/')[1])-1 for t in s[1:]]
  if min(verts[v][1]for v in vs)>=6:quads.append((vs,us))
# Connected UV islands remain distinct and are packed with an explicit gutter.
uadj=defaultdict(set)
for vs,us in quads:
 for a,b in zip(us,us[1:]+us[:1]):uadj[a].add(b);uadj[b].add(a)
regions={};components=[]
for seed in sorted(uadj):
 if seed in regions:continue
 n=len(components);todo=[seed];component=[]
 while todo:
  u=todo.pop()
  if u in regions:continue
  regions[u]=n;component.append(u);todo.extend(sorted(uadj[u],reverse=True))
 components.append(component)
# Regions are sorted by geometric source area/count for stable atlas rectangles.
order=sorted(range(len(components)),key=lambda r:-len(components[r]));remap={r:i for i,r in enumerate(order)}
regions={u:remap[r]for u,r in regions.items()};components=[components[r]for r in order]
def curve(q,x,y):
 h=np.diff(x);d=np.diff(y)/h;m=[d[0]]
 for i in range(1,len(x)-1):
  w1=2*h[i]+h[i-1];w2=h[i]+2*h[i-1];m.append((w1+w2)/(w1/d[i-1]+w2/d[i])if d[i-1]*d[i]>0 else 0)
 m.append(d[-1])
 if q<x[0]:return y[0]+(q-x[0])*m[0]
 if q>x[-1]:return y[-1]+(q-x[-1])*m[-1]
 i=next((i for i in range(len(h))if x[i]<=q<=x[i+1]),len(h)-1);t=(q-x[i])/h[i]
 return (2*t**3-3*t*t+1)*y[i]+(t**3-2*t*t+t)*h[i]*m[i]+(-2*t**3+3*t*t)*y[i+1]+(t**3-t*t)*h[i]*m[i+1]
anchors=[([-.8793,-.30775,0,.30775,.8793],[-.142,-.046,0,.046,.142]),([6.1555,7.28415,8.4913],[-.116,.05,.198]),([-.3916,1.24535,1.6807],[-.112,.100,.1431492567062378])]
ids=sorted({v for vs,us in quads for v in vs});positions=np.zeros((len(verts)+1,3))
for v in ids:positions[v]=[curve(verts[v][i],*anchors[i])for i in range(3)]
# Tuck only the last neck collar into the existing separate closed neck. The
# continuous upper neck remains source anatomy; the hidden cap is below it.
edgecounts=Counter(tuple(sorted((a,b)))for vs,us in quads for a,b in zip(vs,vs[1:]+vs[:1]));boundary={v for e,n in edgecounts.items()if n==1 for v in e}
for v in ids:
 amount=max(0,min(1,(6.32-verts[v][1])/.32));amount=amount*amount*(3-2*amount)
 x,y,z=positions[v];rad=(x/.08)**2+(z/.078)**2;limit=max(.05,.81-((y+.142)/.12)**2)
 if rad>limit:
  factor=math.sqrt(limit/rad);positions[v,0]*=1-amount*(1-factor);positions[v,2]*=1-amount*(1-factor)
# Boundary is fully inside the existing neck, independent of irregular ring Y.
for v in boundary:
 x,y,z=positions[v];rad=(x/.08)**2+(z/.078)**2;limit=max(.05,.28-((y+.142)/.12)**2)
 if rad>limit:
  factor=math.sqrt(limit/rad);positions[v,0]*=factor;positions[v,2]*=factor
faces={};fregion={};vu=defaultdict(dict);incident=defaultdict(set)
for vs,us in quads:
 r=regions[us[0]]
 for v,u in zip(vs,us):vu[v][r]=u
 for tri in [(vs[0],vs[1],vs[2]),(vs[0],vs[2],vs[3])]:
  f=len(faces);faces[f]=tri;fregion[f]=r
  for v in tri:incident[v].add(f)
original_faces=np.array(list(faces.values()),dtype=np.int32);original_positions=positions.copy()
locked=set(boundary)|{v for v in ids if len(vu[v])>1}
def contour(points, axes, step, maximize):
 cells={}
 for v in points:
  key=tuple(math.floor(verts[v][a]/step)for a in axes)
  if key not in cells or maximize(v)>maximize(cells[key]):cells[key]=v
 return set(cells.values())
outer={v for v in ids if 0 in vu[v]}
feature_groups={
 'nose_ridges':contour([v for v in outer if abs(verts[v][0])<.14 and 6.74<verts[v][1]<7.18 and verts[v][2]>1.43],(0,1),.065,lambda v:verts[v][2]),
 'lip_contours':contour([v for v in outer if abs(verts[v][0])<.30 and 6.49<verts[v][1]<6.72 and verts[v][2]>1.42],(0,1),.065,lambda v:verts[v][2]),
 'ear_ridges':contour([v for v in outer if abs(verts[v][0])>.76],(1,2),.09,lambda v:abs(verts[v][0])),
 'front_side_silhouette':set(),
 'extrema':{min(ids,key=lambda v:positions[v,a])for a in range(3)}|{max(ids,key=lambda v:positions[v,a])for a in range(3)}
}
for axis in [0,2]:
 for sign in [-1,1]:feature_groups['front_side_silhouette'].update(contour(outer,(1,),.085,lambda v:sign*verts[v][axis]))
for group in feature_groups.values():locked.update(group)
# Plane quadrics are accumulated only from registered source faces. Endpoints
# stay on the source: no unconstrained averaging through eyes, ears or lips.
Q=np.zeros((len(verts)+1,4,4))
for tri in faces.values():
 a,b,c=positions[list(tri)];n=np.cross(b-a,c-a);length=np.linalg.norm(n)
 if length<1e-12:continue
 n/=length;plane=np.r_[n,-np.dot(n,a)];quad=np.outer(plane,plane)
 for v in tri:Q[v]+=quad
alive=set(ids);version=defaultdict(int);heap=[]
def neighbours(v):return {w for f in incident[v]for w in faces[f]if w!=v}
def push(a,b):
 if a==b or a not in alive or b not in alive or(a in locked and b in locked):return
 a,b=sorted((a,b));options=[a]if a in locked else [b]if b in locked else [a,b];q=Q[a]+Q[b]
 keep=min(options,key=lambda v:(float(np.r_[positions[v],1]@q@np.r_[positions[v],1]),v));cost=max(0,float(np.r_[positions[keep],1]@q@np.r_[positions[keep],1]))
 heapq.heappush(heap,(cost,a,b,keep,version[a],version[b]))
for a,b in edgecounts:push(a,b)
# Add diagonal triangle edges as well, except protected UV/feature seams.
for tri in faces.values():
 for a,b in zip(tri,tri[1:]+tri[:1]):push(a,b)
collapses=0;rejected=Counter();target=1450
while len(faces)>target and heap:
 cost,a,b,keep,va,vb=heapq.heappop(heap)
 if a not in alive or b not in alive or version[a]!=va or version[b]!=vb:continue
 drop=b if keep==a else a;shared=incident[a]&incident[b]
 if len(shared)!=2 or(neighbours(a)&neighbours(b))!={v for f in shared for v in faces[f]if v not in (a,b)}:rejected['topology']+=1;continue
 changed=incident[drop]-shared;ok=True
 for f in changed:
  r=fregion[f]
  if r not in vu[keep]:ok=False;break
  tri=faces[f];new=tuple(keep if v==drop else v for v in tri);pa=positions[list(tri)];pb=positions[list(new)];na=np.cross(pa[1]-pa[0],pa[2]-pa[0]);nb=np.cross(pb[1]-pb[0],pb[2]-pb[0]);den=np.linalg.norm(na)*np.linalg.norm(nb)
  if den<1e-13 or np.dot(na,nb)/den<.45:ok=False;break
 if not ok:rejected['fold_or_uv']+=1;continue
 touched=neighbours(a)|neighbours(b)|{keep}
 for f in list(incident[drop]):
  old=faces[f]
  for v in old:incident[v].discard(f)
  if f in shared:del faces[f];continue
  new=tuple(keep if v==drop else v for v in old);faces[f]=new
  for v in new:incident[v].add(f)
 alive.remove(drop);Q[keep]+=Q[drop];collapses+=1
 for v in touched:version[v]+=1
 for v in touched:
  if v in alive:
   for w in neighbours(v):push(v,w)
assert len(faces)<=target,f'Feature-locked LOD cannot meet budget: {len(faces)}'
# A consistently oriented cap closes the retained 46-edge source neck ring.
boundary_directed=[]
for f,tri in faces.items():
 for a,b in zip(tri,tri[1:]+tri[:1]):
  if a in boundary and b in boundary and edgecounts.get(tuple(sorted((a,b))))==1:boundary_directed.append((a,b))
assert len(boundary_directed)==46
cap=len(verts);positions[cap]=np.mean(positions[sorted(boundary)],axis=0);alive.add(cap)
for a,b in boundary_directed:
 f=max(faces)+1;faces[f]=(b,a,cap);fregion[f]=5
# Smooth normals are calculated on welded positions, before UV duplication.
normals=np.zeros_like(positions)
for tri in faces.values():
 a,b,c=positions[list(tri)];n=np.cross(b-a,c-a)
 for v in tri:normals[v]+=n
lengths=np.linalg.norm(normals,axis=1);normals[lengths>0]/=lengths[lengths>0,None]
# Retain registered source-surface normals where they face every surviving
# incident triangle; avoid introducing faceting merely because hidden planes
# were removed. Neck cap and unsafe sharp folds retain final topology normals.
source_normals=np.zeros_like(positions)
for tri in original_faces:
 a,b,c=original_positions[tri];n=np.cross(b-a,c-a)
 for v in tri:source_normals[v]+=n
sl=np.linalg.norm(source_normals,axis=1);source_normals[sl>0]/=sl[sl>0,None]
transferred_normals=0
for v in sorted(alive-boundary-{cap}):
 safe=True
 for f in incident[v]:
  tri=faces[f];a,b,c=positions[list(tri)];n=np.cross(b-a,c-a);length=np.linalg.norm(n)
  if length and np.dot(n/length,source_normals[v])<.05:safe=False;break
 if safe:normals[v]=source_normals[v];transferred_normals+=1
# Five UV islands: preserve source orientation; gutters separate future crops.
rects=[(.02,.02,.66,.96),(.71,.02,.27,.19),(.71,.26,.12,.18),(.86,.26,.12,.18),(.71,.50,.27,.15)]
uv_bounds=[np.array([uvs[u]for u in comp])for comp in components];uv_bounds=[(x.min(axis=0),x.max(axis=0))for x in uv_bounds]
render=[];render_lookup={};index=[];source_map=[]
for f,tri in sorted(faces.items()):
 r=fregion[f]
 for v in tri:
  key=(v,r)
  if key not in render_lookup:
   render_lookup[key]=len(render);source_map.append(v if v!=cap else -1)
   if r==5:uv=[.85,.8]
   else:
    lo,hi=uv_bounds[r];u=(np.array(uvs[vu[v][r]])-lo)/(hi-lo);x,y,w,h=rects[r];uv=[x+u[0]*w,y+u[1]*h]
   render.append([*positions[v],*normals[v],*uv])
  index.append(render_lookup[key])
attributes=np.array(render,dtype='<f4');indices=np.array(index,dtype='<u2')
# Readable generated numeric arrays compress well; no fetch, decoder, or fourth chunk.
body='// Generated by scripts/characters/generate-anatomical-head.py. CC0 MakeHuman hm08 derivative.\n'
body+='export const HEAD_ATTRIBUTES = '+json.dumps(np.round(attributes.astype(float),7).tolist(),separators=(',',':'))+';\n'
body+='export const HEAD_INDICES = '+json.dumps(indices.tolist(),separators=(',',':'))+';\n'
body+='export const HEAD_SOURCE_IDS = '+json.dumps(source_map,separators=(',',':'))+';\n'
OUT.write_text(body)
# Quantify reference-to-LOD vertex distance using exact point/triangle projection.
# Report sampled reference vertices; this is not a continuous Hausdorff bound.
def distance_points_triangles(points,triangles):
 result=[]
 for p in points:
  a,b,c=triangles[:,0],triangles[:,1],triangles[:,2];ab=b-a;ac=c-a;ap=p-a
  d00=np.sum(ab*ab,axis=1);d01=np.sum(ab*ac,axis=1);d11=np.sum(ac*ac,axis=1);d20=np.sum(ap*ab,axis=1);d21=np.sum(ap*ac,axis=1);den=d00*d11-d01*d01
  v=(d11*d20-d01*d21)/np.maximum(den,1e-30);w=(d00*d21-d01*d20)/np.maximum(den,1e-30);project=a+v[:,None]*ab+w[:,None]*ac;ds=np.sum((project-p)**2,axis=1);ds[(v<0)|(w<0)|(v+w>1)]=np.inf
  for q,r in [(a,b),(b,c),(c,a)]:
   edge=r-q;t=np.clip(np.sum((p-q)*edge,axis=1)/np.maximum(np.sum(edge*edge,axis=1),1e-30),0,1);ds=np.minimum(ds,np.sum((q+t[:,None]*edge-p)**2,axis=1))
  result.append(float(np.sqrt(ds.min())))
 return np.array(result)
trilist=np.array([positions[list(tri)]for f,tri in faces.items()if fregion[f]!=5]);distances=distance_points_triangles(original_positions[ids],trilist)
retained=sorted(alive-boundary-{cap});angles=np.degrees(np.arccos(np.clip(np.sum(source_normals[retained]*normals[retained],axis=1),-1,1)))
reverse=distance_points_triangles(trilist.mean(axis=1),original_positions[original_faces])
provenance={'schemaVersion':1,'asset':'anatomical-head-data.js','origin':'Artist-authored MakeHuman hm08 CC0 graphical base mesh; Q head-only registered, feature-locked LOD derivative. Not a scan, photograph or mocap.','source':{'file':'sources/makehuman-hm08.obj','url':'https://raw.githubusercontent.com/makehumancommunity/makehuman/a8bc2d54ff0ac92e78ff71431b1023eda42bf482/makehuman/data/3dobjs/base.obj','bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest(),'license':'CC0-1.0','licenseFile':'sources/MAKEHUMAN-LICENSE-ASSETS.md'},'generator':'scripts/characters/generate-anatomical-head.py','generatorSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'outputBytes':OUT.stat().st_size,'outputSha256':hashlib.sha256(OUT.read_bytes()).hexdigest(),'registrationAnchors':anchors,'sourceHead':{'quads':len(quads),'triangles':len(original_faces),'vertices':len(ids),'neckBoundary':len(boundary)},'lod':{'surfaceTriangles':len(faces)-46,'capTriangles':46,'totalTriangles':len(faces),'renderVertices':len(render),'collapses':collapses,'lockedVertices':len(locked),'protectedGroups':{k:len(v)for k,v in feature_groups.items()},'uvIslandCount':5,'atlasRectangles':rects,'sourceVertexDistanceM':{'max':float(distances.max()),'p95':float(np.quantile(distances,.95)),'mean':float(distances.mean()),'samples':len(distances),'boundary':'Exact distances from all registered AND collar-fitted source vertices to LOD triangles. Registration/collar deformation of original MakeHuman is separate; not a continuous Hausdorff bound or perceptual proof.'}},'normalStrategy':{'method':'Registered source smooth normals at retained source IDs if they face every surviving incident triangle; final mesh normals at neck cap or sharp folds.','sourceNormalsTransferred':transferred_normals},'normalComparison':{'samples':len(retained),'meanDegrees':float(angles.mean()),'p95Degrees':float(np.quantile(angles,.95)),'maxDegrees':float(angles.max()),'boundary':'Same retained source vertex smooth normals; excludes capped neck boundary. Not a rendered shading test.'},'candidateCentroidToSourceDistanceM':{'samples':len(reverse),'max':float(reverse.max()),'p95':float(np.quantile(reverse,.95))},'archivedUnappliedSources':[{'file':'sources/'+n,'bytes':(SOURCE.parent/n).stat().st_size,'sha256':hashlib.sha256((SOURCE.parent/n).read_bytes()).hexdigest()}for n in ['head-age-incr.target','head-oval.target','MAKEHUMAN-LICENSE-ASSETS.md']],'texture':{'status':'unverified/not included','expectedSourceDiffuseBytes':3693828,'observedBytes':None,'reason':'Bounded official archive transfer was stopped; no PNG saved or decoded. Existing flat skin material retained.'},'morphsApplied':[],'qualityBoundary':'CPU topology, source-vertex distance, normals and projected footprint do not establish rendered appearance, device performance, anatomical likeness or PS4 quality.'}
PROVENANCE.write_text(json.dumps(provenance,indent=2)+'\n');print(json.dumps({'seconds':round(time.perf_counter()-start,3),**provenance['lod'],'outputBytes':OUT.stat().st_size},indent=2))
