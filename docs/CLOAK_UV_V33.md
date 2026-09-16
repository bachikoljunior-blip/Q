# Normal cloak UV proportions — v33

The ordinary cloak widened from .53 m at the shoulders to .93 m at the hem while using the same 0–1 U range in every row. The existing cloth pattern stretched across the lower fabric and had inconsistent directional scale. This unit corrects only the UVs of the ordinary cape, retaining its shape, animation, average texture density and material.

Base: `892f7e59f602e20da62bf1c8708e432ce1eac637`. The prior base geometry recipe SHA256 is `51a6a10a890bfd3b531119b39808a18a32b2bea45fa4441871a57e38da06046d`; this recipe is `1c5ce56521d0dbf4bad2920340e86d3a1e9cfc03647cb387f1bb5eeb73c4826a`. Changes are inside `cloakGeometry(false)` only, with corresponding recipe bytes/hash in `detailed-provenance.json`.

The new U follows the original row's cumulative edge length, centred on the cape. V follows accumulated mean distances between corresponding row vertices. A single uniform scale restores total UV area to 1, preserving the previous area-equivalent pattern density. These coordinates are computed from the existing positions; no position, normal, index, bone, skin weight, material, shared texture repeat, shader, mesh count or animation formula changes. The normal cape remains an open chart with no circumferential seam to close.

Affected families: player, NPC/Mira, Sena, scout, traveler and ranger. Boss's longer special cape keeps all original UVs. Torso, sleeves, trousers, belt and other closed garments are outside this unit, including their recorded UV distortion. Face/skin/eyes, hands, bow, weapons, wood/hair/paper classification, actor motion and Game/save code are unchanged.

## Same-condition CPU result

Production actors start in their actual initial idle pose, including the existing cape animation update. Metrics use each triangle's physical area to weight quantiles. Stretch is the ratio of the two singular values of the UV gradient on its world-space tangent plane. This is a numeric distortion measurement, not a rendered cloth-quality score.

| Normal cape, all six families | Before | After |
|---|---:|---:|
| Positions / triangles | 117 / 192 | 117 / 192 |
| Total UV area | 1 | 1.0000000598 |
| Area-equivalent texels/m | 264.226070 | 264.226078 |
| Triangle density P05–P95 | 230.146–310.030 | 260.902–267.802 |
| Stretch median | 1.414898 | 1.082436 |
| Stretch P95 | 2.022735 | 1.156973 |
| Stretch maximum | 2.222235 | 1.173058 |
| Zero UV / positive UV triangles | 0 / 0 | 0 / 0 |

All 192 triangles keep their consistent negative chart orientation; they were not mechanically flipped. The density change is only Float32 rounding, at most 2.991e-8 relative in the test sequence. This narrows the spread of local texel density without making the whole material uniformly much finer or coarser.

The regression fixture records the pinned unmodified production actor's geometry attributes (excluding ordinary cape UV only), index buffers, skin attributes and bind matrices, bone/local transforms, mesh visibility, material parameters and texture slot/repeat settings. All 18 actually used family/default and soldier-theme combinations match. Seven cape families including the unchanged boss also match at seven checkpoints across a deterministic 90-frame idle/run/attack/dodge/death sequence. Cloth positions/normals remain bit-identical and UVs remain attached to the animated cape. Clone cape geometry stays independent. The maximum actually used actor remains 7,998 triangles / 14 mesh batches. This does not assert a budget for unused family×theme combinations.

Reproduce the focused contracts with `node --test tests/cloak-uv.test.mjs tests/detailed-actors.test.mjs`. `tests/fixtures/cloak-uv-v31-baseline.json` states the pinned base and recipe hash; the metric and exact frame sequence are in `tests/fixtures/cloak-uv-contract.mjs`. Full before/after values and delivery data are in [comparison.json](evidence/cloak-uv-v33/comparison.json). The [independent review](evidence/cloak-uv-v33/independent/review.json) compares the two real production sources. In the untouched bind geometry its P95 is 2.020423→1.165038, and its density264.121175→264.121183 texels/m. The small difference from the table is the explicitly different bind versus production initial-idle condition. It additionally checks all14families and240frames for each of six normal capes plus boss.

## Limited death-state tradeoff

Independent idle/walk/run measurements improve P95 in all180sampled frames per normal cape. During the existing death-floor-clamp deformation, however, player/scout worsen in4of60frames: at deathElapsed0.644068seconds, P95 is **2.712817→3.694311**, with zero degenerate physical triangles in that frame. The other four normal families worsen in2of60frames, with maximum P95 ratio1.243401. This is an actual UV-direction tradeoff on the same unchanged death shape, not an exclusion artifact or a newly folded UV chart. Do not claim every state improves.

At the already-collapsed end of the existing death animation, both versions contain the same64–80zero-area normal-cape triangles (boss96); the independent Jacobian comparison excludes them identically. The geometry defect is unchanged and outside this UV-only scope. Runtime adoption must consider this narrow death-state drawback along with the consistent live-cloak improvement; no death shape or state-dependent UV workaround was added.

## Delivery and scope of verification

Focused UV/actor regressions: **8/8**, 1.389 seconds. Build: **2.27 seconds**. Package and staged-artifact checks passed. Initial JS remains **164,493 B**, under the unchanged 165,000 B gate; **3 JS chunks**, total **972,958 B** (+428 B deferred). Standalone **16,331,836 B**, +402 B from the pinned base and below 16 MiB. SHA256 `196d238c3ff6577b803a2d2ede06315292ece84594afa590c0a528b84374144b`. Fixed stage `artifacts/site-iUiEy9` contains 34 public files, verified against source/build/standalone. The integrator regenerates the combined deliverable.

Author worktree started 2026-09-16 04:47:44 UTC. The completion message records the checkpoint end. No external source transfer or image production was needed for this implementation. The source correction was accepted by its first focused run; no failed implementation/rework loop is claimed. Earlier material investigation and independent review have separate timestamps in their original records. Timing refers to host work, not runtime frame performance.

Parent configure returned `managed-linux / configured:false`, exit 0 before implementation/dependency/build work. No alternate preview or renderer path was used. Actual shaded appearance, aliasing, motion perception, device/GPU performance and PS4-quality acceptance remain unverified. The procedural material's coarse weave and the shared hair/wood classifications remain quality gaps; this UV repair does not turn it into photographic cloth.

## Preserved material study

The previous study is retained exactly under [study](evidence/cloak-uv-v33/study/ACTOR_MATERIAL_V33_STUDY.md), with immutable copy hashes and original locations in [preservation.json](evidence/cloak-uv-v33/study/preservation.json). Its read-only numerical trials motivated the normal-cape scope. Closed-shell trials found a different optimum and seam-phase constraints, so they were not copied into this implementation.

The photographic candidate [Cotton Jersey](https://polyhaven.com/a/cotton_jersey) has asset-specific photography/processing credits and [CC0 terms](https://polyhaven.com/license). Its minimum original diffuse is 581,360 B at 1024×1025 and alone requires 5,596,500 B in the RGBA8 full-mip estimate, exceeding the proposed 160,000 B / 1,398,100 B addition limits. It was rejected for direct runtime adoption. The original five image files, 9,564,708 B, remain at `/workspace/scratch/e72662e3b71f/q-v33-actor-material-study/source`; exact URLs, MD5 and SHA256 are in the preserved `material-source-analysis.json`. No photo bytes are duplicated into this change and no image was resized, recolored, cropped or generated.

The original study also records the separately investigated obsolete untracked face files. This unit neither edits nor removes them; the face candidate commit remains outside this production change.
