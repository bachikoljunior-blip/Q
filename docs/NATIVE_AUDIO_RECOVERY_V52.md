# Native audio recovery v52

This is new work on recovered PR51 source `fa920db9782b7df42e4e16099a05994e5841dbaa`, following maintenance loss of the previous workspace. The unavailable v39 local commit is not represented as recovered. Shared instructions, the final artifact receipt and publication remain owned by the integrator.

The two recorded stems now preserve 44.1 kHz stereo. The original 48-second composition, note/event grid and internal sustain crossfade times remain identical. Pulse retains the intended `1/sqrt(2)` (−3.0103 dB) compensation for changing the former mono centre-panned buffer to stereo. The synthesized motif remains byte-identical at 22.05 kHz mono; foley, cues and all ten vault audio files also remain unchanged. This unit restores an auditable playback capability; it is not a listening or PS4-quality acceptance.

## Runtime ownership

The live AudioContext uses the device default. Two cached OfflineAudioContext instances decode files at the declared 44,100 or 22,050 Hz. The decoder receives an encoded copy because decodeAudioData may detach input. Constructor or decoder failure falls back to the same original bytes in the live context, without refetch or application-side interpolation downsampling. A cached failing decoder can be retried for another uncached asset; success then remains in its normal buffer bank. Real browser resampling quality and decoder CPU are unmeasured.

Three known score keys retain three AudioBuffers outside the existing 24 MiB reusable FX FIFO. Score voices and the score bank reference the same objects. The bank admits positive duration up to 49 seconds and at most two channels. Score decoding is serial, not all decoding: foley and other effects may overlap. Shared pending loads avoid duplicate decoding; generation and context guards prevent stale starts or stale cache writes. Suspend stops voices and retains phase and buffers; the silent exploration pulse continues to keep musical phase while active.

Disposal marks `disposed=true` before awaiting native suspension, so reentry cannot start another set of voices. Ending a source clears its buffer reference; disposal also clears banks, pending maps, decoder references and convolution impulse. Active FX may retain a buffer after FIFO eviction. JavaScript reference release does not establish immediate native release, garbage collection, or a device-memory peak.

The restored runtime hashes exactly match the remembered prior final source hashes:

- `src/audio.js`: `2a745e5f569b4151043fba976afe988fb13a4f22a2063cff4c39b439787ae961`.
- `src/file-audio-bank.js`: `34b7922322bef859ab8a527cfd61123c6527ecf45a00a49c4b76fc98dafbcf85`.

That equality identifies source bytes. All results below were run anew against this worktree.

## Reproduction and source identity

`python3 scripts/generate-native-score.py` checks the existing 13 CC0 recordings and reuses hash-pinned legacy generator/renderer definitions. The original rounded 22.05 kHz timing grid is doubled at 44.1 kHz, keeping pitched joins, holds, reflections and seam treatment at the same times. Only harmony and pulse are encoded; `--verify` uses temporary files and compares exact output bytes. It never commits reproducible intermediate PCM/WAV or re-downloads recordings.

The fresh MP3s match the remembered final candidate bytes exactly, each 961,326 bytes:

- Harmony: `fa219541b1537f1fa8beb2adc9b3a2c9139e6a8a76be9f2190860b7339b619c3`.
- Pulse: `5d29876c525f67bba1e154736b85230d0c4bb1f85e361ec0bc9ddc34dc164efb`.

`source-before` preserves the original two runtime sources, two changed MP3s, original score provenance and vault provenance with hashes. The ownership comparison reads those frozen files, not a local-only Git commit. It reuses the twelve unchanged current audio files only after old-manifest hash checks. The original legacy generator remains a historical definition source; the native generator is the current regeneration entry.

`verify-soundscape.mjs` checks the actual raw input hashes, CC0 license, SFZ mappings, generator/renderer and baseline provenance chain, event equality, unchanged bytes, file metadata and cue bounds. The integrator explicitly adopted a native soundscape regression budget below 3,000,000 bytes for this 2,941,485-byte candidate; the legacy 1,600,000-byte budget remains for old delivery. These are change-review budgets, not service limits or permanent audio-quality ceilings.

## Costs and evidence boundaries

