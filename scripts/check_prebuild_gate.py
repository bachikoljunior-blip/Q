#!/usr/bin/env python3
"""Fail CI when product code appears before the exact-match gate passes."""

from __future__ import annotations

import json
import sys
from pathlib import Path

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
        if not data.get("exact_workflow"):
            fail("exact_workflow is required")
        if len(data.get("search_queries", [])) < 12:
            fail("at least 12 exact-match search queries are required")
        if len(data.get("direct_competitors", [])) < 5:
            fail("at least 5 direct competitors are required")
        if len(data.get("substitutes", [])) < 5:
            fail("at least 5 substitutes are required")
        if data.get("overlap_matrix_complete") is not True:
            fail("overlap_matrix_complete must be true")
        if data.get("duplicate_veto") != "PASS":
            fail("duplicate_veto must be PASS")
        if not data.get("differentiator_evidence"):
            fail("differentiator_evidence is required")
        if not data.get("acquisition_evidence"):
            fail("acquisition_evidence is required")
        if not data.get("economics"):
            fail("economics is required")
        if not data.get("kill_criteria"):
            fail("kill_criteria is required")
        if not product_files:
            print("Gate is approved; product/ is currently empty.")

    required_docs = [
        ROOT / "AGENTS.md",
        ROOT / "PROJECT_STATE.md",
        ROOT / "DECISIONS.md",
        ROOT / "research" / "PREBUILD_GATE.md",
        ROOT / "research" / "EXACT_MATCH_SWEEP_2026-08-30.md",
    ]
    missing = [str(path.relative_to(ROOT)) for path in required_docs if not path.is_file()]
    if missing:
        fail("required governance files missing: " + ", ".join(missing))

    if status == "NO_ACTIVE_CANDIDATE":
        index = (ROOT / "index.html").read_text(encoding="utf-8")
        if "現在、公開中の商品はありません" not in index:
            fail("public index must not present a closed experiment as an active product")
        if "noindex" not in index:
            fail("no-active-product page must be noindex")

    print(
        json.dumps(
            {
                "status": status,
                "build_approved": approved,
                "product_files": product_files,
                "result": "PASS",
            },
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()
