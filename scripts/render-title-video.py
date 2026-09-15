"""Original 12-second animated illustration from the retained Q title painting.
Requires Python 3, numpy, Pillow and ffmpeg/libx264; never a gameplay capture.
Writes only encoded deliverable + compact metadata; no raw-frame cache.
"""
from pathlib import Path
import hashlib, json, math, subprocess, time
from datetime import datetime, timezone
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, __version__ as pillow_version
ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'src/assets/title/north-gate-v22.png'
OUTPUT = ROOT / 'src/assets/title/north-gate-v23.mp4'
W, H, FPS, SECONDS = 1280, 720, 24, 12
TAU = math.tau
start = time.perf_counter(); started = datetime.now(timezone.utc).isoformat()
source = Image.open(SOURCE).convert('RGB')
# Animate the existing art as a continuous camera orbit, not a fake 3D reconstruction.
# Integer-harmonic trajectories, including edge-faded ash, have period 12 seconds.
y, x = np.mgrid[0:H, 0:W].astype(np.float32)
x /= W; y /= H
# Protect the traveler's silhouette while vapor moves through the valley.
traveler = np.exp(-(((x-.70)/.115)**2 + ((y-.70)/.29)**2)*2)
valley = np.exp(-((y-.65)/.22)**2) * (1-traveler*.96)
fog_color = np.array([112,136,142], dtype=np.float32)
crown = np.exp(-(((x-.744)/.055)**2+((y-.157)/.065)**2)*2)
hand = np.exp(-(((x-.632)/.035)**2+((y-.651)/.048)**2)*2)
rng = np.random.default_rng(230915)
ash = [(float(rng.random()),float(rng.random()),float(rng.uniform(.6,1.45)),float(rng.random()),int(rng.integers(1,3))) for _ in range(44)]
command = ['ffmpeg','-hide_banner','-loglevel','error','-y','-f','rawvideo','-pixel_format','rgb24','-video_size',f'{W}x{H}','-framerate',str(FPS),'-i','pipe:0','-an','-c:v','libx264','-preset','slow','-qp','24','-x264-params','ipratio=1:pbratio=1','-profile:v','high','-level:v','3.1','-pix_fmt','yuv420p','-movflags','+faststart','-g',str(FPS*2),'-keyint_min',str(FPS*2),'-sc_threshold','0','-threads','2','-map_metadata','-1','-metadata','title=Q - North gate animated illustration',str(OUTPUT)]
process = subprocess.Popen(command,stdin=subprocess.PIPE)
for frame in range(FPS*SECONDS):
    phase = TAU*frame/(FPS*SECONDS)
    zoom = 1.022 + .008*(1-math.cos(phase))
    sw, sh = source.width/zoom, source.height/zoom
    cx = source.width*(.5 + .0045*math.sin(phase)); cy=source.height*(.5+.0018*math.sin(phase))
    camera = source.transform((W,H),Image.Transform.EXTENT,(cx-sw/2,cy-sh/2,cx+sw/2,cy+sh/2),Image.Resampling.BICUBIC)
    pixels = np.asarray(camera,dtype=np.float32)
    vapor = (np.sin(x*TAU*2.2+y*11-phase)*.36 + np.sin(x*15-y*19+phase*2)*.22 + .52)
    density = np.maximum(0,vapor)*valley*.078
    pixels = pixels*(1-density[:,:,None]) + fog_color*density[:,:,None]
    fire = .6*math.sin(phase*3)+.25*math.sin(phase*7+.4)+.15*math.cos(phase*11)
    pixels += (crown*.055+hand*.035)[:,:,None]*np.array([125,71,27])*fire
    rendered = Image.fromarray(np.uint8(np.clip(pixels,0,255)))
    particle_layer = Image.new('RGBA',(W,H)); draw=ImageDraw.Draw(particle_layer)
    for ax,ay,size,offset,speed in ash:
        px=(ax+.11*math.sin(phase+offset*TAU))%1
        py=(ay-frame/(FPS*SECONDS)*speed)%1
        fade=min(1,py*14,(1-py)*14,px*20,(1-px)*20)
        alpha=int(100*fade*(.7+.3*math.sin(phase+offset*TAU))*(.4 if px<.42 else 1))
        color=(203,177,135,alpha) if offset>.7 else (153,173,178,alpha)
        r=size; draw.ellipse((px*W-r,py*H-r,px*W+r,py*H+r),fill=color)
    rendered=Image.alpha_composite(rendered.convert('RGBA'),particle_layer).convert('RGB')
    process.stdin.write(rendered.tobytes())
process.stdin.close()
if process.wait()!=0: raise SystemExit('ffmpeg failed')
probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(OUTPUT)]))
metadata={'type':'original-offline-rendered-animated-illustration','source':str(SOURCE.relative_to(ROOT)),'sourceSha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),'file':str(OUTPUT.relative_to(ROOT)),'sha256':hashlib.sha256(OUTPUT.read_bytes()).hexdigest(),'bytes':OUTPUT.stat().st_size,'durationSeconds':SECONDS,'width':W,'height':H,'fps':FPS,'frames':FPS*SECONDS,'audioStreams':0,'recipe':'Periodic slow camera orbit and breathing push, layered valley vapor, localized crown/hand firelight, edge-faded drifting ash. All trajectories use integer harmonics of the loop. Original art remains unedited.','claimBoundary':'Animated title illustration, not gameplay, live filming, volumetric reconstruction, or proof of PS4 visual parity.','encoder':subprocess.check_output(['ffmpeg','-version'],text=True).splitlines()[0],'pillow':pillow_version,'numpy':np.__version__,'encoderArguments':command[1:-1],'generatorSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'startedAt':started,'completedAt':datetime.now(timezone.utc).isoformat(),'renderEncodeWallSeconds':round(time.perf_counter()-start,3),'probe':probe}
(ROOT/'docs/evidence/title-video/media.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({key:metadata[key] for key in ['file','bytes','sha256','durationSeconds','width','height','frames','renderEncodeWallSeconds']}))
