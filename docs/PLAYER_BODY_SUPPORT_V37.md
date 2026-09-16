# Player death support v37

This unit changes **only the player's death pose and visual ground support**. Other families retain their existing poses. It follows the rejected v36 rigid-lift experiment: the old bent legs, raised head and constant pelvis height could not be accepted merely by lifting the whole figure until its lowest sampled point cleared terrain.

Base: `337a7e2717d9f130bc6468a45003db2ddddd65db`. Final actor source: 35,442 B, SHA256 `04b1a72d8d1f5305dbc0e47dbe10e15c824fd0a29955d5fc08bcb40b8d544a96`. The anatomy, faces, skin/cloth materials, UVs, indices, equipment geometry, Game rules/positions, saves and Scene corpse lifetime are unchanged. `animateCape` is byte-identical to the base. Only the animation-recipe hash/size changes in asset provenance.

## Pose and support

The player settles toward a supine pelvis angle of −π/2, pelvis height .185 model metres, hip +.08, knee +.025 and ankle −.105 radians. The neck remains neutral; the old small chest roll reduces to .018 radians. These are existing joints, blended from the existing death onset using the saved fall age. The right shoulder moves outward by .32 radians and its wrist bends −.115 radians at the settled endpoint. The left arm keeps a different relaxed pose. This is an authored analytic pose, not captured motion or a visual-quality pass.

The final flat-ground skin measurements at .8 seconds are:

| Lower surface | Before | After |
|---|---:|---:|
| Pelvis | 8.168 mm | 15.000 mm |
| Chest | 28.803 mm | 6.000 mm |
| Head/hood | 102.290 mm | 7.443 mm |
| Each heel/boot | 105.138 mm | 10.847 mm |
| Horizontal-bin lower-envelope median | 120.852 mm | 46.461 mm |
| Bins within 30 mm of ground | 4 | 19 |

The envelope uses the lowest actual skinned vertex in each occupied actor-local .15 m horizontal cell. It changes with the footprint and clothing, and is not a perceptual floating score. Here the head, torso and heels approach the supporting surface together instead of shifting an unchanged bowed body upward.

On first death, 26 directional extrema per dominant-bone group select 386 actual skin vertices from the player's 5,702. Later frames skin and sample only those selected vertices. A terrain normal comes from four finite differences at radius .75 × actor scale. The saved fall age controls alignment, then a world-vertical pelvis correction gives the selected points a nominal 6 mm × scale clearance. Source points, bones, matrices and cache state remain per-instance. No geometry-wide vertex scan runs every frame.

This source cloud is a measured approximation, not a conservative collision hull or a proof for arbitrary terrain. Finite/nonfinite ground callbacks retain the existing actor-origin fallback. Uniform actor scale and affine ground/world transforms are tested; arbitrary nonuniform parent scales are not certified. Cloth retains its own v34 solver and attachment coordinates.

## Equipment and cloth corrections

An early joint candidate put all three held weapons below the ground even though the skin cleared it. The small wrist bend fixes sword/spear orientation. The greatsword also retained its standing −1.3-radian node pitch during death while the sword already blended to zero. With explicit integration-owner authorization, only the player's dying greatsword now follows the same zero-pitch endpoint. Weapon position, geometry, hand parent and grip origin are unchanged; alive/attack poses remain exact.

Expanding the cloth oracle from torso/head to all 7,454 skinned triangles exposed new intersections with the right forearm. Changing the right shoulder from inward −.32 to outward +.32 radians removed those new forearm crossings. This moved the greatsword tip over a different part of the terrain at enemy-23; an additional .015-radian wrist adjustment cleared the measured 8.322 mm intrusion without lifting the body. These failed source versions and the negative-case rows are retained, rather than relabeled as accepted results.

The final full-body proper-crossing comparison is .08/.25 s: 0→0; .5 s: 15→13; .8/1.1 s: **42→38** cape faces. This is an aggregate improvement, not zero collision. Five new chest/pelvis crossing faces replace nine old ones; the seven new forearm faces from the intermediate version disappear. Remaining crossings and their location changes are preserved in the independent trace. Coplanar overlap and complete containment are outside this proper edge/triangle crossing metric.

