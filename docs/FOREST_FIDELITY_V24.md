# Forest foliage v24 — bounded implementation and evidence

Base: `547676fdce8d8e97abed9f065aad0b6e24af2fd6`. Local branch: `feat/forest-fidelity-v24`. Scope: tree-related exports and new forest modules/assets. Tree coordinates, heights, gold-family flags, collisions, seeded random stream, quality radii and the existing three source / three detail instanced sets are preserved. Scene integration belongs to the sole integrator.

The previous near canopy consisted of opaque cone tiers and rock-like icosahedron clumps; distant canopies returned to solid cones/clumps. The candidate uses irregular radial folded branch sprays, visible gaps, photographed needles / leaf venation, tapered branching trunks and roots. Both LODs use the same cutout species textures. It is a texture-based vegetation technique, not a newly scanned full tree or a complete PS4-quality forest.

## Source and asset production

[Poly Haven Pine Tree 01](https://polyhaven.com/a/pine_tree_01) provides the twig diffuse/alpha sources, credited to Rob Tuytel (photography) and Rico Cilliers (modeling). [Shrub 04](https://polyhaven.com/a/shrub_04) provides the leaf diffuse/alpha sources, credited to Rico Cilliers; a separate photography role is not stated on that page. [Provider CC0 license](https://polyhaven.com/license) permits modification and redistribution. Four original 1K JPGs were fetched through their ordinary public asset download endpoints with HTTP 200 and are retained byte-for-byte. Full models, website previews and logos were not downloaded or bundled.

`src/assets/forest/provenance.json` records exact direct URLs, source/derivative SHA-256, creators, license, operations and rebuild dependencies. The 1,157,422-byte original maps are rebuild sources; the runtime imports only two 512×512 PNGs totaling **327,978 bytes**. Q's own code composes cutout photographs around small authored twig stems and gives broadleaf photos the existing amber-grove palette. These are not image-model generations. Retained sources and the deterministic generator permit exact reproduction.

Independent review rejected the first derivative's colorful low-alpha RGB fringes and caught a Three.js vec4/vColor mix mismatch. The generator now propagates a complete nearest opaque photo RGB vector into antialiased edges and a two-pixel gutter; it does not independently maximize RGB channels. Corrected needles and leaves were inspected as the actual PNGs and composited on neutral gray. The final photos contain zero tested neon RGB texels, including hidden alpha. The material explicitly selects `vColor.rgb`.

## Material and load behavior

The UV-mapped MeshStandardMaterial is opaque, double-sided and alpha-tested, with depth writing enabled. Two shared material families keep the same tree draw groups. Near and far crowns share an atlas; no per-tree texture or material is created. Standard lighting, fog and received shadows remain in the Three shader. A restrained daylight term transmits light through backlit foliage, while pre-authored crown normals reduce harsh card-to-card lighting.

The actual image decoder runs only in `loadForestTextures`. One-time canvas readback builds straight-alpha RGBA DataTextures with ten explicit mip levels. RGB averaging occurs in linear light through premultiplied alpha, then returns to sRGB; per-level alpha coverage limits the loss of fine needles in the distance. Because canvas readback discards RGB beneath zero alpha, a complete nearest-color two-texel gutter is restored after readback and in every generated mip. It never changes alpha. The two complete chains occupy **2,796,200 bytes** of typed pixel data and approximately the same uncompressed GPU texture storage, excluding implementation overhead. Loading fallbacks retain another 43,688 typed pixel bytes; decoded images/canvases are temporary and browser overhead has not been measured. GPU FPS/overdraw remains unmeasured.

Per-branch rooted wind is shared verbatim by visible, depth and point-distance shaders; static bounds include a 0.045-local-unit wind margin. Both alpha and maps propagate to shadow materials on installation, avoiding solid rectangular card shadows. Quality changes continue to partition every original instance once.

## Same-condition tree budgets

Counted from the real Game's 805 tree placements, with two pine canopy instances per pine, unchanged positions and near radii 0/52/80 m. These are all-tree geometry totals before frustum/occlusion, not measured renderer draw calls or FPS.

| Quality / player position | Previous triangles | Candidate triangles | Delta | Nonempty tree draw sets |
|---|---:|---:|---:|---:|
| Low / all four points | 47,090 | 40,976 | −6,114 | 3 |
| Medium / (0, 80) | 51,210 | 51,856 | +646 | 5 |
| Medium / (−105, 0) | 51,446 | 51,602 | +156 | 5 |
| Medium / (−300, −130) | 48,120 | 43,696 | −4,424 | 5 |
| Medium / (170, −200) | 53,064 | 56,752 | +3,688 | 5 |
| High / (0, 80) | 54,886 | 61,404 | +6,518 | 6 |
| High / (−105, 0) | 56,478 | 63,960 | +7,482 | 6 |
| High / (−300, −130) | 50,988 | 51,190 | +202 | 6 |
| High / (170, −200) | 61,098 | 77,968 | +16,870 | 5 |

Shared geometry buffers: 37,592 → 45,184 bytes. Per-instance transforms/colors/capacity stay unchanged. Near trunk/pine/crown: 216/192/144 triangles; far: 20/18/18. Full evidence: `docs/evidence/forest-v24-baseline.json` and `forest-v24-budget.json`.

## Exact integration

In `scene.js`, add:

```js
import { forestMaterial, configureForestMesh, installForestTextures } from './forest-materials.js';
import { loadForestTextures } from './forest-assets.js';
```

In `createVegetation`, replace only the pine/crown material constructors with:

```js
forestMaterial('pine', this.sway)
forestMaterial('crown', this.sway)
```

Apply `configureForestMesh(pine)` and `configureForestMesh(crowns)` after construction. In the existing `this.treeDetail` creation, call `configureForestMesh(detail)` on the newly constructed mesh; it leaves ordinary bark material meshes unchanged. Preserve the existing instance transforms/colors, list length and detail partition logic.

Add `loadForestTextures()` to the existing delayed scene asset `Promise.all`, and pass its result to `installForestTextures`. Let failures reach the existing boot retry. The production wrapper statically imports PNGs so the standalone esbuild IIFE embeds them. The separate injectable `forest-texture-loader.js` has no image imports or DOM activity until called. In `tests/static-scene-fixture.mjs`, add the same kind of scene import stub already used for environment-assets: `loadForestTextures` resolves `{}`. Do not import actual PNGs or create a browser canvas in Node fixtures.

## Validation and practical limits

`node --test tests/forest-fidelity.test.mjs tests/environment-overhaul.test.mjs` checks the real committed PNG alpha and mip data; source RGB fringes; normalized/nondegenerate geometry, UVs, bounds and shared wind; real Three ShaderLib hook insertion and alpha/depth/distance contracts; temporary decoder disposal, partial failure and retry; and original placement/color/grass/particle hashes with quality partition conservation. Standalone esbuild compilation of the complete forest asset loader with `--format=iife --loader:.png=dataurl` verifies embedded imports. Vite build compiles the unchanged scene plus new geometry; the integrator must validate the complete scene material/asset boot after connecting it.

This is not GLSL compilation on a GPU, actual WebGL pixels, a screenshot, physical touch, device memory/FPS or PS4 perceptual parity. Formal preview remains owned by the integrator; this work did not launch another server/browser/CI path. The fixed 2026-09-20 whole-game deadline and unverified PS4 target remain unchanged. Open cutout foliage replaces the conspicuous opaque-shell construction, but tree silhouettes, transparency aliasing, wind, shadow quality and canopy density need the formal gameplay view.

Timing and rework are recorded in `docs/evidence/forest-v24-verification.json`. Source research and initial art/code authoring were not independently timed from their start; their complete durations are missing rather than inferred from file timestamps. Asset generation executions, the final reproduction check, code compilation and geometry/material verification are separately measured. No old/new equal-scope production-speed ratio is claimed.
