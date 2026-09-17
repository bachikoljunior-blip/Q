# Accessory registration v65

This folder authors numerical contracts only. It creates no mesh and imports no runtime.

Run from the repository root:

```sh
python review/accessory-registration-v65/generate.py
python review/accessory-registration-v65/verify.py
```

Outputs are in `docs/evidence/mira-assembly-v65/accessory-registration/`. All original v64 files remain unchanged. `EXTERNAL_PORTS.json` contains the four sampled clothing interfaces. The main JSON includes per-placement controls, curve direction, UV, native bone weights, rigid right-hand/staff target and explicit unsolved grip acceptance.

The verifier rejects six deliberate faults, checks the saved source hashes, all 90 IDs, shared attributes/junctions, open-boundary endpoint incidence, sole/heel support, heel-seat containment and byte-identical regeneration. It does not prove the not-yet-built surfaces or animation/visual quality.
