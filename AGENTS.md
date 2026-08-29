# AGENTS.md — Q project operating contract

## Source of truth
1. `PROJECT_STATE.md`
2. `DECISIONS.md`
3. Current experiment file under `experiments/`
4. Current research under `research/`

Conversation memory is secondary.

## User communication rule
The user has explicitly required:
- Do not drip-feed plans.
- Do not end with “next I will”.
- Do not ask again for facts already stored.
- Complete every safe action available in the current session before replying.
- Reply once, after execution.

## Product-selection gate
Never build because an idea is easy, automatic, or novel-sounding.

Before implementation, prove:
1. People currently pay to solve the problem.
2. The pain affects money, deadlines, compliance, or recurring labor.
3. Free alternatives do not fully solve the selected wedge.
4. A realistic acquisition path exists.
5. The service can be self-serve.
6. Unit economics can reach at least ¥200k/month.

## Same-cycle correction
When a weakness is found:
- stop the weak path,
- research the replacement,
- execute the replacement where possible,
- run checks,
- update state,
- then report.

Do not request a fresh confirmation for work already authorized.

## Safety and truthfulness
- Never guarantee income, eligibility, reimbursement, legal compliance, tax treatment, or platform approval.
- Prefer deterministic checks over AI where rules are enough.
- Show uncertainty and source dates.
- Do not automate claims or actions that could create duplicate/invalid platform submissions without an explicit safe design.

## Current experiment
Read `PROJECT_STATE.md`. EXP001–003 are closed. Do not revive them.
