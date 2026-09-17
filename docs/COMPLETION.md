## 2026-09-17 ユーザー指定により制作停止

最新「現在できたものを反映して停止して」に従い、確定成果と書込済み途中成果の保全・安全な反映だけを行って終了する。全身モデル/画面品質は未完成。数値候補の未解決と停止時partialは[現在の状態](PROJECT_STATE.md)へ記録し、独立受理/本編採用/公開と区別する。以前の継続指定から自律再開しない。

---

## 2026-09-16 v63: 未完成のまま実制作継続

杖18型19配置、下顔面7配置、P01床支持の有限候補を保存・検査した。完成人物、全画面PS4、9/20達成根拠、実WebGL/端末/聴感/指定比較はいずれも未達。支持CPU代案の棄却、画像角度/寸法の不整合、手・眼鼻口首・衣服隣辺・質感・人物全体費用を残す。Site24/source2beeは既存配信のまま。部分PR58保存やCIをmain/Site反映・最終完成と称さず、最新「できるまで続けて」で[現在工程](PROJECT_STATE.md)を継続中。

## 2026-09-16: 微小部品の有限試作を保存（v61–v62、人物完成ではない）

[実物・採否・時間・再開地点](MIRA_MICRO_INTEGRATION_V62.md)。S13/S14はPR56 source3fcd0aa8…/required CI35096941845成功で保存。次の衣服3小曲面・灯具枠2型4配置を実作成して部分組立と既存骨格への有限試用を行った。死亡時に床へ入る外套仮weight、原絵と端形の違い、灯具下受け未作成/上受けと光体包絡の微小違反を不採用または未解決として保持。画像TOPも不成立で全画像合格とはしない。全人物の造形/接合/動作/材質・画面完成ではない。

現在のプレイ版は同じowner-only Site24/source2bee64cff6482cb7770ba69e07673eefc8ad54ef、GitHub main547676fd…とは別。新研究候補のruntime採用/追加配信は0。以下の旧Site23や配信前記録は歴史的状態で、最新版配信の正本はSITE_DELIVERY_V24.md。正式previewは現在起動可能だがbrowserGLがDisabled、実WebGL/実機/指定10作品の比較と全画面PS4は未合格、9月20の到達根拠も不足のまま。

---

## 2026-09-16: 上衣の物理尺度修復を新規結合検証（v57）

[結合・復旧・採否と次地点](CLOTH_INTEGRATION_V57.md)。ミラ上衣のcm単位の規則格子を約2mmの設計尺度へ修復し、身体形状/動作/他13役/全27媒体を保持。実会話3viewportの同じ投影/接触条件で粗い周期の縮小を確認したが、実WebGLや自然な衣服の合格ではない。+1draw、共有512²データ1MiB/推定full-mip1,398,100 B、Node初回48.18msの費用を明記。生成布v58は画像を正式取得・独立点検したがruntime不採用、身体v54も棄却を保持する。

旧外套テストの2件失敗を保存し、旧fixtureを変えず上衣変更だけ比較条件へ合成するtest-only修復を独立確認。外套UVと髪色の故意差を引続き検出。再結合27工程/343tests全成功140.434495秒、任意単体2tests成功。通常34files14,039,068 B/初期165,611 B/3chunks、27媒体12,883,257 B不変、任意HTML17,311,728 B。単体必須解除は制作/配信判定の制約解除で、元から複数ファイルだった通常SiteのCPU改善としない。

復旧後の音PR52/死亡開始PR53/空中死亡PR54は全tree一致・requiredCI成功。今回のv57完成sourceは同名featureの早期研究checkpoint0a58から通常保存/PR/CIへ進める地点。早期checkpointは布runtimeの完成保存ではない。fresh PR39open未merge・実main547676fdce8d8e97abed9f065aad0b6e24af2fd6・同一owner限定Site23は不変、03:14以降merge mutation0。実main進行後だけ順番にretarget/CI/通常mergeと同一Site反映。公式preview監督不在、実画面/実聴/実機/指定比較未確認で、9/20までのPS4全画面達成根拠は不足する。

次の有限地点は死亡blend後半の大きいstepの同条件原因診断。既存Ultra actor担当が読取調査中、実装未着手。安全な修復範囲を確定できた時だけentry/空中支持/終端を保持して実装する。停止した担当やdisabled automationを背景稼働と称さず、未採用試作・テスト件数を目標達成に数えない。人間の準備待ちは設けない。

---

## 2026-09-16: 空中死亡の落下と休止を結合検証（v55）

[結合記録](AIRBORNE_INTEGRATION_V55.md)。音PR52 `7fbe77e…` /CI35077524542と死亡開始PR53 `f8ef1de5a9a3913a84c36972b0d9f74e1de464c8` /CI35079065319はremote保存・必須CI成功。後者の全tree一致確認後、空中死亡の縦運動だけを既存60Hz経路へ結合した。deadのy/vertical/grounded以外の世界/敵/進行/横移動は凍結、保存/復活を維持。blur/pagehide停止漏れを独立指摘から修復、復帰時death panelを保持する。

新27必須工程・338tests全成功134.005482秒、任意単体版2tests成功。通常34files14,037,344 B、初期165,611 B/3chunks（+196 B、166,000 Bguard維持）、27媒体12,883,257 B不変。固定stageとhashは上記記録。独立実Scene更新prefix＋actor18条件の可視頂点は地面侵入0/min+0.654mm、終端+6mm。実画面/自然さ/実機合格とは呼ばない。

