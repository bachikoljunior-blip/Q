# Independent v29 landmark-grounding review

No required runtime fix was found in the reviewed candidate. Audited 2026-09-16T03:27:48.216Z against exact base `fff7adc5e2114fe7603a86b78a8d6b6b4626e96e`. Source hashes remained unchanged during the run. The author corrected a forecast regression-test coverage gap identified during review; runtime source did not require another change.

The independent oracle executes real `SceneView.createStructures`, native Three geometry and indexed terrain, plus real Game projectile contact, cameraFraction and projectile forecasting. It does not construct SceneView, a renderer or DOM. Media imports are inert strings; no textures are decoded. These results establish geometry and rule integration, not visible pixels, GPU performance or PS4 quality.

| Same existing structures | Base | Candidate |
|---|---:|---:|
| Mesh objects | 166 | 166 |
| Triangles | 47,820 | 48,596 |
| Unique attached geometry | 72 | 108 |
| Geometry source-buffer bytes | 1,565,576 | 1,806,824 |

The repair retains 37 support mesh slots and adds 776 triangles. This is structural submission accounting, not a measured draw count. Attached geometry payload increases by 241,248 bytes; the old shared chamfer box remains used elsewhere. No material/texture change is needed for this repair.

Bottom boundaries were extracted from actual transformed mesh triangles, not taken on trust from helper metadata. Native triangle barycentric evaluation sampled 21,384 locations on the unchanged 104,570-triangle terrain. Signed perimeter gaps range −0.14385849 to −0.08026509 m: every sampled edge is buried, with no positive gap. Replacing the new bottom with the old datum at those same positions reproduces the tower’s +11.35604495 m worst floating gap. The slightly different maximum from the author’s −0.08040760 m is explained by this oracle’s denser 32 subdivisions per contour segment. This perimeter metric excludes the intentionally buried bottom-center fan; its deeper closure is not a visible contact edge.

All 37 support tops match the actual base meshes within 1e−4 m. Every other structure mesh’s transformed bounds and triangle count match the base exactly, including capitals, ornaments, arch and masonry; the upper joints are preserved. All face areas are nonzero, stored normals agree with cross-product normals, side winding points outward, top faces upward and bottom faces downward. Welded geometric edges have two incident faces for the 36 solid supports. The tower has exactly 72 boundary edges, all on its existing open upper rim; the bottom is closed.

The real vertical consumers passed 37 individual support probes: live projectile and forecast report the same hit time, and cameraFraction clips against each support. Six separate synthetic cases distinguish elevated-body upper hits, lower misses, terrain fallback and explicit y=0. Independent in-memory source mutations make each of core projectile, camera and forecast consumers ignore explicit y separately. Every mutation is detected in its affected consumer. The forecast-only mutation demonstrates why the original low-arrow negative case was insufficient: an overly early static candidate can be rejected by the exact live fallback. The added high-arrow case detects a missed static candidate. The author adopted this additional regression case. These mutations only replace module source in the audit process; repository files were never changed.

Fallback checks cover absent, null, NaN and infinite y, plus finite zero, negative and positive y. Only finite y bypasses the terrain callback. Existing default height remains radius×1.5. The native cylinders remain conservative circular approximations; this change deliberately aligns their vertical extent, including existing top ornaments. It is not a claim that all collision behavior is unchanged.

The base modules were loaded directly from the specified Git commit in a separate process. All obstacle x/z/r/type/order, enemy identities/positions/home positions, pickup identities/positions and the complete fresh save serialization match. The core diff leaves serialization/restore code unchanged. This is not an exhaustive saved-game trajectory equivalence claim: projectile/camera vertical blocking intentionally changes.

Exact reviewed runtime hashes:

| File | SHA-256 |
|---|---|
| `src/scene.js` | `c0badce3e1e07e920163f45397e90938ced26e10e3e904cb408605e2607c3639` |
| `src/core.js` | `602ace6f4847a717204a719d99688160af237c7dea219a6f02652faffbb9e8b0` |
| `src/environment-models.js` | `62cd3efa43d6f24275491cd5250758b19e5cdfc1ca55b45d62f6fddb340e4e28` |
| `src/architecture-grounding.js` | `6da714830df4cf0c61c99a5ff4a330b92ba50a2554709f3008a9cb50d6f64b15` |
| `src/spatial.js` | `9485b013c168da824f035fa11c90ab706bd3949a1d45cd00fc2967cd5f5b894c` |
| `src/combat-presentation.js` | `e3389ea0a17dcb3214f79bd532432d90b6e022152bc6351e8c89c292137d04d9` |
| `src/terrain-surface.js` | `be555011070f2d0aac57445d48ed88deb12d5d5c4a3d29a337fc17882842204b` |

Artifacts: `audit-grounding.mjs`, `baseline.json`, `candidate.json`, `verify-bounds.mjs`, `bounds-normal.json`, and the three `bounds-*-mutant.json` files. Reproduce the baseline with `node audit-grounding.mjs REPO baseline.json fff7adc5e2114fe7603a86b78a8d6b6b4626e96e`, then the candidate with `node audit-grounding.mjs REPO candidate.json` in the same output directory. Bounds modes are `normal`, `core`, `camera`, `forecast`; each asserts the expected correct result or mutant detection. No repository or remote writes occurred.
