# Death body support v36 — rejected rigid candidate

The first bounded implementation is **not adopted**. Production `src/actor-models.js` was restored byte for byte to base `e731685be92c4c98a20115d2244e580e371ca084`. The candidate, exact source baseline, executable comparison tools, and measured failures are preserved for the next body-support unit. It would be incorrect to ship it merely because it removes the six known cape-neckline penetrations.

## Source cause and experiment

The current humanoid death pose lowers the pelvis to a constant 0.20 or 0.34 model metres and rotates it by −0.47π. It never samples terrain for the body. The v34 cape correctly keeps its nine neckline points attached to the chest, exposing the existing whole-body terrain intrusion.

The candidate changes only the pelvis transform after the normal death pose. It samples a terrain normal over a radius of 0.75 × actor scale, blends alignment using the saved fall age, and translates the complete skeleton vertically against a small cloud of actual skin vertices. All other bone-local poses, skinning, equipment attachments, and the complete `animateCape` function remain unchanged. It does not write Game position, combat, saves, the ground sampler, or Scene corpse lifetime.

The support cloud is extracted once per actor by selecting 14 directional extrema for each dominant-bone group, merging fingers into hands and lids/crown into the head group. Counts are player/boss 237, NPC 245, ranger 293; their source skins have 5,702 / 5,839 / 4,913 / 5,501 vertices respectively. Per-frame work evaluates only the cloud. This approximation has no conservative surface-error bound and missed boot-sole vertices. A one-off first-death measurement, including cache construction and the rest of animation, took 2.77–8.58 ms on the available Node host; this is not a device measurement.

## Same-condition result

The original 108 terrain conditions are preserved: six Game/author locations × player/boss × three yaws × death ages 0.15/0.45/0.80 s. The boss at a player or archer location is explicitly a scale stress probe. A second 20-condition set uses player/NPC/ranger/boss on flat ground at 0.08/0.25/0.50/0.80/1.10 s. All actual skinned vertices are measured; another 36 cases sample seven barycentric points of every indexed skinned triangle. [Independent review](evidence/body-ground-v36/review/REVIEW.md) adds ten points per triangle to the same 108 terrain cases and 20 flat cases at its original yaw 0.43 (the author flat set uses yaw 0).

| Measured quantity | Base | Rejected candidate |
|---|---:|---:|
| Deepest body vertex, 108 cases | −826.854 mm | −22.271 mm |
| Previously clear bodies made penetrating | — | 6 cases |
| Cape negative-ground cases | 6 | 0 |
| Player origin, yaw 0, age .45: body minimum | +131.104 mm | −9.761 mm |
| Boss at same condition | +302.419 mm | −22.271 mm |
| Flat 20-case cape/torso-head crossing increases | — | 0 |

The other four newly negative cases are player/boss at salt-archer with yaw 1.1 or 2.4, age .45. The worst points are boot leather vertex 334 or 61. They are real rendered skin vertices, not an inferred ground interior. The independent oracle reproduced all six values.

Removing penetration alone also does not provide adequate support. At the settled player-origin/yaw-0 condition, the candidate's pelvis low point is 6 mm above ground while its head remains 106.9 mm and its feet 109.8–111.5 mm above ground. Its bottom-envelope median increases from 83.0 to 130.2 mm; the boss probe increases from 31.9 to 390.3 mm. The envelope bins the actual vertices into actor-local horizontal 0.15 m cells, then reports the lowest gap in each occupied cell. It includes clothing and changes in the projected footprint, so it is a geometric void diagnostic, not a perceptual floating score.

An arithmetic reference translates every baseline body vertex upward by the exact baseline minimum gap plus 6 mm × scale. Its median gaps are recorded beside the candidate in `diagnosis.json`. This reference is not another rendered candidate, has no cloth result, and has no measured runtime cost. Slope alignment improves some values relative to that uniform lift but still concentrates support around the pelvis and leaves substantial gaps.

The existing settled shape is relevant: on flat ground the player's selected pelvis low point is at 8.168 mm, head at 102.290 mm, and both feet at 105.138 mm. The pelvis point lies 95.770 mm below the plane through those head/feet points (NPC 113.457 mm; boss 258.073 mm). This establishes non-coplanarity of those **selected four source points**. It is not a proof that every other rigid orientation is impossible, because a changed orientation can select different low vertices. It explains why this terrain-normal-and-lift candidate cannot by itself be accepted as an adequately supported death pose.

