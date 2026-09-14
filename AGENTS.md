# Q — 灰の巡礼

Qの主目的はスマートフォン向けオープンワールドアクションRPGの制作。
2026-09-13のユーザー指示で、旧リポジトリの内容をゲームへ置き換えた。完成期限は2026-09-20までの1週間以内。ユーザーは完成まで制作を続け、適宜mainへ反映することを指示している。試作の提出期限に読み替えない。品質目標の達成は未確認であり、根拠のない完成保証はしない。

着手時は README.md と docs/PROJECT_STATE.md を読む。現行のゲームはブラウザーで遊べる第一章の開発版。Elden Ring、The Witcher 3、Breath of the Wild、Skyrim、Red Dead Redemption 2、Ghost of Tsushima、Cyberpunk 2077、Horizon Forbidden West、Dragon’s Dogma 2、Kingdom Come: Deliverance II を品質目標としている。実測や実プレイに基づかず、これらに匹敵した、完成した、面白さを確認したと記録しない。

- src/core.js は描画に依存しないゲームルール。src/content.js は武器と副クエストの定義。src/spatial.js / src/navigation.js は衝突と経路。src/runtime-state.js は途中動作・敵・矢の保存。src/save-store.js はブラウザー保存の検証・復旧。src/woodland.js は描画と衝突で共用する木の配置。src/scene.js はThree.jsによる3D描画。src/main.js は操作、画面、進行保存。src/audio.js は手続き的な環境音と効果音。
- 操作、進行、保存の変更では該当する振る舞いを npm test で確認する。進行変更では npm run test:journey と npm run test:crossing も実行する。保存・経路変更では npm run test:session で30分相当の継続シミュレーションも行う。細かな表示だけの変更に不要な単体テストを増やさない。
- 成果物は npm run build と npm run package で生成する。release/Q-ash-pilgrim.html は依存ファイルが不要な起動版。生成物はソース変更と一致させる。
- 品質確認はビルド、ロジックテスト、ブラウザー操作、スマホ実機、プレイヤー評価を区別する。できなかった確認は理由とともに残す。
- src/village.js は住民の生活行動と鐘の探索クエスト、src/village-scene.js はその描画。住民・鐘・報酬の変更では npm run test:forge も実行する。三つの鐘を解いた状態と報告して報酬を得た状態を区別し、既存セーブを維持する。
- 薬草の配達後は、選んだ届け先に対応する住民だけが活動する。反対側の住民や旅人の薬箱を偽の対象データで操作可能にしない。分岐変更では npm run test:crossing の両経路を徒歩で確認する。
- 実際のプレイを第一にする。ゲームの紹介ページへ置き換えない。横向き・縦向き、複数指、画面離脱後の入力解除、読める文字、保存データを考慮する。
- 既存作品のキャラクター・音楽・マップ・固有の美術をコピーしない。制作した素材の出所と第三者ライセンスを維持する。
- docs/PROJECT_STATE.md に進行、検証結果、欠点、次の作業を残す。品質目標を小規模な初期版へ勝手に縮小しない。
- .openai/hosting.json はこのゲームのプレイ用Siteを指す。同じIDを使う。GitHub Qがゲームのソースであり、Sitesの閲覧範囲は所有者限定。認証情報をコードやGit設定へ保存しない。
