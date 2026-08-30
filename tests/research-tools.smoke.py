#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

active = json.loads((ROOT / 'research/ACTIVE_CANDIDATE.json').read_text(encoding='utf-8'))
assert active['status'] == 'NO_ACTIVE_CANDIDATE'
assert active['build_approved'] is False
assert active['candidate_id'] is None
assert not (ROOT / 'product').exists() or not any(path.is_file() for path in (ROOT / 'product').rglob('*'))

market = json.loads((ROOT / 'research/marketplace_scan/latest.json').read_text(encoding='utf-8'))
shortlist = json.loads((ROOT / 'research/marketplace_scan/shortlist.json').read_text(encoding='utf-8'))
complaints = json.loads((ROOT / 'research/marketplace_scan/complaints.json').read_text(encoding='utf-8'))
assert market['schema_version'] == 2
assert 'never auto-approve' in market['purpose']
assert isinstance(market['records'], list) and market['records']
assert shortlist['build_approved'] is False
assert complaints['build_approved'] is False

app = json.loads((ROOT / 'research/app_store_scan/latest.json').read_text(encoding='utf-8'))
reviews = json.loads((ROOT / 'research/app_store_scan/reviews.json').read_text(encoding='utf-8'))
assert app['build_approved'] is False
assert reviews['build_approved'] is False

queue_path = ROOT / 'research/discovery_queue/latest.json'
if queue_path.is_file():
    queue = json.loads(queue_path.read_text(encoding='utf-8'))
    assert queue['build_approved'] is False
    assert all(item['status'] == 'NEEDS_EXACT_WORKFLOW' for item in queue.get('items', []))

canonical = ROOT / '.github/workflows/marketplace_scan.yml'
assert canonical.is_file()
canonical_text = canonical.read_text(encoding='utf-8')
assert 'Canonical writer for research/marketplace_scan' in canonical_text

for forbidden in [
    '.github/workflows/marketplace-scan.yml',
    '.github/workflows/approve-jira-guard.yml',
    '.github/workflows/build-jira-guard.yml',
    '.github/workflows/finalize-jira-guard-state.yml',
    '.github/workflows/jira-guard-metrics.yml',
    'research/tools/approve_jira_automation_guard.py',
    'research/tools/sync_active_research.py',
    'research/tools/exact_match_queue.py',
    'research/tools/deep_dive_candidate.py',
    'scripts/publish_jira_automation_guard.py',
    'scripts/update_jira_guard_state.py',
]:
    assert not (ROOT / forbidden).exists(), forbidden

assert (ROOT / 'research/BATCH_VETO_2026-08-30.md').is_file()
assert (ROOT / 'execution/CURRENT_WORK.json').is_file()

print('canonical research pipeline smoke passed')
