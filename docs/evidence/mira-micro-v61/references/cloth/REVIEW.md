# First three cloth micro-parts — generated reference, author inspection

One sheet was generated with the official built-in `image_gen` using four actually viewed canonical reference images. One targeted edit followed, within the authorized one-edit limit. Both raw PNGs are copied byte-for-byte from the generated outputs; neither was resized, retouched, recoloured, cropped or converted by another tool. `generatedImage(result)` displayed each returned image. Source/3D/remote/Site changes: **0**. Known pending tool sessions: **0**.

The result is a candidate **shape reference**, not a model, CAD drawing, texture atlas, game screenshot, blind comparison or PS4-quality result. No actual 3D micro-part has been built from it. The large candidate in commit `3afcb955…` remains separately preserved with contact failures.

## Selected parts and what can be specified

| ID | Authored interpretation | What the image shows | Still requires the assembly ledger |
|---|---|---|---|
| T01-R | One shallow four-sided front-centre torso loft | Outside/front, narrow bowed profile, inner/back, oblique view; inset places it between cowl and belt on wearer's right | Exact four boundary curves, bow depth, corner IDs and edge weights; the pictured depth is not a measured 18mm |
| S05-R | One open, tapered front half-shell of forearm sleeve | One curved wool surface with open inner side; v2 inset now marks wool above the leather cuff on the wearer's right forearm | Exact upper/lower cuts and longitudinal bend; 190mm height in the draft ledger is an intent, not proven by the new image. Must reconcile with cuff/elbow join before geometry |
| P01-R | One narrow falling-fold back cape strip | A single long ridge and inner return, true narrow profile and oblique view; back inset places it right of spine | Top/hem and adjacent strip curves, actual fold amplitude, physical UV chart and cloth support; no whole cape deformation is validated |

The parts are simple enough in shape class to parameterize as one shallow loft, one half-shell and one single-fold loft. This is a planning inference, not timed model-construction evidence. The four views reduce shape ambiguity but do not mathematically prove a common 3D surface or matching edge lengths. The entire costume is not renamed as a micro-part, and neighbouring types have not yet all been generated.

Anatomical Right=−X, Left=+X, front=+Z is the intended convention. Front location marks occur on image-left; the back cape location occurs on image-right. The staff remains on the canonical wearer's right in the placement references. Existing bone suffix0/1 is not used as anatomical naming.

## First result and one correction

V1 contains the three IDs and four views plus small LOCATION figures. Its decorative swirling motif follows the noncanonical cape-v2 surface despite the prompt's explicit instruction to ignore that pattern. The sleeve LOCATION marker is also too close to the brown cuff to establish the intended wool patch clearly.

The single correction requested only removal of this motif and a clearer S05 placement close-up, preserving part shapes and labels. In V2 the sleeve inset clearly separates the outlined wool from the brown cuff. **Fine swirling/ornamental texture remains visible to the author; motif removal is not claimed complete.** The second PNG is offered for independent shape-reference review, not as an accepted wool material. No further edit or batch generation was started.

Raised-looking border lines on the detached pieces must also not be blindly modeled as new piping on every subdivision. A cut-edge illustration is not authorization to put raised seams into the final garment. Shared internal mesh boundaries should be welded or sewn only where the canonical complete clothing actually has a seam. Existing original colour and physical cloth source remain unchanged.

## Exact artifacts and remaining gate

- V1: `mira-cloth-three-micro-parts-v1.png`, 1536×1024 RGB PNG, 1,935,406 B, SHA256 `78f7edf6e2f5c002d11495169574c0484a2ec2bd58e3175f4da7a3bc1378a09f`.
- V2: `mira-cloth-three-micro-parts-v2.png`, 1536×1024 RGB PNG, 1,885,563 B, SHA256 `8af4e2f24dbd3113d126c6eeac6e6d351fa210b12819fe283a8d86164bf7d5bc`.
- Both prompts, original reference paths/hashes, dimensional **intent**, neighbour contracts and raw source paths are in adjacent records. Runtime pixel consumption is zero.

The integrator's independent reviewer must decide whether the silhouettes/true profiles are consistent enough to fix these three shape classes and what boundaries remain unresolved. The residual motif and the unconfirmed sleeve/cuff dimension are explicit limitations. All-part consistency, fitting into the final body, motion/contact, material appearance, actual screen comparison and device performance remain untested.
