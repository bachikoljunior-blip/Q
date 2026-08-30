# 2026-08-30 — completion-first hardening

## Trigger

ユーザーは、計画や途中経過で回答を止めず、実行可能な作業を同一cycleで完了してから一度だけ返すよう繰り返し要求した。前cycleでは、閉じたJira候補の実行系が残り、marketplace scannerが同じ出力を別schemaで上書きし、候補探索も途中で止まっていた。

## Repository audit

確認した問題:
- Jira Automation Guard本体は削除済みだが、approval/build/finalize/indexing/metrics/tracking workflowが残っていた
- publish/state/metrics scriptsとtestsも残っていた
- `sync-research-candidate` が将来、古いdeep-dive出力からcandidateを再昇格させ得た
- 2つのmarketplace workflowが `research/marketplace_scan/latest.json` を異なるschemaで上書きしていた
- hard-coded candidate queueが既に棄却済みworkflowを再検索していた
- CIの一部が削除済みtoolを参照していた
- EXP004 metrics collectorと未使用IndexNow keyが残っていた

## Executed cleanup

削除:
- Jira Guard approval/build/finalize/indexing/metrics/tracking/hardening workflows
- Jira Guard publish/state/metrics/tracking scripts
- Jira Guard smoke/metrics tests
- automatic research-candidate promotion workflow/tool
- hard-coded exact-match queue/deep-dive workflow/tools
- conflicting marketplace signal scanner/workflow
- EXP004 metrics collector
- stale IndexNow key

維持:
- archival decision/research records
- generic PREBUILD gate
- generic status synchronizer
- App Store/WordPress discovery evidence collectors
- one canonical marketplace scan writer

## Canonical discovery repair

`research/marketplace_scan` のwriterを `.github/workflows/marketplace_scan.yml` 1本に限定した。

Canonical pipeline:
1. `marketplace_scan.py`
2. `filter_marketplace_scan.py`
3. `mine_wordpress_complaints.py`
4. schema/output validation
5. generated evidence commit

実行後、schema v2、shortlist、complaintsが再生成され、workflowは成功した。

## Candidate batch completed before response

次のworkflowを実装前に調査・棄却した:
- Jira permission drift/access-review evidence
- Jira long-term audit retention/evidence vault
- Confluence page owner/expiry/attestation
- Confluence external-user offboarding/access impact
- WooCommerce webhook failure/replay
- WordPress staging-production settings diff
- WordPress update-impact preflight
- Figma Japanese typography/kinsoku QA
- shift/pay backup and payslip mismatch

結果は `research/BATCH_VETO_2026-08-30.md` に保存。

棄却理由:
- exact paid competitor
- free/first-party core substitute
- same buyer outcome already supplied
- repeated exact pain/acquisition evidence不足
- legal/schema/support burdenがzero-touch不適合

## Completion contract added

`execution/CURRENT_WORK.json` を追加し、material taskは回答前に次のterminal statusだけを許可:
- `DONE`
- `REJECTED`
- `BLOCKED_EXTERNAL`

`scripts/check_execution_contract.py` は次を検査:
- unfinished taskなし
- current cycleは`READY_TO_REPORT`
- `NO_ACTIVE_CANDIDATE / build_approved=false`
- product files 0
- closed Jira/EXP004 executable artifacts 0
- marketplace evidence writerが1本だけ
- completion invariantがAGENTSに固定
- batch vetoとexecution evidenceが存在

## Operating contract strengthened

`AGENTS.md` に、safe material actionが残る間はfinal answer禁止、ユーザーにcompletion directiveを再度言わせない、NO_ACTIVE_CANDIDATEを内部作業停止の口実にしない、closed candidateの実行系も削除する、という不変条件を追加した。

## External-only boundary

このcycleで内部作業を残して止める理由にはしない。AI/connected toolsだけで捏造できない外部事実は次のみ:
- real paid preorder/purchase
- measured live CAC/conversion
- granted specialist content rights/qualified review agreement

現在はGateを通過したoffer自体がないため、これらを取りに行くLP/決済も作らない。

## Final state

- Status: `NO_ACTIVE_CANDIDATE`
- Build approved: `false`
- Live product: none
- Product implementation files: 0
- Closed candidate executable automation: removed
- Candidate batch: completed/rejected
- Canonical research pipeline: repaired
- Completion contract: machine-enforced
