#!/usr/bin/env python3
"""Fail CI when product code or unsupported status claims bypass the prebuild gate."""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
ACTIVE = ROOT / "research" / "ACTIVE_CANDIDATE.json"
ALLOWED_STATUSES = {
    "NO_ACTIVE_CANDIDATE",
    "RESEARCH_ONLY",
    "OFFER_TEST",
    "BUILD_APPROVED",
    "LIVE_FREE_MVP",
    "LIVE_PAID_PRODUCT",
    "CLOSED",
}
BUILD_STATUSES = {"BUILD_APPROVED", "LIVE_FREE_MVP", "LIVE_PAID_PRODUCT"}


def fail(message: str) -> None:
    print(f"PREBUILD GATE FAILED: {message}", file=sys.stderr)
    raise SystemExit(1)


def nonempty_files(path: Path) -> list[str]:
    if not path.exists():
        return []
    return [str(item.relative_to(ROOT)) for item in path.rglob("*") if item.is_file()]


def require(data: dict[str, Any], key: str) -> Any:
    value = data.get(key)
    if value in (None, "", [], {}):
        fail(f"{key} is required for status {data.get('status')}")
    return value


def require_list(data: dict[str, Any], key: str, minimum: int = 0) -> list[Any]:
    value = data.get(key)
    if not isinstance(value, list):
        fail(f"{key} must be an array")
    if len(value) < minimum:
        fail(f"{key} requires at least {minimum} entries; found {len(value)}")
    return value


def validate_research_record(data: dict[str, Any]) -> None:
    require(data, "candidate_id")
    require(data, "name")
    require(data, "exact_workflow")
    require(data, "reason")
    require_list(data, "search_queries", 12)
    # Empty exact competitors are allowed in research, but the field must exist.
    require_list(data, "direct_competitors", 0)
    require_list(data, "substitutes", 5)
    require_list(data, "differentiator_evidence", 1)
    require_list(data, "acquisition_evidence", 1)
    economics = require(data, "economics")
    if not isinstance(economics, dict):
        fail("economics must be an object")
    require_list(data, "kill_criteria", 3)


def validate_competitor_matrix(entries: list[Any]) -> None:
    for index, item in enumerate(entries, start=1):
        if not isinstance(item, dict):
            fail(f"direct_competitors[{index}] must be an object")
        for key in ("name", "source", "buyer", "input", "processing", "output", "price"):
            if item.get(key) in (None, ""):
                fail(f"direct_competitors[{index}].{key} is required")
        overlap = item.get("workflow_overlap_percent")
        if not isinstance(overlap, (int, float)) or not (0 <= overlap <= 100):
            fail(f"direct_competitors[{index}].workflow_overlap_percent must be 0..100")
        dimensions = item.get("matching_dimensions")
        if not isinstance(dimensions, list):
            fail(f"direct_competitors[{index}].matching_dimensions must be an array")


def validate_build_approval(data: dict[str, Any]) -> None:
    require(data, "exact_workflow")
    require_list(data, "search_queries", 12)
    competitors = require_list(data, "direct_competitors", 5)
    require_list(data, "substitutes", 5)
    validate_competitor_matrix(competitors)
    if data.get("overlap_matrix_complete") is not True:
        fail("overlap_matrix_complete must be true")
    if data.get("duplicate_veto") != "PASS":
        fail("duplicate_veto must be PASS")
    high_overlap = [
        item.get("name", "unknown")
        for item in competitors
        if float(item.get("workflow_overlap_percent", 0)) >= 70
    ]
    if high_overlap and not data.get("duplicate_veto_override_evidence"):
        fail(
            "70%+ workflow overlap requires duplicate_veto_override_evidence: "
            + ", ".join(high_overlap)
        )
    require_list(data, "differentiator_evidence", 1)
    require_list(data, "acquisition_evidence", 1)
    economics = require(data, "economics")
    if not isinstance(economics, dict):
        fail("economics must be an object")
    for key in (
        "price_jpy",
        "gross_margin_percent",
        "paid_customers_needed_for_200k",
        "required_free_visitors_per_month",
        "maximum_cac_jpy",
        "support_minutes_per_customer_month",
    ):
        if economics.get(key) is None:
            fail(f"economics.{key} is required for build approval")
    require_list(data, "kill_criteria", 3)


def main() -> None:
    if not ACTIVE.is_file():
        fail("research/ACTIVE_CANDIDATE.json is missing")

    try:
        data = json.loads(ACTIVE.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        fail(f"ACTIVE_CANDIDATE.json is invalid JSON: {exc}")

    status = data.get("status")
    approved = data.get("build_approved")

    if status not in ALLOWED_STATUSES:
        fail(f"unknown status: {status!r}")
    if not isinstance(approved, bool):
        fail("build_approved must be boolean")

    product_files = nonempty_files(ROOT / "product")

    if not approved:
        if status in BUILD_STATUSES:
            fail(f"status {status} requires build_approved=true")
        if product_files:
            fail("product/ contains implementation while build_approved=false: " + ", ".join(product_files))
    else:
        if status not in BUILD_STATUSES:
            fail("build_approved=true requires a build/live status")
        validate_build_approval(data)
        if not product_files:
            print("Gate is approved; product/ is currently empty.")

    if status == "NO_ACTIVE_CANDIDATE":
        if data.get("candidate_id") is not None or data.get("name") is not None:
            fail("NO_ACTIVE_CANDIDATE requires null candidate_id and name")
    elif status in {"RESEARCH_ONLY", "OFFER_TEST"}:
        validate_research_record(data)
        if approved:
            fail(f"{status} must not set build_approved=true")

    if status == "OFFER_TEST":
        offer = require(data, "offer_test")
        if not isinstance(offer, dict):
            fail("offer_test must be an object")
        for key in ("price_jpy", "buyer_action", "traffic_source", "success_threshold", "end_date"):
            if offer.get(key) in (None, ""):
                fail(f"offer_test.{key} is required")

    required_docs = [
        ROOT / "AGENTS.md",
        ROOT / "PROJECT_STATE.md",
        ROOT / "DECISIONS.md",
        ROOT / "research" / "PREBUILD_GATE.md",
        ROOT / "research" / "EXACT_MATCH_SWEEP_2026-08-30.md",
        ROOT / "research" / "MARKETPLACE_SWEEP_2026-08-30.md",
    ]
    missing = [str(path.relative_to(ROOT)) for path in required_docs if not path.is_file()]
    if missing:
        fail("required governance files missing: " + ", ".join(missing))

    index_path = ROOT / "index.html"
    if index_path.is_file() and status not in BUILD_STATUSES:
        index = index_path.read_text(encoding="utf-8")
        if "現在、公開中の商品はありません" not in index:
            fail("public index must not present research or closed work as an active product")
        if "noindex" not in index:
            fail("non-live-product page must be noindex")

    print(
        json.dumps(
            {
                "status": status,
                "candidate_id": data.get("candidate_id"),
                "build_approved": approved,
                "product_files": product_files,
                "result": "PASS",
            },
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()
