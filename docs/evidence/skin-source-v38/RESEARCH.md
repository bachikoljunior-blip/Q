# v38 独立した既存CC0肌素材の取得・適合判断

**公式の別原素材1件を取得できたが、ミラへの無変更適用は今回は提案しない。** `young_caucasian_female` の顔には旧男性画像の髭の陰が見当たらない。一方、濃い短髪/頭皮模様が残り、現ミラの髪に全て隠れるという前提は実triangleの固定視線検査で成立しなかった。原素材は後の選定・組込判断へ渡すため保持し、runtimeへは入れていない。

この20分単位は、(1) v36の無編集男性画像共有見送り、(2) v37の画像生成1回がoutput moderationで拒否され画像未返却、(3) **今回の別作者制作済みCC0原素材の調達**を明確に分ける。(2)の男性画像を別prompt/tool/cropで編集したものではなく、生成の再試行は0回。今回の全書込みは `q-v38-skin-source-study` のみ、Q repo/source/runtime・Site・remoteに書き込んでいない。

## 公開出所と取得

[公式system assetsカタログ](https://static.makehumancommunity.org/assets/assetpacks/makehuman_system_assets.html)に `skins / young_caucasian_female / makehuman_system / CC0` が掲載され、そのページのmirror1は今回利用したfiles2アーカイブを明示する。代替hostは使っていない。[公式ライセンス説明](https://static.makehumancommunity.org/about/license.html)はcore assetのCC0とアプリケーションコードのGPL/AGPLを区別する。

今回の取得先は `https://files2.makehumancommunity.org/asset_packs/makehuman_system_assets/makehuman_system_assets_cc0.zip` のみ。過去のarchive metadataを最初に読み、今回再びHTTP206 Rangeで実central directoryを取得して517 entriesと対象名/offset/CRCを確かめた。総量280,737,770 B、ETag `"10bbb7ea-6160e7c0d7996"`、Last-Modified `Sun, 14 Apr 2024 13:28:46 GMT` は旧記録と一致。

| 取得した原ファイル | 原byte | ZIP CRC32 | SHA256 |
|---|---:|---|---|
| `young_caucasian_female.mhmat` | 1,464 | e4faa467 | 0bdea7786201f0b1132a24088336a97496ccdc54e9984db65d253a6a6d66f24f |
| `young_lightskinned_female_diffuse.png` | 4,391,156 | fa5bc375 | b2a6ac8cd4f9febdb447368e29c76cd68410bb66e46d9dcfa2d5f75126eea8fc |

PNGの正確なentryは `skins/young_caucasian_female/young_lightskinned_female_diffuse.png`。URLや1K派生pathを推測していない。descriptorの正確な`diffuseTexture`も同ファイルを指す。descriptor先頭が2020年9月の明示的CC0 releaseとData Collection AB / Joel Palmius / Jonas Hauquierを記載する。既存repoに保持された同一公式CC0全文を `LICENSE-CC0.md` としてコピーした。詳細は `provenance.json`。

これは**author-created graphical skin**であり、写真scanやcalibrated albedoの出所とは称さない。young/female/caucasianは配布側のタグとして保持し、ミラの年齢・性別・出自を新しく定義する根拠にはしない。

`acquire.py` は同一公開ZIPの通常Rangeだけを使い、PNG圧縮データを4分割（最大4同時）で取得して連結・inflateし、原byte数とCRCで検証する。分割転送は画像編集ではない。全HTTP要求は206成功、再試行/認証/購入/権限拡大なし。Webのclick補助呼出し2件はURL解決前のinvalid-argumentsで、HTTPアクセス拒否ではなかった。取得にはページと元provenanceが明示している同一archive URLを使用した。

## 原画像を実際に確認した結果

取得PNGは2048×2048 RGB、PNGメタデータはdpi72.009、ICC/sRGB chunkの宣言は確認されなかった。色空間の数値検査は既存Qのdiffuse経路に合わせsRGBを仮定し、実colorimetric校正とはしない。画像は `view_image` で直接確認した原atlasで、生成画像/加工画像/ゲーム画像ではない。裸体の演出ではなく技術素材の読取であり、資料への余分な全身画像転載はしていない。

顔の口元・顎は髭の影を避けた素材として有用。ただし頭皮の左右/後ろ側に濃い点状短髪模様、目周囲の暗い縁、唇の赤み、頬の色むらや斑点があり、全面が中立の無陰影肌ではない。眉mesh、独立eye/lid、灰色の髪とどのように重なるかは別の問題である。耳/鼻孔/眼/口の島配置はhm08系原atlasと対応するが、別素材なので画素や顔の描き方は同一ではない。

## 現UV・landmark・首の同条件検査

`inspect-source.py` は既存ミラの `identity-head-data.js` と公式hm08 OBJのsource UVを読み、原PNG2枚を同じUVで読むだけである。画像の切貼り・crop・リサイズ・再pack・書換えは0。

- 原UV1,015 cornersは元OBJと誤差0、UV範囲内。synthetic cap47 cornersを原境界の照合に混ぜない。UV保持はsourceデータの事実であり、画像の知覚的適合の証明ではない。
- 眼/鼻/鼻孔/口/耳の8実UV付近で、原男性PNGの33×33 patchを基準に女性PNGの±16px範囲を比較した。normalized cross-correlationは**診断値だけ**。眼/耳/鼻孔のbest shiftは0〜2px近傍、NCC約0.808〜0.911。noseはNCC0.578、mouthはNCC0.404で(-8,-1)px。別の描き方や色も相関に影響するため、これをそのまま幾何的な口移動や全landmark合格と断定しない。
- 首46原頂点/47 UVをlinear-sRGB bilinearで読むと、新原画像の平均は `[0.6899927594121295, 0.4283721897289286, 0.28785097247276076]`。既存ミラの色`0xab8770`へ平均を合わせる仮tintは `[0.5902093990793519, 0.5655855545124648, 0.5628932716370926]`。局所の首色差は最大9.660/255残る。この係数は**未採用**で、後にcodecを変えれば採用画像の実texelで再計測が必要。
- 比較側は元男性PNGで、既存runtime q95とは別。男性PNGの同条件最大差11.757/255と、v36のq95による11.289/255を混同しない。

全数値と採用していない係数は `comparison.json`。原shader descriptorのlitsphere/SSS等をQへimportしたものではない。

## 残る短髪模様は髪で隠れるか

原画像の明らかな頭皮点状模様からpixel矩形 `[1320,480,1620,850]` と `[1320,1300,1620,1630]` を手動で選んだ。これは全頭の自動分類ではない。`inspect-scalp.mjs` は実ミラactorの元UVがこの範囲に入る顔三角形中心95点を取り、実skinned表面6,718trianglesへ両面の視線を通した。

| 頭正面からのyaw | 視線側を向く対象点 | 他表面に隠れない点 |
|---:|---:|---:|
| −70° | 33 | 10 |
| −45° | 22 | 10 |
| 0° | 7 | 7 |
| +45° | 28 | 14 |
| +70° | 37 | 14 |

距離2.6 m、頭原点より視点を0.08 m上げた固定条件。実main camera/合法camera全域/実WebGLの検査ではないが、**既存灰色髪が対象の点状模様を常に全て覆う**という仮定には反例となる。結果に原UV・world点・最近傍材質とsource hashを保存した。実顔へ新mapは一切installしていない。

この残存模様と唇/まぶたの見え方が未判定であるため、今回の『明確に適合する場合だけMira専用統合を提案』条件には到達していない。取得成功・CC0・UV互換を、runtime採用や役柄の知覚的合格へ読み替えない。

## 次工程へ渡す費用と境界

原画像4.391 MBを新しく保持できたが、runtime/初期JS増分は0（本unitでは未参照）。現男性画像も維持して女性原atlasをそのままもう1枚decodeすると、RGBA8 mipの理論payloadは**追加22,369,620 B（約21.333 MiB）**。実GPU割当・decoder stagingは未測定である。配信codecで圧縮できても、このdecoded費用が同時に減るとはしない。今回はcodec候補を生成していないため追加転送byteの見積りを捏造しない。

取得はarchive tail27.312581秒、descriptor+PNG172.233929秒。4並列PNG rangesは各約113〜115秒で、合算をwall時間として扱わない。新画像制作/生成/再編集0秒、runtime組込0秒。source比較の秒数は `comparison.json`、資料や読取の排他的な時間は未計時。v37の拒否待ち39.9秒とは別単位。

全成果は本scratchディレクトリだけに保存し、`HASHES.json` を付ける。Gitへ組込むwriterは統合担当であり、この調査自身で新remote/別repoを作っていない。必須copy対象は原PNG・descriptor・CC0・provenance・selection/current entries・acquisition記録・comparison/visibilityと両oracle・本報告。全fileをhashとともに渡せる。

正式WebGL/実機・照明下の肌/首/眼/唇・FPS/GPU・PS4品質は未確認。見送った無編集共有、生成拒否、今回の別既成source取得を保存し、それぞれの未解決を混ぜず次の素材選定へ渡す。
