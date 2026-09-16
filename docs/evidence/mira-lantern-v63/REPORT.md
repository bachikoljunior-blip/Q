# Mira lantern head v63 — finite geometry candidate

S07 lower cup, S08 lower ring and S16 closed luminous glass are real native meshes. The four existing ribs and S13 remain byte-identical. A new, versioned S14 preserves its external profile and S13 interface while adding internal glass and finial seats. This is a development-only head assembly, **not imported into the game**. It does not establish material appearance, complete staff/hand integration, actor budget, iPhone performance, or PS4 quality.

Base: `22d1d041dd6aef60de7764b1eebf6cf78028c857`. Only new `review/lantern-v63`, its exporter/test and this evidence directory are written. Old geometry and all production source are unchanged. No browser, hosting, renderer fallback, dependencies or package configuration were changed. Existing dependencies were installed after parent configure succeeded.

## References precede the geometry

The exact two original reference inputs, original prompts, generated PNG hashes and generation timestamps are in `references/`. Both original input images and both outputs were viewed. The first three-type sheet supplied the rounded cup and open flat lower ring. Its S16 glass row added vase-like lips and was rejected. One focused glass correction supplied a closed oval, thinner side and closed elliptical top; those qualitative features were selected. Panel magnification and generated numerals are not CAD measurements. There were exactly two image generation calls, 67.074 seconds total, and no raster manipulation.

The new images are OpenAI image-generation output, not a photograph, scan, measured drawing or CC0 source asset. The existing rib reference still has an unresolved small box-like end versus native tapered end difference. The new assembly keeps those existing ends because they already provide explicit closed flat attachment faces; it does not claim exact reference reproduction or silently redesign them.

## Geometry and joints

All coordinates below are staff millimetres, +Y up, +Z front. Exact dimensions and invisible joining surfaces are authored registrations. They are not inferred precision measurements from the generated sheet.

| Interface | Native construction | Observed contact |
|---|---|---|
| S06 → S07 | Y1423, cup bottom annulus R6.3–10, aligned regular 16-gon | 184.637092 mm², entire cup annular foot received |
| S07 → S08 | Y1441, cup rim R14.5–18; S08 is the existing S13 profile inverted at Y1444 | 348.241921 mm² |
| S08 → four ribs | Y1447, actual flat annular 16-gon seat | 23.919998 mm² for each full pad |
| Glass → S07 cradle | Shared lower three elliptical strips and pole, lower pole Y1447 | 80 coincident triangles, 163.494420 mm², opposing normals |
| Four ribs → S13 | Y1662, existing regular 16-gon seat | 23.919998 mm² for each full pad |
| S13 → revised S14 | Y1668, old contact preserved | 348.241921 mm² |
| Glass → revised S14 | Closed top cut at Y1662, internal receiver annulus | 141.123805 mm²; intentionally partial area of the closed glass top |
| Revised S14 → S15 | Internal floor Y1674 with R6.3 opening; top mouth R6.8 | 110.212825 mm², entire actual S15 stem base received |

S16 retains the registered center Y1556 and maximum radii 52/109/39. Its hidden upper 3 mm is replaced by a closed planar top under the receiver. Its real elliptical rings, poles, quiet vertex color variation and transmissive/emissive physical-material intent are implemented; it is not an image pasted on a card. The shared cradle is new hidden design, distinct from the visible rounded cup reference. S14's new internal floor and upper mouth receive the existing R6 stem / R12 sphere centered at Y1688. The old S14 analytic envelope failure is preserved in the report as a negative baseline, not rewritten as a passing result.

S06/S15 are read-only native geometry from the exact separate author snapshot recorded in `parent-boundary-snapshot/SOURCE.json`; this unit does not own their production source. Their world-space Float32 storage yields raw Y gaps 0.00002062 and 0.00002408 mm. Cross-author contact selection uses a recorded 0.0001 mm plane tolerance; own head joints retain 0.00001 mm. Actual plane levels remain in the JSON. These are not zero-gap claims at infinite precision. Related S06/S15 versus head triangle-interior crossings are zero in the six measured pairs.

