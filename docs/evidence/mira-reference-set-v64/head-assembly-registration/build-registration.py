from pathlib import Path
import json,hashlib,copy
from datetime import datetime,timezone
OUT=Path(__file__).resolve().parent
ROOT=OUT.parents[1]
REF=ROOT/'q-character-reference-v64/head-reference-set'
REPO=ROOT/'Q-mira-face-join-v64'
cov=json.loads((REF/'coverage.json').read_text())
legacy=json.loads((REF/'existing/parts-draft.json').read_text())['parts']
old=json.loads((REPO/'docs/evidence/mira-head-micro-v63/assembly.json').read_text())
metrics=json.loads((REPO/'docs/evidence/mira-head-micro-v63/metrics.json').read_text())
types={x['id']:x for x in cov['types']}
parts={x['id']:copy.deepcopy(x) for x in cov['instances']}
ids=set(parts);edges=[];ports=[];seen=set()
FRAME={'id':'HEAD_LOCAL_M','units':'metres','origin':'existing head group origin','up':'+Y','face':'+Z','anatomicalR':'-X','anatomicalL':'+X','mirror':'[-x,y,z]; negative determinant requires winding reversal; do not mirror entire hairstyle','pixelToMetreCalibration':None}
def side(i):return parts[i]['anatomicalSide']
def layer(i):
 t=parts[i]['type']
 return 'hair' if t.startswith('HT') else 'brow' if t=='B01' else 'ocular-body' if t=='E01' else 'ocular-front' if t=='E02' else 'skin'
for i,p in parts.items():
 p.update(layer=layer(i),frame=FRAME['id'],interfaces=[],openPorts=[],dimensionRecord=types[p['type']]['dimensions'],orientation={'externalNormal':'outward from anatomical body; concrete UV chart only exists on old seven','localUV':None},provenance='v64 author adjacency proposal unless explicitly marked existing-v63')
 p['rig']={'status':'author proposal not implemented','restParent':'head','deformation':'head:1 proposed; no new expression deformation defined'}
 if i in ['N01','N02']:p['rig']={'status':'author proposal not implemented','restParent':'head-local for authoring','deformation':'shared head/neck blend: upper jaw/scalp boundary head1, lower collar cut neck1; interior blend and geometry not yet fixed'}
 if p['type']=='E03':p['rig']={'status':'existing group ID only; new eyelid deformation unimplemented','restParent':'head','existingGroup':'eyelid-1' if side(i)=='L' else 'eyelid-0','existingPivotM':[.046 if side(i)=='L' else -.046,.058,.100],'existingBlinkTranslationYMetres':-.015,'limitation':'do not assume this translation alone deforms a newly welded lid without cracks'}
def add(a,b,kind,region,direction='semantic endpoints not metrically fixed',data=None,tag=None):
 assert a in ids and b in ids,(a,b)
 key=tuple(sorted([a,b]))+(kind,tag or '')
 if key in seen:return
 seen.add(key);n='HI-'+str(len(edges)+1).zfill(3)
 e={'id':n,'a':a,'b':b,'kind':kind,'region':region,'frame':FRAME['id'],'canonicalDirection':direction,'aPort':a+'::'+n,'bPort':b+'::'+n,'sideTraversal':{'a':'+t','b':'-t for boundary loop; contact/overlap has no weld winding'},'status':'author semantic pairing only; geometry unresolved','curveM':None,'tangentM':None,'UVCorrespondence':None,'gapOrClearanceM':None,'actualSharedVertices':False,'source':'author v64 design, not image measurement'}
 if data:e.update(data)
 edges.append(e);parts[a]['interfaces'].append(n);parts[b]['interfaces'].append(n)
 return e
# Native six already share actual indexed vertices in the retained v63 authoring mesh.
for s in old['seams']:
 a,b=s['from'],s['to'];pa=old['parts'].index(next(p for p in old['parts'] if p['id']==a));pb=pa+1
 e=add(a,b,'existing-skin-C1',f'{a}:v=1 <-> {b}:v=0','inner facial edge (u=0) to outer/underside (u=1)',{
 'status':'existing-v63 numeric; source unchanged, not rerun geometry','actualSharedVertices':True,'curveM':s['controls'],'tangentM':s['longitudinalDerivative'],'UVCorrespondence':{'a':['u',s['station']/7],'b':['u',s['station']/7]},'parameterCorrespondence':'u_B=u_A; v_A=1, v_B=0; both derivative dV equal; outward perimeter direction opposite','nativeIndices':s['vertices'],'gapOrClearanceM':0,'source':'frozen v63 assembly.json/surfaces.mjs','sharedWeight':{'head':1}})
