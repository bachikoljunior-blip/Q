#!/usr/bin/env python3
"""Exact assets, decoded loop/synchronization and paired offline music mixes.
No device playback or listening judgment is inferred from numerical results.
"""
from pathlib import Path
import hashlib,json,subprocess,tempfile,wave
import numpy as np

ROOT=Path(__file__).resolve().parent.parent
BASE=ROOT/'src/assets/soundscape';OUT=ROOT/'docs/evidence/sampled-score-v27'
SR=22050;FRAMES=48*SR
hash_file=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()

def decode(path,channels):
    raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(path),'-f','f32le','-ar',str(SR),'-ac',str(channels),'-'])
    y=np.frombuffer(raw,dtype='<f4').reshape(-1,channels)
    assert np.isfinite(y).all() and np.max(np.abs(y))<1,path
    return y

manifest=json.loads((BASE/'provenance.json').read_text());prior=json.loads((OUT/'baseline-provenance.json').read_text())
sample=manifest['sampledPerformance'];source=ROOT/sample['manifest']
assert hash_file(source)==sample['manifestSha256']
assert hash_file(ROOT/sample['renderer'])==sample['rendererSha256']
inputs=json.loads(source.read_text());assert len(inputs['rawSamples'])==13
for item in inputs['rawSamples']:
    path=source.parent/item['path'];assert path.stat().st_size==item['size'];assert hash_file(path)==item['sha256']
assert hash_file(source.parent/'LICENSE')==inputs['licenseFileSha256']
for name,digest in sample['mappings'].items():assert hash_file(source.parent/name)==digest
for name in ['pilgrim-motif.mp3','pilgrim-foley.wav','cues.json']:
    assert (BASE/name).read_bytes()==(OUT/('baseline-'+name)).read_bytes(),name+' changed'
assert sum(a['bytes'] for a in manifest['assets'])<1600000
assert sample['performance']['chords']==[[50,57,60,64,69],[46,53,57,60,65],[41,53,57,60,67],[45,52,55,62,64]]
assert len(sample['performance']['notes'])==20
for note in sample['performance']['notes']:
    assert note['midi']==sample['performance']['chords'][note['section']][note['voice']]
    assert note['at']==note['section']*12-1 and note['seconds']==14
    assert abs(note['midi']-note['root'])<=2
for r in sample['performance']['recordings']:
    assert r['onset']<r['loopStart']<r['loopEnd']<r['release']<r['end']
    assert r['stereoJoinCorrelation']>.3
    assert .2<=r['crossfade']/SR<=.25

report={'schemaVersion':1,'heard':False,'devicePlayback':False,'renderedWebAudio':False,
        'scope':'File/decode/signal/source checks and music-only offline mixes; no perceptual quality pass',
        'reviewApproximation':'Same mode gain targets; mono stems centered rather than runtime motif pan .14; 1.5-second linear transitions rather than exponential ramps; no runtime compressor, ambience or effects',
        'sourceFiles':13,'sourceBytes':sum(x['size'] for x in inputs['rawSamples']),
        'canonicalMotifFoleyCuesUnchanged':True,'encodedRuntimeBytes':manifest['totalBytes'],'versions':{}}
weights={'pilgrim-harmony':[.55,.36,.48],'pilgrim-motif':[.48,.24,.28],'pilgrim-pulse':[.16,0,.64]}
for version in ['baseline','candidate']:
    records=[];mix=np.zeros((FRAMES,2));retained=0
    for asset in (prior if version=='baseline' else manifest)['assets']:
        name=asset['file'];path=OUT/('baseline-'+name) if version=='baseline' else BASE/name
        assert hash_file(path)==asset['sha256'];y=decode(path,asset['channels']);retained+=y.nbytes
        item={'file':name,'sha256':hash_file(path),'bytes':path.stat().st_size,'decodedFrames':len(y),
              'seconds':len(y)/SR,'channels':asset['channels'],'peak':float(np.max(np.abs(y))),
              'rms':float(np.sqrt(np.mean(y*y))),'clippedSamples':int(np.sum(np.abs(y)>=1))}
        if name.endswith('.mp3'):
            assert len(y)==FRAMES,name+' loses the shared48-second clock'
            delta=np.abs(np.diff(y,axis=0));jump=float(np.max(np.abs(y[0]-y[-1])));p99=float(np.percentile(delta,99))
            assert jump<.04 and jump<=p99,name+' decoded loop boundary'
            item.update(loopJump=jump,adjacentDeltaP99=p99)
            if y.shape[1]==2:
                item['stereoCorrelation']=float(np.corrcoef(y[:,0],y[:,1])[0,1])
                item['monoRms']=float(np.sqrt(np.mean(y.mean(axis=1)**2)))
                assert item['monoRms']>item['rms']*.65,'substantial mono cancellation'
            stereo=y if y.shape[1]==2 else np.repeat(y,2,axis=1)/np.sqrt(2)
            levels=weights[asset['purpose']];gain=np.repeat(levels,16*SR).astype(float)
            for boundary in [16*SR,32*SR]:gain[boundary:boundary+round(1.5*SR)]=np.linspace(gain[boundary-1],gain[boundary],round(1.5*SR))
            mix+=stereo*gain[:,None]*.75*.45
        records.append(item)
    assert retained==18587052,'authored-rate decoded residency changed'
    mix[:SR]*=np.linspace(0,1,SR)[:,None];mix[-SR:]*=np.linspace(1,0,SR)[:,None]
    assert np.max(np.abs(mix))<.9
    with tempfile.TemporaryDirectory() as temp:
        wav=Path(temp)/'mix.wav'
        with wave.open(str(wav),'wb') as w:
            w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes(np.round(mix*32767).astype('<i2').tobytes())
        review=OUT/(version+'-review.mp3')
        subprocess.run(['ffmpeg','-v','error','-y','-i',str(wav),'-map_metadata','-1','-codec:a','libmp3lame','-b:a','80k',str(review)],check=True)
    report['versions'][version]={'assets':records,'decodedRetainedBytes':retained,'review':str(review.relative_to(ROOT)),
        'reviewSha256':hash_file(review),'reviewPeak':float(np.max(np.abs(mix))),'reviewRms':float(np.sqrt(np.mean(mix*mix))),
        'reviewSegments':'0..16s title,16..32s exploration,32..48s combat; music only'}
report['passed']=True;(OUT/'verification.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'passed':True,'sourceBytes':report['sourceBytes'],'runtimeBytes':report['encodedRuntimeBytes'],
                  'stemsSynchronizedFrames':FRAMES,'canonicalPreserved':True,'heard':False}))
