# EXACT WORKFLOW REDUCTION — 2026-08-30

Status: **NO_ACTIVE_CANDIDATE / build_approved=false**

Source queue: `research/discovery_queue/latest.json`  
Source generated: `2026-08-30T09:21:50+09:00`  
Source SHA-256: `a17e9336b184dddd869700a5348d58fe4b2ef20dabdd361dd442e01bbba94509`  
Queue rows reviewed: **69 / 69**  
Promoted rows: **0**

## Why this pass exists

前回は `NO_ACTIVE_CANDIDATE` を停止条件として扱い、`NEEDS_EXACT_WORKFLOW` の69行を終端させないまま完了報告した。これは completion-before-response rule の違反だった。

このpassでは、機械分類件数を需要とみなさず、各行のレビュー本文を確認し、同一buyer・同一input・同一processing・同一outputへ還元した。各行を `REJECTED` または昇格のどちらかへ終端させ、昇格候補については直接競合、代替、重複、獲得、採算を同一cycleで判定した。

## Result

69行は18 workflow familyへ集約された。

- 17行: shift/pay — 既存の同一成果商品、法令・手当・締日保守、以前のfull vetoにより再棄却
- 11行: pronunciation/voice scoring — 直接競合と無料代替
- 8行: karaoke platforms — 楽曲権利または既存サービス内部の録音・採点・SNS不具合
- 4行: bank apps — 銀行固有の認証・口座・本人確認・送金ポリシー
- 4行: OCR scanners — 自動課金/価格不満であり、買い切り・無料・標準機能が既に存在
- 3行: SPI privacy — exact complaintは確認したが登録不要無料代替が直接存在
- 3行: vocal range — exact complaintは確認したが同一workflow商品が多数
- 2行: countdown widgets — exact complaintは確認したが無料の同一workflow商品が多数
- 2行: FP3 current-law practice — exact complaintは確認したが2026対応商品が多数、継続監修が必須
- その他9行: first-party bug、誤分類、10件未達、無料代替

**同一未解決workflowが10件以上確認できたものは4 family**だった。

1. SPI登録後の営業電話・メール: 27 unique reviews
2. 音域測定のオクターブ/倍音/ノイズ誤認: 16 unique reviews
3. FP3の法改正未反映・誤答: 13 unique reviews
4. カウントダウンwidget/通知の日跨ぎ更新失敗: 12 unique reviews

ただし、complaint thresholdは需要の入口にすぎない。4 familyすべてが duplicate/free substitute/maintenance/acquisition/economics のいずれかで棄却された。

## Candidate A — reliable countdown widget

### Exact workflow

`試験・締切・記念日を複数持つiPhone利用者が日付を入力 → 端末上で残日数を再計算し日跨ぎ/再起動後も更新 → Home/Lock Screen widgetと通知へ正しい残日数を表示 → 無料または買い切り`

### Manually confirmed exact complaints

12 unique reviews。対象ID:

`14389208818, 14267778369, 14082770662, 14038390548, 14028722837, 14025937171, 13995434794, 13230267563, 13213293122, 13199623785, 12589821034, 12531874274`

共通成果は「アプリを開かなくても、widget/通知の残日数が日跨ぎで正しく進む」。複数イベント表示、週表示、次イベント自動繰越はadjacent requestとして別扱いにした。

### Direct products

| Product | Input | Processing | Output | Price/model | Overlap |
|---|---|---|---|---|---:|
| Kounts | event/date | automatic day refresh, recurrence, next-event follow | Home/Lock widgets, Live Activities | free core; optional yearly/lifetime | 95% |
| CountFree | date/time | count up/down, flexible units | unlimited widgets | fully free, no ads/paywall | 95% |
| Day Grid | events/dates | recurring events, live countdown under 24h | Home/Lock widgets, year grid | free; optional Pro | 90% |
| Event Countdown Timer & Widget | events/dates | recurrence, reminders, sync | multiple countdowns and 6 widgets | free + annual Pro | 90% |
| CNDWN | events/dates | count up/down, reminders, iCloud | Home/Lock/StandBy widgets, Live Activities | all listed core features free | 95% |
| Pend | events/dates | recurrence, collections, iCloud | Home/Lock widgets, Live Activities | free + one-time Pro | 90% |

Sources:
- https://kounts.app/
- https://countfree.app/
- https://daygridapp.com/
- https://apps.apple.com/jp/app/event-countdown-timer-widget/id1464521575
- https://apps.apple.com/jp/app/cndwn-countdown-timer-widget/id6455257754
- https://apps.apple.com/jp/app/pend-countdown-widgets/id6762518010

### Substitutes

1. Apple Calendar event alerts
2. Apple Reminders due dates and recurring reminders
3. Google Calendar notifications
4. iOS Shortcuts date-difference automation
5. paper/desktop calendar or exam-planning widgets already bundled with study apps

