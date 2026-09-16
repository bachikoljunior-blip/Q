# v58 原生成 cloth：独立した素材成立条件レビュー

**判定は「限定的な optional base-color 比較へ進める候補、runtime 全面採用は保留」。** 原画の織り・色むらが current flat cloth と違うことは確認したが、実ゲームで良く見えるとは確認していない。単一生成素材の技術・視覚レビューであり、出所を隠した blind A/B や PS4 画面評価ではない。正式 image_gen/reference 0 の原画像を `view_image` で実見した。原画・runtime・既存 v57 source の変更は 0、Python は decode / 数値検査だけ。

## 原ファイルと視覚上の限定所見

`/workspace/scratch/e72662e3b71f/q-original-cloth-v58/original-wool-basecolor.png`

1254×1254 RGB8、3,416,517 B、SHA256 `ba1db9154df3a40cbb18cb5e0b0f4cae539efa9937263079a647953d7f9fa260`。新規に全 PNG chunk CRC / decode / hash を照合した。これは生成された布の表現であり、実布の撮影・scan・校正済 albedo / roughness / normal セットではない。

実見では灰色を中心とした毛羽、交差する糸、暗い間隙、明るい縁があり、大きな折れ・明瞭な染み・文字・枠は見当たらない。規則格子だけの current synthetic より局所変化は多い。ただし糸の明暗は描き込まれているため、実照明を重ねたときの二重陰影を疑う必要がある。原画が好ましく見えることと、3D material の成立は別。

linear-sRGB の 19×19 cell 平均に plane を当てた全体傾斜は左右 +0.38%、上下 +0.73%、R²=.0036。単純な大きな方向照明の傾斜は小さいが、この試験は pigment と illumination を分離できない。cell の平均輝度は全体平均に対して p05=.933 / p95=1.071。無彩色そのものではなく mean linear RGB `[.194585806,.180533249,.168750640]` の暖色寄り。Mira の既存 `696454` を平均として維持する hypothetical material linear tint は `[.725969145,.705895901,.525364446]`。平均正規化後の RGB は全 pixel で 1 以下だが、色の自然さ・局所明暗の良さは未確認。

## 尺度と繰返し

0.25 m は prompt の意図だけであり、画像に計量基準はない。FFT の強い周期は縦85 / 横83 cycles/image、14.75 / 15.11 pixels。0.25 m tile と仮定すると反復間隔は 2.94 / 3.01 mm。29–30 pixel の autocorrelation peak もあり、約 2 本分の織り組織を拾っている。**反復間隔を糸の直径と同一視しない。** 0.5–1 mm という prompt の糸幅を実測で満たしたとは認定できない。tile 幅を .125 m にすれば主間隔は 1.47 / 1.51 mm、.075 m なら .88 / .90 mm にできるが、これは authored UV scale 選択であって原画像の実寸回収ではない。

原 resolution の wrap first↔last 輝度 RMS は通常の内部隣接差の 2.24 倍（上下）、2.18 倍（左右）。従って exact seamless ではない。16 px edge strip の平均差は上下約5.0%、左右約3.46%。ただし原寸の辺差だけで会話 mip 時の目立ち方を決めてはいけない。

親の指定に従い、linear-sRGB 輝度だけを数学的な separable area-box と centre-bilinear で半解像度へ進め、数値統計のみを保存した。画像や mip asset は出力していない。GPU `generateMipmap` の実 kernel・trilinear・anisotropy は実行していない。

| mip level / square size | box の辺 RMS / 内部 RMS（上下 / 左右） | bilinear の同比 |
|---|---:|---:|
| 4 / 78 | 1.164 / 1.233 | .943 / 1.075 |
| 5 / 39 | .939 / 1.064 | .809 / 1.030 |
| 6 / 19 | .861 / 1.146 | .654 / .870 |

box model の空間輝度標準偏差 / 平均は level4=12.0%、5=7.56%、6=3.54%。原画の非一致辺は残るが、想定 mip では境界の隣接差が内部より桁違いに大きい状態ではない。これは「繰返しが見えない」「seamless 合格」の意味ではない。目立つ特徴の再登場、tile grid、陰影との二重性は runtime 比較で残すべき採否項目。

## 実会話カメラ条件の投影尺度

v56 の固定 `uv-scale.json` が測った current 上衣の actual dialogue camera sample depth を使用。camera-plane 相当の等方投影であり、新素材を描画したり接線方向の実微分を測った値ではない。斜面では mip がさらに上がり得る。

| viewport | .25 m tile の投影幅 / mip LOD | .25 m の主周期 px | .125 m tile の投影幅 / mip LOD | .125 m の主周期 px |
|---|---:|---:|---:|---:|
| 1280×720 | 69.63 / 4.17 | .82–.84 | 34.82 / 5.17 | .41–.42 |
| 844×390 | 37.72 / 5.06 | .44–.45 | 18.86 / 6.06 | .22–.23 |
| 390×844 | 81.63 / 3.94 | .96–.98 | 40.81 / 4.94 | .48–.49 |

