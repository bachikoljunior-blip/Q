# Independent review of canonical shared-curve sampling

Reviewer: `/root`, following the user's direct instruction that the parent also work.
Reviewed source: `26e03460e78f44660e0e6adb54040e909598bc7f`.
Only this evidence directory is edited. The integrator owns source repair and remote writes.

## Initial result: changes required

Two accepted, finite input examples can return a reduced selection with nonfinite reported errors. They are reproduced in `review.mjs` and recorded in `REPORT.json`.

1. **Inherited weight property.** A middle sample uses the own bone key `constructor`, with surrounding samples weighted to `head`. Every row is nonnegative and sums to one. Ordinary property access reads the inherited constructor function in the surrounding rows, turning the error into NaN. The middle sample is removed although its independently computed weight error is **1.0**, versus tolerance **0.015**. Use own-key lookup or a null-prototype representation.
2. **Finite parameter arithmetic overflow.** Strictly increasing `[-1e308, 9e307, 1e308]` produces `Infinity / Infinity` in interpolation. A middle bend is removed and maximum position and weight errors are NaN. The independent, scaled-parameter oracle measures **1.3793114224 m** position error versus **0.00025 m** tolerance. Safely normalize the parameter arithmetic or explicitly reject unsupported ranges. Derived nonfinite errors must never proceed as successful selection.

These are helper contract defects. They do not establish that the actual canonical registry uses either an inherited-property bone identifier or an extreme parameter domain, nor that an existing rendered model has these defects.

## Independent checks that passed

Nine ordinary datasets cover lines, three-turn spirals, figure eights, explicit cusps/features, closed loops, nonuniform parameters, rotating and discontinuous normals, and nonlinear three-bone weights. All retained endpoints/features, left source data unchanged, and stayed within the sampled tolerances according to an independent interpolation and angular-error oracle. Owner selections were independent copies in forward and reverse order.

Twenty-six invalid input/option cases were rejected, including nonfinite or nonunit data, invalid weights, parameter order, feature indices, tolerances and traversal direction.

For the six unchanged existing cubic head boundaries, de Casteljau evaluation and a quadratic derivative were used independently of the author's expanded Bernstein evaluator. Each selected curve was inspected at 32,769 grid points, including points between the 129 master samples. All six stayed within the stated position and normal tolerances on this grid.

This is numerical CPU evidence only. A dense grid is not a continuous interval proof, and successful edge reduction says nothing about unregistered surface interiors, multi-edge node compatibility, rendered appearance, animation or device performance. No mesh was created.

Run from repository root:

```sh
node docs/evidence/mira-assembly-v65/shared-sampling-review/review.mjs
```

The script records the tested helper hash and reports the two contract failures without disguising them as passes. Its execution time is not production-authoring time.

## Repair verification

The integrator's repair `f2d051da18eb7267d98714ac968971e4731ba27c` was loaded from a detached worktree, without editing its source. `REPORT_REPAIRED.json` records the exact helper hash. The original failure report remains in `REPORT.json`.

- The inherited-key case now retains all three samples, with zero sampled weight error.
- The overflowing finite parameter span is explicitly rejected.
- The same nine normal datasets, 26 invalid input/option cases and six independently evaluated dense cubic grids pass again.

The two reported defects are closed within this numerical helper scope. This does not approve surface/node registration, new geometry, rendered appearance or gameplay adoption.

To repeat against that fixed checkout, set `Q_SAMPLING_REVIEW_MODULE` to its absolute `review/assembly-sampling-v65/shared-curve.mjs` path, `Q_SAMPLING_REVIEW_SHA` to the fixed commit, and `Q_SAMPLING_REVIEW_OUTPUT=REPORT_REPAIRED.json`. The module hash is captured independently of the supplied commit label.
