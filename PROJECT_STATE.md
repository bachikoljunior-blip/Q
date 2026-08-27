# PROJECT STATE

最終更新: 2026-08-27

## Goal
本人の継続労働への依存が小さい月収20万円を可能な限り早く構築し、生活のための労働を不要にする。20万円は最低ライン。

## Non-negotiable operating constraint
**原則、人と関わらずに運営できること。**
- 個別営業、電話、面談を主戦略にしない
- 顧客ごとのヒアリング/制作/納品を主商品にしない
- 顧客数に比例して本人の作業量が増えるモデルを避ける
- 自動販売・自動提供・自動決済・自動解約を目指す
- 初期の制作、実機確認、改善判断は許容する

## Resources
- 月間追加資金: 0〜10万円（投資込み）
- 週の可処分時間: 約18時間
- 主端末: iPhone
- コーディング経験なし。ただしAIに要件を与え、GitHub上で複雑なYouTube自動化システムを構築・改善・運用させた経験あり
- 対人営業耐性: 3/10
- 顔出し・声出し・実名: すべて可
- 既存オーディエンス: ほぼなし
- YouTube自動化資産: `bachikoljunior-blip/youtube`
- AIとの長時間対話は苦にならない

## Current phase
**Phase 2: zero-touch MVPを公開し、需要を計測する**

## Selected experiment
**EXP002 — つづきから / AI引き継ぎパック**

長いAIプロジェクトの目標、現在地、決定、次の行動を5つのファイルへ変換し、別セッション・別AIへ持ち運ぶ日本語スマホ向けツール。

選定理由:
- ユーザー自身の実際の問題を解く
- 利用者自身の入力を加工するので外部情報との現実差が小さい
- 無人提供可能
- 静的無料MVPを短期間・低コストで作れる
- 有料競合が複数あり問題市場は存在する

## Built 2026-08-27
Qのmainへ以下のMVPを追加:
- `index.html`, `styles.css`, `app.js`
- PWA (`manifest.webmanifest`, `sw.js`)
- `privacy.html`, `stats.html`
- SEO (`robots.txt`, `sitemap.xml`)
- 匿名イベント計測
- 5ファイル生成、コピー、保存、JSON復元、AI抽出プロンプト
- `.github/workflows/smoke.yml` によるpushごとの自動検査

## Deployment / validation status
- GitHub Pagesのbuild・deployは成功
- 公開URL: `https://bachikoljunior-blip.github.io/Q/`
- 検証数字: `https://bachikoljunior-blip.github.io/Q/stats.html`
- スマホ幅のブラウザ試験で、サンプル入力→5ファイル生成→タブ切替を確認
- 初回生成時に1つ目のファイルが空になる不具合を発見し、hotfix後に再試験済み
- GitHub ActionsでJavaScript構文、静的ファイル、ローカルHTTP、匿名カウンター接続がすべて成功

## Business hypothesis
無料手動版で利用を集め、完全自動抽出、矛盾検出、版管理、GitHub同期をPro（月額¥980仮説）にする。売上20万円には約205人が必要で、手取り20万円にはさらに多い有料会員が必要。

## Validation window
### 14日
- ユニーク端末30
- 初回生成10
- 初回保存5
- 自動版希望3

### 30日
- ユニーク端末100未満で週次増加なし → 降格
- 初回生成率10%未満 → UX/問題変更
- 有料意向3%未満 → 課金機能変更

詳細: `experiments/EXP002_TSUZUKIKARA.md`

## Previous experiment
EXP001（高単価AI個別サービス）は、人との個別対応が必須条件に反するため終了。再開しない。

## YouTube
`bachikoljunior-blip/youtube` は自動運転の副戦線。主戦略の開発時間を奪わせない。将来は自社ツールへの集客導線として再利用可能。

## Immediate next action
1. iPhoneで公開URLを開き、サンプル→生成→統合保存を1回実行する。
2. JSONバックアップを保存し、フォームを消してから復元する。
3. `stats.html` でイベントが増えたことを確認する。
4. 実機で問題がなければ、検索向け説明ページと短いデモを公開し、14日間の流入→生成→保存→自動版希望を測る。

## Resume instruction
別セッションのAIへ: `START_HERE.md` → このファイル → `DECISIONS.md` → `experiments/EXP002_TSUZUKIKARA.md` の順で読む。同じ診断を再質問せず、Immediate next actionから続ける。終了時にこのファイルを更新する。
