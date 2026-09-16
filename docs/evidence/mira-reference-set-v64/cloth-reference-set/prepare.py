from pathlib import Path
import json,hashlib,datetime
root=Path('/workspace/scratch/e72662e3b71f/Q-mira-cloth-join-v64');out=Path(__file__).parent
old=root/'docs/evidence/mira-micro-v61/planning/cloth/types.json';p=json.loads(old.read_text());by={t['typeID']:t for t in p['types']}
refroot=root/'docs/evidence/character-reference-v60/references'
refs={'full':'mira-complete-six-views-v1.png','upper':'mira-upper-views-v1.png','cape':'mira-cape-views-v2.png','lower':'mira-lower-views-v1.png','hands':'mira-hands-staff-views-v1.png','assembly':'mira-garment-assembly-v1.png'}
groups=[(['T02','T03','T04'],['full','upper','assembly']),(['T05','S01','S02'],['full','upper','assembly']),(['S03','S04','S06'],['full','upper','assembly']),(['C01','C02','W01'],['full','assembly','cape']),(['W02','W03','P03'],['full','cape','assembly']),(['P04','L01','L02'],['full','cape','lower','assembly']),(['L03','L04','L05'],['full','lower','assembly']),(['B01','B02','B03'],['full','lower','assembly']),(['B04','F01','F02'],['full','hands','lower']),(['F03','F04','F05'],['full','hands','assembly'])]
specific={
'T02':'ONE rear torso quarter, from under the shoulder bridge down to the belt waist, gently fitted at waist. Not a whole torso; no sleeve, collar or cape.',
'T03':'ONE underarm side trapezoid, shallow wrap between front and rear torso; top follows the armpit. No arm or whole shirt.',
'T04':'ONE small shoulder bridge saddle between front/rear torso, neck opening and outer armhole. Just one broad bend, not shoulder armour.',
'T05':'ONE shallow crescent gusset half of an armhole, open on both long edges, a narrow curved cloth patch, not an entire sleeve ring.',
'S01':'ONE tapered open front half of the upper sleeve, wider at shoulder and narrower above elbow; one shallow barrel curve, no elbow/cuff/arm.',
'S02':'ONE complementary open rear half of the upper sleeve, slightly fuller rear surface, matching S01 side edges; not a full tube.',
'S03':'ONE narrow cloth strip with one broad rounded outward elbow fold. Not a stack of pleats, no entire sleeve.',
'S04':'ONE shallow concave inner-elbow gusset, broad smooth depression for a bent elbow, no extra folds.',
'S06':'ONE open rear forearm sleeve half-shell, narrowing toward wrist, counterpart of existing S05 front half; no bracer or hand.',
'C01':'ONE front half of the upright neck collar, thin open curved strip, open front edge and rear joining edge. Not a complete collar ring.',
'C02':'ONE rear U-shaped upright collar strip, open at both front ends that join C01, no front fastening.',
'W01':'ONE soft shallow U-shaped cowl fold strip across upper chest, single fold only; no whole scarf and no hood.',
'W02':'ONE small side-cowl crescent bridge, joining front drape to rear drape over shoulder; brooch seat is a small plain patch, no attached brooch.',
'W03':'ONE broad shallow soft V-shaped back cowl fold strip, one fold only. It lies on upper back and is NOT a wearable hood.',
'P03':'ONE long narrow cape front-opening wedge panel, upper end narrow near shoulder, lower end slightly broader; gentle wrap, one curve, no whole cape.',
'P04':'ONE small complete right shoulder cape connector saddle, approximately wider than tall, covering the transition from cowl below to the upper ends of three cape strips. Not merely the old narrow P04-RB back subsection, and not a whole mantle.',
'L01':'ONE lower-front long tunic panel from belt seam to knee-level hem, slight flare, open centre split edge. Not the complete skirt or any leg.',
'L02':'ONE lower-back long tunic panel from belt seam to hem, slight flare and shallow curve, no entire skirt.',
'L03':'ONE narrow flared side insert of the lower tunic, long trapezoid with mild wrap, from waist seam to hem.',
'L04':'ONE very narrow turnback strip folded ONCE along the centre split edge of the lower-front tunic, not a wide decorative band.',
'L05':'ONE short gently curved hem turnback strip with a single thin folded cross-section, a reusable section following the lower tunic hem. Not the full hem ring.',
'B01':'ONE plain dark worn brown leather belt arc segment, one smooth curve, no buckle, stitching only at true belt edges.',
'B02':'ONE tapered leather hanging belt tail with a single soft bend and pointed bottom. Canonical hanging tail is on anatomical LEFT (+X), image RIGHT in frontal placement; keep old type ID B02 but do not label it anatomical right.',
'B03':'ONE worn bronze oval hardware ring with one bevelled round-section rim and open centre. Show a plain ring alone, no pin/strap; catalogue type shared by central buckle and smaller anatomical LEFT hanger.',
'B04':'ONE small bronze buckle pin, a single bent rod with hinge curl at one end and straight blunt tip; not the entire buckle.',
'F01':'ONE dark-brown leather bracer FRONT open tapered half-shell, fitted over forearm, no wrap ribbons, hand or whole sleeve.',
'F02':'ONE complementary dark-brown leather bracer REAR open tapered half-shell, not a full tube; plain seam edges, no wrap ribbons.',
'F03':'ONE thin dark leather cross-wrap ribbon following a bracer arc, one simple strip with slight twist. Only one ribbon, not all X-wraps or entire bracer.',
'F04':'ONE shallow convex bronze brooch centre disc, plain gently domed metal, no ornament engraving and no outer rim.',
'F05':'ONE shallow bevelled circular bronze brooch rim ring, open centre sized to surround F04 disc, no entire assembled brooch.'}
common='''Use case: stylized-concept. Asset type: multi-angle micro-part reference sheet for the SAME Mira clothing in the references. These are shape references for a later 3D assembly, NOT finished 3D, NOT a screenshot, NOT a sewing pattern or precision CAD.
Create a clear landscape sheet with exactly THREE horizontal rows, one isolated type per row. In each row show the SAME individual small curved part in four consistent angles: OUTER FACE, TRUE PROFILE, INNER FACE, THREE-QUARTER, then a small PLACEMENT locator at far right on the matching complete garment. The locator marks only that one small region in muted orange; the locator is not an extra part type. Large black readable part ID at row left. Light neutral grey background; diffuse even lighting and soft shadow to expose curvature. Keep profile a genuine narrow edge view and inner view the opposite side of the SAME surface. No different shape variants in different angles.
References: first image governs finished identity, subdued cloth colour and whole proportion; other images give matching garment construction. Use plain matte muted grey-olive/taupe wool for cloth, dark worn brown for leather, aged bronze for metal. Ignore decorative spiral/brocade motifs in cape source. Absolutely no invented ornament, no pattern, no thick cutaway rim, no arbitrary patch-border piping, no grid, no armour, no full garment replacing a small part. Show thin cloth with unobtrusive raw cut edges at internal subdivision boundaries; true hems are only for explicit turnback strips. Preserve the original overall clothing design, not new fashion.
Anatomical RIGHT is -X, LEFT is +X, FRONT is +Z. Front locator: character right/staff is image left; rear locator: character right/staff is image right. Represent the right-hand instance for symmetric cloth parts, with the mirrored left as a future shared-type placement, not an unrelated design. Exception hanging belt tail/hanger is anatomical LEFT (front image right). These are visual shapes only; exact size, seams, weights and placements are defined in a separate author ledger. Do not print numerical dimensions.
'''
sheets=[]
for n,(ids,rids) in enumerate(groups,1):
 sid=f'cloth-{n:02d}';prompt=common+'\nThe three rows, top to bottom:\n'+'\n'.join(f'{i+1}. Label exactly "{k}". {specific[k]} Neighbours for placement only: {by[k]["edgeContract"]}.'for i,k in enumerate(ids))
 pp=out/f'{sid}-prompt.txt';pp.write_text(prompt+'\n')
 sheets.append({'sheetID':sid,'types':ids,'status':'planned-not-submitted','prompt':str(pp),'referencePaths':[str(refroot/refs[k]) for k in rids],'requestedViews':['outer','true-profile','inner','three-quarter','placement'],'imagePath':None})
