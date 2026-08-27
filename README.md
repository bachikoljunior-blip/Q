# つづきから — AI引き継ぎパック

長いAIプロジェクトを、会話履歴に依存せず別セッション・別AIへ持ち運ぶための静的Webアプリです。

## MVPでできること
- 目標、現在地、制約、決定、次の行動を入力
- `START_HERE.md` / `PROJECT_STATE.md` / `DECISIONS.md` / `CONTEXT.md` / `RESUME_PROMPT.txt` を生成
- 表示中ファイル、統合Markdown、JSONバックアップを保存
- 下書きを端末内へ自動保存
- 長い会話から項目を抜くためのAI用プロンプトを生成
- PWAとしてホーム画面へ追加
- 公開カウンターで匿名の検証数字を確認

入力本文は外部送信しません。ページ表示や生成などのイベント名だけをMVP検証用の公開カウンターへ送ります。

## 開く
GitHub Pagesがmain/rootで有効なら、以下で公開されます。

`https://bachikoljunior-blip.github.io/Q/`

検証ダッシュボード:

`https://bachikoljunior-blip.github.io/Q/stats.html`

## 実験
詳細は `experiments/EXP002_TSUZUKIKARA.md` を参照。
