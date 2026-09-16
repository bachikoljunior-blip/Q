"""Light identity/count check for the visually reviewed selection, not a geometry test."""
from pathlib import Path
from collections import Counter
from datetime import datetime, timezone
import hashlib, json, time

OUT = Path(__file__).resolve().parent
ROOT = OUT.parent / 'cloth-reference-set'
CAN = Path('/workspace/scratch/e72662e3b71f/Q-mira-micro-v63/docs/evidence/character-reference-v60/references')
EXPECTED = '8e3dc0c0e582731fd6e9b5dfe2dc1aa751433d21bdef39b8c4f3a2d52ef91059'

def record(path):
    path = Path(path)
    data = path.read_bytes()
    return {'path':str(path),'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}

t0 = time.perf_counter()
manifest = record(ROOT / 'HASHES.json')
assert manifest['sha256'] == EXPECTED
source_manifest = json.loads((ROOT / 'HASHES.json').read_text())
mf = {r['path']:r for r in source_manifest['files']}
c = json.loads((ROOT / 'COVERAGE.json').read_text())
a = json.loads((ROOT / 'ASSEMBLY.json').read_text())
types = c['types']; instances = c['instances']
assert len(types) == len({t['typeID'] for t in types}) == 40
assert len(instances) == len({i['id'] for i in instances}) == 96
by_type = {t['typeID']:t for t in types}
counts = Counter(i['type'] for i in instances)
assert set(counts) == set(by_type)
for t in types:
    assert set(t['instances']) == {i['id'] for i in instances if i['type'] == t['typeID']}
    assert counts[t['typeID']] == len(t['instances'])
selected = {t['selectedImage']:t['sha256'] for t in types}
assert len(selected) == 30
images=[]
for path,expected in selected.items():
    row=record(path)
    assert row['sha256'] == expected
    images.append(row)
rejected=[]
for name in ['TR01-v1.png','TR01-v2.png','TR02-v1.png','TR02-v2.png']:
    row=record(ROOT / name)
    assert row['sha256'] == mf[name]['sha256']
    rejected.append(row)
documents=[]
for name in ['COVERAGE.json','ASSEMBLY.json','REVIEW.md','CALLS.json']:
    row=record(ROOT / name)
    assert row['sha256'] == mf[name]['sha256']
    documents.append(row)
assert len(a['interfaces']) == len({i['id'] for i in a['interfaces']}) == 31
assert not c['allNumericalSeamsClosed']
inst={i['id']:i for i in instances}
assert inst['B02-R']['anatomicalSide'] == inst['B03-hanger-R']['anatomicalSide'] == 'Left (+X)'
for prefix in ['T02','F03']:
    for i in instances:
        if i['type'] == prefix:
            assert i['anatomicalSide'] == ('Right (-X)' if '-R' in i['id'] else 'Left (+X)')
calls=json.loads((ROOT / 'CALLS.json').read_text())['calls']
method_b=[r for r in calls if r['id'] in ['TR01-method-b','TR02-method-b']]
assert len(method_b)==2 and all(r['referencePaths']==[] for r in method_b)
can_names=['mira-complete-six-views-v1.png','mira-garment-assembly-v1.png','mira-upper-views-v1.png','mira-cape-views-v2.png','mira-lower-views-v1.png','mira-hands-staff-views-v1.png']
j={'recordedAt':datetime.now(timezone.utc).isoformat(),'scope':'Selected visual references and semantic inventory, not precise projection or actual geometry','inputManifest':manifest,'manifestEntriesExcludingManifest':len(mf),'inputFilesIncludingManifest':len(mf)+1,'all103FilesRehashed':False,'all37NewRawPNGRehashed':False,'counts':{'leafTypes':len(types),'instances':len(instances),'selectedImages':len(images),'rejectedTrouserComparisons':len(rejected),'canonicalImages':len(can_names),'semanticInterfaces':len(a['interfaces'])},'selectedImages':images,'rejectedTrouserImages':rejected,'canonicalImages':[record(CAN/n) for n in can_names],'inputDocuments':documents,'types':[{'id':t['typeID'],'name':t['name'],'instances':t['instances'],'image':t['selectedImage'],'dimensionStatus':t['dimensionStatus'],'edgeContract':t['edgeContract']} for t in types],'placementCorrections':[inst['B02-R'],inst['B03-hanger-R']],'methodBReferencePathsEmptyInSavedAuthorReceipts':True,'receiptIsIndependentServiceLog':False,'sourceOrImageChanges':0,'new3D':0,'metadataScriptSeconds':time.perf_counter()-t0}
(OUT/'INPUT_READBACK.json').write_text(json.dumps(j,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'counts':j['counts'],'manifestEntriesExcludingManifest':len(mf),'metadataScriptSeconds':j['metadataScriptSeconds']},ensure_ascii=False))
