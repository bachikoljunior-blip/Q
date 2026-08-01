# WILDBOUND QA evidence — 2026-08-01

Scope: local `agent/open-world-rpg` replacement based on remote main `4e6076d`. This evidence supports the current implementation slice; it is not physical iPhone or public-release evidence.

## Executed checks

- `npm run check` — passed. Static and license validation found 27 required files, a 1,485,373-byte release payload, 142,212 bytes of JS plus CSS, local-only runtime assets, exact Three.js 0.185.1 MIT metadata, and the bundled Japanese font's SIL OFL 1.1 metadata. Seven deterministic core/world tests and the happy-dom small-mobile journey passed.
- Real Chromium font load at 568 × 320 CSS pixels — passed. `document.fonts.load` and `document.fonts.check` confirmed `Q Japanese`; the WOFF resource loaded exactly once with no console, page, or request error.
- Real Chromium WebGL smoke pass at 568 × 320 CSS pixels, device scale factor 2, touch/mobile emulation — passed. Local Three.js WebGL started; `ground.webp` and `characters.webp` loaded; world, Mira dialogue, and Ilya choice layouts rendered; no console, page, or request error was observed.
- Persistent real Chromium evidence at 667 × 375 CSS pixels, device scale factor 2, touch/mobile emulation — passed for rendering and layout. The bundled Japanese font loaded once; no console, page, or request error occurred. The dialogue box remained inside the viewport and both choice targets measured 48 CSS pixels high. Direct image inspection confirmed readable Japanese without tofu or clipping. It also confirmed that the primitive in-world models remain below the visual benchmark, so presentation acceptance stays `failed`.
- Observed real-WebGL scene budget after visibility tuning: 94 draw calls, 113,435 triangles, quality tier 2, 436,480 backing-store pixels. Under deliberately slow SwiftShader timing, automatic quality reduction reached tier 1 and 284,000 pixels. These timings do not represent iPhone performance.
- Staged release injection — passed. A temporary local artifact replaced `__BUILD_REVISION__` with `staged-wildbound-test`; `tools/verify-public.mjs` fetched both the staged page and `release.json` and matched the identifier.
- F2 asset-gate falsification — passed by failing as intended. An `assets/textures/ground.webp` change without `AI_DEVELOPMENT/STATE.yaml` exited 1 and named the missing state update.
- GitHub Quality floor run `30688204245` — passed for the draft head containing product revision `f9def90a07761007e8b8fe12b5a7f9d449b06f4e`. This does not satisfy physical-device or public-release acceptance.

## Persisted user-surface evidence

- `WILDBOUND_world_667x375.png` — SHA-256 `66758e1ff456559045c0d18450036f5227a8ca4b4246722f74b7c359b397c8fe`
- `WILDBOUND_dialogue_667x375.png` — SHA-256 `1a9f06cf7f1f1845e9420730dbae317792c6e78f96ff5eee800c4e4db1ddd5e1`
- `WILDBOUND_choice_667x375.png` — SHA-256 `ed233690f3d08f89fd86d84798b492bba4dfe9c472668eddc386e3323c0ee658`

These are automated Chromium captures using SwiftShader and touch emulation. They are valid rendering and layout evidence, not proof of physical touch behavior, iPhone performance, or blind review.

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
- `assets/fonts/q-japanese.woff` — locally bundled Noto Sans JP Thin subset under SIL OFL 1.1. Font metadata and the license text were inspected; all 519 Japanese/non-icon code points used by the game are covered, while ten UI symbols intentionally fall back to the system symbol font.

## Remaining limitations

- Physical iPhone SE third-generation touch, frame pacing, memory, orientation/background recovery, and offline reload are `prepared_not_executed`.
- Public revision and page availability are `complete_verified` at release ID `wildbound-2026-08-01-r1`. The available public cloud Chrome has WebGL disabled and correctly renders the recovery screen, so the public 3D primary journey remains `prepared_not_executed`.
- Premium-presentation review remains `failed`: in-world characters, enemies, buildings, and foliage still expose a procedural primitive-based style, and narrative/animation/audio depth remains below the preserved benchmark.
- F2, F3, and F5 checks run locally and in workflows but are not independently required merge checks because branch-protection configuration is not exposed. The revision/page F6 gate is active; automatic revert and a WebGL-capable public journey remain absent.

