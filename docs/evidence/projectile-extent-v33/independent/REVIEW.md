# v33 projectile extent independent review

No required source blocker remains in the reviewed final source. The independent review found and obtained a repair for missing loaded arrows on second/subsequent draw cycles. This is acceptance of the stated source/geometry/physics contracts, not rendered quality, PS4 parity or device performance. No preview, WebGL draw, screenshot or shader compilation was performed. Source and remote repositories were read-only; all reviewer writes are in this scratch evidence directory.

Review started at 2026-09-16 05:06:48 UTC. A final clock read at 05:38:23 showed that the requested 25-minute bound had been exceeded. Additional probes were stopped; the remaining work only collected the already-completed native process and fixed this report. The overrun is not represented as an on-time review.

The worktree is `Q-projectile-extent-v33`, base `892f7e59f602e20da62bf1c8708e432ce1eac637`. Exact final hashes for all eleven relevant runtime files are in `source-readback.json`. In particular:

| Source | SHA-256 |
|---|---|
| `src/core.js` | `32464f35ce8db7776984e5cc18f01882e766d780a640309501819d794d188390` |
| `src/projectile-shape.js` | `c754233b0d7a34dd0aa1520d1507f23db0b0f6b8359670593bef02c7d4accc54` |
| `src/projectile-geometry.js` | `68a1a410014bc224468e052b4a1d6b1de776d63fa0b4d56d71d416fd5593fc70` |
| `src/combat-presentation.js` | `aa40a85842d8a0542fdc503e7ac2b0986655a1e0d1ae20c06b4c0bbac1e9244a` |
| `src/spatial.js` | `9a6a4331b556530701968ee2fa9dacaa5be01015f6cbb6a2cb551a7cbe56be6f` |
| `src/bow-contact.js` | `0b81d2dc277555e13ff552d2dbdd891e6cd0a4660cc10a1668c9269d1249005c` |
| `src/assets/characters/detailed-geometry.js` | `443a6bfb62f8ecee4f21b305416c6666f46ba1c661c2e1486f2d4da441e2829c` |

## Physics and prediction

The Game position is now the tail/nock. Shared axial extent is 1.34 m. Contact tests sweep from the current tail to the advanced leading tip, retain raw geometric ordering, and separately convert the hit fraction to tail-travel time. Thirty-five independent elevated-cylinder/lifecycle cases cover near-wall fronts at 0.15/0.5/1.0/1.3/1.8/3 m across 30/60/120 Hz, both wall-before-body and body-before-wall initial overlaps, reversed obstacle array order, contact-point versus tail-time separation, parry and newly reflected wall contact, expiry-before-contact, old saved coordinates and invalid saved vectors.

All passed. Initial fronts below 1.34 m give time zero; raw distance still selects the nearer surface instead of collapsing all overlaps into an unordered time-zero tie. Three in-memory source mutants were rejected by these fixed contracts: removing the leading extent, using raw sweep fraction as step time, and comparing clamped contact times instead of raw fractions. These changes were never written to the repository.

Reflection deliberately sets the **new tail at the contact point**, aims every component from that same point toward the source (or reverses the incoming vector), and checks the newly oriented span for world contact before continuing. It retains 25 m/s, two-second lifetime and discard of the remaining step. The reflected-wall case breaks at the new wall point, not the old player-contact point. This is the selected instantaneous gameplay convention; it does not claim a physically continuous arrow rotation. It differs from the alternative “keep reflected tip at contact” convention discussed in the preliminary design note.

Sixty independent actual bridge/edge trajectories have identical target and time between optimized forecast and sequential 60 Hz live contact; their primary warning/no-warning result also agrees. The fixed 48-arrow case agrees for every contact and selects `arrow-1` as primary. The author additionally reports 120 baseline bridge trajectories at all three rates, with 111 player and 9 wall results per rate and roughly 70.3–70.6 ms earlier contact. That broader baseline measurement was read, not independently repeated here.

The same `groundAt` entry instrumentation, including calls within exact live contact, measures:

| Fixed 48-arrow case | Actual terrain calls |
|---|---:|
| Old point implementation | 1,618 |
| Candidate shared-extent implementation | 1,522 |
| Candidate with clear-span reuse disabled | 5,690 |

The former reported 1,474 excluded 144 calls inside the 48 exact live frames. Raising that reported counter to the actual baseline 1,618 corrects instrumentation; it is not a relaxation above the old actual workload. The optimized candidate has exactly 48 exact frames, 48 body sweeps and zero fallback frames. Its sequential candidate contacts and actual terrain call count agree. The full-span negative control exceeds the unchanged actual baseline and is rejected. This is an operation count, not CPU time, GPU time or FPS.

