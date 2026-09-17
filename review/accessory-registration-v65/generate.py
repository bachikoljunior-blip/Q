#!/usr/bin/env python3
"""Author-designed registration only. No vertices/faces, renderer or runtime imports."""
import copy, hashlib, itertools, json, math, pathlib
from curve_eval import nail as evaluate_nail, evaluate as evaluate_curve
ROOT=pathlib.Path(__file__).resolve().parents[2]
OUT=ROOT/'docs/evidence/mira-assembly-v65/accessory-registration'
SRC=ROOT/'docs/evidence/mira-reference-set-v64'
read=lambda p:json.loads(p.read_text())
legacy=read(SRC/'accessory-reference-set/TYPE_REFERENCE_COVERAGE.json')
old=read(SRC/'hand-staff-registration/AUTHOR_REGISTRATION.json')
rig=read(SRC/'hand-staff-registration/RIG_MEASUREMENTS.json')
bones={x['name']:x for x in rig['bind']}
PI=math.pi
add=lambda a,b:[a[i]+b[i] for i in range(3)]
sub=lambda a,b:[a[i]-b[i] for i in range(3)]
mul=lambda a,s:[v*s for v in a]
dot=lambda a,b:sum(a[i]*b[i] for i in range(3))
norm=lambda a:math.sqrt(dot(a,a))
unit=lambda a:mul(a,1/norm(a)) if norm(a)>1e-12 else [1,0,0]
cross=lambda a,b:[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]
lerp=lambda a,b,t:add(mul(a,1-t),mul(b,t))
clamp=lambda x:max(0,min(1,x))
smooth=lambda x:clamp(x)**2*(3-2*clamp(x))
def rot(p,q):
 v=q[:3]; return add(p,add(mul(cross(v,p),2*q[3]),mul(cross(v,cross(v,p)),2)))
def matrix(pos,q=[0,0,0,1]):
 return [*rot([1,0,0],q),0,*rot([0,1,0],q),0,*rot([0,0,1],q),0,*pos,1]
def xform(p,m):return [sum(m[j*4+i]*p[j] for j in range(3))+m[12+i] for i in range(3)]
def rounded(x):
 if isinstance(x,float):return round(x,10)
 if isinstance(x,list):return [rounded(y) for y in x]
 if isinstance(x,dict):return {k:rounded(v) for k,v in x.items()}
 return x
instances={p['id']:{'id':p['id'],'canonicalID':('hands:' if p['type'].startswith('AH') else 'boots:')+p['id'],'typeID':('hands:' if p['type'].startswith('AH') else 'boots:')+p['type'],'side':p['side'],'boneNames':p['bone'] if isinstance(p['bone'],list) else [p['bone']], 'boundaryUses':[], 'sourcePlacement':p['placement']} for p in legacy['instances']}
curves={}; joins=[]; ports=[]; nailSeats=[]; routes=[]
references={t['id']:'accessory-reference-set/'+t['selectedImage'] for t in legacy['types']}
references.update(AH07='accessory-boundary-references/AH07-bare-seat-v1.png', AH08='accessory-reference-supplement/AH08-nail-plate-v2.png', AH10='accessory-reference-supplement/AH10-wrist-sleeve-v2.png', AB01='accessory-boundary-references/AB01-thin-outsole-v1.png', AB02='accessory-boundary-references/AB02-empty-heel-v1.png', AB03='accessory-reference-supplement/AB03-open-patch-v3.png')
def curve(cid,frame,points,normal,weights,owners,kind='weld',closed=False,metadata=None):
 assert cid not in curves
 n=len(points); rows=[]
 for i,p in enumerate(points):
  t=i/(n-1)
  tangent=unit(sub(points[(i+1)%n] if i<n-1 else (points[1] if closed else points[i]), points[i-1] if i else (points[-2] if closed else points[0])))
  seed=normal(p,t) if callable(normal) else normal
  nn=unit(sub(seed,mul(tangent,dot(seed,tangent))))
  w=weights(p,t) if callable(weights) else weights
  rows.append({'sample':i,'u':t,'positionMm':p,'normal':nn,'tangent':tangent,'boneWeights':{k:v for k,v in w.items() if v>1e-12}})
 c={'id':cid,'frame':frame,'unit':'mm','kind':kind,'closed':closed,'interpolation':'piecewise cubic Hermite: uniform knots sample/(N-1), segment-local derivative=tangent*tangentMagnitudeMm; exact shared endpoint and junction derivatives; normal = normalized(linear normal seed projected perpendicular to ACTUAL Hermite derivative at t); normalized linear weights','samples':rows,'owners':owners}
 if metadata:c.update(metadata)
 curves[cid]=c
 for k,pid in enumerate(owners):
  if pid in instances:instances[pid]['boundaryUses'].append({'curveID':cid,'direction':1 if k==0 else -1,'canonicalAttributes':'positionMm,normal,tangent,boneWeights; never recompute per owner','normalSign':1 if kind=='weld' or k==0 else -1})
 if len(owners)==2:joins.append({'id':'J.'+cid,'curveID':cid,'owners':owners,'kind':kind,'directions':[1,-1],'surfaceNormals':'same' if kind=='weld' else 'opposed contact-side; canonical registration normal is unchanged'})
 return cid

def line(cid,frame,a,b,normal,weights,owners,bow=None,kind='weld'):
 pts=[add(lerp(a,b,i/8),mul(bow or [0,0,0],4*(i/8)*(1-i/8))) for i in range(9)]
 return curve(cid,frame,pts,normal,weights,owners,kind)
def ellipse(center,rx,rz,n=32,start=0,end=2*PI,sgn=1):
 return [[center[0]+sgn*rx*math.sin(start+(end-start)*i/n),center[1],center[2]+rz*math.cos(start+(end-start)*i/n)] for i in range(n+1)]
