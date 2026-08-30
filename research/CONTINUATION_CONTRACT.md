# CONTINUATION CONTRACT

## Purpose

A completed research batch is not the same as completion of the income goal. `NO_ACTIVE_CANDIDATE` means only that the currently reviewed evidence produced no buildable offer.

The repository may enter `READY_TO_REPORT` only when every piece of the current structured discovery queue has an explicit terminal disposition and the review record is cryptographically tied to that exact queue snapshot.

## Current queue and review pair

- Queue: `research/discovery_queue/latest.json`
- Review record: `research/discovery_queue/reviewed_2026-08-30.json`

The continuation check requires all of the following:

1. `queue.item_count == len(queue.items)`.
2. Every queue row has one non-empty, unique `signal_id`.
3. `review.source_file` points to the current queue.
4. `review.source_sha256` equals the SHA-256 of the current queue bytes.
5. `review.source_item_count == review.reviewed_item_count == len(queue.items)`.
6. Every current queue `signal_id` appears exactly once in `review.dispositions`; no old or invented signal may remain.
7. Every disposition is terminal: `REJECTED`, `PROMOTED_RESEARCH_ONLY`, `PROMOTED_OFFER_TEST`, or `BUILD_APPROVED`.
8. A rejected row has a veto and reason. A promoted row must appear in `promoted_signal_ids` and must be represented by `ACTIVE_CANDIDATE.json`.
9. If there are no promoted rows, `ACTIVE_CANDIDATE` remains `NO_ACTIVE_CANDIDATE`, `candidate_id=null`, and `build_approved=false`.
10. Every review evidence file named in `review.review_records` exists.

## Stale evidence rule

A marketplace/App Store scan may replace the queue after a review. When that happens, the SHA or signal set changes and CI must fail. A stale review is an unfinished internal task, not a valid stopping boundary.

The checker does not pretend that GitHub Actions can perform human semantic review. It makes the missing review visible and prevents a false completion claim until a new exact-workflow pass is recorded.

## Project-level boundary

Passing this contract means only:

- the current evidence batch has been completely processed;
- weak/duplicate candidates were not built;
- the repository accurately records whether a candidate exists.

It never means the hand-take-home ¥200,000/month goal has been achieved. That requires a live paid product and actual revenue evidence.
