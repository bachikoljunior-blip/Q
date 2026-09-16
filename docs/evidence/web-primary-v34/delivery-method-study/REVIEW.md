# v34 配信方法の独立 read-only 診断

通常プレイを既存の所有者限定・複数ファイル Site に置き、単体 HTML を補助配布へ分離するのが適切です。16 MiB をゲーム全体の美術容量へ適用する根拠は、今回読んだコードにはありません。初期 JS、起動時の媒体、利用地域の媒体、GPU/CPU 常駐量を別々に検証する必要があります。これは画像品質を下げる案でも、上限だけを上げる案でもありません。Site の正式な個別ファイル・総量・配信ヘッダー制約を、本診断から「無制限」とは結論しません。

対象は Q-ps4-v32 `67baa205ac2dcc1bba8248884161b8df095b3f36` と Q-ps4-v33 `7cbff3c899b789d4087b3ff2cc572f62818f9e24`。初回観測時の後者の未保存変更は tests/cloak-uv、専用 fixture/generator、統合証拠でした。終了時には親の統合作業によるCI/release/doc差分もあります。この診断は変更していません。全27媒体の原 byte / SHA256 は v32 と v33 で同一です。v33 の dist は現 sourceFingerprint `sha256:1dd4272849764e2f31b501044d21912f8e93638ea7bb7593499968d2b90896bc` と一致。観測時の v33 release HTML は 16,435,231 B で旧 v32 のまま、現 sourceFingerprint を含まないため、最新単体成果として扱いません。独立 build/package は実行していません。終了前の再読取では親の package が更新され、v33 release は **15,498,171 B / 現sourceFingerprint一致**へ進んでいました。初回stale観測を新しい成果の欠陥とは扱いません。

**制約の意味を分離する。**

| 制約 | 実コード上の根拠 | 今回の解釈 |
|---|---|---|
| 初期 JS <165,000 B | scripts/verify-artifacts.mjs:17–24 | コメント自体が調整可能な転送回帰ガードと明示。端末性能や Site 容量上限ではない。現 v33 は164,988 Bで余白12 B。 |
| JS 3 chunks | 同:27–30、vite.config.js | entry / deferred scene / Three の現在の構成を固定する回帰検査。媒体の必要時 fetch は追加 JS chunk 無しでも可能。将来の chunk 分割を採用する際は、単に数値を緩めず、新 graph と初期到達性・転送量を検査する。 |
| 単体 <16 MiB | 同の standalone assert（文言 publishing blob limit） | 単体成果へのローカル検査。現在の Site 本体は同 HTML を配信しておらず、dist の34ファイルを stage-site.mjs で選ぶ。正式 host cap はこの assert から導けない。 |
| 原媒体の byte 一致 | vite manifest / verify-artifacts / 各 provenance | Web の source→dist→stage の完全性として残す。単体埋込との一致検査は補助 package の専用ゲートに移す。 |
| 24 MiB decoded audio cache | src/audio.js:24、file-audio-bank.js:31 | Map 内の PCM 計数を制限する。decode 中の buffer、再生 node が保持する旧 buffer、noise/reverb まで含むプロセス総メモリ上限ではない。 |
| GPU/端末メモリ | image dimensions / texture configuration / sky budget | 転送 byte と別。JPEG/WebP をさらに小さくしても同寸法 RGBA upload は減らない。今回 GPU 実測は無い。 |

AGENTS.md は同一 Site ID / 所有者限定範囲、現 graph の stage 使用、ソースと生成物の一致を要求しています。通常 Site の高品質化を常に単体 HTML の容量へ合わせるとは明記していません。ただし旧手順は build/package/test:artifacts を一連で要求するため、正式に Web と補助単体の検証手順を分け、AGENTS・CI・記録を一緒に更新する必要があります。脚注的に assert を消すだけではありません。

**実ファイルと要求時点。** 以下は原ファイルサイズの合計です。HTTP 転送実測ではありません。媒体 URL を import するだけでは画像・音声ファイルの fetch は発生しません。

