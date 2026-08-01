# WILDBOUND QA evidence — 2026-08-01

Scope: local `agent/open-world-rpg` replacement based on remote main `4e6076d`. This evidence supports the current implementation slice; it is not physical iPhone or public-release evidence.

## Executed checks

- `npm run check` — passed. Static and license validation found 25 required files, a 1,365,755-byte release payload, 141,977 bytes of JS plus CSS, local-only runtime assets, and exact Three.js 0.185.1 MIT metadata. Seven deterministic core/world tests and the happy-dom small-mobile journey passed.
- Real Chromium WebGL smoke pass at 568 × 320 CSS pixels, device scale factor 2, touch/mobile emulation — passed. Local Three.js WebGL started; `ground.webp` and `characters.webp` loaded; world, Mira dialogue, and Ilya choice layouts rendered; no console, page, or request error was observed.
- Observed real-WebGL scene budget after visibility tuning: 94 draw calls, 113,435 triangles, quality tier 2, 436,480 backing-store pixels. Under deliberately slow SwiftShader timing, automatic quality reduction reached tier 1 and 284,000 pixels. These timings do not represent iPhone performance.
- Staged release injection — passed. A temporary local artifact replaced `__BUILD_REVISION__` with `staged-wildbound-test`; `tools/verify-public.mjs` fetched both the staged page and `release.json` and matched the identifier.
- F2 asset-gate falsification — passed by failing as intended. An `assets/textures/ground.webp` change without `AI_DEVELOPMENT/STATE.yaml` exited 1 and named the missing state update.

## Deliberate falsification findings and repairs

- The initial camera started inside a village roof. The persisted/default yaw and start location were corrected and the real WebGL surface was recaptured.
- CSS transform scaling reduced action targets below the intended touch size. The transform was removed; the quick-map control was moved away from combat controls.
- Procedural rocks and vegetation could be placed below water and appear to float. Placement now rejects submerged samples.
- Unbounded simultaneous landmark/resource rendering produced 169 draw calls in the first capture. Distance visibility reduced the observed scene to 94 calls without removing required destinations.
- Asset-only changes were omitted from the continuity gate and Pages path trigger. `assets/` is now protected by F2 and `assets/**` triggers the deployment workflow.
- A malformed local save could name sigils, decisions, or victory without the matching guardian defeats. Save cleaning now rebuilds sigils, pending decisions, story chapter, final victory, and ending from coherent defeated/choice state; forged-progression tests pass.
- The WebGL fallback could be overwritten by normal menu initialization. Fatal renderer state now remains authoritative.

## Generated visual assets

- `assets/textures/ground.webp` — seamless realistic meadow/soil/pebble/moss ground microtexture, generated with the built-in image generator and converted to a mirrored 1024 px WebP tile.
- `assets/portraits/characters.webp` — original 2 × 2 realistic portrait atlas for Mira, Orin, Ilya, and the player, generated with the built-in image generator and converted to 1024 px WebP.

## Remaining limitations

- Physical iPhone SE third-generation touch, frame pacing, memory, orientation/background recovery, and offline reload are `prepared_not_executed`.
- Public GitHub Pages revision and primary journey are `prepared_not_applied`; the published STARTHREAD build remains the last verified public product.
- Premium-presentation review remains `failed`: in-world characters, enemies, buildings, and foliage still expose a procedural primitive-based style, and narrative/animation/audio depth remains below the preserved benchmark.
- F2, F3, and F5 checks run locally and in workflows but are not independently required merge checks because branch-protection configuration is not exposed. F6 has staged revision evidence but no public pass; automatic revert is absent.
