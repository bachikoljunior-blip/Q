# Rejected P01 reduced-support candidate v64

**Not adopted.** The one 51-support alternative materially reduces host CPU time but worsens the original surface's local lengths and some fine-time-step motion. The unchanged v63 candidate remains preserved, and neither is inserted into the game. Base: `dac1747bd13d64bb41e650c89c77df54bd0309b8` on the existing v63 worktree; all v63 files have been hash-checked unchanged.

## One alternative, same actual surface

P01-R remains the exact original 153 vertices / 256 triangles, same control net, UVs, reference image and nine top attachment vertices. `support.mjs` chooses left/centre/right supports on each of 17 rows: 51 nodes. It solves 114 structural and 62 bending distance links for 32 iterations, then eight curve-contact sweeps. A three-support quadratic displacement reconstructs each original row, with its original residual retained. Every original free vertex is evaluated for contact, but its normal correction is distributed into the three row supports through the interpolation coefficients; no per-vertex `maxY` edit is used. The full surface is still sampled after reconstruction.

This is one fixed alternative, not a parameter search. Non-contact positions and the whole top edge are returned exactly. The method is stateless and quasistatic; no new animation, shape, image, inertia, cloth/collision system or neighbour mesh was introduced. Curvature residual preservation is not a promise that each deformed fold keeps its original magnitude.

## Measured comparison

The six original posed inputs from v63 were reused byte-for-byte and both solvers freshly executed. Every recomputed v63 fixed-pose coordinate is exactly its recorded value. The actual native NPC death pose was then regenerated for the same five terrains, origin/yaw conditions and 30/60/120 Hz ages 0–1.2 seconds: 1,275 frames. V63 sampled minima and steps match its previous trace exactly. For each frame both solvers run on the same coordinates; their evaluation order alternates to reduce systematic ordering bias. Each triangle has the same 10 contact samples.

All sampled v64 gaps remain ≥+3 mm, all top points are exact, all triangle areas are positive and within-quad normal agreement stays positive. Twenty selected poses have no proper self-crossing pairs under the same limited segment/triangle oracle as v63. Shared-vertex pairs and coplanar overlap are excluded, and this is not a global collision or body-contact proof.

| Terrain | Active median CPU, v63→v64, 30 / 60 / 120 Hz (ms) | Largest vertex step, v63→v64, 30 / 60 / 120 Hz (mm) |
|---|---:|---:|
| flat | 3.502→0.751 / 2.525→0.592 / 2.596→0.552 | 84.20→84.20 / 45.51→44.18 / 23.87→22.32 |
| cross-slope | 2.826→0.563 / 2.790→0.597 / 2.651→0.557 | 85.90→84.55 / 49.09→49.05 / 25.77→29.48 |
| along-slope | 2.739→0.596 / 2.811→0.567 / 2.814→0.585 | 96.83→96.21 / 54.84→52.38 / 29.90→28.73 |
| diagonal-slope | 3.001→0.617 / 2.870→0.577 / 2.674→0.581 | 95.24→95.19 / 53.76→54.05 / 29.30→37.24 |
| actual-spawn | 3.863→1.243 / 4.215→1.242 / 6.474→2.357 | 84.20→84.20 / 42.11→42.11 / 21.06→21.06 |

The speed difference is useful evidence for reducing solver dimension. These are single-run Node host times, not iPhone/GPU performance or full garment cost. Inactive frames are excluded from these CPU medians. Noise, allocation, JIT and scheduling remain; actual-spawn times are higher than the analytic-plane timings.

**Rejection evidence:** full-surface edge-length ratios change from v63's 0.963513–1.033109 to v64's 0.819206–1.077473. Thus some local segments compress about 18.1% and others stretch about 7.75%, despite reasonably stable coarse support distances. At diagonal slope / 120 Hz the maximum step rises 29.303→37.239 mm; cross slope / 120 Hz rises 25.774→29.481 mm. Most coarser-rate peaks improve or remain the same; that does not cancel those measured regressions. No new acceptance threshold was invented and the v63 metrics were not relaxed.

The fold itself is not uniformly worse: flat death .45 s bottom-row sag is v63 4.017 mm vs v64 11.020 mm (original 45 mm), while the middle is 43.538 vs 43.453 mm (original 43.313). At cross-slope 1 s, bottom sag is 0.712 vs 39.199 mm. The coarser model can retain a transverse fold while still distorting the local material metric. This is why a fold diagram or preserved coarse silhouette is insufficient acceptance evidence.

The specific mechanism is that three support-point chords do not constrain the intervening original triangle edges and longitudinal diagonals. The quadratic contact displacement couples these unconstrained local lengths. This explains a limitation of this implemented alternative, not an impossibility theorem for reduced models. A future alternative would need explicit local metric/arc preservation and continuous contact behaviour; no such second candidate was implemented here.

## Scope, artefacts and reproduction

`fixed.json` holds the exact same six posed inputs and both outputs; `sequences.json` contains the 1,275 paired measurements and source hashes. `shape-check.json` retains the twenty limited crossing/sag comparisons. Two deformed OBJ files and `cpu-death-support.png` preserve the rejected output. The diagram was viewed; it is an orthographic CPU drawing of actual triangles, not a game screenshot, reference match, or naturalness judgement. Original image bytes are untouched.

Five dedicated tests pass. Their success means the implementation and evidence are reproducible, including the recorded rejection. They check fixed input immutability, all 153 outputs, exact top/non-contact, the declared quadratic reconstruction, flat-plane world covariance, exact source hashes, contact/orientation samples, and the metric/step regressions. They do not certify adoption. Full runtime tests/build were not repeated for this unimported module.

```sh
node scripts/export-mira-cloth-support-v64.mjs
node review/cloth-support-v64/shape-check.mjs
node --test tests/mira-cloth-support-v64.test.mjs
python review/cloth-support-v64/plot.py
```

The v63 shared-boundary specification is still unresolved: absent adjacent strips must consume one canonical seam solution, the centre mirror has a 10 mm gap, and complete body interaction/welds/cape behaviour are not solved. This rejected candidate does not change those interfaces or the main game graph. `timing.json` separates the observed method/code/validation windows from host solver CPU. No new images, parts, remote writes, Site operations, renderer retry or project guard changes occurred.
