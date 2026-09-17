# 右手・剛体杖adapterの独立技術レビュー

**修復版 `264debb52543aca973ee5cf5883d8472f35a6d45` を、立位のCPU接続adapterとして条件付き受理する。今回の有限検査で未解決の必須source修復は0。** 初回 `51f105b0f8a7834f498c24ae5c783c669776f4b4` の5再現不具合は修復を独立確認した。runtime採用、指の把持、全身組立や画面の合格ではない。

作者の `verify.mjs` や保存済み合格値は独立測定へ流用しない。独自scriptは入力source5ファイルが指定commitのGit blobとbyte一致することを検査する。初回判定・数値を `REVIEW-initial.md` / `RESULT-initial.json` に残し、初回証拠commit `f3197b6e59491ec2c243a89d255959ae09655783` も保持した。

## 修復の閉鎖

`attachment.mjs` の `chainError()` がconstructorとupdateの冒頭でfinite変換、腕のunit scale、elbow `[0,-.33,0]` / hand `[0,-.31,0]` を検証する。更新時のworld伝播・回転書込より前に拒否することを実入力で確認した。

| 再現条件 | 修復版の独立結果 |
|---|---|
| hand scale NaN / elbow scale NaN / hand translation NaN | `nonfinite-arm-transform`、`ok:false`、杖非表示、腕回転無変更、以前のfinite杖行列を保持 |
| hand Y=-.36 / elbow X=.03 | `changed-arm-translations`、同じ無変更・非表示処理 |
| hand quaternion NaN | `nonfinite-arm-transform`、pose無変更、次の正常animate→updateで復帰 |
| 作成時のNaN手scale・無限elbow位置・NaN腕quaternion・変更された下腕長 | constructorが拒否し、actorの子・poseに変更なし |

初回の5入力を含む更新時13負例と作成時4負例を検査した。既存の無到達、terrain NaN、root zero scale、親の反射/NaN、有限の非unit手scale、水平heading不定も拒否し、次の正常入力で復帰する。無効骨そのものの値を勝手に修復する処理ではない。

## 正常条件と独立実測

実 `SceneView` constructor・update・NPCの実配置を使用した。rendererおよびbrowser画像loaderはNode用の明示的な代役で、rendererはnative matrix更新だけを行う。既知の正式GL Disabledを再試行していない。別条件ではnative Scene→Group→Group→actorの回転・非一様scaleや呼出間の親変化を使った。

6条件×呼吸9時刻＝54frame、19part＝1026配置を検査。握り点は作者値 `[0,-.074,-.044] m` と杖Y=1.135 m、平地origin `[-.46,0,.22] m`、全長1.7 mを独立oracleへ明記し、adapterが返した残差だけを照合値にしない。

| 項目 | 最大差（メートル） |
|---|---:|
| 実hand行列の握り点 ↔ 実staff行列の握り点 | 1.7763568394002505e-15 |
| 実staff握り点 ↔ 作者指定のworld接地目標 | 1.5203165631859585e-14 |
| 杖下端 ↔ world terrain | 1.7763568394002505e-15 |
| 全19partの実world頂点サンプル間距離 ↔ 元部品距離 | 1.0706713293728853e-14 |
| 胸frameの実330/310 mm関節長 | 9.048317650695026e-15 |
| 同一入力のworld行列再呼出差 | 0 |

上表はCPUの浮動小数点演算結果で、画像からの寸法測定や見た目の精度ではない。全長1.7 m・鉛直方向も各frameで確認した。partごとの実world行列と、元part局所配置の一致を検査し、staff rootだけを見た判定にしていない。

- 41骨の順序/restと、update前後の全bone translation/scale、指定3骨以外の回転を保持する。胸呼吸の非一様scaleを打ち消したと偽装しない。関節長の330/310 mmは胸frameの値であり、非一様scale下のworld骨長を一定と呼ばない。
- 全既存skinのweight/index、bind matrix、bone inverseと全杖geometry byteは不変。実skinningの1944頂点サンプルがfiniteであることを確認した。肌表面の接触や服の衝突の合格ではない。
- 同一入力256回で累積drift0。正しい呼出順は `actor.animate → adapter.update → scene/render`。逆順の負対照では次のanimateが腕を上書きし、握り点差510.420683 mmが生じた。最後のupdateで0へ戻った。現sourceへ実runtime呼出は追加していない。
- 作者提供の2 testsも別途実行し2/2成功（572.056075 ms）。これは独立値の代用ではない。最終独立script実行1.758954178秒は、scene構築・検査・serializationを含むCPU検査時間で、描画フレーム費用や全制作時間ではない。旧sourceの費用記録は修復版の費用へ転用しない。

## 採否の境界と再実行

固定基点からの差分は研究adapter・検査・資料だけで、runtime import、Game/save、新shape、bone restのsource変更は0。レビュー担当の編集は本フォルダのscript・結果・報告だけで、修復sourceは作者の固定commitから読み直した。remote・main・Site操作0。

採用範囲は、固定actor構造・正常な単位腕scale・変更されていない330/310 mm連鎖・指定順序で使う立位研究adapter。staff局所matrixは逆親変換によるshear補償を含め得るため、分解やmatrixAutoUpdate有効化は契約外。外部の再parent、別骨格、geometry差替え、移動/死亡時の自然なfallbackはこの検査の受理範囲ではない。

指surface grasp、袖/前腕clearance、旧runtime杖の除去、歩行/死亡/遷移の成立、全身組立、実描画・素材・GPU/実機・指定10作品比較は未検査。全小部品資料と全体対応の先行条件、全画面PS4目標と2026-09-20期限を保持する。本検査のみから期限内の全品質達成を肯定しない。

```sh
node docs/evidence/mira-assembly-v65/staff-attachment-review/independent-check.mjs 264debb52543aca973ee5cf5883d8472f35a6d45
```

このscriptは対象sourceが指定commitと一致しなければ失敗する。正本数値・開始終了時刻・source hashは `RESULT-fixed.json`。担当canonical ID、実時間と作業境界は `WORK.json` に記録する。新子の起動0、未完了tool0で有限レビューを閉じる。
