# PR39 merge reconciliation — 2026-09-16

**Recommendation: do not renew the previous retry allowance solely from elapsed time.** Another identical ordinary merge is technically available and is not categorically prohibited by GitHub. However, the already bounded ~03:14 retry also ended in a timeout with UNKNOWN outcome. The new readback supplies no evidence that either earlier operation ended, its lock cleared, or the affected merge path recovered. I cannot classify another call as safety-verified or exactly-once. This is an operational recommendation, not a permissions block; the sole parent writer retains the final decision.

The earlier [local review](../q-pr39-retry-review/retry-review.md) judged one isolated retry reasonable but explicitly ended that allowance on a second timeout/in-progress response. That stop condition has now occurred. Treating each later unchanged read as a fresh allowance would turn the finite action into an indefinite retry loop. The current successful feature GitData writes test a different operation; they do not reconcile the merge worker. Hours of elapsed time do not establish its internal state.

## Fresh observations

During this review, official connector GETs of [PR39](https://api.github.com/repos/bachikoljunior-blip/Q/pulls/39) and [actual main](https://api.github.com/repos/bachikoljunior-blip/Q/git/ref/heads/main) returned:

- open, merged=false, merged_at=null; mergeable=true, mergeable_state=clean; updated_at remains 01:48:48Z.
- head `bfc5d10d8b1042dc6063569a624c115b6c1e7833`; base branch main and actual main `547676fdce8d8e97abed9f065aad0b6e24af2fd6`.
- merge_commit_sha `16fff61d98870b7e8ed1e24df375fe0c9eabda3b`; auto_merge=null. This is still a test-merge value, not proof that main advanced.

Successful required CI is parent-supplied plus the prior preserved audit; this review did not rerun CI or rescan unrelated repository data. The [official status page](https://www.githubstatus.com/) reads operational, which cannot exclude a repository-specific failure. Exact selected responses are in readback.json.

## What the primary contract actually provides

| Route | Documented behavior relevant here |
|---|---|
| Ordinary PUT /pulls/39/merge | sha checks the PR head; 200 success, 405 cannot merge, 409 head mismatch; 202 is not listed. |
| GET /pulls/39/merge | 204 indicates merged, 404 unmerged subject to ordinary access interpretation. |
| Separate PUT /pulls/39/merge-async | 202 accepts background work; duplicate asynchronous work returns its UUID with409; already merged returns200. |
| GET /pulls/39/merge-async/{uuid} | Needs the returned UUID; result is retained24 hours after its last update. |

The ordinary endpoint does not specify an idempotency key, exact-once guarantee, in-progress lock duration, or ordinary already-merged status. Its head check is not a base-SHA check. The test-merge field has a different meaning before actual merge. These asynchronous guarantees cannot be assigned to the ordinary operation. [GitHub pull-request API](https://docs.github.com/en/rest/pulls/pulls#merge-a-pull-request), [async result](https://docs.github.com/en/rest/pulls/pulls#get-the-result-of-an-asynchronous-merge).

GitHub's timeout guidance permits trying later; it does not say the mutation rolled back. The connector's ReadTimeout is not independently proven to be GitHub's documented server-side timeout. [Official timeout guidance](https://docs.github.com/en/rest/using-the-rest-api/troubleshooting-the-rest-api#timeouts). GitHub recommends serialized requests and investigating repeated failures. Conditional PUT requests are unsupported unless an endpoint says otherwise, so a generic If-Match assumption cannot add a missing guarantee. [API best practices](https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api).

## Available tool and bounded alternative

The advertised merge tool accepts repository, PR number, expected_head_sha, merge method and optional title/message. It exposes no operation UUID, idempotency key, expected-base condition, timeout override or async mode. The available fetch tool is GET-only. No UUID was preserved from the original calls, and the documented API offers no UUID-free lookup for that specific asynchronous result. Ordinary PR/main reconciliation remains available. Do not guess a UUID or issue a different async mutation merely to obtain one.

If the parent nevertheless chooses to accept the remaining operational uncertainty, one serialized call can preserve the same authorized intent: first re-read unchanged PR39/head/base/main and required checks, preserve the original merge method and full payload, and make one call with no automatic retry. A success still requires merged/merged_at plus actual-main/merge-parent reconciliation. A timeout, in-progress405, undocumented202 or other ambiguous response returns to read-only reconciliation. This is a risk-bounded option, not a prediction that the stuck worker will recover or a formal guarantee against duplicate processing. Do not change protections, refs, writer, PR, feature base or endpoint to evade the unresolved state.

No mutation, browser/server, outside contact, new agent or repository-source change occurred. Scope was official docs/tool metadata and two PR39-related repository reads; production continues independently.
