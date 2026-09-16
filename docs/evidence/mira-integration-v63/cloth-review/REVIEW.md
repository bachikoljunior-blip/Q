# Mira P01-R cloth support v63: independent bounded review

**Conclusion:** The scoped floor-support experiment is reproducible. No additional required source defect was found in the inspected contract. This is **not ready for main-game adoption**: temporal deformation, per-patch CPU cost, neighboring seams, and body contact remain unresolved. No renderer, gameplay image, physical device, or perceptual/PS4 acceptance was performed.

## Fixed input and boundary

Requested author commit `dac1747bd13d64bb41e650c89c77df54bd0309b8`; actual clean readback `f5368df90c3f1e730dd680a1c486bb1c2db91e69`, tree `9bd911c67234525d25fae781eef8a23117c77787`. The latter adds only 19 files preserving a separately rejected v64 experiment; no v63 or runtime input changed. v64 was not reviewed here.

`review/cloth-support-v63/support.mjs` SHA256 `f8c83633e6b766ddf5de78701d8ff077194ce8a2c5e97c3a1f45c64dc37baadc` was copied into this review and imported from that copy. All 20 entries of the author's v63 manifest were checked for exact bytes/hash. Original actor, core, Bézier source, original mesh JSON, and generated reference bitmap remain byte-identical to base `22d1d041dd6aef60de7764b1eebf6cf78028c857`.

The reference is a generated design image, not photographic evidence. This review confirms unchanged reference bytes and source geometry; it does not establish pixel-level image/mesh identity or an unchanged fold silhouette during support.

## Independent checks and results

The oracle reconstructs the original P01-R from its 16-control-point surface, reads actual native NPC bone transforms, and independently computes triangle area, edge ratios, paired-triangle normals, terrain distances, top-pin differences, and frame-to-frame displacement. It does not import the author's metric helper. Each triangle uses 15 barycentric terrain samples, versus the author's 10. Terrain contact remains finitely sampled, not a guarantee for arbitrary nonlinear terrain.

One successful bounded batch comprised 16 poses (flat, along-slope, actual `groundAt(0,101)` registration, and a new `.08*x-.05*z` plane at `(-3,7)` with yaw `-.4`), 24 contiguous native animation frames across 30/60/120 Hz over death age .3–.4 seconds, and one intentionally infeasible buried-pin case: **41 support calls**, not a repeated 1,275-frame sweep.

| Check | Independent result |
|---|---|
| Source surface | 153 vertices / 256 triangles; rebuilt full arrays exactly match saved v62 |
| Constraints | 408 structural edges, 254 bend links, 64 passes; top indices 144–152 |
| Pin/immutable input contract | Top 9 position difference exactly 0; input positions/topology/rest unchanged |
| Twelve archived poses | Both before and supported vertex arrays exactly reproduced |
| Flat death .45 s | Minimum sampled gap −51.783 mm → +3.000 mm |
| Along-slope death .8 s | −103.202 mm → +3.000 mm |
| Actual ground death .45 s | −12.040 mm → +3.000 mm |
| Independent plane death .45 s | −23.390 mm → +3.000 mm |
| Geometry in 16 poses | All sampled gaps positive, minimum triangle area .000583915 m², paired-normal dot ≥ .755069 |
| Maximum edge ratio in 16 poses | 1.025745; no claim that the whole supported shape stays exact |
| Same-time 30/60/120 Hz | Full vertex coordinate maximum difference 0 |
| Infeasible negative | All 9 buried pins reported, none secretly lifted; floor support is not globally guaranteed |

The contiguous along-slope interval reproduces an increased displacement cost:

| Rate | Before maximum step | Supported maximum step |
|---|---:|---:|
| 30 Hz | 83.588 mm | 96.832 mm |
| 60 Hz | 41.958 mm | 54.840 mm |
| 120 Hz | 21.009 mm | 29.896 mm |

Steps diminish with shorter timesteps in these samples, but that alone proves neither smooth natural cloth nor acceptable entry/contact motion. The solver has no inertia, velocity, temporal cache, or damping; it solves a new quasistatic shape at every pose. Exact cross-rate coordinates are therefore compatible with a visually abrupt change. The preserved author record also reports flattening of the bottom pleat around .45 s; maintaining the rest control net does not preserve every posed fold.

## Registration and performance limits

The micro surface is attached through the **initialized chest pose**, after `createDetailedActor` has called `animate({},0)`. This is not the original Skeleton bind matrix: an independent initial assumption that they were identical was false (maximum mixed matrix-component difference .0229990784; this is not a pure distance). The corrected oracle captures the initialized native chest anchor as the existing experiment specifies. A future real SkinnedMesh integration must retain or explicitly convert this registration; copying the original bone inverse blindly would change the part placement.

The successful native+metric batch took 365.323 ms. Support alone had 26 active samples, median 3.477 ms, maximum 25.838 ms; 15 inactive samples had median .033821 ms. Maximum counted terrain-height calls was 26,210 for one solve. The intentionally infeasible active sample is included; these are one host/JIT-sensitive batch, not a warmed benchmark or device/GPU/frame-rate result. Multiplying this cost across planned parts or actors is not justified. The 64 passes entail 42,368 link-relaxation iterations before contact work.

## Required before runtime adoption

- Establish actual neighboring seam ownership/shared coordinates; top attachment to a chest anchor is not proof of attachment to another cloth part or a collar.
- Check body/arm/equipment contact and resolved normals/UVs on the combined garment; no body contact or global self-intersection oracle ran here.
- Resolve contact deformation and temporal cost, including actual live Game death capture rather than only explicit canonical death clocks.
- Measure the integrated workload and inspect real rendering when the official environment permits it. Runtime import remains absent and no source was modified by this reviewer.

## Execution accountability

An initial independent script parse error stopped before imports; the fixed-HEAD guard then correctly stopped before imports when the author added v64 evidence. A native-registration assertion next stopped after constructing one NPC, before any support solve, exposing the reviewer's invalid bind-pose assumption. These stops are retained separately; they are not source failures or completed sweeps. After correction, one successful 41-call batch completed with exit 0. All tool sessions have ended. No source, image, Git, remote, browser, or renderer changes were made.
