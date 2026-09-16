# Independent full-staff assembly review v63

**Conclusion:** No new required source repair was found in the specified static assembly. The complete planned staff ID list is present, and the new lantern interfaces have real triangle contact. This validates a source-only part arrangement, **not a finished character, hand attachment, physical fastening, material appearance or runtime adoption**.

Fixed input: `Q-mira-micro-v63` commit `645ed4b1a31bdc6f07ff66a90e0058f7392394bb`. Snapshots of all five construction modules were imported from this review directory, with original relative imports retained. Source bytes were checked against that commit before execution and against their captured hashes after it. This makes unrelated later batching/export/document changes outside the snapshot irrelevant to these results.

- `assembly.mjs`: `dabaaee77dbf0e16f80605c3b1a3a39e2897b2c9d89898b22eefb71d98236481`
- `staff-parts.mjs`: `c71aad81b0acaff2070b3681dcdae8ba057c51a28468cef5a16957fa69d1f5cc`
- `lantern-head.js`: `db88b7c1eb36c1c58fde73dfad4668505e46893f39708a44320a600574fbaf5d`

The old v61 caps and v62 ribs source remains byte-identical to base `22d1d041dd6aef60de7764b1eebf6cf78028c857`. Revised S14 is a new versioned construction; the old source was not rewritten.

## Method and identity

One independent native batch constructed the full staff and its lower/head components to compare their exact geometry buffers and world matrices. IDs are S01–S18, with S05-A/S05-B: **18 planned IDs / 19 mesh placements**, no missing or duplicate placement. All `partId` values, all per-part attribute/index bytes and all world transforms agree with the separately constructed components, including the rotated S08 lower ring and staff-coordinate Y registration. No extra hand, scene origin, or anatomical alignment is implied.

The oracle independently reads native transformed triangles, welds only coincident position keys at 0.000001 mm precision for topology, checks oriented edge incidence and volume/normals, measures triangle contact areas, and tests strict segment-plane/triangle-interior crossings. It does not import the author's inspection helpers. Prior lower-staff bevel and wood-end sweeps were not repeated.

All 19 meshes have finite vertices/normals, positive nondegenerate face areas, positive signed volume, every welded edge used twice with opposite orientation, and positive face/vertex normal agreement. These are closed individual solids; the assembled staff is multiple contacting/retained solids, not one watertight union.

## Native support interfaces

Contact area was independently computed from triangle intersections by collecting mutual vertices and edge intersections, forming a convex hull and measuring its area. This differs from the author's polygon-clipping implementation. The plane selection tolerance is **0.0001 mm**, and the actual native Y levels remain in `result.json`.

| Upward support → supported part | Nominal Y (mm) | Native overlapping face area (mm²) |
|---|---:|---:|
| S03 foot disc → S01 wood end | 4 | 991.915436 (entire wood end) |
| S01 wood top → S06 neck's internal annulus | 1418 | 1228.597503 (partial annulus) |
| S06 neck → S07 cup foot | 1423 | 184.637092 (entire cup foot) |
| S07 cup → S08 lower ring | 1441 | 348.241921 |
| S08 → each of S09/S10/S11/S12 | 1447 | 23.919998 each (entire rib pad) |
| Each rib → S13 upper ring | 1662 | 23.919998 each (entire rib pad) |
| S13 → revised S14 | 1668 | 348.241921 |
| S16 glass top → S14 receiver | 1662 | 141.123805 (partial glass top) |
| S14 internal floor → S15 stem base | 1674 | 110.212825 (entire stem base) |

There are 15 measured horizontal interfaces. Shared cup/glass cradle: **80 coincident native triangles / 163.494420 mm²**, opposing face normals (maximum dot −.9999999999999996). This confirms the paired 16-angle construction actually used by the full assembly, not the 32-angle default.

Float32 placement is not exact real-number coincidence. The cup/neck plane difference is .000020623 mm and finial/floor difference .000024080 mm; these are below the recorded contact tolerance, not silently reported as mathematical zero. The glass upper face is deliberately truncated/closed under the new receiver. Its successful actual-mesh contact does not retroactively change the old S14 versus full analytic ellipsoid failure.

One intentional negative was applied only to the in-memory object: lift S15 by 1 mm. Its contact area at Y1674 became exactly zero. The object was restored, and no source or saved mesh changed. No extra fault sweep was added.

## Crossings and retained limits

All 190 unordered pairs including self-pairs were checked once. The nine-part head's 45 pairs have no proper interior crossing, and no new crossing pair appears in the full staff.

Seven **known** pairs remain nonzero: wood/sleeve (S01/S04), sleeve/wraps (S04/S05-A and B), and the four collar/wrap retention pairs (S17 or S18 with S05-A or B). The independent strict-plane oracle counts 80 wood/sleeve triangle pairs versus the author's 100 near-coincident Ray-based count; the other six pair counts agree (288, 254, 9, 9, 9, 9). This numerical sensitivity at almost shared surfaces is not interpreted as a new repair or proof of zero overlap. Their existing retention classification is preserved; the scope did not repeat the prior exterior-collar sweep.

This test excludes coplanar overlap, tangent contact and complete containment, and is not a proof of physical clearance or fastening strength. `diagnosticPlaneDepthMm` in the raw oracle output is the maximum vertex distance from another triangle's infinite plane; **it is not penetration depth** and is not used for acceptance. Segment-interior results and separate contact measurements are the relevant evidence here.

## References, cost and adoption boundary

The original `lower-cup-ring-glass-v1.png` and corrected `glass-multiview-v2.png` were viewed. S07's shallow cup/foot and S08's open band are qualitative references; their exact hidden seats are authored. The first S16 row has a vessel-like lip and remains rejected. Corrected S16 supports a closed oval and thinner side, but exact camera calibration, texture, emission and translucent appearance are not established. These are generated fictional design images, not photographs or gameplay.

The already documented rib box-end versus native tapered-end difference remains. S05 helical-view inconsistency and flat-blank aspect limitations remain separately recorded; no generated label is used to prove an exact camera or metric dimension. No new image or geometry was made by this review.

The staff has **7,512 triangles**, of which the 16-angle lantern head has **4,240**. Unique native geometry buffers total **290,792 B**, in 17 geometry objects and 5 material objects. Bounds are approximately 147 × 1700 × 112 mm. Mesh/material counts are not actual draw-call measurements: physical transmission, lighting and shadows can add rendering work. The staff alone nearly occupies the historical 8,000-triangle whole-actor target; completion of all IDs is not budget acceptance. Hand binding, animation, actual materials/UVs, reference fidelity, full-character cost, GL output and device performance remain open.

One native batch completed in **523.467 ms** on this host, including construction, checks and metrics. Overall read/analysis/report elapsed time is recorded separately. No large LOD or pose sweep, browser/renderer fallback, source edit, image edit, Git mutation or new agent was used. All test-created resources were disposed, all tool calls ended, and source hashes remained unchanged.

This is finite geometric evidence for preserving the candidate. It is not full Mira completion, a delivered game update, PS4 quality, or evidence that the September 20 whole-screen target is achieved.
