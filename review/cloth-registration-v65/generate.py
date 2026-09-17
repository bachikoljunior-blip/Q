#!/usr/bin/env python3
"""Authored boundary registration only. No mesh, faces or runtime import."""
from pathlib import Path
import math,json,hashlib
from frames import register_frames, solve_shoulder
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'docs/evidence/mira-assembly-v65/cloth-registration'
N=33
curves={};parts={};keys={};aliases={};knotWeights={}
V=lambda p:[round(float(x),9) if abs(float(x))>=.0000000005 else 0.0 for x in p]
def add(a,b):return [x+y for x,y in zip(a,b)]
def sub(a,b):return [x-y for x,y in zip(a,b)]
def mul(a,s):return [x*s for x in a]
def norm(a):
 l=math.sqrt(sum(x*x for x in a));return mul(a,1/l) if l>1e-10 else [0,0,1]
def mix(a,b,t):return add(mul(a,1-t),mul(b,t))
def smooth(x):x=max(0,min(1,x));return x*x*(3-2*x)
def line(a,b,bend=(0,0,0)):
 return [V(add(mix(a,b,i/32),mul(bend,math.sin(math.pi*i/32)))) for i in range(N)]
def arc(cx,y,rx,rz,a,b,z=0):
 return [V([cx+rx*math.sin(math.radians(a+(b-a)*i/32)),y,z+rz*math.cos(math.radians(a+(b-a)*i/32))]) for i in range(N)]
def weight(p,family):
 x,y,z=p;side=0 if x<0 else 1
 if family=='arm':
  if y>=.20:return {f'arm-{side}':1.0}
  if y>=.04:
   w=smooth((.20-y)/.16);return {f'arm-{side}':round(1-w,9),f'elbow-{side}':round(w,9)}
  w=smooth((-.10-y)/.06);return {f'elbow-{side}':round(1-w,9),f'hand-{side}':round(w,9)}
 if family=='leg':
  if abs(x)<.046 and y>-.26:return {'pelvis':1.0}
  if y>=-.08:return {'pelvis':1.0}
  if y>=-.30:
   w=smooth((-.08-y)/.22);return {'pelvis':round(1-w,9),f'leg-{side}':round(w,9)}
  w=smooth((-.355-y)/.18);return {f'leg-{side}':round(1-w,9),f'knee-{side}':round(w,9)}
 if family=='cape':return {'chest':1.0}
 w=smooth((y-.08)/.32);return {'pelvis':round(1-w,9),'chest':round(w,9)}
def curve(label,pts,family='torso',hint=None):
 pts=[V(p) for p in pts];forward=json.dumps(pts,separators=(',',':'));back=json.dumps(pts[::-1],separators=(',',':'))
 key=min(forward,back);direction=1 if forward==key else -1
 if key in keys:
  cid=keys[key];aliases[label]=cid;return {'curve':cid,'direction':direction}
 cid=label
 if cid in curves:raise ValueError('duplicate '+cid)
 keys[key]=cid;aliases[label]=cid;q=pts if direction==1 else pts[::-1]
 samples=[];length=0
 for i,p in enumerate(q):
  if i:length+=math.dist(q[i-1],p)
  tangent=norm(sub(q[min(i+1,32)],q[max(0,i-1)]))
  cx=(-.313 if p[0]<0 else .313) if family=='arm' else ((-.133 if p[0]<0 else .133) if family=='leg' and p[1]<-.20 else 0)
  raw=norm(hint if hint else [p[0]-cx,0,p[2]])
  normal=norm(sub(raw,mul(tangent,sum(x*y for x,y in zip(raw,tangent)))))
  if abs(sum(x*y for x,y in zip(normal,tangent)))>1e-5:
   raw=[0,1,0] if abs(tangent[1])<.9 else [0,0,1];normal=norm(sub(raw,mul(tangent,sum(x*y for x,y in zip(raw,tangent)))))
  w={k:v for k,v in weight(p,family).items() if v}
  if i in (0,32):w=knotWeights.setdefault(tuple(p),w)
  samples.append({'positionM':p,'normal':V(normal),'tangent':V(tangent),'uv':[round(.5+math.atan2(p[0],p[2])/(2*math.pi),9),round(p[1]+1,9)],'weights':w})
 curves[cid]={'id':cid,'frame':'CHEST_LOCAL_M','samples':samples,'samplePolylineLengthM':round(length,9),'owners':[],'family':family,'interpolation':'33 explicit author samples; no tessellation budget implied'}
 return {'curve':cid,'direction':direction}
def reverse(e):return {'curve':e['curve'],'direction':-e['direction']}
def path(e):
 p=[x['positionM'] for x in curves[e['curve']]['samples']];return p if e['direction']==1 else p[::-1]
