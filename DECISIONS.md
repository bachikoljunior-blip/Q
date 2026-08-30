# DECISIONS

## 2026-08-25 — Q is the source of truth
GitHub repository `bachikoljunior-blip/Q` is the persistent project memory. Existing unrelated content may be discarded.

## 2026-08-25 — Investment is not the initial engine
With ¥0–100k/month of new capital, financial investments cannot reach the target quickly enough. Build scalable business income first and invest profits later.

## 2026-08-25 — Zero-touch is non-negotiable
No primary strategy based on calls, meetings, direct sales, interviews, or customer-specific delivery. Customer count must not linearly increase the owner's work.

## 2026-08-27 — Kill EXP001
High-ticket individualized AI service violates the zero-touch constraint.

## 2026-08-29 — Kill EXP002
“つづきから” is mostly deterministic template filling, has strong free substitutes, and lacks recurring-payment necessity.

## 2026-08-29 — Kill EXP003
Subtitle/SRT preflight, auto-fix, AI proofreading, and NLE integration already have numerous free and paid competitors. Market demand exists, but there is no defensible wedge.

## 2026-08-29 — Permanent action-first response rule
The user should never have to repeat “do the work in the same answer.” When a flaw is discovered, complete stop/change/research/check/state update before responding.

## 2026-08-29 — Select EXP004 for falsification testing
A browser-local Amazon.co.jp FBA reimbursement cost audit was built as a free test, not a paid-product commitment.

## 2026-08-30 — Kill EXP004
**Decision:** Stop EXP004 immediately. Do not wait for 100 visitors, add paid features, market it, or revive it without new evidence.

**Reason:** ReimburseOps already provides nearly the same buyer workflow and commercial model: reimbursement CSV + sourcing-cost CSV, automatic mapping, missing cost, under-reimbursement rules, inconsistent valuation, no Amazon login/API keys, no success fee, export/case text/alerts, and flat monthly pricing.

The remaining localization/privacy differences are insufficient without measured willingness to switch or prepay. EXP004 had no external usage evidence at closure.

## 2026-08-30 — Exact workflow duplicate veto is mandatory
No product implementation until `research/PREBUILD_GATE.md` passes and `research/ACTIVE_CANDIDATE.json` has `build_approved=true`.

Required:
- exact buyer/input/processing/output/price definition
- at least 12 Japanese/English searches
- at least 5 closest paid products/direct competitors and 5 substitutes
- workflow overlap matrix
- acquisition evidence
- unit economics
- differentiator evidence

Reject by default when an existing product overlaps 70%+, free/OSS/first-party tools deliver the main outcome, or differences are only Japanese localization, lower price, browser-local processing or no login.

## 2026-08-30 — Use truthful product status labels
Ideas and research are not products. Every status must be one of:
`NO_ACTIVE_CANDIDATE`, `RESEARCH_ONLY`, `OFFER_TEST`, `BUILD_APPROVED`, `LIVE_FREE_MVP`, `LIVE_PAID_PRODUCT`, `CLOSED`.

## 2026-08-30 — Distribution-first discovery
Candidate search begins in paid app/plugin marketplaces or other channels with visible demand and acquisition, not from an easy-to-build feature. If no candidate passes the gate, no build is the correct decision.

## 2026-08-30 — Hard-pause the existing automated YouTube finance persona
**Decision:** Stop generation, upload, scheduling and optimization for the current `bachikoljunior-blip/youtube` tactic. Preserve analytics and existing data.

**Reason:** Current official YouTube monetization policy disallows AI personas presenting themselves as human experts on sensitive topics including finances and legal issues. The channel configuration uses a synthetic “former corporate accounting/HR” persona for money, tax and career guidance, plus an automated template pipeline.

**Execution:** marker, code guard, Claude hooks and CI were added in the YouTube repository. Resume requires a non-sensitive/non-impersonating, materially varied format reviewed against the then-current policy.

## 2026-08-30 — Track security practical voice trainer as RESEARCH_ONLY
**Decision:** Investigate `SECURITY_PRACTICAL_VOICE_TRAINER` without building or publishing an offer.

**Evidence at entry:** paid academic exam apps, paid textbooks, courses and practical DVDs proved spending on security-certification preparation. Existing apps mainly covered academic questions and some explicitly excluded practical training.

**Required before advancement:** direct practical/oral demand, usable/current rubrics, qualified content review, acquisition evidence and take-home economics.

## 2026-08-30 — Kill SECURITY_PRACTICAL_VOICE_TRAINER
**Decision:** Close the lead before prototype, landing page, preorder or App Store spending. Return to `NO_ACTIVE_CANDIDATE`.

