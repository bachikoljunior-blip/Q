# Independent v33 standalone encoding review

Completed 2026-09-16T05:15:46.416Z. Reviewer: `/root/ultra_q_ps4_quality_continuation/forest_fidelity_ultra`, existing Ultra role, no new spawn. Bounded read-only review of `Q-standalone-encoding-v33`, base `892f7e59f602e20da62bf1c8708e432ce1eac637`. Writes only under `q-v33-standalone-review`; no repository edits, remote, Sites, browser, server or rendering. Final source hashes were unchanged across the final oracle run.

**PASS for the bounded lossless packaging/source unit; no required source repairs remain.** This is not a PS4, browser, actual rendering, physical device, listening or end-to-end successful gameplay acceptance. The September 20 whole-screen target remains unproven.

## Exact deliverable and budget

- Original same-base Git release: 16,331,434 B, SHA256 `8f659340f1eecf5984287486c8f94d00de384ff6b677625e0c03716958e8945e`. Independently matched the actual Q-ps4-v31 release file to that Git blob.
- Final generated candidate: 15,393,094 B, SHA256 `df465ffa7b282d9f014c63b2ef5dea6b995be6cd6fc73cae33be15fe74f77737`.
- Saving: 938,340 B (5.7456%); remaining space under the **unchanged** 16,777,216 B gate: 1,384,122 B.
- Native Vite entry: 164,493 B under unchanged 165,000 B; exactly three JS chunks. Decoder is standalone-only; `src` has no difference from the fixed base.
- Fixed stage: `artifacts/site-ZY6H63`. Independent source identity `sha256:28733d6d841a8986c78da99eb6d7b587897f12113264d22699d9a12888baf1cc` was reconstructed from the complete sorted input path/length/bytes and matched candidate, Vite entry and fixed-stage entry.
- Shared decoder emitted once: one Int16Array digit table and one header-validation implementation; author metafile attribution is 1,244 minified B. No new texture/geometry or media codec output.

## Independent byte and format proof

`oracle.mjs` independently reads all 27 actual manifest media files and compares source → Vite emitted file → fixed-stage file → original baseline HTML → final candidate HTML. Each source occurs exactly once and every byte and MIME matches. The 26 JS q85 representations were decoded with a separate BigInt radix oracle, then compared to both source bytes and the real helper's returned complete base64 data URL. CSS poster remains the original one base64 media reference; the entire emitted CSS is exactly equal to baseline. No font or external URL was introduced. Existing encoded SVG favicon and inline legal comments remain in the original packaging path.

During **unmodified actual emitted IIFE execution**, a Uint8Array constructor observer retained the real filled decoder output buffers. All 26 were hashed after execution and matched complete native source hashes; identity was not guessed from equal-length audio payloads. Media consumed by actual image/HDR/video URL setters also matched original hashes and only used data URLs. `media-metadata.json` records original PNG/JPEG/WebP dimensions/modes, HDR resolution header, and ffprobe native audio/video stream metadata for all 27 exactly matching files. No image editing, codec conversion or resource generation occurred in this review.

Malformed header/leading-zero/unsafe size, invalid ASCII/non-ASCII digit, truncation, excess payload, 32-bit overflow and all three noncanonical padding cases reject in both unpack/restore APIs. Independent vectors cover 0–5, 65,535/65,536/65,537 bytes and all actual large media (largest 3,178,191 B MP4). The alphabet excludes quote, apostrophe, backslash, backtick, whitespace and both angle brackets; no packed byte can form an HTML opening/closing marker or string terminator. Actual HTML has exactly one opening/closing script and no unescaped script closing marker inside it. Original script-terminator escaping remains. The browser helper source has no added eval, Function, blob, fetch or platform base64/compression API; Node path handling remains build-time. The final plugin uses public `fileURLToPath` for portable native helper resolution.

Existing provenance, source hashes, archived-source exclusion, legal-comment, three-chunk, first-entry and 16 MiB assertions were not weakened. The artifact verifier gained a complete inventory/uniqueness check before the existing per-family checks. Although its decoder is shared with production, this review independently validates arithmetic and actual output buffers rather than trusting that verifier alone.

## Actual output lifecycle boundary

