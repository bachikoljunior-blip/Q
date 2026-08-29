# EXP004 — Amazon.co.jp FBA補てん原価監査

開始: 2026-08-29
状態: LIVE VALIDATION

## Problem
FBA補てんが自動化されても、Amazonが適用した製造/仕入原価が出品者の実原価より低い可能性がある。
評価額の再評価は補てんから60日以内。定期監査しないと差額が失効する可能性がある。

## Target
- Amazon.co.jpでFBAを利用
- 月商1,000万円未満を含む小〜中規模セラー
- 成功報酬25〜30%や面談/権限付与を避けたい
- 自分でSeller Centralに申請できる
- 原価表を持っている

## Current MVP
Browser-only deterministic audit:
1. Reimbursements report upload
2. Sourcing-cost CSV upload
3. Header auto-detection and manual mapping
4. Cost-based reason classification
5. Under-reimbursement candidate calculation
6. Missing cost
7. Valuation inconsistency
8. 60-day deadline estimate
9. Reversal separation
10. CSV and Japanese draft export

## Not implemented
- Amazon SP-API
- Automatic claim filing
- Email/LINE deadline notification
- Inventory ledger, returns, inbound shortage, removal reconciliation
- Evidence OCR
- Payment/auth
- Guaranteed eligibility or recovery

## Wedge
- Amazon.co.jp-specific
- Japanese headers and Japanese case draft
- JPY display
- No Amazon credentials
- Files never leave browser
- Small sellers, immediate use
- Flat-price future vs. 25–30% managed service
- Transparent deterministic rules

## Pricing hypothesis
- Lite: ¥2,980/month
- Recovery: ¥4,980/month
- Possible one-time evidence pack: ¥2,980

No payment is added until validation thresholds are met.

## Validation events
- pageview
- unique-visitor
- sample-loaded
- report-loaded
- cost-loaded
- audit-run
- shortfall-found
- deadline-found
- audit-export
- claim-pack-copy
- claim-pack-download
- monthly-interest

## Gates at 100 unique devices
PASS only if:
- 30+ audits
- 10+ exports/case-pack actions
- 5+ monthly-interest
- real file compatibility can be fixed with header aliases
- zero serious false-positive incident

FAIL/PIVOT if:
- audit rate <30%
- export rate <10%
- monthly interest <5%
- official portal replaces cost-gap audit
- local competitors offer equivalent self-service
- policy/risk cannot be handled without human review
- average recoverable value is too small to justify price

## Build rule
No SP-API, payment, AI OCR, or broader recovery engine until PASS.
