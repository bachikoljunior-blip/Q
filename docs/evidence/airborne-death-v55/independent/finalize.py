import json, hashlib
from pathlib import Path
from datetime import datetime, timezone

here=Path(__file__).resolve().parent
root=here.parent/'Q-airborne-death-v55'
actor=here.parent/'Q-death-recovery-v52'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
final=json.loads((here/'final.json').read_text())
contact=json.loads((here/'contact.json').read_text())
before=json.loads((here/'candidate.json').read_text())
for file,h in final['sourceHashes'].items(): assert sha(root/file)==h,file
assert sha(actor/'src/actor-models.js')==contact['actorHash']
assert sha(root/'src/scene.js')==contact['sceneHash']
assert all(r['maxExpectedError']==0 and r['finalGap']==0 and r['grounded'] for r in final['core'][:12])
assert all(r['allGameExact'] for r in final['lifecycle'])
for r in final['lifecycle']:
    assert not r['errors']
    if r['mode']!='title': assert r['resumed']['y']!=r['after']['y'] and r['resumedSceneDt']>0,r
    if r['mode'] in ['settings','hidden','blur','pagehide']: assert r['deathPanelVisible'],r
for r in final['main']:
    if 'fps' in r: assert r['end']['grounded'] and r['end']['y']==r['floor'] and not r['errors']
    if r.get('actualEnemyMelee'): assert r['landed']['grounded'] and r['deathPenalty']==80 and not r['errors']
    if 'longFrameMs' in r:
        assert r['sceneDt']==.05
        assert abs(r['after']['vertical']-(r['before']['vertical']-21*.05))<1e-12
assert len(contact['results'])==18
minimum=min(r['variants']['candidate']['minimum']['all'] for r in contact['results'])
assert minimum>0
fixed=[r['mode'] for r in before['lifecycle'] if not r['allGameExact']]
assert fixed==['blur','pagehide']
report={'at':datetime.now(timezone.utc).isoformat(),'firstExplicitClock':'2026-09-16T09:08:28+00:00',
 'status':'PASS within the declared source/API/CPU scope; required blur/pagehide regression corrected',
 'requiredFindings':[{'id':'dead-interruption','firstMainHash':before['sourceHashes']['src/main.js'],'cases':fixed,'finalDisposition':'corrected; final freeze and resume checks pass'}],
 'sourceHashes':final['sourceHashes'],'actorCommit':'e58994a182cfac8714d12f89d9ab9244ce0e4ed5','actorHash':contact['actorHash'],'sceneHash':contact['sceneHash'],
 'coreTrajectoryCases':12,'aliveDtCases':5,'mainRafRates':[30,60,120],'actualEnemyMeleeDeath':True,'lifecycleModes':[r['mode'] for r in final['lifecycle']],
 'contactCases':18,'continuousFramesPerCasePerVariant':72,'minimumVisibleVertexGapM':minimum,'finalVisibleMinimumGapM':[r['variants']['candidate']['frames'][-1]['metric']['all'] for r in contact['results']],
 'saveContract':'dead snapshot preserves current vertical fields; loading a dead save respawns under unchanged existing contract; penalty once; alive periodic save clock not advanced while dead',
 'limitations':['Explicit DOM/SceneView/audio boundary doubles for actual main execution, no browser layout/native event scheduling.', 'Actual SceneView player prefix and Three CPU vertex deformation only; not full SceneView rendering, triangle interiors or WebGL.', 'No auditory, device CPU/GPU/peak-memory or perceptual PS4 acceptance.', 'Final regression/build/staging gates remain author/integrator-owned.'],
 'sessionsPending':False,'sourceWrites':False}
(here/'summary.json').write_text(json.dumps(report,indent=2)+'\n')
files={p.name:{'bytes':p.stat().st_size,'sha256':sha(p)} for p in sorted(here.iterdir()) if p.is_file() and p.name!='HASHES.json'}
(here/'HASHES.json').write_text(json.dumps({'at':report['at'],'files':files},indent=2)+'\n')
print(json.dumps({'files':len(files),'reviewHash':files['REVIEW.md']['sha256'],'manifestHash':sha(here/'HASHES.json'),'sourceHashes':report['sourceHashes'],'minimumGap':minimum},indent=2))