def bootweight(si,y):
 w=smooth((y-40)/260);return {f'foot-{si}':1-w,f'knee-{si}':w}
def dweights(si,chain,s,L,rootpivot):
 if s<8:
  w=smooth(s/8);return {f'hand-{si}':1-w,f'finger-{si}-{chain}':w}
 w=smooth(.5+(s-rootpivot)/(.30*L));return {f'finger-{si}-{chain}':1-w,f'finger-tip-{si}-{chain}':w}

for side,si,sgn in [('R',0,1),('L',1,-1)]:
 H=f'hand-{si}';F=f'foot-{si}';hw={H:1};fw={F:1}
 # All hand points use actual named-bone bind frames. Thumb rotation is preserved.
 wrist=old['sideSpecificLoops'][side]['AH10_DISTAL']
 wp=[r['pointHandMm'] for r in wrist]
 if len(wp)==32:wp.append(wp[0])
 sectors=[('back',28,36),('thenar',4,12),('palm',12,20),('ulnar',20,28)]
 for part,a,b in sectors:
  pts=[wp[k%32] for k in range(a,b+1)]
  curve(f'{side}.wrist.{part}',H,pts,lambda p,t:unit([p[0]/32,0,p[2]/24]),hw,[f'{side}-{part}',f'{side}-wrist'])
 prox=ellipse([0,9,0],28,24,sgn=sgn)
 pc=curve(f'{side}.wrist.proximal',H,prox,lambda p,t:[p[0]/28,0,p[2]/24],hw,[f'{side}-wrist'],'open',True)
 contact=ellipse([0,0,0],29.5,24,sgn=sgn)
 pcurve=curve(f'{side}.wrist.bracer-overlap',H,contact,lambda p,t:[p[0]/29.5,0,p[2]/24],hw,[f'{side}-wrist'],'overlap',True)
 ports.append({'id':side+'-wrist','owner':f'hands:{side}-wrist','frame':H,'unit':'mm','kind':'overlap','curveID':pcurve,'counterparts':[f'cloth:F01-{side}',f'cloth:F02-{side}'],'sharedCanonical':'ACCESSORY_REGISTRATION.json#curves/'+pcurve,'skinYRangeMm':[-15,9],'bracerOpeningYmm':0,'longitudinalOverlapMm':9,'bracerInnerRadiiMm':[46,44],'axisClearanceMm':[16.5,20],'clothSleeveOpeningYmm':20,'clothDirectSkinWeld':False,'deformedClearanceValidated':False})
 ds={}
 for di,digit in enumerate(['index','middle','ring','little','thumb']):
  pp=instances[f'{side}-{digit}-proximal']['sourcePlacement']; chain=pp['old_chain']; L=pp['target_digit_length_mm']; root=pp['old_root_hand_mm']; q=bones[f'finger-{si}-{chain}']['quaternion']; pivot=pp['old_chain_length_mm']/2
  rx=12 if digit=='thumb' else (9 if digit=='little' else 10.5); rz=12.5 if digit=='thumb' else (9.5 if digit=='little' else 11)
  def dp(s,theta,rx_=rx,rz_=rz):return add(root,rot([sgn*rx_*math.sin(theta),-s,rz_*math.cos(theta)],q))
  def dn(p,t,root_=root,q_=q):return rot([sgn*math.sin(t*2*PI),0,math.cos(t*2*PI)],q_)
  ds[digit]={'root':root,'q':q,'chain':chain,'L':L,'pivot':pivot,'rx':rx,'rz':rz,'dp':dp}
  # MCP 4 quadrants. Each partner owns exactly one section; thumb uses thenar on three sides.
  neighborRad=f'{side}-first-web' if di==0 else (f'{side}-web-'+['index-middle','middle-ring','ring-little'][di-1] if di<4 else f'{side}-thenar')
  neighborUln=f'{side}-web-'+['index-middle','middle-ring','ring-little'][di] if di<3 else (f'{side}-ulnar' if di==3 else f'{side}-first-web')
  partners=[f'{side}-back' if di<4 else f'{side}-thenar',neighborRad,f'{side}-palm' if di<4 else f'{side}-thenar',neighborUln]
  ds[digit]['corners']={}
  for qi,sector in enumerate(['dorsal','radial','palmar','ulnar']):
   a=-PI/4+qi*PI/2;b=a+PI/2;pts=[dp(0,a+(b-a)*i/8) for i in range(9)]
   cid=f'{side}.MCP.{digit}.{sector}'
   curve(cid,H,pts,lambda p,t,a=a,b=b,q=q:rot([sgn*math.sin(a+(b-a)*t),0,math.cos(a+(b-a)*t)],q),hw,[f'{side}-{digit}-proximal',partners[qi]])
   ds[digit]['corners'][sector]=[pts[0],pts[-1]]
  sections=[('proximal',0,pp['section_length_mm'])]
  if digit!='thumb':
   mp=instances[f'{side}-{digit}-middle']['sourcePlacement'];sections.append(('middle',mp['section_start_mm'],mp['section_start_mm']+mp['section_length_mm']))
  tp=instances[f'{side}-{digit}-tip']['sourcePlacement'];sections.append(('tip',tp['section_start_mm'],L))
  for sec,start,end in sections:
   pid=f'{side}-{digit}-{sec}'; inst=instances[pid]
   inst['frame']=H;inst['localToFrameMatrixMm']=matrix(add(root,rot([0,-start,0],q)),q)
   inst['surfaceRegistration']={'family':'open loft' if sec!='tip' else 'proximal-open distal-closed loft with bare skin nail recess','axisRootMm':[0,-1,0],'startArclengthMm':start,'endArclengthMm':end,'nativeRootPivotMm':pivot,'geometryLengthMm':L,'rootPositionHandMm':root,'rootQuaternion':q,'radiusStations':[[0,rx,rz],[.5,rx*.96,rz*.97],[1,rx,rz]] if sec!='tip' else [[0,rx,rz],[.55,rx*.91,rz*.91],[.9,rx*.60,rz*.60],[1,0,0]],'sectionCaps':{'proximal':False,'distal':sec=='tip'},'weightRule':'MCP hand=1; smooth hand/root collar over first 8mm; existing root/tip pivot smoothstep .30*L; shared loops authoritative'}
   def factor(t,is_z=False):
    st=[(0,1),(.55,.91),(.9,.60),(1,0)] if sec=='tip' else [(0,1),(.5,.97 if is_z else .96),(1,1)]
    for (a,fa),(b,fb) in zip(st,st[1:]):
     if t<=b:return fa+(fb-fa)*smooth((t-a)/(b-a))
    return st[-1][1]
   inst['interiorControls']=[{'positionMm':dp(start+(end-start)*t,ang,rx*factor(t),rz*factor(t,True)),'boneWeights':dweights(si,chain,start+(end-start)*t,L,pivot),'sourceFeature':'loft barrel' if sec!='tip' else 'rounded pulp / nail-free fingertip'} for t,fac in [(.25,.98),(.6,.94),(.85,.8 if sec=='tip' else .97)] for ang in [0,PI/2,PI,3*PI/2]]
  for (sec,start,end),(nextsec,ns,ne) in zip(sections,sections[1:]):
   joint='IP' if digit=='thumb' else ('PIP' if sec=='proximal' else 'DIP')
   pts=[dp(end,2*PI*i/32) for i in range(33)]
   curve(f'{side}.{joint}.{digit}.loop',H,pts,dn,dweights(si,chain,end,L,pivot),[f'{side}-{digit}-{sec}',f'{side}-{digit}-{nextsec}'],closed=True)
  instances[f'{side}-{digit}-tip']['surfaceRegistration']['nailSeatOverride']='The registered bare skin floor replaces the loft inside the seat contour; only AH08 supplies keratin. Distal radius profile smoothstep [0,1],[.55,.91],[.9,.60],[1,0].'
  # Analytic nail underside shares the recessed skin floor; no extra plate in AH07.
  np=instances[f'{side}-{digit}-nail']['sourcePlacement'];width=np['width_mm'];length=np['length_mm'];s0=L-length/2-2
  nail_definition={'widthLengthMm':[width,length],'digitLengthMm':L,'tipArclengthRangeMm':[tp['section_start_mm'],L],'tipRadiiMm':[rx,rz],'radialSign':sgn,'rootPositionHandMm':root,'rootQuaternion':q,'normalDepthMm':.4,'plateThicknessMm':.5}
  def seat(t,u=1):return evaluate_nail(nail_definition,t/(2*PI),u)['positionMm']
  def seatnormal(p,t):return evaluate_nail(nail_definition,t)['normal']
  npts=[seat(2*PI*i/32) for i in range(33)]
  nw=dweights(si,chain,s0,L,pivot)
  cid=curve(f'{side}.{digit}.nail-seat',H,npts,seatnormal,nw,[f'{side}-{digit}-tip',f'{side}-{digit}-nail'],'contact',True)
  curves[cid]['evaluator']='analytic-normal-offset-elliptic-nail';curves[cid]['definition']=nail_definition
  curves[cid]['interpolation']='analytic ellipsoidal tip skin minus 0.4mm outward normal; curve_eval.nail defines position and analytic derivative; canonical samples are readback only'
  for row in curves[cid]['samples']:
   ev=evaluate_nail(nail_definition,row['u']);row['positionMm']=ev['positionMm'];row['normal']=ev['normal'];row['tangent']=unit(ev['derivative'])
  nailSeats.append({'id':f'{side}.{digit}.nail-seat','owners':[f'{side}-{digit}-tip',f'{side}-{digit}-nail'],'frame':H,'contourCurveID':cid,'widthLengthMm':[width,length],'floorCenterMm':seat(0,0),'depthMm':.4,'plateThicknessMm':.5,'plateProudMm':.1,'clearancePerSideMm':.1,'bedOuterWidthLengthMm':[width+.2,length+.2],'supportSamples':[evaluate_nail(nail_definition,i/32) for i in range(33)],'definition':nail_definition,'undersideControlRows':[seat(2*PI*i/8,u) for u in [0,.5,1] for i in range(8)],'interpolation':'tip elliptical skin z=(rz/rx)*sqrt((rx*f(s))^2-x^2); floor is skin minus0.4mm analytic surface normal; plate exterior skin plus0.1mm normal; exact evaluator and analytic derivative in curve_eval.nail','meshContactValidated':False})
  inst=instances[f'{side}-{digit}-nail'];inst['frame']=H;inst['localToFrameMatrixMm']=matrix(seat(0,0),q);inst['surfaceRegistration']={'family':'single curved plate','seatID':cid,'thicknessMm':.5};inst['interiorControls']=[{'positionMm':seat(ang,u),'boneWeights':nw,'sourceFeature':'matching concave underside'} for u in [0,.5] for ang in [0,PI/2,PI,3*PI/2]]
 # Wrist stays an open sleeve: controls lie on the skin, never in its central hole.
 instances[f'{side}-wrist']['surfaceRegistration']={'family':'uncapped elliptical sleeve','stationsYRxRzMm':[[-15,32,24],[0,29.5,24],[9,28,24]],'endsOpen':True,'internalCap':False}
 instances[f'{side}-wrist']['interiorControls']=[{'positionMm':p,'boneWeights':hw,'sourceFeature':'continuous external wrist wall, both apertures open'} for y,rx in [(-9,31),(0,29.5),(6,28.5)] for p in ellipse([0,y,0],rx,24,n=8,sgn=sgn)[:-1]]
 # Ordinary web connectors, followed by thumb web and the four palm longitudinal seams.
 for i,(a,b) in enumerate(zip(['index','middle','ring'],['middle','ring','little'])):
  web=f'{side}-web-{a}-{b}'
  for label,qa,qb,owner,bow in [('dorsal','ulnar','radial','back',[0,4,2]),('palmar','ulnar','radial','palm',[0,4,-2])]:
   ia=1 if label=='dorsal' else 0;ib=0 if label=='dorsal' else 1
   line(f'{side}.web.{a}-{b}.{label}',H,ds[a]['corners'][qa][ia],ds[b]['corners'][qb][ib],[0,0,1 if label=='dorsal' else -1],hw,[web,f'{side}-{owner}'],bow)
 for label,ia,ib,owner in [('dorsal',0,1,'back'),('palmar',1,0,'palm')]:
  line(f'{side}.first-web.{label}',H,ds['index']['corners']['radial'][ia],ds['thumb']['corners']['ulnar'][ib],[0,0,1 if label=='dorsal' else -1],hw,[f'{side}-first-web',f'{side}-{owner}'],[0,7,0])
 for name,wi,digit,quad,ci,owners in [('back-thenar',4,'thumb','ulnar',1,['back','thenar']),('palm-thenar',12,'thumb','ulnar',0,['palm','thenar']),('palm-ulnar',20,'little','ulnar',0,['palm','ulnar']),('back-ulnar',28,'little','ulnar',1,['back','ulnar'])]:
  line(f'{side}.hand.{name}',H,wp[wi],ds[digit]['corners'][quad][ci],[-.3*sgn if 'ulnar' in name else .3*sgn,0,-1 if 'palm' in name else 1],hw,[f'{side}-{p}' for p in owners],[0,-3,0])
 # Boot registration: unchanged rear total20 = sole8 + separate heel12.
 def soleY(z):return -96-12*smooth((z+20)/90)+3*smooth((z-155)/38)
 def outline(a,inset=0):
  z=50+143*math.cos(a);width=79-12*math.exp(-((z-10)/48)**2);sn=math.sin(a);sn=0 if abs(sn)<1e-12 else sn;return [sgn*(width-inset)*math.copysign(abs(sn)**.55,sn),soleY(z)+8,z]
 outer=[outline(2*PI*i/64) for i in range(65)]
 curve(f'{side}.boot.sole-welt',F,outer,lambda p,t:[p[0]/79,1,(p[2]-50)/143],fw,[f'{side}-boot-sole',f'{side}-boot-welt'],closed=True)
 intervals=[('toe',-60,60),('quarter-inner',60,140),('heel-back',140,220),('quarter-outer',220,300)]
 for part,a,b in intervals:
  pts=[outline(math.radians(a+(b-a)*i/16),3) for i in range(17)]
  curve(f'{side}.boot.welt-{part}',F,pts,lambda p,t:[p[0]/79,1,(p[2]-50)/143],fw,[f'{side}-boot-welt',f'{side}-boot-{part}'])
 def ankle(a):return [sgn*48*math.sin(a),40,58*math.cos(a)]
 for part,a,b in [('vamp',-45,45),('quarter-inner',45,135),('heel-back',135,225),('quarter-outer',225,315)]:
  pts=[ankle(math.radians(a+(b-a)*i/16)) for i in range(17)]
  curve(f'{side}.boot.ankle-{part}',F,pts,lambda p,t:[p[0]/48,0,p[2]/58],fw,[f'{side}-boot-{part}',f'{side}-boot-shaft'])
 tin=outline(PI/3,3);tout=outline(5*PI/3,3)
 line(f'{side}.boot.toe-vamp',F,tin,tout,[0,1,.4],fw,[f'{side}-boot-toe',f'{side}-boot-vamp'],[0,64,10])
 for tag,sa,aa,a,b in [('vamp-inner',60,45,'vamp','quarter-inner'),('vamp-outer',300,315,'vamp','quarter-outer'),('heel-inner',140,135,'heel-back','quarter-inner'),('heel-outer',220,225,'heel-back','quarter-outer')]:
  line(f'{side}.boot.{tag}',F,outline(math.radians(sa),3),ankle(math.radians(aa)),[sgn*(1 if 'inner' in tag else -1),.25,.2 if 'vamp' in tag else -.5],fw,[f'{side}-boot-{a}',f'{side}-boot-{b}'],[0,0,4 if 'vamp' in tag else -3])
 shaftTop=ellipse([0,310,0],76.5,78.5,sgn=sgn)
 curve(f'{side}.boot.shaft-rim',F,shaftTop,lambda p,t:[p[0]/76.5,0,p[2]/78.5],{f'knee-{si}':1},[f'{side}-boot-shaft',f'{side}-boot-rim'],closed=True)
 inner=ellipse([0,340,0],75,77,sgn=sgn)
 topid=curve(f'{side}.boot.rim-aperture',F,inner,lambda p,t:[-p[0]/75,0,-p[2]/77],{f'knee-{si}':1},[f'{side}-boot-rim'],'open',True)
 ports.append({'id':side+'-trousers-to-boots','owner':f'boots:{side}-boot-rim','additionalOwner':f'boots:{side}-boot-shaft','frame':F,'unit':'mm','kind':'overlap','curveID':topid,'counterparts':[f'cloth:TR05-{side}',f'cloth:TR01-{side}',f'cloth:TR02-{side}'],'sharedCanonical':'ACCESSORY_REGISTRATION.json#curves/'+topid,'footToKneeTranslationMm':[0,-435,0],'bootTopFootYmm':340,'bootTopKneeYmm':-95,'bootInnerStationsMm':[[300,73,75],[340,75,77]],'trouserFootYRangeMm':[300,345],'trouserRadiiAtBottomTopMm':[[69,71],[70,72]],'longitudinalOverlapMm':40,'minimumRegisteredAxisClearanceMm':4,'deformedClearanceValidated':False})
 ha=math.acos(-70/143);heel=[]
 for i in range(49):
  p=outline(ha+(2*PI-2*ha)*i/48,3);heel.append([p[0],-96,p[2]])
 heel.extend([lerp(heel[-1],heel[0],i/16) for i in range(1,17)])
 curve(f'{side}.boot.heel-sole-seat',F,heel,[0,1,0],fw,[f'{side}-boot-heel',f'{side}-boot-sole'],'contact',True,{'contactRegion':'rear underside footprint bounded by sole outline inset3mm for z<=-20, Y=-96; no air gap; sole lower surface exactly -96 over region'})
 for i,(x,z) in enumerate([(-40,-80),(40,-80),(-40,-35),(40,-35)],1):
  pid=f'{side}-boot-fastener-{i}';p=[x,-107,z];pts=ellipse(p,3,3,n=24)
  cid=curve(f'{side}.boot.fastener-{i}-seat',F,pts,[0,-1,0],fw,[f'{side}-boot-heel',pid],'contact',True)
  instances[pid]['surfaceRegistration']={'family':'closed disc','radiusMm':3,'seatRadiusMm':3.1,'seatDepthMm':1,'topYmm':-107,'outerYmm':-108,'centerMm':[x,-107.5,z],'metalOwnedOnlyByThisInstance':True}
  instances[pid]['interiorControls']=[{'positionMm':[x,y,z],'boneWeights':fw,'sourceFeature':'AB11 separate disc faces; AB02 empty recess'} for y in [-107,-108]]
 # Skin-weight-consistent shaft loft controls, no new skeleton or mesh.
 for p in ['shaft','rim']:
  stations=([ [40,48,58],[100,54,62],[200,66,70],[300,76,78],[310,76.5,78.5] ] if p=='shaft' else [[310,76.5,78.5],[335,78,80],[340,78,80],[340,75,77],[310,73.5,75.5]])
  instances[f'{side}-boot-{p}']['surfaceRegistration']={'family':'uncapped loft' if p=='shaft' else 'single folded ring','stationsYRxRzMm':stations,'thicknessMm':3,'skinWeightBlendYmm':[40,300],'endsOpen':True}
  instances[f'{side}-boot-{p}']['interiorControls']=[{'positionMm':point,'boneWeights':bootweight(si,y),'sourceFeature':'ankle waist to calf flare' if p=='shaft' else 'fold return / inner leather'} for y,rx,rz in stations for point in ellipse([0,y,0],rx,rz,n=8,sgn=sgn)[:-1]]
 instances[f'{side}-boot-welt']['surfaceRegistration']={'family':'continuous annular strip','outerCurveID':f'{side}.boot.sole-welt','widthMm':3,'thicknessMm':1.5,'centralHole':True,'extraClasp':False}
 instances[f'{side}-boot-welt']['interiorControls']=[{'positionMm':add(outline(2*PI*i/32,1.5),[0,.75,0]),'boneWeights':fw,'sourceFeature':'narrow continuous welt following sole curvature'} for i in range(32)]
 instances[f'{side}-boot-sole']['surfaceRegistration']={'family':'thin continuous slab without integral heel','footprintCurveID':f'{side}.boot.sole-welt','thicknessMm':8,'lowerSurfaceY':'-96 -12*smoothstep((z+20)/90)+3*smoothstep((z-155)/38), clamps 0..1','upperSurfaceY':'lower+8','supportPlaneYmm':-108,'rearUpperYmm':-88,'excludedProvisionalTotal22mm':True}
 instances[f'{side}-boot-sole']['interiorControls']=[{'positionMm':[x,soleY(z)+dy,z],'boneWeights':fw,'sourceFeature':'thin continuous curved sole, no heel step'} for z in [-80,-20,20,70,120,170] for x in [-20,0,20] for dy in [0,8]]
 instances[f'{side}-boot-heel']['surfaceRegistration']={'family':'separate closed heel with four empty blind seats','topYmm':-96,'bottomYmm':-108,'heightMm':12,'contactCurveID':f'{side}.boot.heel-sole-seat','footprintXZmm':[[p[0],p[2]] for p in heel],'fastenerSeatRadiusMm':3.1,'fastenerSeatDepthMm':1,'metalFaces':0}
 for route in ['shaft-a','shaft-b','instep']:
  pid=f'{side}-boot-wrap-{route}';pts=[];samples=[]
  for i in range(65):
   t=i/64
   if route=='instep':
    a=-PI*.7+PI*1.4*t;x=sgn*65*math.sin(a);y=-30+57*math.cos(a);z=70+40*(t-.5);normal=unit([x/65,math.cos(a),.1]);p=[x,y,z]
   else:
    y=40+230*t;a=2*PI*t if route=='shaft-a' else PI-2*PI*t
    rx=48+28*smooth((y-40)/260);rz=58+20*smooth((y-40)/260)
    # Smooth plateau over each crossing, taper to actual shaft contact at ends.
    near=min(abs(t-.25),abs(t-.75));lift=1.6*(1-smooth((near-.035)/.04)) if route=='shaft-b' else 0
    normal=unit([sgn*math.sin(a)/rx,0,math.cos(a)/rz]);p=add([sgn*rx*math.sin(a),y,rz*math.cos(a)],mul(normal,.75+lift))
   pts.append(p);samples.append({'u':t,'positionMm':p,'normal':normal,'boneWeights':bootweight(si,p[1]) if route!='instep' else fw})
  cid=curve(f'{side}.boot.wrap-{route}-centre',F,pts,lambda p,t: samples[min(64,round(t*64))]['normal'],lambda p,t:samples[min(64,round(t*64))]['boneWeights'],[pid],'route')
  routes.append({'id':pid,'centerCurveID':cid,'widthMm':12,'thicknessMm':1.5,'sweptSection':'transport width tangent = cross(canonical tangent,normal), offsets +/-6mm; thickness +/-0.75mm normal','hiddenRoute':'author design, not observed underside','crossingParameters':[.25,.75] if route!='instep' else [],'upperRoute':'shaft-b','upperCentreLiftMm':1.6,'nominalCrossingClearanceMm':.1,'surfaceContactValidated':False})
  for end,idx in [('start',0),('end',-1)]:
   tangent=curves[cid]['samples'][idx]['tangent'];nn=samples[idx]['normal'];widthdir=unit(cross(tangent,nn));c= sub(pts[idx],mul(nn,.75))
   seatpts=[add(c,mul(widthdir,-6+12*j/8)) for j in range(9)]
   owner=f'{side}-boot-shaft' if route!='instep' else f'{side}-boot-vamp'
   curve(f'{side}.boot.wrap-{route}-{end}-seat',F,seatpts,nn,samples[idx]['boneWeights'],[pid,owner],'contact')
  instances[pid]['surfaceRegistration']={'family':'one flat strip deformed onto author route','widthMm':12,'thicknessMm':1.5,'routeID':pid}
  instances[pid]['interiorControls']=[{'positionMm':x['positionMm'],'boneWeights':x['boneWeights'],'sourceFeature':'flat strap to explicit six-route counterpart placement'} for x in samples[::8]]

