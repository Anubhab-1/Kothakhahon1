# Kothakhahon - Production Readiness Roadmap

> Single source of truth for launch work.
> Last updated: 2026-06-16.
> Keep this file current instead of creating new planning files.

## 0. Current Status

The app builds, lints, and passes the current unit test suite. The codebase is ahead of the previous roadmap in several customer-account, catalog, admin, and email areas.

### Done

- Cart persistence and guest-to-user merge: `/api/cart`, `CartItem`, and `CartProvider` are implemented.
- Email verification: signup token creation, resend flow, verification email queueing, and login blocking for unverified accounts are implemented.
- Account profile basics: full name, phone number, and password change are implemented.
- Saved addresses: account CRUD, default address, checkout address selection, and checkout save-address option are implemented.
- Order timeline: customer order detail page shows status milestones, carrier, tracking number, and invoice link.
- Book detail fields: publisher, compare-at price, gallery images, table of contents, specifications, chapter preview, related books, and similar books are implemented.
- Catalog controls: genre, author, language, availability, price filters, sort by rating, and sort by best-selling are implemented.
- Admin operations: book metadata management, bulk CSV upload, bulk price update, review moderation, user suspension, coupons, email job queue, and order workflow updates are implemented.
- Transactional email queue: core order emails, verification, welcome, shipped, delivered, refunded, low-stock, and failed-payment email job types exist.
- Payment correctness: Razorpay client verification and webhook finalization share a centralized paid-order path.
- SEO basics: book Product/Book/Breadcrumb JSON-LD and blog Article/Breadcrumb JSON-LD exist.
- Active Middleware Security: Activated Next.js edge-level route guarding and CSP headers by renaming `proxy.ts` to `middleware.ts`.
- Wishlist Customer Workflow: Completed customer wishlist workflow, including Heart toggle buttons, `/account/wishlist` UI with move-to-cart action, and server endpoints.
- Local Search History: Added local client-side search history and trending queries UI under the search bar.
- Express Shipping Tier: Added express shipping flat fee (₹150) selection at checkout and database persistence.
- Itemized Confirmations: Success confirmation page upgraded with receipt items table and delivery estimates.
- Admin Commerce Metrics: Publishing Control Room populated with Total Revenue, Conversion Rate, low-stock alerts, and best sellers leaderboard.
- PDF Invoices: Swapped HTML invoice file downloads with compiled server-side PDF downloads.
- GST Tax Invoice Breakdown: Added CGST/SGST/IGST breakdown (books exempt @ 0%, shipping @ 18% inclusive) to checkout success screen, admin orders, order emails, and PDF invoices.
- Admin Return & Refund Actions: Quick actions inside order details to Cancel Order (triggers Restock) and Return & Refund (Payment & Inventory updates).
- Local Email Sandbox: Automatically appends email dispatches to `email-sandbox.log` in local development when Resend credentials are unset.
- Telemetry & Structured Logging: Implemented JSON logging for production, local formatted logs for dev, and automatic Sentry exception capturing.
- GitHub Actions CI Pipeline: Added `.github/workflows/ci.yml` verifying linting, type safety, test suites, and production build checks.
- Rate-Limiting Hardening: Implemented atomic Redis-backed rate limiting using Upstash REST pipeline queries, with an in-memory Map fallback for local dev.

### Needs Tests

- None. All core flows (cart merge, saved addresses, coupons, inventory commit, Razorpay webhook, reviews, and order timeline) are covered by the automated integration test suite (39 tests passing).

### Still Missing

- Production hosting, domain, managed PostgreSQL, pooling, backups, and restore drill.
- Staging environment and repeatable `prisma migrate deploy` workflow.
- Uptime checks and alerting (Sentry telemetry and structured JSON logging are configured).
- Redis/Upstash instance configured in the production environment variables (`UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`).
- Campaigns, referrals, and loyalty points (deferred post-launch).


## 1. Launch Definition

Kothakhahon is production-ready when real customers can browse, register, verify email, add books to cart, check out with COD or Razorpay, receive emails, track orders, and download invoices without developer intervention.

Required before public launch:

- Managed deployment with HTTPS, canonical domain, production secrets, and production database.
- Managed PostgreSQL with connection pooling, backups, and a tested restore path.
- Redis/Upstash rate limiting configured for login, register, checkout, coupon validation, and sensitive mutations.
- Checkout totals are server-authoritative and include subtotal, shipping, discount, coupon reference, and total.
- Payment finalization is idempotent for repeated client verification and webhook events.
- Inventory cannot oversell and committed sales update best-selling counters once.
- Email queue can be monitored, retried, and drained by admin or worker endpoint.
- Critical flows are covered by automated tests and run in CI.

## 2. Current Architecture

- Framework: Next.js 16 App Router, React 19.
- ORM / DB: Prisma 7 and PostgreSQL.
- Auth: custom session auth with secure cookies.
- Payments: Razorpay plus COD.
- Email: Resend through Postgres-backed `EmailJob` queue.
- Cart: localStorage for guest state plus server-persisted `CartItem` rows for signed-in users.
- Admin: custom dashboard under `/admin`.
- Search: basic database search with tracked `SearchQuery` rows.
- Invoices: generated HTML invoice downloads through `lib/invoices.ts`.
- Inventory: transactional stock commit/release on order lifecycle.
- Coupons: fixed and percentage discounts with usage tracking.

## 3. Immediate Implementation Queue

1. [Done] Finish commerce accounting hardening.
   - Store `discountAmount`, `couponId`, and `couponCode` on every order.
   - Show discounts consistently in checkout, admin order detail, account order detail, emails, and invoices.
   - Add tests for coupon validation, order creation totals, and invoice totals.

2. [Done] Finish counters.
   - Increment `soldCount` only on the first inventory commit.
   - Increment `viewCount` through a throttled book-view endpoint.
   - Add tests for sold-count idempotency.

3. [Done] Finish reviews.
   - Allow signed-in customers to submit one review per book.
   - Mark verified purchases automatically when the customer ordered that book.
   - Keep reviews hidden until admin approval.
   - Show approved reviews on the book detail page.

4. [Done] Harden production security.
   - Require Upstash Redis credentials in production.
   - Keep local in-memory fallback only for development.
   - Confirm CAPTCHA is present on signup, login, and contact forms.
   - Audit admin-only and customer-only route guards.

5. [Done] Add release safety.
   - Add focused integration tests for cart merge, checkout, coupons, payments, reviews, and order history.
   - Add CI steps: lint, type check/build, unit tests, integration tests.
   - Add staging smoke test checklist.

## 4. Deferred From Launch

These are valuable but not launch blockers unless the business decides otherwise:

- Typo-tolerant search provider such as Algolia or Typesense.
- Campaigns and sale events.
- Referral and loyalty system.
- GST invoice breakdown (Completed).
- Return management workflow (Completed).

## 5. Work Rules

- All implementation work maps back to this file.
- Update this file when launch scope changes.
- Discuss before implementing changes that touch payments, auth, or database schema.
- Never push to remote without explicit approval.
- Run `npm test`, `npm run lint`, and `npm run build` before release handoff.
