# v31 dialogue framing audit — read only

**Conclusion:** current dialogue presentation prevents reliable inspection of the existing face detail. Fix framing, orientation and dialogue layout before treating 2–5.6 mm morph differences as demonstrated screen quality.

Fixed source: `fb07441c63cc8e7c985972691eccaed0e1fa50b3`. Started 2026-09-16 04:13:24 UTC; completed 2026-09-16T04:27:39.371389+00:00. Source bytes were checked before/after the oracle and all hashes matched. Repository, remote and preview were not modified. No new source asset or generated image; no implementation. Investigation/projection/oracle/report is one finite unit; two small fixture corrections (close-button ID and rejecting an obstructed Ren approach) are included, not separately timed.

## Evidence boundary

Actual main.js was compiled in memory using the existing explicit application-boundary fixture. Every final case calls the live Game.interact on the canonical NPC and succeeds; main opens the actual dialogue/resident/Sena/gathering markup, calls the expected focus API, and updates with dt=0. Closing restores focus=null and dt=1/60. The native SceneView then evaluates the same paused player/resident state, real authored skinned actor geometry, bone transforms, PerspectiveCamera and Vector3.project. Renderer, image/texture assets, DOM and audio are explicit fixture boundaries. There is NO screenshot, CSS layout, WebGL, shader compilation, visible pixel/AA/shadow/texture, device performance or PS4-quality observation.

Head bounds below mean all 1,012 vertices of the actual Q anatomical face surface (including ear/collar extent), not an exposed-face segmentation. Hair/hood/helmet can change the visible silhouette. CSS pixels are measured at devicePixelRatio=1. At physical DPR >= quality cap, backing-buffer spans scale by low=1, medium=1.35, high=1.7; CSS face size and UI coverage do not increase.

## Actual paths and orientation

- Ordinary Mira/Ren/Sena dialogue calls panel(...), which calls focusGathering(null). No NPC camera target is passed. That sets cameraSnap=true; paused dt=0 still snaps to the gameplay camera, whose target is player+(0,1.6,0), pitch .3, distance 9 (portrait ×1.12). Starting yaw .05; later user yaw survives. Controls are disabled while paused, so an offscreen NPC cannot be corrected in the open panel.
- Mira stays rotation.y=1.4 and Sena=-1.5. Residents face a nearby player only below 3.7m, unless fleeing/gathering; talk is legal below 4.7m. The 3.7–4.7m ring can preserve a previous direction. The legal Ren -Z/4.2m fixture preserves +Z facing and shows the back of his head.
- Active, ready gathering calls focusGathering(id). Its stage uses the live cast center, horizontal distance max(6.5,spread×2.4), camera altitude groundAt(camera)+3.2 and target groundAt(center)+1.45. Cast face the player and player faces the center. Idle/not-ready/interrupted stages return null and retain the ordinary camera path. Group framing has no viewport-aspect fit.
- Native FOV is 54° vertical. Horizontal FOV: 1280×720 =84.342°; 844×390 =95.591°; 390×844 =26.497°. The narrow portrait projection explains cropping despite the portrait gameplay distance multiplier.

## Current head bounds — height × width in CSS px

| Same-state case | 1280×720 | 844×390 | 390×844 | Desktop face-forward angle |
|---|---:|---:|---:|---:|
| Mira +Z 3m default yaw | 20.18 × 15.11 | 10.93 × 8.19 | 21.68 × 16.24 | 78.6° |
| Ren +X 3m aligned user yaw | 19.94 × 17.07 | 10.80 × 9.25 | 21.39 × 18.33 | 17.9° |
| Sena +Z 3m default yaw | 20.64 × 15.34 | 11.18 × 8.31 | 22.13 × 16.46 | 88.3° |
| Ren -Z 4.2m edge of talk range, prior facing +Z | 18.10 × 15.09 | 9.80 × 8.17 | 19.62 × 16.36 | 170.4° |
| Mira +Z 3m user camera sideways | 25.85 × 23.16 | 14.00 × 12.55 | 27.05 × 24.09 | 19.5° |
| Mira +Z 3m user camera reversed | 38.87 × 29.04 | 21.05 × 15.73 | 38.84 × 28.99 | 99.1° |
| earned hearth | 29.50 × 24.62 | 15.98 × 13.34 | 34.58 × 28.86 | 12.1° |
| earned road-watch | 42.13 × 31.85 | 22.82 × 17.25 | 49.39 × 37.34 | 42.0° |

