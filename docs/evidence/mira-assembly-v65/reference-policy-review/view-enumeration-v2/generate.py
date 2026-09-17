#!/usr/bin/env python3
"""Enumerate previously unknown local panels from actual recorded bitmap inspection."""
import copy
import hashlib
import json
import sys
from pathlib import Path

OUT = Path(__file__).resolve().parent
PARENT = OUT.parent
ROOT = OUT.parents[4]
BASE = "bc761f25aae76209d26623b509f97e1f3a5a12ca"
def digest(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def load(p): return json.loads(p.read_text())
def rel(p): return str(p.relative_to(ROOT))
observations = load(OUT / "OBSERVATIONS.json")
prior = load(PARENT / "WHOLE_REFERENCE_SELECTION.proposed.json")
original = load(ROOT / "docs/evidence/mira-reference-set-v64/WHOLE_REFERENCE_SELECTION.json")
proposal = copy.deepcopy(prior)
rows = {r["id"]: r for r in proposal["types"]}
unknown_before = {r["id"] for r in prior["types"] if not any(v["views"] for v in r["viewPolicy"]["adoptedViews"])}
authority = rel(OUT / "OBSERVATIONS.json")
records = observations["images"]
assert len(records) == len({r["path"] for r in records}) == 36
mapped = [t for r in records for t in r["types"]]
assert len(mapped) == len(set(mapped)) == 60 and set(mapped) == unknown_before
inputs = {rel(PARENT / "WHOLE_REFERENCE_SELECTION.proposed.json"): digest(PARENT / "WHOLE_REFERENCE_SELECTION.proposed.json"), authority: digest(OUT / "OBSERVATIONS.json")}
inspection = []
for record in records:
    path = record["path"]
    inputs[path] = digest(ROOT / path)
    assert len(record["labels"]) in [4, 5]
    inspection.append({**record, "sha256": inputs[path], "displayedPanelCount": len(record["labels"]),
                       "cameraDirectionsCalibrated": False,
                       "qualitativeLocalShapeReference": True,
                       "completeAssemblySufficient": False})
    for ident in record["types"]:
        row = rows[ident]
        assert any(r["path"] == path and r["sha256"] == inputs[path] for r in row["references"])
        policy = row["viewPolicy"]
        policy["priorUnenumeratedViewPolicy"] = copy.deepcopy(policy["adoptedViews"])
        policy["adoptedViews"] = [{"referencePath": path, "views": record["labels"],
                                  "scope": record["observation"] + " Selected type row only; panel names identify the displayed local views, not verified global camera directions.",
                                  "authority": authority, "calibrated": False}]
        policy["excludedElements"] += [{"referencePath": path, "element": text,
                                        "reason": "Actual visual inspection limit; do not promote context or unshown geometry to the selected local part.",
                                        "authority": authority} for text in record["excluded"]]
        policy["limits"] += record["remaining"]
        policy["sourceEvidence"].append({"path": authority, "sha256": inputs[authority], "selector": "/images/index=" + str(record["index"])})
        policy["newVisualInspection"].append({"path": path, "sha256": inputs[path], "observation": record["observation"], "record": authority + "#/images/" + str(record["index"])})
        policy["viewLabelEnumeration"] = "explicit-from-actual-bitmap-inspection-local-only"
        policy["localShapeSufficiency"] = {"status": "qualitative-reference-with-listed-limits", "missingLabelAloneRequiresNewImage": False,
                                             "numericJoinsOrHiddenGeometryAccepted": False}
proposal["schema"] = "mira-reference-policy-proposal-v65/2"
proposal["scope"] = "Original v64 selections plus actual local panel enumeration for sixty previously unenumerated types; no numeric assembly acceptance"
proposal["allTypesHaveEnumeratedLocalViews"] = True
# Some inherited policies deliberately enumerate only accepted panels; do not claim all image labels or camera directions were verified.
proposal["allViewLabelsExplicitlyEnumerated"] = False
proposal["remaining"] = [x for x in proposal["remaining"] if not x.startswith("Resolve explicitly unenumerated")]
proposal["remaining"].append("All 120 types now have at least one enumerated local-view set; this is not all-panel camera verification or whole-assembly acceptance.")
proposal["policyInterpretation"] = [x for x in proposal["policyInterpretation"] if "seven listed" not in x and "empty adopted-view" not in x.lower()]
proposal["policyInterpretation"] += ["This follow-up actually displayed 36 distinct selected PNGs mapping to 60 previously unenumerated types. Prior phase displayed 7 different PNGs: cumulative own inspection 43/73.",
                                      "Labels such as RIGHT +X, SIDE 90 degrees, or TRUE PROFILE are panel identifiers only. Listed conflicts and non-calibration restrictions remain binding."]
assert all({k:v for k,v in a.items() if k != "viewPolicy"} == b for a,b in zip(proposal["types"], original["types"]))
assert not proposal["allReferencesAssemblyReady"]
unknown_after = [r["id"] for r in proposal["types"] if not any(v["views"] for v in r["viewPolicy"]["adoptedViews"])]
assert not unknown_after
old_seen = {x["path"] for x in load(PARENT / "IMAGE_INSPECTION.json")["files"]}
new_seen = {x["path"] for x in records}
assert len(old_seen | new_seen) == 43
audit = {"sourceCommit": BASE, "sourcePhaseCommit": "8fa8879b6f5a35e16a98e92eddb19d56b59e947f", "typeCount": 120, "uniquePlacements": 287, "selectedPNGCount": 73,
         "previouslyUnenumeratedTypeCount": 60, "newlyInspectedDistinctPNGCount": 36, "newlyEnumeratedTypeCount": 60,
         "remainingTypesWithoutEnumeratedLocalViews": unknown_after, "cumulativeOwnDistinctPNGInspection": 43,
         "selectedPNGsNotNewlyInspectedByThisAgent": 30, "allImagesOrTypesFreshlyInspectedClaimed": False,
         "localPanelsHaveCalibratedCameraDirections": False, "missingLabelAloneRequiresNewImages": False,
         "sourcePNGOrOriginalSelectionChanged": False, "allReferencesAssemblyReady": False,
         "remainingGate": ["Later TR02 notch candidate requires exact selected path/hash and its independent local policy before integration.",
                           "Authored per-instance transforms, shared curves, ownership and cross-domain contacts require independent numeric review.",
                           "Compare all placements to the whole character design; local appearance and panel counts do not establish final assembly."],
         "newImages": 0, "newNumericalDesign": 0, "newGeometry": 0, "runtimeWrites": 0, "remoteWrites": 0}
outputs = {"WHOLE_REFERENCE_SELECTION.proposed.json": proposal, "IMAGE_INSPECTION.json": {"scope": observations["scope"], "files": inspection},
           "POLICY_REVIEW.json": audit, "SOURCE_HASHES.json": inputs}
for name, data in outputs.items():
    encoded = (json.dumps(data, ensure_ascii=False, indent=2) + "\n").encode()
    if "--check" in sys.argv: assert (OUT / name).read_bytes() == encoded, name
    else: (OUT / name).write_bytes(encoded)
print(json.dumps(audit, ensure_ascii=False))
