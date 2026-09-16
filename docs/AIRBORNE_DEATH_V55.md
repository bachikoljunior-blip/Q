# Airborne death settling — v55

A player killed during a jump previously stopped in mid-air: both `Game.tick` and the production main loop skipped dead-player updates. This unit continues only `player.y`, `player.vertical` and `player.grounded` under the existing −21 m/s² gravity and `groundAt` contact. The living and dead paths share the same vertical step; the production entrypoint retains its 60 Hz accumulator and 50 ms frame clamp. The world clock, day, enemies, projectiles, quests, attack state, inventory, input and periodic save timer do not advance during these death-only ticks.

Base: `fa920db9782b7df42e4e16099a05994e5841dbaa`. The initial implementation checkpoint is `bc0d29f5a8b0a92519ae64697eb4122a909c41bc`. Exact baseline source is included under `docs/evidence/airborne-death-v55/`; no unavailable Git object is required to run the comparison. Final source hashes are in `validation.json` and `HASHES.json` in that directory.

## Observable change and state contract

Normal melee hits reduce the fixture player from 120 HP to 10 HP, the normal jump establishes vertical velocity, and a sixth normal hit causes death. No direct player HP/dead/vertical assignment substitutes for the death in the author fixture. Other enemies are disabled and encounter positions are selected to isolate contact while preserving the real HUD's enemy entries.

The same rising death at jump time 0.2 seconds begins 1.045 m above ground. With the old main and the repaired core, all three frame-rate cases still remain at that height, which detects missing main integration. With both changes:

| RAF rate | First root motion after death | Root lands after death | Final root gap |
| --- | ---: | ---: | ---: |
| 30 Hz | 0.033333 s | 0.533333 s | 0 m |
| 60 Hz | 0.016667 s | 0.500000 s | 0 m |
| 120 Hz | 0.016667 s | 0.508333 s | 0 m |

These are deterministic fixture clock values, not device frame times or visual perception. The fixed-step accumulator means a resumed single RAF can legitimately produce zero physics ticks. Core comparisons additionally cover 27 location/phase/rate combinations: haven, bridge and slope; grounded, rising and falling; 30/60/120 Hz. Every candidate settles at root gap zero. The old rising/falling cases remain over one metre above their ground in this author fixture. Zero/negative dead dt does not change state; large dt is clamped to .05 seconds. Living motion and serialized output remain exactly equal against frozen baseline core in the tested sequence.

Death penalty remains once-only (100 ash → 80 in the author fixture; independently 101 → 80), and the event is consumed once. `runtime.player.y/vertical/grounded` already exist in the save schema; their values now legitimately progress during death. The death event and existing explicit lifecycle actions still save normally, but the alive periodic timer remains frozen. Loading a dead save retains the existing respawn behavior. In-memory title/continue retains its existing Game instead; it does not itself respawn. The real respawn control restores ground, vertical=0, full HP and the existing penalty.

Settings, dialogue, hidden document and title stop this update. Independent review detected that the first main candidate did not also stop on blur/pagehide when explicitly given subsequent RAF callbacks. A page-active flag plus `document.hasFocus()` now gates the new dead path and its animation dt. Focus/pageshow restore settling under the existing death screen. The view still reads current paused/dead state after `handleEvents`, preserving same-frame dialogue→death cleanup. This is an application event/RAF guarantee, not a claim about any browser's pagehide scheduling.

## CPU contact and independent review

The independent review uses the separate death-entry actor `e58994a182cfac8714d12f89d9ab9244ce0e4ed5` (source `ee276f96ac89769f9f3c57c146f85c06af7efd429623b0ab85a46bf51acaa84b`) and the exact SceneView.update player prefix. The prefix calls the real actor animation and stops explicitly before NPC, atmosphere, camera and renderer work. This author unit does not edit the actor.

For 18 cases (three weapons × haven/slope/bridge × rising/falling), each with 72 consecutive 60 Hz frames, all visible native Three mesh vertices remain at nonnegative ground clearance. Minimum candidate vertex gap is +0.653821 mm, settled minimum is +6 mm in all 18, and cape minimum is about +11.999978 mm. Baseline end-of-sequence visible gaps remain 109.43–924.77 mm with the same actor. This finite CPU vertex result does not establish triangle interiors/edges, all world positions/yaws, self-contact, natural motion, pixels or device performance. The independent report is integrated separately at [independent/REVIEW.md](evidence/airborne-death-v55/independent/REVIEW.md).

## Validation and delivery boundary

Run `node --test tests/airborne-death.test.mjs` for the focused contracts. Run `node docs/evidence/airborne-death-v55/measure.mjs` for the same-condition JSON; its default output is `artifacts/airborne-death-v55`, leaving frozen evidence untouched. An explicit output directory can be supplied as argv1. Existing touch-source wiring checks were updated only to include the new page-active assignments; actual event execution is covered separately.

Final exact outcomes and elapsed host times are in `validation.json`; logs include full unit tests, main/dialogue integration, the main runtime fault-sensitivity gate, journey/crossing and the 30-minute simulated session. A fixture error initially removed HUD-required enemy entries; preserving those entries corrected the test boundary. Two other fixture expectations were corrected: one RAF need not cross a 60 Hz step, and in-memory continue does not automatically respawn. The initial lifecycle omission was a real source defect and is retained in the independent negative evidence.

The standalone unit builds three JavaScript chunks. Initial JS grows from 164,988 to 165,184 B (+196); Python gzip level9/mtime0 grows from 62,484 to 62,557 B (+73). The unit exceeds its base's old 165,000 B regression guard by 184 B; no guard was changed here. The integrator has the later native-audio regression budget and must measure the combined build, generate its shared Web receipt and perform the final artifact gates. This comparison is encoded local output, not measured HTTP transfer, CPU cost or GPU performance. Runtime media and all actor/environment geometry are unchanged in this unit.

No remote or Site mutation, preview/browser substitute or generated screen was used. Actual WebGL rendering, naturalness, physical touch, device performance, PS4 comparative acceptance and the September20 completion outcome remain unverified. The visible air-freeze is repaired at the source/main/CPU boundary; it is not an assertion that overall quality is complete.
