# Independent Mira upper-garment review, recovery v54

Technical source/boundary/UV checks pass for the fixed candidate. No additional required source fix is requested within Mira's current idle-only production scope. A broader all-pose contact no-regression claim does **not** pass, and meaningful visible torso-shape improvement is **not** established by the actual conversation-camera measurement. These are fresh measurements, not a recovered v42 PASS. The integration decision relayed by the author is to retain this candidate and evidence without adopting the runtime change; no further redesign or probe is requested in this unit.

Candidate author checkpoint `f879e759af22094e79f113b885d6b8f037de5651`, base `fa920db9782b7df42e4e16099a05994e5841dbaa`. Fixed runtime source:

- `detailed-geometry.js`: `db037549dbdee519d0fb57520ee0257f09dc1a127048ee202a2a22b64980b8f6`, 33,072 B.
- `body-profile-data.js`: `c4f03def06656c980adc1dc2833b11a314b6edebce461d46c548df272b45c686`, 1,549 B.
- `body-profile-provenance.json`: `06d1fab30717a325cfe80bfb7f99a45941e514f965dd862be8da8a31fc3b85d2`.
- Generator: `23bf06a1880bdfb9ad4d3c1fed16b0fd676d13a4ddaac06c52da56028ad92ec4`.

Only this review scratch directory was written. No author file, source, remote, Site, browser, viewer or asset was modified or downloaded. Existing dependencies were read directly. Runtime source hashes were checked before/after native comparison and camera measurement. Author may separately update documentation without changing these files.

## Native geometry and source checks

`review.mjs`, `baseline.json` and `comparison.json` preserve fourteen identical native CPU geometry conditions: bind, initial idle, idle1.5s, idle3s/dialogue-equivalent, ignored-emote API, walk, run, turn, sword wind/release, spear release, greatsword release, parry and an explicit arm-stress pose. Mira's real Scene call is `{moving:false}`; other actions are deformation/reuse tests, not shipped Mira behavior. There is no dedicated emote skeleton animation. The comparison uses indexed native skinning and actual bone matrices; it does not render.

The main cloth remains 483 target vertices /816 triangles. Original 161 connection vertices remain world-position exact in all fourteen poses, including collar, shoulder ends and cuffs. All index/weight/bind data, bones and non-target attributes/positions are exact. Head, neck, hands, staff/equipment and cape are therefore unchanged through the shared pose. This preserves existing seams; it does not prove the original surfaces were seamless. Other thirteen families match complete source/binding/material/node hashes through an idle→walk→attack sequence.

No target triangle reverses relative to its corresponding baseline in these conditions; no UV triangle is inverted or zero-area. Wrapped position/normal seams close and U spans retain whole texture repeat counts. Native triangle/draw counts remain unchanged. The existing procedural texture is still 64 pixels repeated four times; density is reported at that effective scale, not as imported real fabric.