### Gate

- Duplicate veto: **FAIL** — multiple products overlap 90%+; free core exists.
- Override evidence: **NONE** — complaints target two malfunctioning apps, not the absence of reliable alternatives.
- Acquisition: **FAIL** — broad App Store query is crowded; no owned audience, measured query rank, conversion, or CAC.
- Economics: At ¥600 one-time and a 15% store commission, proceeds are about ¥510/sale. Even before tax, refunds and support, ¥200,000 requires **393 sales/month**. At ¥980 it still requires **241 sales/month**. Free exact alternatives make this acquisition burden unsupported.

Decision: **REJECT_EXACT_DUPLICATE / FREE_CORE_EXISTS**

## Candidate B — accurate vocal range measurement and song matching

### Exact workflow

`カラオケ利用者が最低音・最高音を発声 → 倍音/ノイズ/オクターブ外れ値を除外してpitch rangeを確定 → 合う曲と移調候補を複数表示 → 無料または買い切り/低額subscription`

### Manually confirmed exact complaints

16 unique reviews。対象ID:

`14215109156, 13881568643, 13783227185, 13779227091, 13541963754, 12871071110, 8978286248, 8239753936, 7829723072, 6317296389, 10221362904, 8924085380, 8001244914, 6079105757, 5882194711, 5764557451`

共通成果は、倍音・子音・背景ノイズ・オクターブ誤認を除外し、最低音/最高音と曲推薦を信頼できる値で返すこと。

### Direct products

| Product | Input | Processing | Output | Model | Overlap |
|---|---|---|---|---|---:|
| Sing Whiz | guided low/high notes | vocal-range detection | voice type, artists, song matches | free + premium | 100% |
| VoiceVault | vocal range / song query | verified song-range database | songs matching voice | free | 90% |
| Singing Carrots | selected/measured range | range/difficulty/genre filters | matching songs and repertoire | web service | 90% |
| Vocal Gauge | singer range + song | compare/transpose song key | in-range songs and new key | free + premium | 95% |
| Karaoke Star | live voice or known comfortable songs | range inference and song search | songs fitting range | free | 95% |
| HumMatch | short hum | Vocal ID + range/difficulty ranking | ranked matches from 60,000+ songs | web app | 95% |

Sources:
- https://singwhiz.app/
- https://apps.apple.com/jp/app/voicevault/id6741833897
- https://singingcarrots.com/search
- https://apps.apple.com/us/app/vocal-gauge-range-transposer/id1624908530
- https://apps.apple.com/gb/app/karaoke-star/id6766224185
- https://hummatch.me/

### Substitutes

1. chromatic tuner/pitch detector apps plus manual lowest/highest-note logging
2. piano/keyboard scale test
3. vocal teacher or coach assessment
4. karaoke key-change function and trial singing
5. song-range databases searched manually without automatic measurement

### Gate

- Duplicate veto: **FAIL** — at least six products provide the same input, processing and final outcome; several are free.
- Override evidence: **NONE** — complaints prove one app's detector is poor, not that buyers cannot switch.
- Acquisition: **FAIL** — no measured Japan query rank/CAC or owned singer audience.
- Economics: At ¥1,500 one-time and 15% commission, proceeds are about ¥1,275/sale; ¥200,000 requires **157 sales/month** before tax, refunds and support. A free exact competitor already claims the same 60-second range test and song matches.
- Support/maintenance: song-range catalogs, pitch edge cases, device microphones and false-match disputes create continuing work.

Decision: **REJECT_EXACT_DUPLICATE**

## Candidate C — FP3 current-law question bank

### Exact workflow

`2026年度FP3受検者が受検月/法令基準日を選ぶ → 法令基準日にversionedされた問題と解説を出題 → 誤答理由・改正差分・根拠を表示 → 買い切りまたは低額subscription`

### Manually confirmed exact complaints

13 unique reviews。対象ID:

`14465752590, 14395194787, 14373541151, 14262889344, 14089064218, 13423144847, 13182847831, 13172966655, 14129437140, 14073745008, 12956932885, 12218337829, 11788261516`

共通成果は「受検時の法令基準日に合った正答と解説」。日本FP協会の2026年度日程では、2026年4–5月受検と6月以降で法令基準日が変わるため、継続的なversion管理が必要。

### Direct products

| Product | 2026/current-law claim | Problems/features | Model | Overlap |
|---|---|---|---|---:|
| FP3級Pass | 2026-04-01制度反映 | 530問、学科/実技、模試、選択肢別解説 | free + IAP | 100% |
| FP3級 独学TODAY | 令和8年度法改正対応 | 555問、解説、復習、法改正まとめ | free + IAP | 100% |
| スマ学 FP3 | 2026年6月以降対応 | 教科書、過去問、AI、更新履歴 | app/IAP | 95% |
| FP3級学科試験対策 | 2026年6月以降、法改正対応 | 465問以上、弱点、模試、用語 | free + one-time premium | 100% |
| FP3級 秒トレ | 2026–2027版 | 要点、忘却曲線、反復 | free + IAP | 90% |
| FP3級 一問一答 2026 | 2026向け | 500問、全解説、offline | ¥600 one-time | 90% |

