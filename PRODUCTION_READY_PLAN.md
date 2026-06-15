# Kothakhahon Production-Ready Plan

This document replaces the older scattered plan/checklist files and acts as the single implementation roadmap for taking the current project from development build to a stable commercial launch.

## 0. Progress Tracker

Last updated: 2026-04-11

Current repo progress:

- Phase 1 is partially prepared in code only: `prisma migrate deploy` exists, env/readiness checks exist, and basic security headers are present. Actual hosting, managed Postgres, staging, backups, and restore drill are still not done.
- Phase 2 is partially done: protected admin routes and secure session cookies exist, and public form/checkout rate limiting exists. The rate limiter is still in-memory and login/register/admin login rate limiting is still pending.
- Phase 3 is in progress and is the main active implementation area.

Completed implementation batches in this repo:

- Batch 1 complete:
  inventory fields added to books, richer order lifecycle added, stock status shown on storefront, admin can edit stock, and checkout blocks unavailable books.
- Batch 2 complete:
  inventory now deducts transactionally on confirmed orders, COD orders commit stock at creation time, paid Razorpay orders commit stock during verification, and admin cancellation/refund actions restock committed inventory.
- Batch 3 complete:
  shipping rules now exist for direct India checkout, shipping is no longer hardcoded to zero, checkout totals include shipping, and the public shipping policy reflects the live rule.
- Batch 4 complete:
  Razorpay webhook verification now exists, client verify and webhook share the same centralized paid-order finalization path, duplicate paid events are idempotent, and webhook-driven payment failures can mark orders failed safely.
- Batch 5 complete:
  invoice fields now exist on orders, protected invoice download is available for customer/admin sessions, and account/admin order screens expose invoice download links.
- Batch 6 complete:
  transactional emails now enqueue into a Postgres-backed background job flow, request handlers no longer wait on Resend, and queued jobs can retry through the protected processor route.

Current state by workstream:

- Workstream A: not complete
- Workstream B: started
- Workstream C: started
- Workstream D: started
- Workstream E: started
- Workstream F: started
- Workstream G: partially started
- Workstream H: started
- Workstream I: partially started
- Workstream J: partially started
- Workstream K: not started
- Workstream L: not started
- Workstream M: [NEW] Frontend Stability & SEO (Added from June Audit)

Resume here next:

- Fix critical Cart Persistence issue found in June audit.
- Resolve Blog slug 404s and placeholder links.
- Add basic automated coverage for pricing, checkout, and auth-critical flows.
- After that, add failure alerting and operator visibility for repeated background email job failures.

## 1. Goal

Ship the current Next.js storefront as a reliable, secure, maintainable e-commerce platform that can handle real book orders, real payments, and hundreds of customers on a live domain without operational chaos.

For this project, "production-ready" means:

- orders are created correctly and never duplicated accidentally
- payment state is server-authoritative
- stock and shipping are accurate
- auth and admin access are hardened
- failures are observable and recoverable
- staging and production are separated
- the app remains fast under normal browsing and checkout traffic

## 2. Current Architecture Snapshot

Current stack in the repo today:

- Next.js 16 App Router
- React 19
- Prisma 7
- PostgreSQL
- custom session auth
- custom admin dashboard
- COD-first checkout with Razorpay integration started
- Resend for email
- local-storage cart

Important planning decision:

- We should harden the existing stack for launch instead of doing a large stack migration before go-live.
- Do not migrate to Supabase or Sanity before first launch unless the client makes that a contractual requirement.
- First make the current platform correct, secure, and observable.

## 3. Launch Standard

The site is ready for production only when all of the following are true:

- the app runs on a managed host with HTTPS and a real domain
- the database is managed, backed up, pooled, and restorable
- orders, payments, and emails can be traced end to end
- admin actions are protected and auditable
- public traffic spikes do not break browsing or checkout
- every critical flow has at least one automated test
- monitoring alerts us before customers complain

## 4. Workstreams

### Workstream A: Hosting, Environment, and Infrastructure

This is the first blocker. Without this, nothing else is truly production-safe.

