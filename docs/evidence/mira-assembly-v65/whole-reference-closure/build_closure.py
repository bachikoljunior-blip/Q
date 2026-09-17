#!/usr/bin/env python3
"""Freeze per-instance original-image/view bindings; never writes source PNGs.

Reads authored registrations only for IDs, selected image paths and fit intent.
Numeric surface/port acceptance belongs to separate reviewers.
"""
import argparse, copy, hashlib, json, subprocess, time
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

OUT=Path(__file__).resolve().parent
ROOT=OUT.parents[3]
HERE=OUT.relative_to(ROOT).as_posix()
BASE='9df1730a0ab04228277f5f796e73edc0b13fea23'
V64='bc761f25aae76209d26623b509f97e1f3a5a12ca'
POLICY='08e297caa1b8bac9f8b37cee56c917a6851f58e6'
POLICY_PATH='docs/evidence/mira-assembly-v65/reference-policy-review/view-enumeration-v2/WHOLE_REFERENCE_SELECTION.proposed.json'
HEAD_PATH='docs/evidence/mira-assembly-v65/head-registration/registration.json'
ACC_PATH='docs/evidence/mira-assembly-v65/accessory-registration/ACCESSORY_REGISTRATION.json'
CLOTH_PATH='docs/evidence/mira-assembly-v65/cloth-registration/CLOTH_AUTHOR_SOURCE.json'
STAFF_PATH='docs/evidence/mira-reference-set-v64/staff-reference-set/STAFF_ASSEMBLY_MAPPING.json'
STAFF_COVERAGE='docs/evidence/mira-reference-set-v64/staff-reference-set/STAFF_REFERENCE_COVERAGE.json'
TR02_OLD='docs/evidence/mira-reference-set-v64/cloth-reference-set/TR02-method-b.png'
TR02_NEW='docs/evidence/mira-assembly-v65/cloth-registration/TR02-notched-open-v65-v2.png'
TR02_BAD='docs/evidence/mira-assembly-v65/cloth-registration/TR02-notched-open-v65.png'
NEW_SHA='1d8d8d1d8a1220a2dbd3b38ccc7461a2bf9dd798c2ab8b9234efa3fc9e418c12'
parser=argparse.ArgumentParser();parser.add_argument('--cloth-commit',required=True);parser.add_argument('--check',action='store_true');args=parser.parse_args()
started=datetime.now(timezone.utc).isoformat();tick=time.perf_counter()
def git(*args):return subprocess.check_output(['git',*args],cwd=ROOT)
def rev(s):return git('rev-parse',s).decode().strip()
def raw(commit,path):return git('show',commit+':'+path)
def load(commit,path):return json.loads(raw(commit,path))
def digest(b):return hashlib.sha256(b).hexdigest()
def encoded(x):return (json.dumps(x,ensure_ascii=False,indent=2)+'\n').encode()
def emit(name,x):
    b=encoded(x);p=OUT/name
    if args.check:assert p.read_bytes()==b,'nondeterministic output '+name
    else:p.write_bytes(b)
    return digest(b)
CLOTH=rev(args.cloth_commit);HEAD=rev('fd5e133');ACC=rev('ab94ce91')
inputs=[]
def source(commit,path):
    b=raw(commit,path);inputs.append({'commit':commit,'path':path,'sha256':digest(b),'bytes':len(b)})
    return json.loads(b)
prior=source(POLICY,POLICY_PATH);head=source(HEAD,HEAD_PATH);acc=source(ACC,ACC_PATH);cloth=source(CLOTH,CLOTH_PATH);staff=source(V64,STAFF_PATH);staff_cov=source(V64,STAFF_COVERAGE)
calls=source(CLOTH,'docs/evidence/mira-assembly-v65/cloth-registration/IMAGE_CALLS.json')
assert calls['pendingTools']==0 and len(calls['observations'])==2
for commit,path in [(CLOTH,'docs/evidence/mira-assembly-v65/cloth-registration/IMAGE_REVIEW.md'),(HEAD,'docs/evidence/mira-assembly-v65/head-registration/reference-review.json'),(ACC,'docs/evidence/mira-assembly-v65/accessory-registration/VISUAL_READBACK.json')]:
 b=raw(commit,path);inputs.append({'commit':commit,'path':path,'sha256':digest(b),'bytes':len(b)})