Mira身体v54はruntime不採用。実会話の見える胴差≤0.02069px/袖≤1.313pxと交差変化を比較し、候補全source patchと独立資料だけ保存した。次は実会話で露出する顔/革等の素材をsource画像・UV・画面占有と端末予算で比較し、見えない改変を品質成果に数えない。

実main547676fdce8d8e97abed9f065aad0b6e24af2fd6/PR39open未merge/owner限定Site23不変。独立正規GET7回でPRclean/CI成功・rule待ち根拠無し、旧同期merge worker終了/lock解放は確認不能。新merge/async mutationは行わず、正常main順序を維持。公式preview監督不在と実画面・実聴・実機・10作品比較不足により9/20の全画面PS4達成根拠は未成立。人間準備待ちにせず既存Ultraの実制作を継続する。

---

## 2026-09-16: 死亡開始の姿勢連続性を結合検証（v53）

[結合記録](DEATH_ENTRY_INTEGRATION_V53.md)。原音保持のPR52はremote `7fbe77e63b2172a8d9cde4c8953858d02fdefe0d` / tree `901eaf7710af58ba9a331a3db85a4470da1d4d2f`、required CI35077524542成功。死亡開始は作者e58994aを同基点へ結合し、0.24秒の姿勢連続化・hidden槍の再表示方向修復を採用。新規27条件で継続可視頂点のentry移動を全条件縮小、1秒後の既存姿勢とGame/保存不変。後続step増加・hidden→shown union増加・空中root固定は残課題であり、全frame改善/自然さ合格とはしない。

v53の27必須工程・333tests全成功143.493227秒、任意単体版2testsも成功。固定stageは34files14,037,148 B、初期165,415 B/3chunks不変、deferred JS+1,714 B、27媒体12,883,257 B完全保持。任意HTML17,309,822 B。主方式は元から複数ファイルの通常URLであり、単体HTML必須gate解除を旧通常版のCPU削減と混同しない。

main547676fdce8d8e97abed9f065aad0b6e24af2fd6/PR39未merge/owner限定Site23は不変。v53をPR52の後ろへ通常stack保存し、実main進行後のみ順序通りretarget/CI/通常merge。期限9/20の全画面PS4到達根拠は引き続き不足。公式preview監督mailbox不在、実画面・実聴・実機・指定作品との比較未実施を保持する。

方法見直しの同条件結果: 原人体からのMira胴/袖候補v54は、実会話3viewport・native面遮蔽を考慮すると胴の可視差最大0.02069px、袖1.313px。交差pair入替/API悪化もあり、runtime不採用とし候補/比較だけ保全する。次のv55は跳躍死亡のroot落下を実main固定tickへ結び、blur/pagehide中の停止を独立再検証中。既存Ultra担当と単独writerを保持し、記録だけで制作の完了とはしない。

---

## 2026-09-16: 音の原録音rate・破棄時の所有権を再構成し結合検証

[音の結合記録](RECOVERY_AUDIO_INTEGRATION_V52.md)。PR51を正式復元後、原13録音からharmony/pulseを44.1kHz stereoへ再生成し、元motif/foley/24cuesを保持。rate別decoder、同byte fallback、音楽3固定bufferとFX FIFO分離、破棄中再起動の拒否を新規検証した。旧source2hash/新2MP3hashとの一致は回収内容の照合であり、旧PASSの再利用ではない。独立12条件と原媒体検査、結合27工程・324tests全成功115.252264秒。通常34files14,035,434 B、初期165,415 B/3chunks、全27媒体一致。任意HTMLも17,308,120 Bで全媒体と2動作検証成功、16MiBが通常プレイの美術上限でないことを実成果で確認した。

同環境・旧媒体のruntime変更のみでは初期+427 B/Python gzip9+114 B、最終新媒体URL/fingerprint込みでは同baseに対しgzip+111 B。条件を混同しない。初期回帰guardを166,000 B、録音payloadを3,000,000 Bへ実測に基づき明示改定、3chunks/scene遅延/source-byte/provenance検証を維持。原録音rateの保持と所有権修復という実益で判断し、音の聴感や端末合格と呼ばない。通常score Float32は38,102,400 B、96kHz fallbackでは92,160,000 B。24MiB FX FIFOは全audio RAM上限ではない。

最初のruntimeはremote e263ebeb52dc73e8b80ee8839e02a6c1309c3d41/tree170fe179fbeed07f3806af61f80f253a15fdc4f3へ15blob/native差分0で先行保全。完成unitのPR保存を続ける。実main547676fdce8d8e97abed9f065aad0b6e24af2fd6/PR39未merge/Site23 owner-onlyの状態は不変、追加merge mutationなし。公式previewは環境再生成後も監督mailbox不在。実画面/実聴/実機/指定比較のPS4到達と9月20期限内完成の根拠不足を維持し、人間の準備待ちにしない。

