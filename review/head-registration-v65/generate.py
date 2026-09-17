#!/usr/bin/env python3
"""Author registration only: curves, trim loops and constraints; never triangulates."""
import json, math, hashlib, pathlib, datetime, sys, subprocess, collections
ROOT=pathlib.Path(__file__).resolve().parents[2]
OUT=ROOT/'docs/evidence/mira-assembly-v65/head-registration'
V1=ROOT/'docs/evidence/mira-reference-set-v64/head-assembly-registration'
REF=ROOT/'docs/evidence/mira-reference-set-v64/head-reference-set'
N={}; C={}; P={}; pair_index={}; native_map={}
def add(a,b):return [a[i]+b[i] for i in range(3)]
def sub(a,b):return [a[i]-b[i] for i in range(3)]
def mul(a,s):return [x*s for x in a]
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def cross(a,b):return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]
def unit(a):return mul(a,1/math.sqrt(dot(a,a)))
def lerp(a,b,t):return add(mul(a,1-t),mul(b,t))
def bez(cp,t):
 return [sum(cp[j][i]*[(1-t)**3,3*t*(1-t)**2,3*t*t*(1-t),t**3][j] for j in range(4)) for i in range(3)]
def split(cp,t):
 q=[lerp(cp[i],cp[i+1],t) for i in range(3)];r=[lerp(q[i],q[i+1],t) for i in range(2)];s=lerp(r[0],r[1],t)
 return [cp[0],q[0],r[0],s],[s,r[1],q[2],cp[3]]
def segment(cp,a,b):
 if b<1:cp=split(cp,b)[0]
 return split(cp,a/b)[1] if a else cp

def node(n,p):
 if n in N:assert max(abs(a-b) for a,b in zip(N[n],p))<1e-12,n
 N[n]=p;return n

def curve(a,b,cp=None,tag='',provenance='authored-v65',definition=None):
 key=tuple(sorted([a,b]))+(tag,)
 if key in pair_index:return pair_index[key]
 cid='HC%03d'%(len(C)+1)
 if cp is None:cp=[N[a],lerp(N[a],N[b],1/3),lerp(N[a],N[b],2/3),N[b]]
 C[cid]={'id':cid,'endpointIds':[a,b],'kind':'cubic-bezier' if definition is None else definition['kind'],'controlPointsM':cp if definition is None else None,'definition':definition,'provenance':provenance,'owners':[],'contactReceivers':[]}
 pair_index[key]=cid;return cid

def edge(a,b,tag=''):
 cid=curve(a,b,tag=tag);return {'curveId':cid,'direction':1 if C[cid]['endpointIds']==[a,b] else -1,'parameterRange':[0,1]}
def face(pid,nodes,typ=None,kind='skin',normal=None,guide=None):
 es=[edge(a,b) for a,b in zip(nodes,nodes[1:]+nodes[:1])]
 P[pid]={'id':pid,'type':typ or pid.split('-')[0],'layer':kind,'frame':'HEAD_LOCAL_M','boundaryLoops':[es],'interiorGuideM':guide,'surfacePolicy':'bounded smooth single patch; boundary interpolation mandatory; no mesh generated','normalHint':normal or [0,0,1],'weightPolicy':'head:1','uvChart':{'id':'chart:'+pid,'kind':'per-part local chart','range':[[0,0],[1,1]],'atlasAssigned':False},'boundaryWinding':'ordered loop; final normal follows normalHint; mirror reverses winding'}
 return P[pid]

old=json.loads((V1/'existing-boundaries.json').read_text())
oldby={r['id']:r for r in old}
# Native semantic stations, normalized top to bottom on both sides. Control points stay exact.
for side,sign in [('R',-1),('L',1)]:
 def nn(s):return s+'-'+side
 src=oldby['F05-'+side]
 cp=src['edges']['v0' if side=='R' else 'v1']
 node(nn('J0'),cp[0]);node(nn('O0'),cp[-1])
 for j,part in [(1,'F05'),(2,'F07'),(3,'F09')]:
  cp=oldby[part+'-'+side]['edges']['v1' if side=='R' else 'v0']
  node(nn('J'+str(j)),cp[0]);node(nn('O'+str(j)),cp[-1])
 for part,ed,a,b,mids in [('F05','v0' if side=='R' else 'v1','J0','O0',[(.72,'Q')]),('F05','u0','J0','J1',[(.25,'D')]),('F05','u1','O0','O1',[]),('F05','v1' if side=='R' else 'v0','J1','O1',[]),('F07','u0','J1','J2',[(.60,'E')]),('F07','u1','O1','O2',[]),('F07','v1' if side=='R' else 'v0','J2','O2',[]),('F09','u0','J2','J3',[]),('F09','u1','O2','O3',[]),('F09','v1' if side=='R' else 'v0','J3','O3',[])]:
  cp=oldby[part+'-'+side]['edges'][ed]
  rev=(ed in ['u0','u1'] and side=='L')
  if rev:cp=list(reversed(cp))
  vals=[(0,a)]+mids+[(1,b)]
  for t,n in mids:node(nn(n),bez(cp,t))
  for (ta,na),(tb,nb) in zip(vals,vals[1:]):
   cid=curve(nn(na),nn(nb),segment(cp,ta,tb),provenance='exact-v63-source-subcurve')
   C[cid]['nativeConstraint']={'instance':part+'-'+side,'edge':ed,'sourceRange':[1-tb,1-ta] if rev else [ta,tb],'reversed':rev}
 for pid,loop in [('F05',['J0','Q','O0','O1','J1','D']),('F07',['J1','O1','O2','J2','E']),('F09',['J2','O2','O3','J3'])]:
  face(pid+'-'+side,[nn(x) for x in loop],normal=[sign*.45,0,.9])['surfacePolicy']='retain exact v63 bicubic net; split trim references only'
# Chin top and under edge.
for ed,a,b in [('u0','J3-R','J3-L'),('u1','O3-R','O3-L')]:
 cid=curve(a,b,oldby['F11']['edges'][ed],provenance='exact-v63-source')
 C[cid]['nativeConstraint']={'instance':'F11','edge':ed,'sourceRange':[0,1],'reversed':False}
