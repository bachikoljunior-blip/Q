# v63 杖10部品の独立接合レビュー

現判定は **S17 / S05-B の見える外表面交差が残るため、その接合は修復必須**。10個それぞれの閉曲面成立と、この組立欠陥を分ける。新画像・source/Git/runtime/remote編集は0。CPU検査と線図の実見であり、匿名美観採点・WebGL・完成杖の合格ではない。

対象 `Q-mira-micro-v63/review/staff-v63/staff-parts.mjs`、SHA-256 `afd01a6bde340780208d698a0578f1ce397f8c1e682fbdcba91ac7475689edef`。作者 `native-report.json` は `8379be1ceac1fd256c768251bb618d6b94c4ed69c3be503569ccf034927d67fa`。新しく実sourceをimportし、出力位置/normal/UV/indexを既存parts.json全byte値と比較した。これらは作者の自己評価を品質根拠にしたものではない。

## 実形状と接合

10mesh/3240triangles。normal/UVによる複製をexact Float32位置で統合した各形状で、open/nonmanifold edge0、winding conflict0、正volume、退化面0、有限値を独立確認。S06最高点1422.999978mm、S15 stem最低点1674.000025mmで、作者1423/1674mmとFloat32精度内で整合する。原寸法は画像校正値ではない。

| 対象 | 独立に確認した範囲 | 判定 |
|---|---|---|
| S01木 / S04革内面 | proper crossing100pairs。16角断面の理想面との差−3.71e−7〜+4.75e−7mm。革の外面へ出ていない | 同面のFloat32近似として保存。全crossingの許容規則に一般化しない |
| S04 / S05-A,B | 288/254pairsは帯のinside、側縁、terminal。帯outsideと握りの交差0 | 裏面埋込として分類。接線/法線や全観察角の美観は未評価 |
| S17 / S05-A | 9pairsはy1030の隠れたchannel floor | 名称だけでなく交差位置が内部座であることを確認 |
| S18 / S05-A,B | 各9pairsはy1240の内部座 | 同じ限定で保存 |
| **S17 / S05-B** | 29pairsのうち外側上ベベルと帯outsideが5pairs、側縁が1pair。外側top lipの接触も別記録 | **隠れ端だけでない。修復必須** |
| S05-A / S05-B | proper triangle crossing0 | coplanar/共有接触を含めた全距離の保証ではない |

必須再現点：S17 native triangle101 / S05-B triangle21、(x,y,z)=(10.819233,1034.428204,24.940045)mm。S17上ベベルはy1034.2→1035mmで、ここは外表面。保存native点からの限定sampleでも帯が実ベベルを+0.045733mm越える点があり、外側の半径27.5mmの大きい円筒だけとの比較では見逃す。交差数は面pair数であり、独立した穴の個数ではない。持上げ開始を下collar退出後へ遅らせる等、over/under自体を壊さない最小修復を作者へ依頼した。

帯の裏面と16角の握りは完全な面接触ではない。sampled gapはA −.121722〜+.461132mm、B −.315154〜+2.558725mm（Bの意図した持上げを含む）。visible outsideは握り外面からsampled最小A1.162856mm/B1.370670mmあり、proper交差でもoutside0。これを接着、革の柔らかさ、実把持の合格に読み替えない。

## 接触していない箇所を区別

- S01→S02は25mmの差込み、半径方向の設計clearance .445965〜.5mmで実接触0。S01木端はy30mm、S03上面y4mmとの隙間26mm。接着/締結を隠れた仮定として完成扱いしない。ただし今回のshape候補保存に対し、新しい内部固定具の制作までは要求していない。
- S01上面y1418とS06 undersideはr6.3..21mmのannulus座が一致し、側面は.2mmの設計clearance。外側S06top y1423だけで未制作の灯具下部との接合を合格にしない。
- S04の両端はy1030/1240で保持金具座と一致するが、接触帯はr23.8..24mmの狭いannulus。握り断面全体の座と称さない。
- S15は固定stem始点の一致まで。S07–S14/S16、全灯具、手/骨格/握り位置はこの10部品に含まれず、未検査。

## 画像・方法・限界

原shaft-foot、grip-strips-v2、collars-neck、finialを正式view_imageで実見。S05の真横と斜視の同一形状対応は不確定。S17/S18 thumbnail番号の逆、S15が握りへ付く誤配置をshape採否から除外する既存独立指摘は妥当。孤立shapeと作者数値だけを限定使用し、全sheet一致としない。材質swatchを写真の革/木/青銅に相当する品質として採点していない。

独立native batch1回を行い、10形状のsource値、閉曲面、全pair proper三角形交差と部位を記録。自己交差は全10部品0。strict interior intersectionはcoplanarを検出しない。補助のregular16-gon radius式に半区画の位相誤りがあったため、元JSON/旧oracleを保持し、**同じ保存native配列から派生scalarだけ再計算**した。native intersectionやsourceは再実行/変更していない。この誤りは上記外面交差の証拠に影響しない。

`native-contact-projections.png`は保存された実三角形のCPU線図を1batchで作成して実見。ゲーム画面・代替レンダラーではない。図やconstructor msを制作速度、PS4品質、device性能の合格にしない。修復前snapshotと未解決を保存し、必要修復確認以外の追加plot・pose・新造形へ広げない。
