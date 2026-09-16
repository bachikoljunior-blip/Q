"""Orthographic projection of native triangle buffers; no game render/shaders."""
from pathlib import Path
import json
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.collections import PolyCollection

root=Path('docs/evidence/mira-staff-v63/assembly')
parts=json.loads((root/'parts.json').read_text())
fig,axs=plt.subplots(1,4,figsize=(12,10),facecolor='#f4f2ed')
col={'S01':'#6a4933','S04':'#493729','S05-A':'#78583a','S05-B':'#80623e','S16':'#e7d6a7'}
for ax,(name,ang) in zip(axs,[('FRONT',0),('RIGHT',np.pi/2),('BACK',np.pi),('THREE-QUARTER',np.pi/4)]):
    shapes=[]
    for p in parts:
        v=np.array(p['positions']).reshape(-1,3)
        m=np.array(p['matrixWorld']).reshape(4,4).T
        v=(np.column_stack((v,np.ones(len(v))))@m.T)[:,:3]*1000
        x=v[:,0]*np.cos(ang)-v[:,2]*np.sin(ang)
        d=v[:,0]*np.sin(ang)+v[:,2]*np.cos(ang)
        for tri in np.array(p['indices']).reshape(-1,3):
            shapes.append((d[tri].mean(),np.column_stack((x[tri],v[tri,1])),col.get(p['id'],'#ad9363')))
    shapes.sort(key=lambda r:r[0])
    ax.add_collection(PolyCollection([s[1] for s in shapes],facecolors=[s[2] for s in shapes],edgecolors='none',antialiased=False))
    ax.set(xlim=(-110,110),ylim=(-10,1730),title=name,ylabel='mm')
    ax.set_aspect('equal');ax.set_facecolor('#f4f2ed');ax.grid(alpha=.15)
fig.suptitle('Mira staff: 19 native part placements / orthographic geometry inspection',fontsize=13)
fig.text(.5,.015,'CPU projection only. Flat ID colours; no WebGL, material, hand rig or visual-quality acceptance.',ha='center',fontsize=10)
fig.tight_layout(rect=(0,.035,1,.96))
fig.savefig(root/'native-full-staff.png',dpi=150)
