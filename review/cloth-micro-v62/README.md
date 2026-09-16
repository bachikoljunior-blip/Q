# Mira clothing: three isolated surface prototypes, v62

Three real indexed meshes and OBJ files are complete **as unassembled authoring prototypes**. They are not imported by the game, do not replace the current clothing, and have not passed reference matching, garment fit, natural animation, device performance or PS4 visual acceptance. Site 24 and runtime source remain unchanged. P01's provisional chest-only weight is **not suitable for runtime death animation**: the trial penetrates the flat floor.

## Reference and authored dimensions

The source is the actual reviewed `mira-cloth-three-micro-parts-v2.png`, SHA256 `8af4e2f24dbd3113d126c6eeac6e6d351fa210b12819fe283a8d86164bf7d5bc`, under `docs/evidence/mira-micro-v61/references/cloth/`. It was viewed directly, together with the independent `review/cloth-three-v1` decision. Source hashes are in the new `metrics.json`. The source's swirl motif, thick cut rims and decorative seam borders were expressly excluded. No image was edited or generated in this unit.

Each part is a single bicubic surface with 16 explicit control points, exported in `meshes.json`. Image profiles are not calibrated CAD views: these control depths and measurements are an authored first registration, not recovered image measurements. This is not blind comparison. Independent review has not yet accepted these new meshes.

| Part | Authored operation | Sampled bounds width × height × depth | Vertices / triangles | Open area |
|---|---|---:|---:|---:|
| T01-R | Shallow chest-to-waist panel | 134.986 × 500 × 35.875 mm | 117 / 192 | 0.062656 m² |
| S05-R | Tapered open forearm half-shell | 122 × 190 × 63 mm | 117 / 192 | 0.032575 m² |
| P01-R | Downward widening strip with one rounded fold | 220 × 1100 × 83 mm | 153 / 256 | 0.222446 m² |

Depth in this table is total bounding-box depth, including longitudinal placement, **not** material thickness or fold amplitude. P01 has a 45 mm maximum authored transverse fold at its bottom. All three surfaces have zero assigned thickness, no caps and one open boundary loop. Enclosed volume is undefined. 640 triangles total is a prototype cost, not evidence of quality or the eventual assembled character budget.

## Registration, boundaries and weights

Coordinates are metres in the existing NPC chest bind frame, translated by `(0, .985, 0)` into root coordinates for OBJ output. Front is +Z, up +Y; anatomical Right is −X, Left +X. All three are R parts. Current native bone `arm-0` is at negative X; the suffix is an implementation index, not an anatomical name. `metrics.json` contains actual native bind joint positions, including the floating-point chest Y value `.9850000000000001`.

Each mesh has four named cubic boundaries, exported control points, actual indexed boundary vertex lists, and future neighbour labels. Internal cells and corners share vertices. **No edge is welded to a different part**, because its required neighbour has not been made in this unit. Tangent continuity, shared-edge sampling, metre-chart origin, UV continuity and identical boundary weights remain to be fixed with those neighbours. No gold line in the diagrams represents a raised seam.

| Part | Bottom / top neighbours | Outside / inside neighbours | Weight proposal |
|---|---|---|---|
| T01-R | WAIST/belt underlap / T04-R or C01-R | T03-R or T05-R / real front placket | pelvis → spine → chest, longitudinal smooth blend |
| S05-R | CUFF-R underlap / S03-R or S04-R | S06-R outer / S06-R inner | elbow-0 dominant, arm-0 up to 0.2 near upper edge |
| P01-R | HEM continuation unresolved / P04-R | P02-R / P01-L rear centre | chest=1 solely for registration; free-cloth update absent |

These neighbour names identify intended interfaces; alternatives such as T04/C01 are not a completed connectivity graph. T01's neckline/waist overlap, S05's exact cuff and upper arm seam, P01's real hem continuation and suspension remain unassembled. The current meshes have no texture. `vt` in OBJ is an approximate arc-length chart in metres; it is not an atlas or an exact isometry. Chart anisotropy p95/max is T01 1.103/1.107, S05 1.330/1.378, P01 1.126/1.134. P01's consistently negative signed UV area follows its reversed outward face winding; this is not a random UV fold or an instruction to invert neighbouring texture islands.

