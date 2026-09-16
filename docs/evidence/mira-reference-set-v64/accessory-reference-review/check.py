"""One byte/coverage boundary check; no runtime tests, image edits or new geometry."""
from pathlib import Path
import hashlib, json, struct, datetime, time

START=time.perf_counter()
ROOT=Path('/workspace/scratch/e72662e3b71f')
SRC=ROOT/'q-character-reference-v64/accessory-reference-set'
OUT=Path(__file__).resolve().parent
sha=lambda b:hashlib.sha256(b).hexdigest()
def dump(n,d):(OUT/n).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
mb=(SRC/'HASHES.json').read_bytes()
assert sha(mb)=='8062555932a2bde04ec4bc635bf6bad5c435d575a780936979c2a351c170680e'
manifest=json.loads(mb); rows=manifest['files']; assert len(rows)==54
png=[]
for r in rows:
    b=(SRC/r['path']).read_bytes()
    assert len(b)==r['bytes'] and sha(b)==r['sha256'],r['path']
    if r['path'].endswith('.png'):
        assert b[:8]==b'\x89PNG\r\n\x1a\n'
        png.append({**r,'dimensions':list(struct.unpack('>II',b[16:24])),'viewedWithViewImage':True})
assert len(png)==13
c=json.loads((SRC/'TYPE_REFERENCE_COVERAGE.json').read_text())
a=json.loads((SRC/'ASSEMBLY_BOUNDARIES.json').read_text())
plan=json.loads((SRC/'original-plans/HANDS_BOOTS_MICRO_PLAN.json').read_text())
assert len(c['types'])==21 and len(c['instances'])==90
assert len({x['id'] for x in c['types']})==21 and len({x['id'] for x in c['instances']})==90
assert c['instances']==plan['instances']
known={r['path'] for r in rows}
for t in c['types']:
    actual=[p['id'] for p in c['instances'] if p['type']==t['id']]
    assert actual==t['instanceIDs'] and len(actual)==t['count']
    assert t['selectedImage'] in known
counts={prefix:dict(types=sum(t['id'].startswith(prefix) for t in c['types']),instances=sum(p['type'].startswith(prefix) for p in c['instances'])) for prefix in ['AH','AB']}
assert counts=={'AH':{'types':10,'instances':56},'AB':{'types':11,'instances':34}}
assert len(a['ports'])==4 and all(p['validated'] is False and p['registeredCurve'] is None for p in a['ports'])
for n in ['TYPE_REFERENCE_COVERAGE.json','ASSEMBLY_BOUNDARIES.json','HASHES.json']:
    (OUT/('snapshot-'+n)).write_bytes((SRC/n).read_bytes())
canonical=[]
for n in ['mira-complete-six-views-v1.png','mira-hands-staff-views-v1.png','mira-lower-views-v1.png']:
    p=ROOT/'Q-mira-micro-v63/docs/evidence/character-reference-v60/references'/n;b=p.read_bytes()
    canonical.append({'path':str(p),'bytes':len(b),'sha256':sha(b),'viewed':True,'cameraCalibrated':False})
dump('READBACK.json',{'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'inputManifestSHA256':sha(mb),
 'verifiedFiles':54,'verifiedPNGCount':13,'rawPNGs':png,'canonicalReferences':canonical,'counts':counts,
 'all90LegacyInstancesPreserved':True,'all21TypeImageMappingsResolve':True,'all90InstancesDistinct':True,
 'allTypesPictured':True,'allTypesReadyForFabrication':False,'assemblyBoundaryPorts':4,'registeredPorts':0,
 'scope':'Source byte and declared coverage readback. Visual findings are separate and independent. No copied author test PASS is used as geometric or visual evidence.',
 'newGeometry':0,'newImages':0,'sourceEdits':0,'imageEdits':0,'unfinishedSessions':0,'scriptSeconds':time.perf_counter()-START})
print(json.dumps({'files':54,'images':13,'types':21,'placements':90,'counts':counts,'scriptSeconds':time.perf_counter()-START}))
