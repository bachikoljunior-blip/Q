# AGENTS.md — Q project operating contract

## Source of truth
1. `PROJECT_STATE.md`
2. `research/ACTIVE_CANDIDATE.json`
3. `research/PREBUILD_GATE.md`
4. `DECISIONS.md`
5. Current research under `research/`

Conversation memory is secondary.

## User communication rule
The user has explicitly required, repeatedly:
- Do not drip-feed plans.
- Do not end with “next I will”.
- Do not ask again for facts already stored.
- Complete every safe action available in the current session before replying.
- Reply once, after execution.

Repeating this failure is a project defect, not a communication preference.

## Status language
Use exactly one:
- `NO_ACTIVE_CANDIDATE`
- `RESEARCH_ONLY`
- `OFFER_TEST`
- `BUILD_APPROVED`
- `LIVE_FREE_MVP`
- `LIVE_PAID_PRODUCT`
- `CLOSED`

Never describe `RESEARCH_ONLY` or `OFFER_TEST` as a built product.

## Product-selection gate
Never build because an idea is easy, automatic, localized, private, cheap, or novel-sounding.

Before implementation, prove:
1. exact buyer/input/processing/output/price workflow
2. 12+ varied exact-match searches
3. 5+ direct competitors and 5+ substitutes
4. structured workflow overlap matrix
5. no 70%+ duplicate unless external override evidence exists
6. people currently pay for the result
7. pain affects money, deadlines, compliance, or recurring labor
8. free/first-party alternatives do not fully solve the selected wedge
9. a specific acquisition path exists
10. unit economics can reach take-home ¥200k without owner work scaling linearly

“Japanese”, “cheaper”, “no login”, “local processing” and “AI-powered” are not sufficient differentiators by themselves.

## Same-cycle correction
When a weakness is found:
- stop the weak path,
- research the replacement,
- execute the replacement where possible,
- run checks,
- update state,
- then report.

Do not request fresh confirmation for work already authorized.

## Repository enforcement
- `research/ACTIVE_CANDIDATE.json` is machine-checked.
- `build_approved=false` forbids implementation files under `product/`.
- `RESEARCH_ONLY` still requires 12 searches, substitutes, evidence, economics and kill criteria.
- `BUILD_APPROVED` requires structured competitor overlap percentages and economic inputs.
- Public pages must not present research or closed experiments as products.

## Existing YouTube asset
`bachikoljunior-blip/youtube` is policy-paused as of 2026-08-30.

The current automated synthetic “former accounting/HR” persona discusses finance/tax/career, while current YouTube monetization policy explicitly disallows AI personas presenting human expertise on sensitive topics. Do not restart generation, upload, scheduling or optimization for that tactic. Analytics and preservation are allowed. Resume only through the gate written in that repository's `AUTOMATION_PAUSED.md`.

## Safety and truthfulness
- Never guarantee income, eligibility, reimbursement, legal compliance, tax treatment, exam accuracy, platform approval or monetization.
- Prefer deterministic checks over AI where rules are enough.
- Show uncertainty and source dates.
- Do not automate claims, filings, exam content or platform actions that could create harmful errors without a safe design.
- Do not invent external demand, sales, qualifications, copyrighted rights or real users.

## Current experiment status
Read `PROJECT_STATE.md`. EXP001–004 are closed. The only current lead is `RESEARCH_ONLY`; it is not a product and must not be implemented before the gate passes.
