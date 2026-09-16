#!/usr/bin/env python3
"""Read-only, exact-source sampled score oracle. No hearing/device/Web Audio claims."""
from pathlib import Path
import hashlib,json,re,subprocess,sys,importlib.util
from datetime import datetime,timezone
import numpy as np
from scipy.signal import resample_poly
sys.dont_write_bytecode=True
ROOT=Path(sys.argv[1]).resolve()
OUTPUT=Path(sys.argv[2]).resolve()
BASE=ROOT/'src/assets/soundscape'
SOURCE=ROOT/'assets-source/soundscape-vsco'
SR=22050;FRAMES=48*SR
digest=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
blob=lambda b:hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()
manifest=json.loads((BASE/'provenance.json').read_text())
inputs=json.loads((SOURCE/'manifest.json').read_text())
performance=manifest['sampledPerformance']['performance']
tracked=[ROOT/p for p in ['scripts/sampled_score.py','scripts/generate-soundscape.py','scripts/verify-soundscape.mjs','scripts/verify-sampled-score.py','src/audio.js','src/file-audio-bank.js','src/soundscape-asset-urls.js']]
tracked += [BASE/'provenance.json',BASE/'cues.json',SOURCE/'manifest.json',SOURCE/'LICENSE']
tracked += list(SOURCE.glob('*.sfz'))+[BASE/a['file'] for a in manifest['assets']]
before={str(p.relative_to(ROOT)):digest(p) for p in tracked}
assert len(inputs['rawSamples'])==13
raw_records=[]
for item in inputs['rawSamples']:
    data=(SOURCE/item['path']).read_bytes()
    assert len(data)==item['size'] and hashlib.sha256(data).hexdigest()==item['sha256']
    assert blob(data)==item['sha']
    raw_records.append({'path':item['path'],'bytes':len(data),'sha256':item['sha256'],'gitBlob':blob(data)})
assert sum(r['bytes'] for r in raw_records)==28478818
assert digest(SOURCE/'LICENSE')==inputs['licenseFileSha256']
expected_sfz={'CelloEnsSusVib-Quiet.sfz':'dac0009b38effd46d19311bc5243d64be8bd1350','ViolaEnsSusVib-Quiet.sfz':'56d7c8097fed3a5158dcc0ad0c863ad7aa6fae74','TubularBells.sfz':'642fa96bb32942cdff10cfd052d55ad2a17d086e'}
regions={}
for name,git_sha in expected_sfz.items():
    data=(SOURCE/name).read_bytes()
    assert blob(data)==git_sha
    text=data.decode();prefix=re.search(r'default_path=([^\r\n]+)',text).group(1).strip().replace('\\','/')
    rows=[]
    for block in text.split('<region>')[1:]:
        values=dict(re.findall(r'(\w+)=([^\r\n]+)',block))
        rows.append({'path':prefix+values['sample'],**{k:int(values[k]) for k in ['lokey','hikey','pitch_keycenter','lovel','hivel']}})
    regions[name]=rows
chords=[[50,57,60,64,69],[46,53,57,60,65],[41,53,57,60,67],[45,52,55,62,64]]
assert performance['chords']==chords and len(performance['notes'])==20
note_records=[]
for note in performance['notes']:
    assert note['midi']==chords[note['section']][note['voice']]
    assert note['at']==note['section']*12-1 and note['seconds']==14
    patch='CelloEnsSusVib-Quiet.sfz' if note['voice']<2 else 'ViolaEnsSusVib-Quiet.sfz'
    matches=[r for r in regions[patch] if r['lokey']<=note['midi']<=r['hikey'] and r['lovel']<=60<=r['hivel']]
    assert len(matches)==1
    r=matches[0];assert r['path']==note['source'] and r['pitch_keycenter']==note['root']
    assert abs(note['midi']-note['root'])<=2
    note_records.append({'midi':note['midi'],'sourceRoot':note['root'],'at':note['at'],'officialMapping':patch})
drums=[e for e in performance['pulseEvents'] if e['kind']=='bass-drum']
bells=[e for e in performance['pulseEvents'] if e['kind']=='tubular-bell']
assert [e['at'] for e in drums]==[b*.75 for b in range(64) if b%4 in [0,2] or b%16==15]
assert [e['roundRobin'] for e in drums]==[i%2+1 for i in range(36)]
assert [e['at'] for e in bells]==[b*.75+.375 for b in range(64) if b%8 in [3,6,7]]
bell_region=next(r for r in regions['TubularBells.sfz'] if r['path'].endswith('TB_hit_C4_v4_rr1.wav'))
for e in bells:assert e['root']==bell_region['pitch_keycenter']==60 and bell_region['lokey']<=e['midi']<=bell_region['hikey']
base_sha=subprocess.check_output(['git','rev-parse','fb70ddd'],cwd=ROOT,text=True).strip()
baseline=lambda p:subprocess.check_output(['git','show',base_sha+':'+p],cwd=ROOT)
for name in ['pilgrim-motif.mp3','pilgrim-foley.wav','cues.json']:
    assert (BASE/name).read_bytes()==baseline('src/assets/soundscape/'+name)
