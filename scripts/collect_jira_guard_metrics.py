#!/usr/bin/env python3
"""Collect anonymous Jira Automation Guard funnel counts and evaluate the free-MVP gate."""
from __future__ import annotations

import argparse
import datetime as dt
import json
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

NAMESPACE = 'bachikoljunior-blip.github.io'
ACTION = 'jira-automation-guard-live-v1'
START_DATE = dt.date(2026, 8, 30)
METRICS = [
    'pageview', 'unique-visitor', 'qualified-device', 'sample-loaded',
    'before-file-loaded', 'after-file-loaded', 'analyze-single', 'analyze-compare',
    'warnings-found', 'secret-warning-found', 'diff-found', 'markdown-copy',
    'markdown-download', 'json-download', 'pro-interest',
]


def now_jst() -> dt.datetime:
    return dt.datetime.now(dt.timezone.utc).astimezone(dt.timezone(dt.timedelta(hours=9)))


def fetch_value(key: str, retries: int = 3) -> int:
    url = f'https://counterapi.com/api/{NAMESPACE}/{ACTION}/{urllib.parse.quote(key)}?readOnly=true'
    request = urllib.request.Request(url, headers={'User-Agent': 'Q-jira-guard-metrics/1.0'})
    last: Exception | None = None
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(request, timeout=20) as response:
                data = json.load(response)
            return int(data.get('value') or 0)
        except urllib.error.HTTPError as exc:
            if exc.code == 404:
                return 0
            last = exc
        except Exception as exc:  # noqa: BLE001
            last = exc
        if attempt + 1 < retries:
            time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f'failed to fetch {key}: {last}')


def evaluate(counts: dict[str, int], days_since_start: int) -> dict[str, Any]:
    qualified = counts.get('qualified-device', 0)
    analyses = counts.get('analyze-single', 0) + counts.get('analyze-compare', 0)
    compare_exports = (
        counts.get('analyze-compare', 0)
        + counts.get('markdown-copy', 0)
        + counts.get('markdown-download', 0)
        + counts.get('json-download', 0)
    )
    pro = counts.get('pro-interest', 0)
    required = {'qualified_devices': 100, 'analyses': 30, 'compare_or_export_actions': 15, 'pro_interest': 5}
    actual = {'qualified_devices': qualified, 'analyses': analyses, 'compare_or_export_actions': compare_exports, 'pro_interest': pro}
    passed = all(actual[key] >= required[key] for key in required)

    if qualified >= required['qualified_devices']:
        status = 'PASS_SIGNAL' if passed else 'FAIL_SIGNAL'
        recommendation = (
            'Free-MVP quantitative gate cleared. Paid/Forge work is still blocked until real-schema safety and competitor re-check are documented.'
            if passed else
            'Qualified sample reached 100 but one or more usage/intent thresholds failed. Do not build payment or Jira connection; close or materially change the wedge.'
        )
    elif days_since_start >= 60:
        status = 'ACQUISITION_REVIEW'
        recommendation = 'The 60-day acquisition boundary was reached before 100 qualified devices. Do not build paid features; review or close acquisition/wedge.'
    else:
        status = 'COLLECTING'
        recommendation = 'Continue the free evidence collection only. Paid features, Jira API, Forge listing and automatic fixes remain blocked.'

    rates = {
        'qualified_per_unique': qualified / counts.get('unique-visitor', 1) if counts.get('unique-visitor') else None,
        'analyses_per_qualified': analyses / qualified if qualified else None,
        'compare_exports_per_qualified': compare_exports / qualified if qualified else None,
        'pro_interest_per_qualified': pro / qualified if qualified else None,
    }
    return {
        'status': status,
        'passed_quantitative_gate': passed,
        'required': required,
        'actual': actual,
        'rates': rates,
        'recommendation': recommendation,
    }


def pct(value: float | None) -> str:
    return '—' if value is None else f'{value * 100:.1f}%'


def markdown(snapshot: dict[str, Any]) -> str:
    gate = snapshot['gate']
    lines = [
        '# Jira Automation Guard automated metrics snapshot',
        '',
        f"最終更新: {snapshot['generated_at_jst']}",
        f"開始から: {snapshot['days_since_start']}日",
        f"判定: **{gate['status']}**",
        '',
        '## Funnel',
        '',
        '| 指標 | 値 |',
        '|---|---:|',
    ]
    for key in METRICS:
        lines.append(f"| `{key}` | {snapshot['counts'].get(key, 0)} |")
    lines += [
        '', '## Derived', '',
        f"- qualified / unique: {pct(gate['rates']['qualified_per_unique'])}",
        f"- analyses / qualified: {pct(gate['rates']['analyses_per_qualified'])}",
        f"- compare or export / qualified: {pct(gate['rates']['compare_exports_per_qualified'])}",
        f"- Pro interest / qualified: {pct(gate['rates']['pro_interest_per_qualified'])}",
        '', '## Gate', '',
        '| 条件 | 実績 | 必要 |',
        '|---|---:|---:|',
    ]
    labels = {
        'qualified_devices': 'Qualified devices',
        'analyses': 'Analyses',
        'compare_or_export_actions': 'Compare/export actions',
        'pro_interest': 'Pro interest',
    }
    for key, label in labels.items():
        lines.append(f"| {label} | {gate['actual'][key]} | {gate['required'][key]} |")
    lines += [
        '', f"**推奨:** {gate['recommendation']}", '',
        '> 公開カウンターによる補助指標です。売上、実顧客、rule精度、Marketplace需要の証明ではありません。入力JSON本文は取得していません。',
        '',
    ]
    return '\n'.join(lines)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('--output-dir', default='metrics/jira-automation-guard')
    parser.add_argument('--input-json', help='Offline counts JSON for tests')
    args = parser.parse_args()
    current = now_jst()
    if args.input_json:
        counts = {key: int(value) for key, value in json.loads(Path(args.input_json).read_text(encoding='utf-8')).items()}
        counts = {key: counts.get(key, 0) for key in METRICS}
    else:
        counts = {key: fetch_value(key) for key in METRICS}
    days = max(0, (current.date() - START_DATE).days)
    snapshot = {
        'schema_version': 1,
        'generated_at_jst': current.replace(microsecond=0).isoformat(),
        'counter_namespace': NAMESPACE,
        'counter_action': ACTION,
        'start_date': START_DATE.isoformat(),
        'days_since_start': days,
        'counts': counts,
        'gate': evaluate(counts, days),
    }
    output = Path(args.output_dir)
    history = output / 'history'
    history.mkdir(parents=True, exist_ok=True)
    (output / 'latest.json').write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (output / 'latest.md').write_text(markdown(snapshot), encoding='utf-8')
    (history / f'{current.date().isoformat()}.json').write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'status': snapshot['gate']['status'], **snapshot['gate']['actual']}, ensure_ascii=False))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
