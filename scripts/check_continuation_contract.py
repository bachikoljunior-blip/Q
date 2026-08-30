#!/usr/bin/env python3
"""Verify that the current discovery queue has a complete, exact review.

A queue update invalidates the prior review by changing its SHA-256 or signal
set. The check deliberately fails until every current row has one terminal
manual disposition.
"""
from __future__ import annotations

import hashlib
import json
import sys
from datetime import datetime
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
QUEUE = ROOT / "research" / "discovery_queue" / "latest.json"
REVIEW = ROOT / "research" / "discovery_queue" / "reviewed_2026-08-30.json"
ACTIVE = ROOT / "research" / "ACTIVE_CANDIDATE.json"
TERMINAL_DECISIONS = {
    "REJECTED",
    "PROMOTED_RESEARCH_ONLY",
    "PROMOTED_OFFER_TEST",
    "BUILD_APPROVED",
}
PROMOTED_DECISIONS = TERMINAL_DECISIONS - {"REJECTED"}


class ContinuationContractError(RuntimeError):
    """Raised when the review is stale, incomplete, or inconsistent."""


def load_json(path: Path) -> dict[str, Any]:
    if not path.is_file():
        raise ContinuationContractError(f"missing required file: {path.relative_to(ROOT)}")
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise ContinuationContractError(f"invalid JSON in {path.relative_to(ROOT)}: {exc}") from exc
    if not isinstance(value, dict):
        raise ContinuationContractError(f"{path.relative_to(ROOT)} must contain a JSON object")
    return value


def parse_iso(value: Any, field: str) -> datetime:
    if not isinstance(value, str) or not value.strip():
        raise ContinuationContractError(f"{field} must be a non-empty ISO timestamp")
    try:
        return datetime.fromisoformat(value)
    except ValueError as exc:
        raise ContinuationContractError(f"{field} is not a valid ISO timestamp: {value!r}") from exc


