# Mira v60 — head and hair construction plan, before reference lock

This is a read-only design and native CPU baseline, not a completed model. Source is the delivered runtime `2bee64cff6482cb7770ba69e07673eefc8ad54ef`, read at docs-only HEAD `fc311bac0134b58e04891264c405bfd61eba22e3` in `Q-ps4-v57`. AGENTS, PROJECT_STATE and SITE_DELIVERY_V24 were read. Site24's successful delivery does not imply game-render or PS4 acceptance; the old unavailable-preview state is not asserted as current. No repository, runtime, image, remote or viewer was edited. Previous v58 cloth remains untouched and unadopted.

## Reference selection and remaining contradictions

The complete six-view image and head sheet were viewed directly, followed by the upper and cape sheets for the neckline. They depict a long/angular face, defined cheek and jaw planes, a fairly straight prominent nose, closed thin lips, gray side-swept short hair, shorter sides/back, exposed ears and darker eyebrows. These are observations of generated design art, not a real person's identity or a calibrated scan.

Use **head FRONT, the profile whose nose points toward image-left, and BACK** as the primary shape references. Use the three-quarter and TOP images to challenge those choices, not as simultaneous mathematically exact cameras. The independent reference reviewer supports this ordering. The complete figure controls overall head/body proportion. Its smaller head image appears to have less lifted/thick front hair than the close-up sheet; differing scale and generated viewpoint prevent claiming exact agreement. Select one hair envelope and part direction before modeling. Do not average incompatible outlines until they become an unrelated face.

The reference LEFT/RIGHT captions are not anatomical coordinate data. Existing Q code identifies `hand-1` at +X as right and `hand-0` at −X as left; +Z is face-forward and +Y is up. Register image views explicitly against this convention. The under-chin inset can help detect an implausible chin/neck underside, but is perspective artwork rather than exact underside topology.

The head sheet includes a wrapped cowl and decorative clasps; the upper sheet has a separate short stand collar; the cape sheet has its own wrap and clasps. **The head owner supplies skin through the concealed neck cut only. The clothing owner supplies stand collar, cowl and brooches.** This avoids duplicate rings/closures and separate ownership of the same silhouette. The exact cowl-over-stand-collar layering and cloth openings await the assembly reference lock. The independent reviewer also found that both cape profile panels point the same way, so they cannot supply opposing-side evidence; the integrator is resolving that separately. No source work begins before the full reference set is fixed.

## Measured present implementation

`baseline.mjs` constructs the actual actor through native Three, without a renderer. Its outputs and hashes are in `baseline.json`.

| Present Mira component | Triangles | Render vertices | Geometry buffer bytes |
| --- | ---: | ---: | ---: |
| Whole visible actor | 6,718 | component-dependent | 319,180 |
| MakeHuman-derived NPC head | 1,646 | 1,062 | 69,348 |
| Gray hair plus eyebrows | 244 | 221 | 13,840 |

There are **13 visible mesh/material batches**. The present hair is a 180-triangle partial sphere; the two eyebrow cylinders add 64 triangles. It is not a strand/clump construction. The current head extends approximately X ±0.142, Y −0.138856 to +0.198, Z −0.112 to +0.143149 metres in head-local space; this includes ears and the tucked collar, so it is not directly a crown-to-chin anatomical measurement. These bounds are the old design, not untouchable limits for the new reference.

Current relevant source:

- `src/assets/characters/detailed-geometry.js:95` caches the NPC face separately; `:218` creates neck/head; `:221–226` creates eyes, lid bones and eyebrows; `:228` creates the hair sphere. `:267` establishes the hand-side naming convention. The later batching shares immutable geometry and per-actor skeletons; cape geometry alone is cloned for its dynamics.
- `scripts/characters/generate-identity-head.py` applies only the existing oval and nasal-width targets before source-aware LOD. `generate-face-identities.py` protects scalp, ears, inner eyes/mouth and neck, which prevents many changes demanded by the new design. These old landmark protections must not be treated as the new art specification.
- **Mira has no facial image map.** `src/skin-materials.js:5` registers only smith for the existing skin atlas. The actual NPC face material is untextured color `ab8770`. Retaining it cannot establish the generated face's skin details. The existing atlas is a different source and must not be represented as a matching portrait. No face image will be pasted onto a plane or directly projected onto the UVs.
- Neck is at chest+(0,.6,0), head at neck+(0,.16,0). Eyelid rest positions are (±.046,.058,.100); current eyes/pupils use (±.046,.050,.100/.109). Existing animation translates the lid bone down by .015 m during blink. These are interacting geometric constraints, not immutable artistic landmarks.