Build / upgrade:

- deploy to a production-grade platform such as Vercel or a stable Node host
- move `DATABASE_URL` and `DIRECT_URL` to managed Postgres
- enable connection pooling
- define separate `development`, `staging`, and `production` environments
- store secrets in the host secret manager, not in local files
- verify the real domain and canonical `NEXT_PUBLIC_SITE_URL`
- configure SSL, secure headers, and redirect behavior
- create a repeatable database migration workflow using `prisma migrate deploy`

Required deliverables:

- production deployment target selected
- managed Postgres instance created
- staging environment mirrors production config
- backup policy documented
- restore test completed at least once
- `.env.example` updated to match final required variables

Acceptance criteria:

- production build deploys with no local-only dependencies
- we can restore the database from backup to staging
- connection errors do not appear under normal load

### Workstream B: Database Reliability and Data Integrity

The current schema works for development, but commerce needs stricter guarantees.

Build / upgrade:

- review all Prisma models for missing constraints and indexes
- add inventory fields to books or create a dedicated inventory table
- enforce unique/idempotent payment references
- add safer order transition rules
- store invoice identifiers and fulfillment timestamps
- add created-by / updated-by tracking for sensitive admin edits if needed
- ensure all critical read paths have indexes: books, authors, blog slugs, orders by user/email/status

Required deliverables:

- schema migration plan for commerce fields
- production migration scripts
- index review completed against actual query patterns

Acceptance criteria:

- no overselling due to missing stock control
- duplicate payment callbacks do not create duplicate orders or duplicate paid states
- order lookup remains fast with real production data volume

### Workstream C: Authentication, Authorization, and Security

Traffic volume is not the hard part here. Abuse resistance is.

Build / upgrade:

- harden custom session auth with secure cookies, strict expiry, and rotation rules
- add rate limiting for login, register, admin login, newsletter, contact, and manuscript endpoints
- move rate limiting from in-memory storage to Redis/Upstash or another shared backend
- audit all protected routes and admin-only pages
- verify server-side session checks on every protected route
- review form validation and server input sanitization everywhere
- add CSRF protection where needed for sensitive mutations
- create a simple admin security policy: strong passwords, least privilege, and a 2FA roadmap

Required deliverables:

- shared production-safe rate limiter
- auth hardening checklist completed
- protected route audit completed

Acceptance criteria:

- brute-force attempts are throttled
- admin-only pages cannot be reached by customer sessions
- session tampering or expired sessions do not expose private UI states

### Workstream D: Checkout, Payments, and Order Correctness

This is the most important business workstream.

Build / upgrade:

- keep the server as the source of truth for price calculation
- add real shipping rules instead of hardcoded zero shipping
- support clear COD and prepaid flows in one consistent checkout model
- implement Razorpay webhook verification
- add payment idempotency keys and retry-safe order transitions
- separate `order created`, `payment pending`, `payment paid`, `payment failed`, `packed`, `shipped`, and `cancelled`
- improve the guest checkout and authenticated checkout merge behavior
- store structured address data cleanly
- add invoice generation and invoice download
- add internal admin actions for packing, shipping, cancellation, and refund notes

Required deliverables:

- shipping logic and pricing rules
- webhook endpoint with signature validation
- order lifecycle model upgrade
- invoice generation flow

Acceptance criteria:

- refreshing or retrying checkout does not create duplicate paid orders
- COD and Razorpay orders both appear correctly in admin and customer dashboards
- customers see accurate totals before confirming the order

### Workstream E: Inventory and Fulfillment

This is currently a missing production capability.

Build / upgrade:

- add stock quantity, stock status, and low-stock threshold
- prevent checkout for unavailable books
- reserve stock during payment flow if needed
- support manual stock updates from admin
- surface stock status on product pages
- expose fulfillment states that match real operations

Recommended order states:

- `pending`
- `payment_pending`
- `paid`
- `processing`
- `packed`
- `shipped`
- `delivered`
- `cancelled`
- `refunded`

Acceptance criteria:

