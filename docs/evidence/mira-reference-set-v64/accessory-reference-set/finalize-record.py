"""Freeze reference metadata; never modifies raster pixels or any game source."""
from pathlib import Path
from collections import Counter
from datetime import datetime, timezone
import hashlib, json
from PIL import Image

ROOT = Path(__file__).resolve().parent
# The sibling source directory is named independently of this v64 output.
ORIGINAL = ROOT.parent.parent / 'q-character-reference-v60'
PLAN_DIR = ORIGINAL / 'micro-part-planning/accessories'
REF_DIR = ORIGINAL / 'references'
LEDGER = ROOT.parent / 'whole-assembly-ledger'
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def write(name, value): (ROOT/name).write_text(json.dumps(value, ensure_ascii=False, indent=2)+'\n')
def parse(s): return datetime.fromisoformat(s.replace('Z','+00:00'))

plan = json.loads((ROOT/'original-plans/HANDS_BOOTS_MICRO_PLAN.json').read_text())
for p in (ROOT/'original-plans').iterdir():
    assert p.read_bytes() == (PLAN_DIR/p.name).read_bytes(), p

# Shape-family selections are deliberately weaker than an accepted construction template.
# Each tuple records image, selected views, excluded views/details, unresolved visual issue.
selections = {
 'AH01': ('AHB-01-v2.png', ['outer','reverse','edge','oblique'], ['v1 complete finger-root tubes'], ''),
 'AH02': ('AHB-01-v2.png', ['outer','reverse','edge','oblique'], ['v1 glove-like wraparound'], ''),
 'AH03': ('AHB-01-v2.png', ['outer','reverse','edge','oblique'], ['v1 full-hand coverage'], ''),
 'AH04': ('AHB-02-v1.png', ['outer','reverse','edge','oblique'], ['illustrative thick border as a physical skin rim'], ''),
 'AH05': ('AHB-02-v1.png', ['outer','reverse','edge','oblique'], ['illustrative thick border as a physical skin rim'], ''),
 'AH06': ('AHB-03-v1.png', ['dorsal','palmar','side','oblique/open ends'], [], ''),
 'AH07': ('AHB-03-v2.png', ['palmar pad','side silhouette','oblique silhouette','open proximal end'], ['dorsal oval as proof of an empty bare nail bed'], 'The pink dorsal oval remains nail-like; the AH07 skin versus AH08 plate partition is unresolved.'),
 'AH08': ('AHB-04-v1.png', ['outer','side','oblique'], ['reverse flared corners as exact perimeter'], ''),
 'AH09': ('AHB-02-v1.png', ['outer','reverse','edge','oblique'], ['illustrative thick border as a physical skin rim'], ''),
 'AH10': ('AHB-04-v1.png', ['front','side','oblique'], ['reverse unmarked cutaway as true outside rear'], ''),
 'AB01': ('AHB-05-v2.png', ['top outline','bottom outline'], ['side/oblique heel step as an accepted sole/heel division','v1 duplicated heel block and fasteners'], 'The rear thickened step still leaves AB01 versus AB02 vertical partition ambiguous.'),
 'AB02': ('AHB-05-v1.png', ['top attachment','bottom four fastener seats','side','oblique'], [], ''),
 'AB03': ('AHB-06-v2.png', ['front open patch','reverse open patch','oblique open patch'], ['side closed ankle opening','v1 closed ankle ring','v1 right +X text'], 'The side view still implies a complete ankle hole while the other views show an open vamp patch.'),
 'AB04': ('AHB-06-v1.png', ['outer','inner','side','oblique'], ['right +X text','stitch/welt-like image rim as extra approved hardware'], ''),
 'AB05': ('AHB-06-v2.png', ['outer','inner','side','oblique','medial counterpart outline'], ['v1 closed ankle ring','dark background as material colour truth'], ''),
 'AB06': ('AHB-07-v1.png', ['outer','inner','side','oblique'], ['invented pair of side rivets'], ''),
 'AB07': ('AHB-07-v1.png', ['front','back','side','oblique/open ends'], [], ''),
 'AB08': ('AHB-07-v1.png', ['front','back','side','oblique/open ends'], [], ''),
 'AB09': ('AHB-08-v2.png', ['flat front','flat reverse','edge','oblique'], ['v1 S/spiral blank as a flat template'], ''),
 'AB10': ('AHB-08-v1.png', ['top','underside','oblique'], ['straight schematic side as full corresponding silhouette','added heel clasp/block'], ''),
 'AB11': ('AHB-05-v1.png', ['front','reverse','edge','oblique'], [], ''),
}
counts = Counter(x['type'] for x in plan['instances'])
assert len(plan['instances']) == len({x['id'] for x in plan['instances']}) == 90
assert len(selections) == len(plan['types']) == 21
types = []
for t in plan['types']:
    f,views,excluded,issue = selections[t['id']]
    assert counts[t['id']] == t['count'] and (ROOT/f).exists()
    types.append({**t, 'wholeLedgerKey': ('hands:' if t['id'].startswith('AH') else 'boots:')+t['id'],
      'selectedImage': f, 'selectedViews': views, 'excluded': excluded,
      'status': 'needs_partition_resolution' if issue else 'conditional_shape_family',
      'unresolvedVisualIssue': issue or None,
      'blockingVisualBoundary': {
        'AH07': {'view':'AHB-03-v2 dorsal / pink oval', 'owners':['hands:AH07 fingertip skin','hands:AH08 separate nail plate'], 'symptom':'The oval can be interpreted as a nail already integrated into the skin; adding AH08 could duplicate the plate.', 'notFixed':'Bare skin nail-seat contour, depth and plate underside contact are not established.'},
        'AB01': {'view':'AHB-05-v2 true side and oblique / rear thick step', 'owners':['boots:AB01 continuous outsole','boots:AB02 separate heel block'], 'symptom':'The outsole may already contain the heel elevation, so a second AB02 could duplicate heel thickness.', 'notFixed':'AB01 underside at heel, AB02 top seat and their vertical partition are not established; top/bottom outlines alone do not settle this.'},
        'AB03': {'view':'AHB-06-v2 side / closed ankle opening versus front-reverse-oblique open patch', 'owners':['boots:AB03 front vamp','boots:AB05 side quarters','boots:AB07 ankle/shin tube'], 'symptom':'The side view closes a ring that belongs to the assembled ankle, duplicating rear/side coverage if used as one vamp.', 'notFixed':'Vamp upper open edge and side edges shared with AB05/AB07 are not a mutually consistent multi-view boundary.'}
      }.get(t['id']),
      'exactSharedBoundaryAccepted': False,
      'instanceIDs': [x['id'] for x in plan['instances'] if x['type']==t['id']]})
