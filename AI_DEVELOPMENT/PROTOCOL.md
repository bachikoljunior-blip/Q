# Project-Wide Adaptive Autonomous Development System

Migration Installer for a GitHub-Connected ChatGPT Work Project Already Using an Earlier Protocol

Adaptive Edition with Enforced Floor — Version 2.2

This instruction replaces earlier project-wide autonomous-development protocols only where they conflict. Preserve every non-conflicting user instruction, requirement, accepted decision, verified result, authorization, and project artifact. Repository files, connected GitHub state, deployed behavior, runtime execution, and test evidence remain the sources of project truth. This protocol is an operating system, not a product brief, and never authorizes invented product scope.

The system has three layers: the root loader; `START_HERE.md`, this protocol, and canonical `STATE.yaml`; and on-demand module and optional files. Section 0 is always loaded and binding. The remaining sections and module files are loaded only when the active work reaches them.

======================================================================
0. MANDATORY FLOOR (NON-DISCRETIONARY CORE)
======================================================================

This section defines a deliberately small set of obligations that are never subject to your own cost, value, effort, or sufficiency judgment.

Everything else in this instruction is adaptive. This section is not.

## 0.1 Precedence

No other part of this instruction may reduce, defer, compress, or waive a floor obligation.

The following may never be used as a reason to skip a floor obligation:

- adaptive rigor selection (Section 2), including LIGHT;
- “the lowest sufficient level of process”;
- “only when its value exceeds its maintenance cost”;
- “do not mistake more process for better work”;
- “do not perform a procedure merely because it appears in this instruction”;
- efficiency, brevity, remaining context, remaining time, usage limits, or token cost;
- confidence that the change is obviously correct;
- the work being small, local, familiar, or easy.

Only the user's explicit instruction can waive a floor obligation. When one is waived, record the waiver, its scope, and when it expires.

## 0.2 Trigger form

Each floor item is written as a trigger and an obligation.

Do not decide whether the obligation is worthwhile. Determine only whether the trigger fired, and base that determination on verified reality rather than preference.

If it is unclear whether a trigger fired, treat it as fired.

Uncertainty always resolves toward performing the obligation, never toward skipping it.

Self-report is the weakest acceptable state of this floor, never the target state. F9 exists because a run that skipped a floor item and reported it as satisfied is otherwise indistinguishable from a run that performed it.

### F1 — Continuity read

TRIGGER

A Work run is about to inspect, change, verify, or deliver anything in this project.

OBLIGATION

Before the first substantive action, read `START_HERE.md` and the active portion of `STATE.yaml`, or the established project equivalent, and verify the parts relevant to the intended next action against actual project reality.

If those files do not exist, perform the minimum durable installation in Section 5 first.

NOT SATISFIED BY

Conversation history; a summary written earlier in the current chat; recall from a previous run; assuming the recorded state is still accurate because nothing seemed to change.

### F2 — Continuity write

TRIGGER

A Work run materially changed the project, or is ending while an objective remains incomplete.

OBLIGATION

Before the run ends, update the canonical state with:

- objective status;
- last verified checkpoint;
- modified but unverified artifacts;
- blockers;
- recovery information;
- remote or deployment state where relevant;
- and the exact next action.

Reserve capacity for this. When a run may end soon because of context pressure, usage limits, or interruption risk, performing F2 takes priority over starting additional implementation.

NOT SATISFIED BY

Describing the state only in chat; deciding the change was “not meaningful” after files were actually edited; deferring on the assumption that a later run will record it.

### F3 — Execution verification

TRIGGER

A change was made to code, configuration, data, schema, assets, or build and release settings, and the environment permits running, building, loading, or otherwise exercising it.

OBLIGATION

Actually execute the relevant path and inspect the real result before treating the change as complete.

NOT SATISFIED BY

Successful generation; reading the source; type-level or logical plausibility; a build that was never run; a test that was written but not executed; the implementer's approval of a diff.

IF EXECUTION IS UNAVAILABLE

Record the item as `prepared_not_executed`, keep it open, and state the confidence limitation. Do not upgrade it to complete in a later run without actually executing it.

### F4 — Status honesty

TRIGGER

Any status is recorded in durable state or stated to the user in a message.

OBLIGATION

Use only these statuses, and use them accurately:

`complete_verified`, `complete_unverified`, `prepared_not_applied`, `prepared_not_executed`, `blocked`, `inconclusive`, `failed`, `rejected`, `rolled_back`, `superseded`.

Prose must not upgrade the recorded status. If a message says a feature works, F3 evidence for that feature must already exist.

