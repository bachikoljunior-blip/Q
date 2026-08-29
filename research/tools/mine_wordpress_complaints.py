#!/usr/bin/env python3
"""Mine public WordPress support/review topic titles for repeated pain signals.

This is discovery evidence only. Topic counts do not prove willingness to pay,
and the script never changes ACTIVE_CANDIDATE or build approval.
"""

from __future__ import annotations

import datetime as dt
import html
import json
import re
import time
import urllib.request
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
SCAN_DIR = ROOT / "research" / "marketplace_scan"
SOURCE = SCAN_DIR / "shortlist.json"
OUT_JSON = SCAN_DIR / "complaints.json"
OUT_MD = SCAN_DIR / "complaints.md"
USER_AGENT = "Q-wordpress-complaint-research/1.0 (+https://github.com/bachikoljunior-blip/Q)"

CLUSTERS: dict[str, tuple[str, ...]] = {
    "update_breakage": ("update", "upgrade", "fatal", "critical", "crash", "broke", "broken", "site down", "error after"),
    "label_purchase": ("label", "postage", "shipment", "carrier", "shipping"),
    "wrong_weight_rate": ("weight", "rate", "price", "charge", "cost", "dimension", "package"),
    "address_validation": ("address", "postcode", "zip", "international", "country", "state"),
    "bulk_workflow": ("bulk", "batch", "multiple", "many", "mass"),
    "pdf_email": ("pdf", "invoice", "attachment", "blank", "corrupt", "email"),
    "subscription_renewal": ("subscription", "renewal", "recurring", "payment", "cancel"),
    "booking_conflict": ("booking", "appointment", "slot", "availability", "calendar", "conflict"),
    "import_export": ("import", "export", "csv", "xml", "mapping", "column"),
    "accessibility_compliance": ("accessibility", "wcag", "screen reader", "keyboard", "ada", "eaa"),
    "tax_invoice_compliance": ("tax", "vat", "gst", "invoice number", "credit note", "compliance"),
    "sync_connection": ("sync", "connection", "connect", "oauth", "disconnect", "stuck"),
    "missing_feature": ("missing", "removed", "no option", "feature request", "can’t", "cannot", "unable"),
}

TOPIC_PATTERN = re.compile(
    r'<a[^>]+href=["\'](?P<url>https://wordpress\.org/support/topic/[^"\']+)["\'][^>]*>(?P<title>.*?)</a>',
    flags=re.I | re.S,
)


def fetch_text(url: str, retries: int = 3) -> str:
    last_error: Exception | None = None
    for attempt in range(retries):
        try:
            request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "text/html,*/*"})
            with urllib.request.urlopen(request, timeout=30) as response:
                return response.read().decode("utf-8", errors="replace")
        except Exception as exc:
            last_error = exc
            time.sleep(1.2 * (attempt + 1))
    raise RuntimeError(f"failed to fetch {url}: {last_error}")


def clean(value: str) -> str:
    value = re.sub(r"<[^>]+>", " ", value)
    return html.unescape(re.sub(r"\s+", " ", value)).strip()


def topic_rows(page: str, source: str) -> list[dict[str, str]]:
    seen: set[str] = set()
    rows: list[dict[str, str]] = []
    for match in TOPIC_PATTERN.finditer(page):
        url = match.group("url").rstrip("/") + "/"
        title = clean(match.group("title"))
        if not title or url in seen:
            continue
        seen.add(url)
        rows.append({"title": title, "url": url, "source": source})
    return rows


def classify(title: str) -> list[str]:
    text = title.lower().replace("’", "'")
    hits = [cluster for cluster, words in CLUSTERS.items() if any(word in text for word in words)]
    return hits or ["other"]


def candidate_plugins(data: dict[str, Any], limit: int = 24) -> list[dict[str, Any]]:
    records = [record for record in data.get("records", []) if record.get("ecosystem") == "wordpress"]

    def priority(record: dict[str, Any]) -> tuple[int, float]:
        rating = record.get("rating")
        unresolved = int(record.get("unresolved_support") or 0)
        weak_or_open = int((isinstance(rating, (int, float)) and rating <= 4.0) or unresolved >= 3)
        return weak_or_open, float(record.get("adjusted_score") or 0)

    records.sort(key=priority, reverse=True)
    return records[:limit]


