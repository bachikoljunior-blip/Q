# Mira v60 — current 3D constraints for the complete reference pack

Read-only planning, before any new generated reference is supplied. Deployed runtime is `2bee64cff6482cb7770ba69e07673eefc8ad54ef`; inspected checkout HEAD is docs-only `fc311bac0134b58e04891264c405bfd61eba22e3`. Nine actual source files were compared byte-for-byte with the deployed commit. The existing five untracked evidence files in that checkout were not changed. No v59 source, test or candidate was touched. AGENTS, current PROJECT_STATE and SITE_DELIVERY_V24 were read. Site24 success is a recorded deployment fact, not an actor quality or device acceptance.

The latest method is **complete character plus all required part views first → resolve contradictions and fix dimensions/connections → build actual 3D and assemble → compare corresponding views and motion**. Extra image generation should fill a demonstrated missing view only. This audit does not authorize starting the sculpt from an incomplete front view. No image generation, asset upload, browser, runtime edit, installation or dependency symlink was performed.

## Existing identity and production use

Mira is the keeper `npc` at (7,80), one actual Scene actor with initial yaw1.4 and scale1. The distinct `sena` family and residents are outside this unit. Mira uses gray olive cloth `#696454`, dark brown leather `#494334`, gray pale hair `#A7A397`, skin tint `#AB8770`, brass trim `#B59B69` and wood tint `#514333`. Mira has an uncovered head, no armor and no hood; a rear cape, long lower garment, waist belt, front bands/buttons and a lamp-topped staff held by `hand-1` (model +X side). Image left/right must be explicitly reconciled with this model-side label. Role/name is not evidence of sex or age. Preserve the existing facial landmarks and identity; do not select an unrelated generated face or add beard/makeup as an inference.

Actual Scene supplies `{moving:false}` every update. Conversation changes the camera and freezes time (`dt=0`); there is no existing Mira-specific speaking/emote animation. The right arm rests at shoulder X −.15 rad and elbow X −.35 rad before other passive adjustments, maintaining the staff attachment. Walk/run/parry/attack/death are shared actor API deformation stress conditions, not claims that Mira currently performs those actions in gameplay.

## Current dimensional anchors

Metres, unit scale. Bind coordinates below are actor local world coordinates with the model root at zero, +Y up and face toward +Z. The node named `chest` is a rig origin near the pelvis, not the anatomical sternum. The idle pelvis is .962m, versus .985m in bind; do not mix those two poses when registering images.

| Anchor / part | Current value | What to fix across all images |
|---|---|---|
| Bind head origin / visible hair top | y1.745 / y1.951 | Existing person scale and head placement |
| Existing face geometry bounds | W .284 × H .337 × D .255 | Facial outline/eye/ear/nose identity, not a new face |
| Eyes / eyelid bones in head coordinates | eyes x±.046,y.050,z.100; lids x±.046,y.058,z.100 | Eye centers, opening and blink geometry |
| Neck / head local offsets | chest→neck .600; neck→head .160 | Collar opening and neck continuity |
| Shoulder joints | x±.313,y1.445 | .626 shoulder-joint span; sleeve attachment |
| Upper arm / forearm joints | .330 / .310 | Preserve elbow/wrist reach and staff grip |
| Hip span / thigh / shin | .266 / .445 / .435 | Existing legs, ankle support and root height |
| Upper torso surface | W .5254 × H .7200 × D .3259 | Front/back contour, shoulder roll, waist shape |
| Torso neck opening before fold | W .162 × D .146, chest-local y.570 | Collar and neck attachment |
| Each sleeve surface | .708 long, max W .2162 × D .2111 | Actual armhole, elbow folds and cuff orientation |
| Sleeve cuff opening before fold | W .078 × D .076 at shoulder-local y−.643 | Wrist/hand clearance, not free-floating cuff |
| Cape | .530 upper width → .930 hem width,1.150 length | Top9 attachment row, shoulder overlap and hem |
| Keeper lower skirt/coat panels | y.225→.825 in bind, hem W .620 × D .420 | Belt overlap, side seams, boots and walk clearance |
| Staff shaft | length1.490, diameter .052 | Existing hand-1 grip; lamp silhouette at its top |

Upper torso: 171 vertices /288 triangles, 9 rows×18 radial segments. Each sleeve:156/264,12rows×12segments. They are separate intersecting surfaces, not a sewn welded armhole. Existing folded radial rings provide local sinusoidal variation, not observed garment pattern construction. The front leather bands, metal closures and cross-chest trim are separate rigid pieces bound to chest; shape changes under these pieces must move/rebuild the fitting pieces coherently, otherwise the v54 crossing problem recurs.

The long lower garment is currently three circular-section rings bound to chest, with trousers under it. It has no leg-driven skirt deformation. This is a known design limitation when proposing a walk-ready garment; a generated draped hem alone cannot supply its missing motion contract. The cape is a dynamic117vertex/192triangle grid; its existing animator assumes the rest grid and top attachment row. Do not replace the cape topology casually while claiming unchanged animation.

## Minimum complete reference set before 3D construction