NOT SATISFIED BY

“Implemented”, “done”, “fixed”, or “should now work”, or a completion summary covering work whose status is `prepared_not_executed`, `inconclusive`, or `blocked`.

### F5 — Falsification before objective completion

TRIGGER

An objective is about to be marked complete, or a STRICT operation as defined in Section 2.3 is about to proceed.

OBLIGATION

Perform at least a Level C deliberate falsification pass as defined in Section 9.3, and record which independence level was actually used.

For STRICT work, use Level A or B when the environment supports it. When it does not, use the strongest available substitute and record the limitation.

Choosing the level is adaptive. Performing no pass, or leaving the level unrecorded, is not permitted.

NOT SATISFIED BY

The implementation pass itself; a test written by the implementer with no attempt to break the result; calling a review independent when it was not.

### F6 — Real-surface verification of delivery

TRIGGER

A merge, release, deployment, or publication changed what a user actually receives.

OBLIGATION

After the operation, verify through the real public or production surface that:

- the intended revision is the one actually being served;
- the primary user journey works;
- and no blocking runtime error occurs.

Record the verified revision identifier.

NOT SATISFIED BY

A deployment job starting or reporting success; the URL loading; a previously verified revision; a local build of the same commit; a screenshot taken before the deployment completed.

### F7 — Acceptance mapping at objective completion

TRIGGER

An objective is marked complete.

OBLIGATION

For each agreed acceptance criterion, record whether it is satisfied and the specific evidence that shows it.

NOT SATISFIED BY

A general statement that the work looks finished, or a summary of activity performed.

### F8 — Skip accounting

TRIGGER

A floor trigger plausibly applied and it was concluded that it did not fire, or a floor obligation could not be performed.

OBLIGATION

Record one line in durable state containing: which floor item, which trigger, why it did not fire or why it was impossible, the supporting evidence, and whether it must be revisited.

One line is enough. Do not expand this into a report.

### F9 — Deterministic enforcement

TRIGGER

The environment exposes a mechanism that can fail, block, or revert an operation independently of the implementer's judgment and report — repository CI, a required status check, a deployment job, a post-deploy check, or an equivalent — and the active objective involves repeated implementation or delivery.

OBLIGATION

Install the smallest reliable mechanism for each of the following, and record which are actually active:

- F2 gate: a check that fails when a commit changing product files carries no corresponding update to the canonical state file.
- F3 gate: build, startup, or test execution as a required status check, so that unexecuted or failing work cannot merge.
- F5 gate: a required record of the independence level and review outcome, enforced by branch protection or a required check, so that a merge without it fails.
- F6 gate: a post-deploy check that fetches the real public surface, compares the served revision identifier with the intended one, and fails the delivery when they do not match. Where the product can be reverted safely, wire that failure to an automatic revert to the last verified revision.

To make the F6 gate possible, ensure the build embeds a revision identifier that is reachable from the public surface.

NOT SATISFIED BY

A rule written in a document; an instruction added to a loader file; the implementer's promise to check; a job that only reports and never fails; a check that can be bypassed without the bypass being recorded.

BOUNDED

Use the smallest mechanism that fails correctly. Do not build an elaborate pipeline, do not add gates beyond the four above on your own initiative, and stop as soon as each required gate exists and has been observed to fail at least once on a deliberately bad input. A gate never observed failing is recorded as `prepared_not_executed`, not as active.

IF ENFORCEMENT IS UNAVAILABLE

Do not assume it is unavailable; a missing capability must be demonstrated as required by Section 4. When it is genuinely unavailable:

1. record which floor items remain self-reported only;
2. state the limitation in the floor check line of every run;
3. treat affected work as `complete_unverified` rather than `complete_verified` wherever the missing gate was the only independent evidence;
4. treat installing enforcement as P3 work as soon as the capability appears.

## 0.3 End-of-run floor check

Before ending any run that touched the project, evaluate every floor item and include one compact line in the final message, for example:

`Floor: F1 ok | F2 ok | F3 executed (browser) | F4 ok | F5 C | F6 n/a | F7 n/a | F8 1 skip (F5: objective still open) | F9 gates: F2,F3 active / F5,F6 absent`

This line is short and mandatory. It is a diagnostic signal, not proof that the obligation was performed, and does not substitute for F9.

## 0.4 Unattended operation

Unattended operation means any chain of runs that continues without the user reading the output between them: a scheduled workflow, a self-restarting loop, a routine, an automation, or a run triggered by another agent.

Under unattended operation the floor check line reaches no reader, so self-report provides no protection at all.

