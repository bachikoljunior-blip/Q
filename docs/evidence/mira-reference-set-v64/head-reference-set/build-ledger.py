from pathlib import Path
import json, hashlib, shutil
from datetime import datetime, timezone
from PIL import Image
out=Path(__file__).resolve().parent
root=out.parents[1]
plan=json.loads((out/'plan.json').read_text())
legacy=json.loads((out/'existing/type-manifest.json').read_text())
instances=json.loads((out/'existing/parts-draft.json').read_text())['parts']
records=json.loads((out/'generation-records.json').read_text())
bytype={t['id']:t for t in legacy['types']}
specs={p['id']:{**p,'sheet':s['id']} for s in plan['sheets'] for p in s['parts']}
alias=plan['splitAliases']
new_pair={'E04','E05','F18','F19','F20','A04'}
new_central={'F15'}
selected={}
for rec in records['records']:
 version=2 if 'correction' in rec else 1
 selected[rec['id']]=f"{rec['id']}-v{version}.png"
 # Refresh per-sheet record from final visual observations, preserving all raw versions.
 (out/(rec['id']+'-record.json')).write_text(json.dumps(rec,indent=2)+'\n')
existing={
 'F01':('existing/mira-face-patches-F01-F05-F09-v2.png','profile magnification and artificial rim; forehead-eye boundary not exact'),
 'F05':('existing/mira-face-patches-F01-F05-F09-v2.png','conceptual malar shape only; thickness/reverse and source registration uncalibrated'),
 'F09':('existing/mira-face-patches-F01-F05-F09-v2.png','jaw shape conditional; source metrics are separate authored geometry'),
 'F07':('existing/mira-F07-F11-v2.png','isolated hollow not clearly established; image placement alone conditionally used in v63'),
 'F11':('existing/mira-F07-F11-v2.png','central chin placement useful; underside projection/shape not exact'),
 'F17':('existing/mira-F17-v2.png','front/3Q upper-lip duplication repaired, true side upper spike remains inconsistent')
}
existing_joins={'F01':['S01','F03','F12','E03'],'F05':['F03','F18','F19','F07'],'F09':['F07','F11','N01'],'F07':['F05','F09','F19','F20'],'F11':['F09','F17','N01'],'F17':['F16a','F20','F11']}
leaf=[]
for t in legacy['types']:
 if t['id'] in alias:
  for a in alias[t['id']]:
   inst=[p.replace(t['id'],a,1) for p in t['instanceIds']]
   leaf.append({'id':a,'legacyAlias':t['id'],'instanceIds':inst,'name':specs[a]['name']})
 else:leaf.append({'id':t['id'],'legacyAlias':None,'instanceIds':t['instanceIds'],'name':t['name']})
for a in plan['newTypes']:
 leaf.append({'id':a,'legacyAlias':None,'newCoverageProposal':True,'instanceIds':[a+'-L',a+'-R'] if a in new_pair else [a],'name':specs[a]['name']})
instance_map=[]
for t in leaf:
 id=t['id']
 if id in existing:
  f,issue=existing[id];t.update(image=f,status='raw-present-conditional-existing',findings=[issue],conceptualJoins=existing_joins[id])
 else:
  s=specs[id];rec=next(r for r in records['records'] if r['id']==s['sheet'])
  t.update(image=selected[s['sheet']],status='raw-present-author-inspected-independent-review-pending',findings=rec['observation']['findings'],conceptualJoins=s['conceptualJoins'],shapeRequest=s['shape'])
 t['namespacedId']='head:'+id
 t['imageIsCalibrated']=False
 t['exactSeamsRegistered']=False
 t['fullAssemblyAccepted']=False
 t['dimensions']={'status':'not specified by generated pixels','legacyEnvelope':None,'finalMillimetres':None}
 old=bytype.get(t['legacyAlias'] or id)
 if old:
  olds=[p for p in instances if p['typeId']==old['id']]
  t['dimensions']['legacyEnvelope']=[{'instance':p['id'],'mm':p.get('guideEnvelopeMm'),'meaning':'old provisional guide only; not adopted measurement'} for p in olds]
 for name in t['instanceIds']:
  original=None
  if t['legacyAlias']:
   original=name.replace(id,t['legacyAlias'],1)
  elif any(p['id']==name for p in instances):original=name
  side='L' if name.endswith('-L') else 'R' if name.endswith('-R') else ('L' if name=='S03' else 'R' if name=='S04' else None)
  instance_map.append({'id':name,'type':id,'namespacedId':'head:'+name,'legacyInstance':original,'anatomicalSide':side,'image':t['image'],'placementStatus':'type representative shown; exact per-instance placement not fixed','mirrorPolicy':'constrained mirror and anatomical fit; not identity guarantee' if side else 'central or individual hair placement; no automatic whole-style mirror','rootTransform':None,'seamCoordinates':None})
