#!/usr/bin/env python3
"""Fail CI when the current work cycle is unfinished or closed work can revive itself."""
from __future__ import annotations

import json
import sys
from pathlib import Path

from check_continuation_contract import ContinuationContractError, validate as validate_continuation

ROOT = Path(__file__).resolve().parents[1]
CONTRACT = ROOT / "execution" / "CURRENT_WORK.json"
ACTIVE = ROOT / "research" / "ACTIVE_CANDIDATE.json"
ALLOWED_TERMINAL = {"DONE", "REJECTED", "BLOCKED_EXTERNAL"}


def fail(message: str) -> None:
    print(f"EXECUTION CONTRACT FAILED: {message}", file=sys.stderr)
    raise SystemExit(1)


def git_add_blocks(text: str) -> list[str]:
    """Return shell git-add commands, including backslash-continued lines."""
    lines = text.splitlines()
    blocks: list[str] = []
    index = 0
    while index < len(lines):
        line = lines[index]
        if not line.strip().startswith("git add"):
            index += 1
            continue
        block = line
        while block.rstrip().endswith("\\") and index + 1 < len(lines):
            index += 1
            block += "\n" + lines[index]
        blocks.append(block)
        index += 1
    return blocks


if not CONTRACT.is_file():
    fail("execution/CURRENT_WORK.json is missing")
if not ACTIVE.is_file():
    fail("research/ACTIVE_CANDIDATE.json is missing")

contract = json.loads(CONTRACT.read_text(encoding="utf-8"))
active = json.loads(ACTIVE.read_text(encoding="utf-8"))

if contract.get("finalization_state") != "READY_TO_REPORT":
    fail("finalization_state must be READY_TO_REPORT before a user-facing completion report")

tasks = contract.get("tasks")
if not isinstance(tasks, list) or not tasks:
    fail("tasks must be a non-empty array")
for index, task in enumerate(tasks, 1):
    if not isinstance(task, dict):
        fail(f"tasks[{index}] must be an object")
    status = task.get("status")
    if status not in ALLOWED_TERMINAL:
        fail(f"tasks[{index}] is not terminal: {status!r}")
    if not task.get("id") or not task.get("evidence"):
        fail(f"tasks[{index}] requires id and evidence")

try:
    continuation = validate_continuation(ROOT, emit=False)
except (ContinuationContractError, OSError, ValueError) as exc:
    fail(f"continuation review is stale or incomplete: {exc}")

if active.get("build_approved") is not False:
    fail("this completed cycle must keep build_approved=false")
if active.get("status") != "NO_ACTIVE_CANDIDATE":
    fail("this completed cycle must end at NO_ACTIVE_CANDIDATE")
if active.get("candidate_id") is not None:
    fail("NO_ACTIVE_CANDIDATE must not retain a candidate_id")

product = ROOT / "product"
product_files = [] if not product.exists() else [p for p in product.rglob("*") if p.is_file()]
if product_files:
    fail("closed/unapproved product files remain: " + ", ".join(str(p.relative_to(ROOT)) for p in product_files))

forbidden_paths = [
    ".github/workflows/approve-jira-guard.yml",
    ".github/workflows/build-jira-guard.yml",
    ".github/workflows/finalize-jira-guard-state.yml",
    ".github/workflows/indexnow-jira-guard.yml",
    ".github/workflows/jira-guard-metrics.yml",
    ".github/workflows/normalize-jag-tracking.yml",
    ".github/workflows/record-jag-hardening.yml",
    ".github/workflows/sync-research-candidate.yml",
    ".github/workflows/exact-match-queue.yml",
    ".github/workflows/candidate-deep-dive.yml",
    ".github/workflows/marketplace-scan.yml",
    ".github/workflows/export_research_evidence.yml",
    "research/tools/approve_jira_automation_guard.py",
    "research/tools/sync_active_research.py",
    "research/tools/exact_match_queue.py",
    "research/tools/deep_dive_candidate.py",
    "research/tools/marketplace_signal_scan.py",
    "scripts/collect_jira_guard_metrics.py",
    "scripts/normalize_jag_tracking.py",
    "scripts/publish_jira_automation_guard.py",
    "scripts/record_jag_release_hardening.py",
    "scripts/update_jira_guard_state.py",
    "scripts/snapshot_metrics.py",
    "tests/jira-automation-guard.smoke.js",
    "tests/jira-guard-metrics.smoke.py",
    "7f3a9d2c8e6b4a18b75d9f0c2e1a6b44.txt",
]
remaining = [path for path in forbidden_paths if (ROOT / path).exists()]
if remaining:
    fail("closed, temporary, or conflicting automation remains: " + ", ".join(remaining))

workflow_dir = ROOT / ".github" / "workflows"
writers: list[str] = []
for workflow in sorted(workflow_dir.glob("*.yml")):
    text = workflow.read_text(encoding="utf-8")
    if any("research/marketplace_scan/" in block for block in git_add_blocks(text)):
        writers.append(workflow.name)
if writers != ["marketplace_scan.yml"]:
    fail(f"research/marketplace_scan must have one canonical writer; found {writers}")

canonical = workflow_dir / "marketplace_scan.yml"
canonical_text = canonical.read_text(encoding="utf-8")
if "Canonical writer for research/marketplace_scan" not in canonical_text:
    fail("canonical marketplace writer marker is missing")

agents = (ROOT / "AGENTS.md").read_text(encoding="utf-8")
required_contract_phrases = [
    "## Completion-before-response invariant",
    "A final answer is forbidden while a safe material action remains",
    "The user must never need to repeat the completion directive",
]
for phrase in required_contract_phrases:
    if phrase not in agents:
        fail(f"AGENTS.md missing execution invariant: {phrase}")

for required in [
    "research/BATCH_VETO_2026-08-30.md",
    "research/EXACT_WORKFLOW_REDUCTION_2026-08-30.md",
    "research/WORDPRESS_EXACT_WORKFLOW_REDUCTION_2026-08-30.md",
    "research/CONTINUATION_CONTRACT.md",
    "research/discovery_queue/reviewed_2026-08-30.json",
    "execution/2026-08-30-completion-first-hardening.md",
    "scripts/check_continuation_contract.py",
    "tests/research-tools.smoke.py",
]:
    if not (ROOT / required).is_file():
        fail(f"required completion evidence is missing: {required}")

print(json.dumps({
    "cycle_id": contract.get("cycle_id"),
    "terminal_tasks": len(tasks),
    "reviewed_queue_rows": continuation["reviewed_rows"],
    "wordpress_rows": continuation["wordpress_rows"],
    "app_store_rows": continuation["app_store_rows"],
    "marketplace_writers": writers,
    "product_files": 0,
    "result": "PASS",
}, ensure_ascii=False))