Both original and candidate actual scripts were run unchanged in the same authorized Node DOM/device fixture. It supplies semantic elements, explicit timer callbacks and event dispatch, a title video play/pause/source recorder, no 2D decoration context, explicit image/HDR decode rejection and no AudioContext or WebGL implementation. It is not a browser substitute.

The two final paired runs agree on initial title state, delayed title video attachment, source-byte identity, hidden-page pause/source release request, visible-page reattachment/resume, start → expected unavailable-decoder boot failure, enabled retry controls, second start → same bounded failure, and settings/open/close. All compared public Game state fields agree. The 19 title-phase original-media representations restore during module initialization; seven world photo/HDR/forest/skin representations restore only on launch. Retrying does **zero additional q85 restoration** because the already evaluated module exports stay cached. Actual consumer URL request order and phases agree between baseline and candidate. Existing vault/audio module eager imports are not newly moved to title by this unit.

Successful SceneView construction, actual image/audio/video decode, rendered world restart, successful gameplay-to-title-to-newgame, physical video-resource reclamation and native DOM/event ordering cannot be established by this actual-output fixture. Those remain outside this result; unchanged runtime source and the author's existing main-runtime tests are separate source/application-boundary evidence, not proof of successful rendered standalone restart.

## CPU and memory tradeoff

Final independent paired measurements below include VM parsing, the explicit fixture and request hashing. They are host wall times, not browser first paint or device loading. Launch columns include **two failed launch attempts (initial plus retry)**, unlike the author's single-launch measurements.

| Pair | Baseline title ms | Candidate title ms | Baseline launch+retry ms | Candidate launch+retry ms |
| --- | ---: | ---: | ---: | ---: |
| 1 | 83.540 | 364.060 | 100.352 | 285.609 |
| 2 | 28.657 | 344.459 | 66.326 | 292.693 |

The added decode work is material: final title differences are about 281/316 ms; launch+retry differences about 185/226 ms. Earlier paired readback showed the same direction (details in preliminary-report.json). No speed gain is claimed. The 938,340 B recovered represent useful future exact-media delivery headroom; they do not justify silently adding assets or assuming acceptable low-device startup latency. Integration may adopt this bounded byte-preserving storage change with the explicit CPU cost; device performance acceptance remains pending on a permitted official path.

19 title restorations process 5,569,926 native bytes, 6,962,430 packed payload characters and 7,426,592 restored base64 characters. Seven launch restorations process 5,708,774 bytes, 7,135,980 packed characters and 7,611,708 base64 characters. Per asset the helper allocates a Uint8Array, chunks of generated base64 and the joined data URL. Largest raw buffer is the 3,178,191 B MP4; its base64 content is 4,237,588 characters. These are logical work/representation counts, not summed simultaneous peak-memory measurements.

V8 heap snapshots are preserved at start and phase boundaries in `report.json`. They are affected by garbage collection, sequential run order, retained VM state, HTML strings, instrumentation and this oracle's intentionally retained output buffers; they cannot be read as isolated candidate resident overhead. Uint8Array backing storage also is not accounted for by `used_heap_size` alone. Owner reported OS RSS observation unavailable (`uv_resident_set_memory` ENOENT); this review did not bypass that absence. Actual process RSS, browser/GPU/decoder memory, device peaks and reclaimed literal lifetimes are unknown. GPU texture/audio allocation is not reduced by changing the textual representation of unchanged original compressed files.

## Review corrections and evidence

No runtime defect was found. An intermediate source fingerprint mismatch after the author's packaging refactor was reported immediately; final build/package/stage regeneration fixed it and the independent final identity assertion passed. The oracle's first comparison used cross-VM prototype-sensitive deep equality and failed on otherwise equal state objects; JSON normalization corrected only the reviewer comparison, after which both final pairs passed. `preliminary-*` preserve the earlier candidate results separately from final hashes.

Copy unchanged: `oracle.mjs`, `report.json`, `run.txt`, `media-metadata.json`, `preliminary-report.json`, `preliminary-run.txt`, this `REVIEW.md`, and `HASHES.json`. Reproduce from the original scratch workspace with `node q-v33-standalone-review/oracle.mjs`; dependencies and fixed base Git blob must remain available. No additional optional probes are required for this finite review.
