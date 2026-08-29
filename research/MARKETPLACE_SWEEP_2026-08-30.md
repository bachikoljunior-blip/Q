# MARKETPLACE-FIRST SWEEP — 2026-08-30

## Result

- `BUILD_APPROVED`: **0**
- `LIVE PRODUCT`: **0**
- one research-only lead: `SECURITY_PRACTICAL_VOICE_TRAINER`
- current status remains honest: no product is being sold or built

This pass did not stop at idea generation. It also audited the existing `bachikoljunior-blip/youtube` asset against the current official YouTube monetization policy and hard-paused its generation/upload tactic.

## Critical correction — existing YouTube tactic

Official YouTube monetization policy reviewed 2026-08-30 says channels must not be mass-produced, generic, repetitive or template-based. It also explicitly says channels using AI-generated personas that present themselves as human experts on sensitive topics such as finances or legal issues are not allowed to monetize.

Current repository configuration was:
- niche: Japanese money, tax and career guidance
- persona: claims to be a former corporate accounting/HR practitioner
- synthetic TTS
- automated template pipeline

Therefore increasing output under the current format does not merely have weak growth; it conflicts with the target monetization gate.

Executed in `bachikoljunior-blip/youtube`:
- added `AUTOMATION_PAUSED.md`
- added code-level generation/upload guard
- added Claude session reminder hook
- added CI proving generation entry points are blocked while analytics remain allowed
- preserved existing channel data and videos

Official policy:
https://support.google.com/youtube/answer/1311392

## Marketplace categories searched and rejected

The following were searched by exact buyer + input + processing + output, not just by problem category:

1. kintone invoice-registration-number monitor/checker
2. Confluence/Jira Japanese proofreading and terminology enforcement
3. Confluence/Jira Japanese search enhancement
4. Jira Japanese business-day/holiday calculation
5. Shopify Japanese address/carrier preflight
6. Shopify remote-island/custom shipping rules
7. kintone admin/permission/security audit
8. Canva Japanese furigana/typography helpers
9. Framer Japanese CMS romaji slugs
10. Framer CMS preflight/audit
11. Framer CMS backup/versioning
12. Stripe Japanese qualified-invoice generation
13. public tender alerting
14. YouTube monetization/compliance audit
15. employee payslip/timesheet discrepancy checking

Each either had exact paid competitors, strong first-party functionality, strong free/OSS substitutes, or no credible distribution/economics path to ¥200k/month without individualized sales.

## Rejected YouTube compliance tool workflow

Exact workflow considered:

`faceless/AI YouTube creator uploads channel/video metadata and scripts → system scores synthetic-voice risk, transcript/template overlap, thumbnail similarity and YPP policy risk → creator receives a compliance dashboard/report → monthly SaaS`

Rejected because exact products already offer the core workflow, including:
- AI voice probability / voice uniqueness
- transcript or script overlap
- thumbnail similarity/pattern diversity
- upload cadence and template risk
- compliance dashboard/audit

A Japanese wrapper would repeat the previous mistake: localization without a buyer-changing outcome.

## Rejected worker-pay audit workflow

Exact workflow considered:

`shift worker imports clock records and payslip → app recalculates hours/overtime/allowances → flags discrepancies and produces evidence → consumer subscription`

Rejected because consumer apps already market the same result: comparing expected pay with payslips, catching missing pay before payday and producing evidence to challenge underpayment. Legal/award complexity would also create high maintenance and liability.

# Research-only lead — security practical/oral exam trainer

## Status

`RESEARCH_ONLY` — not an offer, not a product, not approved for implementation.

## Exact workflow under study

`Japanese security-certification candidate selects a practical/oral procedure → speaks the procedure into an iPhone → on-device transcription scores required keywords, order and time → user receives missed-step drills and timed mock oral exams → one-time mobile purchase`

Initial focus considered:
- 交通誘導警備業務2級
- later expansion across facility/crowd-control/security-certification practical exams only if the first market is proven

## Search queries executed

1. 交通誘導警備業務2級 実技 口述 練習 音声 アプリ
2. 交通誘導警備業務2級 実技 口述 模擬試験 オンライン
3. 交通誘導警備業務2級 実技 動画 教材 価格
4. 交通誘導警備業務2級 口述 対策 教材
5. site:play.google.com 交通誘導警備業務2級 試験対策 アプリ
6. 交通誘導警備業務2級 実技 アプリ
7. 交通誘導警備業務2級 口述 アプリ
8. 交通誘導警備業務2級 実技 オンライン講座
9. 警備員 資格 試験 アプリ 交通誘導警備業務2級
10. 交通誘導警備業務2級 特別講習 受講者数 年間
11. 警備業務検定 受験者数 交通誘導 2級 年間
12. site:npa.go.jp 警備業 交通誘導警備業務2級 合格者数
13. App Store 交通誘導警備業務2級 試験対策
14. 交通誘導警備業務2級 事前講習 価格

## Paid evidence found

- paid iOS study app at ¥800 with public reviews
- other freemium and free apps with 300–1,000+ academic questions
- textbook at ¥3,300
- one-day pre-course at ¥6,600
- member two-day pre-course at ¥10,560
- practical-training DVDs in adjacent security certifications at ¥27,300–¥54,600

This proves people and employers pay for exam preparation. It does **not** prove willingness to pay for speech-scored oral practice.

## Unresolved gap evidence

- multiple existing apps explicitly cover academic questions and state that practical examination requires separate training
- public reviews complain that questions are too easy or do not resemble the real exam wording
- a 2026 association notice says part of the traffic-control practical exam changed, showing that currentness matters

## Why it is not build-approved

1. No exact speech-scored practical/oral app was confirmed, but the mandatory five direct exact competitors are also not available for a reliable overlap matrix.
2. Accurate practical rubrics and current exam content may depend on copyrighted/proprietary training materials.
3. The owner has security work experience but no verified qualification/content-authority record in Q.
4. Speech scoring cannot validate physical performance.
5. Market size for one exam and one-time price is not yet proven.
6. App Store distribution is plausible, but ranking/search volume/CAC are unmeasured.
7. At a hypothetical ¥2,980 one-time price, ¥200k monthly gross requires about 68 sales every month; annual demand and conversion are unknown.

## Evidence required before OFFER_TEST

- legally usable, current learning objectives/rubrics
- at least 10 repeated public complaints specifically about practical/oral solo practice
- measurable App Store/search demand for practical—not only academic—preparation
- a realistic annual candidate count for the exact exam set
- proof that an original content set can be reviewed by a qualified person without creating per-customer work
- economics showing enough sales at a credible price

## Decision

Do not build. Keep as `RESEARCH_ONLY`. The current next boundary is evidence acquisition, not implementation.
