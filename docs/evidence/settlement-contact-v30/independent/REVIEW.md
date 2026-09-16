# Independent settlement geometry/contact audit — v30

**PASS for this bounded source, geometry and gameplay-contact unit after two required fixes.** Completed 2026-09-16T04:05:19.594210+00:00. Baseline `16af6cf6a744c36e7e9f45720fa8e7fb922c9069`. Author confirmed final clean commit `b6843fdb82029d6748459073bac75f06d51880ce`; its runtime hashes match this review. No repository files were edited by this reviewer. No browser, WebGL context, GPU shader compilation, rendered game frame, FPS or PS4-quality acceptance is included.

## Findings that required correction

1. Replacing the beveled foundation by a straight stone wall covered a narrow part of the pre-existing dark door's lower edge. At local x=-.56, y=.17 the new stone surface was about8.824mm in front of the old visible door hit. The author added a front notch x±.72 at local top y=.12. Final oblique/front ray readback found **zero new occlusions of previously visible door material**. Some rays that previously hit stone still hit stone at a different depth inside the intentional notch; these are recorded, not mislabeled as byte-identical foundation geometry.
2. Extending foundations down slopes created visible stone below the original house-cylinder bottom but above terrain. Independent native `Game.projectileContact` missed44/44 saved test segments; `cameraFraction` allowed22/44 to pass completely through. The parent explicitly authorized a narrow expansion of house obstacle y/height using the same pure foundation contour. After correction, all44 saved segments produce live projectile wall contacts, forecast wall contacts and camera obstruction. Old miss cases are retained in `preliminary-contact-misses.json`; the final results are in `final-contact-readback.json`.

## Independent measurements

| Contract | Final observed result |
|---|---|
| Actual house facade rays | 360 door rays, zero newly hidden prior door-material hits;480 window rays unchanged |
| Upper house geometry | All attributes of six non-foundation material batches identical; remaining stone window sills/chimney attributes also identical |
| Closed supports |4 foundations,4 ramps,12 piers: welded edge incidence2, opposite edge orientation, Euler characteristic2, finite nonzero faces and positive signed volume |
| Actual ramp triangle versus groundAt |13,932 off-grid native rays, no holes, maximum absolute error4.411306mm |
| Deck/ramp seam rays |1,764 samples, zero holes; maximum top depression8.000017mm at backing surface |
| Plank-gap rays |516 samples, zero holes versus430 baseline misses; backing8mm below gameplay deck top |
| Strict outer footprint |92 just-inside samples, no holes; just-inside/on-edge error ≤1.203351mm; immediately outside correctly uses terrain groundAt |
| Bridge piers | All actual mesh vertices remain within pre-existing deck x/z footprint and below its groundAt solid floor; positive volumes and embedded lower corners |
| Native indexed terrain |116 sampled foundation/pier contour points are below actual terrain triangle ray hits, gap -0.140221 to -0.094843m |
| Reproduced former collision misses | Live wall44/44; forecast wall44/44; camera full-through0/44 |
| Simulation preservation | Serialized fresh Game state unchanged; all non-house obstacles identical; house x/z/r/type and original center-height+6 upper bound unchanged |

The original closed facades and circular house collider footprint are preserved. The author documents the pre-existing door-to-ground visual gap; this audit does not certify accessible house interiors or a newly walkable threshold. The vertical cylinder remains an approximation to the rectangular house, now extended downward as explicitly authorized. Mean/perimeter samples are not mathematical proofs of all unsampled terrain points.

## Evidence and reproducibility

`audit.mjs` loads baseline SceneView/environment source directly with `git show`, executes actual old/new `createStructures` and `createWater`, and uses native Three geometry/ray routines. Image imports are explicit inert URL stubs; no renderer is created. The actual baseline Game module is loaded separately after the approved core change, so the preserved state comparison does not silently use the new Game for both sides. Final source hashes were unchanged during the run.

`contact-repro.mjs` replays the44 saved old cases through current native live/forecast/camera functions. `terrain-contact.mjs` performs native rays against the actual indexed production terrain. Its tested contour coordinates come from the same generated geometry's contact ring (before Float32 rounding), so sub-micrometre/float-quantization differences are not claimed as rendered precision.

Final copyable files: `audit.mjs`, `audit.json`, `final-run.txt`, `contact-repro.mjs`, `final-contact-readback.json`, `final-contact-readback.txt`, `terrain-contact.mjs`, `terrain-contact.json`, `preliminary-contact-misses.json`, this report. `preliminary-audit.json` is explicitly an intermediate report taken while source changed, not final acceptance evidence.

Final source SHA256:

- `src/scene.js`: `e8106013e37e0e3560bb2b0c81cc7e13ac86e6c9c2ef52f630538d9be6f04c73`
- `src/environment-models.js`: `2c665950afbb661ca35e472ad51ad468a423e5147c84c909300b3bb9acde96de`
- `src/settlement-contact.js`: `2ce1863c9fd0ce6850b820a4d36f4f1b495ca3db533d3255af5ac5dbaf06e9ef`
- `src/core.js`: `27b62eb40ef1488e344f1a1f5a5455cf67661236035c535508f95f3408345f0d`
- `src/architecture-grounding.js`: `29a880c656eb93b58209635d06d49578820c0279a7de665e31fd3134f917c33e`

The finite independent scope is closed. Build/publishing-budget gates and final integration belong to the author/integrator; no remote/main/Site action was performed here.