face('F11',['J3-R','O3-R','O3-L','J3-L'])['surfacePolicy']='retain exact v63 bicubic net'
node('FOREHEAD-M',[0,.145,.085]);node('BROW-M',[0,.083,.113])
# Face landmark selection; generated pixels are only qualitative shape references.
landmarks={'FH':(.087,.130,.056),'BT':(.078,.071,.095),'BI':(.023,.073,.116),'BU':(.018,.059,.125),'BL':(.019,.017,.134),'OC':(.073,.050,.105),'LO':(.065,.035,.114),'LM':(.033,.035,.118),'CU':(.026,.056,.119),'CL':(.026,.043,.118),'NT':(.014,.002,.146),'NL':(.011,-.001,.149),'NM':(.011,-.006,.141),'NA':(.024,.003,.135),'NB':(.020,-.005,.130),'PH':(.020,-.020,.131),'MU':(.030,-.020,.126),'MC':(.029,-.026,.132),'TF':(.108,.096,.016),'EFU':(.108,.038,.017),'EFM':(.109,.004,.025),'EFL':(.109,-.029,.026),'EFLW':(.101,-.057,.026),'EBU':(.108,.045,-.016),'EBL':(.103,-.055,-.020),'SB':(.076,-.075,-.071),'SCF':(.075,.170,.017),'SCB':(.075,.148,-.070)}
eyes={}
for side,sign in [('L',1),('R',-1)]:
 for n,p in landmarks.items():node(n+'-'+side,[p[0]*sign,p[1],p[2]])
 center=[sign*.046,.050,.099];radius=.0195
 def eye_point(x,y):return [sign*x,y,center[2]+math.sqrt(radius**2-(x-.046)**2-(y-.050)**2)+.00035]
 for n,x,y in [('EIU',.029,.051),('EIL',.029,.049),('EO',.064,.050)]:node(n+'-'+side,eye_point(x,y))
 def ns(ss):return [x if x.endswith('-M') else x+'-'+side for x in ss]
 loops={'F01':['BROW-M','BI','BT','FH','FOREHEAD-M'],'F03':['Q','O0','EFU','EBU','TF','FH','BT','OC'],'E03':['BI','BT','OC','EO','EIU','CU','BU'],'E04':['OC','LO','LM','CL','EIL','EO'],'E05':['BU','CU','EIU','EIL','CL','BL'],'F18':['D','J0','Q','OC','LO','LM','CL','BL'],'F19':['BL','D','J1','E','MU','PH','NB','NA'],'F14':['BL','NA','NB','NM','NL','NT'],'F20':['MU','E','J2','J3','MC'],'F21':['O0','O1','O2','EFLW','EFL','EFM','EFU']}
 for name,loop in loops.items():face(name+'-'+side,ns(loop),normal=[sign*.1,0,1],guide=None)
 # Projected Bezier XY paths keep the lid's contact rim exactly on an offset sphere.
 for a,b,cxy in [('EIU','EO',[[sign*.029,.051],[sign*.037,.060],[sign*.057,.060],[sign*.064,.050]]),('EO','EIL',[[sign*.064,.050],[sign*.057,.043],[sign*.037,.042],[sign*.029,.049]]),('EIL','EIU',[[sign*.029,.049],[sign*.0275,.0495],[sign*.0275,.0505],[sign*.029,.051]])]:
  cid=pair_index[tuple(sorted([a+'-'+side,b+'-'+side]))+('',)]
  orig=C[cid]['endpointIds'];reverse=orig!=[a+'-'+side,b+'-'+side]
  C[cid].update(kind='sphere-projected-bezier-xy',controlPointsM=None,definition={'kind':'sphere-projected-bezier-xy','xyControls':list(reversed(cxy)) if reverse else cxy,'centerM':center,'radiusM':radius,'radialFrontOffsetM':.00035},contactReceivers=['E01-'+side])
  C[cid]['joinPolicy']='sliding contact, never weld to eyeball'
 eyes[side]={'centerM':center,'radiusM':radius,'irisRadiusM':.007,'irisBaseZ':center[2]+math.sqrt(radius**2-.007**2),'cornealApexZ':.121,'lidFrontZClearanceM':.00035,'oldFlattenedEyeAdopted':False,'blinkPolicy':'new common upper/lower rim target at y=.050 on same sphere; skin fold deformation must replace old translating lid before runtime adoption'}
 # Optical seat is one analytic ring reused by eye body and cap.
 seat='OPTIC-'+side;node(seat,[center[0]+.007,.05,eyes[side]['irisBaseZ']])
 cid=curve(seat,seat,tag='ring',definition={'kind':'circle','centerM':[center[0],.05,eyes[side]['irisBaseZ']],'radiusM':.007,'axisU':[1,0,0],'axisV':[0,1,0]})
 for name in ['E01','E02']:
  P[name+'-'+side]={'id':name+'-'+side,'type':name,'layer':'ocular','frame':'HEAD_LOCAL_M','boundaryLoops':[[{'curveId':cid,'direction':1 if name=='E01' else -1,'parameterRange':[0,1]}]],'surfacePolicy':'sphere minus anterior cap' if name=='E01' else 'iris/cornea cap; seat continuous, optical normal break intentional','analyticDefinition':eyes[side],'normalHint':[0,0,1],'weightPolicy':'head:1; eyeball gaze local transform shared by E01/E02','uvChart':{'id':'ocular:'+side,'kind':'longitude/latitude for E01, polar disk for E02','range':[[0,0],[1,1]],'atlasAssigned':False}}
 # Brow has four small perimeter sides with offset chart placement, no skin weld.
 brow=[]
 for q,(x,y,z) in enumerate([(.026,.073,.118),(.075,.072,.099),(.074,.076,.100),(.026,.078,.117)]):brow.append(node('BR%d-%s'%(q,side),[sign*x,y,z]))
 face('B01-'+side,brow,kind='brow',guide=[sign*.050,.078,.116])['support']={'owners':['F01-'+side,'E03-'+side,'F03-'+side],'normalOffsetM':.0004,'kind':'overlay','weight':'head:1'}
# Median polygons, aligned with side-face boundaries.
face('F12',['BROW-M','BI-L','BU-L','BL-L','NT-L','NT-R','BL-R','BU-R','BI-R'],guide=[0,.029,.140])
face('F13',['NT-R','NT-L','NL-L','NL-R'],guide=[0,.003,.155])
face('F15',['NL-R','NL-L','NM-L','NB-L','NB-R','NM-R'],normal=[0,-.7,.7],guide=[0,-.006,.142])
face('F16b',['NB-R','NB-L','PH-L','PH-R'],guide=[0,-.011,.133])
face('F16a',['PH-R','PH-L','MU-L','MC-L','MC-R','MU-R'],guide=[0,-.023,.137])
face('F17',['MC-R','MC-L','J3-L','J3-R'],guide=[0,-.036,.138])
mouthcid=pair_index[tuple(sorted(['MC-R','MC-L']))+('',)]
C[mouthcid]['controlPointsM']=[N['MC-L'],[.012,-.027,.135],[-.012,-.027,.135],N['MC-R']] if C[mouthcid]['endpointIds'][0]=='MC-L' else [N['MC-R'],[-.012,-.027,.135],[.012,-.027,.135],N['MC-L']]
C[mouthcid]['joinPolicy']='closed rest contact; independent upper/lower deformation references same rest curve; never a permanent weld'
# Ear: open rolled helix, inner fork/scapha, concha, tragus, lobe, posterior/root.
for side,sgn in [('L',1),('R',-1)]:
 ns=lambda seq:[x+'-'+side for x in seq]
 ear={'H0':(.115,.033,.018),'H1':(.130,.042,-.002),'H2':(.133,.009,-.021),'H3':(.120,-.038,-.009),'R0':(.111,.034,.012),'R1':(.123,.039,-.009),'R2':(.127,.006,-.027),'R3':(.115,-.040,-.015),'LB':(.111,-.053,-.012),'CT':(.120,.023,.018),'CB':(.127,.005,.005),'CD':(.120,-.030,.008),'TT':(.112,.011,.026),'TD':(.112,-.026,.022)}
 for n,p in ear.items():node(n+'-'+side,[sgn*p[0],p[1],p[2]])
 loops={'A01a':['H0','H1','H2','H3','R3','R2','R1','R0'],'A01b':['H0','H1','H2','H3','CD','CB','CT'],'A02a':['H0','CT','CB','CD','TD','TT'],'A02b':['TT','TD','EFL','EFM'],'A03':['H3','CD','TD','EFL','EFLW','LB','R3'],'A04':['EFU','EBU','EBL','EFLW','LB','R3','R2','R1','R0','H0','TT','EFM']}
 for name,loop in loops.items():face(name+'-'+side,ns(loop),normal=[sgn,0,.15])
 P['A01a-'+side]['section']={'kind':'open U only','innerTrim':[edge(*ns([a,b])) for a,b in [('H0','H1'),('H1','H2'),('H2','H3')]],'rearTrim':[edge(*ns([a,b])) for a,b in [('R0','R1'),('R1','R2'),('R2','R3')]],'outwardBulgeM':.004,'sectionRule':'(1-v)*inner(u)+v*rear(u)+sin(pi*v)*[signed .004,0,0]','caps':False,'foldNormals':'computed from section and longitudinal partials; no round tube'}
 P['A01b-'+side]['ridgeGuidesM']=[[sgn*.123,-.028,.008],[sgn*.129,.006,.010],[sgn*.124,.025,.020],[sgn*.132,.030,-.003]]
 P['A02a-'+side]['interiorGuideM']=[sgn*.107,-.007,.006]
 P['A02a-'+side]['recess']={'depthFromRimM':.012,'terminusM':[sgn*.104,-.007,.005],'closedBlindBowl':True,'deepAuditoryCanalIncluded':False}
 P['A02b-'+side]['interiorGuideM']=[sgn*.122,-.007,.032]
 P['A03-'+side]['interiorGuideM']=[sgn*.119,-.049,.006]
# Five scalp instances meet by explicit shared trims; dome comes from authored guides.
face('S01',['FOREHEAD-M','FH-L','TF-L','SCF-L','SCF-R','TF-R','FH-R'],guide=[0,.170,.064],normal=[0,.8,.6])
face('S02',['SCF-L','SCB-L','SCB-R','SCF-R'],guide=[0,.190,-.016],normal=[0,1,0])
face('S05',['SCB-L','SB-L','SB-R','SCB-R'],guide=[0,.047,-.104],normal=[0,.1,-1])
for side,sgn,pid in [('L',1,'S03'),('R',-1,'S04')]:
 face(pid,[x+'-'+side for x in ['TF','EBU','EBL','SB','SCB','SCF']],typ='S-SIDE',guide=[sgn*.117,.072,-.039],normal=[sgn,.1,-.2])
