#!/usr/bin/env python3
"""Collect public marketplace/review signals without approving a product build.

The scanner is intentionally conservative. It reads official/public APIs and RSS,
clusters repeated complaint terms, and writes evidence files under
research/marketplace_scan/. It never changes ACTIVE_CANDIDATE.json and never
creates product code.
"""
from __future__ import annotations

import argparse
import collections
import dataclasses
import datetime as dt
import html
import json
import os
import re
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Any, Iterable

USER_AGENT = "Q-market-research/1.0 (+https://github.com/bachikoljunior-blip/Q)"
TIMEOUT = 25

WORDPRESS_SEARCH_TERMS = [
    "woocommerce", "wordpress automation", "wordpress export", "wordpress audit",
    "wordpress backup", "wordpress permissions", "wordpress media", "wordpress forms",
]
ATLASSIAN_SEARCH_TERMS = [
    "automation", "configuration", "backup", "audit", "permissions", "export",
    "documentation", "governance",
]

PAIN_PATTERNS: dict[str, tuple[str, ...]] = {
    "version_diff": ("version control", "versioning", "diff", "compare versions", "history", "rollback"),
    "export_import": ("export", "import", "migration", "migrate", "transfer"),
    "bulk_scale": ("bulk", "batch", "hundreds", "thousands", "at scale"),
    "schedule_alert": ("schedule", "scheduled", "reminder", "notification", "alert", "expiry", "expire"),
    "permission_audit": ("permission", "role", "access", "audit", "compliance", "governance"),
    "reliability": ("failed", "failure", "broken", "stopped", "missing", "lost", "corrupt", "restore"),
    "documentation": ("documentation", "document", "diagram", "readable", "explain"),
    "validation": ("validate", "validation", "lint", "preflight", "check before", "test before"),
    "multi_site": ("multisite", "multi-site", "multiple sites", "multiple projects", "cross project"),
    "privacy_local": ("privacy", "local", "offline", "credentials", "api key", "security"),
    "pricing": ("expensive", "price", "pricing", "cost", "subscription", "paywall"),
    "support_burden": ("support", "response", "refund", "cancel", "billing"),
}

NEGATIVE_HINTS = (
    "not working", "doesn't work", "does not work", "missing", "wish", "need", "please add",
    "feature request", "unfortunately", "problem", "issue", "bug", "broken", "expensive",
    "cannot", "can't", "unable", "lack", "slow", "failed", "failure",
)


def now_jst() -> str:
    return (dt.datetime.now(dt.timezone.utc) + dt.timedelta(hours=9)).replace(microsecond=0).isoformat()


def fetch(url: str, *, accept: str = "application/json,text/xml,text/html;q=0.9,*/*;q=0.8", retries: int = 3) -> bytes:
    headers = {"User-Agent": USER_AGENT, "Accept": accept}
    token = os.getenv("GITHUB_TOKEN")
    if token and "api.github.com" in url:
        headers["Authorization"] = f"Bearer {token}"
        headers["X-GitHub-Api-Version"] = "2022-11-28"
    last: Exception | None = None
    for attempt in range(retries):
        try:
            request = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(request, timeout=TIMEOUT) as response:
                return response.read()
        except (urllib.error.URLError, TimeoutError, ConnectionError) as exc:
            last = exc
            if attempt + 1 < retries:
                time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"fetch failed: {url}: {last}")


def fetch_json(url: str) -> Any:
    return json.loads(fetch(url).decode("utf-8"))


def strip_markup(value: str) -> str:
    value = re.sub(r"<[^>]+>", " ", html.unescape(value or ""))
    return re.sub(r"\s+", " ", value).strip()


def rss_items(url: str, limit: int = 30) -> list[dict[str, str]]:
    raw = fetch(url, accept="application/rss+xml,application/xml,text/xml")
    root = ET.fromstring(raw)
    items: list[dict[str, str]] = []
    for node in root.findall(".//item")[:limit]:
        items.append({
            "title": strip_markup(node.findtext("title") or ""),
            "description": strip_markup(node.findtext("description") or ""),
            "link": (node.findtext("link") or "").strip(),
            "date": (node.findtext("pubDate") or "").strip(),
        })
    return items


def analyze_texts(texts: Iterable[str]) -> dict[str, Any]:
    joined = "\n".join(texts).lower()
    counts: dict[str, int] = {}
    examples: dict[str, list[str]] = {}
    for label, terms in PAIN_PATTERNS.items():
        count = sum(joined.count(term) for term in terms)
        if count:
            counts[label] = count
    negative = sum(joined.count(term) for term in NEGATIVE_HINTS)
    return {"pain_counts": counts, "negative_hint_count": negative, "text_chars": len(joined)}