`spatial.js` extracts the original segment terrain sampler into `terrainContact`; its ordinary wrapper retains the original sample spacing, comparisons and five bisection iterations. Projectile reuse applies only when the next tail coordinates and velocity match exactly. Its WeakMap is not serialized. Rebuilding the arrow object every frame changed two bridge terrain hit times by approximately 68 and 19 microseconds, with the same wall and warning outcome. Thus cached and cold-reload terrain bisection results are not asserted to be bit-identical. Old saved x/y/z and velocity fields remain numerically unchanged and are interpreted as tails; zero/nonfinite/out-of-range saved velocities are rejected before contact. Arbitrary invalid direct internal contact calls are outside that validated-input test boundary.

The revised saved interpretation moves old rendered geometry 0.55 m forward and finite extent advances ordinary contact by about 1.34/19 = 70.526 ms. This is an intentional gameplay correction, not unchanged combat balance. Physics remains a sampled centerline with existing cylinder margins, not exact triangle collision: for example, the 0.10 m tip radius is larger than the 0.08 m static-obstacle margin. The old exaggerated visual width is still a limitation.

## Loaded arrow and actual scene connection

The original candidate gated loaded visibility on `!state.hit`. Actual Game retains the previous shot's `hit=true` through recovery/chase and into the next windup; it clears that flag only at the strike boundary. First-shot-only poses therefore missed an invisible second loaded arrow. The final phase-aware gate ignores the stale hit flag during windup while still collapsing the arrow after release.

The independent actual Game test executes two shots each at 30/60/120 Hz and observes 26/52/106 valid second-windup samples with the loaded arrow visible. All six spawn points match the previous actual string nock within about 5.1e-15 m. After actual same-frame projectile advancement, the actual SceneView instance matrix tail agrees with the current Game position within 2.3e-7 m; native geometry extends from approximately 0 to 1.34000013 m along the velocity axis. The first displayed tail has already traveled 19/hz, namely 0.6333/0.3167/0.1583 m. It is not claimed to remain at the nock after advancement. Loaded geometry collapses after firing and on idle, hit/stagger and death; these are source/native geometry observations.

Independent loaded-surface edge queries test actual skinned triangles on both sides for 45 yaw/pitch/draw poses. All intersections outside the specified distal-index/string nock neighborhood are zero. The retained intersections are explicitly recorded, not erased: 5,010 duplicate edge/face intersections across the poses, maximum 11.37 mm from the nock and maximum 10.58 mm forward along the arrow. The 25 mm exception therefore covers actual intended fingertip/string contact near the narrow tapered nock; it does not excuse palm, sleeve, wood or body intersections. This is an edge-intersection inspection, not an exhaustive closed-volume or visual proof.

The independently reused v31 native audit, rerun after the final material hash, inspects 90 poses and full hand/string surface edges in 30 of them. It finds zero hand-surface/body and zero string-surface/body intersections; fixed arm lengths remain 0.33/0.31 m and grip/string errors are below 4e-15 m. A diagnostic wrist-to-nock line crosses the pelvis in 18 unheld carry/end-recovery poses; that line is neither a finger nor rendered equipment in those poses, while the actual hand/string surfaces are clear. It is not reported as a physical intersection or silently counted as a passing contact line. Actual saved pose reconstruction and pre/post-shot hurt/death boundaries remain in the native JSON.

The final ranger is 7,108 triangles, 12 meshes and 354,448 source geometry bytes. The loaded tip uses the existing trim material batch; the earlier 13-mesh candidate was not retained. Flying arrows still use two fixed-capacity InstancedMeshes for up to 48 arrows. These are structural counts, not GPU draw/performance measurements.

## Build and evidence boundaries

Current v33 entry bytes were read independently as **164,679 B**, with three current manifest-referenced JS chunks. Adding the owner's measured v32 increment of 309 B gives **164,988 B arithmetically**, only 12 B below 165,000. This is not a combined build; the integrator must test the combined exact source and retain the existing ceiling. Author-reported 279 tests and fourteen gates are distinct from this independent focused review.

`physics-review.mjs`, `negative-controls.mjs` and `flight-integration-review.mjs` accept optional repository and output-directory arguments. `archery-native-review.mjs` takes repository and output JSON arguments. `loaded-surface-review.mjs` is a documented extension of the author's surface oracle and currently contains the exact review-worktree imports; its sole positional argument is output JSON. `budget.json` is the rerun author oracle with independently inspected identical entry instrumentation and baseline hashes. The actual Scene fixture substitutes renderer/assets/DOM boundaries; it computes native Three matrices and geometry only.

All reusable scripts, measurements, final source hashes and this report are listed in `HASHES.json`. Whole-screen PS4 realism, real browser/GPU behavior, tactile play and the September 20 completion target remain unverified. This finite source review is closed; no further optional probes are required.