## Same-condition validation

The original 108 cases remain in the author comparison: six real Game/author locations × player/boss × three yaws × .15/.45/.80 seconds. Only the 54 player cases change. Boss-at-player-location cases remain scale stress probes, not claims about actual boss spawns. The 20 flat cases likewise retain player/NPC/ranger/boss and five phases. The unchanged boss's three cape-ground negatives remain; this player unit does not fix other roles.

The independent oracle uses ten barycentric samples on every visible skin, rigid-equipment and cape triangle. Its final 54 terrain plus 15 flat weapon cases have minimum gaps **+0.870 / +28.702 / +11.978 mm** respectively and no new negative case. The actual visible-vertex sequences for three weapons at 30/60/120 Hz likewise stay positive. Separately, the author's three weapons × six locations × three yaws × 73 phases give **3,942** rigid-weapon cases, minimum **+13.322 mm**, with zero negative cases. Finite samples do not prove all continuous terrain contacts.

All 14 families retain nondeath/recovery contracts, and all nonplayer families retain their complete death contracts. Four actually used soldier themes retain geometry and draw budgets. Saved phases, first-seen settled death and independent clones reproduce the same results. The nine cape-neckline vertices retain their old chest-local attachment. Affine world-transform covariance has maximum measured error 1.75e−6 m. The source changes do not move the Game-owned actor root.

**32 focused tests** passed in **15.931 s**, covering the new support/weapon/full-body-cloth regressions and existing actor, skin, anatomy, UV and archery contracts. `npm run build`, `npm run package` and `npm run test:artifacts` pass on the final source: initial JS **164,988 B**, **3 chunks**, total JS **1,081,406 B**, normal Web stage **34 files / 12,591,217 B**. All referenced source/build/stage media bytes agree; no new asset or dependency is introduced. The <8,000-triangle / ≤14-draw guards remain intact. Normal Web is primary; optional standalone HTML was not regenerated for this unit. The generated receipt is evidence, not a publication claim; the integration owner regenerates after combining source changes.

## CPU, remaining onset jump, and scope

This is extra work on the CPU. After the other author jobs ended, two 420-pose player batches took **95.68 / 99.50 ms** before and **169.82 / 212.02 ms** after (about .228–.237 versus .404–.505 ms/pose). First-death calls including body/cloth cache creation were **5.55 / 61.25 ms** for the candidate; the large host variation is retained, not discarded. Earlier mixed-role timings overlapped verification work and are separately retained. These are Node wall times, not isolated CPU cycles, device frame times, GPU or heap measurements. A first-death hitch remains a risk to investigate.

The continuous saved fall is deterministic and step sizes decrease with increasing update rate. The separate death-entry discontinuity remains. The independent comparison keeps the **same weapon through all 100 idle frames and death phase zero**: sword 195.58→208.67 mm, spear 1037.62→1039.20 mm, greatsword 561.55→538.95 mm. These are maximum visible-geometry vertex displacements, not equipment-switch artifacts. The old two-hand living grip to canonical dead-arm transition is still abrupt. It is not claimed fixed by better ground support.

The initial unrestricted pose also failed on staff, crown, quiver and backpack surfaces; the saved flat measurements explain why it was restricted to player. Other equipped families require their own supported poses. The player's remaining onset jump, cloth/body crossings and first-use cost are explicit next gaps. Actual rendering, naturalness, GPU/device performance, the whole-screen PS4 target and comparison with the named reference games remain unverified.

The author tools are `scripts/compare-body-pose.mjs`, `compare-body-pose-contracts.mjs`, `compare-body-pose-weapons.mjs`, and `time-body-pose.mjs`. Their explicit Node baseline hook loads the retained base actor source against this worktree's fixed dependencies. Outputs go to `artifacts/`; frozen evidence and the independent review are under [evidence/body-pose-v37](evidence/body-pose-v37/). Worktree creation was 06:45:42Z; source, comparison, correction and final-save times are recorded separately in metadata. No remote, Site, browser, alternative server or new agent was used.
