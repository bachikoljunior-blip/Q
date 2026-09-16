"""Native mesh orthographic projections, not WebGL / material appearance evidence."""
from pathlib import Path
import json, gzip, base64, hashlib, numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.collections import PolyCollection

root=Path(__file__).resolve().parent
data=json.loads((root/'geometry/native-geometry.json').read_text())
parts=[]
for p in data['parts']:
    xyz=np.array(p['attributes']['position']['array']).reshape(-1,3)
    m=np.array(p['matrixWorld']).reshape(4,4,order='F')
    xyz=(np.c_[xyz,np.ones(len(xyz))]@m.T)[:,:3]*1000
    parts.append((p['id'],xyz,np.array(p['index']).reshape(-1,3)))

fig,axes=plt.subplots(1,4,figsize=(16,8),gridspec_kw={'width_ratios':[1,1,1.25,1.1]})
for ax,(title,angle) in zip(axes[:3],[('FRONT  +Z',0),('TRUE SIDE  +X',np.pi/2),('THREE QUARTER',np.pi/4)]):
    polys=[]
    for name,v,tri in parts:
        screen=np.c_[v[:,0]*np.cos(angle)-v[:,2]*np.sin(angle),v[:,1]]
        depth=v[:,0]*np.sin(angle)+v[:,2]*np.cos(angle)
        for ids in tri:
            color='#dfd5bd' if name=='S16' else '#a98751'
            polys.append((depth[ids].mean(),screen[ids],color))
    polys.sort(key=lambda x:x[0])
    ax.add_collection(PolyCollection([p[1] for p in polys],facecolors=[p[2] for p in polys],edgecolors='#514938',linewidths=.12))
    ax.set(xlim=(-76,76),ylim=(1380,1708),title=title,xlabel='mm',ylabel='staff Y / mm');ax.set_aspect('equal');ax.grid(alpha=.18)

ax=axes[3]
for name,v,tri in parts:
    if name not in ['S06','S07','S08','S16']:continue
    # Intersections of each native triangle with the actual Z=0 plane.
    for ids in tri:
        t=v[ids];points=[]
        for i in range(3):
            a,b=t[i],t[(i+1)%3]
            if abs(a[2])<1e-7:points.append(a[:2])
            if a[2]*b[2]<0:points.append((a+(b-a)*(-a[2]/(b[2]-a[2])))[:2])
        if len(points)>1:
            a,b=max(((a,b) for a in points for b in points),key=lambda q:np.linalg.norm(q[0]-q[1]))
            ax.plot([a[0],b[0]],[a[1],b[1]],color='#957139' if name!='S16' else '#487b99',lw=.7)
ax.set(xlim=(-30,30),ylim=(1416,1456),title='ACTUAL Z=0 SECTION\nbronze / blue glass',xlabel='mm',ylabel='staff Y / mm');ax.set_aspect('equal');ax.grid(alpha=.25)
for y,label in [(1423,'S06 → S07'),(1441,'S07 → S08'),(1447,'glass lower pole')]:
    ax.axhline(y,color='#b76b59',ls=':',lw=.5);ax.text(-29,y+.4,label,fontsize=7)
fig.suptitle('v63 native 16-angle candidate — CPU geometry projection / no lighting, shader or WebGL',fontsize=14)
fig.text(.5,.025,'Selected reference shape + authored hidden joints. Nine head parts; S06/S15 shown from a separate source snapshot. Not a game screenshot.',ha='center',fontsize=10)
fig.tight_layout(rect=(0,.05,1,.94))
fig.savefig(root/'geometry/native-projections.png',dpi=150)
fig.savefig(root/'geometry/native-projections.svg')
svg=root/'geometry/native-projections.svg'
svg.write_text('\n'.join(line.rstrip() for line in svg.read_text().splitlines())+'\n')
b=svg.read_bytes()
(root/'geometry/native-projections-svg.json').write_text(json.dumps({'mimeType':'image/svg+xml','encoding':'gzip+base64','uncompressedBytes':len(b),'uncompressedSHA256':hashlib.sha256(b).hexdigest(),'data':base64.b64encode(gzip.compress(b,mtime=0)).decode()},indent=2)+'\n')
svg.unlink()
