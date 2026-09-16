from pathlib import Path
import json,csv,hashlib,math,datetime
out=Path(__file__).parent
rows=[]
def part(id,side,shape,dim,neighbors,source,reuse,note=''):
 rows.append({'id':id,'side':side,'shape':shape,'approxDimensionsMetres':dim,'adjacent':neighbors,'reference':source,'existingCandidateReuse':reuse,'constraint':note,'microReferenceStatus':'not generated; current seven sheets are coarse context only'})
# Split every curved strip into small surface patches. An instance is not a draw call.
def strip(prefix,sectors,bands,width,height,source,reuse,frontOpen=False):
 for j in range(bands):
  for i in range(sectors):
   angle=(i+.5)/sectors*2*math.pi
   side='R' if math.sin(angle)>0 else 'L'
   neighbors={}
   if j>0:neighbors['top']=f'{prefix}-{j-1:02d}-{i:02d}.bottom'
   if j<bands-1:neighbors['bottom']=f'{prefix}-{j+1:02d}-{i:02d}.top'
   if i>0 or not frontOpen:neighbors['left']=f'{prefix}-{j:02d}-{(i-1)%sectors:02d}.right'
   if i<sectors-1 or not frontOpen:neighbors['right']=f'{prefix}-{j:02d}-{(i+1)%sectors:02d}.left'
   part(f'{prefix}-{j:02d}-{i:02d}',side,'one shallow curved quad, at most one primary fold/crease',{'width':round(width/sectors,3),'height':round(height/bands,3)},neighbors,source,reuse,'3×3 to 4×4 control grid; no whole sleeve/torso/cape in one part. Open edges stay unjoined.' if frontOpen else '3×3 to 4×4 control grid; shared edge control IDs and weights before welding.')
strip('UP',8,4,1.35,.60,'upper + assembly','Existing torso cross-section dimensions only; armhole boundary must be split using canonical micro references.')
for side in ['L','R']:
 strip('SL'+side,4,3,.52,.64,'upper + assembly ELBOW90/ARMRAISED','Existing sewn loop IDs may be reused after gap/normal checks; sleeve fullness is not accepted.')
 for r in rows:
  if r['id'].startswith('SL'+side):r['side']=side
strip('COL',8,1,.56,.082,'assembly neckline','Candidate neck opening and base rig dimensions may be reused; small collar arc surface needs micro reference.')
strip('COW',8,5,1.40,.34,'assembly neckline + cape-v2','Candidate cowl folds/contacts failed; retain only inner neck interface, redraw each fold strip from new references.')
strip('LOW',8,3,1.75,.505,'lower FRONT/BACK + assembly waist','Candidate split and waist dimensions only; cloth/trouser clearance not accepted.',True)
strip('CAP',8,4,1.85,1.205,'cape-v2 + complete','Candidate wrap layout as scaffold only; old back-cape deformation fails, so no accepted deformation reuse.',True)
strip('BLT',8,1,1.24,.082,'lower FRONT + assembly waist','Candidate waist curve may be reused after layer-clearance check.')
for side in ['L','R']:
 strip('CUF'+side,4,2,.34,.20,'hands-staff cuff + upper','Candidate cuff coverage/rig endpoints only; crossing wrap bands need their own micro references.')
 for r in rows:
  if r['id'].startswith('CUF'+side):r['side']=side
 for band in range(3):
  part(f'WRP-{side}-{band}',side,'one narrow crossing leather ribbon with four edge controls',{'width':.012,'length':.15},[f'CUF{side}-00-*',f'CUF{side}-01-*'],'hands-staff','No modeled cross-wrap ribbon in current candidate; new reference required.','Ribbon follows cuff surface with defined clearance; does not bind rigidly across a bending joint.')