次は死亡開始の独立単位。新27条件で回復中hidden槍の再表示侵入を検出し、表示状態を扱う修復後に解消確認した。継続可視entry減少と後続step増加・空中でGame高さ固定を区分し、未検証全体の自然さを合格にしない。身体全体の旧v42候補は未回収として、Mira上衣だけを原人体から登録する独立有限比較を既存Ultra担当が開始した。音・死亡・身体の所有範囲を分け、身体待ちで確定音の保全を止めない。

---

## 2026-09-16 現在地: player死亡支持の結合検証と実再生経路の改善

[結合記録](PLAYER_SUPPORT_INTEGRATION_V37.md)。既存player関節を調整し、頭・胴・踵を地面へ近づける支持をv35地域素材読込へ結合。27工程317通常tests＋任意2成功122.213450秒、通常34files12,593,412 B、初期164,988 B/3chunks、全27媒体不変。有限な接触条件では新しい地面侵入0、cloth交差42→38だが位置入替5面と残存交差・死亡開始pop・first-use CPUばらつきは残る。形状/材質/他役/非死亡/ゲーム保存は維持、PS4の動作自然さ合格ではない。

v34 PR49 requiredCI35066041371、v35 PR50 requiredCI35067515715はいずれも成功。v35 remote80affeb1a54756bd382f9b85d71bd09404480072/treeaccb02e9e0190bc65743e30aecad835979ae1e41はnative全差分0。PR39open/unmerged、実main547676fdce8d8e97abed9f065aad0b6e24af2fd6/Site23のまま、03:14後merge mutationなし。通常先行main確認→retarget/requiredCI/merge→同一owner限定Siteだけを進める。

公式個別3D素材表示の調査も保存したがBlenderは未導入、official directory402の発生元不明・迂回0・新画像0。現在の期限9月20/全画面目標は実画面/実聴/実機/指定比較と配信の根拠不足。次は実Gameの死亡入り連続性、録音44.1kHzを保持するdecoderとactive/cache所有権、頭以外のCC0source/既存shapeの有限比較。単体HTML制約解除を旧通常SiteのCPU改善と呼ばず、媒体priorityの効果も実HTTP未測定と区別する。人間準備待ちにしない。Qはlatestprompt保持/COUNT無しhourly/disabled/active20、他task変更0。既存Ultra/単独writerで具体制作継続。

---

## 2026-09-16 現在地: Web主軸へ地域素材の優先読込を結合

[結合記録](WEB_STREAM_INTEGRATION_V35.md)。通常URLは以前から複数ファイルで単体復元CPUなし。v34は必須単体HTMLという制作/保存制約の解除、v35は実際の開始待機を近傍2枚34,119 Bへ分け、残34,380 Bを最初のactive frameから先読みし遠方失敗を隔離する変更。全27媒体/11,441,662 Bは不変、総GPU/HTTP減ではない。27工程/311tests全成功123.666685秒、初期JS164,988 B/3chunks、通常34files12,590,981 B、任意HTML15,503,291 B。sourceFingerprint f32e8383ed083a9c10f8f73060af2c7eabc05bdf0dde23fbee2b1483991bdfbe。

v34はremote c6888d1d0891bb3111968bcadfa73f7b327966aa/PR49/tree8c1bad23a6b1db4269ff67bfdbb366bd9100b9adへ保存。実main547/PR39未merge/Site23は変わらず、03:14後のmerge mutation無し。最新公式preview statusもmailbox不在、Q automation disabled/active20。主体Ultra・単独writer・通常main→同一owner限定Site・期限9月20・PS4全画面の目標を保持し、人間の準備待ちにしない。

不採用素材/rigid death候補とblocked生成はその根拠・元sourceを保全しruntimeへ入れていない。次はplayerの関節別支持と握り武器の接地、明示公式CC0別skin原素材の適合、原音/再生sampleRate/cache実態の比較。固定テストの通過や資料保存を画面/音の合格とせず、未解消工程と期限内達成の根拠不足を明示して制作継続。

---

## 2026-09-16 現在地: 通常Web主軸と布接地を結合・検証

最新ユーザーの遊ぶ方法見直しを実装し、単体HTMLは任意、通常固定stage＋小さいreceiptを主契約へ変更。旧通常Siteも複数ファイルで単体復元CPUは元々無い。方式変更だけではruntime/転送/端末費用は変わらず、16MiB単体保存guardを美術採用条件から外した。布処理の結合分だけdeferred JS +2998 B。27工程/306tests全成功123.953893秒、原27媒体11,441,662 B保持、初期164,988 B/3chunks、通常34files12,588,790 B。実値と制約は[結合記録](WEB_CLOAK_INTEGRATION_V34.md)。

v33はremote599f522cc02abe45079e4948ff608bb0a65ac2d1/PR48/tree14ff045ebab7a91b1d6de28f0c40f83a41a73d4dへ全144blobとnative差分0で保全、required PR CI35064047853success。v32 PR47も両CI成功。実main547676fdce8d8e97abed9f065aad0b6e24af2fd6/PR39未merge/Site23は未更新。03:14後merge mutation無し、最新独立読取もworker解放を示さず追加retryはしない。通常の順次main→同一owner限定Siteのみ。

