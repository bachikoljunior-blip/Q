#!/usr/bin/env python3
"""Reproduce two 44.1 kHz recorded stems; never rewrite motif/foley/cues.
Only the hash-pinned legacy generator definitions are evaluated. --verify uses
an ephemeral output directory; intermediate PCM is never added to the repo.
"""
from pathlib import Path
import hashlib,json,subprocess,tempfile,sys,wave,copy
import numpy as np
from scipy.signal import resample_poly
ROOT=Path(__file__).resolve().parent.parent
BASE=ROOT/'src/assets/soundscape'
FROZEN=ROOT/'docs/evidence/native-audio-recovery-v52/source-before/src/assets/soundscape/provenance.json'
OLD=json.loads(FROZEN.read_text());SR=44100
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
legacy=ROOT/'scripts/generate-soundscape.py';renderer=ROOT/'scripts/sampled_score.py'
assert sha(legacy)==OLD['generatorSha256']
assert sha(renderer)==OLD['sampledPerformance']['rendererSha256']
for item in OLD['assets']:
 if item['file'] not in ['pilgrim-harmony.mp3','pilgrim-pulse.mp3']:assert sha(BASE/item['file'])==item['sha256']
assert sha(BASE/'cues.json')==OLD['cuesSha256']

def generate(out):
 scope={'__file__':str(legacy)}
 exec(compile(legacy.read_text().split("if '--verify' in sys.argv:")[0],str(legacy),'exec'),scope)
 original=scope['score']()
 text=renderer.read_text()
 edits={"p={k:round(points[k]*ratio)":"p={k:2*round(points[k]*ratio/2)",
  'hold=round(sr*(12.1+voice*.025))':'hold=2*round(sr/2*(12.1+voice*.025))',
  'np.roll(y,round(sr*seconds),axis=0)':'np.roll(y,2*round(sr/2*seconds),axis=0)',
  "n=round(REPORT['sampleRate']*.006)":"n=2*round(REPORT['sampleRate']/2*.006)",
  'inspect_bow(y,sr) for path,y':'fixed_points(path,y,sr) for path,y'}
 for before,after in edits.items():assert text.count(before)==1,before;text=text.replace(before,after)
 oldpoints={p['path']:p for p in OLD['sampledPerformance']['performance']['recordings']}
 def fixed_points(path,y,sr):
  assert sr==44100
  p={k:2*oldpoints[path][k] for k in ['onset','end','release','loopStart','loopEnd','crossfade']}
  head=y[p['loopStart']:p['loopStart']+p['crossfade']];tail=y[p['loopEnd']-p['crossfade']:p['loopEnd']]
  p['stereoJoinCorrelation']=float(np.sum(head*tail)/max(1e-12,np.sqrt(np.sum(head*head)*np.sum(tail*tail))))
  return p
 native={'__file__':str(renderer),'fixed_points':fixed_points};exec(compile(text,str(renderer),'exec'),native)
 pulse=resample_poly(original['pilgrim-pulse'],2,1)
 original['pilgrim-pulse']=np.column_stack((pulse,pulse))/np.sqrt(2)
 result=native['render'](original,SR);result['pilgrim-pulse']/=np.sqrt(2)
 for field in ['notes','pulseEvents','chords']:assert native['REPORT'][field]==OLD['sampledPerformance']['performance'][field],field
 out.mkdir(parents=True,exist_ok=True);manifest=copy.deepcopy(OLD)
 with tempfile.TemporaryDirectory() as tmp:
  for name in ['pilgrim-harmony','pilgrim-pulse']:
   y=result[name];assert y.shape==(48*SR,2) and np.isfinite(y).all()
   pcm=np.round(np.clip(y,-.999,.999)*32767).astype('<i2');source=Path(tmp)/(name+'.wav')
   with wave.open(str(source),'wb') as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes(pcm.tobytes())
   path=out/(name+'.mp3')
   subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(source),'-map_metadata','-1','-codec:a','libmp3lame','-b:a','160k','-fflags','+bitexact',str(path)],check=True)
   a=next(a for a in manifest['assets']if a['file']==path.name)
   a.update(sampleRate=SR,channels=2,bytes=path.stat().st_size,sha256=sha(path),pcmPeak=float(np.max(np.abs(y))),pcmRms=float(np.sqrt(np.mean(y*y))))
 manifest['generator']='scripts/generate-native-score.py';manifest['generatorSha256']=sha(Path(__file__))
 manifest['recipe']['encoder']='ffmpeg libmp3lame 160k stereo 44100 for recorded stems; original 22050 motif/foley byte-identical'
 performance=native['provenance']();performance['renderer']=manifest['generator'];performance['rendererSha256']=manifest['generatorSha256'];manifest['sampledPerformance']=performance
 manifest['nativeDelivery']={'baselineProvenance':str(FROZEN.relative_to(ROOT)),'baselineSha256':sha(FROZEN),'legacyGenerator':str(legacy.relative_to(ROOT)),'legacyGeneratorSha256':sha(legacy),'legacyRenderer':str(renderer.relative_to(ROOT)),'legacyRendererSha256':sha(renderer),'unchanged':['pilgrim-motif.mp3','pilgrim-foley.wav','cues.json'],'scoreRates':{'harmony':44100,'motif':22050,'pulse':44100},'pulseStereoGain':float(1/np.sqrt(2)),'timing':'Original rounded 22050 onset/loop/pitched-join/hold/reflection/seam grid doubled; notes, pulse events and internal crossfade times exact','heard':False}
 manifest['totalBytes']=sum(a['bytes']for a in manifest['assets'])
 manifest['toolchain']={'numpy':np.__version__,'ffmpeg':subprocess.check_output(['ffmpeg','-version'],text=True).splitlines()[0],'reproducibility':'Exact-byte regeneration on this recorded toolchain; cross-host provenance/hash verification does not promise cross-version encoder identity.'}
 (out/'provenance.json').write_text(json.dumps(manifest,indent=2)+'\n');return manifest
if '--verify' in sys.argv:
 with tempfile.TemporaryDirectory() as tmp:
  out=Path(tmp);m=generate(out)
  for p in out.iterdir():assert p.read_bytes()==(BASE/p.name).read_bytes(),p.name
else:m=generate(BASE)
print(json.dumps({'passed':True,'verified':'--verify' in sys.argv,'bytes':m['totalBytes'],'assets':[{'file':a['file'],'sha256':a['sha256']}for a in m['assets']]}))
