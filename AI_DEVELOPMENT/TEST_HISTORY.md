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

## 2026-08-01 — r3 twenty-round candidate

- Exactly 20 independent implementation rounds were committed after published r2: save-v5 character quest state; three staged quests each for Mira, Orin, and Ilya; relationship-derived dodge/forge/attack rewards; journal, ending, Crown-gate, and strongest-bond council payoffs; enemy poise, interruption, guardian phases and distinct tactics; terrain, water, leash, house, separation, and alternate-step navigation.
- `npm run check`: passed. Static/license validation found 28 required files, 1,556,151 release bytes, 198,958 JS+CSS bytes, local-only runtime assets, and exact Three.js 0.185.1 MIT metadata. Nine deterministic core/world tests and the full happy-dom journey passed.
- The journey verified real damage timing, poise recovery, windup interruption with a damage-free counter window, guardian phase HUD, four guardian tactics, protected story/test injection, all three relationship quests, one-time council reward, defeat/recovery, persistence, and the structural pixel/scene budgets.
- Level C falsification passed: deliberate F2 asset-without-state, F3 validation, F5 review-record, and F6 release-ID mismatches each exited 1 and reported the intended defect.
- Post-respawn final scene estimate: 103 draw calls and 114,950 triangles; the route guard remains 170 calls and 170,000 triangles. This is a headless visible-scene estimate, not WebGL renderer or physical-device evidence.
- Noto Sans JP Regular 400 was re-subset from the recorded `@fontsource/noto-sans-jp` 5.3.0 source. FontTools verified 601/601 non-icon non-ASCII game code points; the ten intentional UI symbols remain on the system fallback stack.

Remaining evidence limit: r3 remote Quality/merge/Pages verification, a WebGL-capable public journey, blocked-geometry hit rejection, and physical iPhone SE touch/performance remain pending. Premium presentation and commercial-scale narrative acceptance remain failed.
