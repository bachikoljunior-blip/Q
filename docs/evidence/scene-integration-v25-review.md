# Independent integrated SceneView review

Result: no required integration source correction found at `src/scene.js` SHA-256 **d1cdd4389c4de89e92c871d1b52d8f524ad6b73d0dbaae45e0e8f1c4ccf3b87c** in `Q-ps4-v25`.

Ran the **actual async `createSceneView` factory**, `SceneView.update`, current actor animation and real `Game.tick`. The texture loaders returned identifiable Three Texture objects; the renderer was an explicit non-drawing boundary double. No fake pixels, alternate browser route or model-view proxy was used. This verifies coupling, shader source and CPU transforms, not image decoding, Canvas, GLSL compilation, WebGL output, actual frame pacing or visual parity.

- All three factory loaders are invoked once. Scene construction waits for the delayed forest loader. Both tree families' near and far instanced meshes—four meshes total—use the exact returned forest textures in visible, depth and point-distance materials.
- Six quality/location combinations preserve all four mesh objects, per-family instance totals, attributes, alpha maps/cutoffs, DoubleSide settings and shared wind-time uniforms. All12 mesh/material-path contracts pass. The installed Three color varying is `vec4`, and the integrated forest fragment selects `.rgb`; shadow shaders do not inherit the visible-only varying.
- A negative-control factory with only `installForestTextures(forestTextures)` removed is rejected by the exact same map-identity test. Thus the check detects missing runtime installation rather than merely matching source text.
- Real gameplay runs at fixed60Hz while the integrated SceneView updates at30/60/120Hz, across sword, spear and greatsword: nine profiles, **99/99 release updates have a visible trail, zero unexpected release resets**. These are numerical update rates, not measured display refresh.
-407 active trail updates independently rebuild the current weapon ancestor transforms from local scene properties **before renderer traversal**. Every sampled authored blade point matches with maximum error0. Update order is actor animation → trail → renderer.
- Paused `dt=0`, inactive/title update, death, explicit camera/teleport reset, an unsnapped100m root jump and new-game replacement all suppress stale ribbons. No source edits were needed.

The main source calls `view.update(paused?0:dt,playing)` and uses `snapCamera` for travel, respawn and save-import boundaries; `snapCamera` now clears the trail. This is read-only source confirmation of those call sites, not a second full main/UI runtime test.

Reusable unchanged CLI: **`verify-scene-integration.mjs`**. Run `node verify-scene-integration.mjs /absolute/repository /absolute/report.json`. The script and result are in `/workspace/scratch/e72662e3b71f/q-v25-audit/`; the owner can copy the script into `scripts/` without changing imports. The final result is **`scene-integration-report.json`**, containing exact hashes for scene, actor, motion, forest material and weapon trail. Single run exited0 in8.117s in this Node environment; no device performance conclusion follows.
