# 衣装全34参照型・画像先行計画

既存79配置を維持して照合する。独立条件付き3型＋作者条件付き1型、P04は部分のみ。残30型を3型×10枚で先に生成・実見する。新3D0。34型だけではズボン/外套裾が未定義で、全衣装完備とは呼ばない。

|型|形|配置数|既存資料/予定|接合先|
|---|---|---:|---|---|
|T01|front centre panel|2|independent-shape-only-conditional|T03/T05; top T04/C01; bottom WAIST|
|T02|rear quarter panel|2|cloth-01|T03; top T04/C02; bottom WAIST|
|T03|underarm side panel|2|cloth-01|front T01; rear T02; top T05; bottom WAIST|
|T04|shoulder bridge|2|cloth-01|inner COLLAR; T01/T02; outer ARMHOLE|
|T05|armhole gusset half|4|cloth-02|shared ARMHOLE16; T03/T04; S01/S02|
|S01|upper sleeve front|2|cloth-02|ARMHOLE; side S02; bottom S03/S04|
|S02|upper sleeve rear|2|cloth-02|ARMHOLE; side S01; bottom S03/S04|
|S03|outer elbow fold|2|cloth-03|top S01/S02; bottom S05/S06; ends S04|
|S04|inner elbow gusset|2|cloth-03|top S01/S02; bottom S05/S06; ends S03|
|S05|forearm sleeve front|2|independent-shape-only-conditional|S03/S04; sides S06; bottom CUFF|
|S06|forearm sleeve rear|2|cloth-03|S03/S04; sides S05; bottom CUFF|
|C01|front stand-collar half|2|cloth-04|lower T01/T04; back C02; front OPEN|
|C02|rear stand collar|1|cloth-04|lower T02/T04; ends C01|
|W01|front cowl fold|3|cloth-04|ends W02; adjacent W01|
|W02|side cowl bridge|2|cloth-05|front W01; rear W03; lower P04; brooch seat|
|W03|rear cowl fold|3|cloth-05|ends W02; upper C02; lower P04|
|P01|cape rear panel|2|independent-shape-only-conditional|rear centre; outer P02; top P04; bottom HEM|
|P02|cape side panel|2|author-shape-only-conditional-independent-review-pending|rear P01; front P03; top P04; bottom HEM|
|P03|cape front-edge panel|2|cloth-05|outer P02; top W02/P04; inner OPEN; bottom HEM|
|P04|cape shoulder connector|2|cloth-06|inner W02/W03; outer P01/P02/P03|
|L01|lower front panel|2|cloth-06|WAIST; side L03; inner L04/OPEN; bottom L05|
|L02|lower rear panel|2|cloth-06|WAIST; side L03; rear centre; bottom L05|
|L03|lower side insert|2|cloth-07|WAIST; front L01; rear L02; bottom L05|
|L04|split-edge turnback|2|cloth-07|fold along L01 front edge; inside free edge|
|L05|hem turnback|6|cloth-07|corresponding lower panel hem; joined endpoints|
|B01|belt segment|4|cloth-08|continuous WAIST path|
|B02|hanging belt tail|1|cloth-08|top B03-hanger; bottom FREE|
|B03|hardware ring|2|cloth-08|belt or tail hinge; closed opening|
|B04|buckle pin|1|cloth-09|hinge B03; tip explicit belt hole|
|F01|cuff front half|2|cloth-09|top CUFF; side F02; bottom WRIST|
|F02|cuff rear half|2|cloth-09|top CUFF; side F01; bottom WRIST|
|F03|cross-wrap ribbon|6|cloth-10|F01/F02; explicit overlap order|
|F04|brooch centre|2|cloth-10|seat W02; rim F05|
|F05|brooch rim|2|cloth-10|inner F04; back W02|

寸法は旧台帳の作者案でありPNGから測った値ではない。Right=-X/Left=+X。左右共通資料は形状鏡映の候補で、異なる型や別3D完成数に数えない。吊帯/第2ringの旧-R名は正面像の本人左配置と矛盾しており、原IDを残して全体台帳ownerへ照会済み。

P04-RB部分を全P04へ拡大して合格とはしない。内側cut edgeを装飾縫い目にしない。全体対応は各型のcanonicalContext/edgeContractと79配置をPLAN.jsonで保全。正確な共有頂点曲線・UV・weights/支持は未確定のauthor仕様で、生成画に数値精度を委ねない。

生成ごとにprompt/reference paths/開始・終了/出力path・hashを保存し実見する。未終端callを再送しない。資料不一致はpendingのまま残し、形の未確定を3Dで先に補完しない。
