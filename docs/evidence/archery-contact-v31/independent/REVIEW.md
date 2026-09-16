# Independent v31 archery integration review

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
| Upper/lower string join | 4e-15m | 4e-15m |
| Bow nock→grip versus Game axis, worst of the tested aim pitches | 21.584462° | 0° |

Upper/lower arm lengths remain .33/.31m; maximum measured length error is 1.78e-15m. Loaded forward direction remains consistent as draw decreases; no passage through the grip reverses that direction. Bone scales are not stretched to reach the targets.

## Time, persistence and interruption

Actual Game enemy ticks create exactly one shot at each frequency. The pose immediately before `fireArrow` is strike timer .22 and its nock agrees with the actual created Game origin. This checks Game's preserved one-tick strike transition, not a fictitious animation-owned shot.

| Updates/s | Max grip displacement/frame (m) | Max index displacement/frame (m) | Max elbow displacement/frame (m) | Pre-shot nock→Game origin (m) |
|---|---:|---:|---:|---:|
| 30 | 0.146611 | 0.165353 | 0.099958 | 3.55e-15 |
| 60 | 0.074088 | 0.084436 | 0.054076 | 3.55e-15 |
| 120 | 0.037056 | 0.042320 | 0.040930 | 3.55e-15 |

These are coordinate increments under simulated update steps, not frame time or naturalness thresholds. Four actual save/load phases reproduce aim, timers, grip, nock and fingertip exactly. Twenty zero-dt pose updates produce no displacement. `hurtEnemy` before firing leaves 0 arrows; hit/death after firing preserves the one existing arrow without another shot. Hit/death reset string rotation/scale, and an abrupt idle transition settles to the same reset after its existing passive blend. A still-flying arrow after its shooter dies is preserved intentionally; this is not stale bow state. Abrupt hit/death motion can still be visibly sharp; no perceptual transition approval is claimed.

## Budget and remaining projectile definition

Both source trees instantiate a ranger with **7,078 triangles, 12 mesh objects, 12 unique geometries, 349,620 source-buffer bytes**, within the existing 8k/14 structural ceilings. These are not observed GPU draw counts. Author-produced build readback is **164,493 entry-JS bytes, 3 JS chunks**, within 165,000/3. The author owns full test/build/package verification; this audit does not rerun those gates.

`scene.js:61` keeps a 1.1 m shaft centered on its instance origin; `scene.js:151` places that center at the Game point. Thus **nock→Game point agreement is not nock→rendered tail agreement**. The tail is local z −.55 m. After the first projectile advance, its axial offset from the launch nock is approximately 19×dt−.55 m (.0833,−.2333,−.3917m at 30/60/120 Hz, under the current constant-velocity model). Merely translating the visual shaft/tip would change its lead relative to the existing point sweep. Parent explicitly assigned tail/shaft/tip/Game-point/forecast/near-wall consistency to a subsequent finite unit; core and Scene projectile geometry remain unchanged here. No nocked arrow surface or visual release-tail match is certified.

## Exact reviewed sources

| File | SHA256 |
|---|---|
| `src/bow-contact.js` | `c9da5e24059bde9d23ef225f7d4988c93174e5d040a5ce1532dec2b10fad7b8d` |
| `src/actor-models.js` | `0731e2582bd7eacabf90fd96ca651fd7bc2f56c886c82c912835563c7294b006` |
| `src/character-motion.js` | `b20eadf883e927449d0959e2e8ace7e6b42356efaf0c8d5c8eb1540b6fecb059` |
| `src/assets/characters/detailed-geometry.js` | `51a6a10a890bfd3b531119b39808a18a32b2bea45fa4441871a57e38da06046d` |
| `src/core.js` | `27b62eb40ef1488e344f1a1f5a5455cf67661236035c535508f95f3408345f0d` |
| `src/runtime-state.js` | `84a543c09f089a37031da9ba12915078cee5c668ed009bcd281e90d70829f325` |
| `src/scene.js` | `7f05d2be9103d1480f1281fe3af2afd90a7886d21089fdab6fa471b6c5d93f25` |

`candidate.json` and `baseline.json` contain the individual measurements; `comparison.json` is the bounded summary. Run `node audit.mjs REPO OUTPUT.json`; `python summarize.py REPO` verifies the fixed candidate and reads its existing build manifest. All artifacts are under this audit directory. There is no WebGL/GLSL compile, screenshot, browser/media substitute, actual GPU allocation, FPS or PS4-parity claim.
