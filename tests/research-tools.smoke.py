#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))

from check_continuation_contract import validate as validate_continuation

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

queue = json.loads((ROOT / 'research/discovery_queue/latest.json').read_text(encoding='utf-8'))
assert queue['schema_version'] == 2
assert queue['build_approved'] is False
assert queue['item_count'] == len(queue['items']) == 90
assert queue['coverage']['wordpress_rows'] == 21
assert queue['coverage']['app_store_rows'] == 69
assert all(item['status'] == 'NEEDS_EXACT_WORKFLOW' for item in queue['items'])
continuation = validate_continuation(ROOT, emit=False)
assert continuation['queue_rows'] == continuation['reviewed_rows'] == 90
assert continuation['promoted_rows'] == 0

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
    '.github/workflows/export_research_evidence.yml',
    'research/tools/approve_jira_automation_guard.py',
    'research/tools/sync_active_research.py',
    'research/tools/exact_match_queue.py',
    'research/tools/deep_dive_candidate.py',
    'scripts/publish_jira_automation_guard.py',
    'scripts/update_jira_guard_state.py',
]:
    assert not (ROOT / forbidden).exists(), forbidden

for required in [
    'research/BATCH_VETO_2026-08-30.md',
    'research/EXACT_WORKFLOW_REDUCTION_2026-08-30.md',
    'research/WORDPRESS_EXACT_WORKFLOW_REDUCTION_2026-08-30.md',
    'research/CONTINUATION_CONTRACT.md',
    'research/discovery_queue/reviewed_2026-08-30.json',
    'execution/CURRENT_WORK.json',
    'scripts/check_continuation_contract.py',
]:
    assert (ROOT / required).is_file(), required

print('canonical research pipeline smoke passed: 90/90 queue rows reviewed')
