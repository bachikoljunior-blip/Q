#!/usr/bin/env python3
"""Deepen the first research candidate without approving or building it.

The tool re-fetches source pages, extracts feature/pricing language, builds an
overlap matrix and records what evidence is still missing. It deliberately
cannot set ACTIVE_CANDIDATE.build_approved=true.
"""
from __future__ import annotations

import argparse
import collections
import datetime as dt
import html
import json
import re
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

USER_AGENT = "Mozilla/5.0 (compatible; Q-deep-dive/1.0; +https://github.com/bachikoljunior-blip/Q)"
STOPWORDS = {
    "that", "this", "with", "from", "into", "plus", "before", "after", "between", "their",
    "rules", "files", "site", "sites", "cloud", "output", "input", "report", "generate",
    "one", "two", "and", "the", "for", "per", "app", "tool", "software",
}
PRICE_RE = re.compile(r"(?:[$€£¥]\s?\d[\d,.]*(?:\.\d+)?|\d[\d,.]*(?:\.\d+)?\s?(?:USD|EUR|GBP|JPY|/month|per month|monthly|yearly))", re.I)


def now_jst() -> str:
    return (dt.datetime.now(dt.timezone.utc) + dt.timedelta(hours=9)).replace(microsecond=0).isoformat()


def fetch_text(url: str) -> str:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "text/html,*/*;q=0.8"})
    with urllib.request.urlopen(request, timeout=25) as response:
        return response.read().decode("utf-8", errors="replace")


def visible_text(raw: str) -> str:
    raw = re.sub(r"(?is)<script.*?</script>|<style.*?</style>|<svg.*?</svg>", " ", raw)
    raw = re.sub(r"(?s)<[^>]+>", " ", raw)
    return re.sub(r"\s+", " ", html.unescape(raw)).strip()


def tokens(value: str) -> set[str]:
    return {
        token for token in re.findall(r"[a-z0-9][a-z0-9_-]{2,}", value.lower())
        if token not in STOPWORDS and not token.isdigit()
    }


def fetch_evidence(result: dict[str, Any]) -> dict[str, Any]:
    evidence = dict(result)
    try:
        raw = fetch_text(result["url"])
        text = visible_text(raw)
        evidence["fetch_ok"] = True
        evidence["page_text_excerpt"] = text[:8000]
        evidence["prices_found"] = sorted(set(PRICE_RE.findall(text)))[:20]
        evidence["page_title"] = ""
        title = re.search(r"(?is)<title[^>]*>(.*?)</title>", raw)
        if title:
            evidence["page_title"] = visible_text(title.group(1))
    except Exception as exc:  # noqa: BLE001
        evidence["fetch_ok"] = False
        evidence["fetch_error"] = str(exc)
        evidence["page_text_excerpt"] = ""
        evidence["prices_found"] = []
        evidence["page_title"] = ""
    return evidence


def component_sets(candidate: dict[str, Any]) -> dict[str, set[str]]:
    return {
        "buyer": tokens(candidate["buyer"]),
        "input": tokens(candidate["input"]),
        "processing": tokens(candidate["processing"]),
        "output": tokens(candidate["output"]),
        "price": tokens(candidate["price_model"]),
    }


def overlap(candidate: dict[str, Any], evidence: dict[str, Any]) -> dict[str, Any]:
    text_tokens = tokens(
        " ".join([
            evidence.get("title", ""), evidence.get("snippet", ""), evidence.get("page_title", ""),
            evidence.get("page_text_excerpt", ""), evidence.get("url", ""),
        ])
    )
    components = component_sets(candidate)
    ratios: dict[str, float] = {}
    matched: dict[str, list[str]] = {}
    for name, component in components.items():
        if not component:
            ratios[name] = 0.0
            matched[name] = []
            continue
        intersection = sorted(component & text_tokens)
        ratios[name] = round(len(intersection) / len(component), 3)
        matched[name] = intersection
    # Buyer/input/processing/output are weighted. Pricing text alone cannot make a duplicate.
    weighted = round(
        ratios["buyer"] * 0.15 + ratios["input"] * 0.25 + ratios["processing"] * 0.35 + ratios["output"] * 0.25,
        3,
    )
    return {"component_overlap": ratios, "matched_tokens": matched, "weighted_overlap": weighted}


