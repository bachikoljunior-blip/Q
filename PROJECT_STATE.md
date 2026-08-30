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

## Completion-before-response rule
A final answer is forbidden while a safe material action remains.

回答前に `execution/CURRENT_WORK.json` の全material taskを `DONE`、`REJECTED`、`BLOCKED_EXTERNAL` のいずれかへ終端させ、次を実行する:

```text
python scripts/check_prebuild_gate.py
python scripts/check_execution_contract.py
```

弱点を発見した場合、その回答内で中止/修正、exact competitor確認、実行系の削除、CI修正、状態更新、再検証まで完了する。ユーザーへ同じ完了指示を再度言わせない。

## Current status

**`NO_ACTIVE_CANDIDATE`**  
Build approved: **false**  
Live product: **none**  
Paid customers: **0**  
Revenue: **¥0**  
Product implementation files: **0**

現在、販売中・公開中・開発承認済み・調査継続中の商品候補はない。

これは「何もしない」という意味ではない。現在の候補batchを実装前に反証し、通過案が0だったという正確な結果。弱い商品を作ったことにしない。

Machine source of truth:
- `research/ACTIVE_CANDIDATE.json`
- `execution/CURRENT_WORK.json`

## Closed experiments and leads

### EXP001 — 高単価AI個別サービス
個別対応が顧客数に比例するため終了。

### EXP002 — つづきから
固定テンプレート整形中心で、無料代替が強く、月額課金の必然性がないため終了。

### EXP003 — 字幕Preflight
字幕QA、自動修正、AI校閲、NLE連携まで既存無料/有料製品が多数あるため終了。

### EXP004 — FBA補てん原価監査
ReimburseOpsとbuyer/input/processing/output/privacy/pricingが90%超重複したため終了。公開物・検索通知・指標収集も停止済み。残っていたmetrics collectorも削除した。

### SECURITY_PRACTICAL_VOICE_TRAINER
2026-08-30終了。市場規模、合法的な現行rubric、反復するexact pain、身体実技を音声だけで測れる妥当性、acquisitionのいずれもGateを通過しなかった。

### JIRA_AUTOMATION_GUARD
2026-08-30終了。`ajat` がAutomation rule JSON export、local snapshot diff、CI drift、reports/runbooksまで提供しておりexact competitor vetoが発動した。

実行済み:
- product code削除
- public experiment削除
- approval/build/finalize/indexing/metrics/tracking/hardening workflows削除
- publisher/state/metrics/tracking scripts削除
- smoke/metrics tests削除
- automatic candidate re-promotion workflow/tool削除

Archival decision recordだけを残し、閉じた候補がworkflowから復活しない状態にした。

## Current candidate batch — completed and rejected

`research/BATCH_VETO_2026-08-30.md` に、次を実装前に比較・棄却した記録を保存:

1. Jira permission drift / access-review evidence
2. Jira long-term audit retention / evidence vault
3. Confluence page owner / expiry / attestation
4. Confluence external-user offboarding / access impact
5. WooCommerce webhook failure / replay
6. WordPress staging-production settings diff
7. WordPress update-impact preflight
8. Figma Japanese typography / kinsoku QA
9. shift/pay backup and payslip mismatch

判定理由:
- exact paid competitor
- free/first-party core substitute
- same buyer outcome already supplied
- repeated exact pain/acquisition evidence不足
- legal/schema/support burdenがzero-touchに不適合

## Discovery automation — canonical state

稼働を許可するresearch-only pipeline:

### WordPress marketplace
- `research/tools/marketplace_scan.py`
- `research/tools/filter_marketplace_scan.py`
- `research/tools/mine_wordpress_complaints.py`
- `.github/workflows/marketplace_scan.yml`

`research/marketplace_scan` を書くworkflowはこの1本だけ。旧 `marketplace-scan.yml` と競合scannerは削除した。現在のcanonical outputはschema v2。

### Japanese App Store
- `research/tools/app_store_scan.py`
- `research/tools/mine_app_store_reviews.py`
- `.github/workflows/app_store_scan.yml`

### Cross-source evidence queue
- `research/tools/build_discovery_queue.py`
- `.github/workflows/discovery_queue.yml`

これらはsignal/evidenceを集めるだけで、`ACTIVE_CANDIDATE`を変更せず、product codeを作らない。

Hard-codedで棄却済み候補を再検索・再昇格していたexact-match queue/deep-dive/auto-syncは削除した。candidate選定は、最新evidenceからexact workflowを定義してから行う。

Atlassian Marketplace V2検索APIはHTTP 410で終了しているため、自動カバレッジを偽装せずmanual-onlyと記録する。

## Machine enforcement

### `scripts/check_prebuild_gate.py`
- `build_approved=false` 中の `product/` を禁止
- RESEARCH_ONLY/OFFER_TEST/BUILD_APPROVEDの証拠要件を検査
- 70%以上の重複をoverride evidenceなしで禁止
- non-live public pageをno-product/noindexへ固定

### `scripts/check_execution_contract.py`
- current workに未完了taskがないこと
- `READY_TO_REPORT` であること
- `NO_ACTIVE_CANDIDATE / build_approved=false`
- product files 0
- closed candidateの実行系が残っていないこと
- marketplace generated evidence writerが1本だけであること
- completion invariantがAGENTSに存在すること
- batch vetoとexecution recordが存在すること

### GitHub Actions
- `Q governance gate`
- `Research loop checks`
- `Full discovery validation pass`
- `Sync candidate and completion status documentation`
- canonical marketplace/App Store/discovery queue workflows

## Existing YouTube asset

`bachikoljunior-blip/youtube` の現行自動投稿方式はhard-pauseを維持。

理由:
- mass-produced / repetitive / template-based contentの収益化リスク
- 合成の「元経理・人事」ペルソナが金融・税・キャリアを助言する構成

新しい動画在庫を現行形式で増やさない。既存動画と分析データは保全。

## External-only boundaries

内部作業を止める口実にしてはいけない。AI/connected toolsだけでは作れない外部事実は次:
- real paid preorder/purchase
- measured live CAC/conversion
- actual marketplace ranking/search volume
- specialist content rights or qualified review agreement
- third-party retention/support burden

現在はGate通過offerがないため、これらを取るためのLP/決済を先に作らない。

## Immediate resume boundary

新規実装は禁止。

次のcycleでは、最新complaint本文から**同一buyer・同一input・同一未解決outcomeが10件以上**ある狭いworkflowだけを抽出し、12検索、closest paid products 5件、substitutes 5件、overlap、acquisition、手取り採算を同一cycleで完了する。通過案がなければ `NO_ACTIVE_CANDIDATE` を維持する。

## Resume order

1. `AGENTS.md`
2. `PROJECT_STATE.md`
3. `research/ACTIVE_CANDIDATE.json`
4. `execution/CURRENT_WORK.json`
5. `research/PREBUILD_GATE.md`
6. `research/BATCH_VETO_2026-08-30.md`
7. `DECISIONS.md`

EXP001〜004、security voice trainer、Jira Automation Guardを新しい外部証拠なしに復活させない。
