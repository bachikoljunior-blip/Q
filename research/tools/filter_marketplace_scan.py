#!/usr/bin/env python3
"""Filter noisy marketplace search results into a reviewable shortlist.

The upstream marketplace scan intentionally gathers broadly. This script removes
WordPress results that only matched the generic word "WooCommerce", then ranks
high-demand / low-satisfaction signals. It never grants build approval.
"""

from __future__ import annotations

import datetime as dt
import json
import math
import re
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
SCAN_DIR = ROOT / "research" / "marketplace_scan"
SOURCE = SCAN_DIR / "latest.json"
OUT_JSON = SCAN_DIR / "shortlist.json"
OUT_MD = SCAN_DIR / "shortlist.md"

WP_KEYWORDS: dict[str, tuple[str, ...]] = {
    "bank transfer": ("bank", "transfer", "bacs", "wire", "offline payment", "振込"),
    "invoice": ("invoice", "receipt", "packing slip", "請求", "領収"),
    "reconciliation": ("reconcile", "reconciliation", "statement", "settlement", "照合"),
    "shipping label": ("shipping", "label", "carrier", "tracking", "shipment", "配送", "送り状"),
    "csv import": ("csv", "import", "spreadsheet", "excel", "インポート"),
    "order export": ("order export", "export", "csv", "report", "エクスポート"),
    "accessibility": ("accessibility", "wcag", "a11y", "accessible"),
    "subscription": ("subscription", "recurring", "renewal", "定期", "継続"),
    "booking": ("booking", "appointment", "reservation", "calendar", "event", "予約"),
    "returns": ("return", "refund", "rma", "exchange", "返品", "返金"),
    "fraud": ("fraud", "risk", "chargeback", "anti-fraud", "不正"),
    "accounting": ("accounting", "bookkeeping", "ledger", "tax", "invoice", "reconciliation", "会計"),
}


def normalize(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value or "").lower()).strip()


def wordpress_hits(record: dict[str, Any]) -> list[str]:
    haystack = normalize(" ".join([
        record.get("name", ""), record.get("slug_or_key", ""), record.get("description", "")
    ]))
    hits: list[str] = []
    for raw_query in str(record.get("query") or "").split(";"):
        query = normalize(raw_query)
        if query.startswith("woocommerce "):
            query = query.removeprefix("woocommerce ")
        keywords = WP_KEYWORDS.get(query, (query,))
        if any(keyword in haystack for keyword in keywords if keyword):
            hits.append(query)
    return sorted(set(hits))


def unresolved_support(record: dict[str, Any]) -> int:
    total = record.get("support_threads")
    resolved = record.get("support_resolved")
    if isinstance(total, int) and isinstance(resolved, int):
        return max(0, total - resolved)
    match = re.search(r"unresolved_support=(\d+)", str(record.get("notes") or ""))
    return int(match.group(1)) if match else 0


def adjusted_score(record: dict[str, Any], hits: list[str]) -> float:
    base = float(record.get("signal_score") or 0)
    rating = record.get("rating")
    ratings_count = int(record.get("ratings_count") or 0)
    demand = int(record.get("active_installs") or record.get("installs") or 0)
    unresolved = unresolved_support(record)

    score = base + min(4.0, len(hits) * 1.1)
    score += min(3.0, math.log10(demand + 1))
    score += min(2.5, math.log10(ratings_count + 1))
    score += min(3.0, math.log10(unresolved + 1) * 1.8)
    if isinstance(rating, (int, float)):
        score += max(0.0, 4.2 - float(rating)) * 1.8
    return round(score, 3)


def status_reason(record: dict[str, Any]) -> str:
    rating = record.get("rating")
    demand = int(record.get("active_installs") or record.get("installs") or 0)
    unresolved = unresolved_support(record)
    reasons: list[str] = []
    if demand >= 100_000:
        reasons.append("large installed base")
    elif demand >= 10_000:
        reasons.append("established installed base")
    if isinstance(rating, (int, float)) and rating <= 3.2:
        reasons.append("low rating")
    elif isinstance(rating, (int, float)) and rating <= 3.8:
        reasons.append("mixed rating")
    if unresolved >= 10:
        reasons.append("many unresolved support threads")
    elif unresolved >= 3:
        reasons.append("unresolved support signal")
    return ", ".join(reasons) or "listing signal only"


