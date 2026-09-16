"""Plot recorded CPU before/after points, never a game screenshot or image edit."""
import json
from pathlib import Path
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d.art3d import Poly3DCollection
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'docs/evidence/mira-cloth-support-v63'
mesh=next(m for m in json.loads((ROOT/'docs/evidence/mira-cloth-micro-v62/meshes.json').read_text()) if m['id']=='P01-R')
fixtures=json.loads((OUT/'fixed.json').read_text())[-2:]
fig=plt.figure(figsize=(12,10))
for row,f in enumerate(fixtures):
    both=np.array(f['before']+f['after']); lo=both.min(0);hi=both.max(0)
    for col,key in enumerate(['before','after']):
        ax=fig.add_subplot(2,2,row*2+col+1,projection='3d',proj_type='ortho')
        p=np.array(f[key]);tri=np.array(mesh['indices'])
        # Plot world X,Z,Y so up remains the vertical axis in the figure.
        q=p[:,[0,2,1]]
        ax.add_collection3d(Poly3DCollection(q[tri],facecolors='#a99c79' if col else '#aab4bd',edgecolors='#42494e',linewidths=.35,alpha=1))
        pins=q[np.array(mesh['boundary']['top']['vertices'])]
        ax.plot(pins[:,0],pins[:,1],pins[:,2],color='#b34021',linewidth=2,label='fixed chest edge')
        xx,zz=np.meshgrid([lo[0]-.025,hi[0]+.025],[lo[2]-.025,hi[2]+.025])
        ax.plot_surface(xx,zz,xx*0,color='#6293a3',alpha=.18)
        ax.set_xlim(lo[0]-.025,hi[0]+.025);ax.set_ylim(lo[2]-.025,hi[2]+.025);ax.set_zlim(min(lo[1]-.03,-.07),hi[1]+.03)
        ax.set_box_aspect([hi[0]-lo[0]+.05,hi[2]-lo[2]+.05,hi[1]-min(lo[1],0)+.10]);ax.view_init(elev=18,azim=-48)
        ax.set_xlabel('world X (m)',fontsize=8);ax.set_ylabel('world Z (m)',fontsize=8);ax.set_zlabel('world Y (m)',fontsize=8)
        gap=f['baseline' if col==0 else 'candidate']['minTriangleSampleGapM']*1000
        ax.set_title(f"{f['name']} / {key}\nminimum sampled floor gap {gap:+.3f} mm",fontsize=10);ax.tick_params(labelsize=7)
fig.suptitle('P01-R: recorded native death pose, same mesh and view\nCPU geometry comparison - NOT a game render or natural-cloth approval',fontsize=13)
fig.text(.5,.025,'Red: unchanged chest edge. Blue: flat ground. Candidate uses 64 distance/contact iterations; no texture or thickness.',ha='center',fontsize=9)
fig.tight_layout(rect=[0,.045,1,.93]);fig.savefig(OUT/'cpu-death-support.png',dpi=160);plt.close(fig)
print('Saved CPU geometry comparison from fixed.json; source reference images unchanged.')
