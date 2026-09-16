# 弓の握り・引き手・弦と射出点 — v31

基点 `47ca76d0679549a890c5721cf7cd997e2b6a2352`。rangerの弓と手の接続を改修した。Gameの射出・速度・軌道・接触・ダメージ、Sceneの飛翔矢、人物のroot位置、頭部形状・UV・肌画像は変更しない。新たな画像・音・外部素材はなく、変更した弓のattachmentと姿勢はQの自作recipeである。

## 実測された欠陥と修復

元の弓は左手の別の点へ取り付けられ、右手と弦も独立に動いていた。同じ12 m先を狙うnative rangerで、左palmと曲線のgripは全phaseで .123 m離れ、引き切り時の右index指先とstring nockは .570364 m離れた。strike開始のnockは実Game射出点から .558834 mずれた。braceのnockがgripの前へ来るため、draw=0と引き切りでnock→grip方向も反転した。

弓の木部形状を増やさず、元のgripを左palmへ合わせるattachmentへ修正した。`bow-contact.js` は実saved aimとattack clockから弓の向き、両stringの同じnock、左wristと右の実index fingertipを決定する。上腕 .33 m／前腕 .31 mは伸ばさず、両腕を解く。前半 .3秒は手を弓へ運び、その後に引く。発射後は閉じた指の骨格から再現できるwrist anchorを保持し、指を開いて外側へrecoilする。開いた指先を追って手首まで胸へ戻す動きは除いた。

rangerの構えは肩を横へ向け、10 cm低く、最大18 cm後ろへ体重を移す。rootを動かさず接地solverが足を支える。構え始めと下ろす途中には、弓を身体の前、引き手を前・右外側へ通すarcを用いる。elbow poleをcarryから連続補間し、解いた接地点を大きなjoint blendで身体の内側へ戻さない。

| 同じ条件の対象 | 旧 | 改修後 |
|---|---:|---:|
| 左palm–弓grip | .123 m | < 6e−14 m |
| loaded右index先–nock | 最大 .570364 m | < 2e−13 m |
| strike開始nock–実Game射出点 | 最大 .558834 m | < 2e−13 m |
| 両stringのnockの離れ | おおむね0 | < 6e−14 m |
| 構え完了後の射出軸との角度 | 平地の引き切り8.288°／brace171.712° | < .000001° |
| 実skinned index先の最寄り頂点–nock | 別駆動 | 約 .002 m（指先の半径） |
| ranger geometry | 7,078 tri／12可視mesh／349,620 B | 同一 |

計算上の極小誤差は骨格座標の一致を示し、実画面の見た目の精度ではない。右手は準備中に弦へ近づき、解放後は離れるため、全phaseの指–弦距離が0であるべきとはしていない。

## 交差の独立確認と手戻り

最初の距離合わせだけでは、近接攻撃用の前方荷重がnockを胸へ押し込んだ。また、FrontSide rayだけでは内部から外へ出る交差を見落とすため、最終oracleは実skinned三角形の両面を検査する。身体の後方荷重と外側elbow pole、右掌planeの調整、release時にwrist anchorを保持する修復を行った。

独立した手の実surface edge検査は、さらに構え途中・下ろす途中とcarryで身体への交差を検出した。前方・外側arcとcarry時の左腕を外へ置く修復後、独立90 poses（yaw3 × pitch3 × 10phase）のphysical string／右前腕の両面交差は0。そのうち30 posesで両手の実skin edgeを全検査し、身体との交差は0。これは有限の標本集合であり、全ての任意姿勢で交差がないという証明ではない。

[作者の比較](evidence/archery-contact-v31/geometry.json) は実3rangers × 5 yaw × 5 loaded phaseの75姿勢、追加30 raise/recover姿勢、実Gameの保存4phase、78回の同じ状態の再構築を含む。旧sourceはhash付きfixtureに保持し、cherry-pick後にも負例を再現できる。期待射出点と方向は `Game.createEnemyArrow` を実行して取得する。

| 更新頻度 | 実発射数 | 最大1frameのgrip移動 | 同じ状態の再構築 |
|---|---:|---:|---:|
| 30 Hz | 1 | .146611 m | 26回一致 |
| 60 Hz | 1 | .074088 m | 26回一致 |
| 120 Hz | 1 | .037056 m | 26回一致 |

[独立レビューと再現資料](evidence/archery-contact-v31/independent/REVIEW.md)でもactual Gameの保存4phase、pause dt=0、実hurtEnemyによる射出前後の中断を確認した。射出前の矢数0は0、射出後の1は1を保持し、被弾・死亡・攻撃中断で弦はscale1／rotation0へ戻る。

## 予算・未解決範囲

最終 `npm test` は270/270成功。main-runtime、archery oracle、build、package、artifactsを含む6 commandが成功。初期JS **164,493 B**／上限165,000 B、3 chunks、全JS972,530 B。単体版16,331,434 B／上限16 MiB。全役・themeの既存8,000 tri／14 meshのgateを保持し、弓の面数や材質batchを増やさない。coreは基点とbyte一致する。geometry recipeのprovenance hashのみ更新し、別担当の顔recipeとの結合後はそのhashを再計算する必要がある。

**今回一致したのはGameの解析的な射出基準点とloaded nockであり、描画された矢の尾端ではない。** 既存Sceneのshaftは基準点中心の長さ1.1 mなので尾端は .55 m後ろにある。単純に表示だけ .55 m移動すると先端と既存point接触の差が広がるため変更しない。point／shaft／tail／forecast／near-wall接続の統一は、次の独立単位に残す。装填中の矢の独立モデルも本単位では追加していない。木の弓身は剛体のままで、弦を節点間の長さへ伸縮させる簡略化も残る。物理的な弓のたわみを再現したものではない。

正式WebGL画面、知覚上の自然な射法、実機FPS・触感、PS4相当の全画面品質は未確認。完成期限2026-09-20の達成をこの骨格検査から保証しない。独立検査で見つかった手面・弦の交差を有限に修復した成果として統合し、残る矢の見え方と実接触の不一致へ継続する。
