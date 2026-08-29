# EXACT-MATCH COMPETITOR SWEEP — 2026-08-30

## Purpose
過去4回の失敗原因は、問題市場の存在を確認した後に「同じ入力→処理→出力を既に提供する商品」まで潰し切らず実装したこと。

この調査では、アイデアの類似ではなく **購入者・入力・処理・出力・料金モデルが同じ商品** を探した。

## Result
**現在、BUILD APPROVEDの候補は0件。**

弱い5案目を作るより、商品を持たない状態を正しく記録する。

## Rejected workflows

### 1. Amazon FBA補てんCSV + 原価CSV → 原価割れ候補・不足原価・評価ばらつき・申請用出力
**判定: EXP004終了。ワークフロー重複率 90%超。**

Direct product:
- ReimburseOps — https://reimburseops.com/

重複:
- FBA reimbursement CSV読込
- sourcing-cost CSV読込
- 列自動認識/確認
- missing cost
- under-reimbursed: 支払額 < 原価×数量の90%
- same item/event valuation inconsistency
- landed-cost warning
- no Amazon login / no API keys
- flat monthly pricing, no success fee
- export / case-ready text / 60-day alerts

日本語、円、ローカル処理、日本語下書きは差だが、同じ成果を買う理由に対する未検証のローカライズ差でしかない。月額課金の根拠にならない。

Other alternatives:
- Amazon official IDR / Inventory Defect and Reimbursement portal
- TrueOps
- ClaimPilotPro
- Picaro / Goaltech
- マカド！

### 2. Amazon flat-file + processing report → エラーセル特定・安全修正・再アップロード用ファイル
**判定: reject。直接競合複数。**

- FlatFileFix — https://fixmyflatfile.com/
- SKUFix — https://www.skufix.shop/
- Flat Magic — https://flat-magic.com/
- StriveFormats Amazon CSV Fixer — https://striveformats.com/amazon-csv-fixer
- Amazon Processing Report Decoder — https://amazon-processing-report-decoder.vercel.app/

### 3. Shopify商品CSV → import error検査・自動修正・clean CSV
**判定: reject。無料を含む直接競合多数。**

- Shopify CSV Cleaner — https://shopifycsvclean.com/
- CatalogFixer — https://catalogfixer.cc/
- EcomCSVFix — https://www.ecomcsvfix.com/
- CSV Whiz — https://csvwhiz.com/
- ShopTools — https://www.shoptools.one/

### 4. 楽天RMS CSV → 一括編集・更新・Shopify変換
**判定: reject。国内直接競合あり。**

- おたすけCSV — https://www.intecrece.co.jp/ec/item/kinou.html
- CSVいらず君 — https://tsukutta.app/apps/8ec6ca46-1546-4d89-8b95-b949e7e29f80
- ForgeFlow 楽天→Shopify CSV — https://forgeflowtools.com/
- RakuUp — https://rakurip.com/product/rakuup/
- RenSync — https://rensync.jp/

### 5. AIで台本→音声→映像→サムネ→YouTube自動投稿
**判定: 商品化候補から除外。無料の完全自動実装が複数。**

- TubeAssistant — https://github.com/metiu1/tube-assistant
- Gemini YouTube Automation — https://github.com/ChaitanyaEswarRajeshJakki/gemini-youtube-automation
- AutoTube — https://github.com/Hritikraj8804/Autotube
- yutu — https://yutu.ifor.dev/

既存 `youtube` リポジトリは運用資産として残すが、パイプラインそのものを有料商品にする根拠はない。

### 6. Amazon settlement/orders/ads/COGS → SKU損益・入金照合・会計出力
**判定: reject。ローカル処理を含む直接競合あり。**

- SkuSum — https://www.skusum.com/
- ProfitPilot — https://tryprofitpilot.com/
- AmzDiag — https://www.amzdiag.com/en
- freee / マネーフォワード / Amazon管理SaaS群

## Permanent conclusion
- 「市場がある」はbuild許可ではない。
- 「日本語」「安い」「ログイン不要」「ローカル処理」は、既存と同じ結果を出す場合、それだけでは差別化として不十分。
- 直接競合が同じ入力→同じ判定→同じ出力を持つ場合、原則reject。
- 例外は、その未解決差に対して実際の前払い・乗換意思・既存ユーザーの反復不満が確認できた場合のみ。

次の候補は `research/PREBUILD_GATE.md` を通過するまで実装しない。
