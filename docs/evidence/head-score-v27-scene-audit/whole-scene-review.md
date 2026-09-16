# Whole-scene integration review: v25 → v27

Reviewed baseline `fb70ddddf8df261851b66b5e29b32ac723818ff1` against candidate `d07bcad57709449513d2828ecf585db956e60894`. Candidate observations ended 2026-09-16T03:00:10.762Z. No required integration fix was found in this bounded structural comparison. This does not establish PS4 visual quality or a device frame-time budget.

The oracle invokes the real asynchronous SceneView factory, real Game and native Three geometry/material/matrix/frustum logic at 1280×720, day 0.29, yaw 0.05, pitch 0.3 and zoom 9. Four fixed player positions are sampled at low, medium and high quality, with two identical 1/60-second updates per condition. Camera position/quaternion, actor identity/visibility, game serialization and forest near/far counts match. WebGLRenderer is an explicit boundary double. Vault, environment and forest texture entrypoints return empty maps; HDR uses the actual file and native HalfFloat HDR decoding. There is no rasterization or GPU measurement.

| Attached scene allocation | v25 | v27 | Change |
|---|---:|---:|---:|
| Actor instances | 44 | 44 | +0 |
| Mesh objects | 1,587 | 1,616 | +29 |
| Unique geometries | 740 | 757 | +17 |
| Geometry source-buffer bytes | 21,131,274 | 21,409,210 | +277,936 |
| Instance source-buffer bytes | 1,509,260 | 1,509,260 | +0 |
| Material objects, including custom shadows | 221 | 234 | +13 |

The attached geometry payload increases by 277,936 bytes (1.315%). Scene allocation includes attached hidden objects; source-buffer bytes exclude driver allocations and unattached authoring/cache intermediates. Material objects are not shader-program counts. Source triangle accounting respects draw ranges, material groups and instance counts; it does not multiply shadow or transparent rendering passes into the main triangle column.

| Quality | Player x,z | Visible triangles v25 → v27 | Native frustum candidates v25 → v27 | Visible mesh change |
|---|---|---:|---:|---:|
| low | 0, 80 | 436,312 → 441,092 | 291,218 → 295,998 | +10 |
| low | -105, 0 | 407,944 → 410,968 | 248,482 → 251,506 | +6 |
| low | -300, -130 | 367,728 → 369,240 | 180,916 → 182,428 | +3 |
| low | 170, -200 | 376,188 → 377,700 | 199,212 → 200,724 | +3 |
| medium | 0, 80 | 469,692 → 474,472 | 324,598 → 329,378 | +10 |
| medium | -105, 0 | 441,070 → 444,094 | 281,608 → 284,632 | +6 |
| medium | -300, -130 | 392,948 → 394,460 | 206,136 → 207,648 | +3 |
| medium | 170, -200 | 414,464 → 415,976 | 237,488 → 239,000 | +3 |
| high | 0, 80 | 576,908 → 581,688 | 431,814 → 436,594 | +10 |
| high | -105, 0 | 551,096 → 554,120 | 391,634 → 394,658 | +6 |
| high | -300, -130 | 498,110 → 499,622 | 310,920 → 312,432 | +3 |
| high | 170, -200 | 533,348 → 534,860 | 356,372 → 357,884 | +3 |

Every triangle/mesh delta equals the corresponding change in visible actor geometry. Terrain, instanced work, forest near/far assignment, point count and transparent extra-pass candidates remain equal. At each quality, the four point increases are 4,780 / 3,024 / 1,512 / 1,512 triangles. Native frustum candidates obey the existing `frustumCulled` policy and use whole instanced-batch bounds; they are not measured GPU submissions.

All 29 humanoids have exactly one 1,496-triangle anatomical face; all 15 wolves have none. This includes the seven residents, boss, three rangers and all four themed wardens. The 29 heads use 17 actual attached template geometry objects: the 11 plain soldiers share one, the three rangers share one, and type/theme variants retain their own templates. Their total head buffers are 1,045,568 bytes; the smaller net scene increase reflects replaced old head parts. `faceSurface()` caches the authoring surface (detailed-geometry.js:91), `faceMaterial()` caches the cloned skin material (line 101), and final template cloning shares head geometry; the existing mutable cape clone remains separate (line 396). No geometry dispose event occurred during the 12 quality/location transitions. This scope checks retention during transitions, not full application shutdown or process memory reclamation.

All resulting head meshes are native SkinnedMesh objects with MeshStandardMaterial, cast/receive shadows, and no explicit material envMap override. They therefore remain on the native scene-environment path. Candidate scene.environment is installed in every condition with one consistent rotation. The native PMREM implementation makes 19 render-method calls once during installation and none additionally for the quality/location changes; the renderer boundary executes no GPU work. The recorded sky budget is 4,194,304 bytes visible HDR plus 1,572,864 bytes IBL (5,767,168 bytes steady texture payload), separate from geometry. Temporary input/ping payloads are 1,048,576 / 1,572,864 bytes. HDR lifecycle, fallback and shader review are covered by the earlier dedicated sky audit and were not reopened.

| Emitted transfer payload | v25 bytes | v27 bytes | Change |
|---|---:|---:|---:|
| Initial entry JavaScript | 163,175 | 163,175 | 0 |
| Scene JavaScript | 120,194 | 216,595 | +96,401 |
| Three JavaScript | 571,335 | 578,362 | +7,027 |
| All 3 JavaScript chunks | 854,704 | 958,132 | +103,428 |
| Manifest-referenced files | 10,377,838 | 11,916,385 | +1,538,547 |

The single added runtime asset is the 1,435,119-byte HDR. Harmony and pulse hashes change at identical byte lengths; the other 23 existing asset hashes remain equal, including every existing image, title media, vault SFX, motif and foley. Each emitted asset was matched back to its actual source SHA-256 and byte length. These are uncompressed file bytes, not request timing or cache/compression measurements; manifest totals exclude HTML, icon and webmanifest. Initial entry JavaScript is not the complete title-screen transfer. The integration owner separately performed source/build/package/staged-public-byte checks.

Key candidate source readback:

| Source | SHA-256 |
|---|---|
| `src/scene.js` | `965711336afa602023a255218e95cb7c21bfd2b9c4eae926a1707fdff655a7c6` |
| `src/assets/characters/detailed-geometry.js` | `38635124d5ff5fa6f6ce21c659ed777b64a7f2d5b0122cee5b1e478e74ccd5a2` |
| `src/assets/characters/anatomical-head-data.js` | `9a8bb68a01f52f52eba6849c8dd34202b9e4d8d8e93d1987f3ee2e1541fe2118` |
| `src/sky-lighting.js` | `7bd023cf23cc5269e2ce25e9c289d31e9f50ac870556e0f277c16414a4d40762` |
| `src/environment-atmosphere.js` | `c78303af10af15142d6d9510dd398fd528205b6e3f2de711dc4093ff8ec1aef2` |

Reusable files: `measure-whole-scene.mjs` measures one supplied checkout to a supplied JSON path; `compare-whole-scene.py [audit-directory]` checks the paired saved observations and current asset-source hashes. `baseline-v25.json`, `candidate-v27.json` and `whole-scene-comparison.json` preserve the exact conditions, inventories, identities, budgets and transfer hashes. All comparison assertions passed. No repository source or remote state was modified.
