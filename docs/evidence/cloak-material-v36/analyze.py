from pathlib import Path
import numpy as np,json,hashlib,math
from PIL import Image
p=Path(__file__).resolve().parent
s={k:np.asarray(Image.open(p/'source'/f'hessian_380_{k}_1k.jpg').convert('RGB'),dtype=np.float64)/255 for k in ['diff','nor_gl','rough']}
assert all(a.shape==(1024,1024,3) for a in s.values())
c=s['diff']; linear=np.where(c<=.04045,c/12.92,((c+.055)/1.055)**2.4); lum=linear@np.array([.2126,.7152,.0722]);rough=s['rough'][:,:,1];n=s['nor_gl']*2-1;length=np.linalg.norm(n,axis=2);direction=n/length[:,:,None]
quant=lambda a:{str(q):float(np.quantile(a,q)) for q in [.01,.1,.5,.9,.99]}
# No raster output, edits or resampling. Numeric averages model a sampling footprint only.
filtered=[]
for w in [1,4,16,64]:
 mean=lambda a:a.reshape(1024//w,w,1024//w,w,*a.shape[2:]).mean(axis=(1,3))
 avgN=mean(n);unit=avgN/np.linalg.norm(avgN,axis=-1)[:,:,None]
 filtered.append({'footprintTexels':w,'relativeLuma':quant(mean(lum)/lum.mean()),'normalAngleDegrees':quant(np.degrees(np.arccos(np.clip(unit[:,:,2],-1,1)))),'roughness':quant(mean(rough))})
# Dominant frequencies exclude slow illumination/color variation; correspond to repeated weave.
fourier=[]
for axis in [0,1]:
 signal=lum-lum.mean(axis=axis,keepdims=True);power=(np.abs(np.fft.rfft(signal,axis=axis))**2).mean(axis=1-axis);power[:20]=0
 ids=np.argpartition(power,-5)[-5:];ids=sorted(ids,key=lambda i:power[i],reverse=True)
 fourier.append({'axis':axis,'dominantCyclesPerTile':int(ids[0]),'topFive':list(map(int,ids))})
# Only a scale derived from rounded official full-resolution density, not exact metadata.
tile=8192/(299.1*100); metersPerUV=.9722054042332153
projection=[]
for viewport,H in [('1280x720',720),('844x390',390),('390x844',844)]:
 for d in [9,2.6]:
  pp=H/(2*math.tan(math.radians(54)/2)*d)
  projection.append({'viewport':viewport,'distanceM':d,'pixelsPerMeter':pp,'tilePixels':tile*pp,'normalTextureLod':math.log2((1024/tile)/pp),'dominantWeavePeriodPx':[tile/x['dominantCyclesPerTile']*pp for x in fourier],'oldProceduralWeavePeriodPx':metersPerUV/64*pp})
# Native Standard microfacet width uses alpha=roughness^2; retain boundary as CPU scalar comparison.
oldr=.94; mr=float(rough.mean())
base_srgb=np.array([0x2c,0x55,0x5b])/255;base=np.where(base_srgb<=.04045,base_srgb/12.92,((base_srgb+.055)/1.055)**2.4)
mipBytes=sum(4*max(1,1024>>i)**2 for i in range(11))
result={'rasterOperation':'Read/decode to arrays and numeric statistics only; no modified/generated image written','physicalTileM':tile,'physicalSource':'Derived from official page 8K full resolution / 299.1 px per cm rounded density. Exact info API unavailable; dimensions not independently verified.','repeatForCape':[metersPerUV/tile]*2,'metersPerUVReference':metersPerUV,'referenceBoundary':'Same authored player rest cape UV density as preserved v34 source-only audit; runtime geometry unchanged from that audit','dimensions':[1024,1024],'jpegDecodedNormalLength':quant(length),'normalMean':n.mean(axis=(0,1)).tolist(),'roughness':quant(rough),'roughnessMean':mr,'roughChannelsMaxDifference':float(np.abs(s['rough']-rough[:,:,None]).max()),'normalFinite':bool(np.isfinite(n).all()),'diffuseLinearMean':linear.mean(axis=(0,1)).tolist(),'diffuseSrgbMean':c.mean(axis=(0,1)).tolist(),'playerBaseLinear':base.tolist(),'playerTintIfMeanNormalized':(base/linear.mean(axis=(0,1))).tolist(),'GGXAlphaMeanBefore':oldr**2,'GGXAlphaAtMeanCandidateRoughness':mr**2,'mipmapFootprintEstimates':filtered,'weaveFrequency':fourier,'projection':projection,'payload':{'allThreeSourceBytes':sum((p/'source'/f'hessian_380_{k}_1k.jpg').stat().st_size for k in s),'rgba8MipsPerMapBytes':mipBytes,'rgba8MipsThreeMapsBytes':mipBytes*3,'skinExistingRGBA8MipsBytes':22369620,'skinPlusThreeClothMapBytes':22369620+mipBytes*3,'decodeRGBAPeakOneImageBytes':1024*1024*4,'gpuBoundary':'Uncompressed RGBA8 mathematical format payload only; not GPU allocation or peak device process memory.'}}
(p/'analysis.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2))