Q privatepeekは最新prompt完全一致/disabled/nextnull/active20、hourly COUNT無しを保持。新規task/他task変更無し。公式preview mailbox不在、configured:false。実画面/HTTP/GPU/実機/実聴/10作品比較は未確認、PS4達成と9月20期限内達成の根拠は不足。人間準備待ちとせず継続。次はv35近傍media作者7edc8b84b83e2e72470020a3d76c3bf91b3fbcd5の通常Web結合、actor死亡全身支持、適合する顔素材の制作。単体容量を理由に素材を却下せず、画面目的と物理尺度/decoded負荷を別々に比較する。

旧test/HTMLの未追跡再出現は同じ削除を反復せずbytes保全。最初から削除済みtree e731685の新Q-ps4-v34-verifiedでは両path不在を保ち全gate成功。原因不明を他writerや成功復旧と断定しない。全実制作は既存受理済Ultra、単独remote writer維持。

---

# Current continuation — combined dialogue and appearance v32 (2026-09-16)

## 2026-09-16 v33: 矢/媒体結合は検証済み、全画面品質は未達

25工程/299tests成功は有限なsource/contact/媒体byteの証拠。矢の70.5ms前倒し・旧保存表示+.55m・許容nock接触、単体追加CPU費用、未描画/実機/知覚評価を[結合記録](PROJECTILE_MEDIA_INTEGRATION_V33.md)へ保持。最新ユーザー提案により、単体16MiBを全美術容量の条件にする方式を改め、同一owner限定URLの複数ファイル配信を一次化する実装を継続。main/Site未反映、PS4全画面/9月20日達成の根拠不足を成功へ変更しない。


The combined v32 unit passed 23 required commands and 284 tests in 107.241350 s. Speaker-focused composition, lower readable dialogue, scroll/death/HUD lifecycle repairs, one source-validated NPC face, and physical cloak UVs are recorded in [DIALOGUE_APPEARANCE_V32.md](DIALOGUE_APPEARANCE_V32.md). The same-camera face differences remain small; sampled death cloth distortion has an explicit remaining worsening. No actual screen or PS4 perceptual acceptance is claimed.

PR46 is preserved at remote `fe8e8f83f9cceb2573868621888a315c613df635`, exact tree `462d4a5390edcf854bfca711af927aa91849ba4c`, with both required CI runs successful. PR39 remains open/unmerged and actual main `547676fdce8d8e97abed9f065aad0b6e24af2fd6`; no additional merge mutation after the 03:14Z timeout. Preserve v32 as the next stack unit, then retarget/recheck/normal merge in predecessor order only after real main progress. Site23 remains owner-only and unchanged. `69748211…` names the source main.js file SHA256, not a remote main commit.

The next owned units unify the complete physical arrow and preserve all standalone media bytes with a smaller representation. The latter trades about 0.94 MB for extra decode CPU; it is not yet adopted here. Initial JS164802 B leaves198 B; existing limits remain unchanged. Fixed September20 completion evidence is insufficient: actual whole-screen rendering, real device/touch/listening, target-game comparison and delivery remain unresolved. Q automation is still disabled under the20-task limit despite the stored continuing prompt and no-COUNT hourly schedule. Keep finite substantive production going while these separate acceptance/delivery steps remain blocked.

---

## Current continuation — v31 archery verified (2026-09-16)

[Archery integration](ARCHERY_INTEGRATION_V31.md) records22 required commands/270 tests, fixed stage and exact media evidence. Main remains547676f and owner-only Site23; no claim of delivery or PS4 attainment. Preserve normal ordered stack integration after the unresolved PR39 merge, with no additional duplicate merge mutation. Continue conversation camera/UI, the one numerically valid NPC candidate and a shared physical projectile contract. September20 completion evidence is still insufficient; the lossless same-byte storage comparison is measured but not adopted and has CPU/temporary-memory cost. Missing actual rendering/device/listening/comparison and the disabled20-limit Q automation remain explicit, not human-wait conditions.

# 完成までの作業


## 2026-09-16の現状

最新直接指定は「PS4相当の品質達成 これ達成するまで絶対止めんな」、対象は画面全てとタイトル映像・豊かな音。完成0/7・10作品比較0/10は維持。地形/川/樹木/動作/武器VFX/実天空の検証済み制作がPR39〜44へ保存され、v30の住宅/橋・title読込を結合検証済みだが、PR39の通常merge未完了によりmain/Siteはまだv23配信時点。詳細と次の有限単位は最新PROJECT_STATE先頭を使う。実画面・実機・実聴・外部比較は未確認で、部分制作/試験数を完成受入へ加算しない。

既存Q定期再開は20件上限で再有効化を拒否された。継続promptの保存だけは成功したがis_enabled=false/next_run=nullのまま。以下の「登録成功」は過去の状態であり、現在の継続実行の証明ではない。利用上限後の「続けて」により同じUltra担当が実制作を再開し、人間準備待ちや未完了service工程で全制作を止めない。


## 2026-09-15の全モデル・演出改修

現行の全actor/環境/小物分類を点検し、関節付き造形・局所接地動作・材質、原画を使うタイトル、3層楽曲と移動/戦闘/UI音を実装した。詳しくは [改修記録](PRESENTATION_OVERHAUL.md)。207件と既存必須gate成功を、完成受入0/7・作品比較0/10の合格へ加算しない。生成画はgameplay画像ではなく、実機GPU/音実聴/外部品質は未確認。身体・動作・水/炎等の簡略化と増えた幾何上限が残る。

依頼日：2026-09-13。**完成期限：2026-09-20まで、1週間以内。**

