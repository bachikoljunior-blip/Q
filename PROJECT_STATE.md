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

## Current status

**`NO_ACTIVE_CANDIDATE`**  
Build approved: **false**  
Live product: **none**  
Paid customers: **0**  
Revenue: **¥0**  
Product implementation files: **0**

販売中・公開中・開発承認済みの商品はない。これは目標完了ではなく、**現在の構造化証拠90行をすべて実装前に精査し、Gate通過が0だった**という状態である。

Machine source of truth:
- `research/ACTIVE_CANDIDATE.json`
- `execution/CURRENT_WORK.json`
- `research/discovery_queue/latest.json`
- `research/discovery_queue/reviewed_2026-08-30.json`

## Why work appeared to stop

停止理由は外部制約ではなく、内部の完了判定と調査パイプラインの欠陥だった。

1. 一つの候補batchが終わったことを、手取り月20万円の全体目標の停止境界として扱っていた。
2. `NO_ACTIVE_CANDIDATE` のまま、当時のApp Store evidence queue 69行を `NEEDS_EXACT_WORKFLOW` で残していた。
3. WordPress minerが出す `cluster_counts/topics` と、queue builderが読んでいた旧 `clusters/examples` が不一致で、WordPress evidenceがキューから全件消えていた。
4. `CURRENT_WORK.json` と実際に作成済みの精査記録が同期していなかった。

このため、「完了」と説明できる状態ではなかった。

## Corrective work completed

### App Store evidence

`research/EXACT_WORKFLOW_REDUCTION_2026-08-30.md` で69/69行を精査した。

10件以上の同一未解決workflowが確認できたのは次の4 family:
- SPI登録後の営業電話・メール: 27件
- 音域測定の倍音・ノイズ・オクターブ誤認: 16件
- FP3の法改正未反映・誤答: 13件
- カウントダウンwidget/通知の日跨ぎ更新失敗: 12件

4 familyすべてが直接競合、無料代替、継続監修、獲得経路、採算のいずれかでGate不通過となった。

### WordPress evidence

`research/tools/build_discovery_queue.py` のschema mismatchを修正し、落ちていた21行を復元した。

`research/WORDPRESS_EXACT_WORKFLOW_REDUCTION_2026-08-30.md` で21/21行を精査した。主なexact workflow family:
- WooCommerce請求書PDF生成・添付整合
- 予約空き枠・重複・外部カレンダー同期
- CSV/XML/注文/ユーザーimport-export整合
- 配送ラベル・国際住所preflight
- 税計算監査
- plugin更新後のfatal/checkout regression
- subscription renewal health

すべて、既存中核機能・直接競合・無料/first-party代替・法令/配送/API/schema保守・顧客別support負荷により棄却した。

### Current evidence coverage

- App Store rows: **69 reviewed / 69 terminal**
- WordPress rows: **21 reviewed / 21 terminal**
- Current queue: **90 reviewed / 90 terminal**
- Promoted candidates: **0**
- Product code: **0**

レビューは件数だけでなく、`research/discovery_queue/latest.json` のSHA-256とsignal ID順序へ固定されている。キュー内容が変われば以前のreviewは無効となる。

## Continuation contract

`research/CONTINUATION_CONTRACT.md` と `scripts/check_continuation_contract.py` を追加した。

有効な回答境界には、少なくとも次が必要:
- current queueとreview recordのSHA-256一致
- queue全行とdispositionの1対1一致
- review件数とsource件数の一致
- promoted candidateと`ACTIVE_CANDIDATE`の整合
- `CURRENT_WORK.json`の全material task終端
- Prebuild Gate、continuation contract、execution contractの全PASS

新しい証拠が入ってreviewが古くなると、CIは失敗し、「以前のbatchが終わったから完了」という扱いを拒否する。

`.github/workflows/continuous_discovery_guard.yml` は定期的にcurrent evidenceとreviewを照合し、古いreviewを成功扱いにしない。

## Completion-before-response rule

A final answer is forbidden while a safe material action remains.

回答前に次を実行する:

```text
python scripts/check_prebuild_gate.py
python scripts/check_continuation_contract.py
python scripts/check_execution_contract.py
```

弱点を発見した場合、その回答内で中止/修正、exact competitor確認、実行系の削除、CI修正、状態更新、再検証まで完了する。`NO_ACTIVE_CANDIDATE` は、未処理証拠や内部不整合が残る場合の停止理由にならない。

## Closed experiments and leads

### EXP001 — 高単価AI個別サービス
個別対応が顧客数に比例するため終了。

