# P01-R support prototype v63

The original P01-R shape is retained. A separate CPU support candidate repairs the observed floor penetration while preserving all nine existing chest attachment points. **This is a numerical support prototype, not a runtime-adopted or naturally animated garment.** The existing game, geometry source, reference image, Site 24 and original v62 evidence remain unchanged. Base commit: `22d1d041dd6aef60de7764b1eebf6cf78028c857`.

## Fixed shape and method

Input is the existing P01-R, 153 vertices / 256 triangles, from `docs/evidence/mira-cloth-micro-v62/meshes.json`. Original control points, indices, metre UV chart and the source reference PNG are not changed. The image remains shape guidance, not measured CAD. No extra image or geometry was needed for this candidate; it deforms the existing surface under contact.

The previous trial rigidly carried all free cloth with the chest. The new, game-unimported `support.mjs` initializes from that same native bone pose, then alternates structural edge-distance constraints, second-neighbour distance constraints (0.3 stiffness), and ground-normal contact constraints. It uses 64 fixed iterations. The nine top vertices have zero inverse mass and retain their exact posed values; every free vertex may redistribute in XYZ. This is not just `max(Y, floor)`. If the posed surface already clears the 3 mm vertical height-field margin, its positions are returned exactly. No inertia, wind, damping, history or new character animation is implemented: it is a deterministic quasistatic calculation, not a full cloth simulation.

Contact normals use central differences of the supplied height field (1 mm sampling interval), or a caller-supplied unit upward normal. Three millimetres is the candidate's vertical clearance; it is not a certified physical fabric thickness. The normal-distance clearance on tilted planes differs accordingly. Height sampling includes the extra finite-difference queries. Buried pinned points are explicitly reported as infeasible, never silently moved. No universal guarantee is made for arbitrary non-smooth height fields or unsampled triangle interiors.

## New same-condition measurements

All six v62 native poses were re-executed from current source: baseline coordinate difference from saved v62 is exactly 0. Idle, walk, root-yaw turn and sealed are exactly unchanged. At death .45 s the minimum sampled floor gap changes −51.783 → +3.000 mm; at 1 s −9.444 → +3.000 mm. All top vertex displacements are 0. The candidate does not modify the NPC's body pose or the existing cape solver.

Continuous explicit death ages 0–1.2 seconds were evaluated at 30/60/120 Hz over five height fields: flat; `0.15*x`; `0.15*z`; `0.12*x-0.09*z`; and actual `groundAt` at spawn (0,101), yaw 1.1. Synthetic sloped fixtures use origin (2,3) and the recorded yaw. This is 1,275 frames, with 10 barycentric samples on each of the 256 triangles in every frame. Source, origins, clocks and all per-frame values are in `sequences.json`.

| Terrain | Lowest sampled gap before → after (mm) | Maximum vertex step at 30 / 60 / 120 Hz (mm) |
|---|---:|---|
| flat | -59.712 → 3.000 | 84.20→84.20 / 42.11→45.51 / 21.06→23.87 |
| cross-slope | -95.456 → 3.000 | 84.20→85.90 / 42.11→49.09 / 21.06→25.77 |
| along-slope | -128.097 → 3.000 | 84.20→96.83 / 42.11→54.84 / 21.06→29.90 |
| diagonal-slope | -128.468 → 3.000 | 84.20→95.24 / 42.11→53.76 / 21.06→29.30 |
| actual-spawn | -15.564 → 2.998 | 84.20→84.20 / 42.11→42.11 / 21.06→21.06 |

Across those sequences the minimum candidate gap is +2.998 mm, edge-length ratio range 0.963513–1.033109, all triangle areas positive, and within-quad normal agreement remains positive (minimum 0.340360). This orientation check is a local quad consistency test, not an exhaustive global intersection proof. Fixed top displacement is exactly 0. Common-time sampled minimum gap/stretch scalars agree exactly across the three rates; deterministic repeated solves and yaw/translation covariance are separately tested. The latter is a flat-plane test, not full world-transform proof for every terrain.

