"""Scientific orthographic line projections of actual OBJ-source vertices.
No image editing, texture synthesis, renderer, or game-pixel simulation.
"""
import json, sys
from pathlib import Path
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.collections import LineCollection
root=Path(__file__).resolve().parents[2]
out=Path(sys.argv[1]) if len(sys.argv)>1 else root/'docs/evidence/mira-head-micro-v63'
d=json.loads((out/'plot-data.json').read_text());m=d['mesh'];p=np.asarray(m['positions'])*1000
colors=['#427aa8','#74a8c2','#ce8647','#bb6065','#ce8647','#74a8c2','#427aa8']
views=[('FRONT: +Z; person R at image left',np.array([[1,0,0],[0,1,0]])),('TRUE SIDE: +X',np.array([[0,0,-1],[0,1,0]])),('UNDERSIDE: -Y',np.array([[1,0,0],[0,0,1]])),('THREE-QUARTER: 45 degrees',np.array([[2**-.5,0,-2**-.5],[0,1,0]]))]
fig,axes=plt.subplots(2,2,figsize=(12,9))
for ax,(title,R) in zip(axes.flat,views):
 q=p@R.T
 for k,part in enumerate(m['parts']):
  tris=m['indices'][part['firstTriangle']:part['firstTriangle']+part['triangleCount']]
  edges={tuple(sorted((t[j],t[(j+1)%3]))) for t in tris for j in range(3)}
  ax.add_collection(LineCollection([q[list(e)] for e in edges],colors=colors[k],linewidths=.35))
  center=q[np.unique(np.array(tris).flatten())].mean(axis=0)
  if title.startswith('FRONT'):ax.text(*center,part['id'],fontsize=7,ha='center',backgroundcolor='#ffffffaa')
 for seam in m['seams']:ax.plot(*q[seam['vertices']].T,color='#212121',lw=1)
 ax.set_title(title,fontsize=10);ax.autoscale();ax.set_aspect('equal');ax.grid(alpha=.15);ax.set_xlabel('mm');ax.set_ylabel('mm')
fig.suptitle('CPU geometry projections — seven welded lower-face placements\nNo texture, whole head, expression, WebGL or image-fidelity approval',fontsize=12)
fig.tight_layout(rect=[0,0,1,.93]);fig.savefig(out/'cpu-four-views.png',dpi=150);plt.close(fig)
old=np.asarray(d['oldHead']['positions'])*1000
fig,axes=plt.subplots(1,2,figsize=(11,7))
for ax,(title,R) in zip(axes,views[:2]):
 q=p@R.T;o=old@R.T
 oe={tuple(sorted((t[j],t[(j+1)%3]))) for t in d['oldHead']['indices'] for j in range(3)}
 ax.add_collection(LineCollection([o[list(e)] for e in oe],colors='#999999',linewidths=.25,alpha=.4))
 for k,part in enumerate(m['parts']):
  tris=m['indices'][part['firstTriangle']:part['firstTriangle']+part['triangleCount']]
  edges={tuple(sorted((t[j],t[(j+1)%3]))) for t in tris for j in range(3)}
  ax.add_collection(LineCollection([q[list(e)] for e in edges],colors=colors[k],linewidths=.65))
 ax.scatter(*(np.array([[0,0,0],[0,-160,0]])@R.T).T,s=12,c='black')
 ax.text(0,-160,'neck bone origin (not a weld)',fontsize=7)
 ax.set_title(title,fontsize=10);ax.autoscale();ax.set_aspect('equal');ax.grid(alpha=.15);ax.set_xlabel('head-local mm');ax.set_ylabel('head-local mm')
fig.suptitle('CPU registration comparison only: old head grey / separate candidate colored\nThey are NOT overlaid in the runtime; old surface is not candidate acceptance evidence',fontsize=11)
fig.tight_layout(rect=[0,0,1,.92]);fig.savefig(out/'cpu-old-head-registration.png',dpi=150);plt.close(fig)