## Concrete construction sequence after lock

1. **Make a numeric head design sheet from the fixed views.** Record the selected frontal widths/heights, profile forehead–nasal bridge–tip–philtrum–chin outline, ear position, jaw angle and head/body proportion. Keep view-specific uncertainty and perspective differences. No automated image-to-mesh result or exact reconstructed likeness is implied. Fit crown/chin and cheek/jaw proportions first, then bridge/tip/nostril width and lip projection; assess all three primary views before detail.

2. **Deform the full licensed MakeHuman head, not the current sparse triangles.** Preserve source vertex IDs and original UV corners. Use bounded semantic deformation fields with smooth spatial falloff around jaw/chin, malar cheeks, nasal bridge/tip/ala and forehead/temples. Existing local targets can initialize a region but cannot supply the complete new face. Recompute positions and normals on the full source. Preserve the neck boundary until its shared opening is agreed; if it moves, explicitly change/tuck the rim and test the resulting join. Refit orbital rims together with iris and eyelid geometry if reference ratios require different eyes; do not move only the skin and leave the pupils floating.

3. **Compile one new NPC-specific head asset.** Re-run source-aware endpoint LOD on the authored full mesh. An initial allocation of 2,000 surface + 46 neck-cap triangles is a design target, not a measured need or a relaxation already granted. Keep welded topology, original UV seam correspondence, positive-area triangles, outward normals and finite attributes. Report reduction error against the new authored full mesh separately from artistic deviation from the references; passing the former does not pass the latter. Other families keep their exact base heads.

4. **Replace the sphere with shaped short hair.** Create a fitted, scalp-following solid base with a designed forehead/temple/nape boundary and a separate swept set of 18–24 closed, tapering clumps: a small forelock, sideward front/top flow, tight side pieces above and behind ears, and short back/nape ends. Each clump has an authored curved path, varying elliptical/flattened cross-section and a tapered tip; its width and overlap make a real contour change in front/profile/back. It must not be a noisy copy of the old sphere. Use no transparent portrait/hair billboard. Initial combined cap/clump allocation is 600–700 triangles, refined where the silhouette bends. This describes coarse hair masses, not individually modeled fibres.

5. **Use one dedicated NPC hair material/batch.** The old hair material uses the cloth micro-weave, which is inappropriate as a definition of hair. A Mira-only material can use the existing standard PBR pipeline with restrained roughness and per-vertex variations along the clumps. Darker eyebrows can share that batch through vertex colors; all merged geometries must carry the same attributes. Avoid altering shared generic cloth materials, adding a material per strand, or claiming a physically measured anisotropic hair shader. Iris tone can be selected from the fixed art without adding a source image; geometric placement, lid clearance and surface appearance still need actual rendered review.

6. **Assemble at the existing bones.** Keep head/neck/eyelid bone names and the one-palette skeleton. The clothing owner agrees to keep the current neck/head pivots and fit its opening to the chosen neck surface; the old .162×.146 m cloth opening is only a starting shape. The head module must stop below the hidden neck overlap and avoid creating a duplicate collar/cowl/brooch. Check head turns and pitch against the real assembled collar, not a standalone head picture.

## Camera and blink contract

`src/dialogue-camera.js:62` assumes hard-coded eye points at (±.046,.05,.109). It obtains face vertices from the `Q anatomical face` mesh and accepts the camera only if first hits are `Q eye`. If the fitted eyes move, supply NPC-specific head-local eye landmarks from the same assembly recipe and make the camera use them, keeping old-role defaults. Verify actual central iris/eyelid triangles rather than treating an arbitrary point or bounding sphere as a visible eye. Camera cache invalidation and actor clone isolation must remain correct.

