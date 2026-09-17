# Clothing reconstruction v65

40 types /96 placements are fixed in one new numeric author source:269 canonical curves /8,877 samples,148 curves shared by distinct parts. Each33-sample curve has position, normal, tangent, UV, boneweights and explicit Hermite derivative. All placements have ownership, thickness, boundary references and fixed interior controls/recipes. The old112-curve final, notch PNG and TR03 final were not recovered; this is new reconstruction.

## Fixed choices

- TR02 uses two new built-in calls; the second raw image has independent limited acceptance. It stays a notched open sheet. TR03's FR↔TR01-R, BR↔TR02-R, BL↔TR02-L, FL↔TR01-L each share the same33-point curve. These are author coordinates, not image measurements.
- Neck CHEST frame: lowerY.560 inner100/86mm outer104/90mm; upperY.660 inner86/83mm outer90/87mm; front±12°. Shoulder/collar subdivisions use identical curves, including both C02 halves.
- S05/S06 keep190mm. In HAND frame they run+.210→+.020; bracer top+.160 and end0 yield50mm exposed and140mm hidden cloth. AH10 skin-15→+9mm overlaps bracer9mm, without direct cloth/skin weld. The selected160mm elbow region and160mm bracer explicitly supersede prior unconstrained90/200mm nominal proposals.
- TR05 FOOT Y.300→.345, radii69/71→70/72mm. Boot mouthY.340 inner75/77, and atY.300 inner73/75:40mm insertion,5mm exposed, minimum registered principal-axis clearance4mm. Both cloth ends use knee1. Foot support-108mm and bottom8+heel12mm stay unchanged.
- Upper/lower waist has one join. B01 and TR04 four-quarter closures share endcurves. Rear cape centre is explicitly authored atX0, closing the prior10mm gap. Tunic front stays split. PH01 and L05 remain different turnbacks.
- F03 has explicit start angles,330° wrap directions,12mm width and0-under1-under2 order. The legacy-R belt hanger stays anatomical Left(+X).

## Feedback repair and numeric validation

The integrator found inconsistent normals at coincident smooth junctions in the first reconstruction. The repair chooses node tangent planes and changes actual Hermite derivatives into those planes. It does not merely average normals. Sample positions are unchanged.

Actual-array checks cover209 smooth nodes: maximum normal difference0.0000868° with0.0001° rounding tolerance; maximum tangent rank2.103 original rank3 nodes become0. Maximum endpoint tangent change64.8547° and sampled Hermite deviation from the original polyline3.04317mm are recorded.15 cross-domain junctions retain explicit turnback/material/layer crease reasons.

W02-R/L each have391 solved cubic-RBF constraints: five boundary arcs, six cowl end curves, one P04 landing. Maximum position residual2.43e-12m, out-of-domain constraints0.931 interior probes per side span|X|.16999→.295m. Canonical boundary/landing curves evaluate HermiteY/Z and the same RBF X, so continuous correspondence is fixed. The unresolved radial shoulder baseline is superseded. No surface tessellation or triangle contact is claimed.

EXTERNAL_PORTS.json exports12 ports /1,036 ordered samples with frame, metre unit, owner/counterpart, kind, canonical sample IDs and transformed normals/tangents/weights. Inner envelopes derive explicitly from outer radii. These external joints are overlap/contact.

The accessory v65 counterpart was read. Unit conversion, anatomical indices, handY0/+20 with skin9mm overlap, FOOT Y300/340/345 and cloth69/71→70/72 radii agree. PORT_READBACK.json records its hash. Later edits require another readback.

VALIDATION.json includes successful coverage, perimeter, bone/weight, frame, shared neck/TR03/TR05, belt closure, node-plane, solved-W02 and selected-image identity checks. boundary-registration.png shows author curves only. A full runtime suite is unnecessary for data-only research changes.

## Pending acceptance

Whole-body independent acceptance remains pending. Final silhouette, interior distortion, face-derived normals, material atlas, cloth support, sleeve/body/cape intersection, animation clearance, floor and triangle contact have not been accepted. The loose16.5/20mm bracer/skin principal-axis clearance is an author fitting choice, not a contact-quality pass. Numeric equations do not establish attractive surfaces or a complete outfit.

New mesh0/runtime0/remote0. No main, PR39 or Site mutation. Original references/registrations/state stay unchanged. Existing41 bones, PS4 full-screen realism,10-title comparison and2026-09-20 deadline remain. None is marked achieved.

TIMING.json records the real tracked interval from worktree creation, including reading/design/generation correction/repair/verification. Initial pre-worktree reads have no captured start and are outside that exact interval. Tool-reported image durations total46.9s. This work does not prove instant finished-character production.

Normal contract clarification before fixed-candidate review: stored sample normals are boundary shading/frame guides. At interior curve parameters they must be projected against the actual Hermite derivative (including RBF chain rule), not only a knot chord. Actual surface normals come from cross(dS/du,dS/dv) of the explicit recipe. Zero/sign-changing Jacobians reject a surface. Node-plane success is not a surface-Jacobian pass. Loft recipes require the saved canonical-boundary transfinite correction; their full differential validity is the next independent finite review.
