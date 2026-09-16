"""Rebuild the bounded foliage sprites from retained CC0 Poly Haven source maps.
Pillow 12.3.0, NumPy 2.4.3, SciPy 1.17.0, Python 3. Recomposition is original Q art; source is not generated.
"""
from pathlib import Path
from collections import deque
from PIL import Image, ImageDraw, ImageFilter
import numpy as np
from scipy.ndimage import distance_transform_edt
import hashlib, json, time, math
ROOT=Path(__file__).parent
started=time.perf_counter()
def cutout(family,box,seed):
    rgb=Image.open(ROOT/f'{family}-diff.jpg').convert('RGB').crop(box)
    a=Image.open(ROOT/f'{family}-alpha.jpg').convert('L').crop(box)
    width,height=a.size; data=a.load(); seen=set(); todo=deque([seed])
    while todo:
        x,y=todo.popleft()
        if (x,y) in seen or x<0 or y<0 or x>=width or y>=height or data[x,y]<96: continue
        seen.add((x,y));todo.extend([(x-1,y),(x+1,y),(x,y-1),(x,y+1)])
    mask=Image.new('L',a.size); p=mask.load()
    for x,y in seen:p[x,y]=255
    # Retain the source's anti-aliased boundary, excluding unrelated atlas islands.
    dilated=mask.filter(ImageFilter.MaxFilter(3)); dp=dilated.load()
    for y in range(height):
        for x in range(width):p[x,y]=data[x,y] if dp[x,y] else 0
    rgb.putalpha(mask);return rgb

def paste_rotated(canvas,source,base,height,angle):
    sprite=source.resize((round(source.width*height/source.height),height),Image.Resampling.LANCZOS)
    alpha=sprite.getchannel('A');box=alpha.point(lambda p:255 if p>96 else 0).getbbox()
    by=box[3]-1; xs=[x for x in range(sprite.width) if alpha.getpixel((x,by))>96]
    bx=sum(xs)/len(xs);dx=bx-sprite.width/2;dy=by-sprite.height/2;r=math.radians(angle)
    rotated=sprite.rotate(angle,Image.Resampling.BICUBIC,expand=True)
    rx=rotated.width/2+math.cos(r)*dx+math.sin(r)*dy;ry=rotated.height/2-math.sin(r)*dx+math.cos(r)*dy
    canvas.alpha_composite(rotated,(round(base[0]-rx),round(base[1]-ry)))

def bleed(image):
    # Rotating straight RGBA can leave extreme RGB at alpha 1..23. Never grow
    # channels independently: that combines unrelated maxima into neon colors.
    pixels=np.array(image,dtype=np.uint8);valid=pixels[:,:,3]>=128
    distances,indices=distance_transform_edt(~valid,return_indices=True)
    nearest=pixels[indices[0],indices[1],:3]
    rgb=pixels[:,:,:3]
    rgb[~valid]=nearest[~valid]
    # A two-pixel gutter is enough for base bilinear taps; custom mip generation
    # averages premultiplied colors, so it does not sample farther hidden RGB.
    rgb[(pixels[:,:,3]==0)&(distances>2)]=0
    return Image.fromarray(pixels)

pine_leaf=cutout('pine',(16,28,238,457),(124,399))
leaves=[cutout('crown',box,seed) for box,seed in [((436,389,562,651),(66,104)),((235,642,348,951),(50,120)),((378,709,503,969),(57,104)),((552,690,661,917),(50,102)),((619,386,712,617),(40,100))]]
for family in ['pine','crown']:
    image=Image.new('RGBA',(512,512));draw=ImageDraw.Draw(image)
    # Original small tapering support twigs connect photographic leaf cutouts.
    draw.line([(256,505),(251,359),(262,213),(251,44)],fill=(93,78,55,255),width=5)
    if family=='pine':
        for i in range(6):
            y=416-i*61;extent=119-i*10
            for side in [-1,1]:
                x=256+side*(extent*.61)
                draw.line([(256,y+49),(x,y+17)],fill=(102,89,61,255),width=3)
                paste_rotated(image,pine_leaf,(x,y+17),150-i*7,side*-40)
        paste_rotated(image,pine_leaf,(256,145),136,4)
    else:
        for i in range(5):
            y=418-i*74;extent=118-i*9
            for side in [-1,1]:
                x=256+side*(extent*.63)
                draw.line([(254,y+47),(x,y+16)],fill=(98,80,55,255),width=3)
                paste_rotated(image,leaves[(i+(side>0))%len(leaves)],(x,y+16),140-i*5,side*-56)
                paste_rotated(image,leaves[(i+2)%len(leaves)],(x-side*19,y+26),122-i*4,side*-19)
        paste_rotated(image,leaves[0],(255,147),125,8)
        # Preserve photographed venation while matching Q's existing amber grove.
        p=image.load()
        for y in range(512):
            for x in range(512):
                r,g,b,a=p[x,y];lum=.25*r+.63*g+.12*b
                p[x,y]=(min(255,round(lum*1.21)),min(255,round(lum*1.03)),min(255,round(lum*.65)),a)
    # Source RGB is straight (not premultiplied) alpha, as Three.js expects.
    image=bleed(image);image.save(ROOT/f'{family}-branch-rgba.png',compress_level=9)
    alpha=image.getchannel('A');hist=alpha.histogram()
    print(json.dumps({'family':family,'size':image.size,'bytes':(ROOT/f'{family}-branch-rgba.png').stat().st_size,'sha256':hashlib.sha256((ROOT/f'{family}-branch-rgba.png').read_bytes()).hexdigest(),'alphaCoverageAt92':sum(hist[92:])/(512*512),'transparentFraction':hist[0]/(512*512)}))
print(json.dumps({'derivationWallMs':(time.perf_counter()-started)*1000}))
