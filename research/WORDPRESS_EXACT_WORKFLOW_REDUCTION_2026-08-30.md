# WORDPRESS EXACT WORKFLOW REDUCTION — 2026-08-30

Status: **NO_ACTIVE_CANDIDATE / build_approved=false**

Source queue: `research/discovery_queue/latest.json`  
Source generated: `2026-08-30T19:11:35+09:00`  
Source SHA-256: `1a4232788a9bebaccc91a1d218ffc2597a3636d447b0ba7bd1f394bf47d727d1`  
WordPress rows reviewed: **21 / 21**  
Promoted rows: **0**

## Why this pass exists

`build_discovery_queue.py` が旧フィールド名 `clusters/examples` を読んでいた一方、正本のWordPress minerは `global_cluster_counts/cluster_examples` と per-plugin `cluster_counts/topics` を出力していた。このschema mismatchにより、WordPress証拠がキューから全件消えていた。

生成器をper-plugin + clusterへ修正し、落ちていた21行を現在の90行キューへ戻した。各行のsupport/review題名をbuyer/input/processing/outputへ還元し、10件閾値、直接競合、代替、サポート負荷、月20万円採算の順で判定した。

## Exact workflow families that reached ten complaints

### 1. WooCommerce invoice PDF generation / attachment integrity

`注文・更新注文・メール設定を読む → PDF生成/番号/添付を検査 → 未生成・欠落・重複・文字化け・404を警告`

- 2 pluginsで10件以上を確認。
- 直接/強い代替: PDF Invoices & Packing Slips, WebToffee PDF Invoices, Flexible PDF Invoices, Sequential Order Numbers Pro, Germanized/German Market。
- invoice生成・番号・添付は既存paid pluginの中核。言語、template、subscription、mail providerごとの対応が必要。
- 判定: **REJECT_EXACT_DUPLICATE_AND_PLUGIN_SPECIFIC**

### 2. Booking availability / timeslot conflict audit

`予約・service・employee・iCal/Google枠を読む → overlap/blocked-slot/stale-syncを照合 → 二重予約・誤枠の警告`

- Amelia等で10件以上を確認。
- 直接/強い代替: Amelia, Bookly, WooCommerce Bookings, Booking Calendar, MotoPress/宿泊channel managers。
- availability syncとconflict preventionは既存予約製品の中核。製品ごとのdata model/API対応でsupportが顧客数に比例。
- 判定: **REJECT_EXACT_DUPLICATE_AND_SUPPORT_BURDEN**

### 3. Import/export field, media and order integrity

`CSV/XML/Excel/Sheetsとtarget schemaを読む → dry-run mapping/row validation → 欠落・変形・停止行を出す`

- 複数pluginで10件以上を確認。
- 直接/強い代替: WP All Import/Export, ImportWP, WP Ultimate CSV Importer, WooCommerce Product CSV Import Suite, native WooCommerce import/export。
- preview/mapping/validationは既存製品の主機能。ACF/Pods/Yoast/HPOS/membership/theme別schema対応が構造的。
- 判定: **REJECT_EXACT_DUPLICATE_AND_SCHEMA_BURDEN**

### 4. Shipping label / international address preflight

`注文住所・重量・carrier条件を読む → address/電話/通関/label条件を検査 → 購入前エラーと修正候補を出す`

- WooCommerce Shippingで10件以上を確認。
- 直接/強い代替: WooCommerce Shipping, ShipStation, Sendcloud, address-validation plugins, carrier portals/APIs。
- carrier・国・service level・API例外の保守が大きく、主要成果は既存shipping製品に含まれる。
- 判定: **REJECT_FIRST_PARTY_AND_EXACT_SUBSTITUTES**

### 5. Tax calculation audit

`注文住所・tax class・免税状態・配送を読む → expected taxとorder totalを照合 → 0%化・不一致を警告`

- WooCommerce Taxで10件以上を確認。
- 直接/強い代替: WooCommerce Tax, TaxJar, Avalara, accounting/tax integrations, manual accountant review。
- 国/州/地域法令と税責任を継続保守する必要があり、zero-touch条件に不適合。
- 判定: **REJECT_FIRST_PARTY_LEGAL_AND_EXACT_SUBSTITUTES**

### 6. Plugin update fatal-error preflight

`更新前後のsite/stagingを実行 → fatal/checkout/PDF/visual差分を検査 → rollback pointを出す`

