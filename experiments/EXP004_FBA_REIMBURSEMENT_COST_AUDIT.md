# EXP004 — Amazon.co.jp FBA補てん原価監査

開始: 2026-08-29
状態: **FREE FALSIFICATION TEST — 課金本命未確定**

## Problem
FBA補てんが自動化されても、Amazonが適用した製造/仕入原価が出品者の実原価より低い可能性がある。
評価額の再評価は補てん後60日以内。定期監査しないと差額候補を確認する窓を失う可能性がある。

## Target
- Amazon.co.jpでFBAを利用
- 月商1,000万円未満を含む小〜中規模セラー
- 成功報酬25〜30%や面談/権限付与を避けたい
- 自分でSeller Centralに申請できる
- SKU/FNSKU/ASINごとの原価表を持っている

## Current MVP
Browser-only deterministic audit:
1. Reimbursements report upload
2. Sourcing-cost CSV upload
3. Quoted CSV/TSV parser
4. Japanese/English header auto-detection and manual mapping
5. Conservative reason classification
6. Under-reimbursement candidate calculation
7. Missing cost
8. Same-key valuation inconsistency
9. Estimated 60-day deadline
10. Reversal separation
11. Outbound/customer-return/unknown reason separation
12. Flagged CSV and Japanese draft export
13. Cost template and sample data

## Safety rules
- Cost-basis candidate only when the reason contains both:
  - pre-order location: Warehouse / Fulfillment / Inbound / 倉庫 / 受領
  - event: Lost / Damaged / Missing / 紛失 / 破損
- Outbound, customer return, buyer/order/refund records are review-only.
- Generic “Damaged” without location is review-only.
- Negative amounts, original IDs, reversals are separated.
- No automatic claim filing.
- No eligibility or recovery guarantee.

## Direct competition — confirmed
EXP004 is not unique.

- Amazon official “Inventory Defect and Reimbursement” portal
- Picaro and Goaltech managed recovery services in Japan
- ReimburseOps and ReimbursementPro self-service/global tools
- マカド！ includes detection of missed refunds/compensation

The remaining wedge is only the combination:
- Amazon.co.jp Japanese UX
- no login / no SP-API
- uploaded files remain in browser
- Japanese and English column mapping
- JPY and Japanese re-evaluation draft
- immediate access for small sellers
- no success fee

This may explain free usage. It does **not** yet prove monthly willingness to pay.

## Not implemented
- Amazon SP-API
- Automatic claim filing
- Email/LINE deadline notification
- Inventory ledger, returns, inbound shortage, removal reconciliation
- Evidence OCR
- Payment/auth
- Guaranteed eligibility or recovery

## Pricing hypothesis — not validated
- Lite: ¥2,980/month
- Recovery: ¥4,980/month
- Possible one-time evidence pack: ¥2,980

No payment is added until validation thresholds and real-file safety pass.

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
- real file compatibility can be fixed with safe header aliases
- zero serious false-positive incident
- users choose this despite domestic and official alternatives

FAIL/PIVOT if:
- audit rate <30%
- export rate <10%
- monthly interest <5%
- real report compatibility is poor
- official portal replaces cost-gap audit
- domestic tools provide equivalent self-service value
- policy/risk cannot be handled without human review
- average recoverable value is too small to justify price
- acquisition cannot reach the niche without individualized sales

## Build rule
No SP-API, payment, AI OCR, automated filing, or broader recovery engine until PASS.
