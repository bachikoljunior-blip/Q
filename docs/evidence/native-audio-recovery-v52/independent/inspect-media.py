from pathlib import Path
import hashlib,json,subprocess,sys,datetime
root=Path(sys.argv[1]).resolve();out=Path(__file__).resolve().parent/sys.argv[2];H=lambda x:hashlib.sha256(x).hexdigest();rows=[]
files=sorted(list((root/'src/assets/soundscape').glob('*.mp3'))+list((root/'src/assets/soundscape').glob('*.wav'))+list((root/'src/assets/vaults').glob('*.wav')))
for f in files:
 data=f.read_bytes();meta=json.loads(subprocess.check_output(['ffprobe','-v','error','-select_streams','a:0','-show_entries','stream=sample_rate,channels,duration','-of','json','-i',str(f)]))['streams'][0]
 pcm=subprocess.check_output(['ffmpeg','-v','error','-i',str(f),'-f','f32le','-acodec','pcm_f32le','-']); rate=int(meta['sample_rate']); channels=meta['channels'];frames=len(pcm)//4//channels
 assert H(f.read_bytes())==H(data),'file changed during inspection: '+str(f)
 rows.append({'file':str(f.relative_to(root)),'name':f.name,'sha256':H(data),'bytes':len(data),'sampleRate':rate,'channels':channels,'decodedFrames':frames,'decodedSeconds':frames/rate,'decodedFloatBytes':len(pcm),'decodedFloatSha256':H(pcm),'containerDuration':meta.get('duration')})
out.write_text(json.dumps({'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'root':str(root),'assets':rows,'boundary':'Fresh FFprobe/FFmpeg original bytes and offline PCM inspection; not Web Audio or listening. Source files unchanged during each inspection.'},indent=2)+'\n');print(json.dumps({'file':str(out),'assets':len(rows),'encodedBytes':sum(x['bytes']for x in rows)},indent=2))
