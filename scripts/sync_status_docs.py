#!/usr/bin/env python3
"""Synchronize human-facing status docs from ACTIVE_CANDIDATE.json.

This prevents stale product labels and preserves the completion-before-response
contract whenever status files are regenerated.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ACTIVE_PATH = ROOT / "research" / "ACTIVE_CANDIDATE.json"
WORK_PATH = ROOT / "execution" / "CURRENT_WORK.json"
STATE_PATH = ROOT / "PROJECT_STATE.md"
START_PATH = ROOT / "START_HERE.md"
README_PATH = ROOT / "README.md"
AGENTS_PATH = ROOT / "AGENTS.md"
INDEX_PATH = ROOT / "index.html"

LIVE_STATUSES = {"LIVE_FREE_MVP", "LIVE_PAID_PRODUCT"}


def load_active() -> dict:
    return json.loads(ACTIVE_PATH.read_text(encoding="utf-8"))


def load_work() -> dict:
    return json.loads(WORK_PATH.read_text(encoding="utf-8"))


def candidate_lines(active: dict) -> list[str]:
    status = active["status"]
    name = active.get("name")
    candidate_id = active.get("candidate_id")
    lines = [f"- Status: `{status}`", f"- Build approved: **{str(bool(active.get('build_approved'))).lower()}**"]
    if candidate_id:
        lines.append(f"- Candidate: `{candidate_id}`")
    if name:
        lines.append(f"- Name: {name}")
    if status not in LIVE_STATUSES:
        lines.append("- Live product: none")
    return lines


def write_start(active: dict, work: dict) -> None:
    status = active["status"]
    reason = active.get("reason") or "See PROJECT_STATE.md."
    lead_line = (
        "候補の不足証拠とkill criteriaを同じcycleで処理する。"
        if active.get("candidate_id")
        else "marketplace evidenceから候補を探すが、Gate通過前にLP・MVP・商品コードを作らない。"
    )
    terminal = sum(item.get("status") in {"DONE", "REJECTED", "BLOCKED_EXTERNAL"} for item in work.get("tasks", []))
    text = "\n".join(
        [
            "# START HERE",
            "",
            "最終更新: 2026-08-30",
            "",
            "## Mission",
            "zero-touchで手取り月20万円以上を作り、生活のための労働を不要にする。",
            "",
            "## Read first",
            "1. `AGENTS.md`",
            "2. `PROJECT_STATE.md`",
            "3. `research/ACTIVE_CANDIDATE.json`",
            "4. `execution/CURRENT_WORK.json`",
            "5. `research/PREBUILD_GATE.md`",
            "6. `research/BATCH_VETO_2026-08-30.md`",
            "7. `DECISIONS.md`",
            "",
            "## Current truth",
            "- EXP001: CLOSED",
            "- EXP002: CLOSED",
            "- EXP003: CLOSED",
            "- EXP004: CLOSED",
            "- SECURITY_PRACTICAL_VOICE_TRAINER: CLOSED",
            "- JIRA_AUTOMATION_GUARD: CLOSED",
            *candidate_lines(active),
            "- New product code is forbidden until `build_approved=true`",
            f"- Current work: `{work.get('finalization_state')}` / terminal tasks {terminal}",
            "",
            f"Reason: {reason}",
            "",
            "## Do not repeat",
            "- Do not ask for constraints already recorded.",
            "- Do not revive a closed experiment because code already exists.",
            "- Do not infer viability from ‘market exists’. Search the exact buyer/input/processing/output workflow.",
            "- Do not treat localization, lower price, local processing or no-login as sufficient differentiation without external evidence.",
            "- Do not call a research lead a product.",
            "- A final answer is forbidden while any safe material action remains.",
            "- The user must never need to repeat the completion directive.",
            "- When a weakness is found, correct it, clean stale executables, rerun checks and update state in the same work cycle.",
            "",
            "## Immediate resume",
            lead_line,
            "",
        ]
    )
    START_PATH.write_text(text, encoding="utf-8")


def write_readme(active: dict, work: dict) -> None:
    status = active["status"]
    live = status in LIVE_STATUSES
    product_text = "公開商品あり。PROJECT_STATEを参照。" if live else "現在、公開中の商品はありません。"
    text = "\n".join(
        [
            "# Q — zero-touch income project",
            "",
            "目標: **手取り月20万円以上を、本人の継続労働への依存を小さくして構築する。**",
            "",
            f"Current status: **`{status}`**  ",
            f"Build approved: **{str(bool(active.get('build_approved'))).lower()}**  ",
            f"Current work: **`{work.get('finalization_state')}`**  ",
            product_text,
            "",
            "## Source of truth",
            "1. [`AGENTS.md`](AGENTS.md)",
            "2. [`PROJECT_STATE.md`](PROJECT_STATE.md)",
            "3. [`research/ACTIVE_CANDIDATE.json`](research/ACTIVE_CANDIDATE.json)",
            "4. [`execution/CURRENT_WORK.json`](execution/CURRENT_WORK.json)",
            "5. [`research/PREBUILD_GATE.md`](research/PREBUILD_GATE.md)",
            "6. [`DECISIONS.md`](DECISIONS.md)",
            "",
            "## Enforcement",
            "- Exact buyer/input/processing/output competitors are searched before implementation.",
            "- `product/` code is prohibited while `build_approved=false`.",
            "- Research scans never auto-approve a product.",
            "- A response cycle cannot finalize with unfinished material tasks.",
            "- Closing a candidate removes its executable build/deploy/metrics/indexing artifacts.",
            "- EXP001–004, security voice trainer and Jira Automation Guard are closed.",
            "",
        ]
    )
    README_PATH.write_text(text, encoding="utf-8")


def sync_agents(active: dict) -> None:
    text = AGENTS_PATH.read_text(encoding="utf-8")
    status = active["status"]
    candidate = active.get("candidate_id")
    if candidate:
        body = (
            f"`{status}` — `{candidate}` is a research/offer lead according to "
            "`research/ACTIVE_CANDIDATE.json`. Its status is not a product claim. "
            "Apply all kill criteria before implementation.\n"
        )
    else:
        body = (
            f"`{status}` — no candidate is currently approved for an offer or build. "
            "Continue marketplace-first research; do not create a weak product.\n"
        )
    replacement = "## Current status\n" + body
    if "## Current status" in text:
        text = re.sub(r"## Current status\n[\s\S]*\Z", replacement, text)
    else:
        text = text.rstrip() + "\n\n" + replacement
    AGENTS_PATH.write_text(text, encoding="utf-8")


def sync_index(active: dict) -> None:
    text = INDEX_PATH.read_text(encoding="utf-8")
    status = active["status"]
    badge = f"{status} · " + ("LIVE PRODUCT" if status in LIVE_STATUSES else "NO LIVE PRODUCT")
    text = re.sub(r'<span class="status">[^<]+</span>', f'<span class="status">{badge}</span>', text, count=1)
    INDEX_PATH.write_text(text, encoding="utf-8")


def validate(active: dict, work: dict) -> None:
    status = active["status"]
    state = STATE_PATH.read_text(encoding="utf-8")
    assert f"`{status}`" in state or f"**{status}**" in state, "PROJECT_STATE status mismatch"
    assert work.get("finalization_state") == "READY_TO_REPORT"
    assert all(item.get("status") in {"DONE", "REJECTED", "BLOCKED_EXTERNAL"} for item in work.get("tasks", []))
    start = START_PATH.read_text(encoding="utf-8")
    readme = README_PATH.read_text(encoding="utf-8")
    agents = AGENTS_PATH.read_text(encoding="utf-8")
    index = INDEX_PATH.read_text(encoding="utf-8")
    for text, name in [(start, "START_HERE"), (readme, "README"), (agents, "AGENTS"), (index, "index")]:
        assert status in text, f"{name} status mismatch"
    assert "The user must never need to repeat the completion directive" in agents
    if not active.get("build_approved"):
        product = ROOT / "product"
        assert not product.exists() or not any(p.is_file() for p in product.rglob("*"))


def main() -> int:
    active = load_active()
    work = load_work()
    write_start(active, work)
    write_readme(active, work)
    sync_agents(active)
    sync_index(active)
    validate(active, work)
    print(json.dumps({"status": active["status"], "work": work["finalization_state"], "synced": True}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
