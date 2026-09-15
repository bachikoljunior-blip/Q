# 人間の準備に依存しない検証工程

2026-09-15の指示「人間は介入しません」を適用する。人間へ端末、アカウント、スクリーンショット、評価者の用意を求めず、許可された検証と独立制作を進める。ゲームの完成基準と期限を変えず、取得できない実画面・実機・人間の評価を未確認のまま残す。

## 実行するもの

```bash
npm ci
npm test
node scripts/verify-main-runtime.mjs
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

次の自動作業は、既存の徒歩獲得saveから相談UI→SceneViewの実呼出しを同じ入口で検査すること。保存やゲームルールを短絡する一般向け機能は追加しない。画面がないことだけで全制作を止めず、検証できた範囲と欠けた範囲、同種工程の時間・手戻りを記録して次の制作単位を選ぶ。