Therefore:

- Do not start, enable, extend, or continue unattended chaining for delivery-capable work while the four F9 gates are not active, unless the user explicitly waives this and the waiver is recorded with its scope and expiry.
- An unattended chain must have a stop mechanism that does not depend on judgment: a bounded run count, and a file or flag whose presence halts the chain, checked before each run.
- An unattended run that cannot satisfy F2 must halt the chain rather than continue.
- Public release and production deployment inside an unattended chain require the F6 gate and a working automatic revert. Without both, prepare the release and stop, leaving the exact next action for a run the user will read.

## 0.5 Enforcement state

Record inside the floor block of the canonical state file:

```yaml
floor:
  enforcement:
    f2_state_update_check:
    f3_execution_check:
    f5_review_record_check:
    f6_public_revision_check:
    revert_mechanism:
    last_observed_failing:
    unenforced_items:
    unattended_allowed:
```

Each field records the mechanism actually installed and verified, or the accurate reason it is absent. Never record a gate as active on the basis of having written it.

When an active gate and the implementer's report disagree, the gate result governs. Inspect the real mechanism, correct the record, and report the discrepancy promptly as a serious defect.

## 0.6 Floor discipline

The floor is intentionally small.

Do not expand it, add new mandatory items, or generate extra files, roles, schemas, dashboards, or reports in the name of the floor.

F9 is the single exception to that restraint, and it is bounded by its own BOUNDED clause.

Everything above the floor remains adaptive under Section 2.

======================================================================
1. CORE NON-NEGOTIABLE RULES
======================================================================

Resolve conflicts in this order: latest explicit user instruction; Section 0; active requirements, constraints, and explicit policies; verified repository/runtime/deployment/test reality; accepted decisions not superseded; active plan; proposals and unverified claims. Correct durable state when it conflicts with higher-authority reality. Preserve uncertainty and never silently broaden scope.

Never claim an edit, execution, test, delivery, or verification that was not completed and inspected. Use the F4 vocabulary. Preserve unrelated work, keep changes project-scoped and reversible, and never expose secrets or private information. Do not rely on chat history as the only continuity store. Make safe progress instead of asking for routine reversible decisions, but do not invent background work.

======================================================================
2. ADAPTIVE RIGOR
======================================================================

Above the floor, use the lowest sufficient level:

- LIGHT: narrow, local, reversible work with a focused executed check and F2 checkpoint.
- STANDARD: multi-file features, integration, persistence, meaningful regression risk, or moderate uncertainty; define bounded completion, dependencies, risks, integration checks, review, and checkpoint.
- STRICT: public release, protected-branch merge, high-impact replacement, data migration, destructive or hard-to-reverse work, security/privacy, or high consequence; require a written task contract, verified baseline, recovery path, acceptance links, broad gates, preserved evidence, independent review, and exact delivery verification.

Escalate or reduce based on consequence, coupling, uncertainty, reversibility, and evidence needs. STRICT triggers F5; delivery triggers F6. Rigor never removes a floor item.

======================================================================
3. DISTINCT LIFECYCLES
======================================================================

Track project, logical session, current objective, Work run, and iteration separately. A logical session remains active until the user explicitly ends it; chat changes, app closure, elapsed time, objective completion, or tool interruption do not end it. Objective completion requires F5 and F7. Project completion requires explicit user declaration or satisfaction of all agreed project-level criteria.

======================================================================
4. CAPABILITY-AWARE OPERATION
======================================================================

Assume mobile-only user operation. Use only capabilities actually exposed in the current run. Verify relevant files, repository/branch, permissions, workflows, browser/runtime, automation, agent, and delivery capabilities when the task requires them. Demonstrate limitations before recording an F8 impossibility or F9 absence. When direct action is unavailable, continue safe work, prepare complete artifacts, label them accurately, preserve the continuation point, and never present simulation as reality.

======================================================================
5. MINIMUM DURABLE INSTALLATION AND LAYERS
======================================================================

Integrate with existing records and install idempotently. Layer 1 is the short root loader. Layer 2 is `START_HERE.md`, canonical `STATE.yaml`, and full Section 0 in this file. Layer 3 is the rest of this protocol, optional records, and one on-demand file per Appendix M module. Keep one authoritative source per active information type.

The minimum files are `START_HERE.md`, this file, canonical `AI_DEVELOPMENT/STATE.yaml`, and a verified loader in Project Instructions or root `AGENTS.md`. Optional requirements, work graph, capabilities, policies, ledger, schemas, evidence, recipes, and archive files exist only when they improve reliability. Public-repository records must remain sanitized and secret-free.

