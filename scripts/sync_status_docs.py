#!/usr/bin/env python3
from __future__ import annotations
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; a=json.loads((ROOT/'research/ACTIVE_CANDIDATE.json').read_text(encoding='utf-8')); w=json.loads((ROOT/'execution/CURRENT_WORK.json').read_text(encoding='utf-8'))
required={'PROJECT_STATE.md':['LIVE_FREE_MVP','台本かぶり監査'],'START_HERE.md':['LIVE_FREE_MVP','script-overlap-audit'],'README.md':['LIVE_FREE_MVP','script-overlap-audit'],'AGENTS.md':['LIVE_FREE_MVP','Execution reality'],'index.html':['LIVE_FREE_MVP','product/script-overlap-audit/']}
for path,needles in required.items():
    text=(ROOT/path).read_text(encoding='utf-8')
    for n in needles: assert n in text,f'{path} missing {n}'
assert a['status']=='LIVE_FREE_MVP' and a['build_approved'] is True and w['finalization_state']=='READY_TO_REPORT'
print(json.dumps({'status':a['status'],'work':w['finalization_state'],'validated':True},ensure_ascii=False))
