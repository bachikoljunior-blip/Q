# Dialogue framing v32 — source candidate, visual acceptance open

The ordinary dialogue camera previously kept its target on the player: legal Mira/Sena approaches projected a roughly20px head at1280×720 and11px on844×390, with both faces nearly in profile. Earned consultation saves cropped a participant or the active speaker on390×844. A centered near-opaque reading panel and whole-screen blur further hid the characters. The [fixed v30 read-only audit](evidence/dialogue-framing-v31-audit/REVIEW.md) is retained with all five original files and hashes.

This unit changes conversation composition and its reading surface. Actor geometry, material, bone poses, NPC facing, player state, physics, audio, assets, title and arrow generation/update are unchanged. Source base is `fb07441c63cc8e7c985972691eccaed0e1fa50b3`; only the sole integration owner may push, merge or publish. No official preview was available, and none was bypassed.

## Implemented behavior

`panel(..., npc)` passes only the canonical ordinary NPC ID through the existing `focusGathering(null, npc)` entry. The scene retains the original gathering actor staging and uses the current ready speaker. Closing or changing to other panels clears this temporary focus; the existing gameplay yaw/pitch/zoom and save fields are never written by the helper. Keyboard and gamepad remain paused; wheel input now also respects the open modal.

The deferred `DialogueCamera` chooses from distances2.6/3.2/3.8m and front/±30°/±60° bearings. Static `cameraFraction`, terrain clearance and conservative nearby body cylinders reject blocked candidates without pushing the camera into a wall or body. Native skinned triangle rays to both authored eye centers then reject a candidate if the eye material is hidden by its own face/hair/gear. Exact head vertices and a shoulder/chest envelope must fit the upper safe region. The camera aims at the real head bounds; an off-axis projection places its center at23.5% of viewport height without changing the54° focal field or render viewport.

The finite search has at most15 candidates. Geometry/mesh lookup is cached per actor; selection is cached across paused frames and recomputed on speaker, game, pose, nearby-body, obstacle-array/count or viewport change. Skin refresh explicitly invokes `SkinnedMesh.updateMatrixWorld`, which updates the attached bind inverse; `updateWorldMatrix` alone caused a double transform during initial rework. No every-frame whole-world mesh traversal, new texture, render target or asset decode is added. The search's CPU/GPU time was not measured on a device.

A dead/absent/ineligible target, non-idle player, nearby threat, unready gathering or failed candidate search falls back to the preexisting gameplay/group camera and restores its projection. Resize and quality changes invalidate the cached projection, including while paused. If an interaction and a real melee death enter the same event batch, death now runs the shared closePanel cleanup before showing its screen; this prevents a stale modal from keeping respawn paused. Existing close/settings/import/restart/visibility lifecycle behavior is preserved; an already open paused consultation remains open across visibility interruption as before.

Only the dialogue mode removes full-screen blur/dimming. The full-screen modal still owns input, while an opaque `#111b20` panel sits below53dvh, capped at47dvh minus safe-area bottom padding. The body scrolls; the48px close control stays in the header. Choices retain the existing46px minimum. The current consultation line is first; participant/status information is available in a46px disclosure, and history and all choices remain available. Disclosure summaries are included in keyboard focus handling. Every new panel body explicitly resets scrollTop to0, including the next speaker line and completed choice; the independent review identified that replacing innerHTML alone did not establish this reading-start contract. Only while a dialogue is open, the HUD landmark is hidden with its existing visibility property, so the portrait quest card, location banner, toast and world labels cannot cover the face. Close and all other panel types restore the previous CSS visibility; no new :has browser requirement is introduced. Other panels retain their previous presentation.

These are CSS source contracts. Native DOM height, fonts, safe-area behavior, layout, physical touch and actual screen contrast have not been observed. The390px-high landscape rule reduces padding/header height while retaining1rem body text and46px controls; long content scrolls.

## Same-condition result

The [native oracle](../scripts/verify-dialogue-framing.mjs) executes actual main event/panel paths through explicit device boundaries, then native SceneView/Three skin matrices and projection. All eight before/after player and NPC states match exactly. Every final main interaction is legal, the panel is open with dt0, and close restores normal update. No rendering occurs.

