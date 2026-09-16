import pathlib,json,hashlib,subprocess,datetime
P=pathlib.Path(__file__).resolve().parent; R=P.parent/'Q-ps4-v29'
B=json.loads((P/'baseline-v23.json').read_text()); C=json.loads((P/'candidate-v29.json').read_text())
h=lambda b:hashlib.sha256(b).hexdigest()
git=lambda *a:subprocess.check_output(['git',*a],cwd=R)
assert C['head']==git('rev-parse','HEAD').decode().strip()=='62f731e3ba0924c70f3879174053db7824a449ae'
assert B['conditions']==C['conditions'] and B['actorFamilies']==C['actorFamilies'] and B['actorCount']==C['actorCount']==44
assert not git('diff','13545e4',C['head'],'--','src')
assert not git('diff',B['head'],C['head'],'--','src/main.js','src/title-cinematic.js','package-lock.json')
for p,v in C['sourceHashes'].items(): assert h((R/p).read_bytes())==v,p
samples=[]
for b,c in zip(B['samples'],C['samples']):
 assert [b[k] for k in ['quality','x','z','camera','cameraQuaternion']]==[c[k] for k in ['quality','x','z','camera','cameraQuaternion']]
 samples.append({'quality':c['quality'],'point':[c['x'],c['z']],'baselineVisibleTriangles':b['whole']['visibleTriangles'],'candidateVisibleTriangles':c['whole']['visibleTriangles'],'delta':c['whole']['visibleTriangles']-b['whole']['visibleTriangles'],'baselineFrustumCandidateTriangles':b['whole']['frustumCandidateTriangles'],'candidateFrustumCandidateTriangles':c['whole']['frustumCandidateTriangles']})
assets=[]
for a in C['transfer']['runtimeAssetEntries']:
 p=a['source']; current=(R/p).read_bytes();assert len(current)==a['bytes'] and h(current)==a['sha256']
 old=None
 try:old=git('show',B['head']+':'+p)
 except subprocess.CalledProcessError:pass
 assets.append(dict(source=p,baselineBytes=len(old) if old is not None else 0,candidateBytes=len(current),baselineSha256=h(old) if old is not None else None,candidateSha256=h(current)))
