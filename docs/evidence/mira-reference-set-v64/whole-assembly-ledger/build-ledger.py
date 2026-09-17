"""Read-only, pinned-Git inventory. Writes only beside this script. No image transforms."""
import collections, datetime, hashlib, json, pathlib, subprocess, time

START = time.perf_counter()
OUT = pathlib.Path(__file__).resolve().parent
ROOT = OUT.parents[1]
REPO = ROOT / 'Q-mira-micro-v63'
BASE = '645ed4b1a31bdc6f07ff66a90e0058f7392394bb'
P = 'docs/evidence/mira-micro-v61/planning/'
sources = []
def sha(b): return hashlib.sha256(b).hexdigest()
def dump(name, d):
    p = OUT/name; p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(d, ensure_ascii=False, indent=2)+'\n')
def gitbytes(p): return subprocess.check_output(['git','show',BASE+':'+p],cwd=REPO)
def read(p, name):
    b=gitbytes(p); sources.append(dict(path=p,gitCommit=BASE,bytes=len(b),sha256=sha(b)))
    (OUT/'source-snapshot').mkdir(exist_ok=True)
    (OUT/'source-snapshot'/name).write_bytes(b)
    return json.loads(b)
head=read(P+'head/type-manifest.json','head-types.json')
hp=read(P+'head/parts-draft.json','head-parts.json')
cloth=read(P+'cloth/types.json','cloth-types.json')
accessories=read(P+'accessories/HANDS_BOOTS_MICRO_PLAN.json','hands-boots.json')
staff=read(P+'accessories/STAFF_MICRO_BOM.json','staff-bom.json')
oldindex=read('docs/evidence/mira-micro-v61/PART_INDEX.json','legacy-index.json')
headmesh=json.loads(gitbytes('docs/evidence/mira-head-micro-v63/assembly.json'))
clothmeshes=json.loads(gitbytes('docs/evidence/mira-cloth-micro-v62/meshes.json'))
staffmeshes=json.loads(gitbytes('docs/evidence/mira-staff-v63/assembly/parts.json'))
refs=[]
def ref(id,path,keys,limits,origin='base',full_type=True,version='selected-conditional',explicit=None):
    b=gitbytes(path) if origin=='base' else pathlib.Path(path).read_bytes()
    d=dict(id=id,path=path,origin=origin,gitCommit=BASE if origin=='base' else explicit,
           bytes=len(b),sha256=sha(b),typeKeys=keys,rawImagePresent=True,
           status=version,entireTypeScope=full_type,allAnglesFixed=None,
           exactDimensionsFromImage=False,limits=limits)
    refs.append(d)

cp='docs/evidence/character-reference-v60/references/'
for n in ['complete-six-views-v1','head-views-v1','upper-views-v1','cape-views-v2','lower-views-v1','hands-staff-views-v1','garment-assembly-v1']:
    ref('canonical:'+n,cp+'mira-'+n+'.png',[],
        'Whole/region design context; does not count as an isolated micro-part reference. Cameras and millimetres are not calibrated.',version='canonical-context')
ref('head-cheeks','docs/evidence/mira-micro-v61/references/head/mira-face-patches-F01-F05-F09-v2.png',
    ['head:'+x for x in ['F01','F05','F09']], 'Anatomical-left conceptual surface only; artificial thickness/back boxes excluded. Opposite side and exact shared curves unresolved.')
ref('head-jaw','docs/evidence/mira-head-micro-v63/references/mira-F07-F11-v2.png',
    ['head:F07','head:F11'],'Placement/continuity reference; isolated F07 depth and exact orthographic interpretation rejected.')
ref('cloth-first3','docs/evidence/mira-micro-v61/references/cloth/mira-cloth-three-micro-parts-v2.png',
    ['cloth:'+x for x in ['T01','S05','P01']], 'Right instance shape concept only; decorative swirls and per-part artificial hems excluded; mirrored side and seams not fixed.')
ref('staff-caps','docs/evidence/mira-micro-v61/references/staff-caps-micro-v1.png',
    ['staff:S13','staff:S14'],'Axisymmetric shape concept; dimensions authored in native profiles, not measured from sheet.')
