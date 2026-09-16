import json, pathlib, subprocess, time, datetime
root=pathlib.Path(__file__).resolve().parents[1]
out=root/'artifacts/recovery-v52-gates'
out.mkdir(parents=True,exist_ok=True)
commands=[['node', 'scripts/generate-vault-assets.mjs', '--verify'], ['node', 'scripts/verify-soundscape.mjs'], ['python', 'scripts/verify-native-score.py', 'artifacts/native-audio-recovery-v52'], ['node', 'scripts/verify-native-audio.mjs', 'artifacts/native-audio-recovery-v52'], ['node', 'scripts/verify-main-runtime.mjs'], ['node', 'scripts/verify-gathering-runtime.mjs'], ['npm', 'run', 'test:vaults'], ['npm', 'test'], ['node', 'scripts/verify-archery-contact.mjs', 'artifacts/archery-contact-report.json'], ['node', 'scripts/verify-loaded-arrow.mjs', 'artifacts/loaded-arrow-report.json'], ['node', 'scripts/verify-projectile-budget.mjs', 'artifacts/projectile-budget-report.json'], ['node', 'scripts/verify-dialogue-framing.mjs', 'artifacts/dialogue-framing-report.json'], ['node', 'scripts/verify-world-surfaces.mjs'], ['node', 'scripts/verify-architecture-grounding.mjs', 'artifacts/architecture-grounding-report.json'], ['node', 'scripts/verify-settlement-contact.mjs', 'artifacts/settlement-contact-report.json'], ['node', 'scripts/verify-scene-integration.mjs', '.', 'artifacts/scene-integration-report.json'], ['node', 'scripts/verify-sky-integration.mjs', '.', 'artifacts/sky-integration-report.json'], ['npm', 'run', 'test:journey'], ['npm', 'run', 'test:crossing'], ['npm', 'run', 'test:forge'], ['npm', 'run', 'test:session'], ['npm', 'run', 'test:expedition'], ['npm', 'run', 'review:combat'], ['npm', 'run', 'compare:touch'], ['npm', 'run', 'build'], ['npm', 'run', 'package'], ['npm', 'run', 'test:artifacts']]
report={'startedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'Fresh reconstructed runtime source, Node boundaries and byte-preserving artifacts; not WebGL/listening/device acceptance','commands':[]}
start=time.monotonic()
for n,cmd in enumerate(commands,1):
 t=time.monotonic()
 with (out/f'{n:02}.txt').open('w') as log:r=subprocess.run(cmd,cwd=root,stdout=log,stderr=subprocess.STDOUT)
 report['commands'].append({'argv':cmd,'exitCode':r.returncode,'seconds':time.monotonic()-t,'log':f'{n:02}.txt'})
 report['elapsedSeconds']=time.monotonic()-start
 report['passed']=r.returncode==0 and n==len(commands)
 (out/'validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(f'{n}/{len(commands)} exit={r.returncode} seconds={report["commands"][-1]["seconds"]:.3f}: '+ ' '.join(cmd),flush=True)
 if r.returncode:raise SystemExit(r.returncode)