## Checks actually run

`export-mira-cloth-micro-v62.mjs` built all three meshes and exported their points, triangles, normals, parameters, metre UVs, weights and edges. There are no non-finite points, degenerate triangles, non-manifold edges, or reversed triangle/analytical-normal agreements in these generated samples. Boundary edge counts are 40 / 40 / 48, each Euler characteristic 1. OBJ readback checks preserve points and face counts. Fresh builds own separate mutable arrays.

Four samples per triangle compare each linear triangle with its own analytical surface at the same parameter: maximum deviations are 0.742 / 0.857 / 0.826 mm. This is neither global Hausdorff distance nor error from the reference image. Native existing bone names and inverse-bind reconstruction were exercised; maximum bind reconstruction error is 5.56e−17 m. The 2 mm test is an authoring tessellation sanity limit, not a changed game quality gate.

The initial 6-test run had one oracle failure: exact equality of `.985` and `.9850000000000001`. This was corrected to a 1e−14 metre numerical comparison; no mesh was changed. Final source inspection also found that exported boundary control arrays still referenced the source net; they were cloned and the clone test extended. That ownership correction changes no coordinates. After adding the native pose trial, **7 focused tests passed**; final timing is retained in `test-run.txt` and `validation.json`. The full project suite and build were not rerun: no runtime source, package manifest, lockfile, or runtime import was changed. Integration gates remain owned by the parent.

## Existing animation trial and actual rejection

`pose-probe.mjs` calls the existing, unmodified `createDetailedActor('npc')` and its actual `animate` method for idle 2 s, walk 2 m/s for 1 s, right turn to −0.59 rad, sealed, explicit death .45 s, and explicit death 1 s. It applies the proposals using each native posed bone matrix × inverse bind matrix. Turn's actual motion state remains idle; it is a root-yaw trial, not a new turn animation. States and frame counts are recorded in `pose-probe.json`.

Across 18 part/pose samples, positions and normals are finite; degenerate triangles and disagreement with weighted normal direction are zero. Edge-length ratio range is 0.903993–1.079912; this rules out numerical explosion in these samples, not unsuitable cloth deformation. T01/S05 lowest sampled flat-floor Y remain +487.824/+236.652 mm over this set. **P01 reaches −51.783 mm at death .45 s and −9.444 mm at death 1 s**, because the whole free strip follows the chest rigidly. Its motion is rejected. This unit adds no cloth solver and does not change the native cape. Torso/arm/body intersections, neighbouring seam opening, all animation times, slopes, naturalness and runtime draw/heap/GPU costs were not evaluated.

The CPU plots were generated directly from the actual mesh arrays and viewed. `cpu-four-views.png` uses consistent orthographic front +Z, profile −X, back −Z and three-quarter −X/+Z views, equal metric scale within each part. `cpu-bind-registration.png` shows authored placement against a few actual rig joints. Both show open sheets from either side as a drafting convention. They are not WebGL renders, screenshots, physically shaded cloth, or evidence that the complete figure matches the image.

## Reproduction and handoff

From the worktree root after its authorized dependency setup:

```sh
node scripts/export-mira-cloth-micro-v62.mjs
node review/cloth-micro-v62/pose-probe.mjs
python review/cloth-micro-v62/plot.py
node --test tests/mira-cloth-micro-v62.test.mjs
```

The three `docs/evidence/mira-cloth-micro-v62/{T01-R,S05-R,P01-R}.obj` files use root-frame metres; `meshes.json` retains chest-frame controls and boundary IDs. `HASHES.json` inventories this finite checkpoint. Source hashes, timing, numerical trial, first oracle correction and unchanged runtime verification are retained separately. No additional parts, image generation, remote writes, Sites operations, new renderer, or default imports were added.