def wp_query_plugins(term: str, per_page: int = 24) -> list[dict[str, Any]]:
    params = {
        "action": "query_plugins",
        "request[search]": term,
        "request[page]": "1",
        "request[per_page]": str(per_page),
        "request[fields][sections]": "0",
        "request[fields][description]": "0",
        "request[fields][short_description]": "1",
        "request[fields][active_installs]": "1",
        "request[fields][num_ratings]": "1",
        "request[fields][support_threads]": "1",
        "request[fields][support_threads_resolved]": "1",
    }
    url = "https://api.wordpress.org/plugins/info/1.2/?" + urllib.parse.urlencode(params)
    data = fetch_json(url)
    return list(data.get("plugins", []))


def collect_wordpress() -> tuple[list[dict[str, Any]], list[str]]:
    errors: list[str] = []
    seen: dict[str, dict[str, Any]] = {}
    for term in WORDPRESS_SEARCH_TERMS:
        try:
            for plugin in wp_query_plugins(term):
                slug = plugin.get("slug")
                if not slug:
                    continue
                installs = int(plugin.get("active_installs") or 0)
                ratings = int(plugin.get("num_ratings") or 0)
                # Focus on products with a real installed base; small samples create noise.
                if installs < 10_000 or ratings < 10:
                    continue
                current = seen.setdefault(slug, {
                    "ecosystem": "wordpress",
                    "slug": slug,
                    "name": strip_markup(plugin.get("name", slug)),
                    "url": f"https://wordpress.org/plugins/{slug}/",
                    "active_installs": installs,
                    "rating": float(plugin.get("rating") or 0) / 20.0,
                    "num_ratings": ratings,
                    "support_threads": int(plugin.get("support_threads") or 0),
                    "support_threads_resolved": int(plugin.get("support_threads_resolved") or 0),
                    "search_terms": [],
                })
                current["search_terms"].append(term)
        except Exception as exc:  # noqa: BLE001 - evidence collection must continue
            errors.append(f"wordpress search {term}: {exc}")

    # Limit network load to the highest-signal plugins.
    ranked = sorted(
        seen.values(),
        key=lambda p: (p["active_installs"], p["num_ratings"], -p["rating"]),
        reverse=True,
    )[:45]

    rows: list[dict[str, Any]] = []
    for plugin in ranked:
        slug = plugin["slug"]
        review_items: list[dict[str, str]] = []
        support_items: list[dict[str, str]] = []
        try:
            review_items = rss_items(f"https://wordpress.org/support/plugin/{slug}/reviews/feed/", 24)
        except Exception as exc:  # noqa: BLE001
            errors.append(f"wordpress reviews {slug}: {exc}")
        try:
            support_items = rss_items(f"https://wordpress.org/support/plugin/{slug}/feed/", 24)
        except Exception as exc:  # noqa: BLE001
            errors.append(f"wordpress support {slug}: {exc}")
        texts = [f"{item['title']} {item['description']}" for item in review_items + support_items]
        signal = analyze_texts(texts)
        unresolved = max(0, plugin["support_threads"] - plugin["support_threads_resolved"])
        plugin.update({
            **signal,
            "unresolved_support_threads": unresolved,
            "review_examples": review_items[:5],
            "support_examples": support_items[:5],
        })
        plugin["signal_score"] = round(
            signal["negative_hint_count"]
            + sum(signal["pain_counts"].values()) * 1.5
            + min(unresolved, 100) / 10
            + min(plugin["active_installs"], 1_000_000) / 100_000,
            2,
        )
        rows.append(plugin)
        time.sleep(0.15)
    return rows, errors


def atl_search(term: str, limit: int = 25) -> list[dict[str, Any]]:
    # Marketplace v2 has historically accepted text; query is kept as a fallback.
    bases = [
        {"text": term, "limit": str(limit), "hosting": "cloud"},
        {"query": term, "limit": str(limit), "hosting": "cloud"},
    ]
    last: Exception | None = None
    for params in bases:
        try:
            url = "https://marketplace.atlassian.com/rest/2/addons?" + urllib.parse.urlencode(params)
            data = fetch_json(url)
            embedded = data.get("_embedded", {}) if isinstance(data, dict) else {}
            addons = embedded.get("addons") or embedded.get("addon") or data.get("addons", [])
            if addons:
                return list(addons)
        except Exception as exc:  # noqa: BLE001
            last = exc
    if last:
        raise last
    return []