1. Same complete Mira: orthographic front, rear, model−X, model+X, front/rear three-quarter views, same height/pose/identity and consistent staff side. Include full feet, hair and staff top; consistent neutral lighting. Add arm-clear A-pose views to expose the axilla while retaining the actual idle staff-holding views as assembly references.
2. Upper tunic and both sleeves: front/rear/side/oblique views of the same garment; armhole, shoulder seam, collar, belt overlap, cuff and opening edges exposed. Show arm down and elbow90°/arm raised90° to determine fold placement and clearance. Explicitly distinguish seam structure, cloth folds, trim and cast shadow. Do not invent folds from baked highlight alone.
3. Cape/shoulder attachment: front of attachment, rear, both sides, and a part view exposing the top edge/inside overlap. Fix thickness, opening and hem dimensions. Current9top vertices and animator-compatible grid are the starting contract, not an automatic requirement for all future topology.
4. Lower garment with belt and boots: all four directions plus an unobstructed part view. Resolve overlap with upper tunic/trousers, side openings and where feet can move before deciding whether the shared skin needs leg influences.
5. Hands, cuffs and staff/lamp: palm/back/side and bent grip views, aligned to hand-1/model+X. Preserve finger segments and staff attachment. The actual existing head/hair should be included in the full pack, with head front/profile/rear/three-quarter views sufficient to keep it consistent, without silently adopting a different face.

A single generated sheet can contain these views, but agreement is a separate check: silhouette landmarks, seam positions, part thickness and occluded joins must agree across sheets before geometry is accepted. Generated reference imagery is authored design guidance, not measured anatomy, multi-view photogrammetry, a texture atlas or a completed mesh. Exact camera/projection and scale registration come from the existing 3D anchors, not text labels in a generated image.

## Recommended first actual 3D unit after the pack is fixed

Reconstruct Mira's **visible upper-garment assembly**: front and side chest contour, shoulder caps/armhole connection, sleeves/elbow volume, collar and matching front bands/buttons/trim. Treat those fitting pieces as one assembly against the preserved rig. This addresses the area visible in ordinary conversation and avoids restricting all changes to the hidden back, which made v54 ineffective. The existing head, hands, staff grip and joint positions remain fixed anchors; additional triangles are justified only where a reference contour or fold has measurable corresponding-view effect. No primitive decoration count or reference image pasted on the model counts as completion.

Proposed editable files in that later unit: the npc-only garment construction branch in `src/assets/characters/detailed-geometry.js`, a dedicated data/helper file under `src/assets/characters/` for authored garment surfaces, its generator/provenance/reference manifests, and focused geometry/deformation/visible-projection tests. Keep other13families and the shared head data/skin/character-motion/actor-models/Game/Scene/camera unchanged. If the accepted pack requires a different cape attachment or lower-garment leg skinning, make that an explicit subsequent scope rather than changing animation silently. Existing `cloth-material.js` maps physical UVs using ring topology; a changed mesh needs either compatible ring charts or a dedicated physical chart, not blind reuse of that function on arbitrary vertex ordering.

Once assembled, compare the same rig/pose/root and actual three dialogue viewports1280×720,844×390,390×844, plus the fixed front/rear/sides/obliques from the reference pack. Changed front/sleeve silhouette must be visible after actor/gear/cape occlusion tests; old v54's 105changedvertices and max17mm did not meet this requirement. Verify neck/cuff/shoulder joins, normals, UV seam/density, all bones/weights, proper triangle crossings including target-target pairs, staff/hand attachment, idle/blink and shared API walk/run/parry/attack stress. Existing sampled overlap should be measured rather than claimed zero. New actual WebGL comparison belongs to the parent's authorized preview path; this audit is CPU geometry only.

## Budget and evidence boundary

Fresh initialized native Mira is **6718tri /13visible meshes /41bones**, all skins share one per-instance palette and immutable geometry. Nominal attribute+index arrays total319180B for that actor; this is not measured GPU or total RAM. Mira therefore has arithmetic room for at most1281 additional triangles under the existing strict8000 limit and one draw under14; this is a ceiling, not a target or quality evidence. Prefer reassignment/reconstruction of existing parts and material batches. The existing upper assembly is816tri; face1646tri, cape192tri, hair/brows244tri. Ordinary family defaults plus four used soldier themes have max7998tri and14draws. The audit uses initialized actor visibility: raw uninitialized player geometry temporarily shows all alternative weapons and is not the shipped visible budget.

The new physical upper-cloth material is preserved: same olive tint,512² shared procedural height/roughness,256mm nominal tile and2mm yarn spacing before local chart stretch. Its raw upper charts span U4/V3.138 for torso andU2/V2.958 per sleeve. It supplies no basecolor photograph or normal map; hair still uses a separate cloth-kind material and staff a leather-kind material. Those material semantics are recorded, not silently rewritten. No new texture or runtime memory is proposed before the reference pack and mesh scope are fixed.

Recorded deployed build remains165611initial JS /3chunks (guard<166000),34public files14039068B,27media12883257B. This read-only audit did not build or measure load time. iPhone SE3 throughput, GPU memory, heat, frame time and perceived PS4 quality remain unmeasured. The optional standalone16MiB historical limit is not reinstated as a quality constraint. Parent owns remote and Site delivery; the unchanged9/20 deadline and whole-screen target are retained.

The native measurement completed in0.552s. A first counting draft used pre-animation visibility; it was corrected to initialized actor visibility before reporting the budget. No source mutation or new test suite was run. `audit.json` retains native dimensions, material roles, bone transforms, hashes, selected API pose records and all budget counts. All sessions are finished. Further shape implementation awaits the parent's complete consistent reference pack, not human preparation.
