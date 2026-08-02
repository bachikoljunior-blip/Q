# Q project boot

Protocol: Adaptive Autonomous Development System 2.2.

Canonical files:

- Rules and full mandatory floor: `AI_DEVELOPMENT/PROTOCOL.md`
- Active continuation state: `AI_DEVELOPMENT/STATE.yaml`
- Active requirements and acceptance: `AI_DEVELOPMENT/REQUIREMENTS.yaml`
- Active concept, element references, criteria, and quality gaps: `AI_DEVELOPMENT/REFERENCE_BENCHMARKS.yaml`
- Dependency plan: `AI_DEVELOPMENT/WORK_GRAPH.yaml`
- Optional procedures: `AI_DEVELOPMENT/MODULES/` (load only when triggered)

Authority: latest explicit user instruction → mandatory floor → active user requirements and policies → verified repository/runtime/deployment/test reality → accepted decisions → work graph → proposals and assumptions.

Mandatory floor, by trigger:

- F1 before project work: read this file and active state, then verify relevant records against reality.
- F2 after material change or before an incomplete-objective run ends: update objective, verified checkpoint, unverified artifacts, blockers, recovery, remote state, and exact next action.
- F3 after executable changes: actually execute the relevant path; otherwise record `prepared_not_executed`.
- F4 whenever stating status: use only the protocol’s exact status vocabulary and never upgrade evidence in prose.
- F5 before objective completion or STRICT operation: perform and record at least a Level C falsification pass; prefer A/B for STRICT.
- F6 after user-visible delivery: verify the served revision, primary journey, and blocking runtime errors on the real surface.
- F7 at objective completion: map every acceptance criterion to specific evidence.
- F8 when a floor trigger is skipped or impossible: record one evidence-backed line and whether to revisit.
- F9 during repeated implementation/delivery when independent gates are possible: enforce F2/F3/F5/F6 with the smallest failing mechanisms and observe deliberate failure before calling a gate active.

Enforcement summary: F2/F3/F5 checks are installed and passed one remote PR run, but required-check protection is unavailable through the current tools; real-surface F6 and automatic revert remain absent until a revision-enabled product release; unattended delivery is not allowed.

Round completion: every implementation round must pass deterministic checks, iPhone SE 3 landscape WebKit with the approved baseline, and iPhone SE 3 iOS Simulator Mobile Safari on the same pull-request revision. Main repeats both browser layers before the public revision is accepted. Missing, skipped, cancelled, or failed layers mean the round is incomplete.

Session-end delivery: every project-changing Work or Codex session must update `AI_DEVELOPMENT/STATE.yaml`, execute applicable checks, merge the newest runnable checkpoint into `main`, publish it through GitHub Pages, verify the served revision and primary journey under F6, and record the exact next action. Objective incompleteness alone does not defer delivery; retain all failed or unverified acceptance gaps. Delivery may stop only for a mandatory-check failure, blocking regression, safety or licensing problem, missing permission, branch protection, or required human approval, and that exception must remain as an exact remote checkpoint and resumption record. A run ending does not end the logical session; only the user's explicit declaration does.

Resume: inspect `AI_DEVELOPMENT/STATE.yaml`, compare its branch/SHA/PR/deployment and modified-artifact records with Git/GitHub and runtime reality, correct discrepancies, then perform `execution.exact_next_action`. End every project-changing run with the compact floor line from Section 0.3.
