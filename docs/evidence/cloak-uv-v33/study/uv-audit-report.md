# v33 actor material UV audit

Started 2026-09-16T04:36:37Z; finished 2026-09-16T04:44:44.296874+00:00. Read-only base `fb07441c63cc8e7c985972691eccaed0e1fa50b3` in `/workspace/scratch/e72662e3b71f/Q-ps4-v30`. Source hashes remained unchanged. CPU Three.js authored bind-pose geometry only; no WebGL image, GPU performance or appearance acceptance. No asset retrieval, image editing, repo file writes or symlinks.

The current UV recipe causes inconsistent cloth scale and strong stretching on some pieces. A UV-only correction is feasible while retaining positions, indices, bones, skin weights, materials and batching. It needs different treatment for sharply tapered closed shells and the open cape, plus a deliberate policy for the circumferential texture seam.

## Measured current geometry

The same 64×64 procedural bump/roughness texture uses repeat(4,4), giving 256 texels across each nominal UV unit. Density below is sqrt(total absolute texel area / physical surface area); P05/P95 and anisotropy use triangle physical-area weighting. Anisotropy is the ratio of singular values of the UV-to-physical tangent Jacobian.

| Piece | Surface m² | Equivalent texels/m | Triangle density P05–P95 | Anisotropy median / P95 |
|---|---:|---:|---:|---:|
| player torso | 0.8902 | 271.3 | 204.4–371.1 | 1.40 / 3.11 |
| player belt | 0.0854 | 876.1 | 822.8–945.6 | 19.58 / 20.93 |
| player sleeve | 0.3331 | 443.6 | 333.7–641.2 | 1.78 / 2.76 |
| player cape | 0.9394 | 264.1 | 229.6–310.2 | 1.41 / 2.02 |
| player hip-hem | 0.3131 | 457.5 | 397.4–525.2 | 4.89 / 6.71 |
| player trousers | 0.4141 | 397.8 | 296.5–623.9 | 1.35 / 1.89 |
| smith apron | 0.9171 | 267.3 | 254.3–280.3 | 1.46 / 1.58 |

All these pieces use UV 0–1 in both axes. The sleeve pattern is 1.68× finer per physical length than the cape in area-equivalent terms. The existing sinusoidal cloth weave repeats every 4 source texels: that corresponds to area-equivalent repeat spacing about 14.74 mm on the torso, 9.02 mm on the sleeve, 10.06 mm on trousers and 15.14 mm on cape. These describe a procedural signal, not measured physical yarn.

`shell()` assigns `V = ringIndex / (ringCount - 1)`, not physical length. The torso's eight bands use the same ΔV=.125 for ΔY=.03–.14 m (4.67× difference in axial parameter density). Including taper/folds, actual mean meridian V density varies 224.9–519.9 texels/m on torso, 254.7–580.4 on sleeve and 243.2–706.1 on trousers. The trouser knee bands receive about 2.9× the longitudinal texture density of its longest upper band.

The belt is especially stretched: its .068 m height receives the same full V range as its approximately 1.255 m circumference receives U. The principal anisotropy median is 19.58:1. The .80 m apron has much more even ring spacing and considerably lower distortion.

Boss root scale2.3 magnifies the physical texture: torso 112.9 texels/m, sleeve192.9, trousers173.0, long cape101.5. Using the same global cloth texture repeat cannot independently correct these pieces.

Cloth body/sleeve/leg/cape/apron examined here have zero zero-area UV triangles. All192 cape triangles have negative signed UV area consistently across its one chart; that is not a local fold or mixed-orientation reversal. Whole-chart handedness must be retained when comparing maps. In the complete unbatched family recipes, sword metal contains zero-area UVs: player8 (two blade variants), soldier4, boss4. Those are recipe counts before equipment visibility selection, not a count of simultaneous visible degeneracies. Other measured semantic material groups have none.

## In-memory metre-UV feasibility

Two numerical alternatives changed UV buffers only on isolated geometry clones. Both use cumulative mean world-space meridian distance for V. `reference-circumference` fixes U to one representative median ring circumference. `ring-arc` uses each row's measured cumulative arc length, centred around zero. The unchanged 64×64 repeat4 texture then has a nominal target256 texels/m. All tested chart signs and nonzero UV areas were preserved.