# A corner is shared by multiple canonical curves too. Assign one junction normal,
# then author the Hermite endpoint direction in its tangent plane. This avoids
# curing pairwise seams while leaving incompatible normals at the same corner.
junctions=[];groups={}
for c in curves.values():
 for r in c['samples']:
  group='continuous-surface' if c['kind'] in ('weld','open') else c['id']
  key=(c['frame'],group,*[round(x,7) for x in r['positionMm']])
  groups.setdefault(key,[]).append((c,r))
for key,members in groups.items():
 if len(members)<2:continue
 weights=members[0][1]['boneWeights']
 assert all(all(abs(w.get(k,0)-weights.get(k,0))<1e-8 for k in set(w)|set(weights)) for w in [r['boneWeights'] for c,r in members]),key
 before=[r['tangent'][:] for c,r in members]
 beforeTriple=max((abs(dot(a,cross(b,c))) for a,b,c in itertools.combinations(before,3)),default=0)
 n=unit([sum(r['normal'][i] for c,r in members) for i in range(3)])
 pos=members[0][1]['positionMm'];jid='JN.'+str(len(junctions)+1).zfill(4)
 junctions.append({'id':jid,'frame':key[0],'positionMm':pos,'normal':n,'boneWeights':weights,'members':[{'curveID':c['id'],'sample':r['sample']} for c,r in members],'normalDomain':key[1],'sourceIncidentTangents':before,'sourceMaxTripleProduct':beforeTriple,'tangentPolicy':'author Hermite endpoint derivative repaired into one tangent plane; this changes interpolation shape between fixed samples, not merely shading normal averaging'})
 for c,r in members:
  r['junctionID']=jid;r['positionMm']=pos;r['normal']=n;r['boneWeights']=weights
  projected=sub(r['tangent'],mul(n,dot(r['tangent'],n)));assert norm(projected)>1e-6,(jid,'unresolvable tangent; requires boundary redesign')
  r['tangent']=unit(projected)
 after=[r['tangent'] for c,r in members]
 junctions[-1]['repairedMaxTripleProduct']=max((abs(dot(a,cross(b,c))) for a,b,c in itertools.combinations(after,3)),default=0)
 junctions[-1]['repairedTangentRank']=2 if max((norm(cross(a,b)) for a,b in itertools.combinations(after,2)),default=0)>1e-7 else 1
 junctions[-1]['maxDerivativeRepairAngleDegrees']=max(math.degrees(math.acos(max(-1,min(1,dot(a,b))))) for a,b in zip(before,after))
 assert junctions[-1]['repairedMaxTripleProduct']<1e-7