Sources:
- https://apps.apple.com/jp/app/fp3%E7%B4%9Apass-fp3%E7%B4%9A%E8%A9%A6%E9%A8%93%E5%AF%BE%E7%AD%96/id6769005211
- https://apps.apple.com/jp/app/fp3%E7%B4%9A-%E8%A7%A3%E8%AA%AC%E4%BB%98%E3%81%8D%E5%95%8F%E9%A1%8C%E9%9B%86-%E7%8B%AC%E5%AD%A6today/id6737531453
- https://apps.apple.com/jp/app/fp-3%E7%B4%9A%E5%90%88%E6%A0%BC%E3%81%B8%E3%81%AE-%E6%95%99%E7%A7%91%E6%9B%B8-%E9%81%8E%E5%8E%BB%E5%95%8F-ai-%E3%82%A2%E3%83%97%E3%83%AA-%E3%82%B9%E3%83%9E%E5%AD%A6/id1604690308
- https://apps.apple.com/jp/app/fp3%E7%B4%9A%E5%AD%A6%E7%A7%91%E8%A9%A6%E9%A8%93%E5%AF%BE%E7%AD%96/id6764540453
- https://apps.apple.com/jp/app/fp3%E7%B4%9A-%E5%AD%A6%E7%A7%91%E8%A9%A6%E9%A8%93-%E7%A7%92%E3%83%88%E3%83%AC-2026-2027%E5%B9%B4%E5%BA%A6-%E6%9C%80%E6%96%B0%E5%AF%BE%E5%BF%9C/id6762339245
- https://apps.apple.com/jp/app/fp3%E7%B4%9A-%E4%B8%80%E5%95%8F%E4%B8%80%E7%AD%94-2026-%E3%82%B9%E3%82%AD%E3%83%9E%E6%99%82%E9%96%93%E3%81%AE-%E5%AF%BE%E7%AD%96/id6791726329

### Substitutes

1. 日本FP協会の公表試験問題・模範解答
2. 金融財政事情研究会の試験要綱・過去問題
3. FP3級過去問道場
4. TAC等の年度別テキスト/問題集
5. オンスク、スタディング、大原等の更新型講座

Official sources:
- https://www.jafp.or.jp/exam/schedule/index.shtml
- https://jafp.or.jp/exam/mohan/
- https://www.kinzai.or.jp/ginou/fp/3kyu/index.html
- https://fp3-siken.com/

### Gate

- Duplicate veto: **FAIL** — 2026法改正対応を明示するアプリが複数あり、workflow overlapは90–100%。
- Free/first-party substitute: **FAIL** —公式問題・模範解答と無料過去問サイトがある。
- Continuing labour: **FAIL** —法令基準日の変更、税・年金・NISA等の改正、誤答監修、問題利用権の確認が毎年必要。zero-touch運営に反する。
- Acquisition: **FAIL** — App Storeと検索結果に2026対応商品が多数。狭い未占有queryやowned distributionの実測なし。
- Economics: 競合と同じ¥600買い切りではproceeds約¥510、¥200,000に **393 sales/month** が必要。¥980でも **241 sales/month**。税、返金、監修費を含まないため実際の手取り要件はさらに高い。

Decision: **REJECT_EXACT_DUPLICATE / HIGH_CONTINUING_MAINTENANCE**

## Other repeated clusters closed before full candidate promotion

### SPI privacy

27 unique reviewsで、登録後の営業電話/メール、着信拒否後の別番号、退会後の継続が反復した。これはexact painである。

しかし成果は「電話番号を渡さずSPI問題を解く」であり、以下が既に直接存在する。

- 登録不要・完全無料のSPI言語/非言語アプリ
- 登録不要・無料451問のWeb問題集
- 高橋書店の無料SPI3対策アプリ
- 紙のSPI問題集
- 会員登録せず使える既存アプリ範囲

Sources:
- https://apps.apple.com/jp/app/spi%E8%A8%80%E8%AA%9E-%E9%9D%9E%E8%A8%80%E8%AA%9E-%E5%AF%BE%E7%AD%96%E5%95%8F%E9%A1%8C%E9%9B%86-%E5%B0%B1%E6%B4%BB%E8%BB%A2%E8%81%B7%E5%AF%BE%E7%AD%96%E3%82%A2%E3%83%97%E3%83%AA/id6745068651
- https://test-urako.jp/
- https://www.takahashishoten.co.jp/spi-app/

