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

## 2026-09-16 継続復旧の実確認と次地点

一時pending_init/旧孫不可視後、同じ受理済みUltra担当へのfollowupで4件の到達と保存済み成果を確認、新spawn/置換なし。v32固定67baa205、remotea94a081/PR47/tree6b428a13、v33結合25gates299tests成功。旧session67212はUnknown process id、保存済みexit0ログを根拠に終了結果を確認した。関係ないwriter不在をOS-wide証明せず、再出現untracked5filesは旧失敗候補とhash一致を保全し、無削除・committedsourceのみ利用した。

次はQ-web-primary-v34通常URL一次化とQ-cloak-ground-v34有限布修復。最新容量/プレイ方法見直しを保持し、単体出力の上限を全体品質の停止条件にしない。PR39未知mergeはreadback追跡のみ、03:14Z後の追加mutation無し、main547/Site23維持。既存Qはdisabled/20件上限、再開済みのふりをしない。既存preview監督mailbox不在に別browser/serverを使わない。親専用Site操作の再発火はactualmain/fixedsource/現在audienceの確認後だけ。


The combined v32 unit passed 23 required commands and 284 tests in 107.241350 s. Speaker-focused composition, lower readable dialogue, scroll/death/HUD lifecycle repairs, one source-validated NPC face, and physical cloak UVs are recorded in [DIALOGUE_APPEARANCE_V32.md](DIALOGUE_APPEARANCE_V32.md). The same-camera face differences remain small; sampled death cloth distortion has an explicit remaining worsening. No actual screen or PS4 perceptual acceptance is claimed.

PR46 is preserved at remote `fe8e8f83f9cceb2573868621888a315c613df635`, exact tree `462d4a5390edcf854bfca711af927aa91849ba4c`, with both required CI runs successful. PR39 remains open/unmerged and actual main `547676fdce8d8e97abed9f065aad0b6e24af2fd6`; no additional merge mutation after the 03:14Z timeout. Preserve v32 as the next stack unit, then retarget/recheck/normal merge in predecessor order only after real main progress. Site23 remains owner-only and unchanged. `69748211…` names the source main.js file SHA256, not a remote main commit.

The next owned units unify the complete physical arrow and preserve all standalone media bytes with a smaller representation. The latter trades about 0.94 MB for extra decode CPU; it is not yet adopted here. Initial JS164802 B leaves198 B; existing limits remain unchanged. Fixed September20 completion evidence is insufficient: actual whole-screen rendering, real device/touch/listening, target-game comparison and delivery remain unresolved. Q automation is still disabled under the20-task limit despite the stored continuing prompt and no-COUNT hourly schedule. Keep finite substantive production going while these separate acceptance/delivery steps remain blocked.

---

## Current continuation — v31 archery verified (2026-09-16)

[Archery integration](ARCHERY_INTEGRATION_V31.md) records22 required commands/270 tests, fixed stage and exact media evidence. Main remains547676f and owner-only Site23; no claim of delivery or PS4 attainment. Preserve normal ordered stack integration after the unresolved PR39 merge, with no additional duplicate merge mutation. Continue conversation camera/UI, the one numerically valid NPC candidate and a shared physical projectile contract. September20 completion evidence is still insufficient; the lossless same-byte storage comparison is measured but not adopted and has CPU/temporary-memory cost. Missing actual rendering/device/listening/comparison and the disabled20-limit Q automation remain explicit, not human-wait conditions.

# 制作停止時の復旧


2026-09-16 03:56Zの既存Q継続設定: 最新の「達成するまで止めない」に従い、未達でも固定回数で終了するCOUNT=168だけの削除を既存taskへ一回保存した。serviceはDTSTART末尾Zを除去する正規化を行ったためliteral一致ではない。既に過去の開始点と無期限HOURLYの毎時14分32秒はUTC/AsiaTokyoの整数時間差で今後の集合が変わらず、追加保存はしない。prompt/title/timezone/enabledは完全保持、disabled/nextnull・20件上限は解消していない。新規task/他task変更/再enableなし、期限9/20は変えていない。設定修正を実制作や再開成功へ読み替えない。


