"""Read-only identity/count check. Does not judge image shape or decode/edit pixels."""
from pathlib import Path
from collections import Counter
import hashlib, json, time
from datetime import datetime, timezone

OUT = Path(__file__).resolve().parent
ROOT = OUT.parent / 'head-reference-set'
CANONICAL = Path('/workspace/scratch/e72662e3b71f/Q-mira-micro-v63/docs/evidence/character-reference-v60/references')
EXPECTED = 'c7672aeec0654c71413fc849cdb75b2760bcb4d6ee9a0113eb0b8b113834d0bb'

def sha(data):
    return hashlib.sha256(data).hexdigest()

def info(path):
    data = path.read_bytes()
    return {'path':str(path), 'bytes':len(data), 'sha256':sha(data)}

t0 = time.perf_counter()
manifest = info(ROOT / 'HASHES.json')
assert manifest['sha256'] == EXPECTED
frozen = json.loads((ROOT / 'HASHES.json').read_text())
c = json.loads((ROOT / 'coverage.json').read_text())
types = c['types']; instances = c['instances']
assert len(types) == len({t['id'] for t in types}) == 40
assert len(instances) == len({i['id'] for i in instances}) == 80
by_type = {t['id']:t for t in types}
counts = Counter(i['type'] for i in instances)
assert set(counts) == set(by_type)
for i in instances:
    assert i['id'] in by_type[i['type']]['instanceIds']
    assert i['image'] == by_type[i['type']]['image']
    assert i['rootTransform'] is None and i['seamCoordinates'] is None
for t in types:
    assert counts[t['id']] == len(t['instanceIds'])
    assert t['dimensions']['finalMillimetres'] is None
    assert not t['imageIsCalibrated'] and not t['exactSeamsRegistered']
    assert not t['fullAssemblyAccepted']
selected = sorted({t['image'] for t in types})
assert len(selected) == 16
files = []
for rel in selected + ['README.md', 'INTERFACES.md', 'coverage.json']:
    row = info(ROOT / rel)
    assert row['sha256'] == frozen[rel]['sha256']
    assert row['bytes'] == frozen[rel]['bytes']
    files.append({'relativePath':rel, **row})
canonical = [info(CANONICAL / p) for p in ['mira-head-views-v1.png','mira-complete-six-views-v1.png']]
result = {
    'recordedAt':datetime.now(timezone.utc).isoformat(),
    'scope':'Metadata identity and reference mapping only; visual decisions are recorded separately in REVIEW.md.',
    'basePR58':'b21985680bb43a3be5a2c4d2244e6b6d24b5af69',
    'inputManifest':manifest, 'manifestEntryCount':len(frozen),
    'allManifestFilesRehashed':False,
    'selectedImagesVisuallyInspected':16,
    'counts':{'leafTypes':len(types),'instances':len(instances),'selectedImages':len(selected)},
    'files':files,'canonicalImages':canonical,
    'coordinateSystem':c['coordinateSystem'],'aliases':c['aliases'],
    'types':[{'id':t['id'],'name':t['name'],'image':t['image'],'instanceIds':t['instanceIds']} for t in types],
    'all80TransformsAndSeamsUnregisteredInFrozenInput':True,
    'all40FinalDimensionsUnregisteredInFrozenInput':True,
    'sourceImageModified':False,'generatedImages':0,'new3D':0,
    'metadataScriptSeconds':time.perf_counter()-t0,
    'excludedLaterWork':'F21 / proposed 41 types and 82 placements, and parallel head-assembly-registration, are not part of this frozen 40/80 review.'
}
(OUT / 'INPUT_READBACK.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'counts':result['counts'],'manifest':manifest['sha256'],'metadataScriptSeconds':result['metadataScriptSeconds']},ensure_ascii=False))
