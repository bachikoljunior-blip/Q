# EXP004 metrics

このディレクトリは `scripts/snapshot_metrics.py` と `.github/workflows/metrics.yml` により自動更新されます。

- `latest.json`: 機械可読の最新スナップショット
- `latest.md`: 人間・AIが読む最新判定

取得するのは公開ページの匿名イベント合計だけです。出品者が読み込んだAmazonレポート、原価CSV、SKU、ASIN、商品名、金額、氏名、メールアドレスなどは取得しません。

## Paid-development gate

有料版・SP-API連携・重い開発は、少なくとも次を満たすまで開始しません。

- ユニーク端末100
- 監査実行30
- 監査結果の出力またはケース作成10
- 月額利用意向5
- 実ファイル互換性の確認
- 深刻な誤検出がないこと

母数到達後に基準未達なら、課金機能を作らずEXP004を本命から降格します。