| 対象 | files | v33 raw bytes | コード上の要求時点 |
|---|---:|---:|---|
| entry JS | 1 | 164,988 | HTML module entry |
| CSS / HTML / icon / manifest | 4 | 68,149 | 初期ページの参照（manifest/icon の実要求は browser による） |
| title poster WebP | 1 | 162,962 | style.css:35 の表示背景 |
| title MP4 | 1 | 3,178,191 | window load 後 +300 ms、active/focus/visible、saveData/reduced-motion/user pause を考慮して src を設定し play を要求 |
| score MP3 3 stems + foley WAV | 4 | 1,499,890 | gesture で AudioContext 再開後。foley と最初の stem は並行、stems は順次 decode、共通 clock で開始。music=false なら score を取得しない |
| scene + Three JS | 2 | 910,993 | start/continue/import の ensureView による dynamic import |
| world launch images/HDR | 11 | 5,777,273 | createSceneView の Promise.all。環境3、植生2、空1、肌1、全 vault 4 |
| vault ambient WAV | 4 | 705,776 | 各 vault の入場・音声 active 時、各1本 |
| vault shared cue WAV | 6 | 117,570 | 必要な cue が初めて発生したとき |
| 全 public graph | 34 | **12,585,792** | 全てを初期一括取得する意味ではない |

全27 media は **11,441,662 B**。最初の shell/poster 等は396,099 B、ゲーム開始の追加 JS＋11媒体は6,688,266 Bです。音や MP4 が別途同時に要求される場合があるため、後者だけを全起動通信量とは呼べません。MP4 は browser の Range、先読み、キャンセル、HTTP cache で実取得量が変わり、3.178 MB を必ず一括取得するとは主張しません。

vite manifest の initial assets list は20件を列挙していますが、実 entry に含む19媒体の URL は vault 14 / soundscape 4 / video 1、poster は CSS URLです。遅延 scene の新規 URL は残り7媒体、vault画像4の URL は entry から共有しています。原 GLB、元肌 full PNG/mesh/morph、CC0録音13 WAVなど authoring source は current graph にありません。初期 URL 登録を媒体の eager fetch と数えないよう、asset-inventory.json の url_in_initial_js と phase を分離しました。

audit-phases.mjs は production Soundscape を unchanged で memory-only bundle し、fetch/Web Audio を明示した fixture へ接続しました。constructor の要求0→gesture start 4→ember entry 1追加→初step 1追加→suspend/resume cached score/foley の追加0。production title controller は load 前 srcなし、load後timer待ち、timer後src設定、launch時src解除要求、saveData/reduced時srcなしを再現しました。正確に抽出した production createSceneView と vault loader は、他 loader が解決済みでも vault 4画像待ちで SceneView 未構築となることを確認しました。これらは実HTTP取得量、画像decode、実音、WebGLの証拠ではありません。

v33 packed-media は媒体を1ファイルへlossless packingし、実行時に元data URLへ復元する方法です。通常 Site は元の外部媒体URLを使うため、この独自 decoder を使いません。単体では初期媒体19件のURL復元が初期module評価で発生し、遅延7件は scene 初期化時に復元されます。HTTP cacheで媒体ごとの再利用もできません。既存 docs/STANDALONE_ENCODING_V33.md は以前の固定fixtureで追加CPUを明記しており、その古い数値を新しい browser 性能値として再利用しません。今回のユーザー提案を、この追加CPUを当然受け入れる理由にはしません。

**メモリは配布容量より大きい。** budget-arithmetic.json は実画像寸法と設定からの形式的payload、および実FFmpeg decodeのPCM byteを保存しています。正式音の試聴は行っていません。

