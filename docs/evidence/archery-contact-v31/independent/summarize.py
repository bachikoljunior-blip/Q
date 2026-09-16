from pathlib import Path
import json,hashlib,math,subprocess,sys
P=Path(__file__).resolve().parent;R=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else P.parent/'Q-archery-v31';B=json.loads((P/'baseline.json').read_text());C=json.loads((P/'candidate.json').read_text());h=lambda b:hashlib.sha256(b).hexdigest()
assert not C['changedDuringRun']
for p,sha in C['sourceHashes'].items():assert h((R/p).read_bytes())==sha,p
bodyPhysical=lambda r:[v for v in r['body']['segmentsHits'] if v['name'] in ['right-forearm','string-0','string-1']]
assert all(not bodyPhysical(r) for r in C['staticRows'])
assert all(not r['body']['handSurfaceEdgeHits'] and not r['body']['stringSurfaceEdgeHits'] for r in C['staticRows'] if r['yaw']==0)
assert C['geometry']==B['geometry'] and C['geometry']['triangles']<=8000 and C['geometry']['meshCount']<=14
assert all(r['nockGap']==r['gripGap']==r['rightTipGap']==0 and r['aimMatches'] for r in C['saved'])
assert all(r['arrowsBefore']==r['arrowsAfter'] and r['combatAbsent'] and r['stringZ']==[0,0] and r['stringScale']==[1,1]for r in C['interruptions'])
assert all(v==0 for v in C['pause'].values())
full=lambda d:[r for r in d['staticRows'] if r['state']=='strike' and r['timer']==.22]
metric=lambda d,k:max(r[k] for r in full(d))
manifest=json.loads((R/'dist/.vite/manifest.json').read_text());files=sorted(set(e['file'] for e in manifest.values()if e['file'].endswith('.js')));entry=next(e['file']for e in manifest.values()if e.get('isEntry'))
build={'entryFile':entry,'entryBytes':(R/'dist'/entry).stat().st_size,'jsChunks':len(files),'files':[{ 'file':f,'bytes':(R/'dist'/f).stat().st_size,'sha256':h((R/'dist'/f).read_bytes())}for f in files],'boundary':'Readback of author-generated build artifact, not a repeated build or browser measurement.'};assert build['entryBytes']<=165000 and build['jsChunks']==3
summary={'baseCommit':'47ca76d0679549a890c5721cf7cd997e2b6a2352','candidateSourceHashes':C['sourceHashes'],'poseCount':len(C['staticRows']),'handAndStringSurfacePoseCount':sum(r['yaw']==0 for r in C['staticRows']),'bothSidedPhysicalLineBodyHits':sum(len(bodyPhysical(r))for r in C['staticRows']),'actualHandSurfaceBodyEdgeHits':sum(len(r['body']['handSurfaceEdgeHits']or[])for r in C['staticRows']),'actualStringSurfaceBodyEdgeHits':sum(len(r['body']['stringSurfaceEdgeHits']or[])for r in C['staticRows']),'release':{k:{'baseline':metric(B,k),'candidate':metric(C,k)} for k in ['gripGap','tipNockGap','stringJoinGap','launchGap','nockGripAxisDegrees']},'maximumNativeFingerSurfaceDistanceToLoadedNock':max(r['body']['actualHandSurfaceDistance']['rightNock']['distance']for r in full(C)),'maximumArmLengthError':max(abs(x-y)for r in C['staticRows']for arm in r['armLengths']for x,y in zip(arm,[.33,.31])),'runtime':C['runtime'],'saved':C['saved'],'pause':C['pause'],'interruptions':C['interruptions'],'cancellation':C['cancellation'],'geometry':C['geometry'],'build':build,'unresolved':'Game projectile point coincides with nock; rendered shaft is centered at that point, with tail at local z=-.55. Tail/shaft/tip/collision/forecast definition remains a separate finite unit. No pixels/GPU/frame time/PS4 acceptance.'}
(P/'comparison.json').write_text(json.dumps(summary,indent=2)+'\n')
sourceTable='\n'.join(f'| `{p}` | `{sha}` |'for p,sha in C['sourceHashes'].items())
frameRows='\n'.join(f"| {r['hz']} | {r['maxGripStep']:.6f} | {r['maxTipStep']:.6f} | {r['maxElbowStep']:.6f} | {r['fires'][0]['previousPoseNockGap']:.3g} |" for r in C['runtime'])
report=f'''# Independent v31 archery integration review

**No remaining source blocker within the agreed unit:** connect the bow/hand/string frame to the existing Game projectile point and remove the identified body intersections. This is a CPU structure and game-state result, not rendered appearance, natural movement, device performance or PS4 acceptance.

Base is `47ca76d0679549a890c5721cf7cd997e2b6a2352`. Candidate runtime was read back at the hashes below, unchanged throughout execution. Source, renderer, remote and build artifacts were not edited by this reviewer. Author build outputs were read only.

## What was independently exercised

`audit.mjs` imports actual `createDetailedActor`, `Game.tickEnemy`, `Game.createEnemyArrow`, `Game.hurtEnemy`, serialization and restoration. Scene-owned root position/yaw are applied using the production `SceneView.update` contract; a full SceneView or browser was not instantiated. The same ranger is used for each Game/actor pairing. Static root (11,2,19), yaw 0/.9/2.4, aim pitch −.35/0/.35 and ten carry/raise/draw/strike/recovery points produce 90 poses. Save tests use the ranger's valid original spawn coordinates, preserving the real restore bounds. A first exploratory save fixture outside its home bounds was corrected and is not counted as a source failure.

Surface tests evaluate native `SkinnedMesh.getVertexPosition`, after updating bone matrices. Body triangles have pelvis/spine/chest/neck/head skin influences; hand triangles use the actual hand/finger bones. Both sides are tested with `Ray.intersectTriangle(..., false)`, avoiding FrontSide raycasts missing exits from an interior point. Thirty poses include every actual hand and string triangle edge against these body triangles. This is a sampled intersection test, not continuous collision detection or a closed-volume proof. Closest normal sign is a local diagnostic only. The nock→grip and wrist→nock helper segments are labeled conceptual; body counts in `comparison.json` include physical string/forearm centerlines separately.

## Fixes verified

The first candidate aligned bone markers but the right hand skin crossed the upper chest at full draw, and release placed the right wrist roughly 29.75 mm inside the neck. The second fixed these, but double target/joint blending moved the hand through the pelvis during recovery (about 34.25 mm at the tested wrist) and the new left carry pose crossed the pelvis. These defects were returned with exact triangle intersections. The author changed the draw-hand plane, maintained the closed-finger wrist anchor while fingers open, moved recoil outward, and routed raising/lowering around the body with an outside carry pose.

The final candidate has **zero** measured physical string/forearm centerline crossings in 90 poses and **zero** actual hand/string surface-edge crossings in 30 poses, including all formerly failing carry, raise, full draw, release and recovery cases. The loaded nock is at most 1.733 mm from the actual finger surface; marker coincidence alone was not used as a surface test. Left palm/wooden grip marker gap is below 4e−15 m. These samples do not certify every possible slope, camera view, sleeve overlap or perceptual grip quality.

| Release measurement | Baseline | Candidate |
|---|---:|---:|
| Left palm marker to wooden grip | .123m | <4e−15m |
| Right index marker to nock | .570364m | <1.1e−14m |
| Nock to Game projectile point | .558834m | <1e−14m |
| Upper/lower string join | {metric(B,'stringJoinGap'):.3g}m | {metric(C,'stringJoinGap'):.3g}m |
| Bow nock→grip versus Game axis, worst of the tested aim pitches | {metric(B,'nockGripAxisDegrees'):.6f}° | {metric(C,'nockGripAxisDegrees'):.3g}° |

Upper/lower arm lengths remain .33/.31m; maximum measured length error is {summary['maximumArmLengthError']:.3g}m. Loaded forward direction remains consistent as draw decreases; no passage through the grip reverses that direction. Bone scales are not stretched to reach the targets.

## Time, persistence and interruption

Actual Game enemy ticks create exactly one shot at each frequency. The pose immediately before `fireArrow` is strike timer .22 and its nock agrees with the actual created Game origin. This checks Game's preserved one-tick strike transition, not a fictitious animation-owned shot.

| Updates/s | Max grip displacement/frame (m) | Max index displacement/frame (m) | Max elbow displacement/frame (m) | Pre-shot nock→Game origin (m) |
|---|---:|---:|---:|---:|
{frameRows}

These are coordinate increments under simulated update steps, not frame time or naturalness thresholds. Four actual save/load phases reproduce aim, timers, grip, nock and fingertip exactly. Twenty zero-dt pose updates produce no displacement. `hurtEnemy` before firing leaves 0 arrows; hit/death after firing preserves the one existing arrow without another shot. Hit/death reset string rotation/scale, and an abrupt idle transition settles to the same reset after its existing passive blend. A still-flying arrow after its shooter dies is preserved intentionally; this is not stale bow state. Abrupt hit/death motion can still be visibly sharp; no perceptual transition approval is claimed.

## Budget and remaining projectile definition

Both source trees instantiate a ranger with **7,078 triangles, 12 mesh objects, 12 unique geometries, 349,620 source-buffer bytes**, within the existing 8k/14 structural ceilings. These are not observed GPU draw counts. Author-produced build readback is **{build['entryBytes']:,} entry-JS bytes, 3 JS chunks**, within 165,000/3. The author owns full test/build/package verification; this audit does not rerun those gates.

`scene.js:61` keeps a 1.1 m shaft centered on its instance origin; `scene.js:151` places that center at the Game point. Thus **nock→Game point agreement is not nock→rendered tail agreement**. The tail is local z −.55 m. After the first projectile advance, its axial offset from the launch nock is approximately 19×dt−.55 m (.0833,−.2333,−.3917m at 30/60/120 Hz, under the current constant-velocity model). Merely translating the visual shaft/tip would change its lead relative to the existing point sweep. Parent explicitly assigned tail/shaft/tip/Game-point/forecast/near-wall consistency to a subsequent finite unit; core and Scene projectile geometry remain unchanged here. No nocked arrow surface or visual release-tail match is certified.

## Exact reviewed sources

| File | SHA256 |
|---|---|
{sourceTable}

`candidate.json` and `baseline.json` contain the individual measurements; `comparison.json` is the bounded summary. Run `node audit.mjs REPO OUTPUT.json`; `python summarize.py REPO` verifies the fixed candidate and reads its existing build manifest. All artifacts are under this audit directory. There is no WebGL/GLSL compile, screenshot, browser/media substitute, actual GPU allocation, FPS or PS4-parity claim.
'''
(P/'REVIEW.md').write_text(report.rstrip()+'\n')
(P/'HASHES.json').write_text(json.dumps({name:h((P/name).read_bytes())for name in ['REVIEW.md','comparison.json','candidate.json','baseline.json','audit.mjs','summarize.py']},indent=2)+'\n')
print(json.dumps({'report':h((P/'REVIEW.md').read_bytes()),'comparison':h((P/'comparison.json').read_bytes()),'sourceFixed':True,'build':build,'summary':{k:v for k,v in summary.items()if k in ['poseCount','handAndStringSurfacePoseCount','bothSidedPhysicalLineBodyHits','actualHandSurfaceBodyEdgeHits','actualStringSurfaceBodyEdgeHits']}},indent=2))