**Temporal cost remains:** along-slope maximum step increases from 84.20/42.11/21.06 to 96.83/54.84/29.90 mm at 30/60/120 Hz. Finer steps generally get smaller, but this does not establish natural movement. Actual-spawn contact leaves at .633333/.616667/.608333 s (rate quantization); departure steps equal baseline 59.720/30.843/15.658 mm. All entry/exit events remain in `refine-check.json`; no entry-pop or naturalness acceptance is inferred.

## Local shape cost and bounded iteration comparison

At flat death .45 s, transverse sag of the bottom row changes 45.000 → 4.017 mm as it meets the floor. Middle-row sag changes 43.313 → 43.538 mm, top sag remains 31.500 mm exactly. At .8/1 s the bottom sag is 33.437 mm. Thus the contacted hem region changes substantially; the whole surface is not flattened. This is a mechanical deformation result, not evidence that the reference fold looks right in a real game frame.

The same 20 selected poses (five terrains × ages .25/.45/.8/1) were compared at 16/32/64 iterations; 13 poses activate support. Maximum edge length ratios are 1.064870 / 1.038649 / 1.025745. All selected cases retain positive local quad orientation and zero *proper* self-crossing pairs in the implemented segment/triangle test. Shared-vertex pairs and coplanar overlap are excluded; the full 1,275-frame sweep did not perform this quadratic self-cross test. This limited comparison retains 64 iterations for the smaller distortion; no new project guard was set or relaxed.

Final host Node active-heavy plane-sequence median solve times are 2.49–3.18 ms per 153-vertex patch. Actual-spawn medians are .031–.032 ms because most of that sequence is inactive, and must not be advertised as active solver cost. Maximum host sample was 54.544 ms; cold/JIT/GC/scheduling are mixed. The separate 16/32/64 comparison has medians 1.294/1.906/3.716 ms over active selected cases, one ordered host run. These are not reliable device-speed comparisons, mobile/PS4 GPU measurements, or a whole-actor budget. Current allocation and 64 iterations are costly for one small patch; future integration requires a bounded cost decision.

## Interface that still needs assembly

`boundary-contract.json` retains every edge ID and index. P01-R top must be the same solved/pinned edge used by future P04-R. Inside/outside solved edges need one canonical owner whose vertex positions are consumed by neighbours; independently solving two strips can split the seam. Neither neighbour exists here, and welding, UV/tangent/normal continuity, complete cape motion and body collision are unimplemented.

Inside rest X is −.005 m. Mirroring the absent left strip to +.005 leaves a 10 mm centre gap. This unit does not close that gap, invent a centre strip, extend the HEM, or relabel the chest attachment as the anatomical neck. The existing collar, head and body are untouched. Runtime integration is deferred until shared assembly, body interaction, temporal behaviour, performance and real visual checks are resolved.

## Verification, artefacts and reproduction

Six focused tests pass. They freshly exercise fixed-pose repair, immutable inputs and exact pins, non-contact identity, deterministic solves, flat-plane world covariance, infeasible buried pins, source-bound continuous evidence, and the limited fold/iteration comparisons. They explicitly retain the worse step measurements. Source rest shape is not modified. Full game tests and build were not rerun for this unimported review module; the parent owns integration gates.

`cpu-death-support.png` was produced from the actual recorded triangles and viewed. It compares identical posed meshes/cameras before and after at .45/1 s, with the fixed edge and plane. It is a CPU technical drawing, not a game screenshot or physical material render. The two deformed OBJ files have world-space coordinates and recomputed geometric normals; metre UVs remain the original material coordinates. No thickness, caps or new material is added.

```sh
node scripts/export-mira-cloth-support-v63.mjs
node review/cloth-support-v63/refine-check.mjs
node --test tests/mira-cloth-support-v63.test.mjs
python review/cloth-support-v63/plot.py
```

`timing.json` separates observed specification/code/verification/rework boundaries and solver time. There was one parser-error fix before any measurement and a later query-counter correction that included normal-gradient calls; no shape redesign or new image occurred. The final full sweep was re-executed after the latter correction. `HASHES.json` inventories the checkpoint. All output remains outside the default game import graph; no source, package, lockfile, remote, Site or renderer settings were changed. Actual WebGL remains unavailable and was not retried.