def edge(label,a,b,f='torso',bend=(0,0,0),hint=None):return curve(label,line(a,b,bend),f,hint)
def part(pid,edges,op='boundary-constrained single cloth patch',notes='',thickness=.002):
 if pid in parts:raise ValueError(pid)
 coords=[p for e in edges for p in path(e)];centroid=[sum(p[k] for p in coords)/len(coords) for k in range(3)]
 parts[pid]={'id':pid,'type':pid.split('-')[0],'frame':'CHEST_LOCAL_M','boundary':edges,'operation':op,'thicknessM':thickness,'owns':'one open surface; no independently capped sewn edges','notes':notes,
 'interiorSupport':{'construction':'transfinite blend of boundary curves with centre displacement; design data only, no surface emitted','centreM':V(centroid),'centreDisplacementM':[0,0,0],'supportParameters':[[.25,.25],[.75,.25],[.5,.5],[.25,.75],[.75,.75]],'maximumUnspecifiedDisplacementM':0},
 'referenceFit':'qualitative selected outer contour/profile; exact dimensions and hidden joints are author choices, never image metrology'}
 for e in edges:curves[e['curve']]['owners'].append({'part':pid,'direction':e['direction']})
 return parts[pid]
def quad(pid,bottom,right,top,left,**kw):return part(pid,[bottom,right,reverse(top),reverse(left)],**kw)
def polygon(pid,verts,f='torso',bends=None,notes='',thickness=.002):
 es=[edge(pid+'-edge'+str(i),verts[i],verts[(i+1)%len(verts)],f,(bends or {}).get(i,(0,0,0))) for i in range(len(verts))]
 return part(pid,es,notes=notes,thickness=thickness)
def sector(pid,lower,upper,a,b,cx=0,f='torso',notes='',thickness=.002):
 y0,rx0,rz0=lower;y1,rx1,rz1=upper
 e0=curve(pid+'-lower',arc(cx,y0,rx0,rz0,a,b),f);e1=curve(pid+'-upper',arc(cx,y1,rx1,rz1,a,b),f)
 p0=path(e0);p1=path(e1)
 p=quad(pid,e0,edge(pid+'-endB',p0[-1],p1[-1],f),e1,edge(pid+'-endA',p0[0],p1[0],f),notes=notes,thickness=thickness)
 p['interiorSupport'].update({'construction':'linear radius/y loft in angle-height coordinates','lowerRing':list(lower),'upperRing':list(upper),'angleDegrees':[a,b],'centreX':cx})
 return p
