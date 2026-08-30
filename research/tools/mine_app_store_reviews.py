#!/usr/bin/env python3
"""Mine public Japanese App Store review feeds for repeated workflow complaints.

Discovery evidence only. The script never edits ACTIVE_CANDIDATE or grants
build approval.
"""

from __future__ import annotations

import datetime as dt
import json
import re
import time
import urllib.request
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
SCAN_DIR = ROOT / "research" / "app_store_scan"
SOURCE = SCAN_DIR / "latest.json"
OUT_JSON = SCAN_DIR / "reviews.json"
OUT_MD = SCAN_DIR / "reviews.md"
USER_AGENT = "Q-app-store-review-research/1.0 (+https://github.com/bachikoljunior-blip/Q)"

CLUSTERS: dict[str, tuple[str, ...]] = {
    "accuracy_mismatch": ("違う", "合わ", "不正確", "間違", "誤", "精度", "実際", "本番", "accuracy", "wrong", "incorrect"),
    "content_too_easy_or_shallow": ("簡単", "浅い", "少ない", "物足り", "easy", "shallow", "few questions"),
    "missing_feature": ("ない", "できない", "欲しい", "対応して", "追加", "missing", "cannot", "wish", "feature"),
    "subscription_price": ("課金", "有料", "高い", "サブスク", "解約", "price", "expensive", "subscription", "cancel"),
    "ads_or_paywall": ("広告", "CM", "ロック", "制限", "ad", "paywall", "locked"),
    "bug_crash": ("落ち", "開か", "動か", "バグ", "不具合", "クラッシュ", "crash", "bug", "freeze"),
    "data_loss_sync": ("消え", "同期", "引き継", "復元", "保存", "lost", "sync", "restore", "save"),
    "usability": ("使いにく", "わかりにく", "操作", "見づら", "UI", "UX", "difficult to use"),
    "voice_or_speech": ("音声", "発音", "録音", "話す", "声", "speech", "voice", "record"),
    "offline_privacy": ("オフライン", "通信", "個人情報", "プライバシ", "offline", "privacy"),
}


