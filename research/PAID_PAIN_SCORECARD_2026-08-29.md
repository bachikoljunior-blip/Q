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

| 候補 | Pay | Pain | Gap | Acquire | Zero | Reach | Total | 判定 |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Amazon.co.jp FBA補てん原価監査 | 5 | 5 | 2 | 3 | 5 | 4 | 24 | EXP004無料反証テスト。課金本命未確定 |
| Amazon flat-file/処理レポート修復 | 5 | 4 | 2 | 4 | 5 | 4 | 24 | 公式/民間競合が多い |
| EC移行CSVの検査・変換 | 5 | 4 | 2 | 4 | 5 | 4 | 24 | 既存自動移行/アプリが多い |
| Amazon入金・手数料照合 | 5 | 5 | 1 | 3 | 5 | 4 | 23 | freee、マカド、セラー管理くん等が強い |
| 注文書/FAX→CSV | 5 | 5 | 1 | 3 | 4 | 4 | 22 | 日本の直接競合あり |
| 請求書/領収書OCR | 5 | 5 | 1 | 4 | 4 | 4 | 23 | 大手・制度対応競争 |
| PDFアクセシビリティ/墨消し | 5 | 4 | 1 | 3 | 5 | 4 | 22 | 海外の強い自動製品多数 |
| EPUB/KDP preflight | 4 | 3 | 2 | 4 | 5 | 3 | 21 | 無料変換・EPUBCheckが強い |
| 日本語字幕QA/AI校閲 | 4 | 3 | 1 | 4 | 5 | 3 | 20 | EXP003終了 |
| YouTube競合アウトライアー検出 | 4 | 3 | 1 | 4 | 5 | 3 | 20 | 無料＋有料の日本語競合 |
| 同人印刷データpreflight | 3 | 4 | 1 | 4 | 5 | 2 | 19 | 無料新規ツールが複数 |
| AIプロジェクト引き継ぎ | 2 | 2 | 1 | 3 | 5 | 2 | 15 | EXP002終了 |

## EXP004を無料反証テストとして残す理由

### 問題が直接金額になる
2025年3月以降、注文前に紛失・破損したFBA在庫は製造/仕入原価を基準に補てんされる。Amazon推定原価が実際の原価より低ければ、差額が粗利益の損失になる。

### 期限がある
Amazon Japanの告知では、補てん評価額の再評価は補てんから60日以内。購入者返品や返送なども45〜105日、15〜75日等の短い窓がある。

### 日本で支払市場が証明済み
- Picaro: 回収額の30%、無料診断。2026年8月時点で新規提供を一時停止。
- Picaro申込ページ: 月商1,000万円以上が対象。
- Goaltech: 回収額の25%、面談・権限付与が必要。
- Picaro公表: 開始3ヶ月で412社、総額2,000万円を回収（会社発表ベース）。

## 競合調査による重要な反証

### 海外の直接競合
- ReimburseOps: 補てんCSV + 原価CSVのセルフ監査を$19/月。
- SellerAIHQ ReimbursementPro: 原価差監査と申請パック。
- Clawback / Seller Investigators / Refunds Manager等: 自動回収または成功報酬。

### 日本の直接・近接競合
- マカド！: Amazon SP-API連携の総合管理サービス内で「還付・補償の取りこぼし検出」を提供。
- Picaro / Goaltech: 人手の回収代行。
- Amazon公式「在庫の問題と補てん」ポータル: 問題と補てんの確認を改善。

したがって、EXP004は独自発明ではなく競合市場への小型・ローカル処理版である。
「日本語だから勝てる」「競合がいない」とは扱わない。

## 残る仮説
以下の組み合わせに限り、既存サービスとの差を検証する:
- Amazonアカウント接続なし
- SP-API権限付与なし
- CSV本文を外部送信しない
- 小規模セラーが登録なしで即監査
- Amazon.co.jpの日本語/英語ヘッダー、円、日本語申請下書き
- 成功報酬なし

これは無料利用の理由にはなり得るが、月額課金理由になるとはまだ証明されていない。
そのため、決済・SP-API・AI・自動申請は作らず、無料版で実ファイル利用と有料意向を反証する。

## Main risks
1. マカド！等の国内総合ツールで既に補償取りこぼし検出が可能。
2. self-serviceの中核は海外製品と類似する。
3. 日本語レポートの列名・理由コードの実データ適合が未確認。
4. 補てん理由ごとに算定基準が違い、誤判定は損害につながる。
5. 小規模セラーの回収額が小さいと月額課金に届かない。
6. Amazonの規約・画面・期限変更への継続追従が必要。
7. 100ユニーク端末を集める自動流入経路が未証明。

## Risk controls
- 「補てん対象」と断定せず「候補」と表示。
- 注文前の `Lost/Damaged + Warehouse/Inbound` だけを原価基準候補にする。
- `Outbound`、購入者返品、注文後、理由不明は要確認へ分離。
- 取消・逆仕訳を分離。
- 自動申請しない。
- 元データと原価をサーバーへ送らない。
- 100ユニーク端末のGate前に決済/SP-APIを作らない。
- 月額版希望が出ても、国内競合との比較理由を自由記述なしで推測しない。

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
- SellerAIHQ ReimbursementPro:
  https://selleraihq.com/fba-reimbursement-tools/
- マカド！ App Store description (includes refund/compensation miss detection):
  https://apps.apple.com/us/app/%E3%83%9E%E3%82%AB%E3%83%89/id6788527255
