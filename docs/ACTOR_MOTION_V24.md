# Continuous attacks and supported equipment — 2026-09-16

Base: `547676fdce8d8e97abed9f065aad0b6e24af2fd6`. This bounded actor unit targets the latest whole-screen PS4 realism request. It does not establish PS4 quality, completion of the ten named comparisons, or a deadline GO for 2026-09-20. The remaining rendered/device/art acceptance evidence is still unavailable to this unit through the authorized route. No alternate browser, server, CI execution route, remote write or Site publication was used.

## Concrete defects and changes

The previous enemy windup ended at authored phase .42 but strike began at .50. This skipped much of the weapon release in one frame. Wolf crouch and neck poses also jumped between states. One continuous presentation clock now spans saved windup, strike and recovery; the existing gameplay clocks, damage, movement and save data are unchanged. Player impact remains semantic phase .5 at the existing weapon hit time. `motion.combat.time`, `releaseStart` and `releaseEnd` expose seconds relative to that hit for the separately owned trail integration.

The attack poses load and shift the pelvis across the planted stance. The contact solver includes those horizontal pelvis offsets, retaining actual world foot anchors on slopes and during movement. Sword follow-through bends the arm instead of driving the tip below the floor; the second slash reverses the first. The boss slam and wolf bite use the same continuous clock with distinct body movement. Ranger draw/release retains its continuous state boundary.

The spear previously pointed almost upward at the saved hit time. The greatsword pointed through the floor during parts of its attack. Both now have an authored equipment orientation and reachable rear wrist target; two fixed-length arm solves keep both palms on the physical handle or shaft. Their wrist, elbow and shoulder lengths are not stretched. The loaded greatsword stays in front of the skull, and the spear's rear wrist stays in front of the torso armor. Equipment commands follow passive pose transitions. During the final existing flask-lowering segment, hidden equipment is re-grasped gradually; visible arms reach their carry pose before the weapon returns.

No geometry, material, binary asset or triangle count changed. The main Scene, game rules, UI, audio, legacy GLB actor implementation and saves were not edited. NPCs retain their existing locomotion/activity poses; this unit addresses combat actors and the player's equipment transitions.

## Same-condition measurements

`node tests/fixtures/actor-motion-audit.mjs` loads the frozen baseline actor/motion source using Git; `--current` loads the candidate. Both use the unchanged geometry, content and Game implementation, the same root transforms and scales, identical saved clocks, 60 Hz enemy updates, and 41 samples for each of nine player attacks. These are host Three.js bone/weapon coordinates, with no camera or rasterized image.

| Measurement | Baseline | Candidate |
|---|---:|---:|
| Soldier windup→strike shoulder step | 1.682980 rad | .146634 rad |
| Soldier windup→strike blade-tip step | 3.058962 m | .308100 m |
| Boss windup→strike blade-tip step | 7.031827 m | .574133 m |
| Boss radial windup→strike blade-tip step | 6.329904 m | .302025 m |
| Wolf windup→strike neck step | .729978 rad | .014146 rad |
| Wolf windup→strike pelvis step | .129980 m | .003872 m |
| Lowest sampled sword tip, all combos | −.290978 m | +.492281 m |
| Lowest sampled greatsword tip, all combos | −.817826 m | +.743951 m |
| Maximum greatsword support-palm distance to handle centerline | .875767 m | .013000 m |
| Maximum spear support-palm distance to shaft centerline | .407749 m | .013000 m |

The .013 m residual is the authored palm surface offset from the shaft/handle centerline. Distance to that intended grip point is at floating-point roundoff. Across epsilon samples at both enemy state seams, the largest sword-tip difference falls from 6.872223 m to .0000291 m. Sampled pelvis travel is approximately .050 m laterally and .120 m fore/aft. The largest blade displacement during an intentionally fast swing is not required to be zero.

The focused skin test evaluates 369 actual blade centerlines against skinned head/neck/torso triangles, with current bounding spheres and skeletons, and finds zero intersections. This is sampled centerline clearance, not complete volumetric, clothing, limb or environment collision freedom. Independent slope tests covered 27 weapon/action/speed combinations and 2,250 stance pairs: maximum slip 3.66e−15 m and support-height error 7.08e−16 m. Production tests separately retain the baseline contact, action-travel, teleport and revival cases.

