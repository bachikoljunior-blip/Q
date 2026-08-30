# 2026-08-30 — resume after invalid stop

## Trigger

ユーザーから「何で止まってんの？」と指摘されたため、説明だけで終わらせず、Qのmachine state、current work、evidence queue、review records、generator schemas、CIを再点検した。

## Root causes

1. `NO_ACTIVE_CANDIDATE` と、一つの候補batchの終了を、月20万円の全体目標の停止境界として誤って扱っていた。
2. `execution/CURRENT_WORK.json` は69行のexact-workflow精査を未完了としていた一方、別ファイルには精査結果が存在し、stateが同期していなかった。
3. WordPress complaint minerの正本schemaはper-plugin `cluster_counts/topics` だったが、discovery queue builderは旧 `clusters/examples` を読んでいた。結果としてWordPress証拠が全件キューから消えていた。
4. 以前のcompletion contractはcurrent evidenceとreview recordのSHA/行数/signal ID一致を検査していなかった。

## Actions completed

- `research/tools/build_discovery_queue.py` をschema v2へ修正し、WordPress 21行を復元。
- current queueを69行から90行へ更新し、coverageをWordPress 21 / App Store 69と明示。
- App Store 69行の既存精査記録を確認。
- WordPress 21行をbuyer/input/processing/outputへ還元し、全件をterminal dispositionへ処理。
- `research/WORDPRESS_EXACT_WORKFLOW_REDUCTION_2026-08-30.md` を追加。
- `research/discovery_queue/reviewed_2026-08-30.json` を90/90の1対1 dispositionへ更新。
- current queue SHA-256 `1a4232788a9bebaccc91a1d218ffc2597a3636d447b0ba7bd1f394bf47d727d1` をreviewとACTIVE_CANDIDATEへ固定。
- `research/CONTINUATION_CONTRACT.md` を追加。
- `scripts/check_continuation_contract.py` を追加。
- `scripts/check_execution_contract.py`、`tests/research-tools.smoke.py`、governance/research/full-validation/status-sync workflowsをcontinuation-awareへ変更。
- stale reviewを成功扱いにしない定期guardを追加。
- `PROJECT_STATE.md`、`AGENTS.md`、`ACTIVE_CANDIDATE.json`、human-facing status syncを更新。
- 一時的なevidence export workflowを削除。

## Evidence reduction result

### App Store

69/69 terminal。10件以上のsame-workflow complaintsが確認できた強いfamily:

- SPI登録後の営業電話・メール: 27
- 音域測定の倍音/ノイズ/オクターブ誤認: 16
- FP3法改正未反映・誤答: 13
- countdown widgetの日跨ぎ更新失敗: 12

いずれも直接競合、無料代替、継続監修、獲得経路、採算のいずれかでreject。

### WordPress

21/21 terminal。主なfamily:

- invoice PDF generation / attachment integrity
- booking availability / conflict audit
- import/export field/media/order integrity
- shipping label / international address preflight
- tax calculation audit
- update fatal-error preflight
- subscription renewal health

いずれも既存core、直接競合、first-party代替、法令/schema/carrier/integration保守、顧客別support負荷でreject。

## Current decision

- Status: `NO_ACTIVE_CANDIDATE`
- Build approved: `false`
- Reviewed evidence: `90 / 90`
- Promoted candidates: `0`
- Product implementation files: `0`
- Live product: none
- Revenue: ¥0

これは目標達成ではない。現在の証拠batchから、弱い商品を作らずにGate通過案が0だったという判断である。

## Valid stop boundary for this cycle

このcycleの内部作業は、current queueとreviewのSHA、件数、signal ID、順序が一致し、全90行がterminalで、Prebuild/Continuation/Execution checksがPASSした時だけ回答可能とする。新しいqueue bytesが生成された時点でreviewはstaleとなり、次cycleを未完了へ戻す。