def executable_text(b):
    return re.sub(r'(?m)^\s*//[^\n]*$','',b.decode()).strip()
for name in ['src/audio.js','src/file-audio-bank.js','src/soundscape-asset-urls.js']:
    assert executable_text((ROOT/name).read_bytes())==executable_text(baseline(name)),name+' runtime code changed'
def decode(path,channels):
    info=json.loads(subprocess.check_output(['ffprobe','-v','error','-select_streams','a:0','-show_entries','stream=codec_name,sample_rate,channels','-of','json',str(path)]))['streams'][0]
    assert int(info['sample_rate'])==SR and info['channels']==channels
    raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(path),'-f','f32le','-ac',str(channels),'-ar',str(SR),'-'])
    y=np.frombuffer(raw,dtype='<f4').reshape(-1,channels).astype(np.float64)
    assert np.isfinite(y).all()
    return y,info
def rms(y):return float(np.sqrt(np.mean(y*y)))
def window_metric(y,cut,half):
    window=y[(np.arange(-half,half)+cut)%len(y)]
    return {'jump':float(np.max(np.abs(window[half]-window[half-1]))),'maxDelta':float(np.max(np.abs(np.diff(window,axis=0)))),'rms':rms(window)}
signals={};asset_reports=[];retained=0
for a in manifest['assets']:
    path=BASE/a['file'];assert digest(path)==a['sha256'] and path.stat().st_size==a['bytes']
    y,info=decode(path,a['channels']);retained+=y.size*4
    peak=float(np.max(np.abs(y)));peak4=float(np.max(np.abs(resample_poly(y,4,1,axis=0))))
    assert peak<1 and peak4<1
    record={'file':a['file'],'sha256':a['sha256'],'bytes':a['bytes'],'stream':info,'decodedFrames':len(y),'decodedSeconds':len(y)/SR,'samplePeak':peak,'polyphase4xPeakEstimate':peak4,'rms':rms(y),'digitalClippedSamples':int(np.sum(np.abs(y)>=1))}
    if a['file'].endswith('.mp3'):
        assert len(y)==FRAMES
        signals[a['purpose'].removeprefix('pilgrim-')]=y
        cuts=[window_metric(y,round(bar*3*SR),round(.006*SR)) for bar in range(1,16)]
        seam=window_metric(y,0,round(.006*SR))
        record['loopComparison']={'sameWindowHalfSeconds':round(.006*SR)/SR,'loopBoundary':seam,'internalBarCuts':cuts,'internalRanges':{k:[min(v[k] for v in cuts),max(v[k] for v in cuts)]for k in seam},'boundaryMaxDeltaWithinObservedInternalMax':seam['maxDelta']<=max(v['maxDelta']for v in cuts),'interpretation':'Descriptive equal-window comparison, not an audibility threshold. The authored 6ms seam fade causes a short RMS dip.'}
        if y.shape[1]==2:record['mono']={'correlation':float(np.corrcoef(y[:,0],y[:,1])[0,1]),'monoRms':rms(y.mean(axis=1)),'monoToStereoRmsRatio':rms(y.mean(axis=1))/rms(y)}
    asset_reports.append(record)
assert retained==18587052
assert sum(a['bytes']for a in manifest['assets'])==manifest['totalBytes']<1600000
pan=(.14+1)*np.pi/4
stereo={'harmony':signals['harmony'],'motif':signals['motif']*np.array([np.cos(pan),np.sin(pan)]),'pulse':signals['pulse']*np.sqrt(.5)}
modes={'title':[.55,.48,.16],'exploration':[.36,.24,0],'combat':[.48,.28,.64]}
mix_reports=[]
for mode,weights in modes.items():
    mix=sum(stereo[key]*weight for key,weight in zip(['harmony','motif','pulse'],weights))
    peak=float(np.max(np.abs(mix)));peak4=float(np.max(np.abs(resample_poly(mix,4,1,axis=0))))
    assert peak<1 and peak4<1
    mix_reports.append({'mode':mode,'fullCueSeconds':48,'actualMotifPan':.14,'unityBusMasterPeak':peak,'unityBusMaster4xPeakEstimate':peak4,'defaultBusMasterPeak':peak*.75*.45,'unityHeadroomDb':float(-20*np.log10(peak)),'defaultHeadroomDb':float(-20*np.log10(peak*.75*.45)),'rms':rms(mix),'scope':'Music only before compressor, complete 48s at constant mode gains; excludes live SFX/ambience.'})
