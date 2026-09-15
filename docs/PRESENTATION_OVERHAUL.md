# 全モデル・動作・タイトル・音響の改修 — 2026-09-15

直接指定は「全てのモデルとアニメーションとリアリスティックに凝って。タイトル画面がワクワクしない。サウンドも豪華にして」。本番の全分類を棚卸しし、同じゲームの造形・動き・演出を改修した。新しい地域・敵・vaultを増やす作業ではない。開始mainは `0a1d905ff9000976d143baac630dbde60fe676e3`。全検証とUltra担当の実受理IDは [統合evidence](evidence/presentation-overhaul-20260915.json) に記録する。

## 現行分類と変更

| 現行の分類 | 改修内容 | 残る簡略化 |
|---|---|---|
| 主人公1 / 武器3 | 成人の体格、顔・手足、布・革・金属の分離、関節付き単一skin、装備・背面の細部 | 単一joint weight、表情芝居なし |
| 名前付きNPC9 | Mira用npc、sena、smith、healer、patient、porter、scout、traveler、courierを個別recipeへ接続。役割別服飾・装具 | facial animation、会話motion captureなし |
| 狼15 / 騎士15 / 射手3 / boss1 | wolf/soldier/ranger/bossの骨格・解剖方向の形状・装甲・武器を再制作 | authored low-poly、写真的な毛髪・皮膚ではない |
| 騎士に含まれる番人4theme | 骨に接続した固有装具、sealed姿勢、旧浮遊装具との二重表示除去 | 超自然表現は発光geometry |
| idle / walk / run | 呼吸・重心、移動距離を基にするstride、膝曲げと地面近傍の2-bone IK | 全身物理solver・完全な足固定ではない |
| windup / strike / recover / weapon attacks | 剣・槍・大剣別に腕・胴・足を協調。parry/drink/dodge/airborne/hitも接続 | procedural pose interpolation、motion captureではない |
| death / saved dead / sealed | 生存→死亡は1.2秒の倒れるtail、その後非表示。保存済み死体は再生せず非表示 | corpse physicsなし |
| 地表・山・岩・川岸 | earth/path/salt/wet、層状の山・不整形岩、粗さと表面relief | height fieldと衝突形は維持 |
| 樹木・草・水・橋 | 根張り/枝/松whorl/広葉樹、草の節、波/流れ、板/筋交い。tree近遠LOD | LODのfadeなし、実流体/反射屈折なし |
| 村の家・遺構・灯火 | 漆喰/木組み/石、重ねたslate屋根・窓、分割arch、火鉢、空と照明 | volumetric ray marchingなし |
| 村・遠征小物 | 板舟、布tent、車輪cart、chest/crate、複葉herb、lantern、bell/clapper、shrine、forge/anvil、saltgate/cistern、jobboard、cargo、winch/ropedrum | 小物の衝突・遊びの範囲は既存 |
| gathering / vault | crate/herbpot/lantern、四vaultの壁・火鉢・stele・地面に沿うaltar | 屋根のない既存vault範囲 |

旧CC0 GLB3ファイルと出所・decode試験は保存した。本番actorは全て新recipeとなり、GLBを配信しない。元のtree/grass/particle配置のseed・matrix hashは固定し、地形height、衝突、進行、save schemaを変更していない。

## タイトルと音

タイトルは灰の巡礼の人物、剣、北門、王冠を描いたオリジナル生成画をWebPへ派生し、字体、光、灰、控えめなpointer parallax、開始/続き、音を入れる操作を構成した。これは **イラストを用いるopening** であり、実ゲームのcaptureや新たなrealtime title sceneではない。既存game sceneはstart後に遅延loadする。portraitは人物と王冠が残る右寄りcrop、低いlandscapeはheight-fit、44px controlsとscroll fallbackを使う。reduced-motion/hidden/blur/pagehideでは装飾RAFを停止し、復帰時の重複を防ぐ。実画面のlayout検証はできていない。

音はオリジナル合成音楽。80 BPM、D minor、16小節48秒のharmony/motif/pulseをtitle/exploration/combatでmixする。24cue atlasにUI、移動のearth/stone/wood/water、武器/戦闘等を収め、既存vault環境音も維持した。scoreはgestureでunlockする。音量/音楽/mute、fade、spatial pan、距離による歩音、voice上限36、decode cache24MiB、取消revisionと遅いoneshot破棄、hidden時のloop停止を接続した。録音orchestraや実楽器とは称さない。