def complaint_phrases(evidence: list[dict[str, Any]]) -> list[dict[str, Any]]:
    lexicon = [
        "version control", "rollback", "compare", "diff", "history", "retention", "export",
        "migration", "failed", "missing", "hard-coded", "hardcoded", "documentation", "audit log",
        "permission", "stale", "owner", "retry", "webhook", "staging", "production", "conflict",
    ]
    counts: collections.Counter[str] = collections.Counter()
    examples: dict[str, list[str]] = collections.defaultdict(list)
    for row in evidence:
        text = " ".join([row.get("title", ""), row.get("snippet", ""), row.get("page_text_excerpt", "")]).lower()
        for phrase in lexicon:
            if phrase in text:
                counts[phrase] += 1
                if len(examples[phrase]) < 5:
                    examples[phrase].append(row["url"])
    return [
        {"phrase": phrase, "source_count": count, "examples": examples[phrase]}
        for phrase, count in counts.most_common()
    ]


def economics(candidate: dict[str, Any]) -> dict[str, Any]:
    # A conservative Japanese SaaS test model. This is a hypothesis, not market proof.
    price_jpy = 4980
    gross_margin = 0.85
    target_gross_revenue = 300000  # buffer above the user's ¥200k take-home target
    customers = (target_gross_revenue + price_jpy - 1) // price_jpy
    net_before_tax = round(price_jpy * customers * gross_margin)
    free_to_paid = 0.03
    monthly_free_visitors = round(customers / free_to_paid)
    max_cac = round(price_jpy * gross_margin * 3)  # about three months' gross profit
    return {
        "test_price_jpy_per_month": price_jpy,
        "gross_margin_hypothesis": gross_margin,
        "gross_revenue_target_jpy": target_gross_revenue,
        "paid_customers_needed": customers,
        "gross_profit_before_tax_at_target_jpy": net_before_tax,
        "free_to_paid_hypothesis": free_to_paid,
        "monthly_qualified_free_visitors_needed": monthly_free_visitors,
        "maximum_cac_hypothesis_jpy": max_cac,
        "support_limit": "<= 10 minutes per account per month average; otherwise reject zero-touch fit",
    }