完成の品質目標はAGENTS.md記載の10作品に劣らないこと。初期の一章、ビルド成功、テストの件数をこの目標の達成に読み替えない。現時点では未達。実際に遊んだ証拠と端末での測定がないため、完成や完成保証の根拠はまだない。

## 優先する制作と確認

2026-09-15の最新指示「人間は介入しません」に従い、人間による端末・アカウント・画像・評価者の準備待ちを制作全体の開始条件にしない。AI側で正規環境と許可済みの独立工程を調査し、[自律検証工程](AUTONOMOUS_VALIDATION.md) で実装・検証を続ける。実機・実聴・外部評価は未確認として残し、自動検証で代替合格にしない。以下の日程と受入項目は完成品質の要件であり、人間への作業依頼や人間確保の承認ではない。

継続確認の直後・次の制作項目を選ぶ前、各main反映前、阻害事項の発生時に、残作業・実績のある制作速度・検証待ちを見直す。根拠付きで「期限内に達成できる」と判断した場合以外は、条件付き・保留・未評価など判断名を問わず、やり方や前提が間違っていることを疑い、代案を成果物で試す。AGENTS.mdとPRODUCTION_METHOD.mdの最新評価条件に従う。判断できない原因と不足する証拠を特定し、それを解消する調査・測定・実装比較を次の優先作業へ反映する。同種作業の所要時間・手戻り・品質の検証結果を分けて測り、期限判断を更新する。根拠不足は不可能や順調と区別し、不明の報告だけで現行方法を継続可と扱わない。現在の判断は [制作方法](PRODUCTION_METHOD.md) に残す。

| 日程 | 制作・検証する内容 | 残す証拠 |
|---|---|---|
| 9/13–14 | 操作、衝突、セーブ、カメラの不具合修正。武器と敵の判断の違いを実装 | 再現手順、修正差分、該当テスト、実プレイでの再確認 |
| 9/14–16 | 複数NPC、分岐クエスト、探索で発見する経路と報酬。人物・環境・アニメーション・音の制作 | 初見のプレイヤーが迷う点と理解できる点。制作した素材の出所 |
| 9/16–18 | モバイルでの操作調整、描画負荷とメモリの改善、長時間安定性 | 実機名、OS・ブラウザー、画面向き、30分の探索と戦闘の計測 |
| 9/18–20 | 全経路の実プレイ、比較評価で不足する領域の改修、配布用ビルド | 比較条件、プレイヤーの評価、未解決不具合、完成判定の根拠 |

日付は作業順序の目安であり、各項目の完了や人員・端末を確保したという意味ではない。実際の不具合と評価結果に応じて優先順を更新する。

## 完成判定に必要な確認

| 領域 | 確認する具体的な体験 | 現状 |
|---|---|---|
| 操作と戦闘 | 複数指で移動・視点・防御を両立でき、被弾理由と反撃機会が分かる | 既存戦闘と番兵4体、production pointer adapter、vault 8経路をNode固定再生で検証。DOM hit test・実画面・物理複数指・実機は未確認 |
| 探索と自由 | 視界・地形・音から目的地を見つけ、複数の経路と手段を選べる | 一地域の初期実装にvault 4か所を追加。net可遊面積と初見の発見性は未測定 |
| 世界の反応と物語 | 行動と選択が住民、環境、報酬、その後の会話へ反映される | 小規模。制作継続 |
| 美術・動き・音 | 観察と操作に耐える人物・風景・演技・効果音・音楽を一貫して提示 | 関節人物・写真地表/樹木・タイトル動画・実天空・原形状の頭部・実録楽器を段階制作。旧GLBはsourceのみ、現runtimeに不使用。画面/実聴未確認、身体表面・建築・演技など簡略化が残る |
| 安定性 | 中断復帰、回転、長時間プレイ、保存の持ち運びで進行を失わない | 番兵撃破即時save、旧座標移行、fresh-runtime vault reloadと30分相当logicを確認。実機計測なし |
| 比較の根拠 | 指定の10作品について比較する場面と評価軸を明示し、実プレイの評価を残す | 未実施。自己採点で代用しない |
| 配布 | 遊べるビルドがソースと一致し、対象端末から起動できる | 所有者限定Web版を配信。実機確認・ネイティブ版は未完 |

## 現在の阻害事項

- 検証用ブラウザーはローカルURLとfile URLを拒否。監督付きプレビューのサービスも現環境で不在。制限を迂回せず、未検証のまま扱う。
- iPhone/Android実機と比較プレイヤーを使った検証結果はまだない。
- 2026-09-16の既存Q再有効化は20件上限で拒否、disabledのまま。最新継続promptだけ保存した。他taskの停止や新しいautomationで制限を回避しない。

## 0.6.0で進めた範囲

集落に生活行動を持つ住民2人と、碑文・三つの鐘・炉への反映・回避の消費を減らす報酬を追加。配達先と時間帯で会話が変わる。30分相当の保存・経路シミュレーションに新しい依頼の完了を含めた。屋内生活、住民同士の関係、複数地域、実機での操作感と美術・音の品質は未達であり、この追加を世界の密度や大作相当の完成と判断しない。

## 0.7.0で進めた範囲

