# 飛翔・装填矢と接触判定の共通定義 — v33

基点 `892f7e59f602e20da62bf1c8708e432ce1eac637`。既存のGame座標を矢の尾端／nockとして扱い、描画・装填・実接触・予測を同じ長さ1.34 mへ接続した。射出原点と保存座標、狙い、敵矢19 m/s／反射25 m/s、life2.3秒／反射2秒、ダメージ、最大48本、射手の死亡後も飛ぶ契約は保持する。新しい画像・音・外部素材はない。

これはGame pointの接触を有限の矢へ変える仕様変更であり、接触時刻まで旧版と同じとはしない。読み込み済みの旧セーブでも数値座標は変換せず、その点を尾端とするため、旧表示の矢は前へ .55 m訂正される。runtime version／保存whitelistを変更しない。

## 表示と物理時刻

旧表示は長さ1.1 mのshaftをGame point中心に置き、尾端−.55／先端+.79 mだった。nock=Game pointでも描画尾端は一致していなかった。新表示は尾端0／先端1.34 mで、同じ `arrowGeometry()` をSceneと装填用の骨格へ使う。

そのままの45 mm角の尾端では右指と弦を押し込んだため、最初10 cmだけnock幅4 mmから最大45 mmへつながる形に修復した。全長と最大径は保持した。先端の半径 .1 m、最大直径20 cmや長さ1.34 mには可読性のための誇張が残る。自然な実寸の矢として合格したものではない。

| 同じ条件 | 旧point判定 | 有限矢の実判定 |
|---|---:|---:|
| 12 m先、19 m/s、30／60／120 Hz | .600000秒 | .529474秒 |
| 壁前面が .15／.5／1／1.3 m先 | 少し進んでから接触 | 初期占有spanで時刻0の接触 |
| 120橋・縁・地表fixture、各更新頻度 | player111／wall9 | player111／wall9 |
| 同fixtureの接触時刻の差 | 基準 | −70.573〜−70.312 ms |

通常の前倒しは1.34／19 = **70.526 ms**。20 m/sを使う既存テストでは67 msとなり、警告 .22秒は .153秒になる。予測も同じ定義へ変え、橋120例の60 Hz予測は実判定と対象・時刻が一致した。有限の標本集合であり、すべての地形の連続接触を保証しない。

尾端Pから次frameの先端 `P+d*(L+s*dt)` までを調べる。空間の交差割合uを、そのままframe割合として使わない。

`impactSeconds = max(0, (u*(L+s*dt)-L)/s)`

初期spanの交差は時刻0へ写るが、その前にraw距離で最初の遮蔽物を決める。正確な同距離のtieは従来のterrain→obstacles→victims順を保持する。尾端の停止位置と物理接触点は別に返す。world／terrain／actorのpadding .08／.1／.12 mは従来の許容幅を保持し、円錐の全表面に一致する横方向の精密衝突とはしていない。

## 反射・期限・保存

受け流しでは実接触点Cを**反射後の尾端**にし、そこから射手の既存targetへ向ける。射手が死亡していれば入射方向を反転する。180度の反転では尾端と先端を交換し、占有する線分を維持できる。反射した全spanが近くの壁と重なる場合は、その場で接触を解決し、破片の位置にもそのwall接触点を用いる。余ったframe時間の追加積分は行わず、従来どおり次の更新から飛ぶ。

既存parryテストの「.14秒では敵がまだ無傷」は、有限矢では帰還が終わる時刻になった。実parryを発生させた瞬間に敵が無傷であり、その時点の反射矢が敵へまだ接触していないことを直接検査し、後の実飛行でダメージが入る条件へ改めた。即座に反射ダメージを与える実装へ弱めていない。

lifeを先に減らして期限切れのframeを進めない処理、60 Hz予測の最後の死んだstepを除く処理を保持する。この境界自体には旧版同様の更新頻度差がある。死亡した射手の矢、実保存→new Gameの位置・速度・life・damageを検査した。既存のplayer死亡によるGame停止も変更しない。

## 地形の再利用と演算予算

共有 `terrainContact` は従来 `segmentTerrain` の .2 m sampling／5回の二分探索／paddingを使う。既存camera・近接攻撃等の呼出しは、同じfractionを返すwrapperを通る。terrainのclear spanは、次の尾端と全速度成分が完全に一致した場合だけ再利用し、新しく進む先端側を調べる。位置変更・反射・新しい矢・読み込みでは初期spanを調べる。WeakMapの記録は保存データに含めず、予測のcloneへ必要な記録だけ引き継ぐ。独立検査では毎frame新objectへ再構築した2本の橋軌道に約68／19 μsのterrain接触時刻差があり、対象wallと警告結果は同じだった。cold reloadとcacheの二分探索結果がbit一致するとはしていない。身体は動き得るので、毎回矢の全spanで接触を調べる。

