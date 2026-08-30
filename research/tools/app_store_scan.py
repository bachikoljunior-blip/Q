#!/usr/bin/env python3
"""Scan the public Apple Search API for paid-pain discovery signals.

The output is research evidence only. It never changes ACTIVE_CANDIDATE and
never grants build approval.
"""

from __future__ import annotations

import datetime as dt
import json
import math
import time
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / "research" / "app_store_scan"
OUT_DIR.mkdir(parents=True, exist_ok=True)
USER_AGENT = "Q-app-store-research/1.0 (+https://github.com/bachikoljunior-blip/Q)"

QUERIES = [
    # Qualifications / practice
    "交通誘導警備業務2級",
    "警備員 検定",
    "実技試験 練習",
    "口述試験 練習",
    "資格試験 音声 練習",
    "面接 音声 採点",
    # Shift / pay / field work
    "シフト 給料 計算",
    "給与明細 チェック",
    "残業代 計算",
    "勤怠 給与 照合",
    "倉庫 棚卸",
    "現場 安全 点検",
    # Creator / files / recurring business work
    "請求書 チェック",
    "領収書 OCR",
    "CSV 変換",
    "字幕 校正",
    "動画 品質 チェック",
    # Voice / music practice
    "カラオケ 音程 練習",
    "発声 練習",
    "歌 録音 分析",
    # English exact-workflow probes in Japan storefront
    "oral exam practice",
    "paycheck audit",
    "shift pay calculator",
    "inventory count audit",
    "invoice validator",
    "booking conflict checker",
]


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
        except Exception as exc:
            last_error = exc
            time.sleep(1.2 * (attempt + 1))
    raise RuntimeError(f"failed to fetch {url}: {last_error}")


def safe_float(value: Any) -> float | None:
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def safe_int(value: Any) -> int | None:
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def signal_score(record: dict[str, Any]) -> float:
    ratings = record.get("rating_count") or 0
    rating = record.get("rating")
    price = record.get("price_jpy") or 0
    score = math.log10(ratings + 1) * 5
    if price > 0:
        score += min(math.log10(price + 1), 4) * 1.4
    if rating is not None and ratings >= 10:
        score += max(0.0, 4.1 - float(rating)) * 3.5
    if ratings >= 100:
        score += 2
    if ratings >= 1000:
        score += 2
    return round(score, 3)


def normalize(result: dict[str, Any], query: str) -> dict[str, Any]:
    track_id = result.get("trackId")
    price = safe_float(result.get("price"))
    rating = safe_float(result.get("averageUserRating"))
    count = safe_int(result.get("userRatingCount"))
    record = {
        "query": query,
        "track_id": track_id,
        "name": result.get("trackName"),
        "seller": result.get("sellerName"),
        "url": result.get("trackViewUrl"),
        "bundle_id": result.get("bundleId"),
        "price_jpy": price,
        "formatted_price": result.get("formattedPrice"),
        "rating": rating,
        "rating_count": count,
        "version": result.get("version"),
        "release_date": result.get("currentVersionReleaseDate"),
        "minimum_os": result.get("minimumOsVersion"),
        "genres": result.get("genres") or [],
        "description": str(result.get("description") or "")[:1200],
        "release_notes": str(result.get("releaseNotes") or "")[:800],
    }
    record["signal_score"] = signal_score(record)
    return record


def main() -> int:
    by_id: dict[str, dict[str, Any]] = {}
    errors: list[str] = []

    for query in QUERIES:
        params = {
            "term": query,
            "country": "jp",
            "media": "software",
            "entity": "software",
            "limit": "50",
            "lang": "ja_jp",
        }
        url = "https://itunes.apple.com/search?" + urllib.parse.urlencode(params)
        try:
            payload = fetch_json(url)
            for result in payload.get("results", []):
                record = normalize(result, query)
                key = str(record.get("track_id") or record.get("bundle_id") or record.get("url"))
                if not key or key == "None":
                    continue
                existing = by_id.get(key)
                if existing:
                    queries = set(str(existing.get("query") or "").split("; "))
                    queries.add(query)
                    existing["query"] = "; ".join(sorted(q for q in queries if q))
                    existing["signal_score"] = max(existing["signal_score"], record["signal_score"])
                else:
                    by_id[key] = record
        except Exception as exc:
            errors.append(f"{query}: {exc}")
        time.sleep(0.15)

    records = sorted(by_id.values(), key=lambda row: row["signal_score"], reverse=True)
    shortlist = [
        row for row in records
        if (
            (row.get("rating_count") or 0) >= 20
            and (
                (row.get("rating") is not None and row["rating"] <= 4.0)
                or (row.get("price_jpy") or 0) > 0
                or (row.get("rating_count") or 0) >= 300
            )
        )
    ][:80]

    now = dt.datetime.now(dt.timezone(dt.timedelta(hours=9))).replace(microsecond=0)
    payload = {
        "schema_version": 1,
        "generated_at_jst": now.isoformat(),
        "status": "DISCOVERY_SIGNALS_ONLY",
        "build_approved": False,
        "purpose": "surface App Store listings for exact-workflow review; never auto-approve builds",
        "queries": QUERIES,
        "errors": errors,
        "record_count": len(records),
        "records": records,
        "shortlist": shortlist,
    }
    (OUT_DIR / "latest.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    lines = [
        "# Japanese App Store scan — discovery signals only",
        "",
        f"最終更新: {now.isoformat()}",
        "",
        "**Status: DISCOVERY_SIGNALS_ONLY / build_approved=false**",
        "",
        "> 価格・評価・レビュー数は候補探索の入口。直接競合、代替、レビュー本文、集客、採算を確認するまで商品化禁止。",
        "",
        f"- queries: {len(QUERIES)}",
        f"- unique apps: {len(records)}",
        f"- shortlist: {len(shortlist)}",
        f"- scan errors: {len(errors)}",
        "",
        "| # | App | Queries | Price | Rating | Ratings | Score |",
        "|---:|---|---|---:|---:|---:|---:|",
    ]
    for index, row in enumerate(shortlist, start=1):
        name = str(row.get("name") or "unknown").replace("|", "\\|")
        url = row.get("url") or ""
        queries = str(row.get("query") or "").replace("|", "\\|")
        price = row.get("formatted_price") or row.get("price_jpy") or 0
        rating = row.get("rating") if row.get("rating") is not None else "—"
        ratings = row.get("rating_count") or 0
        lines.append(
            f"| {index} | [{name}]({url}) | {queries} | {price} | {rating} | {ratings} | {row['signal_score']:.3f} |"
        )
    if errors:
        lines.extend(["", "## Scan warnings", ""])
        lines.extend(f"- {item}" for item in errors)
    lines.extend(
        [
            "",
            "## Gate",
            "",
            "- Review text must show the same unresolved workflow repeatedly.",
            "- Exact buyer/input/processing/output searches are mandatory.",
            "- Store presence is an acquisition hint, not proof of attainable ranking or CAC.",
            "- This scanner must never edit `research/ACTIVE_CANDIDATE.json`.",
            "",
        ]
    )
    (OUT_DIR / "latest.md").write_text("\n".join(lines), encoding="utf-8")
    print(f"scanned {len(records)} apps; shortlisted {len(shortlist)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
