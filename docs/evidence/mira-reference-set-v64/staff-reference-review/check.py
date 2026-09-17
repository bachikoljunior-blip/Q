"""Read original PNG pixels and pinned native JSON; never write or transform images."""
import pathlib, json, hashlib, subprocess, datetime, time
from PIL import Image

t0=time.perf_counter()
ROOT=pathlib.Path('/workspace/scratch/e72662e3b71f')
OUT=pathlib.Path(__file__).resolve().parent
SOURCE=ROOT/'q-character-reference-v64/staff-reference-set'
REPO=ROOT/'Q-mira-micro-v63'
COMMIT='b21985680bb43a3be5a2c4d2244e6b6d24b5af69'
sha=lambda b:hashlib.sha256(b).hexdigest()
def dump(n,d): (OUT/n).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
inputs=[]
files=[SOURCE/n for n in ['staff-ribs-top-corrected-v3.png','S05-flat-blank-v2.png','GENERATIONS.json','STAFF_REFERENCE_COVERAGE.json','STAFF_ASSEMBLY_MAPPING.json']]
files += [REPO/'docs/evidence/mira-micro-v62/references/staff-ribs/staff-ribs-micro-v2.png',REPO/'docs/evidence/mira-staff-v63/references/S05-flat-blank-v1.png']
for p in files:
    b=p.read_bytes();r={'path':str(p),'bytes':len(b),'sha256':sha(b)}
    if p.suffix=='.png':
        with Image.open(p) as im:r['dimensions']=list(im.size)
    inputs.append(r)
    if p.name in ['STAFF_REFERENCE_COVERAGE.json','STAFF_ASSEMBLY_MAPPING.json','GENERATIONS.json']:
        (OUT/('snapshot-'+p.name)).write_bytes(b)
coverage=json.loads((SOURCE/'STAFF_REFERENCE_COVERAGE.json').read_text())
mapping=json.loads((SOURCE/'STAFF_ASSEMBLY_MAPPING.json').read_text())
assert len(coverage['rows'])==18 and sum(len(x['instances']) for x in coverage['rows'])==19
assert len(mapping['instances'])==19 and len(mapping['interfaces'])==24
assert mapping['sourceCommit']==COMMIT
assert sha((SOURCE/'STAFF_ASSEMBLY_MAPPING.json').read_bytes())=='2858b0f90574d3652d6c26fbf34cc9f259ab58d83fe24012c0786360c5391a99'
assert mapping['nativeMatrixWorldTranslationUnits'].startswith('metres')
assert mapping['boundsMmUnits']=='millimetres' and mapping['interfaceNominalYmmUnits']=='millimetres'
nativepath='docs/evidence/mira-staff-v63/assembly/parts.json'
raw=subprocess.check_output(['git','show',COMMIT+':'+nativepath],cwd=REPO)
inputs.append({'path':nativepath,'gitCommit':COMMIT,'sha256':sha(raw),'bytes':len(raw)})
native={p['id']:p for p in json.loads(raw)}
assert set(native)=={x['id'] for x in mapping['instances']}
checks=[]
for item in mapping['instances']:
    part=native[item['id']];m=part['matrixWorld'];p=part['positions']
    assert m==item['nativeMatrixWorldColumnMajor']
    points=[]
    for i in range(0,len(p),3):
        x,y,z=p[i:i+3]
        points.append([1000*(m[k]*x+m[k+4]*y+m[k+8]*z+m[k+12]) for k in range(3)])
    bounds={'min':[min(p[k] for p in points) for k in range(3)],'max':[max(p[k] for p in points) for k in range(3)]}
    error=max(abs(bounds[a][k]-item['boundsMm'][a][k]) for a in ['min','max'] for k in range(3))
    assert error<1e-9
    assert item['nativeVertices']==len(part['positions'])//3 and item['triangles']==len(part['indices'])//3
    checks.append({'id':item['id'],'nativeMatrixExact':True,'boundsRecomputeMaxErrorMm':error})
assert all(p['a'] in native and p['b'] in native for p in mapping['interfaces'])

# Native geometry is not regenerated. This establishes origin and units only,
# and does not re-prove the 24 contact/retention descriptions geometrically.
imagepath=SOURCE/'S05-flat-blank-v2.png'
im=Image.open(imagepath).convert('RGB')
rois={'outer':[35,165,1503,219],'inner':[35,369,1503,421],'side':[35,559,1503,580],'end':[120,792,333,862]}
measurements=[]
for threshold in [5,8,12]:
    panels={}
    for name,(x0,y0,x1,y1) in rois.items():
        points=[]
        for y in range(y0,y1):
            for x in range(x0,x1):
                r,g,b=im.getpixel((x,y))
                if r-b>threshold and r-g>threshold/2: points.append((x,y))
        xs=[p[0] for p in points];ys=[p[1] for p in points]
        bounds=[min(xs),min(ys),max(xs)+1,max(ys)+1]
        width=bounds[2]-bounds[0];height=bounds[3]-bounds[1]
        panels[name]={'rasterBoundsXYXY':bounds,'width':width,'height':height,'visibleBoundsWidthHeight':width/height}
    measurements.append({'redBlueThreshold':threshold,'redGreenThreshold':threshold/2,'panels':panels})
dump('INPUTS.json',{'inputs':inputs,'imagesEdited':False,'newImagesGenerated':False})
dump('RESULTS.json',{'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),
 'sourceCommit':COMMIT,'mappingChecks':checks,'interfaces':{'count':24,'allEndpointsResolve':True,'kind':'native-authored contacts/retentions; not 24 verified welds and not derived from PNGs'},
 'unitCorrection':{'initialMappingSHA256':'6910cd3e5e7974e5f7cb8c3d6f04fffaf7e6c5303d26182f33d57eecb854e4e0','finalMappingSHA256':sha((SOURCE/'STAFF_ASSEMBLY_MAPPING.json').read_bytes()),'translationUnits':'metres','boundsUnits':'millimetres','nominalContactYUnits':'millimetres','numericMatricesAndBoundsExactToPinnedNative':True},
 's05PixelObservation':{'method':'Read-only brown-colour bounding pixels inside visually chosen panel ROIs, with three thresholds. This measures the bitmap, not a calibrated object. Rounded edges, texture and shadow affect bounds.','rois':rois,'thresholdRuns':measurements,
 'notAnExactCrossViewGeometricContradictionProof':True,'thinSideUncertainty':'Only 11–14 colour pixels high; pixel/edge/shadow uncertainty is a large fraction. Camera calibration and per-panel scale are absent.',
 'promptTargets':{'lengthWidth':43,'widthThickness':5},'promptIsNotMeasurement':True},
 'elapsedScriptSeconds':time.perf_counter()-t0,'newGeometryCreated':0,'gameRendererRuns':0,'imageWrites':0,'sourceEdits':0,'unfinishedSessions':0})
print(json.dumps({'instances':19,'interfaces':24,'matricesExact':True,'maxBoundsErrorMm':max(x['boundsRecomputeMaxErrorMm'] for x in checks),'scriptSeconds':time.perf_counter()-t0}))