- inventory drops correctly when an order is confirmed
- out-of-stock books cannot be oversold
- admin can see which orders still need packing or shipping

### Workstream F: Email, Notifications, and Background Jobs

Synchronous email sending inside request/response is fragile.

Build / upgrade:

- move order email, admin notification email, manuscript alerts, and newsletter-side effects into a background job system
- use a queue such as Inngest, Trigger.dev, pg-boss, or BullMQ
- add retry rules and dead-letter visibility
- log message delivery status
- send separate customer and admin templates

Required deliverables:

- background job provider selected
- queue-backed transactional email flow
- failure alerting for repeated send failures

Acceptance criteria:

- checkout succeeds even if the email provider is slow
- failed sends can be retried without corrupting order state

### Workstream G: Catalog, Search, and Content Performance

The current storefront can browse a modest catalog, but production needs cleaner query and URL behavior.

Build / upgrade:

- move heavy catalog filtering and sorting to the server where appropriate
- keep filter state in the URL
- add pagination or cursor-based loading for large lists
- build debounced autocomplete search in the header
- review caching and revalidation for catalog, authors, blog, and home sections
- reduce unnecessary client components on content-heavy pages

Required deliverables:

- server-backed catalog query path
- URL-driven filter persistence
- autocomplete search endpoint

Acceptance criteria:

- `/books` remains responsive with a much larger catalog
- users can share filtered URLs and get the same result set
- search does not trigger a database hit on every single keystroke
- [NEW] implement frontend autocomplete/suggestions for the header search bar

### Workstream H: Admin Experience and Content Operations

The admin area already exists, so this is a hardening pass rather than a greenfield build.

Build / upgrade:

- validate all admin forms and mutation paths
- improve image upload resilience and media validation
- add clearer order management actions
- add audit-friendly timestamps and actor visibility where needed
- make launch-readiness checks stricter and more actionable
- review whether manuscript, contact, and newsletter inbox flows need export or archive tools

Acceptance criteria:

- staff can update books, authors, posts, and orders without risky manual workarounds
- admin errors surface clearly and are logged

### Workstream I: Accessibility, UX Quality, and Customer Confidence

This work improves conversion and reduces support burden.

Build / upgrade:

- associate every input with a real `<label>`
- ensure visible keyboard focus on all actionable elements
- verify cart, checkout, forms, dialogs, and nav are keyboard usable
- improve empty states, validation messaging, and error states
- add better order history clarity for customers
- decide on theme support only if it improves the reading experience without destabilizing launch
- [NEW] Fix cart persistence across route transitions (Zustand/Sync fix)
- [NEW] Implement UI for Customer Reviews (Frontend for `/api/reviews`)
- [NEW] Address lookup/autocomplete for India shipping (Pincode API integration)
- [NEW] Stepped checkout progression (Info -> Shipping -> Payment)
- [NEW] Order Tracking UI for customers (Tracking link in account orders)
- [NEW] Replace initial-based placeholders with high-quality media/renders
- [NEW] Fix accessibility gaps (aria-labels, contrast audits)

Acceptance criteria:

- keyboard-only users can browse, add to cart, and place an order
- validation errors are clear and tied to the correct fields

### Workstream J: SEO and Discoverability

Good SEO matters for books and editorial content.

Build / upgrade:

- keep metadata generation dynamic for book and blog routes
- add JSON-LD for `Product`, `BreadcrumbList`, and `Article`
- create better Open Graph image generation for books and journal posts
- verify sitemap and robots output
- add canonical handling for filtered pages where needed
- [NEW] Implement full JSON-LD Product & Review schema for SEO rich snippets

Acceptance criteria:

- book pages expose machine-readable price and availability data
- blog pages expose valid article structured data

### Workstream K: Observability, Monitoring, and Incident Response

If something breaks in production, we need to know immediately.

Build / upgrade:

- integrate Sentry for server and client error tracking
- add uptime checks for home, books, login, checkout, and admin login
- use structured logs for checkout, payments, admin mutations, and email jobs
- add alerting for payment verification failures, repeated email failures, and database connectivity issues
- create a simple runbook for rollback, payment failure response, and order recovery

