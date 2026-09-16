# ミラ：完成品・パーツの多角度資料から実3Dを組む（v60）

最新ユーザー原文「いや、完成品とパーツを最初にいろんな角度から生成して、確実に作っていった方がいいでしょう」。先に完成像と各部品の多方向資料を用意し、食い違いを整理して正本を固定してから、実3Dの造形・組立・既存動作との適合へ進む。造形途中の場当たりな追加生成を主工程にしない。今回の有限対象は既存ミラ1体で、上衣だけを完成像の人物全体と称しない。

基点は実配信Site24/source `2bee64cff6482cb7770ba69e07673eefc8ad54ef`、その配信記録docs-only `fc311bac0134b58e04891264c405bfd61eba22e3`。fresh GitHub mainは `547676fdce8d8e97abed9f065aad0b6e24af2fd6`、PR55 head2bee/open。親のfresh Siteは24/owner1/その他0のまま。未完了GitHub mergeは重複せず、今回の開始時に新配信をしたとは扱わない。

## 固定資料と修正

[全原画像とhash](evidence/character-reference-v60/REFERENCE_MANIFEST.json)。built-in image_genで8枚生成し、7枚を造形資料として固定。初回6枚は完成像6方向、頭/髪、上衣/袖、cape、下衣/靴、手/杖。独立実見でcape両側面が同じ方向、襟/cowlの層順と上下衣の腰接続が不明確と指摘された。反対側capeだけの修正版と、首・腰・曲げた袖の組立シートを追加して再確認した。旧capeは採用正本から外し履歴として残す。

| 対象 | 正本と3D化の判断 |
|---|---|
| 全体比率・装備の左右 | complete six views。右手の杖、左手は空。絶対寸法は旧3Dの数値と登録し、生成文字を実寸証拠にしない |
| 頭・髪 | headの正面/左右/背面/斜め/上方。首の切り口までが頭担当で、襟と留め具は衣装担当 |
| 上衣・袖 | upperとassembly。連続する袖付け、腋、曲げた肘の布量、独立した短い内襟 |
| 腰・下衣 | assemblyの一つの腰接合をbelt下へ隠す。upper単体の短い自由裾を二重露出させず、lowerの前割れ長衣へ接続 |
| cape・cowl | cape v2とassembly。反対側の開きを修正、内襟の外側へcowlが重なる。v2で変わった渦状模様は採らずcompleteの控えめなwool外観を優先 |
| cuff・手・杖 | hands/staff。指と握りの左右・接触、灯具リング/shaft接合を立体で確認 |
| 靴・belt細部 | lower FRONTの金具、靴側面・底。未提示の反対soleや灯具後ribは作者の明示した設計判断で、生成資料が証明した形としない |

[独立最終資料レビュー](evidence/character-reference-v60/independent-audit/references-v2-review.md)は「資料を固定して3Dへ進める」範囲の採用で、完成モデルやゲーム品質の合格ではない。画像だけのパーツ貼付、生成絵の完成度、三角形増加だけで3D人物を完成としない。

## 制作・照合の範囲

既存Ultra actor担当が専用worktreeで上衣・袖・襟/cowl・前開き長衣・腰帯・capeを一つの立体衣装へ作る。既存Ultra frame担当は原MakeHuman fullsourceからミラ専用の顔形状と短い立体毛束を作る。統合担当が手・靴・杖も参照と比較し、保持部分の一致根拠または未対応を残す。既存41骨・ゲーム保存・他役を維持し、変更部のweights、襟/腋/袖口/腰/足/手持ち物の接合、idle/会話と共有APIストレスを検証する。

比較用reviewページはdev-onlyで実createDetailedActor/animateDetailedActorをWebGL描画し、同じ角度/光/poseのA/Bを表示する。Aは2beeのactor/geometryをimport URLだけ変更して固定、共有helperはhashで監視する。これは簡素な背景の実3D素材検査であり、通常ゲーム画面やiPhone SE3実測ではない。必要なゲーム内会話と実機性能の受入を別に扱う。

初期実測ミラは6718tri/13draw/41bones、geometry配列319180 B、頭1646tri・髪眉244tri。衣装と頭髪の新形状はこの基点に対して実増分と画面効果を測る。旧8000tri等は勝手に下げず、上限変更が必要なら実候補と費用/正当性で統合判断し、容量だけで細部を切り捨てた以前の前提を再評価する。単体HTML必須制約は復活させない。

## 期限と証拠の区分

9/20までの全画面PS4/指定10作品相当達成の根拠は現在不足する。過去の微小な造形変更・数値テスト追加だけで知覚品質を進められる前提を疑い、今回の固定多角度資料→実立体→同角度の実描画という方式を具体的な代案として試す。生成各呼出しの時刻は [generation-timing.json](evidence/character-reference-v60/references/generation-timing.json) に保存。生成/補完の所要と作者の造形・手戻り・結合・検証を分け、比較未実施の改善率や完成保証は書かない。

この記録時点では資料の固定と比較viewer準備まで。新人物の採用・描画・性能はまだ未確認であり、Site24は2beeのまま。後続は候補を実装・同角度比較し、必要検証と正規remote保存へ進む。人間の準備を開始条件にはしない。
