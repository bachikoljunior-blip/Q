# Mira 全人物の資料・組立台帳 v64

旧 103 行 / 250 配置は再計算と全行の参照整合が一致した。ただし人物全体の網羅、103 個の独立形状、資料完備、組立済みを意味しない。新 3D 制作は停止したまま。

| 区分 | 旧型行 | 配置 | 固定基点の画像あり | 固定基点の画像0 | 後発資料含む画像あり | 後発資料含む画像0 |
|---|---:|---:|---:|---:|---:|---:|
| head | 30 | 62 | 5 | 25 | 6 | 24 |
| cloth | 34 | 79 | 3 | 31 | 5 | 29 |
| hands | 10 | 56 | 0 | 10 | 0 | 10 |
| boots | 11 | 34 | 0 | 11 | 0 | 11 |
| staff | 18 | 19 | 18 | 0 | 18 | 0 |

「画像あり」は raw 存在のみ。F17 は側面不整合、P04 は RB 部分のみ、S05 は平たい帯の参考のみ。全角度・全配置の完了数には使わない。後発 P02 の raw はあるが、作者条件付きと独立の接合検証を区別する。

頭の不足・分割案は 40 leaf 型 / 80 配置。旧全体へ数だけ代入すると 113 行 / 268 配置になるが、ズボンと cape HEM の不足を含まない未完成案である。新 head leaf ID 40 は列挙したが、増分配置の ID は未提出なので null を残す。

全型一覧（既存原画を別型へ無根拠に使い回さない）

| scoped ID | 名称 | 配置数 | micro 原画 ID |
|---|---|---:|---|
| head:F01 | forehead | 2 | head-cheeks |
| head:F03 | temple | 2 | **0** |
| head:F05 | malar cheek | 2 | head-cheeks |
| head:F07 | lower cheek | 2 | head-jaw |
| head:F09 | jaw corner | 2 | head-cheeks |
| head:F14 | nasal ala | 2 | **0** |
| head:F11 | chin | 1 | head-jaw |
| head:F12 | nasal bridge | 1 | **0** |
| head:F13 | nasal tip | 1 | **0** |
| head:F16 | upper lip and philtrum | 1 | **0** |
| head:F17 | lower lip | 1 | postbase-lowerlip |
| head:S01 | front scalp | 1 | **0** |
| head:S02 | crown | 1 | **0** |
| head:S-SIDE | side scalp | 2 | **0** |
| head:S05 | rear scalp | 1 | **0** |
| head:A01 | helix and antihelix | 2 | **0** |
| head:A02 | concha and tragus | 2 | **0** |
| head:A03 | earlobe | 2 | **0** |
| head:E01 | eyeball | 2 | **0** |
| head:E02 | iris and pupil | 2 | **0** |
| head:E03 | upper lid | 2 | **0** |
| head:B01 | eyebrow | 2 | **0** |
| head:N01 | front neck transition | 1 | **0** |
| head:N02 | rear neck transition | 1 | **0** |
| head:HT01 | raised swept forelock | 6 | **0** |
| head:HT02 | broad shallow top overlap | 4 | **0** |
| head:HT03 | short side fall | 4 | **0** |
| head:HT04 | ear-edge tapered terminal | 2 | **0** |
| head:HT05 | posterior crown flow | 4 | **0** |
| head:HT06 | nape taper | 4 | **0** |
| cloth:T01 | front centre panel | 2 | cloth-first3 |
| cloth:T02 | rear quarter panel | 2 | **0** |
| cloth:T03 | underarm side panel | 2 | **0** |
| cloth:T04 | shoulder bridge | 2 | **0** |
| cloth:T05 | armhole gusset half | 4 | **0** |
| cloth:S01 | upper sleeve front | 2 | **0** |
| cloth:S02 | upper sleeve rear | 2 | **0** |
| cloth:S03 | outer elbow fold | 2 | **0** |
| cloth:S04 | inner elbow gusset | 2 | **0** |
| cloth:S05 | forearm sleeve front | 2 | cloth-first3 |
| cloth:S06 | forearm sleeve rear | 2 | **0** |
| cloth:C01 | front stand-collar half | 2 | **0** |
| cloth:C02 | rear stand collar | 1 | **0** |
| cloth:W01 | front cowl fold | 3 | **0** |
| cloth:W02 | side cowl bridge | 2 | **0** |
| cloth:W03 | rear cowl fold | 3 | **0** |
| cloth:P01 | cape rear panel | 2 | cloth-first3 |
| cloth:P02 | cape side panel | 2 | postbase-cloth-adjacent |
| cloth:P03 | cape front-edge panel | 2 | **0** |
| cloth:P04 | cape shoulder connector | 2 | postbase-cloth-adjacent |
| cloth:L01 | lower front panel | 2 | **0** |
| cloth:L02 | lower rear panel | 2 | **0** |
| cloth:L03 | lower side insert | 2 | **0** |
| cloth:L04 | split-edge turnback | 2 | **0** |
| cloth:L05 | hem turnback | 6 | **0** |
| cloth:B01 | belt segment | 4 | **0** |
| cloth:B02 | hanging belt tail | 1 | **0** |
| cloth:B03 | hardware ring | 2 | **0** |
| cloth:B04 | buckle pin | 1 | **0** |
| cloth:F01 | cuff front half | 2 | **0** |
| cloth:F02 | cuff rear half | 2 | **0** |
| cloth:F03 | cross-wrap ribbon | 6 | **0** |
| cloth:F04 | brooch centre | 2 | **0** |
| cloth:F05 | brooch rim | 2 | **0** |
| hands:AH01 | 掌中央曲面 | 2 | **0** |
| hands:AH02 | 手背中央曲面 | 2 | **0** |
| hands:AH03 | 母指球・橈側曲面 | 2 | **0** |
| hands:AH04 | 小指球・尺側曲面 | 2 | **0** |
| hands:AH05 | 通常指間の鞍形曲面 | 6 | **0** |
| hands:AH06 | 指節の短い開放ロフト | 18 | **0** |
| hands:AH07 | 指先・指腹の終端ロフト | 10 | **0** |
| hands:AH08 | 爪板の薄い曲面 | 10 | **0** |
| hands:AH09 | 母指と示指の第一指間 | 2 | **0** |
| hands:AH10 | 手首の短い皮膚スリーブ | 2 | **0** |
| boots:AB01 | 本底 | 2 | **0** |
| boots:AB02 | 踵ブロック | 2 | **0** |
| boots:AB03 | 甲の曲面 | 2 | **0** |
| boots:AB04 | 爪先を包む曲面 | 2 | **0** |
| boots:AB05 | 内外の腰革曲面 | 4 | **0** |
| boots:AB06 | 踵後面の曲面 | 2 | **0** |
| boots:AB07 | 足首から脛の筒 | 2 | **0** |
| boots:AB08 | 靴の履き口折返し | 2 | **0** |
| boots:AB09 | 巻き革の帯 | 6 | **0** |
| boots:AB10 | 底周囲の細い縁帯 | 2 | **0** |
| boots:AB11 | 踵底の留め釘頭 | 8 | **0** |
| staff:S01 | tapered wooden shaft | 1 | staff-shaft |
| staff:S02 | foot ferrule sleeve | 1 | staff-shaft |
| staff:S03 | ferrule bottom disc | 1 | staff-shaft |
| staff:S04 | plain leather grip under-sleeve | 1 | staff-grip |
| staff:S05 | crossed grip strips A/B | 2 | staff-strip-blank |
| staff:S06 | neck collar / shaft socket | 1 | staff-collars |
| staff:S07 | lower lantern cup | 1 | staff-cup-ring |
| staff:S08 | lower cage ring | 1 | staff-cup-ring |
| staff:S09 | left cage rib | 1 | staff-ribs |
| staff:S10 | right cage rib | 1 | staff-ribs |
| staff:S11 | front cage rib | 1 | staff-ribs |
| staff:S12 | back cage rib | 1 | staff-ribs |
| staff:S13 | upper cage ring | 1 | staff-caps |
| staff:S14 | upper cap | 1 | staff-caps |
| staff:S15 | small round finial and stem | 1 | staff-finial |
| staff:S16 | warm pale lantern glass/core | 1 | staff-glass |
| staff:S17 | lower bronze grip-end collar | 1 | staff-collars |
| staff:S18 | upper bronze grip-end collar | 1 | staff-collars |