## Same-object 32/16 comparison

`makeLanternHead({glassSegments:16})` is the exported candidate. The default 32 version remains reproducible for the comparison; no old defaults or cap profiles are edited.

| Measurement | 32 angles | 16 angles |
|---|---:|---:|
| Head triangles | 5,712 | 4,240 |
| Unique indexed attribute/index bytes | 193,344 | 141,688 |
| Meshes / geometry objects / materials | 9 / 7 / 2 | 9 / 7 / 2 |
| S07 triangles | 1,344 | 672 |
| S16 triangles | 1,600 | 800 |
| Cradle shared triangles | 160 | 80 |

The 16-angle choice saves 1,472 triangles and 51,656 buffer bytes. Every ring's actual 16-gon receiver perimeter remains fixed. Every native triangle vertex and centroid was compared with the nearest triangle of the other version: maximum sampled glass difference is 0.984696 mm (32→16) / 0.660122 mm (16→32), cup 0.026815 / 0.028032 mm. This is a finite sampled surface comparison, not a Hausdorff bound or perceptual equivalence claim. Front, true side and three-quarter CPU projections were generated from indexed vertices and viewed; the lower joint section shows the separate hidden cradle. They are **not a WebGL/game screenshot** and their opaque color swatches do not test transmission or lighting.

The separate parent snapshot has 3,240 triangles; adding this candidate gives 7,480 for the staff alone. That does not establish the complete actor's 8,000-triangle budget. Nine meshes are not a measured draw-call count: shadows and physical transmission may add passes. No GPU allocation, upload time, frame rate, energy or real-device measurements are available. There are no raster maps, media fetches or production asset imports in this candidate.

## Verification and reproduction

`node --test tests/mira-lantern-v63.test.mjs tests/mira-lantern-micro-v62.test.mjs tests/mira-micro-parts.test.mjs` passed **13/13**, 990.799387 ms for this run. All nine head meshes are finite closed consistently wound solids with positive volume and nondegenerate faces. All 45 same-mesh/interpart proper-crossing pairs are zero; intentional coplanar joins are measured separately. The 16- and 32-angle variants both pass. Old four ribs/S13 attribute/index/transforms are byte-identical. Resource disposal acts once per unique geometry/material.

Meaningful negatives remain: lower cup shifted down 1 mm loses its cradle/ring contacts; glass lifted 1 mm crosses the receiver; the native parent finial shifted up 1 mm loses its seat. The previous cap/original smooth ellipsoid envelope violation remains reproducible. Passing these technical checks does not establish aesthetic acceptance.

Reproduce exports with `node scripts/export-mira-lantern-v63.mjs`; compare data lives in `geometry/report.json`. `python docs/evidence/mira-lantern-v63/plot-geometry.py` produces the CPU projection from the saved native mesh. The OBJ files include individual new parts, nine-part head, and an eleven-part boundary assembly with the separate author's S06/S15 snapshot. Do not re-download or regenerate reference images to reproduce tests. SVG trailing whitespace is normalized and its exact bytes preserved in `geometry/native-projections-svg.json` using gzip+base64 with an uncompressed hash; original PNG bytes are untouched. Exact absolute paths in recorded generation receipts describe the original session, while source and script references in this checkout are relative.

## Time and remaining work

`TIMING.json` separates generated-image waits, selection, implementation-to-first-inspection, required interface/LOD rework, export/verification and plotting. These are elapsed windows that include reasoning and tool/communication overhead, not exclusive stopwatch labor. Initial native construction plus parent snapshot generation was 203.147155 ms in one Node run; total export/analysis was 1,978.234824 ms. Those numbers do not measure the time to design/model the object or device performance.

This unit's geometric evidence supports saving a finite candidate for independent review. Remaining work is full staff assembly and material consolidation, hand/pose/ground integration, exact reference endpoint appearance, complete actor cost and formal rendered comparison. GL Disabled is unchanged and no alternative browser/driver/settings path was used. The September 20 all-screen PS4 goal remains unproven; this local geometric improvement is not completion of that goal or of the full Mira part ledger.
