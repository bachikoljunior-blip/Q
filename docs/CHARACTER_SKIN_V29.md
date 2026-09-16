# v29 — one sourced skin material, bounded integration

The acquired MakeHuman CC0 color image now supplies **only the smith (鍛冶師レン) face**. Existing geometry, original UVs, skeletons, independent eyes/irises/lids, neck/hands, hair and costume materials are unchanged. The current recipe explicitly gives the smith a chin beard; no character's exact age/gender is established by their name or occupation. Other 13 actor families, aliases and themed guards remain untextured. This is one visually relevant material unit, not achievement of PS4-quality rendering or the September 20 completion target.

## Source and codec

Official [system-asset catalog](https://static.makehumancommunity.org/assets/assetpacks/makehuman_system_assets.html), archive entry `skins/young_caucasian_male/young_lightskinned_male_diffuse.png`. The exact material descriptor explicitly releases the asset CC0 in September 2020 and names Data Collection AB, Joel Palmius and Jonas Hauquier. Its internal material name says `old_caucasian_male_detailed`, despite the young folder/tags/reference; the native descriptor is retained unchanged. No photographic scan or calibrated albedo provenance is claimed.

| File | Bytes | SHA256 |
|---|---:|---|
| Retained original PNG | 3,693,828 | `862a26e335e958b70534cb5f0d7c47ef30ab148a56c42b3e9da969cf76f12963` |
| Runtime WebP q95 / method 6 | 541,954 | `7628814980308b9525b27f09f98a099a0144d1a29e67bc6377702b4605678c04` |

Both are 2048² RGB with identical pixel positions. Standard libwebp 1.6.0 format export through Pillow 12.3.0 performs no crop, resize, retouch, color correction or generation. Lossy quantization is measured: the original head/ears region has MAE 1.425/255, PSNR 42.642 dB, SSIM .983987; the defined front subset has MAE 1.209/255, PSNR 44.123 dB, max error 9/255. This does not certify perceptual equivalence. Original and q95/q93 exported images were directly inspected by author and independent reviewer; these were source assets, not game frames. Full comparison, provenance, license, original PNG and descriptor are under `src/assets/characters/skin/`; only the selected WebP is imported at runtime. Reproduce with `python scripts/characters/export-skin-codec.py` (verification by default; `--write` explicitly writes identical output).

## Material and lifecycle

The new loader is imported only by the existing deferred scene chunk. `createSceneView` awaits skin with the four existing asset groups, installs the complete map, then constructs actors. Concurrent loads and all quality levels share one texture; no quality toggle triggers decode or new texture allocation. Decode/dimension failure rejects through the existing visible boot retry and clears the failed promise. Existing cached materials and future clones receive the same map. An uninstalled map uses the previous flat face material; failures are not silently marked successful.

The texture is sRGB, `flipY=true` for original OBJ v-up coordinates and browser image rows, identity transform/UV channel 0, clamp wrapping, linear/mipmap filtering, anisotropy 2. The face stays native `MeshStandardMaterial`, metalness 0, existing procedural roughness/bump, and `envMap=null` so the shared scene HDR environment is inherited. No alternate sky reflection or custom face shader is added. The source eye islands contain red internal tissue, not irises or whites; those separate runtime materials remain intact.

Ownership is application lifetime, like the existing shared environment textures. Actors do not dispose the texture. Explicit teardown order is `installSkinTexture(null)` then `releaseSkinTextureCache()`. A pending decode completed after release is disposed and rejected, and cannot overwrite a newer load. No per-scene/per-actor disposal was inserted into the game's existing persistent scene lifecycle.

## Face/neck color reference and review correction

The first reference accidentally sampled synthetic closing-cap UVs. Independent review identified this, and it was corrected before final validation. `measure-skin-boundary.py` now selects the 46 geometric rim source vertices, then only their actual collar surface UVs: 47 original UV sides, including both sides of source vertex 857. It decodes q95 sRGB texels to linear RGB before bilinear interpolation, averages UV sides per geometric vertex, then averages the 46 vertices. Synthetic cap UVs are excluded.

Reference linear RGB is `[0.756385085539447, 0.3947322188942361, 0.23747912103991894]`. The native material tint is the existing smith skin color (`0x98765d`, converted by Three to linear RGB) divided by that reference. Multiplication by the linear map restores the **mean tinted linear RGB** to the existing neck with residual ≤5.55e-17. Across individual UV-side samples, the maximum local sRGB channel difference from flat neck remains **9.679/255**. This is deliberate retention of source variation, not evidence of a seamless rendered junction. Source socket shading, different normals, eyelid patches, hair overlap and mip appearance remain visual review items. No illumination-free albedo or reflectance calibration is asserted.

## Measured delivery and verification

| Bound | Result |
|---|---:|
| Initial JS | 163,175 B, unchanged; below 165,000 |
| Runtime JS graph | 3 chunks |
| Standalone HTML | 16,322,634 B |
| Headroom below 16 MiB | 454,582 B |
| Staged files / bytes | 34 / 12,471,960 B |
| Shared skin RGBA8 base / full mip estimate | 16,777,216 / 22,369,620 B |
| All 18 actor/theme variants | Geometry arrays/counts byte-identical to fixed v28 |
| Largest actor / draw count | 7,998 triangles / 14 draws, unchanged |

The full-body atlas costs **21.333 MiB** with RGBA8 mips despite applying only to the smith face. Changing encoded format does not lower that GPU estimate. Browser decode/staging and actual GPU allocation/time are unmeasured. The standalone result is an actual native package, with the exact runtime WebP verified in built/staged/embedded bytes and original PNG excluded; it is not a successful remote upload claim. Existing initial/chunk/actor thresholds were not relaxed.

All 262 Node tests passed. Fifteen focused actor/skin tests passed, including actual asynchronous SceneView waiting, failed-decode retry, installation before construction and sharing across three qualities. The native sky control-flow oracle passed with an explicit flat-skin fixture boundary. Independent review created all actor recipes/aliases/themes: only one smith face material changed, while 163 other material references/colors remained unchanged. UV max difference from unchanged original-layout data is 2.98e-8 from Float32 representation. No WebGL context, GPU shader compilation, rendering, browser, FPS or PS4 comparison is included.

## Time and handoff

Worktree began 2026-09-16 03:20:38 UTC at `d03974f06357b490f3d9b45ac052fbea0e10b442`. Source acquisition was the previous finite unit (591.359 seconds of fetch-process wall); this unit makes no new source download or image generation. Codec reproduction took .883 seconds. Focused validation took 17.011 seconds and the full Node suite 34.769 seconds, overlapping other work. Coding and cap-reference rework did not have isolated timers; no false separate durations or speedup ratio is reported. Exact delivery metadata and independent evidence are in `docs/evidence/skin-v29/`.

Only scene imports and its async load/install entry were changed; `createStructures` is untouched for the architecture owner. Integrator should merge this local commit with the architecture unit, rebuild/package from combined source and repeat existing final gates before its sole remote/Site publication. No remote/main/Site action was performed here. Official rendering remains unavailable; the next quality decision is the real lit face/neck/eyelid result under the shared sky when that authorized path is available, alongside continuing other executable production work.