薬草を集落へ届けた場合と旅人へ分けた場合で、分岐後に活動する人物、日課、会話、現地の補給手段が変わるようにした。集落側は回復した住民と荷運び、旅人側は橋を巡回する斥候と野営者が現れる。両経路を徒歩で確認する自動進行を追加した。これは選択への反応を一段具体化したもので、群衆規模、屋内、会話演技、生活シミュレーション、実機での見え方は依然未達。

## 0.8.0で進めた範囲

タイトル表示に不要なThree.jsと3Dシーンをゲーム開始時まで遅延し、初期JSを676.37 kBから91.30 kBへ分割した。開始操作中は重複操作を止め、失敗時はWebGLエラーを表示する。タイトルへ戻った後の3D描画も休止する。配信版のチャンク参照と、1ファイルの単体版に未解決の参照がないことをCIで検査する。これは転送量の静的な比較であり、スマートフォンの起動時間、ゲーム中のメモリ、電池、FPSを改善したという実測ではない。

## 0.9.0で変えた制作方法

人物を個別の簡易形状と四肢の計算で増やす方法を見直し、出所とCC0ライセンスを確認したモデル3種類・18動作を再利用する工程へ切り替えた。プレイヤー、ミラ、セナ、近接兵を共通の骨格制御に接続し、剣・槍・大剣、回避、回復をゲーム内の動作時間に合わせる。保存された戦闘状態から姿勢を復元できることを自動検証した。必要な動作だけを残す加工、ハッシュによる原本照合、配信用モデルと単体版への埋込みも再現可能にした。

人物素材の調達と再利用は進んだが、実画面での造形・接地・武器の向き・命中時の見え方や、実機負荷は未確認。転送するモデルが約1.79 MB増え、単体版は3139 KiBとなった。この変更だけで品質や制作速度全体の達成を判断しない。複数地域・物語・演技・音響・実機検証について実績のある見積もりが揃っておらず、期限内の完成工程はまだ根拠付きで成立していない。次の方法比較と判断条件を [制作方法](PRODUCTION_METHOD.md) に記録した。

## 0.10.0で進めた範囲

西に白塩の段丘を拡張し、二つの迂回路、見張り場の遭遇、取っ手の回収、巻上げ機の修理、石門の開通、帰還報告までを実装した。地域データを地図・進行・障害物・表示で共有し、開通状態と西部での途中戦闘も保存する。自動操作では両経路と近道が通り、開通後の30分相当の巡回を完了した。

新しい地域導線と短い依頼が増えた段階で、複数章の物語を完成したわけではない。会話演技、住民が開通した道を実際に使う反応、地域の密度、実画面での地形の見え方、実機負荷は未達・未確認。完成期限は維持するが、品質目標までの全工程について根拠付きの見通しはまだ立っていない。

## 0.11.0で進めた範囲

石門の開通を背景の変化だけで終わらせず、運び手ナルが西の見張り場・貯水槽・谷側を実際の衝突と経路探索で往復する生活行動へつないだ。開通前は現れず、開通報告の前後、昼夜、二つの章末選択で会話が変わる。途中位置を保存し、長時間の自動巡回で東西の通過を確認した。帰還報告後は谷側に届いた荷も表示する。

確認できたのはルール、経路、保存、Node上の表示用オブジェクトと生成物。ナルが自然に見えるか、プレイヤーが変化へ気づくか、会話の間、タッチ操作、音声・演技、スマートフォンの負荷は未確認。人物一人の反応追加を、世界全体の生活感や指定10作品相当の品質達成へ読み替えない。

作業可能な変更はmainへ順次反映し、docs/PROJECT_STATE.mdで次の作業を引き継ぐ。期限到達だけを理由に完成と記録しない。


## 0.12.0で進めた範囲

二人が歩いて集まる相談二場面、発話ごとの保存、離脱・危険時の中断、全4選択の報酬と会話・装飾変化を実装した。95件の単体試験、既存全クエスト、実際の徒歩で解放した保存から全選択の継続試験、30分の保存シミュレーション、ビルド・単体版検査は成功。これらはロジックとオブジェクト構成の検査であり、画面上の演技、タッチ、音、実機性能、外部比較の確認ではない。

今回の正式プレビュー確認ではクライアントがPATHに不在。前回のサービス不在を解消したとは扱わない。指定10作品相当の完成品質は未達で、期限2026-09-20の判断は根拠不足のまま。


## 0.13.0で進めた範囲

二場面で共有する相談案内、参加者カード、現在話者の強調、既読の読み返しを実装。99件の試験、全クエスト・全相談選択・保存継続、ビルド・単体版検査が成功した。これはUIに渡す状態と3Dオブジェクト構成・ゲーム進行の検査であり、実画面の視認性やタッチ・音・実機性能の評価ではない。正式プレビューは監督サービス不在。外部比較と指定10作品相当の完成は未達、期限判断は根拠不足。


## 0.14.0で進めた範囲

二つの相談中、参加者が巡礼者へ向き、巡礼者側から二人を見る会話カメラへ切り替え、閉じると通常視点へ戻る共有配置を実装。徒歩で獲得した二つの途中保存から配置とカメラ経路を再現し、ゲーム状態を変更しないことを検査した。100件の試験、全進行、長時間保存、ビルド・単体版検査は成功。WebGL画面、タッチ、音、実機性能、外部評価は未確認で、完成品質は未達。