- Print Invoice系で10件を確認。
- 直接/強い代替: WP Umbrella, ManageWP/MainWP, BlogVault, WP Engine Smart Plugin Manager, Kinsta safe updates, visual regression tools。
- 既にprior veto済み。
- 判定: **REJECT_PRIOR_EXACT_DUPLICATE**

### 7. Subscription renewal health monitor

`active subscriptionsとexpected renewal scheduleを読む → renewal order/status/paymentを照合 → 未生成・failed/on-holdを警告`

- YITH topicsで10件を確認。
- 直接/強い代替: WooCommerce Subscriptions, YITH Subscription, Subscriptions for WooCommerce, Flexible Subscriptions, AutomateWoo/FunnelKit/Metorik系のrenewal・failed-payment workflow。
- gateway・subscription plugin・retry policy別対応が必要で、主成果は既存subscription stackの中核。
- 判定: **REJECT_CORE_FEATURE_AND_INTEGRATION_BURDEN**

## All 21 WordPress dispositions

| Queue row | Plugin / cluster | Confirmed exact complaints | Decision | Reason |
|---:|---|---:|---|---|
| 20 | PDF Invoices & Packing Slips for WooCommerce / `pdf_email` | 10 | `REJECT_EXACT_DUPLICATE_AND_PLUGIN_SPECIFIC` | PDF生成・自動添付・番号整合の反復不満は確認したが、主要PDF請求書プラグイン自身と代替製品が同じ成果を提供し、メール/テンプレート/購読連携ごとの継続サポートが必要。 |
| 35 | Booking for Appointments and Events Calendar – Amelia / `booking_conflict` | 10 | `REJECT_EXACT_DUPLICATE_AND_SUPPORT_BURDEN` | 空き枠・重複・誤サービス割当の反復不満はあるが、競合予約製品とチャネルマネージャーの中核機能。複数予約データモデルへの対応が顧客数に比例する。 |
| 38 | WP All Import – Drag & Drop Import for CSV, XML, Excel & Google Sheets / `import_export` | 10 | `REJECT_EXACT_DUPLICATE_AND_INTEGRATION_BURDEN` | 画像・カスタムフィールド・文字列・cron取込の欠落/変形は反復するが、preview/mapping/dry-runは既存import製品の中核。テーマ/プラグイン別フィールド対応が必要。 |
| 52 | WP Import Export Lite / `import_export` | 10 | `REJECT_EXACT_DUPLICATE_AND_INTEGRATION_BURDEN` | CSV取込・画像・HTML・設定の欠落/不一致は反復するが、同一成果のimport/export製品が多数あり、対象スキーマごとのサポート負荷が大きい。 |
| 53 | Advanced Order Export For WooCommerce / `import_export` | 10 | `REJECT_EXACT_DUPLICATE` | 注文・返金・数量・カスタム項目・分析値を正しく出力する需要はあるが、当該製品を含む注文export製品の主機能そのもの。 |
| 64 | Import and export users and customers / `import_export` | 10 | `REJECT_EXACT_DUPLICATE_AND_SCHEMA_BURDEN` | ユーザー数・role・meta・画像の欠落は反復するが、複数のuser import/export製品が同じ成果を提供し、会員プラグイン別schema対応が必要。 |
| 68 | Export and Import Users and Customers / `import_export` | 10 | `REJECT_EXACT_DUPLICATE_AND_SCHEMA_BURDEN` | ユーザー、membership、profile field、画像の欠落は反復するが、同一成果製品が複数あり、外部会員schemaごとの対応が必要。 |
| 70 | Order Export & Order Import for WooCommerce / `import_export` | 10 | `REJECT_EXACT_DUPLICATE_AND_SCHEMA_BURDEN` | 注文移行の停止・欠落・delimiter・税率問題は反復するが、注文import/export製品の中核機能であり、HPOS/税/顧客ID互換性の保守が必要。 |
| 74 | Print Invoice & Delivery Notes for WooCommerce / `pdf_email` | 10 | `REJECT_EXACT_DUPLICATE_AND_PLUGIN_SPECIFIC` | PDF生成・添付・文字方向・欠落項目の反復不満はあるが、既存請求書プラグイン群が主要成果を提供し、テンプレート/言語/購読連携の個別対応が必要。 |
| 76 | WooCommerce Shipping / `label_purchase` | 10 | `REJECT_FIRST_PARTY_AND_EXACT_SUBSTITUTES` | ラベル購入・印刷・国際配送・carrier optionの失敗は反復するが、WooCommerce Shipping/ShipStation/Sendcloud等の配送製品内部の成果で、carrier/API例外対応が重い。 |
| 77 | WooCommerce Tax (formerly WooCommerce Shipping & Tax) / `tax_invoice_compliance` | 10 | `REJECT_FIRST_PARTY_LEGAL_AND_EXACT_SUBSTITUTES` | 税率0化・免税・配送税・住所基準の誤計算は反復するが、税エンジン/会計連携の中核領域。国・地域法令と税責任の継続保守が必要。 |
| 78 | Advanced Shipment Tracking for WooCommerce / `label_purchase` | 0 | `REJECT_MISCLASSIFIED` | 例は追跡リンク・carrier追加・メール表示であり、shipping label購入という同一workflowではない。 |
| 80 | Print Invoice & Delivery Notes for WooCommerce / `update_breakage` | 10 | `REJECT_PRIOR_EXACT_DUPLICATE` | 更新後のfatal/critical errorは10件確認したが、staging、safe update、visual regression、rollback製品が既に存在し、当該プラグイン固有の互換性支援になる。 |
| 81 | YITH WooCommerce Subscription / `subscription_renewal` | 10 | `REJECT_CORE_FEATURE_AND_INTEGRATION_BURDEN` | renewal order未生成・status不更新・failed payment・自動更新不良は反復するが、WooCommerce/YITH/Flexible Subscriptions/AutomateWoo等の中核機能と重複し、gateway・subscription plugin別対応が必要。 |
| 82 | WooCommerce Tax (formerly WooCommerce Shipping & Tax) / `label_purchase` | 0 | `REJECT_MISCLASSIFIED` | 税・shipping zone・旧サービス移行が混在し、label purchaseの同一workflow10件を満たさない。 |
| 83 | WooCommerce Shipping / `address_validation` | 10 | `REJECT_EXACT_DUPLICATE_AND_CARRIER_BURDEN` | 国際住所検証・電話番号・origin address・label作成失敗は反復するが、address validation/shipping製品とcarrier APIが同じ成果を提供し、国別例外保守が必要。 |
| 84 | WP Hotel Booking / `booking_conflict` | 0 | `REJECT_INSUFFICIENT_SAME_WORKFLOW` | booking form非表示、価格、検索、ボタンなどが混在し、同一buyer/input/outputの10件に未達。 |
| 85 | MotoPress Hotel Booking / `booking_conflict` | 8 | `REJECT_INSUFFICIENT_AND_EXACT_SUBSTITUTES` | availability/iCal/外部予約連携の不満はあるが10件未達で、channel manager/booking製品の中核機能でもある。 |
| 86 | WP All Import – Import SEO Settings for Yoast SEO / `import_export` | 10 | `REJECT_PLUGIN_SPECIFIC_EXACT_DUPLICATE` | SEO meta/identifier/category取込の欠落は反復するが、WP All Import add-on自身の中核機能であり、Yoast/schema固有の保守になる。 |
| 87 | ShipStation for WooCommerce / `import_export` | 10 | `REJECT_FIRST_PARTY_INTEGRATION` | 注文・重量・bundle・timezoneのsync/export欠落は反復するが、ShipStation integration内部の修正領域で、第三者監査はAPI差異とsupport負荷が高い。 |
| 88 | Order Export for WooCommerce / `import_export` | 10 | `REJECT_EXACT_DUPLICATE` | 注文欠落・日付filter・権限・文字化けの反復需要はあるが、注文export製品の主機能そのもの。 |

## Economics

WordPress.org free-plugin acquisitionを前提にProを年額¥9,800で販売しても、決済・返金・税・support前で月20万円には概算245件/年の新規有料購入が必要。年額¥19,800でも約122件/年。今回のfamiliesは無料/既存coreが強く、個別integration supportが増えるため、この必要販売数を支える差別化・獲得証拠がない。

## Result

- WordPress rows: **21 reviewed / 21 rejected**
- App Store rows: **69 reviewed / 69 rejected**
- Current queue: **90 reviewed / 90 terminal**
- Active candidate: **none**
- Product code: **do not create**

今回の結論は「WordPressを見なかった」ではなく、schema欠落を修復したうえで全21行を復元・精査し、Gate通過が0だったというもの。
