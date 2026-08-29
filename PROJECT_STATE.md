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

現在、商品として確定・開発承認された案はない。これは失敗を隠す表現ではなく、弱い5案目を作らないための正確な状態。

## Current phase
**Phase 6: exact-match-first / distribution-first discovery**

次の案は `research/PREBUILD_GATE.md` を通過するまで実装しない。

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
**2026-08-30終了。追加検証・集客・課金開発を停止。**

終了理由:
- ReimburseOpsが同じbuyerへ、同じFBA補てんCSVと原価CSVを入力させる
- 列自動認識、missing cost、90% under-reimbursement、同一商品の評価ばらつき、landed-cost警告を提供
- no Amazon login / no API keys / no success fee
- export、case-ready text、60-day alert、$19/月まで提供

buyer・input・processing・output・privacy positioning・pricing modelの重複が90%超。日本語、円、ローカル処理、日本語下書きだけでは月額課金差として弱い。

開始時点の匿名指標も訪問0、監査0、利用意向0で、継続を正当化する外部証拠はない。

## Corrective actions completed 2026-08-30
- EXP004を `CLOSED` へ変更
- exact-match competitor sweepを実施し、FBA、Amazon flat-file修復、Shopify CSV修復、楽天CSV、AI YouTube自動化、Amazon入金照合を直接競合で棄却
- `research/EXACT_MATCH_SWEEP_2026-08-30.md` を追加
- `research/PREBUILD_GATE.md` を追加
- `research/ACTIVE_CANDIDATE.json` を `build_approved=false` で追加
- `AGENTS.md` にexact-match vetoとstatus languageを固定
- 弱い公開実験の検索通知・日次指標収集を停止する
- 公開トップを「現在、公開中の商品なし」に変更する
- 新商品コードはGate通過後に `product/` 配下だけへ作る

## Why no fifth build was started
今回の検索では、次のworkflowにも直接競合が複数あった:
- Amazon flat-file processing report修復
- Shopify CSV import修復
- 楽天RMS CSV一括編集/変換
- AI YouTube完全自動投稿
- Amazon settlement/COGS損益照合

「競合があるから全部不可能」ではない。ただし、未解決差への前払い・乗換意思・反復不満がない状態で同じworkflowを作るのは禁止した。

## Next search boundary
次は広いアイデア出しではなく、**既存の有料marketplaceで、購入・レビュー・検索需要が見える場所**から探す。

優先:
- アプリ/プラグインmarketplaceの低評価・未解決レビュー
- 既存有料商品の一機能ではなく、繰り返し不満が残る具体的workflow
- 自動集客面が最初から存在するカテゴリ

候補を選ぶ前に:
- 12検索以上
- direct competitors 5件以上
- substitutes 5件以上
- overlap matrix
- duplicate veto PASS
- acquisition evidence
- unit economics
- differentiator evidence

を `research/ACTIVE_CANDIDATE.json` に記録する。

## Human-only boundary
候補が `OFFER_TEST` に進んだ後、第三者の予約購入・支払意思・実利用だけは外部ユーザーが必要。それ以前の競合調査、比較、棄却、仕様、検査、状態保存はAI側で完了させる。

## Immediate next action
**新規実装は禁止。marketplace-firstで候補を調査し、PREBUILD GATEを完全通過した1案だけを `BUILD_APPROVED` にする。通過案がなければ `NO_ACTIVE_CANDIDATE` を維持する。**

## Resume instruction
`AGENTS.md` → このファイル → `research/ACTIVE_CANDIDATE.json` → `research/PREBUILD_GATE.md` → `DECISIONS.md` の順で読む。EXP001〜004へ戻らない。弱点を見つけた場合は、その回答内で反証・中止・代替調査・記録まで終える。
