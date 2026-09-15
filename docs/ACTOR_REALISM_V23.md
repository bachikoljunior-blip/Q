# Actor shape, deformation and contact checkpoint — 2026-09-15

Latest direction: models and animation should pursue the quality of realistic PS4 games. Base: `c33be61a3f50fa5d703e9c1fcf39a8140bc04507`. This is one bounded source improvement, not acceptance of PS4 quality or the ten named flagship comparisons. Completion acceptance remains 0/7 and comparison 0/10. The 2026-09-20 deadline is unchanged; elapsed local implementation time cannot establish completion of the remaining art, animation, device and external comparison work.

## Implemented unit

All 14 actor recipes and four guardian themes use the shared implementation. Adult torso, sleeves, trouser legs, boot shafts, hands and wolf trunk/tail now have shaped continuous ring surfaces. Shoulder/elbow/wrist, pelvis/knee/ankle, spine, finger and canine hock collars blend bone weights. Armor and tools stay rigid. The face surface carries brow, socket, cheek, bridge, nose-tip and chin relief; five two-joint digits per hand adopt relaxed or equipment-grip poses. Two eyelids blink during locomotion/idle. Boot geometry has a heel, instep, arch and toe box. Wolf hindlegs add hock articulation; its tail is continuous across three joints.

The previous ring topology faced inward; outward winding now exposes the intended armor surface, while duplicated UV-boundary normals are averaged to remove a front lighting seam. Height and roughness occupy distinct R/G texture channels. Skin has smaller relief than cloth or leather; metal and eyes have distinct roughness. Small ornament spheres use fewer subdivisions, offsetting the added articulated shape.

Root position, facing, gameplay events and saves remain owned by the existing game/Scene. Feet plant in world space during grounded movement, including target-locked strafing and action travel. Foot heading is also retained during stance. Idle turns release and replant one foot at a time. Dodge releases old contacts. A 160 ms visual pose transition connects returns to idle/walk/run/recover without delaying saved attack phases. `dt=0` reconstructs action poses without transition history. Revival skips death-pose blending. The real Scene path that animates stationary NPCs without x/z now reads their group position for contact history.

Immutable skin geometry remains shared by actor instances. Each actor owns its bones/cape and one shared skeleton palette for all material batches. Pose snapshots are allocated at creation and reused; finger, hock and tail references are cached. This avoids multiplying the new finger-bone updates by material count. It is a structural CPU/GPU-work bound, not measured device performance.

## Reproducible geometry evidence

Run `node scripts/measure-actor-structure.mjs`. Counts are default-visible meshes before Scene distance culling, with sword selected. Mesh counts are not actual multipass GPU draw calls. Buffer bytes sum visible geometry attributes/index arrays for one actor; shared instances do not allocate these buffers again. All 18 variants remain below the existing 8,000-triangle and 14-visible-mesh ceilings.

| Recipe | Triangles, before → after | Visible meshes | Blended vertices | Bones | Geometry buffer B |
|---|---:|---:|---:|---:|---:|
| player | 6,540 → 7,268 | 13 | 568 | 44 | 354,656 |
| npc | 5,944 → 6,064 | 11 | 568 | 41 | 294,368 |
| sena | 6,112 → 6,232 | 11 | 568 | 41 | 301,928 |
| smith | 5,568 → 5,688 | 10 | 568 | 41 | 281,760 |
| healer | 6,296 → 6,484 | 10 | 568 | 41 | 321,760 |
| patient | 5,528 → 5,716 | 9 | 568 | 40 | 290,664 |
| porter | 5,708 → 5,896 | 9 | 568 | 41 | 299,864 |
| scout | 6,056 → 6,244 | 10 | 568 | 41 | 302,504 |
| traveler | 5,836 → 6,024 | 9 | 568 | 41 | 298,552 |
| courier | 5,656 → 5,844 | 9 | 568 | 41 | 295,072 |
| soldier | 6,172 → 6,900 | 12 | 568 | 41 | 341,928 |
| ranger | 6,336 → 6,524 | 11 | 568 | 44 | 328,208 |
| wolf | 6,808 → 4,028 | 6 | 370 | 25 | 202,080 |
| boss | 6,668 → 7,396 | 13 | 568 | 42 | 363,096 |
| soldier/ember | 6,572 → 7,300 | 12 | 568 | 42 | 367,512 |
| soldier/tide | 6,504 → 7,232 | 12 | 568 | 42 | 361,840 |
| soldier/gale | 6,512 → 7,240 | 13 | 568 | 42 | 362,448 |
| soldier/moss | 7,316 → 7,704 | 12 | 568 | 42 | 382,760 |

All baseline skinned vertices had one influence. Current human recipes each have 568 vertices with multiple nonzero influences, wolf 370; every index is in range and weights normalize to 1. The measured default player grows 6,540 → 7,268 triangles (+11.13%), while wolf falls 6,808 → 4,028 (−40.83%). Shape, joint continuity and palette reuse—not triangle inflation—are the changed mechanisms.

Geometry recipe: 22,165 → 29,327 UTF-8 B; gzip 7,828 → 10,482 B. Final SHA-256: `ac0fbfee1f3361e8be329df980dc60db8a8eec1d6b0dcf883c396cff79f9993e`. Human textures reference five shared 64×64 RGBA images (81,920 B, +16,384 B globally for the eye texture); wolf references three (49,152 B). No external model/texture/animation binary was introduced. The existing Kay Lousberg CC0 assets and their attribution were not modified. Exact source and animation hashes are in `src/assets/characters/detailed-provenance.json`.

## Regression and independent review

