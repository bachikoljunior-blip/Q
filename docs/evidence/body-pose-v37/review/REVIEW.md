# v37 player death support — independent bounded source review

No further required source correction was found in the final sampled conditions. This closes the player-only source review; it does not establish natural animation, complete collision freedom, rendered appearance, device performance, or PS4 quality.

- Reviewed base: `337a7e2717d9f130bc6468a45003db2ddddd65db`.
- Final `src/actor-models.js`: SHA256 `04b1a72d8d1f5305dbc0e47dbe10e15c824fd0a29955d5fc08bcb40b8d544a96`, 35,442 bytes.
- Reviewer wrote only `q-v37-player-support-review`. No repository, remote, browser, renderer, or Site mutations. No child agents.
- Review began 2026-09-16 06:50:42 UTC; final numerical run ended 07:04:17.892 UTC and took 17.190 seconds. Source/report finalization remained inside the approximately 20-minute unit.

## Independent method and corrections

The old implementation comes directly from the fixed Git base. Node imports the actual candidate and installed Three implementation, with explicit module hooks only to load the old source at its original relative-module location. Mesh vertices use native skinning and world matrices. Visibility includes every ancestor, so hidden spare weapons do not contaminate the equipped weapon result. No author result JSON is used as an oracle.

The initial candidate `3f856a99…` lowered the player onto the ground but put visible rigid weapons below it. Independent flat settled minima were approximately −70.56 mm sword, −47.40 mm spear and −73.30 mm greatsword. `first-preflight.json` preserves the rejection. The author changed only death wrist rotation and the greatsword's death return rotation; neither weapon geometry nor grip translation changed.

The next candidate `85715efa…` passed ground checks, but independently expanding the cloth/body test to **all 7,454 skinned triangles, including limbs**, found settled cape crossing counts 42 → 45. The author had reported 38 → 38 for a narrower torso/head selection; these are different scopes. Twelve cape faces became crossed and nine ceased crossing; seven new faces touched the right forearm. The final right shoulder abduction and small wrist correction remove those seven forearm cases while retaining weapon ground clearance. `pre-arm-*` preserves the intermediate evidence.

## Final same-condition measurements

| Check | Final measurement / outcome |
| --- | --- |
| Original player terrain set | 6 actual locations × 3 headings × 3 death phases = 54 paired cases |
| Flat equipped weapon cases | Sword/spear/greatsword × 5 phases = 15 paired cases |
| Skin, rigid equipment, cape surface sampling | Every visible vertex and 10 barycentric samples per indexed triangle; 10,784,560 paired triangle sample evaluations |
| Minimum skin gap in those 69 cases | +0.8703 mm; old terrain-set skin minimum −365.2784 mm |
| Minimum visible rigid / cape gap | +28.7018 / +11.9781 mm |
| Separate 48-case weapon preflight | No negative skin, visible rigid, or cape vertices |
| Continuous 30/60/120 Hz | 1.2 seconds stepped at each actual timestep, all three weapons; minimum skin/rigid/cape +5.9589 / +31.2675 / +12.0000 mm |
| Saved explicit phase versus stepped state | Exactly identical sampled vertices |
| First-seen already dead versus settled phase 1.2 | Exactly identical sampled vertices |
| Other roles / live player / recovery | 14 family contracts; nonplayer death and all nondeath/recovery source geometry, transform, visibility and material contracts unchanged |
| World transform covariance | Maximum 1.7521e−6 m under three headings, translated/rotated sloping planes; Float32 cape positions limit precision |
| Cape top nine attachment coordinates in chest frame | Maximum old/new error 1.9896e−13 m |

Flat, settled, same pose and heading:

| Body support measurement | Before | Final |
| --- | ---: | ---: |
| Pelvis lower surface | 8.168 mm | 15.000 mm |
| Chest lower surface | 28.803 mm | 6.000 mm |
| Head lower surface | 102.290 mm | 7.443 mm |
| Left/right foot lower surface | 105.138 mm | 10.847 mm |
| Right hand lower surface | 152.384 mm | 32.668 mm |
| Median of occupied 15 cm horizontal bins' lower skin samples | 120.852 mm | 46.461 mm |

The bin median is a supporting numeric descriptor, not a universal body contact criterion. The final arm correction changes it from the intermediate 44.210 mm. Positive lower-surface gaps are reported together with penetration results so that uniformly lifting the body is not mistaken for improved support.

## Cloth contact and continuity limits

The independent two-sided Möller–Trumbore oracle counts cape triangles with a proper edge/triangle crossing against any skinned body triangle. At phases .08/.25/.5/.8/1.1, baseline → final counts are **0→0, 0→0, 15→13, 42→38, 42→38**. The final result still has 38 crossed cape faces. Relative to baseline, five newly crossed faces remain (37 at chest; 71/72/73/86 at pelvis) and nine old faces cease crossing. Thus **aggregate count does not increase**; this is not “no new intersections.” No intersection depth/area, coplanar contact, containment, all rigid body pieces, arbitrary terrain/poses, or cloth self-contact guarantee follows. `body-trace.json` records both actual world triangles for the settled trace.

The entry into death remains visibly unvalidated and discontinuous in the CPU geometry. Each entry measurement first animates 100 idle frames with the **same equipped weapon**, then enters death phase zero; there is no weapon switch in this metric:

| Maximum one-vertex entry displacement | Before | Final |
| --- | ---: | ---: |
| Sword | 195.58 mm | 208.67 mm |
| Spear | 1,037.62 mm | 1,039.20 mm |
| Greatsword | 561.55 mm | 538.95 mm |

The large spear entry is largely inherited, not solved by this support change. During death, maximum per-frame displacement reduces with timestep subdivision; the saved pose is phase deterministic. This does not cancel the entry discontinuity or prove natural movement. The numerical weapon clearance is against the runtime `groundAt` field; sampled triangle interiors and continuous vertex tests are finite, not an exhaustive swept-volume/terrain-triangle proof.

## Source and cost boundary

`animateCape` is byte-identical to the fixed base. Only `src/actor-models.js` and its animation provenance change under `src/`; the provenance final hash and byte length match. New work is player death pose and visual support. Actor roots, gameplay positions, source body/equipment geometry, other role animations, bow/arrow code, materials and assets remain outside the changed source scope. The support helper adds a once-selected 386-point skin support cloud and per-death-frame CPU work; it does not add rendered triangles, textures, or draw calls.

The author's separate Node sample before the final angle-only refinements recorded 420 animations at 70–109 ms baseline versus 196–199 ms candidate, with first-death 1.75–3.15 ms versus 8.66–11.16 ms. These are author host-CPU observations, not independently repeated device or final-build timings. Allocation peak, GPU cost, real display continuity and low-end performance remain unmeasured. Final build/package/budget gates belong to the author/integrator; this independent source review did not run another build or claim a stale staged file was the final source.

The authoritative reproducible records are `report.json`, `preflight.json`, `body-report.json`, `body-trace.json`, and `summary.json`, with their `.mjs` oracles and logs. `HASHES.json` freezes each delivered file. No image, render, FPS or PS4 acceptance is implied.
