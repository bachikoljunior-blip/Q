# BATCH VETO — 2026-08-30

Status: **NO_ACTIVE_CANDIDATE / build_approved=false**

目的: 「作り始めてから同じ商品を見つける」を繰り返さないため、現在の探索キューと追加候補を、buyer/input/processing/output/resultで先に潰した。

## 1. Jira permission drift / access-review evidence

Workflow:

`Jira管理者がpermission/config snapshotを取る → 付与・剥奪と権限拡大をdiff → sign-offと監査証跡を出す → 月額Marketplace app`

判定: **REJECT_EXACT_DUPLICATE**

確認済み:
- Permission Auditor for Jira — permission grid、grant reason、snapshots/drift、access review、hash-chained evidence
  - https://marketplace.atlassian.com/apps/2029689515/
- Access Review & Audit Trail for Jira — periodic snapshot、stable-ID diff、attestation、CSV/PDF、長期履歴
  - https://marketplace.atlassian.com/apps/147263462/
- Permissions Changes Audit for Jira — permission/role changes、actor/date、filter、CSV/PDF
  - https://marketplace.atlassian.com/apps/2928177100/permissions-changes-audit-for-jira
- Config Audit for Jira — daily admin snapshot、before/after diff、actor、search/export
  - https://larchmontlabs.com/config-audit
- A9 Sightglass — Jira/Confluence permission scan、risk/compliance report
  - https://a9sightglass.io/

主要成果が既存有料商品と一致する。差を日本語化・価格・Forge/local-onlyへ寄せてもbuyer outcomeは変わらない。

## 2. Jira long-term audit retention / evidence vault

Workflow:

`Jira audit logを定期取得 → native retentionを超えて保存・検索 → audit-ready exportを出す → 月額app`

判定: **REJECT_EXACT_DUPLICATE**

確認済み:
- Compliance Log Vault — daily sync、180日超保持、date filter、CSV export
  - https://marketplace.atlassian.com/apps/4152437534/compliance-log-vault
- Vellum — append-only audit trail、before/after、hash chain、evidence pack
  - https://marketplace.atlassian.com/apps/410000326/
- Attestsys — signed/hash-chained audit evidence、offline verification、paid retention/export automation
  - https://attestsys.com/
- Atlassian native audit log/export — 180日保持と定期export案内
  - https://support.atlassian.com/security-and-access-policies/docs/view-audit-log-activities/

保存・検索・長期保持・監査exportという最終成果が既に販売されている。

## 3. Confluence page owner / expiry / attestation

Workflow:

`Confluence page inventoryへowner/cadenceを設定 → stale/due pageを通知 → approve/request-change/defer/reassign → review audit trailを残す`

判定: **REJECT_EXACT_DUPLICATE / FREE_CORE_EXISTS**

確認済み:
- Page Review Manager — owner、cadence、stale/due queue、page action、audit entry
  - https://marketplace.atlassian.com/apps/2847619197/page-review-manager-for-confluence
- Stale Content Auditor — owner、staleness、review history、archive。無料
  - https://marketplace.atlassian.com/apps/1040161133/
- Doc Ownership & Reviews — native owner field、due reminder、review decision history
  - https://marketplace.atlassian.com/apps/1757659150/doc-ownership-reviews-for-confluence
- FreshPage — verification、ownership、freshness、review policy
  - https://marketplace.atlassian.com/apps/1059183334/freshpage-trusted-knowledge-for-confluence
- Breeze / Comala / ConfluClean / Content Guardianにもreview、approval、expiry、archive、auditがある
  - https://b1nary.io/apps/breeze/
  - https://marketplace.atlassian.com/apps/1215729/comala-document-control
  - https://marketplace.atlassian.com/apps/2921193121/confluclean-content-lifecycle-management-for-confluence
  - https://marketplace.atlassian.com/apps/778930372/content-guardian

入力・処理・出力が一致する無料/有料商品が複数ある。

## 4. Confluence external-user offboarding / access impact

Workflow:

`guest/external identityを選ぶ → space/page/inherited accessを解決 → removal前impactと証拠を出す`

判定: **REJECT_MAJOR_OUTCOME_DUPLICATE**

確認済み:
- Permission Auditor for Confluence — cross-space effective grants、snapshot diff、risk、export
  - https://marketplace.atlassian.com/apps/3549326490/permission-auditor
- Audit 360 — space/permission/content audit、prior-run compare
  - https://marketplace.atlassian.com/apps/2574554263/
- A9 Sightglass — users/groups/permissions/projects scan、risk/compliance
  - https://a9sightglass.io/
- External Share / Secure Share / Space Privacy already manage external access, expiry and granular permissions
  - https://warsawdynamics.com/app/external-share-for-confluence/
  - https://marketplace.atlassian.com/apps/1225078/share-confluence-with-external-users-secure-share
  - https://marketplace.atlassian.com/apps/1216602/space-privacy-extranet-for-confluence

