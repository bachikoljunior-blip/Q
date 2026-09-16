#!/usr/bin/env python3
"""Actual FFmpeg file inspection; no Web Audio playback or listening claim."""
from pathlib import Path
import sys,json,subprocess,hashlib
import numpy as np
from scipy.signal import resample_poly,welch
ROOT=Path(__file__).resolve().parent.parent;BASE=ROOT/'src/assets/soundscape'
OUT=Path(sys.argv[1]) if len(sys.argv)>1 else ROOT/'artifacts/native-audio-recovery-v52'
OUT.mkdir(parents=True,exist_ok=True)
m=json.loads((BASE/'provenance.json').read_text())
def decode(p,rate=None):
 info=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','stream=codec_name,sample_rate,channels','-of','json',str(p)]))['streams'][0]
 sr=rate or int(info['sample_rate']);raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(p),'-f','f32le','-ar',str(sr),'-'])
 return np.frombuffer(raw,dtype='<f4').reshape(-1,info['channels']).astype(np.float64),sr,info
def rms(y):return float(np.sqrt(np.mean(y*y)))
def edge(y,sr,cut):
 n=round(.006*sr);w=y[(np.arange(-n,n)+cut)%len(y)]
 return {'jump':float(np.max(np.abs(w[n]-w[n-1]))),'maxDelta':float(np.max(np.abs(np.diff(w,axis=0)))),'rms':rms(w)}
assets=[];stems={};descriptors={}
for a in m['assets']:
 p=BASE/a['file'];assert hashlib.sha256(p.read_bytes()).hexdigest()==a['sha256']
 y,sr,info=decode(p);assert sr==a['sampleRate'] and y.shape[1]==a['channels'];assert np.isfinite(y).all()
 peak=float(np.max(np.abs(y)));peak4=float(np.max(np.abs(resample_poly(y,4,1,axis=0))));assert peak<1 and peak4<1
 f,power=welch(y,fs=sr,nperseg=8192,axis=0)
 item={'file':p.name,'bytes':p.stat().st_size,'sha256':a['sha256'],'header':info,'frames':len(y),'seconds':len(y)/sr,'float32Bytes':y.size*4,'peak':peak,'peak4xEstimate':peak4,'rms':rms(y),'clipSamples':int(np.count_nonzero(np.abs(y)>=1)),'energyFractionAbove11025Hz':float(power[f>11025].sum()/power.sum())}
 if y.shape[1]==2:item.update(lrCorrelation=float(np.corrcoef(y.T)[0,1]),monoToStereoRms=rms(y.mean(axis=1))/rms(y))
 if p.suffix=='.mp3':
  assert len(y)==48*sr
  z,_,_=decode(p,44100);stems[a['purpose'].removeprefix('pilgrim-')]=z
  item['loop']={'analysisRate':44100,'halfWindowSeconds':round(.006*44100)/44100,'seam':edge(z,44100,0),'internalBarCuts':[edge(z,44100,i*3*44100)for i in range(1,16)],'interpretation':'Identical windows, descriptive only; no chosen audibility threshold.'}
 assets.append(item);descriptors[p.name]={'rate':sr,'channels':y.shape[1],'frames':len(y),'seconds':len(y)/sr}
for p in sorted((ROOT/'src/assets/vaults').glob('*.wav')):
 y,sr,_=decode(p);descriptors[p.name]={'rate':sr,'channels':y.shape[1],'frames':len(y),'seconds':len(y)/sr}
stems['motif']=stems['motif']*np.array([np.cos((1+.14)*np.pi/4),np.sin((1+.14)*np.pi/4)])
mixes={}
for mode,weights in {'title':[.55,.48,.16],'exploration':[.36,.24,0],'combat':[.48,.28,.64]}.items():
 y=sum(stems[k]*w for k,w in zip(['harmony','motif','pulse'],weights));peak=float(np.max(np.abs(y)));assert peak<1
 mixes[mode]={'unityPeak':peak,'defaultBusMasterPeak':peak*.75*.45,'rms':rms(y),'scope':'48s synchronized music only; actual static gains and motif pan; before compressor, without SFX/ambience.'}
score=sum(a['float32Bytes']for a in assets if a['file'].endswith('.mp3'));assert score==38102400
report={'passed':True,'heard':False,'actualWebAudio':False,'assets':assets,'mixes':mixes,'fileDescriptors':descriptors,'scoreFloat32Bytes':score,'allAuthoredAtPolicyRateBytes':sum(d['frames']*d['channels']*4 for d in descriptors.values()),'encodedSoundscapeBytes':m['totalBytes'],'fallbackScoreBytes':{str(r):48*r*5*4 for r in [44100,48000,96000]},'unknown':'Native decoder working memory, acquired node copies, GC timing, CPU, playback and device memory peak not observed.'}
(OUT/'signals.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({k:report[k]for k in ['passed','scoreFloat32Bytes','allAuthoredAtPolicyRateBytes','encodedSoundscapeBytes','fallbackScoreBytes']}))
