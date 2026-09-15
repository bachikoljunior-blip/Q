# 人間の準備に依存しない検証工程

2026-09-15の指示「人間は介入しません」を適用する。人間へ端末、アカウント、スクリーンショット、評価者の用意を求めず、許可された検証と独立制作を進める。ゲームの完成基準と期限を変えず、取得できない実画面・実機・人間の評価を未確認のまま残す。

## 実行するもの

```bash
npm ci
npm test
node scripts/verify-main-runtime.mjs
node scripts/verify-gathering-runtime.mjs
```

既存のGitHub Actions `Validate game` は従来の全進行・保存・touch比較・build・package・成果物鮮度検査を維持し、この統合検証と負例比較を追加する。新しいautomation、外部サービス、browser、server、アカウント、支出、CI書込み権限を作らない。workflowの `contents: read` を保持する。

`main-runtime-fixture.mjs` は実際の `src/main.js` を既存のesbuildでbundleし、隔離したNode VM内で評価する。実際の `index.html` と実際に生成されたpanel文字列から対象要素を作る。存在しない要素や未対応のAPIを自動生成して通さない。scene・audio・CSSのdevice境界だけを明示的に置換し、Game、SaveStore、LifecycleGate、入力queue、touch adapter、HUDの実コードを通す。ゲームsourceへtest用exportや動作分岐を加えない。

8条件を390×844 / 844×390の2入力寸法で実行する。寸法は数値fixtureであり、レスポンシブレイアウト検証ではない。

| 条件 | 確認する実接続 |
|---|---|
| 開始→移動・camera・攻撃→blur→再開→BFCache | 起動の多重受付防止、実frameへの入力、camera所有権と長押し解除、pause、明示再開 |
| scene読込中のblur | 読込が後で完了しても勝手に旅へ戻らず、保存後pauseする |
| scene読込中のhidden→visible | 非表示を跨いだ遅延完了をpauseする |
| scene読込中のpagehide | ページ離脱を跨いだ遅延完了をpauseする |
| タイトルで非同期save読込中に離脱 | 読込開始時の中断をscene開始へ伝え、正しいsaveを保存してpauseする |
| 遊戯中の非同期save読込・無効file | viewへ新Gameを接続し、中断時pause。無効fileは現在のGameと保存を維持 |
| scene読込失敗 | fatal表示、起動操作解除、旅をactiveにせず、保存せず、audioをsuspend |
| storage書込み失敗・gamepad例外 | 保存済みprimaryを保ち、入力解除とpauseとaudio境界への呼出しを継続 |

## 旧検査との同条件比較

比較対象はv0.19.0の同じmain sourceへ一箇所ずつ加える意図的な接続欠陥。公開ゲームの欠陥数ではない。checkoutは書き換えず、隔離した一時copyへ既存の `touch-controls.test.mjs` と `lifecycle-gate.test.mjs` をそのまま置いて実行する。既存の9検証が通った後、新しい実入口シナリオがassertionで失敗することを要求する。fixture例外・build失敗を欠陥検出へ数えない。

| 意図的な欠陥 | 既存9検証 | 新しい統合検証 |
|---|---|---|
| scene開始後の中断判定を無視 | 通過 | 2入力寸法とも検出 |
| 遊戯中のsave読込後の中断判定を無視 | 通過 | 2入力寸法とも検出 |
| mainからtouch所有権を解除する呼出しを無効化 | 通過 | 2入力寸法とも検出 |

初回成功runはmain source SHA-256を含む `artifacts/main-runtime-report.json` に保存。bundle 25.501 ms、16条件の合計host実行1,080.100 ms。既存9検証の別processは各143.542–150.379 ms、新しい該当検出は各41.896–100.075 msだった。テスト数・process起動費・測定範囲が異なるため速度倍率を算出しない。ゲームのFPS、端末性能、全制作速度でもない。初回候補のPromise待ち順の誤りはfixture側で修正した。

非同期待ちは各5秒で失敗し、同期無限loopを含むCI全体はworkflowの10分上限に従う。5秒で全同期処理を割り込める保証ではない。欠陥を入れた隔離copyの実行ではexit 1でも `passed:false` とassertion失敗をJSONへ保存できた。

CIではrunごとのJSONを `Q-main-runtime-evidence` artifactへ保存する。負例のanchor消失、旧検査の失敗、新検査の見逃し、fixture例外はgate失敗であり、受入条件を自動で緩めない。負例は構成部品の単体検証に加える防御であり、全不具合の検出保証ではない。

## 証拠の限界と次の実作業

HTMLは要素の登録・生成を検査するための限定parserで、browser DOMの代用品ではない。イベントは対象へ直接dispatchし、nativeのbubble、pointer capture挙動、hit test、WebGL描画、音声装置、実OSのlifecycle順序を再現しない。frameは手動で進め、模擬描画counterは性能測定に使用しない。scene loadとfile readの意図的な遅延はPromiseを制御するもので、実通信やブラウザーのmicrotask順序の証明ではない。