Acceptance criteria:

- critical failures generate alerts
- we can trace a customer complaint from request to order to payment event

### Workstream L: Testing and Release Safety

This is required for confidence, not optional polish.

Build / upgrade:

- add unit tests for pricing, shipping, order status transitions, and validation helpers
- add integration tests for checkout creation, payment verification, auth protection, and admin mutations
- add end-to-end tests for browsing, cart, COD checkout, Razorpay success path, login, and order history
- run CI on lint, type safety, build, and tests
- create pre-release smoke tests for staging

Minimum automated coverage before production:

- homepage loads
- books listing loads
- PDP add-to-cart works
- COD order completes
- Razorpay verification completes
- account order access is protected
- admin login and order update work

Acceptance criteria:

- a broken checkout or auth regression is caught before deployment
- staging passes smoke tests before each production release

## 5. Implementation Order

We should execute the work in this order.

### Phase 1: Production Foundation

- hosting selection
- managed Postgres
- env cleanup
- migration workflow
- backup and restore drill
- monitoring baseline

### Phase 2: Security and Abuse Protection

- shared rate limiting
- auth hardening
- admin route audit
- protected mutation review

### Phase 3: Commerce Core

- shipping logic
- order status redesign
- inventory model
- Razorpay webhook + idempotency
- invoice generation

### Phase 4: Background Jobs and Notifications

- queue selection
- email jobs
- retry and failure reporting

### Phase 5: Catalog and UX Hardening

- server-backed filter/search
- autocomplete
- accessibility fixes
- customer order dashboard improvements

### Phase 6: SEO, Performance, and Launch Validation

- JSON-LD
- OG image improvements
- load testing
- staging UAT
- final launch checklist

### Phase 7: Post-Audit Refinements (June 2026)

- Fix Cart Persistence & Hydration Lag
- Review UI implementation
- Search Autocomplete
- Address Lookup integration
- Order Tracking UI
- Mobile Z-index and layout polish
- Media & Typography refinement

## 6. Suggested Launch Milestones

### Milestone 1: Safe Infrastructure

Target outcome:

- production and staging environments exist
- database is managed and backed up
- monitoring is live

### Milestone 2: Safe Money Flow

Target outcome:

- checkout, payments, and order states are correct
- duplicate payment/order issues are blocked
- shipping totals are accurate

### Milestone 3: Safe Operations

Target outcome:

- staff can manage orders and stock safely
- emails and alerts are reliable
- incident recovery is documented

### Milestone 4: Launch Confidence

Target outcome:

- automated tests cover critical journeys
- load test passes target traffic
- final staging smoke test passes

## 7. Recommended Load and Reliability Targets

For the current business size, these are practical first targets:

- 100 to 200 concurrent browsing users without app instability
- 20 to 30 concurrent checkout users without payment/order corruption
- p95 public page response under 1.5 seconds for cached pages
- p95 checkout API response under 2 seconds before payment redirect
- zero duplicate paid orders in repeated payment callback tests

## 8. Definition of Done Before Public Launch

Do not push the live domain publicly until all items below are complete:

- managed database, backups, and restore test
- shared rate limiter in production
- secure auth/session review completed
- inventory and stock status implemented
- shipping rules implemented
- Razorpay webhook verification implemented
- order states upgraded for real fulfillment
- invoice generation available
- queue-backed transactional email flow
- error tracking and uptime alerts enabled
- critical automated tests passing
- staging smoke test passed on release candidate

## 9. Post-Launch Upgrades

These can wait until after the first stable launch:

- theme toggle / reading mode
- richer search relevance and recommendations
- advanced analytics and conversion funnels
- manuscript file upload workflow if editorial operations need it immediately
- optional CMS separation or external editorial tooling
- customer wishlist and public reviews

## 10. Working Rule for This Project

From this point onward:

- no more scattered planning files
- all production work should map back to this document
- each implementation batch should mark which workstream and phase it belongs to
- if scope changes, update this file instead of creating a new plan document
