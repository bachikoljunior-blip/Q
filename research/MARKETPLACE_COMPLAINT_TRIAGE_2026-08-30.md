# MARKETPLACE COMPLAINT TRIAGE — 2026-08-30

## Final result

**No marketplace complaint lead passed the prebuild gate.**

Status after this pass: `NO_ACTIVE_CANDIDATE`.

The automated WordPress scan and complaint-title miner are discovery tools only. High installs, low ratings, support-topic counts and visible complaints are not build approval.

## Machine scan completed

Implemented:
- `research/tools/marketplace_scan.py`
- `research/tools/filter_marketplace_scan.py`
- `research/tools/mine_wordpress_complaints.py`
- `.github/workflows/marketplace_scan.yml`

Outputs:
- `research/marketplace_scan/latest.json`
- `research/marketplace_scan/latest.md`
- `research/marketplace_scan/shortlist.json`
- `research/marketplace_scan/shortlist.md`
- `research/marketplace_scan/complaints.json`
- `research/marketplace_scan/complaints.md`

The scanner:
- queries the public WordPress.org plugin API
- records demand/ratings/support signals
- filters broad WooCommerce search noise
- mines public support/review topic titles
- normalizes one forum topic to one record
- marks every output `build_approved=false`

Atlassian Marketplace is recorded as manual-only because the V2 search API was retired and returned HTTP 410; the scanner does not pretend to cover it with an unverified replacement.

## Lead 1 — WooCommerce invoice integrity / missing-PDF monitor

Observed complaints:
- invoice PDF missing from email
- skipped/reused/duplicate invoice numbers
- bulk PDF actions failing
- blank or corrupted PDFs
- compliance questions

Exact workflow considered:

`WooCommerce store owner installs plugin → orders/invoice metadata are scanned → missing invoices, numbering gaps/duplicates and attachment failures are flagged → repair queue/report → paid plugin`

Rejected because direct products already deliver the central outcome:
- SleekView for PDF Invoices & Packing Slips: invoice table, sequential-gap audit, missing-invoice queue, bulk regeneration
- SleekView Charts: issuance dashboards and sequential-gap audit
- PDF InvoiceX / multiple WooCommerce invoice plugins: sequential numbering, VAT/GST support, email attachment and bulk workflows
- WooCommerce official marketplace invoice generators

The direct workflow is already sold. A generic “monitor after plugin updates” version would also overlap WordPress/WooCommerce health-monitoring products.

Decision: **REJECT — exact paid workflow exists.**

## Lead 2 — WooCommerce booking-integrity canary

Observed complaints:
- available slots not reducing
- bookings going to the wrong service
- booking forms not visible/working
- availability/calendar synchronization problems
- payment failed but confirmation shown
- overbooking/capacity concerns

Exact workflow considered:

`booking-site owner configures a test resource → scheduled synthetic reservation or read-only capacity check runs → inventory/slot/payment/confirmation invariants are checked → alert/evidence report → subscription`

Rejected because:
- booking products themselves advertise atomic anti-overbooking, resources and availability controls
- CashFlowCanary and CheckOO already perform scheduled synthetic WooCommerce checkout/ghost transactions and alerts
- Sentrix and other store-health monitors detect silent WooCommerce failures
- a booking-specific implementation would still need deep integrations across incompatible booking plugins, payment gateways, calendars and cleanup rules

The unmet complaint is real, but a cross-plugin product would have high support/integration burden. A single-plugin monitor is vulnerable to the vendor fixing the bug and has a small acquisition surface.

Decision: **REJECT — adjacent synthetic-monitor products exist and support burden violates the target model.**

## Lead 3 — WooCommerce tax calculation auditor

Observed complaints:
- zero/incorrect tax after update
- address parsing and ZIP errors
- mismatch in order totals
- tax exemption and jurisdiction issues

Exact workflow considered:

`WooCommerce order is completed → independent rules/reference rates re-check tax → undertax/overcharge/API failures are flagged → compliance alert/report → subscription`

Rejected because TaxDebug already markets the same audit layer: it reviews completed WooCommerce orders, detects under/over-taxing and silent API failures across WooCommerce Tax, TaxJar, Avalara and manual rates. TaxCloud, Avalara, Taxually and other compliance products also provide calculation, nexus, filing and reporting.

Tax law coverage would create high ongoing legal/data maintenance and liability.

Decision: **REJECT — exact auditor exists; compliance burden is high.**

## Lead 4 — WordPress accessibility regression monitor

Observed complaints:
- accessibility plugins causing issues
- scans/connectivity problems
- regression and compliance concerns

Rejected because the exact recurring workflow is already crowded:
- AccessGuard: WordPress WCAG scanning, annual plans
- AccessLens: free WordPress WCAG/EAA scanning
- Warder: scheduled scans, history, alerts and webhooks
- CompliaScan: automated monitoring, reports and AI guidance
- WCAGpatch and multiple agency tools: scheduled scans, alerts and evidence documents

Automated scanning also cannot establish full conformance without manual testing.

Decision: **REJECT — multiple exact paid/free products and legal-expectation risk.**

## Lead 5 — WordPress CSV import/export integrity monitor

Observed complaints:
- only part of CSV imported
- custom fields/roles/images missing
- preview and output mismatch
- cron imports silently stuck
- exports missing columns

Rejected because the market already contains WP All Import, WP Import Export, user/customer import/export plugins, WooCommerce CSV tools and many source-specific importers. A universal repair product would require schema/plugin-specific adapters and ongoing support. Narrow source-to-destination repairs repeatedly produced exact competitors in the previous sweep.

Decision: **REJECT — crowded exact workflows and adapter/support burden.**

## Lead 6 — generic WooCommerce checkout/store-health monitoring

Rejected directly:
- CashFlowCanary runs continuous checkout monitoring and synthetic test-order workflows
- CheckOO performs scheduled ghost transactions and alerts
- Sentrix monitors WooCommerce sales pipeline, configuration, file integrity, task queues and availability

Decision: **REJECT — exact workflow already exists.**

## Evidence URLs

Invoice integrity:
- https://sleekwp.com/view/for/woocommerce-pdf-invoices-packing-slips/
- https://sleekwp.com/view/charts-for/woocommerce-pdf-invoices-packing-slips/
- https://wordpress.org/plugins/pdf-invoicex/
- https://woocommerce.com/document/pdf-invoice-generator/

Synthetic monitoring / booking:
- https://wordpress.org/plugins/cashflowcanary-for-woocommerce/
- https://wordpress.org/plugins/checkoo/
- https://wordpress.org/plugins/sentrix-by-ilabs/
- https://slotive.app/
- https://woocommerce.com/products/woocommerce-bookings/

Tax audit/compliance:
- https://taxdebug.com/
- https://woocommerce.com/products/taxcloud/
- https://woocommerce.com/products/woocommerce-avatax/
- https://wordpress.org/plugins/taxually/

Accessibility:
- https://www.accessguard-wp.com/
- https://wordpress.org/plugins/accesslens/
- https://warder.app/
- https://compliascan.com/pricing
- https://wcagpatch.com/

## Decision

Do not promote any complaint cluster into `ACTIVE_CANDIDATE` merely because complaints are numerous.

A future marketplace lead must identify a narrower outcome that:
- is not already delivered by the plugin vendor, generic monitor or adjacent paid tool
- has repeated evidence in complaint **bodies**, not just title keywords
- can be supported without per-plugin customization
- has a marketplace/search acquisition path
- has economics to reach the take-home target

No current lead meets all requirements.
