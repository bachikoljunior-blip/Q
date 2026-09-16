# v57 追加レビュー: 統合 cloak-uv テスト修復

必須のテスト整合修復を確認し、この有限レビューを閉じる。runtime の再変更は不要。親の全 suite 再実行結果を代わりに合格とは扱わない。

先行 REPORT / HASHES は書き換えていない。その後の親の統合実行は 342 tests 中 340 pass / 2 fail。失敗は旧 NPC 全体 contract `56223f11…` と、今回の意図した上衣 UV / 材質分割後 `44458942…` の不一致だった。実ログを `integration-failure.txt` に保存した。先行レビューの runtime / dist 確認と、今回初めて検出された full-suite 互換性の境界を分ける。

修復は `tests/cloak-uv.test.mjs` と新 fixture helper のみ。旧 v31 / v32 NPC / v33 ranger JSON と contract / metric helper は変更していない。新 helper は、保存済み v32 pre-cloak source の SHA256 を旧記録に照合して読み込み、次の二段階で比較する。

1. 原参照 NPC の全 contract が、引き続き歴史的 JSON の期待値に一致する。
2. 同じ固定 source に今回の上衣 import と四つの単一置換だけを合成し、その pre-cloak 参照の全 contract と現 NPC を比較する。

現 runtime の外套・身体 recipe を参照側へコピーしていない。外套の旧密度 / stretch / winding / 面数 / 動作中 UV 固定 / clone 独立性の assert は保持。他 13 役と四つの warden theme の旧比較も保持。NPC の mesh +1 だけは今回の意図した分割として明示する。NPC の skip、geometry / material の比較除外、新 expected hash への単純な差替えではない。

独立検証は、修復した本物の `tests/cloak-uv.test.mjs` を同じ Node / native Three 境界で一度ずつ実行した。

| 条件 | 結果 | 実際の検出箇所 |
|---|---|---|
| 変更なし | 3 tests pass、0 skip、exit 0 | 旧 cloak の二検査と新 negative controls |
| NPC cape の vertex 0 の U を +0.2 | exit 1 | `npc: overall density` |
| NPC の非対象 hair 材質色を白へ変更 | exit 1 | `npc 0: non-UV rendering/motion contract` と全 family contract |

故意変更は production actor URL の module load 時だけのメモリ内注入。原参照 / 合成参照の query URL には注入していない。repo file は一切変更していない。元の外套検査と非対象材質検査が、実際に意図しない差を拒否することを確かめた。追加の任意故障群や全 suite は実行していない。

最終 test SHA256: `066e2e465b0b928063abc061abdf7fb4c437f216c5c5927a144d11db0329fc5a`。
最終 helper SHA256: `1e106c350439ae7f772c2286417559e8ecef0fbc17a0fa956c597ba57d88a512`。
元 runtime `detailed-geometry ed1d6757…` / `cloth-material 39ba2cfc…` / `actor-models ee276f96…` は検証前後不変。

再現: `Q_REVIEW_NODE_MODULES=/path/to/approved/node_modules node run-review.mjs /path/to/repo`。必要な test fixture が存在する修復済み repo を指定する。`fault-hook.mjs` が Node 依存解決と上記二負例を明示し、結果・stdout・source hashes を保存する。

これは回帰検査の感度確認であり、実 WebGL、見た目、端末・PS4 達成の証明ではない。先行 stage は依然 parent の統合 gate。全 review session は終了している。