# Explicit same-side skin adjacency. No automatic cross-side cartesian products.
same=[
 ('F01','F03','forehead lateral to temple','superior hairline to brow tail'),
 ('F01','E03','sub-brow boundary','medial to lateral'),
 ('F03','E03','outer brow/upper orbital transition','superior to lateral canthus'),
 ('F03','F05','temple to upper-lateral malar cut','lateral upper cheek toward ear-front; end requires F21 review'),
 ('F03','F18','outer orbital transition','outer canthus toward malar plane'),
 ('F18','E04','lower orbital skin to lower lid skin','medial canthus to lateral canthus'),
 ('F18','E05','medial infraorbital corner','superior to inferior'),
 ('F18','F05','infraorbital to malar','medial to lateral'),
 ('F18','F19','infraorbital to nasal-side plane','nasal side to malar side'),
 ('F19','F05','medial malar section','superior to inferior'),
 ('F19','F07','upper medial lower-cheek section','superior to mouth-corner neighborhood; split parameter unset'),
 ('F19','F20','nasolabial to commissure skin','nose-side to lower-cheek-side'),
 ('F19','F14','ala lateral cut','superior to nasal-floor level'),
 ('F20','F07','commissure to lower cheek','upper to lower endpoint; F07 inner-edge split unset'),
 ('F20','F09','lower commissure/adjacent skin to jaw inner border','upper cheek-side endpoint to chin-side endpoint; shape not yet fixed'),
 ('E05','E03','upper medial lid endpoint','skin to free lid margin'),
 ('E05','E04','lower medial lid endpoint','free lid margin to skin'),
 ('E03','E04','outer canthus short endpoint connection ONLY','outer skin to shared canthal point'),
 ('A01a','A01b','upper helix/antihelix root boundary','superior to inferior; exact crease topology pending'),
 ('A01a','A02a','helix-root to upper concha','medial superior root to concha rim'),
 ('A01a','A03','inferior helix end to lobe','anterior to posterior'),
 ('A01a','A04','posterior helix root','superior to inferior'),
 ('A01b','A02a','antihelix to concha rim','superior to inferior'),
 ('A01b','A03','antihelix lower base','anterior to posterior'),
 ('A02a','A02b','concha to tragus hinge','superior to inferior'),
 ('A02a','A03','concha lower base to lobe','anterior to posterior'),
 ('A02a','A04','concha posterior root','superior to inferior'),
 ('A02b','A04','tragus anterior root','superior to inferior'),
 ('A03','A04','lobe posterior root','inferior to superior'),
]
for a,b,region,d in same:
 for s in ['L','R']:add(a+'-'+s,b+'-'+s,'skin-seam-proposal',region,d)
central=[
 ('F01','F12','medial forehead to upper glabellar bridge','superior to inferior'),
 ('E05','F12','inner canthus to nasal bridge','superior to inferior'),
 ('F18','F12','medial infraorbital to bridge flank','superior to inferior'),
 ('F14','F13','wing to central tip side cut','superior to inferior'),
 ('F14','F15','alar underside to nasal-floor side','anterior to posterior'),
 ('F19','F16b','nasolabial plane to philtrum flank','superior to inferior'),
 ('F20','F16a','upper lip lateral end','vermilion rim to mouth seam'),
 ('F20','F17','lower lip lateral end','mouth seam to sublabial skin'),
 ('F09','N01','under-jaw continuation','anterior to posterior'),
 ('F03','S01','temple superior hairline','anterior to posterior'),
 ('F01','S01','forehead hairline','medial to lateral'),
 ('A04','N02','lower postauricular to upper neck','anterior to posterior'),
]
for a,b,region,d in central:
 for s in ['L','R']:add(a+'-'+s,b,'skin-seam-proposal',region,d)