def atl_reviews(key: str, limit: int = 40) -> list[dict[str, Any]]:
    url = f"https://marketplace.atlassian.com/rest/2/addons/{urllib.parse.quote(key, safe='')}/reviews?limit={limit}"
    data = fetch_json(url)
    if isinstance(data, list):
        return data
    embedded = data.get("_embedded", {}) if isinstance(data, dict) else {}
    return list(embedded.get("reviews") or data.get("reviews", []))


def collect_atlassian() -> tuple[list[dict[str, Any]], list[str]]:
    errors: list[str] = []
    seen: dict[str, dict[str, Any]] = {}
    for term in ATLASSIAN_SEARCH_TERMS:
        try:
            for addon in atl_search(term):
                key = addon.get("key") or addon.get("addonKey")
                if not key:
                    continue
                row = seen.setdefault(key, {
                    "ecosystem": "atlassian",
                    "key": key,
                    "name": strip_markup(addon.get("name", key)),
                    "summary": strip_markup(addon.get("summary", "")),
                    "url": f"https://marketplace.atlassian.com/apps/{key}",
                    "search_terms": [],
                })
                row["search_terms"].append(term)
                for field in ("reviews", "rating", "downloads", "installations"):
                    if field in addon:
                        row[field] = addon[field]
        except Exception as exc:  # noqa: BLE001
            errors.append(f"atlassian search {term}: {exc}")

    rows: list[dict[str, Any]] = []
    for addon in list(seen.values())[:60]:
        reviews: list[dict[str, Any]] = []
        try:
            reviews = atl_reviews(addon["key"])
        except Exception as exc:  # noqa: BLE001
            errors.append(f"atlassian reviews {addon['key']}: {exc}")
        examples: list[dict[str, str]] = []
        texts: list[str] = [addon.get("summary", "")]
        low_rating_count = 0
        for review in reviews:
            body = strip_markup(str(review.get("review") or review.get("text") or review.get("body") or ""))
            title = strip_markup(str(review.get("title") or ""))
            rating = review.get("stars") or review.get("rating") or review.get("score")
            try:
                numeric_rating = float(rating)
            except (TypeError, ValueError):
                numeric_rating = 0
            if numeric_rating and numeric_rating <= 3:
                low_rating_count += 1
            texts.append(f"{title} {body}")
            if len(examples) < 7:
                examples.append({"title": title, "body": body[:500], "rating": str(rating or ""), "url": addon["url"]})
        signal = analyze_texts(texts)
        addon.update({
            **signal,
            "review_count_fetched": len(reviews),
            "low_rating_count": low_rating_count,
            "review_examples": examples,
        })
        addon["signal_score"] = round(
            signal["negative_hint_count"] + sum(signal["pain_counts"].values()) * 1.5 + low_rating_count * 3,
            2,
        )
        rows.append(addon)
        time.sleep(0.15)
    return rows, errors


def github_issue_search(query: str, per_page: int = 40) -> list[dict[str, Any]]:
    params = urllib.parse.urlencode({"q": query, "per_page": str(per_page), "sort": "comments", "order": "desc"})
    data = fetch_json("https://api.github.com/search/issues?" + params)
    return list(data.get("items", []))


def collect_github_complaints() -> tuple[list[dict[str, Any]], list[str]]:
    queries = [
        'is:issue is:open "feature request" "version control" automation',
        'is:issue is:open "export" "diff" "automation rules"',
        'is:issue is:open "bulk" "missing feature" wordpress plugin',
        'is:issue is:open "audit" "permissions" jira',
        'is:issue is:open "documentation" "automation" jira',
        'is:issue is:open "rollback" "configuration" jira',
    ]
    errors: list[str] = []
    rows: list[dict[str, Any]] = []
    for query in queries:
        try:
            for item in github_issue_search(query):
                text = f"{item.get('title', '')} {item.get('body') or ''}"
                signal = analyze_texts([text])
                rows.append({
                    "query": query,
                    "title": item.get("title", ""),
                    "url": item.get("html_url", ""),
                    "comments": int(item.get("comments") or 0),
                    "repository_url": item.get("repository_url", ""),
                    **signal,
                })
        except Exception as exc:  # noqa: BLE001
            errors.append(f"github issue search {query}: {exc}")
        time.sleep(0.25)
    # De-duplicate and favor discussions with actual engagement.
    unique: dict[str, dict[str, Any]] = {}
    for row in rows:
        unique[row["url"]] = row
    return sorted(unique.values(), key=lambda r: (r["comments"], r["negative_hint_count"]), reverse=True)[:120], errors