| Piece | U method | Equivalent texels/m | Anisotropy P95 |
|---|---|---:|---:|
| torso | reference-circumference | 261.8 | 2.03 |
| torso | ring-arc | 258.3 | 4.60 |
| belt | reference-circumference | 256.0 | 1.16 |
| belt | ring-arc | 256.0 | 1.00 |
| sleeve | reference-circumference | 248.2 | 1.66 |
| sleeve | ring-arc | 256.3 | 2.63 |
| cape | reference-circumference | 256.4 | 1.41 |
| cape | ring-arc | 256.8 | 1.17 |
| hip-hem | reference-circumference | 258.4 | 1.29 |
| hip-hem | ring-arc | 256.1 | 1.35 |
| trousers | reference-circumference | 234.4 | 1.54 |
| trousers | ring-arc | 256.2 | 1.61 |
| apron | reference-circumference | 256.6 | 1.09 |
| apron | ring-arc | 256.0 | 1.16 |

Ring-arc UV works well numerically for the open cape and reduces density disparities on limbs, but its torso taper increases P95 anisotropy3.11→4.60 (broad torso3.49→5.05). The fixed reference circumference gives a better torso result, P952.03 (broad2.25). A single universal arc-length map is therefore not recommended.

For closed shells, current U0/1 with repeat4 matches the seam phase. A circumference expressed in metres is generally not an integer texture period; both trial alternatives can lose that phase agreement. A bounded implementation should fix the circumference coordinate per closed piece and deliberately align the repeat phase or use an existing hidden garment seam. Open cape has no closed seam constraint. Do not silently treat these trial UVs as visually accepted.

UV-only changes preserve geometry and material grouping; they add no texture bytes, triangle count, bones or draw batches. Store physical calibration in the selected garment UVs instead of globally changing the shared cloth texture repeat. Future physical tile width/height can convert metres to UV, but the approved runtime repeat and the other semantic uses must be accounted for exactly once. The rejected photographic asset was investigated by the parent; this reviewer did not retrieve or verify its pixels or budget.

## Shared surface contracts

- `cloth` microtexture is also used by hair, paper/wrappings/herb leaves and wolf fur, distinguished mainly by tint. A global photographic cloth replacement or repeat change would affect these surfaces.
- `wood` uses `surface('leather', 0x514333)`: staffs, spear shaft, hammer handle, bow and other timber use leather bump/roughness. Dark soles/laces also use leather.
- Bare palms/fingers and neck use skin microtexture; armored hands use leather. These are generated by the same shell helper, so a global shell-UV change would alter hand/finger scale too.
- The face has a separate cloned skin material and imported original UVs. Only smith receives the installed skin diffuse; eyes/lids/neck/hands remain separate. Garment UV work should not modify face UVs or skin-loader contracts.
- Bump and roughness share the same per-kind DataTexture object. Physical reparameterization does not require a second image or material batch.

## Reproduction and exact evidence

Run `node /workspace/scratch/e72662e3b71f/q-v33-actor-material-study/uv-audit.mjs`. The script reads the unchanged source, exposes raw recipe functions only inside an in-memory module, and writes `uv-audit.json` in this folder. Full part/ring densities and material-use records are in that JSON. It evaluates one authored recipe per family, not the live Scene population. Dynamic pose/cloth stretching, visible occlusion, aliasing, shading and global overlapping UV area are not evaluated.

Detailed geometry SHA-256: `a320835670bd43147e793651834034a87ad23d16f87c191b412a5de881a17849`.
Skin material SHA-256: `20000dafc7ffac8f49a82a5a40b352ba2cde23965b8423acc3696e27db5e1c63`.
Audit script SHA-256: `d516e46244d8d08dc9f7cb6e45efa23477175a84601b8ed4407ca42f317d113e`.

All reviewer-owned tool sessions have returned completion. No new child was spawned. No repo face-identity generator was run by this reviewer; earlier face audits executed only registration-prefix reads and wrote their diagnostic outputs under scratch. These records do not establish why another file appeared or what another writer did.
