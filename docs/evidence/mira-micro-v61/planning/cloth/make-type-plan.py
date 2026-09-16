from pathlib import Path
import csv,json,math,datetime
p=Path(__file__).parent
# One line is a geometric type, not an arbitrary grid tile. R=-X, L=+X.
data='''T01|front centre panel|shallow tapered loft|135,500,18|R,L|T03/T05; top T04/C01; bottom WAIST|upper/assembly|torso cross-section scale only
T02|rear quarter panel|shallow tapered loft|180,500,20|R,L|T03; top T04/C02; bottom WAIST|upper/complete BACK|scale only
T03|underarm side panel|curved trapezoid|150,330,30|R,L|front T01; rear T02; top T05; bottom WAIST|assembly ARMRAISED|armhole interface IDs, current fit failed
T04|shoulder bridge|saddle patch|130,180,45|R,L|inner COLLAR; T01/T02; outer ARMHOLE|upper/assembly|rig shoulder location only
T05|armhole gusset half|shallow crescent patch|100,160,25|R-front,R-rear,L-front,L-rear|shared ARMHOLE16; T03/T04; S01/S02|assembly ELBOW90/ARMRAISED|sewn logical edge after new reference fit
S01|upper sleeve front|tapered half-shell|170,250,80|R,L|ARMHOLE; side S02; bottom S03/S04|upper/assembly|joint centres only
S02|upper sleeve rear|tapered half-shell|170,250,80|R,L|ARMHOLE; side S01; bottom S03/S04|upper/assembly|same operator as S01, distinct boundary profile
S03|outer elbow fold|one rounded convex fold strip|180,90,22|R,L|top S01/S02; bottom S05/S06; ends S04|assembly ELBOW90|no accepted fold reuse
S04|inner elbow gusset|shallow concave patch|110,90,18|R,L|top S01/S02; bottom S05/S06; ends S03|assembly ELBOW90|joint centre and clearance only
S05|forearm sleeve front|tapered half-shell|120,190,55|R,L|S03/S04; sides S06; bottom CUFF|upper/hands|joint boundaries only
S06|forearm sleeve rear|tapered half-shell|120,190,55|R,L|S03/S04; sides S05; bottom CUFF|upper/hands|same operator as S05, distinct seam profile
C01|front stand-collar half|open curved strip|115,82,4|R,L|lower T01/T04; back C02; front OPEN|assembly neckline|candidate neck ellipse after head interface check
C02|rear stand collar|U-shaped extrusion|300,82,4|C|lower T02/T04; ends C01|assembly neckline/BACK|neck interface only
W01|front cowl fold|one draped U-fold strip|400,50,25|0,1,2|ends W02; adjacent W01|assembly neckline|one type, explicit offset/depth variants
W02|side cowl bridge|crescent patch|140,190,45|R,L|front W01; rear W03; lower P04; brooch seat|cape-v2 shoulder join|tangent frame only; contacts failed
W03|rear cowl fold|one soft V-fold strip|410,65,45|0,1,2|ends W02; upper C02; lower P04|cape-v2 BACK|unworn back drape, not wearable hood
P01|cape rear panel|one long falling-fold loft|220,1100,45|R,L|rear centre; outer P02; top P04; bottom HEM|complete BACK/cape-v2|proportion only, old deformation rejected
P02|cape side panel|one long falling-fold loft|280,1120,55|R,L|rear P01; front P03; top P04; bottom HEM|cape-v2 opposite sides|new micro reference; preserve side wrap
P03|cape front-edge panel|curved wedge loft|160,1050,35|R,L|outer P02; top W02/P04; inner OPEN; bottom HEM|cape-v2 FRONT/oblique|opening angle only
P04|cape shoulder connector|saddle patch|230,160,50|R,L|inner W02/W03; outer P01/P02/P03|cape-v2 INSIDE JOIN|layer/support order must be defined
L01|lower front panel|flared shallow loft|220,505,35|R,L|WAIST; side L03; inner L04/OPEN; bottom L05|lower FRONT/assembly|waist/split proportions only
L02|lower rear panel|flared shallow loft|240,505,35|R,L|WAIST; side L03; rear centre; bottom L05|lower BACK|no accepted trouser clearance
L03|lower side insert|narrow flared loft|150,505,30|R,L|WAIST; front L01; rear L02; bottom L05|lower sides|width based on shape, not grid subdivision
L04|split-edge turnback|thin curved extrusion|12,505,3|R,L|fold along L01 front edge; inside free edge|lower FRONT|open-edge topology only
L05|hem turnback|thin curved extrusion|220,12,3|front-R,front-L,side-R,side-L,rear-R,rear-L|corresponding lower panel hem; joined endpoints|lower/complete|shared cross-section along six hem curves
B01|belt segment|curved solid strip|300,82,6|front-R,front-L,rear-R,rear-L|continuous WAIST path|lower FRONT/assembly|waist curve only; one waist layer
B02|hanging belt tail|tapered strip with one bend|48,350,5|R|top B03-hanger; bottom FREE|lower FRONT|centreline only
B03|hardware ring|bevelled oval extrusion|72,60,7|buckle-C,hanger-R|belt or tail hinge; closed opening|lower FRONT|one type; hanger variant54x60mm
B04|buckle pin|one bent rod|41,6,6|C|hinge B03; tip explicit belt hole|assembly waist|missing complete candidate pin
F01|cuff front half|tapered half-shell|115,200,6|R,L|top CUFF; side F02; bottom WRIST|hands/upper|rig endpoints only
F02|cuff rear half|tapered half-shell|115,200,6|R,L|top CUFF; side F01; bottom WRIST|hands/upper|same operator, distinct closure edges
F03|cross-wrap ribbon|thin ribbon following cuff curve|12,150,3|R-0,R-1,R-2,L-0,L-1,L-2|F01/F02; explicit overlap order|hands-staff|new reference, no joint-spanning rigid strip
F04|brooch centre|shallow convex disc|42,42,6|R,L|seat W02; rim F05|complete/assembly|cowl tangent only
F05|brooch rim|bevelled circular extrusion|54,54,7|R,L|inner F04; back W02|complete/assembly|shared mirrored type, no invented spiral motif'''
types=[];instances=[]
for row in data.splitlines():
 id,name,shape,dim,where,edges,ref,reuse=row.split('|');ids=[id+'-'+a for a in where.split(',')]
 types.append({'typeID':id,'name':name,'singleOperationShape':shape,'approxSizeMm':list(map(int,dim.split(','))),'instances':ids,'edgeContract':edges,'canonicalContext':ref,'reuseLimit':reuse,'microReference':'not yet generated'})
 for suffix,idinstance in zip(where.split(','),ids):
  side='Right (-X)' if 'R' in suffix.split('-') else 'Left (+X)' if 'L' in suffix.split('-') else 'Centre/shared'
  instances.append({'id':idinstance,'type':id,'anatomicalSide':side})
