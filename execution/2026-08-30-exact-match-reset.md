# 2026-08-30 — exact-match reset

## Trigger
EXP004について、ReimburseOpsがほぼ同じ商品workflowを既に提供していることが確認された。ユーザーから、同じ種類の後追い指摘を二度と要求させないよう求められた。

## Executed
1. ReimburseOpsのbuyer/input/processing/output/pricingをEXP004と比較。
2. overlap 90%超と判定し、100訪問の検証を待たずEXP004を終了。
3. FBA以外もexact-match検索:
   - Amazon flat-file修復
   - Shopify CSV修復
   - 楽天RMS CSV編集/変換
   - AI YouTube完全自動投稿
   - Amazon settlement/COGS照合
4. いずれも直接競合複数を確認し、5案目を実装しなかった。
5. `research/EXACT_MATCH_SWEEP_2026-08-30.md` を追加。
6. `research/PREBUILD_GATE.md` を追加。
7. `research/ACTIVE_CANDIDATE.json` を `NO_ACTIVE_CANDIDATE / build_approved=false` で追加。
8. `AGENTS.md` にexact-match veto、status language、product/制限を固定。
9. `PROJECT_STATE.md`, `DECISIONS.md`, `START_HERE.md`, `README.md`, `INCOME20_PROJECT.md`, EXP004ログを更新。
10. 公開トップを「現在、公開中の商品なし」へ変更し、noindex化。
11. robotsを全拒否、sitemapから終了実験URLを除去。
12. IndexNowとEXP004日次メトリクスworkflowを削除。
13. `scripts/check_prebuild_gate.py` とGitHub Actionsのgovernance gateを追加。

## New enforced rule
`research/ACTIVE_CANDIDATE.json` の `build_approved=true` なしに、`product/` へ新規商品コードを置けない。

Build approval requires:
- exact workflow
- 12+ searches
- 5+ direct competitors
- 5+ substitutes
- overlap matrix
- duplicate veto PASS
- differentiator evidence
- acquisition evidence
- economics
- kill criteria

## Current result
**NO_ACTIVE_CANDIDATE**

これは保留表現ではない。重複案を作らないというGateの正しい結果。
