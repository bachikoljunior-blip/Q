# Mira: 頬から顎までの7配置を接合した候補 v63

固定基点は `22d1d041dd6aef60de7764b1eebf6cf78028c857`。これは本編外の部分組立であり、完成顔や runtime 採用ではない。`src`、既存頭・目・髪・首・保存・カメラ・素材は変更していない。新しい画像資料を先に生成・実見し、限定した使用範囲を統合担当と確認してから実曲面を作った。

## 使用した資料と不採用範囲

- 同一人物の基準は `docs/evidence/character-reference-v60/references/mira-head-views-v1.png` と `mira-complete-six-views-v1.png`。本人 R=-X/L=+X、顔+Z、上+Y。灰青眼や髪分け目を今回作り直していない。
- F05/F09 は既存 `mira-face-patches-F01-F05-F09-v2.png` の大まかな曲面の種類だけを使用。既存独立レビューが指摘した倍率・裏箱・共有辺未定義は継承し、画像の厚い縁、grain、裏囲いを作っていない。F01 と直結して眼窩を塞ぐこともない。
- F07/F11 は正式 builtin image_gen で新規1枚と具体修正1回。原PNGと2promptを `references/` に保存。どちらも1536×1024 RGB。v1は隣接の隙間と高すぎる UNDERSIDE、v2は配置の連続と薄い下側弧が改善した。
- v2でも isolated F07 の凹み、FRONT/3Qの差、厳密な同物体投影は確定していない。**全sheet合格ではない。** 採用するのは部位/連続配置と中央顎先の大まかな形。F07の凹みはcanonical頭に読める範囲を根拠に作者が曲面へ設定した。画像pxを精密寸法/深さへ換算していない。統合担当がこの限定解釈での試作を明示承認した。
- 生成画像は架空の設計資料であり、写真、scan、ゲーム画面ではない。既存MakeHuman由来頭はCC0出所を維持し、今回は比較用に読み取った。新曲面の制御点は作者仕様で、旧頭の頂点コピーやportrait貼付ではない。

## 実3Dと接合

`review/head-micro-v63/surfaces.mjs` の8本の横断Bezier曲線と共通接線から、4固有型を7配置へ構成する。F05-R → F07-R → F09-R → F11 → F09-L → F07-L → F05-L。左右対称は今回の作者仕様で、生成顔の完全な左右対称を証明したものではない。

513頂点/896三角形、各配置128三角形。6つの接合は同じ頂点index、position、normal、UV、head weightを共有する。両側の独立評価でも位置差0m、法線vector差最大2.80e-15、縦接線差9.12e-17m。共通Bezier derivativeによるC1接合であり、別々の面へ平均normalを付けて隙間を隠す方法ではない。共有辺に埋合せ三角形、caps、二重皮膚はない。

数値寸法は `metrics.json` の partBounds、正確な共有曲線/接線は interfaces、元16制御点は source に記録。F07中心は縦両端のchordからZ方向−2.648mmで、作者の浅い凹み設定。これは校正済の人体寸法ではない。図の内側切口や上頬切口は未制作の口周囲/鼻/眼下へ接続する境界であり、完成輪郭ではない。

UVは面全体で連続する新しいribbon chart。正方向面積を確認したが、既存2048肌atlasとの対応、texel密度、歪み品質、材質は未実装。全頂点の仮weightはhead=1。現rigの頭ローカル座標へ登録したが、首や顎下の残りとは未weldで、表情や口の変形にも未対応。

## 実施した検証

`node --test tests/mira-head-micro-v63.test.mjs` は3件成功。接合頂点を1mmずらす、三角形を反転する、UVを反転する負例を拒否。896面で退化0、non-manifold0、内部winding不一致0、境界1周128辺/Euler1。最小面積4.752e-6m²、面と頂点法線の最小dot .96755。これは開いたdisk状表面の確認であり、閉じた頭部の証明ではない。

`node scripts/export-mira-head-micro-v63.mjs [outputDirectory]` は実Threeと既存 actor source を読み、head/neck位置とidle/walk/hit/death(.45s)を確認。各poseで別々に評価した接合両側の位置差0、法線差約2.81e-15以下。weight1によるCPU頭骨登録であり、新SkinnedMeshをゲームへ組み込んだ検証ではない。旧fixtureの歩行/被弾がidleだった記録は `metrics-before-fixture-fix.json` に保持し、入力修復後は actualMotion を明示assertした。source geometryの手戻りは0。

旧頭の目中心2点・口中心・鼻先への正面両面rayで候補による遮蔽0。ただし全眼面や全角度/口表情を保証しない。既存head bone位置はneckから(0,.16,0)、neckはchestから(0,.6,0)、bind head world=(0,1.745,0)。骨/名前/既存sourceを変えていない。

候補513点から旧indexed頭への最短距離はmedian4.883mm、p9512.186mm、最大15.358mm。これは旧頭との形の差であり、生成顔との一致得点でも改善率でもない。旧面に重ねたregistration図は位置関係の比較資料だけ。本編へ両面を重ねて完成顔にしていない。

## 図、費用、時間、未完了

`assembly.obj` と7個の部品OBJ、`assembly.json` は実sourceから出力した。`cpu-four-views.png` と `cpu-old-head-registration.png` は同じ頂点の正射影線図で実見済み。WebGLの画面や見栄えの合格ではない。再現は `python review/head-micro-v63/plot.py [outputDirectory]`。材質や照明をゲームに似せて代替画面を作っていない。

将来Float32のposition/normal/UV/4index/4weightとUint16indexにした単純属性量は38,208B。現データはCPU配列でありGPU実常駐ではない。runtime import/追加runtime byteは0、全actor予算やdrawは未評価。初期JS・既存guardの変更は0。

`timing.json` に仕様/生成/修正/実装/検証markerを分けた。builtin呼出しは初回51.0秒、修正50.3秒。実装marker→最初の実meshは83.103秒、そこから検証・図・実見・誤fixture修復・記録が続く。constructor約3msを一瞬の制作速度としない。最初のpreflightは計時前であり、marker窓は通信/思考を含む経過時間。

採否は**連続した下顔面帯の研究候補として保全、runtime顔として未採用**。精密な原画再構成、全顔の残り、首/眼下/口周囲との境界、原UV/肌・髪、表情、全人物、WebGL、iPhone/PS4相当品質は未確認/未完成。新規生成の反復や無根拠な穴埋めへ進まず、この固定部分組立を独立レビューへ渡す。
