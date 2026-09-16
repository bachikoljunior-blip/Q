# v32 dialogue camera/UI independent review

The required defects found in this bounded review have been repaired and independently rechecked. This accepts the listed source contracts and native projection results; it does **not** establish rendered visual quality, PS4 parity, browser layout, touch behavior or device performance. No WebGL renderer, shader compilation, screenshot or alternate preview was used. The currently integrated older face geometry was retained; the separate face candidate was not included.

The measured checkout is `Q-dialogue-framing-v32`, based on `fb07441c63cc8e7c985972691eccaed0e1fa50b3`. During final measurement its HEAD was `a0b9833e546336f9367ec41e42bcb9739b7a47f7` with the reviewed death/HUD fixes in the working tree. The exact final source hashes below identify the accepted runtime independently of a later documentation/commit update.

| File | Final SHA-256 |
|---|---|
| `src/dialogue-camera.js` | `f24bf36795b7aa2a78b2c0f85fc37acf6e0bbe9d778a62dad61cea197f808f4e` |
| `src/scene.js` | `b50991698bdeb8511e37d49c24c4d352a06e99cf5390d4cd29228f1cf9924ac6` |
| `src/main.js` | `697482115caaee6a3ae57a5ff4b50ab76b09d3f41efe81c8042cfca40b7c337e` |
| `src/game-interface.css` | `745d5e0f047bc14c5a8f169f2227cd395fad962ee4dba6215e52a8d7b2d021e1` |

## Same-condition native measurements

All eight baseline player/NPC/stage inputs match exactly: ordinary Mira, Sena and Ren; Ren approached from behind at 4.2 m; side/reversed user orbit; earned hearth and road-watch. Actual main's eight legal Game interactions open the intended ordinary/gathering focus and return to normal updates after closing. Three fixed viewport sizes produce 24 candidate measurements against the original v31 audit.

| Viewport | Baseline projected head height | Candidate projected head height |
|---|---:|---:|
| 1280 × 720 | 18.10–42.13 px | 90.09–91.35 px |
| 844 × 390 | 9.80–22.82 px | 48.80–49.48 px |
| 390 × 844 | 19.62–49.39 px | 105.61–107.08 px |

These are projected triangle coordinates, not measured screen pixels or a face-detail quality score. Two baseline heads extend outside the viewport; all 24 candidate heads fit the reserved region. Candidate forward-to-camera angles are at most 30.93°. All 48 independent camera-to-eye rays first meet the speaker's actual `Q eye` surface. The oracle uses native skinned/morph vertices, indexed triangles and `Ray.intersectTriangle(..., false)` for both sides, and includes the player and all visible nearby NPC meshes, hands and clothing. It does not infer visibility from only a head sphere or from the solver's own body cylinders.

All 24 measured upper-body vertex sets fit x=8–92%, y=3.5–51.5%. That set comprises actual visible skinned vertices influenced at least 50% by chest/spine/neck/head/eyelids and above head-origin minus 0.65 m; it is not a claim about every outstretched limb. The original face vertices are measured separately. Independent `cameraFraction` readback is 1.0 in all 24 cases; minimum camera clearance above `groundAt` is 1.407 m. Save serialization, NPC/player state and stored orbit parameters remain unchanged.

## Required defects repaired

1. **Reading position:** `main.panel()` previously replaced the existing body without resetting its scroll offset. It now explicitly sets `panel-body.scrollTop=0`. Actual main's earned hearth next-line and completed-choice handlers reset an assigned 180 px offset to zero, and the current speaker/text precede context/history. This verifies the application property assignment, not native browser scrolling/layout.
2. **Death/respawn residue:** A legal `Game.interact(keeper)` immediately before an actual lethal knight strike in the next Game tick queued dialogue then death in the same event batch. Both panels remained visible; respawn retained `dialogueFocus='keeper'` and zero-delta paused updates. `handleEvents()` now closes the existing panel before showing death. The identical actual-melee repro now leaves the dialogue hidden and focus null, then resumes positive-delta updates after respawn. `lifecycle-before-death-fix.json` preserves the failing observation; `lifecycle.json` preserves the fixed result.
3. **HUD over the portrait face:** With 390 × 844, zero safe insets and the ordinary 16 px root-font assumption, source CSS places the portrait quest panel at x=18..268, y=142 onward. The measured faces occupy approximately x=149..240, y=144..252. Its background/text thus invade the reserved face region; location/toast overlays can also occupy it. Final `panel()` hides the existing HUD only for ordinary/gathering dialogue, and `closePanel()` restores visibility. The real main property contract now passes on open, close, settings, title, restart, import, death and respawn. This defect was established from source CSS and geometric coordinates, not a browser screenshot or measured DOM box.

