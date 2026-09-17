#!/usr/bin/env python3
"""Carry saved reference restrictions into a proposal without editing the v64 table.

No image generation, resampling, metric inference, geometry, or runtime writes.
Unenumerated view labels remain unknown rather than becoming an all-view approval.
"""
import copy
import hashlib
import json
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
OUT = Path(__file__).resolve().parent
BASE = "bc761f25aae76209d26623b509f97e1f3a5a12ca"
V64 = "docs/evidence/mira-reference-set-v64/"
INPUTS = {}


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def source(rel):
    path = ROOT / rel
    INPUTS[rel] = {"sha256": sha(path), "bytes": path.stat().st_size}
    return path


def load(rel):
    return json.loads(source(rel).read_text())


def read(rel):
    return source(rel).read_text()


def evidence(rel, selector):
    source(rel)
    return {"path": rel, "sha256": INPUTS[rel]["sha256"], "selector": selector}


def table_statements(text, type_id, column=1):
    rows = []
    for line in text.splitlines():
        if not line.startswith("|"):
            continue
        cells = line.strip("|").split("|")
        if len(cells) >= 3 and re.search(r"(?<![A-Za-z0-9])" + re.escape(type_id) + r"(?![A-Za-z0-9])", cells[column]):
            rows.append(line)
    return rows


def selected(path, labels, scope, authority):
    return {"referencePath": path, "views": labels, "scope": scope,
            "authority": authority, "calibrated": False}


def excluded(path, element, why, authority):
    return {"referencePath": path, "element": element, "reason": why, "authority": authority}


WHOLE = V64 + "WHOLE_REFERENCE_SELECTION.json"
HEAD = V64 + "head-reference-set/coverage.json"
CLOTH = V64 + "cloth-reference-set/COVERAGE.json"
ACC = V64 + "accessory-reference-set/TYPE_REFERENCE_COVERAGE.json"
VIEWS = V64 + "accessory-boundary-references/VIEW_SELECTIONS.json"
STAFF = V64 + "staff-reference-review/snapshot-STAFF_REFERENCE_COVERAGE.json"
HR = V64 + "head-reference-review/REVIEW.md"
CR = V64 + "cloth-reference-review/REVIEW.md"
AR = V64 + "accessory-reference-review/REVIEW.md"
SR = V64 + "staff-reference-review/REVIEW.md"
AB_REVIEW = V64 + "accessory-reference-review/appendix-boundaries-v1/APPENDIX_REVIEW.md"
AH_REVIEW = V64 + "accessory-reference-review/appendix-ah08-ah10-v2/APPENDIX_REVIEW.md"
AB03_REVIEW = V64 + "accessory-reference-review/appendix-ab03-v3/REVIEW.md"

old = load(WHOLE)
head = {x["id"]: x for x in load(HEAD)["types"]}
cloth = {x["typeID"]: x for x in load(CLOTH)["types"]}
acc = {x["id"]: x for x in load(ACC)["types"]}
boundary = load(VIEWS)
staff = {x["id"]: x for x in load(STAFF)["rows"]}
reviews = {p: read(p) for p in [HR, CR, AR, SR, AB_REVIEW, AH_REVIEW, AB03_REVIEW]}
cloth_findings = load(V64 + "cloth-reference-review/FINDINGS.json")
closure = load(V64 + "head-assembly-registration/supplement-closure/CLOSURE.json")
assert closure["selectedImages"] == 3 and closure["proposedF21Revision"] == [41, 82]

