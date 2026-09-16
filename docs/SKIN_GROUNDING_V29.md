# v29 — 接地した建築と原UVの肌材質

37支持部の下端を実地面へ接続し、上端・アーチと他129構造物を維持した。旧廃塔の最大11.356 mの浮きは、独立した同条件21,384点で外周が地中8〜14 cmの範囲になった。カメラ・実際の矢・予測が同じ明示された高さ範囲を使う。37 meshは維持、追加776三角形・241,248 Bのgeometry buffer。[作者の比較](GROUNDED_ARCHITECTURE_V29.md)と[独立した実geometry/consumer検査](evidence/grounded-architecture-v29/independent/REVIEW.md)を保持する。

鍛冶師レンの顔だけに、出所とCC0を確認したMakeHuman原肌atlasを原UVのまま適用した。既存レシピの髭表現に合う役のみ採用し、他13 familyの顔は未着色のまま。首・手・眼球・まぶた・衣装を変更せず、実首境界の47 UV / 46頂点で平均色を合わせた。局所差最大9.679/255や描画時の継ぎ目は残る可能性があり、視覚的に同化したとは判断していない。[素材・lifecycle・独立修正](CHARACTER_SKIN_V29.md)。

原PNG 3,693,828 BとMH material記録、原UV、codec再現recipeをsourceへ保持。配信は同じ2048²のWebP q95 / 541,954 Bだけで、元PNGはruntime/stage/単体版から除外。原画像の切り抜き・色補正・生成は行っていない。GPU RGBA8 full mipの計算は21.333 MiBで、encoded圧縮をGPU節約とは扱わない。頭部最大7,998tri / 14draw、geometry配列は修復済v28と一致。

## 結合の検証

既存必須20 commandすべて成功、263/263 tests、wall103.597秒。source・build・固定stage・単体版byte一致。initial JS 163,956 B <165,000、3 JS chunks / total965,434 B、単体版16,324,272 B、16MiBまで452,944 B。SHA256 `d2cdd7b59083b3ae66d2c1fead0b50ef05730c35b7ee892d4c57ea5039012a98`。固定stage `artifacts/site-V23mJs`、34 public files。[全commandとhash](evidence/skin-grounding-v29/validation.json)。これらの値は実packageで測定し、Nodeのrenderer/asset loader doublesはWebGL・GPU・FPS・実聴と区別する。

共有factoryにskin loaderを追加したため既存forest/VFX oracleへ明示したflat-skin fixtureを足した。skin自体は別の実factory待機/失敗/retry/共有テクスチャ試験で検査する。建築の実地面・世界保存不変・カメラ/矢/予測の負の対照を既存CIへ追加した。試験の追加を見た目の合格へ読み替えない。

## 保存・公開と次の制作

基点はlocal v28 `2e76e209dda4bb9430b12e1e6d2112062b675675` / remote PR43 `1658d8666017de525f35814db3b1a32cfd404931`。ground作者`16af6cf6a744c36e7e9f45720fa8e7fb922c9069`、skin作者`aa6ca715a908b2c1918907f8bc25a28a486d946c`を結合。generated HTMLだけのcherry-pick競合は結合sourceから再packageした。

03:42Z頃のnative main fetchは`547676fdce8d8e97abed9f065aad0b6e24af2fd6`。PR39は通常mergeの03:14再timeout後もopen/merged=false。PR39〜43のpush/PR CI成功とexact tree保全はmain反映ではない。PR43の大きなHTML blob作成がtimeoutした際、同じSHAのtree作成成功後にnative fetchし、Gitblob `959a1223eb6303aea96527717c952a243430ac31`とSHA256を実照合した。blob mutationを重ねなかった。v29は同じ通常stack保全へ進む。

Siteはversion23/source`f11819aceea515d166846e4bf85082bf2e51e9d1`/custom owner onlyのまま。Sitesの技術上はexact commitで配信できるが、現行AGENTSが指定する通常main→同一Siteの順序を保持し、未merge候補を先行配信しない。preview skillでlive Site browser訪問は認められておらず、正式statusは03:30Zにもmailbox不在。daemon/mailboxを作る、別server/browser/CIへ回す手段は使わない。preview不在だけが一般的なSites配信禁止条件だとは解釈しない。

期限9/20の判断は根拠不足。画面/実機/実聴/指定10作品比較と身体表面/演技/全世界の残量、main配信遅延を含む完成速度は未取得。肌単位のwall14分14.531秒と接地単位約24分42秒は独立レビュー・手戻りを含み、素材取得591.359秒や並行結合gate103.597秒を同じ工数へ単純加算しない。全画面PS4達成・速度向上率を算出しない。

次は同じ現行sceneで測った家屋最大1.063m浮き/1.092m埋没と橋ramp約13〜15cmの床高さ差・取付の隙間を有限修復する。装飾追加や局所テストの件数で視覚欠落を解決した扱いにせず、既存床/扉/通行/保存を保つ。同時に独立担当がv23→v29のCPU geometry/texture形式・同時常駐費用を調査するが、実GPU/device測定と区別する。実行可能な制作を続ける。