## Review, repair and final validation

Independent Ultra review was delegated with `reasoning_effort=ultra`, `fork_turns=none`, model omitted to `/root/ultra_q_ps4_quality_continuation/actor_motion_ultra/motion_review_ultra`. The source owner is `/root/ultra_q_ps4_quality_continuation/actor_motion_ultra`; the parent is the sole integrator. These are accepted delegation parameters, not a measurement of hidden model settings.

Review-driven repairs were substantive: an initial offhand-only solve could not reach its target; two-arm equipment poses replaced it. Review then found torso/head intersections and passive equipment transitions bypassing the bone blend. After those fixes, a newly equipped drink exit exposed an uninitialized transition target, then a visible wrist snap, then an elbow-pole flip at the start of re-grasping. Transition-instance seeding, saved-clock flask lowering and gradual joint-configuration blending resolved these in sequence. New tests retain each concrete regression, including the first visible wrist frame and all lowering frames; hidden weapon-bone changes are excluded from visible-arm continuity assertions.

The final independent drink retest matches the final source hashes. Phase .73±1e−7 produces at most 4.48e−13 m visible joint displacement. Across fresh/previous-equipment sequences, maximum elbow travel is .058334 m/frame; first exit-frame wrist travel is at most .015122 m; subsequent visible tool movement is below .009843 m/frame. Saved drink poses reconstruct independently of prior history. No unresolved defect remains in that focused retest.

Final local `npm test`: **231/231 passed**, 29,494.472 ms. Final `npm run build`: **74 modules, 5.76 s**, with the existing >500 kB vendor-chunk warning. The actor suite contains 19 tests, including eight new regressions. Build and tests ran concurrently on the host; these durations are not device frame measurements. `git diff --check` and the provenance hash update pass. Release packaging, artifact gates, main integration and owner-only Site publication belong to the integrator.

Reproducible JSON: [baseline](evidence/actor-motion-v24-baseline.json), [candidate](evidence/actor-motion-v24-candidate.json), [final drink retest](evidence/actor-motion-v24-drink.json). The latter is reproduced exactly by `node tests/fixtures/actor-drink-audit.mjs`. Each file records its measured source hashes. Earlier independent collision/slope findings were source-bounded; final regression tests repeat their concrete assertions on the final source. None of these files contains WebGL screenshots or actual mobile FPS.

## Timing, payload and remaining quality gap

Measured UTC checkpoints: worktree created 01:27:13.611; first implementation window started 01:30:03.673; initial implementation/first IK candidate checkpoint 01:35:21.240; final source saved 01:49:02.186; final full test log completed 01:50:08.044. Thus initial inspection/baseline setup occupied 170.062 s, the first implementation window 317.567 s, review-driven repair/regression authoring 820.946 s, and final-source verification window 65.858 s. Documentation and handoff followed. Rework must not be counted as first-pass asset production. No external asset acquisition occurred. These wall-clock windows contain overlapping independent activity and are not pure labor categories; no equivalent prior full-scope production time exists from which to claim a speed improvement.

Actor source grows 20,155→26,225 B (gzip 6,458→8,399 B); semantic motion 3,220→4,800 B (gzip 1,102→1,592 B). The extra work is bounded to analytic poses/constraints; only the player has the two supported weapons. Geometry and shared textures remain byte-identical. Animation source SHA-256 is `d299e3d02b0fca392b3e22eb9b7753133d7413d452403e482ee86b76337f7ff7`; motion source is `4569b9fa69da7f5894c102acc9e7586f4b40f37b3a22bcafb04b1a0169ea3924`.

The remaining actor gap includes professionally authored or captured animation, realistic anatomy/texture atlases and faces, facial acting, fuller cloth/body/environment collision, and production-quality locomotion transitions. The wolf still uses analytic foot support rather than a captured bound cycle. Model dimensions and gameplay reach are not a physically exact weapon collision system. Official rendered review, device performance and fixed-title perceptual comparison remain unverified. This unit repairs measurable visible-motion mechanisms without accepting the wider PS4-quality goal as achieved.