coverage = {
 'schema':1,'status':'All 21 types pictured; selection is partial/conditional, not full construction acceptance.',
 'counts': {'handTypes':10,'handInstances':56,'bootTypes':11,'bootInstances':34,'types':21,'instances':90,
            'initialSheets':8,'targetedCorrections':5,'rawImages':13,'additionalTypes':0,'new3DParts':0,
            'typesWithExplicitRemainingVisualPartitionIssue':3},
 'allTypesPictured':True,'allTypesFullyAccepted':False,'wholePersonReferenceSetComplete':False,
 'frames':plan['frames'],'ownership':plan['ownership'],
 'types':types,'instances':plan['instances'],
 'instanceRegistrationStatus':'Legacy author proposals copied unchanged; no bone matrices, shared curves, grip solve or final counterpart geometry implemented.',
 'openVersusGrip':{'right':'Canonical anatomical R = actor -X / hand-0, staff grip.',
                  'left':'Canonical L = actor +X / hand-1, relaxed/open.',
                  'generatedPartPose':'Open isolated part references establish surface families; they are not a solved assembled grasp.',
                  'gripBoundary':'AH01/AH03/AH06/AH07/AH09 to staff:S04/S05 remains unregistered.'},
 'necessaryContracts':plan['necessary_contracts'],
 'generalRemainingBoundaries':[
   'AH01/AH02/AH03/AH04/AH05/AH09 must share a single registered perimeter network and four ordinary digit ports plus a thumb port.',
   'AH06/AH07 joints require identical boundary positions, weights and normals. Separate individually capped sausage joints are not allowed.',
   'AH08 needs a common seat with AH07. AH08 reverse-border inconsistency is excluded, not solved by the remaining images.',
   'AB03/AB04/AB05/AB06/AB07 require one common lower perimeter/ankle opening; AB01/AB02 require a single vertical partition.',
   'AB09 hidden wrapping routes and counterpart sole construction remain author design proposals; no extra buckles/rivets/clasps are admitted.'
 ],
 'runtimeEdits':0,'imagePixelEdits':0,'pendingCalls':0,
 'limits':'Generated drawings are appearance references, not CAD, shared-vertex proof, native meshes, WebGL frames, device tests or PS4 quality proof.'}
