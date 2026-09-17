from pathlib import Path
import json,math,collections,hashlib,datetime,sys
base=Path(__file__).resolve().parents[2]
inputs=[('head',base.parent/'Q-head-registration-v65/docs/evidence/mira-assembly-v65/head-registration/registration.json','curves','positionM'),('cloth',base.parent/'Q-cloth-registration-v65/docs/evidence/mira-assembly-v65/cloth-registration/CLOTH_AUTHOR_SOURCE.json','canonicalCurves','positionM'),('accessory',base.parent/'Q-accessory-registration-v65/docs/evidence/mira-assembly-v65/accessory-registration/ACCESSORY_REGISTRATION.json','curves','positionMm')]
results=[]
for domain,path,ck,pk in inputs:
 raw=path.read_bytes();j=json.loads(raw);groups=collections.defaultdict(list);curves=j[ck];curves=curves.values() if isinstance(curves,dict) else curves
 for c in curves:
  samples=c.get('frameSamples',c.get('samples',[]))
  if not samples:continue
  for s in [samples[0],samples[-1]]:
   p=s[pk];key=(c.get('frame','HEAD_LOCAL_M'),tuple(round(x,7 if domain!='accessory' else 4) for x in p))
   groups[key].append({'curve':c['id'],'normal':s['normal'],'tangent':s.get('tangent'),'kind':c.get('kind',''),'position':p})
 pairs=[]
 for key,gs in groups.items():
  for a in gs:
   for b in gs:
    if a['curve']>=b['curve']:continue
    dot=sum(x*y for x,y in zip(a['normal'],b['normal']))/math.hypot(*a['normal'])/math.hypot(*b['normal']);angle=math.degrees(math.acos(max(-1,min(1,dot))))
    if angle>1:pairs.append({'degrees':angle,'frame':key[0],'position':list(key[1]),'unit':'mm' if domain=='accessory' else 'm','a':a,'b':b,'classification':'Requires smooth-junction versus intended hard-crease/contact/layer classification; same position alone does not assert welding'})
 pairs.sort(key=lambda x:-x['degrees']);results.append({'domain':domain,'inputPath':str(path.relative_to(base.parent)),'inputSHA256':hashlib.sha256(raw).hexdigest(),'pairsOverOneDegree':len(pairs),'pairs':pairs})
report={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'reviewer':'/root/ultra_q_recover_reference_assembly','scope':'Independent endpoint-normal screening on explicitly available author candidates, not final commit or mesh acceptance','results':results,'meaning':'One canonical curve fixes two-sided edge duplication, but different incident curves can retain inconsistent endpoint normals. Shared smooth-node tangent planes or explicit crease/layer normal domains are needed.','toleranceGrouping':'Endpoint positions grouped to1e-7m or1e-4mm as a screening aid; topological node IDs must decide final identity.','newMesh':0,'deadlineAssessment':'still evidence insufficient; coupled node constraints are additional rework, not a claimed successful model'}
out=base/'docs/evidence/mira-assembly-v65/junction-review'/ (sys.argv[1] if len(sys.argv)>1 else 'SCREENING.json');out.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps([{k:r[k] for k in ['domain','inputSHA256','pairsOverOneDegree']} for r in results]))