def aggregate_clusters(*collections_: Iterable[dict[str, Any]]) -> list[dict[str, Any]]:
    totals: dict[str, dict[str, Any]] = {}
    for collection in collections_:
        for row in collection:
            source = row.get("ecosystem") or "github"
            for label, count in (row.get("pain_counts") or {}).items():
                cluster = totals.setdefault(label, {"cluster": label, "mentions": 0, "sources": collections.Counter(), "examples": []})
                cluster["mentions"] += int(count)
                cluster["sources"][source] += int(count)
                if len(cluster["examples"]) < 12:
                    example_url = row.get("url")
                    example_title = row.get("name") or row.get("title") or row.get("slug") or row.get("key")
                    if example_url:
                        cluster["examples"].append({"source": source, "title": example_title, "url": example_url})
    result = []
    for cluster in totals.values():
        cluster["sources"] = dict(cluster["sources"])
        cluster["cross_source_count"] = len(cluster["sources"])
        cluster["score"] = cluster["mentions"] * (1 + 0.35 * max(0, cluster["cross_source_count"] - 1))
        result.append(cluster)
    return sorted(result, key=lambda c: (c["score"], c["mentions"]), reverse=True)


def markdown_report(payload: dict[str, Any]) -> str:
    lines = [
        "# Marketplace signal scan",
        "",
        f"最終更新: {payload['generated_at_jst']}",
        "",
        "## Status",
        "",
        "**RESEARCH_ONLY — この出力だけでは商品実装を承認しない。**",
        "",
        "公開API・RSS・GitHub Issuesから、既存ユーザーが繰り返し言及する不満語を収集した。",
        "候補を作る場合は、ここから exact workflow を1つ定義し、PREBUILD_GATE.md の12検索・競合5件・代替5件・重複表・集客・採算を別途通す。",
        "",
        "## Repeated pain clusters",
        "",
        "| 順位 | cluster | mentions | source count | score |",
        "|---:|---|---:|---:|---:|",
    ]
    for index, cluster in enumerate(payload["clusters"][:20], 1):
        lines.append(f"| {index} | `{cluster['cluster']}` | {cluster['mentions']} | {cluster['cross_source_count']} | {cluster['score']:.1f} |")

    lines += ["", "## Highest-signal WordPress plugins", "", "| plugin | installs | rating | unresolved support | signal |", "|---|---:|---:|---:|---:|"]
    for row in sorted(payload["wordpress"], key=lambda r: r.get("signal_score", 0), reverse=True)[:20]:
        lines.append(
            f"| [{row['name']}]({row['url']}) | {row['active_installs']:,} | {row['rating']:.2f} | {row['unresolved_support_threads']} | {row['signal_score']:.1f} |"
        )

    lines += ["", "## Highest-signal Atlassian apps", "", "| app | reviews fetched | low ratings | signal |", "|---|---:|---:|---:|"]
    for row in sorted(payload["atlassian"], key=lambda r: r.get("signal_score", 0), reverse=True)[:20]:
        lines.append(
            f"| [{row['name']}]({row['url']}) | {row.get('review_count_fetched', 0)} | {row.get('low_rating_count', 0)} | {row['signal_score']:.1f} |"
        )

    lines += ["", "## Engaged public issue threads", ""]
    for row in payload["github_issues"][:25]:
        lines.append(f"- [{row['title']}]({row['url']}) — comments: {row['comments']}")

    lines += ["", "## Collection errors", ""]
    if payload["errors"]:
        lines.extend(f"- `{error}`" for error in payload["errors"][:80])
    else:
        lines.append("- none")

    lines += [
        "",
        "## Guardrail",
        "",
        "高いsignal scoreは、需要や差別化の証明ではない。人気商品のバグや一般的な要望も含む。",
        "このファイルから自動でBUILD_APPROVEDへ進めない。",
        "",
    ]
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-dir", default="research/marketplace_scan")
    args = parser.parse_args()
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    wordpress, wp_errors = collect_wordpress()
    atlassian, atl_errors = collect_atlassian()
    github_issues, gh_errors = collect_github_complaints()
    clusters = aggregate_clusters(wordpress, atlassian, github_issues)
    payload = {
        "schema_version": 1,
        "generated_at_jst": now_jst(),
        "status": "RESEARCH_ONLY",
        "sources": [
            "WordPress.org Plugin Information API",
            "WordPress.org support/review RSS",
            "Atlassian Marketplace REST API",
            "GitHub Search API",
        ],
        "clusters": clusters,
        "wordpress": wordpress,
        "atlassian": atlassian,
        "github_issues": github_issues,
        "errors": wp_errors + atl_errors + gh_errors,
    }
    (output_dir / "latest.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (output_dir / "latest.md").write_text(markdown_report(payload), encoding="utf-8")
    print(json.dumps({
        "wordpress": len(wordpress),
        "atlassian": len(atlassian),
        "github_issues": len(github_issues),
        "clusters": len(clusters),
        "errors": len(payload["errors"]),
    }, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
