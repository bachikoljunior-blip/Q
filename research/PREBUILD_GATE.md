# PREBUILD GATE — mandatory before any fifth product build

最終更新: 2026-08-30

## Status vocabulary
ユーザーへの説明とリポジトリでは、必ず次のいずれかを明示する。

1. `NO_ACTIVE_CANDIDATE` — 合格候補なし
2. `RESEARCH_ONLY` — 調査中。商品ではない
3. `OFFER_TEST` — 価格付き需要テスト。製品未実装
4. `BUILD_APPROVED` — 下記Gate通過。実装してよい
5. `LIVE_FREE_MVP` — 無料MVP公開済み。有料商品ではない
6. `LIVE_PAID_PRODUCT` — 決済と提供が稼働
7. `CLOSED` — 終了。追加工数禁止

`RESEARCH_ONLY` や `OFFER_TEST` を「商品を作った」と表現しない。

## Step 1 — exact workflow definition
候補を1文で固定する。

`[buyer] が [input] を入れる → [processing] → [output/outcome] を受け取る → [price model]`

抽象語は禁止。「AIで効率化」ではなく、入力ファイル・判定・出力を列挙する。

## Step 2 — exact-match search
実装前に最低12検索を行う。

必須検索軸:
- 日本語の input + output
- 英語の input + output
- platform + pain + tool
- platform + pain + pricing
- platform + pain + free
- platform + pain + GitHub/open source
- exact input + exact output
- Chrome Web Store / App Store / Shopify / WordPress / Atlassian 等の該当marketplace
- Gumroad / BOOTH / AppSumo 等の買い切り商品
- Reddit / forum / reviews の不満

最低:
- 直接競合5件
- 代替手段5件

5件未満なら「見つからなかった」で済ませず、検索語と検索面を変える。

## Step 3 — workflow overlap matrix
競合ごとに以下を比較する。

- buyer
- input
- processing
- output
- delivery model
- price
- acquisition channel
- support burden

同じbuyerで、input・processing・outputのうち2つ以上が一致し、最終成果も同じならdirect competitor。

### Duplicate veto
以下のいずれかなら原則reject。

- 同一workflowが70%以上重なる商品が1件以上
- 無料/OSSで主要成果が得られる
- 大手プラットフォームの標準機能が同じ成果を出す
- 差が「日本語」「安い」「ローカル処理」「ログイン不要」だけ

## Step 4 — vetoを覆す証拠
重複候補を続行できるのは、未解決差について次のいずれかがある場合だけ。

- 価格を明示した予約購入・前払い5件以上
- 対象ユーザー20人以上のzero-touch回答、そのうち5人以上が現在競合へ支払っており乗換理由を選択
- 直接競合の公開レビュー/フォーラムで同じ未解決不満10件以上
- 自社が既に持つ配信面から、対象購入者へ継続的に到達できる実測データ

「便利そう」「日本にはなさそう」「自分なら使う」は証拠にしない。

## Step 5 — acquisition gate
商品を作る前に、購入者がどこから来るかを固定する。

許可される例:
- 検索需要があり、直接競合より狭い明確なqueryを取れる
- アプリ/プラグインmarketplaceに既存需要がある
- 既存YouTubeなど所有チャネルに対象者の実測流入がある
- 有料広告の獲得単価を小額テストで確認できる

「SEOする」「SNSで広める」は経路ではない。

## Step 6 — economics gate
手取り月20万円を基準に計算する。

最低記録:
- 価格
- 粗利率
- 解約率仮説
- サポート時間
- 必要有料顧客数
- 必要無料流入数
- 獲得単価上限

顧客数が本人作業量に比例する案はreject。

## Build approval record
`research/ACTIVE_CANDIDATE.json` を更新し、以下が揃うまで `build_approved` をtrueにしない。

- exact_workflow
- search_queries >= 12
- direct_competitors >= 5
- substitutes >= 5
- overlap_matrix_complete = true
- duplicate_veto = PASS
- acquisition_evidence
- economics
- differentiator_evidence
- kill_criteria

## Repository rule
- 次の新商品コードは `product/` 配下にだけ作る。
- `build_approved=false` の間、`product/` に実装ファイルを置かない。
- landing pageも `OFFER_TEST` へ進む証拠がない限り作らない。
- Gateを通すための内部調査コードは `research/tools/` に置く。

## Why this exists
EXP002〜004では、類似市場を見ただけで実装し、後からほぼ同一商品を発見した。このGateは、その再発を止めるための強制手順である。
