# Site24 配信記録 — 2026-09-16

最新の直接指定「ゲームを最新版更新してくれればいいや。それで確認するから」に従い、GitHub保存・必須CI成功済みPR55の固定source `2bee64cff6482cb7770ba69e07673eefc8ad54ef` を、既存の所有者限定[プレイURL](https://q-ash-pilgrim.juurooo.chatgpt.site)へ反映した。Site24の配信は `succeeded`、版・source・deploymentの再読取一致とowner1/その他0を確認した。未採用のv59は含めていない。

今回は動画依頼に代わる明示的な更新指示を、過去のmain先行配信順序に対する限定的な更新として扱った。GitHub mainは最後の読取で `547676fdce8d8e97abed9f065aad0b6e24af2fd6`、PR39は未mergeのまま。未完了mergeの重複、force、保護回避は行っていない。Siteのsource Git mainを `f11819a…` から `2bee64c…` へ進めたことを、GitHub mainの更新と混同しない。後続作業では実配信sourceを照合し、古いGitHub mainをそのまま再配信して後退させない。

配信には全35memberを固定stageとbyte/hash照合した公式archiveを渡した。通常公開物は34files/14,039,068 B、27媒体/12,883,257 B、初期JS165,611 B/3chunks。local gzipのSHAとサービスが返したtarのcontent_hashは別の値として[終端記録](evidence/site-delivery-v24/terminal-readback.json)へ保存しており、同一byteや差の原因を断定しない。保存1回・private deploy1回の同一deploymentを終端まで追跡し、追加配信はしていない。

採用sourceの既存検証は27工程・343testsとrequired CI35083476068成功。今回の記録保存はdocsのみで、新たなゲーム試験成功とは数えない。正式previewは新環境で起動可能になりタイトルDOMを確認したが、ゲーム開始操作・実ゲーム画面/実聴/実機比較は未実施。スクリーンショットのmain側同期も失敗した。配信後は正式stop成功。以前のmailbox不在を現在の状態として繰り返さない。PS4全画面品質の達成や9/20までの完成根拠は未成立のまま。

v59の0.24→0.48秒fade候補は、後続フレームの武器移動が最大約1.22mへ悪化したため不採用。作者docs-onlyのローカル保存 `5a2a3ea1c0ed11132a3d39e3e5b9e34a7ab53085` は別checkoutにあり、今回のsourceへ混ぜていない。今後の修復では短経路slerpの切替仮説を直接測定し、時間延長だけを再採用しない。現時点の担当・ツール終了と、継続目標・未着手作業を区別する。

この更新依頼の配信工程は完了。記録のための再deployは不要。全画面品質、実際の操作・音・端末性能の確認と正常GitHub統合は残作業で、人間の準備待ちを前提にしない。現行の通常Web主方式/任意単体版の方針を保持する。元の通常Siteも分割配信であり、単体HTML必須gate解除を旧通常版の起動CPU改善と称しない。
