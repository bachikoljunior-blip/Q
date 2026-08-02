# iPhone SE 3 round gate — 2026-08-02

## Candidate

- Repository: `bachikoljunior-blip/Q`
- Branch: `agent/round-phone-gates`
- Baseline product: main `819175f`, published release `wildbound-2026-08-01-r3`
- Target: iPhone SE (3rd generation), landscape, 667 × 375 CSS px, DPR 2

## One-round contract

A round remains incomplete until the same pull-request revision passes:

1. continuity, protocol, deterministic, DOM, payload, license, and structural-budget checks;
2. Playwright WebKit at the iPhone SE 3 landscape profile, including start, touch movement, attack, dodge, camera, pause/resume, reload persistence, bounded soak, JavaScript/network errors, and an approved screenshot baseline;
3. Appium/XCUITest on the exact iPhone SE (3rd generation) iOS Simulator and Mobile Safari, including trusted simultaneous movement plus attack, dodge, camera, pause/resume, reload persistence, bounded soak, rendering budgets, and runtime errors.

The main publication verifier repeats both browser layers before polling the GitHub Pages release identifier. A missing baseline, skipped job, cancellation, or failure blocks the round.

## Failure-path design

- The WebKit harness writes `gameplay-candidate.png` and fails if no approved baseline exists.
- The simulator selector fails unless Xcode 26.2, iOS 26.2, and the named iPhone SE 3 device are all present.
- Appium session creation has separate 300-second simulator-startup, 180-second WDA-launch, and 15-minute HTTP transport ceilings.
- The aggregate `Round complete` job fails unless both browser jobs report `success`.
- Physical GPU/FPS, heat, memory-pressure reload, real-glass multi-touch, haptics, speakers, and audio latency are not inferred from the simulator.

## Evidence status

Local YAML/syntax/state/protocol checks, nine deterministic tests, the full DOM journey, payload/license/structural checks, and a 21-check Chromium harness substitution passed. The substitution moved 31.651 world units, observed attack cooldown, spent dodge stamina, changed camera yaw by 0.7030 radians, restored the exact saved position, retained finite running state, and reported zero runtime/network failures. It validates the harness only. The approved WebKit baseline and Mobile Safari evidence must come from GitHub Actions; until both pass, this evidence remains `complete_unverified`.
