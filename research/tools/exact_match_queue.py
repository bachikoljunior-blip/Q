#!/usr/bin/env python3
"""Build a conservative research queue from exact-workflow web searches.

This tool is not an idea generator that auto-approves builds. It runs the same
buyer/input/processing/output queries that were previously skipped, captures
product, OSS, platform and complaint results, and rejects obvious duplicates.
"""
from __future__ import annotations

import argparse
import datetime as dt
import html
import json
import re
import time
import urllib.parse
import urllib.request
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Any

USER_AGENT = "Mozilla/5.0 (compatible; Q-exact-match-research/1.0; +https://github.com/bachikoljunior-blip/Q)"


@dataclass(frozen=True)
class Candidate:
    candidate_id: str
    buyer: str
    input: str
    processing: str
    output: str
    price_model: str
    exact_terms: tuple[str, ...]
    platform_terms: tuple[str, ...]
    complaint_terms: tuple[str, ...]
    acquisition_channel: str


CANDIDATES = [
    Candidate(
        "jira-automation-rule-guard",
        "Jira Cloud administrators and agencies",
        "one or two exported Jira automation-rule JSON files",
        "normalize rules, diff versions, flag hard-coded IDs/secrets/missing references and generate readable rule documentation",
        "HTML/Markdown change report, migration warnings and rule inventory",
        "$19–29 per site/month or $99/year",
        ("jira automation rule", "export json", "diff", "linter", "documentation"),
        ("atlassian marketplace", "jira cloud", "forge app"),
        ("version control", "rollback", "compare automation rules", "export all rules", "migration failed"),
        "Atlassian Marketplace + exact Jira-admin search queries",
    ),
    Candidate(
        "jira-permission-drift-evidence",
        "Jira Cloud administrators in regulated teams",
        "two permission/configuration snapshots or exported project settings",
        "compare access changes, identify privilege expansion and map each change to actor/date/evidence",
        "permission-drift report and audit evidence bundle",
        "$29–59 per site/month",
        ("jira permission", "configuration snapshot", "diff", "drift", "audit evidence"),
        ("atlassian marketplace", "jira cloud", "security compliance"),
        ("permission changed", "who changed", "audit log retention", "privilege drift", "access review"),
        "Atlassian Marketplace security/compliance category",
    ),
    Candidate(
        "confluence-owner-expiry-attestation",
        "Confluence knowledge-base owners",
        "page inventory plus owner/reviewer rules",
        "assign owners, request periodic attestation, detect orphaned/stale pages and retain review evidence",
        "review queue, expiry reminders and audit trail",
        "$19–49 per site/month",
        ("confluence page owner", "content expiry", "attestation", "stale pages", "review evidence"),
        ("atlassian marketplace", "confluence cloud", "content governance"),
        ("outdated content", "page owner", "review reminder", "orphaned pages", "attestation"),
        "Atlassian Marketplace content-management category",
    ),
    Candidate(
        "woocommerce-webhook-replay",
        "WooCommerce stores and integration agencies",
        "WooCommerce webhook delivery logs",
        "detect failed/duplicate deliveries, redact secrets and safely replay selected payloads with idempotency checks",
        "retry queue, failure cause report and replay history",
        "$19–39 per site/month",
        ("woocommerce webhook", "failed delivery", "replay", "retry queue", "idempotency"),
        ("wordpress plugin", "woocommerce extension", "webhook"),
        ("webhook failed", "retry webhook", "duplicate webhook", "delivery log", "webhook not working"),
        "WordPress.org free companion + WooCommerce/own Pro checkout",
    ),
    Candidate(
        "wordpress-settings-diff-preflight",
        "WordPress agencies moving sites between staging and production",
        "plugin/theme option exports from two WordPress sites",
        "normalize settings, redact secrets, diff environment-specific values and flag unsafe production overwrites",
        "migration preflight report and safe import patch",
        "$49–99/year per agency",
        ("wordpress settings", "staging production", "diff", "migration preflight", "option export"),
        ("wordpress plugin", "wp cli", "site migration"),
        ("settings overwritten", "staging to production", "compare options", "migration broke", "environment values"),
        "WordPress.org + agency search traffic",
    ),
    Candidate(
        "jira-automation-audit-retention",
        "Jira Cloud administrators who need longer automation evidence",
        "automation audit-log export or scheduled API pulls",
        "retain, search and correlate rule executions beyond native retention and surface repeated failure patterns",
        "long-term searchable audit history and failure digest",
        "$19–49 per site/month",
        ("jira automation audit log", "retention", "export", "search", "failure history"),
        ("atlassian marketplace", "jira cloud", "automation audit"),
        ("audit log retention", "automation history", "rule failure", "export audit log", "90 days"),
        "Atlassian Marketplace + automation-admin search",
    ),
    Candidate(
        "wordpress-update-impact-preflight",
        "WordPress agencies maintaining many client sites",
        "plugin/theme update list plus site dependency inventory",
        "identify likely breaking combinations, abandoned dependencies and rollback gaps before updates",
        "risk-ranked update plan and rollback checklist",
        "$29–79/month for multi-site agencies",
        ("wordpress update", "compatibility", "preflight", "dependency", "rollback plan"),
        ("wordpress plugin", "wordpress agency", "maintenance"),
        ("update broke site", "plugin conflict", "safe update", "rollback", "compatibility check"),
        "WordPress.org + managed-maintenance ecosystem",
    ),
    Candidate(
        "confluence-external-share-offboarding",
        "Confluence administrators offboarding clients or contractors",
        "guest/external-user list and page-space permissions",
        "trace all pages, links and inherited access reachable by each external identity before removal",
        "offboarding impact report and evidence checklist",
        "$29–59 per site/month",
        ("confluence guest", "external user", "offboarding", "access impact", "permission report"),
        ("atlassian marketplace", "confluence cloud", "external collaboration"),
        ("remove guest", "external access", "who can see", "offboarding", "permission inheritance"),
        "Atlassian Marketplace security category",
    ),
]