# Seven ORIGINAL bitmap files actually displayed in this v65 review. This does
# not inherit the earlier reviewers' claimed full-image inspection as our own.
INSPECTED = {
    V64 + "head-assembly-registration/F21-supplement/mira-F21-v1.png":
        "Global front is narrow, anatomical-left side is broad; reverse is shown but orientation needs author registration. Placement is in front of ear. No metric scale accepted.",
    V64 + "head-assembly-registration/F17-side-supplement/mira-F17-side-v2.png":
        "Detached LEFT SIDE shows one lip ridge and recession; FRONT/TOP/3Q retain a single lower-lip surface intent. Left locator faces left. No mouth weld or cavity inferred.",
    V64 + "head-assembly-registration/A01a-attachment-supplement/mira-A01a-attachment-v1.png":
        "Reverse and reverse 3Q display two longitudinal skin-edge intents and an open rolled strip. The U section is qualitative; its from-above/toward-+X caption is not a global camera basis.",
    V64 + "head-reference-set/existing/mira-F17-v2.png":
        "The old detached TRUE SIDE has two projections with an intervening notch, unlike the one-ridge FRONT/3Q. This side is retained as rejected correspondence evidence.",
    V64 + "head-reference-set/09-ear-outer-v1.png":
        "A01a old REVERSE repeats an exposed C rim without two long attachment edges; A01b fork and A03 lobe rows remain local surface references.",
    V64 + "head-reference-set/07-front-scalp-v2.png":
        "S01 BACK locator explicitly says front patch occluded from back; detached reverse is a different, allowed attachment-face panel. S02 has its own posterior locator.",
    V64 + "accessory-reference-set/AHB-08-v1.png":
        "AB10 TOP/UNDERSIDE/3Q show a foot-outline ring. Its straight SIDE is not an accepted corresponding sole-following profile. AB09 row belongs to the superseded wrapped-strip version.",
}

# Explicit labels below come from saved reviews or the seven displayed images,
# never merely from generation requests. Empty lists mean not enumerated.
HEAD_LABELS = {
    "F03": ["FRONT", "SIDE", "REVERSE"],
    "F19": ["FRONT", "SIDE", "REVERSE"],
    "F13": ["FRONT", "PROFILE", "THREE-QUARTER"],
    "F16b": ["REVERSE"],
    "E01": ["anterior corneal seat", "closed posterior body"],
    "E02": ["convex iris cap", "reverse cavity"],
    "B01": ["curved strip", "reverse"],
    "E05": ["REVERSE", "SIDE"],
    "A01b": ["FRONT", "RIGHT SIDE", "REVERSE", "THREE-QUARTER"],
    "A03": ["FRONT", "RIGHT SIDE", "REVERSE", "THREE-QUARTER"],
    "S01": ["FRONT / EXPOSED FACE", "RIGHT SIDE", "REVERSE / ATTACHMENT FACE", "THREE-QUARTER FRONT-LEFT", "THREE-QUARTER FRONT-RIGHT"],
    "S02": ["FRONT / EXPOSED FACE", "RIGHT SIDE", "REVERSE / ATTACHMENT FACE", "THREE-QUARTER FRONT-LEFT", "THREE-QUARTER FRONT-RIGHT"],
}
CLOTH_LABELS = {
    "TR01": ["outside", "profile", "reverse", "3Q"],
    "TR02": ["outside", "profile", "reverse", "3Q"],
    "S03": ["outer", "reverse", "curved side"],
    "P04": ["outer", "reverse", "curved profile"],
    "TR03": ["outer", "reverse"],
    "PH01": ["RIGHT PROFILE (oblique reference only)", "LEFT PROFILE (oblique reference only)"],
}

proposal = copy.deepcopy(old)
proposal["schema"] = "mira-reference-policy-proposal-v65/1"
proposal["scope"] = "Policy-carry-forward proposal over fixed v64 images; not numerical assembly acceptance"
proposal["sourceCommit"] = BASE
proposal["sourceSelection"] = evidence(WHOLE, "/")
proposal["allReferencesAssemblyReady"] = False
proposal["allViewLabelsExplicitlyEnumerated"] = False
proposal["newGeometry"] = 0
proposal["newRuntimeImports"] = 0
proposal["policyInterpretation"] = [
    "Each adopted view is only a qualitative local shape reference, not a calibrated projection or complete assembled part.",
    "An empty adopted-view list does not authorize every panel; use the exact saved qualitative scope and resolve per-view labels before claiming complete view coverage.",
    "Exclusions are scoped to exact source images. A supplement can close a local appearance issue without approving old rejected panels.",
    "Camera labels do not override face +Z/up +Y/anatomical Right=-X/Left=+X. No pixel-derived dimensions.",
    "Prior review text is attributed evidence; only seven listed bitmap files were freshly inspected in this task.",
]