# One front half and one back half, with an explicit shared side seam.
for side,sgn in [('L',1),('R',-1)]:node('CUT-'+side,[sgn*.106,-.280,0])
node('CUT-F',[0,-.280,.086]);node('CUT-B',[0,-.280,-.086])
face('N01',['O2-R','O3-R','O3-L','O2-L','EFLW-L','CUT-L','CUT-F','CUT-R','EFLW-R'],guide=[0,-.15,.076],normal=[0,0,1])
face('N02',['EFLW-L','EBL-L','SB-L','SB-R','EBL-R','EFLW-R','CUT-R','CUT-B','CUT-L'],guide=[0,-.15,-.076],normal=[0,0,-1])
for pid in ['N01','N02']:
 P[pid]['weightPolicy']='linear head/neck weights by section: upper contour head1; HEAD y=-.100 head .35 neck .65; y=-.200 neck1; y=-.280 chest1'
 P[pid]['sectionDefinition']={'frame':'HEAD_LOCAL_M','angleConvention':'x=rx*sin(theta),z=rz*cos(theta); front theta[-pi/2,pi/2]','lowerSections':[{'y':-.280,'rx':.106,'rz':.086},{'y':-.200,'rx':.094,'rz':.076},{'y':-.100,'rx':.078,'rz':.076}],'betweenSections':'collar -.200..-.100 exact linear radius; lower -.280..-.200 cubic Hermite radii with drx/dy bottom=-.15/top=-.16 and drz/dy bottom=-.125/top=0','upperTransition':'canonical-curve-constrained cubic Hermite loft; upper normals and both side curves fixed; exact derivative into collar zone at ring y=-.100','clothWeld':False}
# Lower cut uses exact quarter ellipses, not straight chord approximations.
for a,b,t0,t1 in [('CUT-R','CUT-F',-math.pi/2,0),('CUT-F','CUT-L',0,math.pi/2),('CUT-L','CUT-B',math.pi/2,math.pi),('CUT-B','CUT-R',math.pi,3*math.pi/2)]:
 cid=pair_index[tuple(sorted([a,b]))+('',)];rev=C[cid]['endpointIds']!=[a,b]
 C[cid].update(kind='ellipse-arc',controlPointsM=None,definition={'kind':'ellipse-arc','y':-.280,'rx':.106,'rz':.086,'thetaRange':[t1,t0] if rev else [t0,t1]})
 C[cid]['externalPort']='HIDDEN_NECK_FREE_CUT';C[cid]['joinPolicy']='intentional free skin cut wholly inside T01/T02/T04 garment envelope; no torso receiver or cap'
# Side neck curve must use the same registered section law, including exact cut endpoints.
for side,sgn in [('L',1),('R',-1)]:
 cid=pair_index[tuple(sorted(['EFLW-'+side,'CUT-'+side]))+('',)]
 controls=[N['EFLW-'+side],[sgn*.078,-.100,0],[sgn*.094,-.200,0],N['CUT-'+side]]
 if C[cid]['endpointIds'][0]=='CUT-'+side:controls=list(reversed(controls))
 C[cid].update(kind='piecewise-linear',controlPointsM=None,definition={'kind':'piecewise-linear','pointsM':controls,'breaks':[0,.3,.65,1] if C[cid]['endpointIds'][0]!='CUT-'+side else [0,.35,.7,1]})
# Orient skin loops consistently before owner registration; no topology is tessellated.
adj=collections.defaultdict(list)
refs=collections.defaultdict(list)
for pid,p in P.items():
 if p['layer']=='skin':
  for e in p['boundaryLoops'][0]:refs[e['curveId']].append((pid,e['direction']))
for cid,rr in refs.items():
 if len(rr)==2:
  (a,da),(b,db)=rr;adj[a].append((b,-da*db));adj[b].append((a,-da*db))
orient={}
for seed in adj:
 if seed in orient:continue
 orient[seed]=1;queue=[seed]
 for a in queue:
  for b,m in adj[a]:
   if b in orient:assert orient[b]==orient[a]*m,('nonorientable',a,b)
   else:orient[b]=orient[a]*m;queue.append(b)
for pid,sgn in orient.items():
 if sgn<0:
  for loop in P[pid]['boundaryLoops']:
   loop.reverse()
   for e in loop:e['direction']*=-1
 P[pid]['orientationSign']=sgn
# Hair roots are barycentric placements on an authored support chart, not image measurements.
# Each support has an explicit curved disk recipe whose trim is the registered scalp boundary.
# Interior chart samples are author anchors; support exactness is defined by this chart, not a fitted mesh.
charts={
 'S01':{'origin':[0,.154,.050],'u':[.088,0,0],'v':[0,.026,-.040],'bulge':[0,.020,.015]},
 'S02':{'origin':[0,.180,-.020],'u':[.075,0,0],'v':[0,-.013,-.056],'bulge':[0,.010,0]},
 'S03':{'origin':[.110,.075,-.030],'u':[0,0,-.055],'v':[0,-.055,0],'bulge':[.009,0,0]},
 'S04':{'origin':[-.110,.075,-.030],'u':[0,0,.055],'v':[0,-.055,0],'bulge':[-.009,0,0]},
 'S05':{'origin':[0,.030,-.096],'u':[.070,0,0],'v':[0,-.065,0],'bulge':[0,0,-.007]}}
def chart_eval(pid,u,v):
 ch=charts[pid];x=2*u-1;y=2*v-1
 p=add(add(ch['origin'],mul(ch['u'],x)),mul(ch['v'],y));p=add(p,mul(ch['bulge'],(1-x*x)*(1-y*y)))
 du=add(mul(ch['u'],2),mul(ch['bulge'],-4*x*(1-y*y)));dv=add(mul(ch['v'],2),mul(ch['bulge'],-4*y*(1-x*x)))
 n=unit(cross(du,dv));hint=P[pid]['normalHint']
 if dot(n,hint)<0:n=mul(n,-1)
 return p,n,unit(du)
roots=[('H01','S01',.70,.20,[-.083,.144,.082]),('H02','S01',.72,.35,[-.071,.157,.068]),('H03','S01',.73,.50,[-.070,.165,.045]),('H04','S01',.80,.68,[-.041,.170,.020]),('H05','S02',.73,.25,[-.044,.178,.010]),('H06','S02',.78,.42,[-.025,.174,-.015]),('H07','S02',.62,.62,[-.035,.164,-.063]),('H08','S02',.75,.70,[.025,.155,-.079]),('H09','S01',.43,.08,[-.081,.126,.084]),('H10','S01',.54,.12,[-.042,.135,.100]),('H11','S03',.30,.25,[.113,.055,.014]),('H12','S03',.52,.40,[.116,.030,-.020]),('H13','S03',.18,.72,[.107,.022,.032]),('H14','S04',.70,.25,[-.116,.055,.016]),('H15','S04',.48,.40,[-.115,.025,-.019]),('H16','S04',.82,.72,[-.107,.021,.033]),('H17','S02',.72,.85,[.052,.083,-.108]),('H18','S02',.28,.85,[-.046,.079,-.110]),('H19','S05',.70,.23,[.042,-.017,-.099]),('H20','S05',.30,.23,[-.047,-.018,-.100]),('H21','S05',.84,.64,[.069,-.083,-.071]),('H22','S05',.63,.67,[.023,-.088,-.082]),('H23','S05',.37,.67,[-.023,-.087,-.083]),('H24','S05',.16,.64,[-.069,-.082,-.072])]
types={x['id']:x['type'] for x in json.loads((V1/'instances.json').read_text())['instances']}
hair=[]
settings={'HT01':(.015,.0055,.028),'HT02':(.016,.004,.013),'HT03':(.013,.003,.007),'HT04':(.008,.002,.004),'HT05':(.014,.0035,.012),'HT06':(.010,.0025,.007)}
for hid,sid,u,v,tip in roots:
 pos,n,tx=chart_eval(sid,u,v);typ=types[hid];width,depth,lift=settings[typ];clearance=.0006
 anchor=add(pos,mul(n,clearance));d=sub(tip,anchor);t=unit(sub(d,mul(n,dot(d,n))));b=unit(cross(n,t))
 cp=[anchor,add(add(anchor,mul(d,.30)),mul(n,lift)),add(add(anchor,mul(d,.75)),mul(n,lift*.35)),tip]
 a=node(hid+'-ROOT',anchor);z=node(hid+'-TIP',tip);cid=curve(a,z,cp,tag='hair-spine')
 C[cid]['owners']=[{'instance':hid,'role':'centerline'}];C[cid]['contactReceivers']=[sid]
 P[hid]={'id':hid,'type':typ,'layer':'hair','frame':'HEAD_LOCAL_M','boundaryLoops':[],'spineCurveId':cid,'normalHint':n,'weightPolicy':'head:1','uvChart':{'id':'hair:'+typ,'kind':'u cross strip [0,1],v root to tip [0,1]','atlasAssigned':False},'section':{'widthM':width,'depthM':depth,'widthProfile':[[0,1],[.35,1],[.75,.55],[1,0]],'depthProfile':[[0,1],[.5,.8],[1,0]],'axisWidth':b,'axisDepth':n,'rootTangent':t,'closedTube':False,'tipPolicy':'single taper','leftRightCurves':'derived from canonical spine and section, never independently authored'},'rootId':'ROOT-'+hid}
 hair.append({'id':'ROOT-'+hid,'instance':hid,'support':sid,'supportChartUV':[u,v],'supportPositionM':pos,'positionM':anchor,'normal':n,'tangent':t,'binormal':b,'clearanceM':clearance,'rootMatrixRowMajor':[b[0],t[0],n[0],anchor[0],b[1],t[1],n[1],anchor[1],b[2],t[2],n[2],anchor[2],0,0,0,1],'skinWeights':{'head':1},'spineCurveId':cid})
