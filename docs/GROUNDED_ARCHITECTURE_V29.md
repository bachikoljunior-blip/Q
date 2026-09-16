# Landmark contact and shared vertical bounds

Finite local unit from `fff7adc5e2114fe7603a86b78a8d6b6b4626e96e`, branch `feat/ps4-grounded-architecture-v29-20260916`. Author: `/root/ultra_q_ps4_quality_continuation/combat_vfx_ultra`. The parent retains all remote/main/Site integration. No renderer or preview was launched.

The ruins tower's actual octagonal lower edge was 6.108–11.356 m above the indexed terrain. Nearby columns floated 4.273–4.867 m. Their colliders started on local ground while the entire visual group used the landmark centre height, so the visible upper wall also extended beyond its old collision volume.

The 36 columns/gate posts and one tower now share a DOM-free support layout. Their existing x/z positions, circular radii, upper joints, capitals, spires, arch spring points and tower crown remain fixed. A segmented lower ring follows `heightAt` with a 12 cm buried overlap. Continuous shaft faces join that ring to the original top; the underground bottom is closed. The tower keeps its existing open top and octagonal taper. The existing materials and 37 support draws are reused. No rocks, decoration, media, textures or extra content were added.

Each support exposes explicit world-space `y` and `height` from the same layout. `obstacleCylinder` resolves those bounds for the real camera, live projectile contact and combat forecast. Obstacles without explicit y retain the old ground-height fallback, including y=0 handling. This deliberately changes vertical occlusion where the original solid model was missing; it is not described as a wholly cosmetic change. The existing 2D radii, routing, placements, damage and save schema are unchanged.

| Actual geometry comparison | Baseline | Candidate |
|---|---:|---:|
| Worst sampled support/terrain air gap | 11.356045 m | none; maximum −0.080408 m |
| Bottom perimeter signed ground range | up to +11.356 m | −0.143858 to −0.080408 m |
| Support triangle count | 1,744 | 2,520 (+776) |
| Support draw count | 37 | 37 |
| Upper-joint position error | — | ≤9.54e−8 m |
| New texture/media payload | — | 0 B |
| Initial entry JavaScript | 163,175 B | 163,956 B |
| Manifest JS chunks | 3 | 3 |

The contact oracle samples actual production mesh bottom edges against the current indexed terrain, including intermediate points. The tower's underground fan is intentionally deeper than its perimeter: the full bottom-face minimum is −2.737301 m. That is a buried closure under uneven land, not the outer contact tolerance. All 148 outward native side rays hit the expected support; this checks face orientation without drawing pixels. The new unique support buffers occupy 241,920 B. The shared old box is still used elsewhere; replacing the old tower's 672 B yields a net unique buffer increase of 241,248 B. These are buffer arithmetic, not measured CPU/GPU performance.

`docs/evidence/grounded-architecture-v29` retains the original audit, an exact baseline world/save fixture, final geometry hashes, same-coordinate camera comparison, gate output, build bounds and timings. All six files used by the prior architecture audit were checked byte-identical at this unit's base before reusing its measurements. The existing house foundation defects (up to 1.063 m floating / 1.092 m burial), bridge ramp mismatch (−0.133 to +0.148 m) and absent bridge ground supports remain separate recorded work. No house/bridge change is claimed here.

The focused gate executes the real `createStructures` method without creating SceneView or WebGLRenderer, and requires all 37 shared support meshes. It detects the previous tower gap, checks unchanged upper joins, verifies same obstacle/actor/pickup coordinates and exact JSON save output, and exercises the actual camera/live projectile/forecast entrypoints. Three old-height negative controls and six elevated-volume/fallback checks expose disconnected vertical bounds, including a high hit that detects a forecast-only broad-phase omission; y=0 and ordinary obstacle fallback are covered.

The full 257-test suite, production main runtime gate, journey, both crossing choices, forge, 30-minute simulation, expedition and four vaults pass. The final geometry gate and build also pass. Full packaging, main integration and Site deployment belong to the integration owner. Source preparation/rework were not individually timed; the timing record separates zero media work, measured validation commands and total worktree wall time without inventing edit durations.

The independent Ultra review found no required runtime fix. Its native geometry oracle sampled 21,384 outer-contact points (−0.143858 to −0.080265 m), confirmed all 37 upper positions and the other 129 structure mesh bounds unchanged, checked outward normals and topology, and found the expected existing open tower top only. All 37 supports passed actual camera/live-projectile/forecast checks. Three separate in-memory source mutants independently exposed each consumer ignoring explicit y. The unmodified independent JSON and both oracles are retained in the `independent` evidence directory.

No pixels, device frame times, perceived masonry quality, touch feel, real playthrough, PS4 parity or whole-game completion were verified. Numerical contact repair is a concrete improvement to an identified defect; it does not replace those acceptance conditions.
