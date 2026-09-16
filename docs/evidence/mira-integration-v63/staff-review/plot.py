"""One CPU geometry diagram batch from the frozen native snapshot. Not rendered game pixels."""
from pathlib import Path
import json, math
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.collections import LineCollection
p=Path(__file__).parent;parts=json.loads((p/'native-snapshot.json').read_text());hits=json.loads((p/'crossing-points.json').read_text())
colors={'S01':'#866640','S02':'#b9943c','S03':'#7d6129','S04':'#777777','S05-A':'#5e8066','S05-B':'#417bca','S17':'#d59b2d','S18':'#d59b2d','S06':'#b9943c','S15':'#b9943c'}
fig,axs=plt.subplots(1,3,figsize=(13,7))
for ax,(ids,ylim,theta,title)in zip(axs,[(['S01','S02','S03'],(-2,62),0,'Foot: insertion with clearance'),(['S04','S05-A','S05-B','S17'],(1024,1044),0,'Lower collar: front projection'),(['S04','S05-B','S17'],(1027,1038),1.16,'Lower collar: oblique projection')]):
 for m in parts:
  if m['id'] not in ids:continue
  v=np.asarray(m['positions']).reshape(-1,3)*1000;tr=np.asarray(m['indices']).reshape(-1,3);q=np.column_stack([math.cos(theta)*v[:,0]-math.sin(theta)*v[:,2],v[:,1]])
  edges={tuple(sorted((t[i],t[(i+1)%3])))for t in tr for i in range(3)if min(v[t,1])<ylim[1]and max(v[t,1])>ylim[0]}
  ax.add_collection(LineCollection([q[list(e)]for e in edges],colors=colors[m['id']],linewidths=.5,alpha=.65,label=m['id']))
 if 'S17'in ids:
  h=[x['point']for x in hits if x['a']=='S17'and x['b']=='S05-B'and x['tagA']=='outer-wall'];h=np.asarray(h)
  ax.scatter(math.cos(theta)*h[:,0]-math.sin(theta)*h[:,2],h[:,1],s=10,c='#cf1919',label='outer-wall crossing')
 ax.set_ylim(*ylim);ax.set_xlim(-30,30);ax.set_aspect('equal');ax.grid(alpha=.15);ax.set_title(title,fontsize=9);ax.set_xlabel('mm');ax.set_ylabel('world staff y / mm');ax.legend(fontsize=6,loc='upper left')
fig.suptitle('CPU native-mesh line projections — initial source afd01a6b\nRed: independently detected external collar / visible wrap crossings. No WebGL or appearance approval.',fontsize=11)
fig.tight_layout(rect=[0,0,1,.92]);fig.savefig(p/'native-contact-projections.png',dpi=160)