## Iterative publication and verifier repair

- PR 6 head `c0fd9b3` passed Quality floor run `30692305787` and was squash-merged to `main` as `1c12511`.
- GitHub's configured dynamic branch-based Pages run `30692355529` completed successfully. The public page changed to `Q: WILDBOUND`, and the public source, local assets, and error fallback loaded.
- Repository workflow run `30692355980` failed honestly during protocol validation. On a `main` push, the validator required `STATE.yaml` to contain the current squash SHA even though a commit cannot contain its own future SHA. The public index and `release.json` also exposed the literal `__BUILD_REVISION__` placeholder because branch-based Pages serves repository source and does not execute the abandoned artifact substitution step.
- The bounded repair accepts the recorded parent when validation runs on `main`, uses the source-controlled release ID `wildbound-2026-08-01-r1`, bumps the offline cache, and polls the branch-based public site for up to three minutes before deciding F6. Objective-quality failures remain unchanged.
- PR 7 head `e9366b7` passed Quality floor run `30692768125` and was squash-merged to `main` as `b26552e`.
- Dynamic Pages run `30692798119` and repository verifier run `30692798350` both succeeded. A separate manual call to `tools/verify-public.mjs` matched `release.json` and the index meta value on attempt 1.
- Public cloud Chrome loaded `Q: WILDBOUND` with build ID `wildbound-2026-08-01-r1`. Its sandbox reports GL vendor/renderer disabled, and the game displays the intended reload guidance. This is valid fallback and deployment evidence, not a public WebGL journey or physical-device pass.

## r2 character and consequence checkpoint

Candidate scope: `agent/character-story-pass` based on main `1388c41`, release ID `wildbound-2026-08-01-r2`. Remote publication evidence is added only after the candidate merges and the public verifier succeeds.

- `npm run check` — passed after the final font subset and actor-budget tuning: 28 required files, 1,518,486 release bytes, 170,721 JS+CSS bytes, seven deterministic core/world tests, and the complete happy-dom journey.
- The journey executes articulated player/enemy combat, all three persistent choices, separate choice-dependent Mira and Orin consequence scenes, Ilya's barrier-cost payoff, a climax that rejects direct or test-injected bypass, the accumulated ending, free roam, autosave, and save-version-3 migration to version 4.
- The final-route visible-scene estimator reports 150 draw calls and 118,048 triangles. It traverses the actual scene graph and applies instancing counts, but remains a headless estimate rather than WebGL renderer or physical-device evidence.
- The new actor system gives the traveler, Mira, Orin, Ilya, and the Crown multi-part bodies, limbs, cloaks, and role gear; beasts, stalkers, sentinels, and wardens have distinct quadruped, winged, armored, or antlered silhouettes and procedural motion. The previous single-shape actors are no longer used for these roles.
- The Noto Sans JP asset was rebuilt from the OFL-licensed Regular 400 package in `@fontsource/noto-sans-jp` 5.3.0 and locally subset. FontTools inspection found coverage for all 545 non-icon non-ASCII code points used by the candidate; the ten intentional UI symbols `↻⌁⌖◇◈◉●☰⚔✦` use the system fallback.
- Level C falsification passed by rejecting deliberate failures: F2 asset-without-state, F3 validation failure, F5 missing review record, and F6 mismatched public release ID each exited 1 and identified the intended defect.

The exact r2 presentation has not been rendered in a WebGL-capable browser in this environment, and the procedural low-poly rigs do not satisfy the preserved premium authored-asset bar. Physical iPhone SE touch/performance, facial or voiced performance, obstacle-aware combat, guardian phases, multi-stage relationship quests, and public 3D journey evidence remain open.