write('TYPE_REFERENCE_COVERAGE.json',coverage)

ports=[]
for side,idx in [('R',0),('L',1)]:
    ports.append({'portID':'right-wrist' if side=='R' else 'left-wrist',
       'fromInstance':f'{side}-wrist','fromType':'hands:AH10',
       'directToInstances':[f'cloth:F01-{side}',f'cloth:F02-{side}'],
       'nearbyClothInstances':[f'cloth:S05-{side}',f'cloth:S06-{side}',f'cloth:F03-{side}-0',f'cloth:F03-{side}-1',f'cloth:F03-{side}-2'],
       'registration':{'frame':f'hand-{idx} local','legacySkinYRangeMm':[-15,9],
                       'skinBoundary':'AH01/AH02/AH03/AH04 proximal loop',
                       'clothBoundary':'F01/F02 bottom WRIST aperture; not the S05/S06 CUFF top'},
       'contactKind':'Layered cloth-over-skin overlap, not a skin/cloth vertex weld.',
       'required':'Register wrist curve to the cuff aperture in one frame; bound clearance through relaxed/grip poses. Skin-to-skin weights/normals must agree.',
       'registeredCurve':None,'commonFrameTransform':None,'clearanceMm':None,'validated':False})
    ports.append({'portID':f'{side}-trousers-to-boots','fromInstance':None,
       'fromType':None,'toInstances':[f'{side}-boot-shaft',f'{side}-boot-rim'],
       'toTypes':['boots:AB07','boots:AB08'],
       'registration':{'frame':f'foot-{idx} local','legacyBootTopFootYmm':340,'legacyBootTopKneeYmm':-95,
                       'supportMinFootYmm':-108,'existingBones':[f'knee-{idx}',f'foot-{idx}']},
       'contactKind':'Trouser hem under boot shaft/rim; it is not the outer long-coat hem.',
       'required':'Trouser microtype/leaf ownership is absent in the whole ledger; register hem loop, cloth overlap, leg clearance and knee/foot weights before assembly.',
       'registeredCurve':None,'commonFrameTransform':None,'clearanceMm':None,'validated':False})
write('ASSEMBLY_BOUNDARIES.json',{'schema':1,'source':'whole-assembly-ledger/ASSEMBLY_INTERFACES.json',
 'sourceSHA256':sha(LEDGER/'ASSEMBLY_INTERFACES.json'),'ports':ports,
 'scope':'Only minimum wrist join skin belongs to this unit; cloth cuffs and trousers remain external ownership. No full hidden body added.'})

receipts=[]
for p in sorted(ROOT.glob('AHB-*-generation-v*.json')):
    d=json.loads(p.read_text()); image=ROOT/d['copy']; raw=Path(d['originalPath'])
    assert d['state']=='returned' and image.read_bytes()==raw.read_bytes()
    assert sha(image)==d['sha256'] and image.stat().st_size==d['bytes']
    with Image.open(image) as im:
        im.verify()
    with Image.open(image) as im:
        assert list(im.size)==d['size'] and im.mode==d['mode']
    version=d.get('version',int(image.stem[-1]));assert version in [1,2]
    prompt=ROOT/f'prompts/{d["id"]}-v{version}.txt';assert prompt.exists()
    receipts.append({**d,'version':version,'prompt':str(prompt.relative_to(ROOT)),
                     'promptSHA256':sha(prompt),'durationSeconds':(parse(d['end'])-parse(d['start'])).total_seconds()})
