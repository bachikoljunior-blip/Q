# Mira v60 — 初期資料・実装比較の独立準備

対象は配信 source `2bee64cff6482cb7770ba69e07673eefc8ad54ef`。読取 checkout は `Q-ps4-v57` / docs HEAD `fc311bac0134b58e04891264c405bfd61eba22e3`。両者の `src` / `tests` 差分は 0。AGENTS・PROJECT_STATE 最新節・SITE_DELIVERY_V24 を確認した。既存の未所有 docs 5 files は未変更。source、remote、Site、preview、生成画像への操作は 0。旧未完了 session は無く、今回の Node session 90612 も exit 0 で終了した。

**先に同一人物の完成品と全パーツの多角度資料を揃え、矛盾を整理して固定し、その後 3D を組み立てる。** 途中生成は欠けた角度・接合情報の補完に限定する。本監査はこの工程の準備であり、生成画像の出来や人物同一性はまだ審査していない。顔ランドマークは当面、現行位置の固定を優先する。

## 現在の画面と費用

実 `Game.interact` → `SceneView` → `DialogueCamera` を既存の明示した renderer/assets fixture で実行した。keeper の現在位置・姿勢、player +Z 3 m、time 0、high、orbit yaw .05 / pitch .3 / zoom 9 は 3 条件で同一。全条件が距離 2.6 m、正面 angle 0、FOV 54°を選んだ。これは native Three の CPU 頂点・ray・投影計算であり、WebGL・画像・DOM 実測ではない。

| viewport | 顔 skin mesh 投影幅×高さ | 両眼 ray の最初の面 | 過去の上衣可視面積推定 |
|---|---:|---|---:|
| 1280×720 | 76.49×90.88 px | 両眼とも Q eye | 24,560 px² |
| 844×390 | 41.43×49.23 px | 両眼とも Q eye | 7,264 px² |
| 390×844 | 89.66×106.53 px | 両眼とも Q eye | 33,648 px² |

顔値は今回は実行した全顔頂点の bounding rectangle。髪を含む頭全体の silhouette、見えている画素面積ではない。右列は v56 の同条件 4 px 格子 first-triangle ray の既存結果を hash と原 source 情報付きで引用したもので、今回再計測していない。v57 は上衣の UV/material のみを変え、元の位置・可視 triangle を保持した。4 px 格子は小さい iris を外すこともあるため、眼が存在しないという推論はしない。

上衣全 mesh の bounding rectangle は 720p で 224.64×213.88 px、y=225.64–439.51。下部は会話 panel に隠れる。顔・カメラ用上半身 envelope の安全枠は x=.08–.92 / y=.035–.515、panel は 53dvh 以降であり、上衣全頂点が安全枠内とは主張しない。横 390 px 高では顔が約 49 px 高なので、微細接写だけ改善しても実会話での効果を証明できない。輪郭・目の方向・襟・布の重なりを通常距離でも比較する。

| 項目 | 現在の値・解釈 |
|---|---|
| Mira geometry | 6,718 triangles / 13 visible mesh draw units / attribute+index 319,180 B。GPU draw 実測ではなく、影の追加 pass は別 |
| 既存 actor guard | triangles <8,000、draw units ≤14。現状から増やすなら最大 1,281 triangles / 1 draw。品質合格を表す上限ではない |
| Mira 使用 texture | 6 unique data textures。64²×5 + 上衣 512²×1、RGBA8 full-mip payload 合計 1,507,320 B（約 1.4375 MiB）。他 actor / template と共用、actor ごとの追加量ではない |
| 上衣 512²だけ | CPU typed array 1,048,576 B、RGBA8 full mip 1,398,100 B。R bump / G roughness 共用、NoColorSpace。写真・scan・測定された実布ではない |
| 顔 | Mira は flat-tinted material、map=null。既存 MakeHuman 公式 CC0 skin 画像は smith のみ適用。写真・scan・校正 albedo と称する根拠はない |
| 既存 skin 共用費用 | アプリにある 2048² skin は RGBA8 full mip 22,369,620 B（約 21.333 MiB）。Mira の顔に適用されているという意味ではない |
| 新 texture の比較費用 | 512² / 1024² / 2048² の各 RGBA8 full mip は約 1.333 / 5.333 / 21.333 MiB。2～3 map なら概ね倍～3倍。WebP等の通信圧縮だけでは decoded GPU 費用は減らない |
| 配信記録値 | 初期 JS 165,611 B / guard <166,000 / 3 chunks。新 geometry・loader・計算は deferred Scene に維持。通常公開物 34 files /14,039,068 B、27媒体 /12,883,257 B |

配信値は読了した Site24 記録であり、本監査では build・配信を再実行していない。16 MiB 単体 HTML 制約を素材採否の根拠に戻さない。実機 texture/heap/GPU/起動時間や Sites quota の上限は未測定。

## 資料を固定する最低条件

完成品は **正面・背面・左右側面・左右前方斜めの 6 方向**を同一人物、同一服装、同一中立姿勢、同じ靴底/身長基準で対応させる。頭頂・眼列・顎・肩・肘・手首・骨盤・膝・踵の位置を各図で照合する。生成図は計測された多視点写真ではなく、左右反転、杖を持つ手、布の前後、隠れた部品や寸法が矛盾し得る。画像内の目盛や数値も 3D の寸法証拠として無検証採用しない。

