# Mira staff, source-only micro-part assembly v63

`makeMiraStaff()` places all 18 planned staff IDs (19 meshes because S05 has two instances). The total is 7,512 triangles and 290,792 B of unique typed geometry buffers. This is the staff alone, not a whole-character/mobile budget pass. The source has no game import and uses unaccepted preview materials. The generated complete Mira, the hand, animation, actual WebGL and PS4 appearance have not been matched.

The eight shaft/foot/grip/collar/finial shape references and lantern references preceded their meshes. Their isolated silhouettes are conditional references; wrong assembly thumbnails and inconsistent S05 helical camera views are excluded. Precise millimetres, sockets, orientation and shared contacts are **authored specifications**, not measurements recovered from generated images. The S05 flat-blank follow-up resolves the component's simple physical shape, but its image length ratio differs from the request; it is not a calibrated multi-view success. Two straight blank instances (346.218/355.683 mm × 8 × 1.5 mm) map into the two winding shapes. Edge ratios .984–1.044 / .884–1.110 mean this map is not certified inextensible leather.

## Actual repairs and assembly

- The first two crossing wraps intersected; adjusting over/under registration and lift removed their proper triangle crossings. The independent review then found the raised lower strip outside the retaining collar. Deferring lift until the full width leaves the collar removes the exterior defect. Remaining retaining-floor intersections are inside the metal channels, separately classified in the review.
- An unsupported wood end originally stopped 26 mm above the foot disc. A hidden constant-radius extension now contacts the entire wood end area, 991.9154 mm². The visible taper from Y30 upward is unchanged. This is geometric support, not a glue/fastener-strength simulation.
- The cup and finial contact their actual receivers at Y1423/Y1674. Four ribs contact both rings. The lower glass cradle and its glass share triangles; the upper cap has a matching closed glass seat. The 16-angle glass/cradle comparison removes 1,472 triangles relative to the 32-angle candidate, with measured but perceptually unaccepted shape differences.
- The assembled native scan has no new nonadjacent crossings. Near-coincident wood/sleeve surfaces and concealed grip retention remain explicitly classified; the raw report is not rewritten as zero intersections.

Reproduce with `node scripts/export-mira-staff-v63.mjs --full`, `python review/staff-v63/plot.py`, and `node --test tests/mira-staff-v63.test.mjs`. `native-full-staff.png` is a CPU projection of actual mesh triangles with flat part colours, not a game screenshot or material rendering. The exported OBJ uses world-transformed triangles, including the inverted lower ring.

## Time and next dependency

Four initial image calls took 34.465, 86.133, 177.113 and 129.140 s (concurrently). The flat blank request ran 14:00:33.891–14:01:06.071 UTC, 32.180 s. The original 3D construction, inspection and repair occupied the working interval beginning approximately 13:37 UTC through this checkpoint; design/code/repair were not all separately instrumented, so no precise whole-production duration or speedup is asserted. Independent staff review records 937.39 s, including one native batch and the two required repair rechecks. Export/constructor milliseconds are execution costs only.

Before runtime adoption: material/UV fidelity; reasonable whole-character complexity; actual hand grip and motions; real multi-view rendering and device measurement. The user’s whole-character request is still incomplete. This source is a reproducible step, not a finished character or updated play version.