for c in curves.values():
 rows=c['samples'];count=len(rows)
 for i,r in enumerate(rows):
  left=rows[i-1]['positionMm'] if i else (rows[-2]['positionMm'] if c['closed'] else rows[1]['positionMm'])
  right=rows[i+1]['positionMm'] if i<count-1 else (rows[1]['positionMm'] if c['closed'] else rows[-2]['positionMm'])
  r['tangentMagnitudeMm']=(norm(sub(r['positionMm'],left))+norm(sub(right,r['positionMm'])))/2

# Construct directed cycles, then orient connected cycles so every weld cancels.
# Contact seats and overlay routes are interior constraints, not patch boundary edges.
cycles=[];edge_cycles={}
for pid,p in instances.items():
 uses={u['curveID']:u for u in p['boundaryUses'] if curves[u['curveID']]['kind'] in ('weld','open')}
 remaining=set(uses)
 while remaining:
  first=min(remaining);c=curves[first];chain=[]
  if c['closed']:
   chain=[{'curveID':first,'direction':1}];remaining.remove(first)
  else:
   key=lambda pos:tuple(round(v,7) for v in pos)
   start=key(c['samples'][0]['positionMm']);at=start;cid=first
   while True:
    cc=curves[cid];a=key(cc['samples'][0]['positionMm']);b=key(cc['samples'][-1]['positionMm']);direction=1 if at==a else -1
    assert at in (a,b),(pid,cid,at)
    chain.append({'curveID':cid,'direction':direction});remaining.remove(cid);at=b if direction==1 else a
    if at==start:break
    candidates=[k for k in remaining if not curves[k]['closed'] and at in (key(curves[k]['samples'][0]['positionMm']),key(curves[k]['samples'][-1]['positionMm']))]
    assert len(candidates)==1,(pid,at,candidates)
    cid=candidates[0]
  ci=len(cycles);cycles.append({'instance':pid,'edges':chain})
  for e in chain:edge_cycles.setdefault(e['curveID'],[]).append((ci,e['direction']))
