# Adaptive 2.2 pre-migration checkpoint

- Logical session: active; explicit user end required.
- Active objective: replace the published Q: STARTHREAD game with a mobile open-world RPG containing a broad, explorable natural world and other meaningful regions and systems.
- Last complete_verified checkpoint: remote `main` at `ac6f57f01c569201e453d84dad1e9bd02fe7285c`; the published STARTHREAD user flow and `npm run check` were verified on 2026-07-31 as recorded in the legacy state and test history.
- Current product work: `prepared_not_applied`. A partial core/save/world-model rewrite, exact Three.js `0.185.1` dependency, and vendored MIT runtime were stashed as `pre-migration open-world RPG work 2026-08-01` on local branch `agent/open-world-rpg`.
- Recovery copies: local stash plus `/tmp/Q_pre_migration_product.patch` with SHA-256 `9e63316c38c5330c33132eac5ce421904288b751ba3855afd6dd7a251c923289`.
- Modified but unverified artifacts: `package.json`, `package-lock.json`, `src/core.js`, `vendor/three.module.js`, and `vendor/THREE-LICENSE.txt` in the stash. Only the pre-change STARTHREAD baseline was executed; the partial overhaul was not executed.
- Concurrent remote work: open PR #3, `agent/two-round-mobile-polish` at `e7c61c8e32413fbae096a4d7c5b51545c8458c30`, is mergeable and carries verified STARTHREAD lifecycle, input-recovery, readability, accessibility, and performance fixes. It remains open and must not be silently discarded or marked complete.
- Remote state: public repository `bachikoljunior-blip/Q`; default branch `main`; public URL `https://bachikoljunior-blip.github.io/Q/`; Pages workflow runs on pushes to `main` and is not scheduled or self-restarting.
- Automation: no scheduled, looping, or self-restarting project chain was found. The Pages push workflow was idle at inspection time.
- Current uncertainty: exact public served commit is not exposed by the release; branch-protection and required-check configuration are not exposed by the available connector; no physical iPhone or Android verification exists.
- Rollback: switch to `main` at `ac6f57f`, or restore the product work with the named stash; the independent binary patch is the second recovery path.
- Exact next action: complete and validate the Version 2.2 canonical files and bounded enforcement checks on `agent/adaptive-2.2-migration`, integrate that migration without triggering a product deployment, then restore `agent/open-world-rpg` and resume the overhaul while carrying forward applicable PR #3 behavior.
