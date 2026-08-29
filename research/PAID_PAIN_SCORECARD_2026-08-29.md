# PAID-PAIN SCORECARD — 2026-08-29

目的: 「作れるもの」ではなく、既に金銭的痛みと支払実績があるzero-touch候補から選ぶ。

採点: 5点満点
- Pay: 現在の支払意思
- Pain: 金・期限・義務への直結
- Gap: 無料/既存競合との差を作れる余地
- Acquire: 自動集客の現実性
- Zero: セルフサービス化
- Reach: 月20万円へ必要な単価×契約数
- Total: 30点

| 順位 | 候補 | Pay | Pain | Gap | Acquire | Zero | Reach | Total | 判定 |
|---:|---|---:|---:|---:|---:|---:|---:|---:|---|
| 1 | Amazon.co.jp FBA補てん原価監査 | 5 | 5 | 4 | 3 | 5 | 4 | 26 | EXP004として実装 |
| 2 | Amazon flat-file/処理レポート修復 | 5 | 4 | 3 | 4 | 5 | 4 | 25 | 強いが競合多。保留 |
| 3 | EC移行CSVの検査・変換 | 5 | 4 | 2 | 4 | 5 | 4 | 24 | 既存自動移行/アプリが多い |
| 4 | Amazon入金・手数料照合 | 5 | 5 | 2 | 3 | 5 | 4 | 24 | 会計/管理SaaSが強い |
| 5 | 注文書/FAX→CSV | 5 | 5 | 1 | 3 | 4 | 4 | 22 | 日本の直接競合あり |
| 6 | 請求書/領収書OCR | 5 | 5 | 1 | 4 | 4 | 4 | 23 | 大手・制度対応競争 |
| 7 | PDFアクセシビリティ/墨消し | 5 | 4 | 1 | 3 | 5 | 4 | 22 | 海外の強い自動製品多数 |
| 8 | EPUB/KDP preflight | 4 | 3 | 2 | 4 | 5 | 3 | 21 | 無料変換・EPUBCheckが強い |
| 9 | 日本語字幕QA/AI校閲 | 4 | 3 | 1 | 4 | 5 | 3 | 20 | EXP003終了 |
| 10 | YouTube競合アウトライアー検出 | 4 | 3 | 1 | 4 | 5 | 3 | 20 | 無料＋有料の日本語競合 |
| 11 | 同人印刷データpreflight | 3 | 4 | 1 | 4 | 5 | 2 | 19 | 無料新規ツールが複数 |
| 12 | AIプロジェクト引き継ぎ | 2 | 2 | 1 | 3 | 5 | 2 | 15 | EXP002終了 |

## 1位を選んだ根拠

### 問題が直接金額になる
2025年3月以降、注文前に紛失・破損したFBA在庫は製造/仕入原価を基準に補てんされる。Amazon推定原価が実際の原価より低ければ、差額が粗利益の損失になる。

### 期限がある
Amazon Japanの告知では、補てん評価額の再評価は補てんから60日以内。購入者返品や返送なども45〜105日、15〜75日等の短い窓がある。

### 日本で支払市場が証明済み
- Picaro: 回収額の30%、無料診断。2026年8月時点で新規提供を一時停止。
- Picaro申込ページ: 月商1,000万円以上が対象。
- Goaltech: 回収額の25%、面談・権限付与が必要。
- Picaro公表: 開始3ヶ月で412社、総額2,000万円を回収（会社発表ベース）。

### exact global product exists
ReimburseOpsは補てんCSV + 原価CSVのセルフ監査を$19/月で提供。これは競合であると同時に、ワークフローと定額課金の支払意思の証拠。
したがって「世界初」ではない。勝負はAmazon.co.jp向けの入力・円・日本語・小規模セラー・ローカル処理・申請下書き。

## Main risks
1. Amazon公式の「在庫の問題と補てん」ポータルが対象発見を改善している。
2. self-serviceの中核は海外製品と類似する。
3. 日本語レポートの列名・理由コードの実データ適合が未確認。
4. 補てん理由ごとに算定基準が違い、誤判定は損害につながる。
5. 小規模セラーの回収額が小さいと月額課金に届かない。
6. Amazonの規約・画面・期限変更への継続追従が必要。

## Risk controls
- 「補てん対象」と断定せず「候補」と表示。
- 注文前倉庫内の理由コードだけを原価基準候補にする。
- 購入者返品/注文後は要確認へ分離。
- 取消・逆仕訳を分離。
- 自動申請しない。
- 元データと原価をサーバーへ送らない。
- 100ユニーク端末のGate前に決済/SP-APIを作らない。

## Evidence URLs
- Amazon Japan 2025 cost-based reimbursement:
  https://sellercentral.amazon.co.jp/seller-forums/discussions/t/68864b6f-0ab8-41ef-be18-069c33df6336
- Amazon Japan automatic reimbursement and claim windows:
  https://sellercentral.amazon.co.jp/seller-forums/discussions/t/f80b0517-d56e-4213-a957-d482ccdbaace
- Amazon Japan official reimbursement portal announcement:
  https://sellercentral.amazon.co.jp/seller-forums/discussions/t/bf88ad83-f1aa-416a-9d02-21d82a31e3bd
- Japanese seller report of reimbursements below cost:
  https://sellercentral.amazon.co.jp/seller-forums/discussions/t/fa8b8575-42e2-43ce-821b-4b3bb2690956
- Picaro pricing/current status:
  https://www.picaro.co.jp/services/fba-recovery
- Picaro eligibility (¥10M monthly sales):
  https://content.picaro.co.jp/sellerinvestigators-register
- Goaltech 25% managed service:
  https://fba-refund.goaltech.co.jp/support/
- ReimburseOps flat $19/month self-service:
  https://reimburseops.com/
