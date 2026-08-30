#!/usr/bin/env python3
"""Record completed release hardening without changing product scope."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STATE = ROOT / 'PROJECT_STATE.md'
MARKER = '## Release hardening — 2026-08-30'


def main() -> int:
    text = STATE.read_text(encoding='utf-8')
    assert 'LIVE_FREE_MVP' in text
    if MARKER not in text:
        section = '''
## Release hardening — 2026-08-30
- 公開トップ、privacy、stats、sample JSON、Markdown/JSON出力をGitHub Pagesへ反映
- Node core tests、Python Gate tests、静的HTML/JSON/XML検査、local HTTP smokeを自動化
- Playwrightでdesktop/mobileのサンプル読込→解析→警告→diff→参照一覧→Markdownを実操作確認
- 公開URLでも`?no-track=1`を使って同じmobile E2Eを確認
- local/127.0.0.1/`?no-track=1`では匿名イベントを送らないよう修正
- 本番カウンターを`jira-automation-guard-live-v1`へ分離し、開発・E2Eアクセスの既存カウントをGate母数から除外
- `jira-guard-metrics.yml`で本番匿名ファネルを日次保存し、COLLECTING/PASS_SIGNAL/FAIL_SIGNAL/ACQUISITION_REVIEWを自動判定
- `indexnow-jira-guard.yml`で所有キー公開を確認後、現行商品URLを検索エンジンへ通知
- 上記変更後もapproval scopeは`FREE_MVP_ONLY`のまま。決済・Jira接続・自動修正は未承認

'''
        anchor = '## Current truth\n'
        assert anchor in text
        text = text.replace(anchor, section + anchor, 1)
    # Add workflow bullets if the canonical list predates hardening.
    replacements = {
        '- `smoke.yml`: 商品core、静的release、公開用ファイルを検査\n': '- `smoke.yml`: 商品core、静的release、公開用ファイルを検査\n- `normalize-jag-tracking.yml`: 開発/E2E計測を本番Gateから分離\n- `jira-guard-metrics.yml`: 匿名ファネルとGate判定を日次保存\n- `indexnow-jira-guard.yml`: 公開商品の検索通知\n',
    }
    for old, new in replacements.items():
        if old in text and new not in text:
            text = text.replace(old, new, 1)
    STATE.write_text(text, encoding='utf-8')

    execution = ROOT / 'execution' / '2026-08-30-jira-guard-release-hardening.md'
    execution.parent.mkdir(parents=True, exist_ok=True)
    execution.write_text('''# 2026-08-30 — Jira Automation Guard release hardening

## Completed
1. Published the approved browser-local free MVP to the GitHub Pages root.
2. Verified the public page and sample analysis end to end on desktop and mobile.
3. Verified warning rendering, rule diff, reference inventory and Markdown output.
4. Verified raw sample secrets and URL query tokens do not appear in generated reports.
5. Separated production analytics into `jira-automation-guard-live-v1`.
6. Disabled analytics on localhost, 127.0.0.1, ::1 and `?no-track=1`.
7. Added a daily anonymous metrics snapshot and automatic validation-gate status.
8. Added IndexNow ownership verification and URL submission.
9. Re-ran prebuild gate, Node tests, research tests, metric tests, static validation and public HTTP checks.
10. Preserved `FREE_MVP_ONLY`; no payment, credentials, import/deploy or automatic fixes were added.

## Current external evidence
- Paid customers: 0
- Revenue: ¥0
- Qualified third-party product use: not yet proven
- Pro willingness to pay: not yet proven

No internal test traffic is counted in the new production metric action.
''', encoding='utf-8')
    print({'state': 'updated', 'marker': MARKER})
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
