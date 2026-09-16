from pathlib import Path
import json,hashlib,subprocess,datetime
P=Path(__file__).resolve().parent; R=P.parent/'Q-body-pose-v37'
H=lambda b:hashlib.sha256(b).hexdigest()
expected='04b1a72d8d1f5305dbc0e47dbe10e15c824fd0a29955d5fc08bcb40b8d544a96'
base='337a7e2717d9f130bc6468a45003db2ddddd65db'
src=(R/'src/actor-models.js').read_bytes(); assert H(src)==expected
old=subprocess.check_output(['git','show',base+':src/actor-models.js'],cwd=R)
text=src.decode(); prior=old.decode()
section=lambda s:s[s.index('function animateCape('):s.index('export function animateDetailedActor(')]
assert section(text)==section(prior)
prov=json.loads((R/'src/assets/characters/detailed-provenance.json').read_text()); assert prov['animationRecipe']['sha256']==expected and prov['animationRecipe']['bytes']==len(src)
changed=subprocess.check_output(['git','diff',base,'--name-only','--','src'],cwd=R,text=True).splitlines()
assert changed==['src/actor-models.js','src/assets/characters/detailed-provenance.json']
r=json.loads((P/'report.json').read_text()); b=json.loads((P/'body-report.json').read_text()); f=json.loads((P/'preflight.json').read_text())
assert all(x['sourceHash']==expected for x in [r,b,f]) and f['endSourceHash']==expected
rows=r['terrain']+r['flat']; categories=['skin','rigid','cape']
minimum={k:min(x['after']['groups'][k]['min'] for x in rows) for k in categories}
continuity={k:min(x['worst'][k]['min'] for x in r['continuous'] if x['key']=='after') for k in categories}
assert min(minimum.values())>0 and min(continuity.values())>0
assert all(x['savedError']==0 for x in r['continuous']) and r['firstSeenError']==0
assert all(x['after']['crossed']<=x['before']['crossed'] for x in b['cases'])
assert all(x['after'][k]['min']>0 for x in f['rows'] for k in categories)
attach=max(abs(v-w) for x in rows for u,z in zip(x['before']['topInChest'],x['after']['topInChest']) for v,w in zip(u,z))
assert attach<1e-10
flat=next(x for x in r['flat'] if x['weaponType']=='sword' and x['t']==.8)
now=datetime.datetime.now(datetime.timezone.utc)
summary={'result':'No further required source correction in the bounded reviewed conditions; perceptual/device acceptance not assessed','base':base,'sourceHash':expected,'sourceBytes':len(src),'baselineHash':H(old),'changedSourceFiles':changed,'animateCapeExact':True,'animationProvenanceExact':True,'finishedAt':now.isoformat(),'reviewStart':'2026-09-16T06:50:42Z','elapsedMinutes':(now-datetime.datetime(2026,9,16,6,50,42,tzinfo=datetime.timezone.utc)).total_seconds()/60,'measuredRunSeconds':r['elapsedSeconds'],'terrainCases':len(r['terrain']),'flatCases':len(r['flat']),'pairedTriangleSamples':sum(x[k]['samples'] for x in rows for k in ['before','after']),'minimumMeters':minimum,'continuousMinimumMeters':continuity,'preflightCases':len(f['rows']),'crossingCases':b['cases'],'flatSettled':{k:{'parts':flat[k]['parts'],'lowerBinMedian':flat[k]['lowerBinMedian']} for k in ['before','after']},'attachmentErrorMeters':attach,'worldCovarianceErrorMeters':max(x['maxError'] for x in r['covariance']),'familyContracts':r['contracts'],'continuous':r['continuous'],'firstSeenError':r['firstSeenError'],'boundary':r['boundary']}
(P/'summary.json').write_text(json.dumps(summary,indent=2)+'\n')
# Normalize final log names; preserve the pre-arm trace and pre-arm outputs separately.
if (P/'arm-body-run.txt').exists():
 (P/'body-run.txt').write_bytes((P/'arm-body-run.txt').read_bytes())
 (P/'arm-body-run.txt').unlink()
print(json.dumps({k:summary[k] for k in ['sourceHash','sourceBytes','elapsedMinutes','pairedTriangleSamples','minimumMeters','continuousMinimumMeters','attachmentErrorMeters']}))