0° means facing the camera; >90° means camera is behind the head front axis. Mira/Sena default approaches are almost profiles. Native raycasts from the camera to both authored eye centers hit their own face surface 22–116mm before the eyes. Ren rear fixture hits the speaker hair (Q cloth) about241mm before the eyes. This is actor-only triangle occlusion, not full-world visibility or a rendered-eye judgment.

The normal 3m approach puts Mira/Sena heads roughly11.8–11.9m from the camera, although the camera zoom property is9m. At1280×720, a2mm camera-perpendicular displacement at that depth projects to0.119–0.120px, 5.6mm to0.333–0.337px; mobile landscape0.064–0.065px /0.180–0.182px. The current earned consultation speaker ranges0.174–0.250px /0.488–0.700px desktop. These are direction-specific displacement upper references, NOT the actual candidate morph field, perceived differences or a hard visibility threshold. Subpixel changes can influence AA/normals, but do not prove meaningful face distinction.

Concrete source-state cropping at390×844:

- Mira with a legal +Z3m approach and user yaw π/2: head x428.9..453.0px, completely outside the390px viewport.
- Earned hearth-middle: Ren x431.8..476.1px, completely outside; current speaker Io x17.9..46.8px.
- Earned road-watch-middle: current speaker Yuno x−11.5..25.8px, clipped at left. The other participant remains inside.

## DOM/CSS bounds, not a measured browser layout

All these dialogues use the same centered #panel with max-width880px, width100%, and a whole-viewport #panel-backdrop. At zero safe-area insets, panel horizontal extent is x200..1080 on1280×720, x20..824 on844×390, x12..378 on390×844. Maximum heights680/370/820px; actual auto height depends on content/fonts and was NOT measured. Exact vertical overlap cannot be asserted from the fixture.

The backdrop is #070d13b8 (72.16% opacity) with blur(6px) over the WHOLE game view. Panel gradient opacity is247/255..251/255, meaning the nominal underlying contribution inside the panel is only0.44–0.87% after backdrop, before text/shadows. This is source alpha composition, not measured brightness. Almost all ordinary projected faces are horizontally inside this centered panel; its vertical range can overlap them. Even an uncovered face is blurred/dimmed by the full-screen backdrop. Camera-only changes would leave this obstruction.

## Two alternatives at exactly the same actor, pose and location

**A. Speaker priority:** native54° FOV, head-center target, camera2.6m along existing head front, camera y=center+.10m. No actor/root/bone/morph/state change. Test static ground/obstacle cameraFraction and actual actor eye rays. Select from front/±30° candidates; do not blindly use the front candidate. Center the composition in an unobstructed upper area and render dialogue in a scrollable lower panel.

| Case | Front2.6m head H×W, desktop | Landscape | Portrait | Required safety note |
|---|---:|---:|---:|---|
| Mira +Z 3m default yaw | 90.88 × 76.49 | 49.23 × 41.43 | 106.53 × 89.66 | All static camera fractions1; both eye rays reach Q eye. |
| Ren +X 3m aligned user yaw | 90.09 × 76.46 | 48.80 × 41.42 | 105.61 × 89.63 | All static camera fractions1; both eye rays reach Q eye. |
| Sena +Z 3m default yaw | 90.80 × 76.42 | 49.19 × 41.40 | 106.44 × 89.59 | All static camera fractions1; both eye rays reach Q eye. |
| earned hearth | 91.08 × 76.66 | 49.34 × 41.52 | 106.77 × 89.86 | All static camera fractions1; both eye rays reach Q eye. |
| earned road-watch | 90.88 × 76.49 | 49.23 × 41.43 | 106.53 × 89.66 | Front blocked by player; use tested ±30° candidate. |

