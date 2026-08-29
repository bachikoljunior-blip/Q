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
The user should never have to repeat “do the work in the same answer.”
When a flaw is discovered, complete stop/change/research/implementation/check/state update before the response.

## 2026-08-29 — Select EXP004: Amazon.co.jp FBA reimbursement cost audit
**Decision:** Test a browser-local self-service audit for small Japanese FBA sellers.

**Evidence:**
- Amazon changed pre-order lost/damaged reimbursement to manufacturing/sourcing cost in 2025.
- Re-evaluation has a 60-day window.
- Japanese managed recovery services charge 25–30% of recovered funds.
- A major Japanese provider currently targets monthly sales of ¥10M+ and has paused new service onboarding.
- Global self-service software proves the workflow can be sold at a flat monthly fee.

**Wedge:**
Amazon.co.jp-specific, Japanese UI and case draft, CSV-only/no account access, local processing, immediate use by smaller sellers, transparent deterministic rules.

**Guardrail:**
This is not a claim-filing service and does not guarantee eligibility or recovery. If real-report compatibility or paid intent fails, stop before building SP-API, payments, or broader recovery engines.
