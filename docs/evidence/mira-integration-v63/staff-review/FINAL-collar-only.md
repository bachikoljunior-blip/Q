# v63 杖接合：必須修復の最終確認

**S17下保持金具とS05-B帯の外表面交差は修復済み。10部品の形状/部分組立候補として保全可能。完全な杖、本編、画像忠実度、手との把持、実描画の採用合格ではない。**

初回 `REVIEW.md` は旧 source `afd01a6bde340780208d698a0578f1ce397f8c1e682fbdcba91ac7475689edef` の欠陥発見時の記録として変更せず保持した。最新sourceは `bb16b0fe5584dcf85be6fd016da4b8510df49bafe05e73194b864e76a9238f7e`、`review/staff-v63/staff-parts.mjs` 6,601B。

作者の修復はS05-Bの持上げを下collar退出後のy1038.3→1042.5で滑らかに開始するもの。独立 `collar-recheck.mjs` で旧native snapshotと新sourceに同じ三角形分類を適用した。全full sweepや図の再制作はしていない。

| 実三角形の交差pair | 旧 | 新 |
|---|---:|---:|
| S17上外側ベベル / S05-B外面・側縁 | 6 | 0 |
| S17露出した上端lip / S05-B外面・側縁 | 6 | 0 |
| S17内側channel壁 / S05-B | 8 | 0 |
| S17隠れたchannel floor y1030 / S05-B | 9 | 9 |
| S05-A / S05-B | 0 | 0 |

残9pairはすべてy1030の内側座面で、外表面に達していない。帯のoutsideと記される3pairも位置は隠れた内側floorであり、初回の外側ベベルとの交差と混同しない。接触/接着/材料挙動の全条件へ一般化せず、このsourceと部位に限定する。

profiles全値と、S05-B以外9部品のnative position/normal/UV/indexは初回snapshotと全一致。S06 top1423mm・S15 stem1674mmは保持。初回10閉曲面/面向き/寸法の確認と、修復後の限定接合確認を別記録とした。再検査sourceは呼出し前後hash一致、終了2026-09-16T14:02:55.981Z。

足木端から底discへの26mm空間と径方向clearanceは未支持のまま。架空の接着や固定具で解決済みにしない。S05の生成多視点の同一性、flat blankからの長さ/strain、灯具残部、材質、手/骨格、runtime、GL/device/PS4品質は未検査・未完。後で別のsource変更をした場合、この限定確認だけで新状態を合格にしない。

`native-contact-projections.png` は修復**前**sourceのCPU線図1枚であり、最新版の実画面ではない。初回polygonRadius式の位相誤りは旧oracle/結果を保ち、保存native配列から補助量だけ訂正した。必須欠陥の発見と修復確認はその補助式に依存しない。

全書込みは外部staff-review内のみ。source/Git/画像/runtime/remoteを変更していない。未完了tool/session0。必要修復確認を終え、追加の制作/図/検査ループは開始しない。
