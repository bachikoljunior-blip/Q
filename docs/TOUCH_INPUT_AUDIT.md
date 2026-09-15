# タッチ入力と正式体験検証の監査

対象：Q — 灰の巡礼 0.19.0。正本基点は `72bbf152199341adc69f291817c6e58211d4ef27`。

## 先に分ける証拠

今回確認したのは、本番 `src/main.js` が使うPointer Events listenerを `src/touch-controls.js` に分離し、その同じadapterへNodeの `EventTarget` から決定論的な入力を渡した結果である。正式ブラウザーの `PointerEvent` 実装、DOM/CSSのhit test、WebGLピクセル、物理的な複数指、音、iOS/AndroidのFPS・メモリ・電力・発熱、30分実プレイ、外部プレイヤー評価を確認した結果ではない。

| 証拠 | 今回の状態 |
|---|---|
| production listenerと戦闘入力の接続 | 確認。`main.js` と比較scriptが同じ `bindTouchControls` を使用 |
| 縦横viewport条件の決定論的pointer dispatch | 390×844 / 844×390、DPR 3で確認。ただし要素へ直接dispatchし、hit testなし |
| 移動・視点・回避の3 channel同時所有 | 3 pointer ID、最大同時touch 3としてadapter内で確認 |
| 三脅威の結果 | 直接入力とadapter入力が各向き20/20一致、回避選択・HP 120。無反応対照はHP 98 |
| attack/parry到着順 | 両順序とも受け流し・HP 120、serialized state一致、HP差0 |
| cancel / capture喪失 / capture失敗 / blur / hidden / pagehide / resize | adapterの残留入力を単体検査。capture失敗は同じhandler内でrollbackし、resizeは新計測へreset後にclearを記録 |
| 実端末の採取準備 | 端末動作JSON schema 3へviewport、pointer種別・channel・action・同時数・移動距離・解除理由を集計。生座標は保存しない |
| 正式画面・物理操作・音・実機性能・外部比較 | 未確認 |

## 正式経路の一度の試行

2026-09-15 UTC、managed-linuxの正式Sites手順を設定し、必要な公式依存を正常に導入した。既存Siteを編集前に読み戻し、project `appgprj_6aa6871ebd648191802ba2398d06115b`、version 19、所有者一人のみのcustomアクセス、外部閲覧者・許可グループ0を確認した。

監督付きpreviewの正規 `start` は、監督サービスのmailboxが存在しないためexit 1で開始できなかった。指示どおり再試行、サービス置換、直接サーバー、代替URL、アクセス回避を行っていない。したがって正式preview上の実操作・画面・音の証拠は0件である。

既存Siteの公式readbackに付属する1200×750の静的スクリーンショットでは、タイトル画面と致命エラー表示がないことだけを観察した。画像に見える `DEVELOPMENT BUILD · 0.15` は配信version 19 / game 0.18.0と一致しない。一方、正本 `index.html` にも別の固定値0.16が残っており、表示がbuild identityを参照しない実装不具合を確認した。0.19.0では `BUILD_INFO.version` を表示するよう修正する。スクリーンショットが現在の操作可能な画面を表すかは検証できないため、gameplayや配信byteの版判定には使わない。

## 方法比較と採否

| 案 | 今回減らせる不足 | 費用・待ち・手戻り | 採否 |
|---|---|---|---|
| 正式previewで48矢・三脅威を操作 | 画面、実ブラウザー入力、音へ最短 | 一度の正規試行で環境側サービス不在。再試行や迂回は禁止 | 利用不能。復旧時の最優先 |
| preview外のブラウザーや直接URLへ接続 | 一部のbrowser観測 | 正式経路とアクセス制約を迂回し、証拠の出所も変わる | 不採用 |
| production pointer adapterと固定入力比較 | 本番listener接続、同時所有、解除、将来の端末記録を一単位で改善 | 小さい抽出とNode fixture。DOM hit testと物理指は観測不能 | 採用 |
| frame-time項目だけを追加 | 将来の端末採取項目 | 既存 `FrameMetrics` があり、端末なしでは値を得ない | 単独案は不採用。pointer集計だけ既存reportへ接続 |
| Web Audioのfake lifecycle試験 | audio状態機械の一部 | 実聴・端末mix・同期を観測せず、今回の入力不足より狭い | 次候補へ保留 |
| native engine候補へ即時移行 | 将来のnative配布 | 現場面の移植、SDK、署名、実機、再検証が必要で、今回の正式証拠を期限内に増やす比較にならない | 今回不採用 |

採用理由は、正式環境が戻ったときに同じ本番adapterが受けた縦横・複数channel・解除理由を、開始セーブfingerprint、画面記録、音、frame-timeと一つの端末reportへ対応づけられること。同時に、画面なしの自動検査を実機確認と誤認しない境界を成果物へ固定できる。48矢の予測一致・host時間は既存 `compare:combat-priority` が担当し、今回の入力比較へ実機性能を混ぜない。

## 固定比較