def main() -> int:
    data = json.loads(SOURCE.read_text(encoding="utf-8"))
    output_plugins: list[dict[str, Any]] = []
    global_clusters: Counter[str] = Counter()
    global_titles: dict[str, list[dict[str, str]]] = defaultdict(list)

    for record in candidate_plugins(data):
        slug = str(record.get("slug_or_key") or "").strip()
        if not slug:
            continue
        pages = [
            ("support", f"https://wordpress.org/support/plugin/{slug}/"),
            ("support", f"https://wordpress.org/support/plugin/{slug}/page/2/"),
            ("review", f"https://wordpress.org/support/plugin/{slug}/reviews/"),
            ("review", f"https://wordpress.org/support/plugin/{slug}/reviews/page/2/"),
        ]
        topics: dict[str, dict[str, Any]] = {}
        errors: list[str] = []
        for source, url in pages:
            try:
                page = fetch_text(url)
                for row in topic_rows(page, source):
                    row["clusters"] = classify(row["title"])
                    topics.setdefault(row["url"], row)
            except Exception as exc:
                errors.append(f"{url}: {exc}")
            time.sleep(0.15)

        cluster_counts: Counter[str] = Counter()
        for topic in topics.values():
            for cluster in topic["clusters"]:
                cluster_counts[cluster] += 1
                global_clusters[cluster] += 1
                if len(global_titles[cluster]) < 20:
                    global_titles[cluster].append(
                        {
                            "plugin": str(record.get("name") or slug),
                            "title": topic["title"],
                            "url": topic["url"],
                        }
                    )

        output_plugins.append(
            {
                "plugin": record.get("name"),
                "slug": slug,
                "listing_url": record.get("listing_url"),
                "active_installs": record.get("active_installs"),
                "rating": record.get("rating"),
                "ratings_count": record.get("ratings_count"),
                "unresolved_support": record.get("unresolved_support"),
                "topic_count": len(topics),
                "cluster_counts": dict(cluster_counts.most_common()),
                "topics": list(topics.values()),
                "errors": errors,
            }
        )

    now = dt.datetime.now(dt.timezone(dt.timedelta(hours=9))).replace(microsecond=0)
    payload = {
        "schema_version": 1,
        "generated_at_jst": now.isoformat(),
        "status": "DISCOVERY_EVIDENCE_ONLY",
        "build_approved": False,
        "global_cluster_counts": dict(global_clusters.most_common()),
        "plugins": output_plugins,
    }
    OUT_JSON.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    lines = [
        "# WordPress complaint mining — discovery evidence only",
        "",
        f"最終更新: {now.isoformat()}",
        "",
        "**Status: DISCOVERY_EVIDENCE_ONLY / build_approved=false**",
        "",
        "> 公開support/reviewのタイトルだけを機械収集した一次スクリーニング。",
        "> 同じクラスタが多くても、同じ問題・支払意思・未解決差を意味しない。本文確認とexact-match gateが必須。",
        "",
        "## Cross-plugin clusters",
        "",
        "| Cluster | Topic titles matched |",
        "|---|---:|",
    ]
    for cluster, count in global_clusters.most_common():
        lines.append(f"| {cluster} | {count} |")

    lines.extend(["", "## Plugin queues", ""])
    for plugin in sorted(output_plugins, key=lambda row: row["topic_count"], reverse=True):
        clusters = ", ".join(f"{key}:{value}" for key, value in list(plugin["cluster_counts"].items())[:6]) or "none"
        lines.append(
            f"### {plugin['plugin']} — topics {plugin['topic_count']}, rating {plugin.get('rating')}, active {plugin.get('active_installs')}"
        )
        lines.append("")
        lines.append(f"Clusters: {clusters}")
        lines.append("")
        for topic in plugin["topics"][:12]:
            cluster_text = ", ".join(topic["clusters"])
            lines.append(f"- [{topic['title']}]({topic['url']}) — {topic['source']} / {cluster_text}")
        if plugin["errors"]:
            lines.append(f"- scan warnings: {len(plugin['errors'])}")
        lines.append("")

    lines.extend(
        [
            "## Gate",
            "",
            "- 同一workflowの不満が本文確認で10件未満なら棄却。",
            "- 10件以上でも、直接競合・無料代替・platform nativeで解決済みなら棄却。",
            "- 価格付き乗換意思、前払い、または明確なmarketplace acquisitionがなければbuildしない。",
            "",
        ]
    )
    OUT_MD.write_text("\n".join(lines), encoding="utf-8")
    print(f"mined {sum(item['topic_count'] for item in output_plugins)} public topic titles across {len(output_plugins)} plugins")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