# Torso includes two shoulder bridges; exact free front closure seam except neck opening.
for side,s in [('R',-1),('L',1)]:
 A=[0,.03,.156];B=[s*.182,.03,.078];C=[s*.182,.03,-.078];D=[0,.03,-.156]
 NF=[s*.104*math.sin(math.radians(12)),.560,.090*math.cos(math.radians(12))];NB=[0,.560,-.090]
 U=[s*.246,.440,.104];VV=[s*.246,.440,-.104];UF=[s*.205,.320,.088];UR=[s*.205,.320,-.088];M=[s*.223,.315,0];K=[s*.280,.540,0];FC=[0,.500,.150]
 polygon('T01-'+side,[A,B,UF,U,NF,FC],bends={3:(0,.018,.004)})
 polygon('T02-'+side,[D,NB,VV,UR,C],bends={1:(0,.018,-.004)})
 polygon('T03-'+side,[B,C,UR,M,UF])
 neckFront=curve('NECK-lower-front-'+side,arc(0,.560,.104,.090,s*12,s*90))
 neckRear=curve('NECK-lower-rear-'+side,arc(0,.560,.104,.090,s*90,s*180))
 part('T04-'+side,[edge('SHOULDER-front-'+side,NF,U,bend=(0,.018,.004)),edge('ARMHOLE-upper-front-'+side,U,K),edge('ARMHOLE-upper-rear-'+side,K,VV),edge('SHOULDER-rear-'+side,VV,NB,bend=(0,.018,-.004)),reverse(neckRear),reverse(neckFront)],notes='One shoulder bridge; collar arc is the inner side; T01/T02 share front/rear shoulder seams.')
 cx=s*.313;rf=curve('SLEEVE-shoulder-front-'+side,arc(cx,.440,.095,.096,-90,90),'arm');rr=curve('SLEEVE-shoulder-rear-'+side,arc(cx,.440,.095,.096,90,270),'arm')
 inner=[cx-.095,.440,0];outer=[cx+.095,.440,0];attachK=outer if s>0 else inner;attachM=inner if s>0 else outer
 for label,bpts,sa in [('front',[K,U,UF,M],rf),('rear',[M,UR,VV,K],rr)]:
  start=attachM if label=='front' else attachK;end=attachK if label=='front' else attachM
  if math.dist(path(sa)[0],start)>1e-7:sa=reverse(sa)
  es=[edge('T05-'+side+'-'+label+'-inner'+str(j),bpts[j],bpts[j+1]) for j in range(3)]
  es+=[edge('T05-'+side+'-'+label+'-radial0',bpts[-1],start,'arm'),sa,edge('T05-'+side+'-'+label+'-radial1',end,bpts[0],'arm')]
  part('T05-'+side+'-'+label,es,notes='One crescent front/rear patch, never complete annulus ownership.')
 for typ,ang in [('S01',(-90,90)),('S02',(90,270))]:sector(typ+'-'+side,(.190,.073,.074),(.440,.095,.096),*ang,cx=cx,f='arm')
 for typ,ang in [('S03',(90,270)),('S04',(-90,90))]:
  p=sector(typ+'-'+side,(.030,.061,.060),(.190,.073,.074),*ang,cx=cx,f='arm',notes='160mm elbow region preserves broad fold; former90mm nominal superseded.')
  p['interiorSupport']['radialSineDisplacementM']=.018 if typ=='S03' else -.008
 for typ,ang in [('S05',(-90,90)),('S06',(90,270))]:sector(typ+'-'+side,(-.160,.043,.041),(.030,.061,.060),*ang,cx=cx,f='arm',notes='190mm entire cloth. Bracer upper CHEST-.020 crosses50mm below cloth top;140mm remains beneath bracer; no cuff upper-edge weld.')
 for typ,ang in [('F01',(-90,90)),('F02',(90,270))]:sector(typ+'-'+side,(-.180,.052,.050),(-.020,.069,.068),*ang,cx=cx,f='arm',notes='Outer surface radii. Subtract6mm for inner envelope. Distal hand-localy0 inner46/44mm, handweight1.',thickness=.006)
 for j in range(3):
  start=.018+j*.049;turn=(-1 if j==1 else 1);a0=25+j*110
  def helix(v,offset):
   a=math.radians(a0+turn*330*v);y=-.020-start-.038*v+offset;r=.073+.002*j-.015*((-.02-y)/.16)
   return [cx+r*math.sin(a),y,(r-.001)*math.cos(a)]
  lo=curve('F03-'+side+'-'+str(j)+'-low',[helix(i/32,-.006) for i in range(N)],'arm')
  hi=curve('F03-'+side+'-'+str(j)+'-high',[helix(i/32,.006) for i in range(N)],'arm');p=path(lo);q=path(hi)
  pp=quad('F03-'+side+'-'+str(j),lo,edge('F03-'+side+'-'+str(j)+'-end',p[-1],q[-1],'arm'),hi,edge('F03-'+side+'-'+str(j)+'-start',p[0],q[0],'arm'),notes=f'330degree wrap, layer{j};0 beneath1 beneath2; no welded intersections.',thickness=.003)
  pp['interiorSupport'].update({'construction':'linear across12mm ribbon, helix along length','turnDegrees':turn*330,'startDegrees':a0})
 hemA=[s*.024,-.600,.227];hemB=[s*.270,-.600,.118];hemC=[s*.270,-.600,-.118];hemD=[0,-.600,-.227]
 for typ,vs in [('L01',[hemA,hemB,B,A]),('L03',[hemB,hemC,C,B]),('L02',[hemC,hemD,D,C])]:polygon(typ+'-'+side,vs,notes='Single waist y.030 shared with torso; rear centre sewn x0; front split+/-24mm at hem.')
 a=hemA;b=A;polygon('L04-'+side,[a,b,add(b,[s*.012,0,-.003]),add(a,[s*.012,0,-.003])],notes='12mm reverse front-split turnback, remaining edge free.')
 for tag,a,b in [('front',hemA,hemB),('side',hemB,hemC),('rear',hemC,hemD)]:polygon('L05-'+tag+'-'+side,[a,b,add(b,[0,.012,-.003]),add(a,[0,.012,-.003])],notes='12mm tunic turnback; no independent caps.')