各型の旧配置・向き・骨・仮寸法・全 250 配置は ledger.json。既知の数値接合と未定の全身接合は ASSEMBLY_INTERFACES.json。GAPS_AND_REVISIONS.json は不足、旧 ID の保存、頭の alias と leaf の分離を収録する。

## 次の資料を受け取る条件

1. exact file / SHA256 / 型 ID / 対象配置・左右 / 採用した view / 棄却した view を登録する。生成予定・prompt・作者自己評価だけで画像0を解除しない。
2. 各型について正面・背面・左右・必要断面の形、裏面と隠れた接続を確認し、欠けた角度は未定とする。対称型でも左右の材質・骨・法線・巻き方向を明示する。
3. 完成像への位置・層順・隣接と部品境界を固定する。写真のラベルから精密 camera / mm は決めない。見えない構造の作者設計は分離して明記する。
4. 旧 103 行を全型と見なさず、頭の追加 leaf、ズボン、cape HEM の coverage gap が閉じてから全体資料完備を判断する。

## 限界

今回の独立監査は出所既知の設計整合・原 byte 台帳。新規 native render / WebGL / 美観採点 / PS4・iPhone SE3 性能判定ではない。元画像は加工していない。過去の部分 native 検査はその範囲だけを参照し、全人物完成へ外挿しない。

左右は資料計画の本人右 −X / 本人左 +X / 顔前 +Z / 上 +Y を用いる。古い変数名 right/hand-1 を人物左右の正本にしない。

計測スクリプト時間は読取・再集計の CPU/IO 時間だけであり、画像を読む・判断・記録する実作業時間とは別。
