#!/usr/bin/env python3
"""Compare saved native SceneView CPU structural observations; no GPU claims."""
import json,sys,hashlib
from pathlib import Path
root=Path(sys.argv[1] if len(sys.argv)>1 else Path(__file__).parent)
b=json.loads((root/'baseline-v25.json').read_text());c=json.loads((root/'candidate-v27.json').read_text())
assert b['conditions']==c['conditions']
assert b['actorCount']==c['actorCount']==44 and b['actorFamilies']==c['actorFamilies']
assert [(a['id'],a['family'],a['rootUserData']) for a in b['actorInventory']]==[(a['id'],a['family'],a['rootUserData']) for a in c['actorInventory']]
assert not b['changedDuringRun'] and not c['changedDuringRun']
assert not b['disposalEventsDuringQualityLocationChanges'] and not c['disposalEventsDuringQualityLocationChanges']
heads=[]
for a in c['actorInventory']:
 h=[m for m in a['meshNames'] if m['name']=='Q anatomical face skin']
 assert len(h)==(0 if a['family']=='wolf' else 1),(a['id'],len(h))
 if h:
  m=h[0];assert m['triangles']==1496 and m['isSkinnedMesh'] and m['materialType']=='MeshStandardMaterial' and not m['explicitEnvMap'] and m['castShadow'] and m['receiveShadow']
  heads.append({'id':a['id'],'family':a['family'],'theme':a['rootUserData'].get('theme')})
assert len(heads)==29
sharing=[s for s in c['actorGeometrySharing'] if 'Q anatomical face skin' in s['names']]
assert len(sharing)==17 and sum(s['actorUses'] for s in sharing)==29
assert sorted(s['uses'] for s in sharing)==[1]*15+[3,11]
rows=[]
for x,y in zip(b['samples'],c['samples'],strict=True):
 for k in ['quality','x','z','day','camera','cameraQuaternion','forest']:assert x[k]==y[k],k
 for k in ['instanceExpandedTriangles','instanceBufferSourceBytes','activePoints','transparentExtraTriangles']:assert x['whole'][k]==y['whole'][k],k
 assert [a['id'] for a in x['actors']]==[a['id'] for a in y['actors']]
 for a,d in zip(x['actors'],y['actors'],strict=True):assert (a['id'],a['family'],a['rootVisible'])==(d['id'],d['family'],d['rootVisible'])
 row={k:y[k] for k in ['quality','x','z']}
 for k in ['visibleTriangles','frustumCandidateTriangles','visibleMeshObjects']:
  delta=y['whole'][k]-x['whole'][k]
  assert delta==sum(a[k] for a in y['actors'])-sum(a[k] for a in x['actors']),(k,delta)
  row[k]={'baseline':x['whole'][k],'candidate':y['whole'][k],'delta':delta,'percent':100*delta/x['whole'][k]}
 assert not x['sky']['hasEnvironment'] and y['sky']['hasEnvironment']
 rows.append(row)
assert b['pmremNativeRenderMethodCalls']==0 and c['pmremNativeRenderMethodCalls']==19
assert len({tuple(s['sky']['rotation']) for s in c['samples']})==1
alloc={k:{'baseline':b['allocation'][k],'candidate':v,'delta':v-b['allocation'][k]} for k,v in c['allocation'].items()}
bt,ct=b['transfer'],c['transfer'];assert bt and ct
assert bt['initialJsBytes']==ct['initialJsBytes']==163175
assert len(bt['jsChunks'])==len(ct['jsChunks'])==3
ba={a['source']:a for a in bt['runtimeAssetEntries']};ca={a['source']:a for a in ct['runtimeAssetEntries']}
assert not ba.keys()-ca.keys()
added=[ca[k] for k in ca.keys()-ba.keys()]
changed=[{'source':k,'baselineSha256':ba[k]['sha256'],'candidateSha256':ca[k]['sha256'],'baselineBytes':ba[k]['bytes'],'candidateBytes':ca[k]['bytes']} for k in ba.keys()&ca.keys() if ba[k]['sha256']!=ca[k]['sha256']]
assert [a['source'] for a in added]==['src/assets/sky/kloofendal_48d_partly_cloudy_puresky_1k.hdr']
assert sorted(a['source'] for a in changed)==['src/assets/soundscape/pilgrim-harmony.mp3','src/assets/soundscape/pilgrim-pulse.mp3']
assert all(a['baselineBytes']==a['candidateBytes'] for a in changed)
for label,r in [('baseline',b),('candidate',c)]:
 for a in r['transfer']['runtimeAssetEntries']:
  data=(Path(r['repo'])/a['source']).read_bytes()
  assert len(data)==a['bytes'] and hashlib.sha256(data).hexdigest()==a['sha256'],(label,a['source'])
js=lambda r:sum(a['bytes'] for a in r['jsChunks'])
transfer={'baselineManifestSha256':bt['manifestSha256'],'candidateManifestSha256':ct['manifestSha256'],'initialJsBytes':163175,'jsChunks':3,'jsTotalBytes':{'baseline':js(bt),'candidate':js(ct),'delta':js(ct)-js(bt)},'manifestReferencedFileBytes':{'baseline':bt['manifestReferencedFileBytes'],'candidate':ct['manifestReferencedFileBytes'],'delta':ct['manifestReferencedFileBytes']-bt['manifestReferencedFileBytes']},'addedAssets':added,'changedAssets':sorted(changed,key=lambda a:a['source']),'unchangedAssetHashes':len(ba)-len(changed),'sourceAssetHashReadbackMatches':True,'boundary':'Uncompressed emitted file bytes; excludes HTML, icon, webmanifest, HTTP headers/compression/cache/timing. Initial JS is the entry chunk, not total title-screen network requests.'}
result={'baselineHead':b['head'],'candidateHead':c['head'],'conditions':c['conditions'],'assertionsPassed':True,'integrationBlockers':[],'allocationDelta':alloc,'sameConditionSamples':rows,'heads':heads,'headGeometrySharing':sharing,'headGeometrySourceBytes':sum(s['bytes'] for s in sharing),'geometryDisposeEvents':0,'nativePMREMMethodCallsAcross12Conditions':19,'skyTexturePayload':c['skyPayload'],'transfer':transfer,'scope':c['scope'],'limitations':['Attached source-buffer payload excludes driver allocations and unattached authoring/cache intermediates.','Material groups and frustum candidates are not actual GPU draws; instanced batches use native batch bounds, not individual-instance culling.','Texture decode entrypoints except actual HDR CPU decoding are doubles.','No rasterization, shader compilation, GPU frame time, visual or PS4 parity certification.']}
(root/'whole-scene-comparison.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({'assertionsPassed':True,'heads':len(heads),'geometryDeltaBytes':alloc['geometryBufferSourceBytes']['delta'],'transfer':transfer},indent=2))