最新継続点（2026-09-16 03:42Z頃）: main547676f、PR39通常mergeは未完了、追加mutationなし。PR43まで全CI成功、v29は20gate/263testsと固定stageを保全してstack公開へ進む。詳細はPROJECT_STATE最新項を読む。03:30Zの正式preview statusはmailbox不在のまま、Sites skillはlive Site browser QAも禁止。Qautomationはfresh disabled/nextnull/20件上限で再試行しない。家屋・橋の有限制作を既存Ultraが続行しているが、この記録は将来の稼働を保証しない。


最新追記（2026-09-16 03:14Z頃）: PR39の最初の405から1時間以上後、公式通常merge仕様の独立確認と同一head/base/main/成功CIの直前readbackに基づき、元payloadを1回だけ再試行した。結果はReadTimeout、PRopen/mergedfalse/main547676f維持。新しいtest merge16fff61d98870b7e8ed1e24df375fe0c9eabda3bは親547+bfc/tree3fe6であり実mainではない。追加mutationは行わずreadbackを続ける。通常mergeのexactly-once保証や、別merge-asyncのUUID追跡が利用可能だったと説明しない。PR42までexact tree/CI成功のstack保全を進め、別の肌/接地制作を継続する。



2026-09-16の直接指定「達成するまで止めない」と利用上限後の「続けて」に従い、同じUltra所有担当の保存済み成果から継続する。局所単位の完了、正式描画/人間QA不在、通常mergeの未完了は、独立して実行可能な制作の終了条件にしない。実usage制約が再発した場合はその原応答と処理ID/確定SHA/未保存差分を保全し、稼働していない担当をbackground-runningと説明しない。Q定期再開は20件上限でdisabledのまま、保存済みpromptのみから次回実行を保証しない。

PR39は通常mergeのtimeout後、一回のretryが405「Merge already in progress」。正規readbackでopen/merged=false、実main547676fdce8d8e97abed9f065aad0b6e24af2fd6のまま。原因未公開の操作を二重発火せず、mergecommit/mainの実変化を確認する。保存済みPR40/41と後続unitはfeatureへmergeせず、先行PRがmainへ入ってからretarget/requiredCI/expected-head通常mergeの順序を守る。未確認のtest mergeを実main・Site反映へ読み替えない。正規previewはmanaged-linux configured:false、監督mailbox不在。別browser/server/CIに移して迂回しない。


2026-09-15の最新指示「人間は介入しません」により、人間の端末・アカウント・スクリーンショット・評価者の準備を復旧条件にしない。正式preview等の利用不能は該当工程に限定し、許可された自動検証と競合しない制作を継続する。人間へ準備を依頼せず、[自律検証工程](AUTONOMOUS_VALIDATION.md) と最新のPROJECT_STATEを使う。実機・実聴・外部評価の不足は未確認のまま保持する。

2026-09-14のユーザー指示に基づき、既存の定期実行を制作の監視・復旧・再発火役へ変更した。実行中の制作に重ねて別の制作を起動するものではない。品質目標と完成期限2026-09-20、mainと既存所有者限定Siteへの反映許可は維持する。

## 停止を判定する

最新main、作業ツリー、直近の会話・ツール結果、正式に取得できる実行状態と継続中の処理を照合する。コミットの古さ、応答の空白、最終実行日時、次回実行日時の欠落だけでは停止と判断しない。

| 状態 | 行うこと |
|---|---|
| 実行中の証拠がある | 重複起動や並行書込みをせず、既存作業を継続させる |
| 意図しない停止を確認 | 原因を調査・修正・再検証して、最後のチェックポイントから再開 |
| ユーザーが明示的に停止 | 再開しない。再開の指示を待つ |
| 状態不明 | 読み取り調査を進め、競合する変更を始めない。不明を実行中とも停止とも断定しない |
| 根拠付きで品質目標を達成 | 最終成果と根拠を確認し、完了として扱う |

ゲーム全体が未完成で、通常のターン終了・実行枠終了により作業が終わっている場合も再開対象。小さな区切りの完了報告はゲームの完成ではない。過去の「実行中」記録も永続的な実行証拠にはしない。

## 継続確認の直後に期限を評価する

上の状態判定の直後、制作項目の選択前に2026-09-20までの完成見込みを必ず確認する。実行中を確認して監視を終える場合にも、読み取りの見込み評価を省略しない。実行中の制作への並行書込みや重複起動は引き続き禁止する。

