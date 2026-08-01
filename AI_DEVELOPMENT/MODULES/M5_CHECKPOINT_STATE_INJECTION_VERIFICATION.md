# M.5 Checkpoint and state-injection verification

Activate when rare, late, long-running, branching, failure, permission, or environment states would otherwise require expensive full replay.

Possible mechanisms include fixtures, save states, snapshots, progress setters, virtual time, deterministic random seeds, simulated failures, offline modes, network conditions, object spawning, and controlled environment states.

Test-only state controls must be isolated from production, deterministic, documented where needed, protected from unauthorized access, and unreachable in release behavior.

Verify important paths through representative normal flow as well as injection.

Do not use injection to conceal broken initialization, progression, transitions, or save and load behavior.
