# v33 人物衣服の表面・UV 診断

基点 `fb07441c63cc8e7c985972691eccaed0e1fa50b3`。実装なし。会話で露出する胴・袖・外套について、写真素材の追加より先に **衣服の UV の物理スケールを整える** 有限案が成立する。写真候補は一つに限定して合法な原ファイルを保持したが、現容量上限には適合せず、そのままの runtime 導入は非採用とした。画面品質・PS4 到達の判定ではない。

## 現行 source の具体的な不足

`detailed-geometry.js` SHA256 `a320835670bd43147e793651834034a87ad23d16f87c191b412a5de881a17849`。64×64 RGBA 手続き模様を `bumpMap` と `roughnessMap` に共用し、すべて repeat(4,4)。色は役ごとの定数で、衣服の albedo bitmap はない。5種の microtexture は各 21,844 B、計 109,220 B の RGBA8 全 mip 理論量。実 GPU 使用量ではない。

cloth の式の周期は4 texels、したがって 1 UV に64周期。普通の cape は幅0.53→0.93 m、丈1.15 mへ0..1 UVを割り当てるため、軸方向の名目模様周期は横 **8.28→14.53 mm**、縦 **17.97 mm**。同じ裾へ柄が1.75倍広がる。折り込みを含む独立 triangle Jacobian の計測は次のとおり。

| player の部位 | 面積換算 texels/m | 問題 |
|---|---:|---|
| 胴 | 271.3 | 各 ring 帯の meridian 密度224.9–519.9 |
| 袖 | 443.6 | cape より1.68倍細かい同一模様 |
| 脚 | 397.8 | 各帯243.2–706.1 |
| cape | 264.1 | 幅と長さに対する密度が異なる |
| 革 belt | 別途 JSON | 長さ0.068 mと周長約1.26 mへ1×1 UV。伸びの中央値19.58:1、p95 20.93:1 |

`shell()` の V は `j/(rings.length-1)` で、物理長で決まらない。胴の ΔY 0.03–0.14 mへ同じ ΔV=.125 が割り当てられる（Y距離だけなら密度4.67倍差）。衣服主部の zero UV triangle は0。cape の192面は chart 全体が一様に負巻きであり、局所的な UV 折返しとは区別する。別部品の繰返し UV 同士の重複は意図的なので、全材質を一つの atlas として扱う overlap gate は不適切。

材質分類も流用されている。髪・眉・ひげ、paper、wolf fur は cloth の同じ模様、wood/杖/弓/木道具は leather の同じ模様を参照。cloth の roughness平均は **0.939022**、範囲0.878431–1.0で、hairにも同じ反射特性・DoubleSide・bumpScale .0014が及ぶ。革の分類を一括置換すると木にも影響する。衣服材を役別に保ったまま、対象部品の境界で導入する必要がある。

頭は v28 の原 atlas UV、smithのみ別 skin bitmap を使う。今回の衣服メートル UV を頭/まぶた/手/皮膚へ適用してはいけない。正確な全役・実部品の計数、元 source hash、方法、再現 script は `uv-audit.json` / `uv-audit.mjs`。

## 写真候補一つ：Cotton Jersey — 今回は非採用