The focused actor suite passes 11/11. Five new tests exercise actual skeleton/skin data, normalized multi-influence joint coverage, one skeleton palette per actor, armor normals, strafe/diagonal/turning contact, full parry-exit sequences, action travel, dodge, revival and idle-turn replanting. Existing checks retain 14 recipes/four themes, geometry sharing and budgets, flat/sloping contact, teleports, deterministic saved actions, weapon visibility, finite/live/settled deaths and provenance. These tests do not initialize WebGL.

The independent Ultra reader first measured baseline target-locked strafe slip of 0.04714 m/frame at 2 m/s and an immediate 1.315 rad shoulder snap on parry exit. Review found and prompted fixes for a quaternion target-alias bug that initially delayed the snap, obsolete contacts during action movement, death/revival interpolation, and the UV normal seam. Full-sequence retest after those fixes found:

- player/wolf/boss strafe, diagonal and turning stance position error at most 3.55e-15 m; stance heading error at most 5.16e-8 rad;
- parry return progresses every frame, reaches idle by frame 10, largest shoulder step 0.218832 rad;
- moving attack/parry/drink pelvis minimum 0.9455 m; dodge minimum 0.6424 m with no stale planted feet;
- revival ankles at the intended .109 m human / .126 m wolf support heights, multiplied by instance scale;
- sampled 6/10/12/18-segment surface seams have identical paired normals.

Independent review is a numeric/source defect audit, not a blind artistic comparison. A transient idle-turn handoff can report both contact flags false for one frame while the completed foot has zero lift; contact flags are render diagnostics and drive no gameplay event. Final local full-suite/build results are recorded below. The integrator owns final package/artifact gates and normal GitHub/Sites publication.

## Sourcing decision and remaining visual limits

No genuine 3D-model or mocap retrieval/generation capability was exposed in the available tool registry. The existing CC0 low-poly GLBs do not supply a realistic replacement. The independent source survey found:

- [MakeHuman core-asset terms](https://static.makehumancommunity.org/makehuman/faq/are_makehuman_files_free.html) permit independent CC0 reuse, including closed games. The [official system asset pack](https://static.makehumancommunity.org/assets/assetpacks/makehuman_system_assets.html) is a promising anatomy/texture source, but the survey did not acquire or verify a ready rigged GLB; assembly, mapping, weights and retargeting remain work.
- [Mixamo's official FAQ](https://helpx.adobe.com/creative-cloud/faq/mixamo-faq.html) allows game use and requires Adobe ID. No authenticated acquisition route was established here.
- [MetaHuman licensing](https://www.metahuman.com/license) permits other engines, but its [download workflow](https://www.metahuman.com/download) requires Unreal tooling/Core Data setup; it is not an immediately available import in this session.
- [Ubisoft LAFAN1](https://github.com/ubisoft/ubisoft-laforge-animation-dataset) is CC BY-NC-ND 4.0 and was excluded as an adapted shipped-animation source. The CMU official endpoint timed out; it was not counted as acquired or verified.

No new account, payment, plugin installation, restricted download or access workaround was attempted. This checkpoint adopts reproducible authored shape/contact improvements and retains MakeHuman/Mixamo as unacquired candidates. It does not claim that the source alternatives were tested at equal visual quality.

The characters remain analytically authored meshes and motion, without scan-quality anatomy, skin/cloth texture atlases, facial performance, imported mocap, cloth-body collision or a full hand IK/foot IK animation production toolchain. Finger grips and hock angles are simplified. Formal browser/physical-device imagery, WebGL performance and external quality comparisons remain unavailable through the authorized route; no alternative server/browser route was used. PS4/ten-title parity and a deadline GO are unproven.

## Timing and authorship record

Actor source work was delegated to `/root/ultra_q_title_video/actors_ps4_ultra`; independent read-only research/review to its `actor_review_ultra` child. The child spawn explicitly supplied `reasoning_effort=ultra`, `fork_turns=none`, model omitted. These are accepted task parameters, not a measurement of hidden effective model settings.

Measured UTC milestones: baseline focused suite completed at 11:24:20; the geometry authoring script was written at 11:27:35.772; the motion implementation script at 11:30:42.326; final identified Scene-position/contact correction at 11:37:36.460. Thus baseline/instrumentation plus first geometry authoring was 195.772 s; geometry corrections plus first motion implementation 186.554 s; review-driven repair and regression authoring through the Scene fix 414.134 s. These wall-clock windows contain mixed coding/review activity and are not mutually pure asset/coding labor measurements. No external acquisition time was spent. The subsequent one-palette correction and final verification are included in the final checkpoint below. Provenance-hash failures during editing were expected stale-manifest failures; the final hash gate passes. Do not count source triangles, test counts or this elapsed time as rendered quality evidence.

Final local checkpoint at **2026-09-15 11:42:03 UTC**: focused actor tests **11/11** (1,258.586 ms), full `npm test` **212/212** (24,947.845 ms), `npm run build` **67 modules / 1.76 s**, recipe hash validation and `git diff --check` passed. Build retains the existing warning about the Three.js vendor chunk exceeding 500 kB. No release HTML, main entrypoint, title, CSS, Scene, package scripts, or Site manifest was changed by this actor unit. From baseline checkpoint to this final local checkpoint: 1,063 seconds; this includes authoring, review repair, tests and reporting, and excludes parent integration/publication. A first final-gate run (212/212, 23,936.514 ms) preceded the one-palette optimization; the second full gate above validates the final source. Palette optimization is included in the final source hash and has a structural regression assertion. Package and final artifact staging remain the integrator’s next authorized steps.
