# 単体 HTML の媒体表現候補 — v33

元の圧縮済み媒体 27 件・11,441,662 B を保持して、単体 HTML を 16,331,434 → **15,393,094 B** にした。938,340 B の節約で、16 MiB 上限までの余白は 1,384,122 B。ただし Node の同条件比較では起動・旅開始の CPU 負荷が増えた。これは容量を確保する制作方法の候補であり、端末性能、写実画面、PS4 品質の合格ではない。

基点は `892f7e59f602e20da62bf1c8708e432ce1eac637`。ソース、従来の通常 Vite 構成、画像・音・動画・HDR の内容、解像度、圧縮設定は変更していない。現候補の生成 HTML SHA256 は `df465ffa7b282d9f014c63b2ef5dea6b995be6cd6fc73cae33be15fe74f77737`。基点の HTML は `8f659340f1eecf5984287486c8f94d00de384ff6b677625e0c03716958e8945e`。

## 実装と遅延読込

`scripts/packed-media.mjs` の 85 文字アルファベットで 4 バイトを 5 文字へ保存する。引用符、逆斜線、山括弧、バッククォート、空白を含めない。長さと MIME を含む `q85:` descriptor を、共通 decoder が元の base64 data URI へ復元する。復元は既存の esbuild 資産モジュール初期化時だけに行い、HTML 全体の媒体を走査して先行復元する処理はない。eval、new Function、外部 fetch、Blob script、新しいブラウザー圧縮・base64 API に依存しない。

`packed-media-plugin.mjs` は esbuild 自身の元の dataurl loader から MIME を得る。JavaScript import の 26 媒体だけを変換し、CSS のポスター 1 枚は従来の data URI を維持する。CSS 275,888 B は基点と完全一致。初回表示のために CSS を JavaScript で復元する経路は追加していない。

実際の生成 IIFE を未改変で Node DOM fixture へ渡すと、初期 title で 19 件・5,569,926 B、旅開始時だけに world の 7 件・5,708,774 B を復元する。初期 19 件はタイトル動画、vault の画像、既存 eager な音の資産 URL 初期化を含む。音声 codec や音の再生が初期に動いたという意味ではない。world は地面・岩の 3 JPEG、空の HDR、森林 2 PNG、顔の WebP。通常 Vite の同じ遅延 graph を維持する。

26 件の base64 payload と packed digits の差は 939,890 B。実際の HTML との差から求めた helper・descriptor・wrapper の純増合計は 1,550 B、そのうち esbuild metafile が decoder に帰属した minified 出力は 1,244 B。先行調査の全 27 媒体案 953,469 文字節約とは CSS の 13,579 文字分が異なる。先行調査の一回限りの 705.276 / 421.650 ms を現候補の性能改善値にしていない。

## 同条件の CPU・メモリ記録

同じ Node fixture で元 HTML と候補を baseline → candidate → candidate → baseline の順に各 2 回実行した。各回前に明示 GC を行い、その時間は表に含まない。title は VM parse、DOM fixture 作成、IIFE 初期化、媒体復元まで。launch は実際の scene module 初期化と明示した画像/HDR decode 失敗、title 復帰まで。ブラウザー、画像・動画 codec、WebGL は模擬成功させていない。

| 順番 | 形式 | title (ms) | launch (ms) | V8 used heap: 開始 → title 後 → launch 後 (B) |
| --- | --- | ---: | ---: | --- |
| 1 | 元 base64 | 112.123 | 86.112 | 72,973,456 → 99,641,128 → 102,042,600 |
| 2 | packed | 393.584 | 340.916 | 105,500,280 → 209,812,552 → 147,609,784 |
| 3 | packed | 499.403 | 264.197 | 120,059,992 → 193,199,592 → 220,309,600 |
| 4 | 元 base64 | 32.667 | 56.526 | 135,286,312 → 161,936,856 → 195,189,536 |

追加 CPU は明確である。一時バイト配列は資産ごとに 1 個、最大は動画の 3,178,191 B。さらに元の packed string、base64 を作る 8,192 文字単位の chunk、結合後の data URI が必要になる。VM 内の文字列や GC の生存期間を確定計測したものではない。