sector('C01-R',(.560,.104,.090),(.660,.090,.087),-90,-12,notes='Collar outer surface;4mm inner envelope, front12degree open.',thickness=.004)
sector('C01-L',(.560,.104,.090),(.660,.090,.087),12,90,notes='Collar outer surface;4mm inner envelope, front12degree open.',thickness=.004)
cLowL=curve('C02-lower-L',arc(0,.560,.104,.090,90,180))
cLowR=curve('C02-lower-R',arc(0,.560,.104,.090,180,270))
cUpL=curve('C02-upper-L',arc(0,.660,.090,.087,90,180))
cUpR=curve('C02-upper-R',arc(0,.660,.090,.087,180,270))
part('C02-C',[cLowL,cLowR,edge('C02-R-end',path(cLowR)[-1],path(cUpR)[-1]),reverse(cUpR),reverse(cUpL),edge('C02-L-end',path(cUpL)[0],path(cLowL)[0])],op='rear half ellipse loft,90..270degrees',notes='Both lower halves are the SAME canonical shoulder curves; no independently redrawn collar boundary.',thickness=.004)
# Three front U and three rear V folds. Actual end curves are W02 landing ports.
for j in range(3):
 for typ,front in [('W01',True),('W03',False)]:
  zsign=1 if front else -1;half=.185+j*.013;yt=.610-j*.024;drop=.060 if front else .100+j*.016
  def drape(v,dy):return [half*(2*v-1),yt-drop*math.sin(math.pi*v)+dy,zsign*(.105+.040*math.sin(math.pi*v)+.012*j)]
  e0=curve(typ+'-'+str(j)+'-lower',[drape(i/32,-.025) for i in range(N)],'cape');e1=curve(typ+'-'+str(j)+'-upper',[drape(i/32,.025) for i in range(N)],'cape');a=path(e0);b=path(e1)
  pp=quad(typ+'-'+str(j),e0,edge(typ+'-'+str(j)+'-L',a[-1],b[-1],'cape'),e1,edge(typ+'-'+str(j)+'-R',a[0],b[0],'cape'),notes='Single fold strip;0 inner then1 then2; rear drape not worn hood.')
  pp['interiorSupport'].update({'construction':'linear across width, sin(pi*u) drape','halfWidthM':half,'endYM':yt,'dropM':drop,'front':front})
for side,s in [('R',-1),('L',1)]:
 p=polygon('W02-'+side,[[s*.170,.660,.155],[s*.278,.535,.185],[s*.295,.460,0],[s*.278,.535,-.185],[s*.170,.660,-.155]],f='cape',notes='Side saddle owns six sewn interior fold ports.')
 p['attachmentCurves']=[aliases[typ+'-'+str(j)+'-'+side] for typ in ['W01','W03'] for j in range(3)]
 for cid in p['attachmentCurves']:curves[cid]['owners'].append({'part':p['id'],'direction':0,'mode':'sewn interior landing'})
 angles=[180,120,55,30];tops=[];bots=[]
 for a in angles:
  t=math.radians(a);tops.append([s*.310*math.sin(t),.490-.035*math.sin(t),.235*math.cos(t)]);bots.append([s*.390*math.sin(t),-.760,.295*math.cos(t)])
 topEdges=[]
 for k,typ in enumerate(['P01','P02','P03']):
  lo=edge(typ+'-'+side+'-hem',bots[k],bots[k+1],'cape',(0,-.008,0));hi=edge(typ+'-'+side+'-top',tops[k],tops[k+1],'cape',(0,.015,0));topEdges.append(hi)
  pp=quad(typ+'-'+side,lo,edge(typ+'-'+side+'-longB',bots[k+1],tops[k+1],'cape',(s*.025 if k<2 else 0,0,-.014)),hi,edge(typ+'-'+side+'-longA',bots[k],tops[k],'cape',(0 if k==0 else s*.025,0,-.014)),notes='P03 front free. New author rear-centrex0 closes old10mm gap; chestweight1 is bind-only, no cloth-support acceptance.')
  pp['interiorSupport']['centreDisplacementM']=[s*.009,0,-.012]
  q0=path(lo);q1=[add(q,[0,.012,.002]) for q in q0];he=curve('PH01-'+typ+'-'+side+'-fold',q1,'cape')
  quad('PH01-'+typ+'-'+side,lo,edge('PH01-'+typ+'-'+side+'-b',q0[-1],q1[-1],'cape'),he,edge('PH01-'+typ+'-'+side+'-a',q0[0],q1[0],'cape'),notes='12mm cape turnback; distinct fromL05; no caps.')
 innRear=[s*.180,.550,-.115];innFront=[s*.200,.535,.115]
 part('P04-'+side,topEdges+[edge('P04-'+side+'-front',tops[-1],innFront,'cape'),edge('P04-'+side+'-inner',innFront,innRear,'cape',(s*.04,.025,0)),edge('P04-'+side+'-rear',innRear,tops[0],'cape')],notes='Shoulder saddle consumes all3 cape upper arcs; W02 sewn landing is distinct from boundary weld.')
 centre=[s*.224,.548,.143]
 inner=curve('BROOCH-seat-'+side,[[centre[0]+.021*math.cos(2*math.pi*i/32),centre[1]+.021*math.sin(2*math.pi*i/32),centre[2]] for i in range(N)],'cape',[0,0,1])
 outer=curve('BROOCH-rim-'+side,[[centre[0]+.027*math.cos(2*math.pi*i/32),centre[1]+.027*math.sin(2*math.pi*i/32),centre[2]+.001] for i in range(N)],'cape',[0,0,1])
 pp=part('F04-'+side,[inner],op='shallow disc;4mm centre rise',thickness=.004);pp['interiorSupport']['centreDisplacementM']=[0,0,.004]
 part('F05-'+side,[outer,reverse(inner)],op='annular rim with2 loops',thickness=.007)['multipleBoundaryLoops']=True
