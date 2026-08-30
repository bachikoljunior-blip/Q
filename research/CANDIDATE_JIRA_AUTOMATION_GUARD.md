# CANDIDATE REVIEW — Jira Automation Guard

最終更新: 2026-08-30  
判定: **CLOSED — EXACT COMPETITOR VETO**

## Decision

Jira Automation Guard は実装・公開・有料化を停止する。2026-08-30の再検索で、2026年に公開された `ajat` が候補の主要成果を既に商用提供していることを確認したため、`PREBUILD_GATE` の duplicate veto に抵触した。

## Candidate workflow

`Jira Cloud管理者/導入支援会社がAutomation rule exportを取り込む → ruleを比較・監査・可読化する → 差分、リスク、参照、運用/移行用レポートを得る`

## Newly confirmed exact/near-exact paid competitor

`ajat` (Atlassian Jira Automation Tool / Climakers) は2026年時点で以下を提供している。

- Jira Automation ruleをJSONへexport
- local export snapshotをcredentialなしで比較する `diff`
- inventory / collision / consistency / risk / workflow の5種のself-contained HTML report
- workflowをstep-by-step runbook/flow diagramへ可読化
- external integration/data-egress、ownership、stale/high-frequency/complexity等のrisk検査
- CI drift gate
- backup/restore/promotion/bulk operations
- 14-day trial、paid plans from €99.99

Atlassian自身もAutomation rules/flowsのJSON export/importを標準提供し、instance固有のStatuses / Issue types / Fields / custom fieldsが移行時に正しくmapされない可能性を明記している。つまり候補が狙ったbuyer、input、migration/review painは実在するが、主要成果は既存商用品で既にカバーされている。

## Why the previous PASS was wrong

以前のdeep diveはRevyz/Rewind/Salto等の広いconfiguration backup/migration製品を中心に比較し、`ajat` のようなJira Automation専用のexport/diff/report/governance製品を取り逃がした。そのため「70%以上のexact workflow重複0件」という結論は無効。

候補の差として残るのは、browser-only、credential不要、無料、Markdown、secret-like key/hard-coded IDの個別表示など。しかし `PREBUILD_GATE` は「local processing / lower price / no login」だけを十分な差と認めない。`ajat` はlocal snapshot diffとoffline reportを既に提供するため、主要な購入成果の重複が大きい。

## Executed shutdown

- `product/jira-automation-guard/` の実装ファイルを削除
- 新規決済・Stripe商品は作成しない
- Forge / Atlassian Marketplace申請をしない
- candidateを再開するには、現行競合利用者の明確な乗換意思/前払い等のoverride evidenceが必要

## Status

`CLOSED`

この案を「無料MVPだから」と残さない。既存有料競合が同じbuyerの主要成果を提供している以上、月20万円のzero-touch事業候補として追加投資しない。
