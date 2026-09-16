"""Native triangle projections only. No source-image editing or WebGL."""
from pathlib import Path
import json
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.collections import PolyCollection

root=Path(__file__).resolve().parents[2]
out=root/'docs/evidence/mira-lantern-micro-v62/geometry'
data=json.loads((out/'native-geometry.json').read_text())
parts={}
for p in data['parts']:
    pos=np.array(p['attributes']['position']['array']).reshape(-1,3)
    m=np.array(p['matrixWorld']).reshape(4,4).T
    world=(np.c_[pos,np.ones(len(pos))]@m.T)[:,:3]*1000
    parts[p['id']]=world[np.array(p['index']).reshape(-1,3)]

views=[('FRONT (+Z)',np.array([1,0,0]),np.array([0,0,1])),
       ('TRUE SIDE (+X)',np.array([0,0,-1]),np.array([1,0,0])),
       ('THREE-QUARTER',np.array([1,0,-1])/np.sqrt(2),np.array([1,0,1])/np.sqrt(2))]
rows=[('RIB-W / S10 representative',['S10']),('RIB-D / S11 representative',['S11']),('PARTIAL / S09-S14',list(parts))]
fig,axs=plt.subplots(3,3,figsize=(11,14),layout='constrained')
for row,(name,ids) in enumerate(rows):
    for col,(title,right,depth) in enumerate(views):
        ax=axs[row,col];tri=np.concatenate([parts[i] for i in ids]);order=np.argsort(tri.mean(axis=1)@depth)
        projected=np.stack((tri@right,tri[:,:,1]),axis=-1)
        # Single technical face colour. Centroid painter ordering is approximate,
        # not a renderer, material simulation or evidence of actual appearance.
        ax.add_collection(PolyCollection(projected[order],facecolors='#a79578',edgecolors='#615b51',linewidths=.18))
        ax.set_xlim(-90,90);ax.set_ylim(1435,1685);ax.set_aspect('equal');ax.set_title(name+'\n'+title,fontsize=10)
        ax.set_xlabel('projected mm');ax.set_ylabel('staff Y / mm');ax.grid(alpha=.15)
fig.suptitle('NATIVE GEOMETRY ONLY — no material, light, WebGL or game image\nSelected 3 views; generated TOP excluded. Lower receiver and glass not modeled.',fontsize=12)
for ext in ['png','svg']:fig.savefig(out/f'native-three-views.{ext}',dpi=160)
plt.close(fig)

fig,ax=plt.subplots(figsize=(7,7),layout='constrained')
colors={'S09':'#b64a39','S10':'#c88439','S11':'#3888a4','S12':'#497e44'}
for name in ['S13','S09','S10','S11','S12']:
    tri=parts[name];seat=tri[np.max(np.abs(tri[:,:,1]-1662),axis=1)<1e-5]
    polys=seat[:,:,[0,2]]
    ax.add_collection(PolyCollection(polys,facecolors='#dddddd' if name=='S13' else colors[name],edgecolors='#777777',linewidths=.4,alpha=1))
    if name!='S13':
        center=polys.mean(axis=(0,1));ax.text(*(center*1.23),name,ha='center',va='center',fontsize=11,color=colors[name])
ax.set_xlim(-25,25);ax.set_ylim(-25,25);ax.set_aspect('equal');ax.set_xlabel('staff X / mm');ax.set_ylabel('staff Z / mm');ax.grid(alpha=.2)
ax.set_title('ACTUAL 16-GON SEAT / Y1662 mm\nNative ring triangles and four rib top patches\nGeometry only, not the rejected generated TOP view',fontsize=11)
for ext in ['png','svg']:fig.savefig(out/f'upper-seat-contact.{ext}',dpi=160)
plt.close(fig)
for p in out.glob('*.svg'):p.write_text('\n'.join(line.rstrip() for line in p.read_text().splitlines())+'\n')
print('Saved native-three-views and upper-seat-contact PNG/SVG; generated references untouched.')
