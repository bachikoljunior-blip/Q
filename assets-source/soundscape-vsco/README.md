# Recorded authoring inputs for Q's sampled score

These are thirteen unmodified WAV recordings from **VSCO 2 Community Edition**, recorded by Sam Gossner and Simon Dalzell; sample cutting by Elan Hickler / Soundemote. Publisher: [Versilian Studios](https://versilian-studios.com/vsco-community/). Original source: [sgossner/VSCO-2-CE](https://github.com/sgossner/VSCO-2-CE).

The publisher releases these recordings under **CC0-1.0**. The complete license is preserved in `LICENSE`. Q's original composition uses the recordings; it does not imply endorsement by the musicians or publisher. The source readme asks for attribution and discourages selling the samples directly. These files are retained as reproducible inputs to the game's composed score.

`manifest.json` records exact upstream paths, bytes, Git blob SHA-1 and SHA256 for every downloaded file. Thirteen WAVs total **28,478,818 bytes**. The raw-WAV tree was `440300901dfe9275fd84e0b7763af1f8443ae62e`; the SFZ mapping tree was `6dd651d55dde97fd4028699be9d4481f26917891`. All thirteen recorded WAV blobs match both source trees. Source URLs are retained for provenance; regeneration uses the committed and hash-verified bytes without a network request.

`CelloEnsSusVib-Quiet.sfz`, `ViolaEnsSusVib-Quiet.sfz` and `TubularBells.sfz` are unmodified official mappings. Use their MIDI `pitch_keycenter`, not filename octave conventions. String regions are selected at velocity60, with at most two semitones of transposition; the selected tubular-bell C4 recording maps to MIDI60 and is played at62 within its60–63 zone.

The recordings have no authored loop markers. `scripts/sampled_score.py` measures steady stereo regions, records their positions and correlation, constructs cosine-crossfaded sustain continuations, and keeps recorded attacks/releases. It narrows the recorded stereo field before placing each section. The exact decisions are in the runtime provenance's `sampledPerformance.performance` object. This is offline sample-based performance, not a newly recorded orchestra or a human performance of Q's complete score.

These inputs are deliberately outside `src` and are not imported into the browser bundle. Only the existing three encoded score stems and unchanged foley atlas are runtime audio assets. Reproduce using `python3 scripts/generate-soundscape.py --verify`, then inspect `python3 scripts/verify-sampled-score.py` and `node scripts/verify-soundscape.mjs`. Dependency versions are recorded in output provenance. Numerical verification is not an auditory review.
