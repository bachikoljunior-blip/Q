# Authored face-shape candidates and one source-fitted NPC checkpoint — v31

Base `ec83ba61dd2018eab013b7a4dd5ac3c26e6a090e`. The current Game creates 29 human instances (3 fixed characters, 7 residents, 19 human enemies), all using the same registered MakeHuman head shape across 13 human families. Clothing/color differed; head geometry did not. This finite unit investigates licensed anatomical shape differences, without inferring ages or genders from roles or names.

**This is a numerical/source checkpoint. It is not evidence that faces have become recognizably different in the current game camera, or that PS4 visual quality has been reached.** Only the numerically fitting Mira/npc candidate is connected in this branch. The initial four-role scalar candidate failed its source-distance gates and is retained only as authoring evidence.

## Licensed inputs and actual changes

The pinned official MakeHuman commit is `a8bc2d54ff0ac92e78ff71431b1023eda42bf482`. Existing archived `head-oval.target` is 36,452 B. Two new original targets were fetched without credentials and checked against that official tree's Git blob hashes and their explicit CC0 headers:

| Source | Bytes | SHA256 |
|---|---:|---|
| `nose-scale-horiz-incr.target` | 7,568 | `cc319e3ddb0523fa2b563dcfc840cf2f915a890abe5612009a0becebecd3c5ae` |
| `chin-width-incr.target` | 3,706 | `deef506bfe1883d9d4c38667332c9970785226566efbae4724fd3d60c02efcf4` |

These are original zero-based hm08 vertex offsets, not new faces, bones, photographs or scans. Nose and chin nonzero source vertex sets do not intersect. The age target was excluded: it also moves eye/jaw/helper data and is not an appropriate proxy for a character's identity. Exact URLs, sizes, Git blob hashes and source correspondence are preserved in the generated provenance. The primary Web reader returned DisabledError; ordinary sandbox GET of the exact same official raw URLs succeeded and matched the already verified pinned tree. No alternate browser, community asset, payment, bitmap edit or ongoing download was involved.

Targets are applied to original source IDs through the same nonlinear Q registration as the base head, not copied onto unrelated vertex numbers. Inner eyes, mouth and collar are fixed; the back, upper scalp, outer ears and neck are fixed. Smooth spatial fades protect those boundaries. This prevents the nose target's nearby eyelid vertices and the broad oval target's hair/helper reach from moving the retained eye/lid/neck/clothing contracts.

The first discrete-boundary mask folded two thin triangles ahead of the ears. It was rejected. Continuous boundary fades removed those new folds. The initial compact three-basis module was 7,458 B and represented four authored role combinations. With the original 1,546-triangle topology, full deformed source → LOD p95 was 2.228142 mm for npc, 2.181980 mm for Sena, 2.229870 mm for smith and 2.261591 mm for healer: all above the unchanged 2.1 mm gate. Existing base tests passing did not qualify those candidates. Their basis and results are in [authoring data](evidence/face-identity-v31-basis.js) / [provenance](evidence/face-identity-v31-basis-provenance.json); they are not runtime imports.

## One-role alternative: source-aware LOD

With explicit authorization to reselect vertices for one role, the Mira/npc candidate combines registered oval ×1.1 and nasal width ×0.7. The oval coefficient is an authored extrapolation beyond the source unit target, not an official MakeHuman preset or demographic label. No chin target is applied to the final NPC.

The combined shape is applied to the full source **before** the existing endpoint QEM simplifier. The surface budget changes from 1,500 to 1,600, rather than subdividing old triangles. This redistributes source samples to the deformed surface. The normal strategy uses the deformed source normals, with the established LOD fold/cap fallback. The original head data remains byte-identical for every other family.

| Final NPC measurement | Result |
|---|---:|
| Head surface + cap | 1,600 + 46 triangles |
| Render vertices / welded geometric vertices | 1,062 / 825 |
| Full deformed source → LOD p95 / maximum | 1.939780 / 5.740433 mm |
| Preserved original UV seam vertices | 187, all original corners retained |
| New UV orientation reversals / positive UV overlaps | 0 / 0 |
| NPC total visible triangles / mesh batches | 6,718 / 12 |
| Largest actually used actor / maximum batches | 7,998 / 14 |

The 7.5 mm maximum and 2.1 mm p95 distance gates remain unchanged. The error reference is the registered, collar-fitted and deliberately deformed full source, not the raw MakeHuman coordinates or a continuous Hausdorff bound. All source UV coordinates are retained. Float64 clipping of 5,606 overlapping-bounding-box pairs among all 1,600 surface triangles found no positive overlap above 1e-12. The hidden cap intentionally maps to a small neck-skin patch. Its 46 triangles are nondegenerate and remain inside the original animated neck (worst tested ellipsoid radius-squared 0.662451).

