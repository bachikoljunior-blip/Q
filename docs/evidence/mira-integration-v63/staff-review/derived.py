import json,math
from pathlib import Path
import numpy as np
p=Path(__file__).parent
d=json.loads((p/'native-review.json').read_text());snap=json.loads((p/'native-snapshot.json').read_text());hits=json.loads((p/'crossing-points.json').read_text())
def poly(r,a):return r*math.cos(math.pi/16)/math.cos(a%(2*math.pi/16)-math.pi/16)
checks=[]
for m in snap:
 if m['id'] not in ['S05-A','S05-B']:continue
 v=np.array(m['positions']).reshape(-1,3)*1000;tri=np.array(m['indices']).reshape(-1,3);outer=[];inner=[];cm={'S17':[],'S18':[]};bm={'S17':[],'S18':[]}
 for f,t in enumerate(tri):
  q=v[t];pts=[*q,q.mean(axis=0),*( (q[j]+q[(j+1)%3])/2 for j in range(3))];tag='terminal' if f>=640 else ['inside','edge-1','outside','edge-2'][(f//2)%4]
  for x,y,z in pts:
   r=math.hypot(x,z);a=math.atan2(z,x);dist=r-poly(24,a)
   if tag=='inside':inner.append(dist)
   if tag=='outside':outer.append(dist)
   for id,lo,hi in [('S17',1025,1035),('S18',1235,1245)]:
    if lo<=y<=hi:
     cm[id].append(r-poly(27.5,a))
     outerR=26.7+min(.8,y-lo,hi-y)
     bm[id].append({'beyondMm':r-poly(outerR,a),'pointMm':[float(x),float(y),float(z)],'nominalOuterR':outerR})
 checks.append({'id':m['id'],'sampledOuterFaceMinimumAboveGripMm':min(outer),'sampledInnerMinusGripMm':[min(inner),max(inner)],'sampledMaxBeyondCollarFullCylinderMm':{k:max(v)for k,v in cm.items()},'sampledMaxBeyondCollarActualBevel':{k:max(v,key=lambda x:x['beyondMm'])for k,v in bm.items()},'scope':'vertices/centres/edge midpoints from frozen native triangles, not continuous clearance proof'})
d['wrapChecks']=checks
r=[]
for h in hits:
 if h['a']=='S01'and h['b']=='S04':
  x,y,z=h['point'];R=18+3*(y-30)/1388;r.append(math.hypot(x,z)-poly(R,math.atan2(z,x)))
d['interfaces']['S01S04numericalCrossingRadiusResidualMm']=[min(r),max(r)]
d['reviewerCorrection']={'original':'regular16-gon radius formula was half-sector rotated; affected only derived scalar clearance, not native triangle crossing/topology','fix':'delta = angle modulo (2pi/16) minus pi/16','nativeBatchRepeated':False,'sourceData':'unchanged native-snapshot.json and crossing-points.json','prior':'native-before-polygon-phase-fix.json retained'}
(p/'native-review.json').write_text(json.dumps(d,indent=2)+'\n')
print(json.dumps({'wrapChecks':checks,'woodResidual':d['interfaces']['S01S04numericalCrossingRadiusResidualMm']},indent=2))
