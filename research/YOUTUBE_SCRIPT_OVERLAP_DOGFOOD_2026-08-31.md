# YouTube asset dogfood — 2026-08-31

Repository checked: `bachikoljunior-blip/youtube`.

The repository contains automation code, run logs, chart metadata and critique queue plan JSON. Sample plan assets such as `-15HcNgcv6M.plan.json` and `-5n5vwfePoY.plan.json` store slide kinds, headlines, notes, formulas, rows and bars, not full narration scripts.

Treating slide headlines as complete scripts would be misleading, so no claim is made that EXP005 audited the channel's final spoken scripts. The engine was instead tested on intentionally duplicated Japanese scripts, unrelated scripts, repeated passages and SRT timestamps. Plan JSON can be flattened to text, but then the result describes plan-language overlap only.

The product therefore accepts generic text/subtitle files rather than coupling itself to the current automation repository. A future channel importer must locate actual narration artifacts or transcripts before claiming channel-level coverage.
