"""Read-only evidence check. This does not judge image correspondence or shape quality."""
from pathlib import Path
from collections import Counter
import hashlib, json, sys
from PIL import Image

root=Path(__file__).resolve().parent
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
manifest=json.loads((root/'HASHES.json').read_text())
for e in manifest['files']:
    p=root/e['path'];assert p.stat().st_size==e['bytes'] and sha(p)==e['sha256'],p
actual={str(p.relative_to(root)) for p in root.rglob('*') if p.is_file() and p.name!='HASHES.json'}
assert actual=={e['path'] for e in manifest['files']}
coverage=json.loads((root/'TYPE_REFERENCE_COVERAGE.json').read_text())
plan=json.loads((root/'original-plans/HANDS_BOOTS_MICRO_PLAN.json').read_text())
assert coverage['instances']==plan['instances']
counts=Counter(x['type'] for x in coverage['instances'])
assert len(coverage['instances'])==len({x['id'] for x in coverage['instances']})==90
assert len(coverage['types'])==21
for t in coverage['types']:
    assert counts[t['id']]==t['count']==len(t['instanceIDs'])
    assert (root/t['selectedImage']).exists()
assert {t['id'] for t in coverage['types'] if t['blockingVisualBoundary']}=={'AH07','AB01','AB03'}
assert coverage['allTypesPictured'] and not coverage['allTypesFullyAccepted']
calls=json.loads((root/'GENERATIONS.json').read_text())['calls']
assert len(calls)==13 and Counter(c['version'] for c in calls)=={1:8,2:5}
for c in calls:
    p=root/c['copy'];assert sha(p)==c['sha256'] and p.stat().st_size==c['bytes']
    assert sha(root/c['prompt'])==c['promptSHA256']
    with Image.open(p) as im:im.verify()
    if '--external-inputs' in sys.argv:assert p.read_bytes()==Path(c['originalPath']).read_bytes()
print(json.dumps({'manifestFiles':len(manifest['files']),'payloadBytes':sum(e['bytes'] for e in manifest['files']),
 'PNGs':13,'types':21,'instances':90,'unresolvedVisualTypes':['AH07','AB01','AB03'],
 'allTypesFullyAccepted':False,'pendingCalls':0,'externalRawCopiesChecked':'--external-inputs' in sys.argv}))