On road-watch, front cameraFraction=1 still places the player between camera and both Yuno eyes (hit0.879/0.885m from camera). Both±30° candidates preserve static fraction1 and hit the actual speaker eye material first. The−30° candidate yields91.35×70.47px desktop,49.48×38.17 landscape,107.08×82.61 portrait. This makes actor-occlusion validation necessary alongside native static cameraFraction. World meshes without collision, alpha foliage and changing animation were not exhaustively raycast.

At2.6m the same2/5.6mm reference displacement is0.543/1.521px desktop,0.294/0.824 landscape,0.637/1.783 portrait. The2mm case is still subpixel, especially landscape; a closer camera does not by itself establish morph quality or photorealism.

**B. Preserve both participants:** keep the existing cast direction and groundAt camera/target heights; retreat in20% steps until BOTH native head bounds fit x10–90%,y4–55% of portrait. Use an off-axis projection center at y27.5% (same focal length) to leave lower dialogue space. This is a measured head-only fit; full upper bodies require a larger safety volume. The tested first fits are:

| Earned state | Nominal group distance | Actual native static fraction | Participant head heights at390×844 |
|---|---:|---:|---:|
| earned hearth | 11.232m | 1 | smith-ren 28.96px; healer-io 21.87px |
| earned road-watch | 9.360m | 1 | traveler-asa 26.97px; scout-yuno 33.07px |

The all-participant portrait option removes this fixture cropping but makes Io21.87px/Yuno33.07px high, versus roughly107px with speaker priority. Use a group establishing view and speaker focus for active lines if actor detail is the goal. This is a design proposal, not implemented camera switching or a measured aesthetic preference.

## Minimal safe implementation contract for the owner

- Deferred SceneView owns framing calculations, candidate selection, projection aspect/resize and validation. main passes only current NPC/speaker identity and closes the focus on every existing panel/leave/settings/death/import/restart path. Avoid adding actor data, Three or camera math to the initial chunk.
- Keep existing gameplay yaw/pitch/zoom untouched while using temporary dialogue focus. Preserve snap/reset semantics on return and do not write NPC angles, player pose or camera values to saves. Ordinary real gameplay remains user-controlled; modal dialogue keeps input paused.
- Evaluate actual active/ready gathering and action safety. Clear/fallback immediately on target disappearance, dangerous/interrupted stage, invalid camera clearance or insufficient framing. Static cameraFraction alone is insufficient for close shots; include player/other cast exclusion volumes or bounded actor rays. A failed candidate should not tunnel closer through bodies/ground.
- Apply a dialogue-specific lower-panel style and remove whole-screen blur/dimming only in that mode. Keep text contrast, speaker/choice/history controls, scroll and46px targets; bound panel height, preserve safe areas, and reserve explicit upper composition space. Portrait and390px-high landscape need separate layout validation. No exact browser heights have been established here.
- Actual initial JS headroom is507B (164493/165000), threeJS chunks; standalone headroom449805B (16327411/16777216). This research adds0runtime bytes. A future implementation must measure its built initial bundle/three-chunk/standalone limits; no size exemption is proposed.

## Reproduction and remaining limits

`node /workspace/scratch/e72662e3b71f/q-v31-dialogue-framing-audit/audit.mjs` runs without a server/browser and writes only audit.json. Requires the existing Q-ps4-v30 dependencies. Full outputs and every source SHA256 are in audit.json; run.txt is the final bounded readback. All8 main routes are legal, panel open, paused dt0, close/resume successful, zero recorded main errors.24 viewport states, real skinned head vertices and same-state camera alternatives were measured. No optional broader test suite was added or run.

Not covered: actual canvas/DOM compositing, native browser layout/touch/safe-area/font metrics, animation during an unpaused future dialogue system, every allowed user orbit/zoom, all terrain/prop/foliage occlusion, texture quality, GPU/device performance, side-by-side target-game comparison. PS4 whole-screen quality remains unproven. The documented finite unit is complete; no runtime implementation is authorized by this report.
