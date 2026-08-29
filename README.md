# Q — zero-touch income project

目標: **手取り月20万円以上を、本人の継続労働への依存を小さくして構築する。**

現在の無料反証テストは `EXP004 — Amazon.co.jp FBA補てん原価監査`。
課金本命ではなく、実ファイル利用・支払意思・国内競合との差を検証する段階。

## Public app
https://bachikoljunior-blip.github.io/Q/

## Resume order
1. [`AGENTS.md`](AGENTS.md)
2. [`PROJECT_STATE.md`](PROJECT_STATE.md)
3. [`DECISIONS.md`](DECISIONS.md)
4. [`experiments/EXP004_FBA_REIMBURSEMENT_COST_AUDIT.md`](experiments/EXP004_FBA_REIMBURSEMENT_COST_AUDIT.md)
5. [`research/PAID_PAIN_SCORECARD_2026-08-29.md`](research/PAID_PAIN_SCORECARD_2026-08-29.md)

## Product
The browser app reads:
- Amazon FBA reimbursements CSV/TSV/TXT
- Seller sourcing-cost CSV

It detects:
- potential cost-basis under-reimbursement
- missing cost records
- inconsistent valuations
- estimated 60-day re-evaluation deadline
- reversals
- records requiring reason review

It exports a flagged CSV and Japanese re-evaluation draft.

## Competition
Direct and adjacent alternatives already exist: Amazon's official portal, Japanese managed recovery services, global self-service tools, and domestic Amazon management software. EXP004 is testing only the no-login, browser-local, small-seller Japanese workflow.

## Privacy
Uploaded report contents and costs are processed in the browser and are not sent to this project's server. Only anonymous event counts are used for validation.

## Important
This is a diagnostic experiment, not an Amazon claim-filing service. It does not guarantee eligibility, reimbursement, deadline, or recovery amount. No payment, SP-API, AI/OCR, or automatic filing is built before validation gates pass.