for tag,a,b in [('front-R',-90,0),('front-L',0,90),('rear-L',90,180),('rear-R',180,270)]:
 sector('B01-'+tag,(-.010,.236,.176),(.072,.236,.176),a,b,thickness=.006,notes='Four quarters share endcurves; complete closed leather belt; front hardware overlays closure.')
 sector('TR04-'+tag,(-.045,.219,.151),(.010,.219,.151),a,b,f='leg',notes='Separate cloth waist beneath belt; sewn quarter ends and trouser upper arcs.')
for pid,c,rx,ry in [('B03-buckle-C',[0,.031,.190],.036,.030),('B03-hanger-R',[.148,.014,.173],.030,.030)]:
 e=curve(pid+'-centreline',[[c[0]+rx*math.cos(2*math.pi*i/32),c[1]+ry*math.sin(2*math.pi*i/32),c[2]] for i in range(N)],hint=[0,0,1]);part(pid,[e],op='closed metal centreline extrusion radius3.5mm',thickness=.007,notes='Hole free; hanger legacyR belongs anatomicalLeft+X.')
polygon('B02-R',[[.124,-.005,.174],[.172,-.005,.174],[.164,-.355,.185],[.132,-.355,.185]],notes='AnatomicalLeft+X despite legacyR;48mm topwidth,350mm length.',thickness=.005)
part('B04-C',[edge('BUCKLE-pin-axis',[-.026,.031,.190],[.015,.031,.190],hint=[0,0,1])],op='41mm pin axis extrusion radius3mm',thickness=.006,notes='Pin hinge(-26,31,190)mm; ring inner halfwidth32.5mm;3.5mm nominal axle clearance.')
GF=[0,-.165,.104];GB=[0,-.150,-.112];GR=[-.043,-.245,0];GL=[.043,-.245,0];gus={}
for name,a,b in [('FR',GF,GR),('BR',GR,GB),('BL',GB,GL),('FL',GL,GF)]:gus[name]=edge('TR03-'+name,a,b,'leg',bend=(0,-.012,0),hint=[0,-1,0])
pp=part('TR03-C',[gus['FR'],gus['BR'],gus['BL'],gus['FL']],op='single4-sided curved diamond',notes='Ffront+Z,Brear-Z,R-X,L+X;4 edges each33 exact shared samples; no double crotch wall.')
pp['interiorSupport'].update({'construction':'Coons patch from4 registered edges','centreM':[0,-.225,0],'centreDisplacementM':[0,0,0]})
for side,s in [('R',-1),('L',1)]:
 cx=s*.133;G=GR if s<0 else GL
 for typ,front in [('TR01',True),('TR02',False)]:
  a,b=((0,90) if s>0 else (-90,0)) if front else ((90,180) if s>0 else (180,270))
  waist=curve(typ+'-'+side+'-waist',arc(0,-.045,.219,.151,a,b),'leg');wp=path(waist);innerW=min(wp[::32],key=lambda p:abs(p[0]));outerW=max(wp[::32],key=lambda p:abs(p[0]))
  lower=curve(typ+'-'+side+'-boot',arc(cx,-.535,.070,.072,-90,90) if front else arc(cx,-.535,.070,.072,90,270),'leg');lp=path(lower);innerB=min(lp[::32],key=lambda p:abs(p[0]));outerB=max(lp[::32],key=lambda p:abs(p[0]));centre=GF if front else GB
  gname=('FR' if side=='R' else 'FL') if front else ('BR' if side=='R' else 'BL');ge=gus[gname]
  if math.dist(path(ge)[0],centre)>1e-6:ge=reverse(ge)
  if math.dist(path(waist)[0],innerW)>1e-6:waist=reverse(waist)
  if math.dist(path(lower)[0],outerB)>1e-6:lower=reverse(lower)
  es=[waist,edge('TR-outseam-'+side,outerW,outerB,'leg',(s*.027,0,0)),lower,edge('TR-inseam-'+side,innerB,G,'leg',(s*.005,0,0)),reverse(ge),edge('TR-rise-'+('front' if front else 'rear'),centre,innerW,'leg')]
  pp=part(typ+'-'+side,es,notes='One open notched sheet; exact shared boundaries supersede uncalibrated silhouettes. TR02 uses newnotch supplement; no locally closed tube.')
  pp['interiorSupport']['centreDisplacementM']=[0,0,.018 if front else -.022]
 lof=curve('TR05-'+side+'-lower-front',arc(cx,-.580,.069,.071,-90,90),'leg');lor=curve('TR05-'+side+'-lower-rear',arc(cx,-.580,.069,.071,90,270),'leg')
 upf=curve('TR05-'+side+'-upper-front',arc(cx,-.535,.070,.072,-90,90),'leg');upr=curve('TR05-'+side+'-upper-rear',arc(cx,-.535,.070,.072,90,270),'leg')
 seam=edge('TR05-'+side+'-closure',path(lof)[0],path(upf)[0],'leg')
 pp=part('TR05-'+side,[lof,lor,seam,reverse(upr),reverse(upf),reverse(seam)],op='single45mm underlap band,cut seam explicitly closed after placement',notes='Foot-local300..345mm; bootmouth340:40mm insertion,5mm exposed. Upper halves reference BOTH actual leg lower curves; no cap.')
 pp['interiorSupport'].update({'construction':'linear radius/y loft','lowerRing':[-.580,.069,.071],'upperRing':[-.535,.070,.072],'angleDegrees':[-90,270],'centreX':cx})
