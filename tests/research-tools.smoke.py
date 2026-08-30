#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def load(name: str, relative: str):
    spec = importlib.util.spec_from_file_location(name, ROOT / relative)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


queue = load('exact_match_queue', 'research/tools/exact_match_queue.py')
deep = load('deep_dive_candidate', 'research/tools/deep_dive_candidate.py')
scan = load('marketplace_signal_scan', 'research/tools/marketplace_signal_scan.py')

assert len(queue.CANDIDATES) >= 5
for candidate in queue.CANDIDATES:
    queries = queue.query_set(candidate)
    assert len(queries) >= 12
    assert candidate.buyer and candidate.input and candidate.processing and candidate.output

candidate = queue.CANDIDATES[0]
strong = {
    'title': 'Jira automation rule JSON diff linter and documentation app pricing',
    'snippet': 'Upload exported rules, compare versions, find hardcoded IDs and export documentation.',
    'url': 'https://example.com/jira-automation-diff',
    'domain': 'example.com',
}
weak = {
    'title': 'General project management tips',
    'snippet': 'How teams organize work.',
    'url': 'https://example.org/tips',
    'domain': 'example.org',
}
assert queue.overlap_score(candidate, strong) > queue.overlap_score(candidate, weak)

classified = queue.classify('complaint', {
    'title': 'Feature request: compare automation rules',
    'snippet': 'We cannot rollback and need version control.',
    'url': 'https://community.atlassian.com/example',
    'domain': 'community.atlassian.com',
}, candidate)
assert classified == 'complaint'

signals = scan.analyze_texts([
    'Feature request: version control and rollback are missing. Please add export and compare versions.',
])
assert signals['negative_hint_count'] > 0
assert signals['pain_counts']['version_diff'] > 0
assert signals['pain_counts']['export_import'] > 0

comparison = deep.overlap({
    'buyer': candidate.buyer,
    'input': candidate.input,
    'processing': candidate.processing,
    'output': candidate.output,
    'price_model': candidate.price_model,
}, {
    **strong,
    'page_title': strong['title'],
    'page_text_excerpt': strong['snippet'],
})
assert 0 <= comparison['weighted_overlap'] <= 1

active = json.loads((ROOT / 'research/ACTIVE_CANDIDATE.json').read_text(encoding='utf-8'))
assert active['build_approved'] is False
assert active['status'] in {'NO_ACTIVE_CANDIDATE', 'RESEARCH_ONLY'}
assert not (ROOT / 'product').exists() or not any((ROOT / 'product').rglob('*'))

sync_source = (ROOT / 'research/tools/sync_active_research.py').read_text(encoding='utf-8')
assert 'assert next_state["build_approved"] is False' in sync_source

print('research tools smoke passed')
