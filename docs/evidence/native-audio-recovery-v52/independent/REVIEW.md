# v52 audio recovery — independent bounded review

**No required source correction remains in this reviewed candidate.** Fresh production-call checks passed in 12 recorded conditions, followed by independent inspection of all 14 runtime audio files and final source/raw-asset readback. These are API-contract doubles and FFmpeg media results, not real Web Audio playback, listening, device performance or PS4 acceptance.

The review started 2026-09-16 08:43:14 UTC; final byte readback was 08:54:29 UTC (11m16s). The runtime/media oracle completed at 08:50:37 UTC. Writing and primary-spec verification followed; no new optional probe loop was added. Writes were restricted to this review directory. No source, repository, remote, browser, Site or automation was changed. All reviewer sessions completed.

## Exact candidate

Restored base: `fa920db9782b7df42e4e16099a05994e5841dbaa`. Candidate HEAD observed during final readback: `57ced28a16709b1515714f0524bfcc5011c71519`; the author was still preparing the media/documentation commit, so the following source and media hashes identify the reviewed bytes.

| File | SHA-256 |
|---|---|
| `src/audio.js` | `2a745e5f569b4151043fba976afe988fb13a4f22a2063cff4c39b439787ae961` |
| `src/file-audio-bank.js` | `34b7922322bef859ab8a527cfd61123c6527ecf45a00a49c4b76fc98dafbcf85` |
| harmony MP3 | `fa219541b1537f1fa8beb2adc9b3a2c9139e6a8a76be9f2190860b7339b619c3` |
| pulse MP3 | `5d29876c525f67bba1e154736b85230d0c4bb1f85e361ec0bc9ddc34dc164efb` |

These source hashes match the remembered former candidate, but that equality does not recover its erased tests or evidence. This review rebuilt its own oracle, read the recovered source and reran the checks. No former aggregate PASS count is reused.

## Production control flow and ownership

`runtime-oracle.mjs` bundles the actual candidate `Soundscape` in memory and calls its production methods, with independent stateful API doubles. Real encoded inputs are identified by SHA-256. The doubles transfer/detach decode inputs, defer/reject promises, enforce context connection identity, reject a second non-null source-buffer assignment and model source end/stop cleanup. They do not implement audio rendering or native decoding.

Fresh checks cover source-rate 44,100/22,050 decoders with a native-rate live context; three unique score pins shared with playing voices and excluded from the FX FIFO; equal scheduled stem starts, motif pan, title/exploration/combat gains and retained resume phase; FX eviction while an active source retains its buffer; and idempotent stop/end cleanup that clears source.buffer.

The fault cases cover no Offline API at 44,100/48,000/96,000 Hz; Offline decode rejection after destructive detachment with byte-identical native fallback and no second fetch; constructor failure; suspend/resume during a pending score generation; disposal before a late detached failure; pending native suspend during disposal with start refused immediately; late native resume after disposal; context replacement during decode; and vault ember→tide→ember plus duplicate pending FX.

The known dispose defect was already repaired in the restored candidate: `disposed = true` precedes `await suspend()`. The fresh pending-suspend and late-resume oracles pass with no revived voices/score. This review did not claim to rerun the erased historical negative oracle against the old code.

Only score decoding is serial. The observed initial maximum was two simultaneous decode calls (score plus foley); the finite vault/FX ABA case reached six, with at most one score decode. Offline constructor failure is remembered per rate; successful construction followed by decoding failure is retried for each subsequently uncached asset, including an evicted FX cue. These are retained costs, not hidden claims of a globally serial decoder.

## Actual media and PCM payload

All 13 original CC0 recordings (28,478,818 bytes) and the stored license match the recovered source manifest, including a fresh final hash/readback. The source WAV headers are 44,100 Hz. License hash is `36ffd9dc085d529a7e60e1276d73ae5a030b020313e6c5408593a6ae2af39673`.

Seekable-file FFprobe/FFmpeg inspection confirms harmony and pulse are each 961,326 encoded bytes, 44,100 Hz stereo and 2,116,800 decoded frames (48 seconds). Motif, foley and all ten vault WAVs remain byte-identical to the recovered base. The actual four-file soundscape is 2,941,485 bytes, an increase of 1,441,595 bytes; all 14 runtime media total 3,764,831 bytes. Current provenance agrees with inspected hashes, bytes, rates, channels and decoded duration. This does not independently prove the generator's signal quality or reproducibility; the author owns those gates.

| Retained PCM payload | Bytes | MiB |
|---|---:|---:|
| Source-rate three score buffers | 38,102,400 | 36.337 |
| Other 11 media, if all retained at source rate | 3,298,464 | 3.146 |
| All 14 source-rate media | 41,400,864 | 39.483 |
| Three score buffers, native fallback 44.1 kHz | 42,336,000 | 40.375 |
| Three score buffers, native fallback 48 kHz | 46,080,000 | 43.945 |
| Three score buffers, native fallback 96 kHz | 92,160,000 | 87.891 |

Fallback counts derive from actual media channels/durations and the explicit API double, not an observed native AudioBuffer allocation. The 24 MiB FX FIFO is not a total memory cap: pinned score, active evicted voices, pending decodes, encoded copies, procedural noise, convolution and browser overhead are additional. No heap, RSS, native peak memory, GC timing or device CPU measurement was performed.

The first media fixture used non-seekable stdin and retained MP3 tail padding. Its discarded results are preserved under `nonseekable-fixture-*`. The corrected fixture opens each actual file as a seekable input, checks its hash before/after, and obtains the authored 48-second PCM. `runtime-before-media.*` uses the old recovered media and is explicitly an intermediate API-only checkpoint; the final candidate conclusions use `candidate-media.json` and `final-runtime.json`.

## Native API basis and remaining boundary

The primary Web Audio specification describes decode input detachment and resampling to the decoding context's rate. It permits assigning null to a source buffer after its first non-null assignment. Clearing that JavaScript property is not proof of immediate native-memory reclamation. These contracts were checked against the [W3C decodeAudioData specification](https://www.w3.org/TR/webaudio-1.1/#dom-baseaudiocontext-decodeaudiodata) and [AudioBufferSourceNode buffer setter](https://www.w3.org/TR/webaudio-1.1/#dom-audiobuffersourcenode-buffer) on 2026-09-16. The cited 1.1 publication identifies itself as a Working Draft.

Real browser decoder support, MP3 gapless behavior, resampler sound, audible fades/synchronization, device memory and CPU remain unverified. Official preview has not recovered; no alternate rendering or playback route was used.

The integrator explicitly accepted the initial-JS regression budget of 166,000 bytes and native soundscape payload guard of 3,000,000 bytes (legacy 1,600,000). These are project regression budgets, not service or device limits. No guard was changed by the reviewer. Final build, stage, full regression and packaging verification belong to the author/integrator and are not substituted by this read-only review.

## Reproduction and handoff

Run `inspect-media.py <candidate-root> candidate-media.json`, then `node runtime-oracle.mjs <candidate-root> candidate-media.json final-runtime`. The JavaScript oracle explicitly uses the recovered base's installed esbuild and checks expected candidate source hashes. `finalize.py` performs final source, raw-recording, license, media and provenance agreement checks. Paths are scoped to this recovery workspace and must be deliberately remapped if it moves.

Copy the exact files listed by `HASHES.json`, plus `HASHES.json`, into repository evidence. `summary.json` is the machine-readable final readback; `baseline-inventory.json` and interim outputs retain their original historical timestamps and boundaries.
