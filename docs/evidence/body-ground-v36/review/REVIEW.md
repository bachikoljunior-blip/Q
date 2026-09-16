# v36 全身支持候補の独立レビュー — 本番不採用を確認

固定候補 `b0f6e30d04f24514e8a31c7a28a7636bebd0dae91cd1e83f7b41f7cbe0409cbb` は**不採用**。全体の最深侵入が減る一方、旧版では正だった足の隙間が負になる6条件を、独立に実三角形から再現した。作者は既に本番sourceを基点の `d3f543c2537cd076dfe18ad05ca815374f242dda64847e01421844fc7a0d23fc` へ復元済み。この候補を次のruntimeとして承認しない。

基点 `e731685be92c4c98a20115d2244e580e371ca084`。対象 `Q-body-ground-v36`。書込は独立scratch `q-v36-body-ground-review` のみ。本番、remote、Sites、browser/serverを変更せず、新しいagentを起動していない。Nodeの実geometry計算はゲーム画面・device performance・PS4品質の受入ではない。

## 独立実証

`oracle.mjs` は `git show` から基点sourceを取得する。固定棄却候補は作者の保存ファイルを明示Node module hookで読み、同じThree/geometry/Game/groundAt依存へ接続する。作者の `bodyMetric` / `surfaceGroundMetric` / assertionsは呼ばない。

元の108 ground条件（6位置×player/boss×3yaw×3death phase）と20 flat条件（4roles×5phase、独立旧oracleのyaw .43）を保持した。全 `SkinnedMesh` の全indexed triangleを対象に、各面10点の等間隔barycentric gridでground gapを計算する。上半身bone filterを外し、靴・手・頭・装備を含む実skinned batchへ拡張した。前後合計19,086,680点。skin全体は非表示のskinned装備も含む保守的範囲だが、判定に使う6件はいずれも実boot leather面である。有限sampleなので任意の非線形地形の全連続面を証明しない。

最深gapは **−826.854 → −22.271 mm**。しかし以下の6件は全てdeath phase .45で新しい負のgapとなった。

| 位置 / yaw | 役 | 旧gap mm | 候補gap mm |
| --- | --- | ---: | ---: |
| player開始 `(0,101)` / 0 | player | +131.104 | −9.761 |
| player開始 `(0,101)` / 0 | boss scale probe | +302.419 | −22.271 |
| salt archer `(-389,-38)` / 1.1 | player | +19.346 | −6.585 |
| salt archer `(-389,-38)` / 1.1 | boss scale probe | +40.210 | −14.974 |
| salt archer `(-389,-38)` / 2.4 | player | +109.545 | −9.001 |
| salt archer `(-389,-38)` / 2.4 | boss scale probe | +254.179 | −20.725 |

開始地点の新しい最悪面は `Q leather skin` triangle340、indices `[321,320,334]`、barycentric `[0,0,1]`。salt archer yaw1.1ではtriangle76のvertex61。最悪値は実頂点でも再現しており、補間sampleの作り方に依存した誤差ではない。bossをplayer/archer地点に置く条件は2.3倍scaleの検査で、実bossがそこにspawnするという主張ではない。

## 改善だけでは説明できない支持の隙間

候補は14方向のbone別extremaから約237–293点を選び、地形勾配へ骨盤を剛体回転し、選択点の最低gapに従って全身を上げる。選択cloudは全変形surfaceの保守的下界ではなく、上記の靴底頂点を覆えていない。候補の `animateCape` は旧sourceとbyte同一である。

平地のsettled phase .8では全体を上げる必要がないため、次の正のgapが旧→候補でそのまま残る。ここでの部位は最大skin weightのboneによる分類で、人体の体積・完全接触を表すものではない。

| 役 | 骨盤最低 mm | 胸最低 mm | head最低 mm | 両足最低 mm |
| --- | ---: | ---: | ---: | ---: |
| player | 8.17 | 28.80 | 102.29 | 105.14 |
| NPC | 148.17 | 51.87 | 285.61 | 245.14 |
| ranger | 148.17 | 168.80 | 242.29 | 245.14 |
| boss | 18.79 | 66.25 | 326.09 | 241.82 |

実地形のplayer開始位置・boss probe・phase .8では、skinの水平0.15 actor-local m格子ごとの下端gap中央値が28.25→383.48 mmへ増え、head最低は−326.97→+343.95 mmになる。この格子中央値はfootprintの変化にも影響されるので、同一接触点の移動や、全部位が必ず床に触れるべきという物理証明には使わない。それでも、侵入減少をそのまま自然な支持姿勢の完成と呼べない具体的な残差になる。

作者が別途調べた「頭・両足の3点面より骨盤底が約95.77 mm下」という結果は、選択4点の非共面性だけを示す。他の任意の剛体姿勢では支持できないという一般的な不可能証明ではなく、この独立判定の必要条件にもしていない。

## 保持された契約と残る動きの限界

- 首元の上9cape頂点をchest局所座標へ戻すと、前後差の最大は **2.274e−13 m**。root world matrixは同一。身体→首→capeの付着は壊れていない。
- 4rolesのidle/moving/attackとdeath後recoveryでは、geometry/index/UV/骨・材質・非death capeの契約hashが一致する。core、Scene、motion、bow、geometry、provenanceは基点とbyte同一。
- 30/60/120 Hzで実frame stepを半分にし、1.2 sの連続列を比較した。各保存phaseを別actorに再適用した位置誤差は0。普通player候補の最大stepは164.16→82.17→41.09 mm、bossは343.75→172.23→86.16 mm。この測定は全skinと非skinned geometry（非表示の保持物も含む）を対象にした保守的最大値で、作者のskin+capeだけの最大値と混同しない。
- death phase0へのentryは連続stepとは別。100 idle frames後、候補playerは203.49 mm、bossは466.60 mmの最大geometry差が残る。旧も同条件で208.76/448.61 mmあり、候補で全開始境界が解決したとは言えない。
- cape頂点の負gapは6→0になるが、上記body boot6件を相殺しない。このoracleのcape gapは頂点だけで、別v34の全cape triangle検証と範囲を混同しない。

次の有限実装は、支持点数を増やすだけでなく、平地でのsettled関節姿勢と靴・骨盤・胸/頭の支持を同じ条件で設計する必要がある。最低gap、部位別の正gap、entryと連続step、保存時刻、首cape付着を同時に見る。単純な全身上げ・一括傾斜だけを「接地完了」として採用しない。新しい実装や追加素材をこのレビュー中に作っていない。

レビュー開始 **2026-09-16 06:35:33Z**、native全条件終了 **06:38:42.026Z**、1回の実oracle wall **19.666秒**。最終source凍結確認時刻は `summary.json`。作者の追加fix loopを依頼せず、不採用理由が独立再現した段階でこの有限レビューを閉じた。全session終了、依存symlink使用終了を作者へ通知済み。素材調達・組込・本番buildは0。実描画・知覚・端末性能は未測定のまま。
