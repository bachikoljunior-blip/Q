#!/usr/bin/env python3
"""Bind the canonical discovery queue to its terminal review without blocking independently approved experiments."""
from __future__ import annotations
import hashlib, json, sys
from datetime import datetime
from pathlib import Path
from typing import Any
ROOT=Path(__file__).resolve().parents[1]
QUEUE=ROOT/'research/discovery_queue/latest.json'; REVIEW=ROOT/'research/discovery_queue/reviewed_2026-08-30.json'; ACTIVE=ROOT/'research/ACTIVE_CANDIDATE.json'
TERMINAL={'REJECTED','PROMOTED_RESEARCH_ONLY','PROMOTED_OFFER_TEST','BUILD_APPROVED'}
class ContinuationContractError(RuntimeError): pass
def load(p:Path)->dict[str,Any]:
    if not p.is_file(): raise ContinuationContractError(f'missing {p.relative_to(ROOT)}')
    try:v=json.loads(p.read_text(encoding='utf-8'))
    except Exception as e: raise ContinuationContractError(f'invalid JSON in {p.relative_to(ROOT)}: {e}') from e
    if not isinstance(v,dict): raise ContinuationContractError(f'{p.relative_to(ROOT)} must be an object')
    return v
def iso(v:Any,name:str):
    try:return datetime.fromisoformat(v)
    except Exception as e: raise ContinuationContractError(f'{name} invalid timestamp') from e
def validate(root:Path=ROOT,*,emit:bool=True)->dict[str,Any]:
    qpath=root/'research/discovery_queue/latest.json'; rpath=root/'research/discovery_queue/reviewed_2026-08-30.json'; apath=root/'research/ACTIVE_CANDIDATE.json'
    q=load(qpath); r=load(rpath); a=load(apath); items=q.get('items')
    if int(q.get('schema_version') or 0)<2 or q.get('status')!='EVIDENCE_QUEUE_ONLY' or q.get('build_approved') is not False: raise ContinuationContractError('queue must remain schema-v2+ evidence-only')
    if not isinstance(items,list) or q.get('item_count')!=len(items): raise ContinuationContractError('queue count mismatch')
    ids=[]
    for i,x in enumerate(items,1):
        if not isinstance(x,dict) or not x.get('signal_id') or x.get('status')!='NEEDS_EXACT_WORKFLOW': raise ContinuationContractError(f'queue row {i} invalid')
        ids.append(x['signal_id'])
    if len(ids)!=len(set(ids)): raise ContinuationContractError('duplicate queue signal IDs')
    sha=hashlib.sha256(qpath.read_bytes()).hexdigest()
    if int(r.get('schema_version') or 0)<2 or r.get('status')!='COMPLETE': raise ContinuationContractError('review incomplete')
    if r.get('source_file')!='research/discovery_queue/latest.json' or r.get('source_sha256')!=sha: raise ContinuationContractError('review stale against queue bytes')
    if r.get('source_generated_at_jst')!=q.get('generated_at_jst') or iso(r.get('reviewed_at_jst'),'review')<iso(q.get('generated_at_jst'),'queue'): raise ContinuationContractError('review time/source mismatch')
    if r.get('source_item_count')!=len(items) or r.get('reviewed_item_count')!=len(items): raise ContinuationContractError('reviewed count mismatch')
    disp=r.get('dispositions')
    if not isinstance(disp,list) or len(disp)!=len(items): raise ContinuationContractError('disposition count mismatch')
    dids=[]; promoted=[]
    for pos,d in enumerate(disp,1):
        if not isinstance(d,dict) or d.get('signal_id')!=ids[pos-1] or d.get('row')!=pos: raise ContinuationContractError(f'disposition {pos} does not match queue order')
        if d.get('decision') not in TERMINAL or not d.get('reason'): raise ContinuationContractError(f'disposition {pos} is not terminal/evidenced')
        if d.get('decision')=='REJECTED' and not d.get('veto'): raise ContinuationContractError(f'disposition {pos} has no veto')
        if d.get('decision')!='REJECTED': promoted.append(d['signal_id'])
        dids.append(d['signal_id'])
    if r.get('promoted_signal_ids')!=promoted: raise ContinuationContractError('promoted ID list mismatch')
    if promoted:
        if a.get('status')=='NO_ACTIVE_CANDIDATE' or not a.get('candidate_id'): raise ContinuationContractError('queue promotions require active candidate')
    elif a.get('status')!='NO_ACTIVE_CANDIDATE':
        ev=a.get('evidence_review') or {}
        if a.get('candidate_origin')!='INDEPENDENT_LOW_COST_MVP': raise ContinuationContractError('zero queue promotions require NO_ACTIVE_CANDIDATE or declared independent low-cost MVP')
        if ev.get('source_sha256')!=sha or ev.get('reviewed_item_count')!=len(items): raise ContinuationContractError('independent MVP must preserve current queue review boundary')
    coverage=q.get('coverage') or {}
    result={'queue_sha256':sha,'queue_rows':len(items),'reviewed_rows':len(disp),'wordpress_rows':int(coverage.get('wordpress_rows') or 0),'app_store_rows':int(coverage.get('app_store_rows') or 0),'promoted_rows':len(promoted),'active_status':a.get('status'),'result':'PASS'}
    if emit: print(json.dumps(result,ensure_ascii=False))
    return result
def main():
    try:validate()
    except (ContinuationContractError,OSError,ValueError) as e: print('CONTINUATION CONTRACT FAILED: '+str(e),file=sys.stderr); return 1
    return 0
if __name__=='__main__': raise SystemExit(main())
