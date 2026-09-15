"""Decode the real MP4 and record loop/container evidence, not browser/device QA."""
from pathlib import Path
import json, hashlib, subprocess, struct
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
meta_path=ROOT/'docs/evidence/title-video/media.json'
m=json.loads(meta_path.read_text()); video=ROOT/m['file']; data=video.read_bytes()
assert hashlib.sha256(data).hexdigest()==m['sha256'] and len(data)==m['bytes']
p=json.loads(subprocess.check_output(['ffprobe','-v','error','-count_frames','-show_streams','-show_format','-of','json',str(video)]))
v=p['streams']; assert len(v)==1 and v[0]['codec_name']=='h264' and v[0]['pix_fmt']=='yuv420p'
assert (v[0]['width'],v[0]['height'])==(1280,720) and int(v[0]['nb_read_frames'])==288 and float(p['format']['duration'])==12
boxes=[]; offset=0
while offset<len(data):
    length,kind=struct.unpack('>I4s',data[offset:offset+8]); boxes.append(kind.decode()); assert length>=8; offset+=length
assert boxes.index('moov')<boxes.index('mdat')
raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(video),'-vf','scale=320:180','-f','rawvideo','-pix_fmt','rgb24','pipe:1'])
frames=np.frombuffer(raw,dtype=np.uint8).reshape(288,180,320,3).astype(np.float32)
adj=np.abs(frames[1:]-frames[:-1]).mean(axis=(1,2,3)); seam=float(np.abs(frames[0]-frames[-1]).mean())
assert np.isfinite(adj).all() and float(adj.min())>0, 'video contains non-moving duplicated frames'
# Compare the loop's IDR transition with the same encoded transition every 2 s,
# not ordinary predicted frames. Equal quantization removes the initial refresh excess.
keyframe_changes=adj[[47,95,143,191,239]]
assert seam<float(keyframe_changes.max())*1.10 and seam<2, 'loop exceeds matching IDR boundary envelope'
report={'passed':True,'decodedFrames':288,'decodePath':'ffprobe count_frames and ffmpeg decode of every frame; RGB analysis at 320x180','codec':v[0]['codec_name'],'profile':v[0]['profile'],'level':v[0]['level'],'pixelFormat':v[0]['pix_fmt'],'width':v[0]['width'],'height':v[0]['height'],'durationSeconds':float(p['format']['duration']),'bitrate':int(p['format']['bit_rate']),'audioStreams':0,'boxes':boxes,'fastStart':True,'adjacentFrameMeanAbsRgb':{'min':float(adj.min()),'median':float(np.median(adj)),'p95':float(np.percentile(adj,95)),'max':float(adj.max())},'seamMeanAbsRgb':seam,'internalIdrMeanAbsRgb':keyframe_changes.tolist(),'seamVsMaximumInternalIdr':seam/float(keyframe_changes.max()),'sha256':m['sha256'],'limitation':'Decoded moving video and seam evidence only; not browser playback, iOS/Android decoder performance, perceived title excitement, or PS4 parity.'}
(ROOT/'docs/evidence/title-video/decode.json').write_text(json.dumps(report,indent=2)+'\n')
subprocess.run(['ffmpeg','-v','error','-y','-i',str(video),'-vf','select=eq(n\\,0)+eq(n\\,72)+eq(n\\,144)+eq(n\\,216)+eq(n\\,287),scale=640:360,tile=5x1','-frames:v','1',str(ROOT/'docs/evidence/title-video/frames.jpg')],check=True)
print(json.dumps(report))
