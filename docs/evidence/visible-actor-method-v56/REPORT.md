# v56 — 見えている人物素材と物理尺度の有限調査

2026-09-16。基点 `Q-ps4-v53` / `21d381c82cd5cf3d7febd72ad4c877157718ee8d`。runtime・依存・画像・共有正本・remote に変更なし。これは native CPU geometry、原画像の閲覧と数値サンプルであり、WebGL の画面・材質の自然さ・GPU 実測・PS4 達成判定ではない。

**次の一単位は Mira の上衣の物理 UV 尺度を優先する。** 現在の cloth sine 模様は、可視上衣で約 12–16 mm の U/V 周期になっている。原肌の全面転用も、未取得の外部 cloth map も採用しない。上衣は可視顔の約 5.2 倍、革の約 16 倍の投影面積を占めるため、革候補は優先対象から外した。調査中に調べた候補を無制限に増やさず、最終比較は下記の A 顔 / B 上衣の 2 件に限定する。

## 同条件と実際の可視面

既存 `tests/static-scene-fixture.mjs` の明示された renderer/assets/DOM 境界を使用し、実 `SceneView`・`Game`・`DialogueCamera`、keeper の +Z 3 m からの通常会話、actor time 0、同じ root/pose/yaw を実行。1280×720 / 844×390 / 390×844 の各 viewport、既存 dialogue safe-frame y=.035–.515、4 px 格子で native skinned / rigid triangles の最初の交点を数えた。Mira と player が互いを隠す状態を含む。環境 geometry、実 DOM、fragment alpha、陰影、AA は検査していない。下表は 1 ray = 16 px² とする粗い面積推定であり、raster 被覆の確定値ではない。

| 表面 | 1280×720 px² | 844×390 px² | 390×844 px² |
|---|---:|---:|---:|
| Mira の外顔 | 4,704 | 1,392 | 6,352 |
| 胴＋袖の上衣 | 24,560 | 7,264 | 33,648 |
| 革の帯・手袋等 | 1,520 | 432 | 2,160 |
| 外套 | 512 | 176 | 736 |
| 髪 | 80 | 32 | 160 |
| 紙 | 544 | 144 | 784 |

実 source の顔色は Mira `ab8770`、上衣 `696454`、革 `494334`。本測定で実 actor は 6,718 triangles / 12 visible meshes。全 family の新予算検査を行ったという意味ではない。current source は未変更である。

`visibility.json` は材質 inventory と全 sample の UV / face ID / head-local point を保持。現 Mira には base-color map と normal map がなく、64² RGBA procedural texture の R を bump、G を roughness に使う。cloth bump=.0014、skin=.00018、leather=.0008、roughness はそれぞれ約 .94 / .61 / .77 を中心とする。hair と paper は cloth、wood は leather という分類流用がある。これらの材料まで一斉に repeat を変更してはいけない。実 diffuse skin は `src/skin-materials.js` が smith だけへ登録している。

## A — 原 UV に適合する顔の色変化

保全済み原画像を `view_image` で閲覧し、再度 PNG decode / SHA / CRC / original UV を測定した。

