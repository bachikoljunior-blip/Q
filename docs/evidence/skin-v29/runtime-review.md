# Independent v29 skin runtime review

**PASS for the bounded CPU/material/UV/loading contract after correcting the neck reference.** No repository or image was edited by this reviewer. No browser, WebGL, material screenshot, play session or PS4-quality evaluation was performed.

The role recommendation was adopted: only `smith` (鍛冶師レン) receives the young-male source texture, because that role already has an explicit chin beard. This does not establish a new canon age or gender. Other roles remain excluded. See `role-review.md`.

## Actual actor/material checks

All14 actual actor recipes were created before texture installation, plus a second smith clone, aliases keeper/knight/archer and four soldier themes. Exactly one face material received the skin diffuse. **163 other material references retained both prior map and color**, including separate neck/hands/lids and all unselected roles. The aliases and themed guards also remained untextured. Smith clones share face geometry, face material and the single texture while keeping separate skeletons. Installing null restores the prior flat face color/map.

The actual batched smith head has1012 UVs. They match v28 original-layout UV data within **2.9766083e-8**; head-data SHA-256 remains `2717bc737546fa74fcbe3e14dec1e19182f54b41eda0522c205e9faa64b23dba`. No geometry or UV remap was introduced by the diffuse integration.

The loader marks the texture sRGB, sets flipY=true for browser image rows versus original OBJ V, uses identity repeat/offset/rotation, UV channel0, clamp wrapping, linear magnification and mipmapped minification, anisotropy2. Installed Three.js0.186.0 TextureLoader creates ordinary image-backed textures and WebGLTextures uses the flipY unpack flag. This verifies the code/data convention, not a GPU upload screenshot. Existing procedural bump/roughness maps remain; no matched source normal or roughness asset is implied.

Independent fake-decode lifecycle checks verified a single shared promise/texture for concurrent calls, retry after load failure, invalid-dimension disposal/rejection and late-result disposal/rejection after explicit release. App-lifetime policy detaches maps via install(null) before manual cache disposal; actors do not own/dispose the texture. The real scene waits for loadSkinTexture with other scene assets, installs it before actor creation, and keeps the existing boot error/retry route. No real network failure or GPU disposal was exercised.

## Concrete finding corrected during review

The first neck reference `[.7704954842,.4088626809,.2547847399]` matched the **synthetic cap's**46 rim UV samples, not the actual collar's original UV coordinates. The author corrected that before final readback.

The independent read-only oracle `runtime-review.py` decodes the final q95 WebP without changing it, obtains the46 cap-rim geometric source IDs, selects only actual region4 surface corners with sourceUV ID>=0, and samples all47 original UV sides in linear sRGB with bilinear interpolation at x=uW−.5/y=(1−v)H−.5. Source857 has two sides; they are averaged first so each of46 geometric vertices has equal weight.

Verified final reference: `[0.756385085539447, 0.3947322188942361, 0.23747912103991894]`. It matches the runtime constant exactly. Final q95 texture SHA-256: `7628814980308b9525b27f09f98a099a0144d1a29e67bc6377702b4605678c04`.

- Mean tinted linear RGB equals the existing neck base color with largest channel residual **5.55e-17**.
- Existing flat neck is approximately RGB(152,118,93). Mean of the separately sRGB-encoded sampled values is `[np.float64(151.966), np.float64(117.888), np.float64(92.862)]`; the small difference comes from nonlinear encoding of local variation.
- Across the47 actual UV-side samples, the largest local per-channel departure from flat neck remains **9.679/255**. Source variation has not been erased.

The mean calibration is numerically correct; it does not prove a visually seamless junction at the actual visible head/neck intersection, nor a match for moving eyelid patches. Source baked shading, lighting, mesh normals, mip levels, hair/scalp overlap and final rendered appearance still need the parent's official rendering comparison.

All final input hashes and assertion outcomes are recorded in `runtime-review.json`. Verification scripts: `runtime-review.mjs` and `runtime-review.py`.

## Native HDR/material contract

Independent actual-material readback confirms native `MeshStandardMaterial`, metalness0, roughness1 with the existing shared roughness map, and bumpScale.00018 with the existing shared bump map. Diffuse map is sRGB and its multiplicative color is linear RGB. `envMap` remains null, permitting the standard renderer to inherit `scene.environment`; onBeforeCompile and customProgramCacheKey are the native Material methods, with empty userData. No private qSky environment or custom shader is added.

Read-only scene diff contains only skin imports, the additional shared Promise.all load and installation before SceneView creation. The existing sky/HDR installation remains unchanged. These are source and CPU-property checks; HDR lit pixels, calibrated albedo/reflectance and real GPU shader output were not evaluated.
