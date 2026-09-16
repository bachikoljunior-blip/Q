# v36 原肌atlasの人物適合確認

**既存の画像を他の人物へ無変更で共有する案は、今回は採用しない。** ミラを含む未適用の顔には平坦な肌の簡略化が残る。しかし原atlasには短髪の点状模様、口周囲・顎の灰褐色の髭の陰、目窪・鼻・耳の焼込み暗部があり、単なる表面の細かな色むらではない。原UVの技術的な一致だけを根拠に、これらの特徴を全役へ追加しない。鍛冶師レンの既存適用は保持する。

基点 `e731685be92c4c98a20115d2244e580e371ca084`、専用 `Q-skin-coverage-v36`。この単位は適合判断と読取検査のみで、**srcの132ファイル全てが基点のGit blobと一致**する。原媒体・顔形状・肌色・材質・骨・動作・Game・保存・配信コードを変更していない。新しい画像の取得/生成/編集は0回。後続の肌候補制作は別単位である。

## 実際に見た資料

正式 `view_image` で原PNGと現行q95 WebPを直接確認した。いずれも **原素材の2D atlasでありゲーム画面ではない**。原PNGは3,693,828 B / SHA256 `862a26e335e958b70534cb5f0d7c47ef30ab148a56c42b3e9da969cf76f12963`、現行WebPは541,954 B / `7628814980308b9525b27f09f98a099a0144d1a29e67bc6377702b4605678c04`。位置・色・画素は本単位で編集していない。

[原PNG](../src/assets/characters/skin/sources/young_lightskinned_male_diffuse.png)と[現行WebP](../src/assets/characters/skin/young-male-q95.webp)、[出所](../src/assets/characters/skin/provenance.json)、[CC0](../src/assets/characters/skin/LICENSE-CC0.md)を保持。MakeHumanの**graphical skin**で、photoscan、照明を除いたalbedo、人間の実写とは称さない。原mhmatは若い男性のfolder/tagsを持つ一方、内部nameは `old_caucasian_male_detailed`。この不一致も既存のままで、人物の年齢や性別を決める証拠には使わない。

直接確認では、頭島の横・後ろ側に濃い点状の短髪模様、口元・顎に髭剃り跡様の暗部、唇の赤み、鼻孔・耳・目窪の暗部がある。眉周りの暗部もあり、現在の独立した眉meshと重なる可能性がある。濃い眉毛がすべて画像に描き込まれているとまでは断定しない。原画像の胸/体毛/眼内部/口内部も別島に含まれるが、全体を身体へ新適用する案は対象外である。

## 現行頭と原UV

[再現用UV検査](evidence/skin-coverage-v36/audit-uv.py)は原OBJのvertex/UV組を直接照合し、実配列の三角形面積を計測する。[結果](evidence/skin-coverage-v36/uv.json)と[UV解析図](evidence/skin-coverage-v36/uv-layout.svg)を保存した。解析図はUV線だけの図で、肌の加工画像やゲーム画像ではない。vは原OBJで上向き、図では画像行に合わせ上下を反転している。

| 対象 | render頂点 | 三角形（首cap含む） | 原UV corner | 原OBJからのUV差 | 原surfaceのatlas面積 |
|---|---:|---:|---:|---:|---:|
| base（12人型role） | 1,012 | 1,546 | 965 | 0 | 20.8591453% |
| npc / ミラ専用形状 | 1,062 | 1,646 | 1,015 | 0 | 20.8591453% |

両方のsource vertex / UV組の不整合は0。共通916 cornersのUVは完全一致する。ミラはhead-oval ×1.1 / nose-horizontal ×0.7という登録済み原morphを持ち、共通頂点の位置差最大8.235 mm。顔の差は存在するが、画像内の髭や短髪を消す処理ではない。12役がbase、ミラ1役が専用、wolfは対象外。keeper/knight/archerの別名と4テーマも現行の解決規則で検査した。

画像の頭/耳島はatlasの17.8192766%、口内部1.5622805%、左右眼内部各約0.427323%、首0.622941%。いずれも表面UV三角形の和であり、画面で見えている面積やGPUの部分割当ではない。全体atlasの約79.14%を顔表面が使わなくても、現在の1枚をdecoded textureとして保持する費用は変わらない。

元sourceの首46頂点/47 UV、両頭の首位置・UV・平均linear色は一致する。口内部/左右眼内部/首の共通source cornersも位置差0。独立した眼白・虹彩・動くまぶた・首・眉・髪は原どおり別surfaceと骨を使う。本単位では原morph、eye/lid/neckの移動や再造形を行っていない。

## 役柄ごとの判断

名前、仕事、髪の長さから性別・年齢を推定しない。描写にない男性固有の表面特徴を足す根拠として「性別が未記載」を使わない。現在の原文・配色・形状にある根拠で判断した。