textureRows=[('Environment 3 x 1024 RGBA8+mips',16777212,16777212),('Vault 4 x 128 RGBA8+mips',349520,349520),('Procedural environment 7 x 128 RGBA8+mips',611660,611660),('Procedural actor 5 x 64 RGBA8+mips',109220,109220),('Static terrain contact 512 R8',262144,262144),('Native 44 skeleton palettes RGBA32F',153344,153344),('Smith skin 2048 RGBA8+mips',0,22369620),('Forest 2 x 512 RGBA8 manual mips',0,2796200),('Visible HDR 1024 x 512 RGBA16F',0,4194304),('PMREM 384 x 512 RGBA16F',0,1572864)]
assert sum(r[1] for r in textureRows)==B['textureBudget']['estimatedGpuPayloadBytes'];assert sum(r[2] for r in textureRows)==C['textureBudget']['estimatedGpuPayloadBytes']
D={'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'baselineCommit':B['head'],'candidateCommit':C['head'],'conditions':C['conditions'],'sameCamerasAndActorFamilies':True,'actorCount':44,'geometry':{k:{'baseline':B[k],'candidate':C[k]} for k in ['allocation','geometryGroups','retainedExplicitGeometry','treeCPUCopyBytes']},'textureFormatPayloadRows':[dict(name=n,baselineBytes=b,candidateBytes=c,deltaBytes=c-b) for n,b,c in textureRows],'textureTotals':{k:{'baseline':B['textureBudget'][k],'candidate':C['textureBudget'][k],'delta':C['textureBudget'][k]-B['textureBudget'][k]} for k in ['estimatedGpuPayloadBytes','measuredUniqueTypedPixelBytes','browserImageRGBAEstimateBytes']},'skinFaceUsers':C['textureBudget']['skinFaceUsers'],'samples':samples,'runtimeAssetEncodedBytes':{'baseline':sum(a['baselineBytes'] for a in assets),'candidate':sum(a['candidateBytes'] for a in assets),'inventory':assets,'boundary':'Encoded runtime source asset bytes referenced by candidate Vite manifest, baseline same asset paths from exact git tree; source-only originals excluded; not measured network requests/cache/decoded/GPU bytes.'},'titleLifecycle':json.loads((P/'title-lifecycle.json').read_text()),'nativePMREMRendererMethodCalls':C['pmremNativeRenderMethodCalls'],'geometryDisposalEventsIn12Conditions':len(C['disposalEventsDuringQualityLocationChanges']),'sourceHashes':C['sourceHashes'],'nativeSourceHashes':{p:h((R/p).read_bytes()) for p in ['package-lock.json','node_modules/three/src/renderers/webgl/WebGLTextures.js','node_modules/three/src/renderers/webgl/WebGLShadowMap.js','node_modules/three/src/objects/Skeleton.js','node_modules/three/src/extras/PMREMGenerator.js']},'boundary':'CPU structure/typed arrays and calculated texture payloads; renderer/image-metadata/DOM boundaries explicit. No WebGL allocation, pixels, frame time, decoder memory or PS4-equivalence measurement.'}
(P/'budget-comparison.json').write_text(json.dumps(D,indent=2)+'\n')
rows='\n'.join('| '+n+' | '+format(b,',')+' | '+format(c,',')+' |' for n,b,c in textureRows)
st='\n'.join(f"| {s['quality']} | {s['point']} | {s['baselineVisibleTriangles']:,} | {s['candidateVisibleTriangles']:,} | +{s['delta']:,} |" for s in samples)
a=D['runtimeAssetEncodedBytes'];m=lambda x:f'{x/1048576:.3f}'
report=f'''# Independent v23 → v29 resource budget audit

Baseline `{B['head']}`; candidate `{C['head']}`. Runtime is byte-identical to candidate 13545e4. Exact relevant file hashes and measurements are in `budget-comparison.json`, with full scene inventories in the two raw JSON files. No repository or remote mutation was performed.

The principal growth is texture payload, not geometry. Native attached geometry arrays grow **830,504 bytes (+3.97%)**, while calculated texture-format payload grows **30,932,988 bytes (+169.37%)**, from {m(18263100)} to {m(49196088)} MiB. This is not measured device GPU memory or evidence of visual quality/PS4 equivalence. No unbounded growth was found in the normal navigation paths inspected; this is not a general leak certificate.

## Measured CPU structure

Actual Game and asynchronous SceneView/native Three geometry were exercised at the same four positions × low/medium/high, 1280×720 DPR1, day .29, yaw .05, pitch .3, zoom9, two frames per condition. All 12 camera transforms and all 44 actors (29 humanoids,15 wolves) match. Renderer calls are an explicit boundary double, not rendering; native PMREM issued 19 method calls once. Image entrypoints use native Texture objects with dimension metadata; forest RGBA, HDR HalfFloat, procedural pixels and bone palette arrays are actual decoded/generated CPU data. Custom shader uniforms were collected without compiling shaders.

| Geometry arrays / structure | v23 | v29 |
|---|---:|---:|
| Attached unique geometry bytes | 20,895,502 | 21,726,006 |
| Actor geometry bytes | 5,779,492 | 6,132,976 |
| World geometry bytes | 15,116,010 | 15,593,030 |
| Attached plus explicit cached grass/telegraph geometry bytes | 20,898,272 | 21,728,776 |
| Instance source arrays | 1,509,260 | 1,509,260 |
| Tree selection CPU copies | 142,704 | 142,704 |
| Attached unique geometries | 743 | 793 |
| Mesh objects | 1,590 | 1,616 |
| Materials | 222 | 238 |

These are deduplicated source arrays/object inventories, not total JS heap, GPU buffers or draw calls. Zero geometry disposal events occurred during the 12 quality/location transitions. Fixed-condition hierarchy-visible triangles include instancing and selected LOD; frustum candidate statistics are additionally in JSON. Neither measures occlusion or rasterized pixels. Changed geometry/batch bounds can alter frustum candidates sharply.

| Quality | Position x,z | v23 visible triangles | v29 visible triangles | Delta |
|---|---|---:|---:|---:|
{st}

## Calculated texture payload (bytes)

Source/sampler aliases are deduplicated. Full mip chains and native padded skeleton palettes are counted. This is potential format payload after relevant textures have been used/uploaded, not evidence that every texture is immediately resident.

| Texture family | v23 | v29 |
|---|---:|---:|
{rows}
| Total | 18,263,100 | 49,196,088 |

The **21.333 MiB skin figure is correct for one 2048² RGBA8 atlas including mips**, not per humanoid. Actual eligible use is only `resident:smith-ren`; atlas loading is shared and not repeated across 29 humans. Its browser base-image RGBA equivalent is 16 MiB, distinct from GPU mip payload. Low/medium/high do not resize or release these textures.

Measured unique CPU typed pixel arrays rise 956,160 → 7,946,664 bytes. Separately, browser-image RGBA equivalents rise 12,845,056 → 29,622,272 bytes; these are dimensional estimates, not browser decoder/heap observations. PMREM output has no CPU pixel array and is excluded from that browser-image figure. CPU and GPU estimates must not be added as physical/unified-memory consumption.

HDR retains a 4,194,304-byte source array/visible texture. Successful PMREM preparation additionally uses a temporary 1,048,576-byte half-float input and 1,572,864-byte ping target, then requests their disposal. GC/driver release timing is unknown. Unsupported float-render-target capability skips PMREM/visible HDR GPU creation, while the already decoded HDR loader source can still remain cached on CPU. Previously documented public-API uncertainty for an exception before PMREM returns its output target remains; this audit does not resolve that failure-only reclamation question.

## Title and game residency

`main.js`, `title-cinematic.js`, and package-lock are byte-identical to v23. `ensureView` reuses one pending/successful view; title/new-game navigation does not recreate it. Actual title module with explicit DOM/video/RAF doubles confirmed three loading→game cycles: loading keeps video `src`; game activation removes `src` and calls `load()` once per cycle.

| Phase | World resources | Title video |
|---|---|---|
| Cold title | Scene module/view not yet created | Active |
| Initial world loading | Images/HDR/scene/PMREM build concurrently | Still active |
| In game | Retained, rendering enabled | Source-release requested |
| Return to title | Retained singleton; game frame exits without rendering | Reattached/active |

Therefore initial load can overlap decoder, image decode and PMREM transients; return-to-title can overlap retained world resources and a new decoder. These are bounded lifecycle overlaps, not measured memory spikes. Parent has separately assigned earlier decoder release in v30; no source change is requested here.

The unchanged 1280×720 title MP4 is 3,178,191 encoded bytes. A YUV420 frame is 1,382,400 bytes, an RGBA frame 3,686,400; retained frame count/browser storage is unknown. Do not multiply by all 288 frames. Poster is 1672×941 (6,293,408-byte RGBA equivalent). Canvas is 3,686,400-byte RGBA equivalent at test viewport, capped at 6,400,000. Hidden canvas/poster dimensions persist; unload requests do not prove immediate decoder/GPU reclamation.

## Encoded assets and exclusions

Manifest-referenced runtime asset encoded source bytes: **{a['baseline']:,} → {a['candidate']:,}**, delta **{a['candidate']-a['baseline']:,}**. Added skin WebP 541,954; forest PNGs 327,978; HDR 1,435,119. Source-only skin PNG, original four forest JPEGs and title source PNG are excluded. Music encoded lengths are unchanged, though harmony/pulse bytes changed. Candidate manifest initial JS is 163,956 bytes in three JS chunks; this audit has no regenerated baseline build or network-transfer timing comparison.

Actual GPU allocation, lazy upload timing, framebuffer/MSAA/driver overhead, shadow depth storage, browser image/video decoders, audio decode/resampling, GC, overall process memory, frame time and real screen quality remain unmeasured. The unchanged 1024² shadow target can remain allocated after switching shadows off; texture quality switches do not imply release. No PS4 quality or September 20 completion claim follows from these structural counts.

Reproduce with `measure-budget.mjs REPO OUTPUT.json` for each source tree, followed by `python summarize-budget.py`; retain actual forest `pine.rgba`/`crown.rgba` fixtures alongside outputs. `verify-title-lifecycle.mjs` preserves the explicit DOM/media boundary. No additional broad tests or visual proxies were run.
'''
(P/'REVIEW.md').write_text(report.rstrip()+'\n')
print(json.dumps({'reportSha256':h((P/'REVIEW.md').read_bytes()),'comparisonSha256':h((P/'budget-comparison.json').read_bytes()),'runtimeEncoded':{k:v for k,v in a.items() if k!='inventory'},'candidate':C['head']}))
