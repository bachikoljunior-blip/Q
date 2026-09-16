# 外套の倒れ込みと床接触 — v34

基点 `39e47a4fa204ea6576c685bf25569727e410cd01`。変更は `src/actor-models.js` の `animateCape` とその専用 cache、対応する provenance、限定検証・記録。顔、身体、弓、手、UV、geometry、材質、Scene、core、packager は変更しない。

旧処理は chest 配下の local Y を `-pelvisY + .06` に切り詰め、死体では全頂点の local Z を `-.115` へ寄せていた。倒れる骨の回転を床の座標として扱えず、実 world floor へ最大 22.89 mm、boss は 68.47 mm 貫通した。同時に 192 面のうち普通外套 64–80 面、boss 96 面が面積 zero になる時点があった。

新処理は胸元の既存 death attachment を維持し、元布の縦方向の長さを使う円弧で床への接線を連続につなぐ。元の横方向のひだを曲面へ運び、4 回の辺長補正と床制約を行う。全布を平面へ潰さず、立っていた時の boss 裾の短縮は最初の 0.2 秒でほどく。接触位置は既存 `groundHeight(x,z)` を world 座標で評価し、無効・未指定時は actor の world 原点の高さを使う。布の接触余白は 12 mm × actor scale（boss 27.6 mm）。旧 local 値の `.06` を実 world ground の厚さと誤記しない。

毎回、保存された `deathElapsed` から同じ形を作り、前フレームの solver 解に依存しない。初めて見た死体は既存の settled phase に従う。生存中は元処理へそのまま戻る。

## 同条件で確認した範囲

`scripts/compare-cloak-ground.mjs` は保存した旧 actor source を正式 Node module hook で読み、現在と同じ geometry/material を使う。旧 source SHA256 は `0731e2582bd7eacabf90fd96ca651fd7bc2f56c886c82c912835563c7294b006`。実描画を差し替えたブラウザーではなく、CPU 上の実 world-space geometry の比較。

- player / NPC / Sena / scout / traveler / ranger の普通外套 6 種と boss を比較。idle / walk / run × 30/60/120 Hz の 63 条件で cape の position/normal が byte 同一。その他の geometry、UV、材質、骨、保持物も同一。
- death 0–1.2 秒 × 30/60/120 Hz の計 1,785 フレームで、変更を許可した cape position/normal 以外の actor contract は同一。明示した保存 phase、異なる過去の idle、独立 clone、初見 settled corpse も一致。
- flat、勾配 `.12x-.08z`、実 `groundAt`（45,-33）を、同じ yaw .7 と root translation で 84 keyframes 比較。頂点・辺中点・面重心の床貫通は新候補で 0。非線形地面の全連続面を証明するものではない。

| 対象 | floor gap 最小: 旧 → 新 | zero 面数最大: 旧 → 新 | 新しい面積 / rest の最小 | UV stretch p95 の時間最大: 旧 → 新 |
| --- | --- | --- | --- | --- |
| player / scout | −22.89 → +12.00 mm | 80 → 0 | 97.22% | 3.3866 → 1.3057 |
| NPC / Sena / traveler / ranger | −13.07 → +12.00 mm | 64 → 0 | 97.96% | 2.7556 → 1.2914 |
| boss | −68.47 → +27.60 mm | 96 → 0 | 89.83%（初期 unfold、以後 96%以上） | 3.8397 → 2.7406 |

新しい辺長 / rest の最大は普通外套 1.089、boss 1.083。正確な伸びゼロの布 simulation とは称さない。単純な UV stretch の比較値は前 v33 の別時間列と異なるため、以前の 3.694311 と同一 sample の値としない。

**実 spawn 地形の別境界:** 初回 author checkpoint `19e607f` の f15b source は襟元を rest depth に固定したため、(0,101) の .8 秒で旧 −61.60 mm → 新 −154.89 mm の悪化が独立監査で判明し、そのままでは非採用とした。最終 source は top 9 頂点だけ元 death Zmix attachment に戻し、布の円弧方向には元 rest-depth の参照を保持する。player の (0,101) は −61.602319639 mm、(-389,-38) は −62.970390549 mm、boss の同地点は −135.766076207 / −144.220576666 mm で旧と一致する。固定襟と身体自体の旧地面侵入は未解消で、上の限定 84 keyframes を全地形の正 gap と一般化しない。身体から襟だけを持ち上げる修復はしていない。次の「死体全体の実地形支持」で扱う。

実 skinned torso/head 表面との proper segment/triangle crossing は、全 84 keyframes で旧より増えた条件が 0。最大値は player 65→42、scout 63→32、NPC/Sena 62→32、boss 67→37、traveler/ranger 42→17。衣服・hood を含む残る交差は解消済みではない。対象 bones は pelvis/spine/chest/neck/head、四肢・指・武器、coplanar 接触、完全包含はこの交差数で認定しない。

襟修正前 f15b checkpoint の 7 種 × 5 時点の平地では、頂点を共有しない実 cape 面同士の proper 交差は最大 269→0。隣接面・coplanar 接触を除いた測定であり、全時間の self collision 解決を意味しない。元の剛体面 normal から 90 度以上回る面は最大 11 あり、円弧で折れた布の向きの変化をそのまま記録した。UV/index は不変、zero 面 0、normal は finite。法線方向の変化を機械的に全て反転欠陥と数えたり、全て良好と認定したりしない。