残作業、同種の完了作業で実測した速度、手戻り、画面・タッチ・音・実機性能・外部比較の検証待ちを確認し、「見込みあり」「現行方法では届かない」「根拠不足」を根拠付きで区別する。不明を不可能と断定せず、根拠不足を順調とも扱わない。

根拠付きで「期限内に達成できる」と判断した場合以外は、条件付き・保留・未評価など判断名を問わず、やり方や前提が間違っていることを疑う。具体的な評価条件と代案比較はAGENTS.mdとPRODUCTION_METHOD.mdの最新指定に従う。根拠不足の場合は判断できない原因と不足する証拠を特定し、それを解消する調査・測定・実装比較を次の優先作業へ反映する。不明の報告だけで現行方法を継続可と扱わない。優先順位、素材調達、実装単位、道具、検証工程の代案を選び、次に制作を行う際に実装・比較して、品質への効果と同種作業の所要時間・手戻りを別々に確認し、期限判断を更新する。記録だけで同じ作業を繰り返さず、目標品質・完成期限を下げない。制作側の安全な節目で、判断だけでなく採用した方法とその実結果を残す。

## 原因を直してから再開する

直前の失敗や終了理由から、例外、時間切れ、環境・依存関係の消失、再開情報の不足、Git競合、検証失敗、認証切れ、サービス障害を調査する。各原因について、証拠、対処、再検証、未解消事項を残す。推測と確定原因を分ける。

- 環境を失った場合はGitHubの最新Qから復元し、未反映変更を保全して依存関係を揃える。
- 時間切れの原因になった長い処理は、進捗を保存できる単位に分割する。途中の処理IDと再開地点を記録し、完了していない処理を完了扱いしない。
- Gitの新しいmainを取り込んで競合を解決する。force pushや他の作業の上書きをしない。
- 失敗した工程に必要な修正を行い、その工程が通ることを確認する。一時的な通信・レート制限は回数を制限し、間隔を空けて再確認する。同じ失敗を無条件に繰り返さない。
- 認証や承認は正式な手段を使う。アクセス制限、ブラウザー拒否、監督サービス、ユーザーの停止指示を迂回しない。必要な原因が未解消の工程は再開済みと扱わず、必要な対応を報告する。独立して進められる制作は継続する。

把握できた停止原因のうち修正可能なものは全て処理し、再発防止策を含めて検証してから対象工程を再開する。未知の原因やこちらで修正できない外部障害まで除去したとは主張しない。監視オートメーション自身が起動しない障害は、そのオートメーションだけでは検知・復旧できない。

## 続きが失われない記録

制作の節目ごとに、次をdocs/PROJECT_STATE.mdへ記録する。再開情報のために認証情報を保存しない。

- 記録日時、取り組んでいる項目、基点のmain、変更したファイル。
- 最後に通った検証と未実施の検証、未完了の操作・処理、次に行う具体作業。
- 停止や復旧があった場合は、判定の証拠、原因ごとの対処・再検証、残る阻害事項。
- mainと配信の実結果、期限見込みの再評価と制作方法の変更。

復旧の目的は実装・検証を再び進めること。再開宣言だけで終えず、既存の制作条件に従って動く変更を反映する。新しいオートメーションの連鎖や無制限再起動を作らず、実行環境の停止・承認規則を守る。


## 2026-09-14：復旧を確認した配信経路

ローカル起動が回復したら、容量・未保存編集・最新mainを確認し、最新GitHubソースと生成物の一致を再検証する。既定の一時ディレクトリ不在で公式梱包ヘルパーが失敗する場合は、書込み可能な作業領域内へ一時ディレクトリを作り、その梱包操作のみにTMPDIRを指定する。この方法で11ファイルの梱包・照合・既存owner限定配信が成功した。サービスやシステムの一時領域は変更しない。

GitHubの対話認証がローカルpushで使えない場合は、接続済みGitHubの正規APIを利用し、生成物を含むGitツリーSHAがローカル検証済みツリーと同一であることを確認してから、通常CIとPRを進める。認証を迂回したり、検証済みでない生成物を別の版のSHAとして保存したりしない。Sitesの短期認証は別用途であり、GitHub用に転用しない。