| Measured encoded/build size | Recovered base | Candidate |
| --- | ---: | ---: |
| Four soundscape files | 1,499,890 B | 2,941,485 B |
| Initial Vite entry | 164,988 B | 165,415 B |
| Same fresh entries, Python gzip level 9 / mtime 0 | 62,484 B | 62,595 B |
| JS chunks | 3 | 3 |
| Public build files | 34 | 34 |
| Public build bytes | 12,593,412 B | 14,035,434 B |

The new same-condition entry comparison is +427 raw bytes and +111 gzip bytes. It is not compared as an improvement against a previous machine's different gzip values. No HTTP transfer timing was measured. All 27 source media match emitted Vite bytes exactly; only the two recorded MP3s differ from the recovered base. The integrator approved 166,000 bytes for the entry regression guard and owns that shared-file adjustment. This author branch intentionally leaves the current 165,000 guard and release receipt untouched; final stage/package/artifact acceptance belongs to the integration unit.

| Logical Float32 file payload | Bytes |
| --- | ---: |
| Legacy three scores at 22.05 kHz | 16,934,400 |
| Source-rate three-score bank | 38,102,400 |
| Eleven current FX/foley/ambient buffers at policy rate | 3,298,464 |
| All fourteen current file buffers at policy rate | 41,400,864 |
| Three scores, native 44.1 kHz fallback | 42,336,000 |
| Three scores, native 48 kHz fallback | 46,080,000 |
| Three scores, native 96 kHz fallback | 92,160,000 |

The production-class ownership oracle counts a shared buffer once. With all current files loaded and source-rate decode, its logical unique payload is 42,495,264 bytes at a 48 kHz output, including procedural noise/impulse, or 43,589,664 at 96 kHz. Native 96 kHz fallback accounts for 108,709,460 bytes in the same finite case. These are API-double reference counts using real encoded-file descriptors, not real device allocations. The 24 MiB FIFO excludes music, active evicted buffers, pending/temporary encoded copies and decoder output/working memory. Native node-acquired copies and GC timing remain unknown.

FFprobe/FFmpeg inspect actual seekable files. All three MP3s decode to 48 seconds; finite samples, sample/4x peak estimates, stereo correlation, high-band energy and mono fold-down are recorded. The seam uses the same ±6 ms windows as internal bar cuts; no threshold is invented to call a loop inaudible. The music-only title/exploration/combat comparisons use complete synchronized stems with actual static gains and motif pan, before compression and without effects/ambience. They do not certify perceived quality or all-runtime headroom.

## Fresh validation and finite checkpoints

The first implementation checkpoint is `57ced28a16709b1515714f0524bfcc5011c71519`: runtime, frozen before files and 13 focused API tests. Its media were still legacy; the second checkpoint adds actual regenerated source-rate media and final validation. The initial focused run found one harness error: passing undefined selected the helper's default Offline class. Explicit null corrected that setup; before/after logs are retained (whitespace in the failure log normalized). No production runtime change was needed after its initial restoration.

Fresh final results: 324/324 tests in 47.017046 s, main runtime 18 scenarios and three negative controls, exact native regeneration, raw/provenance checks, actual FFmpeg signal inspection, five current/before ownership cases with two rejecting semantic mutations, Vite build and 27 source→build media matches. The mutations force every score back to 22.05 kHz or put score into the FX FIFO; both are rejected. Independent review reported twelve fresh production API conditions passed and no required source fix; its author retains the final independently frozen report for integration.

Both native verifiers default to `artifacts/native-audio-recovery-v52` and accept one output-directory argument. Run score first, then audio with the same directory. Routine integration does not overwrite frozen evidence. This author collected final evidence explicitly under `docs/evidence/native-audio-recovery-v52`.

Work began 08:42:30 UTC. The first runtime commit and focused repair were complete by the 08:47:04 clock checkpoint (at most 274 seconds from start). Generation and concurrent build/full-test/native checks were complete by 08:52:09 (another observed 305-second interval, including verifier implementation). These intervals overlap authoring and verification and are not exclusive worker-time sums. The one fixture repair was not separately timed. Final source/hash preservation follows; no fabricated sub-step duration is supplied. No optional v36 research rebuild, browser/server, remote mutation, Site update, actual listening, device performance or PS4 acceptance was performed. The September 20 whole-screen target remains outstanding.
