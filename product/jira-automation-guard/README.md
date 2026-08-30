# Jira Automation Guard

Status: **BUILD_APPROVED — FREE MVP ONLY**

Jira Automation export JSONを、Jiraへ接続せずブラウザ内で静的に確認するMVP。

## Current functions

- 1つのexportをlint
- 2つのexportをrule単位で正規化diff
- volatileな更新日時・version等をdiffから除外
- rule名、状態、trigger/action、component、fingerprint一覧
- duplicate rule name
- custom field参照
- project / issue type / account ID候補
- URL / webhook候補（query/fragmentはレポートから除去）
- token / password / Authorization等のsecret-like key警告（値はマスク）
- その他ハードコードID候補
- JQL/query参照
- Markdown / JSON report
- sample before/after export
- anonymous event counts only

## Privacy

Input JSON and generated reports are processed in the browser. Input content is not sent to this project's server. The app does not store input JSON in localStorage.

## Not implemented / not approved

- Jira credentials or API connection
- import, deploy or automatic rule changes
- Forge / Marketplace listing
- payment
- AI correctness decisions
- customer-specific migration work

## Validation gate

At the first 100 qualified unique devices:

- 30 analyses
- 15 compare/export actions
- 5 Pro-interest actions
- no serious schema/privacy incident

Payment, Jira connection and Marketplace distribution remain forbidden until this gate passes.

## Files

- `core.js` — browser/Node-compatible deterministic parser, analyzer and diff engine
- `app.js` — browser UI and anonymous event tracking
- `index.html`, `styles.css`, `privacy.html`
- `sample-before.json`, `sample-after.json`

## Test

From repository root:

```bash
node tests/jira-automation-guard.smoke.js
```
