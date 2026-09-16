"""Numerical mip footprint models; never emits an image or runtime map."""
from pathlib import Path
import numpy as np,json,hashlib,time
from PIL import Image
O=Path(__file__).parent;P=O.parent/'q-original-cloth-v58/original-wool-basecolor.png';b=P.read_bytes();assert hashlib.sha256(b).hexdigest()=='ba1db9154df3a40cbb18cb5e0b0f4cae539efa9937263079a647953d7f9fa260'
c=np.asarray(Image.open(P),dtype=float)/255;linear=np.where(c<=.04045,c/12.92,((c+.055)/1.055)**2.4);src=linear@np.array([.2126,.7152,.0722]);mu=src.mean()
def shrink_axis(a,axis,kind):
 a=np.moveaxis(a,axis,0);n=len(a);m=n//2
 if kind=='box':
  cumulative=np.concatenate([np.zeros_like(a[:1]),np.cumsum(a,axis=0)],axis=0);edges=np.linspace(0,n,m+1);lo=np.minimum(n-1,np.floor(edges).astype(int));f=edges-lo;integrals=cumulative[lo]+a[lo]*f[:,None];v=np.diff(integrals,axis=0)/(n/m)
 else:
  centres=(np.arange(m)+.5)*n/m-.5;lo=np.floor(centres).astype(int);f=centres-lo;v=a[lo]*(1-f[:,None])+a[np.minimum(n-1,lo+1)]*f[:,None]
 return np.moveaxis(v,0,axis)
def measure(a):
 out={'dimensions':list(a.shape),'meanRelativeToOriginal':float(a.mean()/mu),'relativeStd':float(a.std()/mu),'edges':{}}
 for ax in[0,1]:
  edge=np.take(a,0,axis=ax)-np.take(a,-1,axis=ax);inside=np.diff(a,axis=ax);er=float(np.sqrt(np.mean(edge**2)));ir=float(np.sqrt(np.mean(inside**2)))
  out['edges']['topBottom'if ax==0 else'leftRight']={'absoluteEdgeRMS':er,'absoluteInteriorRMS':ir,'ratio':er/ir,'edgeRMSToMean':er/mu,'signedEdgeMeanToMean':float(edge.mean()/mu)}
 return out
models={}
for kind in['box','linear']:
 a=src;levels=[]
 for i in range(8):
  if i>=3:levels.append({'level':i,**measure(a)})
  a=shrink_axis(shrink_axis(a,0,kind),1,kind)
 models[kind]=levels
out={'sourceSHA256':hashlib.sha256(b).hexdigest(),'models':models,'scope':'Two mathematical CPU reduction models only: separable exact area-box on linear-sRGB luminance, and centre bilinear sample at each half-resolution step. No image output, editing, saved mip asset or WebGL execution. Models do not certify the GPU generateMipmap kernel, trilinear blend, anisotropy, texture seam or rendered appearance. Levels 3–7 bracket intended .25/.125m tile and actual three camera estimates.'}
(O/'mip-math.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
