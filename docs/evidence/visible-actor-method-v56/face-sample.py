"""Numeric-only sampling of unchanged original image; no image output/edit/resize."""
from pathlib import Path
import json,re,hashlib,time,zlib
import numpy as np
from PIL import Image
from collections import Counter
start=time.perf_counter(); O=Path(__file__).parent; R=O.parent/'Q-ps4-v53'; A=R/'src/assets/characters'; S=R/'docs/evidence/skin-source-v38'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def ar(s,n):return np.asarray(json.loads(re.search(r'export const HEAD_'+n+r' = (\[.*?\]);',s).group(1)))
s=(A/'identity-head-data.js').read_text();a=ar(s,'ATTRIBUTES');ix=ar(s,'INDICES').reshape(-1,3);sid=ar(s,'SOURCE_IDS');uid=ar(s,'SOURCE_UV_IDS');rid=ar(s,'UV_REGIONS');fid=ar(s,'SOURCE_TRIANGLE_IDS');uv=a[:,6:8]
obj=(A/'sources/makehuman-hm08.obj').read_text();ouv=np.array([list(map(float,l.split()[1:3]))for l in obj.splitlines()if l.startswith('vt ')]);real=uid>=0;err=float(np.max(np.abs(uv[real]-ouv[uid[real]])));assert err==0
png=S/'young_lightskinned_female_diffuse.png';b=png.read_bytes();im=Image.open(png);im.load();pixels=np.asarray(im).astype(float)/255;assert pixels.shape==(2048,2048,3)
linear=lambda c:np.where(c<=.04045,c/12.92,((c+.055)/1.055)**2.4)
srgb=lambda c:np.where(c<=.0031308,c*12.92,1.055*np.maximum(c,0)**(1/2.4)-.055)
def sample(u):
 x,y=u[0]*2048-.5,(1-u[1])*2048-.5;i,j=int(np.floor(x)),int(np.floor(y));tx,ty=x-i,y-j
 f=lambda x,y:linear(pixels[min(2047,max(0,y)),min(2047,max(0,x))])
 return (1-tx)*(1-ty)*f(i,j)+tx*(1-ty)*f(i+1,j)+(1-tx)*ty*f(i,j+1)+tx*ty*f(i+1,j+1)
regions=[]
for r in range(6):
 tri=ix[rid==r];v=np.unique(tri);q=uv[v];area=np.abs(np.cross(uv[tri[:,1]]-uv[tri[:,0]],uv[tri[:,2]]-uv[tri[:,0]]))/2
 regions.append({'id':r,'triangles':len(tri),'vertices':len(v),'uvMin':q.min(axis=0).tolist(),'uvMax':q.max(axis=0).tolist(),'uvArea':float(area.sum()),'posMin':a[v,:3].min(axis=0).tolist(),'posMax':a[v,:3].max(axis=0).tolist()})
rim=sorted(set(int(sid[k])for tri in ix[fid<0]for k in tri if sid[k]>=0));collar=set(int(k)for tri in ix[rid==4]for k in tri);vals=[];allvals=[]
for v in rim:
 q=[sample(uv[k])for k in collar if sid[k]==v and uid[k]>=0];vals.append(np.mean(q,axis=0));allvals.extend(q)
