# Recorded instrument performance for the existing48-second cue

Finite unit by `/root/ultra_q_ps4_quality_continuation/combat_vfx_ultra`, from exact base `fb70ddddf8df261851b66b5e29b32ac723818ff1`, in exclusive worktree `Q-score-v27`, branch `feat/ps4-sampled-score-v27-20260916`. The integration owner retains all remote/main/Site writes. This document does not record main or Site publication.

The prior harmony and pulse were entirely synthesized. The new harmony uses actual recorded cello and viola sections; the new pulse combines recorded bass-drum round robins and a quiet recorded tubular bell with a small amount of the original synthesized pulse. It preserves the original composition:48 seconds,80BPM,16bars, four harmonic sections and their20 exact chord notes/onsets. The canonical melodic stem,24-effect foley atlas and cue offsets are **byte-for-byte unchanged**. There are still exactly three synchronized music stems with the same filenames, channels and22.05kHz authored sample rate. No SceneView, gameplay, dialogue, audio lifecycle, input or UI implementation changed.

## Source and performance

The [publisher's VSCO 2 Community Edition page](https://versilian-studios.com/vsco-community/) and [repository license](https://github.com/sgossner/VSCO-2-CE/blob/master/LICENSE) release the selected recordings under CC0-1.0. Thirteen unmodified recordings total28,478,818 bytes: five cello sustains11,885,710B; five viola sustains12,631,972B; two bass-drum hits and one tubular bell3,961,136B. Their exact raw source blobs, SHA256, URLs and official pitch mappings are retained under `assets-source/soundscape-vsco`, with attribution and the license. These authoring files are not browser dependencies.

The renderer detects the recorded attack and release, selects long steady middle portions by comparing the actual stereo waveform, and joins them with220ms cosine crossfades. Selected stereo join correlations range approximately.453–.858. Source position and rate, each chord's chosen sample, MIDI root, placement, dynamics and crossfade times are recorded in `src/assets/soundscape/provenance.json`. A restrained phrase envelope varies bow pressure; captured releases replace a synthetic prolonged decay. Stereo recordings are narrowed and positioned as cello and viola sections without channel inversion or fake delay stereo.

The samples do not provide loop points. The performed continuations are therefore authored from the recordings. They are neither literal14-second raw recordings nor time-stretched single notes. Pitch resampling is bounded to two semitones for strings and the bell's official C4 zone. Circular placement and room tails preserve the48-second musical boundary. A6ms fade at each end of the two changed masters controls MP3 edge-context ringing; it does not change the shared sample clock. The melodic stem retains its original bytes and original boundary treatment.

The original synthetic score routine remains to reproduce the canonical motif and preserve its deterministic RNG consumption before the unchanged foley generator. Unused synthetic harmonic data is replaced offline, and no extra live synthesizer or sampler is added. The sampled output provenance explicitly distinguishes original synthesis from incorporated CC0 recordings.

## Exact comparison and bounded payload

Both music-only review files use the same mode gain targets:0–16s title,16–32s exploration,32–48s combat. These are approximate offline comparisons with centered mono stems and1.5-second linear transitions; runtime uses motif pan.14 and exponential gain ramps. They omit the runtime compressor, ambience and effects, and are not captured gameplay. Their inputs and full report are under `docs/evidence/sampled-score-v27`.

| File | Baseline SHA256 | Candidate SHA256 |
|---|---|---|
| Harmony | `9ad667bf90a66e98402a6753917e2f9ce883497b1f1edbca66c3a88462abb36c` | `d6505642c16b9daebe68addaf41222fff2205c27d107133502fc4e43c9d307d0` |
| Pulse | `c5bbaa8d3d0a45bf2a52a935f7eb90147a19fc8c43ea2d9e3f73d966371b1333` | `5002960fb6e22e53cd1f7e4e689951725f2210ca0d58b7df309ac9eaf362ef13` |
| Motif, foley, cues | Unchanged | Unchanged |

| Decoded signal | Baseline | Candidate |
|---|---:|---:|
| Harmony peak / RMS | .742029 / .136952 | .655303 / .128458 |
| Pulse peak / RMS | .742137 / .099647 | .724009 / .053548 |
| Harmony boundary jump | .017596 | .003691 |
| Pulse boundary jump | .004888 | .000669 |
| Clipped samples | 0 | 0 |
| Frames per score stem | 1,058,400 | 1,058,400 |
| Authored-rate retained decoded audio | 18,587,052B | 18,587,052B |
| Four runtime audio assets | 1,499,890B | 1,499,890B |

The lower sustained pulse energy accompanies transient recorded drum attacks and quiet metal tails; this is not evidence of improved impact or an auditory preference. Both changed loops' decoded boundary jumps remain below their within-track99th-percentile adjacent-sample deltas. Three MP3 stems each decode to exactly48.0seconds. No stereo cancellation or clipping was detected by the stated numerical checks. Existing48/32/32kbps encoding is preserved; the1,600,000B gate was not relaxed.

The focused provenance/decoded-signal script validates13 source hashes, official mappings/license,20 chord notes/onsets, recorded sustain region ordering/correlation, mono behavior, all48-second decoded lengths, baseline identity for motif/foley/cues, complete payload and buffer residency. The existing audio lifecycle and file-audio tests pass6/6. Exact-byte regeneration on the recorded toolchain passes. The Vite build passes with three JS chunks referenced by its current manifest; its exact entry-size/asset-copy check is in the evidence. The build-directory readback retained two unreferenced prior hash files, so this check does not claim a clean physical output directory. Full package/main/Site integration remains the integration owner's work.

The independent Ultra source/signal review found no required asset or runtime-behavior fix in its bounded scope. Its unchanged oracle, full numerical report and reviewer-authored prose are retained as `sampled-score-independent.json`, `verify-sampled-score-independent.py` and `sampled-score-review.md` in the dedicated evidence directory. It verifies actual source Git blobs, original score events, recorded-release boundaries and full-cue music-only headroom with runtime motif pan.14. The conservative mode-transition peak bound is.636979 with StereoPanner and.797473 without it; both exclude the runtime compressor, ambience and SFX. This is not a full-game audio measurement or listening judgment.

## Production measurement and limits

`docs/evidence/sampled-score-v27/timing.json` separates source acquisition, initial media rendering, corrective rendering and exact regeneration verification. Initial13-file acquisition took38.725seconds. Initial render took8.486seconds. A second render after restricting the bell to the official pitch zone and adding mapping fingerprints took13.755seconds; exact regeneration verification took8.787seconds. Investigation and code editing were not individually timed; their dedicated durations remain null. The complete unit wall time includes concurrent download/editing and is not the sum of these process measurements. These local values do not predict whole-game completion time or phone performance.

No available advertised tool supplied genuine auditory inspection of the completed music. The candidate, baseline and isolated input remain **unheard in this run**. Bow continuity, natural instrumental balance, codec artifacts, scene emotion, combat masking, actual Web Audio looping, phone-speaker playback and PS4-level perceived quality remain unverified. No voice/TTS was generated or incorporated. Sample count, waveform checks, build success and a recorded-instrument origin do not constitute perceptual acceptance.

The first finite change addresses the specific absence of recorded timbre without changing the original cue or runtime contract. It leaves broader orchestration, environmental recording, voice acting, scene-specific music and formal listening/device evidence as separate gaps. The fixed2026-09-20 whole-game quality goal is not declared achieved by this unit.