result={'schema':2,'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'status':'draft; no generation or runtime implementation','coordinates':'Anatomical Right=-X, Left=+X, front=+Z. Camera +Z: Right on image left. Bone suffix0=-X,1=+X is an index, not anatomical naming.','types':types,'instances':instances,'typeCount':len(types),'instanceCount':len(instances),'generationEstimate':{'microSheetsAtMostFourTypesPerSheet':math.ceil(len(types)/4),'joinSheets':3,'totalPlanningSheets':math.ceil(len(types)/4)+3,'meaning':'Planning estimate, no images generated and no time guarantee. Repeated geometry uses one reference plus explicit placement/handedness map.'},'candidateCommit':'3afcb955f6c2f698fe42148de88a32760da28b1c','rejectedDraft':'rejected-grid-draft: uniform212 tiles and old +X-right convention are not final specification'}
(p/'types.json').write_text(json.dumps(result,indent=2)+'\n')
with (p/'types.csv').open('w',newline='') as f:
 w=csv.writer(f);w.writerow(['Type_ID','Name','Single_simple_shape','Approx_mm','Instances','Adjacent','Context','Reuse_limit'])
 for t in types:w.writerow([t['typeID'],t['name'],t['singleOperationShape'],t['approxSizeMm'],','.join(t['instances']),t['edgeContract'],t['canonicalContext'],t['reuseLimit']])
print(json.dumps({'types':len(types),'instances':len(instances),'generationEstimate':result['generationEstimate']}))