def fetch_json(url: str, retries: int = 3) -> Any:
    last_error: Exception | None = None
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={"Accept": "application/json", "User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=30) as response:
                return json.loads(response.read().decode("utf-8"))
        except Exception as exc:
            last_error = exc
            time.sleep(1.2 * (attempt + 1))
    raise RuntimeError(f"failed to fetch {url}: {last_error}")


def classify(text: str) -> list[str]:
    normalized = re.sub(r"\s+", " ", text).lower()
    hits = [name for name, words in CLUSTERS.items() if any(word.lower() in normalized for word in words)]
    return hits or ["other"]


def feed_entries(payload: dict[str, Any]) -> list[dict[str, Any]]:
    feed = payload.get("feed") or {}
    entries = feed.get("entry") or []
    if isinstance(entries, dict):
        entries = [entries]
    rows: list[dict[str, Any]] = []
    for entry in entries:
        if not isinstance(entry, dict) or "im:rating" not in entry:
            continue
        title = str((entry.get("title") or {}).get("label") or "").strip()
        body = str((entry.get("content") or {}).get("label") or "").strip()
        rating_raw = str((entry.get("im:rating") or {}).get("label") or "")
        try:
            rating = int(rating_raw)
        except ValueError:
            rating = None
        review_id = str((entry.get("id") or {}).get("label") or "")
        rows.append(
            {
                "review_id": review_id,
                "title": title,
                "body": body,
                "rating": rating,
                "clusters": classify(title + " " + body),
            }
        )
    return rows


def priority_apps(data: dict[str, Any], limit: int = 35) -> list[dict[str, Any]]:
    rows = list(data.get("shortlist") or [])
    rows.sort(
        key=lambda row: (
            int((row.get("rating") or 5) <= 4.0),
            int(row.get("rating_count") or 0),
            float(row.get("signal_score") or 0),
        ),
        reverse=True,
    )
    return rows[:limit]


def main() -> int:
    data = json.loads(SOURCE.read_text(encoding="utf-8"))
    apps: list[dict[str, Any]] = []
    global_counts: Counter[str] = Counter()
    global_examples: dict[str, list[dict[str, Any]]] = defaultdict(list)

    for app in priority_apps(data):
        track_id = app.get("track_id")
        if not track_id:
            continue
        reviews: dict[str, dict[str, Any]] = {}
        errors: list[str] = []
        for page in (1, 2, 3):
            url = f"https://itunes.apple.com/jp/rss/customerreviews/page={page}/id={track_id}/sortby=mostrecent/json"
            try:
                payload = fetch_json(url)
                for review in feed_entries(payload):
                    key = review["review_id"] or f"{review['title']}::{review['body']}"
                    reviews[key] = review
            except Exception as exc:
                errors.append(f"page {page}: {exc}")
            time.sleep(0.12)

        cluster_counts: Counter[str] = Counter()
        for review in reviews.values():
            for cluster in review["clusters"]:
                cluster_counts[cluster] += 1
                global_counts[cluster] += 1
                if len(global_examples[cluster]) < 25:
                    global_examples[cluster].append(
                        {
                            "app": app.get("name"),
                            "rating": review.get("rating"),
                            "title": review.get("title"),
                            "body": review.get("body", "")[:260],
                        }
                    )

        apps.append(
            {
                "track_id": track_id,
                "name": app.get("name"),
                "url": app.get("url"),
                "queries": app.get("query"),
                "price_jpy": app.get("price_jpy"),
                "store_rating": app.get("rating"),
                "store_rating_count": app.get("rating_count"),
                "review_count_mined": len(reviews),
                "cluster_counts": dict(cluster_counts.most_common()),
                "reviews": list(reviews.values()),
                "errors": errors,
            }
        )

    now = dt.datetime.now(dt.timezone(dt.timedelta(hours=9))).replace(microsecond=0)
    payload = {
        "schema_version": 1,
        "generated_at_jst": now.isoformat(),
        "status": "DISCOVERY_EVIDENCE_ONLY",
        "build_approved": False,
        "global_cluster_counts": dict(global_counts.most_common()),
        "global_examples": global_examples,
        "apps": apps,
    }
    OUT_JSON.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    lines = [
        "# Japanese App Store review mining — discovery evidence only",
        "",
        f"最終更新: {now.isoformat()}",
        "",
        "**Status: DISCOVERY_EVIDENCE_ONLY / build_approved=false**",
        "",
        "> 公開レビューを機械分類した一次調査。件数は同一workflowや支払意思を証明しない。本文確認とPREBUILD_GATEが必須。",
        "",
        "## Cross-app clusters",
        "",
        "| Cluster | Reviews matched |",
        "|---|---:|",
    ]
    for cluster, count in global_counts.most_common():
        lines.append(f"| {cluster} | {count} |")

    lines.extend(["", "## App queues", ""])
    for app in sorted(apps, key=lambda row: row["review_count_mined"], reverse=True):
        clusters = ", ".join(f"{k}:{v}" for k, v in list(app["cluster_counts"].items())[:7]) or "none"
        lines.append(
            f"### {app['name']} — mined {app['review_count_mined']}, store rating {app.get('store_rating')}, ratings {app.get('store_rating_count')}"
        )
        lines.append("")
        lines.append(f"Queries: {app.get('queries')}")
        lines.append("")
        lines.append(f"Clusters: {clusters}")
        lines.append("")
        low_reviews = [row for row in app["reviews"] if isinstance(row.get("rating"), int) and row["rating"] <= 3]
        for review in low_reviews[:12]:
            title = str(review.get("title") or "(no title)").replace("\n", " ")
            body = str(review.get("body") or "").replace("\n", " ")[:220]
            clusters_text = ", ".join(review.get("clusters") or [])
            lines.append(f"- ★{review.get('rating')} **{title}** — {body} — `{clusters_text}`")
        if app["errors"]:
            lines.append(f"- scan warnings: {len(app['errors'])}")
        lines.append("")

    lines.extend(
        [
            "## Gate",
            "",
            "- 同じbuyer/input/processing/outputの不満が10件未満なら棄却。",
            "- 10件以上でも、既存競合・無料代替・platform標準機能で解決済みなら棄却。",
            "- App Store検索面があっても、順位・転換率・CACの実測なしにacquisition PASSとしない。",
            "- この結果から自動で候補を承認しない。",
            "",
        ]
    )
    OUT_MD.write_text("\n".join(lines), encoding="utf-8")
    print(f"mined {sum(row['review_count_mined'] for row in apps)} reviews across {len(apps)} apps")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
