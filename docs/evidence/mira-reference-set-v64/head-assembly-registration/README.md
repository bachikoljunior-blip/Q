# Head assembly registration v1 — 40 leaf / 80 instance baseline

This is a fixed **design ledger**, not a completed head or permission to model unresolved parts. No new mesh, image, runtime source, test or remote mutation was made in this registration unit. The previously frozen image set remains unchanged. Every one of the 80 instances now has exact named counterpart IDs and layer semantics; only the six retained v63 lower-face seams have numerical two-sided geometry.

## What is fixed

- 170 exact-ID interface records: 6 existing numeric C1 seams, 164 author adjacency/contact/support proposals. IDs are unique and reciprocal through both owners. All 80 instances are referenced; no dangling head-instance ID. Hair has 24 roots, each with exactly one named scalp support. Proposed over/under hair pairs are explicit.
- Old 153 join declarations are individually accounted for. Generic phrases are replaced by specific interface or rig/open-port records. Anatomically wrong declarations are rejected rather than relabelled as valid: F01→F05 across an eye; F05→F12 ignoring the intervening orbital/nasal skin; unspecified “46-point neck rim”; indiscriminate eye-center/eyelid-bone ownership of brow and iris.
- The 28 old patch-edge control polygons are copied/derived from unchanged v63 control data. Six internal edges remain exact C1. The other 16 existing open edges have named candidate receivers or a concrete blocker, not arbitrary filling. Where two future parts may share portions of one native edge, the subdivision parameter is explicitly unassigned. This prevents declaring both parts owners of the whole edge; it does not prove the eventual partition.
- Head-local metres: origin at existing head group; +Y up, +Z face, anatomical R=-X/L=+X. Reflected geometry would require reversed winding; mirrored reference shape is not evidence of facial identity. Existing right eye maps to eyelid-0, left to eyelid-1. Image camera labels cannot override this.

## Values and provenance

`source-hashes.json` records current source and fixed reference input hashes. `existing-boundaries.json` and `open-native-boundaries.json` contain retained numerical Bezier boundaries and source-sampled bounds, not reconstruction from pixels. Existing v63 UV is the shared ribbon chart [u, global-row/(7*along)], head weight1. It is not a registered skin atlas.

The bind rig values in `rig-reference.json` are neck relative to chest [0,.6,0], head relative to neck [0,.16,0]; the unplaced native actor bind heights are1.585 and1.745m. These are not fixed world positions in gameplay. Transform a point with actual parent matrices: world=M_head·p_head; frame conversion uses inverse(M_head)·M_neck. In the identity bind only, p_head=p_neck−[0,.16,0].

Native sclera semi-axes [.022,.008,.010]m form a flattened ellipsoid, while new E01 imagery suggests a near-sphere. The native values/centres are recorded as existing facts, **not adopted new E01 dimensions**. New eye curvature, iris fit and lid closure therefore remain blocked until a coherent combined reference and registration exist. Existing blink translates the upper-lid group by−.015m; blindly applying it to a newly welded skin patch would not prove crack-free deformation.

All other legacy envelopes remain provisional source-plan guides, not image-calibrated dimensions. Newly authored decisions are limited to counterpart IDs, edge roles, relative hair ordering/support and parameter conventions. No missing coordinate, thickness, UV, clearance or blend weight was invented. The +t/−t notation is a proposed boundary traversal convention; it is not evidence that unavailable patches have correct winding or matching normals.

## Separate layers

Skin seams are distinguished from moving lid/eyeball contact, iris optical-seat fitting, mouth contact, eyebrow overlay, hair root support and hair overlap. Eyeballs are not welded to lids; upper and lower lip are not permanently welded across a seam required to open. Hair tips are not scalp roots. Each H01…H24 root has a named scalp instance and a unique ROOT-Hxx slot; actual anchor coordinates, section, allowed curvature and overlap clearance remain null.

N01/N02 retain one anterior and one posterior half of the neck. A proposed head1→neck1 blend would share weights at both side seams, but no blend interior is numerically fixed. Neck cut ownership remains head skin; cloth collar/cowl is an external interface. No unknown clothing instance is guessed or folded into the head's80 IDs.

## Concrete blockers

There are14 explicit blocked ports, plus every unregistered proposed curve. Four native outer-edge ports F05/F07 on both sides expose missing preauricular skin ownership. F03 is temple, A04 is ear-back and N01 is neck; none may be expanded silently to fill that region. **F21 preauricular side-face is proposed as one new type/two instances, not yet in this40/80 baseline.** A later explicit revision would be41/82, not retroactive completion of the old plan.

F17 profile still has an extra protrusion inconsistent with lower-lip-only front views. Independent review also flags A01a helix's inner attachment/cross-section as unresolved: a closed round rod and an open rolled skin edge cannot be treated as the same part. Nose/ear interior terminus, lip cavity, actual scalp-wide placement and all final metric seams remain unresolved. Required small reference views are listed in REQUIRED_VIEWS.md. No new generation was performed before this checkpoint.

## Files and acceptance boundary

INSTANCE_TABLE.md gives all80 exact instances; INTERFACE_TABLE.md lists all170 relations. instances.json, interfaces.json, legacy-153-accounting.json and rig-reference.json are machine-readable. ledger-check.json checks ID/accounting consistency only. A graph with no dangling names is not a watertight face, a manifold test, a visual match, a successful expression, a WebGL frame or PS4/iPhone acceptance. New mesh creation remains off until the full reference/assembly review permits it.