for name,side,radius in [('BUCKLE','C',.036),('HANGER','R',.027),('BROOCH-L','L',.027),('BROOCH-R','R',.027)]:
 for i in range(4):
  part(f'{name}-ARC-{i}',side,'one quarter-annulus with explicit front/back bevel',{'arcLength':round(radius*math.pi/2,3),'outerRadius':radius,'thickness':.007},[f'{name}-ARC-{(i-1)%4}',f'{name}-ARC-{(i+1)%4}'],'lower FRONT' if name in ['BUCKLE','HANGER'] else 'complete + assembly brooch','Candidate local ring path/tangent frame may be reused; decorative reference match not verified.','Four matching quarters form one closed ring. Hardware uses existing brass batch.')
 if name.startswith('BROOCH'):
  part(name+'-DISC',side,'one shallow convex disc with ring seat',{'diameter':.042,'depth':.006},[name+'-ARC-*'],'complete + assembly brooch','Candidate tangent plane and centre position only.','No floral/spiral design invented; canonical ornament must be fixed first.')
for i in range(3):
 part(f'TONGUE-{i}','R','one straight or tapered leather strip section',{'width':.048,'height':.117},['HANGER-ARC-*' if i==0 else f'TONGUE-{i-1}',f'TONGUE-{i+1}' if i<2 else 'free tip'],'lower FRONT','Existing strip centreline reusable only after front-layer clearance checks.','Three strips form one hanging belt tail; shared edge ID, no independent floating pieces.')
part('BUCKLE-PIN','C','one short bent pin with hinge end',{'length':.041,'radius':.003},['BUCKLE-ARC-*','BLT-00-*'],'lower FRONT + assembly waist','Not present as a complete candidate part.','Exact hole/pin relation must be supplied in the micro reference.')
interfaces=[
 {'id':'NECK','space':'chest local','centre':[0,.600,0],'outerOpening':[.089,.083],'collarTopY':.644,'owner':'cloth / head neck-cut boundary'},
 {'id':'ARMHOLE-L/R','space':'shared logical cloth vertices','countEach':16,'owner':'cloth torso/sleeve; same position/normal/weight on both sides'},
 {'id':'WRIST-L/R','space':'chest local','centres':[[-.313,-.18,0],[.313,-.18,0]],'owner':'cloth cuff / accessory hands'},
 {'id':'WAIST','space':'chest local','y':.020,'radii':[.216,.145],'owner':'cloth upper/lower/belt, no second free upper hem'},
 {'id':'BOOT-L/R','space':'knee local','y':-.095,'owner':'existing trousers / accessory boot upper edge, unchanged here'}]
plan={'schema':1,'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'status':'draft micro-part specification, no image generation or runtime changes. User requested all fine parts first, then assembly. Not a speed guarantee.','preservedCandidateCommit':'3afcb955f6c2f698fe42148de88a32760da28b1c','coordinateConvention':'+X character right, +Z front, +Y up; dimensions are authored rig-based estimates, not measurements recovered from generated images.','instances':len(rows),'parts':rows,'interfaces':interfaces,'assemblyContract':['Whole image fixes proportion; per-part orthographic front/back/side and one corner view fix thickness and edge IDs.','Each neighboring edge uses one canonical sampled curve and one skin-weight list; source image discrepancies are resolved before model construction.','Build one small surface, check its boundary against neighbors, then merge/weld. Part count is not draw count; preserve shared materials and bone palette.','Reuse reflected shape only when opposite-hand assembly direction is documented; do not repeat cape-v1 same-side error.','Canonical image ID + part ID + neighbor edges must be explicit for every pictured part; no generic ornament sheets.','No resumed large-garment modeling until these references and seam constraints are fixed. Existing rejected intersections are not grandfathered in.']}
(out/'parts.json').write_text(json.dumps(plan,indent=2)+'\n')
with (out/'parts.csv').open('w',newline='') as f:
 w=csv.writer(f);w.writerow(['ID','Side','Shape','Approx_dimensions_m','Adjacent_edges','Reference','Reuse','Required_before_model'])
 for p in rows:w.writerow([p['id'],p['side'],p['shape'],json.dumps(p['approxDimensionsMetres']),json.dumps(p['adjacent']),p['reference'],p['existingCandidateReuse'],p['constraint']])
