"""Read-only independent oracle: actual source-collar UVs on the 46 cap-rim source vertices.
Each geometric source vertex has equal weight. If it has multiple UV sides, all
those sides are sampled and averaged before averaging the 46 geometric vertices.
The q95 image is decoded unchanged. Bilinear samples interpolate linear sRGB,
at GPU-equivalent texel centres x=u*W-.5, y=(1-v)*H-.5 with edge clamp.
"""
from pathlib import Path
import re,json,hashlib,sys
import numpy as np
from PIL import Image
repo=Path(sys.argv[1] if len(sys.argv)>1 else '/workspace/scratch/e72662e3b71f/Q-skin-v29')
text=(repo/'src/assets/characters/anatomical-head-data.js').read_text()
def ar(name):return np.array(json.loads(re.search(r'export const '+name+r' = (\[.*?\]);',text).group(1)))
a=ar('HEAD_ATTRIBUTES');ix=ar('HEAD_INDICES').reshape(-1,3);sid=ar('HEAD_SOURCE_IDS');uid=ar('HEAD_SOURCE_UV_IDS');f=ar('HEAD_SOURCE_TRIANGLE_IDS');r=ar('HEAD_UV_REGIONS')
rim=sorted(set(int(sid[k]) for tri in ix[f<0] for k in tri if sid[k]>=0));assert len(rim)==46
collar=set(int(k) for tri in ix[r==4] for k in tri)
imagepath=repo/'src/assets/characters/skin/young-male-q95.webp'
with Image.open(imagepath) as image:
 image.load();assert image.size==(2048,2048) and image.mode=='RGB';img=np.asarray(image).astype(float)/255
h,w=img.shape[:2]
def linear(c):return np.where(c<=.04045,c/12.92,((c+.055)/1.055)**2.4)
def sample(uv):
 x,y=uv[0]*w-.5,(1-uv[1])*h-.5;x0,y0=int(np.floor(x)),int(np.floor(y));tx,ty=x-x0,y-y0
 fetch=lambda xx,yy:linear(img[min(h-1,max(0,yy)),min(w-1,max(0,xx))])
 return (1-tx)*(1-ty)*fetch(x0,y0)+tx*(1-ty)*fetch(x0+1,y0)+(1-tx)*ty*fetch(x0,y0+1)+tx*ty*fetch(x0+1,y0+1)
rows=[]
for v in rim:
 choices=sorted((k for k in collar if int(sid[k])==v and uid[k]>=0),key=lambda k:int(uid[k]))
 assert choices
 sides=[{'renderIndex':k,'sourceUVId':int(uid[k]),'uv':a[k,6:8].tolist(),'linearRGB':sample(a[k,6:8]).tolist()}for k in choices]
 rows.append({'sourceVertex':v,'sides':sides,'meanLinearRGB':np.mean([s['linearRGB']for s in sides],axis=0).tolist()})
mean=np.mean([r['meanLinearRGB'] for r in rows],axis=0)
result={'image':str(imagepath),'imageSHA256':hashlib.sha256(imagepath.read_bytes()).hexdigest(),'headDataSHA256':hashlib.sha256(text.encode()).hexdigest(),'sampling':'q95 decoded RGB; linear-sRGB bilinear, x=u*W-.5,y=(1-v)*H-.5. Equal weight per geometric rim source vertex, equally average every original collar UV side first. No synthetic cap UVs sampled.','geometricRimSourceVertices':46,'sampledOriginalUVSides':sum(len(r['sides'])for r in rows),'referenceMeanLinearRGB':mean.tolist(),'source857':next(r for r in rows if r['sourceVertex']==857),'rows':rows}
print(json.dumps(result,indent=2))
