from pathlib import Path
import json
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'docs/evidence/mira-assembly-v65/cloth-registration'
d=json.loads((OUT/'CLOTH_AUTHOR_SOURCE.json').read_text());C={x['id']:x for x in d['canonicalCurves']}
fig,axes=plt.subplots(1,3,figsize=(14,10),layout='constrained')
colors={'T':'#8a5c2c','S':'#b77c30','C':'#9c4473','W':'#226a62','P':'#4b8071','L':'#7d6939','B':'#744b32','F':'#535c77','TR':'#1a77aa','PH':'#276251'}
for ax,(ix,title) in zip(axes,[(0,'FRONT: X / Y'),(2,'SIDE: Z / Y'),(0,'TROUSER / GUSSET: X / Y')]):
 seen=set()
 for p in d['parts']:
  if title.startswith('TROUSER') and not p['type'].startswith('TR'):continue
  prefix=p['type'].rstrip('0123456789');color=colors.get(prefix,'black')
  for e in p['boundary']:
   if e['curve'] in seen:continue
   seen.add(e['curve']);pts=[v['positionM'] for v in C[e['curve']]['samples']]
   ax.plot([v[ix]*1000 for v in pts],[v[1]*1000 for v in pts],color=color,lw=.65,alpha=.8)
 ax.set_title(title);ax.set_aspect('equal');ax.grid(alpha=.18);ax.set_ylabel('CHEST Y (mm)');ax.set_xlabel(('Z' if ix==2 else 'X')+' (mm)')
fig.suptitle('Mira v65 authored boundary registration — 40 types / 96 placements\nDesign curves only; no surfaces, triangles, materials or posed-contact acceptance',fontsize=13)
fig.savefig(OUT/'boundary-registration.png',dpi=150)
