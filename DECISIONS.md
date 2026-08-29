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

**Reason:** ReimburseOps already provides nearly the same buyer workflow and commercial model:
- reimbursement CSV + sourcing-cost CSV
- automatic mapping
- missing cost
- payout below 90% of sourcing cost × quantity
- inconsistent valuation
- landed-cost warning
- no Amazon login/API keys
- no success fee
- export/case text/60-day alerts
- flat monthly pricing

The remaining localization/privacy differences are insufficient without measured willingness to switch or prepay. EXP004 also had zero external usage evidence at closure.

## 2026-08-30 — Exact workflow duplicate veto is mandatory
**Decision:** No fifth product implementation until `research/PREBUILD_GATE.md` passes and `research/ACTIVE_CANDIDATE.json` has `build_approved=true`.

**Required:**
- exact buyer/input/processing/output/price definition
- at least 12 Japanese/English searches
- at least 5 direct competitors and 5 substitutes
- workflow overlap matrix
- acquisition evidence
- unit economics
- differentiator evidence

**Reject by default:**
- an existing product overlaps 70%+ of the workflow
- free/OSS/first-party tools deliver the main outcome
- the only differences are Japanese localization, lower price, browser-local processing or no login

The veto can be overridden only by external evidence for the unresolved difference: paid preorders, qualified current spenders with switching intent, repeated public complaints, or measured owned distribution.

## 2026-08-30 — Use truthful product status labels
Ideas and research are not products. Every status must be one of:
`NO_ACTIVE_CANDIDATE`, `RESEARCH_ONLY`, `OFFER_TEST`, `BUILD_APPROVED`, `LIVE_FREE_MVP`, `LIVE_PAID_PRODUCT`, `CLOSED`.

Current status: `NO_ACTIVE_CANDIDATE`.

## 2026-08-30 — Distribution-first discovery
The next candidate search starts in paid app/plugin marketplaces or other channels with visible demand and acquisition, not from an easy-to-build feature. If no candidate passes the gate, maintaining no active candidate is the correct decision.
