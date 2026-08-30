# PROJECT STATE

最終更新: 2026-08-30

## Goal
本人の継続労働への依存が小さい**手取り月20万円以上**を可能な限り早く構築し、生活のための労働を不要にする。

## Non-negotiable
- 原則、人と関わらず運営できる
- 個別営業、電話、面談、顧客別納品を主戦略にしない
- 顧客数に比例して本人作業が増えない
- 月0〜10万円、週約18時間で開始可能
- 自動販売・自動提供・自動決済・自動解約を最終形にする
- 過去会話より、このリポジトリの最新状態を優先する

## Permanent execution rule
ユーザーへ計画だけ返して作業を止めない。許可済み範囲では、同一サイクル内で調査→反証→中止/変更→実行→検査→状態更新まで終えてから一度だけ返す。

## Current status
**`RESEARCH_ONLY`**

現在、販売中・公開中・開発承認済みの商品はない。

調査中の唯一のlead:
- candidate: `SECURITY_PRACTICAL_VOICE_TRAINER`
- name: 警備検定 実技・口述ひとり練習トレーナー
- build approved: **false**
- source of truth: `research/ACTIVE_CANDIDATE.json`

`RESEARCH_ONLY` は商品ではない。決済・LP・MVP・アプリ実装へ進んでいない。

## Current phase
**Phase 7: marketplace-first evidence acquisition + existing-asset risk shutdown**

評価順:
1. exact workflowの直接競合
2. 支払意思
3. 金銭的痛み・期限・義務
4. 既存/無料代替との差
5. 具体的な集客経路
6. zero-touch
7. 単価×顧客数
8. 作りやすさ

## Closed experiments
### EXP001 — 高単価AI個別サービス
個別対応が顧客数に比例するため終了。

### EXP002 — つづきから
固定テンプレート整形中心で、無料代替が強く、月額課金の必然性がないため終了。

### EXP003 — 字幕Preflight
字幕QA、自動修正、AI校閲、NLE連携まで既存無料/有料製品が多数あるため終了。

### EXP004 — FBA補てん原価監査
ReimburseOpsとbuyer/input/processing/output/privacy/pricingが90%超重複したため終了。公開物・検索通知・指標収集も停止済み。

## Critical existing-asset action — YouTube tactic paused

`bachikoljunior-blip/youtube` の現行自動投稿方式を2026-08-30にhard-pauseした。

理由:
- YouTube現行収益化ポリシーは mass-produced / generic / repetitive / template-based contentを不適格とする
- AI-generated personaが金融・法律等のsensitive topicで人間の専門家として助言するチャンネルは収益化不可と明示
- 現行設定は「元・事業会社の経理／人事」を名乗る合成音声ペルソナが、お金・税金・キャリアを自動解説する

実行済み:
- `youtube/AUTOMATION_PAUSED.md`
- generation/upload/reschedule/retitle等のcode-level hard guard
- Claude SessionStart/UserPrompt/PostCompactへのpause reminder
- pause guard CI
- 既存動画・分析データは削除せず保全

分析系ツールだけは許可。新しい動画在庫を増やさない。

## Marketplace sweep completed

`research/MARKETPLACE_SWEEP_2026-08-30.md` に記録。

Exact workflowで棄却済み:
- kintone invoice registration monitor
- Confluence/Jira Japanese proofreading/search/business-day
- Shopify Japanese address/carrier/remote-island rules
- kintone security audit
- Canva Japanese typography/furigana
- Framer slug/CMS audit/backup
- Stripe qualified invoice
- tender alerts
- YouTube AI compliance audit
- worker payslip discrepancy audit

理由はexact paid competition、first-party/free substitutes、distribution/economics不成立のいずれか。

## Research-only lead — security practical/oral trainer

Exact workflow under study:

`受験者が実技・口述手順を選ぶ → iPhoneへ話す → 端末内音声認識で必須語・順序・時間を採点 → 抜けた手順の反復と模擬口述を受け取る → 買切りアプリ`

Paid evidence:
- ¥800 paid exam app
- freemium/free academic apps
- ¥3,300 textbook
- ¥6,600〜¥10,560 pre-courses
- adjacent practical DVDs ¥27,300〜¥54,600

Gap evidence:
- current apps focus on academic questions
- at least one app explicitly excludes practical training
- reviews complain about difficulty/real-exam mismatch
- 2026 practical exam changes show update burden and currentness matter

Not build-approved because:
- no exact speech-scored practical app confirmed, but also no five exact direct competitors for a complete overlap matrix
- legally usable/current practical rubrics are not secured
- qualification/content-review authority is unverified
- voice cannot validate physical performance
- practical query volume, annual candidate count and CAC are unmeasured
- hypothetical ¥2,980 one-time price needs about 68 sales/month, unproven

## Machine enforcement strengthened

`scripts/check_prebuild_gate.py` now enforces:
- `RESEARCH_ONLY` still requires named buyer/workflow, 12 searches, 5 substitutes, evidence, economics and kill criteria
- `OFFER_TEST` requires price, buyer action, traffic source, threshold and end date
- `BUILD_APPROVED` requires structured competitor records with buyer/input/process/output/price and overlap percentage
- any competitor overlap ≥70% requires explicit override evidence
- product code remains forbidden while build_approved=false
- public page may not imply a research lead is a live product

## Human-only boundary
AI alone cannot create:
- actual App Store search-volume/CAC evidence
- legal access to current practical rubrics
- qualified practical-content review
- real reservation purchases, app purchases or usage

Everything before those external facts—search, comparison, rejection, schema, code guard and state persistence—has been executed.

## Immediate next action
**Do not build.** Acquire the missing evidence for `SECURITY_PRACTICAL_VOICE_TRAINER` through public-source market sizing, practical-content rights/currentness review and exact speech-practice competitor search. If any kill criterion triggers, set `CLOSED` and return to `NO_ACTIVE_CANDIDATE` in the same cycle. Move to `OFFER_TEST` only after the evidence in `research/ACTIVE_CANDIDATE.json` supports it.

## Resume instruction
`AGENTS.md` → this file → `research/ACTIVE_CANDIDATE.json` → `research/PREBUILD_GATE.md` → `research/MARKETPLACE_SWEEP_2026-08-30.md` → `DECISIONS.md`. EXP001〜004へ戻らない。弱点を見つけた場合は、その回答内で反証・中止・代替調査・記録まで終える。
