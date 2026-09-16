"""Offline CC0 sample performance for Q's existing score; no runtime sampler.

Pitch maps come from the publisher's SFZ, never filename octave assumptions.
Recorded stereo attacks/releases survive; long tones join steady bowed portions
with measured stereo correlation and cosine crossfades, not time stretching.
"""
from pathlib import Path
from fractions import Fraction
import hashlib, json, re, subprocess
import numpy as np
from scipy.signal import resample_poly

ROOT=Path(__file__).resolve().parent.parent
SOURCE=ROOT/'assets-source/soundscape-vsco'
CHORDS=[[50,57,60,64,69],[46,53,57,60,65],[41,53,57,60,67],[45,52,55,62,64]]
REPORT={}

def smooth(n):
    return .5-.5*np.cos(np.pi*np.clip(n,0,1))

def append_crossfade(a,b,n):
    n=min(n,len(a),len(b));weight=smooth(np.linspace(0,1,n))[:,None]
    return np.concatenate((a[:-n],a[-n:]*(1-weight)+b[:n]*weight,b[n:]))

def inspect_bow(y,sr):
    window=round(sr*.05)
    envelope=np.array([np.sqrt(np.mean(y[i:i+window]**2)) for i in range(0,len(y),window)])
    active=np.flatnonzero(envelope>envelope.max()*.10)
    onset=max(0,int(active[0]*window-sr*.045));end=min(len(y),int((active[-1]+1)*window+sr*.15))
    release=max(onset+sr*3,end-round(sr*1.05))
    cross=round(sr*.22);best=None
    # Compare a quarter-second of the actual stereo waveform on both sides.
    # A long steady middle segment preserves the recorded vibrato variation.
    starts=np.arange(onset+round(sr*1.1),onset+round(sr*1.85),round(sr*.11))
    ends=np.arange(onset+round(sr*4.1),min(release-round(sr*.4),onset+round(sr*5.7)),round(sr*.031))
    for a in starts:
        head=y[a:a+cross]
        for b in ends:
            tail=y[b-cross:b]
            if len(head)!=cross or len(tail)!=cross:continue
            correlation=float(np.sum(head*tail)/max(1e-12,np.sqrt(np.sum(head*head)*np.sum(tail*tail))))
            level=abs(np.log(max(1e-8,np.mean(head*head))/max(1e-8,np.mean(tail*tail))))
            score=correlation-.06*level
            if best is None or score>best[0]:best=(score,int(a),int(b),correlation)
    if best is None:raise ValueError('Recorded bow has no sufficiently long steady region')
    return {'onset':onset,'end':end,'release':int(release),'loopStart':best[1],
            'loopEnd':best[2],'crossfade':cross,'stereoJoinCorrelation':best[3]}

def source_audio(item,sr):
    path=SOURCE/item['path'];data=path.read_bytes()
    assert len(data)==item['size'] and hashlib.sha256(data).hexdigest()==item['sha256'],path
    raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(path),'-f','f32le','-ar',str(sr),'-ac','2','-'])
    return np.frombuffer(raw,dtype='<f4').reshape(-1,2).astype(np.float64)

def mapping(name):
    text=(SOURCE/name).read_text();prefix=re.search(r'default_path=(.+)',text).group(1).strip().replace('\\','/')
    regions=[]
    for block in text.split('<region>')[1:]:
        values=dict(re.findall(r'(\w+)=([^\r\n]+)',block))
        regions.append({'path':prefix+values['sample'],**{key:int(values[key]) for key in ['lokey','hikey','pitch_keycenter','lovel','hivel']}})
    return regions

def choose(regions,note):
    return next(r for r in regions if r['lokey']<=note<=r['hikey'] and r['lovel']<=60<=r['hivel'])

def pitched(y,root,note):
    # Polyphase resampling shifts pitch and duration together. Ratios stay within
    # two semitones for strings; this is not a phase-vocoder or stretched note.
    ratio=Fraction(2**((root-note)/12)).limit_denominator(2000)
    return resample_poly(y,ratio.numerator,ratio.denominator,axis=0),float(ratio)

def bow(y,points,root,note,voice,sr):
    y,ratio=pitched(y,root,note)
    p={k:round(points[k]*ratio) for k in ['onset','end','release','loopStart','loopEnd','crossfade']}
    sound=y[p['onset']:p['loopEnd']].copy();cycle=y[p['loopStart']:p['loopEnd']]
    hold=round(sr*(12.1+voice*.025));joins=[]
    while len(sound)<hold:
        joins.append((len(sound)-p['crossfade'])/sr)
        sound=append_crossfade(sound,cycle,p['crossfade'])
    # Use the original bow release, not a synthetic long exponential in its place.
    tail=y[p['release']:p['end']];sound=append_crossfade(sound[:hold],tail,round(sr*.30))
    total=round(sr*14);sound=sound[:total]
    if len(sound)<total:sound=np.pad(sound,((0,total-len(sound)),(0,0)))
    t=np.arange(total)/sr
    envelope=smooth(t/(.62+voice*.035))*smooth((14-t)/1.15)
    # One restrained phrase arc plus small independently phased bow pressure.
    pressure=.82+.13*np.sin(np.pi*np.clip(t/14,0,1))+.035*np.sin(t*.77+voice*.83)
    sound*=envelope[:,None]*pressure[:,None]
    rms=float(np.sqrt(np.mean(sound*sound)));sound*=.095/max(rms,1e-8)
    return sound,joins