adj={i:[] for i in range(len(cycles))}
for cid,owners in edge_cycles.items():
 if len(owners)==2:
  (a,da),(b,db)=owners;adj[a].append((b,-da*db));adj[b].append((a,-da*db))
orient={}
for seed in adj:
 if seed in orient:continue
 orient[seed]=1;queue=[seed]
 for a in queue:
  for b,relative in adj[a]:
   if b in orient:assert orient[b]==orient[a]*relative,('non-orientable boundary',a,b)
   else:orient[b]=orient[a]*relative;queue.append(b)
 # Choose the component sign by signed circulation against canonical normals.
 score=0
 for ci in queue:
  cycle=cycles[ci];part=instances[cycle['instance']];pts=[r['positionMm'] for u in part['boundaryUses'] if curves[u['curveID']]['kind'] in ('weld','open') for r in curves[u['curveID']]['samples']];G=[sum(p[k] for p in pts)/len(pts) for k in range(3)]
  for e in cycle['edges']:
   for row in curves[e['curveID']]['samples']:
    score+=dot(cross(sub(row['positionMm'],G),mul(row['tangent'],e['direction']*orient[ci])),row['normal'])
 if score<0:
  for ci in queue:orient[ci]*=-1
for ci,cycle in enumerate(cycles):
 pid=cycle['instance'];chain=cycle['edges']
 if orient[ci]<0:chain=[{'curveID':e['curveID'],'direction':-e['direction']} for e in reversed(chain)]
 instances[pid].setdefault('boundaryLoops',[]).append(chain)
 for e in chain:
  use=next(u for u in instances[pid]['boundaryUses'] if u['curveID']==e['curveID']);use['direction']=e['direction']
