# AGENTS.md — Q project operating contract

## Source of truth
Read in this order:
1. `PROJECT_STATE.md`
2. `research/ACTIVE_CANDIDATE.json`
3. `research/PREBUILD_GATE.md`
4. `DECISIONS.md`
5. Current research / experiment files

Conversation memory is secondary.

## User communication rule
The user has explicitly required:
- Do not drip-feed plans.
- Do not end with “next I will”.
- Do not ask again for facts already stored.
- Complete every safe action available in the current session before replying.
- When a flaw is found, stop/change/research/check/update in the same work cycle.
- Reply once, after execution.

## Truthful status language
Always state one exact status:
- `NO_ACTIVE_CANDIDATE`
- `RESEARCH_ONLY`
- `OFFER_TEST`
- `BUILD_APPROVED`
- `LIVE_FREE_MVP`
- `LIVE_PAID_PRODUCT`
- `CLOSED`

Do not call an idea, research note, landing page or free falsification test a paid “product”.

## Exact-match competitor veto
Before implementation, follow `research/PREBUILD_GATE.md`.

Mandatory minimum:
1. Define buyer + exact input + processing + output + price model.
2. Run at least 12 Japanese/English exact-workflow searches.
3. Record at least 5 direct competitors and 5 substitutes.
4. Complete a buyer/input/processing/output/pricing overlap matrix.
5. Prove a concrete acquisition path and unit economics.

Reject the candidate when:
- an existing product overlaps at least 70% of the workflow,
- free/open-source/first-party tools provide the main outcome,
- or the only differences are Japanese localization, lower price, local processing or no login.

A duplicate veto may be overridden only by evidence for the unresolved difference: paid preorders, qualified current spenders with switching intent, repeated public complaints, or measured owned distribution. “Market exists” is not product validation.

## Repository enforcement
- `research/ACTIVE_CANDIDATE.json` is the machine-readable build decision.
- New product code must be placed under `product/`.
- Do not create files under `product/` while `build_approved=false`.
- Research automation belongs under `research/tools/`.
- Do not publish a new landing page until status is at least `OFFER_TEST`.

## Same-cycle correction
When a weakness is found:
- stop the weak path,
- search exact competitors,
- reject or revise,
- execute all safe work still possible,
- run checks,
- update state,
- then report.

Do not request fresh confirmation for work already authorized.

## Safety and truthfulness
- Never guarantee income, eligibility, reimbursement, legal compliance, tax treatment or platform approval.
- Prefer deterministic checks over AI where rules are enough.
- Show uncertainty and source dates.
- Do not automate claims or actions that could create duplicate/invalid submissions without an explicit safe design.

## Closed experiments
EXP001, EXP002, EXP003 and EXP004 are closed. Do not revive them without new external evidence that passes the full gate.

## Current status
Read `PROJECT_STATE.md`. There is currently no active product candidate.