| role | 現行の具体的特徴 | 今回の判断 |
|---|---|---|
| smith / レン | 唯一の明示的な顎髭mesh、既存の原画像適用 | 現行維持。新規拡大なし |
| npc / ミラ | 灰色髪、独自の顔morph、顎髭なし | 無変更共有は見送る。口元・短髪の特徴を新しく足さない |
| sena / セナ | 後頭部の追加髪形状、顎髭なし | 見送る。髪型から性別を推定しない |
| healer / イオ | 茶髪、顎髭なし | 見送る |
| patient / 凪 | 細い体型、淡い肌の既存配色 | 見送る。顔の血色/陰も一律変更しない |
| porter / トウ | broad体型、暗めの既存肌色 | 見送る。体型・仕事は髭の根拠にならない |
| traveler / アサ | 灰褐色髪、顎髭なし | 見送る |
| courier / ナル、scout / ユノ | 荷物またはhood、顎髭なし | 見送る |
| player、soldier、ranger | 鎧/hood/helmet、顎髭なし | 見送る。衣装で覆われることだけを適合判定にしない |
| boss | 灰色の肌と髪、別の雰囲気 | 見送る。生身の色/短髪を無条件に付けない |
| wolf | 非人型 | 対象外 |

これは他役への永久的な禁止ではなく、**この無編集の1枚を共有しても意図した人物表面になる根拠が不足**という判断。ミラなどの髭なし候補には、島配置を保持した明示的な別の素材制作・比較が必要である。新しいmorphやUVを作ることだけではこの不適合を解消しない。

## 材質と共有の実測

[native検査](evidence/skin-coverage-v36/audit-materials.mjs)は21 variants（14 families、3 aliases、4 themes）を実際のThreeオブジェクトで作った。13種類の専用顔materialはbody等とは別で、existing texture installにより変わるのはsmithの顔1参照だけ。他253材質参照のmap/色、全てのroughness/bump参照は不変。追加smith 12体はmaterial/geometry/同じdecoded textureを共有し、骨格は独立した。

loadAsync呼出し1、Texture.clone呼出し0、12体生成前後のtexture.versionは1→1、解除後のtexture.disposeは1。これはnative cache/API実行と明示したdecode doubleの結果であり、実ブラウザーのfetch/decoder/GPU upload回数の観測ではない。既存[skin専用4 tests](evidence/skin-coverage-v36/existing-focused-tests.txt)も成功し、実async SceneViewの待機・失敗retry・quality切替時共有を確認した（renderer/imageなどは既存fixtureのdouble）。

現在のnative MeshStandardMaterialはmetalness0、roughness1 ×既存roughnessMap、bumpScale0.00018、envMap nullでscene環境を継承する。原mhmatのlitsphere/SSS/ambient/emissive/shininessを重ねて取り込まない。原画像の焼込み陰に実照明が重なる可能性は残る。

現smithの首平均色はlinear RGB `[0.756385085539447, 0.3947322188942361, 0.23747912103991894]` を使い、既存の首色をこの値で割ったtintにより平均を合わせる。原画像へ既存肌色をそのまま二重乗算しない。ただし局所色差はsmith最大9.679/255残る。**未採用の仮想計算**でミラへ同じ方式を使っても最大11.289/255、全role範囲8.946〜13.170/255が残る。平均一致は首/まぶたの見え方の合格ではない。灰色化や粗さの再調整で髭の暗部を隠す変更は行わなかった。

## 費用・検査境界

新fetch・新decoded texture・新atlas・source/initial JS増分は0（src全132ファイルが基点と完全一致）。1枚2048²の既存RGBA8費用はbase16,777,216 B、mip込み推定22,369,620 Bのまま。これは約21.333 MiBの理論payloadで、実GPU常駐量ではない。役数を増やすだけなら同一textureを参照できることと、作品に適した表面になることは別である。

実production actorの初期表示とplayer三武器切替を含む23条件は最大7,998 triangles / 14 meshesで、既存上限内。結果内のraw template数は隠れた全武器を含むため、実表示予算と混同しない。配信物を再生成しておらず、初期byteの新build値を主張しない。通常Web一次配信と165,000 B guardを変えていない。

媒体制作時間0。UV/source検査とnative材質検査は各JSONの実秒数、既存4testsは2.406355秒。初回native oracleの相対repo既定値が1階層多くmodule解決に失敗し、資料用scriptだけを修正して成功した。runtimeの失敗ではない。資料/読取/手戻りの排他的な時間は未計時、他担当の統合時間を混ぜない。

正式WebGL、実機、顔/首/まぶたのlit画面、表情、知覚的な役柄適合、PS4品質、期限内完成の裏付けは未取得。今回の不採用判断で、ミラ等の表面品質が改善済みとは扱わない。有限調査を保存し、次の実素材候補へ引き継ぐ。