## 0.15.0で進めた範囲

敵の種類、巡礼者から見た方向、攻撃までの残り時間、対応する回避・受け流し・跳躍を、実際の敵・矢の状態から一つの表示モデルで導出する。近接攻撃への無反応／回避／受け流しと、ボス衝撃波への地上待機／跳躍を、同じ初期セーブ・60 Hz入力時刻から再生する比較記録を追加した。

v0.14.0では会話画面の局所変数が3Dビューを隠し、会話カメラ切替が呼ばれない接続不具合が残っていた。v0.15.0で変数を分離し、接続検査を追加した。配置計算が正しくても実際の画面接続を保証できないという検証方法の欠点として扱う。

107件の試験、全進行、30分相当の保存再読込、比較記録の二重再生、本番ビルドと単体版検査は成功。正式プレビューは監督環境不在で、警告文字・会話カメラ・タッチ・音・実機性能・外部評価は未確認。品質目標は未達、期限判断は根拠不足。


## 0.16.0で進めた範囲

自由カメラを回しても、迫る攻撃の矢印と「画面左／画面右／画面前方」が実際のカメラ投影に合う表示へ変更した。同時に迫る2件目にも方向、残り時間、対応を表示する。画面投影が得られない状態だけカメラ方位に戻る。

同じ近接予兆と主人公向きに対し、カメラを4方向だけ変えたThree.js投影比較で、基点の主人公基準は画面方向契約1/4、候補は4/4に一致した。これは画面座標とHUD文字をつなぐコード検証であり、実画面の視認性、タッチ、音、端末性能、遊び手の理解を確認した結果ではない。


## 0.17.0で進めた範囲

同時に迫る前方の兵、画面外の側面の兵、背後のボス衝撃波を、390×844の固定投影と実際の接触順で同時再生する条件を追加した。v0.16.0は2件で打ち切って衝撃波を表示せず、各行が「回避 / 受け流し」を並記し、その受け流しに従うとHP 86。新方式は3件を判定し、画面外と詳細外件数を出して「次：回避」だけを示し、同じ固定再生でHP 120を保った。attack/parryの入力順による結果差は22 HPから0になった。

現在の無敵時間内に必ず消費される無害な接触を警告枠から外し、同時刻は実ゲームの敵・矢の処理順に合わせた。画面X/Y境界外とdepth外を明示し、防御の有効時間より早い間は待機を示す。これらはロジック、DOM属性、Three.js clip投影、入力調停の証拠。正式WebGLピクセル、ブラウザーの実イベント、タッチ機器、音、iOS/Android性能、外部評価は未確認で、全体品質の未達は解消していない。


## 0.18.0で進めた範囲

v0.17.0で全候補を保持したまま増えた48矢の予測費用に対し、矢ごとに全60 Hz区間で地形・障害物・人物を繰り返す方式を変更した。既存の人物交差時刻を再利用し、障害物は軌道ごとに一度だけsweep、障害物bodyはbatch内で共有する。地形は橋端の一致を失わない60 Hz区間のまま、隣接区間の同一端点を再利用し、人物または障害物への接触候補を含み得る1区間だけ実ゲームの `projectileContact` へ戻して接触順を確定する。

同一host・同一プロセスで、30 enemy slotを全dead、`obstacles=[]`、現在位置へ交差する48矢、390×844に固定し、旧成果物そのものではなく同じ現行HUDへforecasterだけv0.17.0逐次相当／batchに差し替えた。接線回帰修正後に保存した9標本（各250回、10 block交互）の最初の2 runは中央値1.1008→0.8530 ms/回（22.5%減、1.291倍）と1.0805→0.8486 ms/回（21.5%減、1.273倍）。引継ぎ確認の別runは1.2675→0.9922 ms/回（21.7%減、約1.278倍）、最終統合担当の再実行2 runは1.1137→0.8500 ms/回（23.7%減、1.310倍）と1.1176→0.8800 ms/回（21.3%減、1.270倍）で、各runとも候補勝ち9/9。host変動を含む局所観測であり、固定改善率を保証しない。

実測一致はHUD文字、hazard ID・impact frame・画面方向、decision、serialized game state。production経路は新しい人物body共有ではなく既存人物交差48件を再利用し、1回あたり `projectileContact` 呼出し761→48。ただし候補も地形713区間・標高sample 1,474を手動処理する。障害物body共有は別の壁正しさfixtureで確認しただけで計時条件ではない。別時刻に記録したv0.17.0の1.0996 msとはhost状態が異なるため、同時比較以外の改善率は主張しない。

48矢の無遮蔽・遮蔽結果、120本の橋端・地面すれすれ軌道、三脅威のHP 120と入力順序差0を自動検証した。これはhost上のロジック費用と同一出力の証拠であり、WebGLピクセル、複数指、音、iOS/AndroidのFPS・電力・発熱・30分実プレイ、外部プレイヤー比較は未確認。指定10作品相当の完成品質と期限内達成の根拠にはならない。


## 0.19.0で進めた範囲

