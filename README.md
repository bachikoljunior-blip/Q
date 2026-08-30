# Q — zero-touch income project

目標: **本人の継続労働への依存を小さくし、手取り月20万円以上を構築する。**

## Current status
**`NO_ACTIVE_CANDIDATE`**

現在、商品として開発承認された案、公開中の商品、販売中の商品はありません。

EXP001〜004と、`SECURITY_PRACTICAL_VOICE_TRAINER` は終了しました。弱い案を商品扱いせず、exact workflow・需要・差別化・集客・手取り採算を満たす案だけを次へ進めます。

## Resume order
1. [`AGENTS.md`](AGENTS.md)
2. [`PROJECT_STATE.md`](PROJECT_STATE.md)
3. [`research/ACTIVE_CANDIDATE.json`](research/ACTIVE_CANDIDATE.json)
4. [`research/PREBUILD_GATE.md`](research/PREBUILD_GATE.md)
5. [`research/MARKETPLACE_COMPLAINT_TRIAGE_2026-08-30.md`](research/MARKETPLACE_COMPLAINT_TRIAGE_2026-08-30.md)
6. [`DECISIONS.md`](DECISIONS.md)

## Build rule
次の新商品コードは `product/` 配下にだけ作ります。

`research/ACTIVE_CANDIDATE.json` の `build_approved` が `true` になるまで、`product/` へ実装しません。

承認には、最低12検索、直接競合5件、代替5件、workflow overlap matrix、具体的な集客証拠、手取りベースの単価計算、未解決差への外部証拠が必要です。

## Marketplace discovery
自動化済み:
- WordPress.org listing scan
- relevance filter
- public support/review complaint-title miner
- weekly/manual/push GitHub Action

Generated evidence:
- `research/marketplace_scan/latest.*`
- `research/marketplace_scan/shortlist.*`
- `research/marketplace_scan/complaints.*`

These files are discovery evidence only and can never set `build_approved=true`.

## Closed work
- EXP001: individualized AI service — zero-touch違反
- EXP002: AI handoff template — 無料代替・課金理由不足
- EXP003: subtitle preflight — 直接競合多数
- EXP004: FBA reimbursement cost audit — exact workflow competitorあり
- SECURITY_PRACTICAL_VOICE_TRAINER — 狭い年間市場、手取り採算不成立、需要/権利/精度未証明

## Existing YouTube asset
Current automated synthetic finance/HR persona tactic is hard-paused. Analytics and historical data are preserved; generation and upload remain blocked.

## Public page
GitHub Pagesは、現在「公開中の商品なし」と表示します。調査・終了実験を現行商品として宣伝しません。
