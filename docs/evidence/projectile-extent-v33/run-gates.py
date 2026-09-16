from pathlib import Path
import subprocess,time,json
root=Path(__file__).resolve().parents[3]
out=Path(__file__).resolve().parent
commands=[
('tests',['npm','test']),('main-runtime',['node','scripts/verify-main-runtime.mjs']),
('archery',['node','scripts/verify-archery-contact.mjs',str(out/'archery.json')]),
('loaded-arrow',['node','scripts/verify-loaded-arrow.mjs',str(out/'loaded-surface.json')]),
('projectile-budget',['node','scripts/verify-projectile-budget.mjs',str(out/'budget.json')]),
('grounding',['node','scripts/verify-architecture-grounding.mjs']),('settlement',['node','scripts/verify-settlement-contact.mjs']),
('scene',['node','scripts/verify-scene-integration.mjs']),('journey',['npm','run','test:journey']),
('crossing',['npm','run','test:crossing']),('session',['npm','run','test:session']),
('build',['npm','run','build']),('package',['npm','run','package']),('artifacts',['npm','run','test:artifacts'])]
results=[]
for name,command in commands:
 start=time.time()
 with (out/(name+'.txt')).open('w') as log: result=subprocess.run(command,cwd=root,stdout=log,stderr=subprocess.STDOUT)
 record=dict(name=name,command=command,exit=result.returncode,seconds=round(time.time()-start,3));results.append(record)
 (out/'gates.json').write_text(json.dumps(results,indent=2)+'\n')
 print(json.dumps(record),flush=True)
 if result.returncode:raise SystemExit(result.returncode)
