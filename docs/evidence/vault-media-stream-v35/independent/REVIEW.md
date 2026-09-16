# v35 regional image loading — independent review

No required runtime fix remains within this bounded review. The changed loader, regional material ownership and actual Scene/main connection satisfy the checked contracts. One documentation claim was corrected: the real title handler does not call `SceneView.update`, so it does not immediately advance the vault generation. It may retain a completed `readyTextures` result while on the title screen; material installation waits for the next active frame. The author corrected this distinction without changing runtime source.

Review began 2026-09-16 06:20:35 UTC; evidence closed at 06:28:00 UTC. Reviewed worktree: `/workspace/scratch/e72662e3b71f/Q-region-stream-v35`, base `cd5ca9794da31e21cf639e7da4d226007b3fbe56`, observed author checkpoint `b03d22a8ca06a9565f7926dbf3068f704ad6bae1`. Final source hashes are captured in `integration.json` and `cache.json`. The author may append these evidence files and the documentation correction to a later commit; this source identity does not assert that later commit was already read.

## Independent execution

`integration.mjs` runs the real bundled main entrypoint and its real Game/lifecycle code, routes its scene dependency to the actual async SceneView factory, constructs native Three geometry/materials, and connects the actual vault cache. Image promises/timers, other asset loaders, DOM, sound and WebGLRenderer are explicit doubles. The renderer only runs native matrix updates. There is no browser, real image decode, shader compilation, GPU draw, screenshot or device-performance observation.

- New game at (0,101) requests ember/tide, and constructs no Scene until those two resolve. The two remaining maps are requested on the first positive-dt active frame. The initial RAF's dt is zero, so it is not classified as an active streaming frame.
- The actual pause→to-title handler was invoked before another frame, then the pending far images were resolved. During three title frames, render calls and material changes remain zero. The generation remains unchanged, and all four ready maps are held. Actual continue applies them in an active frame without more requests.
- A subsequent actual new-game confirmation reuses the same Scene instance and all four maps: one constructor, four total requests. Pause with an actual paused frame sends inactive state. Application error collection remains empty.
- Four regional materials remain distinct from cached world stone. A later global photograph/normal installation cannot replace their region maps. Their actual standard-material `onBeforeCompile` hooks do not bind the unrelated global rock normal. Runtime byte metadata is 128×128×4 per loaded base image; this is metadata, not physical GPU residency.
- Explicit `disposeTextureStreaming()` stops later installation/request work. It is an independently exercised dedicated API, **not a disposal call made by the current main program**. The application intentionally retains one Scene and its four-theme cache across title/restart. Explicit cache disposal disposes the four ready texture objects once and leaves no controlled timers.

`cache.mjs` independently exercises the actual cache with controlled logical time and native DataTextures:

- A partially completed startup stays pending at 7,999 ms and resolves at 8,000 ms, retaining the successful nearby map.
- Thirty subsequent load calls after the timeout still produce only two original Image requests while one is hung. Its late valid image is disposed. Once it settles, a permitted retry is issued.
- Cache disposal releases startup/retry waiters. Successful, timed-out and post-disposal images are each disposed exactly once in the measured sequence; timers return to zero.
- A rejected request cannot retry at 3,999 ms and can retry at 4,000 ms. A 256×128 image is rejected/disposed; a later correct image is cached. One hundred additional ready loads add no requests.
- A source negative control removes only `if (entry.busy) return Promise.resolve(null)`. The same timeout oracle detects an unwanted third request (`3 !== 2`). This demonstrates sensitivity to the uncancellable-Image protection.

Both scripts accept an absolute repository argument and optional JSON output path. They write only to the review scratch directory by default. `integration.json` and `cache.json` are the actual successful outputs; `HASHES.json` fixes these artifacts and their scripts.

## Source review and limits

The old fixture uses one `Promise.all` for all four images and clears its global pending promise on any rejection. The candidate selects themes from the actual Game player position, independently caches failures/successes, and limits requests to the four fixed themes. The author's saved-direct-region serialize/restore selection tests and old-loader factory comparison were inspected; they are author evidence, not an additional independent rendered playthrough. The new startup byte sum is 34,119 B versus the old 68,499 B. At the new-game position, the 120 m active prefetch includes all four regions, so eventual media bytes are unchanged. No large total-transfer or measured startup-speed improvement is claimed.

Source review confirms geometry is not removed by these radii. The author's separate native geometry comparison reports unchanged 400 meshes / 80,592 triangles and exact attribute/index/world hashes; this review did not repeat that full geometry comparison. All 27 emitted assets remain 11,441,662 B in the author's byte report, with initial JS164,988 B / three chunks and a deferred JS increase of2,195 B. These are inspected file/structural measurements, not device memory or frame time.

The dedicated cache and streaming disposal methods do not add an overall Scene/GPU teardown lifecycle. Title does not abort browser Image operations, and a forever-hung uncancellable request retains its one slot; retry cannot proceed until that operation settles. This is the explicit bounded-request tradeoff, not an assertion of physical request cancellation or memory recovery. Death can continue positive-dt scene updates in the existing main loop; the streaming condition is playing/positive-dt, not a separate death prohibition.

Material transition appearance, actual HTTP/cache/Range behavior, browser decoding, memory residency, device timing and whole-screen PS4 realism remain unverified. The fixed September20 target is unchanged. No repository source, remote, Site, browser or server was modified by this review; no optional follow-on work is implied by its completion.
