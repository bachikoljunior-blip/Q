# Independent external attachment review

The parent `/root` performs this bounded read-only review under the latest user instruction to also do practical work. The integrator remains the sole remote writer. Only this evidence directory is edited; no surface, bone, runtime source or saved game is changed.

## Initial fixed inputs

- Head: `fd5e1335bc224b040aa923374807ddcc9ffe5883`.
- Clothing: `ced283cecaa9fbabee52eec7ab940d6d2a2271d5`.
- Hands/boots: `ab94ce91bbb6be7a727fa910618d68c18984b239`.
- Unchanged actual 41-bone actor: local review base `f2d051da18eb7267d98714ac968971e4731ba27c`.

`REPORT.json` records source hashes. The earlier live clothing read is marked provisional in `REPORT_PROVISIONAL.json`; it is not author acceptance or a final assembly pass. The fixed clothing port bytes match that provisional read.

## Finding that blocks complete attachment coverage

The four head skin cut curves terminate at CHEST y=0.550 m and name an unregistered `body:neck-to-chest skin continuation` receiver. The head contract explicitly marks this pending. The collar is a separate garment layer; a 10 mm extension beneath its lower rim does not close the missing skin connection or establish that the clothing opening hides it.

The existing runtime ellipsoidal neck is not an implicit matching receiver. Its analytic cross-section at that height has radii 65.916/64.268 mm, while the new cut has 98/78 mm: differences of 32.084/13.732 mm on the principal axes. This is a counterexample to reusing that old surface as an already matched weld, not an actual triangle collision measurement. The integrator has assigned the head author to repair the receiver/hidden-boundary contract before whole-person acceptance.

## Checks that passed within a limited scope

All 21 exported ports were mapped from their declared local frames and units into the actual actor's CHEST bind frame. The constructor's initial animation was undone using captured rest transforms first. The 41 bones, anatomical right/left axes, hand/foot origins, foot-to-knee translation, finite unit normal/tangent vectors, orthogonality and named normalized weights matched.

Full sampled outlines were compared, not just axis radii. The hand outline remains inside the bracer opening on each side, with minimum polyline distance 16.478 mm. The trouser outline at boot-mouth height remains inside the boot aperture, minimum 4.740 mm. The registered lower boot envelope has about 4.000 mm sampled clearance. The head-to-collar lower/upper open outlines have minimum distances 5.973/6.976 mm. Individual measurements and witness coordinates are in the report.

These are static exported sample/envelope results. They do not establish continuous Hermite/Coons surface clearance, actual triangles, deformation, transition continuity, cloth dynamics, rendered appearance or PS4 quality. Neck skin and collar intentionally use different bone weights; their animated clearance is still unverified. Skin-to-bracer and trousers-to-boot are declared overlapping layers, not coincident welded edges.

## Repeat

From repository root:

```sh
Q_PORTS_CLOTH_SHA=ced283cecaa9fbabee52eec7ab940d6d2a2271d5 node docs/evidence/mira-assembly-v65/external-ports-review/review.mjs
```

`Q_PORTS_HEAD_SHA`, `Q_PORTS_ACCESSORY_SHA` and `Q_PORTS_REVIEW_OUTPUT` allow a separately recorded fixed-source follow-up. The script independently reads each specified Git object and records its bytes/hash. A revised receiver contract requires a fresh explicit review; the initial missing-receiver finding must not simply be deleted.
