# YouTube制作・収益改善

面白さ、自然な日本語、役ごとの声、初見の分かりやすさ、スピーカー再生、サムネイル、タイトルと概要欄、収益判断を、制作の途中や新しいセッションでも引き継ぐためのスキルです。

文脈が分かりづらいときは、冒頭の状況と場面の因果関係を直します。タイトルとサムネイルは具体的な出来事で興味を引く組み合わせにします。カスタムサムネイルが使えないという制作条件を引き継ぎ、動画内にサムネになる場面を組み込みます。

## 使い方

新しいセッションで、このQリポジトリを開き、次のように依頼できます。

> QのAGENTS.mdとYouTube制作・収益改善スキルを読んで、これまでの制作条件を引き継いで動画を作って。

スキルが利用可能な環境では、`$youtube-revenue-production` を明示して依頼する方法もあります。単にリポジトリへ保存しただけで、あらゆる環境に自動インストールされるものではありません。

## 内容

- [スキル本体](skills/youtube-revenue-production/SKILL.md)：制作条件と、依頼・修正・納品の扱い。
- [制作レビュー](skills/youtube-revenue-production/references/production-review.md)：面白さ、初見の理解、日本語と声。
- [フックと動画内サムネイル](skills/youtube-revenue-production/references/hooks-and-thumbnails.md)：タイトルと画面の組み合わせ、動画内への組み込み、最終フレームと時刻、利用できる選択方法。
- [収益判断](skills/youtube-revenue-production/references/revenue.md)：仮定と実測の分離、費用回収、公開後の改善。
- [音声と納品](skills/youtube-revenue-production/references/audio-delivery.md)：ファイル検査、実聴、端末の確認を区別。
- [制作記録のひな形](skills/youtube-revenue-production/assets/PROJECT_STATE.template.md)：指摘と未完了を次のセッションへ引き継ぐ記録。

ファイルを検査したこと、耳で聞いたこと、端末で再生したこと、視聴者が面白いと評価したことを分けて扱います。「保証できない」で収益の検討を終えず、判断に必要な条件と計算を示します。タイトルと概要欄は、求められた返信にも完成文を出します。

このスキルは既存の動画ファイルそのものを復元するものではありません。制作を続ける際は、案件の台本・素材・制作記録を併せて渡してください。

## 検査用コード

`skills/youtube-revenue-production/scripts/inspect_media.py` はPython標準ライブラリ、FFmpeg、ffprobeを使います。入力ファイルは変更せず、指定した検査レポートだけを書きます。使い方と判定の限界は「音声と納品」を参照してください。

```bash
python3 -m unittest discover -s tests -v
```

スキルの版を更新するときは、SKILL.md、参照資料、音声検査コードの関係を保ちます。特定の題材・音声サービス・動画尺・RPMを全案件へ固定しません。
