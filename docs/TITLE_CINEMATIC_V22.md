# Q title presentation — 2026-09-15

Scope: `index.html`, scoped title rules in `src/style.css`, `src/title-cinematic.js`, title assets and focused tests. No game, save, model, sound or world rules changed by this unit. Base `0a1d905ff9000976d143baac630dbde60fe676e3`; branch `work/title-v22`. The integration owner connects the controller and sound, builds/packages, checks the combined gates, and publishes through the authorized existing route.

The previous title was text over a generic gradient before lazy world creation. The replacement is an original north-gate illustration composed around the pilgrim, surviving hand ember, steel sword and burning crown; sparse depth-weighted ash, slow mist, subdued ember light and mouse-only parallax connect the scene with the Q mark. The title explicitly labels the image `TITLE ART / 北の門`. The illustration is not a gameplay screenshot or a claim that the playable assets match it. Browser rendering, perceived excitement, sound, physical touch and device performance remain unverified.

## Integration contract

```js
import { mountTitleCinematic } from './title-cinematic.js';
const titleCinematic = mountTitleCinematic({
  root: document.getElementById('title-screen'),
  onCue: cue => { /* optional audio presentation cue; never unlock on hover */ },
});
titleCinematic.setSaveAvailable(Boolean(stored));
```

- `setActive(false)` after successful departure; `setActive(true)` when returning to the title. Calling either repeatedly never creates duplicate animation loops. The API does not add/remove `.hidden` on the title.
- `setSaveAvailable(boolean)` sets `.has-save` to prioritize Continue visually. Main owns the actual Continue visibility and all save validation. Continue precedes New Journey in DOM/tab order.
- `setLaunching(true/false)` wraps the existing asynchronous world load. It changes presentation and a polite loading status only. Main disables/re-enables launch controls, owns errors and calls `setActive(false)` on success. There is no mandatory intro wait or new gameplay promise.
- `dispose()` removes every controller listener, cancels its pending RAF, clears drawing and resets presentation state. It is safe twice.
- `onCue` emits `focus`, `start`, `continue`, `import`, `settings`; callbacks never resume audio themselves. Native click semantics and existing main handlers remain authoritative. Hidden or disabled buttons do not emit cues.
- New `#title-sound` starts with `aria-pressed="false"` and `音を入れる`. Main owns click behavior, text, state and persisted settings. No autonomous audio initiation occurs in the title controller.
- Keep main entry as the only HTML module script. This controller has no Three.js import or gameplay reference. CSS references the WebP directly. Package esbuild must include `'.webp':'dataurl'`; Vite natively emits the referenced WebP. Do not emit the archival PNG as a preload.

The title can remain a static illustration with accessible buttons when Canvas 2D is unavailable. A real document/window is the controller boundary. The separate Node main fixture should declare any newly introduced presentation boundary explicitly rather than claiming browser execution.

## Responsive composition

Portrait uses a 76%-height art box with 430px minimum, 14px overscan on the top and sides, `background-position:72% 28%`, and a strong bottom gradient. It moves the title mark into a compact horizontal lockup beneath the main gate silhouette. Footer utilities remain parallel and the build version hides in portrait; buttons are at least 44px high. Overflow scroll remains available for small displays, text enlargement and long save errors. Short landscape reduces only title typography, not gameplay touch geometry. Aspect ratios of at least 2:1 and heights up to 650px fit the art to its box height and anchor it to the right, preserving the crown instead of vertically center-cropping it.

Crop arithmetic (geometric model only, before the 1.015 art scale and mouse parallax): source 1672×941; surveyed source anchors are crown `(1243,134)`, hood `(1177,465)`, sword tip `(1320,824)`. Portrait box width `W+28`, height `max(430,.76H)`. Cover scale `s=max(boxWidth/1672,boxHeight/941)`; image offsets `x=-14+(boxWidth-1672s)*.72`, `y=-14+(boxHeight-941s)*.28`. Wide short landscape uses `s=(H+28)/941`, offset `x=-14+(W+28-1672s)`, `y=-14`.

| Viewport | Crown | Hood | Sword tip |
|---|---|---|---|
| 390×844 | (314,77) | (269,303) | (366,548) |
| 320×667 | (258,58) | (222,236) | (299,430) |
| 844×390 | (667,46) | (638,193) | (702,352) |

The 1.015 centered artwork scale extends these anchor positions only a few pixels. Mouse parallax is clamped to ±5px horizontal / ±3px vertical and does not process touch. These calculations establish intended anchor retention; they do not verify CSS layout, overlay occlusion, small-font legibility, cropping in real browsers, or UI screenshots.

## Provenance and production time

`src/assets/title/provenance.json` includes the exact built-in imagegen prompt, UTC timestamps, original hash, derivative encoder and hash. No reference image, downloaded art or copied franchise material was supplied. Generation returned 1672×941 despite the prompt requesting 2304×1296. The original PNG was retained unchanged at 2,222,845 bytes / SHA-256 `1a722a36a27431bb76e204717cef94146364971f417fab11aaf22ebaeb12e499`. Its quality-85 WebP derivative preserves framing and dimensions at 162,962 bytes / SHA-256 `7741ecd38590876e2277f9c425c1c6c14c82cb9fd459338a6c7c6a191949858a`. Both were visually inspected as media; the original provenance does not independently adjudicate legal authorship.

Generation interval: 08:41:56.589–08:42:27.662 UTC = 31,073ms. Asset-production span through import, provenance, authorized format optimization and derivative hash: 08:41:56.589–08:44:30.110 = 153,521ms. Implementation began 08:43:46.228 and first controller/CSS pass ended 08:49:45.829 = 359,601ms. The spans overlap and must not be summed. Focused tests were successful by 08:52:06.290; first test run passed all eight. Subsequent review refined very-wide landscape crop, very-short landscape typography, and CSS animation pausing. Full combined integration/package/CI/publication and their time are outside this title unit. The old gradient title's equivalent production time was not measured, so no speed multiplier or whole-project forecast is claimed.

## Validation and remaining acceptance

`node --test tests/title-cinematic.test.mjs` passes eight focused tests: bounded backing store, long particle reuse and clamped hidden-time jumps, one RAF through blur/hidden/pagehide/BFCache, live reduced-motion changes, no touch parallax, complete/idempotent disposal, UI/save/audio ownership, optional Canvas, and original/derivative byte hashes. Explicit Canvas/RAF/DOM boundaries are numerical call-recording models; they do not render a browser. `node --check src/title-cinematic.js` and local Vite build passed; the latter emitted the 162,962-byte WebP and retained lazy Three.js chunks. The root must run the combined build after importing this controller and updating the standalone WebP loader.

The full September 20 completion goal remains evidence-insufficient: this fixes a concrete title-art/presentation gap, not all models, animations, audio or the fixed ten-game comparison. Formal preview was not available to this title owner; no alternate browser/server or access route was used. The next acceptance step is the integrated title/new/continue/import/settings/sound lifecycle, then authorized portrait/landscape screenshots and audible output when that environment is available. No user preparation is a prerequisite to the completed source work.