- 原画像: `Q-ps4-v53/docs/evidence/skin-source-v38/young_lightskinned_female_diffuse.png`
- 2,048² RGB8、4,391,156 B、SHA256 `b2a6ac8cd4f9febdb447368e29c76cd68410bb66e46d9dcfa2d5f75126eea8fc`、PNG file CRC32 `fa5bc375`。
- 同ディレクトリの `young_caucasian_female.mhmat` は 1,464 B、SHA256 `0bdea7786201f0b1132a24088336a97496ccdc54e9984db65d253a6a6d66f24f`。既存 descriptor は CC0 を明示。`LICENSE-CC0.md` SHA256 `f6089cba01cb570a24712b41ab8a586ccd3cc5ef53dc266ca50b95c288956d2c`。
- [公式 catalog](https://static.makehumancommunity.org/assets/assetpacks/makehuman_system_assets.html) で同 asset の CC0 表示を今回再読。[公式 license](https://static.makehumancommunity.org/about/license.html) は graphics assets と application code の条件を分けている。商用利用・派生配布可能な graphics source として扱い、scan / calibrated albedo とは称さない。今回は既存取得済み source を読むだけで再ダウンロードしていない。

`female / young / caucasian` は原 catalog tag であり、Mira の年齢・性別・人種を設定したり推測する根拠ではない。現在の原 male map を Mira へ転用する案も含めない。原画像の実見では、頬の色むら・赤みのある唇・暗い眼元・密な頭皮 follicle がある。唇や眼元が化粧か自然な authored coloration かは descriptor に記載がなく、中立性を認定できない。既存描き込みを光源非依存の物理 albedo とも断定しない。

**新測定:** current `identity-head-data.js` の original UV corner 1,015 個は pinned OBJ の該当 UV と誤差 0。synthetic cap の 47 corners は別扱い。外顔の元 UV 面積は atlas 全体の 17.8193%。可視顔の 294 / 87 / 397 hits はすべて外側 region 0 で、赤い眼内島・口内・collar・cap の first-hit は 0。これは調べた姿勢の格子値で、全姿勢で内部島が絶対見えないという証明ではない。

両目それぞれ 45 点を実カメラから既存開口へ向けた補足 ray は、各 viewport 共通で左 19 / 45・右 20 / 45 が独立 eye、残り 51 / 90 が外顔の眼窩へ当たる。両目中心は既存 iris `372f25` に当たった。従って 4 px 格子で eye が 0–4 点しか取れないことを眼球消失と誤読しない。原 eye 内島は白目や虹彩を提供せず、別 eye / lid 材と 2 lid bones を保持する必要がある。眼窩へ当たった 51 点は region 0 の暗い原眼元をサンプルするため、新 map が eye opening に二重の色や瞼との継目を出さないかは未確認である。

既知の頭皮矩形 `[1320,480,1620,850]` / `[1320,1300,1620,1630]` は現会話でも 1 / 0 / 2 hits が露出。この少数値から知覚上の有意性は断定しないが、完全に髪で隠れるという採用条件にはできない。矩形は頭皮の全領域分類ではない。

首の 46 source vertices / 47 corners から再計算した hypothetical mean normalization は linear RGB `[.6899927594,.4283721897,.2878509725]`。Mira の既存平均 tint を保っても局所 collar 色差最大 9.66 / 255 が残る。front diagnostic box (y=-.07–.14、z≥.065、region 0) の面積は 3,232 / 992 / 4,768 px²。原色を首基準で正規化しただけの最大 channel 差の中央値は 12.49 / 9.48 / 11.94 (255 scale)。これは数値の色差であり、美術改善値ではない。source sampling は中央値 5.41 / 9.99 / 4.64 original texels per projected pixel。高解像度化自体を利点にしていない。

**判定:** 全面転用は不採用。後続で試すなら、まず eye / lid / lip / scalp / neck を既存仕様に保った顔前面だけの authored material coverage を定義し、人物設定を変えずに比較する。一括 role 拡張はしない。現小比較はその mask を実装・承認していない。原 PNG をそのまま新 runtime に載せれば +4,391,156 B、full mip RGBA8 の理論値 +22,369,620 B (21.333 MiB)。shader mask を付けても全 atlas の decoded payload は減らない。GPU 実 allocation / peak は未測定。

## B — 可視上衣の物理尺度と中尺度の折れ

既存 64 px cloth recipe は `sin(xπ/2) × cos(yπ/2)`、1 tile 16 周期、texture repeat 4、合計 raw UV 64 周期。current `tailored()` は形状 ring ごとに V を等間隔、U は角度等間隔にしており、物理長に一致しない。native posed triangle の `J=[∂world/∂U, ∂world/∂V]` を実計算した。

| current visible upper cloth | 1280×720 | 844×390 | 390×844 |
|---|---:|---:|---:|
| J singular values median (m / raw UV) | .5700 / 1.0876 | .5809 / 1.0876 | .5920 / 1.0876 |
| singular direction scale ÷64 (mm) | 8.906 / 16.994 | 9.076 / 16.994 | 9.250 / 16.994 |
| actual U / V pattern axis period median (mm) | 15.715 / 12.564 | 15.540 / 12.623 | 15.715 / 12.590 |
| camera-plane 5 mm equivalent (px) | 1.393 | .754 | 1.633 |
| camera-plane 20 mm equivalent (px) | 5.571 | 3.018 | 6.530 |
| camera-plane 30 mm equivalent (px) | 8.356 | 4.526 | 9.795 |

singular direction scale は伸縮の主方向であり、U/V 軸の織り周期そのものとは区別した。5–30 mm 欄は同じ visible samples の深さを用いた pinhole の camera-plane 寸法であり、面の傾斜・影・特定の素材模様の見える幅を実証したものではない。

全 sampled face の正確な 3×2 matrix は `uv-scale.json` の `sampledTriangles[].uvToWorldMetresMatrix`（2 列を各 3 成分で保存）。720p の例、face 278 は列 U `[.6331413,-.0064710,.1362153]`、列 V `[.1666967,.2395730,-.7083543]` m / raw UV。1 tile を約 .14×.27 m に引き延ばした規則的 sine を小さい布織りと呼ぶ現前提を修正する。

**原資料と取得限界:** 既存 Hessian 原画像は `Q-ps4-v53/docs/evidence/cloak-material-v36/source/hessian_380_diff_1k.jpg` / `hessian_380_nor_gl_1k.jpg` / `hessian_380_rough_1k.jpg`。diffuse を今回実見した。粗い jute の織りであり、Mira の cloth の材質指定や 5–30 mm の張力皺を自動で与える資料ではない。旧 `provenance.json` は 1K URL の推測取得と公式 expected digest 未検証を明示している。原 bytes は保持済みだが、この履歴を正常な公式 1K manifest 検証済みに書き換えない。今回の小調査で旧 FFT / 原実寸の PASS を新測定に流用しない。

第二候補の source 探索は [Denim Fabric 02](https://polyhaven.com/a/denmin_fabric_02) 1 件で止めた。公式は Rob Tuytel、CC0、0.1 m tile、OpenGL normal / roughness を記載。[Poly Haven license](https://polyhaven.com/license) は asset の商用・派生配布を認める。色と服の歴史設定を変える indigo diffuse の転用は提案しない。正式に掲載された 4K JPEG の normal `denmin_fabric_02_nor_gl_4k.jpg` は tool size refusal (11,466,937 B)、rough `denmin_fabric_02_rough_4k.jpg` も size refusal (10,597,901 B)、flat preview は timeout。**いずれも取得済み source / 検証済み hash ではない。** 別 path・API・range・縮小URLで迂回していない。4K 2 map の理論 full mip RGBA8 は 178,956,968 B、未取得 1K 2 map なら理論 11,184,808 B。低解像度は別の公式配布 source が明示された場合にだけ後続で検討し、無断 downsample は行わない。

**推奨する次の有限実装:** Mira の torso/sleeve 483 vertices の UV と cloth material 所有だけを扱い、position / index geometry / normals / skin indices / weights / bone / 首・袖口・肩接続 / palette を不変にする。上衣の周・経方向を実長で測り、現在の cm 級規則格子を微細織りとして使う契約を修正する。hair / paper / cape / leather に global repeat の変更を波及させない。体形 v54 を復活させず、元の折れ形状・縫合との整合を保つ。material を分けるなら Mira の draw 増分と全使用 role の 8k / 14draw 上限を再計数する。

新しい 5–30 mm fold は単なる周波数変更や追加 noise を折れの根拠にしない。肩・肘・前立て・袖口の張力方向、既存 mesh folds と元の source map を対応づける。取得済み・合法・公式 path の normal / rough source が揃わないなら最初の unit を物理尺度 / shared material 分離の修復比較に限定し、写真の皺を導入したとは言わない。同じ visibility oracle、UV distortion / seam、5–30 mm 投影範囲、変更対象外 byte、actor budget、deferred / initial / 3chunks / normal-Web source byte gates を比較する。候補の shader・mips・自然さは正式画面なしに合格へ書き換えない。

必要な実装候補 files は `src/assets/characters/detailed-geometry.js` の通常 `tailored()` 呼出 / 対象 UV・surface 所有、および必要なら独立 cloth material helper、同 provenance、focused tests。新 asset は確認済み source のみ。`actor-models.js`、`core.js`、保存、camera、face shape、音は変更対象でない。

## 保存・測定時間と限界

v56 の新測定 scripts / JSON / stdout はこのディレクトリだけへ保存した。画像の crop / resize / retouch / codec 書換えは 0。source PNG の新 numeric sample は .631 s、renderer の実時間と混同しない。wall start は最初の visibility source 作成 mtime を下限として `TIMING.json` へ記録（課題読取開始の stopwatch は未取得）。UV oracle の初回は同色 cape を上衣 mesh と取り違える観測側の誤りがあり、`isSkinnedMesh` 制限と finite assertion で修正してから全 3 viewports を再実行した。NaN を含む初回値は採用していない。runtime の手戻りは 0、観測側 1 修復。正式画面・実端末・配信速度・PS4 比較は未取得のまま。
