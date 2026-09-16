# 武器の動きに接続した残像 — v25 finite unit

担当 `/root/ultra_q_ps4_quality_continuation/combat_vfx_ultra`。基点は `547676fdce8d8e97abed9f065aad0b6e24af2fd6`、排他worktreeは `Q-vfx-v25`、branchは `feat/combat-vfx-v25`。新規 `src/weapon-trails.js` と焦点試験・本書だけを担当し、SceneViewへの接続、main・Site反映は単独統合writerが担当する。本書は反映完了の記録ではない。

旧slashは主人公位置に置いた水平RingGeometryを `this.t*10` で回転しており、描画された刃の位置・向きとは独立していた。新moduleは詳細actorの剣・大剣・槍の実weapon Boneを毎回読み、同一frameの親関節とrootのmatrixWorldを更新してから、geometry-localの点をworldへ変換する。剣と大剣は刃の先側に薄い面と細い光条、槍は実際の穂先断面と先端に細い突きの残像を置く。三武器のlocal点はactor担当と照合し、先端が実geometryに存在することを試験している。root角度からの擬似forwardベクトルやdamage reachへの拡大は行わない。

素材は標準MeshBasicMaterialの淡い灰白色、通常alpha合成、depth testあり・depth writeなし。透明の両面を一passで描き、影・新しいlight・texture・postprocessingは追加しない。二つの帯は一meshにまとめ、各断面の端を透明に、古い端を一点へ絞り、年齢に応じて幅とalphaを落とす。保存されたhit時刻付近の控えめな明度変化は振りの強調であり、敵へ命中したという偽のeffectではない。既存hit/kill効果やdamage・判定・保存は変更しない。

時間は保存されたattackDuration/attackとweapon hitTimeから取る。v24 actorの `motion.combat.releaseStart/releaseEnd` を使い、そのrelease区間だけを1/120秒間隔で補間・蓄積する。現frameの最新断面は実weapon transformをそのまま使う。旧base actorのみの場合はその `.38→.58` release phaseへ対応するfallbackを使う。大きな時間・root・装備transformの飛び、巻戻し、combo/武器/期間/actorの切替はhistoryを破棄し、二つの不連続な位置を帯で結ばない。高頻度updateで同じ60Hz gameplay状態を再び読む場合はhistoryを増やさない。

pauseのdt=0、inactive view、死亡、非表示、攻撃終了・中断も即時clearする。`reset(reason)` はload/travel/title等の既存lifecycle境界から明示的に使える。途中保存からの初回は一点だけを置き、過去の振りを捏造しない。`dispose()` は所有するmesh/geometry/materialを一度だけ解放する。

## 構造上の上限と検証

| 項目 | 値 |
|---|---:|
| 予約断面数 | 24（履歴最大23＋現frame1） |
| geometry頂点 / 三角形上限 | 144 / 184 |
| mesh / material / geometry | 各1 |
| 透明draw call上限 | 1（構造値、実GPU計測ではない） |
| position / RGBA / index配列合計 | 5,136 bytes |
| CPU履歴を含む全専用typed array | 7,920 bytes |
| texture / media追加 | 0 / 0 bytes |
| 残像寿命 剣 / 大剣 / 槍 | 105 / 135 / 85 ms |

`node --test tests/weapon-trails.test.mjs` は6/6成功。三武器の実geometry先端と同一frame transform、独立30/60/120Hz入力の線形軌道でpositions/alpha/寿命の一致、19種のlifecycle・不連続、途中再開、release境界、6000updateの配列同一性と上限、dispose一回を検査した。線形入力の一致を、低頻度で観測しなかった曲線を完全に再構成できる証拠にはしない。

独立Ultra `/root/ultra_q_ps4_quality_continuation/frame_quality_audit_ultra` はsourceと6試験をread-onlyで確認し、identity Sceneと既存lifecycleへの明示的接続という契約の下で必須修正なしと判断した。画面品質の審査ではない。

actor担当の更新中worktreeとの補助確認では三武器×三combo×30/60/120Hzの27 profileを、60Hzの保存時計で再生した。release区間の描画可能frameは全て残像visible、意図しないresetは0、観測最大断面数は剣14・槍11・大剣17だった。これはNode内のObject3Dとgeometryの確認であり、正式な結合gateは統合writerの確定sourceで再実行する。

最初の同一frame試験は旧baseの急激な剣poseと大きな親姿勢変更を同時に与え、刃先が約1.81m/frame跳ねたためdiscontinuity検知で失敗した。検知閾値を緩めず、試験を1/240秒の連続サンプルと小さな親変換へ修正。actor側更新では元の比較条件でも剣先変化が約.54m/frameとなり、残像接続を確認した。修正を実機速度や見た目の改善率として扱わない。

## 単独writer用の接続

`src/scene.js` のimportへ追加する。旧slashを削除した後に他の参照がなければcontentからのWEAPONS importを除く。

```js
import { WeaponTrails } from './weapon-trails.js';
```

旧 `this.slash=mesh(new T.RingGeometry(...` constructor行全体を次へ置換する。

```js
this.weaponTrails=new WeaponTrails(this.scene);
```

updateの旧 `const stats=WEAPONS[p.weaponType]...this.slash...` 行全体を次へ置換する。この位置は `this.animateModel(this.player,p,dt)` より後、renderより前である。parentはworld座標のidentity Sceneとする。

```js
this.weaponTrails.update(this.player,p,dt,playing&&!this.gatheringFocus);
```

既存snapCameraへclearを加える。

```js
snapCamera(){this.cameraSnap=true;this.shake=0;this.weaponTrails?.reset('camera-boundary');}
```

現mainはpausedのview.updateへdt=0を渡す。load/travelはsnapCamera、panel/title/new-gameの既存focusGathering/closePanel経路もsnapCameraを通る。死亡や武器切替はupdate自身がclearする。将来SceneViewを破棄する入口を追加するときは `this.weaponTrails.dispose()` を呼ぶ。

正式WebGL画面、shaderの実GPU動作、画面上の強さ・重なり・見やすさ、端末frame time、PS4相当の知覚品質は未確認。正式previewの監督環境が利用不能な現状を別browser/server/CIで迂回していない。2026-09-20の固定完成目標に対する根拠不足は、この有限改修や試験数で解消したとは判断しない。
