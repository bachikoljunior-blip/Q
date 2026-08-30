# CANDIDATE REVIEW — Jira Automation Guard

最終更新: 2026-08-30  
判定: **BUILD_APPROVED — FREE MVP ONLY**

## Exact workflow

`Jira Cloud管理者/導入支援会社が、1つまたは2つのAutomation rule export JSONを入れる → ruleを正規化し、版差分・ハードコードID・秘密情報らしき値・移行時に壊れやすい参照・読みにくい構造を検査する → 変更一覧、参照一覧、移行警告、Markdownドキュメントを受け取る → 無料MVP、Pro仮説¥4,980/月`

## Why this candidate was reviewed

自動marketplace scanとexact-match searchで、`jira-automation-rule-guard` は次の段階へ進んだ。

- 16種類のexact/marketplace/product/complaint/substitute検索
- 5件以上の商品ページ
- 5件以上の標準/無料/手作業代替
- 10件以上の公開不満ページ
- 複数ソースでversion control、rollback、compare/diff、export、migration/documentation等の反復言及
- 自動deep diveで70%以上のexact workflow重複0件

機械収集のURL、タイトル、ページ本文抜粋、価格表記、重複計算は以下を正本とする。

- `research/candidate_queue/latest.json`
- `research/candidate_queue/latest.md`
- `research/deep_dive/latest.json`
- `research/deep_dive/latest.md`

## Direct/adjacent competitors reviewed

既存商品は主に次の成果を売っている。

| category | representative products found in evidence | main outcome | overlap with candidate |
|---|---|---|---|
| Jira configuration backup/restore | Revyz / Rewind等 | 接続したJiraのバックアップ、復旧 | buyerは近いが、入力・処理・出力が異なる |
| Configuration migration/deployment | Salto / Configuration Manager / Project Configurator等 | site間の設定比較、移行、反映 | 差分は近いが、候補はAutomation export JSONの静的lintと文書化に限定 |
| Integration/migration tools | Getint等 | issue/data同期・移行 | Automation ruleの静的検査が主成果ではない |
| Atlassian native export/import | Jira Automation標準機能 | ruleの書き出し・読み込み | lint、可読ドキュメント、秘密/ハードコード参照検査、版差分レポートを主成果にしない |
| Manual Git/jq/docs | Git diff、JSON閲覧、手作業台帳 | 部分的な比較と記録 | 無料代替だが、正規化・ルール単位差分・参照分類・移行警告を一括では出さない |

## Duplicate veto — PASS

### What would have failed

- 同じbuyerがJira Automation export JSONを入れ、同じ静的lint・rule単位diff・参照警告・Markdown文書を受け取る商品
- 無料/OSSで同じ主要成果が得られるもの
- Jira標準機能で同じ主要成果が得られるもの

### Why it passed this review

取得できた商品ページは、アカウント接続型のバックアップ/復旧、構成移行、全体設定管理が中心だった。候補の中核は以下に固定する。

1. Jira認証情報不要
2. export JSONをブラウザ内だけで処理
3. rule単位に正規化して2版を比較
4. `customfield_...`、project/issue type/account ID、URL/webhook、tokenらしき文字列を参照一覧化
5. 移行前に人間が確認すべき箇所だけを抽出
6. 管理台帳として読めるMarkdownを生成

「日本語」「安い」「ローカル処理」だけを差にしていない。購入成果は、**Automation ruleを移行・レビュー・引継ぎできる可読な差分と警告へ変えること**。

## Acquisition gate

### Initial channel

- 無料のbrowser-local checkerを検索対象にする
- query: Jira automation rule export / compare / diff / documentation / hardcoded ID / migration validation
- Atlassian Marketplaceへ出せるForge版は、実利用Gate通過後にだけ作る
- 無料MVPからProのbaseline保存、GitHub同期、CI、複数site台帳へ接続する

### Why it is more concrete than “SEOする”

exact-match queueに検索語を固定済みで、候補はJira管理者が問題発生時に使う入力ファイルと成果物を持つ。隣接する有料Marketplace商品が複数存在し、購入者カテゴリ自体は確認できた。

### Remaining acquisition risk

検索ボリュームとMarketplaceからの獲得単価は未証明。無料MVPでqualified useを測り、流入が取れなければ終了する。

## Economics gate

価格仮説:

- Free: 1〜2 export、差分、lint、Markdown保存
- Pro: ¥4,980/月
- Pro候補: baseline履歴、複数site、GitHub同期、CI、共有台帳、独自ルール

保守的な初期計算:

- 月商30万円に必要: 61契約
- 決済/インフラ/Marketplace等を15%と仮置きした残り: 約25.8万円（税前）
- 手取り月20万円を狙う運用目標: 70〜80契約以上
- サポート上限: 1契約あたり月平均10分未満。超える場合はzero-touch不適合で終了/設計変更
- 顧客別設定・個別移行代行は販売しない

## MVP approved scope

- JSON貼付/ファイル読込
- 1版lint
- 2版rule単位diff
- generic schema traversal（特定export版だけに依存しない）
- rule名/ID/有効状態/trigger/action/conditionの可能な範囲での抽出
- hard-coded reference inventory
- `customfield_####` 検出
- project/issue type/account ID候補
- URL/webhook候補
- token/secretらしき文字列の警告（値を外部送信しない）
- duplicate rule name
- actionなし/disabled/巨大rule等の構造警告
- Markdown/JSON report保存
- sample export
- browser-local処理
- 匿名イベント計測

## Explicitly not approved

- Jiraアカウント接続
- 自動import/deploy
- ruleの自動修正
- credential保存
- AIによる曖昧な正誤断定
- Stripe決済
- Forge/Marketplace申請
- 顧客別移行支援

## Validation gate

最初の100 qualified unique devicesで:

- JSON解析30以上
- 2版diffまたはMarkdown保存15以上
- Pro意向5以上
- 実exportを解析不能にする重大schema incompatibility 0〜許容範囲
- secret値を外部送信する事故0

60日以内にqualified unique 100へ届かず週次増加もない場合、acquisition失敗として終了/降格。

## Kill criteria

- exact workflow 70%以上の既存商品を新たに確認
- Jira標準機能または無料OSSが主要成果を代替
- 解析率30%未満
- 保存/diff率15%未満
- Pro意向5%未満
- schema変更追従に継続的な人手が必要
- 平均サポート10分/契約/月を超える
- Marketplace/検索以外に個別営業が必要

## Approval boundary

この承認は**無料MVPの実装と公開だけ**。有料版、決済、Forge版はvalidation gate通過まで禁止する。