selection=copy.deepcopy(prior);types={t['id']:t for t in selection['types']}
expected={i:t['id'] for t in prior['types'] for i in t['instances']}
assert len(types)==120 and len(expected)==287

# These views were actually displayed by this canonical worker. Prior policy
# inspections remain attributed to their original authors, not relabelled ours.
observations=[]
def observation(id,path,labels,scope,exclusions=(),stage='current final-reference task'):
    item={'id':id,'path':path,'sha256':digest(raw(CLOTH if path.startswith('docs/evidence/mira-assembly-v65/cloth-registration/') else V64,path)),
          'views':labels,'scope':scope,'exclusions':list(exclusions),'method':'formal view_image of unchanged original PNG','stage':stage,
          'calibrated':False,'numericalAssemblyAccepted':False}
    observations.append(item);return item
mouth='docs/evidence/mira-reference-set-v64/head-reference-set/03-central-mouth-v1.png'
corners='docs/evidence/mira-reference-set-v64/head-reference-set/04-corners-v1.png'
eyes='docs/evidence/mira-reference-set-v64/head-reference-set/05-eye-and-brow-v2.png'
observation('head:F16b',mouth,['FRONT (exposed face)','SIDE (R)','REVERSE (attachment face)','THREE-QUARTER (L)','THREE-QUARTER (R)'],
 'Single philtral surface, central groove/ridges, narrow side and concave reverse. Five displayed views resolve incomplete REVERSE-only enumeration; uncalibrated thickness and crease relief remain authored.',
 ['SIDE true-90-degree caption as calibrated camera','illustrated thick rim and grain as anatomy'])
observation('head:E05',corners,['FRONT / EXPOSED FACE','RIGHT SIDE','REVERSE / ATTACHMENT FACE','THREE-QUARTER (FRONT-LEFT)','THREE-QUARTER (BACK-LEFT)'],
 'Medial canthus wedge and reverse surface are displayed. The conspicuous round caruncle is not adopted as a literal large bump; the author explicitly registers the small canthal wedge.',
 ['prominent near-round caruncle mound as exact anatomy','90-degree caption as calibrated camera','thick border as added tissue'])
for id,scope in [('head:E01','Near-spherical eye body with anterior cap seat and closed rear. The small rear mark is not a posterior open socket.'),('head:E02','One convex iris/corneal cap with concave reverse and narrow side; exact optical thickness/overlap are authored.'),('head:B01','One tapered eyebrow strip, exposed hair direction, backing, edge and obliques; individual rendered hairs are not required geometry.')]:
 observation(id,eyes,['FRONT (EXPOSED FACE)','RIGHT SIDE','BACK (ATTACHMENT FACE)','THREE-QUARTER (FRONT-LEFT)','THREE-QUARTER (BACK-LEFT)'],scope,['TRUE 90-degree caption as calibrated camera','locator scale or optical appearance as dimensional evidence'])
observation('cloth:PH01','docs/evidence/mira-reference-set-v64/cloth-reference-set/PH01-v1.png',
 ['FRONT','BACK','RIGHT PROFILE (oblique reference only)','LEFT PROFILE (oblique reference only)','THREE-QUARTER'],
 'One curved hem turnback strip with exposed front, reverse fold and open short ends. Both labelled profiles are oblique. Their absence from prior adoption enumeration was not an absent original image.',
 ['profile labels as exact 90-degree views','ornamental grain or rolled outline as material/metric authority','independent solid end caps'])
