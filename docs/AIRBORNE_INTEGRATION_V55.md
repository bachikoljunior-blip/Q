# Airborne death integration v55 — 2026-09-16

Jumping players previously remained suspended after death because both Game.tick and main stopped the whole simulation. The adopted change continues only vertical gravity/contact through the existing 60Hz accumulator. Dead-player y, vertical velocity and grounded status may change; world time, enemies, projectiles, progression, movement input and horizontal state remain frozen. The existing once-only death penalty, death-event save and respawn contract remain. This deliberately supersedes earlier Game-unchanged claims for this narrow behavior.

Author commits `bc0d29f5a8b0a92519ae64697eb4122a909c41bc` and `19bd391b96fd63ae5a580dbfb20c7e52be6478be` were integrated on PR53 `f8ef1de5a9a3913a84c36972b0d9f74e1de464c8`. That predecessor is preserved with exact local/remote tree `8383892e13a1ee6e92e8b4a479b0d48bce32ba62` and successful required CI35079065319. PR52 audio CI35077524542 also succeeded. No earlier lost commit/test outcome is counted as fresh evidence.

## Author and independent observations

[Author evidence](AIRBORNE_DEATH_V55.md) records 18 minutes from start to evidence, including fixture rework and a required lifecycle repair. In its identical jump fixture the old root remained 1.045 m above ground after two seconds; the candidate reaches ground after approximately 0.50–0.533 seconds at 30/60/120Hz RAF. Both paths use the same fixed physics interval. This is an application/physics comparison, not rendered footage or naturalness scoring.

The [independent review](evidence/airborne-death-v55/independent/REVIEW.md) found that merely enabling dead ticks advanced falling after blur/pagehide in delivered RAF callbacks. Final main explicitly stops both dead simulation and Scene animation when focus is absent or the page is inactive, while preserving the death panel on resumption. Settings, visibility, title, dialogue and same-frame panel handling remain checked. Saving at death and loading a dead save deliberately respawns; in-memory title/continue retains its existing Game and is a different path.

The independent oracle runs real Game/main with explicit DOM/Scene/audio boundaries, tests twelve terrain/motion cases, exact living state at five dt values, three RAF rates, the actual knight lethal strike, input suppression, the existing 50ms frame clamp, saving and respawn. Its separate real Scene player-update prefix plus the accepted death-entry actor samples eighteen weapon/terrain/ascent cases over 72 consecutive 60Hz frames. No visible vertex penetrates the sampled ground; minimum clearance is +0.653821 mm and settled minimum +6 mm. Old final visible minimum gaps remain 109.43–924.77 mm in these cases. Triangle interiors, all world locations, self-contact, actual WebGL, browser scheduling and device performance are not established.

## Fresh integrated artifacts

All 27 required commands and 338 tests passed in 134.0054817900018 seconds; the optional standalone generator and two tests also passed. [Logs](evidence/airborne-integration-v55/validation/validation.json) and [hash/size metadata](evidence/airborne-integration-v55/integration.json) preserve the exact conditions.

Fixed stage `artifacts/site-GTGKC5`: 34 files /14,037,344 B. Initial JS is165,611 B /three chunks (+196 B against PR53), total JS1,085,938 B. All27 media /12,883,257 B remain byte-identical to PR53. Source fingerprint `sha256:d20e1ad8fea6b9f845c77064319215e6b25a1105bbf2d539198eaff546774271`, receipt SHA256 `0cf75d304156e5e6e0d13963af83d20495c78221f947eaf208544b2108a26140`. Optional HTML17,310,016 B, SHA256 `2200e11be15cffc013619f6f8fd759526bbdec3a0be405363b2b3345c1c01757`. The existing explicit166,000 B regression guard and all other artifact gates pass; no threshold changed in this unit.

## Rejected body candidate and method decision

The [Mira body study](BODY_RECOVERY_V54.md), its complete independent evidence and exact final-source patch are retained for reproducibility. **No candidate body runtime is adopted.** Actual conversation-camera/native triangle occlusion measures only0.02069px maximum visible torso displacement and1.313px sleeve displacement, while triangle contact pairs shift and some stress conditions worsen. A source anatomy change alone is therefore inadequate evidence of a visible improvement. The rejected source can be reconstructed from `docs/evidence/body-recovery-v54/rejected-final-source.patch.base64` (base64 decode before git apply; exact original patch bytes are hashed in REJECTION.json) against its recorded base; it is never imported by the game.

The next finite comparison selects visible character material/shape work from actual conversation framing and exposed surfaces, considering source-image content, UV compatibility, legal provenance, decoded memory and screen-scale detail. It does not assume added polygons/texels improve the screen. Native-score material quality and GPU/CPU/rendering/listening remain separately unverified.

## Delivery and remaining quality evidence

[Read-only merge diagnosis](evidence/merge-diagnosis-v56/DIAGNOSIS.md) records seven official GETs. PR39 is open/unmerged, clean and head checks succeed; branch protection/rules, draft and merge queue do not explain the stall. This does not prove the old timed-out synchronous worker ended or its lock was released. No operation UUID/status/cancel capability is exposed for that request. Starting async merge to obtain a UUID would be a new mutation and was not attempted. The absence of repository protection does not weaken the user's normal-PR/required-CI contract.

Actual main remains `547676fdce8d8e97abed9f065aad0b6e24af2fd6`; owner-only Site23 remains source `f11819aceea515d166846e4bf85082bf2e51e9d1`. No new merge request, feature merge, force push, new Site or unmerged deployment occurred. Preserve this exact unit in the stack and retarget/recheck/merge in predecessor order only when actual main progresses.

September20 whole-screen PS4 completion remains unproven: official preview's supervisor mailbox is still unavailable; actual screen/touch/listening/device/reference comparison and delivery are unresolved. The separate fixes and test counts are not completion evidence. Continue finite useful production without a human-preparation prerequisite or claiming a stopped agent runs in the background.
