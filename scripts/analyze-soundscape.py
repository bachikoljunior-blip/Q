#!/usr/bin/env python3
"""Offline decoded signal QA and review mix, not Web Audio or heard-device QA."""
from pathlib import Path
import numpy as np
import subprocess,json,tempfile,wave,hashlib
ROOT=Path(__file__).resolve().parent.parent; BASE=ROOT/'src/assets/soundscape'; OUT=ROOT/'docs/evidence'
if json.loads((BASE/'provenance.json').read_text()).get('nativeDelivery'):
    import runpy
    runpy.run_path(str(ROOT/'scripts/verify-native-score.py'),run_name='__main__')
    raise SystemExit(0)
manifest=json.loads((BASE/'provenance.json').read_text()); sr=22050; stems={}; result=[]
for asset in manifest['assets']:
    channels=asset['channels']; raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(BASE/asset['file']),'-f','f32le','-acodec','pcm_f32le','-ar',str(sr),'-ac',str(channels),'-'])
    signal=np.frombuffer(raw,dtype='<f4').reshape(-1,channels)
    assert np.isfinite(signal).all(); peak=float(np.max(np.abs(signal)));rms=float(np.sqrt(np.mean(signal*signal)))
    assert peak < 1,asset['file']; assert rms > .01,asset['file']
    item={'file':asset['file'],'decodedFrames':len(signal),'decodedSeconds':len(signal)/sr,'sampleRate':sr,'channels':channels,'decodedPeak':peak,'decodedRms':rms,'clippedSamples':int(np.sum(np.abs(signal)>=1))}
    if asset['file'].endswith('.mp3'):
        loop=signal[:48*sr]; jump=float(np.max(np.abs(loop[0]-loop[-1]))); derivative=np.abs(np.diff(loop,axis=0)); p99=float(np.percentile(derivative,99));
        item.update(loopBoundaryJump=jump,adjacentSampleDelta99thPercentile=p99,loopBoundaryWithinP99=jump<=p99)
        assert jump < .04,asset['file']+' boundary discontinuity'; assert len(signal)>=48*sr
        stems[asset['purpose']]=loop if channels==2 else np.repeat(loop,2,axis=1)/np.sqrt(2)
    result.append(item)
# Preview follows runtime bus/master gain, excluding actual live SFX/environment.
# Exactly the same rendered score assets; 0-16 title,16-32 exploration,32-48 combat.
weights={'pilgrim-harmony':[.55,.36,.48],'pilgrim-motif':[.48,.24,.28],'pilgrim-pulse':[.16,0,.64]}
mix=np.zeros((48*sr,2))
for stem,levels in weights.items():
    gain=np.repeat(levels,16*sr).astype(float)
    for boundary in [16*sr,32*sr]:
        a=gain[boundary-1];b=gain[boundary];n=int(1.5*sr);gain[boundary:boundary+n]=np.linspace(a,b,n)
    mix+=stems[stem]*gain[:,None]*.75*.45
mix[:sr]*=np.linspace(0,1,sr)[:,None];mix[-sr:]*=np.linspace(1,0,sr)[:,None]
with tempfile.TemporaryDirectory() as tmp:
    source=Path(tmp)/'review.wav'
    with wave.open(str(source),'wb') as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(sr);w.writeframes(np.round(mix*32767).astype('<i2').tobytes())
    subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(source),'-map_metadata','-1','-codec:a','libmp3lame','-b:a','80k',str(OUT/'audio-score-review.mp3')],check=True)
report={'passed':True,'boundary':'ffmpeg decoded committed PCM/MP3 numerical signal analysis. Review is an offline music-only mix, not captured gameplay, actual Web Audio rendering, physical listening, mobile performance or comparative quality evidence.','assets':result,'review':{'file':'docs/evidence/audio-score-review.mp3','durationSeconds':48,'segments':[{'from':0,'to':16,'mode':'title'},{'from':16,'to':32,'mode':'exploration'},{'from':32,'to':48,'mode':'combat'}],'peak':float(np.max(np.abs(mix))),'rms':float(np.sqrt(np.mean(mix*mix))),'sha256':hashlib.sha256((OUT/'audio-score-review.mp3').read_bytes()).hexdigest()},'decodedRetainedAssetBytesAt22050Hz':sum(x['decodedFrames']*x['channels']*4 for x in result)}
(OUT/'audio-signal-qa-20260915.json').write_text(json.dumps(report,indent=2)+'\n'); print(json.dumps(report))
