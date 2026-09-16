#!/usr/bin/env python3
"""Q original composition / foley, with CC0 recorded instrument score performance.
Requires Python, NumPy, SciPy, ffmpeg (libmp3lame). --verify regenerates using
the same recorded toolchain; cross-host CI uses scripts/verify-soundscape.mjs.
Score: 80 BPM, 16 bars, D minor; synchronized 48-second circular stems.
"""
from pathlib import Path
import hashlib, json, subprocess, tempfile, wave, sys
import numpy as np
import scipy
import sampled_score
from scipy.signal import butter, sosfilt

ROOT = Path(__file__).resolve().parent.parent
DEST = ROOT / 'src/assets/soundscape'
SR, DURATION = 22050, 48
RNG = np.random.default_rng(0x51415348)

def noise(n, cutoff=3000, high=False):
    return sosfilt(butter(2, cutoff, fs=SR, btype='highpass' if high else 'lowpass', output='sos'), RNG.uniform(-1, 1, n))

def modal(freq, duration, attack=.008, decay=2, bright=.45):
    t = np.arange(round(duration*SR))/SR
    # Inharmonic resonators and a softly noisy attack make each struck sound distinct.
    y = sum(np.sin(2*np.pi*freq*r*t + .13*i)*np.exp(-t*(1+i*.68)/decay)*bright**i for i,r in enumerate([1,2.003,2.997,4.08,5.21]))
    return y * np.minimum(1,t/attack) * np.minimum(1,(duration-t)/.025)

def add(dst, signal, at, gain=1, pan=0):
    ids = (np.arange(len(signal)) + round(at*SR)) % len(dst)
    if dst.ndim == 2:
        dst[ids,0] += signal*gain*np.sqrt((1-pan)/2)
        dst[ids,1] += signal*gain*np.sqrt((1+pan)/2)
    else: dst[ids] += signal*gain

def room(y, wet=.16):
    # Circular early reflections / diffuse tails keep all stems seamless.
    out = y.copy()
    for i,delay in enumerate([.071,.113,.173,.251,.367,.521,.733,1.019,1.447,1.913]):
        reflected=np.roll(y,round(SR*delay),axis=0)
        if y.ndim==2 and i%2: reflected=reflected[:,::-1]
        out += reflected*wet*.77**i
    return out

def pcm(y):
    return np.round(np.clip(y,-.999,.999)*32767).astype('<i2').tobytes()

def wav(path,y):
    with wave.open(str(path),'wb') as w:
        w.setnchannels(2 if y.ndim==2 else 1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm(y))

def score():
    bed=np.zeros((SR*DURATION,2)); motif=np.zeros(SR*DURATION); pulse=np.zeros(SR*DURATION)
    chords=[[50,57,60,64,69],[46,53,57,60,65],[41,53,57,60,67],[45,52,55,62,64]]
    for section,notes in enumerate(chords):
        t=np.arange(round(14*SR))/SR
        env=np.minimum(1,t/2.2)*np.minimum(1,(14-t)/2.4)
        for voice,midi in enumerate(notes):
            f=440*2**((midi-69)/12)
            sound=np.zeros_like(t)
            for detune in [-.0019,.0011]:
                phase=2*np.pi*f*(1+detune)*t + .004*np.sin(t*2*np.pi*.19+voice)
                for h in range(1,7): sound += np.sin(phase*h+voice*.47)*(.51**(h-1))
            sound*=env*(.82+.18*np.sin(t*.64+voice))
            add(bed,sound,section*12-1,.026,(-.7+voice*.35))
    # A four-note identity grows into a response and a descending return, with rests.
    phrases=[[(0,74,1.8),(1.5,77,1.1),(2.25,81,2.6),(5.25,76,1.8),(7.5,74,2.8),(10.5,69,1.4)],
             [(0,77,2.2),(2.25,81,1.5),(4.5,84,2.4),(7.5,81,1.4),(9,77,2.6)],
             [(0,79,1.8),(1.5,81,1.6),(3.75,84,2.6),(7.5,79,2.5),(10.5,77,1.6)],
             [(0,76,2.3),(3,74,2.5),(6,72,2.8),(9.75,69,2.3)]]
    for section,phrase in enumerate(phrases):
        for at,midi,length in phrase:
            f=440*2**((midi-69)/12)
            add(motif,modal(f,length+.8,.014,1.35,.28),section*12+at,.21)
            add(motif,modal(f/2,length+.8,.35,2.1,.12),section*12+at+.045,.065)
        for beat in range(16):
            note=chords[section][[0,2,1,3,2,4,1,2][beat%8]]+12
            add(motif,modal(440*2**((note-69)/12),1.65,.008,.47,.31),section*12+beat*.75,.055 if beat%4 else .085)
    for beat in range(64):
        at=beat*.75
        if beat%4 in [0,2] or beat%16==15:
            t=np.arange(round(.75*SR))/SR
            thud=np.sin(2*np.pi*(46*t+28*.05*(1-np.exp(-t/.05))))*np.exp(-t*7)
            thud+=noise(len(t),750)*np.exp(-t*22)*.6
            add(pulse,thud*np.minimum(1,t/.004),at,.40 if beat%4==0 else .22)
        t=np.arange(round(.23*SR))/SR
        brush=noise(len(t),3600,True)*np.exp(-t*24)*np.minimum(1,t/.003)
        add(pulse,brush,at+.375,.105 if beat%2 else .06)
        if beat%8 in [3,6,7]: add(pulse,modal(137 if beat%2 else 184,.6,.003,.16,.12),at+.375,.20)
    return {'pilgrim-harmony':room(bed,.23), 'pilgrim-motif':room(motif,.21), 'pilgrim-pulse':room(pulse,.13)}