for sid,ch in charts.items():P[sid]['rootSupportChart']={'definition':'origin+uAxis*(2u-1)+vAxis*(2v-1)+bulge*(1-(2u-1)^2)*(1-(2v-1)^2)','parameters':ch,'domain':[0,1],'status':'author root support subchart, trim reconciliation required in surface construction','weight':{'head':1}}
# Hair perimeter is derived from its ONE spine and ONE section specification.
for root in hair:
 hid=root['instance'];p=P[hid];sec=p['section'];a=root['positionM'];b=sec['axisWidth'];w=sec['widthM'];nl=node(hid+'-ROOT-L',[a[k]-.5*w*b[k] for k in range(3)]);nr=node(hid+'-ROOT-R',[a[k]+.5*w*b[k] for k in range(3)]);tip=hid+'-TIP'
 left=curve(nl,tip,tag='hair-left',definition={'kind':'hair-side','instance':hid,'spineCurveId':p['spineCurveId'],'u':0})
 right=curve(nr,tip,tag='hair-right',definition={'kind':'hair-side','instance':hid,'spineCurveId':p['spineCurveId'],'u':1})
 base=curve(nl,nr,tag='hair-root',definition={'kind':'hair-root','instance':hid,'spineCurveId':p['spineCurveId']})
 for cid in [left,right,base]:C[cid]['joinPolicy']='free hair-strip edge; root supported on scalp, no skin weld'
 C[base]['contactReceivers']=[root['support']]
 p['boundaryLoops']=[[{'curveId':left,'direction':1,'parameterRange':[0,1]},{'curveId':right,'direction':-1,'parameterRange':[0,1]},{'curveId':base,'direction':-1,'parameterRange':[0,1]}]]
 p['surfaceRecipe']={'kind':'canonical-spine-section','formula':'spine(v)+(u-.5)*width*widthProfile(v)*axisWidth + 4u(1-u)*depth*depthProfile(v)*axisDepth','parameters':{'u':[0,1],'v':[0,1]},'source':p['spineCurveId'],'tip':'collapsed by width/depth profile at v=1; no independent tip copy'}
# Attach owners by references. No independently copied curve is kept on a part.
for pid,p in P.items():
 for li,loop in enumerate(p['boundaryLoops']):
  for ei,e in enumerate(loop):C[e['curveId']]['owners'].append({'instance':pid,'loop':li,'edge':ei,'direction':e['direction'],'role':'trim'})
# Curvature guides are local author-design requirements, not sampled geometry.
for pid,p in P.items():
 if p.get('interiorGuideM') is None and p['boundaryLoops']:
  pts=[N[C[e['curveId']]['endpointIds'][0]] for e in p['boundaryLoops'][0]]
  p['interiorGuideM']=[sum(q[k] for q in pts)/len(pts) for k in range(3)]
# Read exact bicubic control nets from the retained source without calling buildAssembly.
native_nets=json.loads(subprocess.check_output(['node','--input-type=module','-e',
 "import {PATCHES} from './review/head-micro-v63/surfaces.mjs'; process.stdout.write(JSON.stringify(PATCHES));"],cwd=ROOT,text=True))
native_nets={x['id']:x['net'] for x in native_nets}
def native_frame(pid,u,v):
 bs=lambda t:[(1-t)**3,3*t*(1-t)**2,3*t*t*(1-t),t**3]
 ds=lambda t:[-3*(1-t)**2,3*(1-t)*(1-3*t),3*t*(2-3*t),3*t*t]
 net=native_nets[pid];bu,bv,du,dv=bs(u),bs(v),ds(u),ds(v)
 A=[sum(net[j][i][k]*du[i]*bv[j] for j in range(4) for i in range(4)) for k in range(3)]
 B=[sum(net[j][i][k]*bu[i]*dv[j] for j in range(4) for i in range(4)) for k in range(3)]
 return unit(cross(A,B)),A,B
# Shared derivatives and UV/weight policy are single registry values evaluated along each source.
def evalcurve(c,t):
 if c['kind']=='cubic-bezier':return bez(c['controlPointsM'],t)
 d=c['definition'];kind=c['kind']
 if kind=='sphere-projected-bezier-xy':
  xy=[sum(d['xyControls'][j][i]*[(1-t)**3,3*t*(1-t)**2,3*t*t*(1-t),t**3][j] for j in range(4)) for i in range(2)];ct=d['centerM'];return xy+[ct[2]+math.sqrt(d['radiusM']**2-(xy[0]-ct[0])**2-(xy[1]-ct[1])**2)+d['radialFrontOffsetM']]
 if kind=='ellipse-arc':
  a=d['thetaRange'][0]*(1-t)+d['thetaRange'][1]*t;return [d['rx']*math.sin(a),d['y'],d['rz']*math.cos(a)]
 if kind=='circle':
  return add(d['centerM'],add(mul(d['axisU'],d['radiusM']*math.cos(t*math.tau)),mul(d['axisV'],d['radiusM']*math.sin(t*math.tau))))
 if kind in ['hair-side','hair-root']:
  p=P[d['instance']];sec=p['section'];v=t if kind=='hair-side' else 0;u=d.get('u',t);sp=evalcurve(C[d['spineCurveId']],v)
  def profile(points):
   j=next((j for j in range(len(points)-1) if v<=points[j+1][0]),len(points)-2);a,b=points[j:j+2];f=(v-a[0])/(b[0]-a[0]);return a[1]*(1-f)+b[1]*f
  return add(add(sp,mul(sec['axisWidth'],(u-.5)*sec['widthM']*profile(sec['widthProfile']))),mul(sec['axisDepth'],4*u*(1-u)*sec['depthM']*profile(sec['depthProfile'])))
 if kind=='piecewise-cubic':
  j=next((j for j in range(len(d['breaks'])-1) if t<=d['breaks'][j+1]),len(d['breaks'])-2);a,b=d['breaks'][j:j+2];return bez(d['segments'][j],(t-a)/(b-a))
 if kind=='piecewise-linear':
  j=next((j for j in range(len(d['breaks'])-1) if t<=d['breaks'][j+1]),len(d['breaks'])-2);a,b=d['breaks'][j:j+2];return lerp(d['pointsM'][j],d['pointsM'][j+1],(t-a)/(b-a))
 raise ValueError(kind)
def tangent(c,t):
 d=c['definition'];db=[-3*(1-t)**2,3*(1-t)*(1-3*t),3*t*(2-3*t),3*t*t]
 if c['kind']=='cubic-bezier':return unit([sum(db[j]*c['controlPointsM'][j][k] for j in range(4)) for k in range(3)])
 if c['kind']=='sphere-projected-bezier-xy':
  p=evalcurve(c,t);v=[sum(db[j]*d['xyControls'][j][k] for j in range(4)) for k in range(2)];ct=d['centerM'];z=p[2]-ct[2]-d['radialFrontOffsetM'];return unit(v+[-((p[0]-ct[0])*v[0]+(p[1]-ct[1])*v[1])/z])
 if c['kind']=='ellipse-arc':
  a,b=d['thetaRange'];q=a+(b-a)*t;return unit([(b-a)*d['rx']*math.cos(q),0,-(b-a)*d['rz']*math.sin(q)])
 if c['kind']=='circle':return unit(add(mul(d['axisU'],-math.sin(math.tau*t)),mul(d['axisV'],math.cos(math.tau*t))))
 if c['kind'] in ['hair-side','hair-root']:
  sec=P[d['instance']]['section']
  if c['kind']=='hair-root':return unit(add(mul(sec['axisWidth'],sec['widthM']),mul(sec['axisDepth'],4*(1-2*t)*sec['depthM'])))
  cp=C[d['spineCurveId']]['controlPointsM'];sv=[sum(db[j]*cp[j][k] for j in range(4)) for k in range(3)];pp=sec['widthProfile'];j=next((j for j in range(len(pp)-1) if t<=pp[j+1][0]),len(pp)-2);a,b=pp[j:j+2];wd=(b[1]-a[1])/(b[0]-a[0]);return unit(add(sv,mul(sec['axisWidth'],(d['u']-.5)*sec['widthM']*wd)))
 if c['kind']=='piecewise-cubic':
  j=next((j for j in range(len(d['breaks'])-1) if t<=d['breaks'][j+1]),len(d['breaks'])-2);a,b=d['breaks'][j:j+2];u=(t-a)/(b-a);ds=[-3*(1-u)**2,3*(1-u)*(1-3*u),3*u*(2-3*u),3*u*u];return unit([sum(ds[z]*d['segments'][j][z][k] for z in range(4)) for k in range(3)])
 if c['kind']=='piecewise-linear':
  j=next((j for j in range(len(d['breaks'])-1) if t<=d['breaks'][j+1]),len(d['breaks'])-2);return unit(sub(d['pointsM'][j+1],d['pointsM'][j]))
 raise ValueError(c['kind'])
