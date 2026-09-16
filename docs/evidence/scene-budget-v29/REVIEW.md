# Independent v23 → v29 resource budget audit

Baseline `f11819aceea515d166846e4bf85082bf2e51e9d1`; candidate `62f731e3ba0924c70f3879174053db7824a449ae`. Runtime is byte-identical to candidate 13545e4. Exact relevant file hashes and measurements are in `budget-comparison.json`, with full scene inventories in the two raw JSON files. No repository or remote mutation was performed.

The principal growth is texture payload, not geometry. Native attached geometry arrays grow **830,504 bytes (+3.97%)**, while calculated texture-format payload grows **30,932,988 bytes (+169.37%)**, from 17.417 to 46.917 MiB. This is not measured device GPU memory or evidence of visual quality/PS4 equivalence. No unbounded growth was found in the normal navigation paths inspected; this is not a general leak certificate.

## Measured CPU structure

Actual Game and asynchronous SceneView/native Three geometry were exercised at the same four positions × low/medium/high, 1280×720 DPR1, day .29, yaw .05, pitch .3, zoom9, two frames per condition. All 12 camera transforms and all 44 actors (29 humanoids,15 wolves) match. Renderer calls are an explicit boundary double, not rendering; native PMREM issued 19 method calls once. Image entrypoints use native Texture objects with dimension metadata; forest RGBA, HDR HalfFloat, procedural pixels and bone palette arrays are actual decoded/generated CPU data. Custom shader uniforms were collected without compiling shaders.

| Geometry arrays / structure | v23 | v29 |
|---|---:|---:|
| Attached unique geometry bytes | 20,895,502 | 21,726,006 |
| Actor geometry bytes | 5,779,492 | 6,132,976 |
| World geometry bytes | 15,116,010 | 15,593,030 |
| Attached plus explicit cached grass/telegraph geometry bytes | 20,898,272 | 21,728,776 |
| Instance source arrays | 1,509,260 | 1,509,260 |
| Tree selection CPU copies | 142,704 | 142,704 |
| Attached unique geometries | 743 | 793 |
| Mesh objects | 1,590 | 1,616 |
| Materials | 222 | 238 |

These are deduplicated source arrays/object inventories, not total JS heap, GPU buffers or draw calls. Zero geometry disposal events occurred during the 12 quality/location transitions. Fixed-condition hierarchy-visible triangles include instancing and selected LOD; frustum candidate statistics are additionally in JSON. Neither measures occlusion or rasterized pixels. Changed geometry/batch bounds can alter frustum candidates sharply.

| Quality | Position x,z | v23 visible triangles | v29 visible triangles | Delta |
|---|---|---:|---:|---:|
| low | [0, 80] | 432,016 | 442,368 | +10,352 |
| low | [-105, 0] | 403,648 | 412,044 | +8,396 |
| low | [-300, -130] | 363,432 | 370,166 | +6,734 |
| low | [170, -200] | 371,892 | 378,626 | +6,734 |
| medium | [0, 80] | 458,636 | 475,748 | +17,112 |
| medium | [-105, 0] | 430,504 | 445,170 | +14,666 |
| medium | [-300, -130] | 386,962 | 395,386 | +8,424 |
| medium | [170, -200] | 400,366 | 416,902 | +16,536 |
| high | [0, 80] | 559,980 | 582,964 | +22,984 |
| high | [-105, 0] | 533,204 | 555,196 | +21,992 |
| high | [-300, -130] | 487,498 | 500,548 | +13,050 |
| high | [170, -200] | 506,068 | 535,786 | +29,718 |

## Calculated texture payload (bytes)

Source/sampler aliases are deduplicated. Full mip chains and native padded skeleton palettes are counted. This is potential format payload after relevant textures have been used/uploaded, not evidence that every texture is immediately resident.

| Texture family | v23 | v29 |
|---|---:|---:|
| Environment 3 x 1024 RGBA8+mips | 16,777,212 | 16,777,212 |
| Vault 4 x 128 RGBA8+mips | 349,520 | 349,520 |
| Procedural environment 7 x 128 RGBA8+mips | 611,660 | 611,660 |
| Procedural actor 5 x 64 RGBA8+mips | 109,220 | 109,220 |
| Static terrain contact 512 R8 | 262,144 | 262,144 |
| Native 44 skeleton palettes RGBA32F | 153,344 | 153,344 |
| Smith skin 2048 RGBA8+mips | 0 | 22,369,620 |
| Forest 2 x 512 RGBA8 manual mips | 0 | 2,796,200 |
| Visible HDR 1024 x 512 RGBA16F | 0 | 4,194,304 |
| PMREM 384 x 512 RGBA16F | 0 | 1,572,864 |
| Total | 18,263,100 | 49,196,088 |