正式previewを一度だけ正規手順で開始したが、監督サービス不在で起動できなかった。再試行や代替URLへ迂回せず、本番 `main.js` のPointer Events listenerを再利用可能なadapterへ分離した。390×844と844×390の条件で、移動・視点・回避の3 pointerを同時にadapterへ直接dispatchし、同じ三脅威への直接入力と各20/20で状態digest・HP・選択操作・入力・cameraが一致した。回避経路はHP 120、無反応対照はHP 98、attack/parryの二つの到着順はともに受け流し・HP 120・差0、終了後の残留入力0。これはNode `EventTarget` のadapter契約であり、DOM/CSS hit test、ブラウザー固有event、画面や物理三指の証拠ではない。

pointer capture失敗時に要素外で指を離すと攻撃長押し・移動・cameraが残り得る問題を独立レビューで発見し、失敗した同じhandler内でのrollback、document-levelのpointerup/cancel fallback、回帰試験を追加した。blur、hidden、pagehide、resize、BFCache復帰でも入力を解除する。3D遅延読込またはsave読込中に画面を離れたあと旅が勝手にactiveになるraceはlifecycle世代とpause伝播で止め、設定画面へpauseして音をsuspendする。死亡中にhiddenとなった後の復活操作では、ユーザー操作内で音を再開する。実聴は未確認。

端末動作JSONをschema 3へ更新し、production adapterが観測したviewport、pointer種別、channel、action、同時数、移動距離、capture失敗、解除理由を集計する。raw座標は出力しない。タイトルの固定開発版番号も `BUILD_INFO.version` へ接続した。詳細と証拠境界は [タッチ入力監査](TOUCH_INPUT_AUDIT.md) に記録する。

この変更で正式WebGL画面、物理タッチ、音の実聴、iOS/AndroidのFPS・メモリ・電力・発熱・30分実プレイ、外部評価、複数章・商用品質の美術／演技／音響、native配布は確認・完成していない。完成表の7領域はいずれもend-to-end証拠が揃わず、2026-09-20までに指定10作品と同等以上へ到達できるとは根拠付きで判断できない。


## v0.19.0以後の相談実入口gate（PR #31で履歴exactness補強）

徒歩・戦闘・依頼を経て生成した二つの相談途中saveを、本番mainのSaveStore continueとタイトルJSON importから読み、実interact、住民panel、動的相談panel、選択、保存、終了、reloadへ通す検証を追加した。二場面×二数値寸法で8起動・8 reloadが成功した。PR #30時点の4欠陥・16/16は、focus、focus解除、選択結果再描画、履歴重複という選んだ負例には成立したが、1行時点しかexactに見ず、複数行reverseが通るため「全履歴の件数・順序・話者・全文exact」を証明していなかった。

PR #31で期待する3行をproduction表示から独立して全文固定し、beat 1の1行、beat 2の2行、done直後と別runtime reloadの3行を、件数のequal、話者・全文multisetと順序付き配列のdeepEqualで検査する。focus、focus解除、rerender、done後段duplicate、reverse、2件目誤話者、2件目誤全文の7 mutationそれぞれで旧6検証が6/6通過し、新gateが二場面×二寸法の28/28を欠陥固有assertionで検出した。実ゲームsourceとbuild入力は変更しておらず、v0.19.0のゲーム成果は同じ。

これはNode内のElement/EventTarget、SceneView呼出し記録、音呼出し記録による入口接続の証拠。production SceneView / WebGL、DOM/CSS hit test、native event、物理touch、実聴、実機性能、人間の実プレイ・外部比較ではない。完成表7領域のend-to-end合格は0/7、指定10作品との取得済み比較は0/10で、期限判断はNO-GO。次は人間の準備を待たず、[制作方法](PRODUCTION_METHOD.md)で同等scope・完走経路・wall time・repair / reuse定義を固定したasset-first完成縦切り二本A/Bを実source / buildへ入れ、制作速度と再利用率を測る。

## 0.20.0で進めた範囲

熾火・潮錆・風蝕・苔影のvault四か所を追加した。各所は天井なしの環状壁と入口、brazier 4 + stele 4の配置、theme別の番兵、4構造pose、固有memory result、ambient WAV 1と共有SFX WAV 6を持つ。PNG 4、ambient WAV 4、SFX WAV 6はrepository内の決定論的generatorから作り、generator・個別byte数・SHA-256・project-original宣言をprovenanceへ固定した。通常title→keyboard移動→combat→memory→result→save→別fresh VM reloadを四vault×二数値寸法で完走した。

独立reviewで見つかった、claimed / enteredの矛盾save、番兵撃破直後の保存欠落、旧座標と新壁の衝突、ambient失敗後のretry抑止、decode待ちSFXの多重start、警告名の一般化を修正。さらに初回修正が作ったambient退出・同theme再進入のABA raceを再reviewで検出し、loop sourceを世代ごとに分けた。最終local gateは181/181、vault 8/8、既存chapter / side quest / 30分相当save / combat / touch / build / package / artifact exactnessまで成功した。

clean prospective比較はC=520,829 ms、D=217,946 ms、比0.41846で再利用速度条件0.75以下を通った。ただし最初のEmber/Tide計時は事前作業混入で無効、`T_asset` は欠測。WebGL画面、browser CSS / native event、物理touch、実聴、iOS/Android性能、人間の30分実プレイ、外部比較、native packageは未確認・未完。完成表7領域はend-to-end 0/7、指定10作品とのformal comparisonは0/10で、期限判断はNO-GOのまま。