# Interior silhouette controls are fixed independently from any mesh budget.
for side,sign in [('R',-1),('L',1)]:
 for name,offset in [('T01',[0,0,.022]),('T02',[0,0,-.024]),('T03',[sign*.012,0,0]),('T04',[0,.015,0]),('T05',[0,0,0])]:
  for pid,p in parts.items():
   if p['type']==name and ('-'+side in pid):p['interiorSupport']['centreDisplacementM']=offset
 p=parts['W02-'+side]
 p['attachmentCurves'].append(aliases['P04-'+side+'-inner'])
 curves[aliases['P04-'+side+'-inner']]['owners'].append({'part':p['id'],'direction':0,'mode':'interior sewn landing'})
 p['interiorSupport']['hardInteriorCurves']=[{'curve':cid,'everySamplePinned':True} for cid in p['attachmentCurves']]
 p['interiorSupport']['constraintPolicy']='Every named interior landing curve is a hard interpolation constraint. Radial baseline alone is not the accepted bridge surface; interior constrained-surface solve remains independent-acceptance pending.'
shoulderSolutions={parts['W02-'+side]['id']:solve_shoulder(parts['W02-'+side],curves) for side in ['R','L']}
frameRegistration=register_frames(curves,shoulderSolutions)
# Every surface has a fixed deterministic support recipe and actual interior support coordinates.
for p in parts.values():
 support=p['interiorSupport'];centre=add(support['centreM'],support['centreDisplacementM'])
 support['supportPointsM']=[]
 if 'lowerRing' in support:
  lo,hi=support['lowerRing'],support['upperRing'];aa,bb=support['angleDegrees'];cx=support['centreX']
  for u,v in support['supportParameters']:
   yy,rx,rz=mix(lo,hi,v);a=math.radians(aa+(bb-aa)*u);fold=support.get('radialSineDisplacementM',0)*math.sin(math.pi*v)*math.sin(math.pi*u)
   support['supportPointsM'].append(V([cx+(rx+fold)*math.sin(a),yy,(rz+fold)*math.cos(a)]))
 elif len(p['boundary'])==4:
  b,r,t,l=[path(e) for e in p['boundary']];t=t[::-1];l=l[::-1]
  edgeLookup={id(b):p['boundary'][0],id(r):p['boundary'][1],id(t):reverse(p['boundary'][2]),id(l):reverse(p['boundary'][3])}
  def interp(arr,x):
   e=edgeLookup[id(arr)];ss=curves[e['curve']]['samples'];ss=ss if e['direction']==1 else ss[::-1]
   z=min(31,int(x*32));u=x*32-z;aa=mul(ss[z]['derivativeMPerT'],e['direction']/32);bb=mul(ss[z+1]['derivativeMPerT'],e['direction']/32)
   q=add(add(mul(arr[z],2*u**3-3*u*u+1),mul(aa,u**3-2*u*u+u)),add(mul(arr[z+1],-2*u**3+3*u*u),mul(bb,u**3-u*u)))
   projection=curves[e['curve']].get('surfaceProjection')
   if projection:
    from frames import rbf_value_gradient
    q[0]=rbf_value_gradient(shoulderSolutions[projection['part']],q[1],q[2])[0]
   return q
  def coons(u,v):
   blend=add(add(mul(interp(b,u),1-v),mul(interp(t,u),v)),add(mul(interp(l,v),1-u),mul(interp(r,v),u)))
   bilinear=add(add(mul(b[0],(1-u)*(1-v)),mul(b[-1],u*(1-v))),add(mul(t[0],(1-u)*v),mul(t[-1],u*v)))
   return sub(blend,bilinear)
  delta=support['centreDisplacementM']
  if p['id']=='TR03-C':delta=sub([0,-.225,0],coons(.5,.5))
  support['construction']='Coons interpolation using4ordered33point boundary curves; canonical cubicHermite curve interpolation and any registeredRBFprojection; add16*u*(1-u)*v*(1-v)*centreCorrection. No face/tessellation emitted.'
  support['centreCorrectionM']=V(delta)
  support['supportPointsM']=[V(add(coons(u,v),mul(delta,16*u*(1-u)*v*(1-v)))) for u,v in support['supportParameters']]
 else:
  for e in p['boundary']:
   midpoint=path(e)[16]
   for r in [1/3,2/3]:support['supportPointsM'].append(V(mix(centre,midpoint,r)))
  support['construction']='radial boundary interpolation: ordered equal-edge perimeter parameter; P(r,t)=(1-r)*authoredCentre+r*boundary(t),0<=r<=1. Special extrusion/annulus or hardInteriorCurves override baseline and retain stated constraints.'
 support['supportWeights']=[weight(q,curves[p['boundary'][0]['curve']]['family']) for q in support['supportPointsM']]
