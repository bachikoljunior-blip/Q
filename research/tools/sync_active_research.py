#!/usr/bin/env python3
"""Synchronize the best research candidate without granting build approval."""
from __future__ import annotations

import datetime as dt
import json
from pathlib import Path
from typing import Any

ACTIVE = Path("research/ACTIVE_CANDIDATE.json")
DEEP = Path("research/deep_dive/latest.json")


def now_jst() -> str:
    return (dt.datetime.now(dt.timezone.utc) + dt.timedelta(hours=9)).replace(microsecond=0).isoformat()


def urls(rows: list[dict[str, Any]], limit: int = 20) -> list[str]:
    out: list[str] = []
    for row in rows:
        value = row.get("url")
        if value and value not in out:
            out.append(value)
        if len(out) >= limit:
            break
    return out


def main() -> int:
    current = json.loads(ACTIVE.read_text(encoding="utf-8"))
    if not DEEP.exists():
        print("deep-dive report missing; no change")
        return 0
    report = json.loads(DEEP.read_text(encoding="utf-8"))
    candidate = report.get("candidate")
    status = report.get("status")

    if not candidate or status in {"NO_CANDIDATE_TO_DEEP_DIVE", "REJECT_EXACT_DUPLICATE"}:
        next_state = {
            "schema_version": 1,
            "last_reviewed_jst": now_jst(),
            "status": "NO_ACTIVE_CANDIDATE",
            "candidate_id": None,
            "name": None,
            "build_approved": False,
            "exact_workflow": None,
            "search_queries": [],
            "direct_competitors": [],
            "substitutes": [],
            "overlap_matrix_complete": False,
            "duplicate_veto": "NOT_PASSED",
            "differentiator_evidence": [],
            "acquisition_evidence": [],
            "economics": None,
            "kill_criteria": [],
            "reason": report.get("reason", "No candidate survived the exact-match/deep-dive process."),
        }
    else:
        exact = (
            f"{candidate['buyer']} が {candidate['input']} を入れる → "
            f"{candidate['processing']} → {candidate['output']} を受け取る → {candidate['price_model']}"
        )
        repeated = [
            {
                "phrase": item.get("phrase"),
                "source_count": item.get("source_count"),
                "examples": item.get("examples", [])[:5],
            }
            for item in report.get("complaint_phrases", [])
            if int(item.get("source_count") or 0) >= 2
        ]
        next_state = {
            "schema_version": 1,
            "last_reviewed_jst": now_jst(),
            "status": "RESEARCH_ONLY",
            "candidate_id": candidate["candidate_id"],
            "name": candidate["candidate_id"].replace("-", " ").title(),
            "build_approved": False,
            "exact_workflow": exact,
            "search_queries": [row["query"] for row in candidate.get("searches", [])],
            "direct_competitors": urls(report.get("product_evidence", [])),
            "substitutes": urls(report.get("substitute_evidence", [])),
            "overlap_matrix_complete": len(report.get("product_evidence", [])) >= 5,
            "duplicate_veto": "MANUAL_REVIEW_REQUIRED" if status == "MANUAL_FINAL_REVIEW_REQUIRED" else "NOT_PASSED",
            "differentiator_evidence": repeated,
            "acquisition_evidence": [candidate.get("acquisition_channel")],
            "economics": report.get("economics"),
            "kill_criteria": [
                "reject if any verified product overlaps buyer/input/processing/output by 70% or more",
                "reject if a free or platform-native substitute provides the core outcome",
                "reject if fewer than 10 independent complaint sources survive manual verification",
                "reject if no marketplace/search acquisition path can reach the calculated qualified traffic",
                "reject if average support exceeds 10 minutes per account per month",
            ],
            "reason": (
                f"Deep-dive status is {status}. This is the current research target only; "
                "product code, landing pages and payment remain forbidden until manual source verification completes."
            ),
        }

    # The sync tool is structurally unable to approve a build.
    assert next_state["build_approved"] is False
    ACTIVE.write_text(json.dumps(next_state, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"status": next_state["status"], "candidate_id": next_state["candidate_id"]}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
