#!/usr/bin/env python3
"""Finite source-identity and policy-loss checks; no renderer or game tests."""
import copy
import hashlib
import json
import subprocess
import time
from datetime import datetime, timezone
from pathlib import Path

START = time.perf_counter()
ROOT = Path(__file__).resolve().parents[4]
OUT = Path(__file__).resolve().parent
BASE = "bc761f25aae76209d26623b509f97e1f3a5a12ca"
V64 = "docs/evidence/mira-reference-set-v64/"
def load(p): return json.loads((ROOT / p).read_text())
def digest(p): return hashlib.sha256(p.read_bytes()).hexdigest()

old_path = V64 + "WHOLE_REFERENCE_SELECTION.json"
old = load(old_path)
new = json.loads((OUT / "WHOLE_REFERENCE_SELECTION.proposed.json").read_text())
audit = json.loads((OUT / "POLICY_REVIEW.json").read_text())
inputs = json.loads((OUT / "SOURCE_HASHES.json").read_text())
inspection = json.loads((OUT / "IMAGE_INSPECTION.json").read_text())

def require(condition, message):
    if not condition:
        raise AssertionError(message)

def policy_invariants(candidate):
    rows = {x["id"]: x for x in candidate["types"]}
    require(len(rows) == 120, "exact type identity/count")
    for before, after in zip(old["types"], candidate["types"]):
        stripped = {k: v for k, v in after.items() if k != "viewPolicy"}
        require(stripped == before, "v64 row fields/refs/placements must be preserved: " + before["id"])
        p = after["viewPolicy"]
        require(p["sourceEvidence"], "each type requires policy evidence")
        require(not p["exactProjectionAccepted"] and not p["numericalAssemblyAccepted"], "no acceptance inflation")
        for v in p["adoptedViews"]:
            require(v["referencePath"] in [r["path"] for r in after["references"]], "adopted panel must come from selected image")
            require(v["authority"] in inputs, "adopted panel must have saved source authority")
    instances = [i for r in candidate["types"] for i in r["instances"]]
    require(len(instances) == len(set(instances)) == 287, "unique placement identity/count")
    require(len({r["path"] for t in candidate["types"] for r in t["references"]}) == 73, "original image count")
    require(not candidate["allReferencesAssemblyReady"], "whole assembly remains unaccepted")
    f17 = rows["head:F17"]["viewPolicy"]
    require(any(e["element"] == "TRUE SIDE" and e["referencePath"].endswith("existing/mira-F17-v2.png") for e in f17["excludedElements"]), "old F17 side rejection must survive")
    require(any(v["referencePath"].endswith("mira-F17-side-v2.png") and "LEFT SIDE (+X)" in v["views"] for v in f17["adoptedViews"]), "F17 supplement side selection")
    a01 = rows["head:A01a"]["viewPolicy"]
    require(any("old reverse" in e["reason"].lower() for e in a01["excludedElements"]), "old A01a attachment insufficiency")
    require(any("from above" in e["element"] for e in a01["excludedElements"]), "A01a invalid global caption restriction")
    s01 = rows["head:S01"]["viewPolicy"]
    require(any("BACK placement" in e["element"] for e in s01["excludedElements"]), "S01 occluded back locator")
    require(any("REVERSE / ATTACHMENT FACE" in v["views"] for v in s01["adoptedViews"]), "do not confuse S01 detached reverse with occluded back locator")
    ab10 = rows["boots:AB10"]["viewPolicy"]
    require(any("straight schematic side" in e["element"] for e in ab10["excludedElements"]), "AB10 side exclusion")
    require(all("side" not in v.lower() or v.lower() == "underside" for v in ab10["adoptedViews"][0]["views"]), "AB10 side must not be re-adopted")
    for ident in ["staff:S09", "staff:S10", "staff:S11", "staff:S12"]:
        p = rows[ident]["viewPolicy"]
        require("top" in p["adoptedViews"][0]["views"], "v3 staff TOP adopted locally")
    for ident in ["hands:AH07", "hands:AH08", "hands:AH10", "boots:AB01", "boots:AB02", "boots:AB03"]:
        p = rows[ident]["viewPolicy"]
        require(not p["sourcePolicy"]["isCurrentSelectedImage"], "historical policy must be scoped as superseded")
        require(p["adoptedViews"][0]["referencePath"] == rows[ident]["references"][0]["path"], "supplement views must come from the new selected image")
    require(rows["cloth:TR02"]["references"][0]["path"].endswith("TR02-method-b.png"), "unrecovered TR02 image must not be substituted")
    require(any("NOT recovered" in x for x in rows["cloth:TR02"]["viewPolicy"]["limits"]), "TR02 unresolved revision must remain explicit")
    return rows

rows = policy_invariants(new)
for path, manifest in inputs.items():
    p = ROOT / path
    require(p.exists() and digest(p) == manifest["sha256"] and p.stat().st_size == manifest["bytes"], "source hash: " + path)
    baseline = subprocess.run(["git", "show", BASE + ":" + path], cwd=ROOT, check=True, capture_output=True).stdout
    require(hashlib.sha256(baseline).hexdigest() == manifest["sha256"], "source differs from pinned commit: " + path)
require(inspection["newInspectedImageCount"] == len(inspection["files"]) == 7, "actual new visual scope")
require(inspection["notNewlyInspectedSelectedImageCount"] == 66, "do not imply full visual inspection")
unknown = [x["id"] for x in new["types"] if not any(v["views"] for v in x["viewPolicy"]["adoptedViews"])]
require(unknown == audit["rowsWithoutEnumeratedAdoptedViewLabels"], "missing labels must be disclosed")
copied = OUT / "finite-library-recovery-report.json"
require(digest(copied) == "056154864d5a824417542fcb9db65b94a9ebd6b1e26b8352b97f4387d478cf07", "Q-only derived Library report identity")
require(json.loads(copied.read_text())["provenance"]["isByteIdenticalCopy"] is False, "derived report must not claim byte identity")

# One adversarial check directly tests the failure that motivated this unit:
# silently dropping the old F17 side restriction must be detected.
bad = copy.deepcopy(new)
for row in bad["types"]:
    if row["id"] == "head:F17":
        row["viewPolicy"]["excludedElements"] = []
try:
    policy_invariants(bad)
except AssertionError as error:
    require(str(error) == "old F17 side rejection must survive", "negative control hit intended invariant")
else:
    raise AssertionError("negative control unexpectedly passed")

result = {"recordedAt": datetime.now(timezone.utc).isoformat(), "sourceCommit": BASE,
          "sourceFilesComparedToPinnedGitBytes": len(inputs), "typeRowsPreserved": 120,
          "uniquePlacementsPreserved": 287, "selectedOriginalPNGsPreserved": 73,
          "allAdoptedPathsSelectedAndAuthoritiesResolved": True,
          "criticalExclusionsAndSupplementSelectionChecks": "passed",
          "negativeControlDroppedF17SideRejection": "detected",
          "newVisualInspectionCount": 7, "unenumeratedViewLabelTypes": len(unknown),
          "oldTableUnchanged": True, "wholeAssemblyAccepted": False,
          "libraryRecoveryDerivedReportSHA256": digest(copied),
          "scriptElapsedSeconds": round(time.perf_counter() - START, 6),
          "gameOrGeometryTestsRun": False, "newGeometry": 0, "runtimeChanges": 0,
          "remoteWrites": 0, "unfinishedToolsAtScriptEnd": 0}
(OUT / "CHECKS.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
print(json.dumps(result, ensure_ascii=False))