差分がprivacy/no-loginだけで、free core exists。**REJECT_FREE_EXACT_SUBSTITUTE**。

### Pronunciation/voice scoring

ELSA, Speak, BoldVoice, Duolingo free practice, Speakivo等が発音判定・即時feedback・会話練習を既に提供。レビューは既存モデルの誤認を示すが、新規参入の精度優位を証明しない。音声モデル、言語/アクセント別評価、端末マイク差、継続教材更新も重い。

Sources:
- https://apps.apple.com/jp/app/boldvoice-%E8%8B%B1%E8%AA%9E%E3%82%B9%E3%83%94%E3%83%BC%E3%82%AD%E3%83%B3%E3%82%B0%E7%B7%B4%E7%BF%92-%E3%82%A2%E3%82%AF%E3%82%BB%E3%83%B3%E3%83%88%E5%AD%A6%E7%BF%92/id1567841142
- https://www.speak.com/
- https://blog.duolingo.com/guide-to-duolingo-practice-hub/
- https://speakivo.com/

**REJECT_EXACT_DUPLICATE**。

### Transparent one-time OCR scanner

Queueの主な不満は週額課金、自動trial、解約/返金、export制限であり、未解決OCR workflowではない。透明な買い切り/無料を差分にしても、ZipScan、Flatbed、ScanLite、ScanWow、FairScan等が既に同じ成果を提供し、iOS標準スキャンも代替になる。

Sources:
- https://apps.apple.com/us/app/zipscan-pdf-scanner-ocr/id6801303102
- https://apps.apple.com/us/app/flatbed-document-scanner/id6760355441
- https://apps.apple.com/us/app/scanlite-scan-to-pdf/id6780053638
- https://www.scanwow.io/
- https://apps.apple.com/no/app/fairscan-pdf-scanner-ocr/id6797058670

**REJECT_EXACT_DUPLICATE / PRICING_ONLY_DIFFERENCE**。

## Search log

検索実施日: 2026-08-30

1. `site:apps.apple.com/jp countdown widget multiple events iPhone countdown app`
2. `site:apps.apple.com countdowns events widgets lock screen iOS app`
3. `official countdown widget app multiple events iOS recurring events`
4. `TheDayBefore countdown app widget official iOS`
5. `official vocal range test app song recommendations singing voice range`
6. `site:apps.apple.com vocal range test song finder app iPhone`
7. `Singing Carrots vocal range test song search official`
8. `Vocaberry vocal range app official song recommendations`
9. `FP3級 2026 法改正 対応 アプリ 公式`
10. `FP3級 過去問道場 2026 公式`
11. `FP3級 CBT 2026 学習アプリ 法改正`
12. `日本FP協会 3級 CBT 試験範囲 2026 公式`
13. `site:apps.apple.com/jp FP3級 2026 法改正 app`
14. `FP3級 2026 オンスク 公式 講座`
15. `FP3級 2026 スタディング 公式`
16. `FP3級 2026 過去問 アプリ 最新 法改正`
17. `SPI 無料 問題 登録不要 公式 web`
18. `SPI3 無料 問題集 登録不要 アプリ`
19. `SPI ノートの会 無料問題 公式`
20. `リクナビ SPI 公式 模擬試験 対策`
21. `site:apps.apple.com/jp iPhone document scanner OCR one time purchase no subscription`
22. `official Scanner Pro pricing one time purchase OCR iPhone`
23. `official Adobe Scan free OCR pricing`
24. `Apple Notes scan documents OCR official iPhone`
25. `official ELSA Speak pronunciation feedback pricing`
26. `official Speak app AI pronunciation speaking practice pricing`
27. `official BoldVoice pronunciation app pricing`
28. `official Duolingo pronunciation speaking exercises free`
29. `site:developer.apple.com App Store Small Business Program 15% commission official`

Total exact-match queries: **29**

## Economics assumptions

- App Store Small Business Programのpaid app/IAP commission: 15%
- Source: https://developer.apple.com/app-store/small-business-program/
- ここでの必要販売数は税、返金、広告費、監修費、サポート費を引く前。したがって「手取り月20万円」の実数は表より多い。

| Price | Proceeds after 15% | Sales/month for ¥200,000 before other costs |
|---:|---:|---:|
| ¥600 | ¥510 | 393 |
| ¥980 | ¥833 | 241 |
| ¥1,500 | ¥1,275 | 157 |
| ¥2,980 | ¥2,533 | 79 |

いずれのfinalistにも、必要販売数を支えるowned distribution、App Store ranking、query volume、conversion、CACの実測がない。重複vetoが先に発動するためLP/決済/広告テストへ進めない。

## All 69 dispositions

