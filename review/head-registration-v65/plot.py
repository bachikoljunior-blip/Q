#!/usr/bin/env python3
"""Exact curve projections, no triangulated surface or rendered-character claim."""
import pathlib,runpy,contextlib,io
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
matplotlib.rcParams['svg.hashsalt']='q-head-registration-v65'
R=pathlib.Path(__file__).resolve().parents[2]
# Reuse the independent curve evaluator without exiting the plot process.
v={};source=(R/'review/head-registration-v65/verify.py').read_text().replace('raise SystemExit(bool(fail))','')
v['__file__']=str(R/'review/head-registration-v65/verify.py')
with contextlib.redirect_stdout(io.StringIO()):exec(compile(source,v['__file__'],'exec'),v)
D=v['D'];C=v['C'];ev=v['ev'];P=D['instances'];fig,axes=plt.subplots(1,3,figsize=(16,7),constrained_layout=True)
for ax,(i,j,title) in zip(axes,[(0,1,'Front: +Z'),(2,1,'Left profile: +X'),(0,2,'Top: +Y')]):
 for c in C.values():
  owners=c['owners'];hair=all(P[o['instance']]['layer']=='hair' for o in owners);native='nativeConstraint' in c
  pts=[ev(c,k/64) for k in range(65)];ax.plot([q[i] for q in pts],[q[j] for q in pts],color='#1b5576' if hair else '#b16e25' if native else '#8a9196',lw=.65 if hair else .9,alpha=.7)
 for root in D['hairRoots']:
  q=root['positionM'];ax.scatter([q[i]],[q[j]],c='#bb3355',s=6)
 ax.set_aspect('equal');ax.grid(alpha=.15);ax.set_title(title);ax.set_xlabel(['X m','Y m','Z m'][i]);ax.set_ylabel(['X m','Y m','Z m'][j])
fig.suptitle('Mira v65 author registration: curves and roots only — no new mesh / no image calibration',fontsize=13)
o=R/'docs/evidence/mira-assembly-v65/head-registration';fig.savefig(o/'registered-curves.png',dpi=150,metadata={'Software':'Q registration plot v65'});fig.savefig(o/'registered-curves.svg',metadata={'Date':None,'Creator':'Q registration plot v65'});plt.close(fig)

svg=o/'registered-curves.svg'
svg.write_text('\n'.join(line.rstrip() for line in svg.read_text().splitlines())+'\n')
