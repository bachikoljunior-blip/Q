# v34 cloak grounding — independent source and geometry review

The required regression found in this review is corrected in actor source **d3f543c2537cd076dfe18ad05ca815374f242dda64847e01421844fc7a0d23fc** (31,704 B). No further required source correction remains within this bounded review. This is not approval of game pixels, full cloth collision, device performance or PS4 quality.

Base: `39e47a4fa204ea6576c685bf25569727e410cd01`. Review workspace: `q-v34-cloak-ground-review`; source workspace `Q-cloak-ground-v34`. The reviewer did not edit the repository, use a browser/renderer, change remote/Sites, or spawn another agent. Actor and original third-party asset provenance remain unchanged except the correct animation recipe SHA/byte count. The only runtime source addition is the `animateCape` death branch: deleting that insertion yields the exact original actor source. Scene, motion clock, rig, geometry, material, UV, bones, eye, face, skin and weapon code are unchanged.

## Required defect and correction

The first reviewed source `f15b08cb…` used rest-depth for the pinned neckline. With the actual Game starting position `(0, groundAt(0,101), 101)`, yaw 0, death phase 0.8, a pinned vertex's gap below terrain worsened from **−61.6023 mm to −154.8906 mm**. This was a real triangle vertex, not an extrapolated floor sample. Another player probe at the salt archer's location worsened from −62.9704 to −152.4468 mm; the same location with a 2.3-scale boss probe worsened from −144.2206 to −349.7355 mm. The boss probe at the player/archer location is a scale stress condition, not a claim about the boss's spawn.

The parent approved preserving the old top-nine attachment depth, without moving the body or raising the neckline above terrain. The first correction `aebdc96…` also changed the target used to derive the drape angle. That candidate fixed the ground regression but increased actual upper-body proper intersections (independent NPC phase 0.8: 56→82); it was rejected. Both failed revisions' measurements are preserved separately.

The final `d3f543c…` moves only the pinned top nine vertices to their original death depth while deriving the free drape direction from its separate rest-depth targets. On the same 108 ground cases, **newly worsened negative gaps: 0**. Six old negative neckline cases remain, with their old and new values exactly equal. Those original body/neck terrain penetrations are unresolved, and the free-cloth floor guarantee must not be applied to the pinned attachment.

## Independent measurements

`review.mjs` obtains the original source directly with `git show` and verifies it against the author's stored original. It imports actual Three/actor/Game modules using Node's module hook only for the baseline source; no rendering substitute is involved. The final native run finished **2026-09-16 06:17:24.422Z**, 9.365 s host wall time. `body-check.mjs` implements its own numeric two-sided Möller–Trumbore segment/triangle predicate and bounds filter, rather than copying the author's ray implementation. `finalize-review.py` asserts the frozen source, provenance, outcomes and scope without rerunning a scene.

- Four representative roles (player, NPC, ranger, boss), a 75-frame idle/walk/attack/death/recovery sequence: every other actor contract remains exact, and the cape position/normal are exact outside death. Matrices, bones, geometry/index/UV, material properties and held geometry are included. This is not an independent exhaustive test of every role; the author's separate full-role regression remains its own evidence.
- Continuous death steps over 1.2 s at 30/60/120/240 Hz, with cape positions compared on each actual successive step. Non-cape state matches the baseline. Sampled triangles have no zero-area faces. Flat-ground free-cloth minimum is approximately 12 mm, boss 27.6 mm.
- Live implicit death clocks at 30/60/120 Hz match explicit saved phases exactly; 20 saved-phase/history comparisons also have zero error. First-seen settled corpse matches the explicit settled pose.
- Rotated/translated inclined-ground covariance across four roles and three yaws has maximum world-space error **1.5913e−14 m**. Actual `groundAt` is sampled on 108 role/location/yaw/phase combinations using 15 barycentric samples per cape triangle. This does not prove a bound over every point of nonlinear terrain.
- Twenty independently counted proper upper-body crossing cases have **0 increases**. At settled phase, player 65→38, NPC 56→17, ranger 37→17 and boss 67→32. This is deliberately a limited torso/head filter: pelvis/spine/chest/neck/head-dominated skinned triangles, proper edge/triangle crossings. It excludes complete containment, coplanar/tangent contact, all limbs/fingers, rigid clothing/equipment and full self-collision. The author's broader 84-case extrema differ and must not be replaced by these four flat-ground values.

| Same continuous sequence | Player maximum vertex step | Boss maximum vertex step |
| --- | ---: | ---: |
| 30 Hz | 125.31 mm | 317.33 mm |
| 60 Hz | 67.48 mm | 162.56 mm |
| 120 Hz | 35.03 mm | 81.58 mm |
| 240 Hz | 18.20 mm | 41.02 mm |

This approximately halves with the actual step duration; it is not a fixed-time jump disguised by changing FPS. It is also not evidence that movement is sufficiently natural. The canonical wind phase changes at death entry: after 100 idle frames the measured phase-zero displacement remains **37.31 mm ordinary / 92.61 mm boss**, independent of step rate. That discontinuity is explicitly separate from the continuous table above. Boss unfolding still compresses area in the first 0.2 s: our sampled minimum is 90.04%, while the author's denser sweep reports 89.83%. Ordinary sampled area minima are 97.22% player and 97.98% NPC/ranger; these are sample bounds, not a cloth simulation guarantee.

## Remaining limits and delivery boundary

The corrected attachment preserves more old body overlap than the first f15b candidate. The old claimed maxima (player 17, NPC 15, boss 14, ranger 0) therefore are **not final values**. The author is updating all summary/provenance/gate records for d3f543c. This review does not certify the old checkpoint's build/package byte counts as the new output; final build, packaging, artifact consistency and integration gates belong to the owner/parent. Geometry creation and material batch code are exact to base, so this change adds no triangles or draw batches by source contract.

No new asset acquisition or generation occurred during review. Review began approximately 06:04Z and required two corrective readbacks; the final source checks completed at the timestamp in `final-checks.json`. Separate edit/rework stopwatch durations were not measured and are not invented. Earlier failed outputs, the rejected correction, final exact outputs and runnable oracles are retained; `HASHES.json` lists their byte counts and SHA256. All execution sessions used by this reviewer have completed, and the owner may remove its temporary dependency symlink.