ref('staff-ribs','docs/evidence/mira-micro-v62/references/staff-ribs/staff-ribs-micro-v2.png',
    ['staff:S09','staff:S10','staff:S11','staff:S12'],'TOP rejected; front/side/three-quarter conditional. Image box ends differ from authored tapered ends.')
sp='docs/evidence/mira-staff-v63/references/'
ref('staff-shaft',sp+'shaft-foot-v1.png',['staff:S01','staff:S02','staff:S03'],'Lathe/wood shape reference; internal sockets and registration are authored.')
ref('staff-grip',sp+'grip-strips-v1.png',['staff:S04'],'Sleeve row only. Strip rows do not establish consistent formed-wrap cameras.')
ref('staff-strip-blank',sp+'S05-flat-blank-v1.png',['staff:S05'],'Straight strip blank concept; picture aspect ratio not metric. Formed A/B winding is author design, not validated multiview reference.',full_type=False)
ref('staff-collars',sp+'collars-neck-v1.png',['staff:S06','staff:S17','staff:S18'],'Isolated parts conditional; assembly thumbnail swaps upper/lower collars and is excluded.')
ref('staff-finial',sp+'finial-v1.png',['staff:S15'],'Ball/stem concept; assembly thumbnail attachment is excluded.')
lp='docs/evidence/mira-lantern-v63/references/'
ref('staff-cup-ring',lp+'lower-cup-ring-glass-v1.png',['staff:S07','staff:S08'],'Cup/ring rows only; lipped glass row rejected. Exact cradle added as native author interface.')
ref('staff-glass',lp+'glass-multiview-v2.png',['staff:S16'],'Closed oval glass concept; exact radii/truncated contact top authored, not calibrated from pictures.')
ref('postbase-cloth-adjacent',str(ROOT/'Q-mira-cloth-join-v64/docs/evidence/mira-cloth-join-v64/mira-cape-adjacent-parts-v2.png'),
    ['cloth:P02','cloth:P04'],'P02 conditional author reference; P04-RB is only rear-right subset, not complete shoulder type. Both raw sheets viewed in this audit; no exact projection/seam acceptance.',
    origin='post-base',full_type=False,explicit='93a3d87380329c85b7b9f738c3f1216bbcff096c')
ref('postbase-lowerlip',str(ROOT/'q-character-reference-v64/face/mira-F17-v2.png'),['head:F17'],
    'Raw partial reference: TRUE SIDE upper protrusion remains inconsistent; not promoted to accepted complete type.',origin='post-base',full_type=False,
    explicit='014bdddf690f6f26db32ddab843b0ba51b17ce0d')

rows=[]; placements=[]
def add(scope,id,name,ids,raw,operation):
    rows.append(dict(key=scope+':'+id,legacyIndexKey=('hands-boots' if scope in ['hands','boots'] else scope)+':'+id,scope=scope,localId=id,name=name,instanceIds=[scope+':'+i for i in ids],
       plannedInstances=len(ids),legacySource=raw,operation=operation,
       rawReferenceIds=[r['id'] for r in refs if scope+':'+id in r['typeKeys']],
       canonicalContextOnlyDoesNotCount=True,allRequiredViewsAccepted=None,
       exactWholeCharacterTransform=None,exactSharedEdgeRegistration=None))
for t in head['types']:
    add('head',t['id'],t['name'],t['instanceIds'],t,t['operation'])
for t in cloth['types']:
    add('cloth',t['typeID'],t['name'],t['instances'],t,t['singleOperationShape'])
for t in accessories['types']:
    scope='hands' if t['id'].startswith('AH') else 'boots'
    ids=[i['id'] for i in accessories['instances'] if i['type']==t['id']]
    add(scope,t['id'],t['name'],ids,t,t['shape_reuse_connections'])
for t in staff['parts']:
    ids=[m['id'] for m in staffmeshes if m['id']==t['id'] or m['id'].startswith(t['id']+'-')]
    assert len(ids)==t['quantity'],t['id']
    add('staff',t['id'],t['name'],ids,t,t['short_build_reason'])

