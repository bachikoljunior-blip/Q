#!/usr/bin/env python3
"""Aggregate marketplace complaint signals into a manual evidence queue.

The queue is deliberately not a candidate selector. It cannot edit
ACTIVE_CANDIDATE.json or create product code.
"""

from __future__ import annotations

import datetime as dt
import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
WORDPRESS = ROOT / "research" / "marketplace_scan" / "complaints.json"
APPSTORE = ROOT / "research" / "app_store_scan" / "reviews.json"
OUT_DIR = ROOT / "research" / "discovery_queue"
OUT_DIR.mkdir(parents=True, exist_ok=True)

WORDPRESS_CLUSTERS = {
    "invoice_pdf",
    "import_export",
    "booking",
    "subscription",
    "accessibility",
    "shipping",
    "payments",
    "email_delivery",
    "permissions",
}
APP_CLUSTERS = {
    "accuracy_mismatch",
    "content_too_easy_or_shallow",
    "missing_feature",
    "data_loss_sync",
    "voice_or_speech",
    "offline_privacy",
}


def load(path: Path) -> dict[str, Any] | None:
    if not path.is_file():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def wordpress_queue(data: dict[str, Any] | None) -> list[dict[str, Any]]:
    if not data:
        return []
    clusters = data.get("clusters") or {}
    examples = data.get("examples") or {}
    rows: list[dict[str, Any]] = []
    for cluster in WORDPRESS_CLUSTERS:
        count = int(clusters.get(cluster) or 0)
        if count < 10:
            continue
        rows.append(
            {
                "source": "wordpress",
                "signal_id": f"wordpress:{cluster}",
                "cluster": cluster,
                "matched_items": count,
                "status": "NEEDS_EXACT_WORKFLOW",
                "examples": list(examples.get(cluster) or [])[:12],
                "required_next_evidence": [
                    "read examples and define one buyer/input/processing/output outcome",
                    "separate plugin-specific bugs from a cross-product workflow",
                    "find 5 direct products and 5 substitutes",
                    "reject if the outcome is already included in dominant plugins",
                    "quantify marketplace query/install/review acquisition",
                ],
            }
        )
    return rows


def app_store_queue(data: dict[str, Any] | None) -> list[dict[str, Any]]:
    if not data:
        return []
    rows: list[dict[str, Any]] = []
    for app in data.get("apps") or []:
        counts = app.get("cluster_counts") or {}
        for cluster in APP_CLUSTERS:
            count = int(counts.get(cluster) or 0)
            if count < 10:
                continue
            examples = [
                review for review in app.get("reviews") or []
                if cluster in (review.get("clusters") or [])
            ][:12]
            rows.append(
                {
                    "source": "app_store_jp",
                    "signal_id": f"app_store:{app.get('track_id')}:{cluster}",
                    "cluster": cluster,
                    "app": app.get("name"),
                    "app_url": app.get("url"),
                    "queries": app.get("queries"),
                    "price_jpy": app.get("price_jpy"),
                    "store_rating": app.get("store_rating"),
                    "store_rating_count": app.get("store_rating_count"),
                    "matched_items": count,
                    "status": "NEEDS_EXACT_WORKFLOW",
                    "examples": examples,
                    "required_next_evidence": [
                        "confirm the complaint describes one repeated outcome, not generic app quality",
                        "define a buyer/input/processing/output/price workflow",
                        "find 5 direct products and 5 substitutes",
                        "prove the feature is not fixed by switching to another listed app",
                        "quantify App Store query/ranking/conversion/CAC",
                    ],
                }
            )
    return rows


def score(row: dict[str, Any]) -> float:
    count = min(int(row.get("matched_items") or 0), 1000)
    source_bonus = 2 if row.get("source") == "app_store_jp" else 1
    paid_bonus = 2 if (row.get("price_jpy") or 0) > 0 else 0
    ratings = int(row.get("store_rating_count") or 0)
    return round(count ** 0.5 + source_bonus + paid_bonus + min(ratings, 10000) ** 0.25, 3)


def main() -> int:
    rows = wordpress_queue(load(WORDPRESS)) + app_store_queue(load(APPSTORE))
    for row in rows:
        row["discovery_score"] = score(row)
    rows.sort(key=lambda row: row["discovery_score"], reverse=True)

    now = dt.datetime.now(dt.timezone(dt.timedelta(hours=9))).replace(microsecond=0)
    active = json.loads((ROOT / "research" / "ACTIVE_CANDIDATE.json").read_text(encoding="utf-8"))
    payload = {
        "schema_version": 1,
        "generated_at_jst": now.isoformat(),
        "status": "EVIDENCE_QUEUE_ONLY",
        "build_approved": False,
        "active_candidate_status": active.get("status"),
        "item_count": len(rows),
        "items": rows,
        "warning": "A complaint cluster is not a product candidate. Exact workflow, competition, acquisition and economics gates remain mandatory.",
    }
    (OUT_DIR / "latest.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    lines = [
        "# Marketplace discovery queue — evidence only",
        "",
        f"最終更新: {now.isoformat()}",
        "",
        "**Status: EVIDENCE_QUEUE_ONLY / build_approved=false**",
        "",
        "> Complaint count is not a candidate and not a product. Each row must be reduced to one exact workflow and pass PREBUILD_GATE.",
        "",
        f"Queue items: {len(rows)}",
        "",
        "| # | Source | Cluster / app | Matches | Score | State |",
        "|---:|---|---|---:|---:|---|",
    ]
    for index, row in enumerate(rows[:80], start=1):
        label = row.get("cluster") or "unknown"
        if row.get("app"):
            label += f" — {row['app']}"
        label = str(label).replace("|", "\\|")
        lines.append(
            f"| {index} | {row.get('source')} | {label} | {row.get('matched_items')} | {row.get('discovery_score')} | NEEDS_EXACT_WORKFLOW |"
        )
    lines.extend(
        [
            "",
            "## Promotion rule",
            "",
            "A row can move to `RESEARCH_ONLY` only after:",
            "1. ten examples are manually confirmed as the same unresolved workflow;",
            "2. buyer, input, processing, output and price are fixed;",
            "3. direct-competitor searches begin;",
            "4. the promised outcome is measurable from the proposed input;",
            "5. there is a plausible marketplace acquisition path.",
            "",
        ]
    )
    (OUT_DIR / "latest.md").write_text("\n".join(lines), encoding="utf-8")
    print(f"queued {len(rows)} evidence clusters")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