assert len(receipts)==13 and len(list(ROOT.glob('*.png')))==13
assert Counter(r['version'] for r in receipts)=={1:8,2:5}
intervals=sorted((parse(r['start']),parse(r['end'])) for r in receipts)
merged=[]
for start,end in intervals:
    if merged and start<=merged[-1][1]: merged[-1][1]=max(merged[-1][1],end)
    else: merged.append([start,end])
write('GENERATIONS.json',{'tool':'image_gen.imagegen','initialCalls':8,'targetedCorrectionCalls':5,
 'returnedCalls':13,'pendingCalls':0,'maxTargetedCorrectionsPerSheet':1,'calls':receipts,
 'inputs':'Original full PNGs and associated first-sheet outputs were visually referenced. See INPUTS.json and exact saved prompt texts; no raster edited with code.',
 'originalToolResponseImagesDelivered':True})
write('TIMING.json',{'clock':'UTC call start/end recorded during generation',
 'firstCallStart':min(r['start'] for r in receipts),'lastCallEnd':max(r['end'] for r in receipts),
 'generationWindowSeconds':(max(b for a,b in intervals)-min(a for a,b in intervals)).total_seconds(),
 'sumCallDurationsSeconds':sum(r['durationSeconds'] for r in receipts),
 'unionPendingSeconds':sum((b-a).total_seconds() for a,b in merged),
 'pendingIntervals':[[a.isoformat(),b.isoformat()] for a,b in merged],
 'note':'Concurrent durations must not be added and called elapsed production time. Planning/visual judgement/final documentation were interleaved and not separately stopwatched.',
 'nativeImplementationSeconds':0,'new3DAssemblySeconds':0,'pendingCalls':0,
 'recordFrozenUTC':datetime.now(timezone.utc).isoformat()})
inputs=[]
for ref in plan['references']:
    p=REF_DIR/ref['file'];assert sha(p)==ref['sha256']
    inputs.append({'path':str(p),'sha256':sha(p),'bytes':p.stat().st_size,
                   'viewed':True,'role':'Fixed full character or part reference; generated artwork, not a captured real person/game render.'})
for p in sorted((ROOT/'original-plans').iterdir()):
    inputs.append({'path':str(p.relative_to(ROOT)),'sha256':sha(p),'bytes':p.stat().st_size,
                   'role':'Byte-identical original plan. Its old generated=0 status is historical; current counts are in TYPE_REFERENCE_COVERAGE.json.'})
write('INPUTS.json',{'inputs':inputs,'generationSkill':'e0/.system/imagegen',
 'provenance':'New PNGs are original OpenAI imagegen outputs for this unit, not CC0 photographs, game screenshots or exported CAD.',
 'storage':'Raw response PNG bytes copied unchanged to the requested project evidence directory; originals retained at paths recorded in the receipts.'})
write('VERIFICATION.json',{'rawPNGByteMatches':13,'validPNGDecodes':13,'promptFiles':13,
 'uniqueTypeIDs':21,'uniqueInstanceIDs':90,'perTypeCountsMatchOriginal':True,
 'originalPlanFilesByteIdentical':3,'originalReferenceHashesMatch':3,
 'pixelEdits':0,'runtimeSourceEdits':0,'new3D':0,'pendingCalls':0,
 'notChecked':['native shared edges/weights/normals','watertight assembled hands or boots','grip solve','WebGL appearance','device performance','PS4-equivalent quality']})
print(json.dumps({'types':21,'instances':90,'images':13,'imageBytes':sum(r['bytes'] for r in receipts),'pending':0}))
