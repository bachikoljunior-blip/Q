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
**`NO_ACTIVE_CANDIDATE`**

現在、販売中・公開中・開発承認済み・調査継続中の商品候補はない。

これは停止や先送りではない。exact workflow、需要、差別化、集客、採算のいずれかを満たさない案を5個目として作らないための正確な状態。

正本: `research/ACTIVE_CANDIDATE.json`

## Current phase
**Phase 8: automated marketplace discovery + exact-workflow rejection**

次の案は `research/PREBUILD_GATE.md` を完全通過するまで実装・LP公開・決済テストしない。

評価順:
1. exact workflowの直接競合
2. 支払意思
3. 金銭的痛み・期限・義務
4. 既存/無料代替との差
5. 具体的な集客経路
6. zero-touch
7. 手取り20万円までの単価×顧客数
8. 作りやすさ

## Closed experiments and leads

### EXP001 — 高単価AI個別サービス
個別対応が顧客数に比例するため終了。

### EXP002 — つづきから
固定テンプレート整形中心で、無料代替が強く、月額課金の必然性がないため終了。

### EXP003 — 字幕Preflight
字幕QA、自動修正、AI校閲、NLE連携まで既存無料/有料製品が多数あるため終了。

### EXP004 — FBA補てん原価監査
ReimburseOpsとbuyer/input/processing/output/privacy/pricingが90%超重複したため終了。公開物・検索通知・指標収集も停止済み。

### SECURITY_PRACTICAL_VOICE_TRAINER — 警備検定 実技・口述ひとり練習トレーナー
**2026-08-30にRESEARCH_ONLYからCLOSED。実装・LP・予約販売へ進めない。**

終了理由:
- 2025年度の交通誘導警備業務2級特別講習は6,489人
- 買切り¥2,980、App Store手数料15%の仮定でも、年手取り¥240万円には税・返金・開発費等を除く前に約948販売が必要
- これは関連年間受講者全体の約14.6%で、無名の新規アプリとして非現実的
- 以前の816販売計算は粗い売上計算で、手取り目標を満たさない
- 「一人で口述・実技練習したい」という対象者本人の反復する公開不満を10件確認できなかった
- 現行の完全な実技採点基準を合法的に使用できる根拠を確保できなかった
- 2026年に実技内容の一部変更があり、継続的な有資格レビューが必要
- 音声採点では旗・誘導棒・立ち位置・動作・対車両タイミング等の身体技能を判定できない
- App Store上には学科対策需要があるが、実技・口述専用の獲得需要/CACは未証明

詳細: `research/SECURITY_PRACTICAL_VOICE_TRAINER_2026-08-30.md`

## Existing asset action — YouTube tactic remains hard-paused

`bachikoljunior-blip/youtube` の現行自動投稿方式は2026-08-30にhard-pause済み。

理由:
- mass-produced / repetitive / template-based contentの収益化リスク
- 合成の「元経理・人事」ペルソナが金融・税・キャリアを助言する構成

実行済み:
- `youtube/AUTOMATION_PAUSED.md`
- generation/upload/reschedule/retitle等のcode-level hard guard
- pause reminder hooks
- pause guard CI
- 既存動画・分析データは削除せず保全

分析は許可するが、現行形式の新しい動画在庫を増やさない。

## Marketplace discovery automation completed

実装済み:
- `research/tools/marketplace_scan.py`
- `research/tools/filter_marketplace_scan.py`
- `research/tools/mine_wordpress_complaints.py`
- `.github/workflows/marketplace_scan.yml`

自動化内容:
- WordPress.orgの公開APIから需要・評価・support signalを収集
- 広すぎる検索結果を関連性で絞る
- 公開support/reviewトピックを1トピック1件へ正規化してクラスタ化
- weekly/manual/pushで再実行
- 出力は必ず `build_approved=false`

Atlassian Marketplace V2検索APIは終了しHTTP 410となったため、自動カバレッジを偽装せずmanual-onlyとして記録。

出力:
- `research/marketplace_scan/latest.*`
- `research/marketplace_scan/shortlist.*`
- `research/marketplace_scan/complaints.*`

## Marketplace complaint triage result

`research/MARKETPLACE_COMPLAINT_TRIAGE_2026-08-30.md` に記録。

棄却済み:
- WooCommerce請求書番号・欠落PDF監査
- WooCommerce予約在庫/overbooking canary
- WooCommerce税額監査
- WordPressアクセシビリティ継続監視
- WordPress CSV import/export完全性監視
- WooCommerce checkout/store-health synthetic monitor

理由:
- SleekView、CashFlowCanary、CheckOO、TaxDebug、AccessGuard/Warder等、exactまたは主要成果が同じ有料/無料製品が存在
- booking/importの横断対応はプラグイン別adapterとsupport負荷が大きい
- 税務・アクセシビリティは継続法令対応と責任リスクが高い

support件数が多いこと自体を商品承認に使わない。

## Machine enforcement

`scripts/check_prebuild_gate.py` とGitHub Actionsが次を強制:
- `build_approved=false` の間、`product/` に商品コード禁止
- `RESEARCH_ONLY` でもexact workflow、12検索、代替、根拠、採算、kill criteria必須
- `OFFER_TEST` は価格・buyer action・流入元・成功基準・終了日必須
- `BUILD_APPROVED` は直接競合5件、代替5件、構造化overlap matrix、集客、採算が必須
- 70%以上重複は外部override evidenceなしでは不可
- 非live状態の公開ページは「商品なし」かつnoindex
- discovery scannerは候補を自動承認できない

## Human-only boundary
AIだけでは捏造できないもの:
- 前払い/予約購入
- 現在競合へ課金している購入者の乗換意思
- 実広告のCAC
- 実ストア検索ボリューム
- legally usableな専門コンテンツ権利
- 実利用・売上

それ以前の検索、比較、棄却、scanner、CI、状態保存は実行済み。

## Immediate next action
**新規実装は禁止。**

1. marketplace scannerの上位クラスタから、complaint本文で同一未解決workflowが10件以上あるものだけを抽出
2. buyer/input/processing/output/priceを1文に固定
3. 日本語・英語・marketplace・OSSで12検索以上
4. direct competitor 5件、substitute 5件、overlap matrixを作る
5. duplicate veto、集客、手取り採算を通過した場合のみ `RESEARCH_ONLY` → `OFFER_TEST` または `BUILD_APPROVED`
6. 通過案がなければ `NO_ACTIVE_CANDIDATE` を維持し、商品を作ったふりをしない

## Resume instruction
`AGENTS.md` → このファイル → `research/ACTIVE_CANDIDATE.json` → `research/PREBUILD_GATE.md` → `research/MARKETPLACE_COMPLAINT_TRIAGE_2026-08-30.md` → `DECISIONS.md` の順で読む。EXP001〜004とsecurity voice trainerへ戻らない。弱点を見つけた場合は、その回答内で反証・中止・代替調査・記録まで終える。