existing={k:{'status':'independent-shape-only-conditional','file':str(root/'docs/evidence/mira-micro-v61/references/cloth/mira-cloth-three-micro-parts-v2.png'),'limits':'not exact multi-view CAD; swirls/rims rejected; shared edges unresolved'}for k in ['T01','S05','P01']}
existing['P02']={'status':'author-shape-only-conditional-independent-review-pending','file':str(root/'docs/evidence/mira-cloth-join-v64/mira-cape-adjacent-parts-v2.png'),'limits':'profile/3q depth not exactly reconciled; no measured dimensions'}
entries=[]
for t in p['types']:
 d=dict(t);d['microReference']=(existing[t['typeID']] if t['typeID'] in existing else {'status':'missing','plannedSheet':next(s['sheetID'] for s in sheets if t['typeID'] in s['types'])});d['authorDimensionStatus']='prior nominal proposal, not image measurement or final seam coordinates';d['mirrorPolicy']='reflection X -> -X permitted for symmetric instances only; reverse winding and anatomical bone mapping later; geometry equivalence not yet validated';entries.append(d)
instances=[]
for i in p['instances']:
 d=dict(i);d['referenceType']=i['type'];d['assemblyStatus']='unassembled; images not a mesh proof'
 if i['id'] in ['B02-R','B03-hanger-R']:d['proposedAnatomicalSide']='Left (+X)';d['conflict']='legacy -R id conflicts with canonical frontal hanging-tail location; retain ID for audit, resolve in global ledger'
 instances.append(d)