observation('cloth:TR03','docs/evidence/mira-reference-set-v64/cloth-reference-set/TR03-v2.png',
 ['OUTER FACE','TRUE PROFILE (qualitative side only)','INNER FACE','THREE-QUARTER'],
 'Single four-edge diamond cloth patch with convex/reverse appearances and a bent thin side. The placement panel shows region only, not four seam identities. All four edge assignments belong to explicit author design.',
 ['placement locator as proof of four edge-to-panel correspondences','TRUE PROFILE as exact projection'],
 'same canonical worker, earlier finite cloth image review in this continuous thread')
observation('cloth:TR02',TR02_NEW,['OUTSIDE','PROFILE (qualitative side only)','REVERSE','THREE-QUARTER'],
 'One open sheet with a continuous upper-side notch. OUTSIDE notch is image-left; REVERSE notch image-right. This fixes the first supplement reflection contradiction. Both long edges and both short arcs remain open; no opposing wall.',
 ['camera labels as exact projection or global axes','blue-grey proxy colour as canonical material','notch contour as measured TR03 seam coordinates'],
 'same canonical worker, earlier two-stage TR02 supplement inspection in this continuous thread')
obs_sha=emit('IMAGE_OBSERVATIONS.json',{'canonicalAgent':'/root/ultra_q_recover_reference_assembly/cloth_registration_v65/cloth_image_check','records':observations,'otherImages':'prior accepted policies and earlier independent reviews retain their own provenance; no claim of freshly inspecting all 74 selected images'})

for ob in observations:
    t=types[ob['id']];p=t['viewPolicy']
    t['previousAdoptedViews']=copy.deepcopy(p['adoptedViews'])
    p['adoptedViews']=[{'referencePath':ob['path'],'views':ob['views'],'scope':ob['scope'],'authority':HERE+'/IMAGE_OBSERVATIONS.json','calibrated':False}]
    p['sourceEvidence'].append({'path':HERE+'/IMAGE_OBSERVATIONS.json','sha256':obs_sha,'selector':'/records[id='+ob['id']+']'})
    p['newVisualInspection'].append({'path':ob['path'],'sha256':ob['sha256'],'observation':ob['scope'],'record':HERE+'/IMAGE_OBSERVATIONS.json#/records/'+ob['id']})
    for e in ob['exclusions']:p['excludedElements'].append({'referencePath':ob['path'],'element':e,'reason':'Independent original-image observation; numerical interpretation remains authored.','authority':HERE+'/IMAGE_OBSERVATIONS.json'})
    p['viewLabelEnumeration']='displayed-local-labels-enumerated-with-restrictions'

new_png=raw(CLOTH,TR02_NEW);assert digest(new_png)==NEW_SHA
tr=types['cloth:TR02'];tr['references'].append({'path':TR02_NEW,'sha256':NEW_SHA,'bytes':len(new_png),'meaning':'generated design reference; one notched open sheet, not measured CAD'})
tr['selectionBasis']='New v65-v2 is the primary notched open-surface reference. Old method-B is retained only for qualitative longitudinal PROFILE; its unnotched boundary is excluded from current seam or notch design.'
tr['viewPolicy']['adoptedViews'].append({'referencePath':TR02_OLD,'views':['profile'],'scope':'Longitudinal bend of an open sheet only. No notch, outline, four-edge fit, placement, colour or metric evidence.','authority':HERE+'/IMAGE_OBSERVATIONS.json','calibrated':False})
tr['viewPolicy']['excludedElements'].extend([
 {'referencePath':TR02_OLD,'element':'OUTSIDE / REVERSE / 3Q as current notched-silhouette authority','reason':'Old sheet has no required upper-side cutout; only PROFILE bend reference remains active.','authority':HERE+'/REVIEW.md'},
 {'referencePath':TR02_BAD,'element':'REVERSE and complete four-view correspondence','reason':'First supplement put notch on image-left in OUTSIDE and REVERSE; superseded by v2 reflected-side correction.','authority':HERE+'/IMAGE_OBSERVATIONS.json'}])
