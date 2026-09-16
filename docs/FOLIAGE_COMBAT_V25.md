# 写真枝葉・連続する人物・実武器の軌跡 — 2026-09-16

ユーザーの「PS4相当の品質達成 これ達成するまで絶対止めんな」に従う継続制作の第2単位。現在のPR39候補 `bfc5d10d8b1042dc6063569a624c115b6c1e7833` を基点に、確定した地形・浅い水・安定した影を保持して結合した。人物、植生、攻撃の動作と演出を同じSceneViewへ実装したが、全画面のPS4知覚品質は未達・未確認である。

## プレイヤーが見る変更

- 805本の同じ配置の木で、塊状の樹冠を本物の針葉・広葉写真を透過切抜きした枝群へ変更。小さな幹・枝から葉が広がり、近距離と遠距離の形状を切り替える。色、深度影、点光源影へ同じ風・alphaを適用する。
- 兵・番人・狼の予備動作から攻撃と戻りへ一続きの保存済み時間で姿勢を進める。足元を固定した重心移動、左右の肘・手首を固定長で解く両手持ち、槍と大剣の方向、霊薬の戻りを修正する。装備のために腕を伸縮しない。
- 全体時刻で回っていた平たい輪を削除し、動いた武器そのものの軌跡へ細く先細りする残像と短い輝きを付ける。剣・大剣・槍の実形状と保存されたrelease区間へ追従し、止まる・死ぬ・旅する・新しく始める境界で古い帯を消す。

ゲーム進行・命中時間・入力・保存形式は既存契約を使う。既存のタイトル映像・音楽・効果音・HUD・地形/水/照明も維持する。今回の強化はそのうち植生、人物の動作、攻撃VFXの三領域であり、顔や建築、空の写実完成を含む主張ではない。

## 同じ条件の証拠

| 項目 | 以前 | 候補と境界 |
|---|---|---|
| 兵の60Hz最大刃先ジャンプ | 3.058962 m | 0.308100 m。同じroot・geometry・保存時間のCPU座標 |
| 兵の肩の切替角 | 1.682980 rad | 0.146634 rad |
| bossの最大刃先ジャンプ | 7.031827 m | 0.574133 m |
| 狼の首の最大切替角 | 0.729978 rad | 0.014146 rad |
| 大剣の最も低い刃先 | 地面から −0.817826 m | +0.743951 m。同じ平地の9攻撃サンプル |
| 両手持ち | 手と柄が最大0.875767 m離れる | 柄表面への意図的offset約0.013 m。固定長腕IKのtarget誤差は数値精度内 |
| 森の描画構成 | 同じ805配置、近遠6mesh | mesh/pass追加0。4固定位置でlow −6,114tri、high +202〜16,870tri。樹木geometry buffer37,592→45,184 B |
| 武器残像 | 固定平面の輪 | 1draw、最大184tri、geometry5,136 B、全専用typed array7,920 B、追加media0 |

369の実skin済み頭・首・胴体と刃中心線の標本で交差0。これは全体積・衣装・環境の完全な衝突自由の証明ではない。27姿勢で2,250の足支持点対を調べ、支持誤差と滑りは数値精度内。詳細は [人物](ACTOR_MOTION_V24.md)、[植生](FOREST_FIDELITY_V24.md)、[軌跡](WEAPON_TRAILS_V25.md) に各担当の修正・測定・原記録がある。

独立Ultraは実際の非同期 `createSceneView` と `Game.tick` を結合して検査した。forest loaderが返した同じTextureが近遠4mesh×色/深度/点影3pathへ届き、6品質/位置条件でも維持された。実装からinstallだけを除く負例は同じ検査で拒否された。実Game固定60Hzに対してSceneを30/60/120Hzで更新する3武器9条件で99/99release更新に残像があり、不要なreset0。同じframeの武器座標を描画呼出し前に独立再構築した407照合は誤差0だった。停止、タイトル、死亡、camera snap、予告なし100m移動、新規ゲームの消去も成功。これは実SceneViewのCPU接続であり、loaderとrendererは明示的な境界doubleで、画像decode・Canvas・GLSL実compile・WebGL画面・実frame pacingではない。

