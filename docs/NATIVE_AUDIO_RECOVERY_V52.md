# Native audio recovery v52

This is new work on recovered PR51 source `fa920db9782b7df42e4e16099a05994e5841dbaa`. The unavailable local v39 commit is not represented as recovered or newly tested. Work began 2026-09-16 08:42:30 UTC. Shared state, artifact receipt and publishing remain owned by the integrator.

The first checkpoint restores the two production runtime files. Their SHA256 values match the remembered final v39 source hashes exactly: audio.js `2a745e5f569b4151043fba976afe988fb13a4f22a2063cff4c39b439787ae961`; file-audio-bank.js `34b7922322bef859ab8a527cfd61123c6527ecf45a00a49c4b76fc98dafbcf85`. This equality identifies source bytes, not fresh test results.

A native live AudioContext uses two rate-specific Offline decoders, preserving harmony/pulse at 44.1 kHz and motif/FX at 22.05 kHz. Offline input receives a copy; rejection falls back to the same original encoded bytes in the live context. There is no application-side interpolation downsample. Three fixed music slots share AudioBuffers with active sources and remain outside the 24 MiB FX FIFO. That cap is not total audio RAM. Pending requests are shared, stale generations cannot start, and disposal marks itself before awaiting native suspension. Cleanup clears source references without claiming immediate native garbage collection.

At this first checkpoint media are still the old assets; source-rate media generation follows in a separate small commit. Thirteen fresh production API tests pass with explicit Web Audio/fetch doubles. The initial run found a test-harness error: passing undefined selected the helper's default Offline class instead of removing it. Using explicit null corrected that fixture; the initial and corrected TAP files are retained. No production source fix was needed in this run.

Actual browser audio, device CPU/RAM peaks, listening quality and PS4 acceptance remain untested. New source-media/build verification will be recorded after generation. The previous run's 318-test result and source sizes are comparison targets only.
