# WordPress complaint mining — discovery evidence only

最終更新: 2026-08-30T16:25:39+09:00

**Status: DISCOVERY_EVIDENCE_ONLY / build_approved=false**

> 公開support/reviewのトピックタイトルを1トピック1件に正規化した一次スクリーニング。
> クラスタ数だけでは同じ問題・支払意思・未解決差を証明しない。本文確認とexact-match gateが必須。

## Cross-plugin clusters

| Cluster | Unique topics matched |
|---|---:|
| other | 1956 |
| import_export | 301 |
| tax_invoice_compliance | 93 |
| label_purchase | 89 |
| update_breakage | 88 |
| missing_feature | 80 |
| booking_conflict | 78 |
| pdf_email | 76 |
| sync_connection | 41 |
| subscription_renewal | 38 |
| bulk_workflow | 32 |
| address_validation | 31 |
| accessibility_compliance | 17 |
| wrong_weight_rate | 3 |

## Plugin queues

### WooCommerce Tax (formerly WooCommerce Shipping & Tax) — unique topics 124, rating 2.0, active 500000

Clusters: other:65, tax_invoice_compliance:35, label_purchase:19, address_validation:4, update_breakage:4, sync_connection:3, missing_feature:2

- [Plugin Error with address verification and labels](https://wordpress.org/support/topic/plugin-error-with-address-verification-and-labels/) — support / label_purchase, address_validation
- [Odd Standard Tax Rate Entries Being Created – Quebec QST being reset to 0](https://wordpress.org/support/topic/odd-standard-tax-rate-entries-being-created-quebec-qst-being-reset-to-0/) — support / tax_invoice_compliance
- [Quebec City taxes are all getting 0% since new update.](https://wordpress.org/support/topic/quebec-city-taxes-are-all-getting-0-since-new-update/) — support / tax_invoice_compliance
- [v3.5.2 Error on Checkout: ZIP Code is not formatted correctly.](https://wordpress.org/support/topic/v3-5-2-error-on-checkout-zip-code-is-not-formatted-correctly/) — support / address_validation
- [Incorrect tax in tax-exempt state + mismatch in order totals](https://wordpress.org/support/topic/incorrect-tax-in-tax-exempt-state-mismatch-in-order-totals/) — support / tax_invoice_compliance
- [TaxJar _log() writes to debug.log unconditionally, no toggle](https://wordpress.org/support/topic/taxjar-_log-writes-to-debug-log-unconditionally-no-toggle/) — support / tax_invoice_compliance
- [sift.js missing (404 errors)](https://wordpress.org/support/topic/sift-js-missing-404-errors/) — support / missing_feature
- [Support for tax exemption](https://wordpress.org/support/topic/support-for-tax-exemption/) — support / tax_invoice_compliance
- [“Shipping tax class” setting not working?](https://wordpress.org/support/topic/shipping-tax-class-setting-not-working/) — support / label_purchase, tax_invoice_compliance
- [Automated Tax “Standard” tax rates change in Tax Name 10.14 update](https://wordpress.org/support/topic/automated-tax-standard-tax-rates-change-in-tax-name-10-14-update/) — support / tax_invoice_compliance
- [Automated Tax Option Not Given (Spain)](https://wordpress.org/support/topic/automated-tax-option-not-given-spain/) — support / tax_invoice_compliance
- [Cannot update WC Tax Data (“An error occurred while refreshing service data.”)](https://wordpress.org/support/topic/cannot-update-wc-tax-data-an-error-occurred-while-refreshing-service-data/) — support / tax_invoice_compliance, missing_feature
- [Tax not Showing when Shipping Option Selected](https://wordpress.org/support/topic/tax-not-showing-when-shipping-option-selected/) — support / label_purchase, tax_invoice_compliance
- [Support for migrating to WooCommerce Shipping](https://wordpress.org/support/topic/support-for-migrating-to-woocommerce-shipping/) — support / label_purchase
- [Error: The Woocommrce Tax server returned HTTP code: 0](https://wordpress.org/support/topic/error-the-woocommrce-tax-server-returned-http-code-0/) — support / tax_invoice_compliance

### PDF Invoices & Packing Slips for WooCommerce — unique topics 122, rating 5.0, active 300000

Clusters: other:81, pdf_email:33, missing_feature:7, tax_invoice_compliance:5, bulk_workflow:3, subscription_renewal:3, update_breakage:2

- [500 Internal Server Error / blank page](https://wordpress.org/support/topic/500-internal-server-error-blank-page/) — support / pdf_email
- [Bulk edit not working](https://wordpress.org/support/topic/bulk-edit-not-working-5/) — support / bulk_workflow
- [How to translate PDF invoice using WPML](https://wordpress.org/support/topic/how-to-translate-pdf-invoice-using-wpml/) — support / pdf_email
- [Bulk PDF Print No longer working](https://wordpress.org/support/topic/bulk-pdf-print-no-longer-working/) — support / bulk_workflow, pdf_email
- [Bulk actions PDF Invoice](https://wordpress.org/support/topic/bulk-actions-pdf-invoice/) — support / bulk_workflow, pdf_email
- [Compliance with French B2B E-Invoicing Regulations](https://wordpress.org/support/topic/compliance-with-french-b2b-e-invoicing-regulations/) — support / tax_invoice_compliance
- [Problem if no VAT number](https://wordpress.org/support/topic/problem-if-no-vat-number/) — support / tax_invoice_compliance
- [Invoice PDF is missing from the order processing email](https://wordpress.org/support/topic/invoice-pdf-is-missing-from-the-order-processing-email/) — support / pdf_email, missing_feature
- [Invoice numbers occasionally skipped and reassigned](https://wordpress.org/support/topic/invoice-numbers-occasionally-skipped-and-reassigned/) — support / pdf_email, tax_invoice_compliance
- [Unable to Enable PDF Invoice Plugin](https://wordpress.org/support/topic/unable-to-enable-pdf-invoice-plugin/) — support / pdf_email, missing_feature
- [One Subscription always gets same invoice number](https://wordpress.org/support/topic/one-subscription-always-gets-same-invoice-number/) — support / pdf_email, subscription_renewal, tax_invoice_compliance
- [High frontend load time on init caused by WPO_WCPDF::load_classes](https://wordpress.org/support/topic/high-frontend-load-time-on-init-caused-by-wpo_wcpdfload_classes/) — support / pdf_email
- [Logo Not Displaying in PDF Invoices & Packing Slips](https://wordpress.org/support/topic/logo-not-displaying-in-pdf-invoices-packing-slips/) — support / pdf_email
- [Showing Taxes On Invoice](https://wordpress.org/support/topic/showing-taxes-on-invoice/) — support / pdf_email, tax_invoice_compliance
- [Missing icons on order overview page](https://wordpress.org/support/topic/missing-icons-on-order-overview-page/) — support / missing_feature

### Print Invoice & Delivery Notes for WooCommerce — unique topics 122, rating 4.4, active 30000

Clusters: other:81, pdf_email:23, update_breakage:10, missing_feature:7, tax_invoice_compliance:3, address_validation:3, label_purchase:3

- [Security Advisory – Update Print Invoices & Delivery Notes for WooCommerce](https://wordpress.org/support/topic/security-advisory-update-print-invoices-delivery-notes-for-woocommerce/) — support / pdf_email
- [Arabic text reversal in email-attached invoices](https://wordpress.org/support/topic/arabic-text-reversal-in-email-attached-invoices/) — support / pdf_email
- [[Bug+Fix] Frontend crash printing invoice WP_Filesystem() called without credent](https://wordpress.org/support/topic/bugfix-frontend-crash-printing-invoice-wp_filesystem-called-without-credent/) — support / update_breakage, pdf_email
- [taking “tax” out of the invoice title](https://wordpress.org/support/topic/taking-tax-out-of-the-invoice-title/) — support / pdf_email, tax_invoice_compliance
- [Default Invoice in Newest Version is Bad](https://wordpress.org/support/topic/default-invoice-in-newest-version-is-bad/) — support / pdf_email
- [Changing invoice number](https://wordpress.org/support/topic/changing-invoice-number/) — support / pdf_email, tax_invoice_compliance
- [Invoice PDFs print Language wrong direction](https://wordpress.org/support/topic/invoice-pdfs-print-language-wrong-direction/) — support / pdf_email
- [Fatal error: Undefined constant FS_CHMOD_FILE when printing](https://wordpress.org/support/topic/fatal-error-undefined-constant-fs_chmod_file-when-printing/) — support / update_breakage
- [Missing Files](https://wordpress.org/support/topic/missing-files-42/) — support / missing_feature
- [PHP fatal error since update to 7.2.0](https://wordpress.org/support/topic/php-fatal-error-since-update-to-7-2-0/) — support / update_breakage
- [Fatal error printing single invoice/packing slip](https://wordpress.org/support/topic/fatal-error-printing-single-invoice-packing-slip/) — support / update_breakage, pdf_email
- [Critical Error When Printing Delivery Notes and Translation Issues](https://wordpress.org/support/topic/critical-error-when-printing-delivery-notes-and-translation-issues/) — support / update_breakage
- [Critical Error when updating from 5.9.0 to 7.1.2](https://wordpress.org/support/topic/critical-error-when-updating-from-5-9-0-to-7-1-2-need-help/) — support / update_breakage
- [The email attachment is a PDF file containing Chinese gibberish](https://wordpress.org/support/topic/the-email-attachment-is-a-pdf-file-containing-chinese-gibberish/) — support / pdf_email
- [Version 7.x Fatal error from class-wp-filesystem-ftpext.php](https://wordpress.org/support/topic/version-7-x-fatal-error-from-class-wp-filesystem-ftpext-php/) — support / update_breakage

### Import and export users and customers — unique topics 122, rating 4.7, active 70000

Clusters: other:73, import_export:45, missing_feature:3, update_breakage:2, tax_invoice_compliance:2, bulk_workflow:2, address_validation:1

- [Woocommerce address fields import but do not show in user profile](https://wordpress.org/support/topic/woocommerce-address-fields-import-but-do-not-show-in-user-profile/) — support / address_validation, import_export
- [Import Button missing on Import page since update](https://wordpress.org/support/topic/import-button-missing-on-import-page-since-update/) — support / import_export, missing_feature
- [Fatal Error in ACF Addon](https://wordpress.org/support/topic/fatal-error-in-acf-addon/) — support / update_breakage
- [Frontend Export with Multi-Word xProfile fields issue](https://wordpress.org/support/topic/frontend-export-with-multi-word-xprofile-fields-issue/) — support / import_export
- [i cannot import 1246 users](https://wordpress.org/support/topic/i-cannot-import-1246-users/) — support / import_export, missing_feature
- [Mismatch in User Import vs Total Users](https://wordpress.org/support/topic/mismatch-in-user-import-vs-total-users/) — support / import_export
- [User Export only exports column headers](https://wordpress.org/support/topic/user-export-only-exports-column-headers/) — support / import_export
- [Problem with deactivation](https://wordpress.org/support/topic/problem-with-deactivation-2/) — support / tax_invoice_compliance
- [Plugin stopped working 4 months ago and now only import a fraction of the CSV](https://wordpress.org/support/topic/plugin-stopped-working-4-months-ago-and-now-only-import-a-fraction-of-the-csv/) — support / import_export
- [Importing memberships into PMPro (again)](https://wordpress.org/support/topic/importing-memberships-into-pmpro-again/) — support / import_export
- [date format exported ACF](https://wordpress.org/support/topic/date-format-exported-acf/) — support / import_export
- [User Roles Not Importing as Set in CSV and on Import Screen](https://wordpress.org/support/topic/user-roles-not-importing-as-set-in-csv-and-on-import-screen/) — support / import_export
- [Can I import profile images?](https://wordpress.org/support/topic/can-i-import-profile-images/) — support / import_export
- [User import completes but custom fields / meta not populating correctly](https://wordpress.org/support/topic/user-import-completes-but-custom-fields-meta-not-populating-correctly/) — support / import_export
- [Data in separate columns when exporting](https://wordpress.org/support/topic/data-in-separate-columns-when-exporting/) — support / import_export

### Web Accessibility (formally known as Ally) – WCAG Scanning, Guided Fixes, Usability Widget — unique topics 121, rating 2.9, active 500000

Clusters: other:99, accessibility_compliance:9, missing_feature:4, sync_connection:3, tax_invoice_compliance:2, update_breakage:2, bulk_workflow:1

- [Ally Web Accessibility](https://wordpress.org/support/topic/ally-web-accessibility/) — support / accessibility_compliance
- [Getting Reactivate Notice](https://wordpress.org/support/topic/getting-reactivate-notice/) — support / tax_invoice_compliance
- [Update v4.0.0 crashes sites](https://wordpress.org/support/topic/update-v4-0-0-crashes-sites/) — support / update_breakage
- [Cannot connect site where site url is not home url](https://wordpress.org/support/topic/cannot-connect-site-where-site-url-is-not-home-url/) — support / sync_connection, missing_feature
- [Disable “Accessibility Assistant” in the admin toolbar](https://wordpress.org/support/topic/disable-accessibility-assistant-in-the-admin-toolbar/) — support / accessibility_compliance
- [pojo-a11y problems found by accessibility checker](https://wordpress.org/support/topic/pojo-a11y-problems-found-by-accessibility-checker/) — support / accessibility_compliance
- [How to disable Accessibility scans](https://wordpress.org/support/topic/how-to-disable-accessibility-scans/) — support / accessibility_compliance
- [Shortcode to Manually Place Accessibility Button](https://wordpress.org/support/topic/shortcode-to-manually-place-accessibility-button/) — support / accessibility_compliance
- [Avada Conflict?](https://wordpress.org/support/topic/avada-conflict-5/) — support / accessibility_compliance
- [Can’t connect / An error occured](https://wordpress.org/support/topic/cant-connect-an-error-occured/) — support / sync_connection
- [Stuck on the ‘welcome page’](https://wordpress.org/support/topic/stuck-on-the-welcome-page/) — review / sync_connection
- [Awesome plugin – takes the pain out of Accessibility](https://wordpress.org/support/topic/awesome-plugin-takes-the-pain-out-of-accessibility/) — review / accessibility_compliance
- [Crashed my website, I wouldn’t suggest it](https://wordpress.org/support/topic/crashed-my-website-i-wouldnt-suggest-it/) — review / update_breakage
- [Caching is causing massive problems](https://wordpress.org/support/topic/caching-is-causing-massive-problems/) — review / bulk_workflow
- [Why Ally Is One of the Most Powerful Tools for Web Accessibility Today](https://wordpress.org/support/topic/why-ally-is-one-of-the-most-powerful-tools-for-web-accessibility-today/) — review / accessibility_compliance

### Booster for WooCommerce – PDF Invoices, Abandoned Cart, Variation Swatches & 100+ Tools — unique topics 121, rating 4.6, active 30000

Clusters: other:98, update_breakage:8, pdf_email:7, label_purchase:4, tax_invoice_compliance:3, import_export:2, bulk_workflow:2

- [How to Delete Packing Slip PDF Files](https://wordpress.org/support/topic/how-to-delete-packing-slip-pdf-files/) — support / pdf_email
- [export booster settings- wrong file format](https://wordpress.org/support/topic/export-booster-settings-wrong-file-format/) — support / import_export
- [Shipping Methods By Products](https://wordpress.org/support/topic/shipping-methods-by-products/) — support / label_purchase
- [EU VAT Number only shows shortcode](https://wordpress.org/support/topic/eu-vat-number-only-shows-shortcode/) — support / tax_invoice_compliance
- [All of your support pages are broken](https://wordpress.org/support/topic/all-of-your-support-pages-are-broken/) — support / update_breakage
- [Export issue, Pro support is broken.](https://wordpress.org/support/topic/export-issue-pro-support-is-broken/) — support / update_breakage, import_export
- [Image size on Invoice](https://wordpress.org/support/topic/image-size-on-invoice-2/) — support / pdf_email
- [allow users to use PDF Invoicing & Packing Slips?](https://wordpress.org/support/topic/allow-users-to-use-pdf-invoicing-packing-slips/) — support / pdf_email
- [How to change the MSRP label to RRP](https://wordpress.org/support/topic/how-to-change-the-msrp-label-to-rrp/) — support / label_purchase
- [[wcj_tcpdf_pagebreak] shortcode doesn’t work anymore](https://wordpress.org/support/topic/wcj_tcpdf_pagebreak-shortcode-doesnt-work-anymore/) — support / pdf_email
- [shortcode shipping phone](https://wordpress.org/support/topic/shortcode-shipping-phone/) — support / label_purchase
- [Booster Currency Switcher Broken Again in latest version!](https://wordpress.org/support/topic/booster-currency-switcher-broken-again-in-latest-version/) — support / update_breakage
- [Shipping icons error on multisites](https://wordpress.org/support/topic/shipping-icons-error-on-multisites/) — support / label_purchase
- [Fatal error when Order Quantities is activated](https://wordpress.org/support/topic/fatal-error-when-order-quantities-is-activated/) — support / update_breakage, tax_invoice_compliance
- [Critical Error when editing content](https://wordpress.org/support/topic/critical-error-when-editing-content/) — support / update_breakage

### WP Hotel Booking — unique topics 121, rating 3.7, active 7000

Clusters: other:93, booking_conflict:17, missing_feature:3, pdf_email:3, tax_invoice_compliance:3, sync_connection:2, update_breakage:2

- [Missing Total Price in Booking form](https://wordpress.org/support/topic/missing-total-price-in-booking-form/) — support / booking_conflict, missing_feature
- [Spelling error on the Hotel Booking Page](https://wordpress.org/support/topic/spelling-error-on-the-hotel-booking-page/) — support / booking_conflict
- [Check In – Check Out – order invoice](https://wordpress.org/support/topic/check-in-check-out-order-invoice/) — support / pdf_email
- [Booking invalid](https://wordpress.org/support/topic/booking-invalid/) — support / booking_conflict
- [Error While Booking](https://wordpress.org/support/topic/error-while-booking/) — support / booking_conflict
- [Calender is syncing but i cannot pick dates](https://wordpress.org/support/topic/calender-is-syncing-but-i-cannot-pick-dates/) — support / sync_connection, missing_feature
- [[NSFW] Booking Calendar and Form is not showing](https://wordpress.org/support/topic/booking-calendar-and-form-is-not-showing-2/) — support / booking_conflict
- [Booking Calendar and Form is not showing](https://wordpress.org/support/topic/booking-calendar-and-form-is-not-showing/) — support / booking_conflict
- [Invoice Check](https://wordpress.org/support/topic/invoice-check/) — support / pdf_email
- [Need PDF Invoice after payment](https://wordpress.org/support/topic/need-pdf-invoice-after-payment/) — support / pdf_email
- [Individual room page booking button not working](https://wordpress.org/support/topic/individual-room-page-booking-button-not-working/) — support / booking_conflict
- [Booking Blocked Room](https://wordpress.org/support/topic/booking-blocked-room/) — support / booking_conflict
- [Booking form not visible on room details page](https://wordpress.org/support/topic/booking-form-not-visible-on-room-details-page/) — support / booking_conflict
- [Just availability calendar](https://wordpress.org/support/topic/just-availability-calendar/) — support / booking_conflict
- [maximum number of reservations per room to day](https://wordpress.org/support/topic/maximum-number-of-reservations-per-room-to-day/) — support / tax_invoice_compliance

### Advanced Order Export For WooCommerce — unique topics 121, rating 5.0, active 100000

Clusters: other:79, import_export:34, update_breakage:6, tax_invoice_compliance:5, bulk_workflow:3, missing_feature:3, subscription_renewal:2

- [Export from frontend](https://wordpress.org/support/topic/export-from-frontend/) — support / import_export
- [Product price + tax](https://wordpress.org/support/topic/product-price-tax/) — support / tax_invoice_compliance
- [Subscription Plugin + Advanced Order Export](https://wordpress.org/support/topic/subscription-plugin-advanced-order-export/) — support / subscription_renewal, import_export
- [Generating multiple lines from a single order with custom fields](https://wordpress.org/support/topic/generating-multiple-lines-from-a-single-order-with-custom-fields/) — support / bulk_workflow
- [Cannot buy the plugin](https://wordpress.org/support/topic/cannot-buy-the-plugin/) — support / missing_feature
- [How to display all the information in a WooCommerce CSV export](https://wordpress.org/support/topic/how-to-display-all-the-information-in-a-woocommerce-csv-export/) — support / import_export
- [Plugin won’t create export – generates error](https://wordpress.org/support/topic/plugin-wont-create-export-generates-error/) — support / import_export
- [Export Orders and Checkout Fields Together](https://wordpress.org/support/topic/export-orders-and-checkout-fields-together/) — support / import_export
- [Exact Export Settings Required to Match WooCommerce Analytics (Item-wise Sales )](https://wordpress.org/support/topic/exact-export-settings-required-to-match-woocommerce-analytics-item-wise-sales/) — support / import_export
- [Little Glitch In Our Export](https://wordpress.org/support/topic/little-glitch-in-our-export-2/) — support / import_export
- [Products in multiple quantity when export](https://wordpress.org/support/topic/products-in-multiple-quantity-when-export/) — support / bulk_workflow, import_export
- [Export Numéro de facture](https://wordpress.org/support/topic/export-numero-de-facture/) — support / import_export
- [Tax Rate per order](https://wordpress.org/support/topic/tax-rate-per-order/) — support / tax_invoice_compliance
- [Fatal error if export refunds](https://wordpress.org/support/topic/fatal-error-if-export-refunds/) — support / update_breakage, import_export
- [Exporting fields from Event Tickets from Tribe](https://wordpress.org/support/topic/exporting-fields-from-event-tickets-from-tribe/) — support / import_export

### WP All Import – Drag & Drop Import for CSV, XML, Excel & Google Sheets — unique topics 121, rating 4.7, active 100000

Clusters: other:87, import_export:29, tax_invoice_compliance:3, update_breakage:3, sync_connection:2, missing_feature:2, pdf_email:1

- [[Official] Read before requesting support for WP All Import on WordPress.org](https://wordpress.org/support/topic/officia-read-before-requesting-support-for-wp-all-import-on-wordpressorg/) — support / import_export
- [I have over 100,000 posts to import, can this plugin handle it?](https://wordpress.org/support/topic/i-have-over-100000-posts-to-import-can-this-plugin-handle-it/) — support / import_export
- [How to import locations csv file](https://wordpress.org/support/topic/how-to-import-locations-csv-file/) — support / import_export
- [Import into pods relationship field](https://wordpress.org/support/topic/import-into-pods-relationship-field/) — support / import_export
- [Elementor pages not Import properly](https://wordpress.org/support/topic/elementor-pages-not-import-properly/) — support / import_export
- [It won’t import the Image or the Published Date](https://wordpress.org/support/topic/it-wont-import-the-image-or-the-published-date/) — support / import_export
- [Images are being imported but not embedded on post](https://wordpress.org/support/topic/images-are-being-imported-but-not-embedded-on-post/) — support / import_export
- [JSON-LD Tag Corrupted During WordPress Import](https://wordpress.org/support/topic/json-ld-tag-corrupted-during-wordpress-import/) — support / pdf_email, import_export
- [Upload file from url – private ip](https://wordpress.org/support/topic/upload-file-from-url-private-ip/) — support / tax_invoice_compliance
- [Problem importing content with \u \n …. characters](https://wordpress.org/support/topic/problem-importing-content-with-u-n-characters/) — support / import_export
- [Import stuck at “triggered = 1” via cron — works manually, fails silently](https://wordpress.org/support/topic/mport-stuck-at-triggered-1-via-cron-works-manually-fails-silently/) — support / import_export, sync_connection
- [support form on your website is broken](https://wordpress.org/support/topic/support-form-on-your-website-is-broken/) — support / update_breakage
- [import ignores one column](https://wordpress.org/support/topic/import-ignores-one-column/) — support / import_export
- [issue in WP import plugin – Google sheet not connecting](https://wordpress.org/support/topic/issue-in-wp-import-plugin-google-sheet-not-connecting/) — support / import_export, sync_connection
- [How to hide broken image links](https://wordpress.org/support/topic/how-to-hide-broken-image-links-2/) — support / update_breakage

### Events Manager – Calendar, Bookings, Tickets, and more! — unique topics 120, rating 4.2, active 60000

Clusters: other:102, update_breakage:6, booking_conflict:3, missing_feature:3, sync_connection:3, tax_invoice_compliance:2, address_validation:1

- [Events Manager Pro requires Users to have Address, City…](https://wordpress.org/support/topic/events-manager-pro-requires-users-to-have-address-city/) — support / address_validation
- [PHP Fatal error: Uncaught Error: Class “EM_Admin_Notice”](https://wordpress.org/support/topic/php-fatal-error-uncaught-error-class-em_admin_notice/) — support / update_breakage
- [Date change booking status](https://wordpress.org/support/topic/date-change-booking-status/) — support / booking_conflict
- [Accessibility Errors](https://wordpress.org/support/topic/accessibility-errors-12/) — support / accessibility_compliance
- [Deactivation of statistical average/total values](https://wordpress.org/support/topic/deactivation-of-statistical-average-total-values/) — support / tax_invoice_compliance
- [Saturday events missing in last row of monthly grid](https://wordpress.org/support/topic/salurday-events-missing-in-last-row-of-monthly-grid/) — support / missing_feature
- [Limit Booking for Users](https://wordpress.org/support/topic/limit-booking-for-users/) — support / booking_conflict
- [Events Manager: Fatal syntax errors in get_post_type() function](https://wordpress.org/support/topic/events-manager-fatal-syntax-errors-in-get_post_type-function/) — support / update_breakage, tax_invoice_compliance
- [Cannot save events or reverting to Draft](https://wordpress.org/support/topic/cannot-save-events-or-reverting-to-draft/) — support / missing_feature
- [Events list and connected search on homepage](https://wordpress.org/support/topic/events-list-and-connected-search-on-homepage/) — support / sync_connection
- [No-Login Booking doesn‘t work – Network error](https://wordpress.org/support/topic/no-login-booking-doesnt-work-network-error/) — support / booking_conflict
- [Can’t get google maps to connect](https://wordpress.org/support/topic/cant-get-google-maps-to-connect-2/) — support / sync_connection
- [Missing plugin name in dashboard](https://wordpress.org/support/topic/https-marijawordpress-test-arnes-si/) — support / missing_feature
- [7.3.7.3 resulted in a critical error](https://wordpress.org/support/topic/7-3-7-3-resulted-in-a-critical-error/) — support / update_breakage
- [Fatal error in version 7.3.7](https://wordpress.org/support/topic/fatal-error-in-version-7-3-7/) — support / update_breakage

### Booking for Appointments and Events Calendar – Amelia — unique topics 120, rating 4.6, active 90000

Clusters: other:75, booking_conflict:33, bulk_workflow:4, update_breakage:4, missing_feature:3, sync_connection:2, import_export:2

- [Request for Hook – Customer Creation during Booking Flow](https://wordpress.org/support/topic/request-for-hook-customer-creation-during-booking-flow/) — support / booking_conflict
- [how to set either fixed slots to book or make this logic work for an overlap](https://wordpress.org/support/topic/how-to-set-either-fixed-slots-to-book-or-make-this-logic-work-for-an-overlap/) — support / booking_conflict
- [Multiple event bookings](https://wordpress.org/support/topic/multiple-event-bookings/) — support / bulk_workflow, booking_conflict
- [Syncing user registrations in Amelia and WordPress](https://wordpress.org/support/topic/syncing-user-registrations-in-amelia-and-wordpress/) — support / sync_connection
- [Bookings going into wrong service](https://wordpress.org/support/topic/bookings-going-into-wrong-service/) — support / booking_conflict
- [Available booking times on the website](https://wordpress.org/support/topic/available-booking-times-on-the-website/) — support / booking_conflict
- [Problem with timeslots](https://wordpress.org/support/topic/problem-with-timeslots/) — support / booking_conflict
- [massive problems with sticky header (amelia booking plugin)](https://wordpress.org/support/topic/massive-problems-with-sticky-header-amelia-booking-plugin/) — support / bulk_workflow, booking_conflict
- [No option to set a start from price](https://wordpress.org/support/topic/no-option-to-set-a-start-from-price/) — support / missing_feature
- [Specials days are not working after update](https://wordpress.org/support/topic/specials-days-are-not-working-after-update/) — support / update_breakage
- [Multiple Conflicts with other plugins producing 502 Bad Gateway Errors](https://wordpress.org/support/topic/multiple-conflicts-with-other-plugins-producing-502-bad-gateway-errors/) — support / bulk_workflow
- [Prevent Same-Day Bookings in Amelia (WordPress)](https://wordpress.org/support/topic/prevent-same-day-bookings-in-amelia-wordpress/) — support / booking_conflict
- [CALENDAR COLUMNS BY EMPLOYEE NAME](https://wordpress.org/support/topic/calendar-columns-by-employee-name/) — support / import_export
- [V9.x composer autoloader-suffix is missing](https://wordpress.org/support/topic/v9-x-composer-autoloader-suffix-is-missing/) — support / missing_feature
- [Paid subscription – breaks auto updates](https://wordpress.org/support/topic/paid-subscription-breaks-auto-updates/) — support / subscription_renewal

### WP Import Export Lite — unique topics 120, rating 4.0, active 40000

Clusters: other:68, import_export:50, missing_feature:3, tax_invoice_compliance:3, update_breakage:2, bulk_workflow:1

- [Problem exporting Content](https://wordpress.org/support/topic/problem-exporting-content/) — support / import_export
- [Wp-admin wp import export htaccess warning message](https://wordpress.org/support/topic/wp-admin-wp-import-export-htaccess-warning-message-2/) — support / import_export
- [Update link URLs on import](https://wordpress.org/support/topic/update-link-urls-on-import/) — support / import_export
- [Warning : Too Many Requests](https://wordpress.org/support/topic/warning-too-many-requests/) — support / bulk_workflow
- [import file not work.](https://wordpress.org/support/topic/import-file-not-work/) — support / import_export
- [Is there a way to export and import featured images of posts?](https://wordpress.org/support/topic/is-there-a-way-to-export-and-import-featured-images-of-posts/) — support / import_export
- [Help importing documents](https://wordpress.org/support/topic/help-importing-documents/) — support / import_export
- [Exported file does not match preview](https://wordpress.org/support/topic/exported-file-does-not-match-preview/) — support / import_export
- [Exporting and importing HTML from Classic Editor](https://wordpress.org/support/topic/exporting-and-importing-html-from-classic-editor/) — support / import_export
- [Variation images Not Importing Woocomerce](https://wordpress.org/support/topic/variation-images-not-importing-woocomerce/) — support / import_export
- [Error when trying to import / upload CSV file](https://wordpress.org/support/topic/error-when-trying-to-import-upload-csv-file/) — support / import_export
- [Export with Settings Issue](https://wordpress.org/support/topic/export-with-settings-issue/) — support / import_export
- [Cannot access IMPORT page?](https://wordpress.org/support/topic/cannot-access-import-page/) — support / import_export, missing_feature
- [Importing selectable attributes to Hivepress listing](https://wordpress.org/support/topic/importing-selectable-attributes-to-hivepress-listing/) — support / import_export
- [Text Error on Import](https://wordpress.org/support/topic/text-error-on-import/) — support / import_export

### MotoPress Hotel Booking — unique topics 120, rating 3.7, active 10000

Clusters: other:91, booking_conflict:23, tax_invoice_compliance:3, sync_connection:2, bulk_workflow:1, update_breakage:1, missing_feature:1

- [Booking multiple accommodations vs single full-property booking](https://wordpress.org/support/topic/booking-multiple-accommodations-vs-single-full-property-booking/) — support / bulk_workflow, booking_conflict
- [In pogress bookings](https://wordpress.org/support/topic/in-pogress-bookings/) — support / booking_conflict
- [Motopress hotel booking iCal validation problem](https://wordpress.org/support/topic/motopress-hotel-booking-ical-validation-problem-2/) — support / booking_conflict
- [New update is causing an fatal error](https://wordpress.org/support/topic/new-update-is-causing-an-fatal-error/) — support / update_breakage
- [Reservation not send email to administrator](https://wordpress.org/support/topic/reservation-not-send-email-to-administrator/) — support / tax_invoice_compliance
- [the calendar does not send the reservation confirmation to the administrator or](https://wordpress.org/support/topic/the-calendar-does-not-send-the-reservation-confirmation-to-the-administrator-or/) — support / tax_invoice_compliance
- [View Booking Link Not WOrking](https://wordpress.org/support/topic/view-booking-link-not-working/) — support / booking_conflict
- [Reservations link issues](https://wordpress.org/support/topic/reservations-link-issues/) — support / tax_invoice_compliance
- [How long does it take to sync calendars?](https://wordpress.org/support/topic/how-long-does-it-take-to-sync-calendars/) — support / sync_connection
- [Availability Search](https://wordpress.org/support/topic/availability-search/) — support / booking_conflict
- [Calendar not working for availability search](https://wordpress.org/support/topic/calendar-not-working-for-availability-search/) — support / booking_conflict
- [Motopress/hotel booking lite/ featured image doesn’t show in my website](https://wordpress.org/support/topic/motopress-hotel-booking-lite-featured-image-doesnt-show-in-my-website/) — support / booking_conflict
- [Payment failed but redirects to the ”booking confirmed” page](https://wordpress.org/support/topic/payment-failed-but-redirects-to-the-booking-confirmed-page/) — support / booking_conflict
- [Appointment Scheduling Calendar Not Working](https://wordpress.org/support/topic/appointment-scheduling-calendar-not-working/) — support / booking_conflict
- [send a request for accommodation availability](https://wordpress.org/support/topic/send-a-request-for-accommodation-availability/) — support / booking_conflict

### Advanced Shipment Tracking for WooCommerce — unique topics 120, rating 4.5, active 70000

Clusters: other:99, label_purchase:13, missing_feature:3, import_export:2, sync_connection:2, update_breakage:1, pdf_email:1

- [DPD UK shipping carrier tracking link incorrect](https://wordpress.org/support/topic/dpd-uk-shipping-carrier-tracking-link-incorrect/) — support / label_purchase
- [Header missing error](https://wordpress.org/support/topic/header-missing-error/) — support / missing_feature
- [tracking of amazon shipping](https://wordpress.org/support/topic/tracking-of-amazon-shipping/) — support / label_purchase
- [Outdated Template File in Woo Advanced Shipment Tracking Plugin](https://wordpress.org/support/topic/outdated-template-file-in-woo-advanced-shipment-tracking-plugin/) — support / label_purchase
- [csv import stuck on importing](https://wordpress.org/support/topic/csv-import-stuck-on-importing/) — support / import_export, sync_connection
- [Issue with plugin / Critical Error](https://wordpress.org/support/topic/issue-with-plugin-critical-error/) — support / update_breakage
- [Add Daewoo Fastex Pakistan in Shipping Carriers](https://wordpress.org/support/topic/add-daewoo-fastex-pakistan-in-shipping-carriers/) — support / label_purchase
- [Shipment tracking information not showing in “Shipped” customer email](https://wordpress.org/support/topic/shipment-tracking-information-not-showing-in-shipped-customer-email/) — support / label_purchase
- [Why the shipment tracking is not progressi\ng](https://wordpress.org/support/topic/why-the-shipment-tracking-is-not-progressing/) — support / label_purchase
- [Feature Request](https://wordpress.org/support/topic/feature-request-1077/) — support / missing_feature
- [Status Bar Stuck on ‘Shipped’ in ‘Completed Order’ Email](https://wordpress.org/support/topic/status-bar-stuck-on-shipped-in-completed-order-email/) — support / sync_connection
- [How to remove the shipment tracking section from customer completed order emails](https://wordpress.org/support/topic/how-to-remove-the-shipment-tracking-section-from-customer-completed-order-emails/) — support / label_purchase
- [Enable Shipping Carriers – no shipping carriers](https://wordpress.org/support/topic/enable-shipping-carriers-no-shipping-carriers/) — support / label_purchase
- [Shipping method available in trackship](https://wordpress.org/support/topic/shipping-method-available-in-trackship/) — support / label_purchase
- [Unable to Disable AST Tracking in Emails and Remove Completed/Partially Shipped](https://wordpress.org/support/topic/unable-to-disable-ast-tracking-in-emails-and-remove-completed-partially-shipped/) — support / missing_feature

### Export and Import Users and Customers — unique topics 120, rating 4.8, active 60000

Clusters: other:81, import_export:36, missing_feature:4, bulk_workflow:2, update_breakage:1, tax_invoice_compliance:1

- [Demo csv – Invalid file type. Please upload a valid import file.](https://wordpress.org/support/topic/demo-csv-invalid-file-type-please-upload-a-valid-import-file/) — support / import_export
- [Can I edit the exported file before import again?](https://wordpress.org/support/topic/can-i-edit-the-exported-file-before-import-again/) — support / import_export
- [What’s the limit of users one can export with the free plugin](https://wordpress.org/support/topic/whats-the-limit-of-users-one-can-export-with-the-free-plugin/) — support / import_export
- [Importing with comma is ok, with semicolon to me didn’t worked](https://wordpress.org/support/topic/importing-with-comma-is-ok-with-semicolon-to-me-didnt-worked/) — support / import_export
- [Missing Orders](https://wordpress.org/support/topic/missing-orders-16/) — support / missing_feature
- [User Import Progress Stagnated](https://wordpress.org/support/topic/user-import-progress-stagnated/) — support / import_export
- [There has been a critical error on this website.](https://wordpress.org/support/topic/there-has-been-a-critical-error-on-this-website-365/) — support / update_breakage
- [Non exporting special fields](https://wordpress.org/support/topic/non-exporting-special-fields/) — support / import_export
- [Not Importing User](https://wordpress.org/support/topic/not-importing-user/) — support / import_export
- [How to export users by group membership?](https://wordpress.org/support/topic/how-to-export-users-by-group-membership/) — support / import_export
- [Error when importing: Invalid order IDs in call to read_multiple()](https://wordpress.org/support/topic/error-when-importing-invalid-order-ids-in-call-to-read_multiple/) — support / bulk_workflow, import_export
- [User export does not include membership status](https://wordpress.org/support/topic/user-export-does-not-include-membership-status/) — support / import_export
- [Import error](https://wordpress.org/support/topic/import-error-65/) — support / import_export
- [No profile picture on imported users](https://wordpress.org/support/topic/no-profile-picture-on-imported-users/) — support / import_export
- [Error “Invalid file type. Only CSV are allowed.”](https://wordpress.org/support/topic/error-invalid-file-type-only-csv-are-allowed/) — support / import_export

### Order Export & Order Import for WooCommerce — unique topics 120, rating 4.7, active 60000

Clusters: other:77, import_export:39, missing_feature:5, tax_invoice_compliance:2, label_purchase:1, bulk_workflow:1, pdf_email:1

- [Orders Will Not Import Between Sites](https://wordpress.org/support/topic/orders-will-not-import-between-sites/) — support / import_export
- [Any priority import orders or users first?](https://wordpress.org/support/topic/any-priority-import-orders-or-users-first/) — support / import_export
- [Does Pro version correctly assign customer_id on import with HPOS (not guest)](https://wordpress.org/support/topic/does-pro-version-correctly-assign-customer_id-on-import-with-hpos-not-guest/) — support / import_export
- [Import freezes after 60 orders](https://wordpress.org/support/topic/import-freezes-after-60-orders/) — support / import_export
- [Number of order can be export and import](https://wordpress.org/support/topic/number-of-order-can-be-export-and-import/) — support / import_export
- [Little Glitch In Our Export](https://wordpress.org/support/topic/little-glitch-in-our-export/) — support / import_export
- [Export Ignores Delimiter Specified in Step 5](https://wordpress.org/support/topic/export-ignores-delimiter-specified-in-step-5/) — support / import_export
- [Import fails on order known to exist](https://wordpress.org/support/topic/import-fails-on-order-known-to-exist/) — support / import_export
- [Strange fields in export](https://wordpress.org/support/topic/strange-fields-in-export/) — support / import_export
- [Deprecated and called incorrectly called warnings when exporting](https://wordpress.org/support/topic/deprecated-and-called-incorrectly-called-warnings-when-exporting/) — support / import_export
- [Order import – missing shipping VAT rate](https://wordpress.org/support/topic/order-import-missing-shipping-vat-rate/) — support / label_purchase, import_export, tax_invoice_compliance, missing_feature
- [Create custom column in export list](https://wordpress.org/support/topic/create-custom-column-in-export-list/) — support / import_export
- [updated plugin – templates missing](https://wordpress.org/support/topic/updated-plugin-templates-missing/) — support / missing_feature
- [Order export – advanced order export](https://wordpress.org/support/topic/order-export-advanced-order-export/) — support / import_export
- [Custom shop and users manager role cannot export orders](https://wordpress.org/support/topic/custom-shop-and-users-manager-role-cannot-export-orders/) — support / import_export, missing_feature

### Brevo for WooCommerce — unique topics 113, rating 3.4, active 30000

Clusters: other:96, sync_connection:6, update_breakage:5, tax_invoice_compliance:3, subscription_renewal:2, label_purchase:1

- [Plugin crashes check-out page made with Bricks V2](https://wordpress.org/support/topic/plugin-crashes-check-out-page-made-with-bricks-v2/) — support / update_breakage
- [Critical Error – Site Crash this morning](https://wordpress.org/support/topic/critical-error-site-crash-this-morning-2/) — support / update_breakage
- [AVIF Images get broken](https://wordpress.org/support/topic/avif-images-get-broken/) — support / update_breakage
- [Everything is synced but contacts are not moved to correct list](https://wordpress.org/support/topic/everything-is-synced-but-contacts-are-not-moved-to-correct-list/) — support / sync_connection
- [Fatal error – Call to a member function date() on int](https://wordpress.org/support/topic/fatal-error-call-to-a-member-function-date-on-int/) — support / update_breakage
- [Not Connecting / no errors](https://wordpress.org/support/topic/not-connecting-no-errors/) — support / sync_connection
- [Conditional logic, when shipping method is](https://wordpress.org/support/topic/conditional-logic-when-shipping-method-is/) — support / label_purchase
- [Brevo Ecommerce Attribute Synchronization Order Sync Failing](https://wordpress.org/support/topic/brevo-ecommerce-attribute-synchronization-order-sync-failing/) — support / sync_connection
- [Order Emal – Product price showing without VAT](https://wordpress.org/support/topic/order-emal-product-price-showing-without-vat/) — support / tax_invoice_compliance
- [Fatal error on Product Pages (v4.0.24 and above)](https://wordpress.org/support/topic/fatal-error-on-product-pages-v4-0-24-and-above-2/) — support / update_breakage
- [BUG – Woo Order Email Showing Prices Without VAT](https://wordpress.org/support/topic/bug-woo-order-email-showing-prices-without-vat/) — support / tax_invoice_compliance
- [uncheck Sync eCommerce attributes](https://wordpress.org/support/topic/uncheck-sync-ecommerce-attributes/) — support / sync_connection
- [Activation Error](https://wordpress.org/support/topic/activation-error-127/) — support / tax_invoice_compliance
- [Check newsletter subscription checkbox by default?](https://wordpress.org/support/topic/check-newsletter-subscription-checkbox-by-default/) — support / subscription_renewal
- [unsubscribe on subscription checkout](https://wordpress.org/support/topic/unsubscribe-on-subscription-checkout/) — support / subscription_renewal

### YITH WooCommerce Subscription — unique topics 106, rating 3.0, active 6000

Clusters: other:69, subscription_renewal:27, update_breakage:9, missing_feature:3, tax_invoice_compliance:1, pdf_email:1

- [Subscription not available on Variabile Products](https://wordpress.org/support/topic/subscription-not-available-on-variabile-products/) — support / subscription_renewal
- [Subscriptions’ sub-orders are not created](https://wordpress.org/support/topic/subscriptions-sub-orders-are-not-created/) — support / subscription_renewal
- [Fatal on cancel Order](https://wordpress.org/support/topic/fatal-on-cancel-order/) — support / update_breakage
- [Fatal Error – Incompatible with Stripe Gateway 10.3.1+](https://wordpress.org/support/topic/fatal-error-incompatible-with-stripe-gateway-10-3-1/) — support / update_breakage
- [(Issue-Free Version) Expiry Date Not Showing for – YITH WooCommerce Subscription](https://wordpress.org/support/topic/issue-free-version-expiry-date-not-showing-for-yith-woocommerce-subscription/) — support / subscription_renewal
- [Fatal error on order cancellation – missing method in Subscription plugin](https://wordpress.org/support/topic/fatal-error-on-order-cancellation-missing-method-in-subscription-plugin/) — support / update_breakage, subscription_renewal, missing_feature
- [YITH WooCommerce Subscription – renewals not being generated](https://wordpress.org/support/topic/yith-woocommerce-subscription-renewals-not-being-generated/) — support / subscription_renewal
- [short code for subscription](https://wordpress.org/support/topic/short-code-for-subscription/) — support / subscription_renewal
- [subscriptions table status is not changing](https://wordpress.org/support/topic/subscriptions-table-status-is-not-changing/) — support / subscription_renewal
- [Subscription product Doesn’t work with Discount Coupons.](https://wordpress.org/support/topic/subscription-product-doesnt-work-with-discount-coupons/) — support / subscription_renewal
- [Change renewal reminder date](https://wordpress.org/support/topic/change-renewal-reminder-date/) — support / subscription_renewal
- [Critical Error & Site Crash After v3.0.1 Update](https://wordpress.org/support/topic/critical-error-site-crash-after-v3-0-1-update/) — support / update_breakage
- [Yith/Stripe – Critical Error](https://wordpress.org/support/topic/yith-stripe-critical-error/) — support / update_breakage
- [Fatal error on cron job](https://wordpress.org/support/topic/fatal-error-on-cron-job/) — support / update_breakage
- [Payment plugin with free version of Yith Woocommerce subscription](https://wordpress.org/support/topic/payment-plugin-with-free-version-of-yith-woocommerce-subscription/) — support / subscription_renewal

### Colissimo shipping methods for WooCommerce — unique topics 89, rating 3.7, active 10000

Clusters: other:83, label_purchase:3, update_breakage:1, missing_feature:1, sync_connection:1, wrong_weight_rate:1

- [Erreur fatale](https://wordpress.org/support/topic/erreur-fatal-3/) — support / update_breakage
- [Missing product variations on label](https://wordpress.org/support/topic/missing-product-variations-on-label/) — support / label_purchase, missing_feature
- [Point de retrait ne s’affiche plus pour client connecté](https://wordpress.org/support/topic/point-de-retrait-ne-saffiche-plus-pour-client-connecte/) — support / sync_connection
- [Php 8 TypeError on label regeneration](https://wordpress.org/support/topic/php-8-typeerror-on-label-regeneration/) — support / label_purchase
- [Belgian customer phone number not appearing on Colissimo shipping label (works f](https://wordpress.org/support/topic/belgian-customer-phone-number-not-appearing-on-colissimo-shipping-label-works-f/) — support / label_purchase
- [Colissimo DDP etiquette non crée, manque dimensions](https://wordpress.org/support/topic/colissimo-ddp-etiquette-non-cree-manque-dimensions/) — support / wrong_weight_rate
- [Où générer une clé de connexion Colissimo Box ?](https://wordpress.org/support/topic/ou-generer-une-cle-de-connexion-colissimo-box/) — support / other
- [Impossible d’afficher la map des points relais sur la page de checkout](https://wordpress.org/support/topic/impossible-dafficher-la-map-des-points-relais-sur-la-page-de-checkout/) — support / other
- [Imprimante thermique ethernet](https://wordpress.org/support/topic/imprimante-thermique-ethernet/) — support / other
- [Problème de langue](https://wordpress.org/support/topic/probleme-de-langue/) — support / other
- [Contexte croisé : même bug identifié côté Up2Pay e-Transactions (GLS)](https://wordpress.org/support/topic/croise-meme-bug-identifie-cote-up2pay-e-transactions-gls/) — support / other
- [Ralentissements de l’administration dus à un verrouillage de session PHP](https://wordpress.org/support/topic/ralentissements-de-ladministration-dus-a-un-verrouillage-de-session-php/) — support / other
- [Impression groupée des étiquettes : erreur « Authentication failed »](https://wordpress.org/support/topic/impression-groupee-des-etiquettes-erreur-authentication-failed/) — support / other
- [Adresse du client non rendue (HTML brut) dans le mail de suivi de commande](https://wordpress.org/support/topic/adresse-du-client-non-rendue-html-brut-dans-le-mail-de-suivi-de-commande/) — support / other
- [Incompatibilité avec “Product Bundles” de Woo à cause du patch pour YITH](https://wordpress.org/support/topic/incompatibilite-avec-product-bundles-de-woo-a-cause-du-patch-pour-yith/) — support / other

### Fraud Prevention For WooCommerce and EDD — unique topics 83, rating 3.7, active 5000

Clusters: other:63, address_validation:7, bulk_workflow:6, missing_feature:4, tax_invoice_compliance:3, update_breakage:3, import_export:1

- [Multiple orders with failed payments from NON legit people](https://wordpress.org/support/topic/multiple-orders-with-failed-payments-from-non-legit-people/) — support / bulk_workflow
- [Fraud Checks Sending Multiple Emails?](https://wordpress.org/support/topic/fraud-checks-sending-multiple-emails/) — support / bulk_workflow
- [Having to deactivate – can you please look at this](https://wordpress.org/support/topic/having-to-deactivate-can-you-please-look-at-this/) — support / tax_invoice_compliance
- [Too Many Order Attempts Setting Does Not Work](https://wordpress.org/support/topic/too-many-order-attempts-setting-does-not-work/) — support / bulk_workflow
- [Blocking street address](https://wordpress.org/support/topic/blocking-street-address/) — support / address_validation
- [Unable to proceed to paypal payment when plugin active](https://wordpress.org/support/topic/unable-to-proceed-to-paypal-payment-when-plugin-active/) — support / missing_feature
- [How to block by country?](https://wordpress.org/support/topic/how-to-block-by-country/) — support / address_validation
- [Cannot globally block @domain.com, need specific email address ?](https://wordpress.org/support/topic/cannot-globally-block-domain-com-need-specific-email-address-2/) — support / address_validation, missing_feature
- [Add E-Mails and IPs in Bulk](https://wordpress.org/support/topic/add-e-mails-and-ips-in-bulk/) — support / bulk_workflow
- [Pin /Zip Code Block Doesnt Work](https://wordpress.org/support/topic/pin-zip-code-block-doesnt-work/) — support / address_validation
- [Block IPs or email addresses from public list](https://wordpress.org/support/topic/block-ips-or-email-addresses-from-public-list/) — support / address_validation
- [Cannot “Allow & Continue” or “Skip” activation](https://wordpress.org/support/topic/cannot-allow-continue-or-skip-activation/) — support / tax_invoice_compliance, missing_feature
- [how to add email id, ip address, zip code in Bulk](https://wordpress.org/support/topic/how-to-add-email-id-ip-address-zip-code-in-bulk/) — support / address_validation, bulk_workflow
- [New Update Broke Paypal Redirect](https://wordpress.org/support/topic/new-update-broke-paypal-redirect/) — support / update_breakage
- [Plugin has broken](https://wordpress.org/support/topic/plugin-has-broken/) — support / update_breakage

### WooCommerce Shipping — unique topics 80, rating 2.1, active 70000

Clusters: label_purchase:38, other:29, address_validation:13, tax_invoice_compliance:4, sync_connection:3, missing_feature:3, update_breakage:2

- [Concerning Shipping Label Receipts](https://wordpress.org/support/topic/concerning-shipping-label-receipts/) — support / label_purchase
- [International USPS labels don’t print 4×6 anymore](https://wordpress.org/support/topic/international-usps-labels-dont-print-4x6-anymore/) — support / label_purchase, address_validation
- [Forbidden: You have reached the maximum number of origin addresses for this site](https://wordpress.org/support/topic/forbidden-you-have-reached-the-maximum-number-of-origin-addresses-for-this-site/) — support / address_validation
- [Can’t print international label](https://wordpress.org/support/topic/cant-print-international-label/) — support / label_purchase, address_validation
- [Not able to purchase a shipping label](https://wordpress.org/support/topic/not-able-to-purchase-a-shipping-label/) — support / label_purchase
- [Errors when creating shipping label](https://wordpress.org/support/topic/errors-when-creating-shipping-label/) — support / label_purchase
- [Label being purchased with wrong weight](https://wordpress.org/support/topic/label-being-purchased-with-wrong-weight/) — support / label_purchase, wrong_weight_rate
- [Venmo payments refuse shipping addresses](https://wordpress.org/support/topic/venmo-payments-refuse-shipping-addresses/) — support / label_purchase, address_validation
- [Incorrect International Addresses Defaultng to Domestic](https://wordpress.org/support/topic/incorrect-international-addresses-defaultng-to-domestic/) — support / address_validation
- [Shipping Validation on Checkout is Overwhelming](https://wordpress.org/support/topic/shipping-validation-on-checkout-is-overwhelming/) — support / label_purchase
- [Can’t Ship International](https://wordpress.org/support/topic/cant-ship-international/) — support / address_validation
- [OAuth Error With WooCommerce Shipping Plugin, since Thursday](https://wordpress.org/support/topic/oauth-error-with-woocommerce-shipping-plugin-since-thursday/) — support / label_purchase, sync_connection
- [Need Adult Signature Restricted Delivery option for USPS Shipping](https://wordpress.org/support/topic/need-adult-signature-restricted-delivery-option-for-usps-shipping-2/) — support / label_purchase
- [WooCommerce Shipping UPS options not populating](https://wordpress.org/support/topic/woocommerce-shipping-ups-options-not-populating/) — support / label_purchase
- [Can no longer purchase shipping labels due to error message](https://wordpress.org/support/topic/can-no-longer-purchase-shipping-labels-due-to-error-message/) — support / label_purchase

### PDF Invoices Italian Add-on for WooCommerce — unique topics 77, rating 4.6, active 4000

Clusters: other:66, pdf_email:5, tax_invoice_compliance:3, bulk_workflow:1, label_purchase:1, update_breakage:1, accessibility_compliance:1

- [PDF Invoices & Packing Slips for WooCommerce version 6 : WARNING.](https://wordpress.org/support/topic/pdf-invoices-packing-slips-for-woocommerce-version-6-warning/) — support / pdf_email
- [Template custom ricevute non rilevato](https://wordpress.org/support/topic/template-custom-ricevute-non-rilevato/) — support / tax_invoice_compliance
- [No receipt or invoice attached](https://wordpress.org/support/topic/no-receipt-or-invoice-attached/) — support / pdf_email
- [The VAT number/tax code field is unique](https://wordpress.org/support/topic/the-vat-number-tax-code-field-is-unique/) — support / tax_invoice_compliance
- [Issue with Downloading Multiple Invoices in WooCommerce](https://wordpress.org/support/topic/issue-with-downloading-multiple-invoices-in-woocommerce/) — support / bulk_workflow, pdf_email
- [disabilitare un metodo di pagamento in base al campo billing_invoice_type](https://wordpress.org/support/topic/disabilitare-un-metodo-di-pagamento-in-base-al-campo-billing_invoice_type/) — support / pdf_email
- [Label Partita IVA o Codice Fiscale](https://wordpress.org/support/topic/label-partita-iva-o-codice-fiscale/) — support / label_purchase
- [“Fatal error” dopo l’aggiornamento del plugin](https://wordpress.org/support/topic/fatal-error-dopo-laggiornamento-del-plugin/) — support / update_breakage
- [Invoice with PayPal](https://wordpress.org/support/topic/invoice-with-paypal/) — support / pdf_email
- [IVA per l’Italia privati/imprese, IVA Europa EXTRA UE](https://wordpress.org/support/topic/iva-per-litalia-privati-imprese-iva-europa-extra-ue/) — support / tax_invoice_compliance
- [Il miglior adattamento per i mercati italiani](https://wordpress.org/support/topic/il-miglior-adattamento-per-i-mercati-italiani/) — review / accessibility_compliance
- [PHP error: Deprecated: date_create() (Plugin v0.9.4.7)](https://wordpress.org/support/topic/php-error-deprecated-date_create-plugin-v0-9-4-7/) — support / other
- [inversione di campi](https://wordpress.org/support/topic/inversione-di-campi/) — support / other
- [San Marino](https://wordpress.org/support/topic/san-marino-2/) — support / other
- [Errore php](https://wordpress.org/support/topic/errore-php/) — support / other

### ShipStation for WooCommerce — unique topics 74, rating 3.3, active 40000

Clusters: other:42, import_export:12, sync_connection:9, missing_feature:4, update_breakage:4, bulk_workflow:3, label_purchase:3

- [Many “Order has been exported to Shipstation” notes](https://wordpress.org/support/topic/many-order-has-been-exported-to-shipstation-notes/) — support / bulk_workflow, import_export
- [REST API extremely slow sync + stale modified_after cursor](https://wordpress.org/support/topic/rest-api-extremely-slow-sync-stale-modified_after-cursor/) — support / sync_connection
- [API Mode “REST” is Forced (vs XML)](https://wordpress.org/support/topic/api-mode-rest-is-forced-vs-xml/) — support / import_export
- [Orders not syncing — timezone bug in XML export date handling still in 4.9.2](https://wordpress.org/support/topic/orders-not-syncing-timezone-bug-in-xml-export-date-handling-still-in-4-9-2/) — support / import_export, sync_connection
- [Possible bug: Timezone conversion missing in export date handling](https://wordpress.org/support/topic/possible-bug-timezone-conversion-missing-in-export-date-handling/) — support / import_export, missing_feature
- [Fatal Error on v4.8.2 – Countable|array](https://wordpress.org/support/topic/fatal-error-on-v4-8-2-countablearray/) — support / update_breakage
- [[Dev] Order Importing](https://wordpress.org/support/topic/dev-order-importing/) — support / import_export
- [V4.7.0 and 4.7.1 crash our website on Checkout](https://wordpress.org/support/topic/v4-7-0-and-4-7-1-crash-our-website-on-checkout/) — support / update_breakage
- [Critical Error with ShipStation and GoDaddy](https://wordpress.org/support/topic/critical-error-with-shipstation-and-godaddy/) — support / update_breakage
- [Can this plugin import ShipStation orders to my website?](https://wordpress.org/support/topic/can-this-plugin-import-shipstation-orders-to-my-website/) — support / import_export
- [Order Status not updating consistently after label is generated](https://wordpress.org/support/topic/order-status-not-updating-consistently-after-label-is-generated/) — support / label_purchase
- [not syncing dimensions or weight](https://wordpress.org/support/topic/not-syncing-dimensions-or-weight/) — support / wrong_weight_rate, sync_connection
- [Missing ShipNotify XML input](https://wordpress.org/support/topic/missing-shipnotify-xml-input/) — support / import_export, missing_feature
- [Multiple Tracking Numbers and Order Notes for same Order](https://wordpress.org/support/topic/multiple-tracking-numbers-and-order-notes-for-same-order/) — support / bulk_workflow
- [Just an FYI if you get an error connecting](https://wordpress.org/support/topic/just-an-fyi-if-you-get-an-error-connecting/) — support / sync_connection

### Order Export for WooCommerce — unique topics 70, rating 3.8, active 2000

Clusters: other:37, import_export:20, missing_feature:6, tax_invoice_compliance:4, update_breakage:4, label_purchase:2, pdf_email:1

- [Possible to use two shipping zone for a customer?](https://wordpress.org/support/topic/possible-to-use-two-shipping-zone-for-a-customer/) — support / label_purchase
- [Orders do not appear when exporting](https://wordpress.org/support/topic/orders-do-not-appear-when-exporting/) — support / import_export
- [Simple Export in csv Product/Client/Total](https://wordpress.org/support/topic/simple-export-in-csv-product-client-total/) — support / import_export
- [[NSFW] Why NOT enable to change default invoice order number](https://wordpress.org/support/topic/why-not-enable-to-change-default-invoice-order-number/) — support / pdf_email
- [Export dosen’t work for editor user](https://wordpress.org/support/topic/export-dosent-work-for-editor-user/) — support / import_export
- [Export Sort By Issue](https://wordpress.org/support/topic/export-sort-by-issue/) — support / import_export
- [Can’t export anything!! Please help! Syntax error!](https://wordpress.org/support/topic/cant-export-anything-please-help-syntax-error/) — support / import_export, tax_invoice_compliance
- [Filter by shipping method or Title not working (Free version)](https://wordpress.org/support/topic/filter-by-shipping-method-or-title-not-working-free-version/) — support / label_purchase
- [Export to Excel?](https://wordpress.org/support/topic/export-to-excel-14/) — support / import_export
- [Working fix to export accented / non-western characters](https://wordpress.org/support/topic/working-fix-to-export-accented-non-western-characters/) — support / import_export
- [fatal error](https://wordpress.org/support/topic/fatal-error-3255/) — support / update_breakage
- [vat field missing](https://wordpress.org/support/topic/vat-field-missing/) — support / tax_invoice_compliance, missing_feature
- [company name on order export](https://wordpress.org/support/topic/company-name-on-order-export/) — support / import_export
- [Order Export Start Date Not Working](https://wordpress.org/support/topic/order-export-start-date-not-working/) — support / import_export
- [Bug tax on items princes](https://wordpress.org/support/topic/bug-tax-on-items-princes/) — support / tax_invoice_compliance

### WP All Import – Import SEO Settings for Yoast SEO — unique topics 61, rating 2.8, active 20000

Clusters: other:36, import_export:20, tax_invoice_compliance:2, missing_feature:2, bulk_workflow:1, update_breakage:1

- [Import meta for product taxonomy](https://wordpress.org/support/topic/import-meta-for-product-taxonomy/) — support / import_export, tax_invoice_compliance
- [Yoast AddOn breaks import process](https://wordpress.org/support/topic/yoast-addon-breaks-import-process/) — support / import_export
- [Can’t selectively update ONLY Yost data on update import?](https://wordpress.org/support/topic/cant-selectively-update-only-yost-data-on-update-import/) — support / import_export
- [WP Import All CLI support (update?)](https://wordpress.org/support/topic/wp-import-all-cli-support-update/) — support / import_export
- [from where to get data to import](https://wordpress.org/support/topic/from-where-to-get-data-to-import/) — support / import_export
- [Import Product identifier (ISBN/EAN) not working](https://wordpress.org/support/topic/import-product-identifier-isbn-ean-not-working/) — support / import_export
- [Formatting CSV or Excel for SEO of images and posts](https://wordpress.org/support/topic/formatting-csv-or-excel-for-seo-of-images-and-posts/) — support / import_export
- [Importing of all SEO doesn’t work](https://wordpress.org/support/topic/importing-of-all-seo-doesnt-work/) — support / import_export
- [WP Import All CLI support](https://wordpress.org/support/topic/wp-import-all-cli-support/) — support / import_export
- [Import ISBN/GTIN/EAN](https://wordpress.org/support/topic/import-isbn-gtin-ean/) — support / import_export
- [no YOAST block when importing categories](https://wordpress.org/support/topic/no-yoast-block-when-importing-categories/) — support / import_export
- [Incorrect stock date after import](https://wordpress.org/support/topic/incorrect-stock-date-after-import/) — support / import_export
- [Unable to update existing posts](https://wordpress.org/support/topic/unable-to-update-existing-posts/) — support / missing_feature
- [Import not changing Yoast values.](https://wordpress.org/support/topic/import-not-changing-yoast-values/) — support / import_export
- [Can I import Meta keywords](https://wordpress.org/support/topic/can-i-import-meta-keywords/) — support / import_export

### Sendcloud Shipping — unique topics 40, rating 2.8, active 5000

Clusters: other:31, update_breakage:4, sync_connection:3, tax_invoice_compliance:1, import_export:1, label_purchase:1

- [Updating to 1.0.29 trows a fatal error.](https://wordpress.org/support/topic/updating-to-1-0-30-also-trows-a-fatal-error/) — support / update_breakage
- [Fatal error after update to 1.0.29](https://wordpress.org/support/topic/fatal-error-after-update-to-1-0-29/) — support / update_breakage
- [Fatal error after activating plugin](https://wordpress.org/support/topic/fatal-error-after-activating-plugin-3/) — support / update_breakage, tax_invoice_compliance
- [Problem order import by api](https://wordpress.org/support/topic/problem-order-import-by-api/) — support / import_export
- [Cloudflare Bot Fighting Mode – Sendcloud Sync Issued](https://wordpress.org/support/topic/cloudflare-bot-fighting-mode-sendcloud-sync-issued/) — support / sync_connection
- [Pre-order product’s aren’t synced](https://wordpress.org/support/topic/pre-order-products-arent-synced/) — support / sync_connection
- [Fatal error: Uncaught Error: Call to a member function get_meta() on bool](https://wordpress.org/support/topic/fatal-error-uncaught-error-call-to-a-member-function-get_meta-on-bool/) — support / update_breakage
- [SendCloud makes shipping easy](https://wordpress.org/support/topic/sendcloud-makes-shipping-easy/) — review / label_purchase
- [Unreliable; loses connections, Unacceptable customer service](https://wordpress.org/support/topic/unreliable-loses-connections-unacceptable-customer-service/) — review / sync_connection
- [Vulnerability in 1.0.31 version](https://wordpress.org/support/topic/vulnerability-in-1-0-31-version/) — support / other
- [Forced Overlay](https://wordpress.org/support/topic/forced-overlay-2/) — support / other
- [Bug on 1.0.29](https://wordpress.org/support/topic/bug-on-1-0-29/) — support / other
- [Legacy REST API enabled without consult after installing the plugin](https://wordpress.org/support/topic/legacy-rest-api-enabled-without-consult-after-installing-the-plugin/) — support / other
- [Woocommerce email designer not working](https://wordpress.org/support/topic/woocommerce-email-designer-not-working/) — support / other
- [V2 plugin not available](https://wordpress.org/support/topic/v2-plugin-not-available/) — support / other

### Blacklist Manager – WooCommerce Anti-Fraud, Blacklist & Checkout Verification — unique topics 40, rating 3.8, active 2000

Clusters: other:37, missing_feature:2, subscription_renewal:1, accessibility_compliance:1

- [Bug: Email verification order marker missing when account is created at checkout](https://wordpress.org/support/topic/bug-email-verification-order-marker-missing-when-account-is-created-at-checkout/) — support / missing_feature
- [WooCommerce Subscriptions copies Blacklist Manager checkout metadata to renewal](https://wordpress.org/support/topic/woocommerce-subscriptions-copies-blacklist-manager-checkout-metadata-to-renewal/) — support / subscription_renewal, accessibility_compliance
- [Plugin file is missing](https://wordpress.org/support/topic/plugin-file-is-missing/) — support / missing_feature
- [Incorrect/Unclear “Email Verification” Setting Description](https://wordpress.org/support/topic/incorrect-unclear-email-verification-setting-description/) — support / other
- [Compatibility with WC Core 11.0+ “Customer Email Verification”](https://wordpress.org/support/topic/compatibility-with-wc-core-11-0-customer-email-verification/) — support / other
- [yogb_bm_compact_meta_cleanup causes infinite loop and clogs Action Scheduler](https://wordpress.org/support/topic/yogb_bm_compact_meta_cleanup-causes-infinite-loop-and-clogs-action-scheduler/) — support / other
- [Receive email notification about New Order but the order is Pending Payment](https://wordpress.org/support/topic/receive-email-notification-about-new-order-but-the-order-is-pending-payment/) — support / other
- [Klarna order went through](https://wordpress.org/support/topic/klarna-order-went-through/) — support / other
- [origin unknown orders](https://wordpress.org/support/topic/origin-unknown-orders/) — support / other
- [CSS conflict again](https://wordpress.org/support/topic/css-conflict-again/) — support / other
- [Prevent login option](https://wordpress.org/support/topic/prevent-login-option/) — support / other
- [Limit on blocking](https://wordpress.org/support/topic/limit-on-blocking/) — support / other
- [Call to undefined function get_real_customer_ip](https://wordpress.org/support/topic/call-to-undefined-function-get_real_customer_ip/) — support / other
- [Customer can still order after I block them](https://wordpress.org/support/topic/customer-can-still-order-after-i-block-them/) — support / other
- [Omg! Again u add to menu item with ADS](https://wordpress.org/support/topic/omg-again-u-add-to-menu-item-with-ads/) — support / other

### WP All Export – Order Export for WooCommerce — unique topics 11, rating 3.9, active 3000

Clusters: other:10, import_export:1

- [Where is xml?](https://wordpress.org/support/topic/where-is-xml/) — support / import_export
- [Scheduling Reports – Pro only?](https://wordpress.org/support/topic/scheduling-reports-pro-only/) — support / other
- [Orders not showing](https://wordpress.org/support/topic/orders-not-showing-5/) — support / other
- [It is more than perfect; a must-have.](https://wordpress.org/support/topic/it-is-more-than-perfect-a-must-have/) — review / other
- [Insanely Expensive!](https://wordpress.org/support/topic/insanely-expensive-2/) — review / other
- [Not Free: The free version is useless!](https://wordpress.org/support/topic/not-free-the-free-version-is-useless/) — review / other
- [Wichtige Extension](https://wordpress.org/support/topic/wichtige-extension/) — review / other
- [Great plugin](https://wordpress.org/support/topic/great-plugin-37274/) — review / other
- [Very Happy With Features](https://wordpress.org/support/topic/very-happy-with-features/) — review / other
- [Top products for years](https://wordpress.org/support/topic/top-products-for-years/) — review / other
- [Easy peasy lemon squeezy](https://wordpress.org/support/topic/easy-peasy-lemon-squeezy-16/) — review / other

### Accounting for WooCommerce — unique topics 10, rating 3.7, active 500

Clusters: other:6, import_export:3, missing_feature:1

- [Le refund export est faux](https://wordpress.org/support/topic/le-refund-export-est-faux/) — support / import_export
- [Export Avoir vide](https://wordpress.org/support/topic/export-avoir-vide/) — support / import_export
- [Export vide](https://wordpress.org/support/topic/export-vide-2/) — support / import_export
- [Option missing](https://wordpress.org/support/topic/option-missing/) — support / missing_feature
- [err_invalid_response](https://wordpress.org/support/topic/err_invalid_response-9/) — support / other
- [Create a Table with all transactions by date](https://wordpress.org/support/topic/create-a-table-with-all-transactions-by-date/) — support / other
- [WooCommerce Book Keeper](https://wordpress.org/support/topic/woocommerce-book-keeper/) — support / other
- [Fonctionne bien](https://wordpress.org/support/topic/fonctionne-bien-14/) — review / other
- [erreur critique](https://wordpress.org/support/topic/erreur-critique-9/) — review / other
- [Très simple et utile !](https://wordpress.org/support/topic/tres-simple-et-utile/) — review / other

### One Accessibility — unique topics 2, rating 3.5, active 200

Clusters: other:2

- [Looks good but does not work](https://wordpress.org/support/topic/looks-good-but-does-not-work/) — review / other
- [super](https://wordpress.org/support/topic/super-3120/) — review / other

## Gate

- 同一workflowの不満が本文確認で10件未満なら棄却。
- 10件以上でも、直接競合・無料代替・platform nativeで解決済みなら棄却。
- 価格付き乗換意思、前払い、または明確なmarketplace acquisitionがなければbuildしない。