**Reasons:**
- FY2025 traffic-guidance level-2 special courses had 6,489 attendees
- at a hypothetical ¥2,980 one-time price and 15% App Store commission, ¥2.4M/year before tax and all other costs requires about 948 sales/year or 79/month
- that is about 14.6% of the entire annual relevant cohort; the earlier 816-sales estimate did not meet the take-home target
- ten repeated target-buyer complaints for solo, speech-scored practical/oral practice were not found
- no complete, legally usable, current practical rubric was secured
- part of the practical examination changed in 2026, creating continuing qualified-review burden
- speech recognition cannot validate the physical performance being examined
- App Store demand/CAC for practical preparation remained unmeasured

Detailed record: `research/SECURITY_PRACTICAL_VOICE_TRAINER_2026-08-30.md`.

## 2026-08-30 — Automate marketplace discovery, never marketplace approval
**Decision:** Use public marketplace scanners to surface demand/complaint signals, but prohibit them from approving a build.

**Execution:** WordPress listing scan, relevance filter, support/review miner, Japanese App Store scan and cross-source queue were added under `research/tools/`.

Atlassian Marketplace is marked manual-only because its V2 search API was retired. Missing automatic coverage must not be represented as completed research.

## 2026-08-30 — Reject current marketplace complaint clusters
**Decision:** Do not promote any current scanner cluster into `ACTIVE_CANDIDATE`.

Rejected exact/adjacent workflows:
- WooCommerce invoice numbering/missing-PDF audit
- booking/checkout synthetic canary
- WooCommerce tax auditor
- accessibility regression monitor
- CSV import/export integrity monitor
- generic checkout/store-health monitoring

Detailed record: `research/MARKETPLACE_COMPLAINT_TRIAGE_2026-08-30.md`.

## 2026-08-30 — Research status is machine-enforced
`scripts/check_prebuild_gate.py` requires even a research-only lead to include an exact workflow, 12 searches, substitutes, evidence, economics and kill criteria. Build approval requires structured competitor buyer/input/process/output/price records and overlap percentages. A 70%+ overlap cannot pass without external override evidence.

## 2026-08-30 — Kill JIRA_AUTOMATION_GUARD after exact competitor discovery
**Decision:** Close the Jira Automation Guard free MVP and remove all executable/public experiment artifacts.

**Reason:** `ajat` already provides Jira Automation rule JSON export, local snapshots/diff, CI drift detection, inventory/risk/workflow reports and readable runbooks. This invalidates the earlier duplicate-veto PASS.

**Execution:**
- product code and public MVP removed
- build/approval/finalize/indexing/metrics/tracking/hardening workflows removed
- publisher/state/metrics/tracking scripts removed
- tests removed
- automatic research-candidate re-promotion removed
- archival decision record retained

A closed candidate must not retain automation capable of rebuilding, publishing, measuring or re-approving it.

## 2026-08-30 — Completion-before-response is a machine-enforced invariant
**Decision:** The user must never need to repeat the instruction to finish executable work before answering.

**Rules:**
- a final answer is forbidden while a safe material action remains
- every current-cycle task must terminate as `DONE`, `REJECTED` or `BLOCKED_EXTERNAL`
- finding a flaw creates same-cycle cleanup, competitor search, repair, state update and retest work
- `NO_ACTIVE_CANDIDATE` does not permit stopping while an unreviewed material batch or repository inconsistency remains
- only facts genuinely requiring a third party/account/event may be external blockers

**Execution:**
- added `execution/CURRENT_WORK.json`
- added `scripts/check_execution_contract.py`
- integrated the contract into governance, research, status-sync and full-validation CI
- updated `AGENTS.md` and `scripts/sync_status_docs.py` so the invariant survives future status synchronization

## 2026-08-30 — One writer per generated evidence namespace
**Decision:** Generated research data must have one canonical writer.

Two workflows were writing `research/marketplace_scan/latest.json` with incompatible schemas, causing governance failures and unreliable state. The conflicting workflow/scanner was deleted. `.github/workflows/marketplace_scan.yml` is now the only writer and produces schema v2.

## 2026-08-30 — Reject the complete current candidate batch before build
**Decision:** Keep `NO_ACTIVE_CANDIDATE`; do not create an offer, LP, payment or MVP from the current queue.

Rejected:
- Jira permission drift/access reviews
- Jira audit retention/evidence vaults
- Confluence owner/expiry/attestation
- Confluence external-user offboarding/access reports
- WooCommerce webhook retry/replay
- WordPress staging-production settings diff
- WordPress update-impact preflight
- Figma Japanese typography/kinsoku QA
- shift/pay backup and payslip mismatch

Reasons were exact paid competition, free/first-party substitutes, same outcome already supplied, insufficient repeated exact pain/acquisition, or zero-touch-incompatible legal/schema/support burden.

Detailed record: `research/BATCH_VETO_2026-08-30.md`.

Current status: `NO_ACTIVE_CANDIDATE`, `build_approved=false`, product files 0, revenue ¥0.
