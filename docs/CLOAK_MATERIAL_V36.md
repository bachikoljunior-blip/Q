# v36 外套写真PBR候補 — Hessian 380 は今回のruntimeへ採用しない

基点 `cd5ca9794da31e21cf639e7da4d226007b3fbe56`。通常URLを主なプレイ方法とする最新方針に従い、単体HTMLの16 MiB上限や旧1.28 MB余白を素材の不採用理由にしない。今回の理由は衣装への適合と、現在の撮影条件で確かめられた実益に対する読込・GPU形式上の費用である。Source、Scene、材質、UV、身体、外套アニメーション、弓、rig、配信物は変更していない。追加buildは不要との親判断で実行していない。

## 候補と取得の範囲

実取得した候補は [Poly Haven Hessian 380](https://polyhaven.com/a/hessian_380) の1種類のみ。公式説明は粗い茶色のジュート袋布で、写真はcolormass、処理はRico Cilliers。羊毛や厚手canvas、重量380 g/m²と読み替えない。画像を実際に `view_image` で見たところ、密な平織り、太さの異なる糸、細い飛び出した繊維と小さな斑点がある。これは素材画像の観察で、ゲーム画面ではない。公式の [ライセンス](https://polyhaven.com/license) はassetsをCC0として再配布可能としている。今回保持するのは実素材JPEGだけで、公式の作例レンダーを素材と偽って配布しない。

| 取得済み原JPEG | bytes | SHA256先頭 |
| --- | ---: | --- |
| diffuse | 944,914 | `5727302df3a9c845` |
| OpenGL normal | 1,076,074 | `3994fd74148cb413` |
| roughness | 956,823 | `a828755c5ddc9af0` |
| 合計 | 2,977,811 | 全hashはprovenanceへ |

3枚とも1024×1024。原bytesをそのまま `docs/evidence/cloak-material-v36/source/` へ保持する。画像編集・生成・crop・resize・色補正・codec変換は行っていない。Pillow/NumPyはdecodeと数値集計だけに使い、加工画像を出力していない。

**取得経緯の制約:** 公式asset/licenseページは取得できたが、info/files APIはweb側でnon-retryable safe-open拒否、同じ初回投入に含めたnativeリクエストもinfoが403、filesが接続終了となり、セッション70414を終了130で回収した。API原データは0 B。公式ページ上の明示4K個別リンク3本はwebのcontent-length制限で未取得（提示bytesは13,502,150 / 13,561,983 / 15,482,885）。

その後、ページの1K表示と4Kファイル名から1Kパスを組み立てたnative GETを06:27:03Zに各1回投入し、各HTTP200、06:27:14Zに全件完了した。**取得した1Kのexactリンク自体を公式ページで確認したわけではない。** 親からの「未掲載URL組立不可」という後続指定を受信した時点で通常の終了/pollを行い、すでに完了したexit0を回収した。それ以降のfetch・別URL組立・別経路への再試行は0。既知の拒否されたherringbone資源へもアクセスしていない。履歴scriptは再実行を拒否する状態で保全した。HTTP200とローカルSHAを、未取得の公式expected digest/API provenance照合完了と混同しない。親はこの経緯を確認した上で、既取得bytesを削除せずread-only採否記録で閉じることを承認した。

## 同じ布UVとカメラ条件での数値

元v34布調査と今回基点の `detailed-geometry.js` / `actor-models.js` / `scene.js` はそれぞれSHAが同一。このため同じ普通外套のUV密度 **0.9722054042332153 m / UV** とFOV54°を使う。物理tileは公式ページの8K・299.1 px/cmから約 **0.273888 m** と逆算した推定値で、APIの正確な寸法は未検証。対応repeatは約 **3.54964**。現bossの未修復のUV密度と2.3倍world scaleへ、この値を一律適用できない。

| 正対する布の条件 | 写真の主な糸周期 | 現手続き織り周期 |
| --- | ---: | ---: |
| 1280×720、距離9 m | 0.112–0.121 px | 1.193 px |
| 1280×720、距離2.6 m | 0.388–0.420 px | 4.128 px |
| 844×390、距離2.6 m | 0.210–0.228 px | 2.236 px |
| 390×844、距離2.6 m | 0.454–0.493 px | 4.839 px |

表は同FOV/同距離の正対平面に対する投影式であり、実ゲームframeのpixel測定ではない。写真の主周波数は縦192/横177周期/tileで、糸周期約1.43–1.55 mm。元の15.19 mmは織りの**横方向の周期**であってbumpの高さではない。現bumpScaleは0.0014であり、15 mm厚の凹凸と記述しない。

法線mapは平均およそ `[0, 0.000377, 0.950524]`、decode後の単位長はP01–99が0.858–1.074。JPEGと縮小を含むため完全な単位vectorとして扱わず、Three標準のnormalizeを使う必要がある。フル解像度の角度中央値9.26°は、数値上16×16 footprintを平均すると0.60°、P99で1.56°まで減る。720p・2.6mの推定LODは3.78（約14texels/px）。この平均はCPUのbox footprintモデルで、実GPU mip/filter/斜視aliasingの検証ではない。

roughnessはRGB同値、平均0.5882、P01–99は0.4314–0.8078。現cloth約0.94に対し、標準GGXのalpha=roughness²は平均値で0.8836→0.3460となる。色と反射の変化は予想できるが、粗い袋布と厚手羊毛を同じ反射材質としてよい証明にはならない。公開GL指定と同pixel位置の斑点/織りの一致は確認したが、元撮影・height法線導出・絶対roughnessの計測校正を独立再現していない。

写真のlinear RGB平均は `[0.437283,0.283139,0.149012]`。playerの既存色を平均で保つなら材質tintは `[0.057599,0.320838,0.702067]`。これは染色・光を物理的に再現する係数ではなく、色の平均だけを揃える設計案で、今回実装していない。

## 採用しない判断と再利用時の条件

全員の外套へ同じジュートを貼る衣装上の根拠はない。写真の細い織り目は現カメラでは多くがsubpixelで、主な変化は中距離の色むらと粗さになる。既存の大きすぎる手続き模様を是正する方向は妥当だが、今回の3枚をbootのPromise.allへ足して約2.98 MBの読込を増やすことを、同条件で確認済みの品質改善とは判断しない。正式WebGL画面、端末の時間/容量、PS4知覚比較は未取得。

RGBA8+完全mipsの数学的payloadは **1枚5,592,404 B（約5.333 MiB）、3枚16,777,212 B（約16 MiB）**。normal/roughnessの2枚だけなら約10.667 MiB。既存skinの21.333 MiBと3枚を合わせると約37.333 MiBで、他の地形/空/葉/画面bufferは別。これはGPU実allocationやCPU/GPUpeakではない。JPEGの配信bytesを減らしても、このdecoded形式容量は減らない。通常URLへの移行で単体HTML上限は外れたが、GPU費用と実端末未計測の境界は残る。

将来、ジュートが適した特定衣装へ使うなら、次の最小契約で別単位として扱う。

- deferred Scene内のloaderから、専有cape materialだけへ登録・共有。髪/紙/袖/hood/bodyの既存共有cloth材質へ自動伝播させない。通常外套とbossの物理UV密度を分けて設計する。
- diffuseはSRGBColorSpace、normal/roughnessはNoColorSpace。GLの+Y、flipY=true、同UV/repeat、TangentSpaceNormalMapを実原典と照合する。Three186はnormalとbumpを `#elif` で選ぶため、既存bumpを残しても両方が積算されるわけではないが、不要なbump slotは外す。
- cacheは同時load共有・部分失敗dispose・失敗後retry・遅延decodeが破棄後に再登録されないepochを持たせる。失敗時は既存cape材質のまま起動する。low/medium/highで同一画像を再利用すれば再decodeは不要だが、lowでメモリが減るとは称さない。必要なら別の実予算・採用条件でlow仕様を決める。

素材調達開始06:23:39Z、native画像3件の実download wallは11.597秒、取得完了06:27:14Z。source接続時間は0。decode/数値検証は実行したが、調査・画像観察・記録の個別stopwatchを測っていないので架空の時間分離をしない。全コマンド終了済み。`acquisition.json`、`provenance.json`、`analysis.json`、原JPEGと集計scriptをevidenceへ保持する。
