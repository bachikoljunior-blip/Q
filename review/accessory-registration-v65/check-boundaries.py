#!/usr/bin/env python3
"""Finite self-intersection screen of the canonical directed boundary curves only."""
from pathlib import Path
import json,math,time,numpy as np
from curve_eval import evaluate
root=Path(__file__).resolve().parents[2];out=root/'docs/evidence/mira-assembly-v65/accessory-registration';d=json.loads((out/'ACCESSORY_REGISTRATION.json').read_text());cs={c['id']:c for c in d['curves']};start=time.perf_counter()
def pointseg(p,a,b):
 v=b-a;t=max(0,min(1,float(np.dot(p-a,v)/np.dot(v,v))));return np.linalg.norm(p-(a+t*v))
def distance(a,b,c,d):
 u=b-a;v=d-c;w=a-c;aa=np.dot(u,u);bb=np.dot(u,v);cc=np.dot(v,v);dd=np.dot(u,w);ee=np.dot(v,w);den=aa*cc-bb*bb
 vals=[pointseg(a,c,d),pointseg(b,c,d),pointseg(c,a,b),pointseg(d,a,b)]
 if den>1e-15:
  s=(bb*ee-cc*dd)/den;t=(aa*ee-bb*dd)/den
  if 0<=s<=1 and 0<=t<=1:vals.append(np.linalg.norm(a+s*u-c-t*v))
 return float(min(vals))
failures=[];loops=0;segments=0;eps=1e-5
for p in d['instances']:
 for li,loop in enumerate(p.get('boundaryLoops',[])):
  points=[]
  for edge in loop:
   c=cs[edge['curveID']];count=(len(c['samples'])-1)*4;ts=[i/count for i in range(count+1)]
   if edge['direction']==-1:ts.reverse()
   points.extend([evaluate(c,t)['positionMm'] for t in ts][:-1])
  a=np.array(points);b=np.roll(a,-1,axis=0);n=len(a);lo=np.minimum(a,b)-eps;hi=np.maximum(a,b)+eps;segments+=n;loops+=1
  for i in range(n):
   candidates=np.flatnonzero(np.all(lo[i]<=hi,axis=1)&np.all(hi[i]>=lo,axis=1))
   for j in candidates:
    if j<=i+1 or (i==0 and j==n-1):continue
    if np.linalg.norm(a[i]-b[i])<1e-10 or np.linalg.norm(a[j]-b[j])<1e-10:continue
    dist=distance(a[i],b[i],a[j],b[j])
    if dist<eps:failures.append({'instance':p['id'],'loop':li,'segments':[i,int(j)],'distanceMm':dist})
r={'status':'PASS finite directed boundary self-intersection screen' if not failures else 'FAIL','loops':loops,'sampledSegments':segments,'linearSubsegmentsPerCanonicalInterval':4,'intersectionToleranceMm':eps,'failures':failures,'elapsedSeconds':time.perf_counter()-start,'limits':'Piecewise linear screen of analytic/Hermite boundary curves only. No continuous global surface self-intersection or surface normal-orientation acceptance. Reversed hole/loft boundary winding is intentional; closed solid registrations are not asserted to be a single open patch.'}
(out/'BOUNDARY_SCREEN.json').write_text(json.dumps(r,indent=2)+'\n');print(json.dumps(r))
