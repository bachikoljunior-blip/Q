# v62 灯具 6 部品 — 独立 native 最終確認

**条件付き部分模型としての保存を阻む新たな必須 source 修復は見つからなかった。全灯具の採用・完成判定はしていない。** 作者テストや作者検査関数を実行・合格根拠へ流用せず、固定 source から native Three geometry を一度生成して確認した。

固定 HEAD: `12a40b492f980e1e095a16b7422fce40d94d9bd2`。ribs SHA256 `33e596ff22332c317d819265e08c819f01c677c8a3cb63eea5aaa42bc17723e6`、inspect SHA256 `4ac3d4a2296cceb23be32444bd84e332dbf9d1aeb32a08b6a22fd915be4d4624`。caps は前回と同じ `84a7787b…`。source の原 byte snapshot と完全 hash は `result.json` と `HASHES.json`。

## 確認結果

2型の ribs を4配置、S13/S14 を実際に16分割で追加した6配置を確認。wide 左右、depth 前後はそれぞれ geometry を共有し、全 mesh の world determinant は +1。**2,352 tri / 6 mesh / 4 geometry / 52,240 B 属性・index buffer / 1 material**。これは native 構造の費用で、GPU draw/RAM の実測ではない。

| 部品 | tri | 位置 weld 後頂点 | 最小頂点法線・面法線 dot | 開/非manifold辺 / 向き不整合 |
|---|---:|---:|---:|---:|
| S09 | 364 | 184 | 0.873813 | 0 / 0 |
| S10 | 364 | 184 | 0.873813 | 0 / 0 |
| S11 | 364 | 184 | 0.859570 | 0 / 0 |
| S12 | 364 | 184 | 0.859570 | 0 / 0 |
| S13 | 384 | 192 | 0.438433 | 0 / 0 |
| S14 | 512 | 256 | 0.129480 | 0 / 0 |

全6部品の属性は有限、面積・体積は正。新4本の最小三角形面積は 0.260000 mm²。crease で意図的に増えた属性頂点は exact Float32 位置で weld してトポロジを判定した。法線長は約 1。一般の自己交差 Boolean / 作者21組の proper crossing 検査を独立再実行したという主張はしない。

各 rib 上端は6三角形・面積 **23.919998 mm²**。実 S13 下座の外周16角形の全半平面に対する頂点包含と、全上端三角形の原点への最短距離を別々に計算した。外周からの最小内側余裕 **0.190404 mm**、穴側の円包絡からの余裕下限 **0.750000 mm** があるため、各上端 face 全体が座面の環状領域に入る。作者の triangle clipping をコピーした判定ではない。rib 上端と座面の y 差は **+0.000001226 mm**（Float32丸め、許容0.00001 mm）。S13上面/S14下面は各32三角形、対向面 y 差 0.0000000261 mm、前回と同一16分割断面・配置を保持する。

## 未完了境界を保持

- 下端は native **Y1447.000002623 mm** の datum。S08/S07の下受けは存在せず、下端接合・完成灯具とは判定しない。S06、S15、S16、shaft/hand attachment も group の未制作一覧に残る。
- 未制作S16の設計楕円体（中心 0,1556,0、半径 52,109,39 mm）に対して全実三角形を正規化し、独自の面投影・辺上の最近点から最小半径を求めた。新 wide は **1.012399808**、depth は **1.048147258**、S13 は **1.010828360** で外側。
- **S14 は16角で 0.999408857、既存24角も 0.999737878**。同じ検査 batch 内で既存24角 S14 を比較用に一度だけ生成し、既知の包絡内側への違反を確認した。どちらも1未満であり、全6部品を光体から clear としていない。これは楕円体で正規化した距離で、mm の実侵入深さではない。実 S16 mesh も未制作。
- 画像 TOP は不採用のまま。FRONT / TRUE SIDE / THREE-QUARTER だけの条件付き形状参考、画像の箱状端と実模型のテーパ端差は既知のまま。この単位で原画像の再審査・完全一致を追加承認したものではない。
- default runtime から未採用の研究模型。`src` への部品名参照検索は0件（rg exit1=一致なし）。本編 build・全 actor 予算を今回の範囲で再検証していない。実 WebGL、材質・光影、自然さ、端末、PS4品質は未確認。新図や画像は制作していない。

## 再現・実行範囲

`node check.mjs`。`ribs-source.mjs` と `caps-source.mjs` を使い、依存解決のみ既存 native Three r186 に接続する。`author-inspection-source.mjs` は元 byte/hash の保全だけで、import・実行しない。browser / renderer / GPU / ネットアクセスを使わず、既存 source へ書き込まない。

native生成と必要計算の1 batchは **36.177866 ms**、Node command全体のtool壁時間は **0.394259 s**。読取・独立手順作成・解釈・文書化の経過は `CLOSE_READBACK.json` に別記し、部品制作をmsで完了したとは言わない。追加候補・pose・修復・描画検証のloopなし。全所有geometry/materialは処理終了でdisposeし、group childrenは0。source/Git/remote/Sites変更0、全tool終端済み、未完了session0。