for a,b,region,d in [
 ('F01-L','F01-R','forehead midline','hairline to glabella'),
 ('F12','F13','bridge to tip superior cut','anatomical R to L'),
 ('F13','F15','tip lower central cut','anatomical R to L'),
 ('F15','F16b','nasal base to philtrum superior cut','anatomical R to L'),
 ('F16b','F16a','philtrum lower / upper vermilion','anatomical R to L'),
 ('F17','F11','lower lip apron to existing chin inner curve','anatomical R to L along F11 u=0'),
 ('F11','N01','underchin to anterior neck','anatomical R to L along F11 u=1'),
 ('S01','S02','anterior scalp to crown','anatomical R to L'),
 ('S02','S05','crown to posterior scalp','anatomical R to L'),
 ('S05','N02','nape scalp boundary','anatomical R to L'),
]:add(a,b,'skin-seam-proposal',region,d)
for s,scalp in [('L','S03'),('R','S04')]:
 for b,region in [('S01','anterior side scalp'),('S02','upper side scalp'),('S05','posterior side scalp'),('F03-'+s,'temple scalp edge'),('A04-'+s,'postauricular root'),('N02','lateral nape scalp')]:
  add(scalp,b,'skin-seam-proposal',region,'superior to inferior unless transverse; exact endpoint chart pending')
 add('N01','N02','skin-seam-proposal',f'{s} neck side boundary','jaw/ear level to collar cut',tag=s)
 # Distinct nonwelded layers
 add('E01-'+s,'E02-'+s,'optical-seat','anterior iris/cornea fitting','optical axis approximately +Z; native author dimensions below')
 for lid in ['E03','E04']:add('E01-'+s,lid+'-'+s,'sliding-contact',lid+' eyeball-facing surface','medial to lateral free margin')
 for sk in ['F01','E03','F03']:add('B01-'+s,sk+'-'+s,'surface-overlay','eyebrow strip support/overlap','medial root to lateral taper')
add('F16a','F17','closed-mouth-contact','mouth seam; NOT permanent upper/lower lip weld','anatomical R to L')
# Hair supports and overlap order: exact IDs, authored relative placement only.
hair=[
 ('H01','S01','frontmost lifted forelock from +X part to -X forehead'),
 ('H02','S01','forelock behind H01 along frontal part'),
 ('H03','S01','forelock behind H02 closer crown'),
 ('H04','S01','lateral forelock continuation behind H03'),
 ('H05','S02','low anterior crown left of central crown'),
 ('H06','S02','low anterior crown near center'),
 ('H07','S02','low crown overlap behind H05'),
 ('H08','S02','low crown overlap behind H06'),
 ('H09','S01','short front-right fringe under H01'),
 ('H10','S01','short medial fringe under H02'),
 ('H11','S03','upper anatomical-left side fall'),
 ('H12','S03','lower anatomical-left side fall'),
 ('H13','S03','left ear-edge terminal'),
 ('H14','S04','upper anatomical-right side fall'),
 ('H15','S04','lower anatomical-right side fall'),
 ('H16','S04','right ear-edge terminal'),
 ('H17','S02','left posterior crown arc'),
 ('H18','S02','right posterior crown arc'),
 ('H19','S05','left middle occipital arc'),
 ('H20','S05','right middle occipital arc'),
 ('H21','S05','left outer nape terminal'),
 ('H22','S05','left inner nape terminal'),
 ('H23','S05','right inner nape terminal'),
 ('H24','S05','right outer nape terminal'),
]
for h,scalp,region in hair:
 e=add(h,scalp,'root-support',region,'root centerline to taper tip; anchor tangent on named scalp')
 e['anchorId']='ROOT-'+h;e['anchorM']=None;e['supportCount']=1;e['rootMustRemainUnderVisibleHair']=True
 parts[h]['support']={'surface':scalp,'anchorId':e['anchorId'],'anchorM':None,'region':region,'kind':'author relative placement proposal; not generated 24-instance map','lengthWidthThicknessM':None}
for over,under in [('H01','H02'),('H02','H03'),('H03','H04'),('H01','H09'),('H02','H10'),('H04','H05'),('H05','H06'),('H05','H07'),('H06','H08'),('H07','H17'),('H08','H18'),('H11','H12'),('H12','H13'),('H14','H15'),('H15','H16'),('H17','H19'),('H18','H20'),('H19','H21'),('H19','H22'),('H20','H23'),('H20','H24')]:
 add(over,under,'hair-overlap','author proposed visible overlap; not a welded shared edge','first ID over second ID; actual ordering remains unrendered')
# Explicit unclosed ports instead of imaginary fillers.
def port(owner,name,reason,request,existingCurve=None):
 n='OPEN-'+owner+'-'+name
 p={'id':n,'owner':owner,'frame':FRAME['id'],'boundary':name,'reason':reason,'requiredReference':request,'targetInstance':None,'curveM':existingCurve,'status':'blocked; no geometry may be invented to close this'}
 ports.append(p);parts[owner]['openPorts'].append(n)