## 素材・手戻り・工程

写真はPoly HavenのCC0 [Pine Tree 01](https://polyhaven.com/a/pine_tree_01) と [Shrub 04](https://polyhaven.com/a/shrub_04)。原JPG4枚1,157,422 Bをsourceとして保持し、実行時は派生512RGBA PNG2枚327,978 Bだけを遅延sceneへ含める。元写真、作者、変換手順、license URL、source/派生/generatorのSHA256は `src/assets/forest/provenance.json` へ保存。全mipの画素配列は2,796,200 B、fallback43,688 B。ブラウザdecoded image/Canvasの一時メモリとGPU overdrawは未計測。

独立した実asset画像点検で色縁を発見し、RGB各channelの最大化を止めて近傍の写真RGBベクトルを使う透明縁へ修正した。Canvasが透明RGBを失うためdecode後と全mipへ縁の色を復元する。Threeのcolor varyingがvec4である点も修正済み。見た画像は素材PNGでありgameplay screenshotではない。人物では届かない補助手、頭/胴の交差、霊薬切替の手首・肘の飛びを独立reviewから修正した。統合時の古いslashテスト参照は新しいweaponTrails mesh参照へ更新し、静的transformの期待値は緩めなかった。

源素材の調査開始・最初の造形全時間は独立timerがなく欠測。forest生成・再生成とcode検証を分け、actorは01:30:03.673→01:35:21.240の初回317.567 s、review修正820.946 s、最終source検証窓65.858 sを担当文書へ記録した。工程は並列であり合算を制作速度としない。旧方式の等しいscope全時間がないので改善倍率は算出しない。最終結合必須gateの実時刻・wall timeは `docs/evidence/foliage-combat-v25-validation.json` に記録する。

## 統合・継続判断

通常GitHub CIとPR merge、同じowner-only Siteへ反映する。PR39は01:51 UTC頃の通常merge要求がtimeout、実readbackで未merge確認後の再要求は405 Merge already in progress。02:04時点でもPR open/main547676fで、未完了要求を重複発火せず読み取り追跡中。これを配信遅延の具体的な証拠として扱い、未確認main/Site成功を記録しない。

着手直後と統合前の期限2026-09-20判断は **NO-GO / evidence insufficient**。残る写実anatomy/表情/衣装、建築/小物、空と環境光、複数章/地域・演技、正式全画面/音・touch/実機・外部比較と配信の所要時間について、完成を根拠付きで見積もれる証拠はない。構造と試験数の増加だけで写実性を得る前提を疑い、今回は同じ木の写真切抜きと同じ保存攻撃の姿勢・実軌道を測る方法を採った。CPU誤差が小さくても知覚採用はまだ確定できない。

公式previewはmanaged-linux / configured:false、監督mailbox不在。別server/browser/CIへの迂回や人間の準備待ちへ変更せず、実行可能な制作を続ける。Qの既存定期再開は20件上限で有効化拒否、最新継続promptだけは正確に保存され、disabled / next_run nullのまま。他task・schedule・timezoneは変更していない。現在ACTIVEの実作業と将来の自動起動保証は区別する。

この単位が配信されても完成扱いにせず、次は同じ人物UVで使える現実の表面素材と、同じ太陽方向へ揃う実天空/光の導入を調査・測定して具体的な次単位を選ぶ。正式描画が回復したら同じsave/視点/端末条件のgameplay媒体を取得し、出所・自己評点を伏せた独立比較へ進む。未実施の比較を合格としない。

最終ローカル検証は18必須command・242/242 tests成功、wall 76.663秒。初期JS163,175 B（上限165,000 B維持）、3JS chunks、全JS854,704 B。単体版13,576,431 B、SHA256 `9c80c6c5e68e20b40ef2d143874d5e6a4f7c3215e94317df37c4b20856212507`。固定stageは32public filesで、source・build・stage・単体版のbytes一致を確認した。これはGitHub/Site反映前の実装検証であり、反映成功は実readback後に記録する。
