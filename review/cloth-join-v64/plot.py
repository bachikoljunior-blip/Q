"""CPU orthographic geometry evidence, not a renderer or game screenshot."""
import json
from pathlib import Path
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.collections import PolyCollection

root=Path(__file__).resolve().parents[2]
out=root/'docs/evidence/mira-cloth-join-v64'
m=json.loads((out/'assembly.json').read_text())
r=json.loads((out/'metrics.json').read_text())
p=np.array(m['positions'])+np.array([0,.985,0])
t=np.array(m['indices'])
colors={'P01-R':'#7596b6','P02-R':'#d5a658','P04-RB':'#81ad85'}
fig,axs=plt.subplots(1,4,figsize=(15,7),layout='constrained')
views=[('BACK | horizontal = -X',p,np.array([-1,0,0]),np.array([0,1,0])),
 ('RIGHT PROFILE | horizontal = -Z',p,np.array([0,0,-1]),np.array([0,1,0])),
 ('3/4 CPU projection',p,np.array([-.8,0,-.6]),np.array([0,1,0])),
 ('DEATH .45 s | floor failure',np.array(r['poses'][4]['positions']),np.array([0,0,-1]),np.array([0,1,0]))]
for ax,(title,points,h,v) in zip(axs,views):
 q=np.stack([points@h,points@v],axis=1)
 ax.add_collection(PolyCollection(q[t],facecolors=[colors[x] for x in m['facePart']],edgecolors='#39454e',linewidths=.2,alpha=.85))
 for seam in m['seams']:
  a=q[seam['globalIDs']];ax.plot(a[:,0],a[:,1],color='#ab233d',lw=2)
 ax.autoscale();ax.set_aspect('equal');ax.set_title(title,fontsize=10);ax.set_xlabel('metres');ax.set_ylabel('root Y (m)');ax.grid(alpha=.2)
 if 'DEATH' in title:ax.axhline(0,color='black',lw=1.4)
fig.suptitle('P01 existing + P02 / P04-RB authored adjacency — CPU geometry only\nRed = two shared-ID edges; blue P01 / ochre P02 / green P04-RB. No material or naturalness approval.',fontsize=12)
fig.savefig(out/'geometry-views.png',dpi=130)
fig.savefig(out/'geometry-views.svg')
path=out/'geometry-views.svg';path.write_text('\n'.join(line.rstrip() for line in path.read_text().splitlines())+'\n')