plan={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'34 listed types only, not an exhaustive whole outfit; no new 3D until full reference/assembly reconciliation','baselineLedger':str(old),'baselineLedgerSHA256':hashlib.sha256(old.read_bytes()).hexdigest(),'counts':{'types':34,'instances':79,'existingIndependentConditionalTypes':3,'existingAuthorConditionalTypes':1,'partialP04RBNotWholeType':1,'missingWholeTypeReferences':30,'plannedNewSheets':10},'coordinates':p['coordinates'],'types':entries,'instances':instances,'sheets':sheets,'knownGlobalGaps':['trouser/crotch/leg cloth types missing from34','cape HEM type/instances unspecified; L05 covers lower-tunic hem only','B02-R and B03-hanger-R canonical anatomical side conflict','P04-RB is only a small subsection, not P04 coverage','all exact shared curves/UV/weights/overlap order must be authored after multi-view reconciliation; images are not CAD']}
(out/'PLAN.json').write_text(json.dumps(plan,indent=2,ensure_ascii=False)+'\n')
lines=['# 衣装全34参照型・画像先行計画','', '既存79配置を維持して照合する。独立条件付き3型＋作者条件付き1型、P04は部分のみ。残30型を3型×10枚で先に生成・実見する。新3D0。34型だけではズボン/外套裾が未定義で、全衣装完備とは呼ばない。','', '|型|形|配置数|既存資料/予定|接合先|','|---|---|---:|---|---|']
for d in entries:lines.append(f'|{d["typeID"]}|{d["name"]}|{len(d["instances"])}|{d["microReference"].get("plannedSheet",d["microReference"]["status"])}|{d["edgeContract"]}|')
lines+=['','寸法は旧台帳の作者案でありPNGから測った値ではない。Right=-X/Left=+X。左右共通資料は形状鏡映の候補で、異なる型や別3D完成数に数えない。吊帯/第2ringの旧-R名は正面像の本人左配置と矛盾しており、原IDを残して全体台帳ownerへ照会済み。','', 'P04-RB部分を全P04へ拡大して合格とはしない。内側cut edgeを装飾縫い目にしない。全体対応は各型のcanonicalContext/edgeContractと79配置をPLAN.jsonで保全。正確な共有頂点曲線・UV・weights/支持は未確定のauthor仕様で、生成画に数値精度を委ねない。','', '生成ごとにprompt/reference paths/開始・終了/出力path・hashを保存し実見する。未終端callを再送しない。資料不一致はpendingのまま残し、形の未確定を3Dで先に補完しない。']
(out/'PLAN.md').write_text('\n'.join(lines)+'\n')
print(json.dumps(plan['counts']))