正式previewが使えない場合は、同じ失敗したstartの再試行、直接server、別URLや別browserへ進まない。AI側が正式経路の状態と利用条件を調査し、環境が復旧した証拠がある場合だけ公式手順に戻る。人間の実機・実聴・30分実プレイ・外部比較は未確認として維持する。

## 徒歩獲得saveから相談の実入口を検査する

`verify-gathering-runtime.mjs` は `review:saves` が新規開始から徒歩・戦闘・依頼を完了して作った `hearth-middle.json` と `road-watch-middle.json` を、そのまま入力にする。両ファイルのraw SHA-256をreview済み値へ固定し、生成経路の意図しない変更をgateで拒否する。各saveをSaveStoreの「旅をつづける」とタイトルのJSON読込から別runtimeへ入れ、390×844 / 844×390の数値条件で次を通す。

- 本番mainをbundleした入口でSceneView読込を一回だけ要求し、読込完了まで旅を始めない。
- 実Gameの最寄り人物を `interact` し、次frameのevent処理、住民panel、動的生成された「皆で話す」を経て相談panelを開く。相談関数を直接呼ばない。
- 2 / 3では現在行の全文と既読1行、3 / 3では現在行の全文と既読2行、choice直後のdoneと別runtime reloadでは履歴3行全部を区別する。期待する各 `{speaker,text}` はproductionの表示計算から独立して固定し、段階ごとの件数、話者、全文、順序付き配列のdeep-equalを要求する。開く操作はGameと保存を変更せず、選択だけが正規saveへ残る。
- SceneView呼出し記録へ正規の `focusGathering(id)` が届き、次の `update` で同じモデル化focusを観測する。blur、hidden→visible、BFCacheのpagehide→pageshow中も開いた相談を保持し、閉じると `focusGathering(null)` を記録して音の開始要求とGame loopを再開する。
- 選択後の保存を新しいruntimeへ読み直し、結果panelと選択を復元する。continueとtitle importの完成save SHA-256が一致する。

SceneViewはcreate / focus / updateの呼出し記録だけで、fixtureが保持するfocusは境界契約のモデルである。production `SceneView.focusGathering` の内部効果、`SceneView.update`、Three.js、WebGL rendererは実行しない。既存の純粋配置試験は別に維持するが、その結果を入口からカメラが実行された証拠に足さない。数値viewportもCSSレイアウトや縦横画面の証拠ではない。

PR #30時点は旧 `gathering-presentation.test.mjs` 6検証が通るようsource文字列を残したまま、(1) focus呼出し、(2) focus解除、(3) 選択結果の再描画、(4) 既読履歴の重複を一つずつ混入した。旧検証が4/4を見逃し、新gateが二場面×二寸法の16/16を検出した結果自体は有効。ただしbeat 1の一行しかexactに検査せず、複数行reverseが通ったため、履歴全体の順序・話者・全文exactを証明していなかった。

PR #31では履歴負例をdone後段だけのduplicate、複数行reverse、2件目誤話者、2件目誤全文へ分解し、focus / release / rerenderと合わせて7件とした。旧6検証は7/7を通過し、新gateは7欠陥×二場面×二寸法の28/28を欠陥固有assertionで検出する。production側reverseを独立注入した再監査でもexit 1、`passed:false`、順序assertionで拒否した。fixture例外、compile失敗、別assertionの失敗、旧検証自体の失敗は検出に数えない。runの入力hash、経路、host時間、失敗診断は `artifacts/gathering-runtime-report.json` に保存し、save欠落・parse失敗・hash不一致もreport初期化後の `try/finally` 内で捕捉する。3つの異常入力を別processで入れ、exit失敗後も `passed:false` と欠陥別診断をJSONへ残す回帰試験を通す。CIは `Q-gathering-runtime-evidence` をalways-uploadし、JSONがなければupload stepも失敗する。

このgateで確認したのは本番main、Game、SaveStore、lifecycle listener、生成UIとSceneView呼出し境界の接続。browser DOM/CSS/hit test/native event、実SceneView/WebGLのカメラ画面、物理touch、実聴、実機性能、人間の実プレイ、外部比較は未確認のまま。次の自動作業はgate件数を増やすのでなく、権利・出典・hash manifest付きasset、閉じた空間、整合するprop、固有enemy、animation、ambient / SFXを含む完成縦切り二本A/Bを通常entrypoint / save / buildへ実装し、制作・回帰・package時間、失敗、増加bytes、再利用率を測ること。保存やゲームルールを短絡する一般向け機能は追加しない。人間の準備は開始条件にせず、取得不能な証拠は未確認として残す。