def effects():
    sounds={}
    for material,cutoff,tail,freq in [('earth',1100,.19,82),('stone',4200,.17,230),('wood',1900,.22,146),('water',2400,.38,370)]:
        for variant in range(3):
            length=tail*(.94+variant*.08); t=np.arange(round(length*SR))/SR
            y=noise(len(t),cutoff)*np.exp(-t*(19 if material!='water' else 9))*np.minimum(1,t/.002)
            y+=modal(freq*(1+variant*.073),length,.001,.035,.30)*.35
            if material=='water':
                y+=np.sin(2*np.pi*(450*t-170*t*t))*np.exp(-t*18)*.11
                y+=noise(len(t),4000)*np.exp(-((t-.09)/.045)**2)*.2
            sounds[f'step-{material}-{variant}']=y*.85
    for weapon,cutoff,duration in [('sword',3300,.32),('spear',2300,.23),('greatsword',1450,.48)]:
        t=np.arange(round(duration*SR))/SR
        sounds[f'whoosh-{weapon}']=noise(len(t),cutoff)*np.sin(np.pi*t/duration)**1.5*.85
        length=.63 if weapon=='greatsword' else .45;t=np.arange(round(length*SR))/SR
        impact=noise(len(t),2700)*np.exp(-t*24)*.8
        impact+=modal(63 if weapon=='greatsword' else 113,length,.002,.085,.18)*.7
        impact+=modal(710 if weapon=='spear' else 485,length,.002,.18,.64)*.15
        sounds[f'impact-{weapon}']=impact*np.minimum(1,t/.002)*.65
    for name,notes in [('ui-focus',[74]),('ui-confirm',[74,81]),('ui-back',[69,62]),('reward',[62,69,74,77,81]),('perfect',[81,86]),('title-rise',[50,57,62,69,74,81])]:
        length=3.8 if name=='title-rise' else 2.8 if name=='reward' else 1.3
        out=np.zeros(round(length*SR))
        for i,midi in enumerate(notes):
            at=i*(.24 if name=='title-rise' else .105); dur=length-at
            value=modal(440*2**((midi-69)/12),dur,.07 if name=='title-rise' else .008,.75 if name=='title-rise' else .31,.35)*(.17 if name=='title-rise' else .25)
            start=round(at*SR); end=min(len(out),start+len(value)); out[start:end]+=value[:end-start]
        sounds[name]=out
    atlas=[]; cues={}; offset=0
    for name,y in sounds.items():
        y*=min(1,.82/max(np.max(np.abs(y)),.0001)); y[0]=y[-1]=0
        cues[name]={'offset':round(offset/SR,6),'duration':round(len(y)/SR,6)}
        atlas.extend([y,np.zeros(round(.06*SR))]);offset+=len(y)+round(.06*SR)
    return np.concatenate(atlas),cues