coverage={'createdAt':datetime.now(timezone.utc).isoformat(),'status':'all proposed leaf types have raw multiview reference; not all coherent or approved; no new 3D','baseLegacyCommit':'645ed4b1a31bdc6f07ff66a90e0058f7392394bb','F17SeparateCheckpoint':'014bdddf690f6f26db32ddab843b0ba51b17ce0d','coordinateSystem':'face +Z, up +Y, anatomical R=-X/L=+X; image camera labels do not override it','counts':{'legacyTypes':30,'legacyInstances':62,'leafTypes':len(leaf),'leafInstances':len(instance_map),'existingRawTypes':6,'newLeafTypes':34,'newSheets':13,'initialCalls':13,'targetedCorrectionCalls':sum('correction' in r for r in records['records']),'runtimeOr3DChanges':0},'aliases':alias,'types':leaf,'instances':instance_map,'wholeHeadClosureProven':False}
(out/'coverage.json').write_text(json.dumps(coverage,indent=2)+'\n')
# Structural ledger integrity only, not geometric or visual tests.
unique={x['id'] for x in leaf};unique_i={x['id'] for x in instance_map}
mapped={x['legacyInstance'] for x in instance_map if x['legacyInstance']}
integrity={'leafTypeCount':len(leaf),'uniqueTypeCount':len(unique),'leafInstanceCount':len(instance_map),'uniqueInstanceCount':len(unique_i),'legacyInstancesMapped':len(mapped),'unmappedLegacyInstances':sorted({p['id'] for p in instances}-mapped),'missingImageFiles':[t['image'] for t in leaf if not (out/t['image']).is_file()],'note':'counts and file presence only; no geometry, image projection or device-quality acceptance'}
(out/'inventory-check.json').write_text(json.dumps(integrity,indent=2)+'\n')
rows=['# Head type and instance coverage','', 'Raw images exist for all 40 proposed leaf types / 80 proposed instances. This is NOT full assembly acceptance. Three legacy assembly aliases remain mapped to split leaves. Exact positions and seam coordinates are intentionally unset, not inferred from pixels.','', '| Type | Legacy alias | Instances | Selected reference |','|---|---|---|---|']
for t in leaf: rows.append('| '+t['id']+' | '+(t['legacyAlias'] or '—')+' | '+', '.join(t['instanceIds'])+' | ['+t['image']+']('+t['image']+') |')
(out/'COVERAGE.md').write_text('\n'.join(rows)+'\n')
files=[]
for p in sorted(out.rglob('*')):
 if p.is_file() and p.name not in ['HASHES.json','raw-images.json']:
  b=p.read_bytes();r={'file':str(p.relative_to(out)),'sha256':hashlib.sha256(b).hexdigest(),'bytes':len(b)}
  if p.suffix=='.png':
   with Image.open(p) as im:r.update(width=im.width,height=im.height,mode=im.mode)
   files.append(r)
(out/'raw-images.json').write_text(json.dumps({'source':'builtin image_gen only; generated fiction, not captured/scanned/measurement','images':files},indent=2)+'\n')
print(json.dumps(integrity));print('new PNGs',len(list(out.glob('*.png'))),'new bytes',sum(p.stat().st_size for p in out.glob('*.png')))
