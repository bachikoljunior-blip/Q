# Q — zero-touch income project

目標: **本人の継続労働への依存を小さくし、手取り月20万円以上を構築する。**

## Current status
**`NO_ACTIVE_CANDIDATE`**

現在、商品として開発承認された案はありません。

EXP001〜004は終了しました。EXP004は、既存のReimburseOpsとbuyer・入力・判定ルール・出力・料金モデルがほぼ同一だったため、追加検証を待たず停止しました。

## Resume order
1. [`AGENTS.md`](AGENTS.md)
2. [`PROJECT_STATE.md`](PROJECT_STATE.md)
3. [`research/ACTIVE_CANDIDATE.json`](research/ACTIVE_CANDIDATE.json)
4. [`research/PREBUILD_GATE.md`](research/PREBUILD_GATE.md)
5. [`DECISIONS.md`](DECISIONS.md)
6. [`research/EXACT_MATCH_SWEEP_2026-08-30.md`](research/EXACT_MATCH_SWEEP_2026-08-30.md)

## Build rule
次の新商品コードは `product/` 配下にだけ作ります。

`research/ACTIVE_CANDIDATE.json` の `build_approved` が `true` になるまで、`product/` へ実装しません。

承認には、最低12検索、直接競合5件、代替5件、workflow overlap matrix、具体的な集客証拠、単価計算、未解決差への外部証拠が必要です。

## Closed experiments
- EXP001: individualized AI service — zero-touch違反
- EXP002: AI handoff template — 無料代替・課金理由不足
- EXP003: subtitle preflight — 直接競合多数
- EXP004: FBA reimbursement cost audit — exact workflow competitorあり

## Public page
GitHub Pagesは、現在「公開中の商品なし」と表示します。終了した実験を現行商品として宣伝しません。