The base has one inherited inward average vertex normal on the outer right-ear fold at original source IDs 12034/12058/12305. The NPC retains that exact unchanged geometric face (new ordinal1539, dot −9.003239e−7); no new backward-average face was introduced. This is a remaining normal defect, not a successful normal repair. Its actual pixel visibility was not established.

The production change is limited to selecting this NPC head in `faceSurface(role)`. Clone instances share immutable geometry while retaining independent skeletons. Eye balls, two eyelid bones, eyebrows, neck, hair, hood/helmet, materials, smith-only skin bitmap assignment, hands, attacks and saved motion remain unchanged. The canonical bow/attachment region is untouched for the parallel archery unit; the integrator must recompute the shared recipe hash after merging both edits.

## What the camera comparison actually shows

Independent comparison tested the original scalar proposal and exactly two stronger candidates (×1.5 and ×2) under identical actor/root/camera conditions. Even at ×2, the greatest ordinary-camera displacement across the four roles was 0.926 CSSpx portrait and 0.480 CSSpx landscape. The actual hearth conversation puts smith/healer at the authored stage positions and uses a 6.5 m camera; healer's ×2 maximum was 1.474 CSSpx portrait, 0.681 landscape, with portrait RMS 0.127px. This is not a demonstration of recognizable faces.

Mira/npc and Sena are not gathering cast members, and solo dialogue does not move the ordinary camera closer. For the final re-LOD NPC, the 725 source vertices retained in both base and candidate move by at most **0.679402 CSSpx portrait / 0.351788 landscape** (RMS 0.064970 / 0.033653). The additional LOD vertices are excluded from that point-pair comparison. Occlusion and rasterized shading were not measured. The candidate's outer projected bounds stay fixed. Thus the camera's scale is a material unresolved constraint; the separate conversation-framing investigation must inform any visual adoption decision. This unit does not edit Scene/camera/UI.

[Exact final projection](evidence/face-identity-v31-final-projection.json), [full coefficient comparison](evidence/face-identity-v31-review/coefficient-comparison.json), [all-family skin/ray/footprint audit](evidence/face-identity-v31-runtime.json), [final independent NPC review](evidence/face-identity-v31-review/npc-relod-final.json).

## Verification, distribution and measured work

- Full suite: **273 / 273**, 44.406 s wall time. Focused final head/source/UV tests: 12 / 12. Independent final head/UV/skin tests: 15 / 15, 8.915 s.
- Independent review checks closed Euler-2 topology, source UV seam consistency, no new flips, clone independence, central iris visibility, monotonic blink 10/8/2/2/0, no cloth eye obstruction, actual new-head neck rim, and the numeric source/error hashes.
- Final build: **2.34 s**, **164,002 B initial JS**, unchanged; **3 chunks**, total JS **1,061,958 B**. The +96,478 B is deferred code/data. The initial 165,000 B gate is unchanged.
- Package/artifact verification: pass; standalone **16,420,887 B**, below 16 MiB, SHA256 `e19c8060fa6449de02ab335b1abfc3a08b83a361c699a33004f910c72e50979b`. Fixed stage contains 34 public files and agrees with source/build/standalone bytes. The integrator rebuilds generated deliverables after combining units.
- Final NPC data: **126,806 B**, SHA256 `40e71eb3f48cc13293f1608443e09afff1b0e756bdf66e7edda2f86f542796fe`. Generator and all inputs are hash-linked; its output is written only after the distance gate passes. Repeated metadata/reproducibility runs retained the exact data hash.

Worktree start 2026-09-16 04:01:24 UTC. New source bytes: 11,274; separate transfer wall time was not recorded. No image production. Initial mask failure, inherited-normal diagnosis, failed fixed-topology source-distance comparison and the explicitly authorized source-aware LOD are distinct rework stages; their unmeasured durations are not reconstructed as precise timings. First complete source-aware generation took 47.762 s; the final deterministic generator/metadata run took 32.974 s. Full-suite and build timings are above. The completion message supplies the actual total checkpoint interval.

Authorized configure returned managed-linux / configured:false. No browser/server/CI-renderer workaround was used. Rendering, physical-device memory/performance, recognizable identity and PS4-quality acceptance remain unverified. The technically fitting NPC geometry is a reviewable candidate; the original four-role variation is not deployed as a substitute for visible progress.
