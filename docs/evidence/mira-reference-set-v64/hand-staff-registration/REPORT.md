# 手・杖・袖口の設計登録 v64

右手と杖軸、左右の手首と袖口を数値設計へ対応させた。**元の骨長のまま把持中心へ届く座標案は得られたが、握った指面と杖の接触、全袖との接合は未成立**。新形状・ゲーム source・既存画像/台帳の変更は 0。画像の追加生成も行っていない。

基点 `d080086eb2589895ef7edcd21db902203131b861` の actual `createDetailedActor('npc')`、`animateDetailedActor` と既存 19 配置の `makeMiraStaff()` を読み込んで計測した。既存 constructor が作る native objects の検査であり、新しい部品を造形していない。平地 actor frame と実 Scene 配置 `(7,heightAt(7,80),80) / yaw=1.4`、idle 時刻 0 / 1.5 / 3 秒を分けた。Scene の追加 vault 処理は Mira 対象外。実 WebGL は使っていない。

| 根拠の区分 | 固定した内容 |
|---|---|
| 完成像/手資料の実見 | 本人右が杖を握り、本人左は緩める。杖は立ち、右前腕を前へ出す。mm/角度を画像から測定したとはしない。 |
| 旧rigの実測 | 41 bones。hand-0 が本人右 −X、hand-1 が本人左 +X。旧杖は hand-1、強い held curl も hand-1。腕の bind translation は 330 / 310 mm。 |
| 新作者案 | Staff actor-local 軸 `(-460, floorOffset, +220)` mm、全長/scale 1700 mm / 1、把持中心は staff Y=1135 mm。右手 distal を前方から外へ30°、radialを上へ向ける。 |
| 未完成 | 指接触/圧縮、掌/指間ポート、布と肌の動作 clearance、呼吸 scale を継承しない剛体杖 attachment、実描画。 |

平地・時刻0の登録案（actor-local mm）：

| 点 | X | Y | Z |
|---|---:|---:|---:|
| 右肩・旧rig | −313.000 | 1421.978 | 4.024 |
| 右肘・作者案 | −311.593 | 1123.830 | −137.419 |
| 右手首・作者案 | −461.105 | 1135.000 | 133.914 |
| 把持軸中心・作者案 | −460.000 | 1135.000 | 220.000 |

右手 local における把持中心は `(0,−74,−44)` mm。local +X は radial、−Y は distal、+Z は dorsal。右手の姿勢行列は determinant +1 で、鏡映 transform ではない。最初の40 mm掌側offsetは、実巻革の半径最大27.57335 mmに対して旧掌輪郭を跨ぎ得るため44 mmへ変更した。旧掌 y=−74 mm の palmar z=−14.5 mmに対して約1.9 mmの粗い包絡余裕になるが、これは実指面接触検査ではない。全指を離れたままにしてよいという採用でもない。

実材の S04/S05-A/S05-B を 6 高さ×32方向の両面 triangle ray で採り、半径 23.53885–27.57335 mmを得た。16角面と帯の盛上りがあるため、半径24 mmの円柱へ一律に指を合わせない。19 part ID、既存 bounds/tri 数、各方向の接触先 part を `RIG_MEASUREMENTS.json` に保持した。

骨長は **chest-local** の330/310 mmとして解いた。旧 chest は呼吸で Z scale が変化し、world 長には既に小変動がある。worldで常時330/310 mmになるよう新しい骨scaleを入れる案は採らない。6条件の local 長残差は浮動小数点誤差内。手の distal と前腕軸の角度差は平地1.759–2.361°、実Scene4.182–4.774°。実Sceneでは杖先の groundAt が root より13.49675 mm高く、把持高も同量上がる。これらは可達性と座標の確認であり、皮膚/衣装の干渉や自然な姿勢の合格ではない。

`AUTHOR_REGISTRATION.json` は各条件の actor/root/world/hand/staff 行列、肘pole、手首と杖の登録点を持つ。剛体杖を手の child に付けるだけでは胸の非一様scale/せん断を継承し得るため、将来は actor-root に置く scale1 の杖と右手点を同期する必要がある。現表の手行列は理想targetであり、その全行列を実骨poseで達成した証拠ではない。既存 motion、骨、scale は変更していない。

手首は AH10 distal ring `y=−15, rx=32, rz=24 mm`、proximal ring `y=+9, rx=28, rz=24 mm` を旧皮膚profileから登録した。32区間＋閉じ端の座標、接線、共有normal案を保存。AH02=背側、AH03=橈側、AH01=掌側、AH04=尺側の4 arcが同じ AH10 distal loop を共有する。左は thumb側が local−Xになる数表を別出力し、将来の winding/tangent反転を明記した。新しい面はまだ無い。

袖口は cloth:F01/F02 の WRIST 下端へ接続し、F03巻革やS05/S06袖を手側に複製しない。作者案の cuff aperture は hand-local y=+6 mm、inner rx/rz=31.5/27、outer=35.5/31 mm。旧皮膚断面28.5/24 mmから各主軸3 mmの余裕案。布は肌と別層なのでskinとのvertex weldを強制しない。F01/F02間は同じ側縁座標/重み/normal、肌同士の AH10境界は hand=1 を共用する。cuff は手首から6–66 mmで hand→elbow weightを移し、上端200 mmは前腕へ登録する提案で、sourceのcloth verticesに適用していない。front/backの意味は actor投影で判定し、回転した hand+Z を無条件に front としない。

通常4指の MCP/PIP/DIP、親指の MCP/IP を左右計28 loopとして数値提案した。指節型AH06と指先AH07の共有輪郭・weightsを示したが、掌側MCPポートは未確定。旧指は root/tip の2骨であり、3節を3本の独立骨と誤認しない。右の旧 chain順と解剖学的index順が逆なので、骨pivotは旧長の1/2を維持し、新しい画像計画の節長44/31/25%等で骨を動かさない。爪AH08は爪床の同じweightsへ従わせる案。AH07/AH08の画像の所有矛盾、実把持curl、指間の縫合は未解決で、共通の旧curl=.92を新しい完成把持として採用しない。

有限結論：本人左右、剛体杖の座標系、固定骨長の可達点、手首/袖口と指節の共有曲線案までを全身台帳へ渡せる。全手/全袖の組立採用には、掌MCPと指間の輪郭、右の実把持接触、cuff/皮膚 clearance、非一様scale下の剛体取付を実meshで確認する必要がある。資料先行の条件を満たす前の局所造形は追加しない。

再計測は `node register.mjs /absolute/path/to/Q-mira-references-v64`。sourceを読んでこの外部フォルダに数表を出す。既存source/hash、原画hash、計時は別 manifest に保存。Node計算の約0.4秒を設計制作全体の時間や端末速度と呼ばない。
