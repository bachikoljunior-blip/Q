# 衣装接合の意味上の正本案

これは画像由来の測量図ではない。位置配列・UV・weight・solver時間の厳密な共有は未実装。部品画像の配置小図が矛盾する場合、完成像/衣装組立図と下表を優先する。

| 接合 | 部品の辺 | 相手の辺 | 条件 |
|---|---|---|---|
| UPPER-CENTRE | T01-R/inside | T01-L/inside | front opening policy, not automatic weld |
| UPPER-SIDE | T01/side + T02/side | T03/front + T03/rear | left/right copies separate |
| SHOULDER | T01/top + T02/top | T04/front + T04/rear | same author shoulder contour |
| ARMHOLE | T03/top + T04/outer | T05 inner arcs; S01/S02 shoulder arcs | front/rear half loops and sampling order pending |
| UPPER-SLEEVE | S01 side edges | S02 side edges | shared long seams, not duplicate closed tubes |
| ELBOW | S01/S02 bottom | S03/S04 top | one outer fold and inner gusset |
| FOREARM | S03/S04 bottom | S05/S06 top | single seam loop shared across both families |
| FOREARM-LONG | S05 long edges | S06 long edges | no independent overlapping walls |
| CUFF | S05/S06 bottom | F01/F02 top | clothing cuff rests beneath bracer; overlap distinct from weld |
| BRACER | F01 sides | F02 sides | wrap F03 overlays; actual fastening order pending |
| NECK | T01/T02/T04 inner top | C01/C02 lower | inner standing collar, outside cowl separate layer |
| COWL | W01 ends | W02 front | three authored U-layer copies; no silent extra folds |
| COWL-REAR | W03 ends | W02 rear | three V-layer copies; back drape not worn hood |
| CAPE-SHOULDER | W02/W03 lower | P04 inner | P04-RB old subset does not cover all arc |
| CAPE-TOP | P04 outer | P01/P02/P03 top | one canonical solved boundary owner required later |
| CAPE-LONG | P01 outside | P02 rear | existing prototype shared edge is not full outfit weld |
| CAPE-EDGE | P02 front | P03 outside | P03 opening edge remains free |
| CAPE-CENTRE | P01-R inside | P01-L inside | old prototype x=+-5 mm gives 10 mm gap; no silent closure |
| CAPE-HEM | P01/P02/P03 bottom | PH01 top | six copies; shared adjacent endpoints, no independent solid caps |
| WAIST | T01/T02/T03 bottom | L01/L02/L03 top | single waist join hidden by outer belt; no double exposed upper hem |
| LOWER-SIDE | L01 side + L02 side | L03 front + L03 rear | rear centre policy pending |
| LOWER-SPLIT | L01 inside | L04 fold edge | remaining inner edge free |
| LOWER-HEM | L01/L02/L03 bottom | L05 top | six matching copies, distinct from cape hem PH01 |
| BELT | B01 ends | adjacent B01 ends | leather overlays waist; four segments not free caps |
| BELT-HARDWARE | B03 buckle ring | B04 hinge; B01 hole | requires geometric clearance specification |
| HANGER | B03-hanger-R (legacy ID, Left) | B02-R top (legacy ID, Left) | canonical Left +X, bottom free |
| BROOCH | F04 boundary | F05 inner opening | two-size fittings onto W02; no image-derived tolerance |
| TROUSER-WAIST | TR04 lower | TR01/TR02 top | four cloth waist segments separate from B01 |
| TROUSER-LONG | TR01 inseam/outseam | TR02 inseam/outseam | method-B silhouettes not yet congruent shared curves |
| TROUSER-GUSSET | TR03 four edges | TR01-R/L and TR02-R/L upper inner cutouts | no double ownership of crotch; exact cutout registration pending |
| BOOT-UNDERLAP | TR01/TR02 bottom | TR05 upper | cloth runs inside AB07/AB08 boot; depth unmeasured |
