# Original head UV corner preservation — v28

Base: `7b8b4b69f01a405d0326e4188f267c0257d8a577`. Source OBJ, registration, feature locks, neck fitting, anatomy, materials and all motion logic remain the v27 inputs. This fixes UV attributes before applying any new skin texture. The separate original diffuse was retrieved and verified by another worker; no texture is included or sampled here.

## Defect and correction

The v27 generator stored one UV per source vertex per connected island. A connected UV island can still contain seams: 48 source vertices had 49 additional UV instances inside those same islands. Overwriting them and rendering by `(vertex, region)` introduced 65 reversed UV triangles. Repacking five islands also prevented direct use of the original diffuse atlas.

The generator now stores each triangle's three original OBJ corner IDs throughout endpoint edge collapse. An accepted collapse selects the keeper UV on that exact incident edge side and rejects ambiguous substitutions or any new orientation reversal. Render vertices key on `(source vertex, source UV corner)`. Surface UV coordinates remain the exact original atlas coordinates; nothing is mirrored or repacked to make a sign test pass. The original 8,440 selected source triangles all have positive UV area, so all 65 previous negative triangles were introduced defects, not legitimate mirrored source charts.

The cap has no source counterpart. Its 46 formerly zero-area triangles now use a small planar XZ patch about the mean original neck-boundary UV, radius scale 0.001. This is an explicit authored mapping, not a claimed source head island. The cap remains hidden within the retained neck, including animated sealed/heal/recoil/death poses. Independent eye, iris and eyelid materials remain intact; the source eye islands describe internal tissue and must not replace them.

## Same-source comparison

| Quantity | v27 | v28 |
|---|---:|---:|
| Head surface + cap triangles | 1,450 + 46 | 1,500 + 46 |
| Render vertices | 938 | 1,012 |
| Introduced reversed UV triangles | 65 | 0 |
| Zero-area cap UV triangles | 46 | 0 |
| Source-to-LOD vertex distance p95 | 2.031413 mm | 2.074158 mm |
| Source-to-LOD vertex distance maximum | 7.062869 mm | 7.062869 mm |
| Normal difference mean / maximum | 1.415° / 60.027° | 1.223° / 60.027° |

The 74 extra render vertices consist of 49 preserved UV instances and 25 extra retained geometry vertices. The extra 50 triangles are an explicitly authorized reallocation inside the existing actor budget, not a raised budget. Feature locks remain nose 38, lips 40, ears 15, silhouettes 108, extrema 6. Seam correctness raises the combined locked vertex count from 375 to 408. A weak area weighting (triangle doubled area to power 0.05) balances endpoint quadrics without changing the locked points. Source distance references the registered and collar-fitted full source, as in v27, not the raw MakeHuman coordinates. The existing maximum 7.5 mm / p95 2.1 mm test gates are unchanged.

Original surface UV area is 0.2086042268575; retained area is 0.208591453018 (difference 0.00612%). Exact retained corner coordinates and local orientation do not establish globally identical chart coverage: ordinary LOD boundary simplification can change chart edges. Independent UV overlap/boundary review is pending at this checkpoint. No texture appearance or perceptual pass is claimed.

All 14 actual default families and the four soldier themes stay below 8,000 visible triangles and at most 14 visible batches: player 7,822; boss 7,950; moss soldier 7,998. An additional exhaustive 70-pair family/theme probe is saved, including unused player/boss theme combinations that exceeded these bounds already in v27. The Cartesian product is not claimed compliant. Scene applies themes to vault wardens; no equipment or Scene behavior is changed here.

The CPU camera/root/pose audit uses exactly the v27 conditions and preserves the head's projected bounding rectangle. See [same-pose audit](evidence/anatomical-head-v28-candidate.json) and [all probed family/theme budgets](evidence/anatomical-head-v28-budgets.json). CPU skin/ray tests cover independent clone state, no old duplicate head skin, monotonic blink, visible eye centers, hood clearance, sealed neck and existing attack/foot contracts. These are not WebGL screenshots, device performance, texture assessment or PS4 acceptance.

## Validation and measured work

`npm test`: 249 / 249 passed, 31.471 s. `npm run build`: 3 chunks, initial JavaScript 163,175 B under unchanged 165,000 B limit; 2.95 s. New focused tests compare every retained surface vertex/UV pair to the original OBJ, retain every corner of all 187 UV seam vertices, including four UV instances at source vertex 855, compare every retained face's orientation to its source ancestor, and reject degenerate cap UVs. Existing topology, neck, skin, blink, attack and contact tests pass.

No new source bytes were downloaded in this unit. Generated module is 120,150 B. Its SHA256 and the exact generator SHA256 are recorded in `anatomical-head-provenance.json`; source OBJ and archived CC0 license/morph hashes are unchanged. Diagnostic source-UV and face-ancestry exports are tree-shaken from the runtime bundle.

Measured generation/rework attempts: initial full seam protection 16.602 s (p95 2.426 mm); incident-edge UV correction 16.579 s (2.404 mm); fully area-weighted quadrics 16.653 s (2.704 mm); inverse-square-root weighting 15.283 s (2.756 mm, max 9.793 mm, rejected); authorized 1,546-triangle unweighted candidate 18.018 s (2.136 mm); final weak area-weighted candidate 14.683 s (2.074 mm). These are actual generation wall times, not visual quality comparisons. Source acquisition 0 s; no new modeling or texture-production time is claimed. The full implementation/checkpoint interval is recorded in the completion message from the worktree start at 02:55:38 UTC.

Next unit: independent UV coverage review, then lawful original skin integration with its original atlas, preserving separate eyes/lids and testing same-view appearance through the authorized preview path. Hands and material/shading improvement remain outstanding.