## Lifecycle, fallback and CSS review

The native SceneView oracle confirms exact ordinary camera matrix/orbit restoration after close, paused cache reuse, and rebuilding/resolution across three viewport sizes × three quality settings. Death, danger, active combat action, removal of the actual resident from Game state, and replacing Game/clearing focus invalidate the shot and restore the ordinary projection. A negative fixture places 15 small static blockers at the finite candidate positions while retaining the original legal player-to-NPC path. All 15 candidates are rejected; the ordinary fallback is outside every static volume and every actual actor mesh world AABB in that fixture, with 6.078 m ground clearance. This does not prove safety for arbitrary modified worlds or all camera placements.

Actual main retains an already-open conversation across blur/visibility/pagehide interruption, with zero Game delta; this is intentional modal retention. Closing releases focus and restores the world focus target. Wheel input while paused leaves orbit unchanged. Escape/settings/return, save import and a confirmed new journey clear conversation state while using one SceneView. Native target-removal and the same-frame death test cover separate rendering and UI invalidation paths. No source game position, actor angle or save schema is changed for framing.

Source CSS confines the opaque panel to the lower 47dvh minus bottom safe-area padding, removes the whole-screen blur only for dialogue, uses a scrollable min-height-zero body and a fixed close control, and retains safe-area side/bottom padding. Active gathering speech precedes the context disclosure and history; choices have at least 46 px source minimum height, and summaries are included in the keyboard-focus selector. The exact font metrics, browser grid/scroll layout, native Tab traversal, on-screen keyboard, notch geometry, physical touch, and final upper/lower composition remain unmeasured. Hiding the HUD is verified as a source/DOM-property contract; its final rendered appearance still requires the official renderer path.

## Build readback and reusable evidence

The final generated entry was independently read as **164,802 bytes**, leaving 198 bytes below the existing 165,000-byte ceiling. The latest public manifest references exactly three current JS chunks: entry 164,802 B, scene 229,458 B and Three 579,597 B. The standalone file is 16,334,297 B. The current HTML contains no module preload. Build/package/stage gates were run by the owner; this reviewer read their current artifacts rather than rerunning those gates. The temporary staged directory had been removed, so its exact-byte validation remains owner evidence; `build-readback.json` distinguishes the current dist bytes and manifest references from that boundary.

Reusable scratch-only oracles accept `REPO_ROOT OUTPUT_DIRECTORY` as positional arguments:

```sh
node projection-review.mjs /path/to/repo /path/to/audit-output
node native-lifecycle-review.mjs /path/to/repo /path/to/audit-output
node lifecycle-review.mjs /path/to/repo /path/to/audit-output
python3 summarize.py /path/to/baseline/audit.json /path/to/audit-output
```

The repo dependencies and existing `static-scene-fixture.mjs` / `main-runtime-fixture.mjs` must be available. These fixtures substitute renderer/assets/DOM/audio/timers at explicitly described boundaries; they execute actual SceneView/main/Game and native Three geometry. They do not produce or certify rendered frames. Final evidence includes `audit.json`, `comparison.json`, `native-lifecycle.json`, `lifecycle.json`, the preserved failing death result, `build-readback.json`, these three JS oracles, `summarize.py`, and `HASHES.json`. No required source fix remains in this finite review; whole-screen PS4 quality and the September 20 target remain unproven.
