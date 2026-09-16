from pathlib import Path
import json,hashlib,subprocess,datetime
out=Path(__file__).resolve().parent
root=out.parent/'Q-cloak-ground-v34'
base='39e47a4fa204ea6576c685bf25569727e410cd01'
expected='d3f543c2537cd076dfe18ad05ca815374f242dda64847e01421844fc7a0d23fc'
hash=lambda b:hashlib.sha256(b).hexdigest()
r=json.loads((out/'report.json').read_text()); b=json.loads((out/'body-report.json').read_text())
s=(root/'src/actor-models.js').read_bytes(); old=subprocess.check_output(['git','show',base+':src/actor-models.js'],cwd=root)
assert hash(s)==r['sourceHash']==b['sourceHash']==expected
text=s.decode(); i=text.index("  if(motion.state==='death'){",text.index('function animateCape(actor,motion){')); j=text.index("  const moving=['walk','run']",i)
assert (text[:i]+text[j:]).encode()==old
provenance=json.loads((root/'src/assets/characters/detailed-provenance.json').read_text())['animationRecipe']
assert provenance['sha256']==expected and provenance['bytes']==len(s)==31704
assert len(r['terrain'])==108 and len(b['cases'])==20
assert all(x['after']['minGap']>=min(x['before']['minGap']-1e-6,-1e-5) for x in r['terrain'])
negative=[x for x in r['terrain'] if x['after']['minGap']< -1e-5]
assert len(negative)==6 and all(x['before']['minGap']==x['after']['minGap'] for x in negative)
assert all(x['after']['crossed']<=x['before']['crossed'] for x in b['cases'])
assert len(r['liveClock'])==12 and all(x['maxError']==0 for x in r['liveClock'])
assert len(r['saved'])==20 and all(x['historyError']==0 for x in r['saved'])
assert all(x['nonDeathCapeExact'] and x['allOtherActorStateExact'] for x in r['nonDeath'])
assert all(x['nonCapeExact'] and x['minGap']>.0119999 for x in r['rates'])
assert max(x['maxError'] for x in r['covariance'])<2e-6
sourcefiles=['src/actor-models.js','src/assets/characters/detailed-provenance.json','src/scene.js','src/character-motion.js','src/rigged-actor.js']
result={'base':base,'reviewedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'actorSourceHash':expected,'sourceFiles':{p:{'sha256':hash((root/p).read_bytes()),'bytes':(root/p).stat().st_size} for p in sourcefiles},'onlyRuntimeChange':'Inserted animateCape death branch; remainder of actor source byte exact to base. Other changed src file is provenance only.','nativeGeometryRunAt':r['at'],'bodyRunAt':b['at'],'nativeGeometryWallSeconds':r['elapsedSeconds'],'newlyWorsenedTerrainCases':0,'originalNecklinePenetrationCasesRetainedExact':6,'sampledTerrainCases':108,'increasedProperUpperBodyCrossingCases':0,'properUpperBodyCases':20,'liveSavedClockError':0,'savedHistoryError':0,'worldCovarianceMaxError':max(x['maxError'] for x in r['covariance']),'verdict':'No remaining required source correction within this bounded review. Actual rendering, perception, full cloth contact and device performance remain unverified.'}
(out/'final-checks.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result,indent=2))