upper=sum(np.abs(stereo[key])*weight for key,weight in zip(['harmony','motif','pulse'],[.55,.48,.64]))
upper_peak=float(np.max(upper));assert upper_peak<1
# The production code also accepts contexts without createStereoPanner. Mono
# then upmixes without the equal-power panner attenuation; check that branch too.
without_panner={'harmony':signals['harmony'],'motif':np.repeat(signals['motif'],2,axis=1),'pulse':np.repeat(signals['pulse'],2,axis=1)}
no_panner_modes={mode:float(np.max(np.abs(sum(without_panner[key]*weight for key,weight in zip(['harmony','motif','pulse'],weights)))))for mode,weights in modes.items()}
no_panner_bound=float(np.max(sum(np.abs(without_panner[key])*weight for key,weight in zip(['harmony','motif','pulse'],[.55,.48,.64]))))
assert no_panner_bound<1
# Inspect generated individual notes, retaining the original source's exact PCM.
spec=importlib.util.spec_from_file_location('q_sampled_score_audit',ROOT/'scripts/sampled_score.py')
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
raw={i['path']:module.source_audio(i,SR) for i in inputs['rawSamples'] if i['path'].startswith('Strings/')}
points={r['path']:r for r in performance['recordings']}
bow_reports=[]
for note in performance['notes']:
    y,joins=module.bow(raw[note['source']],points[note['source']],note['root'],note['midi'],note['voice'],SR)
    assert len(y)==14*SR and np.isfinite(y).all()
    last=int(np.flatnonzero(np.max(np.abs(y),axis=1)>0)[-1])
    join_records=[]
    for seconds in joins:
        at=round(seconds*SR)
        if at>=last:continue
        metric=window_metric(y,at,round(.006*SR))
        join_records.append({'seconds':seconds,**metric})
    control=[window_metric(y,round(seconds*SR),round(.006*SR))for seconds in np.arange(2,11.75,.75)]
    end_jump=float(np.max(np.abs(y[last])))
    bow_reports.append({'source':note['source'],'midi':note['midi'],'sourceRoot':note['root'],'paddedSeconds':len(y)/SR,'lastNonzeroSeconds':last/SR,'releaseCutJump':end_jump,'ordinaryAdjacentDeltaP99':float(np.percentile(np.abs(np.diff(y[:last+1],axis=0)),99)),'joins':join_records,'internalControlMaxDelta':max(c['maxDelta']for c in control)})
changed=[str(p.relative_to(ROOT))for p in tracked if digest(p)!=before[str(p.relative_to(ROOT))]]
assert not changed,'audited source changed during run'
report={'checkedAt':datetime.now(timezone.utc).isoformat(),'repo':str(ROOT),'baselineCommit':base_sha,'boundary':'Offline file, metadata, actual PCM decode, resampled note and mathematical mix analysis only. No hearing, musical-preference judgment, actual Web Audio output, phone speaker, FPS or quality-parity evidence.','sourceHashes':before,'changedDuringRun':changed,'licensing':{'publisher':'https://versilian-studios.com/vsco-community/','officialLicense':'https://github.com/sgossner/VSCO-2-CE/blob/master/LICENSE','cc0Deed':'https://creativecommons.org/publicdomain/zero/1.0/','selectedWavCount':13,'selectedWavBytes':28478818,'rawFiles':raw_records,'officialSfzBlobIds':expected_sfz},'eventContract':{'notes':note_records,'drumEvents':len(drums),'bellEvents':len(bells),'barCount':16,'tempoBpm':80,'motifFoleyCuesByteIdentical':True,'runtimeExecutableCodeUnchanged':True},'assets':asset_reports,'runtimeEncodedBytes':manifest['totalBytes'],'runtimeEncodedBudget':1600000,'authoredRateDecodedBytes':retained,'mixes':mix_reports,'conservativeAnyModeTransitionMusicOnlyUnityPeakBound':upper_peak,'withoutStereoPanner':{'constantModeUnityPeaks':no_panner_modes,'conservativeAnyModeTransitionMusicOnlyUnityPeakBound':no_panner_bound},'bows':bow_reports,'limitations':['4x polyphase peak is an intersample estimate, not a certified true-peak meter.','Loop-boundary RMS dips and crossfade metrics do not establish natural bowing or perceived seamlessness.','The offline review mixes approximate real transitions; this oracle uses actual motif pan and full-cue constant mode levels.'],'passed':True}
OUTPUT.parent.mkdir(parents=True,exist_ok=True);OUTPUT.write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'output':str(OUTPUT),'passed':True,'runtimeBytes':report['runtimeEncodedBytes'],'musicOnlyUnityPeakBound':upper_peak,'mixes':mix_reports,'loopBoundaryWithinInternalMax':{a['file']:a['loopComparison']['boundaryMaxDeltaWithinObservedInternalMax']for a in asset_reports if 'loopComparison'in a},'changedDuringRun':changed},indent=2))
