# v35 納骨堂素材の段階読み込み

通常の Web プレイで、遠方の納骨堂画像が失敗すると世界全体を起動できなかった経路を分離した。起動時はプレイヤーから80 m以内だけを待ち、プレイ中の active frame から120 m以内を先読みする。画像や配置を増減せず、保存地点から始める場合も現在位置で選ぶ。これは可視性の cutoff ではなく、取得優先度の2段階である。

基点は `cd5ca9794da31e21cf639e7da4d226007b3fbe56`。変更は `src/vault-textures.js`、`src/vault-scene.js`、`src/scene.js` の素材起動・地域更新接続のみ。core、保存、人物、音、UI、Vite、packager、媒体原 byte と license は変更しない。同時制作の v34 で通常 URL を一次成果・単体 HTML を補助成果へ分離するため、この単位は単体の容量を通常品質の上限として扱わない。

実 `new Game()` の初期位置は **(0,101)**。最寄りの熾火/潮錆は57.009 m、風蝕/苔影は95.713 mで、起動は前2枚を待つ。全地域の画像68,499 Bのうち **34,119 B** を起動時に要求し、**34,380 B** は最初の active frame から先読みする。現位置では120 m内に全4地域があるため、最終的な取得量は減らない。95.713 mでの現在の指数fog透過係数は約0.851で、遠方を「見えない」として省略してはいない。元のgeometry・基礎材質は読込中も存在する。native画面での材質切替の見え方は未判定である。

| 開始位置 | 起動80 m | プレイ中120 m |
|---|---|---|
| 新規 (0,101) | 熾火・潮錆 | 全4地域 |
| 熾火中心 (55,116) | 熾火・風蝕 | 熾火・潮錆・風蝕 |
| 潮錆中心 (-55,116) | 潮錆・苔影 | 熾火・潮錆・苔影 |
| 風蝕中心 (85,145) | 熾火・風蝕 | 熾火・風蝕 |
| 苔影中心 (-85,145) | 潮錆・苔影 | 潮錆・苔影 |
| 遠方 (0,-250) | なし | なし |

画像ごとの cache は最大4テーマで、一つのテーマへ同時に複数要求を出さない。成功した128×128画像は同じsRGB/repeat設定でアプリ寿命中保持し、後退・再入場・タイトル・new gameで捨てたり再取得したりしない。将来の大容量地域素材への一般的なLRU/eviction実装ではなく、既存4枚に限定した保持契約である。全4枚RGBA8 mip payloadは約0.333 MiBで、GPU実常駐計測ではない。

失敗は該当テーマだけを既存base-material fallbackにし、4秒のbackoff後、必要地域の次の確認で再試行する。地域確認はactive状態で最大0.5秒に1回。1要求が8秒以内に完了しなければ起動待ちを解き、late decodeは破棄する。TextureLoaderのImage要求を中断できるとは主張しない。timeout後も同じ要求が未完了ならin-flight slotを保持し、止まった要求を毎回積み重ねない。従って永久に完了しないImageはそのviewの待ちを止めないが、そのテーマの再要求は元要求の完了まで待つ。成功・失敗・timeout・disposeの後着処理は個別に検査した。

callbackは画像結果を一時保持するだけで、材質へ直接書き込まない。現在のgame/viewのactive frameだけが結果を反映する。`playing && dt > 0` で既存SceneViewから渡し、pauseまたは次のactive frameでのgame変更ではgenerationを更新して旧結果の受け渡しを無効化する。実mainのタイトル中はSceneView.update自体が呼ばれないため、その時点のgeneration更新はない。完了した静的画像はreadyTexturesへ保持できるが、mapは変更せず、再開後のactive frameで適用する。単体試験のactive=falseは専用APIのinactive境界であり、実mainのto-title通知を再現したと主張しない。専用の `disposeTextureStreaming()` は後着・再要求を止める。これはSceneView全体のGPU解放APIを新設したものではなく、通常アプリは既存どおりSceneView/cacheを再利用する。

