# Mira 灯具枠 2 型 / 4 配置 — v62 部分組立

**条件付きの形状試作として保存。本編未採用・全灯具未完成。** 選択した FRONT / TRUE SIDE / THREE-QUARTER を根拠に湾曲平板 2 型を実 3D 化し、S09/S10 と S11/S12 に計 4 配置した。生成 TOP は不成立として根拠から除外。画像を mesh に貼った制作ではない。

## 何を作ったか

`review/lantern-micro-v62/mira-lantern-ribs.js` が実 Three BufferGeometry を生成する。幅型は XY 平面の弓形・平板の広い面、奥行型は YZ 平面の浅い弓形・正面に向く平板の広い面。部品は closed loft で、画像に見える小さい端ブロックを**同じ枠の一体端**として含める。新しい別部品 ID は増やしていない。対は 180°回転配置（この左右対称断面では反射形と同形）で、負 scale による裏返しはない。

薄板幅 7 mm / 厚 2 mm、中央半径 wide70 / depth55 mm、0.2 mm bevel、曲率指数 0.7、23断面、端の 12 mm blend は作者設計値。画像から正確に復元した寸法ではない。主部の水平断面厚は傾き補正し、端は別の短い設計補間で接続する。**画像の箱状端とは異なり、wide の正面端は細くなる**。画像の完全一致や小箱の全方向一致を主張しない。

旧提案の r16–18×接線7 mm pad はそのまま採用していない。今回は一体端の上面を **Y1662、r15.25–18.25、接線±4 mm、角0.2 mm bevel** と明示定義。上端 face 面積は各 23.919998 mm²。下端は Y1447 の仮 datum のみで、S08/S07 の下受けを制作・接合したものではない。

S13/S14 は既存 helper / profile / default24を無変更再利用し、今回の partial assembly 呼出しにのみ `capSegments:16` を明示した。4 ribs と 2 caps の計6配置であり、103型250配置案の完成数ではない。

## Native 検査と修復

- 全6部品：非有限0、退化0、正体積、位置を weld した非manifold/開いたedge0、共有edge方向矛盾0。新4本の最小面積0.260000 mm²。
- 初版は端部で vertex normal を平均し過ぎ、最小 incident-face dot が wide−0.919706 / depth−0.869425。棄却sourceと初検査を保存し、45° crease に応じた法線分離を実施。**三角形位置・数は不変**、修復後 min dot は wide0.873813 / depth0.859570。
- 上座：実16角形と元24角形の下向き三角形へ、4本の上面三角形を2D clip。各面積を100%被覆、Y差 +0.000001226 mm（Float32丸め、許容1e−5 mm）。円の半径だけの判定ではない。
- 自分自身を含む6部品の21組について、proper segment / triangle 内部交差0。接触面は別に面積検査。coplanar接触を一般の交差と混ぜず、任意meshの万能boolean検査とはしない。
- 新4 ribs は全実三角形を設計楕円体の座標で評価し、包絡外。min normalized radius は wide1.012400 / depth1.048147、保守的な外側距離下限は0.483593 / 1.877743 mm。これは S16実mesh の検査ではない。
- **既存capsは分離判定**：S13 は包絡外。S14 は16角で normalized radius0.999408857、元24角でも0.999737878と僅かに内側。`(radius−1)×39` は−0.023055 / −0.010223 mmだが、実侵入深さではない。S16未制作かつ既存caps変更対象外のため未解決として固定。全灯具の光体クリアを合格にしていない。

新4＋既存caps2の6 tests成功、305.548 ms。旧Y1665への誤配置、5 mm内寄せ、逆法線の負例をそれぞれ検出。共有geometry4個・材質1個をdisposeで重複破棄しないことも確認した。全game/render/端末testの代用ではない。

## 実費用・出力

| 部品 | 配置数 | 1配置 tri | 1 geometry attribute vertices | 共有buffer |
|---|---:|---:|---:|---:|
| wide S09/S10 | 2 | 364 | 458（位置184） | 16,840 B |
| depth S11/S12 | 2 | 364 | 422（位置184） | 15,688 B |
| S13 / 16角 | 1 | 384 | 192 | 8,448 B |
| S14 / 16角 | 1 | 512 | 256 | 11,264 B |

計 **2,352 triangles / 6 mesh / 4 geometry / 52,240 B buffer / 1 material**。mesh数は描画構造上の数で実GPU draw測定ではない。caps24を使う比較では2,800tri。全Miraへ加算する採用や既存actor予算合格は行っていない。

`geometry/S09.obj`〜`S12.obj` は個別部品、`S09-S14-partial-assembly.obj` は6部品組立。native positions/indices/UV/crease normalsとworld matrixは`native-geometry.json`。OBJもUV/normalを保持する。全検査・16/24比較は`geometry/report.json`。

`native-three-views.png/svg` は実meshを正面/真横/斜めに投影した**CPU幾何図**、`upper-seat-contact.png/svg` は実座面の三角形と接触面。原生成画像を加工していない。面色は技術表示、centroid順の可視面処理は近似で、Three WebGL/実材質/照明/ゲーム画面ではない。2枚を実見し、下端未接合・端の差・図の範囲を確認。SVG末尾空白を正規化して保存した。

## 出所・時間・再現

元生成2枚/prompt/初採否/hashは`references/`へbyte無変更で保全。初採否は全sheet不採用で、その後の親による選択3方向だけの型資料使用許可を今回の根拠とする。生成TOPの不成立は解除していない。新画像生成0・新download0。

`TIMING.json`は実装marker、最初の保存済native検査、必須法線手戻り、最終exportと記録終了を区別。資料読取/npm ciはmarker前に行ったため、その全準備時間は別計時していない。最終native生成34.239 ms / exportと解析231.170 msはhost実行時間であり、形の解釈・コード化・手戻り・画像実見・部品制作全体を「一瞬」とする根拠ではない。

再現：`node --test tests/mira-lantern-micro-v62.test.mjs tests/mira-micro-parts.test.mjs`、`node scripts/export-mira-lantern-micro-v62.mjs`、任意で`python review/lantern-micro-v62/plot-native.py`。追加依存なし。元caps source/default、src、package/lock、通常配信UIの変更0。本編にimportしない研究候補なので、通常buildやSiteをこの部品のため変更しない。

正式WebGLはGL Disabledのまま。自然な材質、完全原画一致、glow/caps全体接合、下受け・杖・手、iPhone費用、PS4品質は未確認。未完了session0、追加再設計/生成なしで本有限候補を閉じる。