The **21.333 MiB skin figure is correct for one 2048² RGBA8 atlas including mips**, not per humanoid. Actual eligible use is only `resident:smith-ren`; atlas loading is shared and not repeated across 29 humans. Its browser base-image RGBA equivalent is 16 MiB, distinct from GPU mip payload. Low/medium/high do not resize or release these textures.

Measured unique CPU typed pixel arrays rise 956,160 → 7,946,664 bytes. Separately, browser-image RGBA equivalents rise 12,845,056 → 29,622,272 bytes; these are dimensional estimates, not browser decoder/heap observations. PMREM output has no CPU pixel array and is excluded from that browser-image figure. CPU and GPU estimates must not be added as physical/unified-memory consumption.

HDR retains a 4,194,304-byte source array/visible texture. Successful PMREM preparation additionally uses a temporary 1,048,576-byte half-float input and 1,572,864-byte ping target, then requests their disposal. GC/driver release timing is unknown. Unsupported float-render-target capability skips PMREM/visible HDR GPU creation, while the already decoded HDR loader source can still remain cached on CPU. Previously documented public-API uncertainty for an exception before PMREM returns its output target remains; this audit does not resolve that failure-only reclamation question.

## Title and game residency

`main.js`, `title-cinematic.js`, and package-lock are byte-identical to v23. `ensureView` reuses one pending/successful view; title/new-game navigation does not recreate it. Actual title module with explicit DOM/video/RAF doubles confirmed three loading→game cycles: loading keeps video `src`; game activation removes `src` and calls `load()` once per cycle.

| Phase | World resources | Title video |
|---|---|---|
| Cold title | Scene module/view not yet created | Active |
| Initial world loading | Images/HDR/scene/PMREM build concurrently | Still active |
| In game | Retained, rendering enabled | Source-release requested |
| Return to title | Retained singleton; game frame exits without rendering | Reattached/active |

Therefore initial load can overlap decoder, image decode and PMREM transients; return-to-title can overlap retained world resources and a new decoder. These are bounded lifecycle overlaps, not measured memory spikes. Parent has separately assigned earlier decoder release in v30; no source change is requested here.

The unchanged 1280×720 title MP4 is 3,178,191 encoded bytes. A YUV420 frame is 1,382,400 bytes, an RGBA frame 3,686,400; retained frame count/browser storage is unknown. Do not multiply by all 288 frames. Poster is 1672×941 (6,293,408-byte RGBA equivalent). Canvas is 3,686,400-byte RGBA equivalent at test viewport, capped at 6,400,000. Hidden canvas/poster dimensions persist; unload requests do not prove immediate decoder/GPU reclamation.

## Encoded assets and exclusions

Manifest-referenced runtime asset encoded source bytes: **9,136,611 → 11,441,662**, delta **2,305,051**. Added skin WebP 541,954; forest PNGs 327,978; HDR 1,435,119. Source-only skin PNG, original four forest JPEGs and title source PNG are excluded. Music encoded lengths are unchanged, though harmony/pulse bytes changed. Candidate manifest initial JS is 163,956 bytes in three JS chunks; this audit has no regenerated baseline build or network-transfer timing comparison.

Actual GPU allocation, lazy upload timing, framebuffer/MSAA/driver overhead, shadow depth storage, browser image/video decoders, audio decode/resampling, GC, overall process memory, frame time and real screen quality remain unmeasured. The unchanged 1024² shadow target can remain allocated after switching shadows off; texture quality switches do not imply release. No PS4 quality or September 20 completion claim follows from these structural counts.

Reproduce with `measure-budget.mjs REPO OUTPUT.json` for each source tree, followed by `python summarize-budget.py`; retain actual forest `pine.rgba`/`crown.rgba` fixtures alongside outputs. `verify-title-lifecycle.mjs` preserves the explicit DOM/media boundary. No additional broad tests or visual proxies were run.
