# P01の隣接2曲面・部分組立 v64

基点 `22d1d041dd6aef60de7764b1eebf6cf78028c857`。本編未importの実3D試作。P02-RとP04-RBを画像資料の後に作り、既存P01-Rの外側・上側へ実際にweldした。人物/外套全体、画像との完全一致、自然な布の動作は未完成。支持v63/v64を混ぜず、床に入る仮chest weightは本編動作向け不採用のまま。

## 先に作成した画像と使用範囲

`mira-cape-adjacent-parts-v1.png` は正式imagegen・4参照。初回は暗い周囲でラベルが読みにくく、P04の装着位置がP01上端と曖昧だった。1回だけtargeted編集したv2は明るい背景と青いP01位置表示を得た。両raw PNGと全promptをbyte無変更保存した。追加生成なし。

v2のP02は縦長の後ろ→側面曲面、P04-RBは上端の小さい鞍形面の資料として限定使用する。図の各投影は同一倍率のCADではなく、特にP02 TRUE PROFILEの見かけ奥行きと3/4の折れは厳密同形を証明しない。P04の小さいlocatorも正確な接合線ではない。渦模様・飾り縁・厚い切断リムはcanonical completeの控えめな布と異なるため一切生成meshへ入れない。画像をtextureとして使わない。原参照/出力hashはimage-provenance.json。

## 作者の寸法・共有境界

本人Right=-X、Left=+X、前+Z、上+Y。単位m、chest-localからrootへのoffset(0,.985,0)。数値は既存P01を基準にした作者設計で、画像の実測値ではない。

| 部品 | 形・大きさ | 既存部品との接続 |
|---|---|---|
| P01-R | 元の4×4曲面、153v/256tri、高さ1.100m | positions/index/UV/weights保持 |
| P02-R | 4×4制御の滑らかな後ろ→右側曲面。153v/256tri、高さ1.100m、端のX幅165–195mm、原辺から前側へ131–254mm回り込む作者断面 | inside17点をP01:outsideの同一global IDへ |
| P04-RB | 計画P04全体ではなく後部小区画。4×4制御、45v/64tri、高さ90mm、幅約130–135mm、上辺は原接続から56mm前側へ | bottom9点をP01:topの同一global IDへ |

P02の縦曲面とP04-RBの鞍形は、全体画像の外套側面と上背接続に向けた作者登録。P02の全幅/奥行き・P04比率は生成画の厳密な復元ではなく、最終全体の可視形状との確認が必要。P04側区画（P02上辺とP04-RB外辺の間）はまだ無い。元のP01内辺x=-.005と将来の左鏡像x=+.005の10mm中心空白を勝手に閉じない。P03前側、cowl、裾、左側も未制作。

二接合の26登録点は端点1個を共用し、独立部品351頂点から325の共有頂点へ統合。UVも同一頂点属性にし、P02は原seam U=0から負方向、P04は原top Vから上方向へメートル弧長を接続する。これは全曲面の等長展開や最終atlasではない。shared normalは面積加重平均で、既存P01の位置/面は保持するが境界normalの再計算は行う。各出力OBJも共通UV/normalを持つ。join-spec.jsonに全16制御点・local→global ID・将来隣接名を記録。

## 実検査

325v/576tri、900edge、72開放境界edge、境界1loop/Euler1。退化0、非manifold0、巻き不一致0、UV零面0、全576 UVは原P01の向きと同じ負符号（反転欠陥を0へ裏返していない）。rest面積0.540798m²、最小面積0.000194959m²。面と各頂点normalの最小dot0.982576、逆向き0。開いた面なので体積は未定義。限定proper intersectionはrest/6姿勢とも0。ただし同じ頂点を共有するpairとcoplanar overlapを除いたsegment/triangle検査であり、人体/cape全体の交差検査ではない。

実NPCのidle/walk/turn/sealed/death.45/death1秒を既存6条件と同じ順序で実行。登録はv62と同じfactoryの`animate({},0)`後chest行列を基準にし、native bindInverseとは区別する。仮weightは全点chest=1で、骨格との登録/接合を試したもの。新しいcloth solverや実布変形ではない。独立部品から別々に変換した二辺もgap0、UV/weight/ID差0、既存P01の6姿勢全153位置は保存v62と完全一致。全辺倍率0.997869–1.005986、法線反転/退化0。

死亡.45秒の床最小は既存P01 −51.783mm、新P02 −21.432mm、P04 +692.426mm。1秒はP01 −9.444mm、P02 +34.234mm、P04 +145.225mm。接合が割れないことと支持成立は別であり、本編動作には不採用。境界は今後も1つのcanonical位置/UV/weight/時刻解を全隣接に配布する必要があり、部品ごとの独立支持solverへ渡すと裂け得る。

## 再現・費用・限界

```
node scripts/export-mira-cloth-join-v64.mjs
node --test tests/mira-cloth-join-v64.test.mjs
python review/cloth-join-v64/plot.py
```

3 focused tests成功、初回1177.068471ms。exportのbuildMsは48段弧長UVを含むoffline造形計算で、制作時間/描画費用でない。初回102.693457ms、最終値はmetrics.json。CPU図geometry-views.png/SVGを実見し、接合赤線と死亡床侵入の表示を確認した。図はゲーム画面ではない。`npm run build`成功3.57秒・3JS・initial165611B。本編src/package/lock/配信receipt変更0、新素材runtime load0。型の数とdraw数は同じでなく、このprototypeにはdraw/material設定がない。全人物budget・iPhone/実GPU/実WebGL/PS4全画面品質/9月20到達は未確認。GL Disabledへの再試行0。

画像生成/修正/形仕様/コード/検査/図の時刻をtiming.jsonに分けた。画像生成合計103.952秒。コードmarker→初325vは68.210秒であり、画像仕様・生成・比較を除いた時間なので『一瞬で完成』としない。2型の接合を作った成果で、中心・左右・首/cowl・裾・全身組立の完成数へ水増ししない。
