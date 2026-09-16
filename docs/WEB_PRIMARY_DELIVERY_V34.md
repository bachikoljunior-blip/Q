# 通常プレイをWeb配信へ統一

2026-09-16の直接指定「容量不足がネックなら今のプレイする方法を見直すのはどうですか？」を受け、通常のプレイURLと複数ファイルの配信を一次提供にした。基点は `7cbff3c899b789d4087b3ff2cc572f62818f9e24`。ゲームのsrc・media・public・Vite・hosting設定・package-lockは変更していない。所有者限定の既存URL、通常main統合後の正式Sites配信という順序も保持する。この単位はローカルの実装であり、まだSite公開の証拠ではない。

旧 `test:artifacts` の16MiB条件は、全mediaを詰めたHTMLをGitへ保存する工程上のローカルguardだった。Sitesの全ファイル総量上限を実証した数値ではない。通常の公開ファイルは既に分割されているので、単体HTMLの大きさを画質採用条件から外す。Sites独自の総量quotaは未公表であり、無制限や将来の容量保証とは扱わない。初期JS165000 byte未満・3チャンク、素材出所、遅延ロード、sourceの同一性検査は維持した。

| 同じruntime素材の生成物 | byte |
|---|---:|
| 通常Webの34 public files | 12,585,792 |
| うち媒体27件 | 11,441,662 |
| 初期JS／3チャンク中のentry | 164,988 |
| 任意の単体HTML | 15,498,171 |
| Gitへ保存するWeb receipt | 12,457 |

媒体27件は基点の元ファイルと全byte一致。通常Webと単体HTMLの差2,912,379 byteは異なる包装のファイルサイズ差であり、回線速度・HTTP Range量・起動時間・decodeメモリーの改善率ではない。独立した起動phaseの調査は統合担当へ別途返却されている。画面全体のPS4相当品質・実機・実聴・指定作品比較は未判定で、2026-09-20の完成根拠不足をこの包装変更だけで解決したとは扱わない。

## 通常経路

`npm run build` → `npm run package` → `npm run test:artifacts`。

Viteの現manifestに含まれる出力だけを既存stagerが `artifacts/site-*/dist/` へ集め、`artifacts/latest-site.json` が固定ディレクトリを指す。通常packageは全ファイルのbyte数/SHA256、元mediaとの対応、build fingerprint、manifestとhosting設定のhashを `release/Q-web-manifest.json` へ記録する。receiptには時刻・Git HEAD・ランダムなstage名を入れず、同じ入力と出力から同じbyteを再生成できる。記録名は配信準備の内容明細であり、公開成功を表すものではない。

検証はsource→Vite→固定stageの全media byte一致と、stage inventoryの欠落/余剰/重複・改竄、現在のViteが出す相対JS import、静的 `new URL(file, import.meta.url)`、CSS URL、HTML/manifest iconの参照を検査する。各mediaは少なくとも一つ現出力から参照されることも必須。data URLとfragmentは許容し、外部/絶対URLや出力外への参照を拒否する。任意のJavaScriptを静的に解釈する検証器ではなく、固定Vite producerの現在の出力形式を対象とする。既存の写真/HDR/肌/forest/vault/scoreの出所、元データ・未使用原素材の非配信条件は通常gateに残した。

`test:artifacts` は検証対象を勝手に作り直さない。再ビルド後は再度packageし、その固定stageとreceiptを検証する。配信中はhardlink元を含めdistを変更しない。CIは現在receiptのGit差分なしを必須にし、検証したstageのWebファイルとreceiptをuploadする。Siteへ渡すのは引き続き正規ownerが選んだ固定stageである。

## 任意の単体版

通常Web検証後、`npm run package:standalone` → `npm run test:standalone`。

`artifacts/Q-ash-pilgrim-standalone.html` と `artifacts/standalone-encoding.json` を生成する。既存のlossless q85と元MIME復元、全27媒体の完全byte埋込み、起動/遅延world読込/明示decoder失敗後のタイトル復帰fixtureを保持した。大HTMLはGit必須blobから外し、旧版はGit履歴に残る。通常packageにはencoder/decoder importがない。module resolution hookでそのimportを禁止した実package呼出しも通った。既存pure codec testsは通常テストに残し、実大HTML生成fixtureはoptional gateへ分けた。

CIのpush/PRでは通常Webを検証する。単体版はworkflow_dispatchのboolean `standalone` を明示したときだけ独立生成・検証・artifact保存する。公開設定や初期runtimeへのdecoder追加はない。

## 検証

- 独立review: 正しいphoto.pngは受理し、実Vite形式のmissing.png参照は拒否。初回に取り逃した媒体URLを修復し、同じ独立oracleで再検査した。原oracle/JSON/hashをevidenceへ保全。
- focused9 tests: receipt再現性、欠落/余剰/重複/byte改竄、JS import/media URL欠損・全参照消失、unsafe path、元mediaとの差、optional媒体の有効なbyte改竄、default packageのcodec非実行。
- 任意のactual standalone2 tests: 全27媒体のbyte/MIME、実束ねたproduction JSのtitle/launch/decoder失敗経路。DOMとdevice adaptersは明示したNode fixture。
- `verify-main-runtime`: 18 scenarios、3 negative controls／6 detections。main/srcは無変更だが新fingerprintとの接続を確認。
- 実build/package/artifactsと、別stageへのreceipt完全再生成を確認。CIのupload先/optional条件はローカルinterface照合であり、GitHubのremote CI実行結果ではない。

同一正式execで一度、処理開始前のtransport rejectionがあった。新writer/別経路は作らず、親と成功済み範囲を共有し、正式execの復帰確認後に同じ作業を継続した。開始05:53:41 UTC。最終保存時刻とsource hashesはevidenceへ記録する。全体actor testsの反復はこのruntime無変更単位では行わず、最終結合gateは統合担当が実施する。
