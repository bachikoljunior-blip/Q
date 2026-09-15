# 戦闘比較記録

`combat-readability.json` は、同じ初期セーブ、明示した戦闘用fixture、390×844のThree.js投影、60 Hzの入力時刻から、実HUD bridge・入力調停・攻撃予兆・被弾を再生する検証記録です。`npm run review:combat` で再生成し、各条件を二度実行して結果が完全一致することも確認します。

収録するのは、従来の近接攻撃とボス衝撃波の5条件に加え、前方兵・画面外の側面兵・背後の衝撃波が重なる無反応／HUD追従、タッチとキーボードのattack/parry順序を入れ替えた計9条件です。本番と同じ `combat-hud.js` と `combat-input.js` を通します。

これはルール、DOMに渡す文字・属性、clip投影、入力調停の自動検証です。WebGLのピクセル、ブラウザーの実イベント、タッチ機器、音、iOS/Android性能、初見の分かりやすさや面白さは確認しません。通常のセーブへ読み込む用途ではありません。

`npm run compare:combat-view` は、同じ敵・巡礼者・予兆状態を固定し、カメラだけを4方向へ回します。基点 `9c5dd6a61dba5cb0b040e11aa52edb73028fb630` の巡礼者基準表示と、実ゲームと同じThree.jsカメラ配置式で得た投影X座標による表示を比較します。これもWebGLのピクセルを表示する試験ではありません。

`npm run compare:combat-priority` は v0.16.0基点と同じ三脅威・同じ入力を比較します。表示対象、画面外分類、操作語の数、表示どおり操作したHP、入力順序によるHP差、ゲーム状態の不変性を出力します。さらにv0.17.0相当の矢ごとの逐次予測と、現在のbatch/shared予測を、48矢の同じ本番HUD経路で交互に測定します。host時間をスマートフォン実機性能へ読み替えません。

`npm run compare:touch` は同じ三脅威fixtureを390×844と844×390で使い、直接入力した正解経路と、本番のtouch adapterへ三つのpointer IDで移動・視点・回避を同時dispatchした経路を各20回比較します。`touch-input-comparison.json` には状態digest、HP、選択操作、同時pointer数、終了後の残留入力、attack/parryの到着順比較を残します。本番の端末記録にも、同じadapterが受理したpointer種別・経路・同時数・移動量を座標なしの集計として含めます。

この比較はNodeの`EventTarget`に本番listenerを結び付けた検査です。ブラウザー固有の`PointerEvent`、CSSのhit test、物理的な複数指、WebGLピクセル、音、実機性能、初見評価は確認しません。正式previewまたは許可された実機が利用可能になったら、端末記録の開始セーブfingerprint、縦横別viewport、pointer集計を画面・音の記録と対応させます。
