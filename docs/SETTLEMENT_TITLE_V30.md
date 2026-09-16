# v30 — 住宅・橋の取り付けと読み込み時の動画制御

見える家屋の基礎が最大1.063216m浮き、橋の床が実通行床から約13〜15cmずれていた。基礎下端を地形に接続し、入口の切欠きと共有縦boundsで見た目・矢・カメラを揃えた。橋は元の通行床を標本化した厚み付きrampと床下板・梁・柱で接続する。4住宅/2橋のrootや上物、既存経路・saveを保持した。[作者の同条件比較](SETTLEMENT_CONTACT_V30.md)、[独立review](evidence/settlement-contact-v30/independent/REVIEW.md)。

独立レビューで、初稿の新基礎が扉下端を8.8mm手前から覆う点と、下へ伸びた石を旧house縦boundsが塞がない点を修正した。最終door360/window480 raysで元door/windowの新しい遮蔽0。旧44短線を実live矢/forecast/cameraで再現し、全て新基礎へ接触。x/z/r・旧上端・他obstacle・serialize一致。+1528tri/+0mesh draw、構造＋水のuniquegeometry追加312,912 B。これはGPUや見た目の印象の測定ではない。

タイトルはposter/loading表示を維持し、遅延world factoryやfile.textより前にvideo pause/remove src/loadを要求する。設定パネル往復でもlaunch中は再開しない。同じ明示DOM/media境界でsrc保持/playing/load0からsrc空/paused/load1/RAF0を確認。失敗時はユーザー停止/減動/節約/背景制御を保持して復帰する。[実装と独立確認](TITLE_LOADING_V30.md)。元mediaと音、正常Scene singletonは変更していない。物理decoder回収やピークGPU節約は未測定。

結合21必須command /269 tests成功、wall103.658秒。新settlement実geometry・sharedconsumer oracleをCIへ追加。titleの前後比較recipeは作者local基点と同じtreeの公開済remote26bd980を参照するようにし、同条件で再実行した。最初の出力redirectionは未作成artifactsディレクトリのためshellで止まり、sourceは実行されず、通常gateが作ったディレクトリへ再実行して成功した。未実施の比較へ読み替えていない。

初期JS164,493 B <165,000 /3chunks、全JS968,539 B。単体16,327,411 B、SHA256 `d4bb44ef71a72ff9cfb2cc8a594787c9b43581f3cb20f601782165dd602a054b`、16MiBまで449,805 B。固定stage `artifacts/site-3v09AD`、34public files、source/build/stage/単体byte一致。[全gateとファイルhash](evidence/settlement-title-v30/validation.json)。新素材は0、v29実image/audio payloadを維持する。

作者の住宅単位は独立発見の入口・縦遮蔽・複製geometryの手戻りを含み、最終13command合計66.873秒。タイトル単位はwall7分39秒・素材取得/生成0、両者と結合gateは並行工程を含むため総工数へ単純加算しない。新しい全画面改善率や期限到達速度の証拠とはしない。

v29の独立資源監査も[原資料](evidence/scene-budget-v29/REVIEW.md)として保存。49,196,088 Bは参照texture形式の計算、21,726,006 Bはnative geometry属性配列の実値で、GPU/driver/decoder/実機測定とは異なる。全bodyatlasの一顔使用と初期/単体予算の余白を次の方法選択に含める。同じ3枚の環境JPEGをlosslessWebPへ標準形式exportした代案は全RGB一致でも容量が増え、不採用。予算のために品質を下げたことにしない。

期限9/20の全画面PS4相当と指定10作品の比較は根拠不足。通常PR39のservice未完了によりmain547676f/Site23は据え置き、CI成功のPR39〜44へexact sourceを保全している。このunitも正常stack保存を行い、mainの実変化後に通常順序で統合する。previewは正式mailbox不在、別browser/daemon/CIへ移さない。既存Qの回数終了は除去したがdisabled/nextnullは未解消。人間の準備待ちにせず、次は原morphによる顔形状差と弓の手/弦/射出の実整合を有限単位で制作する。
