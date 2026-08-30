# Q — zero-touch income project

目標: **手取り月20万円以上を、本人の継続労働への依存を小さくして構築する。**

Current status: **`NO_ACTIVE_CANDIDATE`**  
Build approved: **false**  
Current work: **`READY_TO_REPORT`**  
Evidence review: **90/90 rows current**  
現在、公開中の商品はありません。

## Source of truth
1. [`AGENTS.md`](AGENTS.md)
2. [`PROJECT_STATE.md`](PROJECT_STATE.md)
3. [`research/ACTIVE_CANDIDATE.json`](research/ACTIVE_CANDIDATE.json)
4. [`execution/CURRENT_WORK.json`](execution/CURRENT_WORK.json)
5. [`research/CONTINUATION_CONTRACT.md`](research/CONTINUATION_CONTRACT.md)
6. [`research/discovery_queue/latest.json`](research/discovery_queue/latest.json)
7. [`research/discovery_queue/reviewed_2026-08-30.json`](research/discovery_queue/reviewed_2026-08-30.json)
8. [`research/PREBUILD_GATE.md`](research/PREBUILD_GATE.md)
9. [`DECISIONS.md`](DECISIONS.md)

## Enforcement
- Exact buyer/input/processing/output competitors are searched before implementation.
- `product/` code is prohibited while `build_approved=false`.
- Research scans never auto-approve a product.
- Queue content and review dispositions must match one-for-one by SHA-256 and signal ID.
- A response cycle cannot finalize with unfinished material tasks or stale discovery evidence.
- Closing a candidate removes its executable build/deploy/metrics/indexing artifacts.
- EXP001–004, security voice trainer and Jira Automation Guard are closed.