for s in ['L','R']:
 for f in ['F05','F07']:
  port(f+'-'+s,'outer-u1','preauricular skin ownership unresolved between temple, ear-front and cheek external boundary','F21 small preauricular-face proposal, true side + front3Q + reverse with F03/F05/F07/A04 neighbor locator')
 port('F14-'+s,'nostril-inner','nasal tunnel extent / internal shadow terminus unspecified','underside nasal assembly F13/F14/F15; open rim identity and depth')
 port('A02a-'+s,'ear-canal','canal entrance and hidden interior extent unspecified','concha/tragus rear-cut view identifying canal terminus')
 port('A01a-'+s,'inner-attachment-section','independent image review cannot distinguish closed round rod from open rolled skin edge','single A01a reverse attachment plus qualitative transverse section; no tube/closed solid assumed')
for n in ['N01','N02']:port(n,'costume-cut','cloth frame/clearance curve is not yet shared','one head-neck/collar cross section registered to chest and head; collar remains costume ownership')
port('F16a','inner-mouth','closed neutral contact does not provide expression-revealed cavity','closed/open lip cross-section if mouth opening will be required')
port('F17','shape','isolated true-side upper spike remains inconsistent','single F17 orthographic side + front with exact same cut perimeter, no upper lip')
# Existing seven boundary polynomials copied/derived from the frozen net, no mesh generation.
S=metrics['interfaces']['stationControls'];D=metrics['interfaces']['sharedTangents'];nets=[]
for k,part in enumerate(old['parts']):
 net=[S[k],[[S[k][i][j]+D[k][i][j]/3 for j in range(3)] for i in range(4)],[[S[k+1][i][j]-D[k+1][i][j]/3 for j in range(3)] for i in range(4)],S[k+1]]
 q={'id':part['id'],'frame':FRAME['id'],'provenance':'existing v63 controls; not new shape','edges':{'u0':[net[j][0] for j in range(4)],'u1':[net[j][3] for j in range(4)],'v0':net[0],'v1':net[3]},'sampledBounds':next(p for p in metrics['partBounds'] if p['id']==part['id'])}
 nets.append(q);parts[part['id']]['existingNumericBoundaryRecord']='existing-boundaries.json#'+part['id'];parts[part['id']]['rig']={'status':'existing-v63','weight':{'head':1}};parts[part['id']]['orientation']['localUV']={'u':'inner to outer','v':'ordered chain R cheek down chin then up L','textureAtlasCorrespondence':None}
# Every legacy declaration accounted for without preserving anatomically wrong direct links.
legacy_map=[]
alias=cov['aliases']
for p in legacy:
 owners=[i for i,x in parts.items() if x.get('legacyInstance')==p['id']]
 for oldname in p.get('joins',[]):
  incident=[e for e in edges if e['a'] in owners or e['b'] in owners]
  target=lambda e:e['b'] if e['a'] in owners else e['a']
  state='replacement-IDs-not-geometric-validation'
  if oldname=='one scalp-root loop/anchor': chosen=[e for e in incident if e['kind']=='root-support']
  elif oldname=='neighboring visible overlap':chosen=[e for e in incident if e['kind']=='hair-overlap']
  elif oldname=='adjacent scalp loops':chosen=[e for e in incident if target(e) in ['S01','S02','S03','S04','S05'] and e['kind']=='skin-seam-proposal']
  elif oldname=='forehead/temple/ear root':chosen=[e for e in incident if target(e).startswith(('F01-','F03-','A04-'))]
  elif oldname=='same-side adjacent ear patches':chosen=[e for e in incident if target(e).startswith('A')]
  elif oldname=='temple/scalp':
   chosen=[e for e in incident if target(e).startswith(('F03-','A04-')) or target(e) in ['S03','S04']]
   state='ear-to-head-routed-through-A04-not-direct-all-ear-to-temple'
  elif oldname=='S03/S04':chosen=[e for e in incident if target(e)==('S03' if p['id'].endswith('-L') else 'S04')]
  elif oldname=='costume opening':chosen=[];state='explicit-external-open-port'
  elif oldname=='same-side eyelid bone':chosen=[];state='rig-reference-only-no-skin-weld-to-bone'
  elif oldname=='preserved eye center':
   chosen=[e for e in incident if e['kind'] in ['sliding-contact','optical-seat']]
   state='existing-rig-center-reference-not-adjacency'
   if p['typeId']=='B01':state='obsolete-brow-to-eye-center-use-skin-overlay'
  elif oldname=='orbital rim':chosen=[e for e in incident if e['kind'] in ['sliding-contact','skin-seam-proposal','surface-overlay']]
  elif oldname=='shared 46-point neck rim':chosen=[];state='unsubstantiated-point-count-dropped-neck-cut-unregistered'
  elif oldname=='jaw/scalp':chosen=[e for e in incident if target(e).startswith(('F09-','F11','S0','A04-'))]
  else:
   resolvedTargets=[oldname] if oldname in ids else [i for i,x in parts.items() if x.get('legacyInstance')==oldname]
   chosen=[e for e in incident if target(e) in resolvedTargets]
  if (p['typeId']=='F01' and oldname.startswith('F05')) or (p['typeId']=='F05' and oldname=='F12'):state='obsolete-direct-seam-rejected-use-E03-E04-E05-F18';chosen=[]
  if not chosen and state=='replacement-IDs-not-geometric-validation':state='old-direct-pair-superseded-see-complete-owner-interface-list'
  legacy_map.append({'legacyOwner':p['id'],'oldDeclaration':oldname,'newOwners':owners,'interfaceIds':[e['id'] for e in chosen],'openPortIds':[x for o in owners for x in parts[o]['openPorts']],'status':state})
