#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('metrics', ROOT / 'scripts/collect_jira_guard_metrics.py')
assert spec and spec.loader
metrics = importlib.util.module_from_spec(spec)
spec.loader.exec_module(metrics)

base = {key: 0 for key in metrics.METRICS}

collecting = metrics.evaluate(base, 1)
assert collecting['status'] == 'COLLECTING'
assert collecting['passed_quantitative_gate'] is False

passing = dict(base)
passing.update({
    'unique-visitor': 180,
    'qualified-device': 100,
    'analyze-single': 20,
    'analyze-compare': 15,
    'markdown-download': 5,
    'json-download': 2,
    'pro-interest': 5,
})
passed = metrics.evaluate(passing, 20)
assert passed['status'] == 'PASS_SIGNAL'
assert passed['passed_quantitative_gate'] is True
assert passed['actual']['analyses'] == 35
assert passed['actual']['compare_or_export_actions'] == 22

failing = dict(base)
failing.update({'qualified-device': 100, 'analyze-single': 10, 'pro-interest': 1})
failed = metrics.evaluate(failing, 20)
assert failed['status'] == 'FAIL_SIGNAL'
assert failed['passed_quantitative_gate'] is False

stalled = metrics.evaluate(base, 60)
assert stalled['status'] == 'ACQUISITION_REVIEW'

print('jira guard metrics smoke passed')
