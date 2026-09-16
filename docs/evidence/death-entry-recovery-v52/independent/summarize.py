from pathlib import Path
import json,hashlib,datetime
out=Path(__file__).parent;r=json.loads((out/'audit.json').read_text());cases=r['cases'];assert len(cases)==27
bad=[{'action':c['action'],'weapon':c['weapon'],'hz':c['hz'],'category':k,'gap':c['candidate']['minimum'][k]} for c in cases for k in ['skin','rigid','cape'] if c['candidate']['minimum'][k]<-.001]
summary={'cases':27,'sourceUnchangedDuringRun':r['sourceUnchangedDuringRun'],'candidateActor':r['hashes']['candidate']['src/actor-models.js'],'groundFailures':bad,'allGameUnchanged':all(c['gameUnchangedByAnimation'] for c in cases),'canonicalErrorMax':max(c['crossCanonical']['world'] for c in cases),'entryPersistentImprovedCases':sum(c['candidate'].get('entryPersistent',c['candidate']['entry'])['world']<c['baseline'].get('entryPersistent',c['baseline']['entry'])['world'] for c in cases),'groups':{}}
for action in ['heal','jump','dodge-tail']:
 cc=[c for c in cases if c['action']==action]
 summary['groups'][action]={key:{'entryPersistentMax':max(c[key].get('entryPersistent',c[key]['entry'])['world'] for c in cc),'entryUnionMax':max(c[key]['entry']['world'] for c in cc),'entryLocalUnionMax':max(c[key]['entry']['local'] for c in cc),'firstSkinMax':max(c[key]['entry']['skin'] for c in cc),'firstCapeMax':max(c[key]['entry']['cape'] for c in cc),'groundMin':{k:min(c[key]['minimum'][k] for c in cc) for k in ['skin','rigid','cape']}} for key in ['baseline','candidate']}
 summary['groups'][action]['rootAboveGround']=[min(c['rootHeightAboveGround'] for c in cc),max(c['rootHeightAboveGround'] for c in cc)]
(out/'summary.json').write_text(json.dumps(summary,indent=2)+'\n')
rows=[]
for action,row in summary['groups'].items():
 a=row['baseline'];b=row['candidate'];rows.append(f"| {action} | {a['entryPersistentMax']:.6f} → {b['entryPersistentMax']:.6f} | {a['entryUnionMax']:.6f} → {b['entryUnionMax']:.6f} | {b['groundMin']['skin']:.6f} / {b['groundMin']['rigid']:.6f} / {b['groundMin']['cape']:.6f} |")
