# Test history

## 2026-07-31 — local revision before first publish

- `npm run validate`: passed. Relative Pages paths, required files, syntax, offline cache, payload budget, asset record, and zero external runtime URLs checked.
- `npm test`: passed, 6/6. Deterministic random, beam geometry, upgrades, save validation, storage failure recovery, and formatting checked.
- `npm run test:browser`: passed using a DOM runtime substitute. Covered fresh menu, tutorial, pointer tether, fixed-step updates, pause/resume, boss checkpoint, failure/restart, all upgrade transitions, final ending, and canvas backing budget.
- `npm run check`: passed.

Limitation: Playwright Chromium could not be downloaded in the local environment. The DOM interaction run is not recorded as real Chrome or iOS Safari evidence. Public URL interaction remains mandatory after deployment.