## 動きの限界と手戻り

最初の 36 回の反復 solver は静的な辺長・床接触を改善したが、折れ方が切り替わり 120 Hz で player 127.7 mm / boss 342.8 mm の跳びが出たため非採用。続く縦辺投影と多数反復の候補も非採用で、source と比較記録を evidence に残した。最終候補は円弧の初期解と 4 回の補正を使う。

襟の修復中、aebdc96 source は top 以外の方向参照まで flattened depth に変え、NPC の body crossing が 62→83 へ悪化したため非採用。最終 d3f source は top だけを戻し、全 84 keyframes の増加 0 を再確認した。追加実地面 test の初回は「正の床余白を減らすこと」まで禁止した比較式で失敗したので、侵入に限って旧以下を求める式へ修正した。runtime を test に合わせて変更したものではなく、最初の失敗 log も保存した。

最終候補の 120 Hz 最大 step は player/scout 35.03 mm、その他普通外套 31.32 mm、boss 81.58 mm。旧はそれぞれ 22.24 / 21.50 / 49.73 mm。布がほどける移動量は増えており、旧より小さいと報告しない。unfold 後の 60→120→240 Hz の追加測定では最大 step はほぼ半減し、初期候補の折れ方の突然の切替を縮小した。

**残る開始境界:** 100 idle frames 後に death phase 0 を再現した時、canonical wind phase の切替で最大位置差は普通外套 15.44→37.31 mm、boss 35.10→92.61 mm。保存 phase を過去の idle 時間によらず同一にする代価で、完全な live transition 改善とは言えない。これは隠さず残す。実画面での自然さ、hood との交差、初期境界は次の採用レビューに含める。

## 検証・配信・計測の限界

最終 source で cloth/全actor/provenance と頭/原UV/skin/実scene境界/弓の計 25 tests が成功（10.112 秒）。実 spawn 地形の襟維持を追加した focused 4/4 も成功し、重複を除く 26 tests を確認した。`npm run build`、`npm run package`、`npm run test:artifacts` が成功。初期 JS **164,802 / 165,000 B**、3 chunks、全 JS 1,077,743 B、単体 HTML **15,499,834 / 16,777,216 B**。実使用全 actor の 8,000 tri 未満 / 14 draw 以下を維持し、媒体 27 件の source→emitted→固定 stage→standalone の全 byte 一致を保持した。

同じ Node whole-actor `animate` を最終 source で 840 death posesずつ実行した 2 組は、旧 55.02 / 45.07 ms、新 257.40 / 374.26 ms。初期化後の cache を使った host wall time で、1 pose の平均は新約 0.306–0.446 ms。初回 checkpoint の記録と host の速度は揃っておらず、これを実機改善や安定した端末予算に読み替えない。実 GPU、端末の frame budget、browser、画面の知覚品質は未測定。

正式 exec transport が 06:01Z 頃に一度切断し、未完了 session の正規 wait で exit0 を回収した。同じ正式経路の readback と親の pwd 成功後に保留解除され、未開始だった build/package/artifacts を初めて実行した。別 server / browser / CI 経路を使っていない。

開始 2026-09-16 05:43:51Z。最終 source checkpoint は `actor-models.js` 31,704 B / SHA256 `d3f543c2537cd076dfe18ad05ca815374f242dda64847e01421844fc7a0d23fc`。初回比較 10.359 秒、最終全比較 11.473 秒、限定 test 1.702 秒、追加回帰 13.587 秒。新素材取得は 0。反復候補の手戻りは実記録を残すが、その作業時間を独立 stopwatch で測っていないので総 wall time から架空に分離しない。

[全比較](evidence/cloak-ground-v34/comparison.json)、[要約](evidence/cloak-ground-v34/summary.json)、[CPU・開始境界・生成物](evidence/cloak-ground-v34/production.json)、[self intersection](evidence/cloak-ground-v34/self-intersection.json)。新しい描画・PS4 合格・実機品質の確認とは扱わない。

[独立 Ultra 最終レビュー](evidence/cloak-ground-v34/review/REVIEW.md) は d3f source を別実装で再確認し、108 実地形条件の新悪化 0、既存 negative 6 条件の同値、20 身体交差条件の増加 0、非death・保存・world covariance を確認した。追加の必須 source 修復はない。17 evidence files を HASHES の byte/SHA と照合して変更せず保存した。初回 author commit まで 24分01秒、その後の独立指摘に対する限定修復は親の明示承認で追加し、最終独立計測は 06:17:24Z、review 保存は 06:20:47Z に完了した。

ローカル旧生成 summary が移動・削除後に同じ旧 byte と mtime で再出現したため、同内容を evidence へ保全し、以降の削除は繰り返していない。全既知 session は終了済みだが原因は未確定。source の未保存差分ではなく、統合へ持ち込まないローカル生成物として [状態](evidence/cloak-ground-v34/local-output-state.json) を記録する。
