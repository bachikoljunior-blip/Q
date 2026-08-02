# Project-local skills

The method — screen, candidate, evaluate, adopt, revert, promote — lives in the
`adaptive-skill-evolution` skill and the commands in `.kit/tools/skill.mjs`. It replaces the
prose bar in `MODULES/M8_VERIFIED_REUSABLE_RECIPE_MEMORY.md`, which asked for the same
discipline without a predicate anything could fail. M8 remains the trigger; this is the check.

```
LEDGER.json            adopted skills: tier, revision, sha256, prior sha256, provenance
candidates/<id>/       CANDIDATE.json · SKILL.md · check.mjs · RESULT.json
history/<name>@<n>/    the bytes each adoption replaced
OVERLAYS/<skill>.md    a project-local addition to a shared skill, read by that skill
```

Nothing is registered here yet. That is the expected state for most rounds: the default answer
is to record the learning where failures are recorded and change no skill.