ref=np.mean(vals,axis=0);target=np.array([171,135,112])/255;tint=linear(target)/ref;diff=np.abs(srgb(np.array(allvals)*tint)-target)*255
vis=json.loads((O/'visibility.json').read_text());rows=[];rects=[[1320,480,1620,850],[1320,1300,1620,1630]]
for row in vis['rows']:
 ss=[h for h in row['samples']if h['type']=='face-flat'];rc=Counter();scalp=[];front=[];colors=[];frontcolors=[]
 for h in ss:
  r=int(rid[h['face']]);rc[r]+=1;px,py=h['uv'][0]*2048,(1-h['uv'][1])*2048
  isScalp=any(x0<=px<x1 and y0<=py<y1 for x0,y0,x1,y1 in rects)
  p=h['headLocal'];isFront=r==0 and -.07<=p[1]<=.14 and p[2]>=.065
  c=srgb(sample(h['uv'])*tint);colors.append(c)
  if isScalp:scalp.append({'pixel':[h['x'],h['y']],'atlas':[px,py],'face':h['face'],'headLocal':p})
  if isFront:front.append(h);frontcolors.append(c)
 def stats(cs):
  c=np.array(cs)*255;d=np.abs(c-target*255)
  return {'p05RGB':np.quantile(c,.05,axis=0).tolist(),'p50RGB':np.quantile(c,.5,axis=0).tolist(),'p95RGB':np.quantile(c,.95,axis=0).tolist(),'medianMaxChannelDeltaFromFlat':float(np.median(d.max(axis=1))),'p95MaxChannelDeltaFromFlat':float(np.quantile(d.max(axis=1),.95))}
 # Same front-facing 4px neighbours. Source atlas texel span is a sampling scale, not real shading.
 pairs=[];lookup={(h['x'],h['y']):h for h in ss}
 for h in ss:
  for off in[(4,0),(0,4)]:
   t=lookup.get((h['x']+off[0],h['y']+off[1]));
   if t and h['face']==t['face']:pairs.append(float(np.linalg.norm(np.array(h['uv'])-t['uv'])*2048/4))
 rows.append({'viewport':row['viewport'],'visibleFaceRays':len(ss),'visibleFaceRegionCounts':dict(rc),'knownScalpRectangleHits':len(scalp),'knownScalpRectangleSamples':scalp,'frontDiagnosticHits':len(front),'frontDiagnosticAreaPx2':len(front)*16,'frontDiagnosticColor':stats(frontcolors),'fullVisibleColor':stats(colors),'sameTriangleOriginalTexelsPerPixel':{'samples':len(pairs),'p05':float(np.quantile(pairs,.05)),'p50':float(np.median(pairs)),'p95':float(np.quantile(pairs,.95))},'faceImagePixelBBox':[min(h['x']for h in ss),min(h['y']for h in ss),max(h['x']for h in ss),max(h['y']for h in ss)]})
eye=json.loads((O/'eye-probes.json').read_text());erows=[]
for row in eye['results']:
 probes=[h for e in row['eyes']for h in e['samples']if h['type']=='face-flat'];erows.append({'viewport':row['viewport'],'outerFaceEyeApertureProbes':len(probes),'regionCounts':dict(Counter(int(rid[h['face']])for h in probes)),'sourceColorRGB255':{'min':(srgb(np.array([sample(h['uv'])for h in probes]))*255).min(axis=0).tolist(),'max':(srgb(np.array([sample(h['uv'])for h in probes]))*255).max(axis=0).tolist()},'independentIrisCenterVisibleBoth':all(e['center']['type']=='eyes'and e['center']['color']=='372f25'for e in row['eyes'])})
res={'at':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'boundary':'Unchanged image decoded and sampled numerically only. No image writes, shader, framebuffer, lighting, render quality or identity-neutrality score. Front selection is a diagnostic box based on Q eye/face coordinates, not an approved texture mask. Scalp rectangles cover known stubble patches only and are not exhaustive.','source':{'file':str(png),'sha256':sha(png),'bytes':len(b),'crc32':f'{zlib.crc32(b)&0xffffffff:08x}','dimensions':list(im.size),'mode':im.mode,'descriptorSha256':sha(S/'young_caucasian_female.mhmat'),'licenseSha256':sha(S/'LICENSE-CC0.md')},'headDataSHA256':sha(A/'identity-head-data.js'),'sourceOBJSHA256':sha(A/'sources/makehuman-hm08.obj'),'originalUVMaxError':err,'originalUVCorners':int(real.sum()),'syntheticCapCorners':int((~real).sum()),'regions':regions,'neck':{'vertices':len(rim),'corners':len(allvals),'referenceLinearRGB':ref.tolist(),'hypotheticalLinearTint':tint.tolist(),'maxLocalChannelDelta255':float(diff.max())},'rows':rows,'eyeProbes':erows,'estimatedFullMipRGBA8Bytes':22369620,'seconds':time.perf_counter()-start}
(O/'face-sample.json').write_text(json.dumps(res,indent=2)+'\n');print(json.dumps({k:res[k]for k in ['source','originalUVMaxError','originalUVCorners','syntheticCapCorners','neck','eyeProbes','seconds']},indent=2));print(json.dumps([{k:v for k,v in r.items()if k!='knownScalpRectangleSamples'}for r in rows],indent=2))
