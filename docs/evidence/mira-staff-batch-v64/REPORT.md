# Staff batching v64 — unchanged source geometry, finite draw representation

Base `645ed4b1a31bdc6f07ff66a90e0058f7392394bb` contains the full 19-instance / 18-part-type staff. This unit preserves that precise construction and exports a static four-mesh representation. No new shape, image, material appearance, game import, threshold change, hosting action or runtime integration is added. Source-only measurements do not complete the character or its reference-image ledger. Subsequent new 3D construction is outside this unit.

| Native count | Original | Batch |
|---|---:|---:|
| Meshes | 19 | 4 |
| Material objects | 5 | 4 |
| Unique geometry objects | 17 | 4 |
| Triangles | 7,512 | 7,512 |
| Unique typed geometry/index bytes | 290,792 | 323,320 |
| Per-mesh attribute/index byte sum | 323,320 | 323,320 |

The 32,528 B increase comes from baking two originally shared pairs of ribs into the bronze geometry. Source and result coexisting occupy 614,112 B of typed geometry buffers. Transform clones cumulatively allocate another 323,320 B during construction, one bucket at a time; the largest bucket is 234,976 B. These are logical buffer counts, **not peak process RSS, GC timing, GPU allocations or total object/material memory**.

## Explicit material buckets

| Bucket | Part instances | Triangles | Buffer bytes |
|---|---|---:|---:|
| Wood | S01 | 96 | 4,128 |
| Leather | S04, S05-A, S05-B | 1,416 | 55,920 |
| Bronze | S02, S03, S06, S15, S17, S18, S09–S14, S07, S08 | 5,200 | 234,976 |
| Glass | S16 | 800 | 28,296 |

The two original bronze material objects share color, metalness .7, roughness .46 and every checked render setting. Names/UUIDs are different identities, preserved per source part in the manifest; they do not define different shaders. The grouping is author specified for these 19 parts. It is not a claim that arbitrary materials with similar JSON can be combined. The equality check includes full Three 0.186.0 material render serialization, exact floating color/vector values, defines, mesh flags and attribute layouts. Exact colors are checked separately because hexadecimal serialization would hide tiny differences.

All current materials use FrontSide, opacity 1, normal blending, depth test/write, no clipping planes, no custom compilation/cache hooks and no asset texture maps. Those original render values, including stencil, blending, side, shadow side, alpha and depth settings, remain in the exported material records. Custom shader hooks, clipping and added texture ownership are explicitly rejected. All four batch meshes retain current visibility, shadow flags, renderOrder, layers and frustumCulled values. The glass alone keeps vertex colors, physical transmission .22, thickness .04, IOR 1.45, roughness .3 and emissive intent. It is not made opaque or merged with metal.

Nineteen native single-material objects become four, with 18 opaque → 3 opaque and one transmissive → one transmissive. There are no geometry groups creating hidden material subdraws. Actual WebGL draw counts are **unmeasured**: shadows/transmission can add passes and culling is coarser for merged buckets. Opaque material/object sorting can change, and dynamic individual part visibility/animation is not supplied. The source constructors remain available for editing/rebuilding. This is not a GPU-speed claim or a whole-character 8,000-triangle budget pass; the staff alone still costs 7,512 triangles.

## Geometry and ownership evidence

All 22,536 indexed corners are compared with an independent direct source world-transform calculation. Triangle order/winding and part index/vertex ranges remain intact. UVs, vertex colors, attribute types/normalization, source matrices and render settings have zero mismatches. The maximum world-position difference is 0.000059101731 mm from Float32 world-coordinate baking; maximum normal-vector difference is 3.5342704e−8. Therefore the report does not assert infinite-precision world-position byte identity. A translated/rotated parent and nonuniform scale also pass the same oracle, including the existing upside-down lower ring.

The batch owns four cloned materials and four new geometries. It never disposes borrowed source resources. A lifecycle test observes 19 temporary transformed geometries disposed once, the four batch geometries/materials disposed once despite two calls, and the original 17 geometries / five materials disposed once by their original owner. The convenience constructor releases its temporary original assembly after batch construction. No new texture owner exists.

Negative checks detect modified indices, UVs, glass colors and a bronze color change of only 1e−8. Changed side/defines, custom shader hooks, clipping and texture additions are rejected. Existing source geometry/joint checks continue unchanged. Related **20/20 tests passed**, 1,282.948714 ms for the recorded run; this is regression evidence, not material or visual acceptance.

## Reproduce and limits

Run `node scripts/export-mira-staff-batch-v64.mjs` to regenerate `report.json`, `part-ranges.json` and `batch-geometry.json`. The latter contains four real indexed attribute sets with materials and source part intervals; no picture is attached to the geometry. UUIDs and timestamps are session identities, so regeneration is semantically reproducible rather than byte-identical to the committed export. `node --test tests/mira-staff-batch-v64.test.mjs tests/mira-staff-v63.test.mjs tests/mira-lantern-v63.test.mjs tests/mira-lantern-micro-v62.test.mjs tests/mira-micro-parts.test.mjs` is the recorded focused command.

`TIMING.json` distinguishes source reading/design, implementation, first validation, export rework and final verification/documentation windows. The first export used 20.330658 ms to construct the batch in one Node run; `report.json` records a second export after correcting only a reporting field that had overwritten the source-count object. These are not frame times or end-to-end creation speed. No image generation, geometry redesign or repeated performance benchmark was done.

All existing `src`, package, lock, previous review geometry and production receipts remain unchanged. Initial JS size is not remeasured here; there is no new production import. Formal WebGL remains disabled, with no settings/driver/server bypass. Real material appearance, transparent sorting in the full scene, device performance, character/hand integration and the all-screen PS4 target remain unverified. This finite improvement supports preserving a draw representation for later integration, not adopting it into the game now.