Bind-pose area-weighted UV results (not interchangeable with the author's idle-pose metric):

| Part | P95 anisotropy before → after | Effective density before → after (texels/m) |
| --- | ---: | ---: |
| torso | 3.111 → 1.707 | 271.3 → 348.4 |
| left sleeve | 2.757 → 1.893 | 443.6 → 318.5 |
| right sleeve | 2.757 → 1.895 | 443.6 → 318.5 |

The old torso/sleeve texture density differed substantially; the new charts bring them closer. Rendered weave phase across separate garments, shading and natural fabric appearance remain unverified.

`provenance.py` independently re-intersects the saved original MakeHuman body triangles with all thirteen final source section planes, reconstructs connected components and section bounds, and verifies the reported clamp/blend factors against emitted profile arrays. Original OBJ SHA/bytes, generator/output hashes, preserved license file and all component counts/bounds match. Source body has 26,756 triangles; 68 of186 sampled radial values are constrained by the authored clamps. The shoulder-adjacent ring uses the declared separated upper-arm fraction .34, avoiding the former joined-torso-section issue. Raw ray-hit radii were source-inspected, not independently re-solved by this script; this distinction is retained in the JSON.

This is artist-authored source anatomy registered to an existing garment, not a scan, a cloth simulation or measured fabric thickness. Bbox recentering removes the original section offset; fixed Q radii, back-only weight, original sleeve inner envelope and 1.94m reference scale are authoring choices. Passing provenance does not establish anatomical or artistic superiority.

## Proper crossing residuals

An independent strict segment-triangle oracle checks target faces against every visible native skin/rigid/cape triangle, including nonadjacent target-to-target pairs. It excludes boundary-only/coplanar contact and shared-index neighbours. Counts below are target faces with at least one proper crossing, not penetration depth or visible pixel area.

| Condition | Before → after crossing target faces | New target faces |
| --- | ---: | ---: |
| bind | 219 →219 | 0 |
| idle0 /idle1.5 /dialogue3 | 254→254 /251→251 /252→252 | 0 /0 /0 |
| walk | 225→229 | 6 |
| run | 218→218 | 2 |
| sword wind /release | 232→235 /240→240 | 5 /0 |
| spear /greatsword release | 221→222 /243→243 | 2 /0 |
| parry | 238→241 | 3 |
| manual arm stress | 242→237 | 1 |

The production idle counts and target-face sets do not grow, but exact triangle pairs do change: idle0 has six new pairs, including four target-to-target pairs, chest leather `340→49:105` and staff `757→50:4`. Idle1.5 adds eight pairs including lower pelvis cloth within already-crossing target faces. The candidate retains many old intersections. Broader motion checks have both additions and removals and are not a universal no-regression result.

The author's initial phrase “no new external pair” used a key of target face +other owner/material, without the other triangle ID. Author acknowledged that limitation and is correcting the description. This was a reporting-scope correction; this reviewer did not demand additional source rework after the fixed candidate. No contact depth or naturalness acceptance is inferred from aggregate face counts.

## Actual dialogue camera and occlusion

The final bounded comparison uses the existing `static-scene-fixture` with real SceneView and DialogueCamera, the same keeper +Z3m/default-yaw condition from `verify-dialogue-framing.mjs`, real `Game.interact`, and three actual viewport dimensions. Only the candidate Mira model is replaced in the Node fixture's memory. Both camera matrices and projection matrices match exactly; selected distance is2.6m and angle0.

Native Three triangle rays test each changed vertex against visible Mira and player meshes. This includes clothing self-occlusion and equipment. It does not include environment-ray occlusion, shaders, alpha fragments, DOM layout, rendered silhouette pixels or a full main-VM click route. The existing upper frame bounds y3.5–51.5% are reported separately as the dialogue-safe area. Changed vertices are a sample, not an exhaustive silhouette analysis.

Of105 changed points (45 torso,30 each sleeve), 2 torso and12 each sleeve are both unobstructed and inside that upper frame. There are66 blocked points:63 first hit cloth, one metal and two leather. In these front views no first occluder is the cape; the large back-contour displacement is primarily hidden by the torso itself.

| Viewport | Max projection change ignoring occlusion: torso | Max unobstructed upper-frame change: torso /left sleeve /right sleeve |
| --- | ---: | ---: |
| 1280×720 | 3.519px | 0.01765 /1.1204 /1.1045px |
| 844×390 | 1.906px | 0.00956 /0.6069 /0.5983px |
| 390×844 | 4.125px | 0.02069 /1.3134 /1.2948px |

The large unoccluded torso projection number is therefore not visible torso-improvement evidence. The sleeve differences are small, including subpixel differences in landscape mobile. Numerical UV improvement is separate from visible anatomical shape. No image, physical screen, visual superiority or whole-screen PS4-quality result is claimed.

## Reproduction and handoff

All scripts write only beside themselves. `review.mjs` without arguments regenerates baseline; with candidate root and fixed geometry SHA it regenerates comparison. `provenance.py` accepts candidate root. `dialogue.mjs` names the two source roots explicitly; update paths only after verifying their recorded hashes. No installs are required on this reviewer's behalf. `HASHES.json` lists final immutable copyable files. All review sessions have completed; no source/dependency use remains. The integrator decides whether this limited candidate belongs in runtime; the review does not equate numeric compatibility with completion of the requested visible body-quality improvement.