tr['viewPolicy']['sourceImagePaths']=[r['path'] for r in tr['references']]
tr['viewPolicy']['historicalRejectedVersions'].append('TR02-notched-open-v65.png first supplement: reverse side inconsistency; exact file retained in cloth source commit, not selected.')
for id in ['cloth:TR02','cloth:TR03']:
 p=types[id]['viewPolicy'];old=[s for s in p['limits'] if 'newer TR02 notch image is NOT recovered' in s]
 p['historicalSupersededLimits']=[{'text':s,'supersededBy':TR02_NEW,'reason':'This was true of the saved v64/earlier proposal. Current v65-v2 is now fixed by path/hash and independent view policy; numerical fit remains separate.'} for s in old]
 p['limits']=[s for s in p['limits'] if s not in old]+['TR02 v65-v2 supplies qualitative notch shape. TR03 four-edge coordinates/ownership remain explicit author design and await the separate numerical review; no seam measurement is inferred from either image.']

# Clear type-level author/image bindings. This is an identity/provenance join,
# not a copy or re-verification of numeric curves, surfaces, weights or ports.
bindings=[]
def bind(id,type_id,commit,path,selector,image,intent):
 assert id in expected and expected[id]==type_id,(id,type_id,expected.get(id))
 assert image in [r['path'] for r in types[type_id]['references']],(id,'unselected author image',image)
 bindings.append({'instanceID':id,'typeID':type_id,'authorSource':{'commit':commit,'path':path,'selector':selector},'authorPrimaryImage':image,
                  'imageFitIntent':intent,'policyTypeID':type_id,'imageDimensionsMeasured':False,'numericalAcceptanceByThisReview':False})
for key,r in head['instances'].items():bind('head:'+key,'head:'+r['type'],HEAD,HEAD_PATH,'/instances/'+key,r['selectedImage'],r['imageFitIntent'])
for i,r in enumerate(acc['instances']):bind(r['canonicalID'],r['typeID'],ACC,ACC_PATH,'/instances/'+str(i),r['sourceImage'],r['referenceInterpretation'])
ct={r['typeID']:r for r in cloth['types']}
assert len(ct)==40
for i,r in enumerate(cloth['parts']):
 t=ct[r['type']];assert r['id'] in t['instances'];bind('cloth:'+r['id'],'cloth:'+r['type'],CLOTH,CLOTH_PATH,'/parts/'+str(i),t['reference'],{'basis':t['status'],'fit':r['referenceFit']})
for t in cloth['types']:
 actual={b['instanceID'] for b in bindings if b['typeID']=='cloth:'+t['typeID']};assert actual=={'cloth:'+i for i in t['instances']}
staff_types={i:r for r in staff_cov['rows'] for i in r['instances']}
for i,r in enumerate(staff['instances']):
 s=staff_types[r['id']];type_id='staff:'+s['id'];matches=[x for x in types[type_id]['references'] if x['sha256']==s['sha256']];assert len(matches)==1
 bind('staff:'+r['id'],type_id,V64,STAFF_PATH,'/instances/'+str(i),matches[0]['path'],{'basis':r['registrationStatus'],'referenceLimits':s['limitation'],'coverageSource':STAFF_COVERAGE+'#/rows[id='+s['id']+']'})
assert len(bindings)==len({r['instanceID'] for r in bindings})==287
assert {r['instanceID'] for r in bindings}==set(expected)
for t in selection['types']:
 t['authorReferenceBindings']=[b['instanceID'] for b in bindings if b['typeID']==t['id']]
 assert set(t['authorReferenceBindings'])==set(t['instances'])
 primary={b['authorPrimaryImage'] for b in bindings if b['typeID']==t['id']};assert len(primary)==1
 for r in t['references']:r['role']='primary-author-shape' if r['path'] in primary else 'secondary-qualified-view-only'
 t['exclusionPolicy']={'mode':'explicit-list' if t['viewPolicy']['excludedElements'] else 'no-additional-type-specific-exclusion-recorded','inheritedGlobalLimitsApply':True}

