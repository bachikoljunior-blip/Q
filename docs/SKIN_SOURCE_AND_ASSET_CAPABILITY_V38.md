# v38 肌原素材・offline制作機能の確定保存

**合法な別の肌原素材は取得済みだが、ゲームへの適用は未採用。Blenderは未導入で、画像生成物もない。** この保存単位は既に完了した2調査をそのままGit管理下へ移したもので、新たな素材制作・調査・download・install・runtime変更を行っていない。

基点は `5ff1388a101e6eb163c41b0110b95d79ab98a631`。元scratchの29 files、計4,702,896 Bを保存し、各byte数/SHA256と元HASHES.jsonを照合した。src132 filesのGit blobは基点と完全一致する。[コピー元・保存先・hashの全対応](evidence/source-evidence-v38-preservation.json)。この資料の追加容量はWebのruntime asset容量や新しいtexture費用ではない。

| 区分 | 確定した事実 | 未採用・未確認 |
|---|---|---|
| v36 既存男性atlasの共有調査 | 元UV互換は確認。鍛冶師の既存適用は維持 | ミラ等への無差別共有は見送り。髭/短髪/焼込み陰を転写しない |
| v37 正規image_genの編集1回 | output moderation `sexual` / HTTP400、画像未返却の記録を既に保持 | 生成候補0、再編集0、別tool/cropへの回避0。UV/色の比較は実施不能 |
| v38 別の既成CC0肌原素材 | 公式掲載の `young_caucasian_female` 原PNGとdescriptorを取得・CRC/hash検証 | ミラの灰髪との適合を確認できず、runtime未採用 |
| v38 offline asset capability | 読取だけの環境/公式metadata調査を保存 | Blender/bpy未導入、download0、offline render0、game frame0 |

## 保存した肌素材

元 `/workspace/scratch/e72662e3b71f/q-v38-skin-source-study` の**全22 files**を [skin-source-v38](evidence/skin-source-v38/RESEARCH.md) に一字一句/byteを変えず保存した。元研究報告はSHA256 `c1787e746c3768a3495d2815910941bcec3b6aee6dd71fe6f763de13af19efed`、[元HASHES](evidence/skin-source-v38/HASHES.json)も保持する。

[公式MakeHumanカタログ](https://static.makehumancommunity.org/assets/assetpacks/makehuman_system_assets.html)に掲載された別原素材で、画像生成の再試行や旧男性PNGの編集ではない。選定した原PNGは4,391,156 B / SHA256 `b2a6ac8cd4f9febdb447368e29c76cd68410bb66e46d9dcfa2d5f75126eea8fc`、2048×2048 RGB。descriptorがCC0 releaseと作者を明記し、[原descriptor](evidence/skin-source-v38/young_caucasian_female.mhmat)、[CC0全文](evidence/skin-source-v38/LICENSE-CC0.md)、[出所](evidence/skin-source-v38/provenance.json)、公式ZIPのETag/entry/HTTP206/CRC記録を保存した。これはgraphical skinであり、photoscanや校正済みalbedoではない。配布側のyoung/female/caucasianタグからミラの年齢・性別・出自を新しく定義しない。

原画像を直接確認したところ顔は髭なしだが、頭皮の濃い短髪模様が残る。実ミラ形状の該当95三角形中心への固定2.6 m視線では、yaw −70/−45/0/+45/+70°で10/10/7/14/14点が他表面に隠れなかった。「髪で全て隠れる」という前提は採れない。[native三角形の記録](evidence/skin-source-v38/scalp-visibility.json)。これは実mainのcamera全域や実WebGLを検証したものではない。

原UV1,015 cornersは元hm08 UVと一致するが、別肌画像の目/唇/首の知覚的な適合を保証しない。唇patchの比較は相関が低く、首色も平均を合わせた仮計算で局所最大9.660/255の差が残る。[比較](evidence/skin-source-v38/comparison.json)のtintは未採用で、runtimeへは反映していない。現男性画像を残して同寸法画像を別textureとして使う場合の追加RGBA8 mip費用は約21.333 MiBという理論値であり、実GPU計測ではない。

## 保存した制作機能の調査

元 `/workspace/scratch/e72662e3b71f/q-v38-offline-asset-capability` の**全7 files**を [offline-asset-capability-v38](evidence/offline-asset-capability-v38/REVIEW.md) に変更なく保存した。元報告はSHA256 `fc7bb8a0b35eac070188c32f3740b6329f1e49a94d61caaa4f246716e5da2704`、[元HASHES](evidence/offline-asset-capability-v38/HASHES.json)も保持する。

元調査時点ではBlender実行file/bpyは存在しない。Linux x86-64/glibcの基本条件だけでは実行可能と判断せず、掲載を確認したbpy wheelはCPython3.11向けで現Python3.12とABI不一致として記録した。portable Blenderの掲載情報は具体的な候補で、ローカルstartupやCycles CPUの成功証拠ではない。

公式配布ディレクトリと詳細文書への最初の直接readは **HTTP402 Payment Required** を返した。[正確なURLと応答](evidence/offline-asset-capability-v38/reachability.json)。402が配布元・中継・取得サービスのどこに由来するかは不明で、Blenderが有料だという意味に読み替えていない。実行hostからarchiveのHEAD/GETは行っておらず、別host・curl/Python/browser等への迂回もしていない。download0、install0、実行0、画像0のまま保存する。本保存単位でも再試行はない。

個別meshを元UV/画像で点検するoffline制作アプリは、原則としてゲームの画面取得とは異なる候補工程である。しかし今回は導入も実行もしておらず、正規Sites preview、WebGL shader、スマホ性能やPS4相当の比較を代替したとは主張しない。

## 再実行する場合の注意と保存検証

元資料内の絶対scratch/checkout path、実行時刻、元source hashは履歴として保持し、書換えていない。将来の別の正式実行が必要な場合は保存directory全体を**別のscratchへコピー**し、原画像/hashと対象repoのsource hashを照合してから行う。保存済みJSONを上書きして元観測と混ぜない。

- `skin-source-v38/inspect-source.py` はrepo pathを第1引数で指定でき、無指定の旧既定値は `Q-skin-candidate-v37`。原PNGを読む数値比較で、出力はscriptと同じdirectoryへ書く。
- `skin-source-v38/inspect-scalp.mjs` はrepo pathを第1引数で指定でき、無指定の旧既定値は `Q-ps4-v35`。そのrepoのThreeとactorを読み、出力はscriptと同じdirectoryへ書く。別sourceで得た値を旧hashの結果と呼ばない。
- `skin-source-v38/acquire.py` は**ネットワーク取得を実行する**履歴用scriptである。保存確認に再実行する必要はない。この単位では再downloadしていない。
- `offline-asset-capability-v38/preflight.py` は読取用だが、再実行すれば現在の環境値が得られる。保存された2026-09-16時点の観測とは区別する。

今回実施した検査は、元manifestの全entry検証→29 filesのbyte同一コピー→全SHA256 readback→src132 blob基点一致→staged diffがdocsだけ、である。新HTML生成、build、runtime tests、配信/remote操作は行っていない。コピーと検証の実測は2.156702秒で、素材取得/制作/統合の所要時間とは別。

資料を確定保存したことは、肌の採用・画像生成の成功・Blender導入・作品品質改善・PS4達成を意味しない。未確認のlit顔/首/眼/唇、実機、FPS/GPU、正式画面の境界を保持する。