「削除前のimpactだけ」に狭めても、effective-access inventoryとexternal-access managementが主要成果を代替する。組織API制約と権限解決supportも重い。

## 5. WooCommerce webhook failure / replay

Workflow:

`delivery logを取り込む/接続 → failed・duplicateを分類 → idempotent retry/replay → historyを残す`

判定: **REJECT_EXACT_DUPLICATE**

確認済み:
- EventDock — retries、dead-letter queue、replay
- Surehook — automatic retries、event replay
- Hookly — retry、logs、WooCommerce triggers
- Flow Systems — persistent queue、retries、idempotency
- Ploq Webhooks — delivery logs、retry/replay

このworkflowは既に独立SaaS/WordPress製品として成立している。無料companionを付けても結果は同じ。

## 6. WordPress staging/production settings diff

Workflow:

`2環境のoption/config export → normalize/redact/diff → unsafe overwriteを警告 → safe import patch`

判定: **REJECT_EXACT_DUPLICATE**

確認済み:
- DriftSync — export bundle、dry-run diff、secret redaction、snapshot、rollback、local-only
- Miroir — component diff、data-loss warning、snapshot
- Easy Staging Migration — preview/dry-run/safety checks
- SnapSettings — WooCommerce config export/restore
- WP Staging Pro / WP Tango — staging diff/push and guarded migration

ローカル処理・秘密マスク・dry-runまで含む直接競合が存在する。

## 7. WordPress update-impact preflight

Workflow:

`plugin/theme update inventory → staging/compatibility/visual/form checks → risk-ranked update → rollback`

判定: **REJECT_EXACT_DUPLICATE / FREE_CORE_EXISTS**

確認済み:
- PatchOn — staging再現、before/after screenshot、fatal/form check、safe apply、backup/restore。free coreあり
  - https://wordpress.org/plugins/patchon-agent/
- WebChange Detector — update前後visual regression、AI noise filtering、free plan
  - https://wordpress.org/plugins/webchangedetector/
- WP Umbrella — restore point、compatibility、visual regression、automatic rollback
  - https://wp-umbrella.com/features/safe-updates/
- Kinsta Automatic Updates — visual test、rollback、multi-site
  - https://kinsta.com/add-ons/kinsta-automatic-updates/
- SmartFix / WP Health Inspector — pre-install impact/conflict/root-cause checks
  - https://smartfixwp.com/
  - https://wphealthinspector.com/

更新前検査・視覚差分・roll backという成果が無料を含めて供給済み。

## 8. Figma Japanese typography / kinsoku QA

Workflow considered:

`Figma text layersをscan → 日本語の禁則・不自然な分割・数字/固有名詞分断・overflowを検出 → safe fixes/report`

判定: **REJECT_INSUFFICIENT_EXACT_PAIN + ADJACENT_PRODUCTS**

確認済み:
- Type Tidy — pasted text line-break cleanup and typography presets
  - https://figma.pluginsage.com/plugins/1571559455397726669
- Vertja — Japanese vertical typesetting helper
  - https://figma.pluginsage.com/plugins/1146329653004129345
- Japanese proofreading plugins already exist in Figma community
- Kumihan sells CJK phrase-aware line breaking in Framer for $25 one-time
  - https://www.framer.com/marketplace/plugins/kumihan/

Figma固有の「日本語禁則QAへ支払う」反復不満と検索/Marketplace acquisitionを確認できなかった。Framerで有料例はあるが、Figma buyerへの移植需要を証明しない。実装しない。

## 9. Shift/pay record backup and payslip mismatch

Workflow considered:

`複数勤務先のshift/actual hours/pay ruleを記録 → expected payを計算 → payslipとの差と証拠を出す`

判定: **REJECT_EXACT_DUPLICATE / HIGH_LEGAL_MAINTENANCE**

App Store公開レビューではdata lossと計算不一致が反復しているが、既に次の成果がある:
- multiple-job shift/pay calculators
- actual payslip amount registration/comparison
- CSV/PDF export and local-only storage
- Japan-specific tax/income-wall/overtime handling

差を「backupが強い」「広告なし」に寄せても主要成果は既存。労基/手当/地域差の保守と誤計算責任も大きい。

## Batch conclusion

今回の候補群は次のいずれかで全て棄却:
- exact paid competitor
- free/first-party substitute
- same buyer outcome already provided
- repeated exact pain/acquisition evidence不足
- legal/schema/support burdenがzero-touchに不適合

したがって現在値は **NO_ACTIVE_CANDIDATE**。商品コード、LP、決済、公開MVPへ進まない。

次のcandidateは、広いcomplaint clusterからではなく、**同一buyerが同一inputを使い、既存商品で未解決の同一outcomeを10件以上具体的に訴えているworkflow**だけを対象にする。