納骨堂の床/壁はthemeごとの専用materialを持つ。他のcached stone・建築材質にmapを上書きせず、追加画像を入れたframeで `needsUpdate` とmapサイズ記録を更新する。成功済みのmapを同じframeごとに再設定しない。読み込み後のregion mapには別のglobal rock normal shaderを適用しない。元から地域画像を使わなかったbrazier/stele等の材質範囲は変えない。current nativeDetailed wardenはテーマgeometry/材質を持ち、この石画像を使わない。残されたlegacy GLB warden helperは従来のconstructor引数に渡されたtextureを使う経路で、追加の非同期更新対象にはしていない。旧GLB経路を新しいruntime対象と称していない。

検証は次のとおり。

- **304/304 tests**、main runtime、実Scene integration、sky integration、vault runtime、journey、session、buildの **8 gatesすべて成功**。DOM/renderer/image/audio境界は各既存fixtureに明記する。
- controlled promiseで旧all4 loaderに同じ2枚を成功させても起動が待機し、未選択galeの失敗が全体をrejectする負例を再現。新factoryは同じ近傍2枚で起動できる。旧loaderの正確なsourceをCIから読めるfixtureとして保持し、ローカルだけのgit SHAへ試験を依存させない。
- 新規、実serialize→restoreによる全vault保存地点、遠方、重複要求、部分失敗、retry、timeout、後着dispose、後退/再入場、pause/title/restart、native専有materialを検査。Game.serialize前後は一致。
- 旧baseとnative比較で **400 meshes / 80,592 triangles**、全attribute/index byte・world matrixのhashが一致。`a064889bc00d07fadec401a4bb3daf742fba7972b9728831d07d5a6f1b478864`。追加geometryなし。
- 原媒体 **27件 / 11,441,662 B**、各sourceとdistのSHA256は基点相当と完全一致。初期JS **164,988 B / 3 chunks**、全JS **1,078,176 B**。増分2,195 Bはdeferred scene側。初期165,000 Bの回帰ガードは維持。

初回全試験は303/304。新cacheがブラウザー標準のclearTimeoutを参照したところ、単体Node VM fixtureはwindow.clearTimeoutだけを定義しglobalには渡しておらず、image要求前に停止した。fixtureへ同じclearTimeoutを渡す1行を追加し、該当2単体testsと新5testsを再確認後、全304 testsを再実行して通過した。runtimeをfixture不足へ合わせて弱めていない。初回結果も保存する。

独立確認は [REVIEW.md](evidence/vault-media-stream-v35/independent/REVIEW.md) と実行可能な2本のoracleを保存した。実main bundle→async SceneView→cacheの接続で起動2枚、最初の正dt frameの追加2枚、タイトル中の材質不変・再開反映、new gameでScene/cache再利用を確認した。別cache oracleは8秒の待機解除、4秒のbackoff、後着dispose、異常サイズ拒否、および重複要求防止guardを除去した負例を確認した。追加runtime修正要求はない。独立確認は06:20:35〜06:28:00 UTCで、画像/DOM/renderer等のdoubleを使う境界は報告内に明記する。

媒体制作時間は0（全原ファイル維持）。検証commandごとの秒数は [gates.json](evidence/vault-media-stream-v35/gates.json)、初回失敗分は [initial-gates.json](evidence/vault-media-stream-v35/initial-gates.json)。編集・資料調査・手戻りの排他的なwall時間は独立計時していないため、これらを検証時間へ混ぜて捏造しない。親による統合・配信時間も本単位には含まない。

同一原素材の取得時点を変えたもので、実HTTP/Range/cache転送、shader compile、材質切替画像、FPS、端末GPU/メモリ、実機プレイ、PS4相当の品質は未判定。最初の待機から2枚分を分離したことを、大幅高速化・総転送削減・作品品質達成へ読み替えない。
