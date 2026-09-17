#!/usr/bin/env python3
from pathlib import Path
import math,json,hashlib
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'docs/evidence/mira-assembly-v65/cloth-registration';p=OUT/'CLOTH_AUTHOR_SOURCE.json';d=json.loads(p.read_text());C={c['id']:c for c in d['canonicalCurves']};A=d['aliases'];ports=[]
def rnd(a):return [round(x,9) if abs(x)>=5e-10 else 0.0 for x in a]
def analytic_ring(cx,y,rx,rz,segments,weights,frame):
 out=[]
 for a0,a1 in segments:
  for j in range(33):
   if out and j==0:continue
   a=math.radians(a0+(a1-a0)*j/32);p=[cx+rx*math.sin(a),y,rz*math.cos(a)];t=[rx*math.cos(a),0,-rz*math.sin(a)];n=[math.sin(a)/rx,0,math.cos(a)/rz]
   tn=math.hypot(*t);nn=math.hypot(*n);out.append({'position':rnd(p),'normal':rnd([v/nn for v in n]),'tangent':rnd([v/tn for v in t]),'weights':weights})
 return out
def canonical_ring(alias_angles,cx=0,origin=(0,0,0),scale=(1,1,1)):
 out=[]
 for alias,startAngle in alias_angles:
  raw=C[A[alias]]['samples'];want=math.radians(startAngle);p0=raw[0]['positionM'];p1=raw[-1]['positionM']
  a0=math.atan2(p0[0]-cx,p0[2]);a1=math.atan2(p1[0]-cx,p1[2]);dist=lambda a:abs(math.atan2(math.sin(a-want),math.cos(a-want)))
  direction=1 if dist(a0)<dist(a1) else -1
  raw=raw if direction==1 else raw[::-1]
  for j,q in enumerate(raw):
   if out and j==0:continue
   p=[(q['positionM'][k]-origin[k])*scale[k] for k in range(3)]
   t=[q['tangent'][k]*scale[k]*direction for k in range(3)];n=[q['normal'][k]/scale[k] for k in range(3)];tn=math.hypot(*t);nn=math.hypot(*n)
   out.append({'position':rnd(p),'normal':rnd([v/nn for v in n]),'tangent':rnd([v/tn for v in t]),'weights':q['weights'],'canonicalCurve':A[alias],'canonicalSample':j if direction==1 else 32-j,'canonicalDirection':direction})
 return out
def port(pid,owner,frame,points,other,source,kind='overlap',limits='author bind envelope only; no trianglecontact or posedclearance'):
 ports.append({'id':pid,'owner':owner,'frame':frame,'unit':'metre','kind':kind,'orderedSamples':points,'counterparty':other,'sharedCanonicalSource':source,'limits':limits})
for y,name,inn,out in [(.560,'lower',[.100,.086],[.104,.090]),(.660,'upper',[.086,.083],[.090,.087])]:
 for layer,rs in [('inner',inn),('outer',out)]:
  pts=canonical_ring([('C01-L-'+name,12),('C02-'+name+'-L',90),('C02-'+name+'-R',180),('C01-R-'+name,270)],scale=(rs[0]/out[0],1,rs[1]/out[1]))
  port('CLOTH-NECK-'+name+'-'+layer,['C01-R','C01-L','C02-C'],'CHEST_LOCAL_M',pts,['HEAD:N01','HEAD:N02'],{'file':'CLOTH_AUTHOR_SOURCE.json','section':'externalPorts.neck','curves':[A['C01-R-'+name],A['C01-L-'+name],A['C02-'+name+'-L'],A['C02-'+name+'-R']],'rule':'inner radii derive from4mm envelope; outer surfaces are canonical curve boundaries'})
for side,i,s in [('R',0,-1),('L',1,1)]:
 for label,y,rx,rz,owners,alias in [('CUFF-CLOTH',.020,.043,.041,['S05-'+side,'S06-'+side],['S05-'+side+'-lower','S06-'+side+'-lower']),('CUFF-BRACER-INNER',0,.046,.044,['F01-'+side,'F02-'+side],['F01-'+side+'-lower','F02-'+side+'-lower'])]:
  pts=canonical_ring([(alias[0],-90),(alias[1],90)],cx=s*.313,origin=(s*.313,-.180,0),scale=(rx/(.052 if 'BRACER' in label else .043),1,rz/(.050 if 'BRACER' in label else .041)))
  port('CLOTH-'+label+'-'+side,owners,'HAND_LOCAL_M',pts,['ACCESSORY:AH10-'+side],{'file':'CLOTH_AUTHOR_SOURCE.json','curves':[A[x] for x in alias],'rig':'hand-'+str(i),'CHESTOriginM':[s*.313,-.180,0],'rule':'bracer inner is6mm inside canonical outer surface; sleeve is exactcanonical'})
 for label,y,rx,rz in [('TOP',.345,.070,.072),('BOTTOM',.300,.069,.071)]:
  aliases=['TR05-'+side+('-upper-' if label=='TOP' else '-lower-')+x for x in ['front','rear']]
  pts=canonical_ring([(aliases[0],-90),(aliases[1],90)],cx=s*.133,origin=(s*.133,-.880,0))
  port('CLOTH-BOOT-UNDERLAP-'+label+'-'+side,['TR05-'+side],'FOOT_LOCAL_M',pts,['ACCESSORY:AB07-'+side,'ACCESSORY:AB08-'+side],{'file':'CLOTH_AUTHOR_SOURCE.json','curves':[A[x] for x in aliases],'rig':'foot-'+str(i),'CHESTOriginM':[s*.133,-.880,0],'rule':'same physical points transformed from CHEST intoFOOT bind frame'})
result={'schema':'Q.cloth.external-ports.v65','unit':'metre','authorSourceSHA256':hashlib.sha256(p.read_bytes()).hexdigest(),'axes':{'right':'-X','left':'+X','up':'+Y','front':'+Z'},'rigBoneCountUnchanged':41,'ports':ports,'agreements':d['externalPorts'],'kindSemantics':'overlap/contact never means weld; sample directions follow increasing angle around+Y, normal outward; parameter chart and physical tangents distinct','pending':'counterparty filehash cross-read and independent wholeassembly acceptance, poses and triangle contact'}
(OUT/'EXTERNAL_PORTS.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'ports':len(ports),'samples':sum(len(x['orderedSamples']) for x in ports),'sourceSHA256':result['authorSourceSHA256']}))
