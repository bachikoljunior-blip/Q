# Title video release request before world loading — v30

Author base `62f731e3ba0924c70f3879174053db7824a449ae`, published with the identical tree as `26bd980546bbf0dcc7fb0d83697cf35202c3e365` (PR44). The audit recipe uses that published baseline; a shallow clone must fetch it before replay. This unit corrects a resource lifetime overlap found while inspecting the larger v29 presentation workload. It does not add or re-encode media, alter the retained Scene singleton, or change audio/game/save rules.

## Concrete defect and change

`ensureView()` already called `title.setLaunching(true)` before importing the world, but that method only changed CSS and the loading label. The video kept its source and continued playing through asynchronous Scene creation; only the later `title.setActive(false)` requested release. Title save imports also left the title fully active throughout `file.text()`.

The controller now owns a separate `launching` flag. Entering it cancels the delayed media attachment, invalidates any pending play promise, pauses the video, removes `src`, calls `load()`, and stops the decorative RAF. The painted poster and existing loading status remain. A single title CSS rule removes the video's fade-out transition during loading, so a cleared video element is not intentionally faded over the poster. CSS painting itself has not been observed in an authorized browser.

`importSaveFile()` acquires the existing title launch controls before the asynchronous file read and releases them in `finally`. Canceling the file picker does not enter this state. Invalid JSON, invalid saves, rejected reads and failed Scene loading restore controls without writing a new save. Running-game imports keep their existing behavior.

An independent review also confirmed a second path: opening title settings called `setActive(false)`, which previously cleared launching, and closing settings could start the movie again during an unfinished load. Active visibility and outstanding launch ownership are now independent. Settings, focus and page lifecycle returns cannot reacquire the movie while loading remains true. When a load fails, playback becomes eligible only under the existing manual-pause, reduced-motion, data-saving, hidden-page and autoplay-block rules. A stale play resolution cannot recreate the source or mark it ready.

## Before/after under the same explicit boundary

The [reproducible audit](../tests/fixtures/title-loading-audit.mjs) loads the fixed pre-change source and the current source into the same video/DOM/timer fixture. It also compiles the production main entrypoint into the existing application boundary. These are two complementary source checks; the main boundary records title API calls and does not embed a browser decoder.

| Immediately after launch request | Before | After |
|---|---:|---:|
| Video source attached | yes | no |
| Video paused | no | yes |
| `load()` release requests | 0 | 1 |
| Loading status present | yes | yes |
| Video source after settings round trip | attached again | absent |
| Pending title-file read blocks launch controls | no | yes |

The main call order is audio gesture → title launch request → deferred Scene factory. The correction changes what that title request does, rather than moving the Scene singleton or fabricating a memory reading. Full snapshots and source hashes are in [title-loading-v30.json](evidence/title-loading-v30.json). Browsers decide when decoder buffers and associated memory are physically reclaimed; no GPU/decoder byte reduction or timing is asserted here.

## Validation and budgets

- Full `npm test`: **268 / 268**, 45.532 seconds wall time. Focused title/main/presentation run: 37 / 37, 1.737 seconds.
- `node scripts/verify-main-runtime.mjs`: 18 scenarios pass; all 6 injected-defect detections across 3 negative controls pass. The report's measured compile/scenario/control host time sums to 11.513 seconds; this sum is not an end-to-end or device timing. [Saved report](evidence/title-loading-v30-runtime.json).
- `npm run build`: 7.07 seconds; **164,002 B** initial JS (v29 163,956 B, increase 46 B), 3 JS chunks, 965,480 B total JS. Existing 165,000 B limit unchanged.
- `npm run package` and `npm run test:artifacts`: pass. Standalone **16,324,378 B**, below 16 MiB; SHA256 `d3d6341b392fd68f3af7d7b30600106efbb24410b7fddee2c08dd1e23bf1efc5`. Fixed local stage has 34 public files; source/build/stage/standalone bytes agree. Integrator regenerates distributable artifacts after combining units; this commit carries source/tests/evidence only.

Independent Ultra reviewer `actor_motion_ultra/motion_review_ultra` ran 8 additional controller cases and 5 main cases, then the 37 focused tests. It confirmed no further required fix in this scope. Final reviewed hashes: main `952655c3c0600d5d657e4a4b222c75835b849d414b501a8de3308fc3fbd18891`, title `ee014186a34625da90768da0434f2eedd69e35501b515f3d658959359a3888e3`, CSS `9343c245a2a915a35c43dc1e5590cbbab2103a44a88f2af1a5d060f3ce03cd54`. The final title-only cue predicate restoration was separately read-compared by that reviewer; no sound implementation changed.

Worktree start: 2026-09-16 03:48:16 UTC. Source acquisition/media production: 0 seconds. Rework consisted of separating launch ownership from panel visibility and retaining the original cue predicate; no failed generation/download loop occurred. Focused validation, whole-suite validation and build timings are separated above. The exact completed checkpoint wall interval is supplied with the commit.

## Remaining limits

The authorized parent configure returned managed-linux / configured:false. No alternate browser, server, CI renderer or live Site was used. Actual title-to-world appearance, browser-native pause/event ordering, physical decoder release, GPU peak memory, device frame time, perceived loading smoothness and whole-screen PS4 quality remain unverified. The existing world texture budget and retained Scene resources are unchanged. This is a finite lifetime correction, not completion of the broader visual-quality goal.