for row in proposal["types"]:
    group, ident = row["id"].split(":", 1)
    refs = row["references"]
    paths = [r["path"] for r in refs]
    for ref in refs:
        p = source(ref["path"])
        assert sha(p) == ref["sha256"] and p.stat().st_size == ref["bytes"], ref["path"]
    policy = {"status": "conditional-local-shape-only", "adoptedViews": [],
              "excludedElements": [], "sourcePolicy": {}, "sourceEvidence": [],
              "reviewStatements": [], "limits": [], "sourceImagePaths": paths,
              "newVisualInspection": [p for p in paths if p in INSPECTED],
              "exactProjectionAccepted": False, "numericalAssemblyAccepted": False}
    if group == "head":
        policy["sourceEvidence"].append(evidence(HR, "matching type row; completion/coordinate limits"))
        policy["reviewStatements"] = table_statements(reviews[HR], ident)
        if ident in head:
            h = head[ident]
            assert paths[0] == V64 + "head-reference-set/" + h["image"]
            policy["sourceEvidence"].append(evidence(HEAD, "/types[id=" + ident + "]"))
            policy["sourcePolicy"] = {k: copy.deepcopy(h[k]) for k in ["status", "findings", "imageIsCalibrated", "exactSeamsRegistered", "fullAssemblyAccepted"]}
            policy["adoptedViews"] = [selected(paths[0], HEAD_LABELS.get(ident, []),
                "Only the saved per-type qualitative surface scope; unlisted view labels are not newly accepted.", HEAD)]
            for finding in h["findings"]:
                if any(word in finding.lower() for word in ["excluded", "must not", "not anatomy", "not requirements", "not anatomical coordinate authority"]):
                    policy["excludedElements"].append(excluded(paths[0], "source-specified interpretation", finding, HEAD))
        policy["limits"].extend(["Frozen base has unregistered transforms/seams; the 41/82 proposal does not replace the preserved 40/80 source.",
            "Hair is not globally mirrored; 24 individual roots/tips and overlaps need authored registration."])
        if ident == "F17":
            spr = V64 + "head-assembly-registration/F17-side-supplement/REVIEW.md"
            policy["sourceEvidence"].append(evidence(spr, "/"))
            policy["reviewStatements"].append(read(spr))
            policy["adoptedViews"] = [
                selected(paths[0], ["FRONT", "TOP", "THREE-QUARTER"], "Lower-lip surface only; historical base side is not adopted.", HR),
                selected(paths[1], ["FRONT (+Z)", "LEFT SIDE (+X)", "TOP (+Y)", "FRONT-LEFT THREE-QUARTER"], "Selected v2 single-ridge correspondence; lower boundary above F11.", spr)]
            policy["excludedElements"].append(excluded(paths[0], "TRUE SIDE", "Unmatched two projections; replaced for side correspondence by supplemental v2.", spr))
            policy["limits"].append("No permanent F16a/F17 weld or mouth cavity; F20 side contacts and F11 lower seam remain author registration. Old author wording inconsistent is superseded by independent ambiguous-correspondence wording.")
        if ident == "A01a":
            spr = V64 + "head-assembly-registration/A01a-attachment-supplement/REVIEW.md"
            policy["sourceEvidence"].append(evidence(spr, "/"))
            policy["reviewStatements"].append(read(spr))
            policy["adoptedViews"] = [
                selected(paths[0], ["FRONT", "RIGHT SIDE", "THREE-QUARTER"], "Exposed C-contour only; no claim of old attachment-edge closure.", HR),
                selected(paths[1], ["EXPOSED OUTER VIEW", "REVERSE / ATTACHMENT VIEW", "THREE-QUARTER REVERSE VIEW", "CROSS-SECTION"], "Open rolled strip and two long skin-edge intents; U section is qualitative.", spr)]
            policy["excludedElements"].extend([
                excluded(paths[0], "REVERSE as proof of longitudinal attachment edges", "The old reverse does not expose the required two long edges; use supplement.", HR),
                excluded(paths[1], "section caption from above (toward +X) as global camera transform", "Caption does not define a coherent global viewing basis.", spr),
                excluded(paths[1], "terminal thickness / coloured outlines as caps or flanges", "Illustrative rendering is not prescribed extra geometry.", spr)])
            policy["limits"].append("A01b/A04/A02a/A03 and scapha/posterior allocation remain concrete author choices, not proven matching seams.")
        if ident == "F21":
            spr = V64 + "head-assembly-registration/F21-supplement/REVIEW.md"
            policy["sourceEvidence"].extend([evidence(spr, "/"), evidence(V64 + "head-assembly-registration/supplement-closure/CLOSURE.json", "/proposedF21Revision")])
            policy["reviewStatements"] = [read(spr)]
            policy["adoptedViews"] = [selected(paths[0], ["GLOBAL FRONT (+Z)", "ANATOMICAL LEFT (+X)", "REVERSE", "THREE-QUARTER"], "Tapered preauricular candidate; reverse orientation not yet registered.", spr)]
            policy["excludedElements"] = [excluded(paths[0], "same-scale text / border thickness / surface grain / eye colour drift as measurements", "Not calibrated measurements or material adoption.", spr)]
            policy["limits"].append("No blanket link to posterior A04; F03 superior, posterior tragus/lobe split, inferior jaw, and four cheek ports need author registration.")
        if ident == "S01":
            policy["excludedElements"].append(excluded(paths[0], "BACK placement as posterior S01 surface", "S01 is explicitly occluded from back; its isolated REVERSE attachment face is not excluded.", HR))
        if ident in ["F01", "F05", "F09"]:
            policy["excludedElements"].append(excluded(paths[0], "thick reverse rim as skin step", "Independent review excludes artificial thickness from skin anatomy.", HR))
        if ident in ["F18", "E04"]:
            policy["limits"].append("E04 and F18 broad infraorbital locators must not both define exact overlapping ownership boundaries.")
        if ident in ["HT04", "HT05", "HT06"]:
            policy["excludedElements"].append(excluded(paths[0], "RIGHT SIDE (+Z VIEW) as world-axis authority", "Treat as local image label until explicitly transformed.", HR))
    elif group == "cloth":
        c = cloth[ident]
        assert refs[0]["sha256"] == c["sha256"]
        assert Path(paths[0]).name == Path(c["selectedImage"]).name
        policy["sourceEvidence"] = [evidence(CLOTH, "/types[typeID=" + ident + "]"), evidence(CR, "matching type row"), evidence(V64 + "cloth-reference-review/FINDINGS.json", "/")]
        policy["sourcePolicy"] = {k: copy.deepcopy(c[k]) for k in ["referenceAssessment", "priorIndependentStatus", "notes", "edgeContract", "mirrorPolicy"] if k in c}
        policy["reviewStatements"] = table_statements(reviews[CR], ident)
        policy["adoptedViews"] = [selected(paths[0], CLOTH_LABELS.get(ident, []), c.get("notes", "") or "Saved independent table row governs; no complete-view approval.", CR)]
        policy["limits"] = ["Shape/ownership only. Exact 31 interfaces and individual instances require authored curve/contact registration.",
                            "No generated ornamental swirl or exaggerated rim is a calibrated runtime surface."]
        cloth_exclusions = {
            "T01": ["ornamental swirls / thick rims"], "S05": ["ornamental swirls / thick rims"], "P01": ["ornamental swirls / thick rims"],
            "T02": ["generated left-shoulder label contrary to rear locator"],
            "T04": ["HOODIE label as armhole attachment; use ARMHOLE"],
            "T05": ["old S02 row on same sheet as adopted S02"], "S01": ["old S02 row on same sheet as adopted S02"],
            "S04": ["old S06 closed-tube row on same sheet"],
            "P02": ["old P04-RB row as complete new P04 type"],
            "L03": ["decorative edge rolls"], "L04": ["thick illustrative rim as measured thickness"],
            "F01": ["thick edge rims"], "F03": ["old and corrected locators as trustworthy ribbon placement transforms"],
            "W03": ["locator as complete three-layer placement; rear cowl as additional worn hood"],
            "PH01": ["RIGHT / LEFT PROFILE labels as calibrated 90-degree projections", "swirl / rolled thickness / independent solid end caps"],
            "TR01": ["blue-grey proxy colour as canonical material"], "TR02": ["blue-grey proxy colour as canonical material"],
        }
        for element in cloth_exclusions.get(ident, []):
            policy["excludedElements"].append(excluded(paths[0], element, "Preserved per-type source/independent review restriction.", CR))
        if ident in ["TR01", "TR02", "TR03"]:
            policy["limits"].append("Saved TR02-method-b has no explicit matching upper-inner notch. TR03 four source-contour intervals remain unresolved; newer TR02 notch image is NOT recovered or substituted here.")
        if ident in ["TR01", "TR02"]:
            policy["historicalRejectedVersions"] = ["v1/v2 mixed open/closed leg/ankle surfaces; retain rejection, not current selected references"]
        if ident == "F03":
            policy["limits"].append("R/L names do not determine three individual wrap angles, crossing order, or extents.")
        if ident in ["B02", "B03"]:
            policy["limits"].append("Legacy B02-R / B03-hanger-R names do not override anatomical Left(+X) placement correction.")
    elif group in ["hands", "boots"]:
        a = acc[ident]
        policy["sourceEvidence"] = [evidence(ACC, "/types[id=" + ident + "]"), evidence(AR, "matching type row")]
        policy["sourcePolicy"] = {k: copy.deepcopy(a[k]) for k in ["selectedImage", "selectedViews", "excluded", "status", "unresolvedVisualIssue", "blockingVisualBoundary", "exactSharedBoundaryAccepted"]}
        original_path = V64 + "accessory-reference-set/" + a["selectedImage"]
        source(original_path)
        policy["sourcePolicy"]["appliesToReferencePath"] = original_path
        policy["sourcePolicy"]["isCurrentSelectedImage"] = original_path == paths[0]
        policy["reviewStatements"] = table_statements(reviews[AR], ident, column=0)
        policy["adoptedViews"] = [selected(paths[0], a["selectedViews"], "Only original per-type conditional shape-family scope.", ACC)]
        for restriction in a["excluded"]:
            # An old v1-only feature must not appear as a rejected panel of v2.
            rejected_path = original_path.replace("-v2.png", "-v1.png") if "v1 " in restriction else original_path
            source(rejected_path)
            policy["excludedElements"].append(excluded(rejected_path, restriction, "Preserved source restriction (historical if this image was superseded).", ACC))
        if ident in boundary:
            b = boundary[ident]
            assert Path(paths[0]).name == b["image"]
            policy["sourceEvidence"].extend([evidence(VIEWS, "/" + ident), evidence(AB_REVIEW, "matching row and shared limits")])
            policy["supplementPolicy"] = copy.deepcopy(b)
            policy["adoptedViews"] = [selected(paths[0], b["selected"], b["resolvedAppearance"], VIEWS)]
            policy["reviewStatements"].append(reviews[AB_REVIEW])
            policy["limits"].extend(b["limits"])
            policy["sourcePolicy"]["historicalIssueStatus"] = "Local appearance issue superseded by selected supplement and its independent appendix; numerical join still unaccepted."
        if ident in ["AH08", "AH10"]:
            labels = ["OUTER FACE", "UNDERSIDE", "SIDE", "THREE-QUARTER"] if ident == "AH08" else ["FRONT", "REAR", "SIDE", "THREE-QUARTER", "END VIEW"]
            scope = "One convex/concave nail plate with a corresponding rounded border." if ident == "AH08" else "Open-ended closed-perimeter sleeve with exterior REAR; END is an opening view, not a cap."
            policy["sourceEvidence"].append(evidence(AH_REVIEW, "matching type row and limits"))
            policy["reviewStatements"].append(reviews[AH_REVIEW])
            policy["adoptedViews"] = [selected(paths[0], labels, scope, AH_REVIEW)]
            policy["sourcePolicy"]["historicalIssueStatus"] = "Old reverse-only issue closed in selected supplement at local appearance level."
        if ident == "AB03":
            policy["sourceEvidence"].append(evidence(AB03_REVIEW, "/"))
            policy["reviewStatements"].append(reviews[AB03_REVIEW])
            policy["adoptedViews"] = [selected(paths[0], ["FRONT", "REVERSE", "SIDE", "THREE-QUARTER"], "Open vamp patch in all listed views; no closed rear wall or complete ankle ring.", AB03_REVIEW)]
            policy["sourcePolicy"]["historicalIssueStatus"] = "The old SIDE closed-loop contradiction is closed only for selected v3."
        policy["limits"].append("Later supplement changes are local appearance acceptance only; exact per-instance fit, side orientation, shared curves/contact, UV/weights and grasp are not accepted here.")
        if ident == "AB02":
            policy["excludedElements"].append(excluded(original_path, "four metallic fastener heads in old BOTTOM as part of AB02", "AB11 owns separate heads; selected supplemental AB02 shows empty seats.", AB_REVIEW))
        if ident == "AB10":
            policy["limits"].append("A straight side projection can occur for a planar ring; keep the side excluded without declaring an impossible object. Contact with sole curvature remains unverified.")
    elif group == "staff":
        s = staff[ident]
        assert Path(paths[0]).name == Path(s["referenceFile"]).name
        assert refs[0]["sha256"] == s["sha256"]
        policy["sourceEvidence"] = [evidence(STAFF, "/rows[id=" + ident + "]"), evidence(SR, "/")]
        policy["sourcePolicy"] = {k: copy.deepcopy(s[k]) for k in ["views", "status", "limitation"]}
        policy["adoptedViews"] = [selected(paths[0], s["views"].split("/"), s["status"], STAFF)]
        policy["limits"] = [s["limitation"], "Native matrix/contact provenance does not establish all image projections, welds, grip, or whole-character fit."]
        ex = {
            "S04": "S05 region of grip-strips sheet; use isolated S04 only",
            "S06": "assembly thumbnail that swaps S17/S18",
            "S07": "old S16 lip row on same sheet",
            "S08": "old S16 lip row on same sheet",
            "S15": "grip-attachment thumbnail; finial belongs above S14",
            "S17": "assembly thumbnail that swaps S17/S18; actual S17 is lower",
            "S18": "assembly thumbnail that swaps S17/S18; actual S18 is upper",
        }
        if ident in ex:
            policy["excludedElements"].append(excluded(paths[0], ex[ident], "Explicit source-coverage limitation.", STAFF))
        if ident == "S05":
            policy["historicalRejectedVersions"] = ["Old pre-wound helix is not the adopted construction template; the selected straight blank does not fix winding."]
        if ident in ["S09", "S10", "S11", "S12"]:
            policy["limits"].append("Selected v3 TOP is usable for one overlapping seat/outer bow footprint; old v2 TOP remains rejected and the current v3 TOP must not inherit that obsolete rejection.")
    else:
        raise AssertionError(group)
    policy["viewLabelEnumeration"] = "explicit-at-least-partial" if any(x["views"] for x in policy["adoptedViews"]) else "not-enumerated-in-consulted-policy"
    row["viewPolicy"] = policy

