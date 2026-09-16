# Independent review: Mira lower-face micro assembly v63

**Conclusion:** No required source defect was found in this bounded assembly contract. The seven placements form one consistently indexed open surface with six shared C1 joins. Preserve it as an authoring candidate; it is **not a complete face or a runtime-adopted character**.

Fixed author HEAD `5afdfb177cbdbb00232ba400592acdb731889db1`; source `review/head-micro-v63/surfaces.mjs` SHA256 `b93311bafce2b211a944604ce02f7cc0878bb0e14d5eae3066ca420b490b3d0b`. The repository was clean before and after inspection. The source was snapshotted and imported from the review directory. Every entry in the author's 28-file evidence manifest was byte/hash checked; rebuilt mesh arrays exactly equal the archived `assembly.json`. Existing actor/core/head-data/detailed-geometry source remains exact to base `22d1d041dd6aef60de7764b1eebf6cf78028c857`.

## Independent geometry and registration

The independent oracle uses recursive De Casteljau curve evaluation instead of the author's Bernstein evaluator and independently builds edge incidence, winding, boundary, area, UV and weight checks. It does not import the author's inspection helper. One native batch checked the seven placements and four specified actor states; no large pose sweep or renderer ran.

| Check | Independent result |
|---|---|
| Placements | F05-R → F07-R → F09-R → F11 → F09-L → F07-L → F05-L |
| Native arrays | 513 vertices / 896 triangles / 1,408 unique edges |
| Open topology | One degree-2 boundary loop of 128 edges, Euler characteristic 1 |
| Invalid geometry | Duplicate triangles 0; non-manifold edges 0; winding conflicts 0; all position/normal/UV values finite |
| Triangle area | Minimum 4.752340619e−6 m² |
| Face/vertex normals | Minimum dot .967546738; normal unit error ≤4.441e−16 |
| Independent source evaluation | Position error ≤6.207e−17 m; stored normal error ≤2.542e−15 |
| Six joins | Position difference 0; UV difference 0; shared edges used by exactly the two intended neighboring parts |
| C1 contract | Along-width tangent difference 0; cross-join tangent difference ≤1.333e−16; normal-vector difference ≤2.153e−15 |
| UV | Positive signed triangle area ≥.0011160714; coordinates inside [0,1]² |
| Weights | Exactly `{head:1}` at all 513 vertices |

The existing three targeted tests were executed independently and passed. They retain position, winding and UV negative cases. Two additional in-memory changes in the independent oracle—a 1 mm shared-row displacement and one `.75 head/.25 neck` weight—were correctly detected. No source or fixture was edited.

Actual existing actor calls exercised **idle, walk, hit and death at .45 seconds**. All four resulting head matrices exactly match the archived corrected fixtures. The old mistaken idle-only fixtures remain marked as historical evidence and were not counted as passing these states.

For a native registration check, the candidate coordinates were transformed into the existing bind frame, given a head-only Skeleton, and read through Three's actual `SkinnedMesh.getVertexPosition`. Across 513 vertices × 4 states, the maximum difference from the direct head-local transform was 5.923e−8 m, consistent with the Float32 test input. Independently evaluated seam pairs remained at zero position difference after each actual head transform; maximum transformed normal difference was 2.203e−15. This in-memory test binding is not production integration, GPU skinning, animation continuity or expression validation.

The established rig is unchanged: head local offset `(0,.16,0)`, bind head world `(0,1.745,0)`. Micro-reference anatomical R=−X/L=+X agrees with the current v61 canonical documentation. Historical variable names such as `hand-1/right` are not used to infer anatomical side.

Four native double-sided forward rays to existing left/right eye centers, mouth center and nose point encounter no candidate surface before their target. This is four finite point probes, not visibility of all eyes or mouth surfaces across all views.

## Reference interpretation and unfinished interfaces

The original generated `mira-F07-F11-v2.png` and source-generated `cpu-four-views.png` were personally inspected without editing. The former is fictional design reference; the latter is a geometric orthographic line drawing, not gameplay or material rendering.

The reference supports the **location/order** F05 → F07 → F09 → F11 and the broad chin concept. It still does not establish the isolated F07 hollow depth or exact corresponding cameras. The generated F07 FRONT/THREE-QUARTER images are similar, and its displayed shell edges do not specify a calibrated skin surface. The prototype's dimensions, symmetry and concavity are therefore explicit authored choices, as documented, not recovered measurements or proven image identity. The topological/normal results do not change that limited adoption boundary.

The mesh remains an open lower-face band. Its inner facial cut, upper cheek cuts and outer jaw/neck continuation have no shared vertices with the missing nose, eye region, lips/mouth, neck or remaining head. No thickness/cap is required merely to make this skin patch closed; closing these cuts now would misstate the intended assembly. There is no new hair, texture, source-atlas UV correspondence, jaw motion, expression system, or full-head self/contact check. The new UV chart is continuous but has no established texel density or distortion acceptance. It must not be laid over the old head and called finished skin.

## Cost, execution and limits

Hypothetical typed payload: 32,832 B for Float32 position/normal/UV/4 skin indices/4 weights, plus 5,376 B Uint16 triangle indices = **38,208 B**. This estimate assumes that specific attribute format; current authoring JSON is CPU data. Actual GPU allocation, materials, draw count and whole-actor cost were not measured. No source module in `src` imports this authoring assembly; current runtime additions remain zero.

The single successful native/independent-metric batch took **188.201 ms** on this host. Total read/interpretation/oracle/test/report elapsed time is separately preserved in `CLOSE_READBACK.json`; neither number is a whole-part production-time or device-performance claim. All commands ended, with no source/image/Git/remote/browser changes and no new agent.

No additional required repair is identified for preserving this partial candidate. Completing the face and checking actual materials, rendering, perception and mobile performance remain separate work. Whole-screen PS4 quality and the September 20 completion goal remain unproven by these results.