def markdown(payload: dict[str, Any]) -> str:
    c = payload["candidate"]
    lines = [
        f"# Deep dive — {c['candidate_id']}",
        "",
        f"最終更新: {payload['generated_at_jst']}",
        "",
        f"Status: **{payload['status']}**",
        "",
        "## Exact workflow",
        "",
        f"`{c['buyer']} が {c['input']} を入れる → {c['processing']} → {c['output']} を受け取る → {c['price_model']}`",
        "",
        "## Evidence counts",
        "",
        f"- Search queries: {len(c['searches'])}",
        f"- Fetched direct/adjacent product pages: {payload['counts']['product_pages_fetched']}",
        f"- Fetched complaint pages: {payload['counts']['complaint_pages_fetched']}",
        f"- Substitutes: {payload['counts']['substitutes']}",
        f"- 70%+ weighted exact overlaps: {payload['counts']['high_overlap_products']}",
        "",
        "## Product overlap matrix",
        "",
        "| product | weighted | buyer | input | processing | output | prices |",
        "|---|---:|---:|---:|---:|---:|---|",
    ]
    for row in payload["product_evidence"]:
        ratios = row["overlap"]["component_overlap"]
        prices = ", ".join(row.get("prices_found", [])[:4]) or "—"
        title = row.get("page_title") or row.get("title") or row["url"]
        lines.append(
            f"| [{title}]({row['url']}) | {row['overlap']['weighted_overlap']:.3f} | {ratios['buyer']:.3f} | {ratios['input']:.3f} | {ratios['processing']:.3f} | {ratios['output']:.3f} | {prices} |"
        )
    lines += ["", "## Repeated complaint phrases", ""]
    if payload["complaint_phrases"]:
        for item in payload["complaint_phrases"][:20]:
            lines.append(f"- `{item['phrase']}` — {item['source_count']} fetched sources")
    else:
        lines.append("- No repeated phrase cleared the fetch stage.")
    lines += ["", "## Economics hypothesis", ""]
    for key, value in payload["economics"].items():
        lines.append(f"- `{key}`: {value}")
    lines += ["", "## Gate result", ""]
    lines.append(f"**{payload['status']}** — {payload['reason']}")
    lines += ["", "## Missing evidence", ""]
    if payload["missing_evidence"]:
        lines.extend(f"- {item}" for item in payload["missing_evidence"])
    else:
        lines.append("- none recorded")
    lines += [
        "",
        "## Hard boundary",
        "",
        "このdeep diveは `research/ACTIVE_CANDIDATE.json` を変更せず、商品コードも作らない。BUILD_APPROVEDには公式ページの最終目視確認と、具体的な集客面の証拠が必要。",
        "",
    ]
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--queue", default="research/candidate_queue/latest.json")
    parser.add_argument("--output-dir", default="research/deep_dive")
    args = parser.parse_args()
    queue = json.loads(Path(args.queue).read_text(encoding="utf-8"))
    candidates = queue.get("candidates", [])
    candidate = next((row for row in candidates if row["status"] == "DEEP_DIVE_REQUIRED"), None)
    if candidate is None:
        candidate = candidates[0] if candidates else None
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    if candidate is None:
        payload = {
            "schema_version": 1,
            "generated_at_jst": now_jst(),
            "status": "NO_CANDIDATE_TO_DEEP_DIVE",
            "reason": "candidate queue was empty",
        }
        (output_dir / "latest.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        (output_dir / "latest.md").write_text("# Deep dive\n\nNo candidate to deep-dive.\n", encoding="utf-8")
        return 0

    product_inputs = candidate.get("direct_competitors", []) + candidate.get("adjacent_products", [])
    complaint_inputs = candidate.get("complaint_threads", [])
    substitute_inputs = candidate.get("oss_substitutes", []) + candidate.get("platform_substitutes", [])
    products = [fetch_evidence(row) for row in product_inputs[:25]]
    complaints = [fetch_evidence(row) for row in complaint_inputs[:35]]
    substitutes = [fetch_evidence(row) for row in substitute_inputs[:25]]
    for row in products:
        row["overlap"] = overlap(candidate, row)
    products.sort(key=lambda row: row["overlap"]["weighted_overlap"], reverse=True)
    phrases = complaint_phrases([row for row in complaints if row.get("fetch_ok")])
    high_overlap = [row for row in products if row.get("fetch_ok") and row["overlap"]["weighted_overlap"] >= 0.70]
    fetched_products = [row for row in products if row.get("fetch_ok")]
    fetched_complaints = [row for row in complaints if row.get("fetch_ok")]
    fetched_substitutes = [row for row in substitutes if row.get("fetch_ok")]

    missing: list[str] = []
    if len(fetched_products) < 5:
        missing.append("公式または販売元の商品ページを5件以上取得できていない")
    if len(fetched_substitutes) < 5:
        missing.append("無料・標準・手作業の代替を5件以上取得できていない")
    if len(fetched_complaints) < 10:
        missing.append("反復する公開不満を10件以上取得できていない")
    if len([item for item in phrases if item["source_count"] >= 2]) < 3:
        missing.append("独立ソースで繰り返される未解決不満が3種類未満")
    if high_overlap:
        status = "REJECT_EXACT_DUPLICATE"
        reason = "Fetched product evidence contains a 70%+ workflow overlap."
    elif missing:
        status = "RESEARCH_ONLY"
        reason = "No automated duplicate veto fired, but mandatory evidence is incomplete."
    else:
        status = "MANUAL_FINAL_REVIEW_REQUIRED"
        reason = "Automated evidence thresholds cleared; official feature/pricing pages and acquisition claims still require final manual verification before OFFER_TEST or BUILD_APPROVED."

    payload = {
        "schema_version": 1,
        "generated_at_jst": now_jst(),
        "status": status,
        "reason": reason,
        "candidate": candidate,
        "counts": {
            "product_pages_fetched": len(fetched_products),
            "complaint_pages_fetched": len(fetched_complaints),
            "substitutes": len(fetched_substitutes),
            "high_overlap_products": len(high_overlap),
        },
        "product_evidence": products,
        "complaint_evidence": complaints,
        "substitute_evidence": substitutes,
        "complaint_phrases": phrases,
        "economics": economics(candidate),
        "missing_evidence": missing,
    }
    (output_dir / "latest.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (output_dir / "latest.md").write_text(markdown(payload), encoding="utf-8")
    print(json.dumps({"candidate": candidate["candidate_id"], "status": status, "counts": payload["counts"]}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
