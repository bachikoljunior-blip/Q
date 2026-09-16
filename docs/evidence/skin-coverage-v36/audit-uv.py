"""Read-only head/atlas source audit. Diagnostic UV/math, not game rendering."""
from pathlib import Path
import sys,re,json,hashlib,time
import numpy as np
from PIL import Image
start=time.perf_counter(); root=Path(sys.argv[1] if len(sys.argv)>1 else Path(__file__).resolve().parents[3]); out=Path(__file__).parent
assets=root/'src/assets/characters'
def ar(s,n):return np.array(json.loads(re.search(r'export const '+n+r' = (\[.*?\]);',s).group(1)))
def load(name):
 s=(assets/name).read_text()
 return {n:ar(s,'HEAD_'+n) for n in ['ATTRIBUTES','INDICES','SOURCE_IDS','SOURCE_UV_IDS','SOURCE_TRIANGLE_IDS','UV_REGIONS']}
heads={k:load(v) for k,v in [('base','anatomical-head-data.js'),('npc','identity-head-data.js')]}
obj=(assets/'sources/makehuman-hm08.obj').read_text();ouv=np.array([list(map(float,l.split()[1:3]))for l in obj.splitlines()if l.startswith('vt ')])
sourcePairs=set()
for l in obj.splitlines():
 if l.startswith('f '):
  for c in l.split()[1:]:
   v,u=c.split('/')[:2];sourcePairs.add((int(v)-1,int(u)-1))
image=np.asarray(Image.open(assets/'skin/young-male-q95.webp')).astype(float)/255
linear=lambda c:np.where(c<=.04045,c/12.92,((c+.055)/1.055)**2.4)
srgb=lambda c:np.where(c<=.0031308,c*12.92,1.055*np.maximum(c,0)**(1/2.4)-.055)
def sample(uv):
 x,y=uv[0]*2048-.5,(1-uv[1])*2048-.5;xx,yy=int(np.floor(x)),int(np.floor(y));a,b=x-xx,y-yy
 f=lambda i,j:linear(image[min(2047,max(0,j)),min(2047,max(0,i))])
 return (1-a)*(1-b)*f(xx,yy)+a*(1-b)*f(xx+1,yy)+(1-a)*b*f(xx,yy+1)+a*b*f(xx+1,yy+1)
report={'boundary':'Source IDs and actual UV triangle math; sampled color is pre-lighting. No browser, WebGL, GPU or perceived appearance.','heads':{}}
collars={}; svg=['<svg xmlns="http://www.w3.org/2000/svg" width="1040" height="560" viewBox="0 0 1040 560"><rect width="1040" height="560" fill="white"/><text x="15" y="20" font-family="sans-serif" font-size="15">Original atlas UV topology — analytical diagram, NOT a game frame or edited skin image</text>']
colors=['#354a78','#bd5a20','#258460','#802e83','#bb9130','#555555']
for panel,(name,h) in enumerate(heads.items()):
 a=h['ATTRIBUTES'];ix=h['INDICES'].reshape(-1,3);uv=a[:,6:8];sid=h['SOURCE_IDS'];uid=h['SOURCE_UV_IDS'];rid=h['UV_REGIONS'];real=uid>=0
 assert all((int(s),int(u)) in sourcePairs for s,u in zip(sid[real],uid[real]))
 err=float(np.abs(uv[real]-ouv[uid[real]]).max());assert err==0
 tris=uv[ix];ab=tris[:,1]-tris[:,0];ac=tris[:,2]-tris[:,0];signed=(ab[:,0]*ac[:,1]-ab[:,1]*ac[:,0])*.5
 region=[]
 for r in sorted(set(rid)):
  mask=rid==r;u=uv[np.unique(ix[mask])];area=float(np.abs(signed[mask]).sum())
  region.append({'id':int(r),'triangles':int(mask.sum()),'absoluteUVArea':area,'percentFullAtlas':100*area,'bounds':np.array([u.min(axis=0),u.max(axis=0)]).tolist(),'positive':int((signed[mask]>0).sum()),'negative':int((signed[mask]<0).sum())})
 rim=sorted(set(int(sid[k])for tri in ix[h['SOURCE_TRIANGLE_IDS']<0]for k in tri if sid[k]>=0))
 collar=set(int(k)for tri in ix[rid==4]for k in tri);samples=[];means=[]
 for s in rim:
  ks=[k for k in collar if sid[k]==s and uid[k]>=0];vals=[sample(uv[k])for k in ks];samples.extend(vals);means.append(np.mean(vals,axis=0))
 collars[name]={'mean':np.mean(means,axis=0),'samples':np.array(samples),'rows':sorted([(int(sid[k]),int(uid[k]),a[k,:3].tolist(),uv[k].tolist())for k in collar if sid[k] in rim and uid[k]>=0])}
 report['heads'][name]={'renderVertices':len(a),'triangles':len(ix),'sourceCorners':int(real.sum()),'syntheticCorners':int((~real).sum()),'sourceUVMaxError':err,'sourceVertexUVPairMismatches':0,'sourceSurfaceUVArea':float(np.abs(signed[rid!=5]).sum()),'regions':region,'neckGeometricVertices':len(rim),'neckOriginalUVSides':len(samples),'neckMeanLinearRGB':collars[name]['mean'].tolist()}
 ox=10+panel*520;oy=45;svg.append(f'<text x="{ox}" y="{oy}" font-family="sans-serif" font-size="16">{name}: {len(ix)} triangles</text>');oy+=10
 svg.append(f'<rect x="{ox}" y="{oy}" width="490" height="490" fill="#f6f6f6" stroke="#aaa"/>')
 for t,r in zip(tris,rid):
  if r==5:continue
  pts=' '.join(f'{ox+x*490:.3f},{oy+(1-y)*490:.3f}'for x,y in t)
  svg.append(f'<polygon points="{pts}" fill="none" stroke="{colors[int(r)]}" stroke-width=".35"/>')