def weight(y,owners):
 if not any(x['instance'] in ['N01','N02'] for x in owners):return {'head':1}
 if y>=-.100:
  # Only shared upper contour is fully head-owned; side seams blend above ring.
  side=any(x.get('role')=='trim' for x in owners) and {x['instance'] for x in owners}=={'N01','N02'}
  h=min(1,.35+.65*(y+.100)/.043) if side else 1
  return {'head':h,'neck':1-h} if h<1 else {'head':1}
 if y<=-.200:
  chest=min(1,max(0,(-.200-y)/.080));return {'neck':1-chest,'chest':chest}
 h=.35*(y+.200)/.100;return {'head':h,'neck':1-h}
# Smooth-skin node contracts are one tangent plane across ALL incident curves.
# Retained v63 partials have priority; authored endpoint controls are changed to fit,
# rather than averaging incompatible normals after shape construction.
skin_incidence=collections.defaultdict(list)
for cid,c in C.items():
 if any(P[o['instance']]['layer']=='skin' for o in c['owners']):
  for end,nid in enumerate(c['endpointIds']):skin_incidence[nid].append((cid,end))
node_contracts={};tangent_repairs=[]
for nid,inc in skin_incidence.items():
 fixed=[];kind='authored-smooth-skin'
 for cid,end in inc:
  c=C[cid]
  if 'nativeConstraint' in c:
   nc=c['nativeConstraint'];a,b=nc['sourceRange'];st=(b if end==0 else a) if nc['reversed'] else (a if end==0 else b);ed=nc['edge'];u,v=(float(ed[1]),st) if ed[0]=='u' else (st,float(ed[1]));fixed.append(native_frame(nc['instance'],u,v)[0]);kind='retained-v63-tangent-plane'
 if fixed:
  n=fixed[0];assert all(dot(n,q)>1-1e-10 for q in fixed),('conflicting-native-normal',nid)
 elif nid.startswith('CUT-'):
  q=N[nid];st=q[0]/.106;ct=q[2]/.086;n=unit([st/.106,.15/.106*st*st+.125/.086*ct*ct,ct/.086]);kind='exact-neck-loft-cut-normal'
 else:
  ocular=[C[cid] for cid,end in inc if C[cid]['kind']=='sphere-projected-bezier-xy']
  if ocular:
   d=ocular[0]['definition'];q=N[nid];n=unit([q[0]-d['centerM'][0],q[1]-d['centerM'][1],q[2]-d['centerM'][2]-d['radialFrontOffsetM']]);kind='eyelid-offset-sphere-normal'
  else:
   owners={o['instance'] for cid,end in inc for o in C[cid]['owners'] if P[o['instance']]['layer']=='skin'};vv=[sum(P[k]['normalHint'][j] for k in sorted(owners)) for j in range(3)]
   if dot(vv,vv)<1e-9:q=N[nid];vv=[q[0],0,q[2]]
   n=unit(vv)
 node_contracts[nid]={'normal':n,'policy':kind,'incidentCurveIds':[x[0] for x in inc],'layer':'skin','crease':False}
def projected_control(endpoint,control,normal,cid,nid):
 t=sub(control,endpoint);length=math.sqrt(dot(t,t));pt=sub(t,mul(normal,dot(t,normal)))
 if dot(pt,pt)<1e-15:
  axis=[1,0,0] if abs(normal[0])<.9 else [0,1,0];pt=cross(normal,axis)
 pt=mul(unit(pt),length);angle=math.degrees(math.acos(max(-1,min(1,dot(unit(t),unit(pt))))));tangent_repairs.append({'curveId':cid,'nodeId':nid,'angleDegrees':angle});return add(endpoint,pt)
for cid,c in C.items():
 if not any(nid in node_contracts for nid in c['endpointIds']):continue
 if c['kind']=='cubic-bezier' and 'nativeConstraint' not in c:
  for end,idx in [(0,1),(1,2)]:
   nid=c['endpointIds'][end]
   if nid in node_contracts:c['controlPointsM'][idx]=projected_control(c['controlPointsM'][0 if end==0 else 3],c['controlPointsM'][idx],node_contracts[nid]['normal'],cid,nid)
 elif c['kind']=='piecewise-linear':
  d=c['definition'];segments=[]
  for a,b in zip(d['pointsM'],d['pointsM'][1:]):segments.append([a,lerp(a,b,1/3),lerp(a,b,2/3),b])
  for end,seg,idx in [(0,0,1),(1,-1,2)]:
   nid=c['endpointIds'][end];segments[seg][idx]=projected_control(segments[seg][0 if end==0 else 3],segments[seg][idx],node_contracts[nid]['normal'],cid,nid)
  c.update(kind='piecewise-cubic',definition={'kind':'piecewise-cubic','segments':segments,'breaks':d['breaks'],'collarMiddleSegments':'retained exact linear ellipse sections; only upper terminal tangent changed'})
 if all(nid in node_contracts for nid in c['endpointIds']):c['skinNodeNormalIds']=c['endpointIds']
# Re-author the upper side interval as Hermite, and the lower hidden flare with
# analytic endpoint derivatives. Shared N01/N02 sides are the same curve source.
neck_side_curves={}
for side,sgn in [('L',1),('R',-1)]:
 cid=pair_index[tuple(sorted(['EFLW-'+side,'CUT-'+side]))+('',)];c=C[cid];top=N['EFLW-'+side];ring=[sgn*.078,-.100,0];mid=[sgn*.094,-.200,0];cut=N['CUT-'+side];delta=sub(ring,top);n=node_contracts['EFLW-'+side]['normal'];At=mul(unit(sub(delta,mul(n,dot(delta,n)))),math.sqrt(dot(delta,delta)));Ar=[sgn*(.016*.3/.35),-.100*.3/.35,0]
 upper=[top,add(top,mul(At,1/3)),sub(ring,mul(Ar,1/3)),ring]
 middle=[ring,lerp(ring,mid,1/3),lerp(ring,mid,2/3),mid]
 # dy/dv=-.08; dx/dy is -.16 at upper and -.15 at lower.
 lower=[mid,add(mid,[sgn*.0128/3,-.080/3,0]),sub(cut,[sgn*.012/3,-.080/3,0]),cut]
 segments=[upper,middle,lower];breaks=[0,.3,.65,1]
 if c['endpointIds'][0]=='CUT-'+side:segments=[list(reversed(cp)) for cp in reversed(segments)];breaks=[0,.35,.7,1]
 c.update(kind='piecewise-cubic',definition={'kind':'piecewise-cubic','segments':segments,'breaks':breaks,'source':'exact upper transition / collar line / lower hidden neck flare'});neck_side_curves[side]={'curveId':cid,'upperControlsM':upper,'topDerivativeM':At,'ringDerivativeM':Ar}
def skin_curve_normal(c,t):
 a,b=[node_contracts[nid]['normal'] for nid in c['skinNodeNormalIds']];n=lerp(a,b,t);tan=tangent(c,t);n=sub(n,mul(tan,dot(n,tan)))
 if dot(n,n)<1e-14:n=cross(tan,[0,1,0] if abs(tan[1])<.9 else [1,0,0])
 return unit(n)