PRODUCT_DOMAINS = {
    "marketplace.atlassian.com", "apps.shopify.com", "wordpress.org", "woocommerce.com",
    "appsumo.com", "gumroad.com", "codecanyon.net", "chromewebstore.google.com",
}
COMPLAINT_DOMAINS = {
    "community.atlassian.com", "reddit.com", "wordpress.org", "stackoverflow.com",
    "github.com", "community.shopify.com", "support.google.com",
}
OSS_DOMAINS = {"github.com", "gitlab.com", "npmjs.com", "pypi.org"}
PLATFORM_DOMAINS = {"support.atlassian.com", "developer.atlassian.com", "developer.wordpress.org", "woocommerce.com"}


def now_jst() -> str:
    return (dt.datetime.now(dt.timezone.utc) + dt.timedelta(hours=9)).replace(microsecond=0).isoformat()


def fetch_text(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "text/html,*/*;q=0.8"})
    with urllib.request.urlopen(req, timeout=25) as response:
        return response.read().decode("utf-8", errors="replace")


def clean(text: str) -> str:
    text = html.unescape(re.sub(r"<[^>]+>", " ", text or ""))
    return re.sub(r"\s+", " ", text).strip()


def normalize_result_url(raw: str) -> str:
    raw = html.unescape(raw)
    parsed = urllib.parse.urlparse(raw)
    if "duckduckgo.com" in parsed.netloc and parsed.path.startswith("/l/"):
        query = urllib.parse.parse_qs(parsed.query)
        target = query.get("uddg", [raw])[0]
        return urllib.parse.unquote(target)
    if raw.startswith("//"):
        return "https:" + raw
    return raw


def ddg_search(query: str, limit: int = 20) -> list[dict[str, str]]:
    url = "https://html.duckduckgo.com/html/?" + urllib.parse.urlencode({"q": query})
    page = fetch_text(url)
    # DuckDuckGo HTML currently exposes result__a and result__snippet. Keep a
    # generic fallback so source changes are visible as an empty result set.
    links = re.findall(
        r'<a[^>]+class="[^"]*result__a[^"]*"[^>]+href="([^"]+)"[^>]*>(.*?)</a>',
        page,
        flags=re.I | re.S,
    )
    snippets = re.findall(
        r'<a[^>]+class="[^"]*result__snippet[^"]*"[^>]*>(.*?)</a>|<div[^>]+class="[^"]*result__snippet[^"]*"[^>]*>(.*?)</div>',
        page,
        flags=re.I | re.S,
    )
    snippet_values = [clean(a or b) for a, b in snippets]
    results: list[dict[str, str]] = []
    for index, (href, title) in enumerate(links[:limit]):
        target = normalize_result_url(href)
        parsed = urllib.parse.urlparse(target)
        results.append({
            "title": clean(title),
            "url": target,
            "domain": parsed.netloc.lower().removeprefix("www."),
            "snippet": snippet_values[index] if index < len(snippet_values) else "",
        })
    return results


