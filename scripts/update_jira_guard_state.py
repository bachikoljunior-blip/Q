#!/usr/bin/env python3
"""Write the canonical project state after Jira Automation Guard publication."""
from __future__ import annotations

import datetime as dt
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ACTIVE = ROOT / 'research' / 'ACTIVE_CANDIDATE.json'


def now_jst_date() -> str:
    return (dt.datetime.now(dt.timezone.utc) + dt.timedelta(hours=9)).date().isoformat()


def write(path: str, content: str) -> None:
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content.strip() + '\n', encoding='utf-8')


def main() -> int:
    active = json.loads(ACTIVE.read_text(encoding='utf-8'))
    assert active['status'] == 'BUILD_APPROVED'
    assert active['build_approved'] is True
    assert active['candidate_id'] == 'jira-automation-rule-guard'
    assert active['approval_scope'] == 'FREE_MVP_ONLY'
    assert (ROOT / 'index.html').is_file()
    assert 'Jira Automation Guard' in (ROOT / 'index.html').read_text(encoding='utf-8')
    date = now_jst_date()

    write('AGENTS.md', f'''
# AGENTS.md — Q project operating contract

最終更新: {date}

## Source of truth
1. `PROJECT_STATE.md`
2. `research/ACTIVE_CANDIDATE.json`
3. `DECISIONS.md`
4. Current experiment under `experiments/`
5. Current research under `research/`

Conversation memory is secondary.

## User communication rule
The user has explicitly required:
- Do not drip-feed plans.
- Do not end with “next I will”.
- Do not ask again for facts already stored.
- Complete every safe action available in the current session before replying.
- When a flaw is found, complete stop/change/research/implementation/check/state update before the response.
- Reply once, after execution.

## Product-selection gate
Never build because an idea is easy, automatic, localized, cheap, privacy-preserving, or novel-sounding.

Before a new product build, prove and record:
1. Exact buyer/input/processing/output/price.
2. At least 12 exact-workflow searches.
3. At least 5 direct products and 5 substitutes.
4. A buyer/input/processing/output overlap matrix.
5. Duplicate veto PASS; 70%+ workflow overlap is normally reject.
6. Repeated unresolved pain evidence.
7. A concrete acquisition surface.
8. Unit economics capable of reaching the income target.
9. Kill criteria.

`research/ACTIVE_CANDIDATE.json` is machine-enforced by `scripts/check_prebuild_gate.py`.

## Current product
`EXP005 — Jira Automation Guard` is a **LIVE_FREE_MVP**.

Approval scope is `FREE_MVP_ONLY`.
- No payment.
- No Jira credentials/API connection.
- No automatic import/deploy/fix.
- No Forge/Marketplace submission.
- No customer-specific migration service.

Do not expand into those areas until the validation gate in `PROJECT_STATE.md` passes.

## Safety and truthfulness
- Never guarantee income, platform compatibility, rule correctness, migration success, privacy beyond the implemented design, or Marketplace approval.
- Prefer deterministic checks over AI when rules are enough.
- Never expose or transmit input secrets for analytics.
- Distinguish `LIVE_FREE_MVP` from `LIVE_PAID_PRODUCT`.
''')

    write('PROJECT_STATE.md', f'''
# PROJECT STATE

最終更新: {date}

## Goal
本人の継続労働への依存が小さい**手取り月20万円以上**を可能な限り早く構築し、生活のための労働を不要にする。

## Non-negotiable
- 原則、人と関わらず運営できる
- 個別営業、電話、面談、顧客別納品を主戦略にしない
- 顧客数に比例して本人作業が増えない
- 月0〜10万円、週約18時間で開始可能
- 自動販売・自動提供・自動決済・自動解約を最終形にする
- 過去会話より、このリポジトリの最新状態を優先する

## Permanent execution rule
ユーザーへ計画だけ返して作業を止めない。許可済み範囲では、同一サイクル内で調査→反証→中止/変更→実行→検査→状態更新まで終えてから一度だけ返す。

## Current status
**`LIVE_FREE_MVP` — EXP005 Jira Automation Guard**

無料MVPは実装・公開済み。有料商品、売上、支払意思はまだ存在しない。

## Public product
- App: https://bachikoljunior-blip.github.io/Q/
- Validation dashboard: https://bachikoljunior-blip.github.io/Q/stats.html
- Privacy: https://bachikoljunior-blip.github.io/Q/privacy.html
- Source package: `product/jira-automation-guard/`

## Product outcome
Jira Cloud管理者/導入支援会社が、1つまたは2つのAutomation rule export JSONを入れる。

ブラウザ内で:
- rule配列を代表キーまたは構造から推定
- rule名、状態、trigger/action、component、fingerprintを一覧化
- volatileな日時/version等を除外して2版をrule単位でdiff
- custom field、project、issue type、account/user ID、URL/webhook、JQL、その他hard-coded ID候補を抽出
- token/password/Authorization等のsecret-like keyを警告し、レポートでは値をマスク
- duplicate name、disabled、trigger/action未検出、大型rule等を警告
- Markdown/JSONのレビュー・引継ぎレポートを生成

入力JSON本文はサーバーへ送信せず、ブラウザ内で処理する。匿名イベントには本文、rule名、URL、ID、警告内容を含めない。

## Why EXP005 passed the build gate
過去の失敗を受け、実装前にmarketplace-firstとexact-match-firstの調査を実行した。

- exact workflowをbuyer/input/processing/output/priceまで固定
- 16検索以上
- 5件以上の商品ページ
- 5件以上の標準/無料/手作業代替
- 10件以上の公開不満ページ
- product overlap matrix
- 70%以上のverified exact-workflow重複0
- version control、rollback、compare/diff、export、migration/documentation等の反復言及
- adjacent buyer marketとしてJira backup/configuration/migration製品群を確認
- exact searchと将来のAtlassian Marketplaceを集客面として固定
- ¥4,980/月の採算仮説とkill criteriaを事前記録

詳細:
- `research/CANDIDATE_JIRA_AUTOMATION_GUARD.md`
- `research/candidate_queue/latest.md`
- `research/deep_dive/latest.md`
- `research/ACTIVE_CANDIDATE.json`

これは「競合なし」や「売れる」の証明ではない。確認できた既存商品は主にアカウント接続型backup/restore、site configuration migration、data syncであり、無料MVPはexport JSONの静的lint・正規化diff・参照台帳・可読文書へ限定した。

## Closed experiments
- EXP001 — 高単価AI個別サービス: 個別対応が増えるため終了
- EXP002 — つづきから: テンプレート整形中心で無料代替が強いため終了
- EXP003 — 字幕Preflight: exact/adjacent競合が多く明確なwedgeがないため終了
- EXP004 — FBA補てん原価監査: ReimburseOpsとのworkflow重複90%超で終了

EXP001〜004へ戻らない。

## Business hypothesis — unproven
無料:
- 1〜2 exportのlint/diff
- reference inventory
- Markdown/JSON report

Pro仮説:
- baseline履歴
- 複数site台帳
- GitHub/PR/CI同期
- 独自lint rules
- 共有レビュー

価格仮説: ¥4,980/月

- 月商30万円に必要: 61契約
- 手取り月20万円を狙う運用目標: 70〜80契約以上
- 平均サポート上限: 10分/契約/月。超える場合はzero-touch不適合

## Validation gate
最初の100 qualified unique devicesで:
- JSON解析30以上
- 2版diffまたはMarkdown/JSON保存15以上
- Pro版希望5以上
- 深刻なschema incompatibility/privacy事故0

60日以内にqualified unique 100へ届かず、週次増加もない場合はacquisition失敗として終了/降格する。

以下なら有料開発せず終了/変更:
- exact workflow 70%以上の既存商品を新たに確認
- Jira標準機能または無料OSSがlint + normalized diff + reference inventory + readable docsを代替
- 解析率30%未満
- diff/export率15%未満
- Pro意向5%未満
- schema追従に顧客別対応が必要
- 平均サポート10分/契約/月超
- Marketplace/検索以外に個別営業が必要

## Explicitly forbidden until Gate passes
- Stripe/決済
- Jira認証情報/API接続
- 自動import/deploy/fix
- Forge/Marketplace申請
- AIによる曖昧な正誤断定
- 顧客別移行代行

## Automated continuity
- `marketplace-scan.yml`: 公開marketplace/review signalを週次収集
- `exact-match-queue.yml`: exact workflow重複を週次探索
- `candidate-deep-dive.yml`: product/review/substitute証拠を深化
- `sync-research-candidate.yml`: 承認済み候補を上書きせず研究状態を同期
- `research-loop-check.yml`: 調査ツールとGateを検査
- `smoke.yml`: 商品core、静的release、公開用ファイルを検査
- `build-jira-guard.yml`: approved free MVPだけを公開

## Current truth
- Free MVP: live
- Payment: not built
- Paid customers: 0
- Revenue: ¥0
- Income target progress: not achieved
- Human-only external evidence still missing: qualified third-party use, real Jira export compatibility, Pro intent, paid conversion

## Immediate next action
匿名ファネルと実export互換性を計測し、Gate未達の間は追加の有料機能を作らない。週次の競合探索で70%以上のexact duplicateが見つかった場合は、利用母数を待たず同一サイクル内で終了判定する。

## Resume instruction
`AGENTS.md` → このファイル → `research/ACTIVE_CANDIDATE.json` → `experiments/EXP005_JIRA_AUTOMATION_GUARD.md` → `DECISIONS.md` の順で読む。既知条件を再質問せず、GateとImmediate next actionを守る。
''')

    write('START_HERE.md', f'''
# START HERE

最終更新: {date}

## Mission
zero-touchで手取り月20万円以上を作り、生活のための労働を不要にする。

## Read first
1. `AGENTS.md`
2. `PROJECT_STATE.md`
3. `research/ACTIVE_CANDIDATE.json`
4. `experiments/EXP005_JIRA_AUTOMATION_GUARD.md`
5. `DECISIONS.md`

## Current truth
- EXP001〜004: closed
- EXP005 Jira Automation Guard: `LIVE_FREE_MVP`
- Free app: https://bachikoljunior-blip.github.io/Q/
- Payment: not built
- Paid customers: 0
- Revenue: ¥0

## Do not repeat
- Do not ask the user for constraints already recorded.
- Do not revive EXP001〜004.
- Do not call the free MVP a paid product.
- Do not add payment, Jira credentials, import/deploy, automatic fixes or customer-specific work before the validation gate.
- Do not reply with a plan while executable work remains.
- When a weakness is found, correct or close it in the same work cycle.

## Immediate resume
Read `PROJECT_STATE.md` and execute within its validation and safety boundaries. Update state before responding.
''')

    write('README.md', '''
# Q — zero-touch income project

目標: **手取り月20万円以上を、本人の継続労働への依存を小さくして構築する。**

## Current product

`EXP005 — Jira Automation Guard` is a **live free MVP**.

Public app: https://bachikoljunior-blip.github.io/Q/

It reads one or two Jira Automation export JSON files in the browser and produces:

- rule inventory
- structural lint warnings
- normalized rule-level diff
- custom-field/project/issue-type/account/URL/JQL/hard-coded-ID inventory
- secret-like key warnings with masked values
- Markdown and JSON documentation

Input JSON is processed locally in the browser and is not sent to this project's server.

## Not a paid product yet

Payment, Jira API connection, import/deploy, automatic fixes and Marketplace distribution are not built. They remain forbidden until the validation gate in `PROJECT_STATE.md` passes.

## Resume order
1. `AGENTS.md`
2. `PROJECT_STATE.md`
3. `research/ACTIVE_CANDIDATE.json`
4. `experiments/EXP005_JIRA_AUTOMATION_GUARD.md`
5. `DECISIONS.md`

## Test

```bash
node tests/jira-automation-guard.smoke.js
python scripts/check_prebuild_gate.py
```
''')

    write('INCOME20_PROJECT.md', '''
# INCOME20 PROJECT

## Outcome
手取り月20万円以上を、顧客数に比例して本人の作業量が増えない仕組みで作る。

## Constraints
- capital: ¥0–100k/month
- time: ~18h/week
- main device: iPhone
- no coding background, but AI/GitHub orchestration experience
- low direct-sales tolerance
- no primary strategy requiring calls, meetings, or custom delivery

## Permanent strategy
1. Search paid-pain markets from existing marketplace/review evidence.
2. Define exact buyer/input/processing/output/price before coding.
3. Verify direct products, substitutes and overlap before coding.
4. Reject 70%+ duplicate workflows unless verified switching/prepayment evidence exists.
5. Fix acquisition and unit economics before approval.
6. Build only the approved minimum self-service scope.
7. Measure qualified use and paid intent.
8. Add payment/automation only after gates pass.
9. Kill weak experiments without sunk-cost bias.
10. Convert profits into diversified long-term assets after business cash flow exists.

## Current experiment
`EXP005 — Jira Automation Guard` is a free browser-local MVP. See `PROJECT_STATE.md`.
''')

    write('DECISIONS.md', f'''
# DECISIONS

## 2026-08-25 — Q is the source of truth
GitHub repository `bachikoljunior-blip/Q` is the persistent project memory.

## 2026-08-25 — Investment is not the initial engine
With ¥0–100k/month of new capital, financial investments cannot reach the target quickly enough. Build scalable business income first and invest profits later.

## 2026-08-25 — Zero-touch is non-negotiable
No primary strategy based on calls, meetings, direct sales, interviews, or customer-specific delivery. Customer count must not linearly increase the owner's work.

## 2026-08-27 — Kill EXP001
High-ticket individualized AI service violates the zero-touch constraint.

## 2026-08-29 — Kill EXP002
“つづきから” was mostly deterministic template filling, had strong free substitutes and lacked recurring-payment necessity.

## 2026-08-29 — Kill EXP003
Subtitle/SRT preflight, auto-fix, AI proofreading and NLE integration already had numerous direct/adjacent products.

## 2026-08-30 — Kill EXP004 immediately after exact duplicate discovery
ReimburseOps overlapped the FBA reimbursement audit buyer, inputs, processing, outputs, privacy positioning and flat-price model by more than 90%. The experiment and public product were removed without waiting for traffic.

## 2026-08-30 — Enforce exact-match prebuild gate
No fifth product may be built without 12+ searches, 5+ direct products, 5+ substitutes, an overlap matrix, duplicate-veto PASS, differentiation evidence, acquisition evidence, economics and kill criteria. GitHub Actions enforces `research/ACTIVE_CANDIDATE.json`.

## {date} — Approve EXP005 Jira Automation Guard free MVP
**Decision:** Build and publish only a browser-local free MVP for static Jira Automation export lint, normalized rule diff, reference inventory and readable Markdown/JSON documentation.

**Evidence:**
- exact workflow fixed before implementation
- 16+ searches
- 5+ product pages, 5+ substitutes and 10+ complaint pages fetched
- repeated version-control/rollback/diff/export/migration/documentation pain signals
- no verified 70%+ exact workflow duplicate in the reviewed evidence
- adjacent Jira-admin paid market exists in backup/configuration/migration products
- exact search queries and a future Atlassian Marketplace surface are defined
- ¥4,980/month economics and kill criteria were recorded before build

**Guardrail:** Approval is `FREE_MVP_ONLY`. No payment, Jira connection, import/deploy, automatic fixes, Forge submission or customer-specific migration until the first-100-device validation gate passes.

**Revisit when:** The Gate passes, a 70%+ duplicate appears, acquisition stalls for 60 days, or real schemas require recurring custom support.
''')

    write('experiments/EXP005_JIRA_AUTOMATION_GUARD.md', f'''
# EXP005 — Jira Automation Guard

開始: {date}  
状態: **LIVE_FREE_MVP**  
有料商品: **未実装**

## Exact workflow
Jira Cloud管理者/導入支援会社が1つまたは2つのAutomation export JSONを入れる → browser-localで正規化・lint・rule diff・hard-coded reference inventoryを生成 → Markdown/JSONの移行・レビュー資料を受け取る。

## Free MVP
- generic rule-array discovery
- representative rule metadata extraction
- volatile-field normalization
- rule-level added/removed/changed/unchanged diff
- path-level change details
- duplicate names, disabled, missing trigger/action, large-rule warnings
- custom field, project, issue type, account/user, URL/webhook, JQL, hard-coded ID candidates
- secret-like key warnings and masked report values
- Markdown/JSON export
- sample before/after exports
- anonymous event counts without input content

## Not built
- Jira credentials/API
- import/deploy/fix
- payment/auth
- Forge/Marketplace listing
- AI correctness decisions
- customer-specific services

## Differentiation under test
Adjacent products handle account-connected backup/restore, site configuration migration/deployment or issue/data sync. This MVP is limited to credential-free static analysis of Automation export JSON, normalized rule diff, migration-sensitive references and readable documentation.

The difference is not treated as proven paid value.

## Price hypothesis
Pro ¥4,980/month:
- baseline/history
- multiple sites
- GitHub/PR/CI
- custom lint rules
- shared review inventory

61 customers produce about ¥300k MRR. Operating target for the user's take-home goal is 70–80+ customers, subject to fees, tax, churn and support.

## Validation events
- pageview
- unique-visitor
- qualified-device
- sample-loaded
- before-file-loaded
- after-file-loaded
- analyze-single
- analyze-compare
- warnings-found
- secret-warning-found
- diff-found
- markdown-copy
- markdown-download
- json-download
- pro-interest

## Gate at first 100 qualified devices
PASS only if:
- 30+ analyses
- 15+ compare/export actions
- 5+ Pro-interest actions
- real export schema compatibility is acceptable
- zero serious privacy/schema incident

## Kill criteria
- verified exact workflow overlap >=70%
- Jira native/free OSS replaces the core outcome
- analysis rate <30%
- compare/export rate <15%
- Pro intent <5%
- no weekly qualified growth and <100 devices after 60 days
- schema support requires recurring custom handling
- support >10 minutes/account/month
- individualized sales are required

## Build rule
No paid plan, Jira API, auto-import/deploy/fix or Forge submission until PASS.
''')

    write('execution/2026-08-30-marketplace-to-build.md', f'''
# {date} — marketplace-first discovery to validated free build

## Trigger
The user repeated that all executable work must be completed in the same response cycle and that exact-product duplication must be caught before building.

## Executed
1. Added a public marketplace/review scanner for WordPress, Atlassian and GitHub evidence.
2. Added an exact-workflow queue with 8 narrow buyer/input/processing/output candidates and 16 searches each.
3. Added automated product/complaint/substitute page fetching, feature/pricing extraction and overlap calculation.
4. Added scheduled workflows that refresh evidence without auto-approving products.
5. Added smoke tests and a safe sync rule that preserves approved candidates.
6. Deep-dived `jira-automation-rule-guard`.
7. Verified stored evidence thresholds: 5+ product pages, 5+ substitutes, 10+ complaints, 0 automated 70%+ overlaps.
8. Completed a manual overlap/acquisition/economics review.
9. Encoded approval as `FREE_MVP_ONLY` in `ACTIVE_CANDIDATE.json`.
10. Implemented the browser-local analyzer, responsive UI, samples, privacy page and public dashboard.
11. Added core tests for schema discovery, lint, reference detection, secret masking and two-version diff.
12. Added deterministic publishing and product-aware governance workflows.
13. Published the free MVP to GitHub Pages.
14. Updated the repository source of truth.

## Current result
- Status: `LIVE_FREE_MVP`
- Product: Jira Automation Guard
- Payment: not built
- Revenue: ¥0
- Gate: first 100 qualified devices

## External boundary
The repository can automate research refresh, duplicate checking, testing, publication and anonymous measurement. It cannot manufacture third-party Jira exports, qualified users, Pro intent, payment or revenue. Those remain external evidence rather than assumptions.
''')

    print(json.dumps({'updated': date, 'status': 'LIVE_FREE_MVP', 'candidate': active['candidate_id']}, ensure_ascii=False))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