hpmap={i['id']:i for i in hp['parts']}; cpmap={i['id']:i for i in cloth['instances']}
apmap={i['id']:i for i in accessories['instances']}; smap={m['id']:m for m in staffmeshes}
nativehead={p['id'] for p in headmesh['parts']}; nativecloth={m['id'] for m in clothmeshes}
for row in rows:
    row['rawImageStatus']='present-conditional-or-partial' if row['rawReferenceIds'] else 'ZERO-isolated-micro-image'
    row['baseRawReferenceIds']=[r['id'] for r in refs if r['origin']=='base' and row['key'] in r['typeKeys']]
    for key in row['instanceIds']:
        scope,id=key.split(':',1)
        raw=hpmap.get(id) if scope=='head' else cpmap.get(id) if scope=='cloth' else apmap.get(id) if scope in ['hands','boots'] else row['legacySource']
        native=(id in nativehead if scope=='head' else id in nativecloth if scope=='cloth' else scope=='staff')
        d=dict(key=key,typeKey=row['key'],legacyPlacement=raw,sourceProvenance='pinned-base-plan',
               candidateGeometryExists=native,candidateMeansCompleted=False,referenceIds=row['rawReferenceIds'],
               exactWholeActorMatrix=None,mirrorValidated=False,sharedEdgesComplete=False)
        if scope=='staff':
            d['nativeStaffLocalMatrix']=smap[id]['matrixWorld']
            d['nativeMatrixSource']='docs/evidence/mira-staff-v63/assembly/parts.json'
            d['legacyBOMGeometrySuperseded']=True
        if id in ['B02-R','B03-hanger-R'] and scope=='cloth':
            d['placementCorrectionProposal']={'preservedOldID':id,'canonicalAnatomicalSide':'L','actorXSign':1,
                'basis':'complete FRONT and lower FRONT image right; staff is opposite anatomical right',
                'newID':None,'sourceChangeApplied':False}
        placements.append(d)
assert len(rows)==103 and len(placements)==250
assert len({r['key'] for r in rows})==103 and len({p['key'] for p in placements})==250
assert {t['key'] for t in oldindex['types']}=={r['legacyIndexKey'] for r in rows}
assert all(sum(p['typeKey']==r['key'] for p in placements)==r['plannedInstances'] for r in rows)

counts={}
for scope in ['head','cloth','hands','boots','staff']:
    rr=[r for r in rows if r['scope']==scope]
    counts[scope]=dict(legacyTypeRows=len(rr),legacyPlacements=sum(r['plannedInstances'] for r in rr),
         baseRawImageRows=sum(bool(r['baseRawReferenceIds']) for r in rr),
         baseZeroImageRows=sum(not r['baseRawReferenceIds'] for r in rr),
         includingPostbaseRawImageRows=sum(bool(r['rawReferenceIds']) for r in rr),
         includingPostbaseZeroImageRows=sum(not r['rawReferenceIds'] for r in rr),
         allRequiredViewsAccepted=None)
dump('ledger.json',dict(schema=1,base=BASE,meaning='Legacy plan rows, not proven unique fabricated shapes or complete character coverage',
     coordinates={'front':'+Z','up':'+Y','anatomicalRight':'-X','anatomicalLeft':'+X','units':'each source frame preserved; no invented global registration'},
     allReferencesFixed=False,wholeAssemblyComplete=False,newGeometryPermitted=False,counts=counts,types=rows,placements=placements))
dump('REFERENCE_INVENTORY.json',dict(base=BASE,references=refs,
    imageStatusPolicy='Raw existence != all-angle consistency != calibrated dimensions != assembled geometry != runtime appearance. No count promotion from prompts or planned sheets.',
    viewedInThisLedgerPass=['canonical:complete-six-views-v1','canonical:lower-views-v1','postbase-cloth-adjacent','postbase-lowerlip'],
    remainingSelectionBasis='Previously inspected fixed reference versions and their preserved adoption/review documents; not claimed re-viewed this pass.'))

headplanpath=ROOT/'q-character-reference-v64/head-reference-set/plan.json'
clothplanpath=ROOT/'q-character-reference-v64/cloth-reference-set/PLAN.json'
plans={}
for k,p in [('head',headplanpath),('cloth',clothplanpath)]:
    b=p.read_bytes(); (OUT/'source-snapshot'/(k+'-v64-plan.json')).write_bytes(b)
    plans[k]=json.loads(b); sources.append(dict(path=str(p),gitCommit=None,bytes=len(b),sha256=sha(b),note='Snapshot of concurrent owner proposal; subsequent generation is outside this frozen inventory'))