[Poly Haven 公式 asset](https://polyhaven.com/a/cotton_jersey) は colormass の撮影、Rico Cilliers の処理を個別に表示する。物理 tile は保存済み公式 metadata で **263.603×263.800 mm**。ベージュの jersey knit であり、歴史的な毛織物の実証ではない。[公式ライセンス](https://polyhaven.com/license) は CC0 と商用・再配布の許可を明示。2026-09-16に asset/license ページを再確認した。

以前の正規取得ファイルを全 bytes 再 hash・公式 MD5/size と照合し、この study の `source/` へ無変更で保全した。重複ダウンロードなし。最小公式解像度は1K、実画像は **1024×1025**。今回 API の web reader は files/info 両方で `not safe to open (non-retryable error)` のため、別経路へ移して再試行しなかった。既取得の公式 metadata と今回読めた公開ページの範囲を区別する。

| 原ファイル | bytes | SHA256 |
|---|---:|---|
| `cotton_jersey_diff_1k.jpg` | 581,360 | `0f1b790e4087223275aaa6fdffdd46a556a26d2af72cd811acf72ba9c21ec1f6` |
| `cotton_jersey_nor_gl_1k.png` | 5,460,045 | `d2d3bf79f2dd4214d8efa4c82bec9ce5ef409daea33b7d3add10d4fed08bb5a4` |
| `cotton_jersey_rough_1k.png` | 1,979,369 | `4c44c3f0efa4d95ce9ee1c86aae12e6f3ac22a46b4c7ee9bc2c55804a7946c41` |

Diffuse は RGB8、normal は RGB16、roughness は gray16。PNG を含む3-map原セット **8,020,774 B**。公式 JPEG normal/roughness の無変更代案も保持し、全5画像 **9,564,708 B**。JPEG 3-map でも **2,125,294 B** で上限外。詳細 URL/MD5/全 hash は `material-source-analysis.json`。

1画像だけでも RGBA8 全 mip は **5,596,500 B**、3画像なら **16,789,500 B**。今回の追加枠 **160,000 B / mip 1,398,100 B（512² RGBA8 全 mip 相当）**を超える。Diffuse単独の base64 は775,148 Bで v30 standalone余白449,805 Bも超える。縮小・crop・retouch・channel packing・生成・encode変更は実行していない。

写真 albedo の線形 RGB平均は **[.54036,.40525,.33728]**。役の現在色へ無条件に乗算すれば暗く暖色寄りに変わる。全役の衣装を同じベージュに置き換える案ではない。原 roughness平均 **.801654**、約16.5 mmの64px block平均は **.800038–.802770**で、広いシミ/摩耗の変化は小さい。細部が minify されれば主な差は平均反射特性になり得るが、描画していないので知覚効果は断定しない。

画像の高周波 power peak は tile 横318/縦263周期、physical metadataとの対応は約 **0.829/1.003 mm**。これは画像の周波数分析であり糸を現物測定した値ではない。現行模様の8–18 mm周期より細かく、512へ縮小した場合の解像・aliasing・normal精度は別検証が必要。写真という出所だけで低解像への変更を合格にしない。

技術的接続では color mapをsRGB、normal/roughnessを非color dataとして扱う。normalMap指定は既存 bumpMap に優先し、roughnessMapは green channelを使用するため、画像を同じslotへ入れるだけでは packed channelを正しく使えない。[Three.js公式材質仕様](https://threejs.org/docs/pages/MeshStandardMaterial.html)

## 次の一有限実装案

**まず通常 cape の UV だけを、元の全position/index/骨・motion・材質色を固定して実寸へ補正する。** 同じ player/NPC/scout/ranger の既存 cape mesh が対象。前後比較は同 root/pose・同角度、UVの principal伸びと実 texel/m・seam・motion保存で行う。動的 cape は既に独立 draw なので、新しいmeshや骨を足す必要はない。共有 cloth texture の repeat を変えて髪/paper/furまで巻き込まない。

独立 in-memory 比較では、横 ring arcを中心化し縦meridianを累積した meterUV 案で cape のp95伸び **2.02→1.17**。脚・belt等にも数値改善余地はあるが、初単位へ追加しない。胴へ一律 ring arcを使うと首付近でshearが増しp95 **3.11→4.60**。胴は別の固定基準周長方式なら **2.03**だが、閉管のUV seamにおける柄の位相と縫目位置が別の条件になる。衣服全部への機械的適用はしない。

必要変更箇所は `src/assets/characters/detailed-geometry.js` の `cloakGeometry` UV と必要最小の衣服専用定数、対応 `detailed-provenance.json` recipe hash、focused UV/動的cape回帰test、同条件証拠。初期JS165,000 B/3chunks/actor8,000tri・14drawは固定。旧微細柄の平均物理スケールは維持して伸びを減らし、未知の写真縮小をこの修復へ混ぜない。

写真導入は別単位。原画像を保持したまま、160KB/1,398,100Bに入る派生作成法を明示してから元mapとの誤差・pixel周波数・色・normal・roughnessを比較する必要がある。画像編集の未承認方法は実行しない。原mapの取得待ちは UV 不具合修復を妨げない。

容量見積りは449,805 Bからface約94,000 B・bow約4,000 Bを予約して **351,805 B**。160,000 Bのbinary素材は standaloneで213,336 Bのbase64となり、dialogue/code/markup用に残るのは **138,469 B**。これは予約概算で、v32結合後のartifact実値に置き換える必要がある。

## 証拠範囲・保存状態

CPU測定・原画像の検査のみ。repo/build/remote/Site変更、WebGL/実機画面、画像編集、追加morphはなし。開始後の有限作業時間は終報に記録。原素材転送は前単位の取得で今回再転送0、今回copy/hash/画像数値処理は0.791秒。独立UV計測は04:36:37–04:41:30 UTC、有限report完了は04:44:44 UTC。最終的な perceptual acceptance は正式描画で未確認。

顔 commit `5ff16b9a0e331245db00067b88d8045fb201c734` の tracked 差分は0。旧未追跡2ファイルが再観測されたため削除せず、SHA/bytes/mtime/ctimeとruntime未参照・tool状態を `face-obsolete-readonly-check.json` に記録。原因は未確定で、今回のsource修復や実装として扱わない。