def save(n,x):(OUT/n).write_text(json.dumps(x,indent=2)+'\n')
save('interfaces.json',{'frame':FRAME,'interfaces':edges,'openPorts':ports,'interpretation':'semantic proposals have no registered curves; only six existing C1 records have numeric geometry'})
save('instances.json',{'frame':FRAME,'instances':list(parts.values()),'all80NumericRegistrationComplete':False})
save('existing-boundaries.json',nets)
save('legacy-153-accounting.json',legacy_map)
save('rig-reference.json',{'source':'existing detailed-geometry.js lines218-226 / actor-models blink; v63 metrics rig','frame':FRAME,'rig':metrics['rig'],'eyes':[{'side':s,'scleraCenterM':[x,.050,.100],'scleraEllipsoidScalesM':[.022,.008,.010],'irisCenterM':[x,.050,.109],'irisScalesM':[.008,.008,.003],'lidGroup':g,'lidPivotM':[x,.058,.100]} for s,x,g in [('R',-.046,'eyelid-0'),('L',.046,'eyelid-1')]],'newEyeGeometry':'not fixed; old flattened ellipsoid is not new near-spherical E01 image, cannot silently reuse dimensions','bonesModified':False})
bad=[e['id'] for e in edges if e['a'] not in ids or e['b'] not in ids]
unreferenced=[i for i,p in parts.items() if not p['interfaces']]
counts={'instances':len(parts),'leafTypes':len(types),'exactIdInterfaces':len(edges),'existingNumericC1':sum(e['kind']=='existing-skin-C1' for e in edges),'proposalInterfaces':sum(e['kind']!='existing-skin-C1' for e in edges),'explicitBlockedPorts':len(ports),'danglingInstanceIDs':bad,'unreferencedInstances':unreferenced,'duplicateInterfaceIds':len(edges)-len({e['id'] for e in edges}),'legacyDeclarationsAccounted':len(legacy_map),'hairRoots':sum(e['kind']=='root-support' for e in edges),'crossSidePairedSkinEdges':[e['id'] for e in edges if e['a'].endswith('-L') and e['b'].endswith('-R') and e['region']!='forehead midline'],'skinEyeWelds':[e['id'] for e in edges if e['kind'] in ['skin-seam-proposal','existing-skin-C1'] and ('ocular' in layer(e['a']) or 'ocular' in layer(e['b']))],'scope':'data integrity only, no new meshes, no topology or image acceptance'}
save('ledger-check.json',counts)
sources=[REF/'HASHES.json',REF/'coverage.json',REF/'existing/parts-draft.json',REPO/'review/head-micro-v63/surfaces.mjs',REPO/'docs/evidence/mira-head-micro-v63/assembly.json',REPO/'docs/evidence/mira-head-micro-v63/metrics.json',REPO/'src/assets/characters/detailed-geometry.js',REPO/'src/actor-models.js']
save('source-hashes.json',[{'path':str(p),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in sources])
print(json.dumps(counts,indent=2))
