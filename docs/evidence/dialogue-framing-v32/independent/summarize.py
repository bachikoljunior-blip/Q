import json,sys,pathlib
base=pathlib.Path(sys.argv[1] if len(sys.argv)>1 else '/workspace/scratch/e72662e3b71f/q-v31-dialogue-framing-audit/audit.json')
out=pathlib.Path(sys.argv[2] if len(sys.argv)>2 else '/workspace/scratch/e72662e3b71f/q-v32-dialogue-review')
a=json.loads(base.read_text());b=json.loads((out/'audit.json').read_text());rows=[]
for x,y in zip(a['results'],b['results']):
 assert x['name']==y['name']
 assert x['player']==y['player'] and x['npc']==y['npc'] and x.get('stage')==y.get('stage')
 for v,w in zip(x['views'],y['views']):
  assert v['viewport']==w['viewport'];c=w['current'];old=v['current']
  rows.append(dict(name=x['name'],viewport=v['viewport'],baselineHeadHeight=old['height'],candidateHeadHeight=c['height'],ratio=c['height']/old['height'],baselineAngleDeg=old['frontAngleDeg'],candidateAngleDeg=c['frontAngleDeg'],baselineWithinViewport=old['withinViewport'],candidateWithinViewport=c['withinViewport'],candidateEyesClear=c['bothEyesClear'],candidateUpperBodyInside=c['actualUpperBody']['insideReserved'],staticFraction=c['staticFraction'],groundClearance=c['groundClearance']))
summary=[]
for viewport in [[1280,720],[844,390],[390,844]]:
 r=[x for x in rows if x['viewport']==viewport]
 summary.append(dict(viewport=viewport,baselineHeadPx=[min(x['baselineHeadHeight'] for x in r),max(x['baselineHeadHeight'] for x in r)],candidateHeadPx=[min(x['candidateHeadHeight'] for x in r),max(x['candidateHeadHeight'] for x in r)],sameConditionRatios=[min(x['ratio'] for x in r),max(x['ratio'] for x in r)]))
result=dict(boundary='Eight unchanged actual game states/player/NPC/stage data × three viewport sizes. Native projection only, not pixel or whole-screen perceptual quality. Source CSS described separately; no browser CSS layout.',baselineCommit=a['base'],measuredCandidateCommit=b['base'],sameInputCases=8,frameCount=len(rows),eyeRaysClear=sum(x['candidateEyesClear']*2 for x in rows),upperBodyFramesInside=sum(x['candidateUpperBodyInside'] for x in rows),baselineHeadsOutsideViewport=sum(not x['baselineWithinViewport'] for x in rows),maxCandidateFrontAngle=max(x['candidateAngleDeg'] for x in rows),minimumStaticFraction=min(x['staticFraction'] for x in rows),minimumGroundClearance=min(x['groundClearance'] for x in rows),summary=summary,rows=rows)
(out/'comparison.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({k:v for k,v in result.items() if k!='rows'},indent=2))
