# The iPhone SE 3 round

Two tiers of automated phone testing, plus the comparison step that turns them into a round.

## Where each tier stands in this repository

| Tier | What it proves | Where it lives here | Status |
|---|---|---|---|
| 1 — Playwright WebKit, ubuntu | 667×375 landscape, DPR 2, touch, Mobile Safari UA, interaction, persistence, screenshot diff | `tools/test-iphone-webkit.mjs` | **still on a branch** — PR #13 |
| 2 — iPhone SE 3 simulator + Appium, macOS | the same paths in real iOS Safari with trusted multi-touch | `tools/test-ios-safari.mjs` | **still on a branch** — PR #13 |
| 3 — round comparison | that this round is not **worse** than the last one | `.kit/tools/compare-round.mjs` + `iphone-se3-round.config.json`, run by `.github/workflows/iphone-se3-round.yml` | added on `main` |

Tier 3 was added **without touching a single file PR #13 changes**, so it merges with it.

## The gap PR #13 leaves, measured rather than assumed

The harness on that branch records **no timing and no frame data at all** — no boot
measurement, no `requestAnimationFrame` sampling, no soak block. It is a pass/fail and
screenshot-diff gate.

Pointed at a report of that shape, this comparison passed on the screenshot diff alone: one
metric, and not one of the two a round is actually for. So `timings.bootMs`,
`soak.medianFrameGapMs` and `soak.p95FrameGapMs` are declared `required` in the config, and
the round now reports `INCOMPARABLE`, naming each missing measurement, until the harness
records them:

```
! required metric bootMs (timings.bootMs) is absent from this round
! required metric medianFrameGapMs (soak.medianFrameGapMs) is absent from this round
! required metric p95FrameGapMs (soak.p95FrameGapMs) is absent from this round
```

Two additions close it, both of which `Gptgame` and `survival` already have:

1. wrap the boot wait in `Date.now()` and write the elapsed milliseconds to `timings.bootMs`;
2. sample `requestAnimationFrame` gaps across a few seconds of automated play and write
   `soak.medianFrameGapMs`, `soak.p95FrameGapMs` and `soak.samples`.

Those paths are already declared. They start being compared the moment they exist, with no
change to the config.

## Running one round, once the harness is on `main`

```bash
npm run test:iphone-webkit      # (added by PR #13)
node .kit/tools/compare-round.mjs --config=iphone-se3-round.config.json
node .kit/tools/compare-round.mjs --selftest   # watch every refusal fire on a broken round
```

The one-line `package.json` script was left alone on purpose, because PR #13 edits that same
block. Add it after the merge:

```json
"round:iphone": "npm run test:iphone-webkit && node .kit/tools/compare-round.mjs --config=iphone-se3-round.config.json",
```

First round: `--bootstrap` records the bar instead of judging against one, then commit
`tests/baselines/iphone-se3-round.json`. When a round is slower on purpose, `--accept` records
that decision rather than silencing it.

## What the comparison refuses to do

Each refusal is a failure already on record across these repositories:

- **Compare a round against itself** — a sibling repository shipped an equivalence battery
  that compared its validator against its own output and passed vacuously.
- **Treat a metric that vanished as a metric that passed** — this repository's own
  `floor-gates.mjs` already carries a deliberate-failure mode for exactly this reason.
- **Accept byte-identical timings as a new measurement** — if every metric matches, the report
  was copied, not re-measured.
- **Score a failed run** — a harness that aborted at step three reports a very fast boot.
- **Return a pass when nothing was compared.**

All of them fire on a deliberately broken round under `--selftest`, alongside a must-pass
control, and the workflow runs that proof before it runs the gate.

## What none of this is evidence for

Playwright reproduces the viewport, DPR, touch emulation and user agent of an iPhone SE 3, and
none of its performance: measured in the same container, `survival`'s harness under the
SwiftShader surrogate reported a **1333 ms median frame gap — 0.75 FPS**. The simulator tier
is real iOS and real Safari, but still a Mac.

Neither tier may be cited for sustained 30 FPS on the device, thermal throttling, memory
pressure causing a Safari tab reload, GPU load, real-glass multi-touch, or audio latency.
Those need the physical phone. The comparison exists precisely because the absolute number is
unavailable and the relative one is not.
