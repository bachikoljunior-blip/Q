# PR39 merge blockage — bounded read-only diagnosis

**The newly available evidence does not identify a repository conflict, draft, branch-rule gate or failing head check as the blocker. It also does not establish that the earlier merge operation has completed or released its server-side state. No safe recovery mutation is justified by these reads.**

Review began 2026-09-16 09:20:24 UTC. Seven connector reads were made once each; no polling loop, merge submission, ref update, CI rerun, comment, PR recreation, browser access or remote mutation occurred. The parent remains the sole remote writer. All responses and exact arguments are saved beside this report.

## Fresh observations

| Read | Returned state | Implication and boundary |
|---|---|---|
| PR39, 09:21:12 UTC | open; merged=false; merged_at=null; draft=false; mergeable=true; mergeable_state=clean | The current response reports no merge conflict. It is not an operation-completion or lock-status response. |
| Main branch, same read batch | `547676fdce8d8e97abed9f065aad0b6e24af2fd6` | The actual branch has not incorporated PR39. |
| Main branch protection fields | protected=false; protection.enabled=false; required_status_checks enforcement=off; contexts/checks empty | No branch-protection wait is represented by this endpoint's current data. Project-required CI/normal merge policy still applies. |
| Repository rulesets, includes_parents=true | empty array | No ruleset or merge-queue rule is returned. This is not direct observation of an internal merge worker. |
| Exact PR head checks | Two `game` checks completed/success | Both refer to head `bfc5d10d8b1042dc6063569a624c115b6c1e7833`; neither is pending/failing. |
| Repository configuration | allow_merge_commit=true; allow_rebase_merge=true; allow_squash_merge=true; allow_auto_merge=false; archived=false | A disabled merge method or archived repository does not explain the observed block. No settings were changed. |
| PR timeline request, per_page=100 | Two returned events: committed, cross-reference from PR40 at02:12:23 UTC | No queued/merged event or operation UUID appears in this returned page. Absence is not a worker-status guarantee. |

PR39's head is unchanged at `bfc5d10d8b1042dc6063569a624c115b6c1e7833`; base is main547. Its `merge_commit_sha` is `16fff61d98870b7e8ed1e24df375fe0c9eabda3b`. The PR is still unmerged, so this is a test merge, not delivery to main. `auto_merge` is null; no native `stack` field is present in the returned PR object. A manual feature-base PR chain is not by itself proof of membership in GitHub's newer native-stack feature.

Successful head checks are jobs104634739984 (01:50:24–01:51:57 UTC) and104634384601 (01:48:33–01:50:03 UTC). The separate combined-status tool returned only `statuses: []`; that is why one adaptive check-runs read was necessary. An empty legacy-status list was not misclassified as failed or absent Actions checks.

## What remains unknown

The supplied history records a synchronous merge timeout, then405 “Merge already in progress,” followed by one bounded03:14 UTC retry returning ReadTimeout. That history is not a new error response from this review. No operation UUID or original server request ID was retained/provided. Today's connector returns repository JSON but does not expose transport response headers/request IDs.

The observations are consistent with unresolved merge-service/operation state or a connector/server failure boundary, but they cannot distinguish an active worker from a stale lock, an abandoned operation, or another server implementation failure. Naming a specific root cause would be unsupported. Clean mergeability is insufficient evidence to resend the mutation.

## Formal API distinction

GitHub documents test-merge creation separately from actual merging. The synchronous merge API returns a merge result; it does not document an operation handle. The asynchronous API returns a UUID, and its GET result endpoint requires that UUID. Result retention is24hours after its latest update. An async PUT can enqueue work; its409 reuse behavior concerns an existing asynchronous request and does not establish deduplication of this prior synchronous timeout. [GitHub pull-request REST specification](https://docs.github.com/en/rest/pulls/pulls).

GitHub's native stacked-PR feature has a `stack` object and requires asynchronous merging; that feature is public preview. The current response provides no native stack membership. This does not justify changing the preserved manual stack or bulk-merging it. [GitHub stacked-PR API reference](https://docs.github.com/en/pull-requests/reference/stacked-pull-requests-apis-and-webhooks).

Merge-queue position/state is exposed as GraphQL `PullRequest.mergeQueueEntry`; the current connector has no general GraphQL query or queue-read tool. No queue response was invented from the timeline. [GitHub GraphQL pull-request reference](https://docs.github.com/en/graphql/reference/pulls#pullrequest).

## Available safe next boundary

The connector catalog provides GET-only `mcp__codex_apps__github_fetch` for approved pull-request subresources. If an already-existing, verified asynchronous request UUID is later supplied by the service, its official read-only form is:

```json
{
  "url": "https://api.github.com/repos/bachikoljunior-blip/Q/pulls/39/merge-async/<VERIFIED_EXISTING_UUID>"
}
```

This is a conditional template, not an executable exact argument yet. A GET observes an existing operation and does not submit another merge. It was not called because the required UUID is unavailable; neither a guessed identifier nor the test-merge SHA is a substitute. The inspected official API does not provide a documented list/discovery endpoint for this synchronous operation, and the exposed connector metadata has no worker-status, cancel/reconcile or asynchronous-merge submission tool. A new async PUT to try to obtain a409/UUID would be a potentially new mutation, so it is not a read-only diagnostic or a recommended retry.

Service-side reconciliation/tracing of the original operation, or recovery of a genuine existing request handle, is the missing capability. A concrete diagnostic handoff can identify repository1318331371, PR39, exact head/base above, initial creation01:48:48 UTC, the reported03:14 retry, and the fresh successful checks/rule-free snapshot. There is no authorized exposed tool here to perform that service-side reconciliation. No support contact, new permission or human setup was requested.

Consequently, **the current public read-only paths have narrowed the blocker but have not supplied a safe recovery action**. Preserve the existing PRs and normal main-first delivery sequence. Continue independent quality production while this separate delivery dependency remains unresolved; do not describe further finite source work or test-merge SHAs as published main/Site progress. No retry interval or elapsed-time threshold is asserted to make a duplicate merge safe.

## Exact read calls

All repository reads use `bachikoljunior-blip/Q`; URLs below were passed unchanged to `mcp__codex_apps__github_fetch` except the two named specialized tools.

1. `https://api.github.com/repos/bachikoljunior-blip/Q/pulls/39`
2. `https://api.github.com/repos/bachikoljunior-blip/Q/branches/main`
3. `https://api.github.com/repos/bachikoljunior-blip/Q/rulesets?includes_parents=true`
4. `https://api.github.com/repos/bachikoljunior-blip/Q/issues/39/timeline?per_page=100`
5. `mcp__codex_apps__github_get_commit_combined_status({"commit_sha":"bfc5d10d8b1042dc6063569a624c115b6c1e7833","repo_full_name":"bachikoljunior-blip/Q"})`
6. `mcp__codex_apps__github_get_repo({"repository_full_name":"bachikoljunior-blip/Q"})`
7. `https://api.github.com/repos/bachikoljunior-blip/Q/commits/bfc5d10d8b1042dc6063569a624c115b6c1e7833/check-runs?per_page=100`

No administration-protected endpoint was probed after the catalog explicitly stated the managed installation lacks that access. No alternate hostname/transport was used. The GitHub documentation searches did not query other repositories or services.