def query_set(candidate: Candidate) -> list[tuple[str, str]]:
    workflow = " ".join(candidate.exact_terms)
    platform = " ".join(candidate.platform_terms)
    complaints = " ".join(candidate.complaint_terms)
    return [
        ("exact", f'"{candidate.exact_terms[0]}" "{candidate.exact_terms[1]}" {candidate.exact_terms[2]}'),
        ("exact", f'{workflow} tool'),
        ("exact", f'{workflow} app pricing'),
        ("exact", f'{workflow} free'),
        ("exact", f'{workflow} open source GitHub'),
        ("marketplace", f'{platform} {candidate.exact_terms[2]}'),
        ("marketplace", f'site:marketplace.atlassian.com {workflow}'),
        ("marketplace", f'site:wordpress.org/plugins {workflow}'),
        ("product", f'{candidate.input} {candidate.output}'),
        ("product", f'{candidate.processing} software'),
        ("complaint", f'{complaints}'),
        ("complaint", f'site:community.atlassian.com {complaints}'),
        ("complaint", f'site:wordpress.org/support {complaints}'),
        ("complaint", f'site:reddit.com {complaints}'),
        ("complaint", f'site:github.com/issues {complaints}'),
        ("substitute", f'how to {candidate.processing} manually'),
    ]


def overlap_score(candidate: Candidate, result: dict[str, str]) -> float:
    text = f"{result['title']} {result['snippet']} {result['url']}".lower()
    term_hits = sum(1 for term in candidate.exact_terms if all(part in text for part in term.lower().split()))
    input_hits = sum(1 for part in re.findall(r"[a-z0-9]{4,}", candidate.input.lower()) if part in text)
    output_hits = sum(1 for part in re.findall(r"[a-z0-9]{4,}", candidate.output.lower()) if part in text)
    score = min(1.0, term_hits / max(3, len(candidate.exact_terms)) + min(input_hits, 3) * 0.08 + min(output_hits, 3) * 0.08)
    return round(score, 3)


def classify(kind: str, result: dict[str, str], candidate: Candidate) -> str:
    domain = result["domain"]
    text = f"{result['title']} {result['snippet']}".lower()
    overlap = overlap_score(candidate, result)
    if domain in COMPLAINT_DOMAINS and (kind == "complaint" or any(term in text for term in ("problem", "feature", "wish", "missing", "failed", "cannot"))):
        return "complaint"
    if domain in OSS_DOMAINS and any(term in text for term in ("github", "open source", "repository", "plugin", "action")):
        return "oss"
    if domain in PLATFORM_DOMAINS:
        return "platform"
    if domain in PRODUCT_DOMAINS or any(term in text for term in ("pricing", "free trial", "per month", "app", "plugin", "software", "saas")):
        return "direct" if overlap >= 0.55 else "adjacent"
    return "other"


def evaluate(candidate: Candidate) -> dict[str, Any]:
    searches: list[dict[str, Any]] = []
    dedup: dict[str, dict[str, Any]] = {}
    errors: list[str] = []
    for kind, query in query_set(candidate):
        try:
            results = ddg_search(query)
        except Exception as exc:  # noqa: BLE001
            errors.append(f"{query}: {exc}")
            results = []
        searches.append({"kind": kind, "query": query, "result_count": len(results)})
        for result in results:
            url = result["url"].split("#", 1)[0]
            enriched = dict(result)
            enriched["query_kind"] = kind
            enriched["query"] = query
            enriched["overlap"] = overlap_score(candidate, result)
            enriched["classification"] = classify(kind, result, candidate)
            existing = dedup.get(url)
            if existing is None or enriched["overlap"] > existing["overlap"]:
                dedup[url] = enriched
        time.sleep(0.35)

    results = sorted(dedup.values(), key=lambda r: (r["overlap"], r["classification"] == "direct"), reverse=True)
    direct = [r for r in results if r["classification"] == "direct"]
    adjacent = [r for r in results if r["classification"] == "adjacent"]
    complaints = [r for r in results if r["classification"] == "complaint"]
    oss = [r for r in results if r["classification"] == "oss"]
    platform = [r for r in results if r["classification"] == "platform"]
    high_overlap = [r for r in direct if r["overlap"] >= 0.70]

    if high_overlap:
        status = "REJECT_EXACT_DUPLICATE"
        veto = "FAIL"
        reason = "At least one result overlaps the exact workflow by 70% or more."
    elif oss and any(r["overlap"] >= 0.55 for r in oss):
        status = "REJECT_FREE_CORE"
        veto = "FAIL"
        reason = "A free/OSS result appears to provide the core workflow."
    elif len(complaints) >= 10 and len(direct) >= 5:
        status = "DEEP_DIVE_REQUIRED"
        veto = "PENDING_MANUAL_OVERLAP_MATRIX"
        reason = "Repeated complaint and market evidence exist, with no automated 70% duplicate hit; manual source verification is required."
    else:
        status = "INSUFFICIENT_EVIDENCE"
        veto = "NOT_PASSED"
        reason = "The automated sweep did not prove both repeated pain and a monetizable competitor landscape."

    return {
        **asdict(candidate),
        "status": status,
        "duplicate_veto": veto,
        "reason": reason,
        "searches": searches,
        "results_total": len(results),
        "direct_competitors": direct[:20],
        "adjacent_products": adjacent[:20],
        "complaint_threads": complaints[:30],
        "oss_substitutes": oss[:20],
        "platform_substitutes": platform[:20],
        "errors": errors,
    }


