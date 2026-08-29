#!/usr/bin/env python3
"""Snapshot anonymous EXP004 funnel metrics and evaluate the pre-paid gate.

No seller data, uploaded CSV contents, IP addresses, or account identifiers are read.
Only public aggregate counters are fetched.
"""
from __future__ import annotations

import json
import math
import time
import urllib.error
import urllib.request
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

NAMESPACE = "bachikoljunior-blip.github.io"
ACTION = "fba-reimbursement-cost-audit"
START_DATE = date(2026, 8, 29)
JST = timezone(timedelta(hours=9))
METRICS = [
    "pageview",
    "unique-visitor",
    "sample-loaded",
    "report-loaded",
    "cost-loaded",
    "audit-run",
    "shortfall-found",
    "deadline-found",
    "audit-export",
    "claim-pack-copy",
    "claim-pack-download",
    "monthly-interest",
]


def fetch_metric(key: str) -> int:
    url = (
        f"https://counterapi.com/api/{NAMESPACE}/{ACTION}/"
        f"{urllib.parse.quote(key, safe='')}?readOnly=true"
    )
    last_error: Exception | None = None
    for attempt in range(4):
        try:
            request = urllib.request.Request(
                url,
                headers={"User-Agent": "Q-EXP004-Metrics/1.0", "Accept": "application/json"},
            )
            with urllib.request.urlopen(request, timeout=25) as response:
                data = json.load(response)
            value = data.get("value", 0)
            return max(0, int(value or 0))
        except urllib.error.HTTPError as exc:
            if exc.code == 404:
                return 0
            last_error = exc
        except Exception as exc:  # network errors are retried
            last_error = exc
        time.sleep(3 * (attempt + 1))
    raise RuntimeError(f"failed to read {key}: {last_error!r}")


def pct(numerator: int, denominator: int) -> float | None:
    if denominator <= 0:
        return None
    return round(numerator / denominator * 100, 1)


def fmt_pct(value: float | None) -> str:
    return "—" if value is None else f"{value:.1f}%"


def main() -> None:
    now = datetime.now(JST)
    metrics = {key: fetch_metric(key) for key in METRICS}
    unique = metrics["unique-visitor"]
    audits = metrics["audit-run"]
    actions = (
        metrics["audit-export"]
        + metrics["claim-pack-copy"]
        + metrics["claim-pack-download"]
    )
    interest = metrics["monthly-interest"]
    elapsed_days = (now.date() - START_DATE).days

    gate = {
        "required_unique_devices": 100,
        "required_audits": 30,
        "required_export_or_case_actions": 10,
        "required_monthly_interest": 5,
    }
    if unique < gate["required_unique_devices"]:
        decision = "COLLECTING"
        recommendation = "有料版を作らず、実利用の母数を集める。"
    else:
        passed = (
            audits >= gate["required_audits"]
            and actions >= gate["required_export_or_case_actions"]
            and interest >= gate["required_monthly_interest"]
        )
        decision = "PASS" if passed else "FAIL"
        recommendation = (
            "実ファイル互換性と誤検出を確認してから、最小の課金テストへ進む。"
            if passed
            else "課金機能を作らずEXP004を本命から降格し、未解決の有料課題探索へ戻る。"
        )

    acquisition_flag = "OK"
    if elapsed_days >= 30 and unique < 100:
        acquisition_flag = "WEAK_30D"
    elif elapsed_days >= 14 and unique < 30:
        acquisition_flag = "WEAK_14D"

    snapshot = {
        "generated_at_jst": now.isoformat(timespec="seconds"),
        "experiment_start": START_DATE.isoformat(),
        "elapsed_days": elapsed_days,
        "source": "public aggregate CounterAPI counters",
        "privacy": "No uploaded seller data or file contents are collected.",
        "metrics": metrics,
        "derived": {
            "audit_rate_percent": pct(audits, unique),
            "export_or_case_actions": actions,
            "action_rate_percent": pct(actions, audits),
            "monthly_interest_rate_percent": pct(interest, unique),
        },
        "gate": gate,
        "decision": decision,
        "acquisition_flag": acquisition_flag,
        "recommendation": recommendation,
    }

    out_dir = Path("metrics")
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "latest.json").write_text(
        json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    rows = "\n".join(f"| `{key}` | {value:,} |" for key, value in metrics.items())
    markdown = f"""# EXP004 automated metrics snapshot

最終更新: {snapshot['generated_at_jst']}  
開始から: {elapsed_days}日  
判定: **{decision}**  
流入フラグ: **{acquisition_flag}**

## Funnel

| 指標 | 値 |
|---|---:|
{rows}

## Derived

- 監査実行率: {fmt_pct(snapshot['derived']['audit_rate_percent'])}
- 出力/ケース作成アクション合計: {actions:,}
- 監査後アクション率: {fmt_pct(snapshot['derived']['action_rate_percent'])}
- 月額利用意向率: {fmt_pct(snapshot['derived']['monthly_interest_rate_percent'])}

## Paid-development gate

- ユニーク端末: {unique:,} / {gate['required_unique_devices']:,}
- 監査実行: {audits:,} / {gate['required_audits']:,}
- 出力またはケース作成: {actions:,} / {gate['required_export_or_case_actions']:,}
- 月額利用意向: {interest:,} / {gate['required_monthly_interest']:,}

**推奨:** {recommendation}

> この集計は公開カウンターによる補助指標です。売上、回収額、実顧客、精度の証明ではありません。販売者のCSV本文や個人情報は取得していません。
"""
    (out_dir / "latest.md").write_text(markdown, encoding="utf-8")


if __name__ == "__main__":
    # urllib.parse is imported lazily above through the package; make it explicit for type checkers.
    import urllib.parse

    main()