for c in C.values():
 samples=[]
 for t in [0,.25,.5,.75,1]:
  q=evalcurve(c,t);tan=tangent(c,t)
  owners=c['owners'];ns=[P[o['instance']]['normalHint'] for o in owners if o['instance'] in P];hint=unit([sum(x[k] for x in ns) for k in range(3)]) if ns and math.sqrt(sum(sum(x[k] for x in ns)**2 for k in range(3)))>.001 else [0,0,1]
  normal=sub(hint,mul(tan,dot(hint,tan)))
  if dot(normal,normal)<1e-10:normal=cross(tan,[1,0,0] if abs(tan[0])<.9 else [0,1,0])
  normal=unit(normal)
  if 'nativeConstraint' in c:
   nc=c['nativeConstraint'];lo,hi=nc['sourceRange'];st=hi-(hi-lo)*t if nc['reversed'] else lo+(hi-lo)*t
   ed=nc['edge'];uu,vv=(float(ed[1]),st) if ed[0]=='u' else (st,float(ed[1]))
   normal,A,B=native_frame(nc['instance'],uu,vv)
  if 'skinNodeNormalIds' in c and 'nativeConstraint' not in c:normal=skin_curve_normal(c,t)
  ws=weight(q[1],owners)
  samples.append({'t':t,'positionM':q,'tangent':tan,'normal':normal,'crossTangent':unit(cross(normal,tan)),'skinWeights':ws})
 c['frameSamples']=samples;c['tangentPolicy']='derivative of canonical curve, owner traversal sign only';c['normalPolicy']='shared orthogonal author frame; native seams inherit exact v63 partial derivatives during construction; optical/contact edges may intentionally split normal';c['uvPolicy']={'canonicalSeamCoordinate':'s=t','ownerCharts':[P[o['instance']]['uvChart']['id'] for o in c['owners'] if o['instance'] in P],'atlasSeam':True,'textureAssigned':False};c['weightPolicy']='sampled canonical rest weights; both skin trim owners consume same values'
# Cross-owner UV stays explicitly charted; original ribbon coordinates are preserved.
for j,pid in enumerate(['F05-R','F07-R','F09-R','F11','F09-L','F07-L','F05-L']):P[pid]['uvChart']={'id':'v63-ribbon','kind':'exact original','formula':['u','(partIndex+v)/7'],'partIndex':j,'atlasAssigned':False}
# Fully specified interior recipe. Cubic Hermite radial disks retain every canonical trim.
# The shared normal defines the boundary tangent plane; one center and two center axes
# constrain each new interior. This is an evaluator specification, not a new mesh.
def boundary_value(pid,s):
 loop=P[pid]['boundaryLoops'][0];x=(s%1)*len(loop);j=min(len(loop)-1,int(x));e=loop[j];lt=x-j;t=lt if e['direction']==1 else 1-lt;c=C[e['curveId']]
 return evalcurve(c,t),mul(tangent(c,t),e['direction']),c,t
def canonical_normal(c,t):
 if 'nativeConstraint' in c:
  nc=c['nativeConstraint'];a,b=nc['sourceRange'];st=b-(b-a)*t if nc['reversed'] else a+(b-a)*t;ed=nc['edge'];u,v=(float(ed[1]),st) if ed[0]=='u' else (st,float(ed[1]));return native_frame(nc['instance'],u,v)[0]
 if 'skinNodeNormalIds' in c:return skin_curve_normal(c,t)
 tan=tangent(c,t);ss=c['frameSamples'];j=min(3,int(t*4));n=lerp(ss[j]['normal'],ss[j+1]['normal'],t*4-j);n=sub(n,mul(tan,dot(n,tan)));return unit(n)
for pid,p in P.items():
 if p['layer']!='skin' or pid in native_nets or pid in ['N01','N02']:continue
 n=unit(p['normalHint']);u=unit(cross([0,1,0],n)) if abs(n[1])<.9 else [1,0,0];v=unit(cross(n,u));center=p['interiorGuideM'];radius=sum(math.sqrt(dot(sub(N[C[e['curveId']]['endpointIds'][0]],center),sub(N[C[e['curveId']]['endpointIds'][0]],center))) for e in p['boundaryLoops'][0])/len(p['boundaryLoops'][0])
 p['surfaceRecipe']={'kind':'boundary-Hermite-disk','centerM':center,'centerAxisU':[sum((boundary_value(pid,j/64)[0][k]-center[k])*math.cos(j/64*math.tau) for j in range(64))/32 for k in range(3)],'centerAxisV':[sum((boundary_value(pid,j/64)[0][k]-center[k])*math.sin(j/64*math.tau) for j in range(64))/32 for k in range(3)],'parameters':'r in [0,1], s in [0,1) equally spaced registered boundary segments','formula':'H00(r)*G + H10(r)*(axisU*cos(2pi*s)+axisV*sin(2pi*s)) + H01(r)*B(s) + H11(r)*D(s)','basis':{'H00':'2r^3-3r^2+1','H10':'r^3-2r^2+r','H01':'-2r^3+3r^2','H11':'r^3-r^2'},'boundaryDerivative':'D=normalize(cross(orientedBoundaryTangent,canonicalNormal))*distance(B,G); orientedBoundaryTangent includes the owner loop direction; this exact formula is used by generator and root placement','boundarySource':'curveId and direction only; no copied endpoint controls','renderAcceptance':False}
for pid in native_nets:P[pid]['surfaceRecipe']={'kind':'retained-bicubic','source':'review/head-micro-v63/surfaces.mjs','controlNet':native_nets[pid],'uv':'exact v63 ribbon'}
for pid in ['N01','N02']:
 names=['EFLW-R','O2-R','O3-R','O3-L','O2-L','EFLW-L'] if pid=='N01' else ['EFLW-L','EBL-L','SB-L','SB-R','EBL-R','EFLW-R'];toprefs=[edge(a,b) for a,b in zip(names,names[1:])];startside='R' if pid=='N01' else 'L';endside='L' if pid=='N01' else 'R'
 P[pid]['surfaceRecipe']={'kind':'neck-Hermite-plus-elliptic-sections','upperContour':toprefs,'upperContourCurveIds':[e['curveId'] for e in toprefs],'thetaRange':[-math.pi/2,math.pi/2] if pid=='N01' else [math.pi/2,3*math.pi/2],'upperParameters':'s in [0,1] equally spans ordered 5 upper curves; v=0 upper contour, v=1 HEAD y=-.100 ellipse','upperFormula':'H00(v)*B(s)+H10(v)*A(s)+H01(v)*R(s)+H11(v)*E(s)','topDerivativeRecipe':'baseA=normalize(cross(orientedUpperTangent,canonicalNormal))*distance(R,B). Add endpoint corrections with ws=max(0,1-s/.2)^2 and we=max(0,1-(1-s)/.2)^2; project corrected A onto canonical normal plane. Endpoint corrections are stored canonical side top derivative minus baseA endpoint.','ringDerivativeScaleM':.100*.3/.35,'ringDerivativeRecipe':'E=[.16*scale*sin(theta),-scale,0]','sideSources':[neck_side_curves[startside],neck_side_curves[endside]],'lowerSections':P[pid]['sectionDefinition']['lowerSections'],'lowerFormula':'P(theta,y)=[rx(y)*sin(theta),y,rz(y)*cos(theta)]','lowerRadiusLaw':'-.200..-.100: rx=.094-.16*(y+.200),rz=.076. -.280..-.200: cubic Hermite rx endpoints(.106,.094) slopes(-.15,-.16); rz endpoints(.086,.076) slopes(-.125,0); derivative units per metre y.','lowerWeightLaw':'y<=-.200: chest=clamp((-.200-y)/.080),neck=1-chest; -.200..-.100: head=.35*(y+.200)/.100,neck=1-head','terminal':'whole free neck cut at chest .480, covered by shirt; no cap and no unowned receiver'}

def surface_value(pid,r,s):
 p=P[pid];sp=p['surfaceRecipe'];G=sp['centerM'];B,tan,c,t=boundary_value(pid,s);n=canonical_normal(c,t);D=mul(unit(cross(tan,n)),math.sqrt(dot(sub(B,G),sub(B,G))))
 T=add(mul(sp['centerAxisU'],math.cos(s*math.tau)),mul(sp['centerAxisV'],math.sin(s*math.tau)))
 h00=2*r**3-3*r*r+1;h10=r**3-2*r*r+r;h01=-2*r**3+3*r*r;h11=r**3-r*r
 return add(add(mul(G,h00),mul(T,h10)),add(mul(B,h01),mul(D,h11)))
def surface_frame(pid,r,s):
 a=surface_value(pid,max(1e-5,r-1e-5),s);b=surface_value(pid,min(.99999,r+1e-5),s);c=surface_value(pid,r,s-1e-5);d=surface_value(pid,r,s+1e-5);tr=unit(sub(b,a));ts=unit(sub(d,c));n=unit(cross(tr,ts));
 if dot(n,P[pid]['normalHint'])<0:n=mul(n,-1)
 return n,tr