assert len(proposal["types"]) == 120
assert sum(len(x["instances"]) for x in proposal["types"]) == 287
image_paths = sorted({r["path"] for x in proposal["types"] for r in x["references"]})
assert len(image_paths) == 73
missing = [x["id"] for x in proposal["types"] if x["viewPolicy"]["viewLabelEnumeration"].startswith("not-")]
proposal["remaining"] = old["remaining"] + [
    "Resolve explicitly unenumerated per-view labels before asserting complete adopted-view coverage; no all-view default.",
    "Reconcile saved TR02-method-b / TR03 contour ownership with the clothing owner's separately reviewed newer candidate; do not invent the missing notch here.",
    "Integrate and independently verify new numerical registrations separately from this view-policy proposal.",
]

inspection = {"scope": "Actual new bitmap inspection only; seven files displayed via view_image at original source paths, no pixel edits.",
              "newInspectedImageCount": len(INSPECTED), "wholeSelectedImageCount": 73,
              "notNewlyInspectedSelectedImageCount": len(set(image_paths) - set(INSPECTED)),
              "files": [{"path": p, "sha256": sha(source(p)), "observation": note} for p, note in INSPECTED.items()],
              "limits": "No inherited claim that all 120 types or all 73 images were freshly visually inspected. Prior reviews are attributed source evidence, not a new blind comparison."}
