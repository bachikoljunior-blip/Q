# v31 independent bounded review

No source-correspondence or runtime-application defect was found in the reviewed candidate after generator guards were repaired. This is **not a runtime visual adoption recommendation**: the author reports the unchanged LOD p95 gate fails for the initial NPC candidate (2.228142 mm > 2.1 mm). The additional 1.5x and 2x candidates were compared only for geometry, eyes and projected footprint, not independently for that source-distance gate.

The 3 official target bases reproduce exactly at quantized retained source vertices; protected positions and UV seam duplicates have zero disagreement. Runtime positions match expected scalar deformation within 6.05e-8 m; UV differences are ordinary float conversion only. Indices, rigid head weights and clone separation remain intact. All 9 anatomical/skin tests pass, including actual loader/material boundaries. Original head, eye/lid/neck and motion/skin source remain unchanged.

Both requested additional scalar candidates preserve face winding and introduce no new backward mean normals. Existing triangle 1443 (source IDs 12034/12058/12305) has negative mean normal dot -9.003239e-7 in the base and every candidate; its positions do not move. All three factors and four roles retain both central open irises, grid 10/18 open and 0/18 fully closed, with no cloth hits.

Maximum ordinary portrait displacement (healer) is 0.463 / 0.695 / 0.926 CSSpx at factors 1 / 1.5 / 2; landscape 0.240 / 0.360 / 0.480. Actual hearth fixture uses smith (4,89), healer (0,89), player (2,92), real ground/camera collision and the authored 6.5m grouping distance: portrait max 0.737 / 1.106 / 1.474, RMS 0.064 / 0.095 / 0.127 CSSpx; landscape max 0.340 / 0.511 / 0.681. NPC and Sena do not participate in that gathering and retain ordinary camera framing. These are geometric projections, with no occlusion/pixel/perceptual acceptance.

Two bounded generator risks were sent to the author and fixed: guard registration/base-head hashes against the base manifest before reuse; validate every candidate before writing output. No runtime source was edited by this reviewer.

Exact hashes, conditions and limits: `final-review.json`. Raw source evidence: `source-audit.json`; runtime evidence: `runtime-audit.json`; three-factor comparison: `coefficient-comparison.json`. All files are scratch evidence.
