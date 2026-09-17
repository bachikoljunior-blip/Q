# Right hand and rigid staff adapter

Source candidate at base `bc761f25aae76209d26623b509f97e1f3a5a12ca`.
The parent implements this isolated unit under the new direct instruction
「親も作業して」. The Ultra integrator retains remote-write ownership.

`attachment.mjs` connects the **existing** 19-part staff to right `hand-0`
using the authored registration in
`docs/evidence/mira-reference-set-v64/hand-staff-registration/AUTHOR_REGISTRATION.json`.
It does not generate a surface or edit runtime source, bind data, geometry,
41-bone order, local bone lengths, Game or saves.

```js
const attachment = createStaffAttachment(actor);
actor.animate(state, dt); // existing animation, including breathing/terrain
const result = attachment.update(); // before skinning/rendering
// Later: attachment.dispose() detaches; caller owns staff geometry/material disposal.
```

The staff stays upright in world space. Actor heading selects its yaw; the
authored offset follows the actor transform, and the base samples world terrain.
Its world dimensions remain metric even with scaled ancestors. The adapter
uses the real chest inverse and an attainable hand rotation to solve the wrist
offset, then the two original 330/310 mm arm segments. It copies rotations to
three existing bones only. Hand scale/shear inherited from the chest remains:
the authored ideal hand orientation is not falsely claimed to be realised
exactly under arbitrary anisotropic ancestors.

The staff is an actor-root child with a full matrix
`inverse(rootWorld) * rigidStaffWorld`. Its local compensation matrix may contain
shear; decomposing it or enabling `matrixAutoUpdate` would lose compensation.
No negative/zero ancestor determinant or scaled arm bones are supported.
Each update also rejects nonfinite arm transforms and changed elbow/hand local
translations before any rotation write. This closes the independent review's
NaN success path and the stale-length path after a finite 50 mm wrist edit.
Unreachable/invalid input leaves the arm untouched and hides the staff until
the next valid solve. This is an explicit research failure policy, not an
accepted walking/death/gameplay fallback.

`verify.mjs` checks 36 samples across flat ground, the actual scene placement,
slope, rotated parent, nonuniform parent, and nonuniform actor root. It checks
all 19 part transforms (684 placements), geometry bytes, unchanged rest data,
breathing scale, opposite arm, local translations, actual hand-to-staff grip
point, 1.7 m rigid world length, repeated calls, and failure/recovery behavior.
A constant hand-child attachment is a control: inherited scale/shear recurs.

Run `node --test tests/staff-attachment-v65.test.mjs` and
`node review/staff-attachment-v65/verify.mjs`. Results are in
`docs/evidence/mira-assembly-v65/staff-attachment/VALIDATION.json`.

`node review/staff-attachment-v65/measure-cpu.mjs` repeats an executor-only CPU
comparison with alternating baseline/adapter order. The measurement after the
nonfinite/stale-length repair uses 500 warmup frames and eight paired
2,000-frame runs: median existing animation 0.024266 ms/frame, animation plus
adapter 0.037216 ms/frame, difference 0.012950 ms/frame. `CPU_TIMING.json` records
the exact attachment hash and all raw runs. The earlier pre-repair measurement
is retained separately in `CPU_TIMING_INITIAL.json`; the two runs are not a
controlled claim of a repair speed improvement or regression. These are not
browser, GPU, SE3 or FPS measurements.

**Not established:** finger-to-leather surface grasp, sleeve/forearm clearance,
whole-person assembly, existing baked staff removal, gameplay lifecycle,
animation transitions, rendered material/visual quality or device performance.
No main merge or Site update is performed by this unit.
