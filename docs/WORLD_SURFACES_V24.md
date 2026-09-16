# 地形・浅い流れ・照明の整合（2026-09-16）

基点 `547676fdce8d8e97abed9f065aad0b6e24af2fd6`。ユーザーの「PS4相当の品質達成 これ達成するまで絶対止めんな」に従う継続制作の一単位。画面全体の品質目標は未達で、本単位の配信後も人物・植生・武器演出の具体的な改修を続ける。

## 実装と同条件比較

| 対象 | 基点 | 候補と確認範囲 |
|---|---|---|
| 足元と地形 | 3.3m間隔の別々の平面。廃塔中央で描画6.497890mに対し接地8m | 共有heightAtに誤差追従の分割と接合辺を適用。一つのindexed mesh。5拠点の中央は全てexact vertex |
| 地形誤差 | 同一555,901地点の最大絶対誤差1.502110m | 同じ地点で0.059330m。別の密な拠点・実triangle中心/辺点を加えた最大0.088640m。0.045mは分割heuristicであり絶対誤差保証ではない |
| 西の境界 | 同じ高さでも別meshの法線が最大2.296度異なる | 連続したmeshと共通height微分normal。内部開口、重複XZ、縮退、逆向き、非多様体辺は0 |
| 流れ | 中央の高さを幅全体へコピーし、rule-wet 29,756地点中7,740地点で地面に埋まる | 実際の横断方向の地形に沿う浅い流れ。幅・南北端をsoft fade。最悪下向き波0.021mを含め同じ地点の埋没0、追加triangle点も含む最低余裕0.065566m |
| 岸 | 低い別overlayが地形と交差する | overlay2枚を削除、同じ地表上で湿りの色・roughnessを変える。追加draw0、z-fighting原因を除去 |
| 草・布の裏面 | bump勾配と裏面normalが不整合 | Threeと同じfaceDirectionをdeterminantへ適用。独立した前裏反対向きの法線誤差0 |
| 影 | playerに追従してshadow gridが連続的に動く | lightの平面基底へtexel単位で固定。同じセルでnative Three shadow投影の変化0、1セル移動の誤差2.27e-13px |

地形は102,000→104,570 triangles、51,657→52,547 vertices、候補buffer2,939,488 B。水は1,600→10,240 triangles、候補buffer234,144 B。地形2→1 draw、岸2→0 draw、水1drawを維持、追加render target/pass/texture0。全sceneのvisible draw・GPU時間・実機frame-timeではない。水は既存の浅瀬ルールに合わせたsheet flowであり、物理的に水平な河川やhydrologyを実装した主張ではない。端末の起動時には一度だけ地形を構築する。Nodeで約0.5–0.6秒の構築を観測しており、実機起動時間は未測定。

## 出所、検証、手戻り

新しい地形と流れはproject-original JS生成形状。既存のCC0地表/岩素材3枚、タイトル映像、音素材・ライセンスを維持し、この単位では新しいbinary assetを追加しない。素材取得/生成待ちは0、実装・統合時間とは別。worktree開始はgit reflogの2026-09-16T01:25:56Z。最初のauthoringとレビューの重複時間を独立timerで測っていないため、純粋coding時間や旧方式からの制作速度改善倍率は算出しない。required gateの開始/終了/所要時間は `docs/evidence/world-surfaces-v24-validation.json` に保存する。

独立Ultra auditが(1)地形境界上のhaven anchor欠落、(2)岸overlay交差を発見し、両方を修正した。`scripts/verify-world-surfaces.mjs` は実indexed geometry、固定点比較、前裏normal oracleとnative Three shadow matrixを検査する。テストにrender stubを使ってWebGL画面と称さず、shader source検査をGPU compileの合格へ読み替えない。

担当は `/root/ultra_q_ps4_quality_continuation`（実装・統合）と `frame_quality_audit_ultra`（独立read-only監査）。全ての実spawnは `reasoning_effort=ultra, fork_turns=none, model omitted`。後続の `actor_motion_ultra`、`forest_fidelity_ultra`、`combat_vfx_ultra` は隔離worktreeと非重複ファイルで制作中であり、この単位の完了に数えない。

## 期限判断と次単位

継続確認直後・新たな環境不足・統合前の2026-09-20達成判断は **NO-GO / evidence insufficient**。残る全画面の知覚品質、人物/植生/動作/武器演出、章・地域・演技、正式画面・実機/音・外部比較・配信遅延について、完成全体の実測速度と受入証拠は揃っていない。面数を増やすだけの方法を疑い、今回は同じ場所の物理と描画の不一致を測って改修した。同条件の誤差改善は確認したが、PS4画質や期限到達の証明ではない。

正式profileはmanaged-linux / configured:false。公式preview statusは監督mailbox不在。未変更の再試行、別server/browser/CIによる迂回、人間へ準備を依頼することはしない。実行可能なsource/asset制作は続ける。既存Qの定期再開は有効件数20件の上限で拒否され、継続promptのみ保存された。Qはdisabledのまま、他automationは変更していない。この事実を背景で無期限に実行中という保証へ変えない。

次は写真の葉・針葉cutoutを使う樹冠とshadow、保存された攻撃時間から連続する重心/武器/狼の動作を通常main・同じSiteへ統合する。その後に実際のblade軌跡に従うVFXを接続する。正式描画が回復したら同じ保存・視点で地形/川/橋・植生・武器を観察し、匿名の実媒体で独立比較する。未取得の比較を合格にしない。

必須ローカル検証は17command / 223tests全成功、wall 88.166秒。初期JS 163,175 B（165,000 B上限維持）、単体版 13,120,704 B / SHA256 `aa700800e365583088f61e4aa1beaace660f55ce1ea696a88e66aced0405569c`。source/stage/単体版の照合成功。GitHub/同一Siteの結果は反映後に追記する。
