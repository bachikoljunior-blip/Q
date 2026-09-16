from pathlib import Path
from PIL import Image
import hashlib, json
import numpy as np

root=Path(__file__).resolve().parent
path=root/'original-wool-basecolor.png'
raw=path.read_bytes()
im=Image.open(path)
rgb=np.asarray(im,dtype=np.float64)
assert im.mode=='RGB' and rgb.ndim==3
h,w,_=rgb.shape
# Encoded RGB code-value luma; no embedded profile was provided. This is not
# measured linear radiance/albedo or a physical calibration of generated yarn.
y=rgb@np.array([.2126,.7152,.0722])
def boundary(axis):
    if axis=='x':
        internal=np.abs(np.diff(rgb,axis=1)).mean(axis=(0,2))
        edge=np.abs(rgb[:,-1]-rgb[:,0])
    else:
        internal=np.abs(np.diff(rgb,axis=0)).mean(axis=(1,2))
        edge=np.abs(rgb[-1]-rgb[0])
    value=float(edge.mean())
    return {'edgeMeanAbsCodeValue':value,'edgeRmsCodeValue':float(np.sqrt(np.mean(edge**2))),
            'edgeMaxAbsCodeValue':float(edge.max()),'internalAdjacentMeanAbsCodeValue':float(internal.mean()),
            'edgeToInternalMeanRatio':float(value/internal.mean()),
            'edgePercentileAmongInternalColumnOrRowMeans':float(100*np.mean(internal<=value)),
            'internalCutMeanP05P50P95':np.percentile(internal,[5,50,95]).tolist()}
def spectrum(axis):
    a=y if axis=='x' else y.T
    a=a-a.mean(axis=1,keepdims=True)
    n=a.shape[1]
    power=np.mean(np.abs(np.fft.rfft(a*np.hanning(n)[None,:],axis=1))**2,axis=0)
    local=[i for i in range(9,len(power)-1) if power[i]>power[i-1] and power[i]>=power[i+1]]
    peaks=sorted(local,key=lambda i:power[i],reverse=True)[:5]
    return {'method':'Mean of row/column Hann-windowed, mean-removed 1D spectra; local peaks above 8 cycles/image',
            'peaks':[{'cyclesPerImage':i,'pixelPeriod':n/i,'millimetresPerPeriodIfPromptWidthIs250mm':250/i,
                      'fractionOfNonDCPower':float(power[i]/power[1:].sum())} for i in peaks],
            'bandFractions':{label:float(power[max(1,lo):min(len(power),hi)].sum()/power[1:].sum())
                             for label,lo,hi in [('1to8',1,9),('9to64',9,65),('65to249',65,250),('250to500',250,501),('above500',501,len(power))]}}
# Independent 8x8 block means quantify broad variation, without writing a
# resized, tiled, filtered, recolored or otherwise edited image.
blocks=np.array([[y[np.ix_(ys,xs)].mean() for xs in np.array_split(np.arange(w),8)] for ys in np.array_split(np.arange(h),8)])
report={'file':path.name,'sha256':hashlib.sha256(raw).hexdigest(),'bytes':len(raw),'format':im.format,'mode':im.mode,'width':w,'height':h,'embeddedMetadata':im.info,
 'rgbCodeValueMean':rgb.mean(axis=(0,1)).tolist(),'rgbCodeValueStd':rgb.std(axis=(0,1)).tolist(),
 'encodedLuma':{'mean':float(y.mean()),'std':float(y.std()),'percentiles0_1_50_99_100':np.percentile(y,[0,1,50,99,100]).tolist(),
                'block8x8MeanMinMax':[float(blocks.min()),float(blocks.max())],'topBottomQuarterMeans':[float(y[:h//4].mean()),float(y[-h//4:].mean())],
                'leftRightQuarterMeans':[float(y[:,:w//4].mean()),float(y[:,-w//4:].mean())]},
 'wrapBoundary':{'leftRight':boundary('x'),'topBottom':boundary('y')},'spatialFrequency':{'horizontal':spectrum('x'),'vertical':spectrum('y')},
 'promptScaleOnly':{'fieldWidthMetres':.25,'requestedYarnWidthMm':[.5,1],'requestedYarnWidthInActualImagePixels':[w*.5/250,w/250],
                    'physicalCalibration':False,'periodIsNotYarnDiameter':True},
 'dialogueBoundary':{'parentReportedVisibleGarmentAreaPixelsSquared':[25000,33000],'equivalentSquareSidePixels':np.sqrt([25000,33000]).tolist(),
                     'actualUvMappingTextureFootprintMipsAnisotropyOrShadingMeasured':False},
 'limits':['Statistics describe original generated pixels only.','Spectrum period assumes prompt field width; neither physical yarn diameter nor real fabric is established.',
           'Equal or nearby edge statistics do not establish tileability or its appearance on a model.','No game render, generated screenshot, runtime adoption or quality acceptance.']}
(root/'measurements.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
