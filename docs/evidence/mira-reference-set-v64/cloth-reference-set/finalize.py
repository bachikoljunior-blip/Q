from pathlib import Path
from datetime import datetime, timezone
import json, hashlib
from PIL import Image

R=Path(__file__).resolve().parent
def read(name): return json.loads((R/name).read_text())
def write(name,value): (R/name).write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')
def sha(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest()
plan=read('PLAN.json'); additions=read('ADDITIONS-PLAN.json')['types']
selected={
 'T02':'cloth-01-v2.png','T03':'cloth-01-v2.png','T04':'cloth-01-v2.png',
 'T05':'cloth-02-v1.png','S01':'cloth-02-v1.png','S02':'S02-v2.png','S03':'S03-v2.png','S04':'cloth-03-v1.png','S06':'S06-v2.png',
 'C01':'C01-v2.png','C02':'cloth-04-v1.png','W01':'W01-v2.png','W02':'W02-v2.png','W03':'W03-v2.png',
 'P03':'P03-v2.png','P04':'P04-v2.png','L01':'L01-v2.png','L02':'L02-v2.png','L03':'L03-v2.png','L04':'cloth-07-v1.png','L05':'cloth-07-v1.png',
 'B01':'cloth-08-v1.png','B02':'cloth-08-v1.png','B03':'cloth-08-v1.png','B04':'cloth-09-v1.png',
 'F01':'cloth-09-v1.png','F02':'cloth-09-v1.png','F03':'F03-v2.png','F04':'F04-v2.png','F05':'cloth-10-v1.png',
 'TR01':'TR01-method-b.png','TR02':'TR02-method-b.png','TR03':'TR03-v2.png','TR04':'TR04-v2.png','TR05':'TR05-v1.png','PH01':'PH01-v1.png'}
notes={
 'T02':'Ignore generated text left shoulder: rear locator image-right is anatomical Right. Existing author placement is authoritative; no all-panel consistency claim.',
 'T03':'Single side surface readable; contour and grain/piping are not measured geometry or material.',
 'T04':'Single shoulder saddle readable. Ignore generated HOODIE neighbour text; ARMHOLE from author ledger controls.',
 'T05':'One crescent patch, not complete annular armhole. Four placements require front/rear adjacency registration.',
 'S01':'Half-panel with one broad bend; exact shoulder and elbow arc correspondence unmeasured.',
 'S02':'Repaired locator shows rear anatomical Right upper arm; not front S01. Exact cut contours remain author registration.',
 'S03':'One-fold topology agrees. Image remains taller than old 180x90 nominal author ratio; this is uncalibrated aspect/scale, not proof of a different topology. Final author width/height and fold depth must be registered together before mesh.',
 'S04':'Single concave gusset; elbow seam lengths unmeasured.',
 'C01':'Front collar half is readable; illustrated angular sweep not a measured 90-degree arc.',
 'C02':'Rear curved stand-collar strip; exact end angles and wall thickness not measured.',
 'W01':'Corrected from multiple pleats to one U fold. Three layer instances are author placements, not three different shapes.',
 'W02':'Corrected from entire scarf to one shoulder bridge. Brooch attachment is separate.',
 'W03':'Corrected to one V strip. Context lacks individual layer highlight; author 3-layer mapping controls.',
 'P03':'Corrected placement to outer cape edge, staff side, rather than tunic split.',
 'P04':'Corrected entire cowl into single shoulder saddle; older P04-RB image covers only back subdivision, not whole type.',
 'L01':'Corrected pair of panels to one front half. No second front wall is present.',
 'L02':'Corrected full-width rear to one quarter. Context unhighlighted; rear quarter mapping comes from canonical and ledger.',
 'L03':'Corrected doubled return wall into one panel; decorative edge rolls are excluded.',
 'L04':'One turnback strip; thick drawn rim is illustrative, not runtime thickness.',
 'L05':'Tunic hem only, not cape hem. Shared adjacent ends are not independent solid caps.',
 'B01':'Leather segment remains separate from trouser fabric TR04.',
 'B02':'Legacy B02-R ID retained; canonical hanging tail is anatomical Left (+X), front image-right.',
 'B03':'Two scale instances; hanger legacy R alias maps Left (+X). Exact ring proportions/pin clearance unresolved.',
 'B04':'Single pin/hinge part; belt-hole contact needs author fit.',
 'F01':'Open front half-shell readable; thick edge rims excluded.',
 'F02':'Open rear half-shell readable; mirror shares shape, not automatically mirrored twist or winding.',
 'F03':'Shape is one ribbon. Old front/rear locator sides conflict; repaired contexts lack a precise highlighted strip. Discard both locator claims; use canonical wrists plus author R=-X/L=+X and wrap order.',
 'F04':'Corrected double-convex profile to a thin concave-backed dome. Exact thickness/contact with F05 unresolved.',
 'F05':'Separate rim with central opening; F04 seat is author fit.',
 'TR01':'v1/v2 closed-ankle topology rejected. Method B is an open one-surface reference; blue-grey is proxy only. Upper cutout location and TR03 mating edges are not yet registered to actual trouser contours.',
 'TR02':'v1/v2 mixed open/closed views rejected. Method B open surface class readable; seat/crotch contour and matching TR01 seams still require author registration. Proxy blue-grey is not canonical colour.',
 'TR03':'One curved diamond patch visible; exact saddle curvature and four seam lengths must match both front/rear leg pieces, not duplicate their crotch region.',
 'TR04':'Fabric waist arc only; not external leather belt. Four instances share endpoints; no independent end caps.',
 'TR05':'Cloth underlap inside boots only. Joint with TR01/TR02 and overlap depth with AB07/AB08 not measured.',
 'PH01':'Cape-specific hem only. Ignore generated swirl texture/rolled thickness; share P01/P02/P03 hem and endpoints, no capped independent solids.'}
rows=[]
for src in plan['types']+additions:
 t=src['typeID']; f=R/selected[t] if t in selected else Path(src['microReference']['file'])
 assert f.exists(),f
 rows.append({'typeID':t,'name':src['name'],'instances':src['instances'],'selectedImage':str(f),'sha256':sha(f),
 'referenceAssessment':'qualitative-shape-only-conditional' if t not in ('TR01','TR02') else 'open-surface-method-conditional-registration-pending',
 'priorIndependentStatus':src.get('microReference',{}).get('status','new image: independent review pending'),
 'notes':notes.get(t,src.get('microReference',{}).get('limits','')),
 'dimensions':src.get('approxSizeMm'), 'dimensionStatus':src.get('authorDimensionStatus',src.get('dimensionStatus')),
 'edgeContract':src.get('edgeContract',src.get('boundaryContract')),
 'sharedVerticesUVWeights':'not established by this image set; no new geometry',
 'mirrorPolicy':src.get('mirrorPolicy','symmetry is author proposal; exact shared contours and winding not implemented')})
instances=[]
for x in plan['instances']:
 x=dict(x); x['imageType']=x['type'];x['placementAuthority']='canonical complete/assembly plus author mapping; generated locator secondary'
 if x['id'] in ('B02-R','B03-hanger-R'):
  x['legacyAnatomicalSide']=x.get('anatomicalSide');x['anatomicalSide']='Left (+X)';x['aliasStatus']='legacy ID retained; canonical placement correction proposed, not runtime mutation'
 instances.append(x)
for x in additions:
 for id in x['instances']:
  instances.append({'id':id,'type':x['typeID'],'imageType':x['typeID'],'anatomicalSide':'Right (-X)' if id.endswith('-R') else 'Left (+X)' if id.endswith('-L') else 'Centre','assemblyStatus':'proposed unassembled author registration','placementAuthority':'canonical plus ADDITIONS-PLAN; not measured from proxy images'})
assert len(rows)==40 and len(instances)==96
write('COVERAGE.json',{'scope':'clothing reference inventory, not character completion','oldTypes':34,'oldInstances':79,'additionalTypes':6,'additionalInstances':17,'imageRepresentedTypes':40,'proposedInstances':96,'new3D':0,'runtimeChanges':0,'allNumericalSeamsClosed':False,'independentCurrentSetReview':'pending','types':rows,'instances':instances})
edges=[
 ('UPPER-CENTRE','T01-R/inside','T01-L/inside','front opening policy, not automatic weld'),
 ('UPPER-SIDE','T01/side + T02/side','T03/front + T03/rear','left/right copies separate'),
 ('SHOULDER','T01/top + T02/top','T04/front + T04/rear','same author shoulder contour'),
 ('ARMHOLE','T03/top + T04/outer','T05 inner arcs; S01/S02 shoulder arcs','front/rear half loops and sampling order pending'),
 ('UPPER-SLEEVE','S01 side edges','S02 side edges','shared long seams, not duplicate closed tubes'),
 ('ELBOW','S01/S02 bottom','S03/S04 top','one outer fold and inner gusset'),
 ('FOREARM','S03/S04 bottom','S05/S06 top','single seam loop shared across both families'),
 ('FOREARM-LONG','S05 long edges','S06 long edges','no independent overlapping walls'),
 ('CUFF','S05/S06 bottom','F01/F02 top','clothing cuff rests beneath bracer; overlap distinct from weld'),
 ('BRACER','F01 sides','F02 sides','wrap F03 overlays; actual fastening order pending'),
 ('NECK','T01/T02/T04 inner top','C01/C02 lower','inner standing collar, outside cowl separate layer'),
 ('COWL','W01 ends','W02 front','three authored U-layer copies; no silent extra folds'),
 ('COWL-REAR','W03 ends','W02 rear','three V-layer copies; back drape not worn hood'),
 ('CAPE-SHOULDER','W02/W03 lower','P04 inner','P04-RB old subset does not cover all arc'),
 ('CAPE-TOP','P04 outer','P01/P02/P03 top','one canonical solved boundary owner required later'),
 ('CAPE-LONG','P01 outside','P02 rear','existing prototype shared edge is not full outfit weld'),
 ('CAPE-EDGE','P02 front','P03 outside','P03 opening edge remains free'),
 ('CAPE-CENTRE','P01-R inside','P01-L inside','old prototype x=+-5 mm gives 10 mm gap; no silent closure'),
 ('CAPE-HEM','P01/P02/P03 bottom','PH01 top','six copies; shared adjacent endpoints, no independent solid caps'),
 ('WAIST','T01/T02/T03 bottom','L01/L02/L03 top','single waist join hidden by outer belt; no double exposed upper hem'),
 ('LOWER-SIDE','L01 side + L02 side','L03 front + L03 rear','rear centre policy pending'),
 ('LOWER-SPLIT','L01 inside','L04 fold edge','remaining inner edge free'),
 ('LOWER-HEM','L01/L02/L03 bottom','L05 top','six matching copies, distinct from cape hem PH01'),
 ('BELT','B01 ends','adjacent B01 ends','leather overlays waist; four segments not free caps'),
 ('BELT-HARDWARE','B03 buckle ring','B04 hinge; B01 hole','requires geometric clearance specification'),
 ('HANGER','B03-hanger-R (legacy ID, Left)','B02-R top (legacy ID, Left)','canonical Left +X, bottom free'),
 ('BROOCH','F04 boundary','F05 inner opening','two-size fittings onto W02; no image-derived tolerance'),
 ('TROUSER-WAIST','TR04 lower','TR01/TR02 top','four cloth waist segments separate from B01'),
 ('TROUSER-LONG','TR01 inseam/outseam','TR02 inseam/outseam','method-B silhouettes not yet congruent shared curves'),
 ('TROUSER-GUSSET','TR03 four edges','TR01-R/L and TR02-R/L upper inner cutouts','no double ownership of crotch; exact cutout registration pending'),
 ('BOOT-UNDERLAP','TR01/TR02 bottom','TR05 upper','cloth runs inside AB07/AB08 boot; depth unmeasured')]
write('ASSEMBLY.json',{'coordinates':plan['coordinates'],'authorityOrder':['canonical complete: overall identity/proportions','garment assembly: neck/waist layer and bent sleeves','cape-v2: cape directions only, not swirl texture','hands/staff: cuff/grip','lower-front: belt hardware','this author semantic edge table','isolated micro images: qualitative surface only'], 'numericalCoordinates':'not a CAD measurement; final canonical edge arrays/UV/weights/time solver ownership not yet constructed','interfaces':[{'id':i,'from':a,'to':b,'contract':c,'status':'author design contract; exact shared vertices not implemented'} for i,a,b,c in edges]})
calls=read('CALLS.json');calls['calls'][10]['referencePaths']=[str(R/'cloth-03-v1.png')];calls['calls'][10]['inputPathAudit']='First target retained; prompt also refers to a second canonical context image, whose exact submitted path was not retained in the compacted call record. Do not treat reconstructed list as exact complete receipt.'
groups=['GENERATIONS.json','CORRECTIONS.json','ADDITIONS.json','ADDITION-CORRECTIONS.json','FINAL-CORRECTIONS.json','METHOD-COMPARISON.json']
records=[r for g in groups for r in read(g)]
assert len(records)==37
for r in records:
 p=Path(r['output']); assert sha(p)==sha(r['raw']); assert sha(p)==r['sha256']
 r['rawCopyByteExact']=True
 im=Image.open(p);r['dimensions']=list(im.size);r['mode']=im.mode
for c in calls['calls']:
 if 'promptFile' in c:c['prompt']=(R/c['promptFile']).read_text()
 pfile=R/(c['id'].replace('-v1','')+'-prompt.txt') if c['id'].startswith('cloth-') and c['id'].endswith('v1') else R/(c['id']+'-prompt.txt')
 assert pfile.exists(),pfile
 assert pfile.read_text()==c['prompt'] or pfile.read_text().rstrip()==c['prompt'].rstrip(),c['id']
 c['promptFile']=pfile.name;c['promptSHA256']=sha(pfile);c['status']='terminal-generated-inspected';c['serviceJobID']='not exposed; raw output UUID retained'
write('CALLS.json',calls);write('RAW-ASSETS.json',records)
deps={str(Path(p)):sha(p) for c in calls['calls'] for p in c['referencePaths'] if Path(p).exists()}
for x in rows:deps[x['selectedImage']]=x['sha256']
write('REFERENCE-DEPENDENCIES.json',deps)
def dt(s):return datetime.fromisoformat(s.replace('Z','+00:00')).timestamp()
intervals=sorted((dt(c['time']['started']),dt(c['time']['ended'])) for c in calls['calls'])
merged=[]
for a,b in intervals:
 if merged and a<=merged[-1][1]:merged[-1][1]=max(b,merged[-1][1])
 else:merged.append([a,b])
now=datetime.now(timezone.utc).isoformat()
timing={'taskStarted':calls['taskStarted'],'savedAt':now,'generationCalls':37,'terminal':37,'pending':0,'generationCallElapsedSumSeconds':sum(b-a for a,b in intervals),'generationActiveUnionSeconds':sum(b-a for a,b in merged),'taskWallToSaveSeconds':dt(now)-dt(calls['taskStarted']),'timingLimit':'Call wall elapsed is not GPU execution time. Time outside these calls includes design, read/review, communications and persistence; those categories were not individually stopwatched. Parallel call durations overlap. No mesh implementation time in this unit.'}
write('TIMING.json',timing)
md=['# 衣装資料の範囲と対応','', '旧34型79配置を残し、欠落していたズボン5型と外套裾1型を追加した提案40型96配置。37枚の原PNGを全て実見し、生成元と保存先の完全byte一致を検査した。画像の存在と形状・接合の確定は別。新3D・本編source・remote変更は0。','', '| 型 | 選択した画像 | 残る条件 |','|---|---|---|']
for x in rows:md.append('| '+x['typeID']+' | '+Path(x['selectedImage']).name+' | '+x['notes'].replace('|','/')+' |')
(R/'COVERAGE.md').write_text('\n'.join(md)+'\n')
print(json.dumps({'types':len(rows),'instances':len(instances),'rawPNGs':len(records),'bytes':sum(x['bytes'] for x in records),'time':timing},indent=2))