role_paths={role:{r['path'] for t in selection['types'] for r in t['references'] if r['role']==role} for role in ['primary-author-shape','secondary-qualified-view-only']}
role_counts={'primaryTypeReferenceUses':sum(r['role']=='primary-author-shape' for t in selection['types'] for r in t['references']),
             'secondaryTypeReferenceUses':sum(r['role']=='secondary-qualified-view-only' for t in selection['types'] for r in t['references']),
             'uniquePrimaryPNGs':len(role_paths['primary-author-shape']),'uniqueSecondaryPNGs':len(role_paths['secondary-qualified-view-only']),
             'primarySecondarySharedPNGPaths':sorted(role_paths['primary-author-shape']&role_paths['secondary-qualified-view-only']),
             'uniqueSelectedUnionPNGs':len(role_paths['primary-author-shape']|role_paths['secondary-qualified-view-only']),
             'excludedRules':sum(len(t['viewPolicy']['excludedElements']) for t in selection['types']),
             'newSupplementRejectedWholePNGs':[TR02_BAD],
             'meaning':'Roles are per type-reference use. A shared sheet can be primary for another type; primary and secondary unique counts must not be added without de-duplication. Exclusion rules are scoped elements/views, not a count of whole rejected images.'}

emit('INSTANCE_REFERENCE_BINDINGS.json',{'scope':'All canonical instance IDs bound to exact author/source image identities only; no numerical gate acceptance.','bindings':sorted(bindings,key=lambda b:b['instanceID'])})
selection.update(schema='mira-whole-reference-closure-v65/1',scope='Frozen qualitative original-image selection and all-instance author provenance; full assembly acceptance remains a separate gate.',selectionRoleCounts=role_counts,
                 selectedPNGCount=74,sourcePolicyCommit=POLICY,closureBaseCommit=BASE,allReferencesAssemblyReady=False,fullAssemblyReady=False,
                 referenceClosure={'status':'conditional-qualitative-reference-closure','accepted':True,'allInstancesBound':True,'allTypesHaveAdoptedLocalViews':True,'requiredNewImageBlockers':[],
                                   'meaning':'Every planned type/instance has an identified qualitative shape reference, explicitly scoped accepted views and preserved exclusions. Not calibrated projections, all geometry, numeric assembly or overall likeness.'},
                 remaining=['Independent numeric registration and cross-domain port results must be combined by the integrator.','Realized surfaces/placement must still be compared with the complete character; reference closure is not image-fit acceptance.','Exact projection, hidden attachments, material/grasp/collision/deformation and visual/device/PS4 acceptance remain unproven.'])
selection['policyInterpretation'].append('Only explicitly scoped view use is accepted; prior sourcePolicy/reviewStatements remain historical evidence rather than retroactive numerical acceptance.')
selection['limits']+=['No generation, PNG copy, source mesh, runtime import or remote mutation in this closure task.','73 prior selected PNGs plus one TR02 v65-v2 =74; keeping the old TR02 for side-bend only does not count it as a second type.']
emit('WHOLE_REFERENCE_SELECTION.json',selection)

# Hash every distinct selected original once. Record absent-in-base paths as an
# explicit committed dependency; no PNG or full author registration is copied.
images={}
for t in selection['types']:
 for ref in t['references']:
  if ref['path'] in images:
   assert images[ref['path']]['sha256']==ref['sha256'];continue
  commit=CLOTH if ref['path']==TR02_NEW else V64
  b=raw(commit,ref['path']);assert digest(b)==ref['sha256'];assert len(b)==ref['bytes']
  images[ref['path']]={'path':ref['path'],'commit':commit,'sha256':ref['sha256'],'bytes':len(b)}
assert len(images)==74
canonical=prior['canonical'];assert digest(raw(V64,canonical['path']))==canonical['sha256']
emit('INPUTS.json',{'baseCommit':BASE,'sourceDocuments':inputs,'selectedOriginalPNGs':list(images.values()),'canonical':{'commit':V64,**canonical},'noOriginalImagesCopied':True})

