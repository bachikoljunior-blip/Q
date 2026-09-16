# v27 — source-derived anatomical head, visible eyes and retained motion

This finite unit replaces the analytic sphere face, separate oval ears, dot nostrils and mouth cylinder with a registered, artist-authored **MakeHuman hm08 CC0 head**. It also fixes an existing sideways hood opening and a helmet front brim that hid both eyes, and fits the two existing eyelid patches so a complete blink no longer reveals the irises again. Bodies, hands, fingers, gameplay, saved attack clocks, weapon grips and foot placement are unchanged.

**This is not a scan, mocap, verified photorealistic result, device-performance result or PS4 acceptance.** No WebGL/game image was obtained. The source skin PNG remains unacquired/unverified; the candidate uses the existing uniform skin colour and procedural bump/roughness under its own material. Source facial anatomy and the low-detail eye/hair/material treatment still require rendered evaluation.

## Source, derivative and limits

The exact original 1,749,303-byte `sources/makehuman-hm08.obj` is retained, pinned to official MakeHuman commit `a8bc2d54ff0ac92e78ff71431b1023eda42bf482`. SHA-256 is `8e761e6624b8f54536409135d1636da63b32486a90d4897f84e121d144f6fb4c`. Its explicit CC0 header, complete CC0 asset license and two researched but **unapplied** morph files are archived and hashed in [anatomical-head-provenance.json](../src/assets/characters/anatomical-head-provenance.json). [Official licensing](https://github.com/makehumancommunity/makehuman/blob/a8bc2d54ff0ac92e78ff71431b1023eda42bf482/LICENSE.md) distinguishes graphical assets from AGPL application code; this implementation includes no MakeHuman engine code.

The deterministic offline [generator](../scripts/characters/generate-anatomical-head.py) selects only `body` quads above the neck cut, omits all helpers, registers source eye/chin/crown/nose/ear landmarks, tucks a short collar into the existing neck and closes its46-edge boundary. Initial source selection is4,220quads/8,440triangles/4,244vertices. A feature-locked plane-error reduction retains375 vertices on UV seams, the neck boundary, nasal/lip/ear ridges and sampled front/side silhouettes. It preserves source endpoint positions rather than freely moving collapsed vertices through anatomical features. The final surface is1,450triangles plus46captriangles,938UV-split vertices,5packedUV islands. There is no hidden high-detail runtime head or unmeasured wholesale body replacement.

The generated JavaScript asset is99,284bytes (including source-ID diagnostics that production tree-shaking can discard). It is imported within the already deferred scene. Five UV regions—outer head/ears, mouth interior, two eye regions, neck—have separate padded rectangles; there is no derived skin-image atlas yet. The source material descriptor references a3,693,828-byte PNG, but transfer was stopped in the preceding research and no PNG bytes, dimensions or pixel contents were verified. No transfer was restarted for this implementation.

## Same-condition numerical comparison

The [baseline](evidence/anatomical-head-v27-baseline.json) uses fixed base `fb70ddddf8df261851b66b5e29b32ac723818ff1`; the [candidate](evidence/anatomical-head-v27-candidate.json) records exact source hashes. Both use the same actor root, head/eye pivots, camera and saved pose conditions. These are actual Three.js skin/ray/projection calculations without a renderer.

| Measurement | Before | Candidate |
|---|---:|---:|
| Player visible triangles / material meshes |7,268 /13|7,772 /14|
| Boss visible triangles / material meshes |7,396 /13|7,900 /14|
| NPC visible triangles / material meshes |6,064 /11|6,568 /12|
| Moss warden candidate before budget correction → final |8,208|7,948|
| Open player/ranger eye-grid rays blocked by hood, of18 |18|0|
| Open soldier/boss eye-grid rays blocked by helmet, of18 |18|0|
| Uncovered NPC eye-grid visibility at full blink, of18 |14 (iris reappeared)|0|
| Candidate open→quarter→half→three-quarter→closed eye rays |—|10→8→2→2→0|
| NPC head-skin projected width,390×844 CSS |23.3366px|23.3352px|
| NPC head-skin projected height,390×844 CSS |25.3309px|27.1940px|

Both central irises are visible when open, including under corrected hood/helmet. The smaller10/18 open-grid result is caused by the different orbital geometry; it is not a target pixel score and does not certify natural eyelids. Projected head-skin height includes the new lower collar, which is tucked inside the old neck; chin/crown, eye and ear anchors retain the original head envelope. These projected points do not measure visible pixels or occlusion.

The original hood's omitted azimuth faced−X although the face points+Z. Rotating the unit-sphere opening+π/2 fixes this while preserving position/radii. The helmet adjustment raises only the lower front brim above the eyes, retaining crown, rear coverage and side plates. The five small moss chest adornments changed from100to48triangles each with their former axis bounds preserved, so the existing8,000-triangle ceiling holds for all four warden themes as well as every family. No budget threshold was raised.

## Fidelity and deformation evidence

LOD distances use the **registered and collar-fitted source** as their reference. They do not measure how much the anatomical registration itself changes the untouched MakeHuman source.

- All4,244 reference vertices to candidate triangles: maximum7.062869mm, p95 2.031413mm, mean0.686469mm.
- All1,450 candidate surface-triangle centroids to the reference: maximum4.655738mm, p95 2.008535mm. Neither sample set is a continuous Hausdorff bound.
- Registered source normals transfer at665retained vertices only where they face every surviving incident triangle; neck cap and sharp folds use final-topology normals. Among703retained non-neck vertices, normal difference is mean1.415237°,p95 6.494679°,maximum60.027275°. Large local angular differences remain at sharp folds and are not hidden by the average.
- Welding by preserved source IDs produces one connected closed oriented manifold, including every UV split and the cap. All triangle areas are positive; normals and UVs are finite; UVs remain in[0,1].
- The independent reviewer found the initial collar exposed during sealed head pitch: maximum normalized neck-ellipsoid squared radius1.290352. Tucking only the final46rim vertices farther inward reduces its independently sampled maximum to0.662451. Existing head/neck bones and pose values remain unchanged.

The new face uses a separate `Q anatomical face` material, so no future face map can accidentally cover the hands. Original face/ear/nose/mouth pieces are removed before batching; eyes, eyebrows, hair, beard, headwear and the two named lid bones remain. Lid geometry is fitted around the registered eyes while blink timing and the existing0.015m bone translation remain intact. No `actor-models.js`, `character-motion.js`, `rigged-actor.js` or gameplay/save source changed.

## Verification and measured work

`npm test`: **247/247**,43,201.795ms, including five new focused tests. Existing weapon/skin tests hit the actual new skinned head in369sampled player attack frames across all nine weapon/combo profiles; there were no blade/body centerline intersections. Contact, saved-pose reconstruction and clone independence continue to pass. New tests cover source/generator/data hashes, all family and four-theme budgets, no duplicate old head skin, palette/geometry sharing, all-human open/closed blink rays and animated neck containment.

The independent reviewer replayed the generator into separate scratch output and obtained byte-identical data. Its focused24tests passed in12.307s. It caught and rechecked the animated-neck and moss-budget corrections. [Independent review](evidence/anatomical-head-v27-independent-review.json) and [separate generator replay](evidence/anatomical-head-v27-generator-replay.json) preserve its narrower evidence boundary.

Build:84modules,8.12s; initial JS**163,175B <165,000B**; exactly3currentJS chunks totaling943,399B. The existing Three vendor >500kB warning remains. The deferred scene grew with the anatomical data; no device-memory/FPS improvement is claimed. Two stale chunks from this worktree's earlier candidate build were removed before counting final current output. Packaging, staging and publication belong to the integrator and were not performed here.

Worktree creation was2026-09-16T02:29:45.495Z; final timings and source/build identity are in [validation evidence](evidence/anatomical-head-v27-validation.json). Original asset acquisition happened in the preceding research and is not counted as this unit's generator time. Measured generator runs are separately recorded: initial9.391s; contour-lock rework11.514s; added surface/normal audit17.809s; collar rework16.421s; source-normal transfer17.447s; final reproducibility/provenance run22.406s. Initial maximum distance22.363mm was rejected before integration. Review feedback, source preparation, code integration and test/build wall time are not conflated with these generator timings.

The next actor-quality gap remains verified skin/material detail, natural eye/lid/hair transitions and hand anatomy at appropriate viewing distances. This bounded head integration does not certify their appearance or complete the whole-screen PS4-quality objective.

## Subsequent texture-readiness finding before integration

The v27 skin material remains untextured. An independent inspection for the next skin-source unit found that the generator preserves five region boundaries but collapses multiple source UV corners within the same connected island through its `(source vertex, region)` key. The retained UVs are packed, not the original skin-image coordinates. This does not change the current flat material, but it is not texture-ready: a source-corner/seam-preserving mapping to the original atlas is being repaired in the separate v28 unit before any skin image is applied. The 46 hidden cap triangles have zero UV area. Finite or bounded UV values alone are not texture-fidelity evidence.