| パーツ群 | 必要な面・接合の照合 |
|---|---|
| 頭・髪・眼・首 | 顔正面、左右側面、後頭、顎下～首下端。目の幅/高さ/前後、耳位置、髪際、襟に入る首の輪郭を同じ完成図へ戻して一致させる |
| 胴・袖・襟・腰 | 前/後/側に加え、肩と脇の内側。胴と左右袖の縫合、腕を少し上げた時の脇、肘の内外、腰ベルトと裾の重なりを確認 |
| 両手・杖・装飾 | 手の甲/掌/指の側面と握り断面。右手の掌と杖軸を対応させ、指の本数・握り幅・手首接続、紙飾りと金属留めの表裏を照合 |
| 外套 | 前留め、背面、側面、裏側、肩～襟の後方斜め詳細。背面斜めはこの部品図で補い、全身の追加回転図を際限なく増やさない |
| 脚・長衣下部・靴 | 前/後/側、裾内側、靴底。膝・足首可動と裾の重なり、左右靴の高さ、床接点と sole 厚を一致させる |

身長と主要関節中心は作者の寸法資料へ対応させる。本監査は寸法の新規決定を重複して行わない。不一致を部品単位で記録し、解決前に別の完成図へ無自覚に乗り換えない。完成像と現行 Mira の同一性・意味的変更は後続の明示された資料審査で扱う。

## 組立後に必要な限定比較

現行は anatomically named bone 下で部品を作り、材質単位の SkinnedMesh へまとめる方式。編集用パーツを分離しても、最終材質/mesh を無制限に分けない。各 actor の bone palette と skeleton の独立、共用 immutable geometry/material、各 clone 専有 cape geometry を守る。Mira 以外 13役へ形状・髪/紙の材質・UVが漏れないことを比較する。

1. **同一正面会話**：今回の 3 viewport / pose / location / daylight / quality を baseline と candidate で固定し、顔 bbox、眼の first-hit、上半身 envelope、player/static occlusion、panel/HUD 対応を検査する。`Q anatomical face`、`Q eye` と head-local 眼位置 ±.046,.05,.109 は現行カメラの明示契約。新部品で名前や座標を変える場合はカメラ側を含む意図した変更として扱う。
2. **形状と接合**：中立姿勢の 6 方向と上表の接合詳細を同じ camera/perspective/scale で比較。skinweights の和・index 範囲・winding・退化三角形・UV裏返りを確認。閉じた部品の内部面と、接合で隠す重なりを区別し、外から見える隙間/二重面を原寸と会話距離の両方で点検する。
3. **有限の変形確認**：idle 呼吸と blink、首の左右向き、肩/肘/手首の曲げ、歩行の支持/遊脚・方向転換、杖の握りと体との接触、外套の襟/裾を選ぶ。現行 keeper の通常会話では出ない stress pose は検証姿勢と明示する。30/60/120 Hz 連続更新、pause/reuse/load 時の姿勢・材質共有の検査を変更範囲に限って行う。NPC の遭遇/死亡経路を新たに追加しない。
4. **既存回帰の保持**：`detailed-actors`、`dialogue-camera`、`cloak-uv`、skin/head UV の既存契約を意図した Mira 変更に合わせて必要部分だけ更新する。固定 hash の単純差替や NPC skip で非対象感度を失わせない。故意の接合隙間や他役材質変更を 1～2 個だけ注入する独立負例を残す。

これらは次の制作単位での確認条件で、今回全部を実行済みという意味ではない。

## 正式な画面比較の経路と限界

親が管理する同一 Site / 公式 supervised preview と正式 browser 操作だけで、固定 source を記録して gameplay を開き、基準と候補の同条件を撮る。現在の正式到達点はタイトル DOM 確認・stop 成功まで、gameplay 0、撮影同期失敗。古い監督 mailbox 不在を現在の状態としない。この担当は browser・撮影・別 server を実行していない。

通常会話は NPC 正面を自動選択するため、側面・背面の部品比較カメラにはならない。既存通常ゲームの移動/orbit で得た絵と、将来必要なら正式アプリ内に明示して追加する検査用 pose/camera の絵は区別する。後者は別の承認された実装単位であり、この監査では作っていない。Node 投影をゲーム画面に見せたり、生成完成図を完成したゲームキャラクターの撮影と呼んだりしない。

生成設計図との整合審査、匿名画像比較、実 WebGL の材質/陰影/自然さ、実 DOM occlusion、iPhone SE3 の入力/性能、実聴、指定作品との PS4 全画面比較はいずれも未実施。資料固定と 3D 化を進める根拠は揃ったが、画質達成・9月20日期限達成の根拠にはならない。

再現は `node audit.mjs`。新規 native run は 2026-09-16T11:11:09.916Z に完了、exit 0。事前に PROJECT_STATE のパスを根と誤指定して読み込み段階で 1 回 ENOENT、docs 配下へ直してから実行した。資源生成/組込/画面計測は 0、CPU 時間の正式計測はしていない。新 baseline・script・report だけをこの独立 directory に保存し、source hash は run 前後一致した。