| 保持対象 | 計数 bytes | 境界 |
|---|---:|---|
| 肌 2048² RGBA8 + 全mips | 22,369,620 | WebP原541,954 Bと別 |
| 環境3 × 1024² RGBA8 + mips | 16,777,212 | 原3,403,723 Bと別 |
| 植生2 × 512² RGBA8 + mips | 2,796,200 | CPUにもnative mip配列を保持 |
| vault4 × 128² RGBA8 + mips | 349,520 | 4枚合計原68,499 B |
| HDR可視RGBA16F + PMREM | 5,767,168 | CPU原half float 4,194,304 B、生成時input/ping追加2,621,440 Bは別 |
| 上記ファイル由来texture計 | **48,059,720（45.833 MiB）** | 全GPU量ではない。ground contact262,144 B、procedural fields、骨/頂点/instance buffer、shadow/framebuffer等を除く |
| score3+foley PCM float32/22.05kHz | **18,587,052** | actual FFmpeg gapless decode。MP3 container48.065秒とdecoded48秒を区別 |
| 全14音のPCM合計 | **20,232,864** | 24MiB cache未満。ただし全て常時読込ではない |

title poster の単純RGBA baseは6,293,408 B、720pのRGBA1frameは3,686,400 B、title canvas上限は6,400,000 Bです。video decoderの実内部format・参照frame数・compositor保持量は未測定なので、これを合計して実常駐と呼べません。launch時のvideo src解除は解放要求であり、物理メモリの即時回収保証でもありません。TextureLoader cacheはアプリ寿命、SceneViewはタイトルへ戻っても保持され、現行は地域stream/disposeを行いません。

理想回線時間の条件付き算術は `seconds = raw bytes × 8 / bits-per-second`。5/20/50 Mbpsそれぞれ、shell約0.634/0.158/0.063秒、world追加約10.701/2.675/1.070秒、全34files約20.137/5.034/2.014秒です。HTTP圧縮、RTT/TLS、request同時数、cache、Range、decode、JS実行、shadercompileを除く算術であり、測定load時間ではありません。

**優先実装単位。**

1. Webを通常配信の正式成果にする。scripts/verify-artifacts.mjs の source→dist→stage/identity/media provenance/initial graph検証をWeb専用に維持し、standaloneの埋込/16MiB検証を独立させる。scripts/package.mjs は明示的補助生成、CI/package.json/AGENTS/docsも同時更新し、単体未生成をWeb不合格と混同しない。古いrelease HTMLを最新と表示しない。version付きWeb receiptにsourceFingerprint/manifest/fullmediahash/34filesを保存する。既存URL/owner/save schema/runtime sourceを維持できる、最小で効果の大きい工程変更です。
2. 次のruntime単位として vault地域画像4枚を起動待ちから分ける。src/scene.js:createSceneView、vault-textures.js、vault-scene.jsを中心に、scene chunk内の小さなregion asset managerで既存3JSを維持する。起動shared7媒体5,708,774 Bと地域4媒体68,499 Bを別群にし、プレイヤーのロード済みsave地点とcameraから見える近傍を優先。遠方の単なる入場判定だけでは外から見える壁が遅れるので、視認距離/走行速度に先行するprefetchとhysteresisを設計する。物理geometry・NPC・世界配置・保存は維持する。到着前readiness、失敗と再試行、pause/teleport中のstale completion、共有materialの付替えとtexture所有権を検査する。

地域4画像の起動転送削減は現状 **68,499 B（起動媒体の約1.19%）**、全textureを4→1保持なら形式的GPU payloadは262,140 B減に留まります。これを大きな画質改善やFPS改善と宣伝しません。価値は未来の地域素材を起動・常駐へ加算しない契約を先に作ることです。現shared空/地形/肌が支配的で、通常配信の工程分離が先です。

失敗時は今の main.ensureView がpromiseを解除しfatalと再読込を案内するだけで、細かいbyte進捗・cancel・timeoutはありません。新managerでは同一asset requestのdedupe、失敗promiseの解除、retry回数/間隔、generation token、取得途中離脱の扱いが必要です。loadVaultTexturesの現Promise.allは一部成功後の失敗に対する成功texture disposeがないため、そのまま地域managerへコピーしないこと。HTTPキャッシュ、JS内pending cache、decoded texture/audio cacheを別管理し、scene/materialから参照中のtextureをevictしない。最初の変更でshared媒体を画質の低い代替へ交換する必要はありません。

