# v55 airborne death — independent review

Final status is recorded in `summary.json` and `HASHES.json`; the first candidate's lifecycle failure remains preserved in `candidate.json`.

The review reads recovered base `fa920db9782b7df42e4e16099a05994e5841dbaa`, the airborne-death candidate, and the separate death-entry actor at `e58994a182cfac8714d12f89d9ab9244ce0e4ed5`. Writes are confined to this review directory. No source/repository/remote/Sites/automation or browser changes, new agents or rendering work were performed. Historical Game-unchanged claims are not reused: this unit intentionally changes dead-player vertical state.

## Required finding and repair boundary

The first candidate allowed `main` to tick a dead player but preserved the former `!dead` interruption guards. In the actual bundled entrypoint, a dead player at ground+1.2m with velocity −2m/s continued to fall after `blur` with `document.hasFocus() === false`, or after `pagehide`, if further animation callbacks arrived. The same explicitly delivered event/RAF sequence kept the recovered base unchanged. This is an application-state contract failure, not a claim that every browser delivers RAF after pagehide.

The author added a page-active flag and checks for focus loss only in the new dead-player path, applying inactivity to SceneView's animation dt as well. SceneView still evaluates paused/dead after handleEvents, preserving same-frame panel changes. Final rerun evidence covers suspension and resumption without replacing the death panel with a second modal. Final core SHA-256 is `a6b7271063f683d2228dc1d547a82d7dd5b3257b3f4a538ced63c88ac37e3b3f`; main is `0e864c56cea02f20e20d2edb00de72b0bb062f959699486219eaa23cc718dc87`. Final disposition is in `summary.json`.

## Actual main and Game checks

`main-core-oracle.mjs` bundles the unmodified main source and its real Game dependencies. The recovered fixture provides explicitly bounded DOM, SceneView and audio doubles; a reviewer-controlled RAF clock supplies 30/60/120Hz and a 500ms frame gap. This is application execution, not browser layout or native event-order proof.

The matrix checks ground/upward/downward motion at spawn, a slope, and both bridge centers. An independently evaluated semi-implicit gravity sequence uses −21m/s² and the existing groundAt sampler. Twelve candidate trajectories match and land at root gap zero; the base's ascending/descending dead player remains suspended. Five living-state dt conditions (0, 1/120, 1/60, 1/30 and .5s) retain exact JSON state against the base across 30 actual ticks each. Dead dt checks include negative, zero, small and clamped large values.

The real jump control routes through main into Game. After the production hurt method makes the player dead, the candidate continues fixed 60Hz vertical updates at all three RAF rates while ignoring held movement/attack. A separate existing-knight strike case causes lethal contact inside the actual Game tick, displaying the real death panel. Subsequent death-only ticks preserve the remaining serializable/enumerable game state, including x/z/angle, clocks, timers, enemy/projectile states, progression, rewards and inventory. The allowed changes are y, vertical and grounded. A 500ms RAF gap still contributes only the existing 50ms clamp: three fixed gravity steps and SceneView dt=.05.

The death penalty remains once-only (101 ash→80). Main saves the death state including the vertical coordinates at the event; it does not advance the alive periodic-save timer while dead. The existing load contract deliberately respawns a dead save rather than restoring a suspended corpse. This differs from the existing in-memory title/continue route, which reuses its Game; source readback confirms it is not a fresh dead-save load. Direct respawn restores living state, grounded=true, vertical=0 and hides the death panel. This is a gameplay/save-state check, separate from visual animation snapshots.

Settings, document.hidden, title and dialogue freeze checks passed before the lifecycle repair. Focus and pagehide needed the repair described above. Final evidence also records visible/focus/pageshow/close resumption and whether the death panel remains present. CSS/input occlusion and actual browser suspension scheduling remain outside this fixture.

## CPU contact with the separate death-entry actor

The actor source is SHA-256 `ee276f96ac89769f9f3c57c146f85c06af7efd429623b0ab85a46bf51acaa84b`. The unchanged SceneView source is `43ea82a2b11e706b8064c7ee3f8f8f8a37f2384e2d4eb67dddafeb23e4e56c5b`.

`contact-oracle.mjs` executes the exact SceneView.update prefix through its player-position/rotation and animateModel call. It then stops explicitly before NPC, atmosphere, camera and renderer work; its animateModel boundary calls the actual player actor. The prefix text is saved in `contact.json`. No fake WebGL renderer is used. Actual Three CPU skinning transforms every currently visible mesh vertex, including skin, cape and rigid equipment/accessories.

The same 18 cases (three weapons × spawn/slope/bridge × ascent/descent), each with 72 consecutive 60Hz frames, compare baseline and candidate Game vertical state with the same recovered death-entry actor. All 1,296 candidate frame samples have nonnegative visible-vertex ground clearance. The smallest is **+0.653821mm** during slope descent, at leather vertex345; settled minimum is **+6mm** in every case. Cape minimum is approximately **+11.999978mm**. Baseline end-of-sequence visible minimum gaps remain **109.43–924.77mm**, depending on case, while the candidate root reaches groundAt.

This does not establish interior triangle clearance, all world positions/yaws, self-contact, visual naturalness, frame quality or device performance. The rigid category includes all non-skinned/non-cape accessories, not only blades. The test preserves live state identity and does not substitute explicit saved death clocks; saved animation fallback is owned by the separate actor unit. No visual actor or cloth source was edited here.

## Evidence scope

The fixed source/media/build budgets and final full regression/artifact gates belong to the integrator/author. This review does not modify or replace those gates. It evaluates a finite source/API/CPU geometry unit, not PS4 acceptance or the September20 completion claim.

Run the main oracle with candidate root and output label as arguments. Run the contact oracle with candidate root; the separate actor root and installed Three/esbuild are explicitly anchored to this recovered workspace. If relocated, deliberately remap these paths. Final manifest lists exact copyable files. Preserve the first candidate JSON as the negative lifecycle evidence rather than overwriting it with the repaired result.
