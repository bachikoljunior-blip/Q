#!/usr/bin/env python3
"""Marketplace-first discovery scanner.

Automates WordPress.org plugin-directory discovery using its public API. The
Atlassian Marketplace V2 search API was retired and now returns HTTP 410, while
V3 public search is not available as a drop-in unauthenticated replacement.
Atlassian remains a manual web-research surface and is explicitly recorded as
such instead of producing misleading SCAN_ERROR rows.

This scanner never approves a product. It only surfaces listings that deserve
review under research/PREBUILD_GATE.md.
"""

from __future__ import annotations

import argparse
import datetime as dt
import html
import json
import math
import re
import time
import urllib.parse
import urllib.request
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / "research" / "marketplace_scan"
USER_AGENT = "Q-marketplace-research/1.1 (+https://github.com/bachikoljunior-blip/Q)"

WORDPRESS_TERMS = [
    "woocommerce bank transfer",
    "woocommerce invoice",
    "woocommerce reconciliation",
    "woocommerce shipping label",
    "woocommerce csv import",
    "woocommerce order export",
    "woocommerce accessibility",
    "woocommerce subscription",
    "woocommerce booking",
    "woocommerce returns",
    "woocommerce fraud",
    "woocommerce accounting",
]


@dataclass
class Record:
    ecosystem: str
    query: str
    name: str
    slug_or_key: str
    url: str
    rating: float | None = None
    ratings_count: int | None = None
    active_installs: int | None = None
    downloads: int | None = None
    support_threads: int | None = None
    support_resolved: int | None = None
    last_updated: str | None = None
    pricing_model: str | None = None
    description: str = ""
    signal_score: float = 0.0
    notes: str = ""


def fetch_json(url: str, retries: int = 3) -> Any:
    last_error: Exception | None = None
    for attempt in range(retries):
        try:
            request = urllib.request.Request(
                url,
                headers={"Accept": "application/json", "User-Agent": USER_AGENT},
            )
            with urllib.request.urlopen(request, timeout=30) as response:
                return json.loads(response.read().decode("utf-8"))
        except Exception as exc:
            last_error = exc
            time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"failed to fetch {url}: {last_error}")


def clean_text(value: Any, limit: int = 280) -> str:
    text = re.sub(r"<[^>]+>", " ", str(value or ""))
    text = html.unescape(re.sub(r"\s+", " ", text)).strip()
    return text[:limit]


def int_or_none(value: Any) -> int | None:
    if value is None or value == "":
        return None
    try:
        return int(str(value).replace(",", "").replace("+", "").strip())
    except (TypeError, ValueError):
        return None


def float_or_none(value: Any) -> float | None:
    if value is None or value == "":
        return None
    try:
        return float(str(value).replace(",", "").strip())
    except (TypeError, ValueError):
        return None


def query_url(term: str, per_page: int) -> str:
    parameters: list[tuple[str, str]] = [
        ("action", "query_plugins"),
        ("request[search]", term),
        ("request[page]", "1"),
        ("request[per_page]", str(per_page)),
        ("request[fields][description]", "0"),
        ("request[fields][sections]", "0"),
        ("request[fields][screenshots]", "0"),
        ("request[fields][icons]", "0"),
        ("request[fields][banners]", "0"),
        ("request[fields][versions]", "0"),
        ("request[fields][contributors]", "0"),
        ("request[fields][reviews]", "0"),
        ("request[fields][active_installs]", "1"),
        ("request[fields][downloaded]", "1"),
        ("request[fields][rating]", "1"),
        ("request[fields][ratings]", "1"),
        ("request[fields][num_ratings]", "1"),
        ("request[fields][support_threads]", "1"),
        ("request[fields][support_threads_resolved]", "1"),
        ("request[fields][last_updated]", "1"),
        ("request[fields][short_description]", "1"),
    ]
    return "https://api.wordpress.org/plugins/info/1.2/?" + urllib.parse.urlencode(parameters)


