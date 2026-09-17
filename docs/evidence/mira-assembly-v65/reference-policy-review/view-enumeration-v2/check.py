#!/usr/bin/env python3
"""Check real observation coverage, saved source bytes, and preservation of prior exclusions."""
import copy
import hashlib
import json
import time
from datetime import datetime, timezone
from pathlib import Path

START = time.perf_counter()
OUT = Path(__file__).resolve().parent
ROOT = OUT.parents[4]
def load(p): return json.loads(p.read_text())
def digest(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def require(ok, message):
    if not ok: raise AssertionError(message)
prior = load(OUT.parent / "WHOLE_REFERENCE_SELECTION.proposed.json")
new = load(OUT / "WHOLE_REFERENCE_SELECTION.proposed.json")
records = load(OUT / "IMAGE_INSPECTION.json")["files"]
inputs = load(OUT / "SOURCE_HASHES.json")
for path, sha in inputs.items(): require(digest(ROOT / path) == sha, "source bytes changed: " + path)
observed = {t:r for r in records for t in r["types"]}
require(len(records) == 36 and len(observed) == 60, "exact actual observation coverage")
def validate(candidate):
    require(len(candidate["types"]) == 120 and not candidate["allReferencesAssemblyReady"], "no assembly inflation")
    for before, after in zip(prior["types"], candidate["types"]):
        require({k:v for k,v in before.items() if k != "viewPolicy"} == {k:v for k,v in after.items() if k != "viewPolicy"}, "original row fields changed")
        p, q = before["viewPolicy"], after["viewPolicy"]
        require(not q["exactProjectionAccepted"] and not q["numericalAssemblyAccepted"], "no metric acceptance")
        require(all(x in q["excludedElements"] for x in p["excludedElements"]), "prior exclusion lost")
        require(all(x in q["limits"] for x in p["limits"]), "prior limit lost")
        require(any(x["views"] for x in q["adoptedViews"]), "local labels still unknown")
        if after["id"] in observed:
            r = observed[after["id"]]
            require(q["adoptedViews"][0]["referencePath"] == r["path"] and q["adoptedViews"][0]["views"] == r["labels"], "invented or misassigned observed panel")
            require(not r["cameraDirectionsCalibrated"] and not r["completeAssemblySufficient"], "observation overclaim")
        else: require(p == q, "uninspected type policy changed")
    refs = [r["path"] for t in candidate["types"] for r in t["references"]]
    placements = [p for t in candidate["types"] for p in t["instances"]]
    require(len(set(refs)) == 73 and len(placements) == len(set(placements)) == 287, "source identity/count")
validate(new)
bad = copy.deepcopy(new)
next(x for x in bad["types"] if x["id"] == "head:F01")["viewPolicy"]["excludedElements"] = []
try: validate(bad)
except AssertionError as e: require(str(e) == "prior exclusion lost", "negative control wrong failure")
else: raise AssertionError("dropped exclusion went undetected")
bad = copy.deepcopy(new)
next(x for x in bad["types"] if x["id"] == "cloth:F04")["viewPolicy"]["adoptedViews"][0]["views"].append("unshown rear clasp detail")
try: validate(bad)
except AssertionError as e: require(str(e) == "invented or misassigned observed panel", "negative control wrong failure")
else: raise AssertionError("invented panel went undetected")
result = {"recordedAt": datetime.now(timezone.utc).isoformat(), "passed": True, "types": 120, "placements": 287, "selectedPNGs": 73,
          "actualNewPNGs": 36, "previouslyUnknownTypesResolvedAsLocalViews": 60, "remainingUnknownTypes": 0,
          "allPriorExclusionsAndLimitsPreserved": True, "uninspectedPoliciesUnchanged": True,
          "negativeControls": ["dropped prior exclusion detected", "invented panel detected"], "assemblyAccepted": False,
          "scriptElapsedSeconds": round(time.perf_counter() - START, 6), "pendingToolsAtScriptEnd": 0}
(OUT / "CHECKS.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
print(json.dumps(result, ensure_ascii=False))