`npm run compare:touch` は `release/combat-replays/touch-input-comparison.json` を再生成する。三脅威fixture、60 Hz、40 frame、同じHUD projectionを使い、直接 `CombatInputQueue` に与えた移動・視点・回避と、production adapterへpointerdown/move/upを渡した経路を比較する。縦横とも20回全てでserialized state digest、HP、stamina、選択操作、入力ベクトル、cameraが一致した。無反応対照はHP 98、adapter経路は回避を選んでHP 120。同時3 channel、入力後のactive pointer 0、stick / camera / action / attackHeldの残留0を確認した。attack→parryとparry→attackも受け流し・HP 120・同一digestで、HP spreadは0。

fixtureのpointerdown座標は現行mobile CSS規則から写した各対象box内に置くが、Nodeから対象へ直接dispatchする。よって「縦横のCSS配置で指が対象へ命中した」「物理三指で操作できた」という主張はしない。`synchronousEnqueueObserved` もlistener呼出し中にactionがqueueへ入った契約であり、端末の入力遅延時間ではない。

CIは二つのreview JSONがGit追跡対象であることを先に検査し、生成後のtracked/untracked差分が0であることを検査する。新規JSONをコミットし忘れても `git diff` が見落とす条件を残さない。

## 手戻りと所要時間

- 最初の焦点試験はカメラpitchの浮動小数点表現を厳密等値で比較して1件失敗。許容差へ直し、以後成功。
- 最初の全 `npm test` は旧source検査が引数なし `clearInput()` を要求して1件失敗。実際の `pagehide` 理由付き契約へ更新し、138/138成功。
- 独立レビューで、縦横fixtureの一部座標が現行CSS上のcamera / dodge領域外、`sameFrameDispatch` が固定0、CIの `git diff` がuntrackedを無視する三点を発見。box内座標、同期enqueue契約への改名、tracked/porcelain gateへ修正した。
- 同レビューで、capture失敗後の要素外release、3D遅延開始とsave読込のawait中のblur / hidden / pagehide、タイトルからのimportへのpause伝播、死亡中hidden後の復活音、BFCache復帰、Gamepad権限例外を反例として発見した。capture失敗はactionを一回だけdispatchして即cancel、movement / cameraは即rollbackし、document終端fallbackも残した。lifecycle世代と強制pauseをawait間で伝播し、失敗時・blur・pagehideは音をsuspend、復活clickで再開する。焦点10件と各向き20/20を再確認したが、音の実聴ではない。
- 隔離branchを正本から作成した01:19:05 UTCから、上記レビュー修正後の焦点比較完了01:38 UTCまで約19分。正式preview準備・方法調査、全検証、文書化、PR/配信の時間はこの値に含めず、制作速度の外挿に使わない。

## 最終local検証

最終sourceで `npm ci`、143試験、主章、配達両分岐と相談両択、鐘と相談両択、30分相当108,000 step / 138 reload、西部の北南両経路、9戦闘review、縦横touch比較、build、package、artifact一致を全てexit 0で確認した。単体版は3,266,506 bytes、SHA-256 `74c95e286e7c115725562a57169b5939a78f5088eb8edaf73418bb4d325c7e95`。配信stageは `.openai/hosting.json` を含む11ファイル、3 JS chunk / 813 KiB、3 model、source fingerprint `sha256:540218237d5b40d8907935df41e009808af7ba747c0cc26d1c41373905413bb7`。Three.js chunkの500 kB超警告は残る。

48矢の別の最終host runは逐次1.0626→batch 0.8258 ms/回（中央値22.3%減、1.287倍、候補勝ち9/9）で意味出力一致。直前のrunは候補勝ち8/9だったため、固定改善率でもスマートフォン性能でもない。これら全ては自動ロジック／生成物証拠であり、正式画面・物理端末・実聴・外部評価を増やしていない。

## 期限判断

2026-09-20までに指定10作品に劣らない完成品質を、残作業、実測速度、手戻り、画面・タッチ・音・実機性能・外部比較・配信待ち込みで根拠付きに「できる」とは判断できない。完成表の7領域はいずれもend-to-endの受入証拠が揃っていない。これは実装が0%という意味でも、あらゆる方法で論理的に不可能という証明でもないが、現時点の計画にGOの根拠はない。

疑う前提は、ロジック試験が実体験を代表する、数分単位のJS変更速度を複数章・商用品質の美術／演技／音へ外挿できる、Node host時間をスマートフォン性能へ読める、端末・正式preview・外部プレイヤーが待ちなしで確保できる、所有者限定Web版がnative配布と完成を代替する、並列化で観察→修正→再試験の直列経路を消せる、というもの。優先順位は追加機能数ではなく、正式previewまたは許可されたiPhone/Androidと外部評価者を確保し、同じ保存・向き・60秒場面・別途30分継続で画面、pointer集計、音、frame reportを採取し、重大不具合を修正して再測定する受入経路へ置く。これを確保できない場合は、必要な権限・端末・担当者・日程を未解決依存として停止判断へ上げる。
