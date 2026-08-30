#!/usr/bin/env python3
"""Approve only the reviewed Jira Automation Guard free MVP.

This script refuses to approve any other candidate and validates the stored
search/deep-dive evidence before writing ACTIVE_CANDIDATE.json.
"""
from __future__ import annotations

import datetime as dt
import json
from pathlib import Path

QUEUE = Path('research/candidate_queue/latest.json')
DEEP = Path('research/deep_dive/latest.json')
REVIEW = Path('research/CANDIDATE_JIRA_AUTOMATION_GUARD.md')
ACTIVE = Path('research/ACTIVE_CANDIDATE.json')
EXPECTED = 'jira-automation-rule-guard'


def now_jst() -> str:
    return (dt.datetime.now(dt.timezone.utc) + dt.timedelta(hours=9)).replace(microsecond=0).isoformat()


def urls(rows, limit=30):
    values=[]
    for row in rows:
        url=row.get('url')
        if url and url not in values:
            values.append(url)
        if len(values)>=limit:
            break
    return values


def main() -> int:
    queue=json.loads(QUEUE.read_text(encoding='utf-8'))
    deep=json.loads(DEEP.read_text(encoding='utf-8'))
    review=REVIEW.read_text(encoding='utf-8')
    candidate=deep.get('candidate') or {}

    assert candidate.get('candidate_id') == EXPECTED, candidate.get('candidate_id')
    assert deep.get('status') == 'MANUAL_FINAL_REVIEW_REQUIRED', deep.get('status')
    counts=deep.get('counts') or {}
    assert int(counts.get('product_pages_fetched') or 0) >= 5
    assert int(counts.get('complaint_pages_fetched') or 0) >= 10
    assert int(counts.get('substitutes') or 0) >= 5
    assert int(counts.get('high_overlap_products') or 0) == 0
    assert len(candidate.get('searches') or []) >= 12
    assert 'BUILD_APPROVED — FREE MVP ONLY' in review
    assert 'Duplicate veto — PASS' in review
    assert 'Stripe決済' in review and 'Explicitly not approved' in review

    repeated=[
        {
            'phrase': item.get('phrase'),
            'source_count': int(item.get('source_count') or 0),
            'examples': item.get('examples', [])[:5],
        }
        for item in deep.get('complaint_phrases', [])
        if int(item.get('source_count') or 0) >= 2
    ]
    assert len(repeated) >= 3

    exact=(
        f"{candidate['buyer']} が {candidate['input']} を入れる → "
        f"{candidate['processing']} → {candidate['output']} を受け取る → {candidate['price_model']}"
    )
    active={
        'schema_version': 1,
        'last_reviewed_jst': now_jst(),
        'status': 'BUILD_APPROVED',
        'candidate_id': EXPECTED,
        'name': 'Jira Automation Guard',
        'build_approved': True,
        'approval_scope': 'FREE_MVP_ONLY',
        'exact_workflow': exact,
        'search_queries': [row['query'] for row in candidate.get('searches', [])],
        'direct_competitors': urls(deep.get('product_evidence', [])),
        'substitutes': urls(deep.get('substitute_evidence', [])),
        'overlap_matrix_complete': True,
        'duplicate_veto': 'PASS',
        'differentiator_evidence': repeated,
        'acquisition_evidence': [
            candidate.get('acquisition_channel'),
            'Exact problem queries are stored in candidate_queue and reviewed in CANDIDATE_JIRA_AUTOMATION_GUARD.md',
            'Atlassian Marketplace adjacent paid products confirm the Jira-admin buyer category; Forge listing is deferred until free-MVP validation.',
        ],
        'economics': {
            **(deep.get('economics') or {}),
            'validation_price_jpy_per_month': 4980,
            'paid_customers_for_300k_mrr': 61,
            'operating_target_customers': '70-80+',
            'approved_payment_state': 'NOT_APPROVED_UNTIL_FREE_MVP_GATE',
        },
        'kill_criteria': [
            'close if a verified product overlaps the exact workflow by 70% or more',
            'close if Jira native or free OSS provides lint + normalized rule diff + reference inventory + readable documentation',
            'close if first 100 qualified devices produce fewer than 30 analyses',
            'close if first 100 qualified devices produce fewer than 15 diff/export actions',
            'close if first 100 qualified devices produce fewer than 5 Pro-interest actions',
            'close if 100 qualified devices are not reached within 60 days without weekly growth',
            'close if real export schemas require recurring customer-specific handling',
            'close if average support exceeds 10 minutes per account per month',
        ],
        'approved_build': {
            'path': 'product/jira-automation-guard',
            'type': 'browser-local static free MVP',
            'allowed': [
                'single export lint', 'two export normalized diff', 'reference inventory',
                'migration warnings', 'Markdown/JSON export', 'sample data', 'anonymous event counts',
            ],
            'forbidden': [
                'payment', 'Jira credentials', 'Jira import/deploy', 'automatic fixes',
                'Forge marketplace submission', 'customer-specific migration work',
            ],
        },
        'reason': 'Automated exact-match/deep-dive thresholds cleared; manual review found adjacent backup/configuration products but no verified product whose core outcome is browser-local Jira Automation export lint + normalized rule diff + reference inventory + readable documentation. Approval is limited to a free MVP.',
    }
    assert len(active['direct_competitors']) >= 5
    assert len(active['substitutes']) >= 5
    assert active['duplicate_veto'] == 'PASS'
    ACTIVE.write_text(json.dumps(active, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print({'status': active['status'], 'candidate': active['candidate_id'], 'scope': active['approval_scope']})
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