def add(dst,y,seconds,gain=1,pan=0):
    if dst.ndim==1:
        if y.ndim==2:y=y.mean(axis=1)
    else:
        # Preserve recorded L/R while narrowing placement, never fake stereo
        # through polarity inversion or a channel delay.
        mid=y.mean(axis=1);side=(y[:,0]-y[:,1])*.24
        y=np.column_stack((mid+side,mid-side));y*=np.array([np.sqrt((1-pan)/2),np.sqrt((1+pan)/2)])
    ids=(np.arange(len(y))+round(seconds*REPORT['sampleRate']))%len(dst)
    dst[ids]+=y*gain

def room(y,sr,wet):
    out=y.copy()
    for i,seconds in enumerate([.071,.113,.173,.251,.367,.521,.733,1.019,1.447,1.913]):
        reflected=np.roll(y,round(sr*seconds),axis=0)
        if y.ndim==2 and i%2:reflected=reflected[:,::-1]
        out+=reflected*wet*.77**i
    return out

def master(y,rms,peak):
    y-=y.mean(axis=0)
    gain=min(rms/max(1e-9,np.sqrt(np.mean(y*y))),peak/max(1e-9,np.max(np.abs(y))))
    y*=gain
    # MP3 encoders lack preceding/following-cycle context. A very short common
    # seam treatment controls codec edge ringing while preserving musical phase.
    n=round(REPORT['sampleRate']*.006);fade=smooth(np.linspace(0,1,n))
    if y.ndim==2:fade=fade[:,None]
    y[:n]*=fade;y[-n:]*=fade[::-1]
    return y

def render(original,sr=22050):
    global REPORT
    manifest=json.loads((SOURCE/'manifest.json').read_text())
    REPORT={'schemaVersion':1,'sampleRate':sr,'seconds':48,'chords':CHORDS,'recordings':[],
            'notes':[],'pulseEvents':[],'heard':False,'method':'Recorded stereo attacks, correlation-selected bowed sustain crossfades, original releases, circular placement/reflections'}
    sources={item['path']:source_audio(item,sr) for item in manifest['rawSamples']}
    patches=[mapping('CelloEnsSusVib-Quiet.sfz'),mapping('ViolaEnsSusVib-Quiet.sfz')]
    points={path:inspect_bow(y,sr) for path,y in sources.items() if path.startswith('Strings/')}
    for path,p in points.items():REPORT['recordings'].append({'path':path,**p,'analysisRate':sr})
    bed=np.zeros((sr*48,2));pulse=original['pilgrim-pulse']*.085
    for section,chord in enumerate(CHORDS):
        for voice,note in enumerate(chord):
            region=choose(patches[0 if voice<2 else 1],note);path=region['path']
            sound,joins=bow(sources[path],points[path],region['pitch_keycenter'],note,voice,sr)
            pan=[-.28,-.16,.20,.37,.46][voice];gain=[.84,.63,.61,.56,.50][voice]
            add(bed,sound,section*12-1,gain,pan)
            REPORT['notes'].append({'section':section,'voice':voice,'midi':note,'at':section*12-1,'seconds':14,
                                    'source':path,'root':region['pitch_keycenter'],'pan':pan,'gain':gain,'internalCrossfadesSeconds':joins})
    drums=[sources[f'Percussion/BDrumNewhit_v2_rr{i}_Sum.wav'] for i in [1,2]]
    bell=sources['Percussion/TB_hit_C4_v4_rr1.wav'];bell=bell/ max(.001,np.max(np.abs(bell)))*.45
    hit=0
    for beat in range(64):
        if beat%4 in [0,2] or beat%16==15:
            sound=drums[hit%2];sound=sound/max(.001,np.max(np.abs(sound)))*.64
            gain=.72 if beat%4==0 else .39
            add(pulse,sound,beat*.75,gain)
            REPORT['pulseEvents'].append({'at':beat*.75,'kind':'bass-drum','roundRobin':hit%2+1,'gain':gain});hit+=1
        if beat%8 in [3,6,7]:
            # Existing accent timing, now a D-minor tonic bell. Stay inside the
            # publisher's C4 sample zone (MIDI60..63), with no octave guess.
            note=62;sound,_=pitched(bell,60,note)
            # Let the captured metallic decay run; circular add carries the end.
            add(pulse,sound,beat*.75+.375,.035)
            REPORT['pulseEvents'].append({'at':beat*.75+.375,'kind':'tubular-bell','midi':note,'root':60,'gain':.035})
    return {**original,'pilgrim-harmony':master(room(bed,sr,.12),.135,.72),
            'pilgrim-pulse':master(room(pulse,sr,.075),.10,.76)}

def provenance():
    return {'manifest':'assets-source/soundscape-vsco/manifest.json',
            'manifestSha256':hashlib.sha256((SOURCE/'manifest.json').read_bytes()).hexdigest(),
            'renderer':'scripts/sampled_score.py','rendererSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
            'mappings':{name:hashlib.sha256((SOURCE/name).read_bytes()).hexdigest() for name in ['CelloEnsSusVib-Quiet.sfz','ViolaEnsSusVib-Quiet.sfz','TubularBells.sfz']},
            'license':'CC0-1.0','publisher':'Versilian Studios / Sam Gossner; recordings with Simon Dalzell',
            'publisherUrl':'https://versilian-studios.com/vsco-community/','performance':REPORT}
