# Head registration v65

This unit reconstructs numeric author design from the **saved v1 and selected images**. It does not recover or reproduce the lost `authored-v2` claim. No new mesh, runtime import, remote write or image generation is included.

Run from the repo root:

```sh
python review/head-registration-v65/generate.py
python review/head-registration-v65/verify.py
python review/head-registration-v65/plot.py
```

The generator uses Python standard libraries and Node to read the existing seven bicubic control nets without invoking their mesh builder. The independent verifier additionally uses NumPy for incident-tangent rank. The optional curve projection uses Matplotlib. These outputs are registration evidence, not a gameplay render.

Read `docs/evidence/mira-assembly-v65/head-registration/REPORT.md`, `registration.json`, `external-ports.json` and `verification.json`. The registry has 41 types / 82 instances, 277 canonical curves, 24 roots. Every trim owner references one curve ID. A new construction must consume those references; copying endpoint/control data into independent owner meshes is not this contract.

The 277 curves comprise 171 skin trims, 2 optical seat circles, 8 brow edges, 24 hair spines and 72 hair perimeter curves derived from their canonical spines/sections. Hair taper tips are collapsed boundaries, not degenerate extra curves. The old 154 claim is neither a target count nor a recovered artifact.