## 出所、時間、bytes

- 人物はproject-original geometry/material recipes。[actor provenance](../src/assets/characters/detailed-provenance.json)、[制作時刻](evidence/actor-overhaul-20260915.json)。初回素材546,468.683 ms、組込/手戻り472,806.164 ms、最終focused検証934.498 ms。
- 環境はproject-original geometryと8枚128²RGBA mathematical DataTexture。base pixels524,288 B。[素材hash・全graph](evidence/environment-v22.json)。初回素材381,232 msだけ測定し、後の素材手戻りは組込/試験と混在したため完全なT_assetはnull。
- タイトルは専用imagegen原画1672×941 PNG2,222,845 B、配信用WebP162,962 B。元PNGはGit保存し配信しない。生成31.073 s、初回importまで109.113 s、WebPまで約153.522 s。[出所・hash・構成](TITLE_CINEMATIC_V22.md)。
- 音は自作決定的generator、3 MP3 + WAV1,499,890 B、24cue。[出所hash](../src/assets/soundscape/provenance.json)、[素材制作127,652 ms](evidence/audio-production-20260915.json)、[PCM QA](evidence/audio-signal-qa-20260915.json)。decoded source peak約0.740–0.742、clipping0。48秒review MP3はoffline music mixでありゲーム実録ではない。

初期JSは旧141,158 B→161,642 B。scriptだけにあった150,000 B転送guardを165,000 Bへ明示変更した。AGENTS/COMPLETION/ユーザーの固定受入基準ではないことを確認し、Three/worldの遅延load・3 chunk・modulepreloadなしの検査を保持する。固定端末性能の受入を下げたとは扱わず、未確認のまま残す。standaloneは旧4,471,098 B→4,298,574 B。新binary配信5個1,662,852 B、既存vault14個891,845 B。source/dist/stage/standaloneのhash一致を検査した。

## 同条件で取れた証拠と限界

[旧scene](evidence/presentation-baseline-20260915.json) と新sceneは本番Three graphをNodeで構築した。旧all-instance triangle上限365,549に対し新highの4固定座標は804,888–814,998、medium704,352–709,296、low680,822。全非表示装備やculling前geometryを含む上限で、実描画triangle数/FPSではない。mesh objectsは1,721→1,576、unique geometry338→723、light12を維持、shadow light1。tree LODで候補初期の1,636,958上限から削減したが旧版より重い可能性は残る。CPU texture base pixels589,824 B、mipmapは別途約1/3。実GPU memoryとshader compileは未測定。

新decoded音素材は18,587,052 Bを保持する。48 kHz decoderから22.05 kHzへcompactし3stemを直列decodeして、24MiB cacheによる先頭stemの退避を防いだ。48/96 kHzの一時stereo48秒bufferは18,432,000/36,864,000 Bに加え既保持分・変換先8,467,200 Bが必要で、実機peak/GCは測っていない。

正式managed previewは監督mailbox不在で終了。別server/URL/browser/CI rendererで迂回せず、前後gameplay画像、音実聴、物理touch、実機FPSの証拠は取得できなかった。独立Ultraは出所・自己評点を渡していない原画を評価しportrait cropを指摘、修正後は別工程でcode/lifecycleをレビューした。準備中の音ボタン再クリック取消と、titleを表示する前の1×1 canvas activationを修正し、最終technical GO。これは完成ゲームの知覚品質判定ではない。

207/207 test、main16/3fault/6detection、gathering4/8launch/8reload/7fault/28detection、vault8+8freshreload、journey119秒、forge103秒、session108,000step/138reload/81objective/0death、crossing/expedition、combat9、touch20+20、全build/package gateを通した。模擬境界は [検証工程](AUTONOMOUS_VALIDATION.md) に明記する。

期限2026-09-20と固定10作品目標は維持し、判断はNO-GO/evidence insufficient、完成受入0/7・formal比較0/10。今回の造形/音響に集中した作業時間と原画評価を完成速度や品質改善率へ外挿しない。
