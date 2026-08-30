#!/usr/bin/env python3
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; a=json.loads((ROOT/'research/ACTIVE_CANDIDATE.json').read_text(encoding='utf-8')); q=json.loads((ROOT/'research/discovery_queue/latest.json').read_text(encoding='utf-8')); r=json.loads((ROOT/'research/discovery_queue/reviewed_2026-08-30.json').read_text(encoding='utf-8'))
assert q['build_approved'] is False and len(q['items'])==90
assert r['reviewed_item_count']==90 and r['status']=='COMPLETE'
assert a['status']=='LIVE_FREE_MVP' and a['build_approved'] is True
assert (ROOT/'product/script-overlap-audit/index.html').is_file() and (ROOT/'product/script-overlap-audit/analysis-core.js').is_file()
assert a['claim_limits'] and a['kill_criteria']
print('research/product smoke passed')
