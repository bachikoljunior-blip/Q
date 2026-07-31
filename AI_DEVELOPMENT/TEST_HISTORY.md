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
