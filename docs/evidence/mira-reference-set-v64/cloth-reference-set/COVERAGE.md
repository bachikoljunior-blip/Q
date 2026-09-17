# 衣装資料の範囲と対応

旧34型79配置を残し、欠落していたズボン5型と外套裾1型を追加した提案40型96配置。37枚の原PNGを全て実見し、生成元と保存先の完全byte一致を検査した。画像の存在と形状・接合の確定は別。新3D・本編source・remote変更は0。

| 型 | 選択した画像 | 残る条件 |
|---|---|---|
| T01 | mira-cloth-three-micro-parts-v2.png | not exact multi-view CAD; swirls/rims rejected; shared edges unresolved |
| T02 | cloth-01-v2.png | Ignore generated text left shoulder: rear locator image-right is anatomical Right. Existing author placement is authoritative; no all-panel consistency claim. |
| T03 | cloth-01-v2.png | Single side surface readable; contour and grain/piping are not measured geometry or material. |
| T04 | cloth-01-v2.png | Single shoulder saddle readable. Ignore generated HOODIE neighbour text; ARMHOLE from author ledger controls. |
| T05 | cloth-02-v1.png | One crescent patch, not complete annular armhole. Four placements require front/rear adjacency registration. |
| S01 | cloth-02-v1.png | Half-panel with one broad bend; exact shoulder and elbow arc correspondence unmeasured. |
| S02 | S02-v2.png | Repaired locator shows rear anatomical Right upper arm; not front S01. Exact cut contours remain author registration. |
| S03 | S03-v2.png | One-fold topology agrees. Image remains taller than old 180x90 nominal author ratio; this is uncalibrated aspect/scale, not proof of a different topology. Final author width/height and fold depth must be registered together before mesh. |
| S04 | cloth-03-v1.png | Single concave gusset; elbow seam lengths unmeasured. |
| S05 | mira-cloth-three-micro-parts-v2.png | not exact multi-view CAD; swirls/rims rejected; shared edges unresolved |
| S06 | S06-v2.png |  |
| C01 | C01-v2.png | Front collar half is readable; illustrated angular sweep not a measured 90-degree arc. |
| C02 | cloth-04-v1.png | Rear curved stand-collar strip; exact end angles and wall thickness not measured. |
| W01 | W01-v2.png | Corrected from multiple pleats to one U fold. Three layer instances are author placements, not three different shapes. |
| W02 | W02-v2.png | Corrected from entire scarf to one shoulder bridge. Brooch attachment is separate. |
| W03 | W03-v2.png | Corrected to one V strip. Context lacks individual layer highlight; author 3-layer mapping controls. |
| P01 | mira-cloth-three-micro-parts-v2.png | not exact multi-view CAD; swirls/rims rejected; shared edges unresolved |
| P02 | mira-cape-adjacent-parts-v2.png | profile/3q depth not exactly reconciled; no measured dimensions |
| P03 | P03-v2.png | Corrected placement to outer cape edge, staff side, rather than tunic split. |
| P04 | P04-v2.png | Corrected entire cowl into single shoulder saddle; older P04-RB image covers only back subdivision, not whole type. |
| L01 | L01-v2.png | Corrected pair of panels to one front half. No second front wall is present. |
| L02 | L02-v2.png | Corrected full-width rear to one quarter. Context unhighlighted; rear quarter mapping comes from canonical and ledger. |
| L03 | L03-v2.png | Corrected doubled return wall into one panel; decorative edge rolls are excluded. |
| L04 | cloth-07-v1.png | One turnback strip; thick drawn rim is illustrative, not runtime thickness. |
| L05 | cloth-07-v1.png | Tunic hem only, not cape hem. Shared adjacent ends are not independent solid caps. |
| B01 | cloth-08-v1.png | Leather segment remains separate from trouser fabric TR04. |
| B02 | cloth-08-v1.png | Legacy B02-R ID retained; canonical hanging tail is anatomical Left (+X), front image-right. |
| B03 | cloth-08-v1.png | Two scale instances; hanger legacy R alias maps Left (+X). Exact ring proportions/pin clearance unresolved. |
| B04 | cloth-09-v1.png | Single pin/hinge part; belt-hole contact needs author fit. |
| F01 | cloth-09-v1.png | Open front half-shell readable; thick edge rims excluded. |
| F02 | cloth-09-v1.png | Open rear half-shell readable; mirror shares shape, not automatically mirrored twist or winding. |
| F03 | F03-v2.png | Shape is one ribbon. Old front/rear locator sides conflict; repaired contexts lack a precise highlighted strip. Discard both locator claims; use canonical wrists plus author R=-X/L=+X and wrap order. |
| F04 | F04-v2.png | Corrected double-convex profile to a thin concave-backed dome. Exact thickness/contact with F05 unresolved. |
| F05 | cloth-10-v1.png | Separate rim with central opening; F04 seat is author fit. |
| TR01 | TR01-method-b.png | v1/v2 closed-ankle topology rejected. Method B is an open one-surface reference; blue-grey is proxy only. Upper cutout location and TR03 mating edges are not yet registered to actual trouser contours. |
| TR02 | TR02-method-b.png | v1/v2 mixed open/closed views rejected. Method B open surface class readable; seat/crotch contour and matching TR01 seams still require author registration. Proxy blue-grey is not canonical colour. |
| TR03 | TR03-v2.png | One curved diamond patch visible; exact saddle curvature and four seam lengths must match both front/rear leg pieces, not duplicate their crotch region. |
| TR04 | TR04-v2.png | Fabric waist arc only; not external leather belt. Four instances share endpoints; no independent end caps. |
| TR05 | TR05-v1.png | Cloth underlap inside boots only. Joint with TR01/TR02 and overlap depth with AB07/AB08 not measured. |
| PH01 | PH01-v1.png | Cape-specific hem only. Ignore generated swirl texture/rolled thickness; share P01/P02/P03 hem and endpoints, no capped independent solids. |
