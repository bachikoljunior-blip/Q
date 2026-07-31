# Test history

## 2026-07-31 — local revision before first publish

- `npm run validate`: passed. Relative Pages paths, required files, syntax, offline cache, payload budget, asset record, and zero external runtime URLs checked.
- `npm test`: passed, 6/6. Deterministic random, beam geometry, upgrades, save validation, storage failure recovery, and formatting checked.
- `npm run test:browser`: passed using a DOM runtime substitute. Covered fresh menu, tutorial, pointer tether, fixed-step updates, pause/resume, boss checkpoint, failure/restart, all upgrade transitions, final ending, and canvas backing budget.
- `npm run check`: passed.

Limitation: Playwright Chromium could not be downloaded in the local environment. The DOM interaction run is not recorded as real Chrome or iOS Safari evidence. Public URL interaction remains mandatory after deployment.

## 2026-07-31 — public GitHub Pages release

- Pull request #1 was squash-merged to `main` at commit `eaa771528d5306af1f3f6f067cfcfffdd92a0683`.
- GitHub Pages deployment passed and served `https://bachikoljunior-blip.github.io/Q/` with title `Q: STARTHREAD`.
- Cloud Chrome interaction passed: fresh menu, all three tutorial steps, game start, canvas pointer drag, pause, and resume.
- The release kept its development test API disabled and loaded runtime resources from the same Pages origin.
- Application-origin browser warning/error count: 0. Browser-extension metadata errors were observed separately and are not emitted by the game.

Remaining evidence limit: no physical iPhone or Android-device run was available. The 320–375 CSS px layout and touch protections are covered by automated/static checks, while public pointer behavior is covered in real Chrome.

## 2026-08-01 — round 1: mobile lifecycle recovery

- Baseline `npm run check`: passed before modification.
- Centralized pointer release and covered pointerup, lost capture, window blur, pause, restart, and finish paths.
- Manual pause now stops procedural music; resume unlocks suspended mobile audio from its button gesture before restarting playback.
- Added distinct recovery guidance for manual, background/pagehide, and orientation pauses.
- `npm run check`: passed after the round; release payload was 62,420 bytes.

## 2026-08-01 — round 2: combat clarity and motion fidelity

- Added incoming/remaining-threat HUD feedback, an anchor-local energy arc, and accessible live tether/boss meters.
- Reduced-motion mode now freezes nonessential procedural animation and reduces trails and particle bursts without advancing gameplay randomness.
- Added a zero-size resize guard for transient mobile viewport collapse and switched DPR lookup to `globalThis`.
- The first round-2 gate exposed a pre-existing particle-loop defect: the changing loop bound stopped normal bursts early (`85` instead of `100`). The bound is now fixed before iteration, and both full and reduced budgets are tested.
- Final local `npm run check`: passed; release payload was 64,422 bytes with no external runtime URLs.

Pending release evidence: GitHub Actions and the updated public Pages build must be verified after merge. Physical iPhone/Android hardware remains unavailable.
