# Independent v28 UV audit

**PASS for the bounded original-layout UV contract.** No repository edits, image edits, browser, server or renderer were used. The v27 negative fixture was the established failure case.

Fixed source OBJ SHA-256: `8e761e6624b8f54536409135d1636da63b32486a90d4897f84e121d144f6fb4c`. Fixed generated data SHA-256: `2717bc737546fa74fcbe3e14dec1e19182f54b41eda0522c205e9faa64b23dba` (120,150 bytes). Fixed generator SHA-256: `8bf8805f3f7a173198e9bf17edc60c2f31041a496e3a0abec445618c3165b85f`. Hashes were checked again at the end.

- Original source selection: 8,440 triangles, all positive UV area; zero mirrored or zero-area triangles.
- Candidate: 1,012 render vertices; 1,500 source-derived surface triangles plus 46 synthetic cap triangles. Every source-derived runtime vertex is an exact original vertex/UV-ID pair, and its UV equals that source coordinate within 6e-8.
- All original UV corners of all **187 geometric seam vertices** remain present, including the multiple UV sides inside a connected island. No seam-corner loss. Source vertex855 retains its four original corner-UV identities.
- Every one of the 1,500 surface triangles preserves positive winding. Every ancestry ID is unique and in the original 0–8,439 range, and both ancestor and current UV corners belong to the same independently reconstructed source island. Ancestry IDs are read as preserved source-face identifiers, not claims that all three original corner vertex IDs remain after QEM. The full QEM history was not independently replayed.
- Exact convex triangle intersection was tested for all **5,207** bounding-box-intersecting surface pairs. **No positive-area overlap above 1e-12 UV²**; largest floating residual 6.78e-21. Cap triangles were intentionally excluded from surface-overlap totals because their synthetic hidden UV patch samples existing collar color.
- All 46 cap triangles have nonzero UV area, independent synthetic UV IDs (`-1`), and region5. Every cap vertex is inside the existing head-local neck ellipsoid (largest normalized radius²=.280000614). Every cap UV vertex lies within the original collar's UV triangle union. This establishes geometric containment, not a rendered occlusion judgment.

## The small surface-area delta is explained

Source summed signed UV area is .2086042268575; retained surface is .208591453018. The difference is −.0000127738395, approximately −.0061235% of source coverage. This is not unexplained missing geometry: the source and candidate each have426 UV boundary edges; exactly4 are replaced. Two mouth-interior slit endpoints with a single original UV move during simplification:

| Source endpoint | Retained endpoint | Neighbouring seam retained |
|---|---|---|
| source vertex3719 / UV4214 | source vertex699 / UV747 | source697, UV759 and4266 |
| source vertex10387 / UV11448 | source vertex7424 / UV8015 | source7422, UV8026 and11500 |

The signed area of those four added edges minus the four removed edges accounts for the full area delta. Both sides of each neighboring seam survive; there are no resulting overlapping surface triangles. These are mouth-interior original coordinates around Y6.57–6.61 and Z.564–.570, with mirrored X. This is a bounded UV boundary approximation from QEM, not a texture rescale or island remap.

## Original PNG coordinate contract

Full source PNG: `862a26e335e958b70534cb5f0d7c47ef30ab148a56c42b3e9da969cf76f12963`, 3,693,828bytes, verified IHDR2048×2048. Runtime source-derived UVs remain in the original OBJ coordinate space with no island translation, crop, axis swap or atlas repack. The complete original-layout source image therefore shares their coordinate system. Actual image-origin/Three.js flipY behavior, diffuse tint, filtering, seam color continuity and game appearance still require the later material/rendering integration. No claim of skin quality or PS4 quality is made here.

The author reports p95 registered-source geometry distance2.074158mm and max7.062869mm; these distances were not recomputed in this independent UV-only audit. Actor motion/role tests were owned by the author and were not duplicated.

Machine-readable assertions and exact boundary edges: `independent-uv-audit.json`.