for side in ['R','L']:
 parts['W02-'+side]['interiorSupport'].update(shoulderSolutions['W02-'+side])
 parts['W02-'+side]['interiorSupport']['constraintPolicy']='Explicit solved coefficients; boundary+6foldends+P04landing are33sample hardconstraints; canonical curves project theirHermiteYZ onto theRBF forcontinuous equality.'
 parts['W02-'+side]['interiorSupport']['supportWeights']=[{'chest':1.0} for q in parts['W02-'+side]['interiorSupport']['supportPointsM']]
# Distinguish declared curve shading frames from actual differential surface normals.
for c in curves.values():
 c['normalMeaning']='sampled boundary shading/frame guide; never proof of an actual surface normal'
 c['normalInterpolation']='At interior parameter evaluate exact cubicHermite derivative (and RBF chain rule if surfaceProjection). Linearly blend adjacent sample normal guides; project that guide perpendicular to the actual derivative and normalize. Zero-length projection is a rejection, not an automatic substitute. RBF surface normals instead use its saved analytic gradient.'
for p in parts.values():
 p['surfaceNormalContract']='Actual geometric normal is normalized cross(dS/du,dS/dv) of the stated surface recipe, with anatomical outward orientation. Boundary sample normals are shading/frame guides and are not a Jacobian or face-normal acceptance. Zero or sign-changing Jacobian rejects the surface.'
 if 'lowerRing' in p['interiorSupport']:
  p['interiorSupport']['boundaryCorrection']='Keep the analytic angular/radius loft as baseline, then add Coons transfinite difference from each baseline boundary to the canonical Hermite boundary. Full-turn/collar split boundaries use two angle half charts joined at their explicit canonical curves. This preserves all registered boundary functions; Jacobian acceptance remains independent review.'
# Original source reference raw bytes: resolve obsolete absolute paths by digest, never basename guess.
coverage=json.loads((ROOT/'docs/evidence/mira-reference-set-v64/cloth-reference-set/COVERAGE.json').read_text())
byhash={}
for p in ROOT.glob('docs/evidence/**/*.png'):byhash.setdefault(hashlib.sha256(p.read_bytes()).hexdigest(),str(p.relative_to(ROOT)))
types=[]
for t in coverage['types']:
 image=byhash.get(t['sha256'])
 if not image:raise ValueError('missing reference '+t['typeID'])
 if t['typeID']=='TR02':image=str((OUT/'TR02-notched-open-v65-v2.png').relative_to(ROOT))
 types.append({'typeID':t['typeID'],'name':t['name'],'instances':t['instances'],'reference':image,'sha256':hashlib.sha256((ROOT/image).read_bytes()).hexdigest(),'status':'qualitative shape; author coordinates independently selected'})
expected={i for t in types for i in t['instances']}
assert expected==set(parts),(expected-set(parts),set(parts)-expected)
bones={'body':{'parent':None,'translationM':[0,0,0]},'pelvis':{'parent':'body','translationM':[0,.985,0]},'spine':{'parent':'pelvis','translationM':[0,.18,0]},'chest':{'parent':'spine','translationM':[0,-.18,0]},'neck':{'parent':'chest','translationM':[0,.6,0]},'head':{'parent':'neck','translationM':[0,.16,0]}}
for i,s in enumerate([-1,1]):
 for name,parent,p in [(f'arm-{i}','chest',[s*.313,.46,0]),(f'elbow-{i}',f'arm-{i}',[0,-.33,0]),(f'hand-{i}',f'elbow-{i}',[0,-.31,0]),(f'leg-{i}','pelvis',[s*.133,0,0]),(f'knee-{i}',f'leg-{i}',[0,-.445,0]),(f'foot-{i}',f'knee-{i}',[0,-.435,0])]:bones[name]={'parent':parent,'translationM':p}