表の V8 値は process 全体の各時点の snapshot であり、両 HTML 文字列、fixture、観測器の割当も含む。初期値が回ごとに同一ではなく、増減から peak、leak、端末 RAM、GPU メモリを断定できない。OS RSS は `process.memoryUsage()` が `ENOENT uv_resident_set_memory` で失敗したため未取得。その失敗後に `node:v8` の正式な heap snapshot 値へ測定を限定し、別の `/proc` アクセスを試していない。

## 保持した検証

- 実 HTML の全 26 packed literal を復元し、CSS ポスターと合わせた全 27 ファイルについて source → Vite emitted → 固定 stage → standalone の byte 完全一致を確認した。元の verify-artifacts の個別 provenance、元 source hash、媒体除外、全 byte 比較は保持し、復元した byte を同じ assertion に入れる。
- focused test は全媒体を元 esbuild data URI と照合する。字句の存在だけに弱めず、完全 SHA と byte で同一性を調べる。script closing と `<script>` 数も確認した。
- 長さ 0–16 と 255/256/257、8191/8192/8193 の復元、切断、不正 digit、不正 header、uint32 overflow、非 zero padding を検証した。意味のある byte 破損が source identity を通らないことも確認した。
- 共通 helper と plugin は build fingerprint の入力。変更時に fingerprint が変化し、不在時に ENOENT で失敗することを独立した小 fixture で確認した。
- 本番 main の既存 Node runtime 18 scenarios、媒体・実 HTML 5 tests の 23/23 が成功（9.764 秒）。その後追加した fingerprint gate を含む decoder 4/4 が成功（0.149 秒）。合わせて重複を除く 24 tests を確認した。
- `npm run build`、`npm run package`、`npm run test:artifacts` が成功。通常配信は初期 JS **164,493 B / 165,000 B**、3 chunks、全 JS 972,530 B。媒体の hash は不変、fingerprint とそれを含む chunk 名は正しく更新される。単体上限 16 MiB は緩めていない。

Node fixture の unavailable image/HDR 境界ではゲーム初期化は失敗して title へ戻る。成功した WebGL/gameplay 後の restart、実 codec decode、実聴、物理入力、実画面はこの測定では未確認。[独立 Ultra review](evidence/standalone-encoding-v33/review/REVIEW.md) は元 source から BigInt で別復元し、全 27 媒体の byte/MIME と、実 decoder の完成後 buffer 26 個の SHA を確認した。title pause/visibility/start fail/retry/settings は元 HTML と同値、再試行時の追加復元は 0。必須修復なしで有限範囲 PASS。既存 source runtime gate と、成功した描画の受入れは区別する。独立測定の launch 値は再試行も含むため、上の単一 launch の表と混ぜない。

## 保存と工程

正本は [production.json](evidence/standalone-encoding-v33/production.json)、[runtime.json](evidence/standalone-encoding-v33/runtime.json)、[実比較入口](evidence/standalone-encoding-v33/compare-runtime.mjs)。各 source、helper、生成物、元調査の SHA と byte を保存した。再実行は通常の build/package/artifact gate 後、`node --expose-gc docs/evidence/standalone-encoding-v33/compare-runtime.mjs <元 HTML の絶対パス>`。比較元 HTML 自体は重複追加しない。候補生成物はローカル `artifacts/standalone-candidate.html` に固定し、親の統合時に全結合 source から再生成する。

元調査 4 ファイルは `/workspace/scratch/e72662e3b71f/q-v33-standalone-encoding-study/` から byte を変更せず `evidence/standalone-encoding-v33/study/` に保全した。調査段階の v30 を、今回の v31 基点と混同しない。

本単位の開始は 2026-09-16 05:00:29Z、数値・source 安定 checkpoint は 05:17:19Z（壁時計 16 分 50 秒、configure 待ちと検証を含む）。新媒体の取得・画像加工は 0 件。手戻りは RSS 測定の非対応、同長 audio の名称を長さだけで断定しない観測器修正、test が古い checked-in release に依存しない packager export の整理。これらの作業別 stopwatch は採っておらず、総 wall time から実装時間と分離した架空の値は作らない。

統合・採用は CPU と一時メモリの代価を踏まえた親の判断へ返す。正式画面不足は維持するが、品質素材の byte を削らず制作を続けるための再現可能な候補を失わない。
