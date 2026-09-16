"""Read-only comparison of two original image files at unchanged hm08 UVs.
No crop/retouch/repack/resize or rendered face output is written.
"""
from pathlib import Path
import json,re,hashlib,time,sys
import numpy as np
from PIL import Image
from scipy.signal import correlate2d
OUT=Path(__file__).parent;ROOT=Path(sys.argv[1] if len(sys.argv)>1 else '/workspace/scratch/e72662e3b71f/Q-skin-candidate-v37');ASSETS=ROOT/'src/assets/characters';start=time.perf_counter()
newPath=OUT/'young_lightskinned_female_diffuse.png';oldPath=ASSETS/'skin/sources/young_lightskinned_male_diffuse.png'
def read(p):
 with Image.open(p) as im:
  im.load();meta={'dimensions':list(im.size),'mode':im.mode,'format':im.format,'metadata':{k:(v if isinstance(v,(str,int,float,tuple,list))else {'bytes':len(v),'sha256':hashlib.sha256(v).hexdigest()})for k,v in im.info.items()}}
  a=np.asarray(im).astype(float)/255
 return a,meta
old,om=read(oldPath);new,nm=read(newPath);assert old.shape==new.shape==(2048,2048,3)
def ar(s,n):return np.array(json.loads(re.search(r'export const HEAD_'+n+r' = (\[.*?\]);',s).group(1)))
s=(ASSETS/'identity-head-data.js').read_text();a=ar(s,'ATTRIBUTES');ix=ar(s,'INDICES').reshape(-1,3);sid=ar(s,'SOURCE_IDS');uid=ar(s,'SOURCE_UV_IDS');rid=ar(s,'UV_REGIONS');fid=ar(s,'SOURCE_TRIANGLE_IDS');uv=a[:,6:8]
obj=(ASSETS/'sources/makehuman-hm08.obj').read_text();ouv=np.array([list(map(float,l.split()[1:3]))for l in obj.splitlines()if l.startswith('vt ')]);real=uid>=0;assert np.max(np.abs(uv[real]-ouv[uid[real]]))==0
linear=lambda c:np.where(c<=.04045,c/12.92,((c+.055)/1.055)**2.4)
srgb=lambda c:np.where(c<=.0031308,c*12.92,1.055*np.maximum(c,0)**(1/2.4)-.055)
def sample(img,uv):
 x,y=uv[0]*2048-.5,(1-uv[1])*2048-.5;xx,yy=int(np.floor(x)),int(np.floor(y));tx,ty=x-xx,y-yy
 f=lambda i,j:linear(img[min(2047,max(0,j)),min(2047,max(0,i))])
 return (1-tx)*(1-ty)*f(xx,yy)+tx*(1-ty)*f(xx+1,yy)+(1-tx)*ty*f(xx,yy+1)+tx*ty*f(xx+1,yy+1)
rim=sorted(set(int(sid[k])for tri in ix[fid<0]for k in tri if sid[k]>=0));collar=set(int(k)for tri in ix[rid==4]for k in tri);assert len(rim)==46
colors={};target=np.array([0xab,0x87,0x70])/255;targetLin=linear(target)
for name,img in [('priorMale',old),('candidateFemale',new)]:
 means=[];samples=[]
 for v in rim:
  vals=[sample(img,uv[k])for k in collar if sid[k]==v and uid[k]>=0];means.append(np.mean(vals,axis=0));samples.extend(vals)
 ref=np.mean(means,axis=0);tint=targetLin/ref;delta=np.abs(srgb(np.array(samples)*tint)-target)
 colors[name]={'surfaceCollarVertices':len(rim),'surfaceUVSides':len(samples),'referenceMeanLinearRGB':ref.tolist(),'hypotheticalMiraLinearTint':tint.tolist(),'maxLocalCollarChannelDifference255':float(delta.max()*255),'meanMatchLinearResidual':float(np.abs(ref*tint-targetLin).max()),'runtimeApplied':False}
# Patch translation is diagnostic only: different authored feature texture can
# alter correlation without implying different UV. No semantic skin scoring.
grays=[img@np.array([.2126,.7152,.0722])for img in [old,new]]
region0=np.unique(ix[rid==0]);landmarks=[]
for name,targetPoint in [('leftEye',[-.046,.05,.100]),('rightEye',[.046,.05,.100]),('noseTip',[0,.012,.141]),('leftNostril',[-.025,-.012,.124]),('rightNostril',[.025,-.012,.124]),('mouth',[0,-.042,.114]),('leftEar',[-.13,.032,-.002]),('rightEar',[.13,.032,-.002])]:
 k=int(region0[np.argmin(np.linalg.norm(a[region0,:3]-targetPoint,axis=1))]);u=uv[k];x,y=np.rint([u[0]*2048-.5,(1-u[1])*2048-.5]).astype(int);half=16;shift=16
 patch=grays[0][y-half:y+half+1,x-half:x+half+1];search=grays[1][y-half-shift:y+half+shift+1,x-half-shift:x+half+shift+1]
 assert patch.shape==(33,33)and search.shape==(65,65)
 ref=patch-patch.mean();n=patch.size;ones=np.ones_like(patch);sum1=correlate2d(search,ones,mode='valid');sum2=correlate2d(search*search,ones,mode='valid');num=correlate2d(search,ref,mode='valid');den=np.sqrt(np.maximum(0,sum2-sum1*sum1/n)*np.sum(ref*ref));score=np.divide(num,den,out=np.zeros_like(num),where=den>1e-15);py,px=np.unravel_index(np.argmax(score),score.shape)
 landmarks.append({'label':name,'headLocalAnchor':targetPoint,'actualNearestSurfacePoint':a[k,:3].tolist(),'anchorDistanceM':float(np.linalg.norm(a[k,:3]-targetPoint)),'sourceVertexID':int(sid[k]),'sourceUVID':int(uid[k]),'uv':u.tolist(),'imagePixelCentre':[int(x),int(y)],'zeroShiftNCC':float(score[shift,shift]),'bestPatchShiftPixels':[int(px-shift),int(py-shift)],'bestNCC':float(score[py,px])})
result={'boundary':'Different existing authored source PNGs; no image editing or renderer. UV/source-ID equality is exact; NCC is an image-patch diagnostic, not anatomical/visual acceptance.','source':{'path':str(newPath),'sha256':hashlib.sha256(newPath.read_bytes()).hexdigest(),'bytes':newPath.stat().st_size,**nm},'priorMale':{'path':str(oldPath),'sha256':hashlib.sha256(oldPath.read_bytes()).hexdigest(),**om},'headDataSHA256':hashlib.sha256(s.encode()).hexdigest(),'originalUVMaxDifference':0,'originalUVCorners':int(real.sum()),'syntheticCapCornersExcluded':int((~real).sum()),'allOriginalUVWithinImage':bool(np.all((uv[real]>=0)&(uv[real]<=1))),'neck':colors,'landmarkPatchDiagnostics':landmarks,'wholeAtlasRGBA8MipEstimateBytes':22369620,'additionalFullSizeTextureIfBothKept':22369620,'runtimeWrites':0,'durationSeconds':time.perf_counter()-start}
(OUT/'comparison.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({'image':result['source'],'neck':colors,'landmarks':landmarks,'durationSeconds':result['durationSeconds']},indent=2))