HTTP cacheの利用可否はURLと実Cache-Control/ETag/Vary等に依存します。hashed URLは同一媒体の再利用に適しますが、所有者限定レスポンスを勝手にpublic化してはいけません。実Sitesheaderは未取得です。キャッシュ保存/再利用は任意であり、常にhitする保証はありません（[IETF RFC 9111](https://httpwg.org/specs/rfc9111.html#caching.overview)、[authenticated response](https://httpwg.org/specs/rfc9111.html#storing.authenticated.responses)）。現在runtimeにService Worker/CacheStorage/IndexedDB asset cacheはなく、manifestのdisplay:standaloneだけでオフライン配布やnative性能にはなりません。永続cacheを後で採用する場合も、quota/eviction/認証期限/更新・旧version削除の設計が必要です（[Storage quotas](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)）。Web AudioのPCM channel配列の性質は[公式Web Audio仕様](https://www.w3.org/TR/webaudio/#AudioBuffer)とも整合します。

親の正式経路確認を受領しました。Sites hosting/references/publishing.md と native save tool は複数static files/archiveを許可し、総量最大値は明記していないとのことです。親が読んだ package-site.mjs → skills/sites-hosting/scripts/package-site.sh / prepare-site-build.cjs に16 MiB assertはありません。これは親からの確認記録で、本子による再実行ではありません。[Cloudflare公式制限](https://developers.cloudflare.com/workers/platform/limits/) はstatic asset 1件25 MiB、file count free20,000 / paid100,000を記載しています。ただしSites独自quotaが同一とは保証しません。現在の最大媒体MP4は3,178,191 Bでその参考値未満ですが、それだけで将来の全Site容量を承認済みとはしません。

ユーザーの「プレイする方法を見直す」を広く比較すると次の選択肢があります。現時点の推奨は第一行で、wrapperや別engineは本単位に無断で導入しません。

| 方法 | 解ける問題 | 解けない点と追加工程 |
|---|---|---|
| 既存ブラウザーURL＋段階的媒体配信（推奨） | 全媒体を単一HTMLへ埋める制約、使わない地域の先行転送・常駐。所有者/URL/操作/保存を維持しやすい | ブラウザーdecoder、WebGL shader/GPU、入力実機品質は引き続き検証。今のコードで最小範囲から進められる |
| PWA / オフラインcache | 再訪・一時的通信断への耐性、ホーム画面からの起動 | 同じブラウザー/WebGLが基本で描画品質・GPU不足を自動解消しない。quota/eviction、複数version、logout後に所有者向けassetが残る認証モデル、端末別インストール/更新/オフライン試験が必要。今回は無断導入しない |
| Native app wrapper | 配布パッケージ、端末API、ローカル媒体管理の選択肢 | WebViewなら既存decoder/GPU問題は残る。署名・ビルド環境・配布経路・アカウント/権限・iOS/Android別入力/保存/性能試験を追加する。実移植時間は未計測で、9月20日の品質制作を遅らせるリスクがある |
| 別engineによるnative実装 | native向けasset streaming、GPU圧縮/LOD等を別構成で設計できる可能性 | gameplay/保存/衝突/アニメ/音/素材shaderを移植・比較する新制作。PS4風の品質や端末性能を自動で得ない。既存gateは移植後実装を直接保証せず、移植速度も未測定。現期限の近道と断定できない |

今回はread-only diagnosisとしてここで固定します。repo/Site/remote変更、新spawn、preview/server、外部サービス/購入はありません。画面・実機・HTTPトレース・実聴・PS4相当の受入合格は未取得です。検証データを作品品質へ読み替えません。
