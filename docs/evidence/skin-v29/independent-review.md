# Independent skin codec review

Compared the original PNG with `candidate-b.webp` and `candidate-g.webp` using untouched full images at `view_image` original detail. The parent narrowed the requested follow-up to b/g; c/d were not reviewed. No encoding parameters were read before the visual judgment. No image was cropped, resized, recolored or otherwise edited.

**Both b and g pass this limited source-image review for subsequent integration. No reliable visual winner was established.**

- The head outline and the same ears, eye contours, lips and scalp features remain at the original atlas positions. No visible crop, rotation, flip or offset.
- Both retain readable scalp stubble. Fine grain is somewhat smoothed relative to the PNG; neither is pixel-identical. No obvious block grid, large mottling or sharp color spill was identified in the inspected head regions.
- Ear folds, dark eye corners, nostril shading and pink lips retain their main structure. The thin bright line at the center of the lips is already in the source; it is not a newly introduced codec defect.
- At this display scale I cannot reliably rank b versus g by head fidelity. The final choice should use the parent's masked error and file-size measurements alongside this visual result.

Read-only decode confirmed that original, b and g are all **2048×2048 RGB**. The original PNG SHA-256 is `862a26e335e958b70534cb5f0d7c47ef30ab148a56c42b3e9da969cf76f12963` (3,693,828 bytes), matching the verified acquisition. Per-file hashes are in `independent-review.json`.

This is a codec comparison of asset files. It does not verify rendered eye appearance, skin tint, UV seam sampling, mipmaps, mobile performance, game-screen quality or PS4 quality. No all-pixel absence-of-artifact claim is made.