svg.append('</svg>');(out/'uv-layout.svg').write_text('\n'.join(svg)+'\n')
report['neckBoundaryEqualAcrossHeads']=collars['base']['rows']==collars['npc']['rows'];assert report['neckBoundaryEqualAcrossHeads']
base=heads['base'];npc=heads['npc'];bm={(int(s),int(u)):a for s,u,a in zip(base['SOURCE_IDS'],base['SOURCE_UV_IDS'],base['ATTRIBUTES'])if u>=0};nm={(int(s),int(u)):a for s,u,a in zip(npc['SOURCE_IDS'],npc['SOURCE_UV_IDS'],npc['ATTRIBUTES'])if u>=0};shared=bm.keys()&nm.keys()
report['sharedProtectedPositions']={}
for r in range(1,5):
 bk={ (int(base['SOURCE_IDS'][k]),int(base['SOURCE_UV_IDS'][k]))for k in np.unique(base['INDICES'].reshape(-1,3)[base['UV_REGIONS']==r])}; nk={ (int(npc['SOURCE_IDS'][k]),int(npc['SOURCE_UV_IDS'][k]))for k in np.unique(npc['INDICES'].reshape(-1,3)[npc['UV_REGIONS']==r])}; keys=bk&nk
 delta=max(float(np.linalg.norm(bm[k][:3]-nm[k][:3]))for k in keys);assert delta==0
 report['sharedProtectedPositions'][str(r)]={'sharedCorners':len(keys),'maxPositionDeltaM':delta}
report['sharedSourceCorners']={'count':len(shared),'uvMaxError':max(float(np.abs(bm[k][6:8]-nm[k][6:8]).max())for k in shared),'maxPositionDeltaM':max(float(np.linalg.norm(bm[k][:3]-nm[k][:3]))for k in shared)}
profiles=(assets/'detailed-geometry.js').read_text().split('const profiles = {')[1].split('\n};')[0]
report['hypotheticalAllRoleNeckCalibrationNotInstalled']={}
for role,hx in re.findall(r'(\w+): \{[^\n]*?skin:0x([a-f0-9]+)',profiles):
 target=np.array([(int(hx,16)>>s)&255 for s in [16,8,0]])/255;targetLin=linear(target);c=collars['npc'if role=='npc'else'base'];tint=targetLin/c['mean'];pixels=srgb(c['samples']*tint)
 report['hypotheticalAllRoleNeckCalibrationNotInstalled'][role]={'existingSkinSRGBHex':hx,'linearTint':tint.tolist(),'maxCollarSRGBChannelDelta255':float(np.abs(pixels-target).max()*255),'meanLinearResidual':float(np.abs(c['mean']*tint-targetLin).max()),'adopted':role=='smith'}
paths=['src/assets/characters/'+f for f in ['anatomical-head-data.js','identity-head-data.js','anatomical-head-provenance.json','identity-head-provenance.json','detailed-geometry.js','skin/provenance.json','skin/sources/young_lightskinned_male_diffuse.png','skin/young-male-q95.webp']]+['src/skin-materials.js','src/skin-texture-loader.js','src/skin-assets.js']
report['sourceHashes']={p:{'bytes':(root/p).stat().st_size,'sha256':hashlib.sha256((root/p).read_bytes()).hexdigest()}for p in paths};report['durationSeconds']=time.perf_counter()-start
(out/'uv.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items()if k not in ['sourceHashes','hypotheticalAllRoleNeckCalibrationNotInstalled']},indent=2))
