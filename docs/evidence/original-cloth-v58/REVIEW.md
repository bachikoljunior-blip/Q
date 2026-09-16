# Original woven-wool candidate v58

One authorized built-in image generation succeeded. The image is an original generated material depiction with **no reference image**, not a photograph of a real sample, a scan, calibrated albedo, or a complete PBR material. The original image was viewed directly. No game image, rendered model, screenshot or PS4 comparison was produced.

Exact candidate path: `/workspace/scratch/e72662e3b71f/q-original-cloth-v58/original-wool-basecolor.png`.

- PNG, RGB, **1254 × 1254**, **3,416,517 bytes**; the requested 1024 square was not the delivered dimension.
- SHA-256: `ba1db9154df3a40cbb18cb5e0b0f4cae539efa9937263079a647953d7f9fa260`.
- Built-in `image_gen` call started `2026-09-16T09:41:02.022Z`, took **34.327 seconds**, and returned successfully on the first call. No second generation, CLI/API fallback, external download, denied asset, atlas or alternate service was used.
- The exact submitted prompt is `prompt.txt`. Provider default output was `/workspace/scratch/e72662e3b71f/generated_images/exec-8627cee5-603c-4e79-a136-ba684a25cc69.png`; it remains in place. The candidate copy preserves every byte.

The image looks like a flat, worn woven textile, with fine loose fibres and irregularities within a clearly repeating orthogonal weave. There are no visible garment folds, logos, labels, panel divisions or empty borders. Larger-area brightness is fairly even: encoded luma of the 8×8 block means ranges from 112.04 to 117.99 on a 0–255 code-value scale. However, small dark recesses and light yarn edges remain in the image. These cannot be separated into genuine color and baked micro-lighting from this one generated RGB image. Its color is also slightly warm rather than exact neutral gray: channel means are R118.26/G113.86/B110.49. There is no embedded color profile or physical capture information.

**It is not established as a seamless repeat.** Left/right mean absolute code-value difference is 27.865 against 12.537 for adjacent interior column differences (2.223×). Top/bottom is 28.337 against 12.283 (2.307×). Each edge mean exceeds every measured same-orientation interior cut mean. These are original-pixel discontinuity measurements; they do not establish whether the seam would be visible after UV mapping and mip filtering. No image was tiled, filtered, recolored, resized or repaired to hide this result.

Mean Hann-windowed row/column spectra have their strongest local peaks above eight cycles/image at 83 and 86 cycles/image, or 15.108 and 14.581 pixels per period. **Only if the prompted width of 0.25 m is imposed**, these correspond to approximately 3.012 and 2.907 mm per period. That period is not a measured yarn diameter. The requested 0.5–1 mm yarn width would correspond to 2.508–5.016 pixels at this output size. Thus the desired physical interpretation is unverified, and the conspicuous weave may remain too coarse at the requested mapping. No real cloth was physically calibrated.

The parent reports Mira's garment occupying 25,000–33,000 pixels² in the current actual-dialogue projection. This equals a square of about 158–182 pixels per side, but garment screen area alone does not determine texture derivatives or repeats. Current UV footprint, physical mapping, mip selection, anisotropy, gray-green tint and lit-model appearance were **not evaluated** in this unit. The original candidate has not been applied to runtime or copied into a repository.

Disposition: the authorized generation method is available and produced a inspectable original candidate in one finite attempt. **Do not adopt this unmodified output as a validated tileable cloth material.** Preserve it for a separately authorized material/scale comparison; required remaining checks are seam behavior, intended weave scale, neutral color and baked micro-lighting. No quality improvement, rendered-scene acceptance or deadline achievement is inferred from generation success or these statistics.

`analyze.py` decodes the original PNG and writes numerical `measurements.json` only. It never edits an image. `generation.json` records provenance and exact output copy verification. `HASHES.json` lists the final files. All manual writes are confined to this candidate directory; runtime, worktrees, remote repositories, Sites and other producers were unchanged.