### EXP002 — つづきから
固定テンプレート整形中心で、無料代替が強く、月額課金の必然性がないため終了。

### EXP003 — 字幕Preflight
字幕QA、自動修正、AI校閲、NLE連携まで既存無料/有料製品が多数あるため終了。

### EXP004 — FBA補てん原価監査
ReimburseOpsとbuyer/input/processing/output/privacy/pricingが90%超重複したため終了。公開物・検索通知・指標収集も停止済み。

### SECURITY_PRACTICAL_VOICE_TRAINER
市場規模、合法的な現行rubric、反復するexact pain、身体実技を音声だけで測れる妥当性、acquisitionのいずれもGateを通過しなかった。

### JIRA_AUTOMATION_GUARD
`ajat` がAutomation rule JSON export、local snapshot diff、CI drift、reports/runbooksまで提供しておりexact competitor vetoが発動した。

## Discovery automation — canonical state

### WordPress marketplace
- `research/tools/marketplace_scan.py`
- `research/tools/filter_marketplace_scan.py`
- `research/tools/mine_wordpress_complaints.py`
- `.github/workflows/marketplace_scan.yml`

### Japanese App Store
- `research/tools/app_store_scan.py`
- `research/tools/mine_app_store_reviews.py`
- `.github/workflows/app_store_scan.yml`

### Cross-source queue and review freshness
- `research/tools/build_discovery_queue.py`
- `.github/workflows/discovery_queue.yml`
- `scripts/check_continuation_contract.py`
- `.github/workflows/continuous_discovery_guard.yml`

Research automationはsignalを集めるだけで、`ACTIVE_CANDIDATE`を変更せず、product codeを作らない。候補昇格にはPREBUILD_GATEが必要。

## Machine enforcement

### `scripts/check_prebuild_gate.py`
- `build_approved=false` 中の `product/` を禁止
- RESEARCH_ONLY/OFFER_TEST/BUILD_APPROVEDの証拠要件を検査
- 70%以上の重複をoverride evidenceなしで禁止
- non-live public pageをno-product/noindexへ固定

### `scripts/check_continuation_contract.py`
- queueとreviewのSHA-256、件数、signal ID、順序を検査
- current queueの全行がterminal dispositionを持つことを検査
- promoted candidateとACTIVE_CANDIDATEの整合を検査
- stale reviewを失敗にする

### `scripts/check_execution_contract.py`
- current workに未完了taskがないこと
- continuation contractがPASSすること
- `NO_ACTIVE_CANDIDATE / build_approved=false`
- product files 0
- closed candidateの実行系が残っていないこと
- generated evidence writerの一意性

### GitHub Actions
- `Q governance gate`
- `Research loop checks`
- `Full discovery validation pass`
- `Sync candidate and completion status documentation`
- `Continuous discovery freshness guard`
- canonical Marketplace/App Store/discovery queue workflows

## Existing YouTube asset

`bachikoljunior-blip/youtube` の現行自動投稿方式はhard-pauseを維持。

理由:
- mass-produced / repetitive / template-based contentの収益化リスク
- 合成の「元経理・人事」ペルソナが金融・税・キャリアを助言する構成

新しい動画在庫を現行形式で増やさない。既存動画と分析データは保全。

## External-only boundaries

内部作業を止める口実にはしない。AI/connected toolsだけでは生成できない外部事実:
- real paid preorder/purchase
- measured live CAC/conversion
- actual marketplace ranking/search volume
- specialist content rights or qualified review agreement
- third-party retention/support burden

現在はGate通過offerがないため、これらを取るためのLP/決済を先に作らない。

## Immediate resume boundary

新規実装は禁止。

新しいMarketplace/App Store evidenceが現在のreview hashを変えた時点で、作業状態は未完了へ戻る。新規行を同一buyer・同一input・同一未解決outcomeへ還元し、10件閾値、12検索、直接競合5件、代替5件、overlap、acquisition、手取り採算を同一cycleで完了する。通過案がなければ `NO_ACTIVE_CANDIDATE` を維持する。

## Resume order

1. `AGENTS.md`
2. `PROJECT_STATE.md`
3. `research/ACTIVE_CANDIDATE.json`
4. `execution/CURRENT_WORK.json`
5. `research/CONTINUATION_CONTRACT.md`
6. `research/discovery_queue/latest.json`
7. `research/discovery_queue/reviewed_2026-08-30.json`
8. `research/PREBUILD_GATE.md`
9. `DECISIONS.md`
