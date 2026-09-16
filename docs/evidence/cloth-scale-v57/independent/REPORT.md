# v57 独立 cloth 尺度レビュー

判定: この有限な source / native geometry / material / built-file 範囲では **必須修正なし**。対象はミラの胴と両袖にある cm 級の規則模様を、役割分離した約 2 mm の authored weave へ直す候補。写真 PBR の導入、全衣装の改善、PS4 品質・実描画の合格とは扱わない。

基点 `75dd0242f814b488134f84f57c0eb98ed4e454a7`。作者 checkpoint `be4737db101c69e96d993f278a2277a62e794f99`。最終 runtime は `detailed-geometry.js` SHA256 `ed1d6757449fc83a3fb1a5872808b044e4709b52bc3de88fdedc7f6eced08033`、`cloth-material.js` `39ba2cfce1096be273543b313be1d12781ae43c59e8581f5cb9aa95d0a04642f`。レビュー担当は source / repo / remote / Sites / preview を変更していない。

## 独立して確認した範囲

- 実 Three.js 0.186 で全 14 役を構築し、材質分割による配列順の違いを除いて三角形単位で照合。元の winding・position・normal・skinIndex・skinWeight は全役同値。他 13 役の全属性・UV・材質・メッシュ配置も同値。ミラの髪、紙、肌、外套、下衣など非対象の全属性・材質も同値。胴＋袖だけ UV と材質が変わり、ミラのメッシュ数は 12→13、三角形 6,718 は不変。全メッシュ集計には非表示武器も含むため、全役の集計を実描画 draw 数とは呼ばない。
- 原版は衣服・髪・紙・狼の毛が同じ 64² cloth DataTexture を参照。候補の新 512² Texture はミラ上衣だけ。既存の同色下衣 / 外套にも波及していない。元の色を保持し、R は bump、G は roughness、NoColorSpace の線形データ。Diffuse 写真、normal map、色補正ではない。
- 実 Game.interact → SceneView.focusGathering / update の同じミラ条件を使用。keeper の +Z 3 m にプレイヤー、time 0、yaw .05 / zoom 9 からの会話。実 camera は `[9.582160753377863,3.391520709300637,80.44150730864357]`。v56 の closest-hit 4 px 格子の重みを再利用し、三角形の source 属性 hash で新バッチへ対応させて UV→world を独立に再計算。3 viewport / 合計 4,092 weighted samples、元の画素位置から 65 本の native rays を再確認。v56 可視面積は既存資料の引用であり、こちらで全格子を再測定した数字ではない。

| viewport | 旧 U/V 周期 mm | 新 U/V nominal 周期 mm | 旧 U/V 投影 px | 新 U/V 投影 px |
|---|---:|---:|---:|---:|
| 1280×720 | 15.715 / 12.564 | 2.244 / 1.983 | 3.444 / 3.474 | .554 / .533 |
| 844×390 | 15.540 / 12.623 | 2.244 / 1.987 | 1.865 / 1.892 | .303 / .289 |
| 390×844 | 15.715 / 12.590 | 2.244 / 1.985 | 3.998 / 4.105 | .648 / .625 |

周期は UV の U/V 軸に沿う carrier の値で、Jacobian の特異値方向とは区別。新素材には位相揺らぎがあり、nominal carrier を実測した写真の糸幅とは呼ばない。720p の新 U 周期範囲は約 .521–2.636 mm、V は 1.171–2.602 mm。テーパー・関節変形により一様な 2 mm ではない。画像面投影は native 三角形と pinhole 計算で、shader の表示結果ではない。1 周期 <1 px のため mip で平均化され得る。残る 16 / 32 mm 程度の緩い高さ・roughness 変化も authored であり、知覚上の改善量は未判定。

## 所有権・容量・出所

実 SceneView.setQuality の low / medium / high と追加ミラ 3 clone が同じ材質、Texture、配列を共有し、texture.version も不変。Texture data SHA256 は `41da3df4189bfac978fd46eca678e6db469c5b6f2e2e32af9fa7f9c2aa107150`。R/G の min/max/mean を原配列から再計算し provenance と一致した。

新 fetch / 画像 decode / async loader / install / retry / release API はない。既存 microtexture と同じ module / template lifetime の singleton。従って非同期 late callback や loader の二重所有はこの候補に存在しない。逆に scene 終了時の明示解放、context 再生成時の GPU peak / 回収を保証したものではない。低設定でも同じ map を保持する。

CPU 配列は 1,048,576 B、RGBA8 全 mip の payload 計算値は 1,398,100 B（約 1.333 MiB）。既存 2048² skin の約 21.333 MiB は残る。この形式値は driver overhead / upload 一時領域 / 全 scene memory を含まず、実 GPU 使用量ではない。対象ミラに main pass の mesh が 1 個増え、shadow pass が実行される場合も追加対象となる。CPU texture 生成・初回 GPU upload の端末時間は未測定。

Vite の実成果を読取: 初期 JS 165,611 B、3 JS chunks、scene のみ dynamic import、scene JS 340,730→342,454 B（+1,724 B）。actor-models / main / scene / skin-materials は基点と byte hash 同一。27 媒体合計 12,883,257 B は **基点 source → 現 source → Vite emitted** で全 byte 同一。新媒体 transfer は 0 B。初期 166,000 B は明示された回帰 guard で、端末性能上限ではない。通常 Web が一次提供であり、旧単体 16 MiB を採否根拠にしていない。fixed stage / package receipt は統合担当の後続 gate で、この独立レビューは dist まで。

素材は新しい code-native authored weave。新しい外部原画像は取得・採用していないため、写真画像の独立 view / license 認証 / photometric 検査は N/A。作者記録の Hessian は既存の未確定比較資料で runtime 不採用。Denim の失敗 URL には slug 誤記があり、正しい asset API を検査した証拠にも全 API 拒否の証拠にもならない。レビュー側は再取得・別 route を実行していない。

## 再現と境界

依存導入済みの repo root を各 script の第 1 引数へ渡す。別の許可された依存を参照する場合は `Q_REVIEW_NODE_MODULES` を指定する。`snapshot.mjs ROOT baseline` → `snapshot.mjs ROOT candidate` → `compare-snapshots.mjs`、`scale.mjs ROOT baseline` → `scale.mjs ROOT candidate`、`artifact-readback.mjs ROOT`。生成される大量の材質 snapshot / 重複 run log は保存 manifest から除外し、再現 source・必要 sample weights / matrices・集約結果を残した。

初回は独立 Node fixture の未宣言 `.wav` import で終了し、媒体を読み込まない明示 URL stub へ追加してから検査した。実 image decode / WebGL / raster / 音 / 実 DOM / touch / device / PS4・指定作品比較は行っていない。全景品質と 9/20 完成根拠は未成立のまま。必須修正 0 を有限な材質単位の採否資料として返し、任意の追加 probe は行わない。
