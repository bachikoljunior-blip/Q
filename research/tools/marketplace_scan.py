#!/usr/bin/env python3
"""Marketplace-first discovery scanner.

Collects public listing signals from WordPress.org and Atlassian Marketplace.
It does not approve products. It only surfaces listings/queries that deserve
manual exact-workflow review under research/PREBUILD_GATE.md.
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
from typing import Any, Iterable

ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / "research" / "marketplace_scan"
USER_AGENT = "Q-marketplace-research/1.0 (+https://github.com/bachikoljunior-blip/Q)"

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

ATLASSIAN_TERMS = [
    "worklog audit",
    "access review",
    "attachment management",
    "backup restore",
    "bulk export",
    "compliance evidence",
    "configuration audit",
    "data quality",
    "duplicate detection",
    "permission audit",
    "SLA audit",
    "timesheet reconciliation",
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
    installs: int | None = None
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
            req = urllib.request.Request(
                url,
                headers={"Accept": "application/json", "User-Agent": USER_AGENT},
            )
            with urllib.request.urlopen(req, timeout=30) as response:
                return json.loads(response.read().decode("utf-8"))
        except Exception as exc:  # network errors should not kill the whole scan
            last_error = exc
            time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"failed to fetch {url}: {last_error}")


def fetch_text(url: str, retries: int = 2) -> str:
    last_error: Exception | None = None
    for attempt in range(retries):
        try:
            req = urllib.request.Request(
                url,
                headers={"Accept": "text/html,*/*", "User-Agent": USER_AGENT},
            )
            with urllib.request.urlopen(req, timeout=30) as response:
                return response.read().decode("utf-8", errors="replace")
        except Exception as exc:
            last_error = exc
            time.sleep(1.0 * (attempt + 1))
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


def wp_query_url(term: str, per_page: int) -> str:
    params: list[tuple[str, str]] = [
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
    return "https://api.wordpress.org/plugins/info/1.2/?" + urllib.parse.urlencode(params)


def wordpress_records(per_page: int) -> list[Record]:
    records: list[Record] = []
    for term in WORDPRESS_TERMS:
        try:
            payload = fetch_json(wp_query_url(term, per_page))
        except Exception as exc:
            records.append(
                Record(
                    ecosystem="wordpress",
                    query=term,
                    name="SCAN_ERROR",
                    slug_or_key="",
                    url="",
                    notes=str(exc),
                )
            )
            continue

        for plugin in payload.get("plugins", []):
            rating_pct = float_or_none(plugin.get("rating"))
            rating = rating_pct / 20.0 if rating_pct is not None else None
            active = int_or_none(plugin.get("active_installs"))
            support = int_or_none(plugin.get("support_threads"))
            resolved = int_or_none(plugin.get("support_threads_resolved"))
            unresolved = None
            if support is not None and resolved is not None:
                unresolved = max(0, support - resolved)

            # Discovery score: installed demand + unresolved support + weak ratings.
            demand = math.log10(max(active or 0, 0) + 10)
            review_weight = math.log10((int_or_none(plugin.get("num_ratings")) or 0) + 2)
            rating_gap = max(0.0, 4.6 - (rating or 5.0))
            support_gap = math.log10((unresolved or 0) + 1)
            score = demand * 2.0 + review_weight + rating_gap * 2.0 + support_gap * 1.5

            records.append(
                Record(
                    ecosystem="wordpress",
                    query=term,
                    name=clean_text(plugin.get("name"), 120),
                    slug_or_key=str(plugin.get("slug") or ""),
                    url=str(plugin.get("homepage") or f"https://wordpress.org/plugins/{plugin.get('slug', '')}/"),
                    rating=round(rating, 2) if rating is not None else None,
                    ratings_count=int_or_none(plugin.get("num_ratings")),
                    active_installs=active,
                    downloads=int_or_none(plugin.get("downloaded")),
                    support_threads=support,
                    support_resolved=resolved,
                    last_updated=str(plugin.get("last_updated") or "") or None,
                    pricing_model="free-directory / possible external pro",
                    description=clean_text(plugin.get("short_description")),
                    signal_score=round(score, 3),
                    notes=(f"unresolved_support={unresolved}" if unresolved is not None else "support data unavailable"),
                )
            )
        time.sleep(0.2)
    return records


def first_match(patterns: Iterable[str], text: str, cast: str = "str") -> Any:
    for pattern in patterns:
        match = re.search(pattern, text, flags=re.I | re.S)
        if not match:
            continue
        value = html.unescape(re.sub(r"<[^>]+>", " ", match.group(1))).strip()
        if cast == "int":
            return int_or_none(value)
        if cast == "float":
            return float_or_none(value)
        return clean_text(value, 240)
    return None


def atlassian_records(max_per_query: int) -> list[Record]:
    records: list[Record] = []
    seen: set[tuple[str, str]] = set()
    for term in ATLASSIAN_TERMS:
        url = "https://marketplace.atlassian.com/rest/2/addons/search/brief?" + urllib.parse.urlencode({"q": term})
        try:
            payload = fetch_json(url)
        except Exception as exc:
            records.append(
                Record(
                    ecosystem="atlassian",
                    query=term,
                    name="SCAN_ERROR",
                    slug_or_key="",
                    url="",
                    notes=str(exc),
                )
            )
            continue

        addons = payload.get("addons", [])[:max_per_query]
        for addon in addons:
            key = str(addon.get("key") or "")
            if not key or (term, key) in seen:
                continue
            seen.add((term, key))
            alt = ((addon.get("_links") or {}).get("alternate") or {}).get("href") or ""
            page_url = urllib.parse.urljoin("https://marketplace.atlassian.com", alt)
            rating = None
            ratings_count = None
            installs = None
            pricing = None
            description = ""
            notes = ""
            try:
                page = fetch_text(page_url)
                # Marketplace rendering changes often; keep multiple loose fallbacks.
                installs = first_match(
                    [
                        r"INSTALLS\s*</?[^>]*>\s*([0-9,]+)",
                        r"INSTALLS[\s\S]{0,180}?([0-9][0-9,]*)",
                        r'"installCount"\s*:\s*([0-9]+)',
                    ],
                    page,
                    "int",
                )
                rating = first_match(
                    [
                        r"OVERALL RATINGS[\s\S]{0,140}?([0-5](?:\.[0-9]+)?)\s*</",
                        r'"averageRating"\s*:\s*([0-5](?:\.[0-9]+)?)',
                    ],
                    page,
                    "float",
                )
                ratings_count = first_match(
                    [
                        r"OVERALL RATINGS[\s\S]{0,220}?\(([0-9,]+)\)",
                        r'"reviewCount"\s*:\s*([0-9]+)',
                    ],
                    page,
                    "int",
                )
                pricing = first_match(
                    [r"Payment model[\s\S]{0,120}?<[^>]+>\s*([^<]+)<", r'"paymentModel"\s*:\s*"([^"]+)"'],
                    page,
                )
                description = first_match(
                    [r"## Key highlights of the app\s*([^<\n]{10,260})", r'<meta[^>]+name="description"[^>]+content="([^"]+)"'],
                    page,
                ) or ""
            except Exception as exc:
                notes = f"listing fetch failed: {exc}"

            demand = math.log10((installs or 0) + 10)
            review_weight = math.log10((ratings_count or 0) + 2)
            rating_gap = max(0.0, 4.5 - (rating or 5.0))
            score = demand * 2.1 + review_weight + rating_gap * 2.2
            records.append(
                Record(
                    ecosystem="atlassian",
                    query=term,
                    name=clean_text(addon.get("name"), 120),
                    slug_or_key=key,
                    url=page_url,
                    rating=round(rating, 2) if rating is not None else None,
                    ratings_count=ratings_count,
                    installs=installs,
                    pricing_model=pricing,
                    description=description,
                    signal_score=round(score, 3),
                    notes=notes,
                )
            )
            time.sleep(0.15)
    return records


def dedupe(records: list[Record]) -> list[Record]:
    best: dict[tuple[str, str], Record] = {}
    queries: dict[tuple[str, str], set[str]] = {}
    for record in records:
        key = (record.ecosystem, record.slug_or_key or f"ERROR:{record.query}")
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
        "schema_version": 1,
        "generated_at_jst": now.isoformat(),
        "purpose": "surface marketplace listings for manual exact-workflow review; never auto-approve builds",
        "records": [asdict(record) for record in records],
    }
    (OUT_DIR / "latest.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    lines = [
        "# Marketplace-first scan",
        "",
        f"最終更新: {now.isoformat()}",
        "",
        "> これは候補発見用の機械スキャン。点数は商品価値や差別化の証明ではない。",
        "> 上位でも PREBUILD_GATE のexact-match検索・重複表・集客・採算を通るまで実装禁止。",
        "",
        "## Top signals",
        "",
        "| # | Ecosystem | Listing | Query | Installs/active | Rating | Ratings | Unresolved/support | Score |",
        "|---:|---|---|---|---:|---:|---:|---|---:|",
    ]
    for index, record in enumerate(records[:60], 1):
        demand = record.active_installs if record.active_installs is not None else record.installs
        support = record.notes.replace("|", "/")
        name = record.name.replace("|", "/")
        query = record.query.replace("|", "/")
        lines.append(
            f"| {index} | {record.ecosystem} | [{name}]({record.url}) | {query} | {fmt_int(demand)} | "
            f"{fmt_float(record.rating)} | {fmt_int(record.ratings_count)} | {support} | {record.signal_score:.3f} |"
        )

    lines.extend(
        [
            "",
            "## Required next step for any surfaced listing",
            "",
            "1. 低評価・support thread・forumから同一の未解決不満を抽出する。",
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
    parser.add_argument("--atlassian-per-query", type=int, default=12)
    args = parser.parse_args()

    records = wordpress_records(max(5, min(args.wp_per_query, 50)))
    records.extend(atlassian_records(max(3, min(args.atlassian_per_query, 25))))
    write_outputs(dedupe(records))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