def validate(d):
 ts=d['types'];assert len(ts)==120;ids=[t['id'] for t in ts];assert len(set(ids))==120
 inst=[i for t in ts for i in t['instances']];assert len(inst)==len(set(inst))==287 and set(inst)==set(expected)
 assert d['fullAssemblyReady'] is False and d['allReferencesAssemblyReady'] is False
 for before,t in zip(prior['types'],ts):
  assert before['id']==t['id'] and before['instances']==t['instances'];p=t['viewPolicy'];q=before['viewPolicy']
  assert p['adoptedViews'] and all(x['views'] for x in p['adoptedViews'])
  assert all(x in p['excludedElements'] for x in q['excludedElements']),'dropped exclusion'
  historical={x['text'] for x in p.get('historicalSupersededLimits',[])}
  assert all(x in p['limits'] or x in historical for x in q['limits']),'lost source limitation'
  assert not p['exactProjectionAccepted'] and not p['numericalAssemblyAccepted'] and not t['dimensionsFromImage'] and not t['assemblyAccepted']
  paths={x['path'] for x in t['references']};assert all(x['referencePath'] in paths for x in p['adoptedViews'])
  assert len({(x['referencePath'],v) for x in p['adoptedViews'] for v in x['views']})==sum(len(x['views']) for x in p['adoptedViews']),'duplicate adopted view'
  assert set(t['authorReferenceBindings'])==set(t['instances'])
 tr=next(t for t in ts if t['id']=='cloth:TR02');old=next(x for x in tr['viewPolicy']['adoptedViews'] if x['referencePath']==TR02_OLD);assert old['views']==['profile'],'old notch-free image exceeded side-only scope'
 new=next(x for x in tr['viewPolicy']['adoptedViews'] if x['referencePath']==TR02_NEW);assert new['views']==['OUTSIDE','PROFILE (qualitative side only)','REVERSE','THREE-QUARTER']
 assert next(x for x in tr['references'] if x['path']==TR02_NEW)['sha256']==NEW_SHA
validate(selection)
controls=[]
for label,change in [('dropped-exclusion',lambda d:d['types'][0]['viewPolicy']['excludedElements'].clear()),('duplicate-instance',lambda d:d['types'][0]['instances'].append(d['types'][0]['instances'][0])),('old-TR02-notch-repromotion',lambda d:next(x for t in d['types'] if t['id']=='cloth:TR02' for x in t['viewPolicy']['adoptedViews'] if x['referencePath']==TR02_OLD)['views'].append('outside')),('false-full-assembly',lambda d:d.update(fullAssemblyReady=True))]:
 bad=copy.deepcopy(selection);change(bad)
 try:validate(bad)
 except AssertionError:controls.append(label)
 else:raise AssertionError('undetected negative control '+label)
checks={'types':120,'instances':287,'selectedOriginalPNGs':74,'selectionRoleCounts':role_counts,'groups':dict(Counter(t['group'] for t in selection['types'])),'uniqueTypeAndInstanceIDs':True,'allAuthorPrimaryImagesSelected':True,'allPriorExclusionsPreserved':True,'obsoleteLimitsRetainedAsHistory':True,'everyTypeAdoptedViewsNonempty':True,'explicitEmptyExclusionPolicies':sum(not t['viewPolicy']['excludedElements'] for t in selection['types']),'duplicateAcceptedViewEntries':0,'newTR02SHA256':NEW_SHA,'oldTR02AllowedViews':['profile'],'negativeControlsDetected':controls,'referenceClosure':'conditional-qualitative-reference-closure','requiredNewImageBlockers':[],'fullAssemblyReady':False,'numericAndPortReviewByThisTask':False,'pngCopies':0,'newGeometry':0,'runtimeWrites':0,'remoteWrites':0}
emit('CHECKS.json',checks)
if not args.check:
 (OUT/'RUN.json').write_bytes(encoded({'startedUTC':started,'finishedUTC':datetime.now(timezone.utc).isoformat(),'scriptSeconds':time.perf_counter()-tick,'meaning':'JSON identity/view-policy validation and original-byte hashing only, not production speed or image metrology'}))
print(json.dumps(checks,ensure_ascii=False))