| Condition | Head H×W before,1280×720 | After,1280×720 | After,844×390 | After,390×844 |
|---|---:|---:|---:|---:|
| Mira,+Z3m |20.18×15.11|90.88×76.49|49.23×41.43|106.53×89.66|
| Ren,+X3m |19.94×17.07|90.72×70.52|49.14×38.20|106.35×82.67|
| Sena,+Z3m |20.64×15.34|90.80×76.42|49.19×41.40|106.44×89.59|
| Ren,old rear-facing4.2m |18.10×15.09|90.09×76.46|48.80×41.42|105.61×89.63|
| Hearth,Io speaking |29.50×24.62|91.08×76.66|49.34×41.52|106.77×89.86|
| Road-watch,Yuno speaking |42.13×31.85|91.35×70.47|49.48×38.17|107.08×82.61|

The JSON contains exact values for all24 viewport conditions, including Mira's sideways/reversed user camera. All selected distances are2.6m; Ren's +X approach and Yuno's consultation select−30° to avoid the player, the others select the front candidate. All heads fit the upper safe bounds and both independent actor rays reach the speaker's eye material first. The original portrait offscreen cases now fit. The cache test confirms no repeated selection during unchanged dt0 frames; close restores the original camera matrix/projection to1e−10 tolerance and preserves the serialized game.

A2/5.6mm camera-perpendicular displacement at the new distance projects to0.543/1.521px desktop,0.294/0.824px landscape and0.637/1.783px portrait. Small facial morphs remain subpixel in several conditions. This unit demonstrates useful geometric framing, not perceptual morph quality or PS4 parity.

## Budget and validation

Initial JS164,802B (+309;198B below165,000), exactly3JS chunks; total JS973,857B. Packaged standalone16,334,297B (+6,886;442,919B below16MiB). All34 staged public files agree with source/build/standalone. Native title/skin/HDR/environment bytes and runtime geometry are unchanged. The camera adds no actor meshes or material batches; visible draw/fragment workload can change with the view and has not been GPU-measured.

- Native24-condition oracle: upper head/shoulder envelope, eye rays, paused cache, canonical main routing, save invariance and return projection passed.
- Seven focused tests cover ordinary return, viewport/quality rebuild, death/threat/static blocker/target disappearance, unready consultation, real-main interruption/wheel/close/settings and CSS reading contracts.
- Full `npm test`:274/274 passed,36.512s before three final independent fixes; the final source is covered by seven focused tests and fresh native24-condition, main/gathering/artifact gates.
- Existing main, gathering, scene-integration and artifact gates passed. Build/package outputs and gate logs are under [evidence](evidence/dialogue-framing-v32/).
- The [independent read-only review](evidence/dialogue-framing-v32/independent/REVIEW.md) confirms all24 actual skinned upper bodies in the safe frame and48 eyes unblocked using nearby actor/hand/cloth/face triangles with both sides tested. Its three required findings are repaired: explicit reading-start reset, same-frame dialogue/death cleanup, and dialogue-only HUD suppression. Final source/lifecycle readback passed on main69748211: HUD is hidden for ordinary/gathering dialogue and restored on close/settings/title/restart/import/death/respawn; reading position and real melee death cleanup passed. No required source findings remain.

Started2026-09-16 04:30:21UTC. Source/API/layout plus first build completed at04:34; initial same-condition author verification and final runtime source stabilized by04:41. No asset sourcing/generation time (0), no image editing. Skin bind-update and lower chest framing rework occurred during the same interval and was not separately timed; independent UI/lifecycle findings were repaired between04:49 and04:59, do not infer pure implementation labor from this wall duration. Validation and independent review completed within this finite unit; the integration owner records the final exact integration commit and combined build.

## Limits

No browser, WebGL pixels, native CSS layout, GPU allocation/timing, physical device input or target-game comparison was observed. The body cylinder is a conservative approximation; the own-eye ray uses the actual opaque actor meshes, while full foliage/non-collider prop visibility is not exhaustively tested. Shoulder framing uses a bounded authored envelope, not a visible-pixel segmentation. Frozen dialogue retains the existing animation pause; this change does not add facial acting or lip movement. A valid close-up can expose the existing limits of faces, clothing and lighting. Whole-screen PS4 quality and the9/20 completion target remain unverified.