def collect_wordpress(per_page: int) -> list[Record]:
    records: list[Record] = []
    for term in WORDPRESS_TERMS:
        payload = fetch_json(query_url(term, per_page))
        for plugin in payload.get("plugins", []):
            rating_percent = float_or_none(plugin.get("rating"))
            rating = rating_percent / 20.0 if rating_percent is not None else None
            active = int_or_none(plugin.get("active_installs"))
            support = int_or_none(plugin.get("support_threads"))
            resolved = int_or_none(plugin.get("support_threads_resolved"))
            unresolved = None
            if support is not None and resolved is not None:
                unresolved = max(0, support - resolved)

            demand = math.log10((active or 0) + 10)
            review_weight = math.log10((int_or_none(plugin.get("num_ratings")) or 0) + 2)
            rating_gap = max(0.0, 4.6 - (rating or 5.0))
            support_gap = math.log10((unresolved or 0) + 1)
            score = demand * 2.0 + review_weight + rating_gap * 2.0 + support_gap * 1.5
            slug = str(plugin.get("slug") or "")

            records.append(
                Record(
                    ecosystem="wordpress",
                    query=term,
                    name=clean_text(plugin.get("name"), 120),
                    slug_or_key=slug,
                    url=f"https://wordpress.org/plugins/{slug}/",
                    rating=round(rating, 2) if rating is not None else None,
                    ratings_count=int_or_none(plugin.get("num_ratings")),
                    active_installs=active,
                    downloads=int_or_none(plugin.get("downloaded")),
                    support_threads=support,
                    support_resolved=resolved,
                    last_updated=str(plugin.get("last_updated") or "") or None,
                    pricing_model="free directory; external Pro may exist",
                    description=clean_text(plugin.get("short_description")),
                    signal_score=round(score, 3),
                    notes=(f"unresolved_support={unresolved}" if unresolved is not None else "support data unavailable"),
                )
            )
        time.sleep(0.2)
    return records


def dedupe(records: list[Record]) -> list[Record]:
    best: dict[tuple[str, str], Record] = {}
    queries: dict[tuple[str, str], set[str]] = {}
    for record in records:
        key = (record.ecosystem, record.slug_or_key)
        queries.setdefault(key, set()).add(record.query)
        current = best.get(key)
        if current is None or record.signal_score > current.signal_score:
            best[key] = record
    for key, record in best.items():
        record.query = "; ".join(sorted(queries[key]))
    return sorted(best.values(), key=lambda item: item.signal_score, reverse=True)


def fmt_int(value: int | None) -> str:
    return "—" if value is None else f"{value:,}"


def fmt_float(value: float | None) -> str:
    return "—" if value is None else f"{value:.2f}"


def write_outputs(records: list[Record]) -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    now = dt.datetime.now(dt.timezone(dt.timedelta(hours=9))).replace(microsecond=0)
    payload = {
        "schema_version": 2,
        "generated_at_jst": now.isoformat(),
        "purpose": "surface marketplace listings for manual exact-workflow review; never auto-approve builds",
        "coverage": {
            "wordpress": "AUTOMATED_PUBLIC_API",
            "atlassian": "MANUAL_ONLY_V2_RETIRED_2026-06-30",
            "atlassian_note": "V2 search returns HTTP 410. V3 is not used without a verified public unauthenticated search contract.",
        },
        "records": [asdict(record) for record in records],
    }
    (OUT_DIR / "latest.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    lines = [
        "# Marketplace-first scan",
        "",
        f"最終更新: {now.isoformat()}",
        "",
        "> 候補発見用の機械スキャン。点数は商品価値や差別化の証明ではない。",
        "> PREBUILD_GATEのexact-match検索・重複表・集客・採算を通るまで実装禁止。",
        "",
        "## Coverage",
        "",
        "- WordPress.org: public APIで自動収集",
        "- Atlassian Marketplace: manual-only。V2検索APIは2026-06-30に終了しHTTP 410。公開V3検索契約を確認できるまで自動カバレッジを主張しない",
        "",
        "## Top signals",
        "",
        "| # | Listing | Query | Active | Rating | Ratings | Unresolved/support | Score |",
        "|---:|---|---|---:|---:|---:|---|---:|",
    ]
    for index, record in enumerate(records[:60], 1):
        support = record.notes.replace("|", "/")
        name = record.name.replace("|", "/")
        query = record.query.replace("|", "/")
        lines.append(
            f"| {index} | [{name}]({record.url}) | {query} | {fmt_int(record.active_installs)} | "
            f"{fmt_float(record.rating)} | {fmt_int(record.ratings_count)} | {support} | {record.signal_score:.3f} |"
        )

    lines.extend(
        [
            "",
            "## Required next step",
            "",
            "1. 低評価レビュー・未解決supportから同一の未解決不満を抽出する。",
            "2. 不満をbuyer/input/processing/outputへ変換する。",
            "3. 同じworkflowを日本語・英語・marketplace・OSSで最低12検索する。",
            "4. direct competitor 5件、substitute 5件、overlap matrixを作る。",
            "5. duplicate vetoを通過しなければ棄却する。",
            "",
        ]
    )
    (OUT_DIR / "latest.md").write_text("\n".join(lines), encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--wp-per-query", type=int, default=24)
    args = parser.parse_args()
    records = collect_wordpress(max(5, min(args.wp_per_query, 50)))
    write_outputs(dedupe(records))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
