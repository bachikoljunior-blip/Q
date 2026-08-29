# EXP004 — Amazon.co.jp FBA補てん原価監査

開始: 2026-08-29  
終了: 2026-08-30  
状態: **CLOSED**

## Final decision
追加検証、集客、SEO、課金、SP-API、AI/OCR、自動申請を停止する。

公開前提のMVPはGit履歴に残すが、本命商品として扱わない。

## Why it was closed
ReimburseOpsが、同じ購入者に対してほぼ同じworkflowを既に有料提供していることを確認した。

重複:
- FBA reimbursement CSV
- sourcing-cost CSV
- automatic field mapping
- missing cost
- under-reimbursed: payout < 90% × sourcing cost × quantity
- same-item/event valuation inconsistency
- landed-cost warning
- no Amazon login / no API keys
- no success fee
- prioritized export / case-ready text
- 60-day alerts
- flat monthly subscription

今回の差は、Amazon.co.jp向け日本語、円、日本語下書き、browser-local処理、小規模セラー向け即利用だった。しかし、同じ成果を買う理由として外部証拠がなく、月額課金の必然性を作れない。

## Evidence at closure
- external unique visitors: 0
- audits: 0
- exports/case actions: 0
- monthly-interest: 0
- real Amazon.co.jp report compatibility: unverified
- actual recovered amount: unverified

## Learning
「市場に有料商品がある」はbuild許可ではない。入力→処理→出力→価格モデルまで同じ商品を先に探す必要がある。

Localization, privacy, no-login and lower price are not sufficient differentiators unless users prepay, explicitly switch, or repeatedly complain about that missing difference.

## Revisit condition
Only reopen if all are true:
1. `research/PREBUILD_GATE.md` is rerun from zero.
2. At least 5 current users of direct competitors show measurable switching intent for a specific unresolved difference, or 5 paid preorders exist.
3. The exact-workflow duplicate veto passes.

Otherwise do not revive EXP004.