# Roots now lie on that SAME trimmed scalp evaluator, eliminating a second support surface.
for root in hair:
 pid=root['support'];target=root['supportPositionM'];best=(1e10,None,None)
 # Register a UV by minimizing distance to the initial qualitative support target.
 for ir in range(1,20):
  r=ir/20
  for js in range(80):
   ss=js/80;q=surface_value(pid,r,ss);err=dot(sub(q,target),sub(q,target))
   if err<best[0]:best=(err,r,ss)
 step=.025
 for _ in range(10):
  for dr,ds in [(0,0),(-step,0),(step,0),(0,-step),(0,step),(-step,-step),(step,step)]:
   rr=min(.98,max(.02,best[1]+dr));ss=(best[2]+ds)%1;q=surface_value(pid,rr,ss);err=dot(sub(q,target),sub(q,target))
   if err<best[0]:best=(err,rr,ss)
  step*=.5
 _,r,ss=best;pos=surface_value(pid,r,ss);n,tr=surface_frame(pid,r,ss);anchor=add(pos,mul(n,root['clearanceM']));hid=root['instance'];c=C[root['spineCurveId']];tip=c['controlPointsM'][-1];d=sub(tip,anchor);t=unit(sub(d,mul(n,dot(d,n))));b=unit(cross(t,n));width,depth,lift=settings[P[hid]['type']];cp=[anchor,add(add(anchor,mul(d,.30)),mul(n,lift)),add(add(anchor,mul(d,.75)),mul(n,lift*.35)),tip];c['controlPointsM']=cp;N[hid+'-ROOT']=anchor
 root.update(supportChartUV=[r,ss],supportPositionM=pos,positionM=anchor,normal=n,tangent=t,binormal=b,initialTargetResidualM=math.sqrt(best[0]),rootMatrixRowMajor=[b[0],t[0],n[0],anchor[0],b[1],t[1],n[1],anchor[1],b[2],t[2],n[2],anchor[2],0,0,0,1]);P[hid]['section'].update(axisWidth=b,axisDepth=n,rootTangent=t);P[hid]['normalHint']=n
 for sample in c['frameSamples']:
  st=sample['t'];sample['positionM']=evalcurve(c,st);sample['tangent']=tangent(c,st);sn=unit(sub(n,mul(sample['tangent'],dot(n,sample['tangent']))));sample['normal']=sn;sample['crossTangent']=unit(cross(sn,sample['tangent']))
for c in C.values():
 if c['kind'] not in ['hair-side','hair-root']:continue
 N[c['endpointIds'][0]]=evalcurve(c,0);N[c['endpointIds'][1]]=evalcurve(c,1);nh=P[c['definition']['instance']]['normalHint']
 for sm in c['frameSamples']:
  t=sm['t'];sm['positionM']=evalcurve(c,t);sm['tangent']=tangent(c,t);nn=unit(sub(nh,mul(sm['tangent'],dot(nh,sm['tangent']))));sm['normal']=nn;sm['crossTangent']=unit(cross(nn,sm['tangent']))
for pid in charts:P[pid]['rootSupportChart']={'source':'same surfaceRecipe as scalp trim','coordinates':'u=r radial, v=s normalized boundary arc parameter','domain':[[0,1],[0,1]],'duplicateSupportSurface':False}
for c in C.values():
 c['uvPolicy']['ownerCharts']=[P[o['instance']]['uvChart']['id'] for o in c['owners'] if o['instance'] in P]
 for sm in c['frameSamples']:
  sm['uvByOwner']={}
  for o in c['owners']:
   pid=o['instance'];p=P[pid];t=sm['t']
   if pid in native_nets:
    nc=c['nativeConstraint'];a,b=nc['sourceRange'];st=b-(b-a)*t if nc['reversed'] else a+(b-a)*t;ed=nc['edge'];u,v=(float(ed[1]),st) if ed[0]=='u' else (st,float(ed[1]));idx=['F05-R','F07-R','F09-R','F11','F09-L','F07-L','F05-L'].index(nc['instance']);uv=[u,(idx+v)/7]
   elif o.get('role')=='trim':
    loop=p['boundaryLoops'][o['loop']];st=(o['edge']+(t if o['direction']==1 else 1-t))/len(loop);uv=[.5+.5*math.cos(st*math.tau),.5+.5*math.sin(st*math.tau)]
   else:uv=[.5,t]
   sm['uvByOwner'][pid]=uv
for pid,p in P.items():
 if p['layer']=='skin' and pid not in native_nets:p['uvChart'].update(formula=['.5+.5*r*cos(2*pi*s)','.5+.5*r*sin(2*pi*s)'],seamPolicy='per-part chart; canonical seam t and explicit uvByOwner samples carry correspondence')
# Numerical local features are design constraints for the closed reference pose.
P['F17']['profileConstraint']={'ridgeCount':1,'ridgeGuideM':[0,-.036,.138],'lowerBoundary':'retained F11:u0','upperBoundary':mouthcid,'noSecondProtrusion':True}
P['F15']['nasalRecesses']=[{'side':side,'centerM':[sgn*.017,-.003,.140],'depthVectorM':[0,.008,-.002],'rimOwners':['F14-'+side,'F15'],'kind':'blind nasal recess; no through-nose cavity'} for side,sgn in [('L',1),('R',-1)]]
# Map current instances to the selected reference; preserve original v1 as immutable history.
base_instances=json.loads((V1/'instances.json').read_text())['instances']
for x in base_instances:
 pid=x['id'];P[pid]['selectedImage']=str((REF/x['image']).relative_to(ROOT))
for side in ['L','R']:P['F21-'+side]['selectedImage']=str((V1/'F21-supplement/mira-F21-v1.png').relative_to(ROOT))
P['F17']['selectedImage']=str((V1/'F17-side-supplement/mira-F17-side-v2.png').relative_to(ROOT))
for side in ['L','R']:P['A01a-'+side]['selectedImage']=str((V1/'A01a-attachment-supplement/mira-A01a-attachment-v1.png').relative_to(ROOT))
# Explicit head/cloth contract. Numerical distances are radial same-angle gaps, not global nearest distances.
clearance=[]
for i in range(101):
 q=i/100;y=-.200+.100*q;rx=.094-.016*q;rz=.076;cx=.100-.014*q;cz=.086-.003*q
 for j in range(337):
  th=math.radians(12+j);r=lambda a,b:1/math.sqrt((math.sin(th)/a)**2+(math.cos(th)/b)**2)
  clearance.append((r(cx,cz)-r(rx,rz))*1000)
external={'id':'HEAD_NECK_COLLAR_V65','frames':{'headFromChestTranslation':[0,-.760,0],'neckFromChestTranslation':[0,-.600,0],'poseConversion':'inverse(M_head)*M_chest; translation valid identity bind only'},'collar':{'owners':['cloth:C01','cloth:C02'],'lowerChestY':.560,'upperChestY':.660,'innerLower':[.100,.086],'innerUpper':[.086,.083],'outerLower':[.104,.090],'outerUpper':[.090,.087],'frontOpenHalfAngleDegrees':12},'skinCut':{'headY':-.280,'chestY':.480,'radiiM':[.106,.086],'owners':['head:N01','head:N02'],'receiver':None,'receiverRequired':False,'terminalPolicy':'intentional hidden free cut, no cap','coveredBy':['cloth:T01-R','cloth:T01-L','cloth:T02-R','cloth:T02-L','cloth:T04-R','cloth:T04-L'],'curveIds':[c['id'] for c in C.values() if c.get('externalPort')]},'verticalUnderlapM':.080,'underActualFrontOpeningM':.020,'collarZoneNeckSections':P['N01']['sectionDefinition']['lowerSections'][1:],'staticSameRayGapMM':{'min':min(clearance),'max':max(clearance),'samples':len(clearance)},'interpretation':'positive radial air gap, separate layers; not a weld or posed collision test','pending':['neck/chest/head skin blend and collar in animated poses untested']}
for pid,p in P.items():
 typ=p['type'];p['imageFitIntent']={'reference':p['selectedImage'],'use':'qualitative isolated exposed/reverse/profile contour only; not a metric projection fit','feature':{'F01':'forehead shallow convex patch','F03':'temple concave orbital trim','F05':'malar prominence retained','F07':'submalar hollow retained','F09':'jaw turn retained','F11':'broad chin retained','F12':'narrow bridge with superior glabellar join','F13':'central single nasal tip','F14':'alar arch with underside open to nasal floor','F15':'columella and nasal floor','F16a':'single upper vermilion ridge','F16b':'philtral concavity','F17':'single lower-lip ridge and apron','F18':'infraorbital crescent','F19':'nasolabial side plane','F20':'oral commissure short fold','F21':'preauricular strip anterior to ear','E03':'upper lid arc','E04':'lower lid shallow arc','E05':'small medial canthal wedge, raised tear bump excluded','A01a':'open U roll, two longitudinal trims','A01b':'forked antihelix and scapha transition','A02a':'concha blind bowl','A02b':'anterior tragus flap','A03':'rounded lobe','A04':'posterior ear/root transition','S01':'anterior scalp band','S02':'crown dome','S-SIDE':'side scalp ear cutout','S05':'occipital sheet','N01':'single anterior neck half','N02':'single posterior neck half','E01':'near spherical globe with posterior closed body','E02':'iris and corneal cap','B01':'arched tapered brow strip','HT01':'raised swept single forelock','HT02':'shallow crown overlap','HT03':'short side fall','HT04':'ear-edge taper','HT05':'posterior crown flow','HT06':'nape taper'}[typ]}