def generate(out):
    out.mkdir(parents=True,exist_ok=True); assets=[]
    for name,y in sampled_score.render(score(),SR).items():
        if name=='pilgrim-motif':y*=.78/max(np.max(np.abs(y)),.0001)
        source=out/(name+'.wav');wav(source,y);path=out/(name+'.mp3')
        subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(source),'-map_metadata','-1','-codec:a','libmp3lame','-b:a','48k' if y.ndim==2 else '32k','-fflags','+bitexact',str(path)],check=True)
        source.unlink();assets.append({'file':path.name,'durationSeconds':48,'channels':2 if y.ndim==2 else 1,'sampleRate':SR,'pcmPeak':float(np.max(np.abs(y))),'pcmRms':float(np.sqrt(np.mean(y*y))),'purpose':name})
    atlas,cues=effects();wav(out/'pilgrim-foley.wav',atlas)
    assets.append({'file':'pilgrim-foley.wav','durationSeconds':len(atlas)/SR,'channels':1,'sampleRate':SR,'pcmPeak':float(np.max(np.abs(atlas))),'pcmRms':float(np.sqrt(np.mean(atlas*atlas))),'purpose':'24 original synthesized foley / signature cues'})
    (out/'cues.json').write_text(json.dumps(cues,indent=2)+'\n')
    for item in assets:
        data=(out/item['file']).read_bytes();item.update(bytes=len(data),sha256=hashlib.sha256(data).hexdigest())
    manifest={'schemaVersion':1,'title':'Pilgrim / The Fire Remembers','origin':'Original project-authored 48-second composition with recorded CC0 cello/viola sections, bass drum and tubular bells from VSCO 2 CE. Offline sample performance; the original synthesized motif, quiet pulse underlay and 24 synthesized foley cues remain. Not a live orchestral performance or generated voice.', 'license':'Original composition and synthesis created for Q; incorporated VSCO 2 CE recordings are CC0-1.0. Source recordings, official mappings, license and verified hashes are preserved in assets-source/soundscape-vsco. This provenance is not an independent legal authorship determination.', 'generator':'scripts/generate-soundscape.py','generatorSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'recipe':{'seed':'0x51415348','tempoBpm':80,'bars':16,'meter':'4/4','key':'D minor with added ninths','stemLoopSeconds':48,'synthesis':'recorded bowed cello/viola phrases, measured stereo sustain crossfades and natural releases, original modal motif/arpeggios, sampled low/metal percussion over restrained synthesized pulse, circular early reflections','encoder':'ffmpeg libmp3lame; MP3 stereo 48k / mono 32k; mono PCM16 foley'},'assets':assets,'cuesSha256':hashlib.sha256((out/'cues.json').read_bytes()).hexdigest(),'totalBytes':sum(x['bytes'] for x in assets)}
    manifest['sampledPerformance']=sampled_score.provenance()
    manifest['toolchain']={'numpy':np.__version__,'scipy':scipy.__version__,'ffmpeg':subprocess.check_output(['ffmpeg','-version'],text=True).splitlines()[0],'reproducibility':'Exact-byte regeneration is checked on the recorded toolchain only. Cross-host validation checks committed hash, sizes, bounds and source provenance; it does not promise cross-version MP3 identity.'}
    (out/'provenance.json').write_text(json.dumps(manifest,indent=2)+'\n')
    return manifest

if '--verify' in sys.argv:
    with tempfile.TemporaryDirectory() as tmp:
        generated=Path(tmp);manifest=generate(generated)
        for file in generated.iterdir():
            assert file.read_bytes()==(DEST/file.name).read_bytes(),f'Nonmatching generated asset: {file.name}'
        print(json.dumps({'passed':True,'assets':len(manifest['assets']),'bytes':manifest['totalBytes']}))
else:
    manifest=generate(DEST);print(json.dumps({'assets':len(manifest['assets']),'bytes':manifest['totalBytes']}))
