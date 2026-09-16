# v37 肌候補編集の実行記録 — 画像未返却

**候補画像は得られず、不採用のまま閉じる。** 許可された正規 `image_gen.imagegen` の編集を1回実行したが、サービスはHTTP400 / `moderation_blocked`を返した。出力段階の分類は`sexual`。内部の詳細な判定理由は提供されておらず、推測しない。これはUV・色・造形を比較して不合格にした結果ではない。

基点 `337a7e2717d9f130bc6468a45003db2ddddd65db`、作業場所 `Q-skin-candidate-v37`。この単位では元の132 srcファイル全てのGit blobが基点と一致し、runtime、配信参照、CC0原画像、原UV、キャラクターを変更していない。候補を空画像や既存画像で代用して成功扱いにしていない。

## 実行した1回

適用skillは `imagegen`（`skill://flora-skills/root/.codex/skills/.system/imagegen/SKILL.md`）。built-in editを使用し、CLI/API fallbackは使わなかった。実引数は原PNGの`referenced_image_paths`だけで、`num_last_images_to_include`を併用していない。原PNGを正式`view_image`で表示し、既存素材であることを確認してから実行した。

[prompt.txt](evidence/skin-candidate-v37/prompt.txt)が実送信した全文。既存2048×2048 atlasの頭/耳島だけの髭・口元の剃り跡・濃い短髪模様を除き、中立的な成人の肌候補にする指定だった。全島の位置/寸法/左右、眼・唇・鼻孔・耳のlandmark、首境界を保持し、化粧・美顔・新しい髪型・照明・UV再配置を加えないよう指示した。身体島・背景・原ラベルを変更しない非性的な技術atlas編集として依頼した。

| 実応答 | 値 |
|---|---|
| 呼出し回数 | 1 |
| 開始記録 | 2026-09-16T06:44:55.591Z |
| toolが報告した実行時間 | 39.9秒 |
| HTTP | 400 Bad Request |
| error code / type | moderation_blocked / image_generation_user_error |
| moderation stage / category | output / sexual |
| request ID | 1b93ceee-fb03-4102-9b56-d07f29da5a73 |
| 返却画像 | なし |
| 再編集 / fallback / 追加生成 | 全て0 |

実エラー文と引数の記録は [generation.json](evidence/skin-candidate-v37/generation.json)。1回の範囲で終了し、別prompt・crop・CLI・別画像サービスによる回避は行っていない。外部への問い合わせ・メッセージ送信や購入も行っていない。

## 原画像と未検証範囲

元のMakeHuman **CC0 graphical skin**とその原出所は変更していない。photoscan、実写、照明除去済みalbedoとは称さない。OpenAI編集出力が得られた場合には別の出所として記録する予定だったが、今回は出力がないため生成物のlicenseやファイルhashは存在しない。

| 保持した画像 | 寸法 | byte | SHA256 |
|---|---|---:|---|
| 原PNG | 2048×2048 RGB | 3,693,828 | 862a26e335e958b70534cb5f0d7c47ef30ab148a56c42b3e9da969cf76f12963 |
| 既存runtime WebP | 2048×2048 RGB | 541,954 | 7628814980308b9525b27f09f98a099a0144d1a29e67bc6377702b4605678c04 |

[保持検査](evidence/skin-candidate-v37/source-preservation.json)は画像の読み取り、寸法・hashと全srcのGit blob一致を確認したもの。画像編集・切貼り・リサイズは行っていない。候補が返されていないため、候補のactual view、寸法、color space、眼/口/耳のlandmark、変形、色、元UVとの同条件比較は**実施不能**としてnull/未検証を記録した。

新素材のruntime採用0、素材fetch増0、初期JS増0、decoded texture増0（全src不変）。この資料だけの変更でbuildやゲーム試験を再実行していない。元の肌適合問題、ミラ等の平坦な表面、WebGL下の首/眼/唇の継ぎ目、実機/PS4品質は未解決である。

生成待ち39.9秒はtool実応答の時間。成功した素材制作時間・統合時間・再編集時間として報告しない。資料作成/読取の排他的な時間は独立計時していない。正規の別素材調達候補の選定は統合担当の後続単位へ戻す。
