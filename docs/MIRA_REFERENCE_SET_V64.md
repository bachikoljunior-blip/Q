# ミラの全小部品資料を先にそろえる（v64、進行中）

最新の順序訂正に従い、完成像、全小部品の多角度画像、配置と接合の全体対応を先にそろえる。資料がある部位だけ新しい造形を追加する方式には戻さない。PR58の最終 source `b21985680bb43a3be5a2c4d2244e6b6d24b5af69` / tree `93d76323e71049412f6b8e92af916688e6a3876d` は required CI `35108475027` success、native fetch と全 tree 差分0で保存済み。

## 今回保存した範囲

- [杖の補完資料](evidence/mira-reference-set-v64/staff-reference-set/STAFF_REFERENCE_COVERAGE.json)：2原PNGと全18ID/19配置の画像対応。枠のTOPと平らな革帯の修正で、厳密な投影一致の保証ではない。[既存19配置/24接合](evidence/mira-reference-set-v64/staff-reference-set/STAFF_ASSEMBLY_MAPPING.json)の行列・寸法は native source に由来し、生成画像の測定とは区別する。
- [独立した全人物台帳](evidence/mira-reference-set-v64/whole-assembly-ledger/REVIEW.md)：旧103型行/250配置は算数として一致するが、ズボン/外套裾や頭部遷移、全身の接合が不足。これは後発画像を含む現在の完成型数ではなく、不足を特定した固定基点。
- [原bytesの受領記録](evidence/mira-reference-set-v64/INITIAL_INTAKE.json)：固定済み27ファイル/4,162,301 B。進行中の他作者ディレクトリは、書込み途中のままコピーしていない。

新しい3Dを加えず、訂正前に受理済みだった3候補を回収した。衣服の隣接2面は `93a3d87380329c85b7b9f738c3f1216bbcff096c`、既存杖の描画batchは `3beec10da20546e18ea29bdd0f2e42cf233b4c69`、F17参照画像は `014bdddf690f6f26db32ddab843b0ba51b17ce0d`。現在のローカル結合 `a3fff6343c4134ebde88e0815d9dfa8154b95a81` に保存した。

衣服隣接面は共有辺が6姿勢で一致するが、P01死亡床侵入51.783 mmとP02の21.432 mmが残る。本編の動作へは採用しない。杖batchは同じ7512三角形/19配置を4描画meshへまとめ、geometryは290,792→323,320 Bに増える。位置のFloat32量子化、属性・材質・所有権を有限検査し、GPU速度の改善は未測定。F17画像は側面に残る突出のため全角度整合の採用ではない。これらを全人物の完成と称さない。

結合した既存候補の関連8 testsは新規実行で全成功（1778.190301 ms）。検査対象は共有辺/既知床侵入の明示、全杖の三角形・UV・材質/ownershipであり、画像・本編・実機の合格ではない。build（2.26秒）、package、test:artifactsも成功。固定stage `artifacts/site-uvdnVz`、通常34files/14,039,068 B、初期JS165,611 B/3chunks、27媒体は配信済みと同じ。

## 続ける範囲と方法の見直し

頭髪、衣服、手/靴の全型資料を既存Ultra担当が生成・実見している。生成済み、条件付き参考、角度/所有範囲の矛盾、未生成を分けて原画像・prompt・実時間とともに保存する。全型の個数だけで資料完備とはしない。全人物の首/襟、袖/手、腰/下衣、下衣/靴、右手/杖の接合は別途全体対応へ固定する。

一枚に複数型を詰めると、開いた小面が閉じた服や筒へ補完される不一致が生じた。同じ依頼を繰返す代わりに、問題型だけの一枚と、存在しない面・開放境界を明示する方式を実比較する。衣服S06の1型修正では39秒で閉筒から開放shellへ変わったという作者実見があり、後続の独立照合で範囲を確認する。形の決定、生成、修正、造形、検査の時間を分ける。

9月20日までの全画面PS4達成を肯定する根拠はまだない。全人物の資料/組立・自然な変形・材質と画面・実機/聴感・指定比較の残量と、生成の手戻りを除外しない。正式browserのGL disabledは既知の実描画阻害で、再試行や設定変更による迂回はしない。資料と独立幾何検査を本編画面の代用合格にしない。

GitHub main は最新確認 `547676fdce8d8e97abed9f065aad0b6e24af2fd6`、PR39 open/unmerged。未知mergeへの追加mutationなし。Site24/source `2bee64cff6482cb7770ba69e07673eefc8ad54ef` は所有者限定のまま、本研究からの新runtime import/配信は0。正常な増分main反映の許可は維持し、全品質達成を待つ条件にはしない。

## 追加受領と保存（進行中の別checkpoint）

PR59 `346cea5e9bf87e1211febad5926136ba3455219e` / tree `af17228009081f5af9eedfb268d5f799056611d3` を通常のstacked draftとして作成した。native取得でローカル `d080086eb2589895ef7edcd21db902203131b861` との全tree差分0、required CI35111257504 successを確認。このCIは以下の後着画像追加に対するCIではない。

[手靴の作者資料](evidence/mira-reference-set-v64/accessory-reference-set/REPORT.md)は初回8枚＋修正5枚、21型/90配置へ全rawを対応付け、固定54files＋manifestを原bytesで受領した。爪床・底/踵の分担・甲の側面などは未確定のまま独立照合している。作者生成window909.12秒と並行callの時間和1132.25秒を区別し、造形時間は0。

[頭髪の作者資料](evidence/mira-reference-set-v64/head-reference-set/README.md)は40leaf型/80配置の全raw対応を固定。新34leafを13シート＋6回の限定修正、raw19枚38,564,383 Bで示し、旧6型の3画像を含む69files＋manifestを受領した。仕様開始から保存まで2068.20秒、call request→return和1013.30秒。F17側面、髪断面/24配置、共通辺/内部開口などは未確定。画像の存在を全頭の完成としない。

[杖の独立資料レビュー](evidence/mira-reference-set-v64/staff-reference-review/REVIEW.md)では枠TOPの局所矛盾解消を確認。S05の直線帯は5角度の形状参考まで、見掛けL/W約34.6–36.3とEND W/T約3.40–3.46は要求の約43/5へ一致していない。未校正画像の比率を実寸に変換して合格にしない。matrixのmetresとboundsのmmが混じる記述を修復し、元source19行列/boundsに数値差0を独立確認した。

次は全人物の不足画像をそろえ、頭部接合ID/境界と、実骨格からの手・杖/手首・袖口の座標登録を具体化する。共有境界のauthor設計値は画像からの測量と混同しない。新3Dはまだ0。登録計画/画像/独立reviewを保存した後に全体の充足判定を行う。
