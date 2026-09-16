from pathlib import Path
from PIL import Image
import json,hashlib,time,datetime
began=time.perf_counter();out=Path(__file__).parent;base=out.parents[2]/'micro-references/head';refs=out.parents[2]/'references'
# Inputs are readonly. Only this review directory is written.
assert base.is_dir(),base
manifest=json.loads((base/'HASHES.json').read_text());inputs=[]
for name,v in manifest['files'].items():
 f=base/name;b=f.read_bytes();h=hashlib.sha256(b).hexdigest();assert len(b)==v['bytes'] and h==v['sha256'];inputs.append({'path':str(f),'bytes':len(b),'sha256':h})
parts=json.loads((base/'face-patches-manifest.json').read_text())
for v in parts['originalReferenceFiles']:
 f=Path(v['file']);b=f.read_bytes();h=hashlib.sha256(b).hexdigest();assert len(b)==v['bytes'] and h==v['sha256'];inputs.append({'path':str(f),'bytes':len(b),'sha256':h})
f=base/'mira-face-patches-F01-F05-F09-v2.png';im=Image.open(f);im.verify();im=Image.open(f);im.load();size=im.size;assert list(size)==parts['actualDimensions']
# Hand-read approximate extents in the displayed ORIGINAL 1448x1086 image.
# These are NOT segmentation or camera calibration. A few pixels of ambiguity exist.
bounds={'F01-L':{'front':[433,110,639,289],'profile':[748,88,809,341],'back':[918,112,1128,299],'threeQuarter':[1243,108,1390,298]},'F05-L':{'front':[437,426,632,665],'profile':[750,420,821,666],'back':[933,424,1123,664],'threeQuarter':[1247,421,1385,663]},'F09-L':{'front':[445,746,621,957],'profile':[750,742,810,967],'back':[934,749,1114,956],'threeQuarter':[1249,746,1390,970]}}
readings=[]
for id,b in bounds.items():
 wh={k:[v[2]-v[0],v[3]-v[1]] for k,v in b.items()};readings.append({'id':id,'approxManualBoundsPx':b,'approxWidthHeightPx':wh,'profileToFrontHeightRatio':round(wh['profile'][1]/wh['front'][1],3),'obliqueToFrontWidthRatio':round(wh['threeQuarter'][0]/wh['front'][0],3)})
r={'fixedUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'inputs':inputs,'candidateSize':size,'mode':im.mode,'fileValidation':'8 author manifest files plus2 canonical reference hashes/bytes match; full candidate PNG decode completed','manualMeasurements':{'method':'Reviewer manually estimated outer shape extents from view_image. Not pixel segmentation, exact angle proof, calibrated ratio, fit to source mesh or artwork scoring.','readings':readings},'scope':'Independent author-blindness not claimed: supplied source and author report were read, but judgments use direct image inspection/manifest/source constraints, not author self-grade. No image generation/editing, source edits, new geometry, WebGL or perception benchmark.','mechanicalReadCheckSeconds':time.perf_counter()-began,'knownPendingSessions':[]}
(out/'audit.json').write_text(json.dumps(r,indent=2)+'\n');print(json.dumps({'size':size,'inputsMatched':len(inputs),'mechanicalSeconds':r['mechanicalReadCheckSeconds']}))