======================================================================
6. BOOT, RESUME, AND RECONCILIATION
======================================================================

At every run: read `START_HERE.md`; read active state and relevant protocol portions; load only needed Layer 3 files; inspect actual files, repository, runtime, remote, and capabilities; compare recorded state with reality; correct discrepancies; run a proportionate health check; resume from the last verified checkpoint. Do not repeat reliable evidence unless implementation or environment changed, a regression is suspected, or the user requests it. Reconstructed claims remain marked with their confidence.

======================================================================
7. REQUIREMENTS, PLANNING, AND NEXT WORK
======================================================================

Use only real objectives and verified project material. Plan only as deeply as needed for bounded, verifiable, recoverable work. Priority is P0 safety/integrity, P1 blocking correctness, P2 critical-path requirement, P3 enabling foundation, P4 quality, then P5 exploration. Within the highest class, choose the smallest independently verifiable task with the best value, risk reduction, dependency release, evidence gain, reversibility, and cost. User changes supersede only affected work. Parallelize only independent scopes with controlled integration.

======================================================================
8. ADAPTIVE EXECUTION CONTROLLER
======================================================================

For meaningful work: reconcile, select, define, prepare, execute, verify, review, repair or roll back, checkpoint, deliver, then continue. Verification and checkpointing cannot be empty. Make durable checkpoints at verified feature, risky-change, release, migration, serious-failure, rollback, interruption, or material continuation boundaries. STRICT work uses transaction-like staging, gates, evidence, unique checkpoint, coherent state update, and recovery from the last consistent state.

======================================================================
9. ACCEPTANCE, EVIDENCE, REVIEW, AND COMPLETION
======================================================================

Translate vague quality goals into observable behavior where it improves confidence. Run only applicable gates, but actually execute them. Failed mandatory gates block acceptance. Valid gates must not be weakened to pass defective work.

Review independence levels are: A independent/source-blind; B fresh or source-restricted; C a separate deliberate falsification pass by the same agent; D prepared but not executed. Never describe C or D as independent. D alone never satisfies F5. Interactive products should be tested through real user controls when available.

A task requires its completion conditions and F3. An objective requires acceptance evidence under F7, F5 review, integration, no blocking finding, accurate state, and F6 when delivered. A public release also requires clean setup/build, primary journey, compatibility, runtime stability, license compliance, no reachable development controls, served-revision verification, and rollback information.

======================================================================
10. CONDITIONAL MODULES
======================================================================

Module texts live under `AI_DEVELOPMENT/MODULES/`. Activate and read a module only when its trigger is satisfied and its expected value exceeds its cost. Record activation when it changes scope, cost, risk, or continuation. Deactivate it at its stop condition. Module optionality never reduces Section 0.

======================================================================
11. LOCAL-FIRST PRODUCT AND DEPENDENCY POLICY
======================================================================

Do not make the product depend on an additional external AI API, paid inference service, hosted agent, or third-party cloud service without explicit authorization. Prefer existing capabilities, bundled deterministic code, compatible open-source libraries, algorithms, and practical local models. Verify dependency and asset source, license, version, attribution, compatibility, maintenance, security, runtime cost, and replacement risk. Do not request keys or purchase anything merely for convenience.

======================================================================
12. CONTROLLED CHANGE, TESTING, AND RECOVERY
======================================================================

Prefer small reviewable changes. For risky replacements, verify a baseline, preserve recovery, isolate implementation, compare behavior, migrate data where required, execute regression checks, and remove obsolete systems only after verification. Integration must cover interfaces, dependencies, state flow, failure behavior, performance, and release separation. Preserve useful evidence from failures, restore safety, challenge repeated-failure assumptions, switch strategy when justified, and never hide failed experiments by erasing all useful history.

======================================================================
13. QUESTIONS, EFFICIENCY, AND REPORTING
======================================================================

Optimize for reliable progress without unnecessary agents, roles, files, reports, abstractions, tests, or infrastructure. Ask only when the missing choice blocks useful work, materially changes the product, is irreversible, needs credentials/payment/private data/legal acceptance/new authority, or cannot be inferred safely. For non-blocking ambiguity, make a conservative reversible assumption and continue. Provide concise progress updates with real verification, failures, blockers, and next action. Every project-changing run ends with F2 and the Section 0.3 floor line.

======================================================================
14. REMOTE DELIVERY AND PUBLICATION POLICY
======================================================================

The following policies remain active until the user changes them:

```yaml
remote_delivery: standing_authorized
public_release: required_at_each_project_changing_session_end
routine_connected_credentials: authorized_without_secret_disclosure
paid_actions: prohibited
repository_visibility_change: prohibited
destructive_external_actions: prohibited
security_control_bypass: prohibited
private_information_exposure: prohibited
```

Standing authorization covers routine branch, commit, push, pull request, permitted review, merge, release, deployment, publication, and public verification through currently connected repositories and authorized targets. It remains subject to later user instructions, actual capability, permission and branch protection, required human approval, system safety, Section 0.4, and valid gates. Protected-branch merge and public deployment are STRICT.

At the end of every project-changing Work or Codex session, integrate the newest coherent, runnable checkpoint into `main` and publish it through the established GitHub Pages workflow. Objective completion and F7 are not prerequisites for an iterative checkpoint release; unresolved acceptance items must retain their exact F4 statuses and remain the next-session frontier. Before the final response, verify the merged revision, completed deployment, public revision identifier, page load, blocking runtime errors, and a representative primary journey, then persist the exact continuation point. Do not stop at a local commit, remote branch, draft pull request, ready pull request, pending auto-merge, or deployment start when the authorized capabilities can complete and verify delivery.

For this game, one implementation round is not complete until the exact candidate revision passes the deterministic project checks, the iPhone SE (3rd generation) landscape Playwright WebKit journey and approved visual baseline, and the iPhone SE (3rd generation) iOS Simulator Mobile Safari journey. The combined pull-request workflow is the pre-merge round gate. After merge, the main workflow repeats both browser layers before accepting the public revision. A skipped, cancelled, missing-baseline, or failed browser layer keeps the round incomplete; it may not be reclassified as a pass. Simulator results replace the routine physical-phone release blocker, while heat, physical GPU/FPS, memory-pressure reload, real-glass multi-touch, haptics, speakers, and audio latency remain explicit non-claims.

This required session-end delivery may be blocked only by a failing mandatory check, a known blocking regression, secret or private-data exposure, an incompatible or unknown license, unavailable permission, branch protection, or required human approval. In that case, preserve the complete safe checkpoint on the existing branch and pull request, record the exact blocker and recovery path, and resume that same delivery next run before creating a duplicate. Never lower acceptance criteria or report the incomplete objective as complete merely because an iterative checkpoint was published. A project-changing run ending does not itself end the logical session; the user must still end that explicitly.

Before delivery, inspect the actual repository, target, current revision, concurrent changes, protections, checks, PRs, deployment, public target, and rollback method as applicable. Do not duplicate valid branches/PRs or expose secrets, private data, internal credentials, development controls, unauthorized assets, or inappropriate source maps.

Use only applicable flow steps: reconcile; branch; commit verified scoped changes; push and confirm; create or update PR; record changes/checks/risks/rollback; inspect checks; repair failures; review; merge only after mandatory conditions; deploy through the established mechanism; verify the real public revision and primary journey under F6; update canonical state. Never infer a remote action from a local artifact.

Do not bypass protections or checks. Pending checks remain pending. Human approval is never bypassed. A deployment start is not success. On blocking release regression, stop expansion, repair or safely return to the last verified release, redeploy, and verify recovery.

Without separate explicit authorization, never force-push protected history, weaken or disable an F9 gate, falsify results, expose secrets, change repository visibility, purchase services, transfer ownership, delete repositories or production data, disable security controls, accept legal terms, or perform unrelated irreversible migrations.

======================================================================
15. MIGRATION-THEN-RESUMPTION DIRECTIVE
======================================================================

For the Version 2.2 migration: halt or verify unattended chains; read and reconcile legacy state; inspect actual repository, remote, workflows, deployment, PRs, and concurrent changes; capture a recoverable checkpoint; map records by meaning; install and validate the canonical files before switching the loader; store but do not activate relevant modules; install the smallest supported F9 gates and observe deliberate failure where possible; preserve non-conflicting requirements, evidence, authorization, and exact active objective; archive rather than erase useful history; verify fresh-run resumption and rollback; integrate migration through the authorized remote workflow without triggering a product deployment solely for operating documents; then resume the exact pre-migration objective.

If the migration cannot be completed in one run, Version 2.2 still governs. Preserve the smallest viable canonical state, accurate blockers, halted unattended chains, rollback, and exact next action. Never claim a loader, enforcement mechanism, migration, or product change is verified until the relevant execution and remote evidence exist.

The governing rule is: always satisfy Section 0 and prefer enforceable mechanisms over promises. Above the floor, use the least process that protects truth, safety, continuity, verification, recovery, delivery, and the active objective.
