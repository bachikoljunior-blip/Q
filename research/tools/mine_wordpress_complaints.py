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
USER_AGENT = "Q-wordpress-complaint-research/1.1 (+https://github.com/bachikoljunior-blip/Q)"

PREFERRED_SLUGS = {
    "events-manager",
    "eventin",
    "wp-event-manager",
    "ameliabooking",
    "events-manager-for-woocommerce",
    "woocommerce-services",
    "woocommerce-shipping",
    "woocommerce-pdf-invoices-packing-slips",
    "woocommerce-delivery-notes",
}

CLUSTERS: dict[str, tuple[str, ...]] = {
    "booking_integrity": (
        "overbook",
        "double book",
        "ticket spaces",
        "booked spaces",
        "bookings not counting",
        "booking count",
        "availability does not",
        "availability not",
        "available spaces",
        "sold-out tickets available",
        "sold out tickets available",
        "capacity mismatch",
        "seat count",
    ),
    "update_breakage": ("after update", "after upgrade", "fatal", "critical error", "crash", "broke", "broken", "site down"),
    "label_purchase": ("label", "postage", "shipment", "carrier", "shipping"),
    "wrong_weight_rate": ("wrong weight", "wrong rate", "wrong price", "wrong charge", "dimension", "package weight"),
    "address_validation": ("address", "postcode", "zip code", "international", "country", "state field"),
    "bulk_workflow": ("bulk", "batch", "multiple", "many", "mass"),
    "pdf_email": ("pdf", "invoice", "attachment", "blank page", "corrupt", "email-attached"),
    "subscription_renewal": ("subscription", "renewal", "recurring payment", "recurring order"),
    "booking_conflict": ("booking", "appointment", "slot", "availability", "calendar conflict", "double-book"),
    "import_export": ("import", "export", "csv", "xml", "mapping", "column"),
    "accessibility_compliance": ("accessibility", "wcag", "screen reader", "keyboard", "ada", "eaa"),
    "tax_invoice_compliance": ("tax", "vat", "gst", "invoice number", "credit note", "compliance"),
    "sync_connection": ("sync", "connection", "connect", "oauth", "disconnect", "stuck"),
    "missing_feature": ("missing", "removed", "no option", "feature request", "cannot", "unable"),
}

TOPIC_PATTERN = re.compile(
    r'<a[^>]+href=["\'](?P<url>https://wordpress\.org/support/topic/[^"\']+)["\'][^>]*>(?P<title>.*?)</a>',
    flags=re.I | re.S,
)
RELATIVE_TIME = re.compile(
    r"^(?:\d+\s+(?:second|minute|hour|day|week|month|year)s?(?:,\s*\d+\s+(?:day|week|month)s?)?\s+ago|yesterday|today)$",
    flags=re.I,
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
        # Reply timestamps also link to /topic/.../#post-N. Collapse fragments so
        # one forum topic is counted once, not once per reply.
        url = match.group("url").split("#", 1)[0].rstrip("/") + "/"
        title = clean(match.group("title"))
        if not title or RELATIVE_TIME.fullmatch(title) or url in seen:
            continue
        seen.add(url)
        rows.append({"title": title, "url": url, "source": source})
    return rows


def classify(title: str) -> list[str]:
    text = title.lower().replace("’", "'")
    hits = [cluster for cluster, words in CLUSTERS.items() if any(word in text for word in words)]
    return hits or ["other"]


def candidate_plugins(data: dict[str, Any], limit: int = 30) -> list[dict[str, Any]]:
    records = [record for record in data.get("records", []) if record.get("ecosystem") == "wordpress"]

    def priority(record: dict[str, Any]) -> tuple[int, int, float]:
        rating = record.get("rating")
        unresolved = int(record.get("unresolved_support") or 0)
        preferred = int(str(record.get("slug_or_key") or "") in PREFERRED_SLUGS)
        weak_or_open = int((isinstance(rating, (int, float)) and rating <= 4.0) or unresolved >= 3)
        return preferred, weak_or_open, float(record.get("adjusted_score") or 0)

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
                if len(global_titles[cluster]) < 30:
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
        "schema_version": 2,
        "generated_at_jst": now.isoformat(),
        "status": "DISCOVERY_EVIDENCE_ONLY",
        "build_approved": False,
        "global_cluster_counts": dict(global_clusters.most_common()),
        "cluster_examples": dict(global_titles),
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
        "> 公開support/reviewのトピックタイトルを1トピック1件に正規化した一次スクリーニング。",
        "> クラスタ数だけでは同じ問題・支払意思・未解決差を証明しない。本文確認とexact-match gateが必須。",
        "",
        "## Cross-plugin clusters",
        "",
        "| Cluster | Unique topics matched |",
        "|---|---:|",
    ]
    for cluster, count in global_clusters.most_common():
        lines.append(f"| {cluster} | {count} |")

    lines.extend(["", "## Plugin queues", ""])
    for plugin in sorted(output_plugins, key=lambda row: row["topic_count"], reverse=True):
        clusters = ", ".join(f"{key}:{value}" for key, value in list(plugin["cluster_counts"].items())[:7]) or "none"
        lines.append(
            f"### {plugin['plugin']} — unique topics {plugin['topic_count']}, rating {plugin.get('rating')}, active {plugin.get('active_installs')}"
        )
        lines.append("")
        lines.append(f"Clusters: {clusters}")
        lines.append("")
        prioritized = sorted(
            plugin["topics"],
            key=lambda item: ("booking_integrity" in item["clusters"], item["clusters"] != ["other"]),
            reverse=True,
        )
        for topic in prioritized[:15]:
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
    print(f"mined {sum(item['topic_count'] for item in output_plugins)} unique public topics across {len(output_plugins)} plugins")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