status='PASS within the stated numeric scope; no required remaining defect identified.' if not bad else 'BLOCKED: new visible geometry enters the analytic game ground.'
report=f'''# Independent recovered death-entry review, v52

{status}

This is a newly executed review after workspace recovery, not a reconstruction of the missing old 27-condition result. Read-only source: baseline `{r['roots']['baseline']}` at `fa920db9782b7df42e4e16099a05994e5841dbaa`; candidate `{r['roots']['candidate']}`. Baseline actor SHA256 `{r['hashes']['baseline']['src/actor-models.js']['sha256']}`; candidate `{summary['candidateActor']['sha256']}` ({summary['candidateActor']['bytes']} B). All recorded runtime hashes were identical before/after this run. Only `q-death-review-recovery-v52` was written by this reviewer.

## Exact fixture and measurement boundary

- 27 conditions: **heal, jump, naturally vulnerable dodge tail × sword/spear/greatsword × render 30/60/120 Hz**.
- `Game.heal()`, `Game.jump()` and `Game.dodge(1,0)` start real actions. The main loop's fixed 60 Hz accumulator is retained; render rate is distinct from Game simulation rate. Frames apply real `Game.tick(1/60, {{}})` before the source-extracted Scene player-placement/animation prefix. No death flag, invulnerability value or game timer is overridden.
- Explicit setup: fresh Game spawn, available three weapons, player HP=1, other enemies marked dead to isolate the event. A real non-vault knight is placed 1.4 m behind the player in its strike state; its normal `tickEnemy → meleeContact → hurtPlayer(22)` path emits hurt/death. Enemy placement is a test arrangement, not earned gameplay. Heal advances .30 s before arranging the attacker, jump .20 s; dodge advances until its actual invulnerability reaches zero while dodge remains active. The immunity traces are saved.
- The Scene prefix is real source. Its non-gathering branch is selected. `animateVaultWarden` is not invoked by this dedicated player prefix runner: the real player has no vault adornment and that function immediately returns for it. No renderer, DOM, camera, audio, GPU or physical input is represented.
- Stable **traversal-node ordinal + geometry identity + vertex index** are maintained across the full lifecycle. All meshes are captured, including hidden equipment/flask. `entry` measures the union of previously/currently visible vertices; `entryPersistent` measures only continuously visible vertices; `entryAllMeshIdentities` includes all hidden geometry. None pairs a flask vertex with a different weapon vertex. The union's hidden→shown displacement is a geometric coordinate change, not a previously visible pixel jump.
- Native skinned vertices, rigid equipment vertices and cape vertices are checked every rendered death frame for one second. At entry and ~.10/.24/.50/1.0 s, all visible triangle edge midpoints and centroids are also sampled. Ground is the real analytic `groundAt` function used by the Scene actor's support callbacks. This is finite surface sampling, not a proof over every triangle interior, indexed rendered terrain facet, time instant or arbitrary terrain location.
- Animation receives the same actual player object. Player JSON and complete serialized save are checked unchanged around every paired render. At 1 s, every mesh/vertex, including hidden ones, matches both a fresh explicit-clock canonical actor and baseline at the **same frozen game root** exactly. No game-state write is made by the candidate animation in these cases.

## Result

All distances below are metres. Each row is the maximum entry displacement across its nine weapon/rate cases; ground values are minima across the full sampled fall.

| Prior action | Continuously visible entry: baseline → candidate | Visible-union entry: baseline → candidate | Candidate min skin / rigid / cape |
| --- | ---: | ---: | ---: |
{chr(10).join(rows)}

Canonical maximum difference: **{summary['canonicalErrorMax']:.17g} m**. Continuously visible entry reduced in **{summary['entryPersistentImprovedCases']} / 27** conditions. Ground failures below −1 mm: **{len(bad)}**. These numbers describe pose continuity and sampled ground contact only; they do not establish natural animation or PS4-equivalent appearance.

## Rejected first candidate and required repair

The first reviewed actor `{json.loads((out/'rejected-candidate.json').read_text())['hashes']['candidate']['src/actor-models.js']['sha256']}` passed 1 s canonical equality and state immutability but introduced a new visible spear-tip ground penetration after drinking. At 30/60/120 Hz the baseline minimum rigid gaps were +0.038698/+0.038698/+0.037287 m, while the candidate's **first death frame** reached −0.433040/−0.474101/−0.480813 m. The 31-vertex spear-tip mesh retained ordinal 45. At 120 Hz the deepest point was approximately [−0.0472842,−1.6909491,100.3977666]. Other 24 initial conditions had no negative sampled ground gap.

The author was notified before acceptance. The repair distinguishes a previously visible weapon from a weapon hidden during drinking; its prior hidden orientation must not be used as the blend origin when the weapon reappears. `rejected-candidate.json`, `rejected-run.txt`, `rejected-audit.mjs` and `rejected-summary.json` retain that failure independently. The final fixture retains the same action/game/surface logic; its added persistent-visibility report clarifies interpretation and does not remove union or all-identity checks.

## Residual limits

The existing Game stops ticking as soon as the player is dead. In these jump cases the player root therefore remains **1.094167 m above `groundAt`**. Both baseline and candidate retain the same airborne-root canonical corpse; positive ground clearance is **not** evidence that the corpse lands. Fixing that pre-existing behavior is outside this pose-entry patch and is not reported as solved. The final root is deliberately identical for canonical comparison.

A residual entry displacement remains (including the unchanged cape/contact treatment and legitimate root movement in dodge). No zero-pop or cross-rate identical trajectory claim is made. Damage/save semantics, source identity and endpoint equality are tested in these fixtures; this is not a full playthrough, a screen capture, human perception comparison or device-performance result. No missing old v42 body artwork or old 27-case evidence is claimed recovered.

## Re-run and immutable files

Use already installed project dependencies. Do not install or download anything on this reviewer's behalf:

```sh
node audit.mjs /workspace/scratch/e72662e3b71f/Q-recovery-v51-20260916 /workspace/scratch/e72662e3b71f/Q-death-recovery-v52
python summarize.py
```

The source roots are arguments to the oracle; update them deliberately after checking the recorded hashes. The run writes its outputs only beside this script. `HASHES.json` lists the final copyable files. No source/remote/Sites operation was performed.
'''
(out/'REVIEW.md').write_text(report)
manifest={p.name:{'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in sorted(out.iterdir()) if p.is_file() and p.name!='HASHES.json'};(out/'HASHES.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps({'status':status,'summary':summary,'reviewSHA256':manifest['REVIEW.md']['sha256'],'files':len(manifest)+1},indent=2))