audit = {"sourceCommit": BASE, "sourceSelectionSHA256": sha(ROOT / WHOLE),
         "typeCount": 120, "placementCount": 287, "selectedOriginalPNGCount": 73,
         "byGroup": dict(Counter(x["group"] for x in proposal["types"])),
         "oldRowsWithExplicitViewPolicy": sum("viewPolicy" in x for x in old["types"]),
         "newRowsWithTraceablePolicy": 120,
         "rowsWithAtLeastSomeExplicitAdoptedViews": 120 - len(missing),
         "rowsWithoutEnumeratedAdoptedViewLabels": missing,
         "rowsWithExplicitExclusions": sum(bool(x["viewPolicy"]["excludedElements"]) for x in proposal["types"]),
         "oldTableOrSelectedReferencesReplaced": False,
         "findings": [
             "Old head/accessory rows have generic selectionBasis and omit source-selected views and per-type exclusions.",
             "Old staff table retains limitation prose but drops the explicit source views field.",
             "Old cloth table retains many notes; excluded views/regions and image-specific restrictions still need explicit scoping.",
             "Head F17 and A01a supplements must not re-authorize rejected old source panels; F21 is a separate 41/82 candidate addition.",
             "Supplemented AH07/AH08/AH10/AB01/AB02/AB03 must not inherit old rejected views as current exclusions, nor erase historical rejection provenance.",
             "AB10 side restriction remains; staff rib v3 TOP local closure is retained.",
         ],
         "assemblyGate": {"accepted": False, "reason": "Policy traceability is restored as a proposal; missing explicit labels, numerical joins, cross-domain registration and whole assembled visual verification remain.",
                          "newImages": 0, "newNumericalDesign": 0, "newGeometry": 0, "runtimeWrites": 0, "remoteWrites": 0}}

outputs = {"WHOLE_REFERENCE_SELECTION.proposed.json": proposal, "POLICY_REVIEW.json": audit,
           "IMAGE_INSPECTION.json": inspection, "SOURCE_HASHES.json": INPUTS}
for name, content in outputs.items():
    encoded = (json.dumps(content, ensure_ascii=False, indent=2) + "\n").encode()
    path = OUT / name
    if "--check" in sys.argv:
        assert path.read_bytes() == encoded, name + " differs from deterministic regeneration"
    else:
        path.write_bytes(encoded)
print(json.dumps({"types": 120, "placements": 287, "selectedPNGs": 73,
                  "newlyViewedPNG": len(INSPECTED), "unenumeratedViewLabelTypes": len(missing),
                  "assemblyGateAccepted": False, "checkOnly": "--check" in sys.argv}))
