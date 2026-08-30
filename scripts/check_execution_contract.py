#!/usr/bin/env python3
from __future__ import annotations
import json, sys
from pathlib import Path
from check_continuation_contract import ContinuationContractError, validate as validate_continuation
ROOT=Path(__file__).resolve().parents[1]; TERMINAL={'DONE','REJECTED','BLOCKED_EXTERNAL'}; BUILD={'BUILD_APPROVED','LIVE_FREE_MVP','LIVE_PAID_PRODUCT'}
def fail(m): print('EXECUTION CONTRACT FAILED: '+m,file=sys.stderr); raise SystemExit(1)
work=json.loads((ROOT/'execution/CURRENT_WORK.json').read_text(encoding='utf-8')); active=json.loads((ROOT/'research/ACTIVE_CANDIDATE.json').read_text(encoding='utf-8'))
if work.get('finalization_state')!='READY_TO_REPORT': fail('finalization_state must be READY_TO_REPORT')
tasks=work.get('tasks')
if not isinstance(tasks,list) or not tasks: fail('tasks must be non-empty')
for i,t in enumerate(tasks,1):
    if t.get('status') not in TERMINAL or not t.get('id') or not t.get('evidence'): fail(f'task {i} is not terminal/evidenced')
try: continuation=validate_continuation(ROOT,emit=False)
except (ContinuationContractError,OSError,ValueError) as e: fail(f'stale discovery review: {e}')
status=active.get('status'); approved=active.get('build_approved'); product=ROOT/'product'; files=[] if not product.exists() else [p for p in product.rglob('*') if p.is_file()]
if status in BUILD:
    if approved is not True or not files: fail('build/live status requires build_approved=true and product files')
else:
    if approved is not False or files: fail('non-build status cannot retain product implementation')
if status=='LIVE_FREE_MVP':
    for k in ['public_url','measurable_outcome','claim_limits','kill_criteria']:
        if not active.get(k): fail(f'LIVE_FREE_MVP requires {k}')
    if active.get('economics',{}).get('price_jpy')!=0: fail('LIVE_FREE_MVP must have price_jpy=0')
    if not (ROOT/'product/script-overlap-audit/index.html').is_file(): fail('EXP005 public app missing')
    if not (ROOT/'tests/script-overlap-audit.smoke.js').is_file(): fail('EXP005 smoke test missing')
for p in ['.github/workflows/temp_export_current_review.yml','.github/workflows/temp_repair_review_ids.yml','.github/workflows/export_research_evidence.yml']:
    if (ROOT/p).exists(): fail(f'temporary workflow remains: {p}')
print(json.dumps({'cycle_id':work.get('cycle_id'),'status':status,'terminal_tasks':len(tasks),'reviewed_queue_rows':continuation['reviewed_rows'],'product_files':len(files),'result':'PASS'},ensure_ascii=False))
