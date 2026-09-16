# Regional media in primary Web delivery v35

The actual new-game position (0,101) now waits for the two vault images within 80 m. The first active frame with positive time prefetches the other two within 120 m. A missing or stalled distant image no longer rejects world startup. Existing ready textures remain cached; callbacks retain results and apply dedicated vault materials only on active updates, preserving title/pause/new-game ownership. Original placement, geometry, gameplay, saves, and all media bytes are unchanged.

Startup waits for 34,119 bytes instead of 68,499 vault-image bytes; the other 34,380 bytes are deferred. All four are near the new-game area and eventually load, so this is readiness and failure isolation, not a reduction in total media, GPU textures, or measured HTTP latency. Eight-second startup deadlines, four-second retries, in-flight slots, late disposal and a no-request-storm negative control were tested. Actual title main returns before Scene.update; it retains ready results until resume rather than emitting the same generation notification as a synthetic inactive update.

Base is `337a7e2717d9f130bc6468a45003db2ddddd65db`; author `7edc8b84b83e2e72470020a3d76c3bf91b3fbcd5`; combined runtime `4b2f27e9303c8775171bf8600b59b90085c04274`. Both author and independent reports are retained under `docs/evidence/vault-media-stream-v35`. Subsequent cloth/body/skin research records do not change any production input; the build fingerprint was independently recomputed after those records were added.

All 27 integration commands passed in 123.666685 seconds: 25 required normal commands and the two optional single-file commands. There are 311 passing normal tests and two passing optional generated-runtime tests. Source, real native geometry, explicit Node production boundaries, actual generated artifacts and cache state are verified; no renderer-double result is called a screenshot or browser result.

| Fixed artifact | Measured result |
|---|---|
| Stage | `Q-ps4-v35/artifacts/site-wA36rr` |
| Public output | 34 files, 12,590,981 raw bytes |
| Original media | 27 files, 11,441,662 bytes, unchanged hashes |
| Initial JS | 164,988 bytes |
| Deferred scene JS | 336,585 bytes, +2,191 versus combined v34 |
| Three JS | 579,597 bytes |
| Web receipt | 12,457 bytes; `07e66395ffe16e581ab582c1c5bf17b3b4d802859269af76ed20ad4253e199ed` |
| Optional HTML | 15,503,291 bytes; `534351f4f563d5442d732664c758b12ea19483b44df5087993961eca125b19b5` |
| Source fingerprint | `sha256:f32e8383ed083a9c10f8f73060af2c7eabc05bdf0dde23fbee2b1483991bdfbe` |

The prior normal URL already used multi-file delivery and incurred no standalone restoration CPU. v34 removed only the mandatory single HTML publishing/art constraint; v35 changes actual loading priority. The 16 MiB HTML guard, current initial-JS/chunk regression criteria, unpublished Sites quotas, network transfer and decoded device memory remain separate. No new service, audience, fee or automation was introduced.

The unit also preserves four finite research outcomes without adopting their failed candidates: coarse jute PBR maps were unsuitable for blanket outer-cloak replacement; a rigid whole-body death correction introduced six new foot penetrations; the male skin atlas is UV-compatible but carries beard/hair/shadow features inappropriate for blanket character reuse; one nonsexual technical atlas edit was rejected at output moderation with no image returned and no repeat/fallback generation. Their original assets, source comparisons, rejected candidates and exact outcomes are retained. These records are not player-visible improvements. Joint-specific player support, a distinct officially licensed compatible skin, and audio fidelity are the next owned work.

v34 is preserved by PR49 at remote `c6888d1d0891bb3111968bcadfa73f7b327966aa`, tree `8c1bad23a6b1db4269ff67bfdbb366bd9100b9ad`. The documented Git tree API accepted 53 remaining UTF-8 contents atomically in one call (2,423 ms; 383,602 request characters), retaining the exact expected tree. This reduces sequential preservation operations; no same-workload speedup percentage is claimed. It does not change main or bypass a pull request. [GitHub tree contract](https://docs.github.com/en/rest/git/trees#create-a-tree).

Actual main remains `547676fdce8d8e97abed9f065aad0b6e24af2fd6` and owner-only Site23 remains at source `f11819aceea515d166846e4bf85082bf2e51e9d1`. PR39 remains open/unmerged after unresolved normal merge timeouts; no additional mutation after 03:14Z. The latest official preview status still reports its supervised mailbox unavailable. No alternate server, browser or daemon is used. Q's current prompt and no-COUNT hourly schedule are retained, but it remains disabled under the 20-active-task limit.

The whole-screen PS4 target and September 20 deadline are unchanged. Actual rendered appearance, listening, HTTP/GPU/device/touch measurements and independent reference comparisons remain missing, so neither attainment nor deadline completion is established. The measured delivery alternatives and failed art/pose candidates refine the method; they do not certify visual quality. Continue the next finite production units while ordinary main/Site integration remains separately unresolved.