for j in joins:
 if j['kind']=='weld':j['directions']=[next(u['direction'] for u in instances[pid]['boundaryUses'] if u['curveID']==j['curveID']) for pid in j['owners']]

# Explicit controls for each skin/leather patch, with reproducible boundary interpolation.
feature={'AH01':'palm shallow palmar bowl','AH02':'dorsal metacarpal rise','AH03':'thenar bulge and thumb cutout','AH04':'ulnar convex side','AH05':'interdigital saddle','AH09':'broad thumb opposition saddle','AH10':'minimum uncapped wrist skin','AB03':'open instep with four free joining edges','AB04':'broad flattened toe','AB05':'open medial/lateral quarter','AB06':'open rear heel panel without rivets','AB10':'continuous welt without clasp'}
for ix,(pid,p) in enumerate(instances.items()):
 typ=p['typeID'].split(':')[1]; si=0 if p['side']=='R' else 1;p.setdefault('frame',f'hand-{si}' if typ.startswith('AH') else f'foot-{si}')
 pts=[r['positionMm'] for use in p['boundaryUses'] for r in curves[use['curveID']]['samples']]
 assert pts, pid
 center=[sum(v[j] for v in pts)/len(pts) for j in range(3)]
 p.setdefault('localToFrameMatrixMm',matrix(center))
 p['sourceImage']='docs/evidence/mira-reference-set-v64/'+references[typ]
 p['referenceInterpretation']={'basis':'author-design from selected silhouette/ownership, not pixel measurement','feature':feature.get(typ,p.get('surfaceRegistration',{}).get('family')),'precision':'uncalibrated multi-view appearance; hidden counterpart and exact mm authored'}
 if 'interiorControls' not in p:
  n=unit([sum(r['normal'][j] for use in p['boundaryUses'] for r in curves[use['curveID']]['samples']) for j in range(3)])
  amount={'AH01':3,'AH02':2,'AH03':5,'AH04':2,'AH05':-2,'AH09':-3,'AB03':10,'AB04':8,'AB05':3,'AB06':3,'AB10':0,'AH10':0,'AB02':0}.get(typ,1)
  w={p['boneNames'][0]:1}
  p['interiorControls']=[{'positionMm':add(lerp(center,pts[k],.2 if k else 0),mul(n,amount)),'boneWeights':w,'sourceFeature':feature.get(typ,'solid interior / empty seats')} for k in [0,len(pts)//3,2*len(pts)//3]]
 p.setdefault('surfaceRegistration',{'family':'open bounded patch' if typ!='AH10' else 'uncapped sleeve','boundaryInterpolation':'canonical Hermite boundary curves; constrained minimum thin-plate energy with listed interior controls; each boundary connected component is a prescribed boundary, no independent edge shrink','surfaceThicknessMm':0 if typ.startswith('AH') else 3,'controlMeaning':'author geometric support; no polygon/triangle creation','internalCap':False})
 # Each placement receives a unique atlas rectangle; UV duplicated at geometric joins.
 col=ix%10;row=ix//10;rect=[(col+.04)/10,(row+.04)/9,(col+.96)/10,(row+.96)/9]
 extents=[max(v[j] for v in pts)-min(v[j] for v in pts) for j in range(3)];axes=sorted(range(3),key=lambda j:extents[j],reverse=True)[:2];mins=[min(v[j] for v in pts) for j in range(3)]
 p['uvChart']={'id':'UV.'+pid,'rect01':rect,'projectedFrameAxes':axes,'seamPolicy':'separate UV samples permitted; canonical geometry/normal/weights never duplicated independently','textureSource':'future authored material, no complete-character image projection'}
 for use in p['boundaryUses']:
  use['uvSamples']=[[rect[0]+(rect[2]-rect[0])*(r['positionMm'][axes[0]]-mins[axes[0]])/max(extents[axes[0]],1e-9),rect[1]+(rect[3]-rect[1])*(r['positionMm'][axes[1]]-mins[axes[1]])/max(extents[axes[1]],1e-9)] for r in curves[use['curveID']]['samples']]
 # Proper actor-bind coordinate transform; no negative-scale mirror transform.
 offset=[(-313 if si==0 else 313),805,0] if typ.startswith('AH') else [(-133 if si==0 else 133),105,0]
 p['frameToActorBindMatrixMm']=matrix(offset)
 p['placementStatus']='numerical author registration, not new surface or posed acceptance'

# Bind points and retained right-hand target are explicit; finger collision is still open.
grip={'policy':old['attachmentPolicy'],'staffProposal':old['staffProposal'],'rightHandProposal':old['rightHandProposal'],'armDesigns':old['designs'],'fingerBonePoints':[],'rightHandHolding':True,'contactAccepted':False,'noNewBones':True,'unresolved':['G01 actual per-digit curl/skin-vs-staff triangle contact','G02 actual inherited hand shear versus rigid actor-root staff adapter','G03 posed wrist cloth clearance','G04 standing terrain support lifecycle']}
ideal=old['designs'][0]['handActorMatrix']
for side,si in [('R',0),('L',1)]:
 for digit in ['index','middle','ring','little','thumb']:
  p=instances[f'{side}-{digit}-proximal']['sourcePlacement'];b=bones[f'finger-{si}-{p["old_chain"]}'];bt=bones[f'finger-tip-{si}-{p["old_chain"]}'];rp=b['positionMm'];tp=add(rp,rot(bt['positionMm'],b['quaternion']))
  grip['fingerBonePoints'].append({'side':side,'digit':digit,'rootBone':b['name'],'tipBone':bt['name'],'rootHandBindMm':rp,'tipPivotHandBindMm':tp,'rootBindQuaternion':b['quaternion'],'tipBindQuaternion':bt['quaternion'],'targetRootActorMm':mul(xform(mul(rp,.001),ideal),1000) if side=='R' else add(rp,[313,805,0]),'targetTipPivotActorMm':mul(xform(mul(tp,.001),ideal),1000) if side=='R' else add(tp,[313,805,0]),'targetMeaning':'uncurled bind digit transported by ideal right-hand frame; not a solved gripping pose' if side=='R' else 'left relaxed existing local bind; no mirrored right grip'})
inputs=[]
for rel in sorted(set(p['sourceImage'] for p in instances.values())|{'docs/evidence/mira-reference-set-v64/hand-staff-registration/AUTHOR_REGISTRATION.json','docs/evidence/mira-reference-set-v64/hand-staff-registration/RIG_MEASUREMENTS.json','docs/evidence/mira-reference-set-v64/accessory-reference-set/TYPE_REFERENCE_COVERAGE.json'}):
 raw=(ROOT/rel).read_bytes();inputs.append({'path':rel,'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()})
data={'schema':'mira-accessory-author-registration-v65','baseCommit':'bc761f25aae76209d26623b509f97e1f3a5a12ca','status':'all 90 author numerical placement contracts reconstructed; mesh/pose/global acceptance not asserted','provenance':{'reconstructedFrom':'saved v64 original images, native bind measurements and numerical hand-staff proposal','unrecoveredOldResult':'134 curves /160 joins not present in recovered Git or Library; no old success reused','actor':'/root/ultra_q_recover_reference_assembly/accessory_registration_v65','ultra':'spawn requested ultra; accepted child task; backend effective strength not exposed','independentSpawnAttempt':'ultra/fork none/model omitted; rejected agent thread limit; no child work counted'},'frames':{'unit':'mm','actor':'R anatomical -X, L +X, Y up,Z front','hand':'-Y distal,+Z dorsal; R radial+X/L radial-X; native thumb bind quaternion retained','foot':'Y up,Z toe,inner toward actor X0','matrices':'column-major, translations mm unless explicitly stored in old armDesigns matrices (metres)'},'boneCount':41,'bindBones':rig['bind'],'instances':list(instances.values()),'curves':list(curves.values()),'joins':joins,'junctions':junctions,'nailSeats':nailSeats,'strapRoutes':routes,'externalPorts':ports,'grip':grip,'inputs':inputs,'constraints':{'handTypes':10,'handPlacements':56,'bootTypes':11,'bootPlacements':34,'newMesh':0,'runtimeEdits':0,'remoteMutations':0,'supportPlaneFootYmm':-108,'soleMm':8,'heelMm':12,'rearEnvelopeMm':20,'provisional22mmAdopted':False,'PS4FullFrameAccepted':False,'fixedTenWorksComparisonAccepted':False,'deadline':'2026-09-20'},'remainingAcceptance':['All-person registration integration and independent review','Construct native surfaces only after all-person image/assembly gate','G01 per-digit actual triangle grip contact','Posed clearance, native material/render/device/performance and fixed ten-work comparison']}
OUT.mkdir(parents=True,exist_ok=True)
def save(name,value):(OUT/name).write_text(json.dumps(rounded(value),ensure_ascii=False,indent=2)+'\n')
save('ACCESSORY_REGISTRATION.json',data)
external=copy.deepcopy(ports)
for p in external:p['orderedSamples']=curves[p['curveID']]['samples']
save('EXTERNAL_PORTS.json',{'schema':1,'source':'ACCESSORY_REGISTRATION.json','ports':external})
save('INPUT_HASHES.json',inputs)
print(json.dumps({'instances':len(instances),'curves':len(curves),'joins':len(joins),'ports':len(ports),'newMesh':0}))