hnew=plans['head']; leaf=[r['localId'] for r in rows if r['scope']=='head' and r['localId'] not in hnew['splitAliases']]
leaf+=sum(hnew['splitAliases'].values(),[])+hnew['newTypes']
assert len(leaf)==40 and len(set(leaf))==40
descriptions={p['id']:p for s in hnew['sheets'] for p in s['parts']}
newrows=[]
for id in leaf:
    old=next((r for r in rows if r['key']=='head:'+id),None)
    aliases=[a for a,children in hnew['splitAliases'].items() if id in children]
    newrows.append(dict(key='head:'+id,legacyKey=old['key'] if old else None,legacyAssemblyAlias=aliases[0] if aliases else None,
        proposal=descriptions.get(id),plannedInstanceIds=old['instanceIds'] if old else None,
        rawReferenceIds=old['rawReferenceIds'] if old else [],
        acceptedAllAngles=None,exactInterfaceCurves=None,
        proposedPlacementCount=None if not old else old['plannedInstances']))
gaps=[
 {'id':'G01','scope':'head','problem':'Old E03 owns upper lids only; lower lids, inner corners, infraorbital/nasolabial/mouth transitions, nasal floor and ear rear/root missing explicit ownership.',
  'proposal':hnew['newTypes'],'resolvedByPlanOnly':True,'imagesFixed':False,'nativeSharedEdges':None},
 {'id':'G02','scope':'cloth','problem':'Canonical trousers visible between split lower garment and boots have no type/instance in old 34-row cloth list.',
  'requiredOwnership':['waist/seat/crotch','left/right leg front/back and inseam','boot-opening underlap'], 'newTypeIds':None,'newInstanceIds':None,'exactCounts':None},
 {'id':'G03','scope':'cloth','problem':'Cape bottom HEM has no dedicated continuation/turnback ownership. L05 six hems belong to lower garment and cannot silently cover cape.',
  'newTypeIds':None,'newInstanceIds':None,'sharedCurves':None},
 {'id':'G04','scope':'cloth','problem':'B02-R and B03-hanger-R names conflict with canonical FRONT hanging tail/ring on anatomical left (+X).',
  'preserveLegacyIds':True,'proposedSide':'L','finalNewIds':None},
 {'id':'G05','scope':'head','problem':'A01/A02/F16 combine multiple anatomical surfaces; v64 splits into leaf parts and keeps old IDs as assembly aliases, not additional geometry.',
  'aliases':hnew['splitAliases']},
 {'id':'G06','scope':'hands','problem':'AH06/AH07 thumb versus ordinary fingers need registered variants; old 41-bone root/tip rig does not supply an independent bone for every depicted phalanx.',
  'newBonePolicy':None,'finalVariantGeometry':None},
 {'id':'G07','scope':'boots','problem':'AB05 inner/outer variants, AB09 rear wrap routes and opposite sole/studs contain authored unseen structure, not directly observed complete-view evidence.',
  'invisibleSurfaceEvidence':None},
 {'id':'G08','scope':'whole','problem':'Whole-body registration and cross-owner neck/collar, wrist/cuff, waist/trousers, trousers/boots, hand/staff contacts are not frozen.',
  'globalTransforms':None,'sharedVertexCurves':None},
 {'id':'G09','scope':'staff','problem':'18 old ID rows are not 18 proven unique shape families: S09/S10, S11/S12 share rib families; S08/S13 use a reversed common ring profile. S05 A/B vary around a crossing.',
  'doNotDeduplicatePlacementIDs':True,'uniqueShapeCountForWholeCharacter':None},
 {'id':'G10','scope':'cloth','problem':'Rejected uniform 212-grid draft is still archival; accepted planning input is types.json 34/79, not grid/parts.json.',
  'uniformGridIsNotEvidenceOfAnatomicalMicroParts':True}
]
dump('GAPS_AND_REVISIONS.json',dict(base=BASE,legacy={'typeRows':103,'placements':250},headProposal={'leafRows':40,'placementsClaimedByOwner':80,
     'newLeafRowsEnumerated':newrows,'allNewPlacementIdsEnumerated':False,'oldAliasesExcludedFromLeafCount':True},
     provisionalWholeWithHeadRevisionOnly={'typeRows':113,'placementsClaimed':268,'clothGapNewPartsIncluded':False,'meaning':'Plan-only arithmetic; not complete or image-covered'},gaps=gaps))