def validate(root: Path = ROOT, *, emit: bool = True) -> dict[str, Any]:
    queue_path = root / QUEUE.relative_to(ROOT)
    review_path = root / REVIEW.relative_to(ROOT)
    active_path = root / ACTIVE.relative_to(ROOT)

    queue_bytes = queue_path.read_bytes() if queue_path.is_file() else b""
    queue = load_json(queue_path)
    review = load_json(review_path)
    active = load_json(active_path)

    if int(queue.get("schema_version") or 0) < 2:
        raise ContinuationContractError("discovery queue must use schema_version >= 2")
    if queue.get("status") != "EVIDENCE_QUEUE_ONLY" or queue.get("build_approved") is not False:
        raise ContinuationContractError("queue must remain evidence-only and non-approving")

    items = queue.get("items")
    if not isinstance(items, list):
        raise ContinuationContractError("queue.items must be an array")
    if queue.get("item_count") != len(items):
        raise ContinuationContractError(
            f"queue.item_count={queue.get('item_count')!r} does not equal len(items)={len(items)}"
        )

    coverage = queue.get("coverage") or {}
    if isinstance(coverage, dict) and {
        "wordpress_rows",
        "app_store_rows",
    }.issubset(coverage):
        covered = int(coverage["wordpress_rows"]) + int(coverage["app_store_rows"])
        if covered != len(items):
            raise ContinuationContractError(
                f"queue coverage totals {covered}, but queue contains {len(items)} rows"
            )

    queue_ids: list[str] = []
    for index, item in enumerate(items, start=1):
        if not isinstance(item, dict):
            raise ContinuationContractError(f"queue.items[{index}] must be an object")
        signal_id = item.get("signal_id")
        if not isinstance(signal_id, str) or not signal_id.strip():
            raise ContinuationContractError(f"queue.items[{index}] has no signal_id")
        if item.get("status") != "NEEDS_EXACT_WORKFLOW":
            raise ContinuationContractError(
                f"queue.items[{index}] has unexpected status {item.get('status')!r}"
            )
        queue_ids.append(signal_id)
    if len(set(queue_ids)) != len(queue_ids):
        raise ContinuationContractError("queue signal_id values must be unique")

    if int(review.get("schema_version") or 0) < 2:
        raise ContinuationContractError("review must use schema_version >= 2")
    if review.get("status") != "COMPLETE":
        raise ContinuationContractError("review.status must be COMPLETE")
    if review.get("source_file") != str(QUEUE.relative_to(ROOT)):
        raise ContinuationContractError("review.source_file does not point to the canonical queue")
    if review.get("source_schema_version") != queue.get("schema_version"):
        raise ContinuationContractError("review source schema does not match the current queue")

    current_sha = hashlib.sha256(queue_bytes).hexdigest()
    recorded_sha = review.get("source_sha256")
    if recorded_sha != current_sha:
        raise ContinuationContractError(
            "review is stale: current queue SHA-256 "
            f"{current_sha} does not match recorded {recorded_sha!r}"
        )

    if review.get("source_generated_at_jst") != queue.get("generated_at_jst"):
        raise ContinuationContractError("review source timestamp does not match the current queue")
    queue_time = parse_iso(queue.get("generated_at_jst"), "queue.generated_at_jst")
    review_time = parse_iso(review.get("reviewed_at_jst"), "review.reviewed_at_jst")
    if review_time < queue_time:
        raise ContinuationContractError("review timestamp predates the queue it claims to review")

    for field in ("source_item_count", "reviewed_item_count"):
        if review.get(field) != len(items):
            raise ContinuationContractError(
                f"review.{field}={review.get(field)!r} does not equal current queue size {len(items)}"
            )

    dispositions = review.get("dispositions")
    if not isinstance(dispositions, list):
        raise ContinuationContractError("review.dispositions must be an array")
    if len(dispositions) != len(items):
        raise ContinuationContractError(
            f"review has {len(dispositions)} dispositions for {len(items)} queue rows"
        )

    disposition_ids: list[str] = []
    promoted: list[str] = []
    queue_position = {signal_id: index for index, signal_id in enumerate(queue_ids, start=1)}
    for index, disposition in enumerate(dispositions, start=1):
        if not isinstance(disposition, dict):
            raise ContinuationContractError(f"review.dispositions[{index}] must be an object")
        signal_id = disposition.get("signal_id")
        if not isinstance(signal_id, str) or not signal_id:
            raise ContinuationContractError(f"review.dispositions[{index}] has no signal_id")
        if signal_id not in queue_position:
            raise ContinuationContractError(f"review contains obsolete or invented signal_id: {signal_id}")
        if disposition.get("row") != queue_position[signal_id]:
            raise ContinuationContractError(
                f"review row for {signal_id} is {disposition.get('row')!r}; "
                f"current queue position is {queue_position[signal_id]}"
            )
        decision = disposition.get("decision")
        if decision not in TERMINAL_DECISIONS:
            raise ContinuationContractError(
                f"review disposition {signal_id} is not terminal: {decision!r}"
            )
        reason = disposition.get("reason")
        if not isinstance(reason, str) or not reason.strip():
            raise ContinuationContractError(f"review disposition {signal_id} has no reason")
        if decision == "REJECTED":
            veto = disposition.get("veto")
            if not isinstance(veto, str) or not veto.strip():
                raise ContinuationContractError(f"rejected disposition {signal_id} has no veto")
        else:
            promoted.append(signal_id)
        disposition_ids.append(signal_id)

    if len(set(disposition_ids)) != len(disposition_ids):
        raise ContinuationContractError("review disposition signal_id values must be unique")
    if set(disposition_ids) != set(queue_ids):
        missing = sorted(set(queue_ids) - set(disposition_ids))
        extra = sorted(set(disposition_ids) - set(queue_ids))
        raise ContinuationContractError(f"review/queue signal mismatch; missing={missing}, extra={extra}")

    recorded_promoted = review.get("promoted_signal_ids")
    if not isinstance(recorded_promoted, list) or set(recorded_promoted) != set(promoted):
        raise ContinuationContractError(
            f"review.promoted_signal_ids does not match promoted dispositions: {promoted}"
        )

    review_records = review.get("review_records")
    if not isinstance(review_records, list) or not review_records:
        raise ContinuationContractError("review.review_records must name the durable review evidence")
    for relative in review_records:
        if not isinstance(relative, str) or not (root / relative).is_file():
            raise ContinuationContractError(f"missing durable review evidence: {relative!r}")

    if promoted:
        if active.get("status") == "NO_ACTIVE_CANDIDATE" or active.get("candidate_id") is None:
            raise ContinuationContractError("promoted queue rows exist but ACTIVE_CANDIDATE is empty")
    else:
        if review.get("result") != "NO_ACTIVE_CANDIDATE":
            raise ContinuationContractError("zero promotions require review.result=NO_ACTIVE_CANDIDATE")
        if active.get("status") != "NO_ACTIVE_CANDIDATE":
            raise ContinuationContractError("zero promotions require ACTIVE_CANDIDATE=NO_ACTIVE_CANDIDATE")
        if active.get("candidate_id") is not None or active.get("build_approved") is not False:
            raise ContinuationContractError("zero promotions require an empty, non-approved active candidate")

    result = {
        "queue_sha256": current_sha,
        "queue_rows": len(items),
        "reviewed_rows": len(dispositions),
        "wordpress_rows": int(coverage.get("wordpress_rows") or 0),
        "app_store_rows": int(coverage.get("app_store_rows") or 0),
        "promoted_rows": len(promoted),
        "result": "PASS",
    }
    if emit:
        print(json.dumps(result, ensure_ascii=False))
    return result


def main() -> int:
    try:
        validate()
    except (ContinuationContractError, OSError) as exc:
        print(f"CONTINUATION CONTRACT FAILED: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
