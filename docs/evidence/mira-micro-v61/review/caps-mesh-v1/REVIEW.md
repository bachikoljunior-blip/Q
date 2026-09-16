# S13/S14 native mesh — 独立有限検査

対象は `Q-mira-micro-v61` HEAD `906cb4adc07abe7695b85958643b8e1b508f6e8e` の未commit研究コード。`review/micro-v61/mira-micro-parts.js` を一度読み、3,628 B / SHA256 `84a7787bb459586304256198f73388207d4e4893ec3d6d6eea5bc63f62978f8c` に固定して、この外側directoryの `source-snapshot.mjs` からnative Three geometryを生成した。作者testも原byte保存したが、その成功を本レビューの証拠には流用していない。HEAD/status/原sourceとtestのhashは `SOURCE.json`、全頂点/indices/normals/行列は `geometry.json`。

**結果：この2部品の閉じた形状・法線の向き・自己交差・共通座面に必須source欠陥は見つからなかった。** 24角形socketの実すき間は設計半径差と区別が必要。全staffの接合や生成資料との完全形状一致は未確認。

## Native geometryからの独立結果

| 項目 | S13 | S14 |
|---|---:|---:|
| vertices / triangles | 288 /576 | 384 /768 |
| index bytes（Uint16） | 3,456 B | 4,608 B |
| 全attribute+index | 12,672 B | 16,896 B |
| 境界/非manifold edge | 0 | 0 |
| 同方向を向く共有edge pair | 0 | 0 |
| 最小triangle面積 | 1.286627 mm² | 0.781166 mm² |
| 符号付きmaterial体積 | +3,520.947471 mm³ | +4,346.687636 mm³ |
| 非隣接profile交差/接触 | 0 /0 | 0 /0 |
| face normal内外反転 | 0 | 0 |

合計 **2 meshes /672 vertices /1,344 triangles /29,568 B buffer**、材質objectは1つを共有。研究meshが1meshにつき1drawを要する構造という数え方であり、GPU draw実測ではない。新しい画像textureや材質mapを作らず、元生成絵を貼っていない。profile点/周方向24分割を増やして検査結果を良くする操作はしていない。本編 `src` にこのhelperへの参照は見つからず、default graph外の研究候補である。 現行Miraの6,718triangles/13drawへ単純に足すと8,062triangles/15drawとなり、既存の<8,000/≤14を超える。これは置換で除く旧部品や将来のbatchingを計上していない算術で、統合後予算ではない。2小部品の構造検査を全actor予算PASSへ読み替えない。

edgeの閉鎖/向きだけでなく、実trianglesが隣接するmeridian/角度cell内にあること、すべての半径が正である単純profile、非隣接segmentの交差/接触0を確認した。この形状に限り、角度sectorが重ならない正半径の回転掃引として自己交差しないことを検査できる。任意meshの万能衝突検査ではない。実face centroidから法線方向の内外へ0.0001 mmずらし、24角solidのinside判定が反転することも全faceで確認した。vertex normalsは有限・ほぼ単位長、全incident faceとのdotも正。見た目の滑らかさやspecular shadingの合格ではない。

scratch上の負例としてS14断面の1点だけを `[6,-6]` へ移すと、非隣接edge 11/13の交差を検出することを確認した。作者sourceやnative候補は変更していない。

## 2部品の接合と穴

- material profileの正の内部重なり0。共通接触は **Y1668 mm /r14.5–18 mm**、同位相24角形の接触面積は **353.287997 mm²**。native Float32由来の座面Y差は約 `2.61e-8 mm` で、検査許容 `1e-5 mm` より小さい。
- S13は最小公称内半径14 mm、中央内段は15 mm。角柱化しているため、半径方向の頂点距離と面への最短距離は同じではない。
- S14のsocketは公称半径6.3 mm。実native bore 48trianglesの平面距離の最小値は **6.246102523 mm**。連続した半径6 mmの軸を同軸で置いた時の最小すき間は **0.246102523 mm**。`6.3−6=0.300` は設計半径差であり、実meshの最小clearance値ではない。これはS15実meshの検査ではなく、指定された連続円柱の包絡に対する計算。
- S14にfinialの球や軸は含まれず、2partだけである。section図の赤い軸は明記したS15設計包絡で、第三のmeshを制作したわけではない。
- glassContactRadiusは設計式のdatum。S16の実meshは無く、楕円体の全周がこの回転座面へ接触することや、光体/4 ribs/finial/杖全体の組立を合格にしていない。

## 幾何投影図と原資料との対応

`parts-orthographic.svg/png` はnative trianglesを正面(+Z)、側面(+X)、上(+Y)、斜め(yaw45°/elevation25°)へ同じmm scaleで正射影した8panel。`joint-sections.svg/png` は断面と、2partを重ねた全edgeの透視的な幾何図。**各panelに GEOMETRY ONLY / No material・light・WebGL を明記**した。後者は隠れたedgeも表示する設計図で、x-rayという表記は描画手法の説明であり撮影ではない。

単体の面表示はcentroid-depth順による近似で、光/影/texture/Three rendererを使っていない。最初の組立の面塗りは接触面付近でこの近似が紛らわしい色片を作ったため、組立図は全native edge表示へ修正した。交差や接触の判定は図の見え方でなく上記のgeometry解析による。最終PNGは2枚とも実見して文字・図の範囲を確認した。SVGとPNGは同じmatplotlib primitivesから出力し、生成原画像の加工・切り貼り・再描画をしていない。

原画像 `staff-caps-micro-v1.png` は、既に独立実見した一枚2型資料（SHA `01a18ebd2631e2e5c73b52c3c261620e1c2487458200c1c68993e89066258532`）。画像のPROFILEは上面も見える未校正の視点なので、今回の厳密な正射影と同じcamera/pixel対応とは呼ばない。正面/側面/上/斜めという方向群を対応させた技術比較である。

S13は平たいband、面取り、開いた孔と内段を実形状として持ち、torusの流用ではない。S14も広い下縁・細い首・上縁と開いたsocketを持ち、球を二重所有しない。この大きな形状分類の対応は確認できる。一方、S14肩のnative輪郭には長い直線区間があり、原絵の丸み・曲率への厳密な一致は証明していない。画像に見えなかった下側6 mmのseatは作者が補完した取り付け構造で、画像から回収した面ではない。2小部品の有効な設計候補と、原画像/完成灯具への完全一致を区別する。

## 時間・再現・残る境界

独立レビュー開始の読取は2026-09-16T12:14:06Z、snapshotは12:16:08Z。native読取/生成/JSON保存は **53.395 ms**、最初の解析/図出力は2.233 s、図の表記修復を含む最終再実行は **2.823 s**。これらはscript wall timeで、画像検討・source読解・oracle作成・図の実見・報告の作業時間ではない。本レビューは約10分規模の有限作業であり「部品を一瞬で作った」証拠にしない。作者の素材生成/造形/全本編gate所要時間は今回測っていない。独立担当による素材生成0、造形変更0、runtime組込0。

再解析はこの保存済み `geometry.json` に対して `python analyze_and_plot.py`。元repoが変わっても、このJSONとsource snapshotから検査対象を特定できる。Node capture scriptは初回のsource固定工程の記録で、最終oracleの再実行に再captureは不要。作者source/testの終端hash一致は `CLOSE_READBACK.json` に保存する。

新ツール/renderer/browser/driver/CI迂回は無く、全書込は指定した独立directory内。source/画像/BOM/他ownerfile/Git/remote変更0、未完了session0。実WebGL、材質光影、実機費用、全staff/全人物、PS4品質は未確認のまま。
