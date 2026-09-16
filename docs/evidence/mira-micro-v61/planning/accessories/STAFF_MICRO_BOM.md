# 杖：微小部品 BOM（最初の画像指定用）

造形・新画像生成は未着手。位置・寸法は既存約 1.701 m の杖へ登録した作者の設計値で、画像からの実寸測定値ではない。単位 mm、原点は石突き下面中央、Y 上・Z 人物前・X 人物横。完成高さ 1700。本人右は **hand-0 / −X / 正面画像左**、もう一方は空手。原画像を反転しない。

S01〜S18 を固定する（S05 は2本なので実19小部品）。S05 は A/B の逆巻き2本、S09〜S12 は前後左右の独立 rib。S15 は接写に見える球状 finial と短い軸であり、未確認の吊り loop は加えない。不可視の後 rib・内部 seat は設計補完で、資料に写っていた形とは区別する。

| ID | 小部品 | 形状・寸法 | 接合先 | 短時間で作れる理由 |
|---|---|---|---|---|
| S01 | tapered wooden shaft | bottom_radius=18; top_radius=21; y_min=30; y_max=1418 | S02 lower socket, y30–55; S04 grip sleeve, y1030–1240; S06 neck socket, y1394–1418 | One revolved profile with two radii and closed ends. |
| S02 | foot ferrule sleeve | y_min=4; y_max=55; outer_radius=22; inner_radius=18.5 | S03 bottom at y4; S01 socket y30–55 | One annular extrusion with top and bottom rims. |
| S03 | ferrule bottom disc | radius=22; thickness=4 | S02 lower rim at y4; ground datum y0 | One short cylinder; underside is flat. |
| S04 | plain leather grip under-sleeve | y_min=1030; y_max=1240; outer_radius=24; inner_radius=21.8 | S01 shared axis; S05-A/B lay on outer sleeve | One wrapped cylindrical shell; no hand or cuff included. |
| S05 | crossed grip strips A/B ×2 | y_min=1032; y_max=1238; centerline_radius=24.8; width=8; thickness=1.5; turns=1.8; handedness=[1, -1] | S04 outer surface; strip ends tuck under S17/S18 at y1032–1035 / y1235–1238 | Each is one rectangular-section sweep along a helix. Opposite winding makes the visible X pattern. |
| S06 | neck collar / shaft socket | y_min=1394; y_max=1432; outer_radii=[24, 26, 22]; inner_radius=21.2 | S01 wood seated y1394–1418; S07 cup seated y1427–1432 | A short three-step lathed profile. |
| S07 | lower lantern cup | y_min=1427; y_max=1448; outer_radii=[22, 24, 17]; wall_thickness=2 | S06 neck seat; S08 lower ring; S16 lower pole y1447 / cup lip y1448 | A short bowl-like revolved profile; internal seat is a plain construction surface. |
| S08 | lower cage ring | major_radius=17; tube_radius=3 | S07 rim; S09/S10 endpoints x±14; S11/S12 endpoints z±14 | One circular ring with a fixed small tube section. |
| S09 | left cage rib | section_radius=3.5; controls=[[-14, 1447, 0], [-57, 1487, 0], [-70, 1556, 0], [-57, 1625, 0], [-14, 1665, 0]] | S08 lower endpoint; S13 upper endpoint | One five-control-point sweep with circular section and closed endpoint caps. Each direction is its own part, not a mirrored reference picture. |
| S10 | right cage rib | section_radius=3.5; controls=[[14, 1447, 0], [57, 1487, 0], [70, 1556, 0], [57, 1625, 0], [14, 1665, 0]] | S08 lower endpoint; S13 upper endpoint | One five-control-point sweep with circular section and closed endpoint caps. Each direction is its own part, not a mirrored reference picture. |
| S11 | front cage rib | section_radius=3.5; controls=[[0, 1447, 14], [0, 1487, 44], [0, 1556, 55], [0, 1625, 44], [0, 1665, 14]] | S08 lower endpoint; S13 upper endpoint | One five-control-point sweep with circular section and closed endpoint caps. Each direction is its own part, not a mirrored reference picture. |
| S12 | back cage rib | section_radius=3.5; controls=[[0, 1447, -14], [0, 1487, -44], [0, 1556, -55], [0, 1625, -44], [0, 1665, -14]] | S08 lower endpoint; S13 upper endpoint | One five-control-point sweep with circular section and closed endpoint caps. Each direction is its own part, not a mirrored reference picture. |
| S13 | upper cage ring | major_radius=17; tube_radius=3 | S09–S12 upper endpoints; S14 top cap | One circular ring matching the lower cage attachment radius. |
| S14 | upper cap | y_min=1663; y_max=1678; max_radius=18 | S13 ring; S15 short stem | One short revolved cap. |
| S15 | small round finial and stem | sphere_radius=12; sphere_center=[0, 1688, 0]; stem_radius=6; stem_y_min=1674; stem_y_max=1681 | S14 cap, internal stem seat | One small revolved ball-and-stem profile. |
| S16 | warm pale lantern glass/core | radii=[52, 109, 39] | S07 lower pole y1447 / cup lip y1448; S14 upper pole y1665 / cap lower y1663 | One ellipsoid with both poles seated in the named cup/cap; no floating connector. |
| S17 | lower bronze grip-end collar | inner radius 23.8 / outer radius 27.5 / height 10; center [0, 1030, 0] | S04 lower sleeve end at y1030; S05-A/B strip end retention; named concealed seating only | One short annular extrusion with flat annular end faces; no curved cage or wood included. |
| S18 | upper bronze grip-end collar | inner radius 23.8 / outer radius 27.5 / height 10; center [0, 1240, 0] | S04 upper sleeve end at y1240; S05-A/B strip end retention; named concealed seating only | One short annular extrusion with flat annular end faces; no curved cage or wood included. |

生成順は S01–S08＋S17/S18 の軸/握り/台座、S09–S16 の灯具を分け、全部の原画像と接合面を揃えてから3Dを作る。部品の絵をモデルへ貼っただけでは組立完了にしない。詳細の軸・端点・出典 hash は STAFF_MICRO_BOM.json。

S05 交差部は上側 strip を厚みぶん退避させる。各 socket の意図した内部挿入は、可視面の貫通や不正な隙間とは分離して検査する。後の実装では同じ軸、4 rib の前後クリアランス、hand-0 の接触、実地表への石突き接地を確認する。現在は親の正式プレビューで WebGL context 作成が失敗しており、実 WebGL の外観/自然さ/端末性能は未確認。


追補：初回表で原 GRIP SECTION に見える上下の bronze collar を漏らしていたため、S17/S18 を追加した。S18 は巻革上端、S06 は離れた灯具首元の socket であり、同じ物として省略しない。23.8 mm 内半径と 24 mm 革外半径の 0.2 mm は内部座り代の設計値で、見える貫通を許す指定ではない。参照画像の実寸を推測で断定せず、資料生成と組立前の部品欠落検査を維持する。
