# Fresh recovery audio review — prepared 2026-09-16

Source baseline is the formally recovered PR51 commit `fa920db9782b7df42e4e16099a05994e5841dbaa`. Old local review files and old PASS results are not recovered evidence. Read-only production scope; all new output is in this directory. No remote/Sites/browser/automation edits or new agents.

New runtime candidate must match independently recorded start/end hashes before any result can be final. Authored 44.1 kHz encoded media is a separate checkpoint: a decoder that requests 44.1 kHz while its input remains the old 22.05 kHz file is not recovery of lost source detail.

Required checks:

1. Fresh thirteen original WAV / CC0 license / manifest byte-hash agreement, rates and channels. Verify restored base runtime separately from regenerated candidate MP3 metadata/PCM/hash/provenance; never substitute old remembered hashes for actual bytes.
2. Actual production Soundscape/bank calls with explicit Web Audio doubles: native live context, rate-specific Offline decoders, three fixed score pins, FX FIFO and active voice references. Count unique payloads once and account separately for pending decode/input copies/engine internals.
3. Exact original encoded input survives destructive-detach Offline rejection, then one native fallback without another fetch. Constructor failure is cached; determine actual per-asset retry behavior and concurrent decode count, including score + foley and vault ABA.
4. Synchronized score start/offset, mode gains and motif pan; no score cache/voice duplication after suspend/resume/music toggle. An evicted FX remains available to its active voice, then its source buffer is cleared at completion.
5. Dispose marks teardown before awaiting native suspend; a concurrent start is rejected. Late resume/decode and context replacement cannot revive voices or populate old caches. Pending promise cleanup cannot remove another generation's pending entry. End callbacks are idempotent.
6. Separate native fallback payloads at 44.1/48/96 kHz from normal source-rate payload. FX cap is not total audio memory. Source-buffer null setters obey the selected API contract but cannot prove immediate native garbage collection.

Evidence boundaries: Node doubles inspect production control flow and object ownership only. FFmpeg inspects actual encoded audio/PCM offline; neither constitutes browser Web Audio, listening, device CPU/GPU, memory peak or PS4 acceptance. Author/integrator retains final build/stage/budget decisions. No source correction by reviewer; required defects return to author with reproduction.
