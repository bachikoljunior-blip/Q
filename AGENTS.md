# AGENTS.md — Q project operating contract

## Source of truth
Read in this order:
1. `PROJECT_STATE.md`
2. `research/ACTIVE_CANDIDATE.json`
3. `research/discovery_queue/latest.json`
4. `research/discovery_queue/reviewed_2026-08-30.json`
5. `research/CONTINUATION_CONTRACT.md`
6. `research/PREBUILD_GATE.md`
7. `execution/CURRENT_WORK.json`
8. `DECISIONS.md`
9. Current research / experiment files

Conversation memory is secondary.

## User communication rule
The user has explicitly required:
- Do not drip-feed plans.
- Do not end with “next I will”.
- Do not ask again for facts already stored.
- Complete every safe action available in the current session before replying.
- When a flaw is found, stop/change/research/check/update in the same work cycle.
- Reply once, after execution.

## Completion-before-response invariant
A final answer is forbidden while a safe material action remains.

The user must never need to repeat the completion directive.

Before a user-facing report:
1. Read the source-of-truth files and inspect the current repository, not only the conversation summary.
2. Finish, reject, or mark `BLOCKED_EXTERNAL` every material task in `execution/CURRENT_WORK.json`.
3. A flaw discovered during the cycle creates work inside the same cycle: remove the weak path, find exact competitors/substitutes, clean stale code/workflows/metrics/indexing, repair tests, update state, and rerun validation.
4. `NO_ACTIVE_CANDIDATE` is not permission to stop while an unreviewed material candidate batch or repository inconsistency remains.
5. The only valid stop boundary is a fact or action that genuinely requires an external person/account/event, such as a real purchase, measured live CAC, credentials not connected, or legally granted content rights. Record the exact boundary; do not use it to excuse unfinished internal work.
6. Do not say the project is complete when only a cleanup, research step, free MVP, or test is complete.
7. The current discovery queue SHA, row count and signal IDs must exactly match its terminal review record under `research/CONTINUATION_CONTRACT.md`.
8. Run all three before reporting completion of a cycle:

```text
python scripts/check_prebuild_gate.py
python scripts/check_continuation_contract.py
python scripts/check_execution_contract.py
```

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
`RESEARCH_ONLY` means no offer, no product, no build approval and no public claim of availability.

## Exact-match competitor veto
Before implementation, follow `research/PREBUILD_GATE.md`.

Mandatory minimum:
1. Define buyer + exact input + processing + output + price model.
2. Run at least 12 Japanese/English exact-workflow searches.
3. Record at least 5 direct/closest paid products and 5 substitutes.
4. Complete a buyer/input/processing/output/pricing overlap matrix.
5. Prove a concrete acquisition path and unit economics.

Reject the candidate when:
- an existing product overlaps at least 70% of the workflow,
- free/open-source/first-party tools provide the main outcome,
- or the only differences are Japanese localization, lower price, local processing or no login.

A duplicate veto may be overridden only by evidence for the unresolved difference: paid preorders, qualified current spenders with switching intent, repeated public complaints, or measured owned distribution. “Market exists” is not product validation.

## Research-lead veto
For `RESEARCH_ONLY`, do not preserve a lead merely because no exact competitor was found. Close it in the same work cycle when any critical input remains structurally unavailable, including:
- no legally usable/current source for the promised outcome,
- no evidence of enough reachable buyers for the economics,
- no repeated evidence for the exact unmet workflow,
- the proposed input cannot measure the promised outcome,
- qualified review creates unavoidable continuing labour,
- or distribution depends on individual outreach.

## Repository enforcement
- `research/ACTIVE_CANDIDATE.json` is the machine-readable build decision.
- `execution/CURRENT_WORK.json` is the machine-readable completion decision for the current cycle.
- `research/discovery_queue/latest.json` is the current evidence batch; `reviewed_2026-08-30.json` must cover its exact bytes and every `signal_id` before `READY_TO_REPORT`.
- New product code must be placed under `product/`.
- Do not create files under `product/` while `build_approved=false`.
- Research automation belongs under `research/tools/`.
- Do not publish a new landing page until status is at least `OFFER_TEST`.
- Public pages must not present a research lead as an available product.
- When a candidate is closed, delete its executable build/deploy/metrics/indexing automation, not only its product directory. Archival decision records may remain.
- Only one workflow may write each generated evidence namespace.

## Same-cycle correction
When a weakness is found:
- stop the weak path,
- search exact competitors and substitutes,
- apply the kill criteria,
- reject or revise,
- execute all safe work still possible,
- remove stale executable artifacts,
- run checks,
- update state,
- then report.

Do not request fresh confirmation for work already authorized.

## Safety and truthfulness
- Never guarantee income, eligibility, reimbursement, legal compliance, tax treatment or platform approval.
- Prefer deterministic checks over AI where rules are enough.
- Show uncertainty and source dates.
- Do not automate claims or actions that could create duplicate/invalid submissions without an explicit safe design.

## Closed experiments and leads
EXP001, EXP002, EXP003, EXP004, SECURITY_PRACTICAL_VOICE_TRAINER and JIRA_AUTOMATION_GUARD are closed. Do not revive them without new external evidence that passes the full gate.

## Current status
`NO_ACTIVE_CANDIDATE` — the current 90-row evidence queue has been reviewed 90/90 and produced no approved offer or build. This is not completion of the ¥200,000/month goal. Continue marketplace-first research when the queue changes; do not create a weak product.
