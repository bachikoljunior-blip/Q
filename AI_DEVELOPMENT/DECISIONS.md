# Decisions

## Floor-gate review vocabulary: `complete_verified`, not `passed`

`review_outcome` is `complete_verified`. `tools/floor-gates.mjs` accepts that value and no
longer accepts `passed`.

Two repositories ran independently written copies of this gate and **could not both pass as
written**: this one demanded `review_outcome: passed`, `Gptgame` demanded
`complete_verified`. The tie was settled by reading this repository's own protocol.
`AI_DEVELOPMENT/PROTOCOL.md` §116 defines the ten-value status vocabulary, and `passed` is
not one of them — the word does not occur anywhere in that document. The gate was requiring a
value the protocol it enforces does not define, while `passed` separately means "this check
ran and was green" in the gate-result vocabulary, which is a different claim from "this
change was reviewed end to end".

What the change costs, measured rather than argued, over 768 constructed gate inputs:

- Configured with the old accepted value, the shared implementation in
  `.kit/lib/state/floorGate.mjs` fires **exactly the same rules on all 768** — 0 differences.
  The refactor is therefore separable from this decision; the only textual change is a
  `(found X / Y)` diagnostic appended to the F5 message.
- Switching the accepted value to `complete_verified` changes 624 of 768. In 156 the gate is
  **stricter** and in 534 unchanged. In 78 it is more permissive, and every one of those 78
  is exactly the intended swap: a state reading `review_outcome: complete_verified` that the
  old gate rejected. No other input became more permissive.

Rejected: keeping `passed` and changing `Gptgame` instead. It would have propagated a value
neither protocol defines into a second repository.

## `validate-protocol.mjs` accepts any ancestor revision, not only `origin/main`

The verified-main-context check accepted `origin/main`, plus `HEAD^` only when `HEAD`
happened to *be* `origin/main`. The state legitimately lags main by one commit — it names the
revision it was verified against — so that allowance was necessary, but keying it on standing
exactly on main meant **the check failed on every feature branch**, including in
`quality-floor.yml`, which runs on pull requests. The state named a perfectly good ancestor
and the gate rejected it.

It now requires that at least one 40-hex revision named in the state be an ancestor of `HEAD`.
That still rejects a fabricated or future SHA — the case the check exists for, and one the
self-test exercises by rewriting every recorded revision to zeros — and stops rejecting honest
branch work.

Found by the new `--selftest` control, which the old file had no equivalent of. Verified both
ways: the validator now passes on this branch and still passes at `origin/main`, and before
the fix the old and new implementations produced byte-identical output in both places.

## Active objective

- The user’s 2026-08-01 open-world RPG requirement supersedes the STARTHREAD arena format and its Canvas 2D / one-finger tether product-direction decisions.
- Preserve relative GitHub Pages compatibility, locally bundled runtime dependencies, deterministic test-only controls restricted to loopback hosts, save safety, and the verified mobile lifecycle principles from PR #3.
- Three.js 0.185.1 is the exact locally bundled runtime. Published r3 on product main `078796e` is the remote known good and keeps relative Pages paths, loopback-only test injection, deterministic state machines, and a strict structural mobile budget.
- The user-requested 20-round checkpoint is represented by exactly 20 implementation commits. Release metadata, evidence reconciliation, remote merge, and public verification are delivery work and do not add implementation rounds.
- The user explicitly authorized publishing the r3 source together with all `AI_DEVELOPMENT` planning, constraints, and verification records to the public `bachikoljunior-blip/Q` repository; PR 11 performed that delivery without changing open PR 3.

## Historical STARTHREAD baseline

- Use Canvas 2D and project-authored geometry/audio for fast mobile loading and zero media-license risk.
- Use one-finger gravity tethering instead of a virtual joystick: holding places a gravity well, the tether damages enemies, and releasing preserves momentum.
- Finish a dense eight-rift run with two bosses rather than create an unfinished broad game.
- Use relative paths throughout for GitHub Pages project-subpath compatibility.
- Expose state controls only on loopback hosts with `?test=1`; the public Pages hostname cannot create them.
