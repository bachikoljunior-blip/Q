# Gameplay interface presentation — 2026-09-15

Scope: UI-only worktree based on `c33be61a3f50fa5d703e9c1fcf39a8140bc04507`, assigned to `/root/ultra_q_title_video/ui_ps4_ultra`. The accepted task requests a coherent presentation for everything on screen, with realistic PS4-era games as a quality direction. This slice does not establish that quality parity. Completion acceptance remains **0/7**, fixed-game comparisons **0/10**, and the 2026-09-20 completion forecast remains evidence-insufficient.

## Implemented coverage

| Surface | Change |
| --- | --- |
| Player and quest HUD | Consistent ivory/aged-metal palette, protected text contrast, separated bar thicknesses, larger quest and numeric text, labeled map/journal/pause buttons. |
| Combat HUD | Unified target, enemy/name, boss, warning and interaction treatment; existing urgent/recommended/drinking and inline readiness states are retained. |
| Touch controls | Removed the legacy parent scaling; declared action circles remain 50/60/78 px and normal top actions 48 px on the target phone widths. Safe-area offsets protect the outer edges. The lock action is moved below the attack circle's declaration-level overlap. Existing controls, pointer routing and joystick geometry semantics are retained. |
| Shared menus and pause/settings | The heading and 48 px close control occupy grid rows outside the scrolling body. Body content scrolls with touch; buttons/selects use minimum 46 px height, wrapping text and constrained width. Settings selects use a 1 rem font. |
| Journal/equipment/upgrades | Consistent sections, clear equipped/disabled states, larger support text, flexible card layout and single-column layouts on narrow viewports. |
| Dialogues/gatherings/endings | Larger serif dialogue text, readable secondary choice text, consistent speaker/current-speaker/history hierarchy. No dialogue text or choices were changed. |
| Map | Preserves the canvas's 600:460 drawing ratio instead of the old conflicting portrait ratio and maximum height. Travel actions reflow below it on narrow widths. The drawing and map data are unchanged. |
| Death/fatal states | Readable body text, wrapping actions, safe-area padding and vertical scrolling. |

Only `src/game-interface.css` and one leading import in `src/style.css` change application inputs. Every new selector is confined to `#hud`, `#panel-backdrop`, `#death-screen`, or `#fatal`. The existing title stylesheet rules and `index.html` are byte-identical to the base. The settings dialog opened from the title intentionally receives the shared menu presentation. No assets, fonts, dependencies, controls or gameplay features are added.

## Source and build checks

- PostCSS parsed **229 rules / 257 selectors / 769 declarations**. All **28 unique ID references** exist in the actual static markup; every selector passes the non-title-root check. The import is first, the legacy stylesheet after it is byte-identical, and the new CSS contains no asset URLs.
- `npm run build` passed after the final CSS changes. The entrypoint's exact manifest stylesheet `index-B0ZvNGRZ.css`: **57,593 B**, gzip **13,098 B**. Baseline stylesheet: **33,400 B**; raw CSS increase **24,193 B**. Existing oversized-JS-chunk warning remains. New source stylesheet: **27,798 B**, SHA-256 `5db72d544357e5d97ba529829d5acc1a659b4c07876f31af6e0885fa5a765061`.
- `node scripts/verify-main-runtime.mjs` passed: **16 scenarios / 3 negative controls / 6 detections**. This run preceded the final label-wrap and lock-position CSS refinement; JavaScript was unchanged.
- `node --test tests/touch-controls.test.mjs tests/presentation-main.test.mjs` passed before the narrow-width CSS followup: **10/10**, including production lifecycle fixtures at **390×844 / 844×390** and pointer ownership/cancellation. JavaScript remained unchanged. These Node fixtures do not execute CSS or browser hit testing.
- `git diff --check` passed. No new assertion-only UI test suite was added. Integration owns generation of the combined release artifact and its package/artifact gates.

## Measurement and limitations

First implementation was prospectively timed from `2026-09-15T11:24:55.447Z` to `11:31:51.589Z`: **416,142 ms**. The subsequent repair/check interval ended at `11:35:09.800Z`: **198,211 ms**, with repair and validation not independently timed. Initial source inventory and document preparation were not independently timed. Source review caught the import initially being placed after rules and a generic button rule outranking the close control; both were fixed before the first candidate build. Later source review moved the lock action and allowed action labels to wrap.

Baseline build wall time was **3,009.7 ms**, first candidate **4,374.1 ms**, final candidate **2,486.3 ms**. Candidate runs overlapped independent Node checks. These are host/build timings, not a rendering-speed comparison, production-throughput forecast or device FPS evidence. No asset-generation time applies to this CSS-only slice.

Independent review then found a concrete inherited overlap at **320×568 / safe-area 0**: the joystick declaration rectangle was `(12,400,86,86)` and jump was `(75,426,50,50)`. A followup restricted to portrait widths at most 360 px moves jump to `bottom:182px` and expands its group's envelope to 244 px high. With the same explicit assumptions, jump is `(75,278,50,50)`: its bottom is 72 px above the joystick top and 16 px above heal `(64,344,50,50)`. Other action positions and the 390×844 / 844×390 rules are unchanged. These coordinates are CSS arithmetic, **not** rendered rectangles or hit-test evidence. The followup build took **2,367.9 ms**, completed `11:37:51.768Z`, and passed; its repair time was not separately timed. The source scope/ID check also passed again.

The CSS explicitly addresses phone portrait, short landscape, safe areas, text wrapping, reduced motion, focus and scroll containment. It has **not** been observed in a live browser: the official Sites preview supervisor mailbox is unavailable, and no substitute browser/server/CI route was used. Rendered 390×844 and 844×390 pixels, real safe-area values, enlarged-text layout, touch hit testing, native selects, GPU compositing, physical input, readability against actual scenes and device performance remain unverified. No screenshot, visual-quality pass or PS4-parity claim is inferred from source/build/Node checks.