The current composition fit includes only face vertices plus a torso envelope. New lifted forelocks can extend past the face bounds, so the fitting envelope must include the true new hair silhouette too. A head-local bound generated from the finished head/hair, or actual head-weighted hair vertices, can extend the check without recomputing the entire actor every paused frame. This change is required only if the new hair exceeds the old face envelope; measure before choosing an implementation. Do not reposition the NPC or alter its save/orbit state to hide clipping.

If eyelid anchors or scale change, preserve the existing timing while deriving closure from the new fitted lids. Check open→partial→closed monotonic iris coverage, both central eye rays, oblique views, head pitch/yaw, death closed eyes and independent clone blinking. A constant .015 m lid translation is acceptable only if actual geometry proves closure after the redesign. There is no requirement to preserve incorrect old landmarks.

## Editing ownership and proposed files

The minimal isolated head implementation should own a new generator/design specification, new NPC head data/provenance and a dedicated head/hair assembly module. It should leave the shared generic base head and original source OBJ unchanged. Integration into `detailed-geometry.js` should be a small NPC branch, coordinated with the clothing owner's edits to that file; do not have two simultaneous writers. Eye/hair metadata may require a small `dialogue-camera.js` integration change. Changing blink amplitude requires an explicitly coordinated NPC-only edit to `actor-models.js`; it must not silently affect other roles.

Suggested new paths are `scripts/characters/generate-mira-head-v60.py`, `src/assets/characters/mira-head-v60-design.json`, `mira-head-v60-data.js`, `mira-head-v60-provenance.json` and `mira-head-v60.js`. Names are proposals, not existing outputs. Existing generators execute top-level output writes, so do not run `generate-identity-head.py` as a read-only helper or let its `runpy` chain overwrite unrelated frozen evidence; the new generator needs an explicit output directory and pure source-preparation stages.

Tests and provenance updates must distinguish intended new NPC shape from regressions. The old protected-point assertions and exact 1,646-triangle expectation cannot remain the new-design oracle, but may be retained against the old asset. Keep all other roles' geometry/material signatures, bone/pose isolation, texture ownership and source-license hashes unchanged. Recipe/hash updates and whole-actor limits belong to integration after the actual candidate is measured.

## Budget coordination and acceptance sequence

The first head allocation changes 1,646→2,046 triangles (+400); hair 180→600–700 (+420–520), with existing eyebrows otherwise retained: **about +820–920 triangles**. This is an authoring estimate. The clothing owner independently estimates +1,800–3,000 for the cowl, cape, split lower garment and waist, implying a combined Mira around **9,338–10,638 triangles**. The old 8,000 ceiling cannot be claimed satisfied. Neither owner changes it unilaterally; produce and compare the necessary shape, then give the integrator measured component costs and visible differences for an explicit allocation decision. Keep 13 batches and 41 bones as initial assembly goals; any real exception must be measured. No first-load/GPU effect follows from triangle arithmetic alone.

Measure actual typed-array bytes, shared vs cloned geometry, head construction cost, whole-actor batches and deferred build delta. A new immutable head/clump mesh should be shared between Mira clones, with per-actor bones and existing cloth dynamics still independent. Keep the three-chunk/deferred-scene architecture; no initial 166,000 B regression guard change is proposed here. Head textures have no approved additional payload in this scope.

After reference lock: (a) shape candidate in three primary directions, (b) full assembly native contact/blink/clone/camera checks, (c) the authorized viewer owner's actual WebGL views under fixed conditions, and (d) same three dialogue viewports and gameplay lifecycle checks. Use the generated art as a design target and label it as such. Compare actual 3D views to it without calling a reference sheet a game render. Screens, naturalness, iPhone SE3 GPU time, overall PS4 quality and September20 completion are still unverified. If the first shape fails identity or contour, return the concrete mismatch rather than certifying the method because geometry or tests exist.

Current status: **baseline and construction plan only; no 3D candidate and no source edit**. Reference fixation, a dedicated worktree and the integrator's final file ownership assignment are the next execution boundary.
