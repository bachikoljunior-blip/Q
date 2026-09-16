# Independent recorded-score review — v27

Final source read: 2026-09-16T02:45:34.835277Z, Q-score-v27, based on main fb70ddd. No required audio-asset or runtime-behavior defect was found within this bounded source/signal review. This does not establish heard musical quality, natural bowing, perceived looping, real Web Audio playback, phone-speaker performance or PS4-level sound.

The review found two documentation/method limits, now addressed: the runtime source comment still described an entirely synthesized score, and the paired review mix used centered mono/linear transitions rather than exact runtime panning and exponential transitions. The author corrected the comment without changing executable code and labeled the paired mix as an approximation. The independent calculations below use the actual motif pan and the complete 48-second cue for every mode.

## Source and musical contract

The [official publisher](https://versilian-studios.com/vsco-community/) identifies the original WAV edition as CC0; the [publisher repository license](https://github.com/sgossner/VSCO-2-CE/blob/master/LICENSE) and [CC0 deed](https://creativecommons.org/publicdomain/zero/1.0/) support adaptation and redistribution of the selected recordings. This review concerns the selected original WAV/SFZ inputs, not mixed-license third-party derivatives.

All 13 WAV files match their recorded SHA256, Git blob ID and sizes: 28,478,818 authoring bytes. The three local SFZ files independently match the official recorded SFZ-tree blob IDs: cello dac0009b…, viola 56d7c809…, tubular bells 642fa96b…. The license and manifest hashes match provenance. The original WAVs are authoring inputs; the observed distribution manifest emits only the three MP3 stems and foley atlas.

All 20 chord notes retain the original MIDI numbers, section/voice assignment and section*12−1 second starts. Pitch roots come from matching SFZ regions/velocity60, not filename octaves; string transposition stays within two semitones. The existing 36 drum-event times and 24 metallic-accent times are retained. Two bass-drum recordings alternate deterministically. The replacement bell is MIDI62 from the official root60/zone60..63; this is a documented orchestration/tuning change in the pulse, while the canonical melody/motif remains byte-identical.

The motif, foley atlas and 24-cue JSON match actual fb70ddd Git bytes. After removing full-line comments, audio.js, file-audio-bank.js and soundscape-asset-urls.js match that baseline exactly. Score scheduling/phase restoration, gains, filenames, cue offsets, mute/suspend/death/hidden behavior and fallback logic are therefore unchanged by this unit.

## Decode, looping and bow boundaries

All three MP3 streams report 22,050Hz with the required channel count (harmony stereo, others mono). FFmpeg decodes each to exactly 1,058,400 frames / 48 seconds. Runtime encoded payload stays 1,499,890 bytes, below the unchanged 1,600,000-byte gate; authored-rate decoded residency stays 18,587,052 bytes including foley. All decoded samples are finite and below digital clipping; four-times polyphase intersample estimates also remain below 1. That oversampling is an estimate, not a certified true-peak meter.

The comparison uses the same approximately ±6ms window at the 48→0 boundary and each of the 15 internal 3-second bar boundaries. No threshold was chosen to manufacture a listening pass.

| Stem | Loop sample jump | Loop-window largest adjacent change | Internal bar-window largest adjacent change |
|---|---:|---:|---:|
| Harmony | 0.003691 | 0.061389 | 0.109029 |
| Motif | 0.011728 | 0.036536 | 0.092971 |
| Pulse | 0.000669 | 0.009772 | 0.010627 |

The authored 6ms edge treatment makes a short local RMS dip, most apparent in harmony. A small sample jump alone would not prove perceived seamlessness; the full comparable-window measurements are retained in the JSON.

The string holds use authored steady-region loops because the selected source mappings provide no sustain-loop points. Stereo correlation of the selected source crossfades ranges 0.452883–0.858248. Actual generated note-join windows have maximum adjacent change no larger than 0.985955 times their respective internal control maxima. End-of-recorded-release cuts are small: maximum jump0.006667; worst ratio to ordinary per-note adjacent-difference P99 is0.164266. The 14-second buffers include trailing zero padding after the cropped recorded release; this is not 14 seconds of uninterrupted recorded bowing. These figures reveal no isolated boundary spike in this check, but do not certify natural phrasing or absence of audible repetition.

Harmony stereo correlation is0.875978; mono RMS/stereo RMS is about0.968. No substantial overall mono cancellation was observed. Detailed phone-speaker masking remains unheard.

## Full-cue mix headroom and lifecycle

Each mode was evaluated over the entire cue with actual motif pan0.14, mono pulse equal-power panning and unchanged stem gains. Values below are music-only before the compressor, excluding live SFX and ambience.

| Mode | Peak at bus/master1 | Peak at default0.75×0.45 | Default sample headroom |
|---|---:|---:|---:|
| Title | 0.434752 | 0.146729 | 16.67dB |
| Exploration | 0.261872 | 0.088382 | 21.07dB |
| Combat | 0.542518 | 0.183100 | 14.75dB |

A conservative absolute-sum bound using the maximum per-stem gain across modes is0.636979 at bus/master1. The optional runtime branch without StereoPanner is also bounded: constant-mode peak is at most0.694433; its conservative transition bound is0.797473. These are music-only mathematical bounds, not a measurement of the complete game output or compressor.

The existing five soundscape lifecycle tests passed independently (0.63s): gesture start, graph buses/shared score phase, preference/mute, pause during decode, resume failure, bounded fallback, late-request cancellation, loop ABA protection and decoded cache. Those tests expose an explicit Web Audio double; this review separately decodes the actual delivered music bytes.

## Exact files and reproducibility

The reusable oracle is verify-sampled-score-independent.py. Run it with Python, NumPy, SciPy, FFmpeg and FFprobe:

    python verify-sampled-score-independent.py /absolute/Q-repo /absolute/report.json

It writes only its requested report and leaves source/audio unchanged. The final run passed in7.13s, with no audited file changing during the run. All SHA256 values, 13 raw blob checks, note mappings, signal windows, per-note joins and mode measurements are in sampled-score-independent.json.

Principal final hashes:

- sample renderer: 61ab9b6a015dc2da77e65ae8ec152c0b2b2f27464e399ee5bfb3b7ac07110c4b
- generator: d181441e84c06313537575bffaf1cfbf430a8a23ee2023e980bc5543fffe94d3
- runtime audio (comment correction only): a990f34b9d94023e3bb1655c7dbec5d36b484399aa82fd1cdc827e48e7674027
- harmony: d6505642c16b9daebe68addaf41222fff2205c27d107133502fc4e43c9d307d0
- pulse: 5002960fb6e22e53cd1f7e4e689951725f2210ca0d58b7df309ac9eaf362ef13
- provenance: 16e7e5439bb822729b8decfca3e041042d928749aa012b1a4ff540df972d363e

Exact-byte regeneration and final package/Site gates belong to the author/integrator; they were not rerun by this read-only audit. No approval of perceived musical quality or whole-game completion is implied.