for side in ['L','R']:
 p=P['A01a-'+side];p['surfaceRecipe']={'kind':'open-rolled-strip','innerTrim':p['section']['innerTrim'],'rearTrim':p['section']['rearTrim'],'u':'equal third-interval along three canonical rail curves','v':[0,1],'formula':p['section']['sectionRule'],'outwardBulgeM':.004,'terminalEdges':'canonical terminal curves after node tangent-plane correction; transverse Hermite blend must retain those trims','revisedFormula':'Hermite blend of inner(u)/rear(u), with cross derivatives projected into each canonical rail normal plane; interior +sin(pi*v)^2*sin(pi*u)*[signed .004,0,0]; terminal curves are canonical constraints', 'normalContract':'skinNodeContracts and canonical curve frames supersede the initial section hints','closedTube':False}
# Ref-to-ref comparisons exclude text labels that disagree with registered anatomical frame.
reference_notes={'readImages':sorted(set(p['selectedImage'] for p in P.values()))+['docs/evidence/character-reference-v60/references/mira-head-views-v1.png','docs/evidence/character-reference-v60/references/mira-complete-six-views-v1.png'],'calibration':'none; all new metres are deliberate author design, never inferred measurement from pixels','exclusions':['A01a above/toward +X caption is not a coordinate transform','F17 first side supplement extra projection rejected; v2 single ridge adopted qualitatively','hair HT01 vs HT02 becomes explicit lift .028 vs .013m, not claimed image measurement','ear canal beyond blind concha and oral cavity/open-mouth acting outside this closed-rest registration scope']}
# Every old adjacency proposal is accounted for; changed topological meaning is explicit.
old_interfaces=json.loads((V1/'interfaces.json').read_text())['interfaces'];migration=[];hair_overlaps=[]
for oldi in old_interfaces:
 a,b=oldi['a'],oldi['b'];shared=[cid for cid,c in C.items() if {o['instance'] for o in c['owners']}=={a,b}];common_nodes=sorted({n for l in P[a]['boundaryLoops'] for e in l for n in C[e['curveId']]['endpointIds']} & {n for l in P[b]['boundaryLoops'] for e in l for n in C[e['curveId']]['endpointIds']})
 row={'v1Id':oldi['id'],'a':a,'b':b,'v1Kind':oldi['kind'],'canonicalCurveIds':shared,'commonNodeIds':common_nodes}
 if shared:row.update(disposition='numeric shared canonical curve',kind='contact' if oldi['kind']=='closed-mouth-contact' else oldi['kind'])
 elif oldi['kind']=='hair-overlap':
  h={'id':oldi['id'],'over':a,'under':b,'kind':'overlap-order-design','spineSources':[P[a]['spineCurveId'],P[b]['spineCurveId']],'overVRange':[.15,.90],'underVRange':[.10,.90],'minimumIntendedNormalSeparationM':.0008,'contactWeld':False,'status':'numeric placement and layer-order specification; full strip-intersection acceptance awaits construction'};hair_overlaps.append(h);row.update(disposition='explicit overlap order retained',recordId=h['id'])
 elif oldi['kind']=='root-support':row.update(disposition='exact root on canonical scalp surface',recordId='ROOT-'+a)
 elif oldi['kind']=='surface-overlay':row.update(disposition='brow overlay, not a skin seam',normalOffsetM=.0004)
 elif oldi['kind']=='sliding-contact':row.update(disposition='numeric offset sphere/lid sliding contact, not a weld',eyeSide=a[-1])
 elif common_nodes:row.update(disposition='v1 edge proposal replaced by point junction only',reason='new closed trim topology assigns the finite skin interval to the intervening named small face; no duplicate ownership')
 else:row.update(disposition='v1 adjacency proposal superseded',reason='new explicit trim loops and named intervening faces replace qualitative pair; no hidden filler or duplicate whole-edge owner')
 migration.append(row)
registration={'version':'head-authored-v65-revision2','baseSHA':'bc761f25aae76209d26623b509f97e1f3a5a12ca','previousUnrecoveredV2':'not used; 41/82/154 reported previously is not evidence for this result','frame':{'id':'HEAD_LOCAL_M','units':'metres','up':'+Y','front':'+Z','anatomicalRight':'-X','anatomicalLeft':'+X'},'status':'author design candidate, independent full assembly acceptance pending; no new mesh','nodes':N,'skinNodeContracts':node_contracts,'endpointTangentRepairs':tangent_repairs,'curves':C,'instances':P,'hairRoots':hair,'hairOverlapOrders':hair_overlaps,'v1InterfaceMigration':migration,'eyeContract':eyes,'mouthContactCurveId':mouthcid,'externalContract':external,'referenceReview':reference_notes,'limits':['No generated-camera metric calibration','No mesh watertightness, intersections, visual likeness, expression or runtime acceptance','No new surface tessellation, renderer, runtime import or remote write','Scalp root centers evaluate on the same registered trim/interior recipe; full hair-width support and interlock acceptance require construction','Original seven bicubic surfaces and six C1 seams retained verbatim']}
# All outputs are deterministic; wall-clock timing is maintained in a separate receipt.
OUT.mkdir(parents=True,exist_ok=True)
def write(name,obj):
 (OUT/name).write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n')
write('registration.json',registration)
write('native-v63-preserved.json',{'controlNets':native_nets,'source':'docs/evidence/mira-reference-set-v64/head-assembly-registration/existing-boundaries.json','records':old,'sourceSha256':hashlib.sha256((V1/'existing-boundaries.json').read_bytes()).hexdigest(),'meshChanged':False})
write('external-neck-contract.json',external)
ports=[]
for cid in external['skinCut']['curveIds']:
 c=C[cid];ports.append({'id':'PORT-'+cid,'owner':[o['instance'] for o in c['owners']],'frame':'HEAD_LOCAL_M','unit':'metres','kind':'open','counterpartId':external['skinCut']['coveredBy'],'receiverRequired':False,'terminalPolicy':'intentional hidden free cut','canonicalSource':'registration.json#/curves/'+cid,'curveId':cid,'orderedSamples':c['frameSamples'],'garmentRelation':'80mm below collar lower rim and 20mm below actual shirt front opening; full azimuth garment-envelope cover is recorded separately, no skin-to-cloth weld'})
collar_samples=[]
for y,rx,rz in [(-.200,.094,.076),(-.150,.086,.076),(-.100,.078,.076)]:
 for deg in range(12,349,21):
  th=math.radians(deg);head=[rx*math.sin(th),y,rz*math.cos(th)];normal=unit([math.sin(th)/rx,.16/rx*math.sin(th)**2,math.cos(th)/rz]);tangentv=unit([rx*math.cos(th),0,-rz*math.sin(th)]);hw=.35*(y+.200)/.100
  collar_samples.append({'angleDegrees':deg,'positionM':[head[0],head[1]+.760,head[2]],'headPositionM':head,'normal':normal,'tangent':tangentv,'skinWeights':{'head':hw,'neck':1-hw}})
ports.append({'id':'PORT-NECK-COLLAR','owner':['head:N01','head:N02'],'frame':'CHEST_LOCAL_M','unit':'metres','kind':'overlap','counterpartId':['cloth:C01','cloth:C02'],'canonicalSource':'external-neck-contract.json','analyticDefinition':external,'orderedSamples':collar_samples})
write('external-ports.json',{'ports':ports,'sharedCanonicalContract':'HEAD_NECK_COLLAR_V65','posedAcceptance':False})
write('reference-review.json',reference_notes)
write('v1-interface-migration.json',{'records':migration,'hairOverlapOrders':hair_overlaps})
print(json.dumps({'instances':len(P),'types':len(set(p['type'] for p in P.values())),'curves':len(C),'roots':len(hair),'nodes':len(N),'collarGapMM':[min(clearance),max(clearance)]}))
