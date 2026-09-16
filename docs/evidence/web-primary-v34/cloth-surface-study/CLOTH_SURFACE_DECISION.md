# v34 cloth surface selection — fixed v33 source

Decision: **do not install the Cotton Jersey diffuse alone on the pilgrim cloak in this unit.** The old 160 KB / 1.333 MiB study cap is withdrawn as a reason for rejection. At the parent's approximately 1.28 MB forecast of newly recovered standalone space, the exact diffuse would fit, leaving about 553,278 B before loader/code overhead. The remaining concern is the visual/material benefit for its cost: it is clean fine stretch-knit, its physical detail is strongly minified at the actual viewing distances, and a diffuse-only addition leaves the existing oversized bump pattern and very rough reflection unchanged. This is an art/engineering selection judgment, not proof that the photo has no visible effect, and not a PS4-quality verdict.

Scope: read-only study of `Q-ps4-v33` at `39e47a4fa204ea6576c685bf25569727e410cd01`. New writes only in this scratch directory. No source implementation, bitmap editing, resizing, generating, encoding, remote/Sites/browser/new-spawn action. Current formal preview remains unavailable. Parent owns combined build and normal remote integration.

## 最新方式変更による採否条件の更新

ユーザーの直接指定「容量不足がネックなら今のプレイする方法を見直すのはどうですか？」を受け、通常URLの複数ファイル配信を一次経路、単体HTMLを任意経路とする方式へ移行中。16 MiBは大きな単体HTMLをGit Dataへ保存する際の検査であり、Siteの総容量上限ではない。本研究中のq85約1.28 MB余白、2-map/3-mapがその予測余白を超える計算は、過去の任意単体経路に限る参考値へ変更する。今後の写真採用を拒否する根拠には用いない。

Cotton Jerseyが清潔な細かい伸縮編みであること、外套の用途との適合、diffuse単独では既存の粗いbump/反射応答を解消しにくいという限定判断は維持する。一方、適切な写真のdiffuse・normal・roughnessを組み合わせる案は、通常URL配信の実byte/ロード費用と材質整合から再検討できる。単体容量に合わせた無根拠な品質低下は求めない。

1-mapあたりRGBA8 mip約5.34 MiB、3-map約16.01 MiBと既存texture形式payload約49 MBは別の資源費用として残る。これらは実端末の容量限界ではなく、端末ピークやGPU余力を証明する値でもない。現画像の改変、新素材取得、再調査は本注記で実施していない。次の実装・素材選定は別の有限単位で扱う。

## Source image actually inspected