staffresultpath=ROOT/'q-character-reference-v63/full-staff-review/result.json'
sr=json.loads(staffresultpath.read_text())
globalports=[
 ('neck-to-clothes',['head:N01','head:N02'],['cloth:C01','cloth:C02','cloth:W01','cloth:W02','cloth:W03'],'Skin neck rim is one boundary; stand collar and outer cowl are separate cloth layers. No duplicate neck in head-sheet collar artwork.'),
 ('right-wrist',['hands:AH10'],['cloth:F01','cloth:F02','cloth:F03','cloth:S05','cloth:S06'],'Right -X; wrist loop/cuff aperture and skin overlap not fixed.'),
 ('left-wrist',['hands:AH10'],['cloth:F01','cloth:F02','cloth:F03','cloth:S05','cloth:S06'],'Left +X; explicit reflected bone/winding mapping still needed.'),
 ('waist',['cloth:T01','cloth:T02','cloth:T03'],['cloth:L01','cloth:L02','cloth:L03','cloth:B01'],'One hidden waist seam; no doubled short-jacket hem. Trousers missing ownership.'),
 ('trousers-to-boots',[],['boots:AB07','boots:AB08'],'Missing trouser leaves; cuff/shaft overlap and leg clearance unknown.'),
 ('right-hand-to-staff',['hands:AH01','hands:AH03','hands:AH06','hands:AH07','hands:AH09'],['staff:S04','staff:S05'],'Right -X holds staff; staff-local 1700 mm assembly is not yet registered to actual grasp/hand matrices.'),
 ('cape-to-shoulder',['cloth:P01','cloth:P02','cloth:P03','cloth:P04'],['cloth:T04','cloth:W02','cloth:F04','cloth:F05'],'P04-RB partial reference does not establish whole shoulder curve; opposite half and front continuation unknown.')]
interfaces=dict(base=BASE,headNative={'source':'docs/evidence/mira-head-micro-v63/assembly.json','frame':headmesh['frame'],'internalSharedSections':headmesh['seams'],
    'boundaryPolicy':headmesh['boundaryPolicy'],'wholeHeadClosed':False},
    clothNative=[dict(id=m['id'],frame=m['frame'],boundary=m['boundary']) for m in clothmeshes],
    staffNative={'proof':'Prior independent native full-staff batch; no new full sweep in ledger task','proofFile':str(staffresultpath),'proofSHA256':sha(staffresultpath.read_bytes()),
    'contacts':sr['contacts'],'glassCradle':sr['glassCradle'],'scope':'Internal staff only, not hand or complete actor'},
    globalPorts=[dict(id=id,fromTypeKeys=a,toTypeKeys=b,contract=note,registeredCurve=None,transform=None,clearanceMm=None,validated=False) for id,a,b,note in globalports])
dump('ASSEMBLY_INTERFACES.json',interfaces)

headids={p['id'] for p in hp['parts']}; conceptual=[]
for p in hp['parts']:
    for target in p.get('joins',[]):
        conceptual.append(dict(fromKey='head:'+p['id'],targetText=target,
            targetKey='head:'+target if target in headids else None,
            status='named-proposed-adjacency' if target in headids else 'unresolved-generic-or-ambiguous',
            sharedCurve=None))
handports=collections.defaultdict(list)
for p in accessories['instances']:
    for port in p.get('join_edges',[]): handports[port].append(('hands:' if p['type'].startswith('AH') else 'boots:')+p['id'])
dump('CONCEPTUAL_GRAPH.json',dict(head=conceptual,accessoryNamedPorts=[dict(port=k,placements=v,geometricWeldVerified=False) for k,v in handports.items()],
     clothTypeContracts=[dict(typeKey=r['key'],contract=r['legacySource']['edgeContract'],sharedCurve=None) for r in rows if r['scope']=='cloth'],
     note='Repeated port text is not a shared numerical curve; a named conceptual graph is not a watertight mesh.'))
dump('SOURCE_HASHES.json',dict(base=BASE,planningSources=sources,
     nativeInputs=[dict(path=p,gitCommit=BASE,sha256=sha(gitbytes(p))) for p in ['docs/evidence/mira-head-micro-v63/assembly.json','docs/evidence/mira-cloth-micro-v62/meshes.json','docs/evidence/mira-staff-v63/assembly/parts.json']],
     noSourceEdits=True,noImageEdits=True,noGitMutations=True))

