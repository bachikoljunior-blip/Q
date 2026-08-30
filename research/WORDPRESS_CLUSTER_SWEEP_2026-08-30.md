# WORDPRESS COMPLAINT CLUSTER SWEEP — 2026-08-30

Status: **RESEARCH REJECTION RECORD**  
Build approved: **false**

## Purpose

WordPress support/review mining found many complaints, but a complaint count is not a product. This pass translated the largest actionable clusters into exact-ish workflows and checked whether the obvious product already exists.

The result is **no promotion to RESEARCH_ONLY**. The clusters below stay evidence only.

## 1. Email delivery / transactional email watchdog

Possible workflow:
`WordPress/WooCommerce owner connects site/email logs → tool sends/observes transactional emails → detects missing, bounced or unauthenticated messages/attachments → alerts and report → annual subscription`

Direct/strong substitutes already cover the outcome:
- WP Mail SMTP
- Post SMTP
- FluentSMTP
- MailPoet
- Mailgun / SendGrid / Amazon SES integrations
- WP Mail Logging and email test plugins

Why rejected:
- delivery, logging, alerts, provider routing and reports already exist;
- a narrower “invoice attachment missing” feature is largely plugin-specific and low-frequency;
- cross-plugin compatibility and mail-provider support would create ongoing customer support.

## 2. Booking conflict / availability synchronization auditor

Possible workflow:
`booking owner connects WordPress booking calendar + Google/iCal feeds → tool detects double bookings, blocked-slot mismatches and stale sync → alerts/fix list → monthly subscription`

Direct/strong substitutes:
- Amelia
- Bookly
- WooCommerce Bookings
- Booking Calendar
- WP Booking System
- Lodgify / Hostaway / channel managers

Why rejected:
- calendar synchronization and conflict prevention are core paid features of existing booking products;
- a standalone auditor would need compatibility with many data models and APIs;
- the complaint cluster mixes configuration errors, provider-specific bugs and desired features rather than one stable input/output workflow.

## 3. Import/export preflight for media and custom fields

Possible workflow:
`site owner uploads CSV/XML and target schema → tool dry-runs mapping/media/custom fields → identifies failing rows and creates clean import file → one-time or annual price`

Direct/strong substitutes:
- WP All Import / WP All Export
- ImportWP
- WP Ultimate CSV Importer
- WooCommerce Product CSV Import Suite
- native WooCommerce product importer/exporter
- migration/staging services

Why rejected:
- preview, mapping, validation and clean re-export are already central workflow features;
- the exact product shape repeats the CSV-cleaner pattern rejected in prior sweeps;
- plugin/theme-specific custom fields make support scale with integrations.

## 4. Invoice/PDF sequence and attachment integrity audit

Possible workflow:
`WooCommerce owner scans orders/invoice metadata/PDFs → tool flags duplicate or skipped numbers, reused numbers, missing/blank attachments → audit CSV/alerts → annual subscription`

Direct/strong substitutes and adjacent products:
- PDF Invoices & Packing Slips for WooCommerce (WP Overnight)
- WebToffee WooCommerce PDF Invoices
- Flexible PDF Invoices for WooCommerce
- WooCommerce Sequential Order Numbers Pro
- Germanized / German Market invoice workflows
- accounting and e-invoicing integrations

Why rejected:
- invoice creation, numbering and attachment handling are paid-plugin features already;
- legal significance varies by jurisdiction, tax regime and invoice type;
- an “integrity only” checker has unclear willingness to pay, while compliance claims require expert review and updates.

## 5. Accessibility regression scanner after updates

Possible workflow:
`site owner supplies URL before/after plugin update → scanner runs WCAG/checkout tests and DOM diff → flags newly introduced barriers → report/alert → monthly subscription`

Direct/strong substitutes:
- axe / Deque tooling
- Pa11y
- Equalize Digital Accessibility Checker
- Accessibility Insights
- UserWay / accessiBe and other scanners
- visual regression and managed WordPress update products

Why rejected:
- automated accessibility scanning and regression testing are mature categories;
- automated scanners cannot prove legal compliance;
- checkout/theme/plugin compatibility and false positives require expert support.

## 6. Plugin-update checkout canary

Possible workflow:
`WooCommerce owner connects staging/live site → tool performs add-to-cart/checkout/payment smoke before and after updates → identifies breakage and rollback point → monthly subscription`

Direct/strong substitutes:
- WP Engine Smart Plugin Manager
- BlogVault staging/update testing
- WP Umbrella safe updates
- ManageWP / MainWP update workflows
- visual regression services
- browser-test monitoring products

Why rejected:
- safe updates, staging, visual comparison and uptime checks are already sold;
- reliable payment testing needs gateway sandboxes and site-specific setup;
- the exact value requires integrations and exception handling that increase support with customer count.

## Permanent interpretation

- High complaint volume shows pain, not an unserved product.
- Reviews of one plugin often ask that plugin to fix itself; they do not automatically support a separate product.
- Generic `bug`, `support`, `email`, `booking`, `billing` and `import` clusters must be reduced to one stable cross-product workflow before promotion.
- No cluster above passes exact-match, support-burden and differentiation gates.

## Result

`NO_ACTIVE_CANDIDATE` remains correct. The automated queue may surface narrower examples later, but no WordPress product is approved from current cluster counts.