I viewed the exact 1024×1025 original JPEG through `view_image`. It shows pale beige, tightly repeated fine rib/knit detail with little broad staining or wear. These are source-image observations, not game pixels. [Poly Haven's asset page](https://polyhaven.com/a/cotton_jersey) identifies cotton jersey/stretch-knit and credits colormass photography/Rico Cilliers processing; its current 1K density of 38.8 px/cm corroborates the retained physical tile metadata. [The official license](https://polyhaven.com/license) permits CC0 use and redistribution. No historical wool, waterproof treatment, absolute albedo calibration or pure reflectance measurement is claimed.

The exact original JPEG is preserved under `source/` without change. Native size **581,360 B**, SHA256 `0f1b790e4087223275aaa6fdffdd46a556a26d2af72cd811acf72ba9c21ec1f6`, official and remeasured MD5 `d2f4493fdd48634b50d40f810ce9deb7`. Exact primary file URL, retained official files/info JSON hashes and readback limits are in `sources.json`. Existing data were copied; new asset transfer/generation/editing time is zero.

The metadata tile is **263.602747×263.799995 mm**. It labels the source clean, matte jersey, with clothing among uses. That supports a soft knitted shirt or lining reference. It does not by itself establish the heavy, travel-worn outer-cloak material implied by the current silhouette. Cotton is a legitimate natural fiber; the mismatch is the particular clean/stretch-knit fabric and intended outer-garment role, not a ban on cotton or a claim of historical impossibility.

## Actual cape UV and physical repeat

The current ordinary cape has 117 vertices / 192 triangles, with the v32 physical row-arc UV correction already integrated. Its retained strip reference area is **0.945183348 m²**, with **0.972205404 m per UV unit**. Both are measured from the actual unchanged bind geometry. UV is scaled to preserve area, so it is not literally meters despite following physical arcs.

For the original photo at its declared physical scale, texture repeat is **(3.688145946, 3.685388256)**. Formula: `repeat = metersPerUV / physicalTileMeters`, with a stable UV origin/offset. Leaving the old `(4,4)` repeat would make the source tile about 8% too small. Replacing UV with arbitrary 0–1 mapping or inflating the photographic weave until it becomes visible would undermine the physical scale being claimed.

Only player, NPC/Mira, Sena, scout, traveler and ranger have the same normal cape/scale-one contract. Boss uses a different 1.48 m chart and an overall 2.3 actor scale; do not reuse this transform there. The current cape's material is also shared by its actor's batched cloth body. The source helper `surface('cloth', color)` additionally serves hair, brows/beards, paper and wolf fur for other cached keys. A global cloth-material replacement is unsuitable. Source/body/bones/UV/position/actor scale and motion are not changed by this study; the separate owner's floor/death-cloth repair remains independent.

## What can survive the current projection

From the original source frequency peaks, the repeating detail periods are approximately **0.829 / 1.003 mm**. These are image-frequency estimates tied to metadata, not microscope measurements of individual yarns. Using the actual Scene camera's 54° vertical FOV:

| Viewport | Distance | Photo detail period, pixels | Current procedural period, pixels |
| --- | ---: | ---: | ---: |
| 1280x720 | 9 m | 0.065–0.079 | 1.193 |
| 1280x720 | 2.6 m | 0.225–0.273 | 4.128 |
| 844x390 | 9 m | 0.035–0.043 | 0.646 |
| 844x390 | 2.6 m | 0.122–0.148 | 2.236 |
| 390x844 | 9 m | 0.076–0.092 | 1.398 |
| 390x844 | 2.6 m | 0.264–0.320 | 4.839 |

These are analytic projections of camera-perpendicular surface detail, using the same 9 m / 2.6 m distances as gameplay/dialogue comparisons. They are CSS-pixel estimates, not rendered results. High DPR multiplies the sampling footprint (up to current 1.7), but still does not resolve a full two-sample knit period in these conditions. Oblique cloak surfaces generally compress one direction further. This measurement does not imply that subpixel material statistics have no effect on shading.

At 720-high dialogue projection, one source pixel footprint is roughly 14 source texels; the nominal isotropic mip level is about 3.84. At 9 m it is about 49 texels / level 5.63. Read-only linear-color block statistics find normalized brightness P01–P99 of **0.99363–1.00624** over 16×16 original texels (4.12 mm), and **0.99850–1.00192** over 64×64 (16.47 mm). Thus much of the photo's detail averages towards a constant under this simple footprint approximation. This is neither an authored resized image nor a simulation of exact native GPU mip filtering.

The source linear-RGB mean is **[0.540361, 0.405250, 0.337280]**. Native Three multiplies color-map samples by material color. Directly applying the beige image to current teal 0x2c555b reduces the respective mean channels to about 54%, 41%, 34% and changes hue. An explicit mean-normalized tint would be `[0.046611, 0.224162, 0.310177]` in linear RGB to retain the former average color; it is a deliberate shader tint, not a calibrated albedo claim or edited source image. Keeping the old procedural bump would still leave its approximately 15.2 mm repeat and .0014 bumpScale underneath the tiny photo pattern. That does not make a coherent representation of this fine fabric.

## Real cost under the new budget

| Existing exact official file | Raw bytes | q85 representation characters | RGBA8 full-mip payload |
| --- | ---: | ---: | ---: |
| Diffuse JPG | 581,360 | 726,722 | 5,596,500 B |
| Normal GL JPG | 678,670 | 848,362 | 5,596,500 B |
| Roughness JPG | 865,264 | 1,081,602 | 5,596,500 B |
| Diffuse + normal | 1,260,030 | 1,575,084 | 11,193,000 B |
| All three JPG | 2,125,294 | 2,656,686 | 16,789,500 B |

The exact 1024×1025 RGBA8 mip payload is **5.5965 MB / 5.337238 MiB** per map. This includes the odd first height followed by floored mip dimensions, not a 1024² approximation. GPU/driver alignment, decoder buffers and CPU copies are additional and unmeasured. One cloth image is about 25% of the existing 2048² skin allocation; skin already costs **22,369,620 B / 21.333332 MiB**. Together those two alone total **27,966,120 B / 26.67057 MiB**. The previous broader v29 texture-format estimate was 49,196,088 B; adding one cloth would be about 54,792,588 B if all those prior resources remain attached. That is a conditional arithmetic reference, not a freshly measured full v33 GPU inventory.

The q85 form does not reduce texture/GPU memory. Diffuse restore would still allocate a 581,360-byte raw buffer and produce a 775,148-character base64 body during world-module initialization, in addition to source literals and subsequent decode. This study did not time that added decode or extrapolate the prior mixed-media benchmark to a device. All three native maps do not fit the parent's approximately 1.28 MB forecast; diffuse alone or roughness alone technically could. A mostly constant roughness field can first inform a material parameter comparison rather than consume another entire map.

`measurements.json` preserves an intentionally labeled pre-regeneration tracked-release snapshot (16,435,231 B), which is not the current q85 deliverable and is **not used** to reject adoption. The parent's final combined build must replace the forecast and include helper/deferred-code overhead. Existing initial 165,000 B / 3 JS / 16 MiB standalone / actual actor 8,000-triangle and 14-draw limits stay unchanged. No old small study cap is reinstated.

## Exact integration contract if a cloth source is selected later

1. **Isolate the cape material at creation.** A deferred `capeMaterial(profileKey, baseColor)` should return a per-profile cached material attached only to the already separate `cape` mesh. Leave the body cloth material and its existing hair/paper/fur uses alone. SkeletonUtils clones already share material references; one source Texture can serve all eligible cached cape materials. A separate material for the existing cape does not add a new mesh or draw; do not merge arbitrary garments into this scope.
2. **Keep asset import behind Scene.** A future cloth-assets module imports the original image; Scene's existing lazy module imports that loader and awaits it with the existing boot Promise.all before constructing actors. No main/title import, new initial chunk or preload. A loader-only module accepts an injected TextureLoader for Node contracts and performs no top-level image decode.
3. **Use an explicit single owner.** One application cache owns the pending promise, decoded Texture and generation token. Concurrent boots reuse it; rejection clears pending for boot retry; late resolutions after disposal dispose the late texture. Actors and material clones never dispose the shared texture. Quality changes reuse this one decoded source. Detach registered material slots before explicit application-cache disposal; do not invent an every-restart renderer/asset-dispose behavior absent from the current lifecycle.
4. **Use the source as the correct field.** For diffuse: sRGB, RepeatWrapping, linear/trilinear mip filters, exact 1024×1025 validation, modest bounded anisotropy, and the measured repeat. Normal/roughness would be non-color fields. Current cape V increases towards the hem; preserve consistent map orientation and verify weave direction, rather than copying skin's original-OBJ orientation rationale blindly. No particular up/down stitch direction is asserted for this tile. [Three's material contract](https://threejs.org/docs/pages/MeshStandardMaterial.html) specifies color multiplication, non-color normal/roughness data, green roughness and normal-map priority over bump.
5. **Reconcile the material instead of only adding a photo.** For a cotton candidate, remove the mismatched coarse cape bump/roughness map in the isolated material, retain metalness zero, and compare a bounded roughness near the retained source's .80165 mean against current .93902. Do not alter the shared existing DataTexture. A native cloth sheen layer is an alternative mechanism for grazing fiber response, with explicit added fragment cost; [Three's MeshPhysicalMaterial](https://threejs.org/docs/pages/MeshPhysicalMaterial.html) provides it. Neither a sheen strength nor photographed response has been validated here, and the material cannot be called physically calibrated from this image alone.
6. **Retain honest tests and limitations.** Check image source/hash/dimensions/MIME, loader fail/retry/late-dispose/cache, one shared texture, exact eligible cape-only material assignment, UV physical repeat, no model/source mutation and real artifact budgets. Then compare same saved actor/pose/time/camera on the official rendering route when available. Node/source checks do not prove cloth appearance, aliasing, believable wear, browser resource peaks or PS4 equivalence. Low quality cannot be described as lower-memory if the same source texture remains resident; toggling a map off does not itself free its GPU allocation.

## One bounded next source lead

[Poly Wool Herringbone](https://polyhaven.com/a/poly_wool_herringbone) is one official, publicly unlocked CC0 lead with a rough grey woven garment surface. Its coarser directional pattern is a more relevant outer-cloth design to investigate than uniform stretch-knit, but this is an inference from the official description, not inspected native bytes or a selected runtime asset. It is a wool/polyester blend: do not label it pure wool, natural-only or historically authentic.

The page exposed an official 4K JPEG link; the web reader refused it as too large (reported 13,605,843 B). A separately bounded 1K path, corresponding to the page's offered 1K resolution, returned a non-retryable safe-open error. No alternate browser/server/download route was used to bypass either result. Native 1K bytes, hash, dimensions, exact physical metadata and photo appearance are consequently unverified; it is **not adopted**. No unlimited material search or further asset fetch is required to finish this decision.

The next useful finite unit should address the normal cape's material response/coarse bump and compare one appropriate woven source together, retaining role colors and the fixed cloth UV, rather than spend roughly 0.73 MB and 5.34 MiB for this diffuse-only substitution. The current separate cloak-ground repair resolves geometry defects and should not be bundled with a speculative texture change.

## Evidence and time

`measure-cape.mjs` / `measurements.json`, `surface-statistics.py` / `surface-statistics.json`, `sources.json` and retained original `source/` provide repeatable source/UV/pixel/budget evidence. Current package identity and runtime source hashes are fixed in measurements; parent may subsequently change documentation/build outputs. Native asset was actually viewed once. No generated image, screenshot or rendered material preview was produced.

No new asset acquisition or generation; source reuse/hash/analysis and browsing belong to this study. The source measurement was recorded at 2026-09-16T05:47:10.946Z and report finalized at 2026-09-16T05:52:50.950901+00:00. These timestamps are elapsed study checkpoints, not claimed pure coding or art-production duration. All invoked measurement sessions ended; no background work is implied. No source edits, repo copies, dependencies, browser/server/remote/Sites or new agents were created. September 20 whole-screen/PS4 evidence remains incomplete.
