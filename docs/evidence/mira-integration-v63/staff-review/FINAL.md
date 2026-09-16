# v63 杖接合：必須修復の最終確認

**S17下保持金具とS05-B帯の外表面交差は修復済み。10部品の形状/部分組立候補として保全可能。完全な杖、本編、画像忠実度、手との把持、実描画の採用合格ではない。**

初回 `REVIEW.md` は旧 source `afd01a6bde340780208d698a0578f1ce397f8c1e682fbdcba91ac7475689edef` の欠陥発見時の記録として変更せず保持した。最新sourceは `bb16b0fe5584dcf85be6fd016da4b8510df49bafe05e73194b864e76a9238f7e`、`review/staff-v63/staff-parts.mjs` 6,601B。

この直後、作者が木端支持を別の最小修復として追加し、**最終sourceは `c71aad81b0acaff2070b3681dcdae8ba057c51a28468cef5a16957fa69d1f5cc`** へ更新した。bb16だけを最新扱いせず、最終hash保存の一致assertで変化を検知して停止し、作者の明示依頼で木端だけ追加確認した。`FINAL-collar-only.md` はその前の完了範囲として保持。

帯の修復はS05-Bの持上げを下collar退出後のy1038.3→1042.5で滑らかに開始するもの。独立 `collar-recheck.mjs` で旧native snapshotとbb16に同じ三角形分類を適用した。全full sweepや図の再制作はしていない。

| 実三角形の交差pair | 旧 | 新 |
|---|---:|---:|
| S17上外側ベベル / S05-B外面・側縁 | 6 | 0 |
| S17露出した上端lip / S05-B外面・側縁 | 6 | 0 |
| S17内側channel壁 / S05-B | 8 | 0 |
| S17隠れたchannel floor y1030 / S05-B | 9 | 9 |
| S05-A / S05-B | 0 | 0 |

残9pairはすべてy1030の内側座面で、外表面に達していない。帯のoutsideと記される3pairも位置は隠れた内側floorであり、初回の外側ベベルとの交差と混同しない。接触/接着/材料挙動の全条件へ一般化せず、このsourceと部位に限定する。

profiles全値と、S05-B以外9部品のnative position/normal/UV/indexは初回snapshotと全一致。S06 top1423mm・S15 stem1674mmは保持。初回10閉曲面/面向き/寸法の確認と、修復後の限定接合確認を別記録とした。再検査sourceは呼出し前後hash一致、終了2026-09-16T14:02:55.981Z。

最終c71の木端支持修復は、S01の隠れたy4..30mmだけを半径18mmで延長するもの。独立 `foot-recheck.mjs` で以下を確認した（14:06:55.635Z終端）。

- S01下面とS03上面はともにy4.00000019mm、gap0。木下面16三角形の面積991.915436mm²は同一平面上の凸disc内に全て入り、disc縁まで最小3.138513mm。頂点だけの近接判定でなく、凸性と同一平面により面内全域の支持coverage1を確認した。
- S01–S02のproper三角形交差0。半径方向clearance自体は残り、接着/抜け止め/力学的強度を合格にしていない。
- 見えるy30mm以上の木側面32三角形は直前版と座標一致。S01以外9部品のposition/normal/UV/indexと全非S01profilesも一致し、帯修復とS06/S15を変更していない。
- 直前bb16は最終sourceから宣言された木端差分だけを戻して、**既知のbb16 SHA全体と一致することを必須にした上で**原byte保存。Nodeでの比較実行はbare dependency import先だけを既存Threeへ解決した。実sourceを書換えてはいない。

初回10閉曲面/寸法の全batch、bb16帯の対象再検査、c71木端支持の対象再検査という範囲を混同しない。後二回はfull sweepを再反復していない。

S05の生成多視点の同一性、flat blankからの長さ/strain、灯具残部、材質、手/骨格、runtime、GL/device/PS4品質は未検査・未完。後で別のsource変更をした場合、この限定確認だけで新状態を合格にしない。

`native-contact-projections.png` は修復**前**sourceのCPU線図1枚であり、最新版の実画面ではない。初回polygonRadius式の位相誤りは旧oracle/結果を保ち、保存native配列から補助量だけ訂正した。必須欠陥の発見と修復確認はその補助式に依存しない。

全書込みは外部staff-review内のみ。source/Git/画像/runtime/remoteを変更していない。未完了tool/session0。必要修復確認を終え、追加の制作/図/検査ループは開始しない。