ports={'neck':{'frame':'CHEST_LOCAL_M','lower':{'y':.560,'innerRadii':[.100,.086],'outerRadii':[.104,.090]},'upper':{'y':.660,'innerRadii':[.086,.083],'outerRadii':[.090,.087]},'frontGapDegrees':[-12,12],'headCutY':.550,'kind':'overlap'},'hands':{'frame':'HAND_LOCAL_M','sides':['R:hand-0','L:hand-1'],'clothLower':{'y':.020,'radii':[.043,.041]},'bracerLower':{'y':0,'innerRadii':[.046,.044],'outerRadii':[.052,.050]},'skinRangeY':[-.015,.009],'skinBracerOverlapM':.009,'clothBracerOverlapM':.140,'clothFullLengthM':.190,'bracerUpperY':.160,'clothUpperY':.210,'skinWeld':False,'kind':'overlap'},'boots':{'frame':'FOOT_LOCAL_M','sides':['R:foot-0','L:foot-1'],'TR05Upper':{'y':.345,'radii':[.070,.072]},'TR05Lower':{'y':.300,'radii':[.069,.071]},'bootMouth':{'y':.340,'innerRadii':[.075,.077]},'bootInnerAtTR05Lower':[.073,.075],'overlapM':.040,'exposedM':.005,'minimumPrincipalClearanceM':.004,'weight':'knee-0/1=1','bootSupportY':-.108,'bottomM':.008,'heelM':.012,'kind':'overlap'}}
contacts=[{'id':'CUFF-'+s,'parts':['S05-'+s,'S06-'+s,'F01-'+s,'F02-'+s],'kind':'overlap','intersectionCHESTY':-.020,'clothEndCHESTY':-.160,'bracerEndCHESTY':-.180} for s in ['R','L']]
for s in ['R','L']:
 contacts += [{'id':'COWL-CAPE-'+s,'parts':['W02-'+s,'P04-'+s],'kind':'contact','curve':aliases['P04-'+s+'-inner'],'mode':'sewn interior landing, not coincident boundary','normalOffsetM':0},{'id':'BROOCH-'+s,'parts':['W02-'+s,'F04-'+s,'F05-'+s],'kind':'contact','seatCurve':aliases['BROOCH-seat-'+s],'pinDepthM':.004}]
data={'schema':'Q.cloth.boundary-registration.v65','basisCommit':'bc761f25aae76209d26623b509f97e1f3a5a12ca','provenance':'NEW author reconstruction. Old112curve/notch/TR03final was not recovered.','unit':'metre','frame':{'id':'CHEST_LOCAL_M','bindOriginInActorM':[0,.985,0],'axes':{'right':'-X','left':'+X','up':'+Y','front':'+Z'},'rotation':'identity bind only; poses use unchanged rig matrices'},'scope':{'typeCount':len(types),'placementCount':len(parts),'newMeshes':0,'runtimeChanges':0,'remoteChanges':0,'existingSkeletonBoneCount':41,'notTriangleContact':True},'types':types,'parts':list(parts.values()),'canonicalCurves':list(curves.values()),'aliases':aliases,'boneSubset':bones,'nodeFrameRegistration':frameRegistration,'externalPorts':ports,'contactContracts':contacts,'uvPolicy':'One canonical cylindrical boundary chart used by all owners. Back atan2 jump is explicit chart seam; future atlas packing cannot alter physical boundary chart.','normalPolicy':'One canonical orthonormal boundary frame. Future face-derived normals must match or explicitly register crease.','weightPolicy':'Canonical per-sample weights shared by seam owners. Capechest1 is bind registration, NOT dynamiccloth acceptance.','pending':['Independent numerical boundary/topology acceptance including solvedW02','Surface interiors/face normals/material atlas realization','Motion/clothsupport/bodyintersection/floorcollision/trianglecontact','Wholeperson source silhouette comparison','Real GL/device/sound/10-title PS4comparison'],'newImageSelected':'TR02-notched-open-v65-v2.png'}
OUT.mkdir(parents=True,exist_ok=True)
(OUT/'CLOTH_AUTHOR_SOURCE.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'types':len(types),'placements':len(parts),'curves':len(curves),'samples':len(curves)*N,'newMeshes':0}))