最適化された予測は、body・obstacleの候補、既知のplayer接触時刻、短縮したcover探索、地形のfast path、実接触へ戻すframeすべてで共通の距離→時刻を使う。入力配列とGameの保存値は変更しない。

| 同じ48本・20 m/s fixture | 旧point版 | 新有限矢 | 毎回full spanへ戻す負例 |
|---|---:|---:|---:|
| groundAtの実総呼出し | 1,618 | 1,522 | 5,690（拒否） |
| optimized exact frame | 48 | 48 | 48 |
| cached body sweep | 48 | 48 | 48 |
| fallback frame | 0 | 0 | 0 |
| sequential exact frame | 761 | 569 | 569 |

旧reported terrainSamplesの1,474回には、実接触48回内の144回が含まれていなかった。新しい計数はそこも含める。両sourceのgroundAt入口へ**同じcounterを差し込む独立実行**で実総数を再現し、新版の報告値とも照合した。sourceファイルは書き換えない。旧point版の `sequentialFrames*2` は時刻と計数母集団が変わるため使わず、旧実総数1,618以下・新しい逐次処理以下・exact48／body48／fallback0／接触配列一致を要求する。[実計数と負例](evidence/projectile-extent-v33/budget.json)。これは機器性能やframe timeの合格ではない。

## 装填と手・弓の接続

最初の実測ではnockからの射線が左sleeve、bracer、木のgripを貫いた。gripを射線の横へ .12 m置き、元の左右腕長を保ったまま左手を解き、両弦を三次元の同じnockへ接続した。旧「nock→gripが射出軸」の検査は、**実arrow axisと射出軸の一致＋gripの横offset .12 m＋左掌とgripの一致**に更新した。引き手indexとnockの距離条件も維持した。

幅を持つ矢の表面検査で右指・弦の交差が見つかり、尾端profileと右手首planeを修復した。45 posesの実skinned surface edgeを両方向・両面で検査し、意図したnock近傍以外の交差は0。distal index／stringのnockから25 mm以内は接触近傍として明示的に区別し、袖・bracer・木や別の指を無条件に除外していない。これは全任意姿勢の閉volume証明ではない。

独立レビューはさらに、前回のhit flagが次のwindupにも残るため2射目から装填矢が隠れる問題を発見した。windupでは前回のflagを使わず、実strike発射後は非表示にする。新しい実Gameの連続射撃回帰がこの負例を検出する。被弾・死亡・非戦闘では装填骨を縮退させ、材質のdrawを増やさず非表示にする。

native rangerは **7,078→7,108 triangles、12 meshes維持**。装填のwood／metalは既存wood／trim batchへ重ねた。飛翔用の共有矢は22→30 trianglesで2つのinstanced meshを保持する。頭部・顔・UV・肌・cape・会話・UI・音は変更していない。

## 検証と残る制限

作者の14必須commandが全成功、npm test **279／279**、wall **63.947秒**。main-runtime、v31の接点・30／60／120 Hz・保存4phase、装填45surface poses、実演算予算、v29接地、v30橋住宅、scene、journey／crossing／session、build／package／artifactsを含む。追加の120橋fixture×3頻度と、cache移動負例を強めたfocused testも成功。[コマンドと所要時間](evidence/projectile-extent-v33/gates.json)。

作者sourceの初期JS **164,679 B／165,000**、3 chunks、全JS973,761 B。単体版 **16,332,714 B／16 MiB**。v32側の確定増分309 Bとの単純合算は164,988 Bだが、実際の結合buildが必要であり12 Bの余白を大きな余裕とは扱わない。recipeとanimationRecipeのprovenance hash／bytesを両方実sourceへ更新した。

最初のcompileまで161.139秒、そこからsource修復までのwall1,030.935秒。依存準備・読取・確認を含む時間で、専有編集時間は不明。新規媒体制作0、親の結合時間は別計測。[時間記録](evidence/projectile-extent-v33/timing.json)。

[独立レビュー](evidence/projectile-extent-v33/independent/REVIEW.md)も必須source blocker無しで確定した。実2射×3頻度、同frameのScene instance尾端、35 physics cases、60橋軌道、48本予測、3つの意味論負例を確認。最終90姿勢／うち30姿勢の手・弦surfaceは身体交差0、45装填姿勢の許容nock接触は最大11.37 mmで、それ以外のsurface交差0だった。許容部の交差はJSONへそのまま保存し、矢と指の完全な非交差とはしない。reviewは指定25分を超過したため、任意検査を停止し、その超過も同報告へ記録した。

正式WebGL画面、自然な動作、矢の実寸感、FBO／GPU／実機FPS、触感、PS4相当の全画面品質は未確認。弓は剛体で、装填への手運びや反射も解析的な簡略動作が残る。次の矢の美術単位では同じ視距離で実寸・投影サイズ・VFX可読性を比較する。期限2026-09-20と全画面の目標を、この数値検査の成功へ置き換えない。