def markdown(payload: dict[str, Any]) -> str:
    lines = [
        "# Exact-workflow candidate queue",
        "",
        f"最終更新: {payload['generated_at_jst']}",
        "",
        "## Rule",
        "",
        "この自動検索は候補をBUILD_APPROVEDにしない。`DEEP_DIVE_REQUIRED` は、手動で公式ページ・料金・レビュー本文・重複表を確認する順番を示すだけ。",
        "",
        "## Queue",
        "",
        "| candidate | status | direct | complaints | OSS | errors |",
        "|---|---|---:|---:|---:|---:|",
    ]
    for row in payload["candidates"]:
        lines.append(
            f"| `{row['candidate_id']}` | **{row['status']}** | {len(row['direct_competitors'])} | {len(row['complaint_threads'])} | {len(row['oss_substitutes'])} | {len(row['errors'])} |"
        )
    for row in payload["candidates"]:
        lines += [
            "",
            f"## {row['candidate_id']}",
            "",
            f"- Status: **{row['status']}**",
            f"- Buyer: {row['buyer']}",
            f"- Input: {row['input']}",
            f"- Processing: {row['processing']}",
            f"- Output: {row['output']}",
            f"- Price hypothesis: {row['price_model']}",
            f"- Acquisition: {row['acquisition_channel']}",
            f"- Reason: {row['reason']}",
            "",
            "### Highest-overlap product results",
        ]
        if row["direct_competitors"]:
            for result in row["direct_competitors"][:10]:
                lines.append(f"- [{result['title']}]({result['url']}) — overlap {result['overlap']}")
        else:
            lines.append("- none found by the automated search")
        lines += ["", "### Public complaint results"]
        if row["complaint_threads"]:
            for result in row["complaint_threads"][:12]:
                lines.append(f"- [{result['title']}]({result['url']})")
        else:
            lines.append("- fewer than the required public results")
    lines += [
        "",
        "## Guardrail",
        "",
        "検索結果のタイトル一致は証拠の最終確認ではない。候補を進める場合は公式ページを開き、buyer/input/processing/output/priceの重複表を完成させる。",
        "",
    ]
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-dir", default="research/candidate_queue")
    args = parser.parse_args()
    output = Path(args.output_dir)
    output.mkdir(parents=True, exist_ok=True)
    evaluated = [evaluate(candidate) for candidate in CANDIDATES]
    rank = {"DEEP_DIVE_REQUIRED": 0, "INSUFFICIENT_EVIDENCE": 1, "REJECT_FREE_CORE": 2, "REJECT_EXACT_DUPLICATE": 3}
    evaluated.sort(key=lambda row: (rank.get(row["status"], 9), -len(row["complaint_threads"]), len(row["direct_competitors"])))
    payload = {
        "schema_version": 1,
        "generated_at_jst": now_jst(),
        "status": "RESEARCH_ONLY",
        "candidate_count": len(evaluated),
        "candidates": evaluated,
    }
    (output / "latest.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (output / "latest.md").write_text(markdown(payload), encoding="utf-8")
    print(json.dumps({row["candidate_id"]: row["status"] for row in evaluated}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