大部分の織糸は pixel 以下になる。見える比較対象は、糸を 1 本ずつ読むことではなく、適切に平均された中尺度の色むらや均一格子感の変化。これだけで既存の 5–30 mm fold / 張力 / 縫い目の造形欠落を埋める素材ではない。必要な中尺度の折れを basecolor の陰影で偽造したとも扱わない。

## 1254 NPOT と費用

installed Three.js は `0.186.0`。`WebGLRenderer.js` は webgl2 を作り、r163 以降 WebGL1 非対応と明記。[公式 WebGLRenderer docs](https://threejs.org/docs/pages/WebGLRenderer.html) もこの契約を確認できた。local `WebGLTextures.js` の resize は `maxTextureSize` を超えた場合だけ、wrap/filter はそのまま GL へ設定、mips は実 image dimensions を使う。POT 化を要求する分岐はない。従って **1254 NPOT 自体は現 WebGL2 経路の却下理由ではない**。この読み取りを実端末 upload 成功に読み替えない。Khronos official spec の閲覧は tool Internal Error となり、別経路へ迂回していない。

数学的な RGBA8 / SRGB8_ALPHA8 payload は level0=6,290,064 B、full mip=8,384,072 B（約7.996 MiB）。mip 辺長は `1254,627,313,156,78,39,19,9,4,2,1`。PNG 転送は +3,416,517 B（HTTP compression / cache 未測定）、browser RGB decode 相当4,717,548 B / RGBA staging 相当6,290,064 B。CPU decode、upload、GPU allocation・padding・process peak・通信時間は未測定。Python 検査2.253 sはこれらの代用にならない。通常Web主方式なので旧16MiB単体上限で素材を削らないが、実費用を省略もしない。

## 次の runtime 試作に必要な条件

1. v57 の dedicated upper cloth / physical UV の確定後、その専用 material の `map` だけへ適用する。`src/assets/characters/cloth-material.js` と専用 optional `cloth-basecolor-loader.js` / asset URL / provenance が想定入口。顔・髪・紙・革・外套・他 role の shared material へ自動で広げない。新 triangle / bone / displacement は加えない。
2. `map.colorSpace=SRGBColorSpace`、`channel=0`、browser image 向け `flipY=true` を明示。`RepeatWrapping`、`LinearFilter` / `LinearMipmapLinearFilter`、`generateMipmaps=true`、anisotropy は capability 以内に固定。`maxTextureSize<1254` や寸法/hash不一致では元 v57 material へ fallback し、Three の暗黙 resize を採用しない。
3. v57 は .256 m / UV tile の契約。原意図に近い比較は repeat1（.256 m）、細かい比較は repeat2（.128 m）なら元 chart の整数 U seam 位相を保てる。.125 m のために2.048倍を盲目的に設定すると integer chart seam を崩すため避ける。上表の .25/.125 m は親指定の独立計算値で、.256/.128 m はそれぞれ幅・周期が2.4%大きく、LODが約.034低い。採用試作で actual UV/密度を再計測する。
4. 上記 linear mean で既存 palette 平均を保存し、map を外した fallback では元 color を完全復元する。既存 bump / roughness はこの画像と同一の PBR source ではない。画像から normal / roughness を推定しない。最初の比較では v57 の両 map を固定して basecolor の差だけを見るが、未対応の relief/色の位相・二重陰影を未解決事項として記録する。
5. world の optional loading とし、title/initial JS へPNGを eager import/decodeしない。load Promise 1件を共有、failure 時は flat v57 を継続し retry 毎 frame を禁止。寸法・colorSpace等を検査し、成功した正本だけ全 live eligible material へ attach。各 actor clone は texture を所有・disposeしない。
6. cache に generation/epoch を設け、破棄後の遅着 decode は attachせず一度 dispose。detach map / 元色を復元してから cache所有textureのdisposeを要求する。ImageBitmap を所有する方式ならその close / source参照解除も所有者で行う。singleton Scene 継続時に title transition ごとに再 decode / leak を起こさない。これは解放要求と参照寿命の設計であり、GPUメモリ確定解放とは呼ばない。
7. 三viewport・同カメラ/pose/palette/lightの basecolor 無/有、seam、tint、影/roughness、normal-Web 全byte provenance、既存初期JS/3chunks、13/14 draw予算等を確認する。正式画面なしの段階ではロード契約と数字だけを通過条件にし、知覚改善の合格にはしない。

本 review の保存は `q-original-cloth-review-v58` のみ。author の自己評価や既存 PASS は新測定へ流用していない。追加生成・原画像加工・外部素材取得・runtime 編集・新 spawn は行っていない。必要な次の作業は上記の optional 比較一単位であり、無限の素材探索ではない。