text=['# Mira 全人物の資料・組立台帳 v64','',
 '旧 103 行 / 250 配置は再計算と全行の参照整合が一致した。ただし人物全体の網羅、103 個の独立形状、資料完備、組立済みを意味しない。新 3D 制作は停止したまま。',
 '', '| 区分 | 旧型行 | 配置 | 固定基点の画像あり | 固定基点の画像0 | 後発資料含む画像あり | 後発資料含む画像0 |',
 '|---|---:|---:|---:|---:|---:|---:|']
for k,v in counts.items(): text.append('| '+k+' | '+' | '.join(str(v[f]) for f in ['legacyTypeRows','legacyPlacements','baseRawImageRows','baseZeroImageRows','includingPostbaseRawImageRows','includingPostbaseZeroImageRows'])+' |')
text+=['','「画像あり」は raw 存在のみ。F17 は側面不整合、P04 は RB 部分のみ、S05 は平たい帯の参考のみ。全角度・全配置の完了数には使わない。後発 P02 の raw はあるが、作者条件付きと独立の接合検証を区別する。',
 '', '頭の不足・分割案は 40 leaf 型 / 80 配置。旧全体へ数だけ代入すると 113 行 / 268 配置になるが、ズボンと cape HEM の不足を含まない未完成案である。新 head leaf ID 40 は列挙したが、増分配置の ID は未提出なので null を残す。',
 '', '全型一覧（既存原画を別型へ無根拠に使い回さない）', '', '| scoped ID | 名称 | 配置数 | micro 原画 ID |', '|---|---|---:|---|']
for r in rows:text.append('| '+r['key']+' | '+r['name'].replace('|','/')+' | '+str(r['plannedInstances'])+' | '+(', '.join(r['rawReferenceIds']) or '**0**')+' |')
text+=['', '各型の旧配置・向き・骨・仮寸法・全 250 配置は ledger.json。既知の数値接合と未定の全身接合は ASSEMBLY_INTERFACES.json。GAPS_AND_REVISIONS.json は不足、旧 ID の保存、頭の alias と leaf の分離を収録する。',
 '', '## 次の資料を受け取る条件',
 '', '1. exact file / SHA256 / 型 ID / 対象配置・左右 / 採用した view / 棄却した view を登録する。生成予定・prompt・作者自己評価だけで画像0を解除しない。',
 '2. 各型について正面・背面・左右・必要断面の形、裏面と隠れた接続を確認し、欠けた角度は未定とする。対称型でも左右の材質・骨・法線・巻き方向を明示する。',
 '3. 完成像への位置・層順・隣接と部品境界を固定する。写真のラベルから精密 camera / mm は決めない。見えない構造の作者設計は分離して明記する。',
 '4. 旧 103 行を全型と見なさず、頭の追加 leaf、ズボン、cape HEM の coverage gap が閉じてから全体資料完備を判断する。',
 '', '## 限界', '', '今回の独立監査は出所既知の設計整合・原 byte 台帳。新規 native render / WebGL / 美観採点 / PS4・iPhone SE3 性能判定ではない。元画像は加工していない。過去の部分 native 検査はその範囲だけを参照し、全人物完成へ外挿しない。',
 '', '左右は資料計画の本人右 −X / 本人左 +X / 顔前 +Z / 上 +Y を用いる。古い変数名 right/hand-1 を人物左右の正本にしない。',
 '', '計測スクリプト時間は読取・再集計の CPU/IO 時間だけであり、画像を読む・判断・記録する実作業時間とは別。']
(OUT/'COVERAGE.md').write_text('\n'.join(text)+'\n')
dump('RUN.json',dict(at=datetime.datetime.now(datetime.timezone.utc).isoformat(),scriptSeconds=time.perf_counter()-START,
     counts=counts,legacyRowsChecked=103,legacyPlacementsChecked=250,sourceWrites=0,imageWrites=0,geometryCreated=0,
     gitMutations=0,unfinishedSessions=0,wholeCharacterComplete=False))
print(json.dumps(dict(counts=counts,rows=len(rows),placements=len(placements),scriptSeconds=time.perf_counter()-START),ensure_ascii=False))