def link_for(record: dict[str, Any]) -> str:
    if record.get("ecosystem") == "wordpress":
        slug = record.get("slug_or_key") or ""
        return f"https://wordpress.org/plugins/{slug}/"
    return str(record.get("url") or "")


def support_link(record: dict[str, Any]) -> str:
    if record.get("ecosystem") == "wordpress":
        slug = record.get("slug_or_key") or ""
        return f"https://wordpress.org/support/plugin/{slug}/"
    return (str(record.get("url") or "").rstrip("/") + "#reviews")


def fmt_int(value: Any) -> str:
    try:
        return f"{int(value):,}"
    except (TypeError, ValueError):
        return "—"


def fmt_rating(value: Any) -> str:
    try:
        return f"{float(value):.2f}"
    except (TypeError, ValueError):
        return "—"


def main() -> int:
    data = json.loads(SOURCE.read_text(encoding="utf-8"))
    shortlisted: list[dict[str, Any]] = []

    for record in data.get("records", []):
        if record.get("name") == "SCAN_ERROR":
            continue
        ecosystem = record.get("ecosystem")
        hits = wordpress_hits(record) if ecosystem == "wordpress" else [normalize(record.get("query"))]
        if ecosystem == "wordpress" and not hits:
            continue
        enriched = dict(record)
        enriched["relevance_hits"] = hits
        enriched["unresolved_support"] = unresolved_support(record)
        enriched["adjusted_score"] = adjusted_score(record, hits)
        enriched["signal_reason"] = status_reason(record)
        enriched["listing_url"] = link_for(record)
        enriched["support_or_review_url"] = support_link(record)
        shortlisted.append(enriched)

    shortlisted.sort(key=lambda item: item["adjusted_score"], reverse=True)
    now = dt.datetime.now(dt.timezone(dt.timedelta(hours=9))).replace(microsecond=0)
    payload = {
        "schema_version": 1,
        "generated_at_jst": now.isoformat(),
        "source_generated_at_jst": data.get("generated_at_jst"),
        "status": "DISCOVERY_SIGNALS_ONLY",
        "build_approved": False,
        "records": shortlisted,
    }
    OUT_JSON.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    lines = [
        "# Marketplace shortlist — discovery signals only",
        "",
        f"最終更新: {now.isoformat()}",
        "",
        "**Status: DISCOVERY_SIGNALS_ONLY / build_approved=false**",
        "",
        "> インストール数・低評価・未解決supportは、問題探索の入口にすぎない。",
        "> 既存商品の不具合修正版を作るだけでは差別化にならない。レビュー本文から反復する未解決workflowを抽出し、exact-match vetoを通過するまで実装禁止。",
        "",
    ]

    for ecosystem in ("wordpress", "atlassian"):
        rows = [row for row in shortlisted if row.get("ecosystem") == ecosystem][:30]
        lines.extend([
            f"## {ecosystem.title()}",
            "",
            "| # | Listing | Relevant queries | Demand | Rating | Ratings | Unresolved | Signal | Score |",
            "|---:|---|---|---:|---:|---:|---:|---|---:|",
        ])
        for idx, row in enumerate(rows, 1):
            name = str(row.get("name") or "").replace("|", "/")
            hits = ", ".join(row.get("relevance_hits") or []).replace("|", "/")
            demand = row.get("active_installs") or row.get("installs")
            reason = str(row.get("signal_reason") or "").replace("|", "/")
            lines.append(
                f"| {idx} | [{name}]({row['listing_url']}) · [reviews/support]({row['support_or_review_url']}) | "
                f"{hits} | {fmt_int(demand)} | {fmt_rating(row.get('rating'))} | {fmt_int(row.get('ratings_count'))} | "
                f"{fmt_int(row.get('unresolved_support'))} | {reason} | {row['adjusted_score']:.3f} |"
            )
        lines.append("")

    lines.extend([
        "## Mandatory review procedure",
        "",
        "1. 上位listingの低評価レビュー・未解決supportを読む。",
        "2. 同じ不満が10件以上ある具体的workflowだけ残す。",
        "3. buyer/input/processing/output/priceを1文に固定する。",
        "4. 日本語・英語・marketplace・OSSで12検索以上を実行する。",
        "5. direct competitor 5件、substitute 5件、overlap matrixを作る。",
        "6. acquisition・unit economics・zero-touchを満たさなければ棄却する。",
        "",
    ])
    OUT_MD.write_text("\n".join(lines), encoding="utf-8")
    print(f"shortlisted {len(shortlisted)} records")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
