from pathlib import Path
import json,hashlib,zlib,struct,time,math
import numpy as np
from PIL import Image
O=Path(__file__).parent; S=O.parent/'q-original-cloth-v58/original-wool-basecolor.png';start=time.perf_counter();b=S.read_bytes();assert hashlib.sha256(b).hexdigest()=='ba1db9154df3a40cbb18cb5e0b0f4cae539efa9937263079a647953d7f9fa260'
pos=8;chunks=[]
while pos<len(b):
 n=struct.unpack('>I',b[pos:pos+4])[0];kind=b[pos+4:pos+8];data=b[pos+8:pos+8+n];crc=struct.unpack('>I',b[pos+8+n:pos+12+n])[0];assert zlib.crc32(kind+data)&0xffffffff==crc;chunks.append([kind.decode(),n]);pos+=n+12
im=Image.open(S);im.load();c=np.asarray(im,dtype=float)/255;assert c.shape==(1254,1254,3)
linear=np.where(c<=.04045,c/12.92,((c+.055)/1.055)**2.4);luma=linear@np.array([.2126,.7152,.0722]);N=1254
q=lambda a:{str(p):float(np.quantile(a,p))for p in[0,.05,.5,.95,1]}
mean=linear.mean(axis=(0,1));mu=luma.mean(); target=np.array([0x69,0x64,0x54])/255;tl=np.where(target<=.04045,target/12.92,((target+.055)/1.055)**2.4);tint=tl/mean
edges={}
for ax in [0,1]:
 adjacent=np.diff(luma,axis=ax);edge=np.take(luma,0,axis=ax)-np.take(luma,-1,axis=ax)
 edges[str(ax)]={'axis':'top/bottom'if ax==0 else'left/right','boundaryAbsDeltaLinear':q(np.abs(edge)),'interiorAbsDeltaLinear':q(np.abs(adjacent)),'boundaryRMS':float(np.sqrt(np.mean(edge**2))),'interiorRMS':float(np.sqrt(np.mean(adjacent**2))),'boundaryVsInteriorRMS':float(np.sqrt(np.mean(edge**2)/np.mean(adjacent**2))),'meanEdgeDeltaLinear':float(edge.mean()),'strip16MeanRelativeDifference':float((np.take(luma,range(16),axis=ax).mean()-np.take(luma,range(N-16,N),axis=ax).mean())/mu)}
# All transformations below are numeric statistics, not saved or usable raster derivatives.
side=19; ys=np.array_split(np.arange(N),side);xs=np.array_split(np.arange(N),side);cells=np.array([[luma[np.ix_(y,x)].mean()for x in xs]for y in ys]);xx,yy=np.meshgrid(np.linspace(-.5,.5,side),np.linspace(-.5,.5,side));X=np.c_[np.ones(side*side),xx.ravel(),yy.ravel()];coef=np.linalg.lstsq(X,cells.ravel(),rcond=None)[0];fit=(X@coef).reshape(side,side);res=cells-fit
freq=[]
for ax in[0,1]:
 signal=luma-luma.mean(axis=ax,keepdims=True);power=(np.abs(np.fft.rfft(signal,axis=ax))**2).mean(axis=1-ax);masked=power.copy();masked[:20]=0;masked[250:]=0;peaks=[i for i in range(21,249)if masked[i]>masked[i-1]and masked[i]>=masked[i+1]];peaks=sorted(peaks,key=lambda i:masked[i],reverse=True)[:8]
 # Normalized same-line lag correlation identifies repeat pitch, not individual yarn width.
 corr=[]
 for lag in range(1,61):
  a=np.take(signal,range(N-lag),axis=ax);d=np.take(signal,range(lag,N),axis=ax);corr.append(float(np.mean(a*d)/np.sqrt(np.mean(a*a)*np.mean(d*d))))
 maxima=[i+1 for i in range(4,58)if corr[i]>corr[i-1]and corr[i]>=corr[i+1]];best=sorted(maxima,key=lambda lag:corr[lag-1],reverse=True)[:4]
 freq.append({'axis':'V'if ax==0 else'U','dominantCyclesPerImage':peaks,'correspondingPeriodPixels':[N/i for i in peaks],'periodAtIntended250mm':[250/i for i in peaks],'powerFractionsOf20to249':[float(power[i]/power[20:250].sum())for i in peaks],'autocorrelationPeaks':[[i,corr[i-1]]for i in best]})
# Mean RGB / bright outliers after only numerical mean normalization.
normalized=linear*tint;norml=normalized@np.array([.2126,.7152,.0722]);contrast={'relativeLuma':q(luma/mu),'linearMeanRGB':mean.tolist(),'srgbMeanRGB':c.mean(axis=(0,1)).tolist(),'linearChannelMeanSpreadRelative':float((mean.max()-mean.min())/mean.mean()),'baseMiraLinearRGB':tl.tolist(),'materialLinearTintIfMeanNormalized':tint.tolist(),'linearNormalizedMaxRGB':normalized.max(axis=(0,1)).tolist(),'fractionNormalizedChannelsOver1':float(np.mean(normalized>1))}
# Camera-plane estimates use fixed v56 actual visibility depths. No renderer or actual new-map mips.
v56=json.load(open(O.parent/'q-visible-actor-method-v56/uv-scale.json'));projection=[]
for r in v56['result']:
 pxpm=r['types']['upper-cloth']['viewPlane20mmPixelsP50']/.02
 for tile in[.25,.125,.1,.075]:
  projection.append({'viewport':r['viewport'],'tileM':tile,'cameraPlaneTilePixels':tile*pxpm,'sourceTexelsPerProjectedPixel':N/(tile*pxpm),'isotropicMipLOD':math.log2(N/(tile*pxpm)),'strongestAxisPeriodM':[tile/f['dominantCyclesPerImage'][0]for f in freq],'strongestAxisPeriodPixels':[tile/f['dominantCyclesPerImage'][0]*pxpm for f in freq]})
dims=[];d=N
while d>=1:dims.append(d);d=d//2
out={'source':{'path':str(S.resolve()),'sha256':hashlib.sha256(b).hexdigest(),'bytes':len(b),'dimensions':list(im.size),'mode':im.mode,'chunks':chunks,'allChunkCRCPass':True},'contrast':contrast,'broadScale':{'cellGrid':[side,side],'cellMeanRelative':q(cells/mu),'linearPlaneCoefficients':coef.tolist(),'leftRightRelativePlaneDelta':float(coef[1]/mu),'topBottomRelativePlaneDelta':float(coef[2]/mu),'planeR2':float(1-np.var(res)/np.var(cells)),'residualRelativeRMS':float(np.sqrt(np.mean(res**2))/mu),'interpretation':'A broad colour/brightness trend test only; cannot distinguish pigment variation from baked lighting or prove physical albedo.'},'edges':edges,'frequency':freq,'projection':projection,'payload':{'PNGBytes':len(b),'rgbDecodedBytes':N*N*3,'rgba8Level0Bytes':N*N*4,'rgba8MipDimensionSequence':dims,'rgba8FullMipBytes':sum(d*d*4 for d in dims),'GPUAllocationAndPeakMeasured':False,'browserDecodeCPUTimeMeasured':False},'samplingCPUWallSeconds':time.perf_counter()-start,'boundary':'Read-only PNG decode and numerical statistics. No image output, transform, resampling, normal derivation, screenshot, renderer or PS4 grade. Period is repeat frequency, not resolved yarn diameter. Mip estimates are camera-plane equivalents using prior fixed actual Scene camera depth.'}
(O/'measurements.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
