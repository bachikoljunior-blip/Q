# Decisions

## Active objective

- The user’s 2026-08-01 open-world RPG requirement supersedes the STARTHREAD arena format and its Canvas 2D / one-finger tether product-direction decisions.
- Preserve relative GitHub Pages compatibility, locally bundled runtime dependencies, deterministic test-only controls restricted to loopback hosts, save safety, and the verified mobile lifecycle principles from PR #3.
- Three.js 0.185.1 is the exact locally bundled runtime. Published r2 is the remote known good; the r3 candidate keeps relative Pages paths, loopback-only test injection, deterministic state machines, and a strict structural mobile budget.
- The user-requested 20-round checkpoint is represented by exactly 20 implementation commits. Release metadata, evidence reconciliation, remote merge, and public verification are delivery work and do not add implementation rounds.

## Historical STARTHREAD baseline

- Use Canvas 2D and project-authored geometry/audio for fast mobile loading and zero media-license risk.
- Use one-finger gravity tethering instead of a virtual joystick: holding places a gravity well, the tether damages enemies, and releasing preserves momentum.
- Finish a dense eight-rift run with two bosses rather than create an unfinished broad game.
- Use relative paths throughout for GitHub Pages project-subpath compatibility.
- Expose state controls only on loopback hosts with `?test=1`; the public Pages hostname cannot create them.