| # | App / cluster | Workflow family | Decision | Reason |
|---:|---|---|---|---|
| 1 | OKBアプリ 大垣共立銀行-貯金＆通帳管理・口座の残高照会 / `missing_feature` | `BANK_FIRST_PARTY` | `REJECT_FIRST_PARTY_OR_POLICY` | 銀行固有のログイン・残高更新・送金/本人確認・広告問題。独立商品では修復不能。 |
| 2 | SPI言語・非言語 就活問題集 -適性検査SPI3対応- / `missing_feature` | `SPI_PRIVACY` | `REJECT_FREE_EXACT_SUBSTITUTE` | 登録後の営業電話は反復するが、登録不要・無料SPI問題集が既に存在。差分がprivacy/no-loginのみ。 |
| 3 | あと何日 カウントダウン&カウントアップタイマー / `missing_feature` | `COUNTDOWN_WIDGET` | `REJECT_EXACT_DUPLICATE` | 正確に自動更新するウィジェット需要は確認したが、無料を含む直接競合が多数。 |
| 4 | ELSA Speak：パーソナライズされた英会話アプリ / `missing_feature` | `PRONUNCIATION_AI` | `REJECT_EXACT_DUPLICATE` | 発音認識・採点の不満。ELSA/Speak/BoldVoice等の同一成果商品と無料代替が存在。 |
| 5 | ウォレットプラス/残高照会・収入や貯蓄/資産・現金の支出管理 / `missing_feature` | `BANK_FIRST_PARTY` | `REJECT_FIRST_PARTY_OR_POLICY` | 銀行固有の認証・口座表示・連携問題。独立商品では修復不能。 |
| 6 | ポケカラ－Pokekara 本格採点カラオケアプリ / `missing_feature` | `KARAOKE_PLATFORM` | `REJECT_FIRST_PARTY_OR_LICENSE` | 曲数、課金、録音、採点、SNS運営は既存カラオケプラットフォーム内部/楽曲権利問題。 |
| 7 | SoundHound音楽検索の認識とプレーヤー / `missing_feature` | `MUSIC_RECOGNITION` | `REJECT_FREE_EXACT_SUBSTITUTE` | 認識精度不満だがShazam/Google系など無料の同一成果代替がある。 |
| 8 | シフト管理ならシフト手帳！バイトのシフトも給料計算も一括管理 / `missing_feature` | `SHIFT_PAY` | `REJECT_PRIOR_VETO` | 既に同一成果アプリ多数、給与規則・法令・手当の継続保守が重いとして棄却済み。 |
| 9 | ハヤえもん - 音楽プレーヤー / `missing_feature` | `MUSIC_PLAYER` | `REJECT_FIRST_PARTY_DATA_BUG` | アプリ内データ消失・再生/端末連携不具合。第三者商品は当該データを救済できない。 |
| 10 | 「カラオケ診断」音域に合う曲が分かる 採点やボイトレ アプリ / `missing_feature` | `VOCAL_RANGE` | `REJECT_EXACT_DUPLICATE` | 音域誤測定は反復確認したが、音域測定＋曲推薦の直接競合が多数。 |
| 11 | シフト給料計算カレンダー / `missing_feature` | `SHIFT_PAY` | `REJECT_PRIOR_VETO` | 同一成果・法令保守・バックアップ差分を含め棄却済み。 |
| 12 | シフトボード：バイトの給料計算とシフト管理 / `missing_feature` | `SHIFT_PAY` | `REJECT_PRIOR_VETO` | 同一成果・法令保守・バックアップ差分を含め棄却済み。 |
| 13 | 分析採点JOYSOUND-カラオケ採点＆練習・カラオケアプリ / `missing_feature` | `KARAOKE_PLATFORM` | `REJECT_FIRST_PARTY_OR_LICENSE` | 採点/遅延/曲ライセンスは既存サービス内部問題。 |
| 14 | Google スプレッドシート / `missing_feature` | `SPREADSHEET_FIRST_PARTY` | `REJECT_FIRST_PARTY_OR_SUBSTITUTE` | Google Sheetsモバイル機能/同期不具合。Web/PC/Excel/Numbersで代替。 |
| 15 | シフト管理と給料計算のシフトカレンダー:バイトの勤務表にも / `missing_feature` | `SHIFT_PAY` | `REJECT_PRIOR_VETO` | 同一成果・法令保守・バックアップ差分を含め棄却済み。 |
| 16 | Smule: カラオケ録音＆デュエットを楽しもう / `missing_feature` | `KARAOKE_PLATFORM` | `REJECT_FIRST_PARTY_OR_LICENSE` | 録音/課金/SNS/曲ライセンスは既存サービス内部問題。 |
| 17 | みんなの銀行-お金管理・後払い・預金(貯金)・残高確認 / `missing_feature` | `BANK_FIRST_PARTY` | `REJECT_FIRST_PARTY_OR_POLICY` | 銀行固有の認証・口座制限・アプリ不具合。 |
| 18 | ScanGuru ドキュメント スキャン、PDF変換、OCR / `missing_feature` | `OCR_SCANNER` | `REJECT_EXACT_DUPLICATE` | 実質は週額/自動課金不満。買い切り・無料・標準スキャナが既にある。 |
| 19 | うたスマ Movie - 採点カラオケ歌い放題&練習 / `missing_feature` | `KARAOKE_PLATFORM` | `REJECT_FIRST_PARTY_OR_LICENSE` | 採点/曲/広告は既存サービス内部問題。 |
| 20 | 英検®トレーニング - 2級から3級に対応 / `missing_feature` | `PRONUNCIATION_AI` | `REJECT_EXACT_DUPLICATE_AND_CONTENT` | 英検音声練習は既存教材・アプリと重複し、現行問題/採点根拠の保守が必要。 |
| 21 | AI英会話スピーク - スピーキング練習で発音や英語を勉強 / `missing_feature` | `PRONUNCIATION_AI` | `REJECT_EXACT_DUPLICATE` | 発音/会話AIの直接競合が多数。 |
| 22 | ELSA Speak：パーソナライズされた英会話アプリ / `voice_or_speech` | `PRONUNCIATION_AI` | `REJECT_EXACT_DUPLICATE` | 発音/会話AIの直接競合が多数。 |
| 23 | シフト管理ならシフト手帳！バイトのシフトも給料計算も一括管理 / `data_loss_sync` | `SHIFT_PAY` | `REJECT_PRIOR_VETO` | バックアップ/移行を含む同一成果アプリがあり、既に棄却済み。 |
| 24 | FP3級学科試験対策問題集 / `missing_feature` | `FP3_CURRENT_LAW` | `REJECT_EXACT_DUPLICATE_AND_MAINTENANCE` | 法改正対応需要は確認したが、2026対応アプリ多数。法令・問題の継続監修が必須。 |
| 25 | 簿記3級 解説付き問題集 / `missing_feature` | `BOOKKEEPING3` | `REJECT_INSUFFICIENT_SAME_WORKFLOW` | 誤答/広告は散発的で、同一未解決ワークフロー10件に未達。 |
| 26 | Scan Shot: 文書をスキャンしてPDFに変換する / `missing_feature` | `OCR_SCANNER` | `REJECT_EXACT_DUPLICATE` | 実質は週額/自動課金・エクスポート制限。不透明価格以外の差分なし。 |
| 27 | 看護師 ナースのシフト管理ならシフトナby看護師ワーカー / `missing_feature` | `SHIFT_PAY` | `REJECT_PRIOR_VETO` | 職種特化シフトも同一成果・求人誘導・法令保守で棄却済み。 |
| 28 | 共通テストカウントダウン / `missing_feature` | `COUNTDOWN_WIDGET` | `REJECT_EXACT_DUPLICATE` | ウィジェット/通知が日跨ぎ更新されない需要は確認したが直接競合多数。 |
| 29 | 英語発音トレーニング / `voice_or_speech` | `PRONUNCIATION_AI` | `REJECT_EXACT_DUPLICATE` | 発音認識・採点の直接競合/無料代替がある。 |
| 30 | 介護職員のシフト管理ならシフトカイゴby介護ワーカー / `missing_feature` | `SHIFT_PAY` | `REJECT_PRIOR_VETO` | 職種特化シフトも同一成果・求人誘導・法令保守で棄却済み。 |
| 31 | 燃費記録簿 超カンタンな愛車の燃費記録アプリ / `content_too_easy_or_shallow` | `FUEL_LOG` | `REJECT_MISCLASSIFIED` | 大半が肯定レビュー/一般要望で、同一有料痛点ではない。 |
| 32 | 子供の知育ゲーム｜ごっこランド お店屋さん体験の子供アプリ / `missing_feature` | `KIDS_APP` | `REJECT_MISCLASSIFIED` | 削除コンテンツ・音声不具合など当該アプリ固有。 |
| 33 | FP3級学科試験対策問題集 / `accuracy_mismatch` | `FP3_CURRENT_LAW` | `REJECT_EXACT_DUPLICATE_AND_MAINTENANCE` | 法改正/誤答の反復需要はあるが最新対応競合多数、監修保守が構造的。 |
| 34 | 「カラオケ診断」音域に合う曲が分かる 採点やボイトレ アプリ / `voice_or_speech` | `VOCAL_RANGE` | `REJECT_EXACT_DUPLICATE` | 倍音/ノイズ/オクターブ誤認需要は確認したが同一成果競合多数。 |
| 35 | 「カラオケ診断」音域に合う曲が分かる 採点やボイトレ アプリ / `accuracy_mismatch` | `VOCAL_RANGE` | `REJECT_EXACT_DUPLICATE` | 倍音/ノイズ/オクターブ誤認需要は確認したが同一成果競合多数。 |
| 36 | シフト管理と給料計算のシフトカレンダー:バイトの勤務表にも / `accuracy_mismatch` | `SHIFT_PAY` | `REJECT_PRIOR_VETO` | 給与計算誤差は既存候補で評価・棄却済み。 |
| 37 | 分析採点JOYSOUND-カラオケ採点＆練習・カラオケアプリ / `voice_or_speech` | `KARAOKE_PLATFORM` | `REJECT_FIRST_PARTY_OR_LICENSE` | 音声入力/採点は既存サービス内部問題。 |
| 38 | ハヤえもん - 音楽プレーヤー / `data_loss_sync` | `MUSIC_PLAYER` | `REJECT_FIRST_PARTY_DATA_BUG` | アプリ内曲/画像/マーカー消失。第三者救済不可、10件同一成果にも未達。 |
| 39 | SPI言語・非言語 就活問題集 -適性検査SPI3対応- / `accuracy_mismatch` | `SPI_PRIVACY` | `REJECT_FREE_EXACT_SUBSTITUTE` | 営業電話/誤答不満。登録不要無料SPIアプリ・Web・書籍で回避可能。 |
| 40 | SPI言語・非言語 就活問題集 -適性検査SPI3対応- / `offline_privacy` | `SPI_PRIVACY` | `REJECT_FREE_EXACT_SUBSTITUTE` | 個人情報登録後の電話/メールは反復するが、登録不要無料代替が直接存在。 |
| 41 | AI英会話スピーク - スピーキング練習で発音や英語を勉強 / `voice_or_speech` | `PRONUNCIATION_AI` | `REJECT_EXACT_DUPLICATE` | 発音/会話AIの直接競合が多数。 |
| 42 | ELSA Speak：パーソナライズされた英会話アプリ / `accuracy_mismatch` | `PRONUNCIATION_AI` | `REJECT_EXACT_DUPLICATE` | 採点精度不満だが同一成果競合・無料代替が多数。 |
| 43 | 看護師 ナースのシフト管理ならシフトナby看護師ワーカー / `content_too_easy_or_shallow` | `SHIFT_PAY` | `REJECT_PRIOR_VETO` | 職種特化シフトも同一成果・法令保守で棄却済み。 |
| 44 | AI英会話スピーク - スピーキング練習で発音や英語を勉強 / `accuracy_mismatch` | `PRONUNCIATION_AI` | `REJECT_EXACT_DUPLICATE` | 採点精度不満だが同一成果競合・無料代替が多数。 |
| 45 | Smule: カラオケ録音＆デュエットを楽しもう / `voice_or_speech` | `KARAOKE_PLATFORM` | `REJECT_FIRST_PARTY_OR_LICENSE` | 録音品質はサービス内部/端末差の問題。 |
| 46 | シフトボード：バイトの給料計算とシフト管理 / `accuracy_mismatch` | `SHIFT_PAY` | `REJECT_PRIOR_VETO` | 給与見込/実績差は既存候補で評価・棄却済み。 |
| 47 | シフト勤務カレンダー：仕事とスケジュールをシンプルに管理 / `missing_feature` | `SHIFT_PAY` | `REJECT_PRIOR_VETO` | シフト表示/周期機能は既存多数、差分不足。 |
| 48 | 燃費記録簿 超カンタンな愛車の燃費記録アプリ / `missing_feature` | `FUEL_LOG` | `REJECT_INSUFFICIENT_SAME_WORKFLOW` | 部分給油/移行等は散発的、10件同一痛点なし。 |
| 49 | 英検®トレーニング - 2級から3級に対応 / `voice_or_speech` | `PRONUNCIATION_AI` | `REJECT_EXACT_DUPLICATE_AND_CONTENT` | 英検音声/採点は既存教材・アプリと重複、現行基準保守が必要。 |
| 50 | 簿記3級 解説付き問題集 / `accuracy_mismatch` | `BOOKKEEPING3` | `REJECT_INSUFFICIENT_SAME_WORKFLOW` | 誤答は散発的で10件未達、無料教材/書籍も強い。 |
| 51 | 介護職員のシフト管理ならシフトカイゴby介護ワーカー / `content_too_easy_or_shallow` | `SHIFT_PAY` | `REJECT_PRIOR_VETO` | 職種特化シフトも同一成果・法令保守で棄却済み。 |
| 52 | SoundHound音楽検索の認識とプレーヤー / `accuracy_mismatch` | `MUSIC_RECOGNITION` | `REJECT_FREE_EXACT_SUBSTITUTE` | 認識精度不満だが無料の同一成果代替がある。 |
| 53 | シフト管理ならシフト手帳！バイトのシフトも給料計算も一括管理 / `accuracy_mismatch` | `SHIFT_PAY` | `REJECT_PRIOR_VETO` | 給与計算誤差は既存候補で評価・棄却済み。 |
| 54 | Viva Engage / `missing_feature` | `VIVA_FIRST_PARTY` | `REJECT_MISCLASSIFIED_FIRST_PARTY` | CSV需要ではなく起動/写真/通知等のMicrosoft製品固有不具合。 |
| 55 | 英語発音トレーニング / `missing_feature` | `PRONUNCIATION_AI` | `REJECT_EXACT_DUPLICATE` | 無料を含む発音練習の直接競合がある。 |
| 56 | シフト給料計算カレンダー / `accuracy_mismatch` | `SHIFT_PAY` | `REJECT_PRIOR_VETO` | 給与計算誤差は既存候補で評価・棄却済み。 |
| 57 | ScanGuru ドキュメント スキャン、PDF変換、OCR / `accuracy_mismatch` | `OCR_SCANNER` | `REJECT_EXACT_DUPLICATE` | OCR精度/課金不満。買い切り・無料・標準スキャナが多数。 |
| 58 | ポケカラ－Pokekara 本格採点カラオケアプリ / `voice_or_speech` | `KARAOKE_PLATFORM` | `REJECT_FIRST_PARTY_OR_LICENSE` | 音声遅延/採点は既存サービス内部問題。 |
| 59 | シフト勤務カレンダー：仕事とスケジュールをシンプルに管理 / `content_too_easy_or_shallow` | `SHIFT_PAY` | `REJECT_PRIOR_VETO` | シフト機能の浅さは既存多数、差分不足。 |
| 60 | 英検®トレーニング - 2級から3級に対応 / `accuracy_mismatch` | `PRONUNCIATION_AI` | `REJECT_EXACT_DUPLICATE_AND_CONTENT` | 英検採点/解説は既存競合・現行内容保守。 |
| 61 | 分析採点JOYSOUND-カラオケ採点＆練習・カラオケアプリ / `accuracy_mismatch` | `KARAOKE_PLATFORM` | `REJECT_FIRST_PARTY_OR_LICENSE` | 採点誤差は既存カラオケプラットフォーム内部問題。 |
| 62 | シフト給料計算カレンダー / `data_loss_sync` | `SHIFT_PAY` | `REJECT_PRIOR_VETO` | データ消失/バックアップも既存候補で評価・棄却済み。 |
| 63 | Scan Shot: 文書をスキャンしてPDFに変換する / `data_loss_sync` | `OCR_SCANNER` | `REJECT_EXACT_DUPLICATE` | データ消失/課金不満。買い切り・標準代替あり。 |
| 64 | Google スプレッドシート / `data_loss_sync` | `SPREADSHEET_FIRST_PARTY` | `REJECT_FIRST_PARTY_OR_SUBSTITUTE` | Google Sheets同期/保存問題。Web/PC/Excel/Numbersで代替。 |
| 65 | みんなの銀行-お金管理・後払い・預金(貯金)・残高確認 / `accuracy_mismatch` | `BANK_FIRST_PARTY` | `REJECT_FIRST_PARTY_OR_POLICY` | 銀行固有の残高/入出金/認証誤表示。 |
| 66 | 介護職員のシフト管理ならシフトカイゴby介護ワーカー / `data_loss_sync` | `SHIFT_PAY` | `REJECT_PRIOR_VETO` | データ移行/消失も既存候補で評価・棄却済み。 |
| 67 | マネーフォワード クラウド経費 / `missing_feature` | `EXPENSE_OCR` | `REJECT_INSUFFICIENT_AND_CROWDED` | 経費アプリのUX/OCR不満が混在。同一10件未達、経費/OCR市場は既存多数。 |
| 68 | マネーフォワード クラウド経費 / `accuracy_mismatch` | `EXPENSE_OCR` | `REJECT_INSUFFICIENT_AND_CROWDED` | OCR/金額誤認は散発的。同一10件未達、直接競合多数。 |
| 69 | タイピングの練習 / `missing_feature` | `TYPING` | `REJECT_INSUFFICIENT_AND_FREE_SUBSTITUTES` | ふりがな/Enter操作要望は各10件未達、無料タイピング教材多数。 |

## Final decision

- `status`: `NO_ACTIVE_CANDIDATE`
- `build_approved`: `false`
- product code: create none
- landing page: create none
- payment: create none
- offer test: create none
- promoted queue rows: 0

今回の停止理由は「候補がない」ではなく、**69行を全件終端し、exact complaintを持つ4 familyも直接競合・無料代替・保守・獲得・採算で全件棄却したため**である。

次回以降、最新queueのhashとreview dispositionが一致しない限り、completion contractをPASSさせない。