## Preserved contracts and remaining motion defects

Seven ordinary/boss cape families retain byte-identical nondeath/recovery actor contracts. All explicit saved phases agree at 30/60/120 Hz; first-seen dead actors equal settled actors. The source candidate changes only the pelvis bone in the flat attachment checks. Independent chest-local checks retain the nine neckline attachments to within 2.27e−13 m. No skin/material/index/UV/weapon geometry changes occur.

The 1.2-second whole-skin-plus-cape rate sweep is separate from the old cape-only sweep. At the real player origin, the player's maximum step at 30/60/120 Hz is 129.77/65.03/32.53 mm before and 121.63/60.91/30.46 mm after. The boss values are 381.78/191.17/95.60 mm before and 343.75/172.23/86.16 mm after. Time-step scaling improves, but death entry is still discontinuous: player 195.58→203.49 mm; boss 448.61→466.60 mm after 100 idle frames. Entry is rate-independent and must not be combined with continuous falling-step values. The independent review additionally includes all non-skinned equipment, including hidden retained meshes, and consequently measures larger player steps; those conservative maxima are separately identified in its report.

Affine ground/world translation-yaw covariance was checked over seven families and three transforms; the largest whole-skin error was 1.752e−6 m. This checks the stated affine cases, not arbitrary terrain or nonuniformly scaled parent transforms.

Warmed whole-actor Node timing over 840 poses per batch was base 115.18 / 110.25 ms versus candidate 228.37 / 234.98 ms (ABBA order). That is approximately 0.131–0.137 versus 0.272–0.280 ms/pose on this host. The extra support sampling has a CPU cost. No GPU timings, heap peaks, WebGL screen, natural-motion rating, or PS4-quality acceptance were obtained.

## Saved checkpoint and next scope

`rejected-rigid-support.js` is 34,864 B, SHA256 `b0f6e30d04f24514e8a31c7a28a7636bebd0dae91cd1e83f7b41f7cbe0409cbb`. Baseline/runtime actor source is 31,704 B, SHA256 `d3f543c2537cd076dfe18ad05ca815374f242dda64847e01421844fc7a0d23fc`. No runtime module imports the candidate. The comparison fixture loads it only through the explicit Node `registerHooks` boundary at a source-relative URL.

Reproduce on the fixed base with these saved files:

```sh
node scripts/compare-body-ground.mjs
node scripts/compare-body-ground-contracts.mjs
node scripts/diagnose-body-ground.mjs
```

These write new output under `artifacts/` and retain the frozen evidence. Do not treat an unpinned future geometry/core version as the original comparison. `comparison.json`, `contracts.json`, `diagnosis.json`, `summary.json`, and the independent review retain this run. The restored production source passed the existing 26 focused actor/skin/head/UV/archery tests in 13.810 s. Those passes validate restoration; they do **not** accept the rejected candidate.

There are no production source, media, provenance recipe, draw/triangle, or initial-chunk changes in this checkpoint. The 8,000-triangle / 14-draw / 165,000-byte guards are not changed. No candidate bundle or new release is claimed: the rejected code is outside the runtime graph. The current primary delivery method is the normal multi-file Web build; the optional standalone path is unchanged.

The next bounded proposal is a separately authorized, one-family articulated death-support comparison: retain pelvis/torso support while allowing the relevant spine and leg joints to settle toward source-derived head/heel contacts. Use conservative feature-aware sole and clothing support shapes instead of unbounded 14-direction samples, keep the saved phase deterministic, and compare full skin/rigid equipment/cape contacts, onset continuity, and voids again. Do not silently add this broader articulation to a pelvis-only change. The six existing production neckline penetrations remain unresolved until an acceptable candidate is implemented and reviewed.

Worktree creation is recorded at 06:28:07Z. Candidate/base comparison was saved by 06:35:25Z. One runtime candidate was produced and rejected; no tuning loop or second shape candidate was adopted. Final wall time, review, hashes, and a small diagnosis-script parse-error correction are recorded in the evidence metadata.
